import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** brand_voice.values_text is stored as a semicolon-separated list. */
export function parseChipList(value: string): string[] {
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
}

export function serializeChipList(chips: string[]): string {
  return chips.join("; ")
}

/** Safe Storage object name from a handle, guest id, or partner name. */
export function sanitizeMediaSlug(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 80);
}
