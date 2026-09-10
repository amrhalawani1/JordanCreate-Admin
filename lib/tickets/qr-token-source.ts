/**
 * Token source for ticket approval.
 *
 * v1: an explicit override from the single-ticket form, otherwise a fresh UUID.
 * Bulk approve never asks for tokens — it always goes through this helper.
 * Swap the body later for Tzkrti retrieval without touching the queue UI.
 */
export async function resolveQrToken(
  ticket: { id: string; ticket_ref: string | null },
  override?: string | null,
): Promise<string> {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  void ticket;
  return crypto.randomUUID();
}
