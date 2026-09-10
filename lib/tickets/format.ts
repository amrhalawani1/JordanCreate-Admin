import { TICKET_TYPE_LABELS, type TicketQueueRow, type TicketType } from "@/types/entities";

export function ticketTypeLabel(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return TICKET_TYPE_LABELS[value as TicketType] ?? value;
}

export function formatArrival(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const deltaSec = Math.round((then - now) / 1000);
  const abs = Math.abs(deltaSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (abs < 60) return rtf.format(Math.round(deltaSec / 1), "second");
  if (abs < 3600) return rtf.format(Math.round(deltaSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(deltaSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(deltaSec / 86400), "day");
  return rtf.format(Math.round(deltaSec / (86400 * 30)), "month");
}

export function describeTicket(row: TicketQueueRow): string {
  const name = row.holder_name?.trim() || "No attendee name";
  const ref = row.ticket_ref?.trim();
  return ref ? `${name} (${ref})` : name;
}
