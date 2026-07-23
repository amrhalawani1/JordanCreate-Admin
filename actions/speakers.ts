"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { SpeakerSchema } from "@/lib/validation/speakers";
import type { Speaker, SpeakerInsert, SpeakerUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getSpeakers(): Promise<Speaker[]> {
  const supabase = createAdminClient();
  return fetchAll<Speaker>(supabase, "speakers", { column: "handle" });
}

export async function createSpeaker(values: unknown): Promise<ActionResult> {
  const parsed = SpeakerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await insertRow<Speaker, SpeakerInsert>(supabase, "speakers", parsed.data);
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateSpeaker(handle: string, values: unknown): Promise<ActionResult> {
  const parsed = SpeakerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const { handle: _handle, ...rest } = parsed.data;
    await updateRow<Speaker, SpeakerUpdate>(
      supabase,
      "speakers",
      { column: "handle", value: handle },
      { ...rest, updated_at: new Date().toISOString() },
    );
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteSpeaker(handle: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await deleteRow(supabase, "speakers", { column: "handle", value: handle });
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
