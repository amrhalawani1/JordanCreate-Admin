"use client";

import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
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
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 py-6",
          collapsed ? "px-3 text-center" : "px-5",
        )}
      >
        {collapsed ? (
          <p className="jc-label" title="Admin & Registry V1 · Jordan Create">
            JC
          </p>
        ) : (
          <>
            <p className="jc-label">Admin & Registry V1</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-none uppercase tracking-tight text-foreground">
              Jordan Create
            </p>
          </>
        )}
      </div>

      <NavLinks adminLevel={adminLevel} collapsed={collapsed} />

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "flex min-h-11 shrink-0 items-center gap-2 border-t border-white/10 px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange/40",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        <span className={cn(collapsed && "sr-only")}>Collapse</span>
      </button>
    </aside>
  );
}
