"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabase-crud";
import { getReadableError } from "@/lib/errors";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { CreateAdminSchema, UpdateAdminSchema } from "@/lib/validation/admins";
import type { Admin, AdminInsert, AdminUpdate } from "@/types/entities";
import { logChange } from "@/lib/audit";

type ActionResult = { success: true } | { success: false; error: string };

async function countSuperAdmins(exceptId?: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("admins").select("id").eq("admin_level", "super_admin");
  if (error) throw error;
  return (data ?? []).filter((row) => row.id !== exceptId).length;
}

export async function getAdmins(): Promise<Admin[]> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) throw new Error(gate.error);
  const supabase = createAdminClient();
  return fetchAll<Admin>(supabase, "admins", { column: "last_name" });
}

/** True once the admin_level enum accepts admin_view_only. */
export async function adminViewOnlyLevelReady(): Promise<boolean> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return false;
  const supabase = createAdminClient();
  const { error } = await supabase.from("admins").select("id").eq("admin_level", "admin_view_only").limit(1);
  return !error;
}

export async function createAdmin(values: unknown): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = CreateAdminSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createAdminClient();
  const { first_name, last_name, role, admin_level, email, password } = parsed.data;

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { admin_level },
    user_metadata: { first_name, last_name, role },
  });

  if (authError || !created.user) {
    return { success: false, error: authError?.message ?? "Could not create the login." };
  }

  try {
    const row: AdminInsert = {
      id: created.user.id,
      first_name,
      last_name,
      role,
      admin_level,
      email,
    };
    await insertRow<Admin, AdminInsert>(supabase, "admins", row);
    await logChange({
      actor: gate.admin,
      action: "create",
      table: "admins",
      recordId: created.user.id,
      summary: `Added admin ${first_name} ${last_name}`,
      after: row,
    });
    revalidatePath("/admin-settings");
    return { success: true };
  } catch (err) {
    await supabase.auth.admin.deleteUser(created.user.id);
    return { success: false, error: getReadableError(err) };
  }
}

export async function updateAdmin(id: string, values: unknown): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = UpdateAdminSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("admins")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError || !current) {
    return { success: false, error: "That admin no longer exists." };
  }

  if (id === gate.admin.id && parsed.data.admin_level !== "super_admin") {
    return { success: false, error: "You cannot demote yourself." };
  }

  if (current.admin_level === "super_admin" && parsed.data.admin_level !== "super_admin") {
    const remaining = await countSuperAdmins(id);
    if (remaining < 1) {
      return { success: false, error: "There must be at least one super admin." };
    }
  }

  const { first_name, last_name, role, admin_level, email, password } = parsed.data;

  try {
    const authPatch: {
      email?: string;
      password?: string;
      app_metadata?: { admin_level: typeof admin_level };
      user_metadata?: { first_name: string; last_name: string; role: string };
    } = {
      app_metadata: { admin_level },
      user_metadata: { first_name, last_name, role },
    };
    if (email !== current.email) authPatch.email = email;
    if (password) authPatch.password = password;

    const { error: authError } = await supabase.auth.admin.updateUserById(id, authPatch);
    if (authError) {
      return { success: false, error: authError.message };
    }

    const row: AdminUpdate = {
      first_name,
      last_name,
      role,
      admin_level,
      email,
      updated_at: new Date().toISOString(),
    };
    await updateRow<Admin, AdminUpdate>(supabase, "admins", { column: "id", value: id }, row);
    await logChange({
      actor: gate.admin,
      action: "update",
      table: "admins",
      recordId: id,
      summary: `Updated admin ${first_name} ${last_name}`,
      before: current,
      after: { ...current, ...row },
    });
    revalidatePath("/admin-settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}

export async function deleteAdmin(id: string): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  if (id === gate.admin.id) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const supabase = createAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("admins")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError || !current) {
    return { success: false, error: "That admin no longer exists." };
  }

  if (current.admin_level === "super_admin") {
    const remaining = await countSuperAdmins(id);
    if (remaining < 1) {
      return { success: false, error: "There must be at least one super admin." };
    }
  }

  try {
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return { success: false, error: authError.message };
    }
    await deleteRow(supabase, "admins", { column: "id", value: id });
    await logChange({
      actor: gate.admin,
      action: "delete",
      table: "admins",
      recordId: id,
      summary: `Deleted admin ${current.first_name} ${current.last_name}`,
      before: current,
    });
    revalidatePath("/admin-settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
}
