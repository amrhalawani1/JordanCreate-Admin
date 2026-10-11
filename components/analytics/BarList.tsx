import type { ReactNode } from "react";
import { formatCount, formatExact, formatPercent } from "@/lib/analytics/format";
import { CHART } from "./chart-colors";
import { DeltaBadge } from "./DeltaBadge";

export type BarListItem = {
  key: string;
  label: string;
  hint?: string;
  value: number;
  previous?: number;
  leading?: ReactNode;
};

/**
 * A ranked horizontal bar list. Every value is printed as text, so the bars
 * are a reading aid and nothing hides behind hover. One series, one color —
 * or, with `emphasisKey`, the one row that matters in orange and the rest gray.
 */
export function BarList({
  items,
  valueHeader,
  labelHeader,
  periodLabel,
  showDelta = false,
  showShare = false,
  emphasisKey,
  empty = "Nothing recorded in this period yet.",
}: {
  items: BarListItem[];
  labelHeader: string;
  valueHeader: string;
  periodLabel: string;
  showDelta?: boolean;
  showShare?: boolean;
  emphasisKey?: string;
  empty?: string;
}) {
  if (items.length === 0 || items.every((item) => item.value === 0 && !item.previous)) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
      <colgroup>
        <col />
        <col className="w-[4.75rem]" />
        {showDelta ? <col className="w-[4.75rem]" /> : null}
      </colgroup>
      <thead className="sr-only">
        <tr>
          <th scope="col">{labelHeader}</th>
          <th scope="col">{showShare ? `${valueHeader} and share` : valueHeader}</th>
          {showDelta ? <th scope="col">Change</th> : null}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const color = emphasisKey === undefined || item.key === emphasisKey ? CHART.orange : CHART.muted;
          const width = item.value > 0 ? Math.max((item.value / max) * 100, 1.5) : 0;
          return (
            <tr key={item.key} className="group align-top">
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <div className="flex min-w-0 items-center gap-2">
                  {item.leading}
                  <span className="truncate font-medium text-foreground" title={item.label}>
                    {item.label}
                  </span>
                </div>
                {item.hint ? <p className="mt-0.5 truncate text-xs text-faint" title={item.hint}>{item.hint}</p> : null}
                <div className="mt-2 h-1.5 w-full rounded-r-[4px] bg-[var(--track)]" style={{ ["--track" as string]: CHART.track }} aria-hidden>
                  <div className="h-full rounded-r-[4px] transition-[width] duration-500" style={{ width: `${width}%`, background: color }} />
                </div>
              </th>
              <td className="py-2 pl-2 text-right align-top tabular-nums">
                <span className="font-semibold text-foreground" title={formatExact(item.value)}>
                  {formatCount(item.value)}
                </span>
                {showShare && total > 0 ? (
                  <span className="block text-xs text-faint">{formatPercent(item.value / total, 0)}</span>
                ) : null}
              </td>
              {showDelta ? (
                <td className="py-2 pl-2 text-right align-top">
                  {item.previous !== undefined ? (
                    <DeltaBadge current={item.value} previous={item.previous} periodLabel={periodLabel} size="xs" />
                  ) : null}
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Regional-indicator emoji for a two-letter country code. */
export function CountryFlag({ code }: { code?: string }) {
  if (!code) return <span className="inline-block w-5 text-center text-faint" aria-hidden>·</span>;
  const flag = String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  return (
    <span className="inline-block w-5 text-center text-base leading-none" aria-hidden>
      {flag}
    </span>
  );
}
