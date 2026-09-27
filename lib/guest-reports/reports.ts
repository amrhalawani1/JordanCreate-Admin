import { z } from "zod";
import type { GuestReport } from "@/types/entities";

/** Keep in step with supabase/functions/report-profile/run.ts in Jordan-Create-App. */
export const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate: "Inappropriate photo or text",
  harassment: "Harassment or threats",
  impersonation: "Pretending to be someone else",
  spam: "Spam or advertising",
  other: "Something else",
};

export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  reviewing: "Reviewing",
  resolved: "Action taken",
  dismissed: "No action needed",
};

export const GUEST_CARD_ORIGIN = "https://guest.jordancreate.com/u/";

export const ReportUpdateSchema = z
  .object({
    status: z.enum(REPORT_STATUSES),
    resolution_note: z.string().trim().max(2000, "Keep the note under 2,000 characters.").optional().default(""),
  })
  .refine((value) => value.status === "open" || value.status === "reviewing" || value.resolution_note.length > 0, {
    message: "Add a note saying what you did before closing the report.",
    path: ["resolution_note"],
  });

export function isClosed(status: string): boolean {
  return status === "resolved" || status === "dismissed";
}

export function reasonLabel(reason: string): string {
  return REPORT_REASON_LABELS[reason] ?? reason;
}

/** Open reports first (oldest first, so nothing waits), then closed ones newest first. */
export function sortReports(reports: GuestReport[]): GuestReport[] {
  return [...reports].sort((a, b) => {
    const aClosed = isClosed(a.status);
    const bClosed = isClosed(b.status);
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    return aClosed ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at);
  });
}

/** How long a report has been waiting. */
export function hoursOpen(report: Pick<GuestReport, "created_at">, now: Date = new Date()): number {
  return Math.max(0, (now.getTime() - Date.parse(report.created_at)) / 3_600_000);
}
