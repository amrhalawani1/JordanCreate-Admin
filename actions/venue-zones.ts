"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { VenueZoneSchema } from "@/lib/validation/venue-zones";
import type { VenueZone, VenueZoneInsert, VenueZoneUpdate } from "@/types/entities";

type ActionResult = { success: true } | { success: false; error: string };

export async function getVenueZones(): Promise<VenueZone[]> {
  const supabase = createAdminClient();
  return fetchAll<VenueZone>(supabase, "venue_zones", { column: "zone_id" });
}

export async function createVenueZone(values: unknown): Promise<ActionResult> {
  const parsed = VenueZoneSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    await insertRow<VenueZone, VenueZoneInsert>(supabase, "venue_zones", parsed.data);
    revalidatePath("/venue");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateVenueZone(zoneId: string, values: unknown): Promise<ActionResult> {
  const parsed = VenueZoneSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const { zone_id: _zoneId, ...rest } = parsed.data;
    await updateRow<VenueZone, VenueZoneUpdate>(
      supabase,
      "venue_zones",
      { column: "zone_id", value: zoneId },
      rest,
    );
    revalidatePath("/venue");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteVenueZone(zoneId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();
    await deleteRow(supabase, "venue_zones", { column: "zone_id", value: zoneId });
    revalidatePath("/venue");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
