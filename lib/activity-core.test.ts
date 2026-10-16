import test from "node:test";
import assert from "node:assert/strict";
import { classifyError, classifyOutcome, redactValue, statusForHttp, summarizeArgs, toActivityRow } from "./activity-core";

test("secrets are redacted by key and by shape, long strings are trimmed", () => {
  const out = redactValue({ email: "a@b.co", password: "hunter2", nested: { api_key: "x", token: "y", fine: "ok" }, jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }) as Record<string, unknown>;
  assert.equal(out.email, "a@b.co");
  assert.equal(out.password, "[redacted]");
  assert.deepEqual(out.nested, { api_key: "[redacted]", token: "[redacted]", fine: "ok" });
  assert.equal(out.jwt, "[redacted]");
  const long = redactValue("x".repeat(500)) as string;
  assert.equal(long.length, 201);
});

test("argument summaries keep ids and field names, never form values", () => {
  const fd = new FormData();
  fd.set("email", "a@b.co");
  fd.set("password", "hunter2");
  const out = summarizeArgs([undefined, fd, "speaker-handle", { handle: "x", qr_token: "secret" }, [1, 2, 3]]);
  assert.equal("arg0" in out, false);
  assert.deepEqual(out.arg1, { formFields: ["email", "password"] });
  assert.equal(out.arg2, "speaker-handle");
  assert.deepEqual(out.arg3, { handle: "x", qr_token: "[redacted]" });
  assert.deepEqual(out.arg4, [1, 2, 3]);
});

test("outcomes: ActionResult failures, denials, redirects, not-found and thrown errors", () => {
  assert.deepEqual(classifyOutcome({ success: true }), { ok: true, status: "success", error: null });
  assert.deepEqual(classifyOutcome([{ id: 1 }]), { ok: true, status: "success", error: null });
  assert.deepEqual(classifyOutcome({ success: false, error: "A required field is missing." }), { ok: false, status: "failed", error: "A required field is missing." });
  assert.equal(classifyOutcome({ success: false, error: "You don't have permission to do that." }).status, "denied");
  assert.equal(classifyOutcome({ success: false, error: "You have view-only access. You can look, but you cannot save changes." }).status, "denied");
  assert.deepEqual(classifyError({ digest: "NEXT_REDIRECT;replace;/guests;307;" }), { ok: true, status: "redirect", error: null });
  assert.deepEqual(classifyError({ digest: "NEXT_NOT_FOUND" }), { ok: true, status: "not_found", error: null });
  assert.deepEqual(classifyError(new Error("boom")), { ok: false, status: "error", error: "boom" });
  assert.equal(classifyError(new Error("Only a super admin can manage admins.")).status, "denied");
});

test("http statuses and the stored row", () => {
  assert.equal(statusForHttp(200), "success");
  assert.equal(statusForHttp(401), "denied");
  assert.equal(statusForHttp(404), "not_found");
  assert.equal(statusForHttp(413), "failed");
  assert.equal(statusForHttp(500), "error");
  const row = toActivityRow({ kind: "action", name: "speakers.createSpeaker", ok: false, status: "failed", error: "x".repeat(3000), durationMs: 12.6, meta: { password: "p" } }, "dep-1");
  assert.equal(row.error!.length, 2000);
  assert.equal(row.duration_ms, 13);
  assert.equal(row.deployment, "dep-1");
  assert.deepEqual(row.meta, { password: "[redacted]" });
});
