// Local dev server mirroring the Vercel routing: / → index.html, /revisao, /api/comentarios[/id], /proof/*, /__blob/* (mock store)
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
process.env.BLOB_MOCK = '1';
process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'devtoken-devtoken-devtoken-devtok';
const col = (await import('../api/comentarios/index.js')).default;
const one = (await import('../api/comentarios/[id].js')).default;
const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv' };
async function serveFile(res, f) { try { const b = await fs.readFile(f); res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end('not found'); } }
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/api/comentarios') return await col(req, res);
    const m = /^\/api\/comentarios\/([^/]+)$/.exec(u.pathname);
    if (m) { req.query = { id: decodeURIComponent(m[1]) }; return await one(req, res); }
    if (u.pathname.startsWith('/__blob/')) return serveFile(res, path.join('dev/.blob', u.pathname.slice(8)));
    if (u.pathname === '/' || u.pathname === '/index.html') return serveFile(res, 'index.html');
    if (u.pathname === '/revisao' || u.pathname === '/revisao.html') return serveFile(res, 'revisao.html');
    if (u.pathname === '/proof' || u.pathname === '/proof/') return serveFile(res, 'proof/index.html');
    return serveFile(res, '.' + u.pathname);
  } catch (e) { console.error(e); res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: String(e.message || e) })); }
}).listen(process.env.PORT || 3000, () => console.log('dev on http://127.0.0.1:' + (process.env.PORT || 3000)));
