import "server-only";
import { WEBSITE_ORIGIN } from "@/lib/previews/speaker-preview-url";

/**
 * Tell jordancreate.com that programme content changed so it drops its
 * caches now rather than within its 60 s windows. Fire-and-forget: a failure
 * here must never fail the admin's save. Set WEBSITE_REVALIDATE_SECRET on
 * both projects to lock the endpoint down (optional).
 */
export function revalidateWebsite(scope: "speakers" | "agenda"): void {
  const secret = process.env.WEBSITE_REVALIDATE_SECRET?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["x-revalidate-secret"] = secret;
  void fetch(`${WEBSITE_ORIGIN}/api/revalidate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scope }),
    signal: AbortSignal.timeout(4000),
  }).catch(() => undefined);
}
