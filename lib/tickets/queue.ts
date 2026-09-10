import type { TicketQueueRow } from "@/types/entities";
import { phoneMatchesQuery } from "@/lib/phone";

export const TICKET_TABS = ["awaiting", "approved", "rejected", "conflicts", "all"] as const;
export type TicketTab = (typeof TICKET_TABS)[number];

export const TICKET_TAB_LABELS: Record<TicketTab, string> = {
  awaiting: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  conflicts: "Conflicts",
  all: "All",
};

export function isAwaiting(row: TicketQueueRow): boolean {
  return row.status === "active" && !row.approved && row.rejected_at == null;
}

export function isApproved(row: TicketQueueRow): boolean {
  return row.approved === true && row.status === "active";
}

export function isRejected(row: TicketQueueRow): boolean {
  return row.rejected_at != null;
}

export function holderDisplayName(row: TicketQueueRow): string {
  const name = row.holder_name?.trim();
  return name || "No attendee name";
}

export function buyerDiffers(row: TicketQueueRow): boolean {
  const buyer = row.customer_name?.trim().toLowerCase() ?? "";
  const holder = row.holder_name?.trim().toLowerCase() ?? "";
  if (!buyer) return false;
  if (!holder) return true;
  return buyer !== holder;
}

function holderKey(row: TicketQueueRow): string {
  return (row.holder_name ?? "").trim().toLowerCase();
}

/** Active tickets sharing a phone with different holder names. */
export function conflictPhoneSet(rows: TicketQueueRow[]): Set<string> {
  const byPhone = new Map<string, Set<string>>();
  for (const row of rows) {
    if (row.status !== "active" || !row.phone) continue;
    const set = byPhone.get(row.phone) ?? new Set<string>();
    set.add(holderKey(row));
    byPhone.set(row.phone, set);
  }
  const phones = new Set<string>();
  for (const [phone, holders] of byPhone) {
    if (holders.size > 1) phones.add(phone);
  }
  return phones;
}

export function isConflict(row: TicketQueueRow, conflictPhones: Set<string>): boolean {
  if (row.status !== "active" || !row.phone) return false;
  return conflictPhones.has(row.phone) || row.match_status === "conflict";
}

export type GroupOrderWarning = {
  customerName: string;
  count: number;
  phone: string;
};

/** Several tickets, one buyer, one shared phone — everyone except the buyer will be locked out. */
export function groupOrderWarnings(rows: TicketQueueRow[]): GroupOrderWarning[] {
  const active = rows.filter((row) => row.status === "active" && row.customer_name?.trim());
  const byBuyer = new Map<string, TicketQueueRow[]>();
  for (const row of active) {
    const key = row.customer_name!.trim();
    const list = byBuyer.get(key) ?? [];
    list.push(row);
    byBuyer.set(key, list);
  }

  const warnings: GroupOrderWarning[] = [];
  for (const [customerName, list] of byBuyer) {
    if (list.length <= 1) continue;
    const phones = new Set(list.map((row) => row.phone ?? "").filter(Boolean));
    if (phones.size !== 1) continue;
    warnings.push({
      customerName,
      count: list.length,
      phone: [...phones][0],
    });
  }
  return warnings.sort((a, b) => a.customerName.localeCompare(b.customerName));
}

export function matchesTicketSearch(row: TicketQueueRow, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const lower = q.toLowerCase();
  if ((row.holder_name ?? "").toLowerCase().includes(lower)) return true;
  if ((row.customer_name ?? "").toLowerCase().includes(lower)) return true;
  if ((row.email ?? "").toLowerCase().includes(lower)) return true;
  if ((row.ticket_ref ?? "").toLowerCase().includes(lower)) return true;
  return phoneMatchesQuery(row.phone, q);
}

export function filterTickets(
  rows: TicketQueueRow[],
  tab: TicketTab,
  query: string,
): TicketQueueRow[] {
  const conflictPhones = conflictPhoneSet(rows);
  const searched = query.trim() ? rows.filter((row) => matchesTicketSearch(row, query)) : rows;
  const filtered = searched.filter((row) => {
    switch (tab) {
      case "awaiting":
        return isAwaiting(row);
      case "approved":
        return isApproved(row);
      case "rejected":
        return isRejected(row);
      case "conflicts":
        return isConflict(row, conflictPhones);
      case "all":
        return true;
    }
  });
  return [...filtered].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function ticketTabCounts(rows: TicketQueueRow[]): Record<TicketTab, number> {
  const conflictPhones = conflictPhoneSet(rows);
  return {
    awaiting: rows.filter(isAwaiting).length,
    approved: rows.filter(isApproved).length,
    rejected: rows.filter(isRejected).length,
    conflicts: rows.filter((row) => isConflict(row, conflictPhones)).length,
    all: rows.length,
  };
}

export type ConflictGroup = {
  phone: string;
  rows: TicketQueueRow[];
};

export function groupConflicts(rows: TicketQueueRow[]): ConflictGroup[] {
  const conflictPhones = conflictPhoneSet(rows);
  const map = new Map<string, TicketQueueRow[]>();
  for (const row of rows) {
    if (!isConflict(row, conflictPhones) || !row.phone) continue;
    const list = map.get(row.phone) ?? [];
    list.push(row);
    map.set(row.phone, list);
  }
  return [...map.entries()]
    .map(([phone, groupRows]) => ({
      phone,
      rows: [...groupRows].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }))
    .sort((a, b) => a.rows[0].created_at.localeCompare(b.rows[0].created_at));
}
