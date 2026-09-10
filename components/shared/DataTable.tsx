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
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";
import { Archive, ArchiveRestore, Trash2, ChevronUp, ChevronDown, ChevronRight, Plus, Search } from "lucide-react";

const TABLE_EXPORT_TITLES: Record<string, string> = {
  agenda_sessions: "Agenda",
  speakers: "Speakers",
  venue_zones: "Venue Zones",
  interest_tags: "Interest Tags",
  faq_entries: "FAQ",
  experience: "Experience",
  partners: "Sponsors",
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
  const { canEdit } = useAdminAccess();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const showAdd = canEdit && Boolean(onAddClick);
  const showDelete = canEdit && Boolean(onDelete);
  const showArchive = canEdit && Boolean(onArchive);
  const canReorder = canEdit && Boolean(onMoveUp && onMoveDown);
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
    return config.columns.filter((column) => column.key !== titleKey).slice(0, 4);
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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 sm:p-3.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {config.searchKeys?.length ? (
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
                aria-hidden
              />
              <Input
                type="search"
                enterKeyHint="search"
                aria-label={`Search ${config.entityLabel.toLowerCase()}`}
                placeholder={`Search ${config.entityLabel.toLowerCase()}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          ) : null}

          {config.filters?.length ? (
            <div
              className={`grid w-full gap-2 lg:flex lg:w-auto ${
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
                      className="w-full lg:w-44"
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

          {(!hideExport || showAdd) && (
            <div
              className={`grid w-full gap-2 lg:ml-auto lg:flex lg:w-auto ${
                !hideExport && showAdd ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {!hideExport ? (
                <ExportButton
                  title={TABLE_EXPORT_TITLES[config.table] ?? config.entityLabel}
                  fileStem={config.table.replaceAll("_", "-")}
                  className="w-full lg:w-auto"
                  tables={[
                    {
                      columns: columnsForHtmlExport(config),
                      rows: rowsForHtmlExport(config, data),
                    },
                  ]}
                />
              ) : null}
              {showAdd ? (
                <Button className="w-full lg:w-auto" onClick={onAddClick}>
                  <Plus className="size-4" />
                  {addLabel ?? `Add ${config.entityLabel}`}
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
          <p className="text-xs text-muted-foreground">
            {filtered.length === data.length
              ? `${data.length} ${data.length === 1 ? "record" : "records"}`
              : `${filtered.length} of ${data.length} records`}
          </p>
          {canReorder && isFilteredOrSearched ? (
            <p className="text-xs text-faint">Clear search/filters to reorder</p>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={data.length === 0 ? emptyMessage : "No rows match your search/filter."} />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((row, index) => {
              const extras = cardExtras();
              const hasActions = canReorder || showDelete || showArchive;
              const title = cardTitle(row);
              const titleText = cardTitleText(row);
              const extrasBlock =
                extras.length > 0 ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                    {extras.map((col) => (
                      <div key={col.key} className="min-w-0">
                        <dt className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                          {col.header}
                        </dt>
                        <dd className="mt-0.5 truncate text-sm text-muted-foreground">
                          {cellValue(row, col.key)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null;
              const actions = hasActions ? (
                <div className="flex items-center justify-end gap-1.5 border-t border-border px-3 py-2">
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
                  {showArchive ? archiveButton(row, titleText) : null}
                  {showDelete ? (
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
                  className={`overflow-hidden rounded-xl border border-border bg-card ${rowArchived(row) ? "border-white/12 bg-white/[0.02] opacity-80" : ""} ${rowClassName?.(row) ?? ""}`}
                >
                  {onRowClick ? (
                    <button
                      type="button"
                      onClick={() => onRowClick(row)}
                      aria-label={`Open ${titleText}`}
                      className="block w-full p-3.5 text-left transition-colors hover:bg-card-hover focus-visible:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange/30"
                    >
                      <span className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 break-words text-[0.95rem] font-medium leading-snug">
                          {title}
                        </span>
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                      </span>
                      {extrasBlock}
                    </button>
                  ) : (
                    <div className="p-3.5">
                      <p className="break-words text-[0.95rem] font-medium leading-snug">{title}</p>
                      {extrasBlock}
                    </div>
                  )}
                  {actions}
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {canReorder && <TableHead className="w-16" />}
                  {config.columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                  {(showArchive || showDelete) && (
                    <TableHead className="text-right">{showArchive ? "Actions" : ""}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, index) => (
                  <TableRow
                    key={String(row[config.pkColumn])}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`${onRowClick ? "cursor-pointer" : ""} hover:bg-card-hover ${rowArchived(row) ? "bg-white/[0.02] opacity-80" : ""} ${rowClassName?.(row) ?? ""}`}
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
                    {(showArchive || showDelete) && (
                      <TableCell
                        className="w-px whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {showArchive ? archiveButton(row, cardTitleText(row)) : null}
                          {showDelete ? (
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
