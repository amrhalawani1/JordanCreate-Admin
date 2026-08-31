"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { ExperienceSchema } from "@/lib/validation/experience";
import type { Experience, ExperienceInsert, ExperienceUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getExperiences(): Promise<Experience[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<Experience>(supabase, "experience", { column: "sort_order" });
}

export async function createExperience(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = ExperienceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<Experience, ExperienceInsert>(
      supabase,
      "experience",
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "experience",
      recordId: created.id,
      summary: `Added experience "${created.title}"`,
      after: created,
    });
    revalidatePath("/experience");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateExperience(id: number, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = ExperienceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Experience>(supabase, "experience", { column: "id", value: id });
    const after = await updateRow<Experience, ExperienceUpdate>(
      supabase,
      "experience",
      { column: "id", value: id },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "experience",
      recordId: id,
      summary: `Updated experience "${after.title}"`,
      before,
      after,
    });
    revalidatePath("/experience");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteExperience(id: number): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Experience>(supabase, "experience", { column: "id", value: id });
    await deleteRow(supabase, "experience", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "experience",
      recordId: id,
      summary: `Deleted experience "${before?.title ?? id}"`,
      before,
    });
    revalidatePath("/experience");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
