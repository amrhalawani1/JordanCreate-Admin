import { z } from "zod";
import { requiredText, nullableText } from "./shared";

export const BrandVoiceSchema = z.object({
  mission: requiredText("Mission is required."),
  values_text: requiredText("At least one value is required."),
  tone_notes: nullableText(),
});

export type BrandVoiceFormValues = z.infer<typeof BrandVoiceSchema>;
