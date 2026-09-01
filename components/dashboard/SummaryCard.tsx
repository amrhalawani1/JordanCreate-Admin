import Link from "next/link";
import { UpdatedAtBadge } from "@/components/shared/UpdatedAtBadge";
import type { TableSummary } from "@/actions/dashboard";

export function SummaryCard({ table }: { table: TableSummary }) {
  return (
    <Link
      href={table.href}
      className="block bg-card p-5 transition-colors hover:bg-card-hover focus-visible:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange/40 md:p-6"
    >
      <p className="jc-label">{table.label}</p>
      <p className="jc-stat mt-4">{table.count}</p>
      <div className="mt-4">
        {table.updatedAt ? (
          <UpdatedAtBadge value={table.updatedAt} />
        ) : (
          <span className="text-sm text-faint md:text-xs">No updates yet</span>
        )}
      </div>
    </Link>
  );
}
