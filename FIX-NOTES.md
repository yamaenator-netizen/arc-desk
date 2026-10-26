# FIX-NOTES — RLS hardening (2026-10-26)

Patch for the five holes found in the 2026-10-26 RLS audit. NOT yet applied
to the live project — the boss's word gates the apply.

Files:
- `supabase/migrations/20261026000000_rls_hardening.sql` — the patch.
- `supabase/migrations/rls_hardening_verify.sql` — read-only post-apply checks.

## What each change does

1. **Payment columns (campaigns UPDATE)** — revokes table-level UPDATE on
   `campaigns` from `anon`/`authenticated` and grants it back column-by-column
   to `authenticated` for every column EXCEPT `is_paid`,
   `stripe_checkout_session_id`, `paid_at`. (A bare column-level REVOKE would
   be a no-op: Postgres privileges are additive, and the roles held table-level
   UPDATE.) Authors can still edit their campaigns; only the service-role
   Stripe webhook can mark one paid. Closes the $29 paywall bypass.
2. **profiles SELECT** — drops `"profiles readable by all"` (`using (true)`,
   which included anon) and replaces it with `"profiles readable by owner"`
   (`auth.uid() = id`). Chosen over a public view because the codebase has
   zero cross-user profile reads: the dashboard reads the signed-in user's own
   `name, role` (`app/dashboard/page.tsx`), signup inserts the caller's own
   row (`app/signup/page.tsx`), public author names come from
   `campaigns.author_name`, and the reviews-insert policy only looks up the
   caller's own email (still allowed). Email addresses are no longer dumpable
   with the public anon key.
3. **campaigns SELECT columns** — revokes table-level SELECT from
   `anon`/`authenticated` and grants back the 12 public columns (`id`,
   `author_id`, `title`, `author_name`, `description`, `genre`, `cover_url`,
   `start_date`, `end_date`, `max_readers`, `is_paid`, `created_at`).
   `book_file_url`, `stripe_checkout_session_id`, `paid_at` are no longer
   served to the browser roles. No app code reads those three columns after
   the campaign insert (grep-verified: only `app/lib/types.ts` declares them,
   `app/dashboard/campaigns/new/page.tsx` writes `book_file_url`, the webhook
   writes the payment columns via service role).
4. **signups INSERT** — replaces `with check (true)` with
   `status = 'pending' and downloaded_at is null and (reader_id is null or
   reader_id = auth.uid())`. Exactly matches what
   `app/c/[id]/ReaderSignupForm.tsx` sends; forged `approved` signups via the
   REST API are now rejected by the database.
5. **books bucket SELECT** — replaces `bucket_id = 'books' and
   auth.role() = 'authenticated'` with a policy calling
   `public.book_access_allowed(name)`: a SECURITY DEFINER helper that resolves
   the object name back to its campaign through `campaigns.book_file_url`
   (URLs ending in `/books/<name>`; files are stored as bare `<uuid>.<ext>`,
   no path restructure needed) and answers true only for the campaign's
   author or a reader with an `approved` signup for that campaign (matched by
   `reader_id` or by signup email = caller's profile email, the same
   convention the reviews policy uses). SECURITY DEFINER is required: storage
   policies evaluate as the caller, and change 3 removed the caller's SELECT
   privilege on `book_file_url`, so a plain policy subquery could not read the
   column it checks. The function only ever answers for `auth.uid()`.
6. **reviews** — deliberately unchanged; public review text is social proof.

## Coordinated app change (REQUIRED, same deploy — do not skip)

Column-level SELECT grants make `select("*")` on `campaigns` fail with
`permission denied for table campaigns`. Exactly two call sites use it; both
must switch to the explicit public column list:

- `app/c/[id]/page.tsx` (line 15): `.select("*")` →
  `.select("id, author_id, title, author_name, description, genre, cover_url, start_date, end_date, max_readers, is_paid, created_at")`
- `app/dashboard/page.tsx` (line 30): `.select("*")` → same replacement.

These two edits are safe to deploy BEFORE the migration (the listed columns
exist and are readable under the old schema too) — see apply order. Do not
make them as part of the migration step; they ship with the app deploy.

## What could break

