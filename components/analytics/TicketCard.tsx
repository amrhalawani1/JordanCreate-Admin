import { Ticket } from "lucide-react";
import { formatCount, formatExact, formatPercent } from "@/lib/analytics/format";
import type { Compared } from "@/lib/analytics/types";
import { DeltaBadge } from "./DeltaBadge";

/** The number the event team cares most about: people heading to buy a ticket. */
export function TicketCard({ clicks, visitors, periodLabel }: { clicks: Compared; visitors: number; periodLabel: string }) {
  const rate = visitors > 0 ? clicks.current / visitors : 0;
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-orange/25 bg-[linear-gradient(160deg,rgba(234,143,45,0.09),rgba(234,143,45,0)_60%)] bg-card p-4 sm:p-5" aria-label="Ticket clicks">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">Ticket clicks</p>
        <Ticket className="size-4 text-orange" aria-hidden />
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <p className="text-4xl font-semibold leading-none tracking-[-0.03em] text-foreground">{formatCount(clicks.current)}</p>
        <DeltaBadge current={clicks.current} previous={clicks.previous} periodLabel={periodLabel} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">Buy Tickets clicks that left for the Tzkrti store</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-faint">Of visitors</dt>
          <dd className="mt-0.5 font-semibold text-foreground">{visitors > 0 ? formatPercent(rate) : "—"}</dd>
        </div>
        <div>
          <dt className="text-faint">{periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{formatExact(clicks.previous)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">Counts clicks, not purchases. Sales are in Tzkrti.</p>
    </section>
  );
}
