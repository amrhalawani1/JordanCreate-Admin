"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { canAccessPath } from "@/lib/auth/levels";
import type { AdminLevel } from "@/types/entities";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", index: "00" },
  { href: "/event-info", label: "Event Info", index: "01" },
  { href: "/agenda", label: "Agenda", index: "02" },
  { href: "/speakers", label: "Speakers", index: "03" },
  { href: "/venue", label: "Venue", index: "04" },
  { href: "/interest-tags", label: "Interest Tags", index: "05" },
  { href: "/brand-voice", label: "Brand Voice", index: "06" },
  { href: "/faq", label: "FAQ", index: "07" },
  { href: "/experience", label: "Experience", index: "08" },
  { href: "/other-editions", label: "Other Editions", index: "09" },
  { href: "/guests", label: "Guests", index: "10" },
  { href: "/tickets-management", label: "Tickets Management", index: "11" },
  { href: "/request-a-feature", label: "Request a Feature", index: "12" },
  { href: "/admin-settings", label: "Admin Management", index: "13" },
  { href: "/change-log", label: "Change Log", index: "14" },
];

export function Sidebar({ adminLevel }: { adminLevel: AdminLevel }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => canAccessPath(adminLevel, item.href));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="jc-label">Admin & Registry V1</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-none uppercase tracking-tight text-foreground">
          Jordan Create
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-baseline gap-3 rounded-[4px] px-3 py-2 text-sm transition-colors",
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
              <span className={cn(isActive && "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
