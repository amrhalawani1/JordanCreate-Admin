"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, updateRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { EventInfoSchema } from "@/lib/validation/event-info";
import type { EventInfo, EventInfoUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getEventInfo(): Promise<EventInfo | null> {
  const supabase = createAdminClient();
  const rows = await fetchAll<EventInfo>(supabase, "event_info");
  return rows[0] ?? null;
}

export async function updateEventInfo(values: unknown): Promise<ActionResult> {
  const parsed = EventInfoSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    await updateRow<EventInfo, EventInfoUpdate>(
      supabase,
      "event_info",
      { column: "id", value: 1 },
      parsed.data,
    );
    revalidatePath("/event-info");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
