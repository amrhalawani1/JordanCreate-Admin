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
