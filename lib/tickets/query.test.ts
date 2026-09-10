import assert from "node:assert/strict";
import test from "node:test";
import {
  missingColumnName,
  omitUnknownColumn,
  stripSelectColumn,
  toQueueRow,
} from "./query";

test("missingColumnName reads Postgres 42703 messages", () => {
  assert.equal(
    missingColumnName({
      code: "42703",
      message: "column tickets.customer_name does not exist",
    }),
    "customer_name",
  );
});

test("stripSelectColumn removes only the missing field", () => {
  assert.equal(
    stripSelectColumn("id, customer_name, holder_name", "customer_name"),
    "id, holder_name",
  );
});

test("toQueueRow never copies qr_token and treats approved_at as approved", () => {
  const row = toQueueRow({
    id: "abc",
    holder_name: "Omar Haddad",
    customer_name: null,
    qr_token: "secret-should-not-leak",
    approved_at: "2026-09-06T22:58:43.389474+00:00",
    status: "active",
    created_at: "2026-09-01T00:00:00.000Z",
  });
  assert.equal(row.approved, true);
  assert.equal(row.holder_name, "Omar Haddad");
  assert.equal(row.customer_name, null);
  assert.equal("qr_token" in row, false);
});

test("omitUnknownColumn drops the field Postgres rejected", () => {
  const next = omitUnknownColumn(
    { holder_name: "Lina", customer_name: "Lina", phone: "+962795550001" },
    { code: "42703", message: "column tickets.customer_name does not exist" },
  );
  assert.deepEqual(next, { holder_name: "Lina", phone: "+962795550001" });
});
