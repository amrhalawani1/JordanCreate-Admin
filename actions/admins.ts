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

/** GoTrue's "this email already has a login" error (a guest who signed into the app, usually). */
function isEmailTakenError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  return error.code === "email_exists" || /already been registered|already registered/i.test(error.message ?? "");
}

/** Finds an existing auth user by email. The admin API has no email filter, so page through. */
async function findAuthUserByEmail(supabase: ReturnType<typeof createAdminClient>, email: string) {
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((user) => (user.email ?? "").toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
  return null;
}

/** True when this auth user also owns a guest profile in the mobile app. */
async function hasGuestProfile(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<boolean> {
  // auth_user_id is not in the generated types yet (same gap the tickets action casts around).
  const { data, error } = await supabase
    .from("guest_profiles")
    .select("guest_id")
    .eq("auth_user_id" as never, userId as never)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
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

  if (isEmailTakenError(authError)) {
    return promoteExistingUser(supabase, gate.admin, parsed.data);
  }

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

/**
 * The email already has a login (typically a guest who signed into the app).
 * Give that same account an admin profile instead of failing: the admins row
 * goes in first, then the auth user gets the password and admin metadata, so
 * nothing irreversible happens to the login unless the row was written.
 */
async function promoteExistingUser(
  supabase: ReturnType<typeof createAdminClient>,
  actor: Parameters<typeof logChange>[0]["actor"],
  values: { first_name: string; last_name: string; role: string; admin_level: AdminInsert["admin_level"]; email: string; password: string },
): Promise<ActionResult> {
  const { first_name, last_name, role, admin_level, email, password } = values;

  let existing;
  try {
    existing = await findAuthUserByEmail(supabase, email);
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }
  if (!existing) {
    return { success: false, error: "That email already has a login, but it could not be found. Try again." };
  }

  const { data: already, error: alreadyError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", existing.id)
    .maybeSingle();
  if (alreadyError) return { success: false, error: getReadableError(alreadyError) };
  if (already) return { success: false, error: "This person is already an admin." };

  const row: AdminInsert = { id: existing.id, first_name, last_name, role, admin_level, email: existing.email ?? email };

  try {
    await insertRow<Admin, AdminInsert>(supabase, "admins", row);
  } catch (err) {
    return { success: false, error: getReadableError(err) };
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...existing.app_metadata, admin_level, admin_promoted_from_existing: true },
    user_metadata: { ...existing.user_metadata, first_name, last_name, role },
  });
  if (authError) {
    await deleteRow(supabase, "admins", { column: "id", value: existing.id }).catch(() => undefined);
    return { success: false, error: authError.message };
  }

  await logChange({
    actor,
    action: "create",
    table: "admins",
    recordId: existing.id,
    summary: `Added admin ${first_name} ${last_name} (existing app account)`,
    after: row,
  });
  revalidatePath("/admin-settings");
  return { success: true };
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
    // An admin who is also an app guest keeps their login: only the admin
    // profile and admin metadata are removed.
    const { data: authUser } = await supabase.auth.admin.getUserById(id);
    const promoted = authUser?.user?.app_metadata?.admin_promoted_from_existing === true;
    const keepLogin = promoted || (await hasGuestProfile(supabase, id));

    if (keepLogin) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        app_metadata: { admin_level: null, admin_promoted_from_existing: null },
      });
      if (authError) {
        return { success: false, error: authError.message };
      }
    } else {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        return { success: false, error: authError.message };
      }
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
