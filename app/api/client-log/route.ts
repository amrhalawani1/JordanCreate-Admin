import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminById } from "@/lib/auth/current-admin";
import { recordActivity } from "@/lib/activity";
import { clientIp } from "@/lib/activity-core";

export const runtime = "nodejs";

/** Browser-side errors from the admin UI (see components/layout/ClientErrorReporter.tsx). Signed-in admins only. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { message?: unknown; stack?: unknown; url?: unknown; source?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const admin = await getAdminById(user.id);
  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "Unknown browser error";
  let path: string | null = null;
  try {
    path = typeof body.url === "string" ? new URL(body.url).pathname : null;
  } catch {
    path = null;
  }
  recordActivity({
    kind: "client",
    name: typeof body.source === "string" ? body.source.slice(0, 100) : "browser.error",
    ok: false,
    status: "error",
    error: message,
    path,
    ip: clientIp((h) => request.headers.get(h)),
    userAgent: request.headers.get("user-agent"),
    requestId: request.headers.get("x-vercel-id"),
    actorId: admin?.id ?? user.id,
    actorEmail: admin?.email ?? user.email ?? null,
    actorLevel: admin?.admin_level ?? null,
    meta: { stack: typeof body.stack === "string" ? body.stack.slice(0, 3000) : null },
  });
  return NextResponse.json({ ok: true });
}
