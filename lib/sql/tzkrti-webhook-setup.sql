-- Tzkrti webhook: receive approved tickets straight from Tzkrti.
-- Idempotent. Run after tickets-setup (the admin's Tickets page shows that script).

-- Tzkrti sends one row per ticket with the attendee's own name and email.
-- Phone becomes optional (it is not guaranteed per attendee); the E.164 check still applies when present.
alter table public.tickets alter column phone drop not null;

alter table public.tickets add column if not exists order_ref text;
alter table public.tickets add column if not exists customer_name text;
alter table public.tickets add column if not exists customer_email text;
alter table public.tickets add column if not exists customer_phone text;
alter table public.tickets add column if not exists external_updated_at timestamptz;

create index if not exists tickets_order_ref_idx on public.tickets (order_ref);

comment on column public.tickets.order_ref is 'Tzkrti order id; group orders share one.';
comment on column public.tickets.external_updated_at is 'When Tzkrti last changed this ticket; older webhook messages are ignored.';

-- Every delivery Tzkrti makes, kept so nothing is lost and anything can be replayed.
create table if not exists public.tzkrti_webhook_events (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  dedupe_key text not null unique,
  delivery_id text,
  event_type text,
  signature_valid boolean not null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'unmapped', 'ignored', 'rejected', 'failed')),
  error text,
  payload jsonb,
  body_sha256 text not null,
  ticket_refs text[] not null default '{}',
  processed_at timestamptz,
  attempts integer not null default 0
);

create index if not exists tzkrti_webhook_events_received_idx on public.tzkrti_webhook_events (received_at desc);
create index if not exists tzkrti_webhook_events_status_idx on public.tzkrti_webhook_events (status);

comment on table public.tzkrti_webhook_events is
  'Raw Tzkrti webhook deliveries. Server-only: may contain attendee personal data and pass codes.';

alter table public.tzkrti_webhook_events enable row level security;
revoke all on table public.tzkrti_webhook_events from anon;
revoke all on table public.tzkrti_webhook_events from authenticated;
grant all on table public.tzkrti_webhook_events to service_role;
