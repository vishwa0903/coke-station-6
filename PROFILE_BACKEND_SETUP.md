# Coke Station profile backend

The student profile now uses the phone number from the authenticated Supabase user instead of a hardcoded number.

## One-time setup

1. Copy `.env.example` to `.env`.
2. In Supabase, open **Project Settings → API** and copy the public **anon** key into:

```env
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Do not use a service-role key in frontend code.

3. In Supabase SQL Editor, run `supabase/PROFILE_BACKEND.sql`. This also installs the private name + phone verification and password-reset functions used by Forgot Password.
4. If you already ran the profile migration, run `supabase/FORGOT_PASSWORD.sql` separately.
5. In **Authentication → Providers → Phone**:
   - Enable Phone signups.
   - Phone confirmations may remain disabled because this app does not use OTP for login or password reset.
6. Run `supabase/SHOP_STATUS.sql` in Supabase SQL Editor so Shop Open / Shop Closed is shared between owner and student devices.
7. Run `supabase/ONLINE_PAYMENT_UPDATE.sql` in Supabase SQL Editor so the owner's UPI ID and QR changes are saved and shared.
8. Run `supabase/ORDERS_BACKEND.sql` in Supabase SQL Editor so student orders are shared with the owner across phones and laptops.
9. Restart the dev server after changing `.env`.

## Password reset note

Forgot Password verifies the registered student name and phone number, then updates the password without sending an OTP. This is convenient for a private campus app, but it is less secure than phone OTP: anyone who knows both values could reset the account. Use OTP instead for a public deployment.

The app uses this project URL by default:

```text
https://mhzowfiofnpbsysfnvpf.supabase.co
```

## What is fixed

- Login and registration use Supabase Phone + Password Auth.
- Supabase persists the session between reloads.
- Profile displays `auth.users.phone` first, so an old/stale profile row cannot show a different phone number.
- Existing accounts are automatically repaired into `coke_student_profiles` after login.
- Profile name, hostel, and room are saved to the authenticated student's own row.
- Row Level Security allows each student to read and update only their own profile.

Until the anon key is configured, the reference UI stays available in demo mode and shows a small connection message after login.
