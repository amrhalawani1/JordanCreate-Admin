import type { FilterConfig } from "@/lib/entity-configs/types";

export const ARCHIVE_FILTER_LABELS = {
  false: "On the app",
  true: "Hidden from app",
} as const;

export function archiveFilter<Row extends { archived: boolean }>(): FilterConfig<Row> {
  return {
    key: "archived",
    label: "Visibility",
    options: ["false", "true"],
    allLabel: "All",
    optionLabels: { ...ARCHIVE_FILTER_LABELS },
  };
}

export function isArchivedRow(row: { archived?: boolean | null }): boolean {
  return row.archived === true;
}
