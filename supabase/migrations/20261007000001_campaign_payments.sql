-- ARC Desk v1 monetization: pay-per-campaign ($29 one-time per launch)
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.

alter table public.campaigns
  add column if not exists is_paid boolean not null default false,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists paid_at timestamptz;

-- Authors can already read their own campaigns (RLS policy "campaigns readable
-- by all" covers select on the new columns). The Stripe webhook writes via the
-- service-role key, which bypasses RLS, so no additional policies are needed.
