"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { buildChangeLogConfig } from "@/lib/entity-configs/change-logs";
import type { ChangeLog } from "@/types/entities";
import { ChangeLogDrawer } from "./ChangeLogDrawer";

export function ChangeLogClient({ initialData }: { initialData: ChangeLog[] }) {
  const [selected, setSelected] = useState<ChangeLog | null>(null);

  const tableNames = useMemo(
    () => Array.from(new Set(initialData.map((row) => row.table_name))).sort(),
    [initialData],
  );
  const config = useMemo(() => buildChangeLogConfig(tableNames), [tableNames]);

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={setSelected}
        emptyMessage="No changes logged yet. Edits on the dashboard will show up here."
      />
      <ChangeLogDrawer row={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
