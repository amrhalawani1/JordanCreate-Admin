import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The one container every analytics figure sits in. */
export function AnalyticsCard({
  title,
  description,
  action,
  children,
  className,
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      {title || action ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 space-y-1">
            {title ? <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3> : null}
            {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}

/** A quiet label over a group of cards. */
export function AnalyticsSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="space-y-1 pt-2">
        <p className="jc-label">{eyebrow}</p>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
