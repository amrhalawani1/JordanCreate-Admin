import { z } from "zod";
import { requiredText, nullableText } from "./shared";

export const InterestTagSchema = z.object({
  tag_id: requiredText("Tag ID is required."),
  tag_label: requiredText("Tag label is required."),
  tag_description: nullableText(),
  is_provisional: z.boolean(),
});

export type InterestTagFormValues = z.infer<typeof InterestTagSchema>;
