import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { effectiveLevel, VIEW_AS_COOKIE } from "@/lib/auth/view-as";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MissingAdminProfile } from "@/components/layout/MissingAdminProfile";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = await getCurrentAdmin();

  if (!admin) {
    return <MissingAdminProfile email={user?.email} />;
  }

  const cookieStore = await cookies();
  const viewLevel = effectiveLevel(admin.admin_level, cookieStore.get(VIEW_AS_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar adminLevel={viewLevel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          email={admin.email}
          name={`${admin.first_name} ${admin.last_name}`.trim()}
          role={admin.role}
          realLevel={admin.admin_level}
          viewLevel={viewLevel}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
