// Applies review/resolvidos.json to the comment store — the bridge between "the HTML changed" and "the comment is done".
//
// The worker that fixes a comment adds an entry to review/resolvidos.json IN THE SAME COMMIT as the fix:
//   { "id": "<comment id>", "status": "Feito" | "Recusado", "versao": "v99", "nota": "what changed / why refused" }
// When that commit is deployed, the first request to /api/comentarios applies the entry: status flips, a reply by
// "SYSTAAG · verificação" is added to the thread, and the comment carries `resolvido: {versao, nota, ts}` so the entry is
// applied exactly once. No secret, no cron, no manual PATCH: the deploy itself is the proof that the fix is live.
import { STATUSES, saveComment } from './store.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export function loadResolvidos() {
  try { const j = require('../review/resolvidos.json'); return Array.isArray(j.itens) ? j.itens : []; } catch { return []; }
}

export async function applyResolvidos(rows) {
  const itens = loadResolvidos();
  if (!itens.length) return rows;
  const byId = new Map(rows.map(c => [c.id, c]));
  let changed = false;
  for (const it of itens) {
    if (!it || !it.id || !STATUSES.includes(it.status)) continue;
    const c = byId.get(it.id);
    if (!c || c.parentId) continue;
    const key = String(it.versao || '') + '|' + it.status;
    if (c.resolvido && c.resolvido.key === key) continue; // already applied
    const ts = new Date().toISOString();
    c.status = it.status; c.statusTs = ts;
    c.resolvido = { key, versao: it.versao || '', nota: it.nota || '', ts };
    await saveComment(c);
    const rid = c.id + '-res-' + key.replace(/[^a-z0-9]/gi, '').slice(0, 24);
    if (!byId.has(rid)) {
      const r = { id: rid, parentId: c.id, screen: c.screen, author: 'SYSTAAG · verificação', ts,
        text: (it.status === 'Feito' ? '✔ Feito' : '✖ Recusado') + (it.versao ? ' na versão ' + it.versao : '') + (it.nota ? ' — ' + it.nota : '') };
      await saveComment(r); rows.push(r); byId.set(rid, r);
    }
    changed = true;
  }
  if (changed) rows.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
  return rows;
}
