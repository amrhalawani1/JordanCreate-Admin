"use client";

import { createContext, useContext } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const EntityDrawerContext = createContext(false);

export function useInEntityDrawer() {
  return useContext(EntityDrawerContext);
}

interface EntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Wider panels for dense forms (speakers, guests). Default `wide`. */
  size?: "default" | "wide";
}

const SIZE_CLASS = {
  default:
    "data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl",
  wide:
    "data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl data-[side=right]:xl:max-w-[52rem]",
} as const;

export function EntityDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "wide",
}: EntityDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden border-l border-border bg-canvas-deep p-0 shadow-[-24px_0_48px_rgba(0,0,0,0.35)]",
          SIZE_CLASS[size],
        )}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border bg-background/40 px-5 pr-14 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-6">
          <SheetTitle className="font-[family-name:var(--font-ui)] text-lg font-semibold tracking-tight normal-case">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="max-w-[48ch] text-sm leading-relaxed">
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">Edit record details</SheetDescription>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <EntityDrawerContext.Provider value={true}>{children}</EntityDrawerContext.Provider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
