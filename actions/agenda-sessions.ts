"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { AgendaSessionSchema } from "@/lib/validation/agenda-sessions";
import type {
  AgendaSession,
  AgendaSessionInsert,
  AgendaSessionUpdate,
  Speaker,
  InterestTag,
} from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAgendaSessions(): Promise<AgendaSession[]> {
  const supabase = createAdminClient();
  return fetchAll<AgendaSession>(supabase, "agenda_sessions", { column: "sort_order" });
}

export async function getAgendaFormOptions(): Promise<{ speakers: Speaker[]; tags: InterestTag[] }> {
  const supabase = createAdminClient();
  const [speakers, tags] = await Promise.all([
    fetchAll<Speaker>(supabase, "speakers", { column: "handle" }),
    fetchAll<InterestTag>(supabase, "interest_tags", { column: "tag_id" }),
  ]);
  return { speakers, tags };
}

export async function createAgendaSession(values: unknown): Promise<ActionResult> {
  const parsed = AgendaSessionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    await insertRow<AgendaSession, AgendaSessionInsert>(supabase, "agenda_sessions", parsed.data);
    revalidatePath("/agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateAgendaSession(sessionId: string, values: unknown): Promise<ActionResult> {
  const parsed = AgendaSessionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const { session_id: _sessionId, ...rest } = parsed.data;
    await updateRow<AgendaSession, AgendaSessionUpdate>(
      supabase,
      "agenda_sessions",
      { column: "session_id", value: sessionId },
      { ...rest, updated_at: new Date().toISOString() },
    );
    revalidatePath("/agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteAgendaSession(sessionId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await deleteRow(supabase, "agenda_sessions", { column: "session_id", value: sessionId });
    revalidatePath("/agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function reorderAgendaSessions(orderedIds: string[]): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await Promise.all(
      orderedIds.map((sessionId, index) =>
        updateRow<AgendaSession, AgendaSessionUpdate>(
          supabase,
          "agenda_sessions",
          { column: "session_id", value: sessionId },
          { sort_order: index },
        ),
      ),
    );
    revalidatePath("/agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
