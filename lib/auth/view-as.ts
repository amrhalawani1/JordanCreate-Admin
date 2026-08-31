import type { AdminLevel } from "@/types/entities";
import { isAdminLevel } from "@/lib/auth/levels";

export const VIEW_AS_COOKIE = "jc_view_as";

export function parseViewAs(value: string | undefined | null): AdminLevel | null {
  return isAdminLevel(value) ? value : null;
}

/** Super Admins can preview another level. Everyone else always sees their real level. */
export function effectiveLevel(realLevel: AdminLevel, viewAs: string | undefined | null): AdminLevel {
  if (realLevel !== "super_admin") return realLevel;
  return parseViewAs(viewAs) ?? realLevel;
}
