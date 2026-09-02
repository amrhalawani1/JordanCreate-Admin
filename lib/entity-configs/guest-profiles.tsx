"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { GuestProfile } from "@/types/entities";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";

export function buildGuestConfig(arrivalStatuses: string[]): EntityConfig<GuestProfile> {
  const filters: FilterConfig<GuestProfile>[] = [];
  if (arrivalStatuses.length) {
    filters.push({ key: "arrival_status", label: "Arrival", options: arrivalStatuses });
  }

  return {
    table: "guest_profiles",
    pkColumn: "guest_id",
    entityLabel: "Guest",
    searchKeys: ["guest_name", "phone_number"],
    filters,
    cardTitleKey: "guest_name",
    columns: [
      {
        key: "photo_url",
        header: "Photo",
        className: "w-14",
        render: (row) => <PhotoThumb src={row.photo_url} alt={row.guest_name ?? "Guest"} />,
      },
      { key: "guest_name", header: "Name" },
      { key: "arrival_status", header: "Arrival" },
      {
        key: "vip_flag",
        header: "VIP",
        render: (row) => (row.vip_flag ? "Yes" : "No"),
      },
      {
        key: "attended_jc1",
        header: "JC1",
        render: (row) =>
          row.attended_jc1 ? <Badge variant="secondary">JC1</Badge> : <span className="text-muted-foreground">—</span>,
      },
      {
        key: "attended_jc2",
        header: "JC2",
        render: (row) =>
          row.attended_jc2 ? <Badge variant="secondary">JC2</Badge> : <span className="text-muted-foreground">—</span>,
      },
    ],
    formFields: [
      {
        name: "guest_id",
        label: "Guest ID",
        type: "text",
        placeholder: "Leave blank to generate a UUID",
        helpText: "Optional. Matches a Supabase Auth user id when the guest is linked.",
      },
      {
        name: "photo_url",
        label: "Photo",
        type: "image",
        imageFolder: "guests",
        imageSlugFrom: "guest_id",
      },
      { name: "guest_name", label: "Display name", type: "text" },
      { name: "role", label: "Role", type: "text" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "location", label: "Location", type: "text" },
      { name: "phone_number", label: "Phone number", type: "text" },
      {
        name: "stated_interests",
        label: "Stated interests",
        type: "chip-list",
      },
      {
        name: "arrival_status",
        label: "Arrival status",
        type: "suggest-text",
        referenceOptions: arrivalStatuses.map((v) => ({ value: v, label: v })),
        placeholder: "e.g. not_arrived",
      },
      { name: "vip_flag", label: "VIP", type: "boolean" },
      { name: "attended_jc1", label: "Attended JC1", type: "boolean" },
      { name: "attended_jc2", label: "Attended JC2", type: "boolean" },
    ],
    hasUpdatedAt: false,
    describeRow: (row) =>
      `Delete guest "${row.guest_name ?? row.guest_id}"? This permanently removes them from the list.`,
  };
}
