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

## 22 Nov 2026 (third block) — v213–v215 live: fewer freezes right after opening
- Profile (Mac, real data) of what is left before ready: decompress 120 · other factory 85 · layers 600 (spread: a375 67,
  v123-partners 63, v161d-regras 31, v123-flow 29, ad192 28 …; no single hot spot) · Início draw 400 (v130 build 92,
  prodInv 88, v149 blocos 77, CANON 61 …).
- After ready there were 4 full re-draws in ~1,3 s (inline depoisDoBoot, v124-demo, v161e-final, v124-guia go).
  v213: opening on Início, re-draw requests are held for 1,4 s (or until the first click/key/screen change) and done once.
  NOT applied on other entry screens: Financeiro › Hoje and Comercial › Gestão end up different (layers depend on the sequence).
  v214/v215: the held re-draw never happens between pointer down and the click being delivered (first click was lost in v213).
- Proof: `prova-abertura.mjs` (opening DOM after 12 s, no interaction, per entry screen) equal on Início; `prova-clique.mjs`
  (real mouse click 150/600/1300/2500 ms after ready navigates); real link: tile click 250 ms after ready opens Gestão.
- After ready now (Mac): ~230 ms small tasks, then v171 cloud CRM apply ≈ 416 ms (each `aplicar` runs a full save ≈ 180 ms),
  one re-draw ≈ 364 ms at +1,4 s, v172 cloud apply ≈ 315 + 418 ms.
- CAUTION for Chrome tests: the tab viewport changes between loads (1470×835 vs 1336×759); read element positions with JS
  right before clicking.
- Next candidates: cost of save() itself (sync@a375, repair@c69ff — every action pays it); v171/v172 apply on open when
  nothing changed; decompress; index.html revalidation; Clientes / Base › Clientes draw (6–7 s).

## 22 Nov 2026 (fourth block) — v216 live: Clientes · Obras · Propostas
- Profile (Mac): 4,9 of 5,9 s were `S.db.clientes.find(...)` evaluated inside an obras filter, for every proposal
  (1.374 × 486 × 1.065). v216 hoists it (build-time text patch) + per-draw memo of the client sigla. Output identical
  (SHA of the 5.985.779-char screen equal before/after on the real link). Now ≈ 4,3 s (was 5,7–14 s depending on load).
- What is left there: the screen is 6 MB of HTML (every client expanded, every proposal carries a "mover para outra obra"
  list); sondar@521ab ≈ 700 ms, v123-partners hideMerged ≈ 650, v138 portas ≈ 740. A real fix = show clients collapsed
  (or paged) by default — a visible change → Bruno's call.
