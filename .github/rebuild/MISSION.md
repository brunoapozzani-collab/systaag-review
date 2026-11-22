# Mission: REBUILD-01 — Início loads only what Início needs

**Status:** NOT DISPATCHED — on hold. Ceiling measured 21 Nov 2026 before starting (branch `teto1`, read-only copy, Bruno's Chrome):
with ALL 93 `v*.js` layers delayed, the first draw comes at ~1.700 ms and it is the OLD, incomplete Início (7 KB instead of 91 KB);
the code inside `index.html` alone takes ~1.500 ms. So this mission's best possible result for a correct Início is between
1.700 and 3.100 ms — it cannot reach the program goal of under 1.000 ms. Do not run it for that goal.
**Orchestrator:** Claude (chat session that wrote this) · **Operator(s):** Claude Code on Bruno's Mac, one session per task group (see §7)

## 1. Objective

When someone opens https://systaag-review-tau.vercel.app/ , the real, working Início is on screen after running only the code layers Início needs; every other layer loads afterwards, and the system is proven to show the same 206 screens, hold the same data and send the same writes as today.

Program goal (this mission is its first step): real Início in under 1.000 ms on Bruno's MacBook Air M1, warm cache. Today's measured value is ~3.100 ms (21 Nov 2026, commit `c745e02`). This mission does not promise a number; it promises a proven-identical system and a measured number (§2, criterion 7).

## 2. Definition of done — acceptance criteria

"REF" = the system built from commit `c745e02`. "NEW" = the system built from branch `rebuild-01`. Both are run locally by the harness (§4) under the same frozen conditions.

| # | Criterion | How it's verified | Evidence returned |
|---|-----------|-------------------|-------------------|
| 1 | The harness is deterministic: REF compared with REF gives zero differences, twice in a row | `node tools/rebuild/compare.mjs --a ref --b ref` run twice | Both `rebuild/out/*.xlsx` reports showing 0 differences |
| 2 | Início is identical: `#main`, the side menu and the top bar have the same HTML in NEW as in REF once Início is ready | `compare.mjs --a ref --b new --only inicio` | Report row "inicio": 0 differences |
| 3 | All 206 screens (every key of `SCREENS`) are identical after navigating to each: same final `location.hash`, same `#main` HTML | `compare.mjs --a ref --b new` | Report: 206 rows, column "diferenças" = 0 for every row |
| 4 | Data is identical: canonical JSON of `S.db` and of `CRM_T` (keys sorted) hash the same in NEW and REF, (a) when Início is ready + late layers loaded, (b) after visiting all 206 screens | same run | Report sheet "dados": 4 hashes equal |
| 5 | Writes are identical: the list of records the system tried to send to the shared database (captured by the read-only lock, §4) is the same in NEW and REF, compared by `tabela`+`id`+canonical `dados`+`apagado` | same run | Report sheet "gravações": same count, 0 differences |
| 6 | Every clickable element on Início behaves the same: for each element with `onclick` or `href` inside `#main`, the top bar and the side menu, clicking it gives the same `location.hash`, same `#main` HTML and same open-modal HTML in NEW as in REF | `compare.mjs --a ref --b new --cliques-inicio` | Report sheet "cliques": N rows, 0 differences |
| 7 | Timing is measured, not estimated: median of 5 warm opens of `window.__tRender` (ms) for REF and for NEW, headed Chromium, on Bruno's Mac | `node tools/rebuild/tempo.mjs` | Report sheet "tempo": 5 values + median for each |
| 8 | No browser errors: `window.__E.length === 0` in NEW during open, late load and the 206-screen sweep | same runs | Report sheet "erros": 0 |
| 9 | Publish gate: NEW goes to `main` only if criteria 1–6 and 8 hold AND criterion 7 shows NEW's median at least 500 ms lower than REF's | orchestrator reads the report | Report + PR link. If the gain is under 500 ms, nothing is published and the mission reports "proven, not worth shipping" |
| 10 | After publishing, the live link is checked in Bruno's Chrome by the orchestrator: opens as Bruno, 36 people in the picker list, live record count in the shared database unchanged by the open | orchestrator, in Chrome | Numbers in the final report |

## 3. Scope

**In scope:** `build.mjs` (how the published page is assembled); a new file `rebuild/camadas.json`; a small new loader script `v205-tarde.js`; one added line of logging in `nuvem-config.js`; new test tools under `tools/rebuild/`.

**Explicitly out of scope:**
- Changing the logic of `index.html` or of any existing `v*.js` layer. Layers are only moved between "core" and "late"; their text is not edited. (One exception, fixed in §6: the gate in `v172-nuvem-base.js`.)
- Any screen design, wording or number.
- The shared database (Supabase project `qptluvvsfhtkbbjaphad`): no schema change, no data write, no restore.
- Rewriting screens in a framework; removing the built-in starter data; the opening photo (`v195-tela.js`) — it stays as is.
- Render (`taag-sistema`) and `taag-flow`: different systems, not touched.

## 4. Ground truth — where things are

- Repo: `https://github.com/brunoapozzani-collab/systaag-review` · production branch `main` · Vercel project `systaag-review` publishes `dist/` built by `npm run build` (`build.mjs`).
- Work folder on the Mac: clone fresh into `~/systaag-rebuild` (a new folder no other chat uses). Branch: `rebuild-01`, created from `main`.
- Source: `index.html` (the system, ~10 MB) + ~100 `v*.js` layers listed as `<script src>` near the end of `index.html`. `build.mjs` splits big inline blocks into `dist/app/*.js`, publishes the system as `dist/app.html` and the entry page `loader.html` as `dist/index.html`.
- Build locally: `npm ci && SEM_FOTO=1 node build.mjs` (SEM_FOTO skips the database snapshot).
- Existing marks in the page (already live): `window.__BOOT` (1 while layers load), `window.__tFim` / `window.__tRender` (ms when layers finished / first real draw finished), `window.__E` (array of error messages), `window.__v172pronto` (true after the first read of the shared database), `SCREENS` (object: one key per screen), `S.db` (the Base), `window.CRM_T` (CRM tables).
- Read-only lock (already live, `nuvem-config.js`): on any hostname other than `systaag-review-tau.vercel.app` every write to Supabase is answered locally and never sent; `window.__bloqueados` counts them. `localhost` is therefore read-only.
- "Quem é você?": a fresh browser shows the picker (`#qv0 .qv-t[data-l]`); the harness clicks `data-l="bruno.pozzani"` (Gestor, sees every screen).
- Existing pattern for a build-time switch: see `SEM_FOTO` / `SEM_BOOT1` in `build.mjs`.
- Current state, measured 21 Nov 2026 on `c745e02`: layers finish ≈2.800 ms, first real draw ≈3.100 ms, 0 errors, 213 code files. Three trimming experiments (skip one start-up check; pack files; fewer redraws beyond what is live) gave no further gain — do not repeat them.

## 5. Constraints and non-negotiables

- Tests never touch real data: the harness runs only on `localhost`; it must assert `NUVEM_CONFIG.somenteLeitura === true` before doing anything and abort otherwise.
- Never open `systaag-review-tau.vercel.app` from the harness.
- Must not break: the read-only lock, the 150-record deletion lock (`trava` in `v171-nuvem.js` / `v172-nuvem-base.js`), the base-generation check in `loader.html`.
- Allowed new dev dependency: `playwright` only. `acorn` is already present (dependency of `terser`).
- Other chats push to `main`. Before every full test run and before the PR: `git fetch origin && git rebase origin/main`; if `main` moved, REF stays `c745e02` for timing but criteria 2–6 must be re-run with REF rebuilt from the new `main` tip (so both sides contain the same layers).
- Commit messages in Portuguese, like the repo's history.

## 6. Decisions already made

| Decision | Reason |
|----------|--------|
| Approach = "defer by proof": every layer starts as `core`; a layer is moved to `late` only if all of criteria 2–6 and 8 still pass with it late | The layers wrap each other in order, so reasoning about which are safe to delay is unreliable; the tests decide |
| `rebuild/camadas.json` = `{ "<file>": "core" | "tarde" }` for every local script the page loads, in page order. Missing entry = `core` | One place, reviewable, diffable |
| Late layers load all together, in their original relative order, by `v205-tarde.js`: `window.TARDE.carrega()` returns a promise, appends the scripts one after another (`async=false`), sets `window.__tardePronta=true`, then calls `render()` once | Keeps the original order among late layers; one extra draw at the end, same as today's single draw |
| `TARDE.carrega()` is called (a) 300 ms after the first real draw, (b) immediately on the first `hashchange` to any route other than home — the route's draw waits for it | Normally loaded before the user clicks; never shows a half-built screen |
| Nothing is sent to the shared database before late layers are loaded: `v172-nuvem-base.js` `arranca()` and `v171-nuvem.js` start-up wait for `TARDE.carrega()` | A half-loaded system must never write. This is the only edit allowed inside existing layers, and only as a wait around the existing start call |
| Search order for candidates: by groups of 16 layers from the end of the page backwards; a failing group is split in half until single layers are identified; a layer that fails alone stays `core` for good | Finishes in tens of runs instead of hundreds |
| Determinism: Playwright installs a fixed clock (`2026-11-23T12:00:00-03:00`), replaces `Math.random` with a seeded generator before any page script, and replays the shared database from one HAR file recorded at the start of the session (`rebuild/out/nuvem.har`) for both REF and NEW | Screens show dates and create random ids; the team keeps editing the real database |
| Write log: in `nuvem-config.js`, where blocked writes are counted, also push the parsed body to `window.__bloqueadosLog` (array) | Needed for criterion 5; harmless on the official host (the block never runs there) |
| Reports are Excel files (`.xlsx`) with filters, one sheet per criterion | Bruno's standing preference for lists people read |
| Screen HTML is compared exactly (after the fixed clock and seed) — no "strip the digits" shortcut | Numbers must match, not just shapes |

**Open questions:** none.

## 7. Tasks

| # | Task | Serves criterion | Depends on | Operator |
|---|------|------------------|------------|----------|
| 1 | `nuvem-config.js`: add `window.__bloqueadosLog` | 5 | — | A |
| 2 | `tools/rebuild/serve.mjs` (static server for a `dist` folder, port from `--porta`), `tools/rebuild/monta.mjs` (builds REF from a git worktree of `c745e02` into `rebuild/out/ref`, NEW from the working tree into `rebuild/out/new`) | 1–8 | — | A |
| 3 | `tools/rebuild/compare.mjs` (Playwright; flags `--a`, `--b`, `--only inicio`, `--cliques-inicio`; records/replays `nuvem.har`; fixed clock + seed; asserts read-only; writes `rebuild/out/relatorio-<data>.xlsx`) and `tools/rebuild/tempo.mjs` | 1–8 | 1, 2 | A |
| 4 | Prove criterion 1 (REF vs REF, twice). Fix the harness until it is zero | 1 | 3 | A |
| 5 | `build.mjs`: read `rebuild/camadas.json`; `core` scripts stay in `app.html`; `tarde` scripts are left out of `app.html` and listed in `window.__TARDE=[...]` (same `?v=` stamps, still preloaded with low priority). Add `v205-tarde.js` and the two start-up waits (§6). With every layer `core`, NEW must equal REF (run criteria 2–6, 8) | 2–6, 8 | 4 | B |
| 6 | Search: move layers to `tarde` by the §6 order, running criteria 2–6 and 8 for each step; commit `camadas.json` after each accepted group | 2–6, 8 | 5 | B |
| 7 | Timing (criterion 7) on the final `camadas.json`; full run of criteria 1–8; write the report | 7, 9 | 6 | B |
| 8 | If criterion 9 passes: PR `rebuild-01` → `main`. If not: no PR; report only | 9 | 7 | B |
| 9 | Live check in Bruno's Chrome after the publish | 10 | 8 | Orchestrator |

**Interfaces between tasks:** `rebuild/camadas.json` shape as in §6 · `window.TARDE.carrega(): Promise<void>` and `window.__tardePronta: boolean` · `window.__bloqueadosLog: Array<{tabela,id,dados,apagado,...}>` · `compare.mjs` exits 0 only when every compared item has 0 differences, and always writes the report · ports: REF 4101, NEW 4102.

## 8. Failure modes — stop and ask

- REF vs REF is not zero after reasonable harness fixes → stop, report what differs. Do not loosen the comparison.
- A criterion can only pass by editing a layer's logic → stop and report the layer and why.
- `NUVEM_CONFIG.somenteLeitura` is not `true` on localhost, or any request to Supabase with a method other than GET/HEAD leaves the browser → stop immediately and report.
- No layer, or fewer than 20 layers, can be moved late → stop after the search and report; do not try other techniques.
- `main` gains a commit that changes `build.mjs`, `loader.html`, `nuvem-config.js`, `v171-nuvem.js` or `v172-nuvem-base.js` → stop and report before rebasing over it.

## 9. Deliverables

- Branch `rebuild-01` with: `tools/rebuild/*`, `rebuild/camadas.json`, `v205-tarde.js`, the `build.mjs` change, the two start-up waits, the write-log line.
- `rebuild/out/relatorio-<data>.xlsx` (not committed; attached to the final report).
- Final report: one line per criterion — met / not met — with the evidence; the list of layers left `core` and why each failed; the two medians.

## 10. Inspection checklist

- [ ] Every acceptance criterion verified with evidence attached
- [ ] REF vs REF still zero at the end (the harness did not drift)
- [ ] Empty and error paths: fresh browser (picker), browser with a remembered person, a deep link to a non-home route as the first open (late layers must load before that screen draws)
- [ ] No debug output, TODOs, temp files or disabled tests left in the branch; `rebuild/out/` is git-ignored
- [ ] `git diff c745e02 -- 'v*.js' index.html` shows only the two start-up waits and the write-log line
- [ ] The harness never contacted `systaag-review-tau.vercel.app`
- [ ] Nothing that passed before fails now: `SEM_FOTO=1 node build.mjs` builds with `SEM_BOOT1` absent and with an empty `camadas.json`
- [ ] The published page still shows the opening photo, the timed bar and the "Quem é você?" picker
