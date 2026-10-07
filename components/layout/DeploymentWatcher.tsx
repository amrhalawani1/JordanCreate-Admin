"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const POLL_MS = 60_000;

/**
 * A tab opened before a deployment keeps running the old code (and the old
 * server actions) until it reloads. Poll the live build id and, when it
 * changes, ask the admin to refresh before they save anything else.
 */
export function DeploymentWatcher({ builtWith }: { builtWith: string }) {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (builtWith === "dev") return;
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { id?: string };
        if (!cancelled && data.id && data.id !== builtWith) setStale(true);
      } catch {
        /* offline or mid-deploy: try again next tick */
      }
    }
    const id = setInterval(check, POLL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [builtWith]);

  if (!stale) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 border-b border-orange/40 bg-[#1a1308] px-4 py-2.5 text-sm text-foreground shadow-lg"
    >
      <span>A newer version of the admin panel is live. Refresh before saving anything.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3 py-1 text-xs font-medium text-[#0a0a0a] hover:brightness-110"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Refresh now
      </button>
    </div>
  );
}
