-- Adds a manual-payment-confirmation flag to Coke Station orders.
-- Run once in Supabase SQL Editor, AFTER ORDERS_BACKEND.sql. Safe to re-run.
--
-- No payment gateway/provider is used anywhere in this app. UPI payments are
-- collected by showing a dynamically generated QR (a plain `upi://pay?...`
-- deep link encoded as a QR code, built client-side) with the exact order
-- amount, then manually confirmed by the delivery person/owner tapping
-- "Payment Received" — there is no automatic payment verification. This flag
-- simply records that a human confirmed the payment, for both UPI and COD.

alter table public.coke_station_orders
  add column if not exists payment_confirmed_manually boolean not null default false;

-- Drop and recreate rather than a plain CREATE OR REPLACE, since we're adding
-- a parameter: Postgres would otherwise keep the old 5-arg signature around
-- as a separate overload alongside this new 6-arg one.
drop function if exists public.owner_update_coke_station_order(text, text, text, text, text);

create or replace function public.owner_update_coke_station_order(
  p_order_ref text,
  p_status text,
  p_payment_status text,
  p_payment_method text,
  p_pin text,
  p_payment_confirmed_manually boolean default null
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
         payment_method = p_payment_method,
         -- Leaves the flag untouched when the caller doesn't pass one
         -- (ordinary status-only updates like "Mark as Preparing").
         payment_confirmed_manually = coalesce(p_payment_confirmed_manually, payment_confirmed_manually),
         updated_at = timezone('utc', now())
   where order_ref = p_order_ref;

  return found;
end;
$$;

grant execute on function public.owner_update_coke_station_order(text, text, text, text, text, boolean) to anon, authenticated;

select 'payment_confirmed_manually column + RPC installed successfully' as result;
