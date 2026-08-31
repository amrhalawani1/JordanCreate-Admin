"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { EventInfoItemSchema } from "@/lib/validation/event-info-items";
import type { EventInfoItem, EventInfoItemInsert, EventInfoItemUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getEventInfoItems(): Promise<{
  rows: EventInfoItem[];
  error?: string;
  needsSetup?: boolean;
}> {
  await assertStaff();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_info_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return {
      rows: [],
      error: getReadableError(error),
      needsSetup: error.code === "PGRST205",
    };
  }

  return { rows: (data ?? []) as EventInfoItem[] };
}

export async function createEventInfoItem(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = EventInfoItemSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<EventInfoItem, EventInfoItemInsert>(
      supabase,
      "event_info_items",
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "event_info_items",
      recordId: created.id,
      summary: `Added event info "${created.title}"`,
      after: created,
    });
    revalidatePath("/event-info");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateEventInfoItem(id: number, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = EventInfoItemSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<EventInfoItem>(supabase, "event_info_items", {
      column: "id",
      value: id,
    });
    const after = await updateRow<EventInfoItem, EventInfoItemUpdate>(
      supabase,
      "event_info_items",
      { column: "id", value: id },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "event_info_items",
      recordId: id,
      summary: `Updated event info "${after.title}"`,
      before,
      after,
    });
    revalidatePath("/event-info");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteEventInfoItem(id: number): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<EventInfoItem>(supabase, "event_info_items", {
      column: "id",
      value: id,
    });
    await deleteRow(supabase, "event_info_items", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "event_info_items",
      recordId: id,
      summary: `Deleted event info "${before?.title ?? id}"`,
      before,
    });
    revalidatePath("/event-info");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function reorderEventInfoItems(orderedIds: number[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    await Promise.all(
      orderedIds.map((id, index) =>
        updateRow<EventInfoItem, EventInfoItemUpdate>(
          supabase,
          "event_info_items",
          { column: "id", value: id },
          { sort_order: index, updated_at: new Date().toISOString() },
        ),
      ),
    );
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "event_info_items",
      summary: "Reordered extra event info",
      after: { order: orderedIds },
    });
    revalidatePath("/event-info");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
