import type { ResolvedRange } from "./ranges";

/** A figure for the selected period and the equal-length period before it. */
export type Compared = { current: number; previous: number };

export type DailyPoint = {
  /** YYYY-MM-DD in the selected period. */
  date: string;
  /** The matching day in the previous period. */
  previousDate: string;
  visitors: number;
  views: number;
  previousVisitors: number;
  previousViews: number;
};

export type TopPage = {
  path: string;
  title: string;
  views: number;
  visitors: number;
  /** Average engagement time per visitor, in seconds. */
  avgEngagementSeconds: number;
};

export type NamedCount = {
  key: string;
  label: string;
  value: number;
  previous?: number;
  /** Plain-language explanation shown under the label. */
  hint?: string;
  /** Two-letter country code, when the row is a country. */
  countryCode?: string;
};

export type OutboundKey = "tickets" | "forms" | "apps" | "instagram" | "other";

export type OutboundGroup = {
  key: OutboundKey;
  label: string;
  hint: string;
  clicks: number;
  previous: number;
  domains: string[];
};

export type AnalyticsSnapshot = {
  range: ResolvedRange;
  kpis: {
    visitors: Compared;
    newVisitors: Compared;
    sessions: Compared;
    views: Compared;
    /** 0–1 */
    engagementRate: Compared;
    /** Seconds per visitor. */
    avgEngagementSeconds: Compared;
    ticketClicks: Compared;
  };
  daily: DailyPoint[];
  topPages: TopPage[];
  channels: NamedCount[];
  sources: NamedCount[];
  countries: NamedCount[];
  devices: NamedCount[];
  outbound: OutboundGroup[];
  /** ISO timestamp of when Google Analytics was queried. */
  fetchedAt: string;
};

export type RealtimeSnapshot = {
  activeUsers: number;
  pages: { title: string; users: number }[];
  fetchedAt: string;
};
