/* Fechamento semanal do CRM — servidor (19/11/2026)
   Mesmas regras do Code.gs 2.9.0 do Tito (resumoServidor / montarRelatorio / corpoEmailServ), lendo a base
   compartilhada do protótipo (Supabase, tabela crm_registros) em vez da planilha. O layout do PDF é o mesmo do
   "Fechamento_semanal_…pdf" que o Tito enviou (2 páginas A4: Relacionamento · Disciplina · Base | Comercial). */
import PDFDocument from 'pdfkit';
import { LOGO_TAAG_B64 } from './logo.js';
import F300 from './font300.js';
import F400 from './font400.js';
import F600 from './font600.js';

export const SUPA_URL = 'https://qptluvvsfhtkbbjaphad.supabase.co';
export const SUPA_KEY = 'sb_publishable_CY_sKGogvrohbRqcchKeBw_wWLDJ4ne'; /* chave pública (a mesma do nuvem-config.js) */
const H = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };
export const TZ = 'America/Sao_Paulo';

/* ───────── datas (fuso de São Paulo) ───────── */
export function agoraSP() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  const dow = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p.weekday];
  return { iso: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}`, dow };
}
export function addDias(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function semanaDe(iso) { const d = new Date(iso + 'T12:00:00Z'); const dow = (d.getUTCDay() + 6) % 7; const ini = addDias(iso, -dow); return { ini, fim: addDias(ini, 6) }; }
export const fmtBR = iso => { iso = String(iso || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : String(iso || ''); };
const iso10 = v => (v ? String(v).slice(0, 10) : '');

/* ───────── leitura da base compartilhada ───────── */
export async function lerTabelas(nomes) {
  const out = {}; nomes.forEach(n => (out[n] = []));
  const lista = nomes.map(n => (n.includes(':') ? `"${n}"` : n)).join(',');
  let off = 0; const lim = 1000;
  for (;;) {
    const q = `${SUPA_URL}/rest/v1/crm_registros?select=tabela,id,dados,apagado&tabela=in.(${encodeURIComponent(lista)})&order=tabela.asc,id.asc&offset=${off}&limit=${lim}`;
    const r = await fetch(q, { headers: H });
    if (!r.ok) throw new Error('Supabase ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const rows = await r.json();
    rows.forEach(x => { if (!x.apagado && out[x.tabela]) { const d = x.dados || {}; if (d.id === undefined || d.id === '') d.id = isNaN(+x.id) ? x.id : +x.id; out[x.tabela].push(d); } });
    if (rows.length < lim) break; off += lim;
  }
  return out;
}

/* config (tabela "config" do CRM: {id, chave, valor}) */
export function cfg(T, chave, def) { const r = (T.config || []).find(c => c.chave === chave); return r ? String(r.valor ?? '') : def; }
export async function cfgSet(T, chave, valor, por) {
  let r = (T.config || []).find(c => c.chave === chave);
  if (r) r = Object.assign({}, r, { valor: String(valor) });
  else r = { id: Date.now() * 1000 + Math.floor(Math.random() * 1000), chave, valor: String(valor) };
  await gravar([{ tabela: 'config', id: String(r.id), dados: r }], por);
  T.config = (T.config || []).filter(c => c.chave !== chave).concat([r]);
}
export async function gravar(regs, por) {
  const agora = new Date().toISOString();
  const body = regs.map(x => ({ tabela: x.tabela, id: String(x.id), dados: x.dados, apagado: false, atualizado_em: agora, por: por || 'ENVIO AUTOMÁTICO', origem: 'servidor-fechamento' }));
  const r = await fetch(`${SUPA_URL}/rest/v1/crm_registros?on_conflict=tabela,id`, { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, H), body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Supabase gravar ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

/* ───────── Pipeline do protótipo (mesma regra do pipelineRows / oppStatus do CRM no protótipo) ───────── */
const DEAL_ETAPA = { desenvolver: 'DESENVOLVER PROPOSTA', desenvolvida: 'PROPOSTA DESENVOLVIDA', aguardando: 'AGUARDANDO APRESENTAÇÃO', enviada: 'PROPOSTA ENVIADA', revisao: 'REVISÃO DE PROPOSTA' };
const oppStatus = n => n.status_pipeline || (n.resultado === 'fechada' ? 'FECHADO' : n.resultado === 'perdida' ? 'PERDIDO' : n.resultado === 'futuro' ? 'FUTURO' : DEAL_ETAPA[n.etapa] || 'DESENVOLVER PROPOSTA');
/* 19/11 (Bruno: "o Pipeline da Vercel agora tem a informação certa"): cada negociação da Pipeline guarda a SUA linha da
   planilha To Do Comercial (n.planilha.c — as 17 colunas como estão). O fechamento lê essas colunas, exatamente como o
   Code.gs do Tito lia a aba Pipeline: STATUS, CONSULTOR, RECEBIMENTO DA INDICAÇÃO, DATA DE ENVIO, DATA DE DECISÃO.
   Negociação sem linha da planilha (saiu dela) não entra — a Pipeline é a planilha. */
const isoBR = v => { const m = String(v || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : (/^\d{4}-\d{2}-\d{2}/.test(String(v || '')) ? String(v).slice(0, 10) : ''); };
export function pipeline(negs) {
  const vivas = (negs || []).filter(n => !n.demo);
  const daPlanilha = vivas.filter(n => n.planilha && Array.isArray(n.planilha.c));
  if (daPlanilha.length) return daPlanilha.map(n => { const c = n.planilha.c; return { consultor: c[4], status: String(c[10] || '').toUpperCase(), data_indicacao: isoBR(c[1]), data_envio: isoBR(c[11]), data_decisao: isoBR(c[13]) }; });
  return vivas.map(n => ({ consultor: n.consultor, status: oppStatus(n), data_indicacao: n.criado || '', data_envio: n.data_envio || '', data_decisao: n.data_decisao || '' }));
}

/* ───────── os números (= resumoServidor do Code.gs 2.9.0) ───────── */
const consultoresDe = o => String(o.consultor || '').split(/\s*(?:\/|,|;|\+|&|\be\b)\s*/i).map(x => x.trim()).filter(Boolean).map(x => x.charAt(0).toUpperCase() + x.slice(1));
const contaPor = (arr, fn) => { const m = {}; arr.forEach(x => { const k = fn(x) || '(vazio)'; m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(k => [k, m[k]]).sort((a, b) => b[1] - a[1]); };
export function resumo(T, ini, fim, hoje) {
  const noPer = d => { d = iso10(d); return !!d && d >= ini && d <= fim; };
  const chave = {}; (T.listas || []).forEach(r => { if (r.lista === 'status') chave[String(r.valor)] = String(r.chave || r.valor); });
  const sk = v => chave[String(v)] || String(v);
  const pars = T.parceiros || [], ints = T.interacoes || [], tars = T.tarefas || [], just = T.justificativas || [], pipe = pipeline(T['base:negociacoes']);
  const nome = {}; pars.forEach(p => { nome[Number(p.id)] = p.nome; });
  const conta = i => !(i.origem === 'anotacao' || i.origem === 'ajuste' || i.tipo_contato === 'ANOTAÇÃO' || i.tipo_contato === 'AJUSTE DE BASE');
  const evento = i => i.acao && i.acao !== 'Outra';
  const I = ints.filter(i => conta(i) && noPer(i.data));
  const E = I.filter(evento), L = E.filter(i => /LABS/i.test(i.acao));
  const base = pars.filter(p => ['Frio', 'Em aquecimento', 'Ativo'].indexOf(sk(p.status)) >= 0);
  const cont = {}; I.forEach(i => { cont[Number(i.parceiro_id)] = 1; });
  const contBase = base.filter(p => cont[Number(p.id)]);
  const pend = tars.filter(t => t.status === 'pendente'), atr = pend.filter(t => iso10(t.data_prevista) < hoje);
  const conc = tars.filter(t => t.status === 'concluida' && noPer(t.concluida_em));
  const comPend = {}; pend.forEach(t => { comPend[Number(t.parceiro_id)] = 1; });
  const mud = just.filter(j => j.campo === 'Status do relacionamento' && noPer(j.data_alteracao));
  const vir = [], vista = {}; mud.filter(j => sk(j.para) === 'Ativo').forEach(j => { if (!vista[j.parceiro_id]) { vista[j.parceiro_id] = 1; vir.push(j); } });
  const NEG = /DESENVOLVER|DESENVOLVIDA|AGUARDANDO|APRESENTA|REVIS|ENVIADA|AÇÃO MKT|ACAO MKT/i;
  const rec = pipe.filter(o => noPer(o.data_indicacao)), env = pipe.filter(o => noPer(o.data_envio));
  const fec = pipe.filter(o => /FECHAD/.test(o.status) && noPer(o.data_decisao)), per = pipe.filter(o => /PERDID/.test(o.status) && noPer(o.data_decisao));
  const neg = pipe.filter(o => NEG.test(o.status));
  const cons = {}; const add = (lista, k) => lista.forEach(o => consultoresDe(o).forEach(c => { cons[c] = cons[c] || { c, rec: 0, env: 0, fec: 0, per: 0, neg: 0 }; cons[c][k]++; }));
  add(rec, 'rec'); add(env, 'env'); add(fec, 'fec'); add(per, 'per'); add(neg, 'neg');
  const porCons = Object.values(cons).sort((a, b) => b.rec - a.rec || b.neg - a.neg);
  const meses = []; const [fy, fm] = fim.slice(0, 7).split('-').map(Number);
  for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(fy, fm - 1 - i, 1)); meses.push(d.toISOString().slice(0, 7)); }
  const fechMes = meses.map(m => [m.slice(5, 7) + '/' + m.slice(2, 4), pipe.filter(o => /FECHAD/.test(o.status) && String(o.data_decisao || '').slice(0, 7) === m).length]);
  return {
    ini, fim, ints: I.length, parcContatados: Object.keys(cont).length, receptivos: I.filter(i => i.resultado === 'Receptivo').length,
    base: base.length, contBase: contBase.length, semContato: base.length - contBase.length, eventos: E.length, labs: L.length,
    concluidas: conc.length, pendentes: pend.length, atrasadas: atr.length, emDia: pend.length ? Math.round((pend.length - atr.length) / pend.length * 100) : 100,
    semResp: pend.filter(t => !t.responsavel).length, semProx: base.filter(p => !comPend[Number(p.id)]).length,
    novos: pars.filter(p => noPer(p.criado_em)).length, mudStatus: mud.length, viraram: vir.map(j => [fmtBR(iso10(j.data_alteracao)), nome[Number(j.parceiro_id)] || '', String(j.de || '')]),
    recebidas: rec.length, enviadas: env.length, fechadas: fec.length, perdidas: per.length, negociacao: neg.length, porCons, fechMes,
    intsResp: contaPor(I, i => i.responsavel || '(sem responsável)'), atrResp: contaPor(atr, t => t.responsavel || '(sem responsável)'),
    eventosLista: E.slice().sort((a, b) => String(a.data).localeCompare(String(b.data))).slice(0, 12).map(i => [fmtBR(iso10(i.data)), nome[Number(i.parceiro_id)] || '', i.acao === 'OUTRO' ? 'OUTRO · ' + (i.acao_outra || '') : i.acao]),
    contagens: { parceiros: pars.length, interacoes: ints.length, tarefas: tars.length, justificativas: just.length, pipeline: pipe.length }
  };
}

/* ───────── corpo do e-mail (= corpoEmailServ) ───────── */
export function corpoEmail(R) {
  const td = (n, l) => '<td style="padding:10px 14px;border:1px solid #DDD8D6"><div style="font-size:22px;font-weight:300;color:#231F20">' + n + '</div><div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#231F20">' + l + '</div></td>';
  return '<div style="font-family:Inter,Arial,sans-serif;color:#231F20;max-width:640px"><div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#B57A50">Fechamento semanal · CRM</div>' +
    '<div style="font-size:20px;font-weight:300;margin:6px 0 12px">Semana ' + fmtBR(R.ini) + ' a ' + fmtBR(R.fim) + '</div><table style="border-collapse:collapse"><tr>' + td(R.ints, 'Interações') + td(R.eventos, 'Eventos') + td(R.concluidas, 'Ações concluídas') + '</tr><tr>' + td(R.atrasadas, 'Ações atrasadas') + td(R.recebidas, 'Indicações recebidas') + td(R.fechadas, 'Fechadas') + '</tr></table>' +
    '<p style="font-size:12px;margin-top:14px">O relatório completo está no PDF anexo.</p></div>';
}
export const assunto = R => 'Fechamento semanal TAAG · semana ' + fmtBR(R.ini) + ' a ' + fmtBR(R.fim);
export const nomePdf = R => 'Fechamento_semanal_' + R.ini + '_a_' + R.fim + '.pdf';

/* ───────── o PDF (mesmo desenho do PDF do Tito) ───────── */
const PRETO = '#231F20', COBRE = '#B57A50', LINHA = '#DDD8D6', CINZA = '#6B6465', VERM = '#C8372D';
export function gerarPdf(R, geradoEm) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 32, bottom: 32, left: 32, right: 32 }, info: { Title: 'Fechamento semanal ' + fmtBR(R.ini) + ' a ' + fmtBR(R.fim), Author: 'CRM-SysTAAG' } });
    const bufs = []; doc.on('data', b => bufs.push(b)); doc.on('end', () => resolve(Buffer.concat(bufs))); doc.on('error', reject);
    doc.registerFont('L', Buffer.from(F300, 'base64')); doc.registerFont('R', Buffer.from(F400, 'base64')); doc.registerFont('B', Buffer.from(F600, 'base64'));
    const X0 = 32, W = 595 - 64, BOT = 842 - 40;
    let y = 32;
    const txt = (s, x, yy, o = {}) => { doc.font(o.f || 'R').fontSize(o.s || 8).fillColor(o.c || PRETO).text(String(s), x, yy, Object.assign({ lineBreak: false }, o.w ? { width: o.w, align: o.a || 'left', ellipsis: true } : {})); };
    const precisa = h => { if (y + h > BOT) { doc.addPage(); y = 32; } };
    /* cabeçalho */
    txt('CRM · RELACIONAMENTO E COMERCIAL', X0, y, { s: 7, c: COBRE }); y += 12;
    txt('Fechamento semanal', X0, y, { f: 'L', s: 20 }); y += 26;
    doc.font('R').fontSize(8).fillColor(CINZA).text('Semana ' + fmtBR(R.ini) + ' a ' + fmtBR(R.fim) + ' · envio automático', X0, y, { lineBreak: false, oblique: true }); y += 14;
    try { doc.image(Buffer.from(LOGO_TAAG_B64, 'base64'), X0 + W - 120, 34, { width: 120 }); } catch (e) {}
    doc.moveTo(X0, y).lineTo(X0 + W, y).lineWidth(0.8).strokeColor(PRETO).stroke(); y += 16;
    const secao = t => { precisa(80); doc.rect(X0, y, 2, 10).fill(COBRE); txt(t.toUpperCase(), X0 + 6, y + 1, { f: 'B', s: 7 }); y += 12; doc.moveTo(X0, y).lineTo(X0 + W, y).lineWidth(0.5).strokeColor(LINHA).stroke(); y += 2; };
    const kpis = lista => { const bw = W / 4, bh = 46; precisa(bh + 8);
      lista.forEach((k, i) => { const x = X0 + i * bw; doc.rect(x, y, bw, bh).lineWidth(0.6).strokeColor(LINHA).stroke();
        txt(k[0], x + 4, y + 3, { f: 'L', s: 18, w: bw - 8, a: 'right' });
        txt(String(k[1]).toUpperCase(), x + 4, y + 26, { s: 5.6, w: bw - 8 });
        doc.moveTo(x, y + 34).lineTo(x + bw, y + 34).lineWidth(0.4).strokeColor(LINHA).stroke();
        txt(k[2] || '', x + 4, y + 37, { s: 5.6, c: CINZA, w: bw - 8 }); });
      y += bh + 14; };
    /* tabela; devolve a altura usada */
    const tabela = (x, hdr, rows, larg) => { if (!rows.length) { txt('Sem dados.', x, y + 4, { s: 8, c: CINZA }); return 28; }
      const lw = larg || hdr.map(() => 62); let yy = y;
      hdr.forEach((h, j) => { txt(h.toUpperCase(), x + lw.slice(0, j).reduce((a, b) => a + b, 0), yy, { f: 'B', s: 5.8, w: lw[j] - 4, a: j > 0 && typeof rows[0][j] === 'number' ? 'right' : 'left' }); });
      yy += 10; const tw = lw.reduce((a, b) => a + b, 0); doc.moveTo(x, yy).lineTo(x + tw, yy).lineWidth(0.7).strokeColor(PRETO).stroke();
      rows.forEach(row => { yy += 3; row.forEach((v, j) => { txt(v, x + lw.slice(0, j).reduce((a, b) => a + b, 0), yy, { s: 7, w: lw[j] - 4, a: typeof v === 'number' ? 'right' : 'left' }); });
        yy += 10; doc.moveTo(x, yy).lineTo(x + tw, yy).lineWidth(0.4).strokeColor(LINHA).stroke(); });
      return yy - y + 4; };
    /* gráfico de barras horizontais */
    const barras = (x, w, rows, titulo, cor) => { if (rows.length < 1) return 0; const h = 20 + rows.length * 16 + 22; doc.rect(x, y, w, h).lineWidth(0.6).strokeColor('#999999').stroke();
      txt(titulo, x + 6, y + 5, { s: 7 }); const max = Math.max(...rows.map(r => r[1]), 1); const esc = Math.ceil(max / 10) * 10 || 10;
      const lx = x + 62, aw = w - 62 - 14; rows.forEach((r, i) => { const yy = y + 20 + i * 16; txt(String(r[0]).split(' ')[0], x + 4, yy + 2, { s: 6.6, w: 54, a: 'right' }); doc.rect(lx, yy, Math.max(1, aw * r[1] / esc), 10).fill(cor); });
      const by = y + 20 + rows.length * 16 + 2; doc.moveTo(lx, by).lineTo(lx + aw, by).lineWidth(0.5).strokeColor('#333333').stroke();
      for (let k = 0; k <= 4; k++) txt(Math.round(esc * k / 4), lx + aw * k / 4 - 8, by + 3, { s: 6, w: 16, a: 'center' });
      return h; };
    /* gráfico de colunas (fechados por mês) */
    const colunas = (x, w, rows, titulo, cor) => { const h = 150; doc.rect(x, y, w, h).lineWidth(0.6).strokeColor('#999999').stroke(); txt(titulo, x + 6, y + 5, { s: 7 });
      const max = Math.max(...rows.map(r => r[1]), 1); const lx = x + 30, aw = w - 40, ah = 80, by = y + 22 + ah; const cw = aw / rows.length;
      for (let k = 0; k <= 4; k++) { const v = max * k / 4; const yy = by - ah * k / 4; txt(Number.isInteger(v) ? v : v.toFixed(2).replace('.', ','), x + 2, yy - 4, { s: 6, w: 24, a: 'right' }); doc.moveTo(lx, yy).lineTo(lx + aw, yy).lineWidth(0.3).strokeColor('#CCCCCC').stroke(); }
      rows.forEach((r, i) => { const bh2 = ah * r[1] / max; if (r[1] > 0) doc.rect(lx + i * cw + cw * 0.15, by - bh2, cw * 0.7, bh2).fill(cor); doc.save(); doc.rotate(-45, { origin: [lx + i * cw + cw * 0.6, by + 6] }); doc.font('R').fontSize(6).fillColor(PRETO).text(r[0], lx + i * cw + cw * 0.6 - 22, by + 4, { lineBreak: false, width: 22, align: 'right' }); doc.restore(); });
      return h; };

    /* Relacionamento */
    secao('Relacionamento');
    kpis([[R.ints, 'Interações', R.parcContatados + ' parceiro(s) · ' + R.receptivos + ' receptivo(s)'], [R.contBase, 'Parceiros contatados', (R.base ? Math.round(R.contBase / R.base * 100) : 0) + '% da base em trabalho'], [R.eventos, 'Eventos realizados', R.labs + ' Taag Labs'], [R.semContato, 'Sem contato', 'Frio, Em aquecimento e Ativo']]);
    { const rows = R.intsResp.slice(0, 8); precisa(Math.max(rows.length * 13 + 30, 40)); const h1 = tabela(X0, ['Responsável', 'Interações'], rows, [110, 60]); const h2 = barras(X0 + W / 2, W / 2, rows, 'Interações por responsável', PRETO); y += Math.max(h1, h2) + 14; }
    /* Disciplina */
    secao('Disciplina da equipe');
    kpis([[R.concluidas, 'Ações concluídas', ''], [R.emDia + '%', 'Ações em dia', R.atrasadas + ' atrasada(s) de ' + R.pendentes], [R.semProx, 'Sem próxima ação', 'parceiros em trabalho'], [R.semResp, 'Ações sem responsável', '']]);
    { const rows = R.atrResp.slice(0, 8); precisa(Math.max(rows.length * 16 + 50, 40)); const h1 = tabela(X0, ['Responsável', 'Atrasadas'], rows, [110, 60]); const h2 = barras(X0 + W / 2, W / 2, rows, 'Ações atrasadas por responsável', VERM); y += Math.max(h1, h2) + 14; }
    /* Base */
    secao('Base de parceiros');
    kpis([[R.base, 'Base em trabalho', 'Frio, Em aquecimento e Ativo'], [R.novos, 'Novos cadastros', ''], [R.viraram.length, 'Viraram Ativo', ''], [R.mudStatus, 'Mudanças de status', '']]);
    precisa(Math.max(R.eventosLista.length * 13 + 30, 30)); y += tabela(X0, ['Data', 'Parceiro', 'Evento'], R.eventosLista, [60, 170, 170]) + 8;
    if (R.viraram.length) { const rows = R.viraram.slice(0, 10); precisa(rows.length * 13 + 30); y += tabela(X0, ['Data', 'Tornou-se Ativo', 'Status anterior'], rows, [60, 170, 120]) + 8; }
    /* Comercial — sempre na página 2, como no PDF do Tito */
    doc.addPage(); y = 32;
    secao('Comercial');
    kpis([[R.recebidas, 'Indicações recebidas', ''], [R.enviadas, 'Propostas enviadas', ''], [R.fechadas, 'Fechadas', R.perdidas + ' perdida(s) · data de decisão'], [R.negociacao, 'Em negociação', 'hoje']]);
    y += tabela(X0, ['Consultor', 'Recebidas', 'Propostas', 'Fechadas', 'Perdidas', 'Negociação'], R.porCons.map(x => [x.c, x.rec, x.env, x.fec, x.per, x.neg]), [70, 56, 56, 56, 56, 56]) + 14;
    { precisa(170); const h1 = tabela(X0, ['Mês', 'Fechados'], R.fechMes, [60, 50]); const h2 = colunas(X0 + 122, 220, R.fechMes, 'Fechados por mês (data de decisão)', COBRE); y += Math.max(h1, h2) + 14; }
    txt('Gerado automaticamente em ' + geradoEm + ' · CRM-SysTAAG', X0, y, { s: 6, c: CINZA });
    doc.end();
  });
}
