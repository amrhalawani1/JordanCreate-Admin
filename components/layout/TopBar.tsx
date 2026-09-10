import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ViewAsSwitcher } from "@/components/layout/ViewAsSwitcher";
import { MobileNav } from "@/components/layout/MobileNav";
import type { AdminLevel } from "@/types/entities";

export function TopBar({
  email,
  name,
  role,
  realLevel,
  viewLevel,
}: {
  email: string | undefined;
  name?: string;
  role?: string;
  realLevel?: AdminLevel;
  viewLevel?: AdminLevel;
}) {
  const subtitle = [email, role].filter(Boolean).join(" · ");

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md pt-[env(safe-area-inset-top)] sm:gap-3 md:px-8">
      {viewLevel ? (
        <MobileNav
          adminLevel={viewLevel}
          name={name}
          email={email}
          role={role}
          realLevel={realLevel}
        />
      ) : null}

      <div className="min-w-0 flex-1 lg:hidden">
        <p className="truncate text-sm font-medium text-foreground">Jordan Create</p>
        <p className="truncate text-xs text-muted-foreground">Admin</p>
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        {name ? <p className="truncate text-sm font-medium text-foreground">{name}</p> : null}
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {realLevel === "super_admin" && viewLevel ? (
        <div className="hidden lg:block">
          <ViewAsSwitcher id="view-as-level" viewLevel={viewLevel} />
        </div>
      ) : null}

      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </form>
    </header>
  );
}
