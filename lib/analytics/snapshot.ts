import "server-only";

import type { AnalyticsConfig } from "./config";
import { cached } from "./cache";
import { batchRunReports, runRealtimeReport } from "./ga-client";
import {
  CURRENT,
  PREVIOUS,
  parseChannels,
  parseCountries,
  parseDaily,
  parseDevices,
  parseOperatingSystems,
  parseOutbound,
  parseSources,
  parseTopPages,
  parseTotals,
  readRows,
  screenLabel,
} from "./parse";
import type { ResolvedRange } from "./ranges";
import type { AnalyticsSnapshot, RealtimeSnapshot } from "./types";

const SNAPSHOT_TTL_MS = 10 * 60 * 1000;
const REALTIME_TTL_MS = 60 * 1000;

const TOTAL_METRICS = [
  "activeUsers",
  "newUsers",
  "sessions",
  "screenPageViews",
  "engagementRate",
  "userEngagementDuration",
] as const;

function compared(range: ResolvedRange) {
  return [
    { startDate: range.start, endDate: range.end, name: CURRENT },
    { startDate: range.previousStart, endDate: range.previousEnd, name: PREVIOUS },
  ];
}

function current(range: ResolvedRange) {
  return [{ startDate: range.start, endDate: range.end }];
}

const metrics = (...names: string[]) => names.map((name) => ({ name }));
const dimensions = (...names: string[]) => names.map((name) => ({ name }));
const byMetricDesc = (metricName: string) => [{ metric: { metricName }, desc: true }];

async function loadSnapshot(config: AnalyticsConfig, range: ResolvedRange): Promise<AnalyticsSnapshot> {
  const first = [
    // 0 · headline totals, this period and the previous one
    { dateRanges: compared(range), metrics: metrics(...TOTAL_METRICS) },
    // 1 · daily visitors and views, aligned by day-of-range
    {
      dateRanges: compared(range),
      dimensions: dimensions("nthDay"),
      metrics: metrics("activeUsers", "screenPageViews"),
      limit: 400,
    },
    // 2 · pages
    {
      dateRanges: current(range),
      dimensions: dimensions("pagePath", "pageTitle"),
      metrics: metrics("screenPageViews", "activeUsers", "userEngagementDuration"),
      orderBys: byMetricDesc("screenPageViews"),
      limit: 60,
    },
    // 3 · channels, compared
    {
      dateRanges: compared(range),
      dimensions: dimensions("sessionDefaultChannelGroup"),
      metrics: metrics("sessions"),
      limit: 50,
    },
    // 4 · outbound clicks (enhanced measurement "click" event), compared
    {
      dateRanges: compared(range),
      dimensions: dimensions("linkDomain"),
      metrics: metrics("eventCount"),
      dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "click" } } },
      limit: 100,
    },
  ];
  const second = [
    {
      dateRanges: current(range),
      dimensions: dimensions("sessionSource"),
      metrics: metrics("sessions"),
      orderBys: byMetricDesc("sessions"),
      limit: 25,
    },
    {
      dateRanges: current(range),
      dimensions: dimensions("country", "countryId"),
      metrics: metrics("activeUsers"),
      orderBys: byMetricDesc("activeUsers"),
      limit: 25,
    },
    { dateRanges: current(range), dimensions: dimensions("deviceCategory"), metrics: metrics("activeUsers") },
    {
      dateRanges: current(range),
      dimensions: dimensions("operatingSystem"),
      metrics: metrics("activeUsers"),
      orderBys: byMetricDesc("activeUsers"),
      limit: 25,
    },
  ];

  const [[totalsReport, dailyReport, pagesReport, channelsReport, outboundReport], [sourcesReport, countriesReport, devicesReport, osReport]] =
    await Promise.all([batchRunReports(config, first), batchRunReports(config, second)]);

  const totals = parseTotals(totalsReport, [...TOTAL_METRICS]);
  const outbound = parseOutbound(outboundReport);
  const tickets = outbound.find((group) => group.key === "tickets");
  const perVisitor = (side: "current" | "previous") =>
    totals.activeUsers[side] > 0 ? totals.userEngagementDuration[side] / totals.activeUsers[side] : 0;

  return {
    range,
    kpis: {
      visitors: totals.activeUsers,
      newVisitors: totals.newUsers,
      sessions: totals.sessions,
      views: totals.screenPageViews,
      engagementRate: totals.engagementRate,
      avgEngagementSeconds: { current: perVisitor("current"), previous: perVisitor("previous") },
      ticketClicks: { current: tickets?.clicks ?? 0, previous: tickets?.previous ?? 0 },
    },
    daily: parseDaily(dailyReport, range),
    topPages: parseTopPages(pagesReport),
    channels: parseChannels(channelsReport),
    sources: parseSources(sourcesReport),
    countries: parseCountries(countriesReport),
    devices: parseDevices(devicesReport),
    operatingSystems: parseOperatingSystems(osReport),
    outbound,
    fetchedAt: new Date().toISOString(),
  };
}

export function getSnapshot(config: AnalyticsConfig, range: ResolvedRange): Promise<AnalyticsSnapshot> {
  return cached(`snapshot:${config.propertyId}:${range.key}:${range.end}`, SNAPSHOT_TTL_MS, () =>
    loadSnapshot(config, range),
  );
}

export function getRealtime(config: AnalyticsConfig): Promise<RealtimeSnapshot> {
  return cached(`realtime:${config.propertyId}`, REALTIME_TTL_MS, async () => {
    const report = await runRealtimeReport(config, {
      dimensions: dimensions("unifiedScreenName"),
      metrics: metrics("activeUsers"),
      metricAggregations: ["TOTAL"],
      orderBys: byMetricDesc("activeUsers"),
      limit: 5,
    });
    const total = Number(report.totals?.[0]?.metricValues?.[0]?.value ?? 0);
    const pages = readRows(report).map((row) => ({
      title: screenLabel(row.dims.unifiedScreenName ?? "") || "Untitled page",
      users: row.metrics.activeUsers ?? 0,
    }));
    return {
      activeUsers: Number.isFinite(total) && total > 0 ? total : pages.reduce((sum, p) => sum + p.users, 0),
      pages,
      fetchedAt: new Date().toISOString(),
    };
  });
}
