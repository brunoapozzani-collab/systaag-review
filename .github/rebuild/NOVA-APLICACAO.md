# SYSTAAG — new application (decision record, 21 Nov 2026)

Bruno's ruling (21 Nov 2026): build the new application; in the end it must live at the SAME link,
https://systaag-review-tau.vercel.app/ . Goal: real, working Início in under 1.000 ms (MacBook Air M1, warm).

## Why (measured, not estimated)
- Current system ("legacy" = index.html + ~100 v*.js layers): real Início ≈ 3.000 ms. Floor for this build.
- Best case with every add-on layer delayed: 1.700 ms and an incomplete Início; legacy core alone ≈ 1.500 ms.
- Trimming experiments that gave nothing: skipping start-up checks, packing files, removing starter data.
- Already live to soften the wait: copy of the last-seen screen at ~200 ms (v206), timed bar.

## How: replace screen by screen, never a big-bang switch
1. The link serves a NEW small shell (store, router, menu, access, sync). It owns the page.
2. A screen is either NATIVE (new code) or LEGACY. Legacy screens keep running on the legacy engine, loaded
   in the background, exactly as today. So nothing is lost while the new application grows.
3. Order: Início first (it is what everyone opens), then by department, most-used first.
4. A screen switches to native only when, on the same data, it shows the same content and numbers as legacy,
   sends the same writes, and its numbers reconcile (Bruno's standing rules). Proof = report in Excel.
5. Other chats keep adding features to legacy. Rule: until a department is native, features go to legacy as
   today; once native, features for that department go to the new code only.

## Safety rules (from the 21 Nov incident)
- Tests never touch real data: only localhost / preview hosts, which are read-only by `nuvem-config.js`.
- No computer deletes more than 150 records at once (`trava`). Base generation check stays in the loader.
- One source of truth: the shared database (Supabase `crm_registros`). The new store reads/writes the same
  records in the same shape; no second copy of the data model.

## Working loop (proven 21 Nov)
- Cloud sandbox: `SEM_FOTO=1 node build.mjs` → `node .github/rebuild/serve.mjs dist 4101` → headless
  `/usr/bin/google-chrome` via Playwright. Legacy boots offline there with its built-in data (206 screens,
  read-only lock active). Fast loop for legacy-vs-native comparisons without deploys.
- Real-data proof: Vercel preview deployment (read-only) opened in Bruno's Chrome.
- The mission bridge to Bruno's Mac was NOT reachable from the chat that wrote this (21 Nov).

## Milestones
- M0 Harness: compare legacy vs native Início on the same data (HTML + numbers + writes). 
- M1 Native shell + store: opens the local base and the shared database without the legacy engine.
- M2 Native Início, proven equal; legacy loads behind it for every other screen. Measure. Publish if equal.
- M3+ Departments, one at a time, same proof.

`MISSION.md` in this folder (REBUILD-01, delay layers) is on hold: its ceiling is above the goal.
