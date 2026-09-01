"use client";

import { NavLinks } from "@/components/layout/NavLinks";
import type { AdminLevel } from "@/types/entities";

export function Sidebar({ adminLevel }: { adminLevel: AdminLevel }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="jc-label">Admin & Registry V1</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-none uppercase tracking-tight text-foreground">
          Jordan Create
        </p>
      </div>
      <NavLinks adminLevel={adminLevel} />
    </aside>
  );
}
