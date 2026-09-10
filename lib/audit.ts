import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CurrentAdmin } from "@/lib/auth/current-admin";
import type { Json } from "@/types/database";
import type { ChangeAction, ChangeLogInsert } from "@/types/entities";

const SKIP_KEYS = new Set(["password", "created_at", "updated_at", "qr_token"]);

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function redact(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (SKIP_KEYS.has(key) || key.toLowerCase().includes("password") || key.toLowerCase().includes("qr_token")) continue;
    out[key] = item;
  }
  return out;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function diffChanges(
  action: ChangeAction,
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const from = redact(before);
  const to = redact(after);

  if (action === "create") return { created: to ?? {} };
  if (action === "delete") return { deleted: from ?? {} };
  if (action === "reorder") return to ?? from ?? {};

  const changes: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})]);
  for (const key of keys) {
    const prev = from?.[key];
    const next = to?.[key];
    if (same(prev, next)) continue;
    changes[key] = { from: prev ?? null, to: next ?? null };
  }
  return changes;
}

export async function logChange(input: {
  actor: CurrentAdmin;
  action: ChangeAction;
  table: string;
  recordId?: string | number | null;
  summary: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  try {
    const row: ChangeLogInsert = {
      actor_id: input.actor.id,
      actor_name: `${input.actor.first_name} ${input.actor.last_name}`.trim() || input.actor.email,
      actor_email: input.actor.email,
      action: input.action,
      table_name: input.table,
      record_id: input.recordId == null ? null : String(input.recordId),
      summary: input.summary,
      changes: diffChanges(input.action, asRecord(input.before), asRecord(input.after)) as Json,
    };
    const supabase = createAdminClient();
    const { error } = await supabase.from("change_logs").insert(row);
    if (error) return;
    revalidatePath("/change-log");
  } catch {
    // Logging must never block a save.
  }
}
