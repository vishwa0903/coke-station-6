-- Adds a brand column to the Coke Station shared menu (Category -> Brand ->
-- Product structure). Run once in Supabase SQL Editor, AFTER
-- MENU_IMAGES_AND_DELETE.sql. Safe to re-run.

alter table public.coke_station_menu
  add column if not exists brand text;

-- Drop and recreate rather than a plain CREATE OR REPLACE, since we're adding
-- a parameter: Postgres would otherwise keep the old 10-arg signature around
-- as a separate overload alongside this new 11-arg one.
drop function if exists public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text, text, text);

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
  p_image_url text default null,
  p_brand text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin <> 'coke123' then return false; end if;
  if nullif(trim(p_id), '') is null or nullif(trim(p_name), '') is null or p_price < 0 then return false; end if;

  insert into public.coke_station_menu (id, name, category, size, price, emoji, available, description, image_url, brand)
  values (trim(p_id), trim(p_name), trim(p_category), trim(p_size), p_price, coalesce(nullif(trim(p_emoji), ''), '🍽️'), p_available, nullif(trim(coalesce(p_description, '')), ''), nullif(trim(coalesce(p_image_url, '')), ''), nullif(trim(coalesce(p_brand, '')), ''))
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    size = excluded.size,
    price = excluded.price,
    emoji = excluded.emoji,
    available = excluded.available,
    description = excluded.description,
    image_url = excluded.image_url,
    brand = excluded.brand;

  return true;
end;
$$;

revoke all on function public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text, text, text, text) from public;
grant execute on function public.owner_upsert_coke_station_menu(text, text, text, text, numeric, text, boolean, text, text, text, text) to anon, authenticated;

select 'Menu brand column installed successfully' as result;
