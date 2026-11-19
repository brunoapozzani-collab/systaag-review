/* /api/fechamento — Fechamento semanal do CRM (19/11/2026)
   GET  ?modo=resumo   → os números da semana (JSON), sem enviar nada
   GET  ?modo=pdf      → o PDF da semana, sem enviar nada
   GET  ?modo=auto     → chamado a cada 10 min pelo agendador: envia SÓ se o envio automático estiver ligado,
                         se hoje for o dia escolhido na Base, se já passou da hora escolhida e se a semana ainda não foi enviada
   POST ?modo=enviar&confirmo=sim → envia agora (botão "Fechar a semana" / "Enviar agora")
   POST ?modo=config   → grava envio_auto / envio_dia / envio_hora / emails_painel (cartão da Base)
   Remetente: SMTP_USER (programacao04@taagbrasil.com.br) com SMTP_PASS — variáveis do projeto na Vercel. */
import nodemailer from 'nodemailer';
import { agoraSP, semanaDe, fmtBR, lerTabelas, cfg, cfgSet, gravar, resumo, corpoEmail, assunto, nomePdf, gerarPdf } from './_fech/core.js';

const TABELAS = ['parceiros', 'interacoes', 'tarefas', 'justificativas', 'listas', 'config', 'base:negociacoes'];
const DIAS = { 1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sábado', 7: 'domingo' };
const PADRAO = { envio_auto: '1', envio_dia: '5', envio_hora: '17:50' };

function destinatarios(T) { const e = cfg(T, 'emails_painel', ''); const vistos = {}; return String(e).split(/[;,\s]+/).map(x => x.trim().toLowerCase()).filter(x => x.indexOf('@') > 0 && !vistos[x] && (vistos[x] = 1)); }
function agenda(T) { return { ligado: cfg(T, 'envio_auto', PADRAO.envio_auto) !== '0', dia: +cfg(T, 'envio_dia', PADRAO.envio_dia) || 5, hora: (cfg(T, 'envio_hora', PADRAO.envio_hora) || '17:50').slice(0, 5), semana_enviada: cfg(T, 'semana_enviada', '') }; }
function geradoEm() { const a = agoraSP(); return fmtBR(a.iso) + ' ' + a.hora; }

async function montar() {
  const T = await lerTabelas(TABELAS);
  const a = agoraSP(); const w = semanaDe(a.iso);
  const R = resumo(T, w.ini, w.fim, a.iso);
  return { T, a, w, R };
}

async function enviar(T, R, por) {
  const lista = destinatarios(T);
  if (!lista.length) return { enviado: false, motivo: 'Nenhum destinatário (Base › Envio semanal do CRM)' };
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return { enviado: false, motivo: 'Remetente não configurado na Vercel (SMTP_USER / SMTP_PASS)' };
  let pdf = null, aviso = '';
  try { pdf = await gerarPdf(R, geradoEm()); } catch (e) { aviso = ' (sem anexo: ' + (e && e.message || e) + ')'; }
  let html = corpoEmail(R); if (aviso) html += '<p style="font-size:11px;color:#b3362b">Não foi possível gerar o PDF desta vez' + aviso + '.</p>';
  const tx = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const info = await tx.sendMail({ from: { name: 'FECHAMENTO SEMANAL - CRM', address: process.env.SMTP_USER }, to: lista.join(', '), subject: assunto(R), text: 'Fechamento semanal (abra em um leitor com HTML).', html,
    attachments: pdf ? [{ filename: nomePdf(R), content: pdf, contentType: 'application/pdf' }] : [] });
  await cfgSet(T, 'semana_enviada', R.ini, por);
  await cfgSet(T, 'envio_ultimo', new Date().toISOString() + ' · ' + por + ' · ' + lista.length + ' destinatário(s)', por);
  const resumoTxt = 'Interações ' + R.ints + ' · Eventos ' + R.eventos + ' · Ações concluídas ' + R.concluidas + ' · Atrasadas ' + R.atrasadas + ' · Indicações ' + R.recebidas + ' · Propostas enviadas ' + R.enviadas + ' · Fechadas ' + R.fechadas + ' · Perdidas ' + R.perdidas;
  const id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  await gravar([{ tabela: 'snapshots', id, dados: { id, semana_ini: R.ini, semana_fim: R.fim, gerado_em: new Date().toISOString(), gerado_por: por, resumo: resumoTxt, html } }], por);
  return { enviado: true, para: lista, de: process.env.SMTP_USER, anexo: !!pdf, semana: fmtBR(R.ini) + ' a ' + fmtBR(R.fim), id_mensagem: info && info.messageId, aviso };
}

async function lerCorpo(req) { if (req.body && typeof req.body === 'object') return req.body; let s = ''; for await (const c of req) s += c; try { return JSON.parse(s || '{}'); } catch (e) { return {}; } }

export default async function handler(req, res) {
  const modo = String((req.query && req.query.modo) || 'resumo');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET,POST'); res.setHeader('Access-Control-Allow-Headers', 'content-type'); return res.status(204).end(); }
  try {
    if (modo === 'resumo') { const { T, a, w, R } = await montar(); return res.status(200).json({ ok: true, agora: a, semana: w, agenda: agenda(T), destinatarios: destinatarios(T), remetente_ok: !!(process.env.SMTP_USER && process.env.SMTP_PASS), R }); }
    if (modo === 'pdf') { const { R } = await montar(); const pdf = await gerarPdf(R, geradoEm()); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', 'inline; filename="' + nomePdf(R) + '"'); return res.status(200).send(pdf); }
    if (modo === 'auto') {
      const { T, a, w, R } = await montar(); const g = agenda(T);
      if (!g.ligado) return res.status(200).json({ ok: true, enviado: false, motivo: 'Envio automático desligado na Base' });
      if (a.dow !== g.dia) return res.status(200).json({ ok: true, enviado: false, motivo: 'Hoje não é ' + DIAS[g.dia] });
      if (a.hora < g.hora) return res.status(200).json({ ok: true, enviado: false, motivo: 'Ainda não são ' + g.hora });
      if (g.semana_enviada === w.ini) return res.status(200).json({ ok: true, enviado: false, motivo: 'Semana ' + fmtBR(w.ini) + ' já enviada' });
      return res.status(200).json(Object.assign({ ok: true }, await enviar(T, R, 'ENVIO AUTOMÁTICO')));
    }
    if (modo === 'enviar') {
      if (req.method !== 'POST' || String(req.query.confirmo) !== 'sim') return res.status(400).json({ ok: false, erro: 'Use POST com confirmo=sim' });
      const { T, R } = await montar();
      const ult = cfg(T, 'envio_ultimo', ''); const t0 = Date.parse(ult.split(' · ')[0]);
      if (t0 && Date.now() - t0 < 10 * 60 * 1000) return res.status(429).json({ ok: false, erro: 'Um fechamento acabou de ser enviado (' + ult + '). Aguarde 10 minutos.' });
      const corpo = await lerCorpo(req);
      return res.status(200).json(Object.assign({ ok: true }, await enviar(T, R, String(corpo.por || 'ENVIO MANUAL').slice(0, 60))));
    }
    if (modo === 'config') {
      if (req.method !== 'POST') return res.status(400).json({ ok: false, erro: 'Use POST' });
      const corpo = await lerCorpo(req); const T = await lerTabelas(['config']); const por = String(corpo.por || 'BASE').slice(0, 60); const feito = {};
      if (corpo.envio_auto !== undefined) { await cfgSet(T, 'envio_auto', corpo.envio_auto ? '1' : '0', por); feito.envio_auto = corpo.envio_auto ? '1' : '0'; }
      if (corpo.envio_dia !== undefined) { const d = +corpo.envio_dia; if (!(d >= 1 && d <= 7)) return res.status(400).json({ ok: false, erro: 'Dia inválido (1=segunda … 7=domingo)' }); await cfgSet(T, 'envio_dia', String(d), por); feito.envio_dia = d; }
      if (corpo.envio_hora !== undefined) { const h = String(corpo.envio_hora); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) return res.status(400).json({ ok: false, erro: 'Hora inválida (HH:MM)' }); await cfgSet(T, 'envio_hora', h, por); feito.envio_hora = h; }
      if (corpo.emails_painel !== undefined) { const l = String(corpo.emails_painel).split(/[;,\s]+/).map(x => x.trim().toLowerCase()).filter(x => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)); if (!l.length) return res.status(400).json({ ok: false, erro: 'Nenhum e-mail válido' }); await cfgSet(T, 'emails_painel', [...new Set(l)].join(';'), por); feito.emails_painel = [...new Set(l)]; }
      return res.status(200).json({ ok: true, gravado: feito, agenda: agenda(T), destinatarios: destinatarios(T) });
    }
    return res.status(400).json({ ok: false, erro: 'modo desconhecido' });
  } catch (e) {
    console.error('fechamento', e);
    return res.status(500).json({ ok: false, erro: String(e && e.message || e) });
  }
}
