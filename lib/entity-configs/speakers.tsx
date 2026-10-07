"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { Speaker } from "@/types/entities";
import { SPEAKER_BIO_STATUS_VALUES } from "@/types/entities";
import { archiveFilter } from "@/lib/archive";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { ArchiveStatusBadge } from "@/components/shared/ArchiveStatusBadge";

/**
 * Standard follower bands, in the same spelling the database already uses
 * ("50K-250K"): the website sorts the lineup by the leading number of this
 * string, so keep new values in this shape where possible.
 */
export const FOLLOWER_RANGE_OPTIONS = ["Under 10K", "10K-50K", "50K-250K", "250K-1M", "1M-5M", "5M+"] as const;

export function buildSpeakerConfig(
  categories: string[],
  tags: string[] = [],
  followerRanges: readonly string[] = FOLLOWER_RANGE_OPTIONS,
): EntityConfig<Speaker> {
  const categoryOptions = categories.map((v) => ({ value: v, label: v }));
  const followerRangeOptions = followerRanges.map((v) => ({ value: v, label: v }));
  const tagOptions = tags.map((v) => ({ value: v, label: v }));

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
      {
        name: "followers_range",
        label: "Followers Range",
        type: "suggest-text",
        required: true,
        referenceOptions: followerRangeOptions,
        placeholder: "Select a range",
      },
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
        referenceOptions: tagOptions,
        placeholder: "Add a tag…",
        helpText: "Topic tags. Pick from the list or type a new one.",
      },
    ],
    hasUpdatedAt: true,
    archivable: true,
    cardTitleKey: "handle",
    describeRow: (row) => `Delete speaker "${row.handle}"? This permanently removes them from the roster.`,
  };
}
