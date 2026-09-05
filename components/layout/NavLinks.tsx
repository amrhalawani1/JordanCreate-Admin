"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { canAccessPath } from "@/lib/auth/levels";
import { NAV_ITEMS } from "@/components/layout/nav";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AdminLevel } from "@/types/entities";

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
  const items = NAV_ITEMS.filter((item) => canAccessPath(adminLevel, item.href));

  return (
    <TooltipProvider delay={200}>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-baseline gap-3 rounded-[4px] px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange/40",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "font-[family-name:var(--font-ui)] text-[11px] tracking-[0.14em]",
                  isActive ? "text-orange" : "text-faint",
                )}
              >
                {item.index}
              </span>
              <span className={cn(isActive && "font-medium", collapsed && "sr-only")}>{item.label}</span>
            </Link>
          );

          if (!collapsed) {
            return link;
          }

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
