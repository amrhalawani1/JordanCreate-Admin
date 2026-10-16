import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { recordEdgeActivity, requestIp } from "@/lib/activity-edge";
import { updateSession } from "@/lib/supabase/middleware";
import { canAccessPath, homePath } from "@/lib/auth/levels";
import { lookupAdminLevel } from "@/lib/auth/lookup-admin-level";
import { effectiveLevel, VIEW_AS_COOKIE } from "@/lib/auth/view-as";

/** Page views and turned-away requests go to the activity log without delaying the response. */
function log(event: NextFetchEvent, request: NextRequest, entry: { ok: boolean; status: "success" | "denied"; error?: string; actorId?: string | null; actorEmail?: string | null; actorLevel?: string | null }) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) return; // API routes record themselves.
  if (request.method !== "GET") return; // server actions record themselves.
  if (request.headers.get("next-router-prefetch") || request.headers.get("purpose") === "prefetch") return;
  event.waitUntil(
    recordEdgeActivity({
      kind: entry.status === "denied" ? "auth" : "page",
      name: pathname,
      ok: entry.ok,
      status: entry.status,
      error: entry.error ?? null,
      method: request.method,
      path: pathname + (request.nextUrl.search || ""),
      ip: requestIp(request),
      userAgent: request.headers.get("user-agent"),
      requestId: request.headers.get("x-vercel-id"),
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? null,
      actorLevel: entry.actorLevel ?? null,
      meta: request.headers.get("rsc") ? { navigation: "client" } : null,
    }),
  );
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Tzkrti's webhook signs its own requests; it never has an admin session.
  if (request.nextUrl.pathname.startsWith("/api/tzkrti/")) {
    return NextResponse.next();
  }
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const viewAs = request.cookies.get(VIEW_AS_COOKIE)?.value;

  if (!user && !isLoginRoute) {
    log(event, request, { ok: false, status: "denied", error: "Not signed in" });
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isLoginRoute) {
    const level = await lookupAdminLevel(user.id);
    const view = level ? effectiveLevel(level, viewAs) : null;
    const redirectUrl = new URL(view ? homePath(view) : "/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isLoginRoute) {
    const level = await lookupAdminLevel(user.id);
    const view = level ? effectiveLevel(level, viewAs) : null;
    if (view && !canAccessPath(view, pathname)) {
      log(event, request, { ok: false, status: "denied", error: `Level ${view} cannot open ${pathname}`, actorId: user.id, actorEmail: user.email, actorLevel: view });
      const redirectUrl = new URL(homePath(view), request.url);
      return NextResponse.redirect(redirectUrl);
    }
    log(event, request, { ok: true, status: "success", actorId: user.id, actorEmail: user.email, actorLevel: view ?? level ?? null });
  } else if (isLoginRoute) {
    log(event, request, { ok: true, status: "success" });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
