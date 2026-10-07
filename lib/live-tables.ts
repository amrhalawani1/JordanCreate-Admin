/**
 * App-content tables have two names in the database:
 *
 *  - `<name>_live`  — what the admin panel edits and the website reads.
 *  - `<name>`       — what the mobile app reads. Normally a pass-through view
 *                     of `_live`; during an App Store review it is a frozen
 *                     copy taken at submission (`select app_freeze()` /
 *                     `select app_unfreeze()` in the database).
 *
 * The admin panel always talks to the live tables. Logical names (used for
 * types and audit logs) stay as they are; only the physical name changes.
 */
export const APP_CONTENT_TABLES = [
  "speakers",
  "speaker_social_links",
  "agenda_sessions",
  "partners",
  "faq_entries",
  "entertainment",
  "event_info",
] as const;

export type AppContentTable = (typeof APP_CONTENT_TABLES)[number];

const LIVE = new Set<string>(APP_CONTENT_TABLES);

/** Physical table name the admin should read/write for a logical table name. */
export function liveTable<T extends string>(table: T): T {
  return (LIVE.has(table) ? `${table}_live` : table) as T;
}
