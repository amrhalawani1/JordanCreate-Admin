"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Flag, MailCheck, MailX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateGuestReport, type GuestReportsResult } from "@/actions/guest-reports";
import {
  GUEST_CARD_ORIGIN,
  hoursOpen,
  isClosed,
  reasonLabel,
  REPORT_STATUS_LABELS,
  REPORT_STATUSES,
  type ReportStatus,
} from "@/lib/guest-reports/reports";
import { cn } from "@/lib/utils";
import type { GuestReport } from "@/types/entities";

type View = "open" | "closed";

function formatWhen(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function waitingLabel(report: GuestReport): string {
  const hours = hoursOpen(report);
  if (hours < 1) return "Reported just now";
  if (hours < 48) return `Waiting ${Math.floor(hours)}h`;
  return `Waiting ${Math.floor(hours / 24)} days`;
}

/**
 * Profile reports from the guest app ("Report this profile" on a scanned card).
 * Each report also emails the team and the reporter; this is where the team
 * records what it did.
 */
export function ReportedIncidents({ result }: { result: GuestReportsResult }) {
  const [view, setView] = useState<View>("open");

  if (result.status === "missing") {
    return (
      <Section openCount={0}>
        <p className="text-sm text-muted-foreground">
          Reports are not switched on yet. Run <code className="text-foreground">supabase/guest-reports.sql</code> from the
          app repo in the Supabase SQL editor, then reload this page.
        </p>
      </Section>
    );
  }
  if (result.status === "error") {
    return (
      <Section openCount={0}>
        <p className="text-sm text-destructive">Couldn’t load reports: {result.error}</p>
      </Section>
    );
  }

  const open = result.reports.filter((report) => !isClosed(report.status));
  const closed = result.reports.filter((report) => isClosed(report.status));
  const shown = view === "open" ? open : closed;

  return (
    <Section openCount={open.length}>
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Report status">
        {(["open", "closed"] as const).map((tab) => (
          <Button
            key={tab}
            type="button"
            role="tab"
            aria-selected={view === tab}
            size="sm"
            variant={view === tab ? "default" : "outline"}
            onClick={() => setView(tab)}
          >
            {tab === "open" ? `Open (${open.length})` : `Closed (${closed.length})`}
          </Button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {view === "open" ? "No open reports. Nothing needs your attention." : "No closed reports yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function Section({ openCount, children }: { openCount: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby="reported-incidents" className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 id="reported-incidents" className="flex items-center gap-2 text-base font-semibold">
            <Flag className="size-4 text-destructive" aria-hidden />
            Reported incidents
            {openCount > 0 ? <Badge variant="destructive">{openCount} open</Badge> : null}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Profiles guests reported from the app. Review each one, act on it (edit or delete the guest below), then
            close it with a note.
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ReportRow({ report }: { report: GuestReport }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(report.status as ReportStatus);
  const [note, setNote] = useState(report.resolution_note ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = status !== report.status || note !== (report.resolution_note ?? "");
  const closed = isClosed(report.status);

  function save() {
    startTransition(async () => {
      const result = await updateGuestReport(report.id, { status, resolution_note: note });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isClosed(status) ? "Report closed." : "Report updated.");
      router.refresh();
    });
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {report.reported_name?.trim() || "Guest"}
            {report.reported_guest_id ? null : (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(account since deleted)</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{reasonLabel(report.reason)}</Badge>
            <span>{formatWhen(report.created_at)}</span>
            {!closed ? <span className="font-medium text-destructive">{waitingLabel(report)}</span> : null}
          </div>
        </div>
        {report.reported_slug ? (
          <a
            href={`${GUEST_CARD_ORIGIN}${encodeURIComponent(report.reported_slug)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
          >
            Open card <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>

      <p className="mt-3 text-sm whitespace-pre-wrap">{report.details?.trim() || <span className="text-muted-foreground">No details given.</span>}</p>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Reported by {report.reporter_email ?? "a guest who has since deleted their account"}</span>
        <span className="inline-flex items-center gap-1">
          {report.reporter_notified_at ? <MailCheck className="size-3.5" aria-hidden /> : <MailX className="size-3.5" aria-hidden />}
          {report.reporter_notified_at ? "Confirmation emailed" : "No confirmation email sent"}
        </span>
      </p>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Status">
          {REPORT_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={status === value}
              disabled={pending}
              onClick={() => setStatus(value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs transition-colors disabled:opacity-50",
                status === value ? "border-orange bg-orange/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {REPORT_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
        <Textarea
          aria-label="What the team did"
          placeholder={isClosed(status) ? "What did you do? Required to close." : "Notes for the team (optional)"}
          value={note}
          disabled={pending}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {report.resolved_at ? `Closed ${formatWhen(report.resolved_at)} by ${report.resolved_by ?? "the team"}` : ""}
          </p>
          <Button type="button" size="sm" onClick={save} disabled={!dirty || pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </li>
  );
}
