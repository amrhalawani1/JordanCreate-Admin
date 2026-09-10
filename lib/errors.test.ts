import assert from "node:assert/strict";
import test from "node:test";
import { getReadableError } from "./errors";

test("a duplicate ticket_ref is a collision, not a silent overwrite", () => {
  const message = getReadableError({
    code: "23505",
    message: 'duplicate key value violates unique constraint "tickets_ticket_ref_key"',
    details: "Key (ticket_ref)=(TZK-DUMMY-MANUAL-013) already exists.",
    hint: "",
  });
  assert.match(message, /collision/i);
  assert.match(message, /Do not overwrite the manual row/);
});

test("changing source on a manual ticket surfaces TICKET_SOURCE_COLLISION", () => {
  const message = getReadableError({
    code: "P0001",
    message: "TICKET_SOURCE_COLLISION: manual ticket TZK-DUMMY-MANUAL-013 cannot be overwritten by source webhook",
    details: "",
    hint: "",
  });
  assert.equal(
    message,
    "This manual ticket collides with an inbound update. The original row was left unchanged.",
  );
});
