"use server";

import { withActivity } from "@/lib/with-activity";

import { revalidateWebsite } from "@/lib/website-revalidate";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { AgendaSessionSchema } from "@/lib/validation/agenda-sessions";
import type {
  AgendaSession,
  AgendaSessionInsert,
  AgendaSessionUpdate,
  Speaker,
  SpeakerSocialLink,
  InterestTag,
} from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

async function getAgendaSessionsImpl(): Promise<AgendaSession[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<AgendaSession>(supabase, "agenda_sessions", { column: "sort_order" });
}

async function getAgendaFormOptionsImpl(): Promise<{
  speakers: Speaker[];
  tags: InterestTag[];
  socialLinks: SpeakerSocialLink[];
}> {
  await assertStaff();
  const supabase = createAdminClient();
  const [speakers, tags, socialLinks] = await Promise.all([
    fetchAll<Speaker>(supabase, "speakers", { column: "handle" }),
    fetchAll<InterestTag>(supabase, "interest_tags", { column: "tag_id" }),
    fetchAll<SpeakerSocialLink>(supabase, "speaker_social_links", { column: "sort_order" }),
  ]);
  return { speakers, tags, socialLinks };
}

async function createAgendaSessionImpl(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = AgendaSessionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<AgendaSession, AgendaSessionInsert>(
      supabase,
      "agenda_sessions",
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "agenda_sessions",
      recordId: created.session_id,
      summary: `Added session ${created.session_id}`,
      after: created,
    });
    revalidatePath("/agenda");
    revalidateWebsite("agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function updateAgendaSessionImpl(sessionId: string, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = AgendaSessionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<AgendaSession>(supabase, "agenda_sessions", {
      column: "session_id",
      value: sessionId,
    });
    const { session_id: _sessionId, ...rest } = parsed.data;
    const after = await updateRow<AgendaSession, AgendaSessionUpdate>(
      supabase,
      "agenda_sessions",
      { column: "session_id", value: sessionId },
      { ...rest, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "agenda_sessions",
      recordId: sessionId,
      summary: `Updated session ${sessionId}`,
      before,
      after,
    });
    revalidatePath("/agenda");
    revalidateWebsite("agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function deleteAgendaSessionImpl(sessionId: string): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<AgendaSession>(supabase, "agenda_sessions", {
      column: "session_id",
      value: sessionId,
    });
    await deleteRow(supabase, "agenda_sessions", { column: "session_id", value: sessionId });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "agenda_sessions",
      recordId: sessionId,
      summary: `Deleted session ${sessionId}`,
      before,
    });
    revalidatePath("/agenda");
    revalidateWebsite("agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function setAgendaSessionArchivedImpl(
  sessionId: string,
  archived: boolean,
): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<AgendaSession>(supabase, "agenda_sessions", {
      column: "session_id",
      value: sessionId,
    });
    const after = await updateRow<AgendaSession, AgendaSessionUpdate>(
      supabase,
      "agenda_sessions",
      { column: "session_id", value: sessionId },
      { archived, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "agenda_sessions",
      recordId: sessionId,
      summary: archived
        ? `Archived session ${sessionId}`
        : `Restored session ${sessionId} to the app`,
      before,
      after,
    });
    revalidatePath("/agenda");
    revalidateWebsite("agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function reorderAgendaSessionsImpl(orderedIds: string[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
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
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "agenda_sessions",
      summary: "Reordered agenda sessions",
      after: { order: orderedIds },
    });
    revalidatePath("/agenda");
    revalidateWebsite("agenda");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getAgendaSessions = withActivity("agenda-sessions.getAgendaSessions", getAgendaSessionsImpl);
export const getAgendaFormOptions = withActivity("agenda-sessions.getAgendaFormOptions", getAgendaFormOptionsImpl);
export const createAgendaSession = withActivity("agenda-sessions.createAgendaSession", createAgendaSessionImpl);
export const updateAgendaSession = withActivity("agenda-sessions.updateAgendaSession", updateAgendaSessionImpl);
export const deleteAgendaSession = withActivity("agenda-sessions.deleteAgendaSession", deleteAgendaSessionImpl);
export const setAgendaSessionArchived = withActivity("agenda-sessions.setAgendaSessionArchived", setAgendaSessionArchivedImpl);
export const reorderAgendaSessions = withActivity("agenda-sessions.reorderAgendaSessions", reorderAgendaSessionsImpl);
