import { z } from "zod";
import { nullableText, optionalUrl, nullableChipList, optionalUuid } from "./shared";

export const GuestProfileSchema = z.object({
  guest_id: optionalUuid(),
  guest_name: nullableText(),
  stated_interests: nullableChipList(),
  arrival_status: nullableText(),
  vip_flag: z.boolean(),
  role: nullableText(),
  bio: nullableText(),
  photo_url: optionalUrl(),
  location: nullableText(),
  phone_number: nullableText(),
  attended_jc1: z.boolean(),
  attended_jc2: z.boolean(),
});

export type GuestProfileFormValues = z.input<typeof GuestProfileSchema>;
