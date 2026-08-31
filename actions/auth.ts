"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminById } from "@/lib/auth/current-admin";
import { homePath } from "@/lib/auth/levels";
import { VIEW_AS_COOKIE } from "@/lib/auth/view-as";

const LoginSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Could not start a session. Try again." };
  }

  const profile = await getAdminById(user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return {
      error: "No admin profile is attached to this account. Ask a super admin to add you.",
    };
  }

  redirect(homePath(profile.admin_level));
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(VIEW_AS_COOKIE);
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
