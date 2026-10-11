"use server";

import { assertStaff } from "@/lib/auth/guard";
import { readAnalyticsConfig } from "@/lib/analytics/config";
import { AnalyticsError } from "@/lib/analytics/errors";
import { parseRangeKey, resolveRange } from "@/lib/analytics/ranges";
import { getRealtime, getSnapshot } from "@/lib/analytics/snapshot";
import type { AnalyticsSnapshot, RealtimeSnapshot } from "@/lib/analytics/types";

export type AnalyticsFailure = {
  status: "error";
  kind: string;
  message: string;
  hint: string;
};

export type SnapshotResult =
  | { status: "ok"; snapshot: AnalyticsSnapshot; propertyId: string }
  | { status: "not-configured"; missing: string[]; problem?: string }
  | AnalyticsFailure;

export type RealtimeResult = { status: "ok"; realtime: RealtimeSnapshot } | AnalyticsFailure | { status: "not-configured" };

function failure(err: unknown): AnalyticsFailure {
  if (err instanceof AnalyticsError) {
    return { status: "error", kind: err.kind, message: err.message, hint: err.hint };
  }
  console.error("[analytics]", err);
  return {
    status: "error",
    kind: "unknown",
    message: "Website analytics could not be loaded.",
    hint: "Try again in a moment. If it keeps happening, check the server logs.",
  };
}

export async function getAnalyticsSnapshot(rangeKey: string): Promise<SnapshotResult> {
  await assertStaff();
  const config = readAnalyticsConfig();
  if (!config.ok) return { status: "not-configured", missing: config.missing, problem: config.problem };
  try {
    const snapshot = await getSnapshot(config.config, resolveRange(parseRangeKey(rangeKey)));
    return { status: "ok", snapshot, propertyId: config.config.propertyId };
  } catch (err) {
    return failure(err);
  }
}

export async function getRealtimeAnalytics(): Promise<RealtimeResult> {
  await assertStaff();
  const config = readAnalyticsConfig();
  if (!config.ok) return { status: "not-configured" };
  try {
    return { status: "ok", realtime: await getRealtime(config.config) };
  } catch (err) {
    return failure(err);
  }
}
