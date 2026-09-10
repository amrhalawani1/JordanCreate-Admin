import assert from "node:assert/strict";
import test from "node:test";
import type { AdminLevel } from "@/types/entities";
import {
  NO_ADMIN_PROFILE_ERROR,
  NO_TICKET_PERMISSION_ERROR,
  TICKET_ACTIONS,
  VIEW_ONLY_TICKET_ERROR,
  canReadTickets,
  canTicketAction,
  isQrTokenIssued,
  ticketActionDenied,
  type TicketAction,
} from "./permissions";

/** Same gate the server actions call — not UI visibility. */
function invokeAs(level: AdminLevel | null, action: TicketAction): string | null {
  return ticketActionDenied(level, action);
}

const EDITOR_ACTIONS = ["approve", "reject", "restore", "create", "update"] as const satisfies TicketAction[];

test("guest_manager can approve, reject, restore, create, and update", () => {
  for (const action of EDITOR_ACTIONS) {
    assert.equal(invokeAs("guest_manager", action), null, action);
    assert.equal(canTicketAction("guest_manager", action), true, action);
  }
});

test("guest_manager cannot void or delete", () => {
  assert.equal(invokeAs("guest_manager", "void"), NO_TICKET_PERMISSION_ERROR);
  assert.equal(invokeAs("guest_manager", "delete"), NO_TICKET_PERMISSION_ERROR);
});

test("admin_view_only cannot mutate tickets", () => {
  for (const action of TICKET_ACTIONS) {
    assert.equal(invokeAs("admin_view_only", action), VIEW_ONLY_TICKET_ERROR, action);
  }
});

test("admin and super_admin can void and delete", () => {
  for (const level of ["admin", "super_admin"] as const) {
    assert.equal(invokeAs(level, "void"), null, level);
    assert.equal(invokeAs(level, "delete"), null, level);
    assert.equal(invokeAs(level, "approve"), null, level);
  }
});

test("a missing admin profile is denied", () => {
  assert.equal(invokeAs(null, "approve"), NO_ADMIN_PROFILE_ERROR);
});

test("guest_manager can read the queue", () => {
  assert.equal(canReadTickets("guest_manager"), true);
  assert.equal(canReadTickets("admin_view_only"), true);
});

test("an issued gate credential is any non-blank qr_token", () => {
  assert.equal(isQrTokenIssued(null), false);
  assert.equal(isQrTokenIssued(""), false);
  assert.equal(isQrTokenIssued("   "), false);
  assert.equal(isQrTokenIssued("seed-approved-token-do-not-display"), true);
});
