"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { Entertainment } from "@/types/entities";
import { ENTERTAINMENT_STATUS_VALUES } from "@/types/entities";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";

export function buildEntertainmentConfig(
  imageSlug?: string,
  actTypes: string[] = [],
): EntityConfig<Entertainment> {
  const filters: FilterConfig<Entertainment>[] = [
    { key: "act_type", label: "Type", options: actTypes },
    { key: "status", label: "Status", options: ENTERTAINMENT_STATUS_VALUES },
  ];

  return {
    table: "entertainment",
    pkColumn: "id",
    entityLabel: "Act",
    searchKeys: ["title", "performer_name", "description"],
    filters,
    columns: [
      {
        key: "photo_url",
        header: "Photo",
        className: "w-14",
        render: (row) => <PhotoThumb src={row.photo_url} alt={row.title} />,
      },
      { key: "title", header: "Title" },
      {
        key: "act_type",
        header: "Type",
        render: (row) => <Badge variant="outline">{row.act_type}</Badge>,
      },
      { key: "performer_name", header: "Performer" },
      { key: "start_time", header: "Start" },
      { key: "status", header: "Status" },
    ],
    formFields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "act_type",
        label: "Type",
        type: "suggest-text",
        required: true,
        placeholder: "e.g. DJ",
        helpText: "Must be DJ, Magic Show, Live Performance, Band, or Other.",
        referenceOptions: actTypes.map((value) => ({ value, label: value })),
      },
      { name: "performer_name", label: "Performer Name", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "start_time", label: "Start Time", type: "time" },
      { name: "end_time", label: "End Time", type: "time" },
      { name: "location_within_venue", label: "Location Within Venue", type: "text" },
      {
        name: "photo_url",
        label: "Photo",
        type: "image",
        imageFolder: "entertainment",
        imageSlugFrom: "title",
        imageSlug,
      },
      { name: "link", label: "Link", type: "url", placeholder: "https://" },
      { name: "status", label: "Status", type: "enum", required: true, enumValues: ENTERTAINMENT_STATUS_VALUES },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
    ],
    hasUpdatedAt: true,
    reorderable: true,
    cardTitleKey: "title",
    describeRow: (row) => `Delete entertainment act "${row.title}"? This cannot be undone.`,
  };
}
