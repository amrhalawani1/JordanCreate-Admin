import type { EntityConfig } from "./types";
import type { EventInfoItem } from "@/types/entities";

function excerpt(value: string, max = 80): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export const eventInfoItemConfig: EntityConfig<EventInfoItem> = {
  table: "event_info_items",
  pkColumn: "id",
  entityLabel: "Info",
  searchKeys: ["title", "description"],
  columns: [
    { key: "title", header: "Title" },
    {
      key: "description",
      header: "Description",
      render: (row) => excerpt(row.description),
    },
  ],
  formFields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  hasUpdatedAt: true,
  reorderable: true,
  describeRow: (row) => `Delete "${row.title}"? This cannot be undone.`,
};
