# WhatCarDoYouDrive.com

A public record of what people drive and why — plus live discussion rooms,
polls, a monthly competition, and an "insights for automakers" pitch.

## What's in this repo

```
whatcardoyoudrive/
├── index.html            Homepage — live feed, rankings, news, partners pitch
├── about.html             About page
├── blog.html               Blog page
├── forum.html                Talk Cars — chat rooms, polls, video call, competition
├── assets/
│   ├── logo.svg              Vector logo
│   └── logo.png               Raster logo (512x512)
└── chrome-extension/       The companion Chrome extension (see its own README)
```

## Deploying with GitHub Pages (free, ~2 minutes)

1. Push this folder to a new GitHub repo (see commands below)
2. In the repo, go to **Settings → Pages**
3. Under "Build and deployment," set **Source** to "Deploy from a branch"
4. Set **Branch** to `main` and folder to `/ (root)`, then Save
5. GitHub gives you a live URL in a minute or two:
   `https://YOUR-USERNAME.github.io/REPO-NAME/`
6. To use `whatcardoyoudrive.com` instead: add a `CNAME` file to this folder
   containing just the domain, then point your domain's DNS `A`/`ALIAS`
   record at GitHub's Pages IPs (GitHub's docs walk through this exactly:
   https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)

### Pushing this folder to GitHub for the first time

```bash
cd whatcardoyoudrive
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## Before this works for real visitors: add your Supabase credentials

**The code is already wired for Supabase, not `window.storage`.** Every
page (`index.html`, `about.html`, `blog.html`, `forum.html`) loads the
Supabase client and calls real database queries for entries, Talk Cars
messages, polls, and the competition. What's missing is *your* project:

1. Create a free [Supabase](https://supabase.com) project
2. Run the SQL in **[SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)** — it has
   every table, index, and row-level security policy this site expects
3. In **every HTML file**, find this block near the top of `<head>` and
   replace the two placeholder strings with your project's URL and
   public anon key (Supabase Dashboard → Project Settings → API):
   ```html
   window.wcdydSupabase = window.supabase.createClient(
     'https://YOUR-PROJECT.supabase.co',
     'YOUR-PUBLIC-ANON-KEY'
   );
   ```
4. Push, and the site is live and fully functional — entries, Talk Cars,
   polls, and the competition all persist for real

Until you do this, the pages will load and look correct, but every
submit/vote action will fail silently (check the browser console — it
logs a clear error) since there's no real project to write to yet.

One design decision worth knowing about: without a login system, "one
vote per person" on polls and the competition is enforced with a random
ID stored in the visitor's browser (`localStorage`), not a real account.
It stops accidental double-votes, not someone determined with two
browsers — see the note in SUPABASE_SCHEMA.md for the honest tradeoff.

## Chrome extension

See `chrome-extension/README.md` for how to load it locally and what's
left before it can go on the Chrome Web Store.

## License

Not yet specified — add a `LICENSE` file if you want to make this explicit
(MIT is the common default for a project like this).
