"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertStaff } from "@/lib/auth/guard";

export type ArchiveTable = "speakers" | "agenda_sessions" | "partners";

export async function archiveColumnReady(table: ArchiveTable): Promise<boolean> {
  await assertStaff();
  const supabase = createAdminClient();
  const { error } = await supabase.from(table).select("archived").limit(1);
  return !error;
}
