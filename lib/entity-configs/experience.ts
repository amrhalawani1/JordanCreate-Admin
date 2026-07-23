import type { EntityConfig } from "./types";
import type { Experience } from "@/types/entities";

export function buildExperienceConfig(existingTypes: string[]): EntityConfig<Experience> {
  const typeOptions = existingTypes.map((v) => ({ value: v, label: v }));

  return {
    table: "experience",
    pkColumn: "id",
    entityLabel: "Experience",
    columns: [
      { key: "experience_type", header: "Type" },
      { key: "title", header: "Title" },
      { key: "platform", header: "Platform" },
      { key: "sort_order", header: "Order" },
    ],
    formFields: [
      {
        name: "experience_type",
        label: "Experience Type",
        type: "suggest-text",
        required: true,
        referenceOptions: typeOptions,
        placeholder: "e.g. playlist",
      },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "link", label: "Link", type: "url" },
      { name: "platform", label: "Platform", type: "text", placeholder: "e.g. Anghami" },
      { name: "usage_context", label: "Usage Context", type: "textarea" },
      { name: "sort_order", label: "Sort Order", type: "number", required: true },
    ],
    hasUpdatedAt: true,
    describeRow: (row) => `Delete experience "${row.title}"? This cannot be undone.`,
  };
}
