-- Coke Station shared menu and stock control
-- Run once in Supabase SQL Editor after the orders/profile setup.

create table if not exists public.coke_station_menu (
  id text primary key,
  name text not null,
  category text not null,
  size text not null default 'Regular',
  price numeric(10, 2) not null default 0,
  emoji text not null default '🍽️',
  available boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.coke_station_menu enable row level security;

drop policy if exists "Authenticated students can read the menu" on public.coke_station_menu;
create policy "Authenticated students can read the menu"
on public.coke_station_menu for select
to authenticated
using (true);

grant usage on schema public to authenticated;
grant select on public.coke_station_menu to authenticated;

create or replace function public.coke_station_menu_updated_at()
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

drop trigger if exists coke_station_menu_updated_at on public.coke_station_menu;
create trigger coke_station_menu_updated_at
before update on public.coke_station_menu
for each row execute function public.coke_station_menu_updated_at();

create or replace function public.owner_get_coke_station_menu(p_pin text)
returns setof public.coke_station_menu
language sql
security definer
set search_path = public
as $$
  select m.*
  from public.coke_station_menu as m
  where p_pin = 'coke123'
  order by m.created_at asc, m.name asc;
$$;

create or replace function public.owner_upsert_coke_station_menu(
  p_id text,
  p_name text,
  p_category text,
  p_size text,
  p_price numeric,
  p_emoji text,
  p_available boolean,
  p_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin <> 'coke123' then return false; end if;
  if nullif(trim(p_id), '') is null or nullif(trim(p_name), '') is null or p_price < 0 then return false; end if;

  insert into public.coke_station_menu (id, name, category, size, price, emoji, available)
  values (trim(p_id), trim(p_name), trim(p_category), trim(p_size), p_price, coalesce(nullif(trim(p_emoji), ''), '🍽️'), p_available)
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    size = excluded.size,
    price = excluded.price,
    emoji = excluded.emoji,
    available = excluded.available;

  return true;
end;
$$;

revoke all on function public.owner_get_coke_station_menu(text) from public;
revoke all on function public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text) from public;
grant execute on function public.owner_get_coke_station_menu(text) to anon, authenticated;
grant execute on function public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text) to anon, authenticated;

-- Seed the current menu only when an item does not already exist.
insert into public.coke_station_menu (id, name, category, size, price, emoji, available)
values
  ('maggie', 'Maggie', 'Maggie', 'Regular', 35, '🍜', true),
  ('cheese-maggie', 'Cheese Maggie', 'Maggie', 'Regular', 40, '🧀', false),
  ('chicken-maggie', 'Chicken Maggie', 'Maggie', 'Regular', 45, '🍜', true),
  ('cheese-chicken', 'Cheese Chicken Maggie', 'Maggie', 'Regular', 50, '🍜', true),
  ('bread-omelette', 'Bread Omelette', 'Eggs', 'Regular', 35, '🍳', true),
  ('double-omelette', 'Double Omelette', 'Eggs', 'Regular', 25, '🥚', true),
  ('tea', 'Tea', 'Hot Drinks', 'Cup', 10, '🍵', true),
  ('coffee', 'Coffee', 'Hot Drinks', 'Cup', 10, '☕', true),
  ('sprite', 'Sprite', 'Cold Drinks', '750 ml', 40, '🥤', true),
  ('veg-sandwich', 'Veg Sandwich', 'Sandwiches', 'Regular', 45, '🥪', true),
  ('cheese-sandwich', 'Cheese Sandwich', 'Sandwiches', 'Regular', 45, '🥪', true),
  ('chicken-sandwich', 'Chicken Sandwich', 'Sandwiches', 'Regular', 60, '🥪', true),
  ('veg-roll', 'Veg Roll', 'Sandwiches', 'Regular', 35, '🌯', true),
  ('chicken-roll', 'Chicken Roll', 'Sandwiches', 'Regular', 55, '🌯', true),
  ('black-tea', 'Black Tea', 'Hot Drinks', 'Cup', 15, '🍵', true),
  ('lemon-tea', 'Lemon Tea', 'Hot Drinks', 'Cup', 15, '🍋', true),
  ('cold-coffee', 'Cold Coffee', 'Cold Drinks', 'Glass', 45, '🥤', true),
  ('water', 'Water Bottle', 'Cold Drinks', '1 L', 20, '💧', true),
  ('cookies', 'Chocolate Cookies', 'Snacks', 'Pack', 25, '🍪', true),
  ('brownie', 'Chocolate Brownie', 'Snacks', 'Piece', 40, '🍫', true),
  ('chips', 'Peri Peri Chips', 'Snacks', 'Pack', 30, '🍟', true)
on conflict (id) do nothing;

select 'Coke Station shared menu installed successfully' as result;
