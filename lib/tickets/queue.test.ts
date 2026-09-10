import assert from "node:assert/strict";
import test from "node:test";
import type { TicketQueueRow } from "@/types/entities";
import {
  buyerDiffers,
  conflictPhoneSet,
  filterTickets,
  groupConflicts,
  groupOrderWarnings,
  holderDisplayName,
  isAwaiting,
  ticketTabCounts,
} from "./queue";

function row(partial: Partial<TicketQueueRow> & Pick<TicketQueueRow, "id" | "created_at">): TicketQueueRow {
  return {
    guest_id: null,
    phone: null,
    email: null,
    customer_name: null,
    holder_name: null,
    ticket_ref: null,
    ticket_type: "general",
    status: "active",
    match_status: "pending",
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    rejection_note: null,
    source: "webhook",
    approved: false,
    ...partial,
  };
}

const seed: TicketQueueRow[] = [
  row({
    id: "ar",
    phone: "+962779453525",
    email: "aisha.khatib@example.com",
    customer_name: "عائشة الخطيب",
    holder_name: "عائشة الخطيب",
    ticket_ref: "TZK-DUMMY-AR-001",
    created_at: "2026-09-01T00:00:00.000Z",
  }),
  row({
    id: "long",
    phone: "+962790111222",
    holder_name: "Alexandra Constantinopoulou-Papadimitriou of the Jordan Create Fellowship",
    customer_name: "Alexandra Constantinopoulou-Papadimitriou of the Jordan Create Fellowship",
    created_at: "2026-09-01T12:00:00.000Z",
  }),
  row({
    id: "no-holder",
    phone: "+962791234567",
    customer_name: "Sami Nasser",
    holder_name: null,
    created_at: "2026-09-02T00:00:00.000Z",
  }),
  row({
    id: "no-email",
    phone: "+962798765432",
    email: null,
    holder_name: "Hana Qudah",
    customer_name: "Hana Qudah",
    created_at: "2026-09-02T06:00:00.000Z",
  }),
  row({
    id: "us",
    phone: "+14155552671",
    holder_name: "Maya Chen",
    customer_name: "Maya Chen",
    created_at: "2026-09-02T12:00:00.000Z",
  }),
  row({
    id: "buyer-diff",
    phone: "+962777000111",
    holder_name: "Nour Saleh",
    customer_name: "Omar Saleh",
    created_at: "2026-09-03T00:00:00.000Z",
  }),
  row({
    id: "conflict-a",
    phone: "+962791111111",
    holder_name: "Tariq Mansour",
    customer_name: "Tariq Mansour",
    match_status: "conflict",
    created_at: "2026-09-03T12:00:00.000Z",
  }),
  row({
    id: "conflict-b",
    phone: "+962791111111",
    holder_name: "Leen Mansour",
    customer_name: "Tariq Mansour",
    match_status: "conflict",
    created_at: "2026-09-03T13:00:00.000Z",
  }),
  row({
    id: "group-a",
    phone: "+962793000001",
    holder_name: "Rami Haddad",
    customer_name: "Rami Haddad",
    created_at: "2026-09-04T00:00:00.000Z",
  }),
  row({
    id: "group-b",
    phone: "+962793000002",
    holder_name: "Lina Haddad",
    customer_name: "Rami Haddad",
    created_at: "2026-09-04T01:00:00.000Z",
  }),
  row({
    id: "group-c",
    phone: "+962793000003",
    holder_name: "Yousef Haddad",
    customer_name: "Rami Haddad",
    created_at: "2026-09-04T02:00:00.000Z",
  }),
  row({
    id: "group-d",
    phone: "+962793000004",
    holder_name: "Sara Haddad",
    customer_name: "Rami Haddad",
    created_at: "2026-09-04T03:00:00.000Z",
  }),
  row({
    id: "warn-a",
    phone: "+962792222222",
    holder_name: "Lina Al-Masri",
    customer_name: "Lina Al-Masri",
    created_at: "2026-09-05T00:00:00.000Z",
  }),
  row({
    id: "warn-b",
    phone: "+962792222222",
    holder_name: "Guest 2 Al-Masri",
    customer_name: "Lina Al-Masri",
    created_at: "2026-09-05T01:00:00.000Z",
  }),
  row({
    id: "warn-c",
    phone: "+962792222222",
    holder_name: "Guest 3 Al-Masri",
    customer_name: "Lina Al-Masri",
    created_at: "2026-09-05T02:00:00.000Z",
  }),
  row({
    id: "warn-d",
    phone: "+962792222222",
    holder_name: "Guest 4 Al-Masri",
    customer_name: "Lina Al-Masri",
    created_at: "2026-09-05T03:00:00.000Z",
  }),
  row({
    id: "approved",
    phone: "+962795555555",
    holder_name: "Zaid Ammari",
    customer_name: "Zaid Ammari",
    approved: true,
    approved_at: "2026-09-06T12:00:00.000Z",
    created_at: "2026-09-05T12:00:00.000Z",
  }),
  row({
    id: "rejected",
    phone: "+962796666666",
    holder_name: "Duplicate Purchase",
    customer_name: "Duplicate Purchase",
    rejected_at: "2026-09-06T16:00:00.000Z",
    rejection_note: "Duplicate Tzkrti webhook for a refunded order.",
    created_at: "2026-09-06T00:00:00.000Z",
  }),
];

