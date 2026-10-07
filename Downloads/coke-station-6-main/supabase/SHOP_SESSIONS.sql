-- Coke Station shared shop session history (one row per Shop Open -> Shop Closed cycle)
-- Run once in Supabase SQL Editor, AFTER SHOP_STATUS.sql.
--
-- This documents backend functions that were already deployed directly to
-- this project's database (not previously committed here). The frontend was
-- built against local-only session tracking and never read this table back,
-- which let per-device history drift out of sync with the real orders list.
-- App.tsx now reads sessions through owner_list_coke_shop_sessions and
-- computes every count live from the real orders, so it can no longer drift.

create table if not exists public.coke_shop_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  owner_history_hidden_at timestamptz
);

create index if not exists coke_shop_sessions_opened_idx on public.coke_shop_sessions(opened_at desc);

-- Only one session may be open (closed_at is null) at a time.
create unique index if not exists coke_shop_sessions_one_open_idx
  on public.coke_shop_sessions ((1))
  where closed_at is null;

alter table public.coke_shop_sessions enable row level security;

drop policy if exists "Anyone can read visible shop sessions" on public.coke_shop_sessions;
create policy "Anyone can read visible shop sessions"
on public.coke_shop_sessions for select
to anon, authenticated
using (owner_history_hidden_at is null);

grant select on public.coke_shop_sessions to anon, authenticated;

-- Upgrade owner_set_shop_status (defined in SHOP_STATUS.sql) so opening/closing
-- the shop also opens/closes the matching session row, atomically.
create or replace function public.owner_set_shop_status(
  p_open boolean,
  p_owner_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_owner_pin <> 'coke123' then
    return false;
  end if;

  insert into public.coke_shop_status (id, is_open, shift_started_at)
  values (1, p_open, case when p_open then timezone('utc', now()) else null end)
  on conflict (id) do update set
    is_open = excluded.is_open,
    shift_started_at = case
      when excluded.is_open then timezone('utc', now())
      else public.coke_shop_status.shift_started_at
    end;

  if p_open then
    if not exists (select 1 from public.coke_shop_sessions where closed_at is null) then
      insert into public.coke_shop_sessions (opened_at) values (timezone('utc', now()));
    end if;
  else
    update public.coke_shop_sessions
    set closed_at = timezone('utc', now())
    where closed_at is null;
  end if;

  return true;
end;
$$;

-- Splits the current open session in two (closes it, opens a fresh one) so
-- the owner's "Scratch" action resets the on-screen counters to zero without
-- actually closing the shop for students.
create or replace function public.owner_scratch_shift(
  p_owner_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_owner_pin <> 'coke123' then
    return false;
  end if;

  update public.coke_shop_sessions
  set closed_at = timezone('utc', now())
  where closed_at is null;

  insert into public.coke_shop_sessions (opened_at) values (timezone('utc', now()));

  update public.coke_shop_status
  set shift_started_at = timezone('utc', now())
  where id = 1;

  return true;
end;
$$;

-- Owner-only read of the full synced session list (excludes hidden sessions).
create or replace function public.owner_list_coke_shop_sessions(p_pin text)
returns setof coke_shop_sessions
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin is distinct from 'coke123' then
    raise exception 'Invalid owner PIN';
  end if;

  return query
    select * from public.coke_shop_sessions
    where owner_history_hidden_at is null
    order by opened_at asc;
end;
$$;

-- Soft-deletes a completed session from the History view (synced across
-- devices) without touching the underlying orders.
create or replace function public.owner_hide_session(p_session_id uuid, p_owner_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_owner_pin <> 'coke123' then
    return false;
  end if;

  update public.coke_shop_sessions
  set owner_history_hidden_at = timezone('utc', now())
  where id = p_session_id and owner_history_hidden_at is null;

  return true;
end;
$$;

revoke all on function public.owner_scratch_shift(text) from public;
grant execute on function public.owner_scratch_shift(text) to anon, authenticated;

revoke all on function public.owner_list_coke_shop_sessions(text) from public;
grant execute on function public.owner_list_coke_shop_sessions(text) to anon, authenticated;

revoke all on function public.owner_hide_session(uuid, text) from public;
grant execute on function public.owner_hide_session(uuid, text) to anon, authenticated;

select 'Coke Station shared shop session history installed successfully' as result;
