import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ViewAsSwitcher } from "@/components/layout/ViewAsSwitcher";
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
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-white/10 bg-background px-8">
      <div className="min-w-0 text-right">
        {name ? (
          <p className="truncate text-sm text-foreground">{name}</p>
        ) : null}
        {subtitle ? (
          <p className="truncate font-[family-name:var(--font-ui)] text-xs tracking-wide text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {realLevel === "super_admin" && viewLevel ? <ViewAsSwitcher viewLevel={viewLevel} /> : null}
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </header>
  );
}
