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
import { toast } from "sonner";
import { isArchivedRow } from "@/lib/archive";
import { Archive, ArchiveRestore, Trash2, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";

const TABLE_EXPORT_TITLES: Record<string, string> = {
  agenda_sessions: "Agenda",
  speakers: "Speakers",
  venue_zones: "Venue Zones",
  interest_tags: "Interest Tags",
  faq_entries: "FAQ",
  experience: "Experience",
  partners: "Partners",
  entertainment: "Entertainment",
  guest_profiles: "Guests",
  admins: "Admin Management",
  feature_requests: "Feature Requests",
  change_logs: "Change Log",
};

interface DataTableProps<Row> {
  config: EntityConfig<Row>;
  data: Row[];
  onRowClick?: (row: Row) => void;
  onAddClick?: () => void;
  onDelete?: (row: Row) => Promise<{ success: boolean; error?: string }>;
  onDeleted?: () => void;
  onArchive?: (row: Row) => Promise<{ success: boolean; error?: string }>;
  onArchiveToggled?: () => void;
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
  onArchive,
  onArchiveToggled,
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
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

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

  function cellValue(row: Row, key: (typeof config.columns)[number]["key"]) {
    const col = config.columns.find((item) => item.key === key);
    if (!col) return "";
    return col.render ? col.render(row) : String(row[col.key] ?? "");
  }

  function cellText(row: Row, key: (typeof config.columns)[number]["key"]) {
    const col = config.columns.find((item) => item.key === key);
    if (!col) return "";
    if (col.render) {
      const rendered = col.render(row);
      if (typeof rendered === "string" || typeof rendered === "number") return String(rendered);
    }
    return String(row[col.key] ?? "");
  }

  function titleColumn() {
    const key = config.cardTitleKey ?? config.columns[0]?.key;
    return config.columns.find((column) => column.key === key) ?? config.columns[0];
  }

  function cardTitle(row: Row) {
    const column = titleColumn();
    if (!column) return config.describeRow(row);
    const value = cellValue(row, column.key);
    if (value == null || value === "") return config.describeRow(row);
    return value;
  }

  function cardTitleText(row: Row) {
    const column = titleColumn();
    if (!column) return config.describeRow(row);
    const value = cellText(row, column.key).trim();
    return value || config.describeRow(row);
  }

  function cardExtras() {
    const titleKey = titleColumn()?.key;
    return config.columns.filter((column) => column.key !== titleKey).slice(0, 2);
  }

  function rowArchived(row: Row) {
    return isArchivedRow(row as { archived?: boolean | null });
  }

  async function handleArchive(row: Row) {
    if (!onArchive) return;
    const id = String(row[config.pkColumn]);
    const currentlyArchived = rowArchived(row);
    setPendingArchiveId(id);
    const result = await onArchive(row);
    setPendingArchiveId(null);
    if (result.success) {
      toast.success(currentlyArchived ? "Restored to the app." : "Archived. Hidden from the app.");
      onArchiveToggled?.();
    } else {
      toast.error(result.error ?? "Could not update archive state.");
    }
  }

  function archiveButton(row: Row, titleText: string) {
    if (!onArchive) return null;
    const archived = rowArchived(row);
    const pending = pendingArchiveId === String(row[config.pkColumn]);
    const ArchiveIcon = archived ? ArchiveRestore : Archive;
    const label = pending
      ? archived
        ? "Restoring…"
        : "Archiving…"
      : archived
        ? "Unarchive"
        : "Archive";
    return (
      <Button
        type="button"
        variant={archived ? "default" : "outline"}
        size="xs"
        disabled={pending}
        aria-label={
          archived
            ? `Unarchive ${titleText} so it shows on the app`
            : `Archive ${titleText} to hide it from the app`
        }
        title={
          archived
            ? "Put this back on the app"
            : "Hide this from the app. It stays in the admin."
        }
        onClick={(e) => {
          e.stopPropagation();
          void handleArchive(row);
        }}
      >
        <ArchiveIcon className="size-3" />
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        {config.searchKeys?.length ? (
          <Input
            type="search"
            enterKeyHint="search"
            aria-label={`Search ${config.entityLabel.toLowerCase()}`}
            placeholder={`Search ${config.entityLabel.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:max-w-xs"
          />
        ) : null}

        {config.filters?.length ? (
          <div
            className={`grid w-full gap-2 md:flex md:w-auto ${
              config.filters.length > 1 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {config.filters.map((filter) => {
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
                  <SelectTrigger
                    className="w-full md:w-44"
                    aria-label={`Filter by ${filter.label}`}
                  >
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
          </div>
        ) : null}

        {(!hideExport || onAddClick) && (
          <div
            className={`grid w-full gap-2 md:ml-auto md:flex md:w-auto ${
              !hideExport && onAddClick ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {!hideExport ? (
              <ExportButton
                title={TABLE_EXPORT_TITLES[config.table] ?? config.entityLabel}
                fileStem={config.table.replaceAll("_", "-")}
                className="w-full md:w-auto"
                tables={[
                  {
                    columns: columnsForHtmlExport(config),
                    rows: rowsForHtmlExport(config, data),
                  },
                ]}
              />
            ) : null}
            {onAddClick ? (
              <Button className="w-full md:w-auto" onClick={onAddClick}>
                {addLabel ?? `Add ${config.entityLabel}`}
              </Button>
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
        <>
        <div className="space-y-2 md:hidden">
          {filtered.map((row, index) => {
            const extras = cardExtras();
            const hasActions = canReorder || Boolean(onDelete) || Boolean(onArchive);
            const title = cardTitle(row);
            const titleText = cardTitleText(row);
            const extrasBlock =
              extras.length > 0 ? (
                <dl className="mt-3 space-y-1.5">
                  {extras.map((col) => (
                    <div key={col.key}>
                      <dt className="jc-label">{col.header}</dt>
                      <dd className="mt-0.5 break-words text-sm leading-relaxed text-muted-foreground">
                        {cellValue(row, col.key)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null;
            const actions = hasActions ? (
              <div className="flex items-center justify-end gap-1.5 border-t border-white/10 px-3 py-2">
                {canReorder ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={!reorderActive || index === 0}
                      onClick={() => onMoveUp!(row)}
                      aria-label={`Move ${titleText} up`}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={!reorderActive || index === filtered.length - 1}
                      onClick={() => onMoveDown!(row)}
                      aria-label={`Move ${titleText} down`}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </>
                ) : null}
                {onArchive ? archiveButton(row, titleText) : null}
                {onDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${titleText}`}
                    title={`Delete ${config.entityLabel}`}
                    onClick={() => setPendingDelete(row)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
            ) : null;

            return (
              <article
                key={String(row[config.pkColumn])}
                className={`overflow-hidden rounded-[4px] border border-border bg-card ${rowArchived(row) ? "border-white/15 bg-white/[0.03]" : ""} ${rowClassName?.(row) ?? ""}`}
              >
                {onRowClick ? (
                  <button
                    type="button"
                    onClick={() => onRowClick(row)}
                    aria-label={`Open ${titleText}`}
                    className="block w-full p-4 text-left transition-colors hover:bg-card-hover focus-visible:bg-card-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-orange/40"
                  >
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 break-words font-medium leading-snug">{title}</span>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                    </span>
                    {extrasBlock}
                  </button>
                ) : (
                  <div className="p-4">
                    <p className="break-words font-medium leading-snug">{title}</p>
                    {extrasBlock}
                  </div>
                )}
                {actions}
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-[4px] border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {canReorder && <TableHead className="w-16" />}
                {config.columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
                {(onArchive || onDelete) && (
                  <TableHead className="text-right">{onArchive ? "Actions" : ""}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, index) => (
                <TableRow
                  key={String(row[config.pkColumn])}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`${onRowClick ? "cursor-pointer" : ""} hover:bg-card-hover ${rowArchived(row) ? "bg-white/[0.03]" : ""} ${rowClassName?.(row) ?? ""}`}
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
                  {(onArchive || onDelete) && (
                    <TableCell
                      className="w-px whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {onArchive ? archiveButton(row, cardTitleText(row)) : null}
                        {onDelete ? (
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
                        ) : null}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
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
