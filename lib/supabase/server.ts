import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Anon-key client bound to the request's cookies. Used only for Supabase
 * Auth (sign in / sign out / getUser) in Server Components and Server
 * Actions — never for table reads or writes. See lib/supabase/admin.ts for
 * the client that talks to the data tables.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no way to set cookies.
            // Safe to ignore as long as proxy.ts also refreshes the session.
          }
        },
      },
    },
  );
}
