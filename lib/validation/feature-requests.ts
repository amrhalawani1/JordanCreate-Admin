import { z } from "zod";
import { requiredText } from "./shared";

export const FeatureRequestSchema = z.object({
  title: requiredText("Title is required."),
  description: requiredText("Description is required."),
});

export type FeatureRequestFormValues = z.infer<typeof FeatureRequestSchema>;
