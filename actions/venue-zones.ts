"use server";

import { withActivity } from "@/lib/with-activity";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, fetchByPk, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { VenueZoneSchema } from "@/lib/validation/venue-zones";
import type { VenueZone, VenueZoneInsert, VenueZoneUpdate } from "@/types/entities";
import { assertStaff, requireStaff } from "@/lib/auth/guard";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

async function getVenueZonesImpl(): Promise<VenueZone[]> {
  await assertStaff();
  const supabase = createAdminClient();
  return fetchAll<VenueZone>(supabase, "venue_zones", { column: "zone_id" });
}

async function createVenueZoneImpl(values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = VenueZoneSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const created = await insertRow<VenueZone, VenueZoneInsert>(supabase, "venue_zones", parsed.data);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "venue_zones",
      recordId: created.zone_id,
      summary: `Added zone ${created.zone_id}`,
      after: created,
    });
    revalidatePath("/venue");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function updateVenueZoneImpl(zoneId: string, values: unknown): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  const parsed = VenueZoneSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<VenueZone>(supabase, "venue_zones", {
      column: "zone_id",
      value: zoneId,
    });
    const { zone_id: _zoneId, ...rest } = parsed.data;
    const after = await updateRow<VenueZone, VenueZoneUpdate>(
      supabase,
      "venue_zones",
      { column: "zone_id", value: zoneId },
      rest,
    );
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "venue_zones",
      recordId: zoneId,
      summary: `Updated zone ${zoneId}`,
      before,
      after,
    });
    revalidatePath("/venue");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

async function deleteVenueZoneImpl(zoneId: string): Promise<ActionResult> {
  const gate = await requireStaff();
  if (!gate.ok) return gate;
  try {
    const supabase = createAdminClient();
    const before = await fetchByPk<VenueZone>(supabase, "venue_zones", {
      column: "zone_id",
      value: zoneId,
    });
    await deleteRow(supabase, "venue_zones", { column: "zone_id", value: zoneId });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "venue_zones",
      recordId: zoneId,
      summary: `Deleted zone ${zoneId}`,
      before,
    });
    revalidatePath("/venue");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getVenueZones = withActivity("venue-zones.getVenueZones", getVenueZonesImpl);
export const createVenueZone = withActivity("venue-zones.createVenueZone", createVenueZoneImpl);
export const updateVenueZone = withActivity("venue-zones.updateVenueZone", updateVenueZoneImpl);
export const deleteVenueZone = withActivity("venue-zones.deleteVenueZone", deleteVenueZoneImpl);
