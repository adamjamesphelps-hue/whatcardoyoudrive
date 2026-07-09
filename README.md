# WhatCarDoYouDrive.com — Chrome Overlay (Prototype)

A Chrome extension that shows real driver reasons and stats on top of car
listing sites and Google search results, pulled from the WhatCarDoYouDrive
database.

## What it does right now

- Watches for car model names on Google search results, Autotrader,
  CarGurus, Cars.com, Edmunds, Carvana, and KBB
- When it recognizes a model, it drops a small card in the bottom-right
  corner: how many people registered that car, plus their top reasons
- The toolbar popup lets you switch it on/off, and links out to the main
  site to add a car
- Currently runs on **sample data** for 10 popular models (see `SAMPLE_DB`
  in `content.js`) so you can see exactly how it behaves before any real
  backend exists

## How to load it in Chrome

1. Unzip this folder somewhere on your computer
2. Go to `chrome://extensions`
3. Turn on "Developer mode" (top right)
4. Click "Load unpacked" and select this folder
5. Visit Google and search "2023 Honda Civic" or go to a Cars.com listing
   for a Toyota Camry — you should see the card appear

## Connecting it to real data (next step)

Right now `fetchModelData()` in `content.js` just returns hardcoded sample
data. To make this real:

1. Stand up a small public API — since you already use Supabase for Aceda,
   the fastest path is a Supabase Edge Function (or even just Supabase's
   auto-generated REST API) with a `submissions` table and a `models`
   view that aggregates count + top reasons per make/model
2. Replace the `fetchModelData()` function with a real `fetch()` call to
   that endpoint, e.g.:
   ```js
   function fetchModelData(key) {
     return fetch(`https://YOUR-PROJECT.supabase.co/rest/v1/model_stats?model=eq.${encodeURIComponent(key)}`, {
       headers: { apikey: 'YOUR_PUBLIC_ANON_KEY' }
     }).then(r => r.json()).then(rows => rows[0] || null);
   }
   ```
3. Everything else (detection, widget, toggle) stays the same

## Known limitations to fix before a public launch

- Model detection is a simple keyword match against page title/H1 text —
  it will miss variants (trims, "Civic Si" vs "Civic") and can occasionally
  mismatch. Worth improving with a proper make/model list and fuzzy
  matching once you're past the prototype stage
- No rate limiting or caching — a real version should cache results per
  model for a few minutes so you're not hitting your API on every page load
- Needs a privacy policy before submitting to the Chrome Web Store, since
  it reads page content to detect car models (even though nothing is sent
  anywhere in this prototype)
- Chrome Web Store review can take a few days to a couple weeks for a new
  extension — worth submitting early if you want this live for a launch
