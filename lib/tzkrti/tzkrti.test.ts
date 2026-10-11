import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readTzkrtiConfig } from "./config";
import { mapTzkrtiPayload } from "./mapper";
import { planTicketWrite, splitName, normalizeEmail, type ExistingTicket } from "./plan";
import type { TzkrtiTicketEvent } from "./types";
import { dedupeKey, sha256Hex, verifyTzkrtiRequest } from "./verify";

const SECRET = "test-secret-at-least-16-chars";
const hmacConfig = readTzkrtiConfig({ TZKRTI_WEBHOOK_SECRET: SECRET })!;
const URL_ = "https://admin.jordancreate.com/api/tzkrti/webhook";

test("config needs a real secret and reads header names and mode", () => {
  assert.equal(readTzkrtiConfig({}), null);
  assert.equal(readTzkrtiConfig({ TZKRTI_WEBHOOK_SECRET: "short" }), null);
  assert.deepEqual(hmacConfig, {
    secret: SECRET,
    mode: "hmac-sha256",
    signatureHeader: "x-tzkrti-signature",
    deliveryHeader: "x-tzkrti-delivery",
  });
  const custom = readTzkrtiConfig({
    TZKRTI_WEBHOOK_SECRET: SECRET,
    TZKRTI_SIGNATURE_MODE: "TOKEN",
    TZKRTI_SIGNATURE_HEADER: "X-Webhook-Token",
  })!;
  assert.equal(custom.mode, "token");
  assert.equal(custom.signatureHeader, "x-webhook-token");
});

test("HMAC signatures are accepted as hex, base64 or sha256=, and nothing else", () => {
  const body = '{"ticket":"T-1"}';
  const digest = createHmac("sha256", SECRET).update(body).digest();
  const ok = (signature: string, raw = body) =>
    verifyTzkrtiRequest({ rawBody: raw, headers: new Headers({ "x-tzkrti-signature": signature }), url: URL_ }, hmacConfig);
  assert.equal(ok(digest.toString("hex")), true);
  assert.equal(ok(`sha256=${digest.toString("hex")}`), true);
  assert.equal(ok(digest.toString("base64")), true);
  assert.equal(ok(digest.toString("hex"), '{"ticket":"T-2"}'), false, "a changed body must fail");
  assert.equal(ok("deadbeef"), false);
  assert.equal(
    verifyTzkrtiRequest({ rawBody: body, headers: new Headers(), url: URL_ }, hmacConfig),
    false,
    "no signature must fail",
  );
});

test("token mode accepts the secret in the header (with or without Bearer) or as ?token=", () => {
  const config = readTzkrtiConfig({ TZKRTI_WEBHOOK_SECRET: SECRET, TZKRTI_SIGNATURE_MODE: "token" })!;
  const check = (headers: Record<string, string>, url = URL_) =>
    verifyTzkrtiRequest({ rawBody: "{}", headers: new Headers(headers), url }, config);
  assert.equal(check({ "x-tzkrti-signature": SECRET }), true);
  assert.equal(check({ "x-tzkrti-signature": `Bearer ${SECRET}` }), true);
  assert.equal(check({}, `${URL_}?token=${SECRET}`), true);
  assert.equal(check({ "x-tzkrti-signature": "wrong" }), false);
  assert.equal(check({}), false);
});

test("duplicates are recognised by Tzkrti's delivery id, or by the body when there is none", () => {
  const hash = sha256Hex("{}");
  assert.equal(dedupeKey(new Headers({ "x-tzkrti-delivery": "abc" }), hmacConfig, hash), "delivery:abc");
  assert.equal(dedupeKey(new Headers(), hmacConfig, hash), `body:${hash}`);
});

test("until Tzkrti's format is mapped, every message is kept as unmapped", () => {
  assert.equal(mapTzkrtiPayload({ any: "thing" }).kind, "unmapped");
});

