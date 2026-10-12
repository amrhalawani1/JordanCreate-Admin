"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { CommunityArticleSchema } from "@/lib/validation/community-articles";
import type { CommunityArticle, CommunityArticleInsert, CommunityArticleUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";
import { revalidateWebsite } from "@/lib/website-revalidate";

type ActionResult = { success: true } | { success: false; error: string };

const PAGE = "/community-articles";
const TABLE = "community_articles";

function slugTaken(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

function saveError(err: unknown) {
  return slugTaken(err)
    ? "Another article already uses this URL slug. Choose a different one."
    : getReadableError(err);
}

/** Newest first, featured on top, matching the order on jordancreate.com/community. */
export async function getCommunityArticles(): Promise<CommunityArticle[]> {
  await assertStaff();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CommunityArticle[];
}

export async function createCommunityArticle(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = CommunityArticleSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<CommunityArticle, CommunityArticleInsert>(supabase, TABLE, parsed.data);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: TABLE,
      recordId: created.id,
      summary: `Added article "${created.title}" (${created.status})`,
      after: created,
    });
    revalidatePath(PAGE);
    revalidateWebsite("community");
    return { success: true };
  } catch (err) {
    return { success: false, error: saveError(err) };
  }
}

export async function updateCommunityArticle(id: string, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = CommunityArticleSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<CommunityArticle>(supabase, TABLE, { column: "id", value: id });
    const after = await updateRow<CommunityArticle, CommunityArticleUpdate>(
      supabase,
      TABLE,
      { column: "id", value: id },
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: TABLE,
      recordId: id,
      summary: `Updated article "${after.title}"`,
      before,
      after,
    });
    revalidatePath(PAGE);
    revalidateWebsite("community");
    return { success: true };
  } catch (err) {
    return { success: false, error: saveError(err) };
  }
}

export async function deleteCommunityArticle(id: string): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<CommunityArticle>(supabase, TABLE, { column: "id", value: id });
    await deleteRow(supabase, TABLE, { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: TABLE,
      recordId: id,
      summary: `Deleted article "${before?.title ?? id}"`,
      before,
    });
    revalidatePath(PAGE);
    revalidateWebsite("community");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
