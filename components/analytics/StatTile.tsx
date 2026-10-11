import type { Compared } from "@/lib/analytics/types";
import { DeltaBadge } from "./DeltaBadge";

/** label · value · delta, plus one plain-language line on what the number means. */
export function StatTile({
  label,
  value,
  figure,
  previousText,
  hint,
  periodLabel,
}: {
  label: string;
  value: string;
  figure: Compared;
  previousText: string;
  hint: string;
  periodLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-2xl font-semibold leading-none tracking-[-0.03em] text-foreground sm:text-[1.75rem]">{value}</p>
        <DeltaBadge current={figure.current} previous={figure.previous} periodLabel={periodLabel} />
      </div>
      <div className="mt-auto space-y-1">
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
        <p className="text-[11px] text-faint">
          {periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}: {previousText}
        </p>
      </div>
    </div>
  );
}
