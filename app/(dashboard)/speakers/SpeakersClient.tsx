"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { buildSpeakerConfig } from "@/lib/entity-configs/speakers";
import { SpeakerSchema, type SpeakerFormValues } from "@/lib/validation/speakers";
import { createSpeaker, updateSpeaker, deleteSpeaker } from "@/actions/speakers";
import type { Speaker } from "@/types/entities";

const EMPTY_VALUES: SpeakerFormValues = {
  handle: "",
  tagline: "",
  category: "",
  followers_range: "",
  known_for: "",
  availability: "",
  bio_status: "unconfirmed",
};

export function SpeakersClient({ initialData }: { initialData: Speaker[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Speaker | null>(null);

  const config = useMemo(() => {
    const categories = Array.from(
      new Set(initialData.map((r) => r.category).filter((v): v is string => Boolean(v))),
    ).sort();
    return buildSpeakerConfig(categories);
  }, [initialData]);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: Speaker) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  const defaultValues: SpeakerFormValues = editingRow
    ? {
        handle: editingRow.handle,
        tagline: editingRow.tagline ?? "",
        category: editingRow.category ?? "",
        followers_range: editingRow.followers_range ?? "",
        known_for: editingRow.known_for ?? "",
        availability: editingRow.availability ?? "",
        bio_status: editingRow.bio_status,
      }
    : EMPTY_VALUES;

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDelete={(row) => deleteSpeaker(row.handle)}
        onDeleted={() => {
          toast.success("Speaker deleted.");
          router.refresh();
        }}
        emptyMessage="No speakers yet. Add the first one to get started."
        rowClassName={(row) =>
          row.bio_status === "missing" ? "border-l-2 border-l-orange bg-orange/5" : undefined
        }
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.handle : "Add Speaker"}
      >
        <EntityForm
          key={editingRow?.handle ?? "new"}
          fields={config.formFields}
          schema={SpeakerSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          disabledFields={editingRow ? ["handle"] : []}
          submitLabel={editingRow ? "Save changes" : "Add speaker"}
          onSubmit={(values) =>
            editingRow ? updateSpeaker(editingRow.handle, values) : createSpeaker(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Speaker updated." : "Speaker added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
