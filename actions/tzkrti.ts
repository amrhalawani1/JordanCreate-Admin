"use server";

import { withActivity } from "@/lib/with-activity";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTicketReader, requireTicketEditor } from "@/lib/auth/guard";
import { readTzkrtiConfig } from "@/lib/tzkrti/config";
import { processStoredDelivery } from "@/lib/tzkrti/process";
import { DELIVERY_STATUSES, type DeliveryStatus } from "@/lib/tzkrti/types";
import { isMissingRelation } from "@/lib/tickets/query";

export type TzkrtiDelivery = {
  id: string;
  received_at: string;
  status: DeliveryStatus;
  event_type: string | null;
  error: string | null;
  ticket_refs: string[];
};

export type TzkrtiStatus = {
  configured: boolean;
  tableMissing: boolean;
  counts: Record<DeliveryStatus, number>;
  recent: TzkrtiDelivery[];
};

const EMPTY_COUNTS = Object.fromEntries(DELIVERY_STATUSES.map((s) => [s, 0])) as Record<DeliveryStatus, number>;

async function getTzkrtiStatusImpl(): Promise<TzkrtiStatus> {
  await assertTicketReader();
  const configured = readTzkrtiConfig() !== null;
  const supabase = createAdminClient();

  const recentRes = await supabase
    .from("tzkrti_webhook_events")
    .select("id, received_at, status, event_type, error, ticket_refs")
    .order("received_at", { ascending: false })
    .limit(8);
  if (recentRes.error) {
    return { configured, tableMissing: isMissingRelation(recentRes.error), counts: EMPTY_COUNTS, recent: [] };
  }

  const countResults = await Promise.all(
    DELIVERY_STATUSES.map((status) =>
      supabase.from("tzkrti_webhook_events").select("id", { count: "exact", head: true }).eq("status", status),
    ),
  );
  const counts = { ...EMPTY_COUNTS };
  DELIVERY_STATUSES.forEach((status, i) => {
    counts[status] = countResults[i].count ?? 0;
  });

  return { configured, tableMissing: false, counts, recent: (recentRes.data ?? []) as TzkrtiDelivery[] };
}

type ReprocessResult = { success: true; processed: number; stillWaiting: number } | { success: false; error: string };

/** Replays deliveries that were stored but not applied (format not mapped yet, or a database error). */
async function reprocessTzkrtiDeliveriesImpl(): Promise<ReprocessResult> {
  const gate = await requireTicketEditor();
  if (!gate.ok) return { success: false, error: gate.error };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tzkrti_webhook_events")
    .select("id")
    .in("status", ["unmapped", "failed", "received"])
    .order("received_at", { ascending: true })
    .limit(200);
  if (error) return { success: false, error: error.message };

  let processed = 0;
  let stillWaiting = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    try {
      const result = await processStoredDelivery(supabase, row.id);
      if (result.status === "processed" || result.status === "ignored") processed += 1;
      else stillWaiting += 1;
    } catch {
      stillWaiting += 1;
    }
  }
  revalidatePath("/tickets-management");
  return { success: true, processed, stillWaiting };
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getTzkrtiStatus = withActivity("tzkrti.getTzkrtiStatus", getTzkrtiStatusImpl);
export const reprocessTzkrtiDeliveries = withActivity("tzkrti.reprocessTzkrtiDeliveries", reprocessTzkrtiDeliveriesImpl);
