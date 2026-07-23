import type { ReactNode } from "react";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "url"
  | "boolean"
  | "enum"
  | "suggest-text"
  | "multiselect-ref"
  | "select-ref"
  | "chip-list";

export interface FieldConfig<Row> {
  name: keyof Row & string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  /** 'enum' — the fixed, dropdown-only allowed values (mirrors a DB CHECK constraint). */
  enumValues?: readonly string[];
  /** 'suggest-text' — column to derive distinct suggestions from at render time. */
  distinctFrom?: (keyof Row & string) | "self";
  /** 'multiselect-ref' / 'select-ref' — options fetched by the page, not baked into the config. */
  referenceOptions?: { value: string; label: string }[];
}

export interface ColumnConfig<Row> {
  key: keyof Row & string;
  header: string;
  render?: (row: Row) => ReactNode;
  className?: string;
}

export interface FilterConfig<Row> {
  key: keyof Row & string;
  label: string;
  options: readonly string[];
}

export interface EntityConfig<Row> {
  table: string;
  pkColumn: keyof Row & string;
  entityLabel: string;
  columns: ColumnConfig<Row>[];
  searchKeys?: (keyof Row & string)[];
  filters?: FilterConfig<Row>[];
  formFields: FieldConfig<Row>[];
  hasUpdatedAt: boolean;
  reorderable?: boolean;
  /** Builds the "Delete X?" confirmation message for a specific row. */
  describeRow: (row: Row) => string;
}
