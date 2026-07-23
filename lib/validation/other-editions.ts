import { z } from "zod";
import { requiredText, nullableText } from "./shared";

export const JordanEditionSchema = z.object({
  name: requiredText("Name is required."),
  status: requiredText("Status is required."),
  notes: nullableText(),
});

export type JordanEditionFormValues = z.infer<typeof JordanEditionSchema>;
