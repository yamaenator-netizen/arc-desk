-- ARC Desk RLS hardening
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.
--
-- Closes the holes found in the 2026-10-26 RLS audit (see FIX-NOTES.md):
--   1. Authors could set campaigns.is_paid themselves (paywall bypass).
--   2. profiles (including email) were readable by anyone, incl. anon.
--   3. campaigns.book_file_url / stripe_checkout_session_id / paid_at were
--      readable by anyone through the public campaigns select.
--   4. signups could be inserted pre-approved via direct API calls.
--   5. Any signed-in user could download any manuscript in the books bucket.
--
-- COORDINATED APP CHANGE (section 3 only): column-level select grants make
-- select("*") on campaigns fail. The two select("*") call sites listed in
-- FIX-NOTES.md must switch to the explicit column list in the same deploy.
-- Sections 1, 2, 4 and 5 are transparent to the current app code.

-- ---------------------------------------------------------------------------
-- 1. campaigns: payment columns are writable by the service role only.
-- Postgres column privileges are additive with table privileges, so a
-- column-level revoke would be a no-op while authenticated holds
-- table-level update. Revoke the table privilege and grant update back on
-- every column except is_paid / stripe_checkout_session_id / paid_at.
-- service_role is deliberately untouched: the Stripe webhook writes the
-- payment columns through it (app/api/stripe/webhook/route.ts).
-- ---------------------------------------------------------------------------
revoke update on table public.campaigns from anon, authenticated;
grant update (
  id, author_id, title, author_name, description, genre, cover_url,
  book_file_url, start_date, end_date, max_readers, created_at
) on public.campaigns to authenticated;

-- ---------------------------------------------------------------------------
-- 2. profiles: users read their own row only.
-- App evidence: the only profile reads in the codebase are the dashboard
-- reading the signed-in user's own name/role (app/dashboard/page.tsx) and
-- the signup insert of the caller's own row (app/signup/page.tsx). Public
-- author names come from campaigns.author_name, never from profiles, so no
-- public view of profiles is needed. The reviews insert policy looks up the
-- caller's own email, which this policy still allows.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles readable by all" on public.profiles;
create policy "profiles readable by owner"
  on public.profiles for select using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3. campaigns: stop serving book_file_url, stripe_checkout_session_id and
-- paid_at to anon/authenticated (same revoke + grant-back pattern as
-- section 1). is_paid stays readable: the public campaign page and the
-- checkout route branch on it. No app code reads the three hidden columns
-- after the campaign insert. service_role keeps full access.
-- ---------------------------------------------------------------------------
revoke select on table public.campaigns from anon, authenticated;
grant select (
  id, author_id, title, author_name, description, genre, cover_url,
  start_date, end_date, max_readers, is_paid, created_at
) on public.campaigns to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. signups: direct API inserts must land as fresh pending requests.
-- status is forced to 'pending', downloaded_at must be null, and reader_id
-- is either null (anonymous reader) or the caller's own id. This matches
-- exactly what app/c/[id]/ReaderSignupForm.tsx sends.
-- ---------------------------------------------------------------------------
drop policy if exists "signups insertable by anyone" on public.signups;
create policy "signups insertable as pending"
  on public.signups for insert with check (
    status = 'pending'
    and downloaded_at is null
    and (reader_id is null or reader_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 5. books bucket: only the campaign's author or an approved reader of that
-- campaign may read a manuscript.
-- Manuscripts are stored as bare "<uuid>.<ext>" object names; the only link
-- back to a campaign is campaigns.book_file_url, a URL ending in
-- "/books/<name>". The helper resolves that link. It is security definer on
-- purpose: storage policies are evaluated as the caller, and section 3
-- removed the caller's select privilege on book_file_url, so a policy
-- subquery could not read the column it needs to check. The function only
-- ever answers for auth.uid(), so callers learn nothing about other users'
-- files beyond their own yes/no.
-- ---------------------------------------------------------------------------
create or replace function public.book_access_allowed(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    where c.book_file_url is not null
      and right(c.book_file_url, length(object_name)) = object_name
      and position('/books/' in c.book_file_url) > 0
      and (
        c.author_id = auth.uid()
        or exists (
          select 1
          from public.signups s
          where s.campaign_id = c.id
            and s.status = 'approved'
            and (
              s.reader_id = auth.uid()
              or s.email = (
                select email from public.profiles where id = auth.uid()
              )
            )
        )
      )
  );
$$;

drop policy if exists "books readable by authenticated users" on storage.objects;
create policy "books readable by author or approved reader"
  on storage.objects for select using (
    bucket_id = 'books' and public.book_access_allowed(name)
  );

-- ---------------------------------------------------------------------------
-- 6. reviews: intentionally unchanged. "reviews readable by all" stays —
-- review text on public campaign pages is social proof. Revisit if review
-- content ever becomes private.
-- ---------------------------------------------------------------------------

-- Let PostgREST pick up the new policies and grants without a restart.
notify pgrst, 'reload schema';
