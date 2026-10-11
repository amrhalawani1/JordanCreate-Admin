import { ExternalLink } from "lucide-react";
import { getAnalyticsSnapshot, getRealtimeAnalytics } from "@/actions/analytics";
import { assertStaff } from "@/lib/auth/guard";
import { parseRangeKey, resolveRange } from "@/lib/analytics/ranges";
import { buildSampleRealtime, buildSampleSnapshot } from "@/lib/analytics/sample";
import type { AnalyticsSnapshot, RealtimeSnapshot } from "@/lib/analytics/types";
import { WEBSITE_ORIGIN } from "@/lib/previews/speaker-preview-url";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { AnalyticsErrorPanel } from "@/components/analytics/AnalyticsErrorPanel";
import { SetupGuide } from "@/components/analytics/SetupGuide";

function gaLink(propertyId?: string) {
  return propertyId
    ? `https://analytics.google.com/analytics/web/#/p${propertyId}/reports/intelligenthome`
    : "https://analytics.google.com/";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; preview?: string }>;
}) {
  await assertStaff();
  const params = await searchParams;
  const range = resolveRange(parseRangeKey(params.range));
  const sample = params.preview === "sample";

  let snapshot: AnalyticsSnapshot | null = null;
  let realtime: RealtimeSnapshot | null = null;
  let propertyId: string | undefined;
  let body: React.ReactNode = null;

  if (sample) {
    snapshot = buildSampleSnapshot(range);
    realtime = buildSampleRealtime();
  } else {
    const [result, live] = await Promise.all([getAnalyticsSnapshot(range.key), getRealtimeAnalytics()]);
    if (result.status === "ok") {
      snapshot = result.snapshot;
      propertyId = result.propertyId;
      realtime = live.status === "ok" ? live.realtime : null;
    } else if (result.status === "not-configured") {
      body = <SetupGuide missing={result.missing} problem={result.problem} />;
    } else {
      body = <AnalyticsErrorPanel message={result.message} hint={result.hint} />;
    }
  }

  const header = (
    <PageHeader
      eyebrow="Overview"
      title="Website Analytics"
      description={
        <>
          How people find and use{" "}
          <a href={WEBSITE_ORIGIN} target="_blank" rel="noreferrer" className="text-orange underline-offset-4 hover:underline">
            jordancreate.com
          </a>
          , from Google Analytics.
        </>
      }
      action={
        <a href={gaLink(propertyId)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Open Google Analytics
          <ExternalLink aria-hidden />
        </a>
      }
    />
  );

  if (!snapshot) {
    return (
      <div>
        {header}
        {body}
      </div>
    );
  }

  return (
    <div>
      {header}
      <AnalyticsDashboard snapshot={snapshot} realtime={realtime} sample={sample} websiteOrigin={WEBSITE_ORIGIN} />
    </div>
  );
}
