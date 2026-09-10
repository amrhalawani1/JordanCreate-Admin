"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReadableError } from "@/lib/errors";
import {
  assertTicketReader,
  requireTicketAdmin,
  requireTicketEditor,
} from "@/lib/auth/guard";
import type { CurrentAdmin } from "@/lib/auth/current-admin";
import { ticketActionDenied } from "@/lib/tickets/permissions";
import { resolveQrToken } from "@/lib/tickets/qr-token-source";
import { ManualTicketSchema, TicketRejectSchema, TicketUpdateSchema } from "@/lib/validation/tickets";
import { logChange } from "@/lib/audit";
import type { TicketInsert, TicketQueueRow, TicketUpdate } from "@/types/entities";
import type { Json } from "@/types/database";
import {
  TICKETS_QUEUE_SELECT,
  TICKETS_TABLE_SELECT,
  isMissingRelation,
  isMissingRpc,
  omitUnknownColumn,
  selectOmittingUnknownColumns,
  toQueueRow,
} from "@/lib/tickets/query";

type ActionResult = { success: true } | { success: false; error: string };

export type TicketFailure = { id: string; error: string };

export type ApproveTicketsResult =
  | { success: true; succeeded: string[]; failed: TicketFailure[] }
  | { success: false; error: string };

function parseApprovePayload(data: unknown): { succeeded: string[]; failed: TicketFailure[] } {
  const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const succeeded = Array.isArray(payload.succeeded)
    ? payload.succeeded.filter((id): id is string => typeof id === "string")
    : [];
  const failed: TicketFailure[] = [];
  if (Array.isArray(payload.failed)) {
    for (const item of payload.failed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string") continue;
      failed.push({
        id: row.id,
        error: typeof row.error === "string" ? row.error : "Could not approve this ticket.",
      });
    }
  }
  return { succeeded, failed };
}

async function fetchQueueRow(id: string): Promise<TicketQueueRow | null> {
  const supabase = createAdminClient();
  const queued = await selectOmittingUnknownColumns<Record<string, unknown>>(TICKETS_QUEUE_SELECT, (select) =>
    supabase.from("tickets_queue").select(select).eq("id", id).maybeSingle(),
  );
  if (!queued.error) return queued.data ? toQueueRow(queued.data) : null;

  const table = await selectOmittingUnknownColumns<Record<string, unknown>>(TICKETS_TABLE_SELECT, (select) =>
    supabase.from("tickets").select(select).eq("id", id).maybeSingle(),
  );
  if (table.error) throw table.error;
  return table.data ? toQueueRow(table.data) : null;
}

async function loadTicketRefs(ids: string[]): Promise<Map<string, string | null>> {
  const supabase = createAdminClient();
  const queued = await supabase.from("tickets_queue").select("id, ticket_ref").in("id", ids);
  if (!queued.error) {
    return new Map((queued.data ?? []).map((row) => [row.id, row.ticket_ref]));
  }
  const table = await supabase.from("tickets").select("id, ticket_ref").in("id", ids);
  if (table.error) throw table.error;
  return new Map((table.data ?? []).map((row) => [row.id, row.ticket_ref]));
}

async function mutateOmittingUnknown<T>(
  payload: Record<string, unknown>,
  run: (
    row: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>,
): Promise<T | null> {
  let current = payload;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await run(current);
    if (!result.error) return (result.data as T | null) ?? null;
    const next = omitUnknownColumn(current, result.error);
    if (!next) throw result.error;
    current = next;
  }
  throw new Error("The ticket could not be saved.");
}

function revalidateTicketPaths() {
  revalidatePath("/tickets-management");
  revalidatePath("/change-log");
  revalidatePath("/");
}

async function approveTicketsFallback(
  admin: CurrentAdmin,
  ids: string[],
  overrides: Record<string, string>,
): Promise<{ succeeded: string[]; failed: TicketFailure[] }> {
  const supabase = createAdminClient();
  const succeeded: string[] = [];
  const failed: TicketFailure[] = [];

  for (const id of ids) {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .update({
          qr_token: overrides[id],
          approved_at: new Date().toISOString(),
          approved_by: admin.id,
        })
        .eq("id", id)
        .eq("status", "active")
        .is("rejected_at", null)
        .or("qr_token.is.null,qr_token.eq.")
        .select("id, ticket_ref")
        .maybeSingle();
      if (error) {
        failed.push({ id, error: getReadableError(error) });
        continue;
      }
      if (!data) {
        failed.push({ id, error: "Already approved, rejected, or not found." });
        continue;
      }
      await logChange({
        actor: admin,
        action: "update",
        table: "tickets",
        recordId: id,
        summary: `Approved ticket ${data.ticket_ref ?? id}`,
        after: { approved: true },
      });
      succeeded.push(id);
    } catch (err) {
      failed.push({ id, error: getReadableError(err) });
    }
  }

  return { succeeded, failed };
}

