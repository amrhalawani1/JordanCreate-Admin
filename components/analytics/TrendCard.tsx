"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Table2, ChartLine } from "lucide-react";
import { formatCount, formatExact, niceCeiling } from "@/lib/analytics/format";
import { formatLongDate, formatShortDate } from "@/lib/analytics/ranges";
import type { Compared, DailyPoint } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { CHART } from "./chart-colors";
import { DeltaBadge } from "./DeltaBadge";

type Metric = "visitors" | "views";

const METRICS: { key: Metric; label: string; perDay: string }[] = [
  { key: "visitors", label: "Visitors", perDay: "Visitors per day" },
  { key: "views", label: "Page views", perDay: "Page views per day" },
];

/**
 * The hero of the page: total visitors for the period, and the day-by-day
 * line against the previous period (emphasis form: this period in orange, the
 * previous one in gray, one shared axis).
 */
export function TrendCard({
  daily,
  visitors,
  periodLabel,
  className,
}: {
  daily: DailyPoint[];
  visitors: Compared;
  periodLabel: string;
  className?: string;
}) {
  const [metric, setMetric] = useState<Metric>("visitors");
  const [asTable, setAsTable] = useState(false);
  const active = METRICS.find((m) => m.key === metric)!;

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5",
        className,
      )}
      aria-label="Visitors"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Visitors</p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-5xl font-semibold leading-none tracking-[-0.035em] text-foreground">
              {formatCount(visitors.current)}
            </p>
            <DeltaBadge
              current={visitors.current}
              previous={visitors.previous}
              periodLabel={periodLabel}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            People who visited jordancreate.com · {periodLabel}:{" "}
            {formatExact(visitors.previous)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Chart metric"
            className="inline-flex rounded-lg border border-border bg-white/[0.02] p-0.5"
          >
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={metric === m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40",
                  metric === m.key
                    ? "bg-white/[0.08] text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40"
          >
            {asTable ? (
              <ChartLine className="size-3.5" aria-hidden />
            ) : (
              <Table2 className="size-3.5" aria-hidden />
            )}
            {asTable ? "Chart" : "Table"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight">
          {active.perDay}
        </h3>
        <Legend />
      </div>

      <div className="mt-3">
        {asTable ? (
          <TrendTable daily={daily} metric={metric} label={active.label} />
        ) : (
          <TrendChart daily={daily} metric={metric} label={active.label} />
        )}
      </div>
    </section>
  );
}

function Legend() {
  return (
    <ul
      className="flex items-center gap-4 text-xs text-muted-foreground"
      aria-label="Legend"
    >
      <li className="flex items-center gap-1.5">
        <span
          className="h-0.5 w-3.5 rounded-full"
          style={{ background: CHART.orange }}
          aria-hidden
        />
        This period
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="h-0.5 w-3.5 rounded-full"
          style={{ background: CHART.muted }}
          aria-hidden
        />
        Previous period
      </li>
    </ul>
  );
}

const PLOT_HEIGHT = 200;
const PAD_TOP = 10;
const AXIS_BAND = 28;
const PAD_LEFT = 44;
const PAD_RIGHT = 14;

function pick(point: DailyPoint, metric: Metric) {
  return metric === "visitors"
    ? { current: point.visitors, previous: point.previousVisitors }
    : { current: point.views, previous: point.previousViews };
}

function TrendChart({
  daily,
  metric,
  label,
}: {
  daily: DailyPoint[];
  metric: Metric;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Unknown until measured; the container keeps its height, so nothing jumps.
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? 0;
  const [index, setIndex] = useState<number | null>(null);
  const descId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setMeasured(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = daily.length;
  const plotWidth = width - PAD_LEFT - PAD_RIGHT;
  const values = useMemo(
    () => daily.map((d) => pick(d, metric)),
    [daily, metric],
  );
  const rawMax = Math.max(
    0,
    ...values.map((v) => Math.max(v.current, v.previous)),
  );
  const yMax = niceCeiling(rawMax);
  const isEmpty = rawMax === 0;

  const x = (i: number) =>
    PAD_LEFT + (n <= 1 ? plotWidth / 2 : (i * plotWidth) / (n - 1));
  const y = (v: number) => PAD_TOP + PLOT_HEIGHT - (v / yMax) * PLOT_HEIGHT;
  const linePath = (key: "current" | "previous") =>
    values
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v[key]).toFixed(1)}`,
      )
      .join("");
  const currentPath = linePath("current");
  const previousPath = linePath("previous");
  const areaPath = `${currentPath}L${x(n - 1).toFixed(1)},${PAD_TOP + PLOT_HEIGHT}L${x(0).toFixed(1)},${PAD_TOP + PLOT_HEIGHT}Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  // X labels: as many as fit (~72px each), always ending on the last day.
  const xLabels = useMemo(() => {
    if (n === 0) return [];
    const fit = Math.max(2, Math.floor(plotWidth / 72));
    const step = Math.max(1, Math.ceil(n / fit));
    const picked: number[] = [];
    for (let i = 0; i < n; i += step) picked.push(i);
    const last = n - 1;
    if (picked[picked.length - 1] !== last) {
      if (last - picked[picked.length - 1] < step / 2)
        picked[picked.length - 1] = last;
      else picked.push(last);
    }
    return picked;
  }, [n, plotWidth]);

  function indexFromPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    if (n <= 1) return 0;
    const i = Math.round(((px - PAD_LEFT) / plotWidth) * (n - 1));
    return Math.min(n - 1, Math.max(0, i));
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (n === 0) return;
    const current = index ?? n - 1;
    const moves: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: n - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      setIndex(Math.min(n - 1, Math.max(0, moves[event.key])));
    } else if (event.key === "Escape") {
      setIndex(null);
    }
  }

  const activePoint = index !== null ? daily[index] : null;
  const activeValues = index !== null ? values[index] : null;
  const tooltipOnLeft = index !== null && x(index) > width * 0.62;
  const last = values[n - 1];

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height: PLOT_HEIGHT + PAD_TOP + AXIS_BAND }}
    >
      {measured === null ? null : (
        <svg
          width={width}
          height={PLOT_HEIGHT + PAD_TOP + AXIS_BAND}
          viewBox={`0 0 ${width} ${PLOT_HEIGHT + PAD_TOP + AXIS_BAND}`}
          className="block touch-pan-y select-none outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-orange/40"
          tabIndex={0}
          role="group"
          aria-roledescription="line chart"
          aria-label={`${label} per day, this period against the previous period`}
          aria-describedby={descId}
          onPointerMove={(e) => setIndex(indexFromPointer(e))}
          onPointerDown={(e) => setIndex(indexFromPointer(e))}
          onPointerLeave={() => setIndex(null)}
          onFocus={() => setIndex((i) => i ?? n - 1)}
          onBlur={() => setIndex(null)}
          onKeyDown={onKeyDown}
        >
          {/* grid + y axis */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD_LEFT}
                x2={width - PAD_RIGHT}
                y1={y(t)}
                y2={y(t)}
                stroke={CHART.grid}
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill={CHART.axisText}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatCount(t)}
              </text>
            </g>
          ))}

          {/* x axis labels */}
          {xLabels.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={PAD_TOP + PLOT_HEIGHT + 18}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize={11}
              fill={CHART.axisText}
            >
              {formatShortDate(daily[i].date)}
            </text>
          ))}

          {!isEmpty ? (
            <>
              <path d={areaPath} fill={CHART.orange} opacity={0.1} />
              <path
                d={previousPath}
                fill="none"
                stroke={CHART.muted}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={currentPath}
                fill="none"
                stroke={CHART.orange}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* end marker on this period */}
              {index === null && last ? (
                <circle
                  cx={x(n - 1)}
                  cy={y(last.current)}
                  r={4}
                  fill={CHART.orange}
                  stroke={CHART.surface}
                  strokeWidth={2}
                />
              ) : null}
            </>
          ) : null}

          {/* crosshair */}
          {index !== null && activeValues ? (
            <g pointerEvents="none">
              <line
                x1={x(index)}
                x2={x(index)}
                y1={PAD_TOP}
                y2={PAD_TOP + PLOT_HEIGHT}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
              />
              {!isEmpty ? (
                <>
                  <circle
                    cx={x(index)}
                    cy={y(activeValues.previous)}
                    r={4}
                    fill={CHART.muted}
                    stroke={CHART.surface}
                    strokeWidth={2}
                  />
                  <circle
                    cx={x(index)}
                    cy={y(activeValues.current)}
                    r={4.5}
                    fill={CHART.orange}
                    stroke={CHART.surface}
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </g>
          ) : null}
        </svg>
      )}

      {isEmpty ? (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center px-6 text-center"
          style={{ top: PAD_TOP + PLOT_HEIGHT / 2 - 20 }}
        >
          <p className="max-w-sm text-sm text-muted-foreground">
            No visits recorded in this period yet. New data can take up to a day
            to appear in Google Analytics.
          </p>
        </div>
      ) : null}

      {activePoint && activeValues ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[11rem] rounded-lg border border-white/10 bg-popover px-3 py-2.5 shadow-xl shadow-black/40"
          style={{
            top: PAD_TOP,
            left: x(index!),
            transform: tooltipOnLeft
              ? "translateX(calc(-100% - 12px))"
              : "translateX(12px)",
          }}
        >
          <p className="text-xs font-medium text-foreground">
            {formatLongDate(activePoint.date)}
          </p>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ background: CHART.orange }}
                aria-hidden
              />
              <dd className="font-semibold tabular-nums text-foreground">
                {formatExact(activeValues.current)}
              </dd>
              <dt className="text-muted-foreground">this period</dt>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ background: CHART.muted }}
                aria-hidden
              />
              <dd className="font-semibold tabular-nums text-foreground">
                {formatExact(activeValues.previous)}
              </dd>
              <dt className="text-muted-foreground">
                {formatShortDate(activePoint.previousDate)}
              </dt>
            </div>
          </dl>
        </div>
      ) : null}

      <p id={descId} className="sr-only" aria-live="polite">
        {activePoint && activeValues
          ? `${formatLongDate(activePoint.date)}: ${formatExact(activeValues.current)} ${label.toLowerCase()}; ${formatShortDate(activePoint.previousDate)}: ${formatExact(activeValues.previous)}.`
          : "Use the left and right arrow keys to read each day. The Table button shows every value."}
      </p>
    </div>
  );
}

function TrendTable({
  daily,
  metric,
  label,
}: {
  daily: DailyPoint[];
  metric: Metric;
  label: string;
}) {
  return (
    <div className="max-h-[238px] overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {label} per day, this period and the previous period
        </caption>
        <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Day
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              This period
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Previous period
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {[...daily].reverse().map((d) => {
            const v = pick(d, metric);
            return (
              <tr
                key={d.date}
                className="border-b border-border/60 last:border-0"
              >
                <th
                  scope="row"
                  className="px-3 py-1.5 text-left font-normal text-foreground"
                >
                  {formatLongDate(d.date)}
                </th>
                <td className="px-3 py-1.5 text-right font-medium text-foreground">
                  {formatExact(v.current)}
                </td>
                <td className="px-3 py-1.5 text-right text-muted-foreground">
                  {formatExact(v.previous)}{" "}
                  <span className="text-faint">
                    · {formatShortDate(d.previousDate)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
