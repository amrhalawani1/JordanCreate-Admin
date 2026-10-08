import type { Speaker } from "@/types/entities";

/** How many speakers jordancreate.com shows on the home page before "All speakers". */
export const HOMEPAGE_SPEAKER_LIMIT = 15;

/** Same ranking the website uses when no order is saved: biggest audience first. */
export function followersRank(range: string | null | undefined): number {
  const r = (range ?? "").trim().toLowerCase();
  if (r.startsWith("5m")) return 6;
  if (r.startsWith("1m")) return 5;
  if (r.startsWith("250k")) return 4;
  if (r.startsWith("50k")) return 3;
  if (r.startsWith("10k")) return 2;
  if (r.startsWith("under")) return 1;
  return 0;
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
