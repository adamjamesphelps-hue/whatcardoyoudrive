# Supabase Schema — WhatCarDoYouDrive.com

**The site's code already calls Supabase, not `window.storage`** — every
`.js` block in `index.html`, `about.html`, `blog.html`, and `forum.html`
is written against the exact tables below. All that's missing is your
actual Supabase project. Run the SQL below in your project's **SQL
Editor** (Dashboard → SQL Editor → New query), top to bottom, then add
your project URL and anon key as described in the main README.

The "old code" / "new code" comparisons below are kept as reference for
understanding what changed and why — they're not something you still
need to do, the "new code" side is what's already in each HTML file.

---

## 1. Car submissions

Used by `index.html`.

```sql
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
```

**Old code** (`index.html`):
```js
const result = await window.storage.get('submissions', true);
submissions = result ? JSON.parse(result.value) : [];
// ...
await window.storage.set('submissions', JSON.stringify(submissions), true);
```

**New code** (with `supabase-js`):
```js
const { data: submissions } = await supabase
  .from('submissions')
  .select('*')
  .order('created_at', { ascending: false });

await supabase.from('submissions').insert({
  make, model, year, body_type: type, reason, name
});
```
Note: rename the local variable `type` → `body_type` to match the column,
and `ts` (a millisecond timestamp) is replaced by `created_at`
(a real Postgres timestamp) — update `timeAgo()` to accept a date string.

---

## 2. Forum messages

Replaces the `forum-rooms-v1` key used on `forum.html`.

```sql
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
```

**New code**:
```js
const { data: messages } = await supabase
  .from('forum_messages')
  .select('*')
  .eq('room_id', activeRoom)
  .order('created_at', { ascending: true });

await supabase.from('forum_messages').insert({
  room_id: activeRoom, name, message: text
});
```

For the total-message counter on the homepage and the Talk Cars stats
banner, use a `count` query instead of pulling every row:
```js
const { count } = await supabase
  .from('forum_messages')
  .select('*', { count: 'exact', head: true });
```

---

## 3. Polls

Replaces the `forum-polls-v1` key. The questions/options themselves are
currently hardcoded in JS (`POLLS` object) — you can leave them hardcoded,
or move them into the database if you want to add/edit polls without a
code change. Schema below supports either.

```sql
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
```

**About `voter_id`:** there's no login system on this site, so "one vote
per person" can only ever be approximate. The practical approach is a
random ID generated in the browser and stored in `localStorage`
(`crypto.randomUUID()`, saved once, reused on every visit). It stops
accidental double-voting and casual abuse, not a determined person with
two browsers — that's the honest ceiling without real accounts.

**New code**:
```js
let voterId = localStorage.getItem('wcdyd_voter_id');
if (!voterId) {
  voterId = crypto.randomUUID();
  localStorage.setItem('wcdyd_voter_id', voterId);
}

// vote counts per option, for the active room
const { data: votes } = await supabase
  .from('poll_votes')
  .select('option_index')
  .eq('room_id', activeRoom);
// then count occurrences of each option_index client-side, same as now

// casting a vote
await supabase.from('poll_votes').insert({
  room_id: activeRoom, option_index: idx, voter_id: voterId
});
// if this fails on the unique constraint, they've already voted —
// catch that error and show "already voted" instead of a generic failure
```

---

## 4. Competition entries + votes

Replaces the `forum-competition-v1` key.

```sql
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
```

**New code**:
```js
// leaderboard — entries with their vote counts
const { data: entries } = await supabase
  .from('competition_entries')
  .select('*, competition_votes(count)')
  .order('created_at', { ascending: false });

// submitting an entry
await supabase.from('competition_entries').insert({ name, entry });

// voting (uses the same voterId pattern as polls)
await supabase.from('competition_votes').insert({ entry_id: id, voter_id: voterId });
```

---

## 5. Adding your credentials

This block is already present near the top of `<head>` in every HTML
file — you just need to fill in the two placeholder strings:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  window.wcdydSupabase = window.supabase.createClient(
    'https://YOUR-PROJECT.supabase.co',
    'YOUR-PUBLIC-ANON-KEY'   // safe to expose client-side, RLS policies protect the data
  );
</script>
```

Get both values from Supabase Dashboard → Project Settings → API. The
anon key is meant to be public (that's what RLS policies are for) — do
not use the `service_role` key anywhere in client-side code. You'll need
to update this in all four HTML files (they each load their own copy).

---

## 6. What this does and doesn't fix

**Fixes:** every "live" feature on the site (entries, forum, polls,
competition, the insight snapshot on the Partners page) becomes real and
persists for actual visitors, not just inside Claude's preview.

**Doesn't fix on its own:**
- **Moderation.** Nothing above stops someone from posting something
  inappropriate. Before real traffic, add at minimum: a way to
  delete/hide rows (an admin view, or a Supabase Edge Function with a
  service-role key that only you can call), and consider a profanity
  filter on insert.
- **Rate limiting.** Supabase has some built-in protections, but for a
  public form you'd want to add stricter limits (e.g. via a Supabase Edge
  Function that checks IP/voter_id request frequency before allowing an
  insert).
- **The video call feature** on Talk Cars is unaffected by any of this —
  it already runs on Jitsi Meet's public infrastructure, not your database.
