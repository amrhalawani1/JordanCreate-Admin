/**
 * Turns Google Analytics Data API (v1beta) report responses into the page's
 * snapshot. Pure functions: no network, no secrets, unit-tested.
 */
import { addDays, type ResolvedRange } from "./ranges";
import type { Compared, DailyPoint, NamedCount, OutboundGroup, OutboundKey, TopPage } from "./types";

export type GaRow = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

export type GaReport = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string; type?: string }[];
  rows?: GaRow[];
  totals?: GaRow[];
  rowCount?: number;
};

export type ParsedRow = { dims: Record<string, string>; metrics: Record<string, number> };

/** Names given to the two date ranges in every compared request. */
export const CURRENT = "current";
export const PREVIOUS = "previous";

export function readRows(report: GaReport | undefined): ParsedRow[] {
  if (!report?.rows?.length) return [];
  const dimNames = (report.dimensionHeaders ?? []).map((h) => h.name);
  const metricNames = (report.metricHeaders ?? []).map((h) => h.name);
  return report.rows.map((row) => {
    const dims: Record<string, string> = {};
    dimNames.forEach((name, i) => {
      dims[name] = row.dimensionValues?.[i]?.value ?? "";
    });
    const metrics: Record<string, number> = {};
    metricNames.forEach((name, i) => {
      const n = Number(row.metricValues?.[i]?.value ?? 0);
      metrics[name] = Number.isFinite(n) ? n : 0;
    });
    return { dims, metrics };
  });
}

/** With two named date ranges GA adds a "dateRange" dimension holding the name. */
function isPrevious(row: ParsedRow): boolean {
  return row.dims.dateRange === PREVIOUS;
}

export type TotalsMetrics = Record<string, Compared>;

/** One row per date range, no other dimensions. Missing rows mean zero traffic. */
export function parseTotals(report: GaReport | undefined, metricNames: string[]): TotalsMetrics {
  const out: TotalsMetrics = {};
  for (const name of metricNames) out[name] = { current: 0, previous: 0 };
  for (const row of readRows(report)) {
    const side = isPrevious(row) ? "previous" : "current";
    for (const name of metricNames) out[name][side] += row.metrics[name] ?? 0;
  }
  return out;
}

/**
 * Daily series keyed by GA's nthDay (days since the start of each range), so
 * day 3 of this period lines up with day 3 of the previous one. Days GA does
 * not return are zero.
 */
export function parseDaily(report: GaReport | undefined, range: ResolvedRange): DailyPoint[] {
  const points: DailyPoint[] = Array.from({ length: range.days }, (_, i) => ({
    date: addDays(range.start, i),
    previousDate: addDays(range.previousStart, i),
    visitors: 0,
    views: 0,
    previousVisitors: 0,
    previousViews: 0,
  }));
  for (const row of readRows(report)) {
    const index = Number.parseInt(row.dims.nthDay ?? "", 10);
    const point = points[index];
    if (!point) continue;
    if (isPrevious(row)) {
      point.previousVisitors += row.metrics.activeUsers ?? 0;
      point.previousViews += row.metrics.screenPageViews ?? 0;
    } else {
      point.visitors += row.metrics.activeUsers ?? 0;
      point.views += row.metrics.screenPageViews ?? 0;
    }
  }
  return points;
}

const SITE_TITLE_SUFFIX = /\s*[|·\-–—]\s*Jordan Create\b.*$/i;

const PATH_LABELS: Record<string, string> = {
  "/": "Home",
  "/speakers": "Speakers",
  "/agenda": "Agenda",
  "/about-us": "About us",
  "/community": "Community",
  "/editions": "Editions",
  "/partner-with-us": "Partner with us",
  "/privacy": "Privacy policy",
  "/terms": "Terms of use",
  "/support": "App support",
  "/delete-account": "Delete account",
};

