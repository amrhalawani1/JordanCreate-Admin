"use client";

import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NavLinks } from "@/components/layout/NavLinks";
import { cn } from "@/lib/utils";
import type { AdminLevel } from "@/types/entities";

const COLLAPSED_STORAGE_KEY = "jc-admin-sidebar-collapsed";

export function Sidebar({ adminLevel }: { adminLevel: AdminLevel }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");
    } catch {
      // Private browsing / blocked storage — fall back to expanded.
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignore — the toggle still works for this session.
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out lg:flex",
        collapsed ? "w-[4.25rem]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 border-b border-border",
          collapsed ? "flex-col gap-2 px-2 py-4" : "px-3 py-4 pr-2",
        )}
      >
        <div className={cn("min-w-0 flex-1", collapsed ? "px-0 text-center" : "px-2")}>
          {collapsed ? (
            <p
              className="font-[family-name:var(--font-display)] text-lg italic leading-none text-foreground"
              title="Jordan Create"
            >
              JC
            </p>
          ) : (
            <>
              <p className="jc-label">Admin</p>
              <BrandLogo className="mt-2 h-6" priority />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/30"
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <NavLinks adminLevel={adminLevel} collapsed={collapsed} />
    </aside>
  );
}
