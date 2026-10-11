import test from "node:test";
import assert from "node:assert/strict";
import { addDays, parseRangeKey, resolveRange, todayIn } from "./ranges";
import { computeDelta, formatCount, formatDeltaRatio, formatDuration, formatPercent, niceCeiling } from "./format";
import { readAnalyticsConfig } from "./config";
import { classifyFederationError, classifyGoogleError } from "./errors";
import {
  outboundGroupFor,
  pageLabel,
  parseChannels,
  parseCountries,
  parseDaily,
  parseDevices,
  parseOutbound,
  parseTopPages,
  parseTotals,
  type GaReport,
} from "./parse";

const NOW = new Date("2026-10-11T21:30:00Z"); // 00:30 on 12 Oct in Amman

test("ranges use the Amman calendar day and line the previous period up behind the current one", () => {
  assert.equal(todayIn("Asia/Amman", NOW), "2026-10-12");
  const r = resolveRange("7d", NOW);
  assert.deepEqual(
    { start: r.start, end: r.end, previousStart: r.previousStart, previousEnd: r.previousEnd },
    { start: "2026-10-06", end: "2026-10-12", previousStart: "2026-09-29", previousEnd: "2026-10-05" },
  );
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(parseRangeKey("90d"), "90d");
  assert.equal(parseRangeKey("bogus"), "28d");
});

test("formatting", () => {
  assert.equal(formatCount(1284), "1,284");
  assert.equal(formatCount(12_900), "12.9K");
  assert.equal(formatPercent(0.5823), "58.2%");
  assert.equal(formatPercent(0.5), "50%");
  assert.equal(formatDuration(84), "1m 24s");
  assert.equal(formatDuration(9), "9s");
  assert.equal(formatDuration(3725), "1h 2m");
  assert.deepEqual(computeDelta(5, 0), { kind: "new" });
  assert.deepEqual(computeDelta(0, 0), { kind: "none" });
  assert.deepEqual(computeDelta(100, 100.2), { kind: "flat" });
  assert.equal(formatDeltaRatio(0.124), "+12.4%");
  assert.equal(formatDeltaRatio(-0.5), "−50%");
  assert.equal(niceCeiling(0), 4);
  assert.equal(niceCeiling(3), 4);
  assert.equal(niceCeiling(137), 150);
  assert.equal(niceCeiling(860), 1000);
});

const twoRanges = (dims: string[], metrics: string[], rows: [string[], number[]][]): GaReport => ({
  dimensionHeaders: [...dims, "dateRange"].map((name) => ({ name })),
  metricHeaders: metrics.map((name) => ({ name })),
  rows: rows.map(([d, m]) => ({ dimensionValues: d.map((value) => ({ value })), metricValues: m.map((v) => ({ value: String(v) })) })),
});

test("totals split by date range and default to zero", () => {
  const report = twoRanges([], ["activeUsers", "sessions"], [
    [["current"], [120, 150]],
    [["previous"], [80, 90]],
  ]);
  const totals = parseTotals(report, ["activeUsers", "sessions", "newUsers"]);
  assert.deepEqual(totals.activeUsers, { current: 120, previous: 80 });
  assert.deepEqual(totals.newUsers, { current: 0, previous: 0 });
  assert.deepEqual(parseTotals(undefined, ["activeUsers"]).activeUsers, { current: 0, previous: 0 });
});

test("daily series aligns by nthDay and fills missing days with zero", () => {
  const range = resolveRange("7d", NOW);
  const report = twoRanges(["nthDay"], ["activeUsers", "screenPageViews"], [
    [["0006", "current"], [40, 90]],
    [["0000", "current"], [5, 9]],
    [["0006", "previous"], [20, 30]],
  ]);
  const daily = parseDaily(report, range);
  assert.equal(daily.length, 7);
  assert.equal(daily[0].date, "2026-10-06");
  assert.equal(daily[6].date, "2026-10-12");
  assert.equal(daily[6].previousDate, "2026-10-05");
  assert.deepEqual([daily[6].visitors, daily[6].views, daily[6].previousVisitors], [40, 90, 20]);
  assert.equal(daily[3].visitors, 0);
});

