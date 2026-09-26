import { z } from "zod";
import { HOT_TOPIC_STATUS_VALUES } from "@/types/entities";
import { nullableText, requiredText } from "./shared";

/** In-app route ids only: letters, digits, dashes, underscores. Never a URL. */
const DESTINATION_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;

export const HotTopicSchema = z.object({
  eyebrow: requiredText("Eyebrow is required (e.g. DJ, Magic Show, Tonight)."),
  headline: requiredText("Headline is required."),
  supporting: nullableText(),
  action_label: requiredText("Action label is required."),
  destination: nullableText().refine((v) => v === null || DESTINATION_PATTERN.test(v), {
    message: "Destination must be an in-app route id like entertainment-4 or agenda, not a URL.",
  }),
  image_url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || z.url().safeParse(v).success, { message: "Enter a valid image URL." }),
  sort_order: z.number({ error: "Sort order is required." }).int(),
  status: z.enum(HOT_TOPIC_STATUS_VALUES, { error: "Choose draft or published." }),
});

export type HotTopicFormValues = z.infer<typeof HotTopicSchema>;
