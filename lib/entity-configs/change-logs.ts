import type { EntityConfig } from "./types";
import type { ChangeLog } from "@/types/entities";
import { CHANGE_ACTION_LABELS, CHANGE_ACTION_VALUES } from "@/types/entities";

export const CHANGE_TABLE_LABELS: Record<string, string> = {
  event_info: "Event Info",
  event_info_items: "Extra event info",
  agenda_sessions: "Agenda",
  speakers: "Speakers",
  venue_zones: "Venue",
  interest_tags: "Interest Tags",
  brand_voice: "Brand Voice",
  faq_entries: "FAQ",
  experience: "Experience",
  jordan_create_one: "Jordan Create 1",
  jordan_create_three: "Jordan Create 3",
  admins: "Admins",
  feature_requests: "Feature requests",
};

export function tableLabel(tableName: string): string {
  return CHANGE_TABLE_LABELS[tableName] ?? tableName;
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function buildChangeLogConfig(tableNames: string[]): EntityConfig<ChangeLog> {
  return {
    table: "change_logs",
    pkColumn: "id",
    entityLabel: "Change",
    searchKeys: ["summary", "actor_name", "actor_email", "table_name"],
    filters: [
      {
        key: "action",
        label: "Action",
        options: CHANGE_ACTION_VALUES,
        allLabel: "All actions",
        optionLabels: CHANGE_ACTION_LABELS,
      },
      {
        key: "table_name",
        label: "Table",
        options: tableNames,
        allLabel: "All tables",
        optionLabels: Object.fromEntries(tableNames.map((name) => [name, tableLabel(name)])),
      },
    ],
    columns: [
      {
        key: "created_at",
        header: "When",
        render: (row) => formatWhen(row.created_at),
      },
      {
        key: "actor_name",
        header: "Who",
        render: (row) => `${row.actor_name} · ${row.actor_email}`,
      },
      {
        key: "action",
        header: "Action",
        render: (row) => CHANGE_ACTION_LABELS[row.action],
      },
      { key: "summary", header: "What" },
    ],
    formFields: [
      { name: "created_at", label: "When", type: "text" },
      { name: "actor_name", label: "Name", type: "text" },
      { name: "actor_email", label: "Email", type: "text" },
      { name: "action", label: "Action", type: "text" },
      { name: "table_name", label: "Table", type: "text" },
      { name: "record_id", label: "Record", type: "text" },
      { name: "summary", label: "Summary", type: "textarea" },
    ],
    hasUpdatedAt: false,
    describeRow: (row) => row.summary,
  };
}
