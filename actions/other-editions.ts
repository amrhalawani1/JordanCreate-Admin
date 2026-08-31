"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, updateRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { JordanEditionSchema } from "@/lib/validation/other-editions";
import type {
  JordanCreateOne,
  JordanCreateOneUpdate,
  JordanCreateThree,
  JordanCreateThreeUpdate,
} from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getJordanCreateOne(): Promise<JordanCreateOne | null> {
  await assertStaff();
  const supabase = createAdminClient();
  const rows = await fetchAll<JordanCreateOne>(supabase, "jordan_create_one");
  return rows[0] ?? null;
}

export async function getJordanCreateThree(): Promise<JordanCreateThree | null> {
  await assertStaff();
  const supabase = createAdminClient();
  const rows = await fetchAll<JordanCreateThree>(supabase, "jordan_create_three");
  return rows[0] ?? null;
}

export async function updateJordanCreateOne(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = JordanEditionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<JordanCreateOne>(supabase, "jordan_create_one", {
      column: "id",
      value: 1,
    });
    const after = await updateRow<JordanCreateOne, JordanCreateOneUpdate>(
      supabase,
      "jordan_create_one",
      { column: "id", value: 1 },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "jordan_create_one",
      recordId: 1,
      summary: "Updated Jordan Create 1",
      before,
      after,
    });
    revalidatePath("/other-editions");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateJordanCreateThree(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = JordanEditionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<JordanCreateThree>(supabase, "jordan_create_three", {
      column: "id",
      value: 1,
    });
    const after = await updateRow<JordanCreateThree, JordanCreateThreeUpdate>(
      supabase,
      "jordan_create_three",
      { column: "id", value: 1 },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "jordan_create_three",
      recordId: 1,
      summary: "Updated Jordan Create 3",
      before,
      after,
    });
    revalidatePath("/other-editions");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
