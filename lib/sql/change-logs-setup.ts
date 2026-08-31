export const CHANGE_LOGS_SETUP_SQL = `-- Change log for Admin & Registry V1.
-- Do not touch guest_profiles or conversation_messages.

create table if not exists public.change_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid null references public.admins(id) on delete set null,
  actor_name text not null,
  actor_email text not null,
  action text not null check (action in ('create', 'update', 'delete', 'reorder')),
  table_name text not null,
  record_id text null,
  summary text not null,
  changes jsonb not null default '{}'::jsonb
);

create index if not exists change_logs_created_at_idx on public.change_logs (created_at desc);

alter table public.change_logs enable row level security;

revoke all on table public.change_logs from anon;
revoke all on table public.change_logs from authenticated;
grant all on table public.change_logs to service_role;
`;
