import { ADMIN_LEVEL_VALUES, type AdminLevel } from "@/types/entities";

const SUPER_ADMIN_ONLY_PREFIXES = ["/admin-settings", "/request-a-feature", "/change-log"];

export function isAdminLevel(value: string | undefined | null): value is AdminLevel {
  return ADMIN_LEVEL_VALUES.includes(value as AdminLevel);
}

export function homePath(level: AdminLevel): string {
  return level === "guest_manager" ? "/guests" : "/";
}

export function canAccessPath(level: AdminLevel, pathname: string): boolean {
  if (level === "super_admin") return true;

  if (level === "guest_manager") {
    return pathname === "/guests" || pathname.startsWith("/guests/");
  }

  return !SUPER_ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isStaffLevel(level: AdminLevel): boolean {
  return level === "super_admin" || level === "admin";
}
