"use server";

import { withActivity } from "@/lib/with-activity";

import { createAdminClient } from "@/lib/supabase/admin";
import { getReadableError } from "@/lib/errors";
import { requireSuperAdmin } from "@/lib/auth/guard";
import type { ChangeLog } from "@/types/entities";

async function getChangeLogsImpl(): Promise<{
  rows: ChangeLog[];
  error?: string;
  needsSetup?: boolean;
}> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return { rows: [], error: gate.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("change_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return {
      rows: [],
      error: getReadableError(error),
      needsSetup: error.code === "PGRST205",
    };
  }

  return { rows: (data ?? []) as ChangeLog[] };
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getChangeLogs = withActivity("change-logs.getChangeLogs", getChangeLogsImpl);
