import "server-only";

import { getCurrentAdmin, type CurrentAdmin } from "@/lib/auth/current-admin";
import { isStaffLevel } from "@/lib/auth/levels";

export type GuardResult =
  | { ok: true; admin: CurrentAdmin }
  | { ok: false; success: false; error: string };

export async function requireStaff(): Promise<GuardResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, success: false, error: "You don't have an admin profile." };
  }
  if (!isStaffLevel(admin.admin_level)) {
    return { ok: false, success: false, error: "You don't have permission to do that." };
  }
  return { ok: true, admin };
}

export async function requireSuperAdmin(): Promise<GuardResult> {
  const admin = await getCurrentAdmin();
  if (!admin || admin.admin_level !== "super_admin") {
    return { ok: false, success: false, error: "Only a super admin can manage admins." };
  }
  return { ok: true, admin };
}

export async function assertStaff(): Promise<CurrentAdmin> {
  const gate = await requireStaff();
  if (!gate.ok) throw new Error(gate.error);
  return gate.admin;
}
