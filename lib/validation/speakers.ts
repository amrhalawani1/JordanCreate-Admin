import { z } from "zod";
import { requiredText, nullableText } from "./shared";
import { SPEAKER_BIO_STATUS_VALUES } from "@/types/entities";

export const SpeakerSchema = z.object({
  handle: requiredText("Handle is required."),
  tagline: nullableText(),
  category: nullableText(),
  followers_range: nullableText(),
  known_for: nullableText(),
  availability: nullableText(),
  bio_status: z.enum(SPEAKER_BIO_STATUS_VALUES),
});

export type SpeakerFormValues = z.infer<typeof SpeakerSchema>;
