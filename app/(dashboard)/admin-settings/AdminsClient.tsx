"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { EntityForm } from "@/components/shared/EntityForm";
import { adminConfig, type AdminListItem } from "@/lib/entity-configs/admins";
import { CreateAdminSchema, UpdateAdminSchema, type AdminFormValues } from "@/lib/validation/admins";
import { createAdmin, updateAdmin, deleteAdmin } from "@/actions/admins";
import type { Admin } from "@/types/entities";

const EMPTY_VALUES: AdminFormValues = {
  first_name: "",
  last_name: "",
  role: "",
  admin_level: "admin",
  email: "",
  password: "",
};

export function AdminsClient({ initialData }: { initialData: Admin[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Admin | null>(null);

  const tableData: AdminListItem[] = initialData.map((row) => ({ ...row, password: "" }));

  function openAdd() {
    setEditingRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: AdminListItem) {
    const match = initialData.find((item) => item.id === row.id) ?? null;
    setEditingRow(match);
    setDrawerOpen(true);
  }

  const defaultValues: AdminFormValues = editingRow
    ? {
        first_name: editingRow.first_name,
        last_name: editingRow.last_name,
        role: editingRow.role,
        admin_level: editingRow.admin_level,
        email: editingRow.email,
        password: "",
      }
    : EMPTY_VALUES;

  return (
    <div>
      <DataTable
        config={adminConfig}
        data={tableData}
        onRowClick={openEdit}
        onAddClick={openAdd}
        onDelete={(row) => deleteAdmin(row.id)}
        onDeleted={() => {
          toast.success("Admin deleted.");
          router.refresh();
        }}
        emptyMessage="No admins yet. Add the first one to get started."
      />

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRow ? `${editingRow.first_name} ${editingRow.last_name}` : "Add Admin"}
      >
        <EntityForm
          key={editingRow?.id ?? "new"}
          fields={adminConfig.formFields}
          schema={editingRow ? UpdateAdminSchema : CreateAdminSchema}
          defaultValues={defaultValues}
          startInShowMode={!!editingRow}
          submitLabel={editingRow ? "Save changes" : "Add admin"}
          onSubmit={(values) =>
            editingRow ? updateAdmin(editingRow.id, values) : createAdmin(values)
          }
          onSuccess={() => {
            setDrawerOpen(false);
            toast.success(editingRow ? "Admin updated." : "Admin added.");
            router.refresh();
          }}
        />
      </EntityDrawer>
    </div>
  );
}
