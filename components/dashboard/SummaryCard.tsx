import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatedAtBadge } from "@/components/shared/UpdatedAtBadge";
import type { TableSummary } from "@/actions/dashboard";

export function SummaryCard({ table }: { table: TableSummary }) {
  return (
    <Link href={table.href}>
      <Card className="transition-colors hover:bg-card-hover">
        <CardHeader>
          <CardTitle className="flex items-baseline justify-between">
            <span>{table.label}</span>
            <span className="text-2xl font-semibold text-foreground">{table.count}</span>
          </CardTitle>
          {table.updatedAt && <UpdatedAtBadge value={table.updatedAt} />}
        </CardHeader>
      </Card>
    </Link>
  );
}
