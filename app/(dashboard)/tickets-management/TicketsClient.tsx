"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Ban, Check, ChevronDown, Trash2, Undo2, X } from "lucide-react";
import type { TicketQueueRow } from "@/types/entities";
import {
  TICKET_TAB_LABELS,
  TICKET_TABS,
  buyerDiffers,
  filterTickets,
  groupConflicts,
  groupOrderWarnings,
  holderDisplayName,
  isAwaiting,
  isConflict,
  conflictPhoneSet,
  ticketTabCounts,
  type TicketTab,
} from "@/lib/tickets/queue";
import { describeTicket, formatArrival, ticketTypeLabel } from "@/lib/tickets/format";
import {
  approveTickets,
  createManualTicket,
  deleteTicket,
  rejectTicket,
  restoreTicket,
  updateTicket,
  voidTicket,
} from "@/actions/tickets";
import { useAdminAccess } from "@/components/layout/AdminAccessProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { EntityDrawer } from "@/components/shared/EntityDrawer";
import { ExportButton } from "@/components/shared/ExportButton";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ApproveConfirmDialog } from "@/components/tickets/ApproveConfirmDialog";
import { RejectDialog } from "@/components/tickets/RejectDialog";
import { RevokeConfirmDialog } from "@/components/tickets/RevokeConfirmDialog";
import { TicketForm } from "@/components/tickets/TicketForm";
import { SEED_DUMMY_TICKETS_SQL } from "@/lib/sql/seed-dummy-tickets";
import type { ManualTicketFormValues } from "@/lib/validation/tickets";

