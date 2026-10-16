import "server-only";

import { after } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentDeploymentId } from "@/lib/deployment-id";
import { logger } from "@/lib/logger";
import { clientIp, toActivityRow, type ActivityEntry } from "@/lib/activity-core";
import type { Json } from "@/types/database";

export type { ActivityEntry } from "@/lib/activity-core";

/** Request details available inside a server action or route handler. */
export async function requestContext(): Promise<Pick<ActivityEntry, "ip" | "userAgent" | "requestId" | "path">> {
  try {
    const h = await headers();
    const get = (name: string) => h.get(name);
    let path: string | null = null;
    const referer = get("referer");
    if (referer) {
      try {
        path = new URL(referer).pathname;
      } catch {
        path = null;
      }
    }
    return {
      ip: clientIp(get),
      userAgent: get("user-agent"),
      requestId: get("x-vercel-id"),
      path,
    };
  } catch {
    return {};
  }
}

async function write(entry: ActivityEntry): Promise<void> {
  const row = toActivityRow(entry, currentDeploymentId());
  try {
    const { error } = await createAdminClient().from("activity_logs").insert({ ...row, meta: row.meta as Json });
    if (error) logger.error({ err: error.message, activity: row.name }, "activity log write failed");
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), activity: row.name }, "activity log write failed");
  }
}

/**
 * Records one activity: a structured log line now, and a database row after
 * the response is sent (so logging never slows the user down). Never throws.
 */
export function recordActivity(entry: ActivityEntry): void {
  const row = toActivityRow(entry, currentDeploymentId());
  const line = `${entry.kind} ${entry.name} ${entry.status}`;
  if (entry.ok) logger.info({ activity: row }, line);
  else logger.warn({ activity: row }, line);

  try {
    after(() => write(entry));
  } catch {
    // Outside a request scope (instrumentation hooks): write straight away.
    void write(entry);
  }
}
