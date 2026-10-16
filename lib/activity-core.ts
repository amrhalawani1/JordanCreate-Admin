/**
 * Pure helpers for the activity log: what gets recorded for an action, how
 * arguments are summarised without leaking secrets, and how an outcome is
 * classified. No Next or Supabase imports, so this file is unit-tested.
 */

export const ACTIVITY_KINDS = ["action", "route", "page", "auth", "error", "client"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_STATUSES = ["success", "failed", "denied", "error", "redirect", "not_found"] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export type ActivityEntry = {
  kind: ActivityKind;
  /** Stable identifier, e.g. "speakers.createSpeaker", "tzkrti.webhook", "/agenda". */
  name: string;
  ok: boolean;
  status: ActivityStatus;
  error?: string | null;
  durationMs?: number | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorLevel?: string | null;
  method?: string | null;
  path?: string | null;
  httpStatus?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  deployment?: string | null;
  meta?: Record<string, unknown> | null;
};

const SECRET_KEY = /pass|secret|token|key|authorization|cookie|qr|signature|otp|credential/i;
// A JWT, a prefixed API key, or a long token-looking string (letters and digits, no spaces).
const SECRET_VALUE = /^(eyJ[A-Za-z0-9_-]{10,}|sk_[A-Za-z0-9]{8,}|sb_[A-Za-z0-9_]{8,}|(?=.*[0-9])(?=.*[A-Za-z])[A-Za-z0-9_-]{32,200})$/;
const MAX_STRING = 200;
const MAX_DEPTH = 3;
const MAX_ITEMS = 20;

export function redactValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (SECRET_VALUE.test(value)) return "[redacted]";
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return "[…]";
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((item) => redactValue(item, depth + 1));
    return value.length > MAX_ITEMS ? [...items, `…${value.length - MAX_ITEMS} more`] : items;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? "[redacted]" : redactValue(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

function isFormDataLike(value: unknown): value is { entries(): Iterable<[string, unknown]> } {
  return typeof value === "object" && value !== null && typeof (value as { entries?: unknown }).entries === "function" && typeof FormData !== "undefined" && value instanceof FormData;
}

function isFileLike(value: unknown): value is { name: string; size: number; type: string } {
  return typeof value === "object" && value !== null && typeof (value as { size?: unknown }).size === "number" && typeof (value as { name?: unknown }).name === "string" && typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function";
}

/** A compact, secret-free picture of an action's arguments. */
export function summarizeArgs(args: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  args.forEach((arg, i) => {
    const key = `arg${i}`;
    if (arg === undefined) return;
    if (isFormDataLike(arg)) {
      const fields: string[] = [];
      const files: { field: string; name: string; size: number }[] = [];
      for (const [name, value] of arg.entries()) {
        if (isFileLike(value)) files.push({ field: name, name: value.name, size: value.size });
        else fields.push(name);
      }
      out[key] = { formFields: fields, ...(files.length ? { files } : {}) };
      return;
    }
    if (isFileLike(arg)) {
      out[key] = { file: { name: arg.name, size: arg.size, type: arg.type } };
      return;
    }
    out[key] = redactValue(arg);
  });
  return out;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

const DENIED = /permission|view-only|only a super admin|not allowed|sign in|signed in|admin profile/i;

/** How a returned value counts. Our actions return { success: false, error } on failure. */
export function classifyOutcome(result: unknown): { ok: boolean; status: ActivityStatus; error: string | null } {
  if (result && typeof result === "object") {
    const r = result as { success?: unknown; ok?: unknown; error?: unknown };
    if (r.success === false || r.ok === false || (typeof r.error === "string" && r.error && r.success !== true)) {
      const error = typeof r.error === "string" ? r.error : "Failed";
      return { ok: false, status: DENIED.test(error) ? "denied" : "failed", error };
    }
  }
  return { ok: true, status: "success", error: null };
}

/** How a thrown value counts. Next.js signals redirects and 404s by throwing. */
export function classifyError(err: unknown): { ok: boolean; status: ActivityStatus; error: string | null } {
  const digest = err && typeof err === "object" && "digest" in err ? String((err as { digest: unknown }).digest) : "";
  if (digest.startsWith("NEXT_REDIRECT")) return { ok: true, status: "redirect", error: null };
  if (digest.startsWith("NEXT_NOT_FOUND") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404")) {
    return { ok: true, status: "not_found", error: null };
  }
  const message = errorMessage(err);
  return { ok: false, status: DENIED.test(message) ? "denied" : "error", error: message };
}

export function statusForHttp(status: number): ActivityStatus {
  if (status < 400) return "success";
  if (status === 401 || status === 403) return "denied";
  if (status === 404) return "not_found";
  if (status >= 500) return "error";
  return "failed";
}

/** First address in X-Forwarded-For, or null. */
export function clientIp(get: (name: string) => string | null): string | null {
  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return get("x-real-ip")?.trim() || null;
}

/** The database row for an entry. */
export function toActivityRow(entry: ActivityEntry, deployment: string | null) {
  return {
    kind: entry.kind,
    name: entry.name.slice(0, 200),
    ok: entry.ok,
    status: entry.status,
    error: entry.error ? entry.error.slice(0, 2000) : null,
    duration_ms: entry.durationMs == null ? null : Math.round(entry.durationMs),
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    actor_level: entry.actorLevel ?? null,
    method: entry.method ?? null,
    path: entry.path ? entry.path.slice(0, 500) : null,
    http_status: entry.httpStatus ?? null,
    ip: entry.ip ?? null,
    user_agent: entry.userAgent ? entry.userAgent.slice(0, 300) : null,
    request_id: entry.requestId ?? null,
    deployment: entry.deployment ?? deployment,
    meta: (entry.meta ? redactValue(entry.meta) : {}) as Record<string, unknown>,
  };
}
