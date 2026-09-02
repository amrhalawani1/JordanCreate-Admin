"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { parseSocialLinkDrafts } from "@/lib/validation/social-links";
import { assertGuestEditor, requireGuestEditor } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";
import type { GuestSocialLink, GuestSocialLinkInsert } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getGuestSocialLinks(): Promise<GuestSocialLink[]> {
  await assertGuestEditor();
  const supabase = createAdminClient();
  return fetchAll<GuestSocialLink>(supabase, "guest_social_links", { column: "sort_order" });
}

export async function replaceGuestSocialLinks(guestId: string, values: unknown): Promise<ActionResult> {
  const gate = await requireGuestEditor();
  if (!gate.ok) return gate;
  const parsed = parseSocialLinkDrafts(values);
  if (!parsed.ok) return { success: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { data: before, error: beforeError } = await supabase
      .from("guest_social_links")
      .select("*")
      .eq("guest_id", guestId)
      .order("sort_order");
    if (beforeError) throw beforeError;

    const { error: deleteError } = await supabase.from("guest_social_links").delete().eq("guest_id", guestId);
    if (deleteError) throw deleteError;

    const rows: GuestSocialLinkInsert[] = parsed.data.map((row, index) => ({
      guest_id: guestId,
      platform: row.platform,
      handle: row.handle,
      url: row.url,
      sort_order: index,
    }));

    let after: GuestSocialLink[] = [];
    if (rows.length > 0) {
      const { data, error } = await supabase.from("guest_social_links").insert(rows).select("*");
      if (error) throw error;
      after = (data ?? []) as GuestSocialLink[];
    }

    await logChange({
      actor: gate.admin,
      action: "update",
      table: "guest_social_links",
      recordId: guestId,
      summary: `Updated social links for guest ${guestId}`,
      before: { links: before ?? [] },
      after: { links: after },
    });
    revalidatePath("/guests");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
