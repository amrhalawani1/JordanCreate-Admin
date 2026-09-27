"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReadableError } from "@/lib/errors";
import { assertGuestEditor, requireGuestEditor } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";
import { isClosed, ReportUpdateSchema, sortReports } from "@/lib/guest-reports/reports";
import type { GuestReport, GuestReportUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export type GuestReportsResult =
  | { status: "ready"; reports: GuestReport[] }
  /** The guest_reports table has not been created yet (supabase/guest-reports.sql). */
  | { status: "missing" }
  | { status: "error"; error: string };

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message ?? "");
}

export async function getGuestReports(): Promise<GuestReportsResult> {
  await assertGuestEditor();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (isMissingTable(error)) return { status: "missing" };
  if (error) return { status: "error", error: getReadableError(error) };
  return { status: "ready", reports: sortReports((data ?? []) as GuestReport[]) };
}

export async function updateGuestReport(id: string, values: unknown): Promise<ActionResult> {
  const gate = await requireGuestEditor();
  if (!gate.ok) return gate;
  const parsed = ReportUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const { data: before, error: readError } = await supabase.from("guest_reports").select("*").eq("id", id).single();
    if (readError) throw readError;

    const closing = isClosed(parsed.data.status);
    const actor = `${gate.admin.first_name} ${gate.admin.last_name}`.trim() || gate.admin.email;
    const patch: GuestReportUpdate = {
      status: parsed.data.status,
      resolution_note: parsed.data.resolution_note || null,
      resolved_at: closing ? (before.resolved_at ?? new Date().toISOString()) : null,
      resolved_by: closing ? (before.resolved_by ?? actor) : null,
    };
    const { data: after, error } = await supabase.from("guest_reports").update(patch).eq("id", id).select("*").single();
    if (error) throw error;

    await logChange({
      actor: gate.admin,
      action: "update",
      table: "guest_reports",
      recordId: id,
      summary: `Marked the report on ${before.reported_name ?? before.reported_slug ?? "a guest"} as ${parsed.data.status}`,
      before,
      after,
    });
    revalidatePath("/guests");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
