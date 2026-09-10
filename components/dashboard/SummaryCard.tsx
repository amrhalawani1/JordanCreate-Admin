import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { UpdatedAtBadge } from "@/components/shared/UpdatedAtBadge";
import type { TableSummary } from "@/actions/dashboard";

export function SummaryCard({ table }: { table: TableSummary }) {
  return (
    <Link
      href={table.href}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-white/15 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/30 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {table.label}
        </p>
        <ArrowUpRight
          className="size-4 shrink-0 text-faint transition-colors group-hover:text-orange"
          aria-hidden
        />
      </div>
      <p className="jc-stat">{table.count}</p>
      <div className="mt-auto pt-1">
        {table.updatedAt ? (
          <UpdatedAtBadge value={table.updatedAt} />
        ) : (
          <span className="text-xs text-faint">No updates yet</span>
        )}
      </div>
    </Link>
  );
}
