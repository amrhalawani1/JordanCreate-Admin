import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Optional section cue — prefer short labels like "Guests", not numbered indexes. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {eyebrow ? <p className="jc-label">{eyebrow}</p> : null}
        <h1 className="jc-page-title break-words">{title}</h1>
        {description ? (
          <div className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {action}
        </div>
      ) : null}
    </header>
  );
}
