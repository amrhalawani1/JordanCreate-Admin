"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { reprocessTzkrtiDeliveries, type TzkrtiStatus } from "@/actions/tzkrti";
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEBHOOK_URL = "https://admin.jordancreate.com/api/tzkrti/webhook";

const STATUS_COPY: Record<string, string> = {
  processed: "Applied",
  unmapped: "Waiting for format",
  ignored: "Ignored",
  failed: "Failed",
  rejected: "Bad signature",
  received: "In progress",
};

function useRelative(iso: string | null) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!iso) return;
    const update = () => {
      const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
      if (minutes < 1) setLabel("just now");
      else if (minutes < 60) setLabel(`${minutes} min ago`);
      else if (minutes < 60 * 24) setLabel(`${Math.round(minutes / 60)} h ago`);
      else setLabel(new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [iso]);
  return label;
}

/**
 * Health of the Tzkrti → admin ticket feed: the address to give Tzkrti,
 * what arrived, and a replay button for deliveries stored before their
 * format was mapped (or that hit a database error).
 */
export function TzkrtiConnectionCard({ status }: { status: TzkrtiStatus }) {
  const router = useRouter();
  const { canEditTickets } = useAdminAccess();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const last = status.recent[0] ?? null;
  const lastLabel = useRelative(last?.received_at ?? null);

  const waiting = status.counts.unmapped + status.counts.failed + status.counts.received;
  const state = !status.configured || status.tableMissing
    ? { tone: "muted", text: "Not set up yet" }
    : !last
      ? { tone: "muted", text: "Waiting for the first delivery" }
      : status.counts.failed > 0 || last.status === "rejected"
        ? { tone: "bad", text: "Needs attention" }
        : waiting > 0
          ? { tone: "warn", text: "Receiving · format not mapped yet" }
          : { tone: "good", text: "Receiving tickets" };

  function copyUrl() {
    void navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  function reprocess() {
    startTransition(async () => {
      const result = await reprocessTzkrtiDeliveries();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.stillWaiting > 0
          ? `${result.processed} applied, ${result.stillWaiting} still waiting.`
          : `${result.processed} deliveries applied.`,
      );
      router.refresh();
    });
  }

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Tzkrti connection">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Tzkrti connection</h2>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                state.tone === "good" && "bg-emerald-400/10 text-emerald-400",
                state.tone === "warn" && "bg-orange/10 text-orange",
                state.tone === "bad" && "bg-red-400/10 text-red-400",
                state.tone === "muted" && "bg-white/[0.06] text-muted-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              {state.text}
            </span>
          </div>
          <p className="max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
            Tickets approved in Tzkrti arrive here automatically, already approved, and appear in the guest’s app under
            their own email. {lastLabel ? `Last delivery ${lastLabel}.` : null}
          </p>
        </div>
        {canEditTickets && waiting > 0 && status.configured ? (
          <Button variant="outline" size="sm" onClick={reprocess} disabled={pending}>
            <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden />
            {pending ? "Reprocessing…" : `Reprocess ${waiting} waiting`}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="min-w-0 max-w-full truncate rounded-md border border-border bg-black/30 px-2 py-1 font-mono text-xs text-foreground">
          {WEBHOOK_URL}
        </code>
        <Button variant="ghost" size="xs" onClick={copyUrl} aria-label="Copy the webhook address">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <span className="text-xs text-faint">The address to give Tzkrti.</span>
      </div>

      {status.configured && !status.tableMissing && last ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-5">
          {(["processed", "unmapped", "ignored", "failed", "rejected"] as const).map((key) => (
            <div key={key}>
              <dt className="text-faint">{STATUS_COPY[key]}</dt>
              <dd
                className={cn(
                  "mt-0.5 font-semibold tabular-nums text-foreground",
                  key === "failed" && status.counts.failed > 0 && "text-red-400",
                )}
              >
                {status.counts[key]}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {status.configured && !status.tableMissing && last?.error ? (
        <p className="mt-3 rounded-md border border-border bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
          <span className="text-faint">Latest note: </span>
          {last.error}
        </p>
      ) : null}

      {!status.configured ? (
        <p className="mt-3 text-xs text-faint">
          Set <code className="text-foreground">TZKRTI_WEBHOOK_SECRET</code> on the admin’s Vercel project and redeploy.
        </p>
      ) : status.tableMissing ? (
        <p className="mt-3 text-xs text-faint">The Tzkrti tables haven’t been created in the database yet.</p>
      ) : null}
    </section>
  );
}