export function TicketsClient({ initialData }: { initialData: TicketQueueRow[] }) {
  const router = useRouter();
  const { canEditTickets, canVoidTickets } = useAdminAccess();
  const [tickets, setTickets] = useState(initialData);
  const [tab, setTab] = useState<TicketTab>("awaiting");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [approveIds, setApproveIds] = useState<string[] | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TicketQueueRow | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<TicketQueueRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketQueueRow | null>(null);
  const [drawerRow, setDrawerRow] = useState<TicketQueueRow | null | "add">(null);
  const [copiedSeed, setCopiedSeed] = useState(false);

  useEffect(() => {
    setTickets(initialData);
  }, [initialData]);

  const counts = useMemo(() => ticketTabCounts(tickets), [tickets]);
  const warnings = useMemo(() => groupOrderWarnings(tickets), [tickets]);
  const conflictPhones = useMemo(() => conflictPhoneSet(tickets), [tickets]);
  const visible = useMemo(() => filterTickets(tickets, tab, search), [tickets, tab, search]);
  const conflictGroups = useMemo(() => (tab === "conflicts" ? groupConflicts(visible) : []), [tab, visible]);
  const selectable = useMemo(() => visible.filter(isAwaiting), [visible]);
  const selectedVisible = selectable.filter((row) => selected.has(row.id));
  const allSelectableChecked = selectable.length > 0 && selectedVisible.length === selectable.length;

  function refresh() {
    router.refresh();
  }

  function toggleOne(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of selectable) {
        if (on) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }

  async function runApprove(ids: string[]): Promise<{ success: boolean; error?: string }> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return { success: false, error: "Select at least one ticket." };

    const snapshot = tickets;
    const nowIso = new Date().toISOString();
    setPendingIds((prev) => new Set([...prev, ...unique]));
    setRowErrors((prev) => {
      const next = { ...prev };
      for (const id of unique) delete next[id];
      return next;
    });
    setTickets((prev) =>
      prev.map((row) =>
        unique.includes(row.id) && isAwaiting(row)
          ? { ...row, approved: true, approved_at: nowIso }
          : row,
      ),
    );

    const result = await approveTickets(unique);
    setPendingIds((prev) => {
      const next = new Set(prev);
      for (const id of unique) next.delete(id);
      return next;
    });

    if (!result.success) {
      setTickets(snapshot);
      return result;
    }

    const failedIds = new Set(result.failed.map((item) => item.id));
    setTickets((prev) =>
      prev.map((row) => {
        if (!failedIds.has(row.id)) return row;
        const original = snapshot.find((item) => item.id === row.id);
        return original ?? row;
      }),
    );
    setRowErrors((prev) => {
      const next = { ...prev };
      for (const item of result.failed) next[item.id] = item.error;
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of result.succeeded) next.delete(id);
      return next;
    });

    const ok = result.succeeded.length;
    const fail = result.failed.length;
    if (fail === 0) {
      toast.success(ok === 1 ? "Approved 1 ticket." : `Approved ${ok} tickets.`);
    } else if (ok === 0) {
      toast.error(`None of the ${unique.length} tickets could be approved.`);
    } else {
      toast.error(`Approved ${ok} of ${unique.length}. ${fail} ${fail === 1 ? "stays" : "stay"} in the queue.`);
    }
    refresh();
    return { success: true };
  }

  async function runReject(note: string) {
    if (!rejectTarget) return { success: false, error: "Nothing to reject." };
    const id = rejectTarget.id;
    const snapshot = tickets;
    setPendingIds((prev) => new Set(prev).add(id));
    setTickets((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, rejected_at: new Date().toISOString(), rejection_note: note, approved: false }
          : row,
      ),
    );
    const result = await rejectTicket(id, note);
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (!result.success) {
      setTickets(snapshot);
      return result;
    }
    toast.success("Ticket rejected.");
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    refresh();
    return result;
  }

  async function runRestore(row: TicketQueueRow) {
    const snapshot = tickets;
    setPendingIds((prev) => new Set(prev).add(row.id));
    setTickets((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? { ...item, rejected_at: null, rejected_by: null, rejection_note: null }
          : item,
      ),
    );
    const result = await restoreTicket(row.id);
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
    if (!result.success) {
      setTickets(snapshot);
      toast.error(result.error ?? "Could not restore.");
      return;
    }
    toast.success("Returned to the queue.");
    refresh();
  }

  async function runVoid(row: TicketQueueRow) {
    const result = await voidTicket(row.id);
    if (!result.success) {
      toast.error(result.error ?? "Could not revoke access.");
      return { success: false, error: result.error };
    }
    toast.success("Access revoked.");
    refresh();
    return { success: true };
  }

  const emptyMessage =
    tickets.length === 0
      ? "No tickets yet."
      : tab === "awaiting"
        ? "Queue is clear."
        : "No rows match this filter.";

  const exportRows = visible.map((row) => ({
    holder_name: holderDisplayName(row),
    customer_name: buyerDiffers(row) ? row.customer_name ?? "" : "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    ticket_type: ticketTypeLabel(row.ticket_type),
    ticket_ref: row.ticket_ref ?? "",
    status: row.status === "void" ? "Revoked" : row.status,
    approved: row.approved ? "Approved" : "",
    rejected: row.rejected_at ? "Rejected" : "",
    source: row.source ?? "",
    created_at: row.created_at,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <Input
          type="search"
          enterKeyHint="search"
          aria-label="Search tickets"
          placeholder="Search name, phone, or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:max-w-xs"
        />
        <div className="grid w-full gap-2 md:ml-auto md:flex md:w-auto md:grid-cols-none">
          <ExportButton
            title="Tickets"
            fileStem="tickets"
            className="w-full md:w-auto"
            tables={[
              {
                columns: [
                  { key: "holder_name", header: "Attendee" },
                  { key: "customer_name", header: "Buyer" },
                  { key: "phone", header: "Phone" },
                  { key: "email", header: "Email" },
                  { key: "ticket_type", header: "Type" },
                  { key: "ticket_ref", header: "Reference" },
                  { key: "status", header: "Status" },
                  { key: "approved", header: "Approved" },
                  { key: "rejected", header: "Rejected" },
                  { key: "source", header: "Source" },
                  { key: "created_at", header: "Arrived" },
                ],
                rows: exportRows,
              },
            ]}
          />
          {canEditTickets ? (
            <Button className="w-full md:w-auto" onClick={() => setDrawerRow("add")}>
              Add ticket
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-h-11 w-max gap-1" role="tablist" aria-label="Ticket filters">
          {TICKET_TABS.map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item)}
                className={`h-11 shrink-0 rounded-[4px] px-3 text-sm transition-colors md:h-9 ${
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                }`}
              >
                {TICKET_TAB_LABELS[item]}
                <span className={`ml-2 font-[family-name:var(--font-ui)] text-[11px] tracking-wide ${active ? "text-orange" : "text-faint"}`}>
                  {counts[item]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {warnings.length > 0 && (tab === "awaiting" || tab === "all") ? (
        <Alert className="rounded-[4px] border-orange/40 bg-orange/5">
          <AlertTriangle className="text-orange" />
          <AlertTitle className="text-orange">Group order missing attendee phones</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              These buyers used one phone for several tickets. Everyone except the buyer will be
              locked out of the app until the phones are corrected.
            </p>
            <ul className="list-disc space-y-1 pl-4 text-foreground/90">
              {warnings.map((warning) => (
                <li key={warning.customerName}>
                  <span dir="auto">{warning.customerName}</span>
                  {` · ${warning.count} tickets · ${warning.phone}`}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState message={search.trim() && tickets.length > 0 ? "No rows match your search/filter." : emptyMessage} />
      ) : tab === "conflicts" ? (
        <div className="space-y-4">
          {conflictGroups.map((group) => (
            <section key={group.phone} className="overflow-hidden rounded-[4px] border border-orange/40">
              <header className="flex flex-col gap-2 border-b border-orange/20 bg-orange/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-foreground">
                  Shared phone {group.phone}
                  <span className="text-muted-foreground">{` · ${group.rows.length} tickets`}</span>
                </p>
                {canEditTickets && group.rows.filter(isAwaiting).length > 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setApproveIds(group.rows.filter(isAwaiting).map((row) => row.id))}
                  >
                    <Check className="size-3.5" />
                    Approve both
                  </Button>
                ) : null}
              </header>
              <QueueList
                rows={group.rows}
                conflictPhones={conflictPhones}
                selected={selected}
                pendingIds={pendingIds}
                rowErrors={rowErrors}
                canEditTickets={canEditTickets}
                canVoidTickets={canVoidTickets}
                showCheckbox
                onToggle={toggleOne}
                onOpen={(row) => setDrawerRow(row)}
                onApprove={(row) => setApproveIds([row.id])}
                onReject={setRejectTarget}
                onRestore={(row) => void runRestore(row)}
                onVoid={setRevokeTarget}
                onDelete={setDeleteTarget}
              />
            </section>
          ))}
        </div>
      ) : (
        <QueueList
          rows={visible}
          conflictPhones={conflictPhones}
          selected={selected}
          pendingIds={pendingIds}
          rowErrors={rowErrors}
          canEditTickets={canEditTickets}
          canVoidTickets={canVoidTickets}
          showCheckbox={canEditTickets && selectable.length > 0}
          allChecked={allSelectableChecked}
          onToggleAll={toggleAll}
          onToggle={toggleOne}
          onOpen={(row) => setDrawerRow(row)}
          onApprove={(row) => setApproveIds([row.id])}
          onReject={setRejectTarget}
          onRestore={(row) => void runRestore(row)}
          onVoid={setRevokeTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {canEditTickets && selectedVisible.length > 0 ? (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:mx-0 md:rounded-[4px] md:border">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              {selectedVisible.length === 1 ? "1 ticket selected" : `${selectedVisible.length} tickets selected`}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => setApproveIds(selectedVisible.map((row) => row.id))}>
                <Check className="size-3.5" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {canEditTickets ? (
        <details className="rounded-[4px] border border-border px-4 py-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer text-foreground">Dummy seed SQL</summary>
          <p className="mt-2 leading-relaxed">
            Optional. Run in the Supabase SQL Editor after setup. Skips ticket references that already exist.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={async () => {
              await navigator.clipboard.writeText(SEED_DUMMY_TICKETS_SQL);
              setCopiedSeed(true);
              window.setTimeout(() => setCopiedSeed(false), 2000);
            }}
          >
            {copiedSeed ? "Copied" : "Copy dummy seed SQL"}
          </Button>
        </details>
      ) : null}

      <ApproveConfirmDialog
        open={approveIds != null && approveIds.length > 0}
        count={approveIds?.length ?? 0}
        onOpenChange={(open) => {
          if (!open) setApproveIds(null);
        }}
        onConfirm={async () => {
          if (!approveIds) return { success: false, error: "Nothing to approve." };
          const result = await runApprove(approveIds);
          if (result.success) setApproveIds(null);
          return result;
        }}
      />

      <RejectDialog
        ticket={rejectTarget}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onConfirm={runReject}
      />

      <RevokeConfirmDialog
        ticket={revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        onConfirm={async () => {
          if (!revokeTarget) return { success: false, error: "Nothing to revoke." };
          return runVoid(revokeTarget);
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        description={deleteTarget ? describeTicket(deleteTarget) : "Delete this ticket?"}
        onConfirm={() => {
          if (!deleteTarget) return Promise.resolve({ success: false, error: "Nothing to delete." });
          return deleteTicket(deleteTarget.id);
        }}
        onDeleted={() => {
          toast.success("Ticket deleted.");
          setDeleteTarget(null);
          refresh();
        }}
      />

      <EntityDrawer
        open={drawerRow !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerRow(null);
        }}
        title={drawerRow === "add" ? "Add ticket" : drawerRow ? holderDisplayName(drawerRow) : "Ticket"}
        description={
          drawerRow === "add"
            ? "Speakers, partners, crew, and press who never buy through Tzkrti. Source is stored as manual."
            : drawerRow?.ticket_ref
              ? `Reference ${drawerRow.ticket_ref}`
              : undefined
        }
      >
        {drawerRow ? (
          <TicketForm
            key={drawerRow === "add" ? "add" : drawerRow.id}
            row={drawerRow === "add" ? null : drawerRow}
            submitLabel={drawerRow === "add" ? "Add ticket" : "Save changes"}
            onSubmit={async (values: ManualTicketFormValues) => {
              if (drawerRow === "add") return createManualTicket(values);
              const { gate_token: _token, ...rest } = values;
              return updateTicket(drawerRow.id, rest);
            }}
            onSuccess={() => {
              toast.success(drawerRow === "add" ? "Ticket added." : "Ticket updated.");
              setDrawerRow(null);
              refresh();
            }}
          />
        ) : null}
      </EntityDrawer>
    </div>
  );
}

function QueueList({
  rows,
  conflictPhones,
  selected,
  pendingIds,
  rowErrors,
  canEditTickets,
  canVoidTickets,
  showCheckbox,
  allChecked,
  onToggleAll,
  onToggle,
  onOpen,
  onApprove,
  onReject,
  onRestore,
  onVoid,
  onDelete,
}: {
  rows: TicketQueueRow[];
  conflictPhones: Set<string>;
  selected: Set<string>;
  pendingIds: Set<string>;
  rowErrors: Record<string, string>;
  canEditTickets: boolean;
  canVoidTickets: boolean;
  showCheckbox: boolean;
  allChecked?: boolean;
  onToggleAll?: (on: boolean) => void;
  onToggle: (id: string, on: boolean) => void;
  onOpen: (row: TicketQueueRow) => void;
  onApprove: (row: TicketQueueRow) => void;
  onReject: (row: TicketQueueRow) => void;
  onRestore: (row: TicketQueueRow) => void;
  onVoid: (row: TicketQueueRow) => void;
  onDelete: (row: TicketQueueRow) => void;
}) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className={`overflow-hidden rounded-[4px] border border-border bg-card ${
              isConflict(row, conflictPhones) ? "border-l-2 border-l-orange" : ""
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              {showCheckbox && isAwaiting(row) ? (
                <Checkbox
                  checked={selected.has(row.id)}
                  onCheckedChange={(value) => onToggle(row.id, value === true)}
                  aria-label={`Select ${holderDisplayName(row)}`}
                  className="mt-1 size-5"
                />
              ) : showCheckbox ? (
                <span className="size-5" />
              ) : null}
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(row)}>
                <TicketIdentity row={row} />
                <dl className="mt-3 space-y-1.5">
                  <Meta label="Phone" value={row.phone ?? "—"} />
                  {row.email ? <Meta label="Email" value={row.email} /> : null}
                  <Meta label="Type" value={ticketTypeLabel(row.ticket_type)} />
                  <Meta label="Arrived" value={<ArrivalLabel iso={row.created_at} />} />
                  {row.approved ? <Meta label="State" value="Approved" /> : null}
                  {row.rejection_note ? <Meta label="Rejection" value={row.rejection_note} /> : null}
                </dl>
              </button>
            </div>
            {rowErrors[row.id] ? (
              <p className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {rowErrors[row.id]}
              </p>
            ) : null}
            <TicketRowControls
              row={row}
              pending={pendingIds.has(row.id)}
              canEditTickets={canEditTickets}
              canVoidTickets={canVoidTickets}
              onApprove={onApprove}
              onReject={onReject}
              onRestore={onRestore}
              onVoid={onVoid}
              onDelete={onDelete}
            />
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[4px] border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckbox ? (
                <TableHead className="w-10">
                  {onToggleAll ? (
                    <Checkbox
                      checked={allChecked === true}
                      onCheckedChange={(value) => onToggleAll(value === true)}
                      aria-label="Select all visible tickets"
                    />
                  ) : null}
                </TableHead>
              ) : null}
              <TableHead>Attendee</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Arrived</TableHead>
              <TableHead>State</TableHead>
              {(canEditTickets || canVoidTickets) ? (
                <TableHead className="w-px text-right">Actions</TableHead>
              ) : null}
              {canVoidTickets ? (
                <TableHead className="w-px">
                  <span className="sr-only">Delete</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onOpen(row)}
                className={`cursor-pointer ${isConflict(row, conflictPhones) ? "border-l-2 border-l-orange" : ""}`}
              >
                {showCheckbox ? (
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    {isAwaiting(row) ? (
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(value) => onToggle(row.id, value === true)}
                        aria-label={`Select ${holderDisplayName(row)}`}
                      />
                    ) : null}
                  </TableCell>
                ) : null}
                <TableCell className="max-w-[18rem] whitespace-normal">
                  <TicketIdentity row={row} />
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{row.phone ?? "—"}</TableCell>
                <TableCell className="max-w-[14rem] whitespace-normal break-words">
                  {row.email ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{ticketTypeLabel(row.ticket_type)}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  <ArrivalLabel iso={row.created_at} />
                </TableCell>
                <TableCell>
                  <TicketState row={row} />
                </TableCell>
                {(canEditTickets || canVoidTickets) ? (
                  <TableCell className="w-px" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end">
                      <TicketActionMenu
                        row={row}
                        pending={pendingIds.has(row.id)}
                        canEditTickets={canEditTickets}
                        canVoidTickets={canVoidTickets}
                        onApprove={onApprove}
                        onReject={onReject}
                        onRestore={onRestore}
                        onVoid={onVoid}
                      />
                    </div>
                  </TableCell>
                ) : null}
                {canVoidTickets ? (
                  <TableCell className="w-px" onClick={(event) => event.stopPropagation()}>
                    <DeleteTicketButton
                      row={row}
                      pending={pendingIds.has(row.id)}
                      onDelete={onDelete}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.some((row) => rowErrors[row.id]) ? (
          <ul className="space-y-1 border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rows
              .filter((row) => rowErrors[row.id])
              .map((row) => (
                <li key={row.id}>
                  {holderDisplayName(row)}: {rowErrors[row.id]}
                </li>
              ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}

function TicketIdentity({ row }: { row: TicketQueueRow }) {
  const hasName = Boolean(row.holder_name?.trim());
  return (
    <div>
      <p
        dir="auto"
        className={`break-words leading-snug ${hasName ? "font-medium" : "text-muted-foreground"}`}
      >
        {holderDisplayName(row)}
      </p>
      {buyerDiffers(row) ? (
        <p dir="auto" className="mt-0.5 break-words text-xs text-muted-foreground">
          Buyer {row.customer_name}
        </p>
      ) : null}
    </div>
  );
}

function TicketState({ row }: { row: TicketQueueRow }) {
  if (row.status === "void") return <span className="text-muted-foreground">Revoked</span>;
  if (row.approved) return <span>Approved</span>;
  if (row.rejected_at) return <span className="text-destructive">Rejected</span>;
  return <span className="text-muted-foreground">Awaiting</span>;
}

function ArrivalLabel({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    setLabel(formatArrival(iso));
  }, [iso]);
  return <time dateTime={iso} suppressHydrationWarning>{label ?? "\u00a0"}</time>;
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="jc-label">{label}</dt>
      <dd className="mt-0.5 break-words text-sm leading-relaxed text-muted-foreground">{value}</dd>
    </div>
  );
}

function canShowTicketMenu(
  row: TicketQueueRow,
  canEditTickets: boolean,
  canVoidTickets: boolean,
): boolean {
  if (canEditTickets && isAwaiting(row)) return true;
  if (canEditTickets && row.rejected_at) return true;
  if (canVoidTickets && row.status !== "void") return true;
  return false;
}

function TicketRowControls({
  row,
  pending,
  canEditTickets,
  canVoidTickets,
  onApprove,
  onReject,
  onRestore,
  onVoid,
  onDelete,
}: {
  row: TicketQueueRow;
  pending: boolean;
  canEditTickets: boolean;
  canVoidTickets: boolean;
  onApprove: (row: TicketQueueRow) => void;
  onReject: (row: TicketQueueRow) => void;
  onRestore: (row: TicketQueueRow) => void;
  onVoid: (row: TicketQueueRow) => void;
  onDelete: (row: TicketQueueRow) => void;
}) {
  const showMenu = canShowTicketMenu(row, canEditTickets, canVoidTickets);
  if (!showMenu && !canVoidTickets) return null;
  return (
    <div className="flex items-center gap-2 border-t border-white/10 p-3">
      <TicketActionMenu
        row={row}
        pending={pending}
        canEditTickets={canEditTickets}
        canVoidTickets={canVoidTickets}
        onApprove={onApprove}
        onReject={onReject}
        onRestore={onRestore}
        onVoid={onVoid}
      />
      {canVoidTickets ? (
        <div className="ml-auto">
          <DeleteTicketButton row={row} pending={pending} onDelete={onDelete} />
        </div>
      ) : null}
    </div>
  );
}

function TicketActionMenu({
  row,
  pending,
  canEditTickets,
  canVoidTickets,
  onApprove,
  onReject,
  onRestore,
  onVoid,
}: {
  row: TicketQueueRow;
  pending: boolean;
  canEditTickets: boolean;
  canVoidTickets: boolean;
  onApprove: (row: TicketQueueRow) => void;
  onReject: (row: TicketQueueRow) => void;
  onRestore: (row: TicketQueueRow) => void;
  onVoid: (row: TicketQueueRow) => void;
}) {
  if (!canShowTicketMenu(row, canEditTickets, canVoidTickets)) return null;
  const name = holderDisplayName(row);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Actions for ${name}`}
          />
        }
      >
        Actions
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {canEditTickets && isAwaiting(row) ? (
          <DropdownMenuItem
            disabled={pending}
            onClick={() => onApprove(row)}
            className="text-orange focus:text-orange"
          >
            <Check className="size-3.5 text-orange" />
            Approve
          </DropdownMenuItem>
        ) : null}
        {canEditTickets && isAwaiting(row) ? (
          <DropdownMenuItem disabled={pending} onClick={() => onReject(row)}>
            <X className="size-3.5" />
            Reject
          </DropdownMenuItem>
        ) : null}
        {canEditTickets && row.rejected_at ? (
          <DropdownMenuItem disabled={pending} onClick={() => onRestore(row)}>
            <Undo2 className="size-3.5" />
            Restore
          </DropdownMenuItem>
        ) : null}
        {canVoidTickets && row.status !== "void" && (isAwaiting(row) || row.rejected_at) ? (
          <DropdownMenuSeparator />
        ) : null}
        {canVoidTickets && row.status !== "void" ? (
          <DropdownMenuItem
            variant="destructive"
            disabled={pending}
            onClick={() => onVoid(row)}
          >
            <Ban className="size-3.5" />
            Revoke access
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteTicketButton({
  row,
  pending,
  onDelete,
}: {
  row: TicketQueueRow;
  pending: boolean;
  onDelete: (row: TicketQueueRow) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      aria-label={`Delete ${holderDisplayName(row)}`}
      title="Delete this ticket"
      onClick={() => onDelete(row)}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
