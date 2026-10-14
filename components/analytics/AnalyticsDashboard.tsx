import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { formatCount, formatDuration, formatExact, formatPercent } from "@/lib/analytics/format";
import { formatPeriod } from "@/lib/analytics/ranges";
import type { AnalyticsSnapshot, RealtimeSnapshot } from "@/lib/analytics/types";
import { AnalyticsCard, AnalyticsSection } from "./AnalyticsCard";
import { AnalyticsFrame } from "./AnalyticsFrame";
import { BarList, CountryFlag } from "./BarList";
import { DeviceSplit, LoyaltySplit } from "./DeviceSplit";
import { RealtimeCard } from "./RealtimeCard";
import { StatTile } from "./StatTile";
import { TicketCard } from "./TicketCard";
import { TopPagesTable } from "./TopPagesTable";
import { TrendCard } from "./TrendCard";

/**
 * Everything below the page header, in reading priority: the headline
 * (visitors, ticket clicks, who is here now), the supporting figures, then
 * acquisition, behaviour and audience. No data fetching or auth here.
 */
export function AnalyticsDashboard({
  snapshot,
  realtime,
  sample,
  websiteOrigin,
}: {
  snapshot: AnalyticsSnapshot;
  realtime: RealtimeSnapshot | null;
  sample: boolean;
  websiteOrigin: string;
}) {
  const range = snapshot.range;
  const s = snapshot;
  const periodLabel = range.previousLabel;
  const { kpis } = s;

  return (
      <AnalyticsFrame
        range={range.key}
        hourly={range.unit === "hour"}
        spanLabel={formatPeriod(range, "current")}
        comparisonLabel={formatPeriod(range, "previous")}
        fetchedAt={sample ? null : s.fetchedAt}
        sample={sample}
      >
        {sample ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-orange/30 bg-orange/[0.06] px-4 py-3 text-sm">
            <FlaskConical className="size-4 shrink-0 text-orange" aria-hidden />
            <p className="flex-1 text-foreground">
              <b className="font-semibold">Sample data.</b>{" "}
              <span className="text-muted-foreground">These figures are made up to show the layout. Connect Google Analytics to see real traffic.</span>
            </p>
            <Link href="/analytics" className="text-sm font-medium text-orange underline-offset-4 hover:underline">
              Exit preview
            </Link>
          </div>
        ) : null}

        {/* 1 · The headline: how many people, are they heading for tickets, who's here now */}
        <div className="grid gap-3 lg:grid-cols-3">
          <TrendCard className="lg:col-span-2" unit={range.unit} daily={s.daily} visitors={kpis.visitors} periodLabel={periodLabel} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <TicketCard clicks={kpis.ticketClicks} visitors={kpis.visitors.current} periodLabel={periodLabel} />
            <RealtimeCard initial={realtime} live={!sample} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Page views"
            value={formatCount(kpis.views.current)}
            figure={kpis.views}
            previousText={formatExact(kpis.views.previous)}
            periodLabel={periodLabel}
            hint={
              kpis.visitors.current > 0
                ? `${(kpis.views.current / kpis.visitors.current).toFixed(1)} pages per visitor`
                : "Every page opened, including repeats"
            }
          />
          <StatTile
            label="New visitors"
            value={formatCount(kpis.newVisitors.current)}
            figure={kpis.newVisitors}
            previousText={formatExact(kpis.newVisitors.previous)}
            periodLabel={periodLabel}
            hint="First time on the site in this period"
          />
          <StatTile
            label="Engagement rate"
            value={formatPercent(kpis.engagementRate.current)}
            figure={kpis.engagementRate}
            previousText={formatPercent(kpis.engagementRate.previous)}
            periodLabel={periodLabel}
            hint="Visits that lasted 10s+, saw 2+ pages, or clicked out"
          />
          <StatTile
            label="Avg. engagement time"
            value={formatDuration(kpis.avgEngagementSeconds.current)}
            figure={kpis.avgEngagementSeconds}
            previousText={formatDuration(kpis.avgEngagementSeconds.previous)}
            periodLabel={periodLabel}
            hint="Time the site was in focus, per visitor"
          />
        </div>

        {/* 2 · Acquisition */}
        <AnalyticsSection
          eyebrow="Acquisition"
          title="How people find the site"
          description="Visits are grouped by where the visitor came from just before landing on jordancreate.com."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <AnalyticsCard title="Channels" description={`Sessions by channel, with change against the ${periodLabel}`}>
              <BarList
                items={s.channels}
                labelHeader="Channel"
                valueHeader="Sessions"
                periodLabel={periodLabel}
                showDelta
              />
            </AnalyticsCard>
            <AnalyticsCard title="Top sources" description="The exact site or app that sent each session">
              <BarList items={s.sources} labelHeader="Source" valueHeader="Sessions" periodLabel={periodLabel} showShare />
            </AnalyticsCard>
          </div>
        </AnalyticsSection>

        {/* 3 · Behaviour */}
        <AnalyticsSection
          eyebrow="Behaviour"
          title="What visitors do"
          description="The pages people open most, and the links that take them off the site."
        >
          <div className="grid gap-3 lg:grid-cols-5">
            <AnalyticsCard className="lg:col-span-3" title="Top pages" description="Most viewed pages in this period">
              <TopPagesTable pages={s.topPages} websiteOrigin={websiteOrigin} />
            </AnalyticsCard>
            <AnalyticsCard
              className="lg:col-span-2 lg:self-start"
              title="Where visitors go next"
              description="Clicks on links that leave jordancreate.com"
            >
              <BarList
                items={s.outbound.map((group) => ({
                  key: group.key,
                  label: group.label,
                  hint: group.hint,
                  value: group.clicks,
                  previous: group.previous,
                }))}
                labelHeader="Destination"
                valueHeader="Clicks"
                periodLabel={periodLabel}
                emphasisKey="tickets"
                showDelta
                empty="No outbound clicks recorded in this period yet."
              />
            </AnalyticsCard>
          </div>
        </AnalyticsSection>

        {/* 4 · Audience */}
        <AnalyticsSection eyebrow="Audience" title="Who is visiting" description="Where visitors are, and the devices and systems they browse on.">
          <div className="grid gap-3 lg:grid-cols-2">
            <AnalyticsCard title="Countries" description="Visitors by country">
              <BarList
                items={s.countries.map((c) => ({ ...c, leading: <CountryFlag code={c.countryCode} /> }))}
                labelHeader="Country"
                valueHeader="Visitors"
                periodLabel={periodLabel}
                showShare
              />
            </AnalyticsCard>
            <div className="grid content-start gap-3">
              <AnalyticsCard title="Devices" description="Visitors by device type">
                <DeviceSplit devices={s.devices} />
              </AnalyticsCard>
              <AnalyticsCard title="Operating system" description="Visitors by phone or computer system">
                <BarList
                  items={s.operatingSystems}
                  labelHeader="Operating system"
                  valueHeader="Visitors"
                  periodLabel={periodLabel}
                  showShare
                />
              </AnalyticsCard>
              <AnalyticsCard title="First-time or returning" description="Whether visitors had been on the site before this period">
                <LoyaltySplit visitors={kpis.visitors.current} newVisitors={kpis.newVisitors.current} />
              </AnalyticsCard>
            </div>
          </div>
        </AnalyticsSection>

        <p className="pb-2 text-xs leading-relaxed text-faint">
          Figures come from Google Analytics for the production website only, use the Amman calendar day, and include
          today so far. Visitors counts each person once per period. Google can take up to a day to finish processing
          recent visits, so the last day may still grow.
        </p>
      </AnalyticsFrame>
  );
}