test("0779453525 finds +962779453525", () => {
  const found = filterTickets(seed, "all", "0779453525");
  assert.equal(found.some((item) => item.id === "ar"), true);
});

test("Rami Haddad four phones does not warn; Lina Al-Masri one phone does", () => {
  const warnings = groupOrderWarnings(seed);
  assert.equal(
    warnings.some((item) => item.customerName === "Rami Haddad"),
    false,
  );
  const lina = warnings.find((item) => item.customerName === "Lina Al-Masri");
  assert.ok(lina);
  assert.equal(lina?.count, 4);
  assert.equal(lina?.phone, "+962792222222");
});

test("conflicts group Tariq and Leen on one phone and never auto-pick a winner", () => {
  const groups = groupConflicts(seed);
  const tariq = groups.find((group) => group.phone === "+962791111111");
  assert.ok(tariq);
  assert.deepEqual(
    tariq?.rows.map((item) => item.holder_name),
    ["Tariq Mansour", "Leen Mansour"],
  );
  assert.equal(conflictPhoneSet(seed).has("+962791111111"), true);
});

test("the queue sorts oldest arrival first", () => {
  const awaiting = filterTickets(seed, "awaiting", "");
  const times = awaiting.map((item) => item.created_at);
  assert.deepEqual(times, [...times].sort((a, b) => a.localeCompare(b)));
  assert.equal(awaiting[0]?.id, "ar");
});

test("an empty awaiting list is empty, not an error", () => {
  const approvedOnly = seed.filter((item) => item.approved);
  assert.deepEqual(filterTickets(approvedOnly, "awaiting", ""), []);
  assert.equal(ticketTabCounts(approvedOnly).awaiting, 0);
});

test("null holder_name is labelled, and buyer copy only appears when it differs", () => {
  const missing = seed.find((item) => item.id === "no-holder")!;
  assert.equal(holderDisplayName(missing), "No attendee name");
  assert.equal(buyerDiffers(missing), true);
  const same = seed.find((item) => item.id === "ar")!;
  assert.equal(buyerDiffers(same), false);
  const different = seed.find((item) => item.id === "buyer-diff")!;
  assert.equal(buyerDiffers(different), true);
});

test("approved and rejected rows leave the awaiting tab", () => {
  assert.equal(isAwaiting(seed.find((item) => item.id === "approved")!), false);
  assert.equal(isAwaiting(seed.find((item) => item.id === "rejected")!), false);
  const awaitingIds = filterTickets(seed, "awaiting", "").map((item) => item.id);
  assert.equal(awaitingIds.includes("approved"), false);
  assert.equal(awaitingIds.includes("rejected"), false);
});
