"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { parseSocialLinkDrafts } from "@/lib/validation/social-links";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";
import type { SpeakerSocialLink, SpeakerSocialLinkInsert } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getSpeakerSocialLinks(): Promise<SpeakerSocialLink[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<SpeakerSocialLink>(supabase, "speaker_social_links", { column: "sort_order" });
}

export async function replaceSpeakerSocialLinks(
  speakerHandle: string,
  values: unknown,
): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = parseSocialLinkDrafts(values, { min: 1 });
  if (!parsed.ok) return { success: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { data: before, error: beforeError } = await supabase
      .from("speaker_social_links")
      .select("*")
      .eq("speaker_handle", speakerHandle)
      .order("sort_order");
    if (beforeError) throw beforeError;

    const { error: deleteError } = await supabase
      .from("speaker_social_links")
      .delete()
      .eq("speaker_handle", speakerHandle);
    if (deleteError) throw deleteError;

    const rows: SpeakerSocialLinkInsert[] = parsed.data.map((row, index) => ({
      speaker_handle: speakerHandle,
      platform: row.platform,
      handle: row.handle,
      url: row.url,
      sort_order: index,
    }));

    let after: SpeakerSocialLink[] = [];
    if (rows.length > 0) {
      const { data, error } = await supabase.from("speaker_social_links").insert(rows).select("*");
      if (error) throw error;
      after = (data ?? []) as SpeakerSocialLink[];
    }

    await logChange({
      actor: gate.admin,
      action: "update",
      table: "speaker_social_links",
      recordId: speakerHandle,
      summary: `Updated social links for speaker ${speakerHandle}`,
      before: { links: before ?? [] },
      after: { links: after },
    });
    revalidatePath("/speakers");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
