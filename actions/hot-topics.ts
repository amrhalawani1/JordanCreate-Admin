"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { HotTopicSchema } from "@/lib/validation/hot-topics";
import type { HotTopic, HotTopicInsert, HotTopicUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

const PAGE = "/mobile-app-management";

export async function getHotTopics(): Promise<HotTopic[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<HotTopic>(supabase, "hot_topics", { column: "sort_order" });
}

export async function createHotTopic(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = HotTopicSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const created = await insertRow<HotTopic, HotTopicInsert>(supabase, "hot_topics", parsed.data);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "hot_topics",
      recordId: created.id,
      summary: `Added hot topic "${created.headline}"`,
      after: created,
    });
    revalidatePath(PAGE);
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateHotTopic(id: number, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = HotTopicSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<HotTopic>(supabase, "hot_topics", { column: "id", value: id });
    const after = await updateRow<HotTopic, HotTopicUpdate>(
      supabase,
      "hot_topics",
      { column: "id", value: id },
      parsed.data,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "hot_topics",
      recordId: id,
      summary: `Updated hot topic "${after.headline}"`,
      before,
      after,
    });
    revalidatePath(PAGE);
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteHotTopic(id: number): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<HotTopic>(supabase, "hot_topics", { column: "id", value: id });
    await deleteRow(supabase, "hot_topics", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "hot_topics",
      recordId: id,
      summary: `Deleted hot topic "${before?.headline ?? id}"`,
      before,
    });
    revalidatePath(PAGE);
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function reorderHotTopics(orderedIds: number[]): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    await Promise.all(
      orderedIds.map((id, index) =>
        updateRow<HotTopic, HotTopicUpdate>(
          supabase,
          "hot_topics",
          { column: "id", value: id },
          { sort_order: index },
        ),
      ),
    );
    await logChange({
      actor: gate.admin,
      action: "reorder",
      table: "hot_topics",
      summary: "Reordered hot topics",
      after: { order: orderedIds },
    });
    revalidatePath(PAGE);
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
