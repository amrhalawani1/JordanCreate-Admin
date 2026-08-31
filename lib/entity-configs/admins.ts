import type { EntityConfig } from "./types";
import type { Admin } from "@/types/entities";
import type { AdminFormValues } from "@/lib/validation/admins";
import { ADMIN_LEVEL_LABELS, ADMIN_LEVEL_VALUES } from "@/types/entities";

export type AdminListItem = Admin & { password: string };

export const adminConfig: EntityConfig<AdminListItem> = {
  table: "admins",
  pkColumn: "id",
  entityLabel: "Admin",
  searchKeys: ["first_name", "last_name", "email", "role"],
  filters: [
    {
      key: "admin_level",
      label: "Admin level",
      options: ADMIN_LEVEL_VALUES,
      allLabel: "All Admins",
      optionLabels: ADMIN_LEVEL_LABELS,
    },
  ],
  columns: [
    {
      key: "first_name",
      header: "Name",
      render: (row) => `${row.first_name} ${row.last_name}`.trim(),
    },
    { key: "role", header: "Role" },
    {
      key: "admin_level",
      header: "Admin level",
      render: (row) => ADMIN_LEVEL_LABELS[row.admin_level],
    },
    { key: "email", header: "Email" },
  ],
  formFields: [
    { name: "first_name", label: "First name", type: "text", required: true },
    { name: "last_name", label: "Last name", type: "text", required: true },
    { name: "role", label: "Role", type: "text", required: true, placeholder: "e.g. Operations" },
    {
      name: "admin_level",
      label: "Admin level",
      type: "enum",
      required: true,
      enumValues: ADMIN_LEVEL_VALUES,
      enumLabels: ADMIN_LEVEL_LABELS,
    },
    { name: "email", label: "Email", type: "text", required: true },
    {
      name: "password",
      label: "Password",
      type: "password",
      helpText: "Required for new admins. Leave blank when editing to keep the current password.",
    },
  ],
  hasUpdatedAt: true,
  describeRow: (row) =>
    `Delete admin "${row.first_name} ${row.last_name}" (${row.email})? They will lose dashboard access.`,
};
