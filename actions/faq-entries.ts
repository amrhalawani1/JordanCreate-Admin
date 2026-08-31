"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { FaqEntrySchema } from "@/lib/validation/faq-entries";
import type { FaqEntry, FaqEntryInsert, FaqEntryUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getFaqEntries(): Promise<FaqEntry[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<FaqEntry>(supabase, "faq_entries", { column: "sort_order" });
}

export async function createFaqEntry(values: unknown): Promise<ActionResult> {
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

export async function updateFaqEntry(id: number, values: unknown): Promise<ActionResult> {
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

export async function deleteFaqEntry(id: number): Promise<ActionResult> {
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

export async function reorderFaqEntries(orderedIds: number[]): Promise<ActionResult> {
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
