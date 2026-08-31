import { z } from "zod";
import { requiredText } from "./shared";

export const EventInfoItemSchema = z.object({
  title: requiredText("Title is required."),
  description: requiredText("Description is required."),
  sort_order: z.number({ error: "Sort order is required." }).int(),
});

export type EventInfoItemFormValues = z.infer<typeof EventInfoItemSchema>;
