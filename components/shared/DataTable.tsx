"use client";

import { useMemo, useState } from "react";
import type { EntityConfig } from "@/lib/entity-configs/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface DataTableProps<Row> {
  config: EntityConfig<Row>;
  data: Row[];
  onRowClick: (row: Row) => void;
  onAddClick?: () => void;
  onDeleteClick?: (row: Row) => void;
  emptyMessage: string;
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
  onDeleteClick,
  emptyMessage,
  rowClassName,
  onMoveUp,
  onMoveDown,
}: DataTableProps<Row>) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

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

        {config.filters?.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || ALL_FILTER_VALUE}
            onValueChange={(value: string | null) =>
              setActiveFilters((prev) => ({
                ...prev,
                [filter.key]: !value || value === ALL_FILTER_VALUE ? "" : value,
              }))
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {onAddClick && (
          <Button onClick={onAddClick} className="ml-auto">
            Add {config.entityLabel}
          </Button>
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {canReorder && <TableHead className="w-16" />}
                {config.columns.map((col) => (
                  <TableHead key={col.key}>{col.header}</TableHead>
                ))}
                {onDeleteClick && <TableHead className="w-10" />}
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
                  {onDeleteClick && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(row);
                        }}
                        aria-label={`Delete ${config.entityLabel}`}
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
    </div>
  );
}
