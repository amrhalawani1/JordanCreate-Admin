import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const DEFAULT_REGION: CountryCode = "JO";

function prepareInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("00")) {
    return `+${trimmed.slice(2)}`;
  }
  return trimmed;
}

export function toE164(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }

  const prepared = prepareInput(input);
  if (!prepared) {
    return null;
  }

  try {
    const parsed = parsePhoneNumberFromString(prepared, DEFAULT_REGION);
    if (parsed?.isValid()) {
      return parsed.number;
    }

    if (!prepared.startsWith("+")) {
      const asInternational = parsePhoneNumberFromString(`+${prepared}`);
      if (asInternational?.isValid()) {
        return asInternational.number;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isSameNumber(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = toE164(a);
  const right = toE164(b);
  return left !== null && right !== null && left === right;
}

export function digitsOnly(input: string | null | undefined): string {
  return (input ?? "").replace(/\D/g, "");
}

/** Search helper: `0779453525` must find `+962779453525`. */
export function phoneMatchesQuery(stored: string | null | undefined, query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  const storedNorm = toE164(stored) ?? stored ?? "";
  const queryE164 = toE164(q);
  if (queryE164 && storedNorm === queryE164) return true;
  if (queryE164 && (stored ?? "") === queryE164) return true;

  const queryDigits = digitsOnly(q);
  const storedDigits = digitsOnly(stored);
  if (queryDigits.length >= 4 && storedDigits.includes(queryDigits)) return true;
  if (queryDigits.length >= 4 && storedDigits.endsWith(queryDigits)) return true;

  return (stored ?? "").toLowerCase().includes(q.toLowerCase());
}
