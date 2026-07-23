import type { FieldConfig } from "./types";
import type { BrandVoice } from "@/types/entities";

export const brandVoiceFields: FieldConfig<BrandVoice>[] = [
  { name: "mission", label: "Mission", type: "textarea", required: true },
  {
    name: "values_text",
    label: "Values",
    type: "chip-list",
    required: true,
    helpText: "Stored as a semicolon-separated list under the hood.",
  },
  { name: "tone_notes", label: "Tone Notes", type: "textarea" },
];
