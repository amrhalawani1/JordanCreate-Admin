"use client";

import { useEffect, useState } from "react";
import { getRealtimeAnalytics } from "@/actions/analytics";
import { formatExact } from "@/lib/analytics/format";
import type { RealtimeSnapshot } from "@/lib/analytics/types";

const POLL_MS = 60_000;

/** People on the site in the last 30 minutes. Refreshes every minute while the tab is visible. */
export function RealtimeCard({ initial, live }: { initial: RealtimeSnapshot | null; live: boolean }) {
  const [data, setData] = useState(initial);
  const [failed, setFailed] = useState(initial === null);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const result = await getRealtimeAnalytics().catch(() => null);
      if (cancelled) return;
      if (result?.status === "ok") {
        setData(result.realtime);
        setFailed(false);
      } else {
        setFailed(true);
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [live]);

  const count = data?.activeUsers ?? 0;

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Right now">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">Right now</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
          <span className="relative flex size-2" aria-hidden>
            {live && !failed ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" /> : null}
            <span className={failed ? "relative inline-flex size-2 rounded-full bg-faint" : "relative inline-flex size-2 rounded-full bg-emerald-400"} />
          </span>
          <span className={failed ? "text-faint" : undefined}>{failed ? "Offline" : "Live"}</span>
        </span>
      </div>

      {failed && !data ? (
        <p className="mt-3 text-sm text-muted-foreground">Live figures are unavailable right now.</p>
      ) : (
        <>
          <p className="mt-3 text-4xl font-semibold leading-none tracking-[-0.03em] text-foreground" aria-live="polite">
            {formatExact(count)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {count === 1 ? "person" : "people"} on the site in the last 30 minutes
          </p>
          {data && data.pages.length > 0 ? (
            <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
              {data.pages.slice(0, 4).map((page) => (
                <li key={page.title} className="flex items-center justify-between gap-3">
                  <span className="truncate text-muted-foreground" title={page.title}>{page.title}</span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">{formatExact(page.users)}</span>
                </li>
              ))}
            </ul>
          ) : count === 0 ? (
            <p className="mt-4 border-t border-border pt-3 text-xs text-faint">Nobody is browsing at the moment.</p>
          ) : null}
        </>
      )}
    </section>
  );
}
