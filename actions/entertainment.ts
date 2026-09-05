"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { EntertainmentSchema } from "@/lib/validation/entertainment";
import type { Entertainment, EntertainmentInsert, EntertainmentUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getEntertainment(): Promise<Entertainment[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<Entertainment>(supabase, "entertainment", { column: "sort_order" });
}

export async function createEntertainment(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = EntertainmentSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<Entertainment, EntertainmentInsert>(
      supabase,
      "entertainment",
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "entertainment",
      recordId: created.id,
      summary: `Added entertainment act ${created.title}`,
      after: created,
    });
    revalidatePath("/entertainment");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateEntertainment(id: number, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = EntertainmentSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Entertainment>(supabase, "entertainment", { column: "id", value: id });
    const after = await updateRow<Entertainment, EntertainmentUpdate>(
      supabase,
      "entertainment",
      { column: "id", value: id },
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "entertainment",
      recordId: id,
      summary: `Updated entertainment act ${after.title}`,
      before,
      after,
    });
    revalidatePath("/entertainment");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteEntertainment(id: number): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Entertainment>(supabase, "entertainment", { column: "id", value: id });
    await deleteRow(supabase, "entertainment", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "entertainment",
      recordId: id,
      summary: `Deleted entertainment act ${before?.title ?? id}`,
      before,
    });
    revalidatePath("/entertainment");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function reorderEntertainment(orderedIds: number[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    await Promise.all(
      orderedIds.map((id, index) =>
        updateRow<Entertainment, EntertainmentUpdate>(
          supabase,
          "entertainment",
          { column: "id", value: id },
          { sort_order: index },
        ),
      ),
    );
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "entertainment",
      summary: "Reordered entertainment acts",
      after: { order: orderedIds },
    });
    revalidatePath("/entertainment");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