const NOW = "2026-10-12T10:00:00.000Z";
const opts = { now: NOW, newToken: () => "generated-token" };
const issue = (over: Partial<TzkrtiTicketEvent> = {}): TzkrtiTicketEvent => ({
  action: "issue",
  ticketRef: "TZK-1001",
  orderRef: "ORD-55",
  ticketType: "General",
  holder: { name: "Lina  Haddad", email: " Lina@Example.com ", phone: "0791234567" },
  buyer: { name: "Rami Haddad", email: "rami@example.com", phone: "+962793000001" },
  qrCode: "TZK-QR-1001",
  occurredAt: "2026-10-12T09:00:00.000Z",
  ...over,
});
const existing = (over: Partial<ExistingTicket> = {}): ExistingTicket => ({
  id: "row-1",
  source: "webhook",
  status: "active",
  qr_token: "TZK-QR-1001",
  approved_at: "2026-10-11T08:00:00.000Z",
  external_updated_at: "2026-10-12T08:00:00.000Z",
  ...over,
});

test("a new approved ticket is stored approved, under the attendee's own email", () => {
  const plan = planTicketWrite(null, issue(), opts);
  assert.equal(plan.kind, "insert");
  if (plan.kind !== "insert") return;
  assert.equal(plan.row.email, "lina@example.com");
  assert.equal(plan.row.holder_name, "Lina  Haddad");
  assert.deepEqual([plan.row.first_name, plan.row.last_name], ["Lina", "Haddad"]);
  assert.equal(plan.row.phone, "+962791234567");
  assert.equal(plan.row.customer_email, "rami@example.com");
  assert.equal(plan.row.qr_token, "TZK-QR-1001");
  assert.equal(plan.row.status, "active");
  assert.equal(plan.row.source, "webhook");
  assert.equal(plan.row.approved_at, NOW);
});

test("without a Tzkrti code a pass code is generated once and kept on later updates", () => {
  const inserted = planTicketWrite(null, issue({ qrCode: null }), opts);
  assert.equal(inserted.kind === "insert" && inserted.row.qr_token, "generated-token");
  const updated = planTicketWrite(existing({ qr_token: "kept-token" }), issue({ qrCode: null, occurredAt: "2026-10-12T09:30:00.000Z" }), opts);
  assert.equal(updated.kind === "update" && updated.row.qr_token, "kept-token");
});

test("updates keep the original approval time and never touch the ref or source", () => {
  const plan = planTicketWrite(existing(), issue(), opts);
  assert.equal(plan.kind, "update");
  if (plan.kind !== "update") return;
  assert.equal(plan.row.approved_at, "2026-10-11T08:00:00.000Z");
  assert.equal("ticket_ref" in plan.row, false);
  assert.equal("source" in plan.row, false);
});

test("hand-added tickets are never overwritten", () => {
  assert.equal(planTicketWrite(existing({ source: "manual" }), issue(), opts).kind, "conflict");
});

test("older messages never overwrite newer ones", () => {
  const plan = planTicketWrite(existing({ external_updated_at: "2026-10-12T09:59:00.000Z" }), issue(), opts);
  assert.equal(plan.kind, "skip");
});

test("a cancellation voids a known ticket and is skipped for an unknown one", () => {
  const voided = planTicketWrite(existing(), issue({ action: "void", occurredAt: "2026-10-12T09:45:00.000Z" }), opts);
  assert.deepEqual(voided, { kind: "update", id: "row-1", row: { status: "void", external_updated_at: "2026-10-12T09:45:00.000Z" } });
  assert.equal(planTicketWrite(null, issue({ action: "void" }), opts).kind, "skip");
});

test("a re-approved ticket comes back to active", () => {
  const plan = planTicketWrite(existing({ status: "void" }), issue(), opts);
  assert.equal(plan.kind === "update" && plan.row.status, "active");
});

test("a ticket without a usable attendee email or id is skipped, not stored wrongly", () => {
  assert.equal(planTicketWrite(null, issue({ holder: { name: "No Email", email: "not-an-email" } }), opts).kind, "skip");
  assert.equal(planTicketWrite(null, issue({ ticketRef: "  " }), opts).kind, "skip");
});

test("helpers", () => {
  assert.deepEqual(splitName("  Abdulrahman Mohammed Al-Khalidi "), { first: "Abdulrahman", last: "Mohammed Al-Khalidi" });
  assert.deepEqual(splitName(""), { first: "", last: "" });
  assert.equal(normalizeEmail("A@B.CO"), "a@b.co");
  assert.equal(normalizeEmail(null), null);
});
