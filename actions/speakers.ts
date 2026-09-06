"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { SpeakerSchema } from "@/lib/validation/speakers";
import type { Speaker, SpeakerInsert, SpeakerUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getSpeakers(): Promise<Speaker[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<Speaker>(supabase, "speakers", { column: "handle" });
}

export async function createSpeaker(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = SpeakerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<Speaker, SpeakerInsert>(supabase, "speakers", parsed.data);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "speakers",
      recordId: created.handle,
      summary: `Added speaker ${created.handle}`,
      after: created,
    });
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateSpeaker(handle: string, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = SpeakerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Speaker>(supabase, "speakers", { column: "handle", value: handle });
    const { handle: _handle, ...rest } = parsed.data;
    const after = await updateRow<Speaker, SpeakerUpdate>(
      supabase,
      "speakers",
      { column: "handle", value: handle },
      { ...rest, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "speakers",
      recordId: handle,
      summary: `Updated speaker ${handle}`,
      before,
      after,
    });
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteSpeaker(handle: string): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Speaker>(supabase, "speakers", { column: "handle", value: handle });
    await deleteRow(supabase, "speakers", { column: "handle", value: handle });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "speakers",
      recordId: handle,
      summary: `Deleted speaker ${handle}`,
      before,
    });
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function setSpeakerArchived(handle: string, archived: boolean): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<Speaker>(supabase, "speakers", { column: "handle", value: handle });
    const after = await updateRow<Speaker, SpeakerUpdate>(
      supabase,
      "speakers",
      { column: "handle", value: handle },
      { archived, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "speakers",
      recordId: handle,
      summary: archived ? `Archived speaker ${handle}` : `Restored speaker ${handle} to the app`,
      before,
      after,
    });
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
