"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { homePath, isAdminLevel } from "@/lib/auth/levels";
import { VIEW_AS_COOKIE } from "@/lib/auth/view-as";

export async function setViewAs(formData: FormData) {
  const level = String(formData.get("level") ?? "");
  const admin = await getCurrentAdmin();
  if (!admin || admin.admin_level !== "super_admin") {
    throw new Error("Only a super admin can change views.");
  }
  if (!isAdminLevel(level)) {
    throw new Error("Unknown view.");
  }

  const cookieStore = await cookies();
  if (level === "super_admin") {
    cookieStore.delete(VIEW_AS_COOKIE);
  } else {
    cookieStore.set(VIEW_AS_COOKIE, level, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  redirect(homePath(level));
}
