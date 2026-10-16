"use server";

import { withActivity } from "@/lib/with-activity";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { InterestTagSchema } from "@/lib/validation/interest-tags";
import type { InterestTag, InterestTagInsert, InterestTagUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

async function getInterestTagsImpl(): Promise<InterestTag[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<InterestTag>(supabase, "interest_tags", { column: "tag_id" });
}

async function createInterestTagImpl(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = InterestTagSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<InterestTag, InterestTagInsert>(
      supabase,
      "interest_tags",
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "interest_tags",
      recordId: created.tag_id,
      summary: `Added tag ${created.tag_id}`,
      after: created,
    });
    revalidatePath("/interest-tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function updateInterestTagImpl(tagId: string, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = InterestTagSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<InterestTag>(supabase, "interest_tags", {
      column: "tag_id",
      value: tagId,
    });
    const { tag_id: _tagId, ...rest } = parsed.data;
    const after = await updateRow<InterestTag, InterestTagUpdate>(
      supabase,
      "interest_tags",
      { column: "tag_id", value: tagId },
      rest,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "interest_tags",
      recordId: tagId,
      summary: `Updated tag ${tagId}`,
      before,
      after,
    });
    revalidatePath("/interest-tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function deleteInterestTagImpl(tagId: string): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<InterestTag>(supabase, "interest_tags", {
      column: "tag_id",
      value: tagId,
    });
    await deleteRow(supabase, "interest_tags", { column: "tag_id", value: tagId });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "interest_tags",
      recordId: tagId,
      summary: `Deleted tag ${tagId}`,
      before,
    });
    revalidatePath("/interest-tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getInterestTags = withActivity("interest-tags.getInterestTags", getInterestTagsImpl);
export const createInterestTag = withActivity("interest-tags.createInterestTag", createInterestTagImpl);
export const updateInterestTag = withActivity("interest-tags.updateInterestTag", updateInterestTagImpl);
export const deleteInterestTag = withActivity("interest-tags.deleteInterestTag", deleteInterestTagImpl);
