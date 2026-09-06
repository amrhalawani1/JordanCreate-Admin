"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { PartnerSchema } from "@/lib/validation/partners";
import type { Partner, PartnerInsert, PartnerUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getPartners(): Promise<Partner[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<Partner>(supabase, "partners", { column: "sort_order" });
}

export async function createPartner(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = PartnerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<Partner, PartnerInsert>(supabase, "partners", parsed.data);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "partners",
      recordId: created.id,
      summary: `Added partner ${created.name}`,
      after: created,
    });
    revalidatePath("/partners");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updatePartner(id: number, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = PartnerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Partner>(supabase, "partners", { column: "id", value: id });
    const after = await updateRow<Partner, PartnerUpdate>(
      supabase,
      "partners",
      { column: "id", value: id },
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "partners",
      recordId: id,
      summary: `Updated partner ${after.name}`,
      before,
      after,
    });
    revalidatePath("/partners");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deletePartner(id: number): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Partner>(supabase, "partners", { column: "id", value: id });
    await deleteRow(supabase, "partners", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "partners",
      recordId: id,
      summary: `Deleted partner ${before?.name ?? id}`,
      before,
    });
    revalidatePath("/partners");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function setPartnerArchived(id: number, archived: boolean): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Partner>(supabase, "partners", { column: "id", value: id });
    const after = await updateRow<Partner, PartnerUpdate>(
      supabase,
      "partners",
      { column: "id", value: id },
      { archived },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "partners",
      recordId: id,
      summary: archived
        ? `Archived partner ${after.name}`
        : `Restored partner ${after.name} to the app`,
      before,
      after,
    });
    revalidatePath("/partners");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function reorderPartners(orderedIds: number[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    await Promise.all(
      orderedIds.map((id, index) =>
        updateRow<Partner, PartnerUpdate>(supabase, "partners", { column: "id", value: id }, { sort_order: index }),
      ),
    );
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "partners",
      summary: "Reordered partners",
      after: { order: orderedIds },
    });
    revalidatePath("/partners");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
