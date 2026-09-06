"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { Partner, VenueZone } from "@/types/entities";
import { archiveFilter } from "@/lib/archive";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";
import { ArchiveStatusBadge } from "@/components/shared/ArchiveStatusBadge";

export function buildPartnerConfig(
  zones: VenueZone[],
  imageSlug?: string,
  tiers: string[] = [],
): EntityConfig<Partner> {
  const zoneOptions = zones.map((zone) => ({ value: zone.zone_id, label: `${zone.zone_id} · ${zone.name}` }));
  const zoneName = (zoneId: string | null) => zones.find((zone) => zone.zone_id === zoneId)?.name ?? zoneId ?? "—";
  const filters: FilterConfig<Partner>[] = [archiveFilter<Partner>()];
  if (tiers.length) filters.push({ key: "tier", label: "Tier", options: tiers });

  return {
    table: "partners",
    pkColumn: "id",
    entityLabel: "Partner",
    searchKeys: ["name", "description", "website"],
    filters,
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
        render: (row) => <Badge variant="outline">{row.tier}</Badge>,
      },
      {
        key: "zone_id",
        header: "Zone",
        render: (row) => zoneName(row.zone_id),
      },
      {
        key: "archived",
        header: "App",
        render: (row) => <ArchiveStatusBadge archived={row.archived} />,
      },
    ],
    formFields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "tier",
        label: "Tier",
        type: "suggest-text",
        required: true,
        placeholder: "e.g. Headline",
        helpText: "Must be Headline, Supporting, or Community.",
        referenceOptions: [
          { value: "Headline", label: "Headline" },
          { value: "Supporting", label: "Supporting" },
          { value: "Community", label: "Community" },
        ],
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
    archivable: true,
    cardTitleKey: "name",
    describeRow: (row) => `Delete partner "${row.name}"? This cannot be undone.`,
  };
}
