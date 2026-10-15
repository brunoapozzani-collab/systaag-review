// PATCH /api/comentarios/:id  (admin token)  body: {status:"Aceito"} | {delete:true}
// DELETE /api/comentarios/:id (admin token)
import { STATUSES, saveComment, getComment, deleteComment, listAll, isAdmin, json, readBody } from '../../lib/store.js';

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, x-admin-token, authorization');
  res.setHeader('access-control-allow-methods', 'GET, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const id = String(req.query?.id || new URL(req.url, 'http://x').pathname.split('/').pop() || '').slice(0, 40);
  if (req.method === 'GET') {
    const c = await getComment(id);
    if (!c) return json(res, 404, { error: 'não encontrado' });
    const replies = (await listAll()).filter(x => x.parentId === id);
    return json(res, 200, { ...c, replies });
  }
  if (!isAdmin(req)) return json(res, 401, { error: 'token inválido' });
  const c = await getComment(id);
  if (!c) return json(res, 404, { error: 'não encontrado' });
  const b = req.method === 'DELETE' ? { delete: true } : await readBody(req);
  if (b.delete) {
    const all = await listAll();
    for (const r of all.filter(x => x.parentId === id)) await deleteComment(r);
    await deleteComment(c);
    return json(res, 200, { deleted: id });
  }
  if (b.status) {
    if (!STATUSES.includes(b.status)) return json(res, 400, { error: 'status inválido' });
    c.status = b.status; c.statusTs = new Date().toISOString();
    await saveComment(c);
    return json(res, 200, c);
  }
  return json(res, 400, { error: 'nada para alterar' });
}
