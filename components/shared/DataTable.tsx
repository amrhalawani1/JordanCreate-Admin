"use client";

import { useMemo, useState } from "react";
import type { EntityConfig } from "@/lib/entity-configs/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ExportButton } from "@/components/shared/ExportButton";
import { columnsForHtmlExport, rowsForHtmlExport } from "@/lib/export-html";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";

const TABLE_EXPORT_TITLES: Record<string, string> = {
  agenda_sessions: "Agenda",
  speakers: "Speakers",
  venue_zones: "Venue Zones",
  interest_tags: "Interest Tags",
  faq_entries: "FAQ",
  experience: "Experience",
  admins: "Admin Management",
  feature_requests: "Feature Requests",
  change_logs: "Change Log",
};

interface DataTableProps<Row> {
  config: EntityConfig<Row>;
  data: Row[];
  onRowClick: (row: Row) => void;
  onAddClick?: () => void;
  onDelete?: (row: Row) => Promise<{ success: boolean; error?: string }>;
  onDeleted?: () => void;
  emptyMessage: string;
  addLabel?: string;
  hideExport?: boolean;
  rowClassName?: (row: Row) => string | undefined;
  /** Both required to enable the up/down reorder column. Buttons disable
   * automatically while a search/filter is active, since reordering a
   * filtered subset would be ambiguous. */
  onMoveUp?: (row: Row) => void;
  onMoveDown?: (row: Row) => void;
}

const ALL_FILTER_VALUE = "__all__";

export function DataTable<Row extends Record<string, unknown>>({
  config,
  data,
  onRowClick,
  onAddClick,
  onDelete,
  onDeleted,
  emptyMessage,
  addLabel,
  hideExport = false,
  rowClassName,
  onMoveUp,
  onMoveDown,
}: DataTableProps<Row>) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);

  const canReorder = Boolean(onMoveUp && onMoveDown);
  const isFilteredOrSearched = Boolean(search.trim()) || Object.values(activeFilters).some(Boolean);
  const reorderActive = canReorder && !isFilteredOrSearched;

  const filtered = useMemo(() => {
    let rows = data;

    if (search.trim() && config.searchKeys?.length) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        config.searchKeys!.some((key) => String(row[key] ?? "").toLowerCase().includes(q)),
      );
    }

    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value) continue;
      rows = rows.filter((row) => String(row[key as keyof Row] ?? "") === value);
    }

    return rows;
  }, [data, search, activeFilters, config.searchKeys]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {config.searchKeys?.length ? (
          <Input
            placeholder={`Search ${config.entityLabel.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        ) : null}

        {config.filters?.map((filter) => {
          const selected = activeFilters[filter.key] || ALL_FILTER_VALUE;
          const allLabel = filter.allLabel ?? `All ${filter.label}`;
          const selectedLabel =
            selected === ALL_FILTER_VALUE
              ? allLabel
              : (filter.optionLabels?.[selected] ?? selected);
          return (
          <Select
            key={filter.key}
            value={selected}
            onValueChange={(value: string | null) =>
              setActiveFilters((prev) => ({
                ...prev,
                [filter.key]: !value || value === ALL_FILTER_VALUE ? "" : value,
              }))
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={allLabel}>{selectedLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>{allLabel}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {filter.optionLabels?.[option] ?? option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          );
        })}

        {(!hideExport || onAddClick) && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!hideExport ? (
              <ExportButton
                title={TABLE_EXPORT_TITLES[config.table] ?? config.entityLabel}
                fileStem={config.table.replaceAll("_", "-")}
                tables={[
                  {
                    columns: columnsForHtmlExport(config),
                    rows: rowsForHtmlExport(config, data),
                  },
                ]}
              />
            ) : null}
            {onAddClick ? (
              <Button onClick={onAddClick}>{addLabel ?? `Add ${config.entityLabel}`}</Button>
            ) : null}
          </div>
        )}
      </div>

      {canReorder && isFilteredOrSearched && (
        <p className="text-xs text-muted-foreground">
          Clear search/filters to reorder rows.
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={data.length === 0 ? emptyMessage : "No rows match your search/filter."} />
      ) : (
        <div className="overflow-x-auto rounded-[4px] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {canReorder && <TableHead className="w-16" />}
                {config.columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
                {onDelete && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, index) => (
                <TableRow
                  key={String(row[config.pkColumn])}
                  onClick={() => onRowClick(row)}
                  className={`cursor-pointer hover:bg-card-hover ${rowClassName?.(row) ?? ""}`}
                >
                  {canReorder && (
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!reorderActive || index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveUp!(row);
                          }}
                          aria-label="Move up"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!reorderActive || index === filtered.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveDown!(row);
                          }}
                          aria-label="Move down"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  {config.columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                  {onDelete && (
                    <TableCell
                      className="w-12"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(row);
                      }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${config.entityLabel}`}
                        title={`Delete ${config.entityLabel}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(row);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        description={
          pendingDelete
            ? config.describeRow(pendingDelete)
            : `Delete this ${config.entityLabel.toLowerCase()}? This cannot be undone.`
        }
        onConfirm={() => {
          if (!pendingDelete || !onDelete) {
            return Promise.resolve({ success: false, error: "Nothing to delete." });
          }
          return onDelete(pendingDelete);
        }}
        onDeleted={() => {
          setPendingDelete(null);
          onDeleted?.();
        }}
      />
    </div>
  );
}
