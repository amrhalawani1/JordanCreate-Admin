/** Number formatting shared by every analytics figure, so tiles, lists and tooltips agree. */

const FULL = new Intl.NumberFormat("en-US");
const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 1,284 below ten thousand, 12.9K above. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Math.abs(value) >= 10_000 ? COMPACT.format(value) : FULL.format(Math.round(value));
}

/** Always the full figure, for tables and tooltips. */
export function formatExact(value: number): string {
  return Number.isFinite(value) ? FULL.format(Math.round(value)) : "—";
}

/** 0.5823 -> "58.2%" */
export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(digits).replace(/\.0+$/, "")}%`;
}

/** 84 -> "1m 24s" */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export type Delta =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "flat" }
  | { kind: "up" | "down"; ratio: number };

/** Change versus the previous period. A previous value of zero has no percentage. */
export function computeDelta(current: number, previous: number): Delta {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return { kind: "none" };
  if (previous === 0) return current === 0 ? { kind: "none" } : { kind: "new" };
  const ratio = (current - previous) / previous;
  if (Math.abs(ratio) < 0.005) return { kind: "flat" };
  return { kind: ratio > 0 ? "up" : "down", ratio };
}

/** "+12.4%" / "−3%" */
export function formatDeltaRatio(ratio: number): string {
  const pct = Math.abs(ratio * 100);
  const text = pct >= 100 ? Math.round(pct).toString() : pct.toFixed(1).replace(/\.0$/, "");
  return `${ratio >= 0 ? "+" : "−"}${text}%`;
}

/** A clean axis maximum: 0-4 ticks land on round numbers. */
export function niceCeiling(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 4;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) {
      // Keep quarter ticks whole when the scale is small.
      return candidate < 4 ? 4 : candidate;
    }
  }
  return 10 * magnitude;
}
