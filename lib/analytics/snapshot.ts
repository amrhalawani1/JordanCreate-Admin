import "server-only";

import type { AnalyticsConfig } from "./config";
import { cached } from "./cache";
import { batchRunReports, runRealtimeReport } from "./ga-client";
import {
  CURRENT,
  PREVIOUS,
  mergeCompared,
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
  type GaReport,
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

type GaRequest = Record<string, unknown>;

/** One logical report: the GA requests it needs and how to read their answers back as one. */
type Planned = { requests: GaRequest[]; combine: (reports: (GaReport | undefined)[]) => GaReport | undefined };

function onlyHours(request: GaRequest, hours: string[]): GaRequest {
  const hourFilter = { filter: { fieldName: "dateHour", inListFilter: { values: hours } } };
  const existing = request.dimensionFilter;
  return { ...request, dimensionFilter: existing ? { andGroup: { expressions: [existing, hourFilter] } } : hourFilter };
}

/**
 * Day ranges: one request, with the previous period as a second named date
 * range when compared. Hour ranges: one request per period, each filtered to
 * its own hours, merged back into the two-range shape.
 */
function plan(range: ResolvedRange, base: GaRequest, compare: boolean): Planned {
  const span = (start: string, end: string, name?: string) => ({ startDate: start, endDate: end, ...(name ? { name } : {}) });
  if (range.unit === "day") {
    const dateRanges = compare
      ? [span(range.start, range.end, CURRENT), span(range.previousStart, range.previousEnd, PREVIOUS)]
      : [span(range.start, range.end)];
    return { requests: [{ ...base, dateRanges }], combine: ([report]) => report };
  }
  const current = onlyHours({ ...base, dateRanges: [span(range.start, range.end)] }, range.points);
  if (!compare) return { requests: [current], combine: ([report]) => report };
  const previous = onlyHours({ ...base, dateRanges: [span(range.previousStart, range.previousEnd)] }, range.previousPoints);
  return { requests: [current, previous], combine: ([a, b]) => mergeCompared(a, b) };
}

/** Runs every planned report through batchRunReports (five requests per batch, batches in parallel). */
async function runPlanned(config: AnalyticsConfig, planned: Planned[]): Promise<(GaReport | undefined)[]> {
  const requests = planned.flatMap((p) => p.requests);
  const batches: GaRequest[][] = [];
  for (let i = 0; i < requests.length; i += 5) batches.push(requests.slice(i, i + 5));
  const reports = (await Promise.all(batches.map((batch) => batchRunReports(config, batch)))).flat();
  let cursor = 0;
  return planned.map((p) => {
    const mine = reports.slice(cursor, cursor + p.requests.length);
    cursor += p.requests.length;
    return p.combine(mine);
  });
}

const metrics = (...names: string[]) => names.map((name) => ({ name }));
const dimensions = (...names: string[]) => names.map((name) => ({ name }));
const byMetricDesc = (metricName: string) => [{ metric: { metricName }, desc: true }];

async function loadSnapshot(config: AnalyticsConfig, range: ResolvedRange): Promise<AnalyticsSnapshot> {
  const compared = (base: GaRequest) => plan(range, base, true);
  const current = (base: GaRequest) => plan(range, base, false);
  const [
    totalsReport,
    dailyReport,
    pagesReport,
    channelsReport,
    outboundReport,
    sourcesReport,
    countriesReport,
    devicesReport,
    osReport,
  ] = await runPlanned(config, [
    // headline totals, this period and the previous one
    compared({ metrics: metrics(...TOTAL_METRICS) }),
    // visitors and views per day (or hour), aligned point by point
    compared({
      dimensions: dimensions(range.unit === "hour" ? "dateHour" : "nthDay"),
      metrics: metrics("activeUsers", "screenPageViews"),
      limit: 400,
    }),
    // pages
    current({
      dimensions: dimensions("pagePath", "pageTitle"),
      metrics: metrics("screenPageViews", "activeUsers", "userEngagementDuration"),
      orderBys: byMetricDesc("screenPageViews"),
      limit: 60,
    }),
    // channels, compared
    compared({ dimensions: dimensions("sessionDefaultChannelGroup"), metrics: metrics("sessions"), limit: 50 }),
    // outbound clicks (enhanced measurement "click" event), compared
    compared({
      dimensions: dimensions("linkDomain"),
      metrics: metrics("eventCount"),
      dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "click" } } },
      limit: 100,
    }),
    current({ dimensions: dimensions("sessionSource"), metrics: metrics("sessions"), orderBys: byMetricDesc("sessions"), limit: 25 }),
    current({
      dimensions: dimensions("country", "countryId"),
      metrics: metrics("activeUsers"),
      orderBys: byMetricDesc("activeUsers"),
      limit: 25,
    }),
    current({ dimensions: dimensions("deviceCategory"), metrics: metrics("activeUsers") }),
    current({
      dimensions: dimensions("operatingSystem"),
      metrics: metrics("activeUsers"),
      orderBys: byMetricDesc("activeUsers"),
      limit: 25,
    }),
  ]);

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
  return cached(`snapshot:${config.propertyId}:${range.key}:${range.points[range.points.length - 1]}`, SNAPSHOT_TTL_MS, () =>
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