test("top pages merge titles per path and get readable names", () => {
  const report: GaReport = {
    dimensionHeaders: [{ name: "pagePath" }, { name: "pageTitle" }],
    metricHeaders: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "userEngagementDuration" }],
    rows: [
      { dimensionValues: [{ value: "/speakers/" }, { value: "Speakers | Jordan Create" }], metricValues: [{ value: "30" }, { value: "10" }, { value: "600" }] },
      { dimensionValues: [{ value: "/speakers" }, { value: "(not set)" }], metricValues: [{ value: "5" }, { value: "2" }, { value: "0" }] },
      { dimensionValues: [{ value: "/" }, { value: "Jordan Create" }], metricValues: [{ value: "50" }, { value: "40" }, { value: "800" }] },
    ],
  };
  const pages = parseTopPages(report);
  assert.deepEqual(pages.map((p) => [p.path, p.title, p.views]), [["/", "Home", 50], ["/speakers", "Speakers", 35]]);
  assert.equal(pages[1].avgEngagementSeconds, 50);
  assert.equal(pageLabel("/community/making-of-volume-3", ""), "Making Of Volume 3");
});

test("channels compare periods and fold a long tail into Other", () => {
  const names = ["Organic Social", "Direct", "Organic Search", "Referral", "Email", "Paid Social", "Organic Video", "Unassigned"];
  const rows: [string[], number[]][] = names.map((name, i) => [[name, "current"], [100 - i * 10]]);
  rows.push([["Direct", "previous"], [45]]);
  const channels = parseChannels(twoRanges(["sessionDefaultChannelGroup"], ["sessions"], rows));
  assert.equal(channels.length, 7);
  assert.equal(channels[1].label, "Direct");
  assert.equal(channels[1].previous, 45);
  assert.equal(channels[6].label, "Other");
  assert.equal(channels[6].value, 40 + 30);
});

test("outbound clicks are grouped by destination and the ticket row is always present", () => {
  assert.equal(outboundGroupFor("www.tzkrti.com"), "tickets");
  assert.equal(outboundGroupFor("tally.so"), "forms");
  assert.equal(outboundGroupFor("apps.apple.com"), "apps");
  assert.equal(outboundGroupFor("l.instagram.com"), "instagram");
  assert.equal(outboundGroupFor("example.org"), "other");

  const empty = parseOutbound(undefined);
  assert.deepEqual(empty.map((g) => [g.key, g.clicks]), [["tickets", 0]]);

  const groups = parseOutbound(
    twoRanges(["linkDomain"], ["eventCount"], [
      [["tzkrti.com", "current"], [12]],
      [["tzkrti.com", "previous"], [4]],
      [["tally.so", "current"], [3]],
      [["example.org", "current"], [1]],
      [["(not set)", "current"], [9]],
    ]),
  );
  assert.deepEqual(groups.map((g) => [g.key, g.clicks, g.previous]), [["tickets", 12, 4], ["forms", 3, 0], ["other", 1, 0]]);
  assert.equal(groups[2].hint, "example.org");
});

test("devices keep a fixed order; countries carry their code", () => {
  const devices = parseDevices({
    dimensionHeaders: [{ name: "deviceCategory" }],
    metricHeaders: [{ name: "activeUsers" }],
    rows: [
      { dimensionValues: [{ value: "desktop" }], metricValues: [{ value: "5" }] },
      { dimensionValues: [{ value: "mobile" }], metricValues: [{ value: "20" }] },
    ],
  });
  assert.deepEqual(devices.map((d) => [d.key, d.value]), [["mobile", 20], ["desktop", 5], ["tablet", 0]]);

  const countries = parseCountries({
    dimensionHeaders: [{ name: "country" }, { name: "countryId" }],
    metricHeaders: [{ name: "activeUsers" }],
    rows: [{ dimensionValues: [{ value: "Jordan" }, { value: "JO" }], metricValues: [{ value: "9" }] }],
  });
  assert.deepEqual(countries[0], { key: "JO", label: "Jordan", value: 9, countryCode: "JO" });
});

const PROVIDER = "projects/123456789012/locations/global/workloadIdentityPools/vercel/providers/vercel";
const SA = "ga-reader@jordan-create-admin.iam.gserviceaccount.com";

