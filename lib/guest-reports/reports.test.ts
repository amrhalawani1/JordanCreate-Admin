import assert from "node:assert/strict";
import test from "node:test";
import { hoursOpen, ReportUpdateSchema, sortReports } from "./reports";
import type { GuestReport } from "@/types/entities";

function report(id: string, status: string, created_at: string): GuestReport {
  return {
    id,
    status,
    created_at,
    reason: "spam",
    reporter_guest_id: null,
    reporter_email: null,
    reported_guest_id: null,
    reported_slug: null,
    reported_name: null,
    details: null,
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    reporter_notified_at: null,
    team_notified_at: null,
  };
}

test("open reports come first, oldest first; closed ones after, newest first", () => {
  const sorted = sortReports([
    report("closed-old", "resolved", "2026-09-01T10:00:00Z"),
    report("open-new", "open", "2026-09-26T10:00:00Z"),
    report("closed-new", "dismissed", "2026-09-20T10:00:00Z"),
    report("open-old", "reviewing", "2026-09-25T10:00:00Z"),
  ]);
  assert.deepEqual(sorted.map((r) => r.id), ["open-old", "open-new", "closed-new", "closed-old"]);
});

test("closing a report needs a note", () => {
  assert.equal(ReportUpdateSchema.safeParse({ status: "resolved", resolution_note: "" }).success, false);
  assert.equal(ReportUpdateSchema.safeParse({ status: "dismissed", resolution_note: "Checked, nothing wrong." }).success, true);
  assert.equal(ReportUpdateSchema.safeParse({ status: "reviewing" }).success, true);
  assert.equal(ReportUpdateSchema.safeParse({ status: "deleted", resolution_note: "x" }).success, false);
});

test("counts how long a report has waited", () => {
  const now = new Date("2026-09-27T12:00:00Z");
  assert.equal(hoursOpen({ created_at: "2026-09-27T09:00:00Z" }, now), 3);
});