- Any future `select("*")` (or explicit read of the three hidden columns)
  against `campaigns` from browser code will 42501. Rule: name columns.
- Future columns added to `campaigns` will NOT be readable by
  anon/authenticated until a migration grants them (table-level SELECT is
  revoked). Add a `grant select (<col>) on public.campaigns to anon,
  authenticated;` line to any migration that adds a campaigns column.
- Returned campaign objects in the two fixed queries will simply lack
  `book_file_url` / `stripe_checkout_session_id` / `paid_at` keys (the
  `Campaign` type still declares them). No current code reads them there.
- Nothing in the app downloads manuscripts today (no `createSignedUrl` /
  storage download calls exist — grep-verified), so change 5 breaks no live
  flow. When a reader-download feature is built, it must go through the
  authenticated Supabase client; this policy is what will govern it.

## Apply order

1. Deploy the two app `select()` changes above (safe against both schemas).
2. Apply `20261026000000_rls_hardening.sql` (`supabase db push` or SQL editor).
3. Run `rls_hardening_verify.sql`; every expectation must match.
4. Smoke tests:
   - Public campaign page `/c/<id>` loads (title, cover, spots-left, draft vs
     live state correct).
   - Author login → dashboard lists campaigns with correct Live/Draft badges.
   - Reader signup form on a live campaign submits and lands as `pending`.
   - Stripe test checkout for a draft campaign → webhook fires → campaign
     flips to Live (proves service-role payment writes still work).

## Rollback (SQL editor, any time)

```sql
-- 1. payment columns / campaigns update
grant update on public.campaigns to anon, authenticated;

-- 2. profiles select
drop policy if exists "profiles readable by owner" on public.profiles;
create policy "profiles readable by all"
  on public.profiles for select using (true);

-- 3. campaigns select columns
grant select on public.campaigns to anon, authenticated;

-- 4. signups insert
drop policy if exists "signups insertable as pending" on public.signups;
create policy "signups insertable by anyone"
  on public.signups for insert with check (true);

-- 5. books storage select
drop policy if exists "books readable by author or approved reader" on storage.objects;
create policy "books readable by authenticated users"
  on storage.objects for select using (
    bucket_id = 'books' and auth.role() = 'authenticated'
  );
drop function if exists public.book_access_allowed(text);

notify pgrst, 'reload schema';
```

## Local verification (done, 2026-10-26)

Ran the real migration files on a throwaway embedded Postgres 18.4 with a
simulated Supabase environment (roles `anon`/`authenticated`/`service_role`
with BYPASSRLS, `auth.uid()`/`auth.role()` stubs, `storage` schema stub,
Supabase-style default grants). 26/26 checks passed:

- Pre-hardening, all three testable holes reproduced (author flipped
  `is_paid`; anon dumped all 3 seeded profile emails; any signed-in user read
  the books object) — so the simulation was faithful.
- Post-hardening: author UPDATE of `is_paid` / `stripe_checkout_session_id`
  denied (42501) while title UPDATE, dashboard profile read, and
  checkout-style SELECT still work; anon sees 0 profile rows and is denied
  the three hidden columns while public campaign SELECT works; forged
  signups (pre-approved, preset `downloaded_at`, spoofed `reader_id`)
  rejected while the real form flow inserts fine; storage reads: anon 0,
  pending reader 0, approved reader 1, author 1; review insert by an approved
  reader still works (profiles self-read subquery intact); service role can
  still write the payment columns (webhook path).
- The verify file's catalog queries were run against the same simulation and
  returned exactly the documented expectations.

## Still unverified until apply-time

- **Live-project drift:** whether the live Supabase project's policies/grants
  exactly match migrations 1–2 (someone could have edited the dashboard).
  Verify-file query 2 catches this after applying; check it before applying
  too if in doubt.
- **Live default privileges:** the simulation granted the three roles ALL on
  public tables (Supabase's documented default). If the live project was
  customized, query 3–5 in the verify file will show it.
- Real `auth.uid()` is JWT-claims-based (the simulation used the same claim);
  real `storage.objects` has extra columns the policy doesn't reference.
- PostgREST on the live project picking up `notify pgrst, 'reload schema'`
  (standard Supabase behavior; the smoke tests confirm it end-to-end).