async function runVoidOrDeleteRpc(
  fn: "void_ticket" | "delete_ticket" | "restore_ticket" | "reject_ticket",
  args: Record<string, unknown>,
  fallback: () => Promise<void>,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc(fn, args as never);
  if (!error) return;
  if (isMissingRpc(error)) {
    await fallback();
    return;
  }
  throw error;
}

export async function getTickets(): Promise<{
  rows: TicketQueueRow[];
  error?: string;
  needsSetup?: boolean;
  needsFunctions?: boolean;
}> {
  try {
    await assertTicketReader();
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : "You don't have permission to do that." };
  }

  const supabase = createAdminClient();
  const queued = await selectOmittingUnknownColumns<Record<string, unknown>[]>(TICKETS_QUEUE_SELECT, (select) =>
    supabase.from("tickets_queue").select(select).order("created_at", { ascending: true }),
  );

  if (!queued.error) {
    return { rows: (queued.data ?? []).map((row) => toQueueRow(row)) };
  }

  const table = await selectOmittingUnknownColumns<Record<string, unknown>[]>(TICKETS_TABLE_SELECT, (select) =>
    supabase.from("tickets").select(select).order("created_at", { ascending: true }),
  );

  if (table.error) {
    return {
      rows: [],
      error: getReadableError(table.error),
      needsSetup: isMissingRelation(table.error),
    };
  }

  return {
    rows: (table.data ?? []).map((row) => toQueueRow(row)),
    needsFunctions: true,
  };
}

