"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { GuestProfile } from "@/types/entities";
import { GUEST_ARRIVAL_STATUS_VALUES, GUEST_GENDER_VALUES } from "@/types/entities";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";

export function buildGuestConfig(): EntityConfig<GuestProfile> {
  const filters: FilterConfig<GuestProfile>[] = [
    {
      key: "arrival_status",
      label: "Arrival",
      options: GUEST_ARRIVAL_STATUS_VALUES,
      optionLabels: { not_arrived: "Not arrived", arrived: "Arrived" },
    },
  ];

  return {
    table: "guest_profiles",
    pkColumn: "guest_id",
    entityLabel: "Guest",
    searchKeys: ["guest_name", "email", "phone_number", "slug"],
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
      {
        key: "email",
        header: "Email",
        render: (row) => row.email ?? <span className="text-muted-foreground">—</span>,
      },
      {
        key: "phone_number",
        header: "Phone",
        render: (row) => row.phone_number ?? <span className="text-muted-foreground">—</span>,
      },
      {
        key: "country",
        header: "Country",
        render: (row) => row.country ?? <span className="text-muted-foreground">—</span>,
      },
      {
        key: "auth_user_id",
        header: "App",
        render: (row) =>
          row.auth_user_id ? (
            <Badge variant="secondary">Signed up</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
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
        helpText: "Optional. The app shows the last four characters as the guest number.",
      },
      {
        name: "photo_url",
        label: "Photo",
        type: "image",
        imageFolder: "guests",
        imageSlugFrom: "guest_id",
      },
      { name: "guest_name", label: "Display name", type: "text" },
      {
        name: "email",
        label: "Email",
        type: "text",
        placeholder: "name@example.com",
        helpText: "The address the guest signs in with on the app.",
      },
      { name: "phone_number", label: "Phone number", type: "text", placeholder: "+962 7X XXX XXXX" },
      { name: "birthdate", label: "Birthdate", type: "date" },
      {
        name: "gender",
        label: "Gender",
        type: "enum",
        enumValues: GUEST_GENDER_VALUES,
        enumLabels: { male: "Male", female: "Female" },
      },
      {
        name: "country",
        label: "Country",
        type: "text",
        placeholder: "JO",
        helpText: "2-letter ISO code, as picked in the app.",
      },
      { name: "role", label: "Role", type: "text" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "location", label: "Location", type: "text" },
      {
        name: "stated_interests",
        label: "Stated interests",
        type: "chip-list",
      },
      {
        name: "slug",
        label: "Card handle",
        type: "text",
        placeholder: "e.g. amr-halawani",
        helpText: "Public handle behind the guest's card QR. Must be unique.",
      },
      {
        name: "arrival_status",
        label: "Arrival status",
        type: "enum",
        enumValues: GUEST_ARRIVAL_STATUS_VALUES,
        enumLabels: { not_arrived: "Not arrived", arrived: "Arrived" },
      },
      { name: "vip_flag", label: "VIP", type: "boolean" },
      { name: "attended_jc1", label: "Attended JC1", type: "boolean" },
      { name: "attended_jc2", label: "Attended JC2", type: "boolean" },
      {
        name: "manychat_subscriber_id",
        label: "ManyChat subscriber ID",
        type: "text",
        helpText: "Set by the WhatsApp concierge bot. Leave blank unless you know the id.",
      },
    ],
    hasUpdatedAt: true,
    describeRow: (row) =>
      `Delete guest "${row.guest_name ?? row.guest_id}"? This permanently removes them from the list.`,
  };
}
