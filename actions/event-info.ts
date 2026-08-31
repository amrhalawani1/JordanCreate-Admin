"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, updateRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { EventInfoSchema } from "@/lib/validation/event-info";
import type { EventInfo, EventInfoUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

export async function getEventInfo(): Promise<EventInfo | null> {
  await assertStaff();
  const supabase = createAdminClient();
  const rows = await fetchAll<EventInfo>(supabase, "event_info");
  return rows[0] ?? null;
}

export async function updateEventInfo(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = EventInfoSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<EventInfo>(supabase, "event_info", { column: "id", value: 1 });
    const after = await updateRow<EventInfo, EventInfoUpdate>(
      supabase,
      "event_info",
      { column: "id", value: 1 },
      { ...parsed.data, updated_at: new Date().toISOString() },
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "event_info",
      recordId: 1,
      summary: "Updated event info",
      before,
      after,
    });
    revalidatePath("/event-info");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
