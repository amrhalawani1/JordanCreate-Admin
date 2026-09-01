import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { canAccessPath, homePath } from "@/lib/auth/levels";
import { lookupAdminLevel } from "@/lib/auth/lookup-admin-level";
import { effectiveLevel, VIEW_AS_COOKIE } from "@/lib/auth/view-as";

export default async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const viewAs = request.cookies.get(VIEW_AS_COOKIE)?.value;

  if (!user && !isLoginRoute) {
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
      const redirectUrl = new URL(homePath(view), request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
