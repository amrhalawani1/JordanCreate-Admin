"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { canAccessPath } from "@/lib/auth/levels";
import { NAV_GROUPS, type NavItem } from "@/components/layout/nav";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AdminLevel } from "@/types/entities";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavItemLink({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/30",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-orange"
        />
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive ? "text-orange" : "text-faint group-hover:text-muted-foreground",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className={cn("truncate leading-none", isActive && "font-medium", collapsed && "sr-only")}>
        {item.label}
      </span>
    </Link>
  );
}

export function NavLinks({
  adminLevel,
  onNavigate,
  collapsed = false,
}: {
  adminLevel: AdminLevel;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessPath(adminLevel, item.href)),
  })).filter((group) => group.items.length > 0);

  return (
    <TooltipProvider delay={200}>
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-3",
          collapsed ? "gap-3 px-2" : "gap-5 px-3",
        )}
        aria-label="Main"
      >
        {groups.map((group, groupIndex) => (
          <div key={group.id} className="flex flex-col gap-0.5">
            {!collapsed ? (
              <p className="mb-1.5 px-2.5 font-[family-name:var(--font-ui)] text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
                {group.label}
              </p>
            ) : groupIndex > 0 ? (
              <div
                className="mx-auto mb-1 h-px w-4 bg-white/10"
                role="separator"
                aria-label={group.label}
              />
            ) : null}

            {group.items.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              const link = (
                <NavItemLink
                  item={item}
                  isActive={isActive}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              );

              if (!collapsed) {
                return (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                );
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right">
                    <span className="text-faint">{group.label}</span>
                    {" · "}
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}
