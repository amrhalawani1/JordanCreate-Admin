import type { EntityConfig } from "./types";
import type { VenueZone } from "@/types/entities";

export const venueZoneConfig: EntityConfig<VenueZone> = {
  table: "venue_zones",
  pkColumn: "zone_id",
  entityLabel: "Zone",
  columns: [
    { key: "zone_id", header: "Zone ID" },
    { key: "name", header: "Name" },
    { key: "capacity_note", header: "Capacity Note" },
  ],
  formFields: [
    { name: "zone_id", label: "Zone ID", type: "text", required: true, placeholder: "e.g. Z1" },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "capacity_note", label: "Capacity Note", type: "text" },
    { name: "details", label: "Details", type: "textarea" },
  ],
  hasUpdatedAt: false,
  describeRow: (row) => `Delete zone "${row.name}" (${row.zone_id})? This cannot be undone.`,
};
