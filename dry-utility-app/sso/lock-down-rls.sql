-- Blueprint — lock the database to signed-in MSA staff.
--
-- RUN THIS LAST. Until it runs, the publishable key in the page source grants full
-- read/write to anyone who views source; after it runs, only a request carrying a
-- Supabase JWT for an @msaconsultinginc.com identity gets through. So the order is:
--   1. Azure app registration            (portal.azure.com)
--   2. Supabase Auth → Azure provider    (Supabase dashboard)
--   3. deploy the app and sign in with Microsoft successfully
--   4. only then: this file
-- Applying it before step 3 works locks everyone out of their own data.
--
-- Paste into the Supabase dashboard → SQL Editor and run.

-- ---------------------------------------------------------------- app_state (all state)
alter table public.app_state enable row level security;

-- Drop the permissive policies this replaces. Names vary by how they were created, so
-- clear whatever is on the table rather than guessing.
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'app_state'
  loop
    execute format('drop policy %I on public.app_state', pol.policyname);
  end loop;
end $$;

-- One predicate, used by every policy: a signed-in MSA identity.
-- The single-tenant Azure registration already keeps other tenants out; this is the
-- second lock, so a provider added to Supabase later cannot quietly widen access.
create or replace function public.is_msa_staff() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%@msaconsultinginc.com', false)
$$;

create policy "MSA staff can read app state"   on public.app_state
  for select to authenticated using (public.is_msa_staff());
create policy "MSA staff can insert app state" on public.app_state
  for insert to authenticated with check (public.is_msa_staff());
create policy "MSA staff can update app state" on public.app_state
  for update to authenticated using (public.is_msa_staff()) with check (public.is_msa_staff());
create policy "MSA staff can delete app state" on public.app_state
  for delete to authenticated using (public.is_msa_staff());

-- ---------------------------------------------------------------- attachments bucket
-- Note the bucket is currently PUBLIC, which means object URLs are readable by anyone
-- holding the link regardless of the policies below. Flip it to private in
-- Storage → attachments → Settings if contracts and notes should not be link-shareable;
-- the app stores only URLs, so that change needs signed URLs and is a follow-up, not a
-- one-liner. These policies govern who can upload and overwrite.
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'storage' and tablename = 'objects'
               and policyname like '%attachment%'
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "MSA staff can read attachments"   on storage.objects
  for select to authenticated using (bucket_id = 'attachments' and public.is_msa_staff());
create policy "MSA staff can upload attachments" on storage.objects
  for insert to authenticated with check (bucket_id = 'attachments' and public.is_msa_staff());
create policy "MSA staff can replace attachments" on storage.objects
  for update to authenticated using (bucket_id = 'attachments' and public.is_msa_staff())
  with check (bucket_id = 'attachments' and public.is_msa_staff());

-- ---------------------------------------------------------------- check it
-- Should list only the policies above, all scoped to `authenticated`:
--   select tablename, policyname, roles, cmd from pg_policies
--   where tablename in ('app_state','objects') order by tablename, policyname;
--
-- And this should now return nothing (it is the anonymous read that used to work):
--   curl 'https://kqjanadbdtyfirureylk.supabase.co/rest/v1/app_state?select=k' \
--     -H 'apikey: <publishable key>'
