// POST /api/comentarios  → create comment or reply (anyone with the link; 20/min per IP)
// GET  /api/comentarios?token=…[&screen=&author=&status=&type=]  → full feed (admin)
// GET  /api/comentarios?screen=#/rota  → that screen's threads (public, for pins)
import { STATUSES, TYPES, newId, saveComment, saveCrop, listAll, getComment, isAdmin, rateLimited, json, readBody, publicView } from '../../lib/store.js';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

const str = (v, n) => (typeof v === 'string' ? v : '').trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, x-admin-token, authorization');
  res.setHeader('access-control-allow-methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    const screen = url.searchParams.get('screen');
    const admin = isAdmin(req);
    if (!admin && !screen) return json(res, 401, { error: 'token inválido' });
    let rows = await listAll();
    if (screen) rows = rows.filter(c => c.screen === screen);
    const f = k => url.searchParams.get(k);
    if (f('author')) rows = rows.filter(c => (c.author || '').toLowerCase().includes(f('author').toLowerCase()));
    if (f('status')) rows = rows.filter(c => c.status === f('status'));
    if (f('type')) rows = rows.filter(c => c.type === f('type'));
    if (f('q')) { const q = f('q').toLowerCase(); rows = rows.filter(c => JSON.stringify(c).toLowerCase().includes(q)); }
    return json(res, 200, { count: rows.length, comentarios: admin ? rows : rows.map(publicView) });
  }

  if (req.method === 'POST') {
    if (rateLimited(req, 20)) return json(res, 429, { error: 'Muitos envios. Espere um minuto.' });
    const b = await readBody(req);
    const author = str(b.author, 60), text = str(b.text, 4000);
    if (!author || !text) return json(res, 400, { error: 'Nome e comentário são obrigatórios.' });
    const id = newId();
    const ts = new Date().toISOString();
    if (b.parentId) {
      const parent = await getComment(str(b.parentId, 40));
      if (!parent || parent.parentId) return json(res, 404, { error: 'comentário original não encontrado' });
      const c = { id, parentId: parent.id, screen: parent.screen, author, text, ts };
      await saveComment(c);
      return json(res, 201, c);
    }
    const whole = !!b.whole;
    const screen = str(b.screen, 200) || '#/';
    if (!whole && !str(b.path, 1000)) return json(res, 400, { error: 'Escolha um elemento ou a tela inteira.' });
    let crop = null;
    try { crop = await saveCrop(id, b.crop); } catch (e) { crop = null; }
    const c = {
      id, parentId: null, screen, screenTitle: str(b.screenTitle, 200),
      whole, label: whole ? 'tela inteira' : str(b.label, 120), tag: whole ? 'screen' : str(b.tag, 40),
      path: whole ? '' : str(b.path, 1000), outerHTML: whole ? '' : str(b.outerHTML, 500),
      box: b.box && typeof b.box === 'object' ? { x: +b.box.x || 0, y: +b.box.y || 0, w: +b.box.w || 0, h: +b.box.h || 0, vw: +b.box.vw || 0, vh: +b.box.vh || 0, sx: +b.box.sx || 0, sy: +b.box.sy || 0 } : null,
      crop, theme: str(b.theme, 10) || 'light', device: str(b.device, 10) || 'desktop',
      author, type: TYPES.includes(b.type) ? b.type : 'Mudar', text, status: STATUSES[0], ts,
      ua: str(req.headers['user-agent'], 200),
    };
    await saveComment(c);
    return json(res, 201, c);
  }
  return json(res, 405, { error: 'método não suportado' });
}
