"use client";

import type { FieldConfig } from "@/lib/entity-configs/types";
import { PhotoThumb } from "@/components/shared/fields/PhotoThumb";

type Primitive = string | number | boolean | null | undefined;

function normalise(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

function display(field: FieldConfig<unknown>, value: unknown): string {
  const v = normalise(value);
  if (v === "") return "—";
  if (field.type === "boolean") return v === "true" ? "Yes" : "No";
  if (field.type === "enum") return field.enumLabels?.[v] ?? v;
  if (field.type === "password") return "••••••••";
  if (field.type === "select-ref" || field.type === "multiselect-ref") {
    const labels = new Map((field.referenceOptions ?? []).map((o) => [o.value, o.label]));
    return v
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => labels.get(part) ?? part)
      .join(", ");
  }
  return v;
}

export interface FieldChange {
  name: string;
  label: string;
  type: FieldConfig<unknown>["type"];
  before: string;
  after: string;
  beforeRaw: Primitive;
  afterRaw: Primitive;
}

/** Fields whose current value differs from the value the form opened with. */
export function diffFields<Row>(
  fields: FieldConfig<Row>[],
  initial: Record<string, unknown>,
  current: Record<string, unknown>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const name = field.name as string;
    const before = normalise(initial[name]);
    const after = normalise(current[name]);
    if (before === after) continue;
    // A blank password field on edit means "keep the current password".
    if (field.type === "password" && after === "") continue;
    const f = field as FieldConfig<unknown>;
    changes.push({
      name,
      label: field.label,
      type: field.type,
      before: display(f, initial[name]),
      after: display(f, current[name]),
      beforeRaw: initial[name] as Primitive,
      afterRaw: current[name] as Primitive,
    });
  }
  return changes;
}

/**
 * "What will change" — one row per edited field, old value → new value,
 * shown above Save so the admin reviews exactly what is about to be written.
 */
export function ChangeSummary({ changes }: { changes: FieldChange[] }) {
  if (changes.length === 0) return null;
  const n = changes.length;

  return (
    <section
      className="mt-6 rounded-[var(--jc-radius-card)] border border-orange/40 bg-orange/[0.06] p-4"
      aria-label="What will change"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-orange">
        What will change · {n} {n === 1 ? "field" : "fields"}
      </p>
      <ul className="mt-3 divide-y divide-border">
        {changes.map((c) => (
          <li key={c.name} className="grid gap-1 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            {c.type === "image" ? (
              <span className="flex items-center gap-3">
                <PhotoThumb src={c.beforeRaw ? String(c.beforeRaw) : null} alt="before" size="md" />
                <span aria-hidden className="text-faint">→</span>
                <PhotoThumb src={c.afterRaw ? String(c.afterRaw) : null} alt="after" size="md" />
              </span>
            ) : (
              <span className="min-w-0 text-sm">
                <span className="break-words text-faint line-through decoration-faint/60">{c.before}</span>
                <span aria-hidden className="mx-2 text-faint">→</span>
                <span className="break-words font-medium text-foreground">{c.after}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
