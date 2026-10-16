"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getReadableError } from "@/lib/errors";
import { requireSuperAdmin } from "@/lib/auth/guard";
import type { ActivityLog } from "@/types/entities";

export type ActivityLogPage = {
  rows: ActivityLog[];
  error?: string;
  needsSetup?: boolean;
};

/** The latest 1,000 activity rows. Reading the log is itself not logged, to keep it readable. */
export async function getActivityLogs(): Promise<ActivityLogPage> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return { rows: [], error: gate.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("at", { ascending: false })
    .limit(1000);

  if (error) {
    return { rows: [], error: getReadableError(error), needsSetup: error.code === "PGRST205" };
  }
  return { rows: (data ?? []) as ActivityLog[] };
}
