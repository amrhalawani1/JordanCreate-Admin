"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface EntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function EntityDrawer({ open, onOpenChange, title, description, children }: EntityDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-white/10 pr-14 pt-[max(1rem,env(safe-area-inset-top))]">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
