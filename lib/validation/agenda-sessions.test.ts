import assert from "node:assert/strict";
import test from "node:test";
import { AgendaSessionSchema } from "./agenda-sessions";

const session = {
  session_id: "S01",
  session_date: "2026-11-06",
  start_time: "18:00",
  end_time: "18:45",
  session_type: "Panel",
  title: "Opening panel",
  description: "The room opens.",
  speaker_handles: ["amr"],
  moderator_handle: null,
  duration_minutes: 45,
  interest_tag_ids: ["BRAND"],
  location_within_venue: null,
  status: "confirmed" as const,
  flag_notes: null,
  sort_order: 0,
};

test("a session saves with its own date", () => {
  const parsed = AgendaSessionSchema.safeParse({ ...session, session_date: "2026-11-07" });
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.session_date, "2026-11-07");
});

test("the date is required", () => {
  const parsed = AgendaSessionSchema.safeParse({ ...session, session_date: "" });
  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, "Date is required.");
});

test("a session needs at least one interest tag", () => {
  const parsed = AgendaSessionSchema.safeParse({ ...session, interest_tag_ids: [] });
  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, "Pick at least one interest tag.");
});

test("the date must be a calendar date, not free text", () => {
  const parsed = AgendaSessionSchema.safeParse({ ...session, session_date: "6 Nov" });
  assert.equal(parsed.success, false);
});
