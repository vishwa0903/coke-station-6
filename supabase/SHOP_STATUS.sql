-- Coke Station shared Shop Open / Shop Closed status
-- Run once in Supabase SQL Editor.

create table if not exists public.coke_shop_status (
  id integer primary key check (id = 1),
  is_open boolean not null default false,
  shift_started_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.coke_shop_status add column if not exists shift_started_at timestamptz;

insert into public.coke_shop_status (id, is_open)
values (1, false)
on conflict (id) do nothing;

alter table public.coke_shop_status enable row level security;

drop policy if exists "Anyone can read shop status" on public.coke_shop_status;
create policy "Anyone can read shop status"
on public.coke_shop_status for select
to anon, authenticated
using (true);

grant select on public.coke_shop_status to anon, authenticated;

create or replace function public.coke_shop_status_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists coke_shop_status_updated_at on public.coke_shop_status;
create trigger coke_shop_status_updated_at
before update on public.coke_shop_status
for each row execute function public.coke_shop_status_updated_at();

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

  return true;
end;
$$;

revoke all on function public.owner_set_shop_status(boolean, text) from public;
grant execute on function public.owner_set_shop_status(boolean, text) to anon, authenticated;

select 'Coke Station shared shop status installed successfully' as result;
