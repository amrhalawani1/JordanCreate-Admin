export const ARCHIVE_COLUMNS_SETUP_SQL = `-- Hide speakers, agenda sessions, and partners from the app without deleting them.
-- Do not touch guest_profiles or conversation_messages.

alter table public.speakers
  add column if not exists archived boolean not null default false;

alter table public.agenda_sessions
  add column if not exists archived boolean not null default false;

alter table public.partners
  add column if not exists archived boolean not null default false;

comment on column public.speakers.archived is
  'When true, this speaker is hidden from the mobile app.';

comment on column public.agenda_sessions.archived is
  'When true, this session is hidden from the mobile app.';

comment on column public.partners.archived is
  'When true, this partner is hidden from the mobile app.';
`;
