-- ARC Desk initial schema
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, with a role
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'reader' check (role in ('author', 'reader')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- campaigns: an ARC campaign created by an author
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author_name text not null,
  description text not null default '',
  genre text not null default 'Fiction',
  cover_url text,
  book_file_url text,
  start_date date,
  end_date date,
  max_readers integer not null default 100 check (max_readers > 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- signups: a reader's request to join a campaign
-- ---------------------------------------------------------------------------
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reader_id uuid references public.profiles(id) on delete set null,
  name text,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

-- ---------------------------------------------------------------------------
-- reviews: a review left by an approved reader
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  signup_id uuid not null references public.signups(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  review_url text,
  review_text text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index idx_campaigns_author on public.campaigns(author_id);
create index idx_signups_campaign on public.signups(campaign_id);
create index idx_signups_reader on public.signups(reader_id);
create index idx_reviews_campaign on public.reviews(campaign_id);

-- ---------------------------------------------------------------------------
-- Storage buckets for covers and book files
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true),
       ('books', 'books', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.signups enable row level security;
alter table public.reviews enable row level security;

-- profiles: users can read all profiles, update only their own
create policy "profiles readable by all"
  on public.profiles for select using (true);
create policy "profiles updatable by owner"
  on public.profiles for update using (auth.uid() = id);
create policy "profiles insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

-- campaigns: public readable; authors manage their own
create policy "campaigns readable by all"
  on public.campaigns for select using (true);
create policy "campaigns insertable by author"
  on public.campaigns for insert with check (auth.uid() = author_id);
create policy "campaigns updatable by author"
  on public.campaigns for update using (auth.uid() = author_id);
create policy "campaigns deletable by author"
  on public.campaigns for delete using (auth.uid() = author_id);

-- signups: readable by campaign author and the reader; anyone can sign up
create policy "signups insertable by anyone"
  on public.signups for insert with check (true);
create policy "signups readable by author or reader"
  on public.signups for select using (
    auth.uid() = reader_id
    or exists (
      select 1 from public.campaigns c
      where c.id = signups.campaign_id and c.author_id = auth.uid()
    )
  );
create policy "signups updatable by campaign author"
  on public.signups for update using (
    exists (
      select 1 from public.campaigns c
      where c.id = signups.campaign_id and c.author_id = auth.uid()
    )
  );

-- reviews: readable by all; writable by the reader who signed up
create policy "reviews readable by all"
  on public.reviews for select using (true);
create policy "reviews insertable by signup owner"
  on public.reviews for insert with check (
    exists (
      select 1 from public.signups s
      where s.id = reviews.signup_id
        and (s.reader_id = auth.uid() or s.email = (
          select email from public.profiles where id = auth.uid()
        ))
    )
  );

-- Storage policies
create policy "covers publicly readable"
  on storage.objects for select using (bucket_id = 'covers');
create policy "covers uploadable by authenticated users"
  on storage.objects for insert with check (
    bucket_id = 'covers' and auth.role() = 'authenticated'
  );
create policy "books readable by authenticated users"
  on storage.objects for select using (
    bucket_id = 'books' and auth.role() = 'authenticated'
  );
create policy "books uploadable by authenticated users"
  on storage.objects for insert with check (
    bucket_id = 'books' and auth.role() = 'authenticated'
  );
