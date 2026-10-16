import { clientIp, toActivityRow, type ActivityEntry } from "@/lib/activity-core";

/**
 * Activity writer for proxy.ts, which runs before the app and cannot use the
 * Supabase client or pino. Plain fetch to the REST API with the service role
 * key, plus one JSON console line for Vercel's logs. Never throws.
 */
export async function recordEdgeActivity(entry: ActivityEntry): Promise<void> {
  const row = toActivityRow(entry, process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "dev");
  const line = JSON.stringify({ level: entry.ok ? "info" : "warn", time: new Date().toISOString(), app: "jordan-create-admin", msg: `${entry.kind} ${entry.name} ${entry.status}`, activity: row });
  console.log(line);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(`${url}/rest/v1/activity_logs`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.error(JSON.stringify({ level: "error", msg: "activity log write failed", status: res.status, activity: row.name }));
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "activity log write failed", err: err instanceof Error ? err.message : String(err) }));
  }
}

export function requestIp(request: Request): string | null {
  return clientIp((name) => request.headers.get(name));
}
