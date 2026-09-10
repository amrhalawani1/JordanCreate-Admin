import type { TicketQueueRow } from "@/types/entities";

/** Admin list/detail never includes qr_token. */
export const TICKETS_QUEUE_SELECT =
  "id, guest_id, phone, email, customer_name, holder_name, ticket_ref, ticket_type, status, match_status, approved_at, approved_by, rejected_at, rejected_by, rejection_note, source, created_at, approved";

export const TICKETS_TABLE_SELECT =
  "id, guest_id, phone, email, customer_name, first_name, last_name, holder_name, ticket_ref, ticket_type, status, match_status, approved_at, approved_by, rejected_at, rejected_by, rejection_note, source, created_at";

type PostgrestLikeError = { code?: string; message?: string } | null;

export function isMissingRelation(error: PostgrestLikeError): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return text.includes("schema cache") && text.includes("tickets");
}

export function isMissingRpc(error: PostgrestLikeError): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  return `${error.message ?? ""}`.toLowerCase().includes("could not find the function");
}

export function missingColumnName(error: PostgrestLikeError): string | null {
  if (!error) return null;
  if (error.code !== "42703" && error.code !== "PGRST204") {
    if (!error.message?.toLowerCase().includes("does not exist")) return null;
  }
  const match = error.message?.match(/column (?:[\w.]+\.)?([a-z_][a-z0-9_]*) does not exist/i);
  return match?.[1] ?? null;
}

export function stripSelectColumn(select: string, column: string): string {
  const next = select
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== column)
    .join(", ");
  return next;
}

export function toQueueRow(row: Record<string, unknown>): TicketQueueRow {
  return {
    id: String(row.id),
    guest_id: asNullableString(row.guest_id),
    phone: asNullableString(row.phone),
    email: asNullableString(row.email),
    customer_name: asNullableString(row.customer_name),
    holder_name: asNullableString(row.holder_name),
    ticket_ref: asNullableString(row.ticket_ref),
    ticket_type: asNullableString(row.ticket_type),
    status: asNullableString(row.status) ?? "active",
    match_status: asNullableString(row.match_status),
    approved_at: asNullableString(row.approved_at),
    approved_by: asNullableString(row.approved_by),
    rejected_at: asNullableString(row.rejected_at),
    rejected_by: asNullableString(row.rejected_by),
    rejection_note: asNullableString(row.rejection_note),
    source: asNullableString(row.source),
    created_at: asNullableString(row.created_at) ?? "",
    approved: typeof row.approved === "boolean" ? row.approved : Boolean(row.approved_at),
  };
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

type QueryResult<T> = { data: T | null; error: { code?: string; message?: string } | null };

type LooseQueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

/**
 * Retries a select while stripping unknown columns from the projection.
 * Supabase builders are thenable with dynamic `select(string)` types — keep
 * the runner loose and cast the successful payload to T.
 */
export async function selectOmittingUnknownColumns<T>(
  startSelect: string,
  run: (select: string) => PromiseLike<LooseQueryResult>,
): Promise<QueryResult<T>> {
  let select = startSelect;
  let last: LooseQueryResult = { data: null, error: { message: "No query ran." } };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    last = await run(select);
    if (!last.error) {
      return { data: (last.data as T | null) ?? null, error: null };
    }
    const column = missingColumnName(last.error);
    if (!column) return { data: null, error: last.error };
    const next = stripSelectColumn(select, column);
    if (next === select) return { data: null, error: last.error };
    select = next;
  }
  return { data: null, error: last.error };
}

export function omitUnknownColumn<T extends Record<string, unknown>>(
  payload: T,
  error: PostgrestLikeError,
): T | null {
  const column = missingColumnName(error);
  if (!column || !(column in payload)) return null;
  const next = { ...payload };
  delete next[column];
  return next;
}
