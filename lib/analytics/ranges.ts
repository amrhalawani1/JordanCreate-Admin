/**
 * Date ranges for the Website Analytics page.
 *
 * Ranges are computed here in the event's time zone (Amman), instead of GA's
 * relative "7daysAgo" strings, so the chart can line "this period" and "the
 * previous period" up point by point with plain string arithmetic.
 *
 * Day ranges are whole calendar days and include today so far. Hour ranges
 * (24 and 48 hours) are rolling: the current hour and the ones before it.
 * GA's Data API only takes whole dates, so an hour range asks for the dates it
 * touches and filters to its own hours with the dateHour dimension.
 */

export const ANALYTICS_TIME_ZONE = "Asia/Amman";

export type RangeUnit = "hour" | "day";

export const RANGE_PRESETS = [
  { key: "24h", unit: "hour", count: 24, label: "24 hrs", name: "24 hours", previous: "previous 24 hours" },
  { key: "48h", unit: "hour", count: 48, label: "48 hrs", name: "48 hours", previous: "previous 48 hours" },
  { key: "3d", unit: "day", count: 3, label: "3 days", name: "3 days", previous: "previous 3 days" },
  { key: "7d", unit: "day", count: 7, label: "1 week", name: "1 week", previous: "previous week" },
  { key: "14d", unit: "day", count: 14, label: "2 weeks", name: "2 weeks", previous: "previous 2 weeks" },
  { key: "21d", unit: "day", count: 21, label: "3 weeks", name: "3 weeks", previous: "previous 3 weeks" },
  { key: "30d", unit: "day", count: 30, label: "1 month", name: "1 month", previous: "previous month" },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]["key"];

export const DEFAULT_RANGE: RangeKey = "30d";

export type ResolvedRange = {
  key: RangeKey;
  unit: RangeUnit;
  /** "1 week" */
  label: string;
  /** "previous week", for comparisons. */
  previousLabel: string;
  /**
   * One entry per chart point, oldest first: YYYY-MM-DD for day ranges,
   * GA's YYYYMMDDHH for hour ranges.
   */
  points: string[];
  previousPoints: string[];
  /** Inclusive YYYY-MM-DD dates the GA request spans. */
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

/** The current hour in the given time zone, as GA's YYYYMMDDHH. */
export function currentHourIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}`;
}

/** Calendar arithmetic on YYYY-MM-DD strings; time-zone free. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Wall-clock arithmetic on YYYYMMDDHH strings; time-zone free. */
export function addHours(hour: string, hours: number): string {
  const date = hourToUtc(hour);
  date.setUTCHours(date.getUTCHours() + hours);
  const iso = date.toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(11, 13)}`;
}

/** "2026101214" → "2026-10-12" */
export function hourToDate(hour: string): string {
  return `${hour.slice(0, 4)}-${hour.slice(4, 6)}-${hour.slice(6, 8)}`;
}

function hourToUtc(hour: string): Date {
  return new Date(Date.UTC(Number(hour.slice(0, 4)), Number(hour.slice(4, 6)) - 1, Number(hour.slice(6, 8)), Number(hour.slice(8, 10))));
}

function series<T>(count: number, at: (i: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => at(i));
}

export function resolveRange(key: RangeKey, now: Date = new Date()): ResolvedRange {
  const preset = RANGE_PRESETS.find((p) => p.key === key) ?? RANGE_PRESETS.find((p) => p.key === DEFAULT_RANGE)!;
  const base = { key: preset.key, unit: preset.unit, label: preset.name, previousLabel: preset.previous };
  const n = preset.count;

  if (preset.unit === "hour") {
    const last = currentHourIn(ANALYTICS_TIME_ZONE, now);
    const first = addHours(last, -(n - 1));
    const points = series(n, (i) => addHours(first, i));
    const previousPoints = series(n, (i) => addHours(first, i - n));
    return {
      ...base,
      points,
      previousPoints,
      start: hourToDate(points[0]),
      end: hourToDate(points[n - 1]),
      previousStart: hourToDate(previousPoints[0]),
      previousEnd: hourToDate(previousPoints[n - 1]),
    };
  }

  const end = todayIn(ANALYTICS_TIME_ZONE, now);
  const start = addDays(end, -(n - 1));
  const previousStart = addDays(start, -n);
  return {
    ...base,
    points: series(n, (i) => addDays(start, i)),
    previousPoints: series(n, (i) => addDays(previousStart, i)),
    start,
    end,
    previousStart,
    previousEnd: addDays(start, -1),
  };
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

/** "14:00" */
function clock(hour: string): string {
  return `${hour.slice(8, 10)}:00`;
}

/** A chart axis label: "11 Oct" for a day, "14:00" for an hour. */
export function formatPointShort(point: string, unit: RangeUnit): string {
  return unit === "hour" ? clock(point) : formatShortDate(point);
}

/** A tooltip or table label: "Sat 11 Oct" for a day, "Sat 11 Oct, 14:00" for an hour. */
export function formatPointLong(point: string, unit: RangeUnit): string {
  return unit === "hour" ? `${formatLongDate(hourToDate(point))}, ${clock(point)}` : formatLongDate(point);
}

/** A compact label for the matching point in the previous period. */
export function formatPreviousPoint(point: string, unit: RangeUnit): string {
  return unit === "hour" ? `${formatShortDate(hourToDate(point))}, ${clock(point)}` : formatShortDate(point);
}

/** "14 Sep – 11 Oct", or "11 Oct, 15:00 – now" for hour ranges. */
export function formatPeriod(range: ResolvedRange, which: "current" | "previous"): string {
  const points = which === "current" ? range.points : range.previousPoints;
  if (range.unit === "day") return formatRangeSpan(points[0], points[points.length - 1]);
  const from = formatPreviousPoint(points[0], "hour");
  const to = which === "current" ? "now" : formatPreviousPoint(addHours(points[points.length - 1], 1), "hour");
  return `${from} – ${to}`;
}
