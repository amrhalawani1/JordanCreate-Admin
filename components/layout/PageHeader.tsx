import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
      <div className="min-w-0">
        <p className="jc-label mb-3">{eyebrow}</p>
        <h1 className="jc-page-title">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={cn("shrink-0")}>{action}</div> : null}
    </header>
  );
}
