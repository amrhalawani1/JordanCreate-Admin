"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { InterestTagSchema } from "@/lib/validation/interest-tags";
import type { InterestTag, InterestTagInsert, InterestTagUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getInterestTags(): Promise<InterestTag[]> {
  const supabase = createAdminClient();
  return fetchAll<InterestTag>(supabase, "interest_tags", { column: "tag_id" });
}

export async function createInterestTag(values: unknown): Promise<ActionResult> {
  const parsed = InterestTagSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await insertRow<InterestTag, InterestTagInsert>(supabase, "interest_tags", parsed.data);
    revalidatePath("/interest-tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateInterestTag(tagId: string, values: unknown): Promise<ActionResult> {
  const parsed = InterestTagSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const { tag_id: _tagId, ...rest } = parsed.data;
    await updateRow<InterestTag, InterestTagUpdate>(
      supabase,
      "interest_tags",
      { column: "tag_id", value: tagId },
      rest,
    );
    revalidatePath("/interest-tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteInterestTag(tagId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await deleteRow(supabase, "interest_tags", { column: "tag_id", value: tagId });
    revalidatePath("/interest-tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
