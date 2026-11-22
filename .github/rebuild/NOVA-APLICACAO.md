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

---
## 22 Nov 2026 — measured correction: the old system is NOT stuck at 3 s

Function-level profile (local loop, then Bruno's Chrome on a read-only copy with real data):
- Defining all the code costs almost nothing (~100 ms of 6.100 ms in the local loop).
- The start-up time was REPEATED WORK: during start-up the layers called `render()` 28 times and `save()` ~90 times;
  each call re-ran whole-database sweeps (partners, links, copies). v199 only skipped the final drawing step.
- **v208** (build.mjs): `render` and `save` become gates while `window.__BOOT` is on → one save + one render at the end.
  Bruno's Mac, real data, warm: **3.412–3.573 ms → 1.893–1.913 ms**.
  Proof: same computer state switched from published code to v208 (branch alias `prova`, read-only): 180 Base tables,
  13 CRM tables, stored base, both sync queues and Início HTML identical; 206 screens draw with 0 errors.
- Where the remaining 1.900 ms goes (Mac, real data): 350 ms before any script runs (loader, reading the base) ·
  ~1.000 ms scripts (kits import on factory data 144 · decompress 115 · ~150 small blocks) · final save ~200 · final draw 290.

Tried and NOT equal (do not ship as they are):
- Giving the stored base to the early blocks (before line ~7790): blocks assume factory data → errors (CQ, PRODLINK…).
- Skipping the factory kits import when a stored base exists: Estoque screen and an Início counter change.
- Moving the final save after the draw: one obra's `_auto.propostasPlanilha` changes.

Still open for < 1 s: the 350 ms before scripts, decompress off the main thread, the factory-data phase (112 blocks that
work on data that is thrown away), the three re-draws right after opening (depoisDoBoot, v161e-final, v124-demo).
Test tools kept here: `prova-igual.mjs` (same stored state, two builds, compares base/CRM/queues/screens),
`perfil.mjs` + `perfil-le.mjs` (function-level profile of the start-up).
Lesson kept: comparisons must start from the SAME stored state on the SAME origin (port); a fresh origin boots from
factory data and proves nothing about a real computer.

## 22 Nov 2026 (second block) — v212 live: 1.430–1.590 ms
- v212a: with a stored base, the factory kits import + product matching are skipped (their result was discarded at ~7790).
- v212b: the single end-of-start-up save runs after the screen is painted.
- Proof: real link before/after — 180 Base tables, 13 CRM tables, local storage/queues, Início identical; local loop 206 screens
  identical except session counters (Reconciliações) and one animated number (rcom, unstable in ref too).
  Local-loop only: OBR-AT040 `_auto.propostasPlanilha` gains a proposal one save earlier than before (convergent); real data: no diff.
- CORRECTION: the earlier "not equal" verdicts for kits-skip came from a capture-timing bug in the harness (fixed: wait for
  hashchange). Only the "stored base to early blocks" attempt is truly broken.
- v211 worker decompress: no measured gain (worker start + transfer ≈ the parallel window) — removed. Loader marks kept
  (`performance.getEntriesByType('mark')`: L:inicio, L:idb0/1, L:escreve1/2, A:base).
- Timeline now (Mac, warm): loader starts 25–190 (index.html revalidation varies) · IDB read +110 · first write +45 ·
  factory phase +210 (→ A:base ≈ 410) · layers on real data +615 (→ tFim ≈ 1.030) · draw ≈ 400 (→ 1.430).
  After opening: long tasks 284 / 340 / 259 / 418 ms (re-draws), save ≈ at 2.500.
- Next candidates: layers-on-real-data phase (profile with js-profiling branch), Início draw (400), remaining factory phase,
  index.html revalidation (service worker / stale-while-revalidate), post-open re-draws.