export async function approveTickets(
  ids: string[],
  tokenOverrides?: Record<string, string>,
): Promise<ApproveTicketsResult> {
  const gate = await requireTicketEditor();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "approve");
  if (denied) return { success: false, error: denied };
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, error: "Select at least one ticket." };
  }

  try {
    const supabase = createAdminClient();
    const refs = await loadTicketRefs(uniqueIds);
    const overrides: Record<string, string> = {};
    for (const id of uniqueIds) {
      overrides[id] = await resolveQrToken(
        { id, ticket_ref: refs.get(id) ?? null },
        tokenOverrides?.[id],
      );
    }

    const { data, error } = await supabase.rpc("approve_tickets", {
      p_actor_id: gate.admin.id,
      p_ids: uniqueIds,
      p_token_overrides: overrides as unknown as Json,
    });

    const parsed = error
      ? isMissingRpc(error)
        ? await approveTicketsFallback(gate.admin, uniqueIds, overrides)
        : (() => {
            throw error;
          })()
      : parseApprovePayload(data);

    revalidateTicketPaths();
    return { success: true, ...parsed };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function rejectTicket(id: string, note: string): Promise<ActionResult> {
  const gate = await requireTicketEditor();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "reject");
  if (denied) return { success: false, error: denied };
  const parsed = TicketRejectSchema.safeParse({ note });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "A rejection note is required." };
  }

  try {
    await runVoidOrDeleteRpc(
      "reject_ticket",
      { p_actor_id: gate.admin.id, p_id: id, p_note: parsed.data.note },
      async () => {
        const supabase = createAdminClient();
        const before = await fetchQueueRow(id);
        const { data, error } = await supabase
          .from("tickets")
          .update({
            rejected_at: new Date().toISOString(),
            rejected_by: gate.admin.id,
            rejection_note: parsed.data.note,
          })
          .eq("id", id)
          .eq("status", "active")
          .is("rejected_at", null)
          .is("approved_at", null)
          .select("id, ticket_ref")
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Only awaiting tickets can be rejected.");
        await logChange({
          actor: gate.admin,
          action: "update",
          table: "tickets",
          recordId: id,
          summary: `Rejected ticket ${data.ticket_ref ?? id}`,
          before,
          after: { rejected: true, rejection_note: parsed.data.note },
        });
      },
    );
    revalidateTicketPaths();
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function restoreTicket(id: string): Promise<ActionResult> {
  const gate = await requireTicketEditor();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "restore");
  if (denied) return { success: false, error: denied };

  try {
    await runVoidOrDeleteRpc("restore_ticket", { p_actor_id: gate.admin.id, p_id: id }, async () => {
      const supabase = createAdminClient();
      const before = await fetchQueueRow(id);
      const { data, error } = await supabase
        .from("tickets")
        .update({ rejected_at: null, rejected_by: null, rejection_note: null })
        .eq("id", id)
        .not("rejected_at", "is", null)
        .select("id, ticket_ref")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("This ticket is not rejected.");
      await logChange({
        actor: gate.admin,
        action: "update",
        table: "tickets",
        recordId: id,
        summary: `Returned ticket ${data.ticket_ref ?? id} to the queue`,
        before,
        after: { rejected: false },
      });
    });
    revalidateTicketPaths();
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function voidTicket(id: string): Promise<ActionResult> {
  const gate = await requireTicketAdmin();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "void");
  if (denied) return { success: false, error: denied };

  try {
    await runVoidOrDeleteRpc("void_ticket", { p_actor_id: gate.admin.id, p_id: id }, async () => {
      const supabase = createAdminClient();
      const before = await fetchQueueRow(id);
      const { data, error } = await supabase
        .from("tickets")
        .update({ status: "void" })
        .eq("id", id)
        .neq("status", "void")
        .select("id, ticket_ref")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Access is already revoked.");
      await logChange({
        actor: gate.admin,
        action: "update",
        table: "tickets",
        recordId: id,
        summary: `Revoked access for ticket ${data.ticket_ref ?? id}`,
        before,
        after: { status: "void" },
      });
    });
    revalidateTicketPaths();
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteTicket(id: string): Promise<ActionResult> {
  const gate = await requireTicketAdmin();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "delete");
  if (denied) return { success: false, error: denied };

  try {
    await runVoidOrDeleteRpc("delete_ticket", { p_actor_id: gate.admin.id, p_id: id }, async () => {
      const supabase = createAdminClient();
      const before = await fetchQueueRow(id);
      const { error } = await supabase.from("tickets").delete().eq("id", id);
      if (error) throw error;
      await logChange({
        actor: gate.admin,
        action: "delete",
        table: "tickets",
        recordId: id,
        summary: `Deleted ticket ${before?.ticket_ref ?? id}`,
        before,
      });
    });
    revalidateTicketPaths();
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function createManualTicket(values: unknown): Promise<ActionResult> {
  const gate = await requireTicketEditor();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "create");
  if (denied) return { success: false, error: denied };
  const parsed = ManualTicketSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const { gate_token, ...rest } = parsed.data;
    const row: TicketInsert = {
      ...rest,
      source: "manual",
      status: "active",
      match_status: "pending",
    };
    const data = await mutateOmittingUnknown<{ id: string; ticket_ref: string | null }>(
      { ...row },
      (payload) => supabase.from("tickets").insert(payload as TicketInsert).select("id, ticket_ref").single(),
    );
    if (!data) throw new Error("The ticket could not be saved.");

    const created = await fetchQueueRow(data.id);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "tickets",
      recordId: data.id,
      summary: `Added manual ticket ${data.ticket_ref ?? data.id}`,
      after: created,
    });

    if (gate_token) {
      const approved = await approveTickets([data.id], { [data.id]: gate_token });
      if (!approved.success) {
        revalidatePath("/tickets-management");
        return {
          success: false,
          error: `Ticket saved, but approval failed: ${approved.error}`,
        };
      }
      if (approved.failed.length > 0) {
        revalidatePath("/tickets-management");
        return {
          success: false,
          error: `Ticket saved, but approval failed: ${approved.failed[0].error}`,
        };
      }
    }

    revalidateTicketPaths();
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateTicket(id: string, values: unknown): Promise<ActionResult> {
  const gate = await requireTicketEditor();
  if (!gate.ok) return gate;
  const denied = ticketActionDenied(gate.admin.admin_level, "update");
  if (denied) return { success: false, error: denied };
  const parsed = TicketUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const before = await fetchQueueRow(id);
    const supabase = createAdminClient();
    const patch: TicketUpdate = parsed.data;
    await mutateOmittingUnknown({ ...patch }, (payload) =>
      supabase.from("tickets").update(payload as TicketUpdate).eq("id", id).select("id").maybeSingle(),
    );
    const after = await fetchQueueRow(id);
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "tickets",
      recordId: id,
      summary: `Updated ticket ${after?.ticket_ref ?? before?.ticket_ref ?? id}`,
      before,
      after,
    });
    revalidatePath("/tickets-management");
    revalidatePath("/change-log");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
