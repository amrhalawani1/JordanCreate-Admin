import { createClient } from "@supabase/supabase-js";
import type { AdminLevel } from "@/types/entities";

/** Edge-safe lookup for proxy.ts. Returns null if the row or table is missing. */
export async function lookupAdminLevel(userId: string): Promise<AdminLevel | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("admins")
    .select("admin_level")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.admin_level as AdminLevel;
}
