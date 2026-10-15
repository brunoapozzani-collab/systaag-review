// Local stand-in for @vercel/blob (dev/test only): files under dev/.blob, served by dev/server.js at /__blob/
import fs from 'node:fs/promises';
import path from 'node:path';
const DIR = path.resolve('dev/.blob');
const base = () => process.env.BLOB_MOCK_BASE || 'http://127.0.0.1:3000/__blob/';
export async function put(pathname, body, opts) {
  const f = path.join(DIR, pathname); await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, typeof body === 'string' ? body : Buffer.from(body));
  return { url: base() + pathname, pathname };
}
export async function list({ prefix = '' } = {}) {
  const out = [];
  async function walk(d, rel) { let ents = []; try { ents = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) { const r = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) await walk(path.join(d, e.name), r); else if (r.startsWith(prefix)) out.push({ url: base() + r, pathname: r }); } }
  await walk(DIR, '');
  return { blobs: out, hasMore: false };
}
export async function del(urls) { for (const u of [].concat(urls)) { const rel = u.replace(base(), ''); try { await fs.unlink(path.join(DIR, rel)); } catch {} } }
