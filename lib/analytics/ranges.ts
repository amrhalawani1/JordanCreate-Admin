/**
 * Date ranges for the Website Analytics page.
 *
 * Ranges are computed here as explicit YYYY-MM-DD dates in the event's time
 * zone (Amman), instead of GA's relative "7daysAgo" strings, so the daily
 * chart can align "this period" and "the previous period" day by day with
 * plain string arithmetic. Each range includes today so far.
 */

export const ANALYTICS_TIME_ZONE = "Asia/Amman";

export const RANGE_PRESETS = [
  { key: "7d", days: 7, label: "7 days" },
  { key: "28d", days: 28, label: "28 days" },
  { key: "90d", days: 90, label: "90 days" },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]["key"];

export const DEFAULT_RANGE: RangeKey = "28d";

export type ResolvedRange = {
  key: RangeKey;
  days: number;
  label: string;
  /** Inclusive YYYY-MM-DD. */
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
};

export function parseRangeKey(value: unknown): RangeKey {
  return RANGE_PRESETS.some((preset) => preset.key === value) ? (value as RangeKey) : DEFAULT_RANGE;
}

/** Today's calendar date (YYYY-MM-DD) in the given time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Calendar arithmetic on YYYY-MM-DD strings; time-zone free. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function resolveRange(key: RangeKey, now: Date = new Date()): ResolvedRange {
  const preset = RANGE_PRESETS.find((p) => p.key === key) ?? RANGE_PRESETS[1];
  const end = todayIn(ANALYTICS_TIME_ZONE, now);
  const start = addDays(end, -(preset.days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(preset.days - 1));
  return { key: preset.key, days: preset.days, label: preset.label, start, end, previousStart, previousEnd };
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** "11 Oct" */
export function formatShortDate(isoDate: string): string {
  const date = toUtcDate(isoDate);
  return `${date.getUTCDate()} ${MONTH.format(date)}`;
}

/** "Sat 11 Oct" */
export function formatLongDate(isoDate: string): string {
  return `${WEEKDAY.format(toUtcDate(isoDate))} ${formatShortDate(isoDate)}`;
}

/** "14 Sep – 11 Oct" */
export function formatRangeSpan(start: string, end: string): string {
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}
