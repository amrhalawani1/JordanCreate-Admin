"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/NavLinks";
import { ViewAsSwitcher } from "@/components/layout/ViewAsSwitcher";
import type { AdminLevel } from "@/types/entities";

export function MobileNav({
  adminLevel,
  name,
  email,
  role,
  realLevel,
}: {
  adminLevel: AdminLevel;
  name?: string;
  email?: string;
  role?: string;
  realLevel?: AdminLevel;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const subtitle = [email, role].filter(Boolean).join(" ● ");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          id="mobile-nav"
          side="left"
          className="flex h-dvh max-h-dvh min-h-0 w-[min(18.5rem,88vw)] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm"
        >
          <SheetHeader className="shrink-0 border-b border-white/10 pr-16 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="jc-label">Admin & Registry V1</p>
            <SheetTitle className="mt-1">Jordan Create</SheetTitle>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <NavLinks adminLevel={adminLevel} onNavigate={() => setOpen(false)} />
          <SheetFooter className="shrink-0 border-t border-white/10 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {name ? <p className="truncate text-sm text-foreground">{name}</p> : null}
            {subtitle ? (
              <p className="truncate text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
            {realLevel === "super_admin" ? (
              <ViewAsSwitcher id="view-as-level-mobile" viewLevel={adminLevel} fullWidth />
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
