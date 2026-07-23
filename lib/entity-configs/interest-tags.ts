import type { EntityConfig } from "./types";
import type { InterestTag } from "@/types/entities";

export const interestTagConfig: EntityConfig<InterestTag> = {
  table: "interest_tags",
  pkColumn: "tag_id",
  entityLabel: "Tag",
  columns: [
    { key: "tag_id", header: "Tag ID" },
    { key: "tag_label", header: "Label" },
    {
      key: "is_provisional",
      header: "Provisional",
      render: (row) => (row.is_provisional ? "Yes" : "No"),
    },
  ],
  formFields: [
    { name: "tag_id", label: "Tag ID", type: "text", required: true, placeholder: "e.g. AI" },
    { name: "tag_label", label: "Label", type: "text", required: true },
    { name: "tag_description", label: "Description", type: "textarea" },
    { name: "is_provisional", label: "Provisional", type: "boolean" },
  ],
  hasUpdatedAt: false,
  describeRow: (row) => `Delete tag "${row.tag_label}" (${row.tag_id})? This cannot be undone.`,
};
