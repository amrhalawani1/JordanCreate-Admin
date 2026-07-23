import type { EntityConfig } from "./types";
import type { FaqEntry } from "@/types/entities";

export const faqEntryConfig: EntityConfig<FaqEntry> = {
  table: "faq_entries",
  pkColumn: "id",
  entityLabel: "FAQ",
  columns: [
    { key: "question", header: "Question" },
    { key: "answer", header: "Answer" },
  ],
  formFields: [
    { name: "question", label: "Question", type: "text", required: true },
    { name: "answer", label: "Answer", type: "textarea", required: true },
  ],
  hasUpdatedAt: false,
  reorderable: true,
  describeRow: (row) => `Delete FAQ "${row.question}"? This cannot be undone.`,
};
