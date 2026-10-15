# systaag-review

SYSTAAG prototype (single-file HTML, `prototype/systaag.html` = the published artifact, untouched) + a click-to-pin review layer.

- `index.html` — prototype + overlay (`review/overlay.html` injected before `</body>` by `node build.js`; all ids/classes `staag-rev-`)
- `api/comentarios` — POST (anyone, 20/min per IP) · GET `?token=` feed (admin) · `GET ?screen=` (pins) · PATCH `/:id` status/delete (admin)
- `lib/store.js` — Vercel Blob store, one versioned JSON per comment + PNG crops
- `revisao.html` → `/revisao` — review page (token asked once), CSV/JSON export, "Copiar como missão"
- `proof/` — live verification screenshots (imported by `.github/workflows/import-proofs.yml`)
- `dev/` — local dev server + Playwright harness (`sixyearold.py`, `integrity.py`, `verify.py`)
