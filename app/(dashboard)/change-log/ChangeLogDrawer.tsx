"use client";

import { CHANGE_ACTION_LABELS } from "@/types/entities";
import type { ChangeLog } from "@/types/entities";
import { tableLabel } from "@/lib/entity-configs/change-logs";
import { EntityDrawer } from "@/components/shared/EntityDrawer";

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map((item) => formatValue(item)).join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DiffList({ changes }: { changes: unknown }) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    return <p className="text-sm text-muted-foreground">No field changes recorded.</p>;
  }

  const record = changes as Record<string, unknown>;

  if ("created" in record && record.created && typeof record.created === "object") {
    const created = record.created as Record<string, unknown>;
    return (
      <dl className="space-y-3">
        {Object.entries(created).map(([key, value]) => (
          <div key={key}>
            <dt className="jc-label">{key.replaceAll("_", " ")}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if ("deleted" in record && record.deleted && typeof record.deleted === "object") {
    const deleted = record.deleted as Record<string, unknown>;
    return (
      <dl className="space-y-3">
        {Object.entries(deleted).map(([key, value]) => (
          <div key={key}>
            <dt className="jc-label">{key.replaceAll("_", " ")}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const entries = Object.entries(record);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No field changes recorded.</p>;
  }

  return (
    <dl className="space-y-4">
      {entries.map(([key, value]) => {
        const diff =
          value && typeof value === "object" && !Array.isArray(value) && "from" in value && "to" in value
            ? (value as { from: unknown; to: unknown })
            : null;
        return (
          <div key={key}>
            <dt className="jc-label">{key.replaceAll("_", " ")}</dt>
            <dd className="mt-1 space-y-1 text-sm">
              {diff ? (
                <>
                  <p className="break-words text-muted-foreground">From: {formatValue(diff.from)}</p>
                  <p className="break-words">To: {formatValue(diff.to)}</p>
                </>
              ) : (
                <p className="whitespace-pre-wrap break-words">{formatValue(value)}</p>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function ChangeLogDrawer({
  row,
  onOpenChange,
}: {
  row: ChangeLog | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <EntityDrawer
      open={!!row}
      onOpenChange={onOpenChange}
      title={row?.summary ?? "Change"}
      description={
        row
          ? `${CHANGE_ACTION_LABELS[row.action]} · ${tableLabel(row.table_name)} · ${row.actor_name}`
          : undefined
      }
    >
      {row ? (
        <div className="space-y-6">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="jc-label">Who</dt>
              <dd className="mt-1 break-words">
                {row.actor_name}
                <span className="text-muted-foreground"> · {row.actor_email}</span>
              </dd>
            </div>
            <div>
              <dt className="jc-label">When</dt>
              <dd className="mt-1">
                {new Date(row.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            {row.record_id ? (
              <div>
                <dt className="jc-label">Record</dt>
                <dd className="mt-1 break-all">{row.record_id}</dd>
              </div>
            ) : null}
          </dl>
          <div>
            <p className="jc-label mb-3">Changes</p>
            <DiffList changes={row.changes} />
          </div>
        </div>
      ) : null}
    </EntityDrawer>
  );
}
