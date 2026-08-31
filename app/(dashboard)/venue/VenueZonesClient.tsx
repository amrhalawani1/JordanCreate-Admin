"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { venueZoneConfig } from "@/lib/entity-configs/venue-zones";
import { VenueZoneSchema, type VenueZoneFormValues } from "@/lib/validation/venue-zones";
import { createVenueZone, updateVenueZone, deleteVenueZone } from "@/actions/venue-zones";
import type { VenueZone } from "@/types/entities";

const EMPTY_VALUES: VenueZoneFormValues = {
  zone_id: "",
  name: "",
  capacity_note: "",
  details: "",
};

export function VenueZonesClient({ initialData }: { initialData: VenueZone[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<VenueZone | null>(null);

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: VenueZone) {
    setEditingRow(row);
    setDrawerOpen(true);
  }

  const defaultValues: VenueZoneFormValues = editingRow
    ? {
        zone_id: editingRow.zone_id,
        name: editingRow.name,
        capacity_note: editingRow.capacity_note ?? "",
        details: editingRow.details ?? "",
      }
    : EMPTY_VALUES;

  return (
    <div>
      <DataTable
        config={venueZoneConfig}
        data={initialData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDelete={(row) => deleteVenueZone(row.zone_id)}
        onDeleted={() => {
          toast.success("Zone deleted.");
          router.refresh();
        }}
        emptyMessage="No venue zones yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? editingRow.zone_id : "Add Zone"}
      >
        <EntityForm
          key={editingRow?.zone_id ?? "new"}
          fields={venueZoneConfig.formFields}
          schema={VenueZoneSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          disabledFields={editingRow ? ["zone_id"] : []}
          submitLabel={editingRow ? "Save changes" : "Add zone"}
          onSubmit={(values) =>
            editingRow ? updateVenueZone(editingRow.zone_id, values) : createVenueZone(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Zone updated." : "Zone added.");
            router.refresh();
          }}
        />
      </EntityDrawer>

    </div>
  );
}
