import { z } from "zod";
import { requiredText } from "./shared";

export const FaqEntrySchema = z.object({
  question: requiredText("Question is required."),
  answer: requiredText("Answer is required."),
  sort_order: z.number({ error: "Sort order is required." }).int(),
});

export type FaqEntryFormValues = z.infer<typeof FaqEntrySchema>;
