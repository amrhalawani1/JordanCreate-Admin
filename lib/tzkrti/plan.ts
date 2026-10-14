import { toE164 } from "@/lib/phone";
import type { TzkrtiTicketEvent } from "./types";

/** The columns the rules read from an existing ticket row. */
export type ExistingTicket = {
  id: string;
  source: string | null;
  status: string;
  qr_token: string | null;
  approved_at: string | null;
  external_updated_at: string | null;
};

/** Columns written for a Tzkrti ticket (match_status and guest_id are added at write time). */
export type TicketWrite = {
  ticket_ref: string;
  order_ref: string | null;
  ticket_type: string | null;
  /** holder_name is a generated column (first_name + last_name); never written. */
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  qr_token: string;
  status: "active" | "void";
  source: "webhook";
  approved_at: string;
  rejected_at: null;
  rejected_by: null;
  rejection_note: null;
  external_updated_at: string;
};

export type TicketPlan =
  | { kind: "insert"; row: TicketWrite }
  | { kind: "update"; id: string; row: Partial<TicketWrite> }
  | { kind: "skip"; reason: string }
  | { kind: "conflict"; reason: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? "";
  return EMAIL.test(email) ? email : null;
}

export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

function clean(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/**
 * Decides what one Tzkrti ticket event does to the tickets table.
 *
 * - Tickets arrive already approved in Tzkrti, so they are stored approved;
 *   they never wait in the admin's approval queue.
 * - A ticket the team added by hand (source "manual") is never overwritten.
 * - An older message never overwrites a newer one (Tzkrti may retry or reorder).
 * - A void keeps the row for the record and hides the pass from the app.
 * - The pass code is Tzkrti's code when sent; otherwise one is generated once
 *   and kept stable across updates.
 */
export function planTicketWrite(
  existing: ExistingTicket | null,
  event: TzkrtiTicketEvent,
  opts: { now: string; newToken: () => string },
): TicketPlan {
  const ticketRef = event.ticketRef?.trim();
  if (!ticketRef) return { kind: "skip", reason: "Message had no ticket id." };

  if (existing && existing.source === "manual") {
    return {
      kind: "conflict",
      reason: `Ticket ${ticketRef} was added by hand in the admin; Tzkrti's copy was not applied.`,
    };
  }

  const occurredAt = clean(event.occurredAt) ?? opts.now;
  if (existing?.external_updated_at && Date.parse(occurredAt) < Date.parse(existing.external_updated_at)) {
    return { kind: "skip", reason: `Older than the last change already applied to ${ticketRef}.` };
  }

  if (event.action === "void") {
    if (!existing) return { kind: "skip", reason: `Cancellation for unknown ticket ${ticketRef}.` };
    return { kind: "update", id: existing.id, row: { status: "void", external_updated_at: occurredAt } };
  }

  const email = normalizeEmail(event.holder?.email);
  if (!email) return { kind: "skip", reason: `Ticket ${ticketRef} has no valid attendee email, so no guest could find it.` };

  const holderName = clean(event.holder?.name) ?? email;
  const { first, last } = splitName(holderName);
  const code = clean(event.qrCode) ?? existing?.qr_token ?? opts.newToken();

  const row: TicketWrite = {
    ticket_ref: ticketRef,
    order_ref: clean(event.orderRef),
    ticket_type: clean(event.ticketType),
    first_name: first,
    last_name: last,
    email,
    phone: toE164(event.holder?.phone),
    customer_name: clean(event.buyer?.name),
    customer_email: normalizeEmail(event.buyer?.email),
    customer_phone: toE164(event.buyer?.phone),
    qr_token: code,
    status: "active",
    source: "webhook",
    approved_at: existing?.approved_at ?? opts.now,
    rejected_at: null,
    rejected_by: null,
    rejection_note: null,
    external_updated_at: occurredAt,
  };

  if (!existing) return { kind: "insert", row };
  const { ticket_ref: _ref, source: _source, ...changes } = row;
  return { kind: "update", id: existing.id, row: changes };
}
