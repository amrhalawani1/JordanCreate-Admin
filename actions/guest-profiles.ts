"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { GuestProfileSchema } from "@/lib/validation/guest-profiles";
import type { GuestProfile, GuestProfileInsert, GuestProfileUpdate } from "@/types/entities";
import { assertGuestEditor, requireGuestEditor } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getGuestProfiles(): Promise<GuestProfile[]> {
  await assertGuestEditor();
  const supabase = createAdminClient();
  return fetchAll<GuestProfile>(supabase, "guest_profiles", { column: "guest_name" });
}

export async function createGuestProfile(values: unknown): Promise<ActionResult> {
  const gate = await requireGuestEditor();
  if (!gate.ok) return gate;
  const parsed = GuestProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const { guest_id, ...rest } = parsed.data;
    const row: GuestProfileInsert = {
      ...rest,
      guest_id: guest_id ?? crypto.randomUUID(),
    };
    const created = await insertRow<GuestProfile, GuestProfileInsert>(supabase, "guest_profiles", row);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "guest_profiles",
      recordId: created.guest_id,
      summary: `Added guest ${created.guest_name ?? created.guest_id}`,
      after: created,
    });
    revalidatePath("/guests");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateGuestProfile(guestId: string, values: unknown): Promise<ActionResult> {
  const gate = await requireGuestEditor();
  if (!gate.ok) return gate;
  const parsed = GuestProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<GuestProfile>(supabase, "guest_profiles", {
      column: "guest_id",
      value: guestId,
    });
    const { guest_id: _guestId, ...rest } = parsed.data;
    const after = await updateRow<GuestProfile, GuestProfileUpdate>(
      supabase,
      "guest_profiles",
      { column: "guest_id", value: guestId },
      rest,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "guest_profiles",
      recordId: guestId,
      summary: `Updated guest ${after.guest_name ?? guestId}`,
      before,
      after,
    });
    revalidatePath("/guests");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteGuestProfile(guestId: string): Promise<ActionResult> {
  const gate = await requireGuestEditor();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<GuestProfile>(supabase, "guest_profiles", {
      column: "guest_id",
      value: guestId,
    });
    await deleteRow(supabase, "guest_profiles", { column: "guest_id", value: guestId });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "guest_profiles",
      recordId: guestId,
      summary: `Deleted guest ${before?.guest_name ?? guestId}`,
      before,
    });
    revalidatePath("/guests");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
