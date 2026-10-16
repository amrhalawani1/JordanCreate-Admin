"use server";

import { withActivity } from "@/lib/with-activity";

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

async function getAnalyticsSnapshotImpl(rangeKey: string): Promise<SnapshotResult> {
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

async function getRealtimeAnalyticsImpl(): Promise<RealtimeResult> {
  await assertStaff();
  const config = readAnalyticsConfig();
  if (!config.ok) return { status: "not-configured" };
  try {
    return { status: "ok", realtime: await getRealtime(config.config) };
  } catch (err) {
    return failure(err);
  }
}

// Every action is recorded in the activity log (lib/with-activity.ts): who, what, outcome, duration.
export const getAnalyticsSnapshot = withActivity("analytics.getAnalyticsSnapshot", getAnalyticsSnapshotImpl);
export const getRealtimeAnalytics = withActivity("analytics.getRealtimeAnalytics", getRealtimeAnalyticsImpl);
