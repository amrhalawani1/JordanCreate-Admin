import { z } from "zod";
import { requiredText, requiredUrl, nullableChipList } from "./shared";
import { SPEAKER_BIO_STATUS_VALUES } from "@/types/entities";

export const SpeakerSchema = z.object({
  handle: requiredText("Handle is required."),
  tagline: requiredText("Tagline is required."),
  category: requiredText("Category is required."),
  followers_range: requiredText("Followers range is required."),
  known_for: requiredText("Known for is required."),
  availability: requiredText("Availability is required."),
  bio_status: z.enum(SPEAKER_BIO_STATUS_VALUES),
  photo_url: requiredUrl("Photo is required."),
  tags: nullableChipList(),
});

export type SpeakerFormValues = z.input<typeof SpeakerSchema>;
