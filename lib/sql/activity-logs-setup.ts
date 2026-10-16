export const ACTIVITY_LOGS_SETUP_SQL = `-- Activity log for the admin app: every server action, API route, page view,
-- sign-in attempt, unhandled error and browser error, successful or not.
-- Server-only (service role). Do not touch guest_profiles or conversation_messages.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  kind text not null check (kind in ('action', 'route', 'page', 'auth', 'error', 'client')),
  name text not null,
  ok boolean not null,
  status text not null check (status in ('success', 'failed', 'denied', 'error', 'redirect', 'not_found')),
  error text,
  duration_ms integer,
  actor_id uuid,
  actor_email text,
  actor_level text,
  method text,
  path text,
  http_status integer,
  ip text,
  user_agent text,
  request_id text,
  deployment text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists activity_logs_at_idx on public.activity_logs (at desc);
create index if not exists activity_logs_failed_idx on public.activity_logs (at desc) where not ok;
create index if not exists activity_logs_name_idx on public.activity_logs (name);
create index if not exists activity_logs_actor_idx on public.activity_logs (actor_email);

alter table public.activity_logs enable row level security;
revoke all on table public.activity_logs from anon;
revoke all on table public.activity_logs from authenticated;
grant all on table public.activity_logs to service_role;
`;
