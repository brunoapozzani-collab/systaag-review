// one-time cleanup (31/10/2026): deletes every stored comment and screenshot from the Blob store, then this file is removed
import { list, del } from '@vercel/blob';
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.searchParams.get('k') !== '447b90177eea39686cb6093e82e08b49') { res.statusCode = 403; return res.end('no'); }
  let n = 0, cursor;
  do { const r = await list({ cursor, limit: 1000 }); if (r.blobs.length) { await del(r.blobs.map(b => b.url)); n += r.blobs.length; } cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  const left = (await list({ limit: 100 })).blobs.length;
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ deleted: n, left }));
}
