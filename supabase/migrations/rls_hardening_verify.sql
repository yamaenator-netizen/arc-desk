-- ARC Desk RLS hardening — post-apply verification (READ-ONLY)
-- Run in the Supabase SQL editor AFTER 20261026000000_rls_hardening.sql.
-- Every query lists its expected result. Anything else = stop and roll back
-- (rollback SQL is in FIX-NOTES.md).

-- 1. RLS is enabled on all four public tables.
--    Expect: 4 rows, relrowsecurity = true for profiles, campaigns,
--    signups, reviews.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in ('profiles', 'campaigns', 'signups', 'reviews')
order by relname;

-- 2. Policies are the intended set.
--    Expect (public): "profiles readable by owner" (SELECT),
--    "signups insertable as pending" (INSERT), and NO "profiles readable
--    by all" or "signups insertable by anyone" rows. Campaigns and reviews
--    policies are unchanged. Expect (storage): "books readable by author
--    or approved reader" (SELECT) and NO "books readable by authenticated
--    users" row.
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 3. Payment columns: anon/authenticated hold NO update privilege on them.
--    Expect: 0 rows.
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'campaigns'
  and column_name in ('is_paid', 'stripe_checkout_session_id', 'paid_at')
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'UPDATE';

-- 4. Payment columns: table-level update on campaigns is gone for
--    anon/authenticated (column grants replaced it).
--    Expect: 0 rows (service_role rows are fine and expected — not selected).
select grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name = 'campaigns'
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'UPDATE';

-- 5. Hidden columns: anon/authenticated hold NO select privilege on
--    book_file_url / stripe_checkout_session_id / paid_at.
--    Expect: 0 rows.
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'campaigns'
  and column_name in ('book_file_url', 'stripe_checkout_session_id', 'paid_at')
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'SELECT';

-- 6. Public columns are still granted (sanity that section 3 granted back).
--    Expect: 1 row with public_campaign_grants = 24
--    (12 columns x anon + authenticated), including is_paid.
select count(*) as public_campaign_grants
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'campaigns'
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'SELECT';

-- 7. The books helper exists and is security definer.
--    Expect: 1 row, prosecdef = true.
select proname, prosecdef
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'book_access_allowed';

-- 8. Role probes — run these two blocks one at a time in the SQL editor.
--    Block A (anon view of the world):
--      set role anon;
--      select count(*) from public.profiles;               -- expect 0
--      select id, title, is_paid from public.campaigns;    -- expect rows
--      select name from storage.objects
--        where bucket_id = 'books';                        -- expect 0 rows
--      reset role;
--    Block B (must ERROR — run alone):
--      set role anon;
--      select book_file_url from public.campaigns;
--        -- expect: ERROR: permission denied for table campaigns
--      reset role;
