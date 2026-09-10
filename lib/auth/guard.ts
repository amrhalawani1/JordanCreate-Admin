import "server-only";

import { getCurrentAdmin, type CurrentAdmin } from "@/lib/auth/current-admin";
import { isStaffEditorLevel, isStaffLevel, isViewOnlyLevel } from "@/lib/auth/levels";

export type GuardResult =
  | { ok: true; admin: CurrentAdmin }
  | { ok: false; success: false; error: string };

const VIEW_ONLY_ERROR = "You have view-only access. You can look, but you cannot save changes.";
const NO_PROFILE_ERROR = "You don't have an admin profile.";
const NO_PERMISSION_ERROR = "You don't have permission to do that.";

export async function requireStaff(): Promise<GuardResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, success: false, error: NO_PROFILE_ERROR };
  }
  if (isViewOnlyLevel(admin.admin_level)) {
    return { ok: false, success: false, error: VIEW_ONLY_ERROR };
  }
  if (!isStaffEditorLevel(admin.admin_level)) {
    return { ok: false, success: false, error: NO_PERMISSION_ERROR };
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

export async function requireGuestEditor(): Promise<GuardResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, success: false, error: NO_PROFILE_ERROR };
  }
  if (isViewOnlyLevel(admin.admin_level)) {
    return { ok: false, success: false, error: VIEW_ONLY_ERROR };
  }
  if (!isStaffEditorLevel(admin.admin_level) && admin.admin_level !== "guest_manager") {
    return { ok: false, success: false, error: NO_PERMISSION_ERROR };
  }
  return { ok: true, admin };
}

export async function assertStaff(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error(NO_PROFILE_ERROR);
  if (!isStaffLevel(admin.admin_level)) throw new Error(NO_PERMISSION_ERROR);
  return admin;
}

export async function assertGuestEditor(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error(NO_PROFILE_ERROR);
  if (!isStaffLevel(admin.admin_level) && admin.admin_level !== "guest_manager") {
    throw new Error(NO_PERMISSION_ERROR);
  }
  return admin;
}

export async function assertTicketReader(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error(NO_PROFILE_ERROR);
  if (!isStaffLevel(admin.admin_level) && admin.admin_level !== "guest_manager") {
    throw new Error(NO_PERMISSION_ERROR);
  }
  return admin;
}

export async function requireTicketEditor(): Promise<GuardResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, success: false, error: NO_PROFILE_ERROR };
  }
  if (isViewOnlyLevel(admin.admin_level)) {
    return { ok: false, success: false, error: VIEW_ONLY_ERROR };
  }
  if (!isStaffEditorLevel(admin.admin_level) && admin.admin_level !== "guest_manager") {
    return { ok: false, success: false, error: NO_PERMISSION_ERROR };
  }
  return { ok: true, admin };
}

export async function requireTicketAdmin(): Promise<GuardResult> {
  return requireStaff();
}
