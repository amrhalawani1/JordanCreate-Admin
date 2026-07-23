"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { interestTagConfig } from "@/lib/entity-configs/interest-tags";
import { InterestTagSchema, type InterestTagFormValues } from "@/lib/validation/interest-tags";
import { createInterestTag, updateInterestTag, deleteInterestTag } from "@/actions/interest-tags";
import type { InterestTag } from "@/types/entities";

const EMPTY_VALUES: InterestTagFormValues = {
  tag_id: "",
  tag_label: "",
  tag_description: "",
  is_provisional: false,
};

export function InterestTagsClient({ initialData }: { initialData: InterestTag[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<InterestTag | null>(null);
  const [deletingRow, setDeletingRow] = useState<InterestTag | null>(null);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: InterestTag) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  const defaultValues: InterestTagFormValues = editingRow
    ? {
        tag_id: editingRow.tag_id,
        tag_label: editingRow.tag_label,
        tag_description: editingRow.tag_description ?? "",
        is_provisional: editingRow.is_provisional,
      }
    : EMPTY_VALUES;

  return (
    <div>
      <DataTable
        config={interestTagConfig}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDeleteClick={setDeletingRow}
        emptyMessage="No interest tags yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? `Edit ${editingRow.tag_id}` : "Add Tag"}
      >
        <EntityForm
          key={editingRow?.tag_id ?? "new"}
          fields={interestTagConfig.formFields}
          schema={InterestTagSchema}
          defaultValues={defaultValues}
          disabledFields={editingRow ? ["tag_id"] : []}
          submitLabel={editingRow ? "Save changes" : "Add tag"}
          onSubmit={(values) =>
            editingRow ? updateInterestTag(editingRow.tag_id, values) : createInterestTag(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Tag updated." : "Tag added.");
            router.refresh();
          }}
        />
      </EntityDrawer>

      {deletingRow && (
        <DeleteConfirmDialog
          open={!!deletingRow}
          onOpenChange={(open) => !open && setDeletingRow(null)}
          description={interestTagConfig.describeRow(deletingRow)}
          onConfirm={() => deleteInterestTag(deletingRow.tag_id)}
          onDeleted={() => {
            toast.success("Tag deleted.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
