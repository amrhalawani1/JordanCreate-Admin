"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { buildHotTopicConfig } from "@/lib/entity-configs/hot-topics";
import type { DestinationOption } from "@/lib/mobile-app/destinations";
import { HotTopicSchema, type HotTopicFormValues } from "@/lib/validation/hot-topics";
import { createHotTopic, updateHotTopic, deleteHotTopic, reorderHotTopics } from "@/actions/hot-topics";
import type { HotTopic } from "@/types/entities";

export function HotTopicsClient({
  initialData,
  destinationOptions,
}: {
  initialData: HotTopic[];
  destinationOptions: DestinationOption[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<HotTopic | null>(null);

  const config = useMemo(
    () => buildHotTopicConfig(editingRow ? String(editingRow.id) : undefined, destinationOptions),
    [editingRow, destinationOptions],
  );

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: HotTopic) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function move(row: HotTopic, direction: -1 | 1) {
    const sorted = [...initialData].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === row.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const result = await reorderHotTopics(reordered.map((item) => item.id));
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const defaultValues: HotTopicFormValues = editingRow
    ? {
        eyebrow: editingRow.eyebrow,
        headline: editingRow.headline,
        supporting: editingRow.supporting ?? "",
        action_label: editingRow.action_label,
        destination: editingRow.destination ?? "",
        image_url: editingRow.image_url ?? "",
        sort_order: editingRow.sort_order,
        status: editingRow.status,
      }
    : {
        eyebrow: "",
        headline: "",
        supporting: "",
        action_label: "See the session",
        destination: "",
        image_url: "",
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
        addLabel="Add hot topic"
        onDelete={(row) => deleteHotTopic(row.id)}
        onDeleted={() => {
          toast.success("Hot topic deleted.");
          router.refresh();
        }}
        onMoveUp={(row) => move(row, -1)}
        onMoveDown={(row) => move(row, 1)}
        emptyMessage="No hot topics yet — add the first card guests will see on Home."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.headline : "Add hot topic"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={config.formFields}
          schema={HotTopicSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          submitLabel={editingRow ? "Save changes" : "Add hot topic"}
          onSubmit={(values) => (editingRow ? updateHotTopic(editingRow.id, values) : createHotTopic(values))}
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Hot topic updated." : "Hot topic added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
