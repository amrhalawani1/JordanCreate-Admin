"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { Speaker } from "@/types/entities";
import { SPEAKER_BIO_STATUS_VALUES } from "@/types/entities";
import { archiveFilter } from "@/lib/archive";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { ArchiveStatusBadge } from "@/components/shared/ArchiveStatusBadge";

export function buildSpeakerConfig(categories: string[]): EntityConfig<Speaker> {
  const categoryOptions = categories.map((v) => ({ value: v, label: v }));

  const filters: FilterConfig<Speaker>[] = [
    { key: "category", label: "Category", options: categories },
    { key: "bio_status", label: "Bio Status", options: SPEAKER_BIO_STATUS_VALUES },
    archiveFilter<Speaker>(),
  ];

  return {
    table: "speakers",
    pkColumn: "handle",
    entityLabel: "Speaker",
    searchKeys: ["handle", "tagline"],
    filters,
    columns: [
      {
        key: "photo_url",
        header: "Photo",
        className: "w-14",
        render: (row) => <PhotoThumb src={row.photo_url} alt={row.handle} />,
      },
      { key: "handle", header: "Handle" },
      { key: "category", header: "Category" },
      { key: "followers_range", header: "Followers" },
      { key: "bio_status", header: "Bio Status" },
      {
        key: "archived",
        header: "App",
        render: (row) => <ArchiveStatusBadge archived={row.archived} />,
      },
    ],
    formFields: [
      { name: "handle", label: "Handle", type: "text", required: true, placeholder: "e.g. Raghadzamell" },
      {
        name: "category",
        label: "Category",
        type: "suggest-text",
        required: true,
        referenceOptions: categoryOptions,
        placeholder: "e.g. Content Creator",
      },
      {
        name: "photo_url",
        label: "Photo",
        type: "image",
        required: true,
        imageFolder: "speakers",
        imageSlugFrom: "handle",
      },
      { name: "tagline", label: "Tagline", type: "text", required: true },
      { name: "followers_range", label: "Followers Range", type: "text", required: true, placeholder: "e.g. 1M-5M" },
      { name: "availability", label: "Availability", type: "text", required: true, placeholder: "e.g. all_day" },
      {
        name: "bio_status",
        label: "Bio Status",
        type: "enum",
        required: true,
        enumValues: SPEAKER_BIO_STATUS_VALUES,
      },
      { name: "known_for", label: "Known For", type: "textarea", required: true },
      {
        name: "tags",
        label: "Tags",
        type: "chip-list",
        helpText: "Topic tags. Type a value and press Enter or comma.",
      },
    ],
    hasUpdatedAt: true,
    archivable: true,
    cardTitleKey: "handle",
    describeRow: (row) => `Delete speaker "${row.handle}"? This permanently removes them from the roster.`,
  };
}
