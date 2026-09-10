-- Guest PWA access after phone OTP.
-- The auth trigger already creates the guest_profiles row. The app only SELECT/UPDATE
-- that row (never INSERT). Anon stays locked out. Service role / admin is unchanged.

begin;

alter table public.guest_profiles enable row level security;

revoke all on table public.guest_profiles from public;
revoke all on table public.guest_profiles from anon;

drop policy if exists guest_profiles_select_own on public.guest_profiles;
create policy guest_profiles_select_own
  on public.guest_profiles
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists guest_profiles_update_own on public.guest_profiles;
create policy guest_profiles_update_own
  on public.guest_profiles
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

grant select on table public.guest_profiles to authenticated;
grant update (guest_name, stated_interests, role, bio, photo_url) on table public.guest_profiles to authenticated;
grant all on table public.guest_profiles to service_role;

alter table public.guest_social_links enable row level security;

drop policy if exists guest_social_links_select_own on public.guest_social_links;
create policy guest_social_links_select_own
  on public.guest_social_links
  for select
  to authenticated
  using (
    guest_id in (
      select guest_id from public.guest_profiles where auth_user_id = auth.uid()
    )
  );

drop policy if exists guest_social_links_write_own on public.guest_social_links;
create policy guest_social_links_write_own
  on public.guest_social_links
  for all
  to authenticated
  using (
    guest_id in (
      select guest_id from public.guest_profiles where auth_user_id = auth.uid()
    )
  )
  with check (
    guest_id in (
      select guest_id from public.guest_profiles where auth_user_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.guest_social_links to authenticated;
grant all on table public.guest_social_links to service_role;

do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'guest_social_links_id_seq'
  ) then
    execute 'grant usage, select on sequence public.guest_social_links_id_seq to authenticated';
  end if;
end $$;

-- Public programme tables the PWA reads before sign-in.
grant select on table public.event_info to anon, authenticated;
grant select on table public.agenda_sessions to anon, authenticated;
grant select on table public.speakers to anon, authenticated;
grant select on table public.faq_entries to anon, authenticated;
grant select on table public.venue_zones to anon, authenticated;
grant select on table public.interest_tags to anon, authenticated;
grant select on table public.partners to anon, authenticated;
grant select on table public.entertainment to anon, authenticated;
grant select on table public.speaker_social_links to anon, authenticated;

-- GRANT SELECT is not enough if RLS is on without a policy (PostgREST returns []).
do $$
declare
  t text;
begin
  foreach t in array array[
    'event_info',
    'agenda_sessions',
    'speakers',
    'faq_entries',
    'venue_zones',
    'interest_tags',
    'partners',
    'entertainment',
    'speaker_social_links'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_public', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_select_public',
      t
    );
  end loop;
end $$;

-- Tickets stay locked to the table. Guests read their own rows through this RPC.
revoke all on table public.tickets from public;
revoke all on table public.tickets from anon;
revoke all on table public.tickets from authenticated;
grant all on table public.tickets to service_role;

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

-- Pre-OTP guest-list check. Returns true/false only (no ticket rows).
create or replace function public.guest_phone_on_list(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text;
begin
  v_digits := right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 9);
  if v_digits is null or length(v_digits) < 8 then
    return false;
  end if;
  return exists (
    select 1
    from public.tickets t
    where t.phone is not null
      and right(regexp_replace(t.phone, '[^0-9]', '', 'g'), 9) = v_digits
  );
end;
$$;

revoke all on function public.guest_phone_on_list(text) from public;
grant execute on function public.guest_phone_on_list(text) to anon, authenticated;
grant execute on function public.guest_phone_on_list(text) to service_role;

commit;
