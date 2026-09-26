"use client";

import type { EntityConfig, FilterConfig } from "./types";
import type { HotTopic } from "@/types/entities";
import { HOT_TOPIC_STATUS_VALUES } from "@/types/entities";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";
import { Badge } from "@/components/ui/badge";
import type { DestinationOption } from "@/lib/mobile-app/destinations";

export function buildHotTopicConfig(
  imageSlug?: string,
  destinationOptions: DestinationOption[] = [],
): EntityConfig<HotTopic> {
  const filters: FilterConfig<HotTopic>[] = [
    { key: "status", label: "Status", options: HOT_TOPIC_STATUS_VALUES },
  ];
  const destinationLabel = new Map(destinationOptions.map((o) => [o.value, o.label]));

  return {
    table: "hot_topics",
    pkColumn: "id",
    entityLabel: "Hot topic",
    searchKeys: ["headline", "eyebrow", "supporting"],
    filters,
    columns: [
      {
        key: "image_url",
        header: "Image",
        className: "w-14",
        render: (row) => <PhotoThumb src={row.image_url} alt={row.headline} />,
      },
      { key: "headline", header: "Headline" },
      {
        key: "eyebrow",
        header: "Eyebrow",
        render: (row) => <Badge variant="outline">{row.eyebrow}</Badge>,
      },
      { key: "supporting", header: "Supporting line" },
      {
        key: "destination",
        header: "Opens",
        render: (row) =>
          row.destination ? (destinationLabel.get(row.destination) ?? row.destination) : "—",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={row.status === "published" ? "default" : "secondary"}>{row.status}</Badge>
        ),
      },
    ],
    formFields: [
      { name: "headline", label: "Headline", type: "text", required: true },
      {
        name: "eyebrow",
        label: "Eyebrow",
        type: "suggest-text",
        required: true,
        placeholder: "e.g. DJ",
        helpText: "Small orange label above the headline.",
        distinctFrom: "self",
      },
      {
        name: "supporting",
        label: "Supporting line",
        type: "text",
        placeholder: "e.g. Dopamine — 04:00 PM – 05:30 PM.",
      },
      { name: "action_label", label: "Action label", type: "text", required: true },
      {
        name: "destination",
        label: "Opens",
        type: "suggest-text",
        placeholder: "e.g. entertainment-4",
        helpText: "Where the card takes the guest. Pick an act, a session, or an app screen.",
        referenceOptions: destinationOptions,
      },
      {
        name: "image_url",
        label: "Image",
        type: "image",
        imageFolder: "hot-topics",
        imageSlugFrom: "headline",
        imageSlug,
      },
      {
        name: "status",
        label: "Status",
        type: "enum",
        required: true,
        enumValues: HOT_TOPIC_STATUS_VALUES,
        helpText: "Only published cards show in the app.",
      },
      { name: "sort_order", label: "Sort order", type: "number", required: true },
    ],
    hasUpdatedAt: true,
    reorderable: true,
    cardTitleKey: "headline",
    describeRow: (row) => `Delete hot topic "${row.headline}"? This cannot be undone.`,
  };
}
