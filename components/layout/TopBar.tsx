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
  const subtitle = [email, role].filter(Boolean).join(" ● ");

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-background px-3 pt-[env(safe-area-inset-top)] md:px-8">
      {viewLevel ? (
        <MobileNav
          adminLevel={viewLevel}
          name={name}
          email={email}
          role={role}
          realLevel={realLevel}
        />
      ) : null}

      <p className="min-w-0 flex-1 truncate text-sm text-foreground lg:hidden">Jordan Create</p>

      <div className="hidden min-w-0 flex-1 text-right lg:block">
        {name ? <p className="truncate text-sm text-foreground">{name}</p> : null}
        {subtitle ? (
          <p className="truncate font-[family-name:var(--font-ui)] text-xs tracking-wide text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {realLevel === "super_admin" && viewLevel ? (
        <div className="hidden lg:block">
          <ViewAsSwitcher id="view-as-level" viewLevel={viewLevel} />
        </div>
      ) : null}

      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </header>
  );
}
