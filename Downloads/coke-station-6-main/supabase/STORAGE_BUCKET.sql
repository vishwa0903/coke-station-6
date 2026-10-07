-- Public Storage bucket for product photos and the payment QR upload.
-- Confirmed already live on this project; documented here for
-- reproducibility (e.g. setting up a fresh Supabase project). Safe to
-- re-run.
--
-- This is what keeps images out of localStorage/the database entirely:
-- uploadToImageStore() (src/App.tsx) uploads the file here and stores only
-- the resulting lightweight public URL string on the menu item / payment
-- settings — never the image bytes themselves.

insert into storage.buckets (id, name, public)
values ('coke-station-images', 'coke-station-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read coke-station-images" on storage.objects;
create policy "Public read coke-station-images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'coke-station-images');

drop policy if exists "Public upload coke-station-images" on storage.objects;
create policy "Public upload coke-station-images"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'coke-station-images');

drop policy if exists "Public update coke-station-images" on storage.objects;
create policy "Public update coke-station-images"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'coke-station-images');

select 'coke-station-images storage bucket installed successfully' as result;