export function normalizePath(path: string): string {
  const clean = (path || "/").split(/[?#]/)[0] || "/";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

/** A readable page name: the page's own title minus the site suffix, else a name from its path. */
export function pageLabel(path: string, title: string): string {
  const trimmed = title.replace(SITE_TITLE_SUFFIX, "").trim();
  if (trimmed && trimmed.toLowerCase() !== "(not set)" && trimmed.toLowerCase() !== "jordan create") return trimmed;
  const known = PATH_LABELS[path];
  if (known) return known;
  const last = path.split("/").filter(Boolean).pop();
  if (!last) return "Home";
  return decodeURIComponent(last)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Rows are (pagePath, pageTitle); a page with several titles is merged under its busiest one. */
export function parseTopPages(report: GaReport | undefined, limit = 10): TopPage[] {
  const byPath = new Map<string, { views: number; visitors: number; engagement: number; title: string; titleViews: number }>();
  for (const row of readRows(report)) {
    const path = normalizePath(row.dims.pagePath ?? "/");
    const views = row.metrics.screenPageViews ?? 0;
    const entry = byPath.get(path) ?? { views: 0, visitors: 0, engagement: 0, title: "", titleViews: -1 };
    entry.views += views;
    entry.visitors += row.metrics.activeUsers ?? 0;
    entry.engagement += row.metrics.userEngagementDuration ?? 0;
    if (views > entry.titleViews) {
      entry.title = row.dims.pageTitle ?? "";
      entry.titleViews = views;
    }
    byPath.set(path, entry);
  }
  return [...byPath.entries()]
    .map(([path, e]) => ({
      path,
      title: pageLabel(path, e.title),
      views: e.views,
      visitors: e.visitors,
      avgEngagementSeconds: e.visitors > 0 ? e.engagement / e.visitors : 0,
    }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, limit);
}

const CHANNEL_HINTS: Record<string, string> = {
  "Organic Social": "Unpaid posts on Instagram, TikTok, Facebook and others",
  "Paid Social": "Paid social media ads",
  Direct: "Typed the address, used a bookmark, or the source was hidden",
  "Organic Search": "Google and other search engines",
  "Paid Search": "Paid search ads",
  Referral: "Links on other websites",
  Email: "Links in emails and newsletters",
  "Organic Video": "YouTube and other video sites",
  "Paid Video": "Paid video ads",
  "Organic Shopping": "Shopping listings",
  Display: "Display and banner ads",
  "Cross-network": "Ads running across several Google networks",
  "Mobile Push Notifications": "Push notifications",
  SMS: "Text messages",
  Affiliates: "Affiliate links",
  Unassigned: "Google Analytics could not tell where these came from",
};

/** Keeps the top rows and folds the rest into "Other" so the list never needs a ninth color or row. */
function foldTail(items: NamedCount[], keep: number, otherHint: string): NamedCount[] {
  if (items.length <= keep + 1) return items;
  const head = items.slice(0, keep);
  const tail = items.slice(keep);
  const other: NamedCount = {
    key: "__other",
    label: "Other",
    value: tail.reduce((sum, item) => sum + item.value, 0),
    hint: otherHint,
  };
  if (tail.some((item) => item.previous !== undefined)) {
    other.previous = tail.reduce((sum, item) => sum + (item.previous ?? 0), 0);
  }
  return [...head, other];
}

/** Rows are (sessionDefaultChannelGroup, dateRange) with a sessions metric. */
export function parseChannels(report: GaReport | undefined, keep = 6): NamedCount[] {
  const map = new Map<string, Compared>();
  for (const row of readRows(report)) {
    const name = row.dims.sessionDefaultChannelGroup || "Unassigned";
    const entry = map.get(name) ?? { current: 0, previous: 0 };
    entry[isPrevious(row) ? "previous" : "current"] += row.metrics.sessions ?? 0;
    map.set(name, entry);
  }
  const items = [...map.entries()]
    .filter(([, v]) => v.current > 0)
    .sort((a, b) => b[1].current - a[1].current || a[0].localeCompare(b[0]))
    .map(([name, v]) => ({ key: name, label: name, value: v.current, previous: v.previous, hint: CHANNEL_HINTS[name] }));
  return foldTail(items, keep, "Smaller channels combined");
}

export function sourceLabel(source: string): string {
  const s = source.trim();
  if (!s || s === "(direct)") return "Direct";
  if (s === "(not set)") return "Unknown";
  return s;
}

export function sourceHint(source: string): string | undefined {
  const s = source.toLowerCase();
  if (s === "(direct)") return "No referring site";
  if (s.includes("instagram")) return s.startsWith("l.") || s.startsWith("lm.") ? "Instagram link (in-app)" : "Instagram";
  if (s.includes("facebook")) return "Facebook";
  if (s === "google") return "Google Search";
  if (s.includes("tiktok")) return "TikTok";
  if (s.includes("linkedin")) return "LinkedIn";
  if (s.includes("whatsapp") || s === "wa.me") return "WhatsApp";
  if (s === "t.co" || s.includes("twitter") || s === "x.com") return "X (Twitter)";
  return undefined;
}

/** Rows are (sessionSource) with a sessions metric. */
export function parseSources(report: GaReport | undefined, keep = 7): NamedCount[] {
  const items = readRows(report)
    .map((row) => {
      const raw = row.dims.sessionSource ?? "";
      return { key: raw || "(direct)", label: sourceLabel(raw), value: row.metrics.sessions ?? 0, hint: sourceHint(raw) };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  return foldTail(items, keep, "Smaller sources combined");
}

/** Rows are (country, countryId) with activeUsers. */
export function parseCountries(report: GaReport | undefined, keep = 7): NamedCount[] {
  const items = readRows(report)
    .map((row) => {
      const name = row.dims.country && row.dims.country !== "(not set)" ? row.dims.country : "Unknown";
      const code = /^[A-Z]{2}$/.test(row.dims.countryId ?? "") ? row.dims.countryId : undefined;
      return { key: code ?? name, label: name, value: row.metrics.activeUsers ?? 0, countryCode: code };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  return foldTail(items, keep, "Other countries combined");
}

/** Fixed order and identity for devices; the colour follows the device, never its rank. */
export const DEVICE_ORDER = ["mobile", "desktop", "tablet", "other"] as const;
export type DeviceKey = (typeof DEVICE_ORDER)[number];
const DEVICE_LABELS: Record<DeviceKey, string> = { mobile: "Mobile", desktop: "Desktop", tablet: "Tablet", other: "Other" };

/** Rows are (deviceCategory) with activeUsers. Always returns the known devices in fixed order. */
export function parseDevices(report: GaReport | undefined): NamedCount[] {
  const totals: Record<DeviceKey, number> = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
  for (const row of readRows(report)) {
    const raw = (row.dims.deviceCategory ?? "").toLowerCase();
    const key: DeviceKey = raw === "mobile" || raw === "desktop" || raw === "tablet" ? raw : "other";
    totals[key] += row.metrics.activeUsers ?? 0;
  }
  return DEVICE_ORDER.filter((key) => key !== "other" || totals.other > 0).map((key) => ({
    key,
    label: DEVICE_LABELS[key],
    value: totals[key],
  }));
}

const OUTBOUND_GROUPS: { key: OutboundKey; label: string; hint: string; match: (domain: string) => boolean }[] = [
  {
    key: "tickets",
    label: "Ticket store",
    hint: "Buy Tickets clicks that went to Tzkrti",
    match: (d) => d === "tzkrti.com" || d.endsWith(".tzkrti.com"),
  },
  {
    key: "forms",
    label: "Application forms",
    hint: "Speaker, partner and volunteer forms on Tally",
    match: (d) => d === "tally.so" || d.endsWith(".tally.so"),
  },
  {
    key: "apps",
    label: "App downloads",
    hint: "App Store and Google Play links",
    match: (d) => d === "apps.apple.com" || d === "play.google.com" || d === "testflight.apple.com",
  },
  {
    key: "instagram",
    label: "Instagram",
    hint: "Speaker, partner and Jordan Create profiles",
    match: (d) => d === "instagram.com" || d.endsWith(".instagram.com"),
  },
];

export function outboundGroupFor(domain: string): OutboundKey {
  const d = domain.trim().toLowerCase().replace(/^www\./, "");
  return OUTBOUND_GROUPS.find((group) => group.match(d))?.key ?? "other";
}

/**
 * Rows are (linkDomain, dateRange) with eventCount, filtered to GA's enhanced
 * measurement "click" event (outbound links). The ticket store row is always
 * present because it is the number the team cares about most.
 */
export function parseOutbound(report: GaReport | undefined): OutboundGroup[] {
  const groups = new Map<OutboundKey, OutboundGroup>();
  for (const g of OUTBOUND_GROUPS) {
    groups.set(g.key, { key: g.key, label: g.label, hint: g.hint, clicks: 0, previous: 0, domains: [] });
  }
  groups.set("other", { key: "other", label: "Other sites", hint: "", clicks: 0, previous: 0, domains: [] });

  for (const row of readRows(report)) {
    const domain = (row.dims.linkDomain ?? "").trim().toLowerCase().replace(/^www\./, "");
    if (!domain || domain === "(not set)") continue;
    const group = groups.get(outboundGroupFor(domain))!;
    const count = row.metrics.eventCount ?? 0;
    if (isPrevious(row)) group.previous += count;
    else {
      group.clicks += count;
      if (count > 0 && !group.domains.includes(domain)) group.domains.push(domain);
    }
  }
  const other = groups.get("other")!;
  other.hint = other.domains.slice(0, 3).join(", ") || "Any other outbound link";

  return [...groups.values()].filter((g) => g.key === "tickets" || g.clicks > 0 || g.previous > 0);
}
