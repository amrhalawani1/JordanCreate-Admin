"use server";

import { withActivity } from "@/lib/with-activity";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { FaqEntrySchema } from "@/lib/validation/faq-entries";
import type { FaqEntry, FaqEntryInsert, FaqEntryUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

async function getFaqEntriesImpl(): Promise<FaqEntry[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<FaqEntry>(supabase, "faq_entries", { column: "sort_order" });
}

async function createFaqEntryImpl(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = FaqEntrySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<FaqEntry, FaqEntryInsert>(supabase, "faq_entries", parsed.data);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "faq_entries",
      recordId: created.id,
      summary: `Added FAQ "${created.question}"`,
      after: created,
    });
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function updateFaqEntryImpl(id: number, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = FaqEntrySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<FaqEntry>(supabase, "faq_entries", { column: "id", value: id });
    const after = await updateRow<FaqEntry, FaqEntryUpdate>(
      supabase,
      "faq_entries",
      { column: "id", value: id },
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "faq_entries",
      recordId: id,
      summary: `Updated FAQ "${after.question}"`,
      before,
      after,
    });
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function deleteFaqEntryImpl(id: number): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<FaqEntry>(supabase, "faq_entries", { column: "id", value: id });
    await deleteRow(supabase, "faq_entries", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "faq_entries",
      recordId: id,
      summary: `Deleted FAQ "${before?.question ?? id}"`,
      before,
    });
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function reorderFaqEntriesImpl(orderedIds: number[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    await Promise.all(
      orderedIds.map((id, index) =>
        updateRow<FaqEntry, FaqEntryUpdate>(
          supabase,
          "faq_entries",
          { column: "id", value: id },
          { sort_order: index },
        ),
      ),
    );
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "faq_entries",
      summary: "Reordered FAQ entries",
      after: { order: orderedIds },
    });
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getFaqEntries = withActivity("faq-entries.getFaqEntries", getFaqEntriesImpl);
export const createFaqEntry = withActivity("faq-entries.createFaqEntry", createFaqEntryImpl);
export const updateFaqEntry = withActivity("faq-entries.updateFaqEntry", updateFaqEntryImpl);
export const deleteFaqEntry = withActivity("faq-entries.deleteFaqEntry", deleteFaqEntryImpl);
export const reorderFaqEntries = withActivity("faq-entries.reorderFaqEntries", reorderFaqEntriesImpl);
