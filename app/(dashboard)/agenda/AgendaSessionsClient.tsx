"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { buildAgendaSessionConfig } from "@/lib/entity-configs/agenda-sessions";
import { AgendaSessionSchema, type AgendaSessionFormValues } from "@/lib/validation/agenda-sessions";
import {
  createAgendaSession,
  updateAgendaSession,
  deleteAgendaSession,
  reorderAgendaSessions,
} from "@/actions/agenda-sessions";
import type { AgendaSession, Speaker, InterestTag } from "@/types/entities";

interface AgendaSessionsClientProps {
  initialData: AgendaSession[];
  speakers: Speaker[];
  tags: InterestTag[];
}

export function AgendaSessionsClient({ initialData, speakers, tags }: AgendaSessionsClientProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AgendaSession | null>(null);
  const [deletingRow, setDeletingRow] = useState<AgendaSession | null>(null);

  const speakerOptions = useMemo(
    () => speakers.map((s) => ({ value: s.handle, label: s.handle })),
    [speakers],
  );
  const tagOptions = useMemo(() => tags.map((t) => ({ value: t.tag_id, label: t.tag_label })), [tags]);

  const config = useMemo(() => {
    const sessionTypes = Array.from(new Set(initialData.map((r) => r.session_type))).sort();
    return buildAgendaSessionConfig(speakerOptions, tagOptions, sessionTypes);
  }, [initialData, speakerOptions, tagOptions]);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: AgendaSession) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function move(row: AgendaSession, direction: -1 | 1) {
    const sorted = [...initialData].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((r) => r.session_id === row.session_id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const result = await reorderAgendaSessions(reordered.map((r) => r.session_id));
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const defaultValues: AgendaSessionFormValues = editingRow
    ? {
        session_id: editingRow.session_id,
        start_time: editingRow.start_time,
        end_time: editingRow.end_time,
        session_type: editingRow.session_type,
        title: editingRow.title,
        description: editingRow.description ?? "",
        speaker_handles: editingRow.speaker_handles ?? [],
        moderator_handle: editingRow.moderator_handle,
        duration_minutes: editingRow.duration_minutes,
        interest_tag_ids: editingRow.interest_tag_ids ?? [],
        location_within_venue: editingRow.location_within_venue ?? "",
        status: editingRow.status,
        flag_notes: editingRow.flag_notes ?? "",
        sort_order: editingRow.sort_order,
      }
    : {
        session_id: "",
        start_time: "",
        end_time: "",
        session_type: "",
        title: "",
        description: "",
        speaker_handles: [],
        moderator_handle: null,
        duration_minutes: 30,
        interest_tag_ids: [],
        location_within_venue: "",
        status: "draft",
        flag_notes: "",
        sort_order: initialData.length,
      };

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDeleteClick={setDeletingRow}
        onMoveUp={(row) => move(row, -1)}
        onMoveDown={(row) => move(row, 1)}
        emptyMessage="No agenda sessions yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? `Edit ${editingRow.session_id}` : "Add Session"}
      >
        <EntityForm
          key={editingRow?.session_id ?? "new"}
          fields={config.formFields}
          schema={AgendaSessionSchema}
          defaultValues={defaultValues}
          disabledFields={editingRow ? ["session_id"] : []}
          submitLabel={editingRow ? "Save changes" : "Add session"}
          onSubmit={(values) =>
            editingRow
              ? updateAgendaSession(editingRow.session_id, values)
              : createAgendaSession(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Session updated." : "Session added.");
            router.refresh();
          }}
        />
      </EntityDrawer>

      {deletingRow && (
        <DeleteConfirmDialog
          open={!!deletingRow}
          onOpenChange={(open) => !open && setDeletingRow(null)}
          description={config.describeRow(deletingRow)}
          onConfirm={() => deleteAgendaSession(deletingRow.session_id)}
          onDeleted={() => {
            toast.success("Session deleted.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
