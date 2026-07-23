import { z } from "zod";
import { requiredText, nullableText } from "./shared";

export const ExperienceSchema = z.object({
  experience_type: requiredText("Experience type is required."),
  title: requiredText("Title is required."),
  description: nullableText(),
  link: nullableText(),
  platform: nullableText(),
  usage_context: nullableText(),
  sort_order: z.number({ error: "Sort order is required." }).int(),
});

export type ExperienceFormValues = z.infer<typeof ExperienceSchema>;
