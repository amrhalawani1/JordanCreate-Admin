import { ArrowUpRight } from "lucide-react";
import { formatCount, formatDuration, formatExact } from "@/lib/analytics/format";
import type { TopPage } from "@/lib/analytics/types";
import { CHART } from "./chart-colors";

export function TopPagesTable({ pages, websiteOrigin }: { pages: TopPage[]; websiteOrigin: string }) {
  if (pages.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No page views recorded in this period yet.</p>;
  }
  const max = Math.max(...pages.map((p) => p.views), 1);

  return (
    <table className="w-full table-fixed text-sm">
      <colgroup>
        <col />
        <col className="w-16" />
        <col className="hidden w-20 sm:table-column" />
        <col className="hidden w-20 md:table-column" />
      </colgroup>
      <thead>
        <tr className="border-b border-border text-xs text-faint">
          <th scope="col" className="pb-2 text-left font-medium">Page</th>
          <th scope="col" className="pb-2 pl-3 text-right font-medium">Views</th>
          <th scope="col" className="hidden pb-2 pl-3 text-right font-medium sm:table-cell">Visitors</th>
          <th scope="col" className="hidden pb-2 pl-3 text-right font-medium md:table-cell" title="Average engagement time per visitor">
            Avg. time
          </th>
        </tr>
      </thead>
      <tbody>
        {pages.map((page) => (
          <tr key={page.path} className="border-b border-border/60 align-top last:border-0">
            <th scope="row" className="py-2.5 pr-2 text-left font-normal">
              <a
                href={`${websiteOrigin}${page.path}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex max-w-full items-center gap-1 font-medium text-foreground hover:text-orange focus-visible:text-orange focus-visible:outline-none"
              >
                <span className="truncate">{page.title}</span>
                <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                <span className="sr-only">(opens the page on the website)</span>
              </a>
              <p className="truncate text-xs text-faint" title={page.path}>{page.path}</p>
              <div className="mt-1.5 h-1 w-full max-w-[18rem] rounded-r-[4px]" style={{ background: CHART.track }} aria-hidden>
                <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max((page.views / max) * 100, 1.5)}%`, background: CHART.orange }} />
              </div>
            </th>
            <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-foreground" title={formatExact(page.views)}>
              {formatCount(page.views)}
            </td>
            <td className="hidden py-2.5 pl-3 text-right tabular-nums text-muted-foreground sm:table-cell">{formatCount(page.visitors)}</td>
            <td className="hidden py-2.5 pl-3 text-right tabular-nums text-muted-foreground md:table-cell">{formatDuration(page.avgEngagementSeconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
