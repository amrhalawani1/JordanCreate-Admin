"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";
import { getReadableError } from "@/lib/errors";
import { revalidateWebsite } from "@/lib/website-revalidate";

type ActionResult = { success: true } | { success: false; error: string };

const PAGE = "/website-management";
const ORDER_KEY = "homepage_speaker_order";

/** Admin handles in saved homepage order; empty when never saved. */
export async function getHomepageSpeakerOrder(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", ORDER_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const value = data?.value;
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function saveHomepageSpeakerOrder(handles: string[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const clean = Array.from(new Set(handles.map((h) => String(h).trim()).filter(Boolean))).slice(0, 300);
  try {
    const supabase = createAdminClient();
    const before = await getHomepageSpeakerOrder();
    const { error } = await supabase
      .from("website_settings")
      .upsert({ key: ORDER_KEY, value: clean, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return { success: false, error: getReadableError(error) };
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "website_settings",
      recordId: ORDER_KEY,
      summary: clean.length
        ? `Set the website home-page speaker order (${clean.length} speakers)`
        : "Reset the website home-page speaker order",
      before: { order: before },
      after: { order: clean },
    });
    revalidatePath(PAGE);
    revalidateWebsite("speakers");
    return { success: true };
  } catch (error) {
    return { success: false, error: getReadableError(error) };
  }
}
