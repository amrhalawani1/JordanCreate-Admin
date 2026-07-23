import type { FieldConfig } from "./types";
import type { JordanCreateOne } from "@/types/entities";

// jordan_create_one and jordan_create_three share an identical shape.
export const jordanEditionFields: FieldConfig<JordanCreateOne>[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "status", label: "Status", type: "text", required: true },
  { name: "notes", label: "Notes", type: "textarea" },
];
