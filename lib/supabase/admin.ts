import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client. This is the ONLY client ever used for reads/writes
 * against the data tables in this app — never the anon key, never from the
 * browser. `import "server-only"` above makes any accidental client-side
 * import a build failure rather than a leaked secret.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
