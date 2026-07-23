"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { ExperienceSchema } from "@/lib/validation/experience";
import type { Experience, ExperienceInsert, ExperienceUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getExperiences(): Promise<Experience[]> {
  const supabase = createAdminClient();
  return fetchAll<Experience>(supabase, "experience", { column: "sort_order" });
}

export async function createExperience(values: unknown): Promise<ActionResult> {
  const parsed = ExperienceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await insertRow<Experience, ExperienceInsert>(supabase, "experience", parsed.data);
    revalidatePath("/experience");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateExperience(id: number, values: unknown): Promise<ActionResult> {
  const parsed = ExperienceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await updateRow<Experience, ExperienceUpdate>(
      supabase,
      "experience",
      { column: "id", value: id },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    revalidatePath("/experience");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteExperience(id: number): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await deleteRow(supabase, "experience", { column: "id", value: id });
    revalidatePath("/experience");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
