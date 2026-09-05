"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { buildEntertainmentConfig } from "@/lib/entity-configs/entertainment";
import { EntertainmentSchema, type EntertainmentFormValues } from "@/lib/validation/entertainment";
import {
  createEntertainment,
  updateEntertainment,
  deleteEntertainment,
  reorderEntertainment,
} from "@/actions/entertainment";
import type { Entertainment } from "@/types/entities";

export function EntertainmentClient({ initialData }: { initialData: Entertainment[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Entertainment | null>(null);

  const config = useMemo(() => {
    const actTypes = Array.from(new Set(initialData.map((row) => row.act_type))).sort();
    return buildEntertainmentConfig(editingRow ? String(editingRow.id) : undefined, actTypes);
  }, [editingRow, initialData]);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: Entertainment) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function move(row: Entertainment, direction: -1 | 1) {
    const sorted = [...initialData].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === row.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const result = await reorderEntertainment(reordered.map((item) => item.id));
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const defaultValues: EntertainmentFormValues = editingRow
    ? {
        act_type: editingRow.act_type,
        title: editingRow.title,
        performer_name: editingRow.performer_name ?? "",
        description: editingRow.description ?? "",
        start_time: editingRow.start_time ?? "",
        end_time: editingRow.end_time ?? "",
        location_within_venue: editingRow.location_within_venue ?? "",
        photo_url: editingRow.photo_url ?? "",
        link: editingRow.link ?? "",
        sort_order: editingRow.sort_order,
        status: editingRow.status,
      }
    : {
        act_type: "DJ",
        title: "",
        performer_name: "",
        description: "",
        start_time: "",
        end_time: "",
        location_within_venue: "",
        photo_url: "",
        link: "",
        sort_order: initialData.length,
        status: "draft",
      };

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDelete={(row) => deleteEntertainment(row.id)}
        onDeleted={() => {
          toast.success("Entertainment act deleted.");
          router.refresh();
        }}
        onMoveUp={(row) => move(row, -1)}
        onMoveDown={(row) => move(row, 1)}
        emptyMessage="No entertainment acts yet — add the first one"
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.title : "Add Entertainment"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={config.formFields}
          schema={EntertainmentSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          submitLabel={editingRow ? "Save changes" : "Add act"}
          onSubmit={(values) =>
            editingRow ? updateEntertainment(editingRow.id, values) : createEntertainment(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Entertainment act updated." : "Entertainment act added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
