"use server";

import { withActivity } from "@/lib/with-activity";

import { revalidateWebsite } from "@/lib/website-revalidate";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { SpeakerSchema } from "@/lib/validation/speakers";
import type { Speaker, SpeakerInsert, SpeakerUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

async function getSpeakersImpl(): Promise<Speaker[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<Speaker>(supabase, "speakers", { column: "handle" });
}

async function createSpeakerImpl(values: unknown): Promise<ActionResult> {
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
    revalidateWebsite("speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function updateSpeakerImpl(handle: string, values: unknown): Promise<ActionResult> {
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
    revalidateWebsite("speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function deleteSpeakerImpl(handle: string): Promise<ActionResult> {
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
    revalidateWebsite("speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function setSpeakerArchivedImpl(handle: string, archived: boolean): Promise<ActionResult> {
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
    revalidateWebsite("speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getSpeakers = withActivity("speakers.getSpeakers", getSpeakersImpl);
export const createSpeaker = withActivity("speakers.createSpeaker", createSpeakerImpl);
export const updateSpeaker = withActivity("speakers.updateSpeaker", updateSpeakerImpl);
export const deleteSpeaker = withActivity("speakers.deleteSpeaker", deleteSpeakerImpl);
export const setSpeakerArchived = withActivity("speakers.setSpeakerArchived", setSpeakerArchivedImpl);
