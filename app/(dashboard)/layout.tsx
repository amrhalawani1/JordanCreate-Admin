import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { effectiveLevel, VIEW_AS_COOKIE } from "@/lib/auth/view-as";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MissingAdminProfile } from "@/components/layout/MissingAdminProfile";
import { AdminAccessProvider } from "@/components/layout/AdminAccessProvider";
import { ADMIN_LEVEL_LABELS } from "@/types/entities";

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-orange focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#0a0a0a]"
        >
          Skip to main content
        </a>
        <TopBar
          email={admin.email}
          name={`${admin.first_name} ${admin.last_name}`.trim()}
          role={admin.role}
          realLevel={admin.admin_level}
          viewLevel={viewLevel}
        />
        <main
          id="main-content"
          className="flex-1 overflow-x-clip overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-7"
        >
          <AdminAccessProvider viewLevel={viewLevel}>
            <div className="jc-content">
              {viewLevel === "admin_view_only" ? (
                <p className="mb-5 rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-sm leading-relaxed text-foreground">
                  You have {ADMIN_LEVEL_LABELS.admin_view_only} access. You can browse event data, but
                  you cannot add, edit, archive, or delete.
                </p>
              ) : null}
              {children}
            </div>
          </AdminAccessProvider>
        </main>
      </div>
    </div>
  );
}
