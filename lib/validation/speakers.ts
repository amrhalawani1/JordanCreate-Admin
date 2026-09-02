import { z } from "zod";
import { requiredText, nullableText, optionalUrl, nullableChipList } from "./shared";
import { SPEAKER_BIO_STATUS_VALUES } from "@/types/entities";

export const SpeakerSchema = z.object({
  handle: requiredText("Handle is required."),
  tagline: nullableText(),
  category: nullableText(),
  followers_range: nullableText(),
  known_for: nullableText(),
  availability: nullableText(),
  bio_status: z.enum(SPEAKER_BIO_STATUS_VALUES),
  photo_url: optionalUrl(),
  tags: nullableChipList(),
});

export type SpeakerFormValues = z.input<typeof SpeakerSchema>;
