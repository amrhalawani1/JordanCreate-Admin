/**
 * The one shape every Tzkrti message is turned into before it touches the
 * database. Only lib/tzkrti/mapper.ts knows Tzkrti's own field names; the
 * rest of the pipeline (rules, writes, logging) works on this.
 */
export type TzkrtiTicketEvent = {
  /** issue: the ticket was approved in Tzkrti's dashboard. void: refunded or cancelled. */
  action: "issue" | "void";
  /** Tzkrti's unique id for this single ticket (not the order). Stored as tickets.ticket_ref. */
  ticketRef: string;
  orderRef?: string | null;
  ticketType?: string | null;
  /** The attendee. Their email is how the app finds the ticket. */
  holder: { name: string; email: string; phone?: string | null };
  /** Who paid, when different from the attendee (group orders). */
  buyer?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  /** The code in the guest's Tzkrti email, when Tzkrti sends it. The app pass shows this same code. */
  qrCode?: string | null;
  /** When Tzkrti made the change. Older messages never overwrite newer ones. */
  occurredAt?: string | null;
};

export type MapResult =
  | { kind: "tickets"; eventType: string; tickets: TzkrtiTicketEvent[] }
  | { kind: "ignored"; eventType: string; reason: string }
  | { kind: "unmapped"; reason: string };

/** Status of one stored delivery in public.tzkrti_webhook_events. */
export const DELIVERY_STATUSES = ["received", "processed", "unmapped", "ignored", "rejected", "failed"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
