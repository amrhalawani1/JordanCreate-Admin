import { test } from "node:test";
import assert from "node:assert/strict";
import { BroadcastSchema, parseTestRecipient } from "./broadcasts";

test("a test recipient can be an email, matched in lower case", () => {
  assert.deepEqual(parseTestRecipient("  Guest@Example.COM "), { kind: "email", email: "guest@example.com" });
});

test("a test recipient can be a local or international phone number", () => {
  const local = parseTestRecipient("0791234567");
  assert.equal(local?.kind, "phone");
  assert.equal(parseTestRecipient("+962791234567")?.kind, "phone");
});

test("anything else is rejected", () => {
  assert.equal(parseTestRecipient(""), null);
  assert.equal(parseTestRecipient("not-an-email@"), null);
  assert.equal(parseTestRecipient("hello"), null);
});

test("a test send needs a recipient; a send to everyone does not", () => {
  const base = { body: "Doors open at 6.", deepLink: "" };
  assert.equal(BroadcastSchema.safeParse({ ...base, audience: "test", testRecipient: "" }).success, false);
  assert.equal(BroadcastSchema.safeParse({ ...base, audience: "test", testRecipient: "guest@example.com" }).success, true);
  assert.equal(BroadcastSchema.safeParse({ ...base, audience: "all" }).success, true);
});
