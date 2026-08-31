import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Admin } from "@/types/entities";

export type CurrentAdmin = Admin;

export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAdminById(id: string): Promise<CurrentAdmin | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("admins").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getAdminById(userId);
}
