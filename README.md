# ARC Desk

ARC (Advance Review Copy) campaign manager for indie authors. Authors create
campaigns with a public signup page, approve readers, and track reviews —
everything needed to walk into launch day with reviews lined up.

**v1 scaffold** — clean foundation: landing page, Supabase email/password auth,
author dashboard, campaign creation with cover/manuscript uploads, and public
campaign pages with reader signup.

## Stack

- Next.js 14 (App Router, TypeScript) + Tailwind CSS
- Supabase: Postgres, Auth, Storage

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then
   run the migration in `supabase/migrations/20261007000000_arc_desk_schema.sql`
   (SQL editor, or `supabase db push` with the Supabase CLI). This creates the
   `profiles`, `campaigns`, `signups`, and `reviews` tables, the `covers`
   (public) and `books` (private) storage buckets, and row-level security
   policies.

3. **Environment variables** — copy the example and fill in your project values
   (Project Settings → API in the Supabase dashboard, API keys in the
   [Stripe dashboard](https://dashboard.stripe.com/apikeys)):
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   STRIPE_SECRET_KEY=sk_test_your-key-here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
   STRIPE_WEBHOOK_SECRET=whsec_your-secret-here
   ```
   Use Stripe **test** keys while developing.

4. **Apply the payments migration** — run
   `supabase/migrations/20261007000001_campaign_payments.sql` in the Supabase
   SQL editor (it adds `is_paid`, `stripe_checkout_session_id`, and `paid_at`
   to `campaigns`).

5. **Point Stripe at your webhook** — in the Stripe dashboard go to
   Developers → Webhooks → Add endpoint:
   - URL: `https://<your-vercel-url>/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy the endpoint's **signing secret** into `STRIPE_WEBHOOK_SECRET`.

   No Stripe product needs to be created in the dashboard: checkout uses
   inline `price_data` ($29 USD, one-time, "ARC Desk campaign launch").

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploy

**Vercel** (recommended):

1. Push this repo to GitHub.
2. Import it in Vercel — the Next.js defaults work as-is.
3. Add the two environment variables from `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in
   Vercel → Project → Settings → Environment Variables.
4. Deploy. No build config changes needed.

**Connect Supabase**: the app talks to Supabase entirely through the anon key
and RLS policies — there is nothing else to wire up. Just make sure the
migration has been applied to the same project whose URL/key you deployed.

## Project structure

```
app/
  page.tsx                    Landing page
  login/page.tsx              Email/password login
  signup/page.tsx             Signup with author/reader role select
  dashboard/page.tsx          Author dashboard: campaign list + stats
  dashboard/campaigns/new/    Campaign creation form (uploads to Storage)
  c/[id]/page.tsx             Public campaign page + reader signup form
  lib/supabase/               Browser + server Supabase clients
  lib/types.ts                Shared TypeScript types
middleware.ts                 Protects /dashboard/* (redirects to /login)
supabase/migrations/          Postgres schema, buckets, RLS policies
```

## Roadmap (not in v1)

- Approve/decline readers from the dashboard + review tracking UI
- Email notifications (signup approved, review reminders)
- Audiobook ARC support
- Stripe billing (per-campaign or subscription)
