import type { MapResult } from "./types";

/**
 * Turns one Tzkrti webhook body into normalized ticket events.
 *
 * THE ONLY FORMAT-SPECIFIC CODE. Until Tzkrti shares a sample message this
 * returns "unmapped": deliveries are still verified and stored in full, and
 * once this is written they can be replayed from the Tickets page without
 * asking Tzkrti to resend anything.
 *
 * When implementing, return:
 *  - { kind: "tickets", eventType, tickets }  for approvals, refunds and cancellations,
 *    one TzkrtiTicketEvent per ticket (group orders hold several), or
 *  - { kind: "ignored", eventType, reason }    for events we don't act on (e.g. test pings).
 */
export function mapTzkrtiPayload(payload: unknown): MapResult {
  void payload;
  return { kind: "unmapped", reason: "Tzkrti's message format isn't mapped yet." };
}
