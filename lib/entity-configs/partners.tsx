"use client";

import type { EntityConfig } from "./types";
import type { Partner, VenueZone } from "@/types/entities";
import { PARTNER_TIER_VALUES } from "@/types/entities";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";

const TIER_VARIANT: Record<(typeof PARTNER_TIER_VALUES)[number], "default" | "secondary" | "outline"> = {
  Headline: "default",
  Supporting: "secondary",
  Community: "outline",
};

export function buildPartnerConfig(
  zones: VenueZone[],
  imageSlug?: string,
): EntityConfig<Partner> {
  const zoneOptions = zones.map((zone) => ({ value: zone.zone_id, label: `${zone.zone_id} · ${zone.name}` }));
  const zoneName = (zoneId: string | null) => zones.find((zone) => zone.zone_id === zoneId)?.name ?? zoneId ?? "—";

  return {
    table: "partners",
    pkColumn: "id",
    entityLabel: "Partner",
    searchKeys: ["name", "description", "website"],
    filters: [{ key: "tier", label: "Tier", options: PARTNER_TIER_VALUES }],
    columns: [
      {
        key: "image_url",
        header: "Image",
        className: "w-14",
        render: (row) => <PhotoThumb src={row.image_url} alt={row.name} />,
      },
      { key: "name", header: "Name" },
      {
        key: "tier",
        header: "Tier",
        render: (row) => (
          <Badge variant={TIER_VARIANT[row.tier as (typeof PARTNER_TIER_VALUES)[number]] ?? "outline"}>
            {row.tier}
          </Badge>
        ),
      },
      {
        key: "zone_id",
        header: "Zone",
        render: (row) => zoneName(row.zone_id),
      },
    ],
    formFields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "tier",
        label: "Tier",
        type: "enum",
        required: true,
        enumValues: PARTNER_TIER_VALUES,
      },
      {
        name: "zone_id",
        label: "Zone",
        type: "select-ref",
        referenceOptions: zoneOptions,
      },
      { name: "description", label: "Description", type: "textarea" },
      { name: "website", label: "Website", type: "url", placeholder: "https://" },
      {
        name: "image_url",
        label: "Image",
        type: "image",
        imageFolder: "partners",
        imageSlugFrom: "name",
        imageSlug,
      },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
    ],
    hasUpdatedAt: false,
    reorderable: true,
    cardTitleKey: "name",
    describeRow: (row) => `Delete partner "${row.name}"? This cannot be undone.`,
  };
}
