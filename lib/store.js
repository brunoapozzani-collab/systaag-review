// Comment store on Vercel Blob (survives redeploys; one JSON object per comment, crops as PNG blobs).
const { put, list, del } = process.env.BLOB_MOCK ? await import('../dev/blob-mock.js') : await import('@vercel/blob');

const PREFIX = 'c/';
export const STATUSES = ['Aberto', 'Aceito', 'Feito', 'Recusado'];
export const TYPES = ['Mudar', 'Adicionar', 'Remover', 'Dúvida'];

export function newId() {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = Date.now().toString(36) + '-';
  for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

// Blob public URLs are CDN-cached (min 60 s). Reads go through a cache-busting query so updates are visible at once.
async function readJson(url) {
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
}

// Every write is a NEW blob (c/<id>/<ts>.json). Blob's CDN caches a URL for at least 60 s, so overwriting in place
// would serve stale status for up to a minute; a fresh pathname per version is never cached. Readers take the newest version.
function versionOf(pathname) { const m = /^c\/([^/]+)\/(\d+)\.json$/.exec(pathname); return m ? { id: m[1], ts: +m[2] } : null; }

async function latestBlobs(prefix) {
  const best = new Map(); let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const b of page.blobs) { const v = versionOf(b.pathname); if (!v) continue; const cur = best.get(v.id); if (!cur || cur.ts < v.ts) best.set(v.id, { ts: v.ts, url: b.url, pathname: b.pathname }); }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return best;
}

export async function saveComment(c) {
  const ts = Date.now();
  const pathname = PREFIX + c.id + '/' + ts + '.json';
  await put(pathname, JSON.stringify(c), { access: 'public', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 });
  // wait until the listing shows the new version, then drop the older versions
  for (let i = 0; i < 10; i++) {
    const best = await latestBlobs(PREFIX + c.id + '/');
    const cur = best.get(c.id);
    if (cur && cur.pathname === pathname) break;
    await new Promise(res => setTimeout(res, 200));
  }
  try {
    const page = await list({ prefix: PREFIX + c.id + '/', limit: 100 });
    const old = page.blobs.filter(b => b.pathname !== pathname).map(b => b.url);
    if (old.length) await del(old);
  } catch {}
  return c;
}

export async function saveCrop(id, dataUrl) {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > 4 * 1024 * 1024) return null;
  const b = await put('crops/' + id + '.png', buf, { access: 'public', contentType: 'image/png', addRandomSuffix: false, allowOverwrite: true });
  return b.url;
}

export async function listAll() {
  const best = await latestBlobs(PREFIX);
  const rows = await Promise.all([...best.values()].map(b => readJson(b.url)));
  const out = rows.filter(r => r && r.id);
  out.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
  return out;
}

export async function getComment(id) {
  const best = await latestBlobs(PREFIX + id + '/');
  const b = best.get(id);
  return b ? readJson(b.url) : null;
}

export async function deleteComment(c) {
  const urls = [];
  const page = await list({ prefix: PREFIX + c.id + '/', limit: 100 });
  for (const b of page.blobs) urls.push(b.url);
  if (c.crop) urls.push(c.crop);
  if (urls.length) await del(urls);
}

export function isAdmin(req) {
  const t = process.env.ADMIN_TOKEN;
  if (!t) return false;
  const url = new URL(req.url, 'http://x');
  const q = url.searchParams.get('token');
  const h = req.headers['x-admin-token'];
  const a = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return q === t || h === t || a === t;
}

// Rate limit by IP: 20 requests / minute per warm instance (best effort on serverless).
const hits = new Map();
export function rateLimited(req, limit = 20) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= limit) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let s = '';
  for await (const ch of req) s += ch;
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}

// What the public (anyone with the link) is allowed to see for pins/threads of one screen.
export function publicView(c) {
  const { outerHTML, ...rest } = c;
  return rest;
}
