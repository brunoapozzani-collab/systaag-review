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

export async function saveComment(c) {
  const body = JSON.stringify(c);
  const b = await put(PREFIX + c.id + '.json', body, {
    access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
  });
  // Blob overwrites propagate within ~1 s; wait until a fresh read returns what we wrote, so the next GET is never stale.
  for (let i = 0; i < 8; i++) {
    try { const r = await readJson(b.url); if (r && JSON.stringify(r) === body) break; } catch {}
    await new Promise(res => setTimeout(res, 250));
  }
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
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    const rows = await Promise.all(page.blobs.map(b => readJson(b.url)));
    for (const r of rows) if (r && r.id) out.push(r);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  out.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
  return out;
}

export async function getComment(id) {
  const page = await list({ prefix: PREFIX + id + '.json', limit: 1 });
  const b = page.blobs.find(x => x.pathname === PREFIX + id + '.json');
  return b ? readJson(b.url) : null;
}

export async function deleteComment(c) {
  const urls = [];
  const page = await list({ prefix: PREFIX + c.id + '.json', limit: 1 });
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
