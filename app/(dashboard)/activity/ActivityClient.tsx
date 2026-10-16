"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { buildActivityLogConfig } from "@/lib/entity-configs/activity-logs";
import type { ActivityLog } from "@/types/entities";
import { ActivityDrawer } from "./ActivityDrawer";

export function ActivityClient({ initialData }: { initialData: ActivityLog[] }) {
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const names = useMemo(() => Array.from(new Set(initialData.map((row) => row.name))).sort(), [initialData]);
  const config = useMemo(() => buildActivityLogConfig(names), [names]);
  const failed = useMemo(() => initialData.filter((row) => !row.ok).length, [initialData]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Showing the latest {initialData.length.toLocaleString()} entries
        {failed > 0 ? `, ${failed.toLocaleString()} of them failed or were denied` : ", none failed"}.
      </p>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={setSelected}
        rowClassName={(row) => (row.ok ? undefined : "bg-red-400/5")}
        emptyMessage="Nothing recorded yet. Activity appears here as soon as anyone uses the admin."
      />
      <ActivityDrawer row={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
