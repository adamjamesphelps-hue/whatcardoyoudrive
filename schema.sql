-- WhatCarDoYouDrive.com — full database schema
-- Paste this whole file into Supabase SQL Editor and click Run.
-- Safe to run top to bottom in one go — order matters (foreign keys).

-- ============================================
-- Block 1
-- ============================================
create table submissions (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year text,
  body_type text not null check (body_type in
    ('sedan','suv','coupe','convertible','truck','hatchback','wagon')),
  reason text not null,
  name text default 'Anonymous',
  created_at timestamptz not null default now()
);

alter table submissions enable row level security;

-- anyone can read
create policy "public read submissions"
  on submissions for select using (true);

-- anyone can add an entry, but only an entry (no editing/deleting others')
create policy "public insert submissions"
  on submissions for insert with check (true);

-- ============================================
-- Block 2
-- ============================================
create table forum_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (room_id in
    ('general','ev','trucks-suvs','design','buying-advice','performance')),
  name text default 'Anonymous',
  message text not null check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);

alter table forum_messages enable row level security;

create policy "public read forum_messages"
  on forum_messages for select using (true);

create policy "public insert forum_messages"
  on forum_messages for insert with check (true);

-- ============================================
-- Block 3
-- ============================================
create table poll_options (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  option_index int not null,       -- matches the index in the JS POLLS object
  label text not null
);

create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  option_index int not null,
  voter_id text not null,          -- see note below
  created_at timestamptz not null default now(),
  unique (room_id, voter_id)       -- one vote per room per voter_id
);

alter table poll_votes enable row level security;

create policy "public read poll_votes"
  on poll_votes for select using (true);

create policy "public insert poll_votes"
  on poll_votes for insert with check (true);

-- ============================================
-- Block 4
-- ============================================
create table competition_entries (
  id uuid primary key default gen_random_uuid(),
  name text default 'Anonymous',
  entry text not null check (char_length(entry) <= 280),
  created_at timestamptz not null default now()
);

create table competition_votes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references competition_entries(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (entry_id, voter_id)
);

alter table competition_entries enable row level security;
alter table competition_votes enable row level security;

create policy "public read competition_entries"
  on competition_entries for select using (true);
create policy "public insert competition_entries"
  on competition_entries for insert with check (true);

create policy "public read competition_votes"
  on competition_votes for select using (true);
create policy "public insert competition_votes"
  on competition_votes for insert with check (true);

