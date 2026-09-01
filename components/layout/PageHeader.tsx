import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5 md:mb-8 md:pb-6">
      <div className="min-w-0">
        <p className="jc-label mb-3">{eyebrow}</p>
        <h1 className="jc-page-title break-words">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto">{action}</div>
      ) : null}
    </header>
  );
}
