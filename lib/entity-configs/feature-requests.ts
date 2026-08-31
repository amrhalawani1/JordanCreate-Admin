import type { EntityConfig } from "./types";
import type { FeatureRequestListItem } from "@/types/entities";

function excerpt(value: string, max = 80): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const featureRequestConfig: EntityConfig<FeatureRequestListItem> = {
  table: "feature_requests",
  pkColumn: "id",
  entityLabel: "Feature",
  searchKeys: ["title", "description", "requester_name", "requester_email"],
  columns: [
    { key: "title", header: "Title" },
    {
      key: "description",
      header: "Description",
      render: (row) => excerpt(row.description),
    },
    {
      key: "requester_name",
      header: "Requested by",
      render: (row) => row.requester_name || row.requester_email || "—",
    },
    {
      key: "created_at",
      header: "Date",
      render: (row) => formatDate(row.created_at),
    },
  ],
  formFields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  hasUpdatedAt: true,
  describeRow: (row) =>
    `Delete feature request "${row.title}"? This cannot be undone.`,
};
