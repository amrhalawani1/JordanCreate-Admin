"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, updateRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { BrandVoiceSchema } from "@/lib/validation/brand-voice";
import type { BrandVoice, BrandVoiceUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getBrandVoice(): Promise<BrandVoice | null> {
  const supabase = createAdminClient();
  const rows = await fetchAll<BrandVoice>(supabase, "brand_voice");
  return rows[0] ?? null;
}

export async function updateBrandVoice(values: unknown): Promise<ActionResult> {
  const parsed = BrandVoiceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    await updateRow<BrandVoice, BrandVoiceUpdate>(
      supabase,
      "brand_voice",
      { column: "id", value: 1 },
      parsed.data,
    );
    revalidatePath("/brand-voice");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
