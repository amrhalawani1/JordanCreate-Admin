"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { faqEntryConfig } from "@/lib/entity-configs/faq-entries";
import { FaqEntrySchema, type FaqEntryFormValues } from "@/lib/validation/faq-entries";
import { createFaqEntry, updateFaqEntry, deleteFaqEntry, reorderFaqEntries } from "@/actions/faq-entries";
import type { FaqEntry } from "@/types/entities";

export function FaqEntriesClient({ initialData }: { initialData: FaqEntry[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FaqEntry | null>(null);
  const [deletingRow, setDeletingRow] = useState<FaqEntry | null>(null);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: FaqEntry) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function move(row: FaqEntry, direction: -1 | 1) {
    const sorted = [...initialData].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((r) => r.id === row.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const result = await reorderFaqEntries(reordered.map((r) => r.id));
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const defaultValues: FaqEntryFormValues = editingRow
    ? { question: editingRow.question, answer: editingRow.answer, sort_order: editingRow.sort_order }
    : { question: "", answer: "", sort_order: initialData.length };

  return (
    <div>
      <DataTable
        config={faqEntryConfig}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDeleteClick={setDeletingRow}
        onMoveUp={(row) => move(row, -1)}
        onMoveDown={(row) => move(row, 1)}
        emptyMessage="No FAQ entries yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? "Edit FAQ" : "Add FAQ"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={faqEntryConfig.formFields}
          schema={FaqEntrySchema}
          defaultValues={defaultValues}
          submitLabel={editingRow ? "Save changes" : "Add FAQ"}
          onSubmit={(values) =>
            editingRow ? updateFaqEntry(editingRow.id, values) : createFaqEntry(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "FAQ updated." : "FAQ added.");
            router.refresh();
          }}
        />
      </EntityDrawer>

      {deletingRow && (
        <DeleteConfirmDialog
          open={!!deletingRow}
          onOpenChange={(open) => !open && setDeletingRow(null)}
          description={faqEntryConfig.describeRow(deletingRow)}
          onConfirm={() => deleteFaqEntry(deletingRow.id)}
          onDeleted={() => {
            toast.success("FAQ deleted.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
