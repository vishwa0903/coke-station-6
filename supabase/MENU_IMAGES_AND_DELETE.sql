-- Adds product description + image support, and a delete function, to the
-- Coke Station shared menu. Run once in Supabase SQL Editor, AFTER
-- MENU_BACKEND.sql. Safe to re-run.

alter table public.coke_station_menu
  add column if not exists description text,
  add column if not exists image_url text;

-- Drop and recreate rather than a plain CREATE OR REPLACE, since we're adding
-- parameters: Postgres would otherwise keep the old 8-arg signature around as
-- a separate overload alongside this new 10-arg one.
drop function if exists public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text);

create or replace function public.owner_upsert_coke_station_menu(
  p_id text,
  p_name text,
  p_category text,
  p_size text,
  p_price numeric,
  p_emoji text,
  p_available boolean,
  p_pin text,
  p_description text default null,
  p_image_url text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin <> 'coke123' then return false; end if;
  if nullif(trim(p_id), '') is null or nullif(trim(p_name), '') is null or p_price < 0 then return false; end if;

  insert into public.coke_station_menu (id, name, category, size, price, emoji, available, description, image_url)
  values (trim(p_id), trim(p_name), trim(p_category), trim(p_size), p_price, coalesce(nullif(trim(p_emoji), ''), '🍽️'), p_available, nullif(trim(coalesce(p_description, '')), ''), nullif(trim(coalesce(p_image_url, '')), ''))
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    size = excluded.size,
    price = excluded.price,
    emoji = excluded.emoji,
    available = excluded.available,
    description = excluded.description,
    image_url = excluded.image_url;

  return true;
end;
$$;

-- Permanently removes a menu item. Past orders keep their own JSON snapshot
-- of item name/price/quantity taken at order time (not a live reference to
-- this table), so deleting a menu row here never touches order history.
create or replace function public.owner_delete_coke_station_menu_item(
  p_id text,
  p_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin <> 'coke123' then return false; end if;
  delete from public.coke_station_menu where id = p_id;
  return true;
end;
$$;

revoke all on function public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text, text, text) from public;
grant execute on function public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text, text, text) to anon, authenticated;

revoke all on function public.owner_delete_coke_station_menu_item(text, text) from public;
grant execute on function public.owner_delete_coke_station_menu_item(text, text) to anon, authenticated;

select 'Menu images/description + delete function installed successfully' as result;
