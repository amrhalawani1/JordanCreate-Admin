import { z } from "zod";
import { GUEST_ARRIVAL_STATUS_VALUES, GUEST_GENDER_VALUES } from "@/types/entities";
import { nullableText, optionalUrl, nullableChipList, optionalUuid } from "./shared";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;
const SLUG = /^[a-z0-9][a-z0-9._-]*$/;

/** Optional enum: the form sends "" for "not set", the database stores null. */
function nullableEnum<const T extends readonly [string, ...string[]]>(values: T, message: string) {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v): v is T[number] | null => v === null || (values as readonly string[]).includes(v), { message });
}

export const GuestProfileSchema = z.object({
  guest_id: optionalUuid(),
  guest_name: nullableText(),
  email: nullableText().refine((v) => v === null || z.email().safeParse(v).success, {
    message: "Enter a valid email address.",
  }),
  phone_number: nullableText(),
  birthdate: nullableText().refine((v) => v === null || ISO_DATE.test(v), {
    message: "Birthdate must be a date (YYYY-MM-DD).",
  }),
  gender: nullableEnum(GUEST_GENDER_VALUES, "Gender must be male or female, or left blank."),
  country: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toUpperCase()))
    .nullable()
    .refine((v) => v === null || COUNTRY_CODE.test(v), {
      message: "Country must be a 2-letter ISO code, e.g. JO.",
    }),
  stated_interests: nullableChipList(),
  arrival_status: nullableEnum(GUEST_ARRIVAL_STATUS_VALUES, "Arrival status must be not_arrived or arrived."),
  vip_flag: z.boolean(),
  role: nullableText(),
  bio: nullableText(),
  photo_url: optionalUrl(),
  location: nullableText(),
  slug: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .refine((v) => v === null || SLUG.test(v), {
      message: "Handle may only use lowercase letters, digits, dots, dashes, or underscores.",
    }),
  manychat_subscriber_id: nullableText(),
  attended_jc1: z.boolean(),
  attended_jc2: z.boolean(),
});

export type GuestProfileFormValues = z.input<typeof GuestProfileSchema>;
