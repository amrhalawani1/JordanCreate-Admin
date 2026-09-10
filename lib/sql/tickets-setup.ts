export const TICKETS_SETUP_SQL = `-- Tickets approval queue for Admin & Registry V1.
-- Idempotent: safe to run on an existing public.tickets table the mobile app already reads.
-- Do not touch guest_profiles or conversation_messages.
-- qr_token is the gate credential. Never grant it to anon or authenticated.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid null,
  phone text,
  email text,
  customer_name text,
  holder_name text,
  ticket_ref text unique,
  ticket_type text,
  qr_token text,
  status text not null default 'active',
  match_status text,
  approved_at timestamptz,
  approved_by uuid null references public.admins(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid null references public.admins(id) on delete set null,
  rejection_note text,
  source text,
  created_at timestamptz not null default now()
);

alter table public.tickets add column if not exists guest_id uuid;
alter table public.tickets add column if not exists phone text;
alter table public.tickets add column if not exists email text;
alter table public.tickets add column if not exists customer_name text;
alter table public.tickets add column if not exists holder_name text;
alter table public.tickets add column if not exists ticket_ref text;
alter table public.tickets add column if not exists ticket_type text;
alter table public.tickets add column if not exists qr_token text;
alter table public.tickets add column if not exists status text;
alter table public.tickets add column if not exists match_status text;
alter table public.tickets add column if not exists approved_at timestamptz;
alter table public.tickets add column if not exists approved_by uuid;
alter table public.tickets add column if not exists rejected_at timestamptz;
alter table public.tickets add column if not exists rejected_by uuid;
alter table public.tickets add column if not exists rejection_note text;
alter table public.tickets add column if not exists source text;
alter table public.tickets add column if not exists created_at timestamptz;

update public.tickets set status = 'active' where status is null;
update public.tickets set created_at = now() where created_at is null;

alter table public.tickets alter column status set default 'active';
alter table public.tickets alter column created_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tickets_approved_by_fkey'
  ) then
    alter table public.tickets
      add constraint tickets_approved_by_fkey
      foreign key (approved_by) references public.admins(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'tickets_rejected_by_fkey'
  ) then
    alter table public.tickets
      add constraint tickets_rejected_by_fkey
      foreign key (rejected_by) references public.admins(id) on delete set null;
  end if;
end $$;

create unique index if not exists tickets_ticket_ref_key on public.tickets (ticket_ref);
create index if not exists tickets_created_at_idx on public.tickets (created_at);
create index if not exists tickets_phone_idx on public.tickets (phone);
create index if not exists tickets_status_idx on public.tickets (status);

comment on column public.tickets.qr_token is
  'Gate credential. Never select this column in the admin client or export it.';
comment on column public.tickets.customer_name is 'The buyer. Differs from holder_name on group orders.';
comment on column public.tickets.holder_name is 'The attendee.';

alter table public.tickets enable row level security;

revoke all on table public.tickets from anon;
revoke all on table public.tickets from authenticated;
grant all on table public.tickets to service_role;

-- Admin list/detail never sees qr_token. approved is the only credential state exposed.
create or replace view public.tickets_queue as
select
  id,
  guest_id,
  phone,
  email,
  customer_name,
  holder_name,
  ticket_ref,
  ticket_type,
  status,
  match_status,
  approved_at,
  approved_by,
  rejected_at,
  rejected_by,
  rejection_note,
  source,
  created_at,
  (qr_token is not null and btrim(qr_token) <> '') as approved
from public.tickets;

revoke all on table public.tickets_queue from anon;
revoke all on table public.tickets_queue from authenticated;
grant select on table public.tickets_queue to service_role;

create or replace function public.tickets_protect_manual()
returns trigger
language plpgsql
as $$
begin
  -- Webhook (or any other source) must not silently take over a manual row.
  -- Unique ticket_ref already blocks a second insert; this blocks an in-place overwrite.
  if old.source is not distinct from 'manual' and new.source is distinct from old.source then
    raise exception 'TICKET_SOURCE_COLLISION: manual ticket % cannot be overwritten by source %',
      coalesce(old.ticket_ref, old.id::text),
      coalesce(new.source, 'null')
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_protect_manual on public.tickets;
create trigger tickets_protect_manual
  before update on public.tickets
  for each row
  execute procedure public.tickets_protect_manual();

create or replace function public._tickets_write_log(
  p_actor_id uuid,
  p_actor_name text,
  p_actor_email text,
  p_action text,
  p_record_id text,
  p_summary text,
  p_changes jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.change_logs (
    actor_id, actor_name, actor_email, action, table_name, record_id, summary, changes
  ) values (
    p_actor_id,
    coalesce(nullif(btrim(p_actor_name), ''), p_actor_email),
    p_actor_email,
    p_action,
    'tickets',
    p_record_id,
    p_summary,
    coalesce(p_changes, '{}'::jsonb)
  );
end;
$$;

create or replace function public.approve_tickets(
  p_actor_id uuid,
  p_ids uuid[],
  p_token_overrides jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.admins%rowtype;
  v_actor_name text;
  v_id uuid;
  v_ticket public.tickets%rowtype;
  v_token text;
  v_succeeded uuid[] := '{}';
  v_failed jsonb := '[]'::jsonb;
begin
  select * into v_actor from public.admins where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'NO_ADMIN' using errcode = '42501';
  end if;
  if v_actor.admin_level not in ('super_admin', 'admin', 'guest_manager') then
    raise exception 'NO_PERMISSION' using errcode = '42501';
  end if;
  v_actor_name := btrim(concat_ws(' ', v_actor.first_name, v_actor.last_name));

  perform set_config('jordan_create.ticket_write', 'admin', true);

  foreach v_id in array coalesce(p_ids, '{}') loop
    begin
      select * into v_ticket from public.tickets where id = v_id for update;
      if not found then
        v_failed := v_failed || jsonb_build_array(jsonb_build_object('id', v_id, 'error', 'Ticket not found.'));
        continue;
      end if;
      if v_ticket.status is distinct from 'active' then
        v_failed := v_failed || jsonb_build_array(jsonb_build_object('id', v_id, 'error', 'Only active tickets can be approved.'));
        continue;
      end if;
      if v_ticket.rejected_at is not null then
        v_failed := v_failed || jsonb_build_array(jsonb_build_object('id', v_id, 'error', 'Restore this ticket before approving.'));
        continue;
      end if;
      if v_ticket.qr_token is not null and btrim(v_ticket.qr_token) <> '' then
        v_failed := v_failed || jsonb_build_array(jsonb_build_object('id', v_id, 'error', 'Already approved.'));
        continue;
      end if;

      v_token := nullif(btrim(coalesce(p_token_overrides ->> v_id::text, '')), '');
      if v_token is null then
        v_token := gen_random_uuid()::text;
      end if;

      update public.tickets
      set qr_token = v_token,
          approved_at = now(),
          approved_by = p_actor_id
      where id = v_id;

      perform public._tickets_write_log(
        v_actor.id,
        v_actor_name,
        v_actor.email,
        'update',
        v_id::text,
        format('Approved ticket %s', coalesce(v_ticket.ticket_ref, v_id::text)),
        jsonb_build_object('approved', jsonb_build_object('from', false, 'to', true))
      );

      v_succeeded := array_append(v_succeeded, v_id);
    exception when others then
      v_failed := v_failed || jsonb_build_array(jsonb_build_object('id', v_id, 'error', sqlerrm));
    end;
  end loop;

  return jsonb_build_object(
    'succeeded', to_jsonb(v_succeeded),
    'failed', v_failed
  );
end;
$$;

create or replace function public.reject_ticket(
  p_actor_id uuid,
  p_id uuid,
  p_note text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.admins%rowtype;
  v_actor_name text;
  v_ticket public.tickets%rowtype;
  v_note text;
begin
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is null then
    raise exception 'A rejection note is required.' using errcode = '22023';
  end if;

  select * into v_actor from public.admins where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'NO_ADMIN' using errcode = '42501';
  end if;
  if v_actor.admin_level not in ('super_admin', 'admin', 'guest_manager') then
    raise exception 'NO_PERMISSION' using errcode = '42501';
  end if;
  v_actor_name := btrim(concat_ws(' ', v_actor.first_name, v_actor.last_name));

  perform set_config('jordan_create.ticket_write', 'admin', true);

  select * into v_ticket from public.tickets where id = p_id for update;
  if not found then
    raise exception 'Ticket not found.' using errcode = 'P0002';
  end if;
  if v_ticket.status is distinct from 'active' then
    raise exception 'Only active tickets can be rejected.' using errcode = '22023';
  end if;
  if v_ticket.qr_token is not null and btrim(v_ticket.qr_token) <> '' then
    raise exception 'Approved tickets cannot be rejected. Void them instead.' using errcode = '22023';
  end if;
  if v_ticket.rejected_at is not null then
    raise exception 'This ticket is already rejected.' using errcode = '22023';
  end if;

  update public.tickets
  set rejected_at = now(),
      rejected_by = p_actor_id,
      rejection_note = v_note
  where id = p_id;

  perform public._tickets_write_log(
    v_actor.id,
    v_actor_name,
    v_actor.email,
    'update',
    p_id::text,
    format('Rejected ticket %s', coalesce(v_ticket.ticket_ref, p_id::text)),
    jsonb_build_object(
      'rejected', jsonb_build_object('from', false, 'to', true),
      'rejection_note', jsonb_build_object('from', null, 'to', v_note)
    )
  );
end;
$$;

create or replace function public.restore_ticket(
  p_actor_id uuid,
  p_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.admins%rowtype;
  v_actor_name text;
  v_ticket public.tickets%rowtype;
begin
  select * into v_actor from public.admins where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'NO_ADMIN' using errcode = '42501';
  end if;
  if v_actor.admin_level not in ('super_admin', 'admin', 'guest_manager') then
    raise exception 'NO_PERMISSION' using errcode = '42501';
  end if;
  v_actor_name := btrim(concat_ws(' ', v_actor.first_name, v_actor.last_name));

  perform set_config('jordan_create.ticket_write', 'admin', true);

  select * into v_ticket from public.tickets where id = p_id for update;
  if not found then
    raise exception 'Ticket not found.' using errcode = 'P0002';
  end if;
  if v_ticket.rejected_at is null then
    raise exception 'This ticket is not rejected.' using errcode = '22023';
  end if;

  update public.tickets
  set rejected_at = null,
      rejected_by = null,
      rejection_note = null
  where id = p_id;

  perform public._tickets_write_log(
    v_actor.id,
    v_actor_name,
    v_actor.email,
    'update',
    p_id::text,
    format('Returned ticket %s to the queue', coalesce(v_ticket.ticket_ref, p_id::text)),
    jsonb_build_object('rejected', jsonb_build_object('from', true, 'to', false))
  );
end;
$$;

create or replace function public.void_ticket(
  p_actor_id uuid,
  p_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.admins%rowtype;
  v_actor_name text;
  v_ticket public.tickets%rowtype;
begin
  select * into v_actor from public.admins where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'NO_ADMIN' using errcode = '42501';
  end if;
  if v_actor.admin_level not in ('super_admin', 'admin') then
    raise exception 'NO_PERMISSION' using errcode = '42501';
  end if;
  v_actor_name := btrim(concat_ws(' ', v_actor.first_name, v_actor.last_name));

  perform set_config('jordan_create.ticket_write', 'admin', true);

  select * into v_ticket from public.tickets where id = p_id for update;
  if not found then
    raise exception 'Ticket not found.' using errcode = 'P0002';
  end if;
  if v_ticket.status is not distinct from 'void' then
    raise exception 'This ticket is already void.' using errcode = '22023';
  end if;

  update public.tickets
  set status = 'void'
  where id = p_id;

  perform public._tickets_write_log(
    v_actor.id,
    v_actor_name,
    v_actor.email,
    'update',
    p_id::text,
    format('Voided ticket %s', coalesce(v_ticket.ticket_ref, p_id::text)),
    jsonb_build_object('status', jsonb_build_object('from', v_ticket.status, 'to', 'void'))
  );
end;
$$;

create or replace function public.delete_ticket(
  p_actor_id uuid,
  p_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.admins%rowtype;
  v_actor_name text;
  v_ticket public.tickets%rowtype;
begin
  select * into v_actor from public.admins where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'NO_ADMIN' using errcode = '42501';
  end if;
  if v_actor.admin_level not in ('super_admin', 'admin') then
    raise exception 'NO_PERMISSION' using errcode = '42501';
  end if;
  v_actor_name := btrim(concat_ws(' ', v_actor.first_name, v_actor.last_name));

  perform set_config('jordan_create.ticket_write', 'admin', true);

  select * into v_ticket from public.tickets where id = p_id for update;
  if not found then
    raise exception 'Ticket not found.' using errcode = 'P0002';
  end if;

  delete from public.tickets where id = p_id;

  perform public._tickets_write_log(
    v_actor.id,
    v_actor_name,
    v_actor.email,
    'delete',
    p_id::text,
    format('Deleted ticket %s', coalesce(v_ticket.ticket_ref, p_id::text)),
    jsonb_build_object(
      'deleted',
      jsonb_build_object(
        'ticket_ref', v_ticket.ticket_ref,
        'holder_name', v_ticket.holder_name,
        'phone', v_ticket.phone,
        'source', v_ticket.source
      )
    )
  );
end;
$$;

revoke all on function public._tickets_write_log(uuid, text, text, text, text, text, jsonb) from public;
revoke all on function public.approve_tickets(uuid, uuid[], jsonb) from public;
revoke all on function public.reject_ticket(uuid, uuid, text) from public;
revoke all on function public.restore_ticket(uuid, uuid) from public;
revoke all on function public.void_ticket(uuid, uuid) from public;
revoke all on function public.delete_ticket(uuid, uuid) from public;

create or replace function public.guest_own_tickets()
returns table (
  id uuid,
  holder_name text,
  email text,
  phone text,
  ticket_type text,
  qr_token text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  v_phone := nullif(btrim(coalesce(auth.jwt() ->> 'phone', '')), '');
  if v_phone is null then
    return;
  end if;

  return query
  select
    t.id,
    t.holder_name,
    t.email,
    t.phone,
    t.ticket_type,
    t.qr_token,
    t.status
  from public.tickets t
  where t.phone is not null
    and right(regexp_replace(t.phone, '[^0-9]', '', 'g'), 9)
      = right(regexp_replace(v_phone, '[^0-9]', '', 'g'), 9);
end;
$$;

revoke all on function public.guest_own_tickets() from public;
grant execute on function public.guest_own_tickets() to authenticated;
grant execute on function public.guest_own_tickets() to service_role;

grant execute on function public._tickets_write_log(uuid, text, text, text, text, text, jsonb) to service_role;
grant execute on function public.approve_tickets(uuid, uuid[], jsonb) to service_role;
grant execute on function public.reject_ticket(uuid, uuid, text) to service_role;
grant execute on function public.restore_ticket(uuid, uuid) to service_role;
grant execute on function public.void_ticket(uuid, uuid) to service_role;
grant execute on function public.delete_ticket(uuid, uuid) to service_role;
`;
