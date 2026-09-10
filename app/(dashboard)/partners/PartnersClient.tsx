"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { buildPartnerConfig } from "@/lib/entity-configs/partners";
import { PartnerSchema, type PartnerFormValues } from "@/lib/validation/partners";
import { createPartner, updatePartner, deletePartner, reorderPartners, setPartnerArchived } from "@/actions/partners";
import type { Partner, VenueZone } from "@/types/entities";

export function PartnersClient({
  initialData,
  zones,
}: {
  initialData: Partner[];
  zones: VenueZone[];
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Partner | null>(null);

  const config = useMemo(() => {
    const tiers = Array.from(new Set(initialData.map((row) => row.tier).filter(Boolean))).sort();
    return buildPartnerConfig(zones, editingRow ? String(editingRow.id) : undefined, tiers);
  }, [zones, editingRow, initialData]);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: Partner) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  async function move(row: Partner, direction: -1 | 1) {
    const sorted = [...initialData].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === row.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const result = await reorderPartners(reordered.map((item) => item.id));
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const defaultValues: PartnerFormValues = editingRow
    ? {
        name: editingRow.name,
        tier: editingRow.tier,
        zone_id: editingRow.zone_id,
        description: editingRow.description ?? "",
        website: editingRow.website ?? "",
        image_url: editingRow.image_url ?? "",
        sort_order: editingRow.sort_order,
      }
    : {
        name: "",
        tier: "",
        zone_id: null,
        description: "",
        website: "",
        image_url: "",
        sort_order: initialData.length,
      } as PartnerFormValues;

  return (
    <div>
      <DataTable
        config={config}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        addLabel="Add partner"
        onDelete={(row) => deletePartner(row.id)}
        onDeleted={() => {
          toast.success("Partner deleted.");
          router.refresh();
        }}
        onArchive={(row) => setPartnerArchived(row.id, !row.archived)}
        onArchiveToggled={() => router.refresh()}
        onMoveUp={(row) => move(row, -1)}
        onMoveDown={(row) => move(row, 1)}
        emptyMessage="No sponsors yet — add the first one"
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.name : "Add Partner"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={config.formFields}
          schema={PartnerSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          submitLabel={editingRow ? "Save changes" : "Add partner"}
          onSubmit={(values) =>
            editingRow ? updatePartner(editingRow.id, values) : createPartner(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Partner updated." : "Partner added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