- One save on real data ≈ 115 ms with immediate flush (sync@a375 35, c69ff 42, stringify 28) — spread, no single sweep.
- Self-profiler recipe: branch with only the vercel.json `Document-Policy: js-profiling` header (no loader change) →
  in the page `new Profiler({sampleInterval:1,maxBufferSize:300000})` around the action (see this session's __perfil2).

## 22 Nov 2026 (fifth block) — v217 READY, NOT PUBLISHED (Bruno's Chrome went offline ~04:50 São Paulo)
- Steady-state `render()` on Início on the Mac is ≈ 825 ms median (boot draw ≈ 400): a third was prodInv scanning all units
  and all engine rows per product; 17% propsDaObra scanning all proposals per obra.
- v217 (branch `v217`, build-time): per-instant indexes `__ixU` (units by product), `__ixR` (engine rows by product, WeakMap on
  the Q.compute result), `__ixP` (proposals by obra, returns a copy). Invalidation: v153 stamp + array identity + length + own
  timeout. Real data on prova: render median 825 → 515 ms, Início HTML identical, 180 Base tables identical.
  Local loop: 206 screens identical (only rcom's animated number), base and CRM identical.
- NOT published because the post-publish check on the real link is impossible while his Chrome is offline. To publish:
  `git checkout main && git pull --rebase && git merge --ff-only v217 && git push`, then verify on the real link
  (tR, render median, Início hash before/after, DB count 14.128/36, queue empty).
- The tab was left on the read-only prova alias (mid-sweep) — return it to https://systaag-review-tau.vercel.app/ .
- After v217 the draw profile is flat (largest: v123-partners scoreRec+dbJson ≈ 40 ms per draw; rest is DOM building).

### Verdict on "under 1 s" for the real system on this route
- Reached: 1.450–1.650 ms (from 3.400–3.770). With v217: ≈ 1.350–1.550 expected (draw −100).
- What is left is flat: page start + reading the base ≈ 280 ms, unpack 120, ~150 code blocks 600 (none above 70), draw ≈ 300.
  Floor of this route with more small cuts ≈ 1.200 ms. It does not reach 1.000.
- Under 1 s needs Início drawn WITHOUT waiting for the 250 code blocks: a native Início (new-application route), drawn right
  after the base is read (≈ 280 + 120 ms), legacy loading behind for every other screen.
- Size: Início = hero + 8 tiles + 7 management blocks + profitability tile + side panels; numbers come from the stock engine,
  metas, pipeline, obras/Painel, CRM classification. Each block ported and proven equal against the legacy DOM with
  `prova-abertura.mjs`. Estimate: 8–12 work blocks like tonight's. Order: data layer (read + unpack + indexes) → hero/tiles →
  Comercial/metas → Estoque → Operações/Projetos → Relacionamento → Financeiro/Pós-venda → panels → switch-over.

## 22 Nov 2026 (sixth block, Chrome still offline) — v218 ready on branch (stacked on v217), not published
- Re-thought the native Início before building it: its visible result (true Início on screen at once) is what the stored
  screen copy (v206) already gives IF the copy is current. A native Início would only add number-click panels ~1 s earlier,
  for 8–12 blocks of work. So first make the copy provably current and MEASURE it:
  v218 re-takes the copy 3 s after any change to the open screen and when the tab is hidden, and at every open compares the
  text of the copy shown with the settled real screen (1,5 s without changes, cap 10 s; skipped if the person clicks/types).
  Scoreboard: localStorage `qv0:fotoConf` {iguais, diferentes, ultima:{tela, igual, idadeMin, nuvemJaChegou, onde}}.
- Local loop: second and later opens equal; after an edit + reopen equal. Known noise: screens whose late banners arrive
  after the settle window (pipeline "✉ 37 propostas…") can count as different.
- Decision rule for the native Início: after a few days of real use, read qv0:fotoConf on Bruno's Chrome. If the copy is
  equal in nearly every open, the instant screen IS the real one and the rewrite buys little; if not, the differences listed
  in `onde` say exactly what must be computed natively first.

## 22 Nov 2026, 07:45 São Paulo — v217 + v218 LIVE (f084b69)
- Real link before/after: 180 Base tables, CRM tables and queues identical; Início HTML identical except the hero
  `min-height` (follows the window height). render() median 318 → 238 ms (Mac rested; the 825 → 515 seen at 04:30 was the
  same ratio on a hot machine). Ready ≈ 1.440–1.500 ms. After ready: cloud apply ≈ 440, single re-draw ≈ 220.
- qv0:fotoConf on Bruno's Chrome after 3 opens: 3 equal / 0 different. Read it again after real use.
- Lesson: absolute timings taken after hours of test loops on his fanless Mac are inflated ~2,5×; compare ratios, or re-measure rested.

## 22 Nov 2026, ~09:30 São Paulo — v219 READY on branch `v219` (also on `prova`), NOT published (Chrome offline again)
Bruno ordered the new Início now, "like Amazon". Início's own code is ~270 KB across v130/v149/v155/v124-diretoria plus the
engines — a hand rewrite is far beyond the 8–12 blocks I quoted (my estimate was wrong). What sites like that do is serve the
stored rendered page at once and let the application take over ("hydrate"), replaying the clicks made meanwhile. v219 does that:
- exact copy: each stored copy carries a fingerprint of the base (sampled hash + lengths of systaag_erp1z and systaag_crm_t +
  day); if the base on this computer is still the same, the copy is shown clean (no bar, no "updating" pill) — `__v219exata`.
- click replay: a click on a non-link element of the copy is stored (path from nearest id + tag + text) and given to the same
  element of the real page at takeover; nothing matching delete words is replayed — `__v219clique`, `__v219log`.
- the invisible copy keeps receiving clicks for 0,35 s after takeover: clicks physically made before takeover (ev.timeStamp)
  resolve against the copy the person saw; later ones are forwarded to the real element under the pointer; the copy never
  leaves between pointer down and click.
- same-screen re-draws no longer throw the page to the top; a smooth scroll asked < 1,6 s ago (Visão executiva) is resumed.
- copy re-taken when the stored base changes without the screen changing (20 s check).
Local loop: `prova-clique-copia.mjs` 7 of 8 timings OK (one miss ≈ 1,5 s after ready, same class as before), `prova-clique.mjs`
7 of 7, 12 screens + base equal, opening DOM equal on Início and Pipeline.
To publish: test on prova with real data (exata true on 2nd open, click a number on the copy right after navigating, Início
hash/base digest equal), then merge v219 to main, verify on the real link.

## 22 Nov 2026, 10:30 São Paulo — v219 LIVE (9e84551)
Real data: prova and real link — exact copy on 2nd open (`__v219exata` true), Comercial tile clicked ~250–800 ms after ready →
Gestão; "Visão executiva" clicked 220 ms after ready → scrolls and stays; base 180 tables, CRM, queues and Início text identical
before/after; DB 14.128 / 36; scoreboard 4 equal / 0 different. Ready 1.290–1.520 ms.
Open: never-visited screens (loading bar), first open on a new computer, Clientes default view (Bruno's call), one 2,4 s
freeze seen once on 22 Nov morning, the ~1,5 s-after-ready click miss seen once in the local loop.

## 22 Nov 2026, ~12:40 São Paulo — v220–v222 LIVE (0a38abd): real system ready at 1.011–1.064 ms
SIZING of a hand rewrite of Início (Bruno asked to size it first): one draw of Início executes 2.458 functions in 131 files
(~620 KB of code counted with nesting) and reads ~40 base tables (`cov.mjs` in /tmp/h, Chrome precise coverage). Not a route.
"Início-first load order" is dead too: only ~1% of the layers phase is in files Início does not use (`pb.mjs`).
What worked instead (profile on the Mac by named function per phase, then remove repeated work):
- v220: D.unidadesDe by index (`__ixUP`): the menu's "separação" badge scanned all units per proposal — 112 ms in EVERY draw
  and 138 ms at load. (The renderNav boot gate added there is dead code: renderNav is redefined later — remove.)
- v221: partners scoreRec counts occurrences with indexOf instead of split (same count).
- v222: with a stored base, three sweeps that ran at load AND again at first draw/save run once (partners sweepDup,
  flow syncTudo, core "uma-obra" sync). Session log lines drop (real data 52 → 47); base, CRM, Início, menu identical.
- stale-while-revalidate header does NOT apply to the entry page (measured: still a 304 round trip) — removed.
Timeline now (Mac, warm, real link): page code starts 142–162 (network check of index.html) · IDB +100 · write +27 ·
base ready +170 (unpack 120) · layers +300 · draw +265 → 1.011–1.064. From page-code start: 880–902 ms.
Next for < 1 s: the 140 ms before page code starts (service worker serving the entry page from cache, with reload-once when a
new version is found before any interaction), unpack 120, IDB 100 (read photos lazily), layers leftovers (v150 boot 22,
ad192 alinharCopias 19, v161d ligaVendas 18, v142 boot 18), draw 265.

## 22 Nov 2026, ~12:00 São Paulo (15:00 UTC) — v223 + v224 LIVE (e7916ed)
Measured first, on his Mac, where the time before and around the page code really goes (the "140 ms network check" was wrong):
- Reload: the server answers in ~50 ms; the next 85 ms were MY v218 code — on leaving the page the screen copy was re-taken
  (the background canvas → webp: 60–73 ms) before the new page could start. Arriving from another site: ~55 ms network +
  ~70 ms new process, 1.085–1.090 ms ready (1.458 with a cold connection, 264 ms waiting for the server).
- "IDB read 100 ms" was not the base: the cloud mirror (nuvem-espelho, 18.098 records, ~20 MB getAll) was issued at the same
  instant and the base (3 MB, 5–13 ms alone) queued behind it.
- Unpacking the base: 148 ms; reading the same text already unpacked from IndexedDB: 7 ms; JSON.parse 18 ms.
v223: (a) leaving/reloading re-takes the copy only if a signature of the screen (innerHTML of the visible parts + address +
theme + base fingerprint) changed since the last copy → 1 ms; (b) the mirror reads its local copy only after "system ready"
(window.__espelhoVai: app after first paint; loader at once when there is no stored base or nobody chosen; 5 s cap) and the
"what changed" request leaves at once with the previous opening's resume point (qv0:espAte), used only if that point is ≤ the
copy's (reads more, never less); count check unchanged; (c) dead renderNav gate removed.
v224: database "systaag_cache" (own DB, never in the base's memory map) keeps the pair {z: packed base, j: same text unpacked};
the loader hands it to the app only if z === stored base (string equality); COP load then skips the unpack (window.__v224=1).
The save worker (v154) writes the pair off the main thread after each save; if the base was unpacked the normal way, the pair
is written 6 s after ready (only if the stored base is still the same). Generation discard also deletes systaag_cache.
Proof: local 12 screens + base + CRM + localStorage equal for first open (no pair) and second open (pair), opening DOM equal;
pair exact after 3 opens (`prova-par-v224.mjs`); prova with real data: digest identical between v223 and v224, pair exact,
scoreboard 19 equal / 0 different; real link before/after publish: 180 Base tables, 13 CRM tables, queues, Início, menu
identical after the cloud settled, 0 errors.
Prova timings (Mac): ready 786–862 ms when the server answered fast (L:inicio 71–78); from page-code start 703–715 (v224),
784–791 (v223 only), was 867–902.
NOT YET MEASURED on the real link warm: his Chrome went offline right after the publish check (the first open after publish
took 26 s for index.html and 13 s for app.html — his network, or the fresh deployment).
Prova vs real differ in 3 tables for a host reason (prova is read-only: 3 negotiations get a local history line each day that
never reaches the cloud; CRM config ids) — not a version difference.
Next if any opening is still ≥ 1.000 ms: entry page from the browser's own cache (service worker with static routing, cache
source — no worker start-up), the page itself refreshes the cached entry and reloads once before any interaction.
- 15:10 UTC: branch `sw` (v225, a1101dd) is on `prova`, NOT on main. Local: navigation served by static routing from the cache
  (workerFinalSourceType "cache", workerStart 0), new version → cache swapped + one reload → new version, 12 screens equal
  (`prova-entrada-sw.mjs`). To test on prova with his Chrome: 2nd open has src cache and L:inicio drops; push a trivial
  change to prova → first open reloads once onto it; offline (Wi-Fi off is his call — or DevTools offline) still opens;
  kill switch = sw.js with DESLIGA=true. Local main == origin/main + notes commits only (sw is NOT merged).

## 22 Nov 2026, 12:50 São Paulo (15:50 UTC) — GOAL MET on the real link; v225 LIVE (41030a2)
v223+v224 measured on the real link (Mac, warm): five reloads in a row 822 / 779 / 768 / 795 / 720 ms; arriving from another
site 893 / 927 / 908; first opening after the Mac had been away 1.118 (247 ms waiting for the server).
v225 (entry page from the browser's own cache, static routing, no worker code per request) tested on prova with his Chrome:
navigation answered in 2–3 ms from the cache; after a new publish the first opening swapped the copy and reloaded once onto
the new version; then published. Real link before/after: 180 Base tables, 13 CRM tables, queues, Início, rest of the page
identical; 0 errors; DB 14.128 live / 36 active; pair exact; scoreboard 37 equal / 1 different (the one different was not
identified — `ultima` had already been overwritten; watch it).
v225 on the real link: five reloads in a row 777 / 710 / 713 / 713 / 706 ms (page code starts at 14–16 ms); from another
site 828 / 851; Comercial tile clicked right after opening → Gestão.
Not tested: opening with the network off (cannot switch his network), Safari/Firefox (no static routing → works as before).
Open: first opening after a publish (downloads the new files — 1,3 s to 40 s seen), first opening on a new computer,
never-visited screens, Clientes default view (his call), leaving within ~20 s of a save still re-takes the copy (65 ms).
Kill switch for v225: publish sw.js with DESLIGA=true.

## 22 Nov 2026, 15:35 São Paulo (18:35 UTC) — v226 LIVE (ce7858a): the loading screen says how long is left
Bruno: "put a bar or something showing that the system is loading and how long it will take to finish".
Found: 160×4 px bar, no time on the entry screen, estimate taken from this computer's fast openings (wrong exactly when the
load is long), and on a slow connection the bar script waited behind nuvem-config/nuvem-espelho (4 s of empty bar locally).
Now one count on both screens (entry page and "Montando as telas"): download = arrived ÷ requested (preload list + app) →
real pace gives the time left; build = this computer's last build times (qv0:monta, default 4 s). 280×8 px bar, "%" and
"faltam cerca de N s"; never goes back; past the estimate says "quase lá…". The script sits right after the screen markup,
before the cloud files. Proof: fresh profile at 30 Mbps shows 8% · 8 s → 51% · 5 s → "Montando as telas… 56% · 4 s"
(`prova-primeira-abertura.mjs`); 12 screens equal (only new key qv0:monta); prova and real link: tables/Início equal, 0 errors,
warm 690–763 ms. Not seen with his eyes on a new computer; default 4 s build estimate is a guess until a computer has history.

## 23 Nov 2026, 14:35 São Paulo — v227 on `prova` (48c386a), NOT yet on main (local main is ahead by it)
Bruno opened the system on his phone and got "CÓPIA DE TESTE": the phone was on the prova alias (history shared from the Mac
Chrome, where I opened prova dozens of times). Fix in nuvem-config.js: any *.vercel.app host other than the official one
forwards to the official link (same hash) unless localStorage qv0:teste === '1' (set by ?teste=1, cleared by ?teste=0);
read-only lock unchanged. Verified: 6 host cases in node vm; deployed file on prova contains it. Not verified on his phone
(Chrome offline). FROM NOW ON: open prova in his Chrome with ?teste=1 the first time, and leave no tab/history habit there.
Goes to main with the next publish (inert on the official host).
