"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { eventInfoItemConfig } from "@/lib/entity-configs/event-info-items";
import { EventInfoItemSchema, type EventInfoItemFormValues } from "@/lib/validation/event-info-items";
import {
  createEventInfoItem,
  updateEventInfoItem,
  deleteEventInfoItem,
  reorderEventInfoItems,
} from "@/actions/event-info-items";
import type { EventInfoItem } from "@/types/entities";

export function EventInfoItemsClient({ initialData }: { initialData: EventInfoItem[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<EventInfoItem | null>(null);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: EventInfoItem) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function move(row: EventInfoItem, direction: -1 | 1) {
    const sorted = [...initialData].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === row.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const result = await reorderEventInfoItems(reordered.map((item) => item.id));
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const defaultValues: EventInfoItemFormValues = editingRow
    ? {
        title: editingRow.title,
        description: editingRow.description,
        sort_order: editingRow.sort_order,
      }
    : { title: "", description: "", sort_order: initialData.length };

  return (
    <div>
      <DataTable
        config={eventInfoItemConfig}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        addLabel="Add info"
        hideExport
        onDelete={(row) => deleteEventInfoItem(row.id)}
        onDeleted={() => {
          toast.success("Info deleted.");
          router.refresh();
        }}
        onMoveUp={(row) => move(row, -1)}
        onMoveDown={(row) => move(row, 1)}
        emptyMessage="No extra info yet. Add a title and description to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.title : "Add info"}
        description="A title and description the app and the bot can use."
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={eventInfoItemConfig.formFields}
          schema={EventInfoItemSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          submitLabel={editingRow ? "Save changes" : "Add info"}
          onSubmit={(values) =>
            editingRow ? updateEventInfoItem(editingRow.id, values) : createEventInfoItem(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Info updated." : "Info added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
