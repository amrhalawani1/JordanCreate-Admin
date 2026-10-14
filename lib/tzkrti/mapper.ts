import type { MapResult, TzkrtiTicketEvent } from "./types";

/**
 * Turns one Tzkrti webhook body into normalized ticket events.
 *
 * THE ONLY FORMAT-SPECIFIC CODE. Tzkrti has not shared a sample message yet
 * (they asked us for a spec instead), so this reads the documented shape
 * (docs/tzkrti-webhook-spec.md) and the obvious variants of it:
 *
 *   { event, delivery_id, data: { order, tickets: [...] } }
 *   { event, tickets: [...] }        { event, ticket: {...} }
 *   { ...one ticket... }             [ ...tickets... ]
 *
 * Field names are matched case-insensitively with common aliases. Anything
 * that is not recognisably a ticket is returned as "unmapped" so it stays
 * stored and can be replayed once the mapping is adjusted.
 */

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function keyMap(rec: Rec): Map<string, string> {
  return new Map(Object.keys(rec).map((k) => [k.toLowerCase(), k]));
}

/** First non-empty string among several candidate keys (case-insensitive). */
function pick(rec: Rec, ...keys: string[]): string | null {
  const lower = keyMap(rec);
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (real === undefined) continue;
    const value = str(rec[real]);
    if (value !== null) return value;
  }
  return null;
}

function pickRecord(rec: Rec, ...keys: string[]): Rec | null {
  const lower = keyMap(rec);
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (real !== undefined && isRecord(rec[real])) return rec[real] as Rec;
  }
  return null;
}

function pickList(rec: Rec, ...keys: string[]): unknown[] | null {
  const lower = keyMap(rec);
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (real !== undefined && Array.isArray(rec[real])) return rec[real] as unknown[];
  }
  return null;
}

