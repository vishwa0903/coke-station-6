-- Coke Station student profile backend
-- Run this once in Supabase SQL Editor.
-- It is safe to run again. Never put a service-role key in the frontend.

create table if not exists public.coke_student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  default_hostel text not null default '',
  room text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.coke_student_profiles enable row level security;

drop policy if exists "Students can read their own profile" on public.coke_student_profiles;
create policy "Students can read their own profile"
on public.coke_student_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Students can create their own profile" on public.coke_student_profiles;
create policy "Students can create their own profile"
on public.coke_student_profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Students can update their own profile" on public.coke_student_profiles;
create policy "Students can update their own profile"
on public.coke_student_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant usage on schema public to authenticated;
grant select, insert, update on public.coke_student_profiles to authenticated;

create or replace function public.coke_student_profile_updated_at()
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

drop trigger if exists coke_student_profile_updated_at on public.coke_student_profiles;
create trigger coke_student_profile_updated_at
before update on public.coke_student_profiles
for each row execute function public.coke_student_profile_updated_at();

-- New signups get a profile row automatically. Existing accounts are repaired
-- by the app on their next login using an upsert.
create or replace function public.coke_create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.coke_student_profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.phone, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists coke_student_profile_on_signup on auth.users;
create trigger coke_student_profile_on_signup
after insert on auth.users
for each row execute function public.coke_create_student_profile();

-- Forgot-password verification: returns only true/false, never profile data.
create or replace function public.coke_verify_student_identity(
  p_phone text,
  p_full_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users as u
    left join public.coke_student_profiles as p on p.id = u.id
    where right(regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g'), 10)
            = right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10)
      and lower(trim(coalesce(
        nullif(trim(p.full_name), ''),
        nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'student_name'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'fullName'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'studentName'), ''),
        ''
      ))) = lower(trim(p_full_name))
  );
$$;

revoke all on function public.coke_verify_student_identity(text, text) from public;
grant execute on function public.coke_verify_student_identity(text, text) to anon, authenticated;

-- Password reset without OTP. This intentionally relies on name + phone only.
create extension if not exists pgcrypto;

create or replace function public.coke_reset_student_password(
  p_phone text,
  p_full_name text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  target_user_id uuid;
begin
  if length(trim(coalesce(p_new_password, ''))) < 6 then
    return false;
  end if;

  select u.id
    into target_user_id
  from auth.users as u
  left join public.coke_student_profiles as p on p.id = u.id
  where right(regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g'), 10)
          = right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10)
    and lower(trim(coalesce(
      nullif(trim(p.full_name), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'student_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'fullName'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'studentName'), ''),
      ''
    ))) = lower(trim(p_full_name))
  limit 1;

  if target_user_id is null then
    return false;
  end if;

  update auth.users
     set encrypted_password = crypt(p_new_password, gen_salt('bf')),
         updated_at = timezone('utc', now())
   where id = target_user_id;

  return found;
end;
$$;

revoke all on function public.coke_reset_student_password(text, text, text) from public;
grant execute on function public.coke_reset_student_password(text, text, text) to anon, authenticated;

select 'Coke Station student profiles and forgot-password without OTP installed successfully' as result;
