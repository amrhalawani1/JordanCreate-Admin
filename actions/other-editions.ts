"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, updateRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { JordanEditionSchema } from "@/lib/validation/other-editions";
import type {
  JordanCreateOne,
  JordanCreateOneUpdate,
  JordanCreateThree,
  JordanCreateThreeUpdate,
} from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getJordanCreateOne(): Promise<JordanCreateOne | null> {
  const supabase = createAdminClient();
  const rows = await fetchAll<JordanCreateOne>(supabase, "jordan_create_one");
  return rows[0] ?? null;
}

export async function getJordanCreateThree(): Promise<JordanCreateThree | null> {
  const supabase = createAdminClient();
  const rows = await fetchAll<JordanCreateThree>(supabase, "jordan_create_three");
  return rows[0] ?? null;
}

export async function updateJordanCreateOne(values: unknown): Promise<ActionResult> {
  const parsed = JordanEditionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await updateRow<JordanCreateOne, JordanCreateOneUpdate>(
      supabase,
      "jordan_create_one",
      { column: "id", value: 1 },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    revalidatePath("/other-editions");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateJordanCreateThree(values: unknown): Promise<ActionResult> {
  const parsed = JordanEditionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await updateRow<JordanCreateThree, JordanCreateThreeUpdate>(
      supabase,
      "jordan_create_three",
      { column: "id", value: 1 },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    revalidatePath("/other-editions");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
