import type { Speaker } from "@/types/entities";

/** How many speakers jordancreate.com shows on the home page before "All speakers". */
export const HOMEPAGE_SPEAKER_LIMIT = 15;

/**
 * Sort key for a follower value as the admin stores it: an exact figure
 * ("9.2M", "152K", "1,877") or one of the old bands ("50K-250K", "5M+", "Under 10K").
 * Returns an approximate follower count; unknown text sorts last.
 */
export function followersRank(range: string | null | undefined): number {
  const r = (range ?? "").trim().toLowerCase().replace(/,/g, "");
  if (!r) return 0;
  if (r.startsWith("under")) return 1;
  const m = r.match(/^(\d+(?:\.\d+)?)\s*([km])?/);
  if (!m) return 0;
  const n = parseFloat(m[1] ?? "0");
  const mult = m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1_000 : 1;
  const value = n * mult;
  // Bands ("250K-1M", "5M+") rank at their lower bound, like before.
  return Number.isFinite(value) ? value : 0;
}

/**
 * Live speakers in homepage order: the saved handles first (skipping any that
 * are archived or gone), then everyone else by audience size, then name.
 */
export function orderForHomepage(liveSpeakers: Speaker[], savedOrder: string[]): Speaker[] {
  const byHandle = new Map(liveSpeakers.map((s) => [s.handle, s]));
  const listed: Speaker[] = [];
  const seen = new Set<string>();
  for (const handle of savedOrder) {
    const s = byHandle.get(handle);
    if (s && !seen.has(handle)) {
      listed.push(s);
      seen.add(handle);
    }
  }
  const rest = liveSpeakers
    .filter((s) => !seen.has(s.handle))
    .sort(
      (a, b) =>
        followersRank(b.followers_range) - followersRank(a.followers_range) ||
        a.handle.localeCompare(b.handle),
    );
  return [...listed, ...rest];
}
