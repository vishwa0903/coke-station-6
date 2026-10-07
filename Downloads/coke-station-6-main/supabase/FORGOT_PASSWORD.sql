-- Coke Station forgot-password without OTP
-- Run this in Supabase SQL Editor after PROFILE_BACKEND.sql.
-- This flow verifies the registered name + phone and then lets the student
-- choose a new password. Name + phone is less secure than OTP; enable this
-- only if that trade-off is intentional for this private campus app.

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

select 'Coke Station forgot-password without OTP installed successfully' as result;
