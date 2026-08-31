import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];

/**
 * Thin, generic wrappers around the four operations every table needs.
 * Table-specific validation and error formatting happen one layer up, in
 * actions/<table>.ts — these just talk to Postgres.
 */

export async function fetchAll<Row>(
  supabase: SupabaseClient<Database>,
  table: TableName,
  orderBy?: { column: string; ascending?: boolean },
): Promise<Row[]> {
  let query = supabase.from(table).select("*");
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Row[];
}

export async function fetchByPk<Row>(
  supabase: SupabaseClient<Database>,
  table: TableName,
  pk: { column: string; value: string | number },
): Promise<Row | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .select("*")
    .eq(pk.column, pk.value)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Row | null;
}

export async function insertRow<Row, Insert>(
  supabase: SupabaseClient<Database>,
  table: TableName,
  values: Insert,
): Promise<Row> {
  const { data, error } = await supabase
    .from(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(values as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as Row;
}

export async function updateRow<Row, Update>(
  supabase: SupabaseClient<Database>,
  table: TableName,
  pk: { column: string; value: string | number },
  values: Update,
): Promise<Row> {
  // Supabase-js can't resolve a concrete Update type when `table` is a
  // runtime variable rather than a literal, so this call is intentionally
  // untyped here — callers get real safety from the per-table zod schema.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .update(values)
    .eq(pk.column, pk.value)
    .select("*")
    .single();
  if (error) throw error;
  return data as Row;
}

export async function deleteRow(
  supabase: SupabaseClient<Database>,
  table: TableName,
  pk: { column: string; value: string | number },
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq(pk.column, pk.value);
  if (error) throw error;
}
