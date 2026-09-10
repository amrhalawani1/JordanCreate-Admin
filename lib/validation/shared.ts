import { z } from "zod";
import { parseChipList } from "@/lib/utils";

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

export function requiredUrl(emptyMessage = "This field is required.", invalidMessage = "Enter a valid URL.") {
  return z
    .string()
    .trim()
    .min(1, { message: emptyMessage })
    .refine((v) => z.url().safeParse(v).success, { message: invalidMessage });
}

/** Chip-list form string (or already-parsed array) → `text[] | null`. */
export function nullableChipList() {
  return z
    .union([z.string(), z.array(z.string()), z.null()])
    .transform((value) => {
      if (value == null) return null;
      const chips = Array.isArray(value) ? value : parseChipList(value);
      const cleaned = chips.map((item) => item.trim()).filter(Boolean);
      return cleaned.length > 0 ? cleaned : null;
    });
}

export function optionalUuid(message = "Enter a valid UUID or leave blank.") {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || z.uuid().safeParse(v).success, { message });
}
