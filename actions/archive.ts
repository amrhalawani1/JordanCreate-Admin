"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertStaff } from "@/lib/auth/guard";

const ARCHIVE_TABLES = ["speakers", "agenda_sessions", "partners"] as const;

export type ArchiveTable = (typeof ARCHIVE_TABLES)[number];

export async function archiveColumnReady(table: ArchiveTable): Promise<boolean> {
  await assertStaff();
  const supabase = createAdminClient();
  const { error } = await supabase.from(table).select("archived").limit(1);
  return !error;
}
