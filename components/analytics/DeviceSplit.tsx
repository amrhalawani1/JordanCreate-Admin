import { Monitor, Smartphone, Tablet, CircleHelp } from "lucide-react";
import { formatExact, formatPercent } from "@/lib/analytics/format";
import type { NamedCount } from "@/lib/analytics/types";
import { DEVICE_COLORS, CHART } from "./chart-colors";

const ICONS: Record<string, typeof Smartphone> = { mobile: Smartphone, desktop: Monitor, tablet: Tablet, other: CircleHelp };

/** Part-to-whole as one stacked bar (2px surface gaps), with a legend that carries every value. */
export function DeviceSplit({ devices }: { devices: NamedCount[] }) {
  return <SplitBar items={devices} colors={DEVICE_COLORS} icons={ICONS} />;
}

const LOYALTY_COLORS: Record<string, string> = { new: CHART.orange, returning: CHART.blue };

/** First-time against returning visitors. Returning is visitors minus new visitors. */
export function LoyaltySplit({ visitors, newVisitors }: { visitors: number; newVisitors: number }) {
  const fresh = Math.min(newVisitors, visitors);
  return (
    <SplitBar
      items={[
        { key: "new", label: "First-time visitors", value: fresh },
        { key: "returning", label: "Returning visitors", value: Math.max(visitors - fresh, 0) },
      ]}
      colors={LOYALTY_COLORS}
    />
  );
}

function SplitBar({
  items: devices,
  colors,
  icons,
}: {
  items: NamedCount[];
  colors: Record<string, string>;
  icons?: Record<string, typeof Smartphone>;
}) {
  const total = devices.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded in this period yet.</p>;
  }
  const shown = devices.filter((d) => d.value > 0);

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px]" role="img" aria-label={shown.map((d) => `${d.label} ${formatPercent(d.value / total, 0)}`).join(", ")}>
        {shown.map((d, i) => (
          <div
            key={d.key}
            className={i === shown.length - 1 ? "h-full rounded-r-[4px]" : "h-full"}
            style={{ width: `${(d.value / total) * 100}%`, background: colors[d.key] ?? CHART.muted, minWidth: 3 }}
            title={`${d.label}: ${formatExact(d.value)} (${formatPercent(d.value / total)})`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {devices.map((d) => {
          const Icon = icons ? (icons[d.key] ?? CircleHelp) : null;
          return (
            <li key={d.key} className="flex items-center gap-3 text-sm">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: colors[d.key] ?? CHART.muted }} aria-hidden />
              {Icon ? <Icon className="size-4 shrink-0 text-faint" aria-hidden /> : null}
              <span className="flex-1 text-foreground">{d.label}</span>
              <span className="tabular-nums text-muted-foreground">{formatExact(d.value)}</span>
              <span className="w-11 text-right font-semibold tabular-nums text-foreground">{formatPercent(d.value / total, 0)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
