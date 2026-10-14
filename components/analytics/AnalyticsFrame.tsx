"use client";

import { useEffect, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RANGE_PRESETS, type RangeKey } from "@/lib/analytics/ranges";
import { cn } from "@/lib/utils";

function useRelativeTime(iso: string | null) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!iso) return;
    const update = () => {
      const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
      setLabel(minutes <= 0 ? "just now" : minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`);
    };
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [iso]);
  return label;
}

/**
 * The single filter row that scopes everything below it. Switching ranges
 * keeps the current figures on screen, dimmed, until the new ones arrive —
 * no skeleton flash, no layout jump.
 */
export function AnalyticsFrame({
  range,
  hourly,
  spanLabel,
  comparisonLabel,
  fetchedAt,
  sample,
  children,
}: {
  range: RangeKey;
  hourly: boolean;
  spanLabel: string;
  comparisonLabel: string;
  fetchedAt: string | null;
  sample: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // The pressed range flips immediately and settles to the server's value once the transition ends.
  const [optimistic, setOptimistic] = useOptimistic(range);
  const updated = useRelativeTime(fetchedAt);

  function select(key: RangeKey) {
    if (key === optimistic) return;
    const params = new URLSearchParams({ range: key });
    if (sample) params.set("preview", "sample");
    startTransition(() => {
      setOptimistic(key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div
          role="radiogroup"
          aria-label="Date range"
          className="flex max-w-full items-center overflow-x-auto rounded-lg border border-border bg-card p-1 [scrollbar-width:none]"
        >
          <span aria-hidden className="shrink-0 pl-2 pr-1.5 text-xs font-medium text-faint">
            Past
          </span>
          {RANGE_PRESETS.map((preset) => {
            const selected = optimistic === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Past ${preset.name}`}
                onClick={() => select(preset.key)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40",
                  selected ? "bg-orange text-[#0a0a0a]" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">{spanLabel}</span>
          <span className="text-faint"> · compared with {comparisonLabel}</span>
          {hourly ? <span className="block text-xs text-faint">Google Analytics can take a few hours to show the latest visits.</span> : null}
        </p>
        <p className="text-xs text-faint sm:ml-auto" aria-live="polite">
          {pending ? "Loading…" : updated ? `Updated ${updated} · refreshes every 10 minutes` : null}
        </p>
      </div>

      <div className={cn("space-y-5 transition-opacity duration-200", pending && "pointer-events-none opacity-55")} aria-busy={pending}>
        {children}
      </div>
    </div>
  );
}
