-- Coke Station shared student orders
-- Run once in Supabase SQL Editor.
-- Students can insert/read only their own orders.
-- Owner reads/updates all orders through PIN-protected functions.

create extension if not exists pgcrypto;

create table if not exists public.coke_station_orders (
  order_ref text primary key,
  student_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null default '',
  student_phone text not null default '',
  hostel text not null default '',
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null default 0,
  payment_method text not null default 'COD' check (payment_method in ('COD', 'UPI')),
  upi_app text,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid')),
  status text not null default 'New' check (status in ('New', 'Preparing', 'Ready', 'Delivered')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists coke_station_orders_student_idx on public.coke_station_orders(student_id, created_at desc);
create index if not exists coke_station_orders_created_idx on public.coke_station_orders(created_at desc);

-- Keep older installations compatible while allowing the full history status set.
alter table public.coke_station_orders drop constraint if exists coke_station_orders_payment_status_check;
alter table public.coke_station_orders add constraint coke_station_orders_payment_status_check check (payment_status in ('Pending', 'Paid', 'Failed', 'Cancelled'));
alter table public.coke_station_orders drop constraint if exists coke_station_orders_status_check;
alter table public.coke_station_orders add constraint coke_station_orders_status_check check (status in ('New', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'));

alter table public.coke_station_orders enable row level security;

drop policy if exists "Students can insert their own orders" on public.coke_station_orders;
create policy "Students can insert their own orders"
on public.coke_station_orders for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "Students can read their own orders" on public.coke_station_orders;
create policy "Students can read their own orders"
on public.coke_station_orders for select
to authenticated
using (auth.uid() = student_id);

grant usage on schema public to authenticated;
grant insert, select on public.coke_station_orders to authenticated;

create or replace function public.coke_station_orders_updated_at()
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

drop trigger if exists coke_station_orders_updated_at on public.coke_station_orders;
create trigger coke_station_orders_updated_at
before update on public.coke_station_orders
for each row execute function public.coke_station_orders_updated_at();

create or replace function public.owner_get_coke_station_orders(p_pin text)
returns setof public.coke_station_orders
language sql
security definer
set search_path = public
as $$
  select o.*
  from public.coke_station_orders as o
  where p_pin = 'coke123'
  order by o.created_at desc;
$$;

drop function if exists public.owner_update_coke_station_order(text, text, text, text);

create or replace function public.owner_update_coke_station_order(
  p_order_ref text,
  p_status text,
  p_payment_status text,
  p_payment_method text,
  p_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin <> 'coke123' then
    return false;
  end if;
  if p_status not in ('New', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled') then
    return false;
  end if;
  if p_payment_status not in ('Pending', 'Paid', 'Failed', 'Cancelled') then
    return false;
  end if;
  if p_payment_method not in ('COD', 'UPI') then
    return false;
  end if;

  update public.coke_station_orders
     set status = p_status,
         payment_status = p_payment_status,
         payment_method = p_payment_method
   where order_ref = p_order_ref;

  return found;
end;
$$;

revoke all on function public.owner_get_coke_station_orders(text) from public;
revoke all on function public.owner_update_coke_station_order(text, text, text, text, text) from public;
grant execute on function public.owner_get_coke_station_orders(text) to anon, authenticated;
grant execute on function public.owner_update_coke_station_order(text, text, text, text, text) to anon, authenticated;

select 'Coke Station shared orders installed successfully' as result;
