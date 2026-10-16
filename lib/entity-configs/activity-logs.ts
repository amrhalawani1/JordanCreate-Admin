import type { EntityConfig } from "./types";
import type { ActivityLog } from "@/types/entities";
import { ACTIVITY_KIND_LABELS, ACTIVITY_STATUS_LABELS } from "@/types/entities";
import { ACTIVITY_KINDS, ACTIVITY_STATUSES } from "@/lib/activity-core";

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function actorLabel(row: ActivityLog): string {
  if (row.actor_email) return row.actor_email;
  if (row.kind === "route" && row.name.startsWith("tzkrti")) return "Tzkrti";
  if (row.kind === "auth") return (row.meta as { email?: string } | null)?.email || "Visitor";
  return "Visitor";
}

export function resultLabel(row: ActivityLog): string {
  return ACTIVITY_STATUS_LABELS[row.status as keyof typeof ACTIVITY_STATUS_LABELS] ?? row.status;
}

export function buildActivityLogConfig(names: string[]): EntityConfig<ActivityLog> {
  return {
    table: "activity_logs",
    pkColumn: "id",
    entityLabel: "Activity",
    searchKeys: ["name", "actor_email", "error", "path", "ip"],
    filters: [
      {
        key: "status",
        label: "Result",
        options: ACTIVITY_STATUSES,
        allLabel: "All results",
        optionLabels: ACTIVITY_STATUS_LABELS,
      },
      {
        key: "kind",
        label: "Kind",
        options: ACTIVITY_KINDS,
        allLabel: "All kinds",
        optionLabels: ACTIVITY_KIND_LABELS,
      },
      {
        key: "name",
        label: "Activity",
        options: names,
        allLabel: "All activities",
      },
    ],
    columns: [
      { key: "at", header: "When", render: (row) => formatWhen(row.at) },
      { key: "actor_email", header: "Who", render: (row) => actorLabel(row) },
      { key: "kind", header: "Kind", render: (row) => ACTIVITY_KIND_LABELS[row.kind as keyof typeof ACTIVITY_KIND_LABELS] ?? row.kind },
      { key: "name", header: "What", render: (row) => (row.kind === "page" && row.path ? row.path : row.name) },
      {
        key: "status",
        header: "Result",
        render: (row) => (
          row.ok ? resultLabel(row) : `${resultLabel(row)}${row.error ? ` · ${row.error.slice(0, 80)}` : ""}`
        ),
      },
      { key: "duration_ms", header: "Took", render: (row) => (row.duration_ms == null ? "—" : `${row.duration_ms} ms`) },
    ],
    formFields: [
      { name: "at", label: "When", type: "text" },
      { name: "actor_email", label: "Who", type: "text" },
      { name: "kind", label: "Kind", type: "text" },
      { name: "name", label: "Activity", type: "text" },
      { name: "status", label: "Result", type: "text" },
      { name: "error", label: "Error", type: "textarea" },
    ],
    hasUpdatedAt: false,
    cardTitleKey: "name",
    describeRow: (row) => `${row.kind} ${row.name}`,
  };
}
