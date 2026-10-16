"use client";

import { useEffect } from "react";

const MAX_REPORTS_PER_PAGE = 10;

/** Sends uncaught browser errors and rejected promises to the activity log. */
export function ClientErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const report = (source: string, message: string, stack?: string) => {
      if (sent >= MAX_REPORTS_PER_PAGE) return;
      sent += 1;
      void fetch("/api/client-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, message, stack, url: window.location.href }),
        keepalive: true,
      }).catch(() => undefined);
    };
    const onError = (event: ErrorEvent) => report("browser.error", event.message || "Script error", event.error?.stack);
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      report("browser.unhandledrejection", reason instanceof Error ? reason.message : String(reason), reason instanceof Error ? reason.stack : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
