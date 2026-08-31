"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, updateRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { BrandVoiceSchema } from "@/lib/validation/brand-voice";
import type { BrandVoice, BrandVoiceUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getBrandVoice(): Promise<BrandVoice | null> {
  await assertStaff();
  const supabase = createAdminClient();
  const rows = await fetchAll<BrandVoice>(supabase, "brand_voice");
  return rows[0] ?? null;
}

export async function updateBrandVoice(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = BrandVoiceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<BrandVoice>(supabase, "brand_voice", { column: "id", value: 1 });
    const after = await updateRow<BrandVoice, BrandVoiceUpdate>(
      supabase,
      "brand_voice",
      { column: "id", value: 1 },
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "brand_voice",
      recordId: 1,
      summary: "Updated brand voice",
      before,
      after,
    });
    revalidatePath("/brand-voice");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
