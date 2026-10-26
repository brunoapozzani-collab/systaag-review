# systaag-review

SYSTAAG prototype (single-file HTML, `prototype/systaag.html` = the published artifact, untouched) + a click-to-pin review layer.

- `index.html` — prototype + overlay (`review/overlay.html` injected before `</body>` by `node build.js`; all ids/classes `staag-rev-`)
- `api/comentarios` — POST (anyone, 20/min per IP) · GET `?token=` feed (admin) · `GET ?screen=` (pins) · PATCH `/:id` status/delete (admin)
- `lib/store.js` — Vercel Blob store, one versioned JSON per comment + PNG crops
- `revisao.html` → `/revisao` — review page (token asked once), CSV/JSON export, "Copiar como missão"
- `proof/` — live verification screenshots (imported by `.github/workflows/import-proofs.yml`)
- `dev/` — local dev server + Playwright harness (`sixyearold.py`, `integrity.py`, `verify.py`)

## Fechamento automático dos comentários (resolvidos.json)

A ponte entre "o HTML mudou" e "o comentário está feito" é o arquivo `review/resolvidos.json`:

1. Quem corrige um comentário (worker do Claude Code, Cowork, qualquer um) adiciona um item **no mesmo commit** da correção:
   `{"id":"<id do comentário>","status":"Feito"|"Recusado","versao":"v99","nota":"o que mudou / por que recusado"}`
   (o `id` sai do feed `/revisao`, da missão "Copiar como missão", ou do thread do pin).
2. O push publica no Vercel. Na primeira chamada a `/api/comentarios` depois do deploy, `lib/resolver.js` aplica cada item **uma vez**:
   status muda, uma resposta "SYSTAAG · verificação — ✔ Feito na versão vNN — nota" entra na conversa, e o comentário guarda `resolvido:{versao,nota}`.
3. No site, pins só aparecem para Aberto/Aceito; o badge do 💬 conta só os abertos; a lista (💬 → 📋 Ver comentários) tem a seção **Resolvidos**
   com "mostrar na tela" para quem quiser ver os pins verdes de volta.

Sem segredo novo, sem cron, sem PATCH manual: o próprio deploy é a prova de que a correção está no ar. Regra para toda missão que mexe
em comentários: **só marcar Feito depois de verificar no link publicado** (Playwright, imagem lida de volta).
