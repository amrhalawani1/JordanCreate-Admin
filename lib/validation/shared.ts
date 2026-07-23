import { z } from "zod";

/**
 * A text field that stores `null` in the database when empty, instead of an
 * empty string. Used for every nullable text column so "leave it blank"
 * round-trips correctly.
 */
export function nullableText() {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable();
}

export function requiredText(message = "This field is required.") {
  return z.string().trim().min(1, { message });
}

export function optionalUrl(message = "Enter a valid URL.") {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || z.url().safeParse(v).success, {
      message,
    });
}