test("keyless config needs the property id, the service account and the provider", () => {
  assert.deepEqual(readAnalyticsConfig({}), {
    ok: false,
    missing: ["GA4_PROPERTY_ID", "GA_SERVICE_ACCOUNT_EMAIL", "GCP_WORKLOAD_IDENTITY_PROVIDER"],
  });
  const ok = readAnalyticsConfig({
    GA4_PROPERTY_ID: "556218299",
    GA_SERVICE_ACCOUNT_EMAIL: SA,
    GCP_WORKLOAD_IDENTITY_PROVIDER: `//iam.googleapis.com/${PROVIDER}`,
  });
  assert.deepEqual(ok, {
    ok: true,
    config: { propertyId: "556218299", auth: { kind: "federated", serviceAccountEmail: SA, providerResource: PROVIDER } },
  });
  const badProvider = readAnalyticsConfig({ GA4_PROPERTY_ID: "556218299", GA_SERVICE_ACCOUNT_EMAIL: SA, GCP_WORKLOAD_IDENTITY_PROVIDER: "vercel" });
  assert.equal(badProvider.ok, false);
  const measurement = readAnalyticsConfig({ GA4_PROPERTY_ID: "G-RQ7LFVTWWW", GA_SERVICE_ACCOUNT_EMAIL: SA, GCP_WORKLOAD_IDENTITY_PROVIDER: PROVIDER });
  assert.match(!measurement.ok ? measurement.problem ?? "" : "", /measurement id/);
});

test("a key file, when present, is used instead and still needs a readable key", () => {
  const key = JSON.stringify({ client_email: "ga@x.iam.gserviceaccount.com", private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n" });
  const fromBase64 = readAnalyticsConfig({ GA4_PROPERTY_ID: "properties/412345678", GA_SERVICE_ACCOUNT_KEY: Buffer.from(key).toString("base64") });
  assert.equal(fromBase64.ok, true);
  if (fromBase64.ok && fromBase64.config.auth.kind === "key") {
    assert.equal(fromBase64.config.propertyId, "412345678");
    assert.ok(fromBase64.config.auth.privateKey.includes("\nabc\n"));
  } else {
    assert.fail("expected key auth");
  }
  assert.equal(readAnalyticsConfig({ GA4_PROPERTY_ID: "412345678", GA_SERVICE_ACCOUNT_KEY: "not json" }).ok, false);
  assert.deepEqual(readAnalyticsConfig({ GA_SERVICE_ACCOUNT_KEY: key }), { ok: false, missing: ["GA4_PROPERTY_ID"] });
});

test("keyless sign-in failures point at the right Google Cloud fix", () => {
  assert.equal(classifyFederationError("exchange", 400, { error: "invalid_grant", error_description: "audience mismatch" }, SA).kind, "federation");
  const denied = classifyFederationError("impersonate", 403, { error: { status: "PERMISSION_DENIED", message: "Permission 'iam.serviceAccounts.getAccessToken' denied" } }, SA);
  assert.equal(denied.kind, "impersonation");
  assert.match(denied.hint, /Workload Identity User/);
  assert.equal(
    classifyFederationError("impersonate", 403, { error: { message: "IAM Service Account Credentials API has not been used in project 1 before or it is disabled." } }, SA).kind,
    "api-disabled",
  );
});

test("Google errors become actionable messages", () => {
  const email = "ga@x.iam.gserviceaccount.com";
  assert.equal(classifyGoogleError(403, { error: { status: "PERMISSION_DENIED", message: "User does not have sufficient permissions" } }, email).kind, "permission");
  assert.match(classifyGoogleError(403, { error: { status: "PERMISSION_DENIED" } }, email).hint, /ga@x\.iam/);
  assert.equal(
    classifyGoogleError(403, { error: { status: "PERMISSION_DENIED", message: "Google Analytics Data API has not been used in project 1 before or it is disabled.", details: [{ reason: "SERVICE_DISABLED" }] } }, email).kind,
    "api-disabled",
  );
  assert.equal(classifyGoogleError(400, { error: "invalid_grant", error_description: "Invalid JWT" }, email).kind, "auth");
  assert.equal(classifyGoogleError(429, { error: { status: "RESOURCE_EXHAUSTED" } }, email).kind, "quota");
  assert.equal(classifyGoogleError(404, { error: { status: "NOT_FOUND" } }, email).kind, "property");
});
