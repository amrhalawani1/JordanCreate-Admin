"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { FaqEntrySchema } from "@/lib/validation/faq-entries";
import type { FaqEntry, FaqEntryInsert, FaqEntryUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getFaqEntries(): Promise<FaqEntry[]> {
  const supabase = createAdminClient();
  return fetchAll<FaqEntry>(supabase, "faq_entries", { column: "sort_order" });
}

export async function createFaqEntry(values: unknown): Promise<ActionResult> {
  const parsed = FaqEntrySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await insertRow<FaqEntry, FaqEntryInsert>(supabase, "faq_entries", parsed.data);
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateFaqEntry(id: number, values: unknown): Promise<ActionResult> {
  const parsed = FaqEntrySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await updateRow<FaqEntry, FaqEntryUpdate>(
      supabase,
      "faq_entries",
      { column: "id", value: id },
      parsed.data,
    );
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteFaqEntry(id: number): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await deleteRow(supabase, "faq_entries", { column: "id", value: id });
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function reorderFaqEntries(orderedIds: number[]): Promise<ActionResult> {
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
    revalidatePath("/faq");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
