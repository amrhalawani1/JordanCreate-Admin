"use client";

import type { ActivityLog } from "@/types/entities";
import { ACTIVITY_KIND_LABELS } from "@/types/entities";
import { actorLabel, resultLabel } from "@/lib/entity-configs/activity-logs";
import { EntityDrawer } from "@/components/shared/EntityDrawer";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="jc-label">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value ?? "—"}</dd>
    </div>
  );
}

export function ActivityDrawer({ row, onOpenChange }: { row: ActivityLog | null; onOpenChange: (open: boolean) => void }) {
  if (!row) return null;
  const when = new Date(row.at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "medium" });
  const meta = row.meta && typeof row.meta === "object" && Object.keys(row.meta as object).length ? JSON.stringify(row.meta, null, 2) : null;

  return (
    <EntityDrawer open onOpenChange={onOpenChange} title={row.name} description={`${ACTIVITY_KIND_LABELS[row.kind as keyof typeof ACTIVITY_KIND_LABELS] ?? row.kind} · ${when}`} size="default">
      <dl className="space-y-4">
        <Row label="Result" value={<span className={row.ok ? "text-emerald-400" : "text-red-400"}>{resultLabel(row)}</span>} />
        {row.error ? <Row label="Error" value={row.error} /> : null}
        <Row label="Who" value={`${actorLabel(row)}${row.actor_level ? ` · ${row.actor_level}` : ""}`} />
        {row.duration_ms != null ? <Row label="Took" value={`${row.duration_ms} ms`} /> : null}
        {row.method || row.path ? <Row label="Request" value={`${row.method ?? ""} ${row.path ?? ""}`.trim()} /> : null}
        {row.http_status != null ? <Row label="HTTP status" value={String(row.http_status)} /> : null}
        {row.ip ? <Row label="IP" value={row.ip} /> : null}
        {row.user_agent ? <Row label="Browser" value={row.user_agent} /> : null}
        {row.request_id ? <Row label="Request id" value={row.request_id} /> : null}
        {row.deployment ? <Row label="Deployment" value={row.deployment} /> : null}
        {meta ? (
          <div>
            <dt className="jc-label">Details</dt>
            <dd className="mt-1">
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-black/30 p-3 text-xs leading-relaxed">{meta}</pre>
            </dd>
          </div>
        ) : null}
      </dl>
    </EntityDrawer>
  );
}
