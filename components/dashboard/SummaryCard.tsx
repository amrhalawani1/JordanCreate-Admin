import Link from "next/link";
import { UpdatedAtBadge } from "@/components/shared/UpdatedAtBadge";
import type { TableSummary } from "@/actions/dashboard";

export function SummaryCard({ table }: { table: TableSummary }) {
  return (
    <Link
      href={table.href}
      className="block bg-card p-6 transition-colors hover:bg-card-hover"
    >
      <p className="jc-label">{table.label}</p>
      <p className="jc-stat mt-4">{table.count}</p>
      <div className="mt-4">
        {table.updatedAt ? (
          <UpdatedAtBadge value={table.updatedAt} />
        ) : (
          <span className="text-xs text-faint">No updates yet</span>
        )}
      </div>
    </Link>
  );
}
