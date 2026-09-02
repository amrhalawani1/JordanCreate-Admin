import type { ReactNode } from "react";

export type MediaFolder = "speakers" | "guests" | "partners";

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
  | "chip-list"
  | "password"
  | "image";

export interface FieldConfig<Row> {
  name: keyof Row & string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  /** 'enum' — the fixed, dropdown-only allowed values (mirrors a DB CHECK constraint). */
  enumValues?: readonly string[];
  /** 'enum' — optional display labels keyed by the stored value. */
  enumLabels?: Record<string, string>;
  /** 'suggest-text' — column to derive distinct suggestions from at render time. */
  distinctFrom?: (keyof Row & string) | "self";
  /** 'multiselect-ref' / 'select-ref' — options fetched by the page, not baked into the config. */
  referenceOptions?: { value: string; label: string }[];
  /** 'image' — Storage folder inside the public-media bucket. */
  imageFolder?: MediaFolder;
  /** 'image' — form field whose value becomes the filename slug. */
  imageSlugFrom?: keyof Row & string;
  /** 'image' — fixed slug, used when the filename is an already-known id. */
  imageSlug?: string;
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
  allLabel?: string;
  optionLabels?: Record<string, string>;
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
  /** Column used as the mobile card heading. Defaults to the first column. */
  cardTitleKey?: keyof Row & string;
  /** Builds the "Delete X?" confirmation message for a specific row. */
  describeRow: (row: Row) => string;
}
