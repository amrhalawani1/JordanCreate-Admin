"use server";

import { withActivity } from "@/lib/with-activity";

import { liveTable } from "@/lib/live-tables";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStaff } from "@/lib/auth/guard";

export type ArchiveTable = "speakers" | "agenda_sessions" | "partners";

async function archiveColumnReadyImpl(table: ArchiveTable): Promise<boolean> {
  await assertStaff();
  const supabase = createAdminClient();
  const { error } = await supabase.from(liveTable(table)).select("archived").limit(1);
  return !error;
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const archiveColumnReady = withActivity("archive.archiveColumnReady", archiveColumnReadyImpl);
