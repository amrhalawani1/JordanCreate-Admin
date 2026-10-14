import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemChange } from "@/lib/audit";
import type { Json } from "@/types/database";
import { mapTzkrtiPayload } from "./mapper";
import { planTicketWrite, type ExistingTicket, type TicketWrite } from "./plan";
import type { DeliveryStatus, TzkrtiTicketEvent } from "./types";

type Supabase = ReturnType<typeof createAdminClient>;

const ACTOR = { actorName: "Tzkrti", actorEmail: "webhook@tzkrti" };
const EXISTING_COLUMNS = "id, source, status, qr_token, approved_at, external_updated_at";

export type TicketOutcome = {
  ticketRef: string;
  outcome: "inserted" | "updated" | "voided" | "skipped" | "conflict" | "error";
  note?: string;
};

export type DeliveryResult = {
  status: DeliveryStatus;
  eventType: string | null;
  outcomes: TicketOutcome[];
  error: string | null;
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** The guest profile with this email, if the attendee already uses the app. */
async function guestIdForEmail(supabase: Supabase, email: string): Promise<string | null> {
  const { data } = await supabase
    .from("guest_profiles")
    .select("guest_id")
    .ilike("email", escapeLike(email))
    .limit(1)
    .maybeSingle();
  return (data as { guest_id?: string } | null)?.guest_id ?? null;
}

async function loadExisting(supabase: Supabase, ticketRef: string): Promise<ExistingTicket | null> {
  const { data, error } = await supabase.from("tickets").select(EXISTING_COLUMNS).eq("ticket_ref", ticketRef).maybeSingle();
  if (error) throw error;
  return (data as ExistingTicket | null) ?? null;
}

async function applyTicket(supabase: Supabase, event: TzkrtiTicketEvent, now: string, retried = false): Promise<TicketOutcome> {
  const ticketRef = event.ticketRef?.trim() ?? "";
  const existing = await loadExisting(supabase, ticketRef);
  // Without a Tzkrti code, the app pass gets a generated one (kept stable on updates).
  const plan = planTicketWrite(existing, event, { now, newToken: () => crypto.randomUUID() });

  if (plan.kind === "skip") return { ticketRef, outcome: "skipped", note: plan.reason };
  if (plan.kind === "conflict") return { ticketRef, outcome: "conflict", note: plan.reason };

  const row: Partial<TicketWrite> & { guest_id?: string | null; match_status?: string } = { ...plan.row };
  if (row.email) {
    const guestId = await guestIdForEmail(supabase, row.email);
    row.guest_id = guestId;
    row.match_status = guestId ? "matched" : "unmatched";
  }

  if (plan.kind === "insert") {
    const { data, error } = await supabase.from("tickets").insert(row as never).select("id").single();
    if (error) {
      // Another delivery created it first: apply as an update instead.
      if (error.code === "23505" && !retried) return applyTicket(supabase, event, now, true);
      throw error;
    }
    await logSystemChange({
      ...ACTOR,
      action: "create",
      table: "tickets",
      recordId: (data as { id: string }).id,
      summary: `Tzkrti approved ticket ${ticketRef} for ${[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}`,
      after: row,
    });
    return { ticketRef, outcome: "inserted" };
  }

  const { error } = await supabase.from("tickets").update(row as never).eq("id", plan.id);
  if (error) throw error;
  const voided = row.status === "void";
  await logSystemChange({
    ...ACTOR,
    action: "update",
    table: "tickets",
    recordId: plan.id,
    summary: voided ? `Tzkrti cancelled ticket ${ticketRef}` : `Tzkrti updated ticket ${ticketRef}`,
    before: existing,
    after: { ...existing, ...row },
  });
  return { ticketRef, outcome: voided ? "voided" : "updated" };
}

/** Maps one stored delivery and applies its tickets. Never throws; the result says what happened. */
export async function processPayload(supabase: Supabase, payload: unknown): Promise<DeliveryResult> {
  let mapped;
  try {
    mapped = mapTzkrtiPayload(payload);
  } catch (err) {
    return { status: "failed", eventType: null, outcomes: [], error: `Could not read the message: ${String(err)}` };
  }
  if (mapped.kind === "unmapped") return { status: "unmapped", eventType: null, outcomes: [], error: mapped.reason };
  if (mapped.kind === "ignored") return { status: "ignored", eventType: mapped.eventType, outcomes: [], error: mapped.reason };

  const now = new Date().toISOString();
  const outcomes: TicketOutcome[] = [];
  for (const ticket of mapped.tickets) {
    try {
      outcomes.push(await applyTicket(supabase, ticket, now));
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
      outcomes.push({ ticketRef: ticket.ticketRef, outcome: "error", note: message });
    }
  }
  const failed = outcomes.filter((o) => o.outcome === "error");
  const notes = outcomes.filter((o) => o.note).map((o) => `${o.ticketRef}: ${o.note}`);
  return {
    status: failed.length > 0 ? "failed" : "processed",
    eventType: mapped.eventType,
    outcomes,
    error: notes.length > 0 ? notes.join(" · ").slice(0, 2000) : null,
  };
}

/** Re-runs one stored delivery and records the result on it. */
export async function processStoredDelivery(supabase: Supabase, id: string): Promise<DeliveryResult> {
  const { data, error } = await supabase.from("tzkrti_webhook_events").select("payload, attempts").eq("id", id).single();
  if (error) throw error;
  const stored = data as { payload: Json | null; attempts: number };
  const result = await processPayload(supabase, stored.payload);
  await supabase
    .from("tzkrti_webhook_events")
    .update({
      status: result.status,
      event_type: result.eventType,
      error: result.error,
      ticket_refs: result.outcomes.map((o) => o.ticketRef),
      processed_at: new Date().toISOString(),
      attempts: stored.attempts + 1,
    })
    .eq("id", id);
  return result;
}