/** Tzkrti's ticket type label mapped onto the admin's known slugs where possible. */
export function normalizeTicketType(input: string | null): string | null {
  if (!input) return null;
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (/\bvip\b/.test(t)) return "vip";
  if (/early/.test(t)) return "early-bird";
  if (/student/.test(t)) return "student";
  if (/comp|free|guest list|invite/.test(t)) return "comp";
  if (/general|standard|regular|normal/.test(t)) return "general";
  return t.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const VOID_WORDS = /cancel|refund|void|revoke|delete|invalid|expired/;
const PING_WORDS = /^(ping|test|hello|verify|verification|handshake)$/;

function isVoid(status: string | null, eventType: string | null): boolean {
  return Boolean((status && VOID_WORDS.test(status.toLowerCase())) || (eventType && VOID_WORDS.test(eventType.toLowerCase())));
}

function toIso(input: string | null): string | null {
  if (!input) return null;
  const epoch = /^\d{10}(\d{3})?$/.test(input) ? Number(input.length === 10 ? `${input}000` : input) : NaN;
  const d = Number.isNaN(epoch) ? new Date(input) : new Date(epoch);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function holderName(holder: Rec, rec: Rec): string | null {
  const first =
    pick(holder, "first_name", "firstName", "firstname", "given_name") ?? pick(rec, "first_name", "firstName", "holder_first_name");
  const last =
    pick(holder, "last_name", "lastName", "lastname", "family_name", "surname") ?? pick(rec, "last_name", "lastName", "holder_last_name");
  if (first) return [first, last].filter(Boolean).join(" ");
  return pick(holder, "name", "full_name", "fullName", "holder_name") ?? pick(rec, "name", "holder_name", "attendee_name", "full_name");
}

/** One ticket record → event, or null when it has no ticket reference at all. */
function mapTicket(rec: Rec, order: Rec | null, eventType: string | null): TzkrtiTicketEvent | null {
  const ticketRef = pick(rec, "ticket_ref", "ticketRef", "ticket_id", "ticketId", "ticket_number", "ticketNumber", "reference", "ref", "id", "uuid", "barcode");
  if (!ticketRef) return null;

  const holder = pickRecord(rec, "holder", "attendee", "guest", "customer", "user") ?? rec;
  const orderRec = order ?? pickRecord(rec, "order");
  const buyer = orderRec ? (pickRecord(orderRec, "customer", "buyer", "user") ?? orderRec) : null;

  return {
    action: isVoid(pick(rec, "status", "state", "ticket_status"), eventType) ? "void" : "issue",
    ticketRef,
    orderRef:
      pick(rec, "order_ref", "orderRef", "order_id", "orderId", "order_number") ??
      (orderRec ? pick(orderRec, "id", "ref", "order_id", "number", "reference") : null),
    ticketType: normalizeTicketType(pick(rec, "ticket_type", "ticketType", "type", "category", "tier", "ticket_name", "name_en")),
    holder: {
      name: holderName(holder, rec) ?? "",
      email: pick(holder, "email", "holder_email", "attendee_email") ?? pick(rec, "email", "holder_email", "attendee_email") ?? "",
      phone: pick(holder, "phone", "phone_number", "mobile", "holder_phone") ?? pick(rec, "phone", "phone_number", "mobile", "holder_phone"),
    },
    buyer: buyer
      ? {
          name: pick(buyer, "name", "full_name", "customer_name"),
          email: pick(buyer, "email", "customer_email"),
          phone: pick(buyer, "phone", "phone_number", "mobile"),
        }
      : {
          name: pick(rec, "customer_name", "buyer_name"),
          email: pick(rec, "customer_email", "buyer_email"),
          phone: pick(rec, "customer_phone", "buyer_phone"),
        },
    qrCode: pick(rec, "code", "qr", "qr_code", "qrCode", "qr_token", "pass_code", "scan_code", "barcode_value", "barcode"),
    occurredAt: toIso(pick(rec, "updated_at", "updatedAt", "modified_at", "timestamp") ?? (orderRec ? pick(orderRec, "updated_at", "updatedAt") : null)),
  };
}

/** Tzkrti's own delivery id when it travels in the body rather than a header. */
export function deliveryIdFromPayload(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const data = pickRecord(payload, "data", "payload");
  return (
    pick(payload, "delivery_id", "deliveryId", "event_id", "eventId", "webhook_id", "id_event") ??
    (data ? pick(data, "delivery_id", "deliveryId", "event_id") : null)
  );
}

export function mapTzkrtiPayload(payload: unknown): MapResult {
  if (Array.isArray(payload)) return collect(payload, null, "tickets");
  if (!isRecord(payload)) return { kind: "unmapped", reason: "Message is not a JSON object." };

  const data = pickRecord(payload, "data", "payload") ?? payload;
  const eventType =
    pick(payload, "event", "event_type", "eventType", "type", "action") ?? (data !== payload ? pick(data, "event", "event_type") : null);
  const order = pickRecord(data, "order") ?? pickRecord(payload, "order");

  const list = pickList(data, "tickets", "attendees", "items", "passes");
  if (list) return collect(list, order, eventType ?? "tickets");

  const single = pickRecord(data, "ticket", "attendee", "pass");
  if (single) return collect([single], order, eventType ?? "ticket");

  if (eventType && PING_WORDS.test(eventType.trim().toLowerCase())) {
    return { kind: "ignored", eventType, reason: "Test message, nothing to apply." };
  }

  // The body itself may be one ticket.
  const one = mapTicket(data, order, eventType);
  if (one) return { kind: "tickets", eventType: eventType ?? "ticket", tickets: [one] };
  return { kind: "unmapped", reason: "No ticket found in the message (expected data.tickets[] with ticket_ref and holder)." };
}

function collect(items: unknown[], order: Rec | null, eventType: string): MapResult {
  const tickets: TzkrtiTicketEvent[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    const t = mapTicket(item, order, eventType);
    if (t) tickets.push(t);
  }
  if (tickets.length === 0) return { kind: "unmapped", reason: "The ticket list had no entries with a ticket reference." };
  return { kind: "tickets", eventType, tickets };
}
