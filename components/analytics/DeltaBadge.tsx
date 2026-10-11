import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { computeDelta, formatDeltaRatio } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

/**
 * Change versus the previous period. Direction is carried by an icon and a
 * sign as well as color, so it never relies on color alone. Every metric on
 * this page is "more is better".
 */
export function DeltaBadge({
  current,
  previous,
  periodLabel,
  size = "sm",
  className,
}: {
  current: number;
  previous: number;
  /** e.g. "previous 28 days" — used in the accessible label. */
  periodLabel: string;
  size?: "sm" | "xs";
  className?: string;
}) {
  const delta = computeDelta(current, previous);
  const text = size === "xs" ? "text-[11px]" : "text-xs";
  const icon = size === "xs" ? "size-3" : "size-3.5";

  if (delta.kind === "none") return null;

  if (delta.kind === "new") {
    return (
      <span className={cn("inline-flex items-center gap-1 font-medium text-emerald-400", text, className)} title={`None in the ${periodLabel}`}>
        <TrendingUp className={icon} aria-hidden />
        New
        <span className="sr-only">, none in the {periodLabel}</span>
      </span>
    );
  }

  if (delta.kind === "flat") {
    return (
      <span className={cn("inline-flex items-center gap-1 font-medium text-muted-foreground", text, className)}>
        <Minus className={icon} aria-hidden />
        No change
        <span className="sr-only"> from the {periodLabel}</span>
      </span>
    );
  }

  const up = delta.kind === "up";
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        up ? "text-emerald-400" : "text-red-400",
        text,
        className,
      )}
    >
      <Icon className={icon} aria-hidden />
      {formatDeltaRatio(delta.ratio)}
      <span className="sr-only"> versus the {periodLabel}</span>
    </span>
  );
}
