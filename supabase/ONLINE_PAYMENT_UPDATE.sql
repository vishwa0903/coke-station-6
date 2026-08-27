-- Coke Station owner online payment settings
-- Run this once in Supabase SQL Editor.
-- The QR image is stored as a data URL so the reference app can preview it.

create table if not exists public.coke_shop_payment_settings (
  id integer primary key check (id = 1),
  upi_id text not null default '7598981132@fam',
  qr_code text,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.coke_shop_payment_settings (id, upi_id)
values (1, '7598981132@fam')
on conflict (id) do nothing;

alter table public.coke_shop_payment_settings enable row level security;
grant usage on schema public to anon, authenticated;

create or replace function public.coke_shop_payment_settings_updated_at()
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

drop trigger if exists coke_shop_payment_settings_updated_at on public.coke_shop_payment_settings;
create trigger coke_shop_payment_settings_updated_at
before update on public.coke_shop_payment_settings
for each row execute function public.coke_shop_payment_settings_updated_at();

-- Existing installations may have used the parameter name p_pin.
-- Drop the old signatures first so Postgres allows the parameter names below.
drop function if exists public.owner_get_shop_payment_settings(text);
drop function if exists public.owner_update_shop_payment_settings(text, text, text);

create or replace function public.owner_get_shop_payment_settings(p_owner_pin text)
returns table (upi_id text, qr_code text)
language sql
security definer
set search_path = public
as $$
  select s.upi_id, s.qr_code
  from public.coke_shop_payment_settings as s
  where s.id = 1
    and p_owner_pin = 'coke123';
$$;

create or replace function public.owner_update_shop_payment_settings(
  p_upi_id text,
  p_qr_code text,
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
  if p_upi_id is null or position('@' in trim(p_upi_id)) < 2 then
    return false;
  end if;

  insert into public.coke_shop_payment_settings (id, upi_id, qr_code)
  values (1, trim(p_upi_id), p_qr_code)
  on conflict (id) do update set upi_id = excluded.upi_id, qr_code = excluded.qr_code;

  return true;
end;
$$;

revoke all on function public.owner_get_shop_payment_settings(text) from public;
revoke all on function public.owner_update_shop_payment_settings(text, text, text) from public;
grant execute on function public.owner_get_shop_payment_settings(text) to anon, authenticated;
grant execute on function public.owner_update_shop_payment_settings(text, text, text) to anon, authenticated;

-- Students can read only the current UPI ID. The QR code remains owner/delivery-only.
create or replace function public.get_student_upi_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.upi_id
  from public.coke_shop_payment_settings as s
  where s.id = 1;
$$;

revoke all on function public.get_student_upi_id() from public;
grant execute on function public.get_student_upi_id() to anon, authenticated;

select 'Coke Station online payment settings installed successfully' as result;
