"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { buildExperienceConfig } from "@/lib/entity-configs/experience";
import { ExperienceSchema, type ExperienceFormValues } from "@/lib/validation/experience";
import { createExperience, updateExperience, deleteExperience } from "@/actions/experience";
import type { Experience } from "@/types/entities";

const EMPTY_VALUES: ExperienceFormValues = {
  experience_type: "",
  title: "",
  description: "",
  link: "",
  platform: "",
  usage_context: "",
  sort_order: 0,
};

export function ExperienceClient({ initialData }: { initialData: Experience[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Experience | null>(null);
  const [deletingRow, setDeletingRow] = useState<Experience | null>(null);

  const config = useMemo(() => {
    const types = Array.from(new Set(initialData.map((r) => r.experience_type))).sort();
    return buildExperienceConfig(types);
  }, [initialData]);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: Experience) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  const defaultValues: ExperienceFormValues = editingRow
    ? {
        experience_type: editingRow.experience_type,
        title: editingRow.title,
        description: editingRow.description ?? "",
        link: editingRow.link ?? "",
        platform: editingRow.platform ?? "",
        usage_context: editingRow.usage_context ?? "",
        sort_order: editingRow.sort_order,
      }
    : { ...EMPTY_VALUES, sort_order: initialData.length };

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDeleteClick={setDeletingRow}
        emptyMessage="No experiences yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? `Edit ${editingRow.title}` : "Add Experience"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={config.formFields}
          schema={ExperienceSchema}
          defaultValues={defaultValues}
          submitLabel={editingRow ? "Save changes" : "Add experience"}
          onSubmit={(values) =>
            editingRow ? updateExperience(editingRow.id, values) : createExperience(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Experience updated." : "Experience added.");
            router.refresh();
          }}
        />
      </EntityDrawer>

      {deletingRow && (
        <DeleteConfirmDialog
          open={!!deletingRow}
          onOpenChange={(open) => !open && setDeletingRow(null)}
          description={config.describeRow(deletingRow)}
          onConfirm={() => deleteExperience(deletingRow.id)}
          onDeleted={() => {
            toast.success("Experience deleted.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
