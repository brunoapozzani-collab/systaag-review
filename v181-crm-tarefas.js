/* =====================================================================================================
   v181 · CRM — TAREFAS DUPLICADAS E ATRASADAS SEM MOTIVO (reunião de 06/11/2026, pedido do Bruno em 12/11)
   O que estava errado (visto nos dados do CRM):
     · o mesmo parceiro ficava com várias "próximas ações" abertas ao mesmo tempo — cada interação criava uma nova e a
       anterior nunca era fechada; o painel mostrava as antigas como ATRASADAS mesmo depois de alguém já ter falado
       com o parceiro;
     · a mesma ação aparecia duas vezes (mesmo parceiro, mesmo texto, abertas).
   Regra (agora e daqui para a frente) — e-mail de campanha (enviado em massa) não conta como interação:
     1. uma interação registrada com o parceiro FECHA as próximas ações dele que já estavam abertas antes dela
        (status "concluída", concluída na data da interação, ligada a ela) — a próxima ação nova, criada junto com a
        interação, é a única que fica aberta;
     2. duas ações abertas IGUAIS (mesmo parceiro, mesmo texto, mesma sugestão, mesma data) viram uma: a mais antiga fica,
        a cópia é cancelada;
     3. os passos da Régua pós-evento (D+7, D+30, D+45…) nunca são fechados por uma interação — são atividades marcadas.
   Na limpeza do que já existe, só as ações VENCIDAS (atrasadas) são fechadas pela regra 1.
   Cada tarefa alterada leva no campo "edicoes" o motivo e guarda o estado anterior em v181_antes (V181.desfazer()).
   A limpeza do que já existe roda UMA vez, depois que a nuvem do CRM (v171) terminou a primeira leitura.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v181)return;window.__v181=true;
if(typeof CRM_SERVER==='undefined'||!CRM_SERVER||typeof CRM_SERVER.api!=='function'){console.error('v181: CRM_SERVER ausente');return}
const V181=window.V181={};
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const d10=s=>String(s||'').slice(0,10);
const hoje=()=>new Date().toISOString().slice(0,10);
const dBR=s=>{s=d10(s);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s};
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const api0=CRM_SERVER.api;
const call=req=>{try{return JSON.parse(api0.call(CRM_SERVER,JSON.stringify(req))||'{}')}catch(e){console.error('v181 api',e);return {}}};
const tabelas=()=>T(()=>call({action:'loadAll'}).tables,{})||{};
const nota=(t,txt)=>{const e=String(t.edicoes||'');return (e?e+' | ':'')+txt};
const guarda=t=>{if(t.v181_antes===undefined)t.v181_antes=JSON.stringify({status:t.status,concluida_em:t.concluida_em||'',interacao_conclusao_id:t.interacao_conclusao_id||'',edicoes:t.edicoes||''})};

/* origem da tarefa = a data da interação que a criou (ou a data em que foi criada) */
function origem(t,porId){const i=porId.get(+t.interacao_id);return d10(i&&i.data)||d10(t.criado_em)}

/* calcula as mudanças para um conjunto de parceiros (ou todos) */
/* passos da Régua pós-evento são atividades marcadas (D+7, D+30…), não "próxima ação": nenhuma interação as fecha */
/* 12/11/2026 (conferência no Chrome): e-mail de CAMPANHA (o mesmo e-mail enviado para vários parceiros) não é conversa com
   o parceiro — não fecha a próxima ação dele. Duas ações (Roberto Migotto, Passarelli) tinham sido fechadas assim e foram reabertas. */
const campanha=i=>/CAMPANHA/.test(nz(i.resumo))||/CAMPANHA|MARKETING/.test(nz((i.acao||'')+' '+(i.acao_outra||'')));
const regua=t=>t.origem==='regua'||/^REGUA POS EVENTO/.test(nz(t.descricao));
function planeja(tb,soParceiros,modo){
  const tar=(tb.tarefas||[]),its=(tb.interacoes||[]);const porId=new Map(its.map(i=>[+i.id,i]));
  const itsPorP=new Map();its.forEach(i=>{const p=+i.parceiro_id;if(!p)return;(itsPorP.get(p)||itsPorP.set(p,[]).get(p)).push(i)});
  const ops=[];const fechadas=[],canceladas=[];const mexidas=new Set();
  const abertas=tar.filter(t=>t.status==='pendente'&&(!soParceiros||soParceiros.has(+t.parceiro_id)));
  /* 2 · duplicadas: mesmo parceiro + mesmo texto, abertas → fica a mais antiga */
  const grupos=new Map();abertas.forEach(t=>{const k=(+t.parceiro_id)+'|'+nz(t.descricao)+'|'+nz(t.sugestao)+'|'+d10(t.data_prevista);(grupos.get(k)||grupos.set(k,[]).get(k)).push(t)});
  grupos.forEach(g=>{if(g.length<2)return;g.sort((a,b)=>(+a.id)-(+b.id));g.slice(1).forEach(t=>{const r=Object.assign({},t);guarda(r);r.status='cancelada';r.edicoes=nota(r,'SYSTAAG '+dBR(hoje())+': cancelada — cópia da ação nº '+g[0].id+' (mesmo parceiro, texto e data)');ops.push({table:'tarefas',op:'update',row:r});canceladas.push(r);mexidas.add(+t.id)})});
  /* 1 · houve interação depois de a ação ser criada → a ação foi cumprida por ela */
  abertas.forEach(t=>{if(mexidas.has(+t.id)||regua(t))return;if(!(modo==='nova'||d10(t.data_prevista)<hoje()))return;const o=origem(t,porId);if(!o)return;
    const depois=(itsPorP.get(+t.parceiro_id)||[]).filter(i=>+i.id!==+t.interacao_id&&!campanha(i)&&d10(i.data)&&d10(i.data)>=o&&d10(i.data)<=hoje()&&(+i.id>+t.interacao_id||d10(i.data)>o)).sort((a,b)=>d10(a.data).localeCompare(d10(b.data))||(+a.id)-(+b.id));
    if(!depois.length)return;const i=depois[0];
    const r=Object.assign({},t);guarda(r);r.status='concluida';r.concluida_em=d10(i.data);r.interacao_conclusao_id=+i.id;
    r.edicoes=nota(r,'SYSTAAG '+dBR(hoje())+': concluída pela interação de '+dBR(i.data)+(i.responsavel?' ('+i.responsavel+')':'')+' — estava aberta como atrasada');
    ops.push({table:'tarefas',op:'update',row:r});fechadas.push(r);mexidas.add(+t.id)});
  return {ops,fechadas,canceladas}}
V181.planeja=()=>planeja(tabelas());

function aplica(ops){if(!ops.length)return;for(let i=0;i<ops.length;i+=150)CRM_SERVER.api(JSON.stringify({action:'batch',ops:ops.slice(i,i+150)}))}
function recarrega(){try{if(typeof window.systaagReload==='function')window.systaagReload()}catch(e){}}

/* ───── daqui para a frente: cada interação nova fecha o que estava aberto antes dela ───── */
CRM_SERVER.api=function(payload){const r=api0.apply(this,arguments);
  try{const req=JSON.parse(payload||'{}');const ps=new Set();
    if(req.action==='insert'&&req.table==='interacoes'&&req.row)ps.add(+req.row.parceiro_id);
    if(req.action==='batch')(req.ops||[]).forEach(o=>{if(o.table==='interacoes'&&o.op!=='update'&&o.row)ps.add(+o.row.parceiro_id)});
    ps.delete(0);ps.delete(NaN);
    if(ps.size){const p=planeja(tabelas(),ps,'nova');if(p.ops.length){for(let i=0;i<p.ops.length;i+=150)api0.call(CRM_SERVER,JSON.stringify({action:'batch',ops:p.ops.slice(i,i+150)}))}}
  }catch(e){console.error('v181 regra',e)}
  return r};

/* ───── a limpeza do que já existe (uma vez) ───── */
function limpezaUnica(){
  if(window.__TREINO)return;
  const P=T(()=>S.db.params,null);if(!P)return;if(P.v181_crm&&P.v181_crm.em)return;
  const p=planeja(tabelas());
  aplica(p.ops);
  P.v181_crm={em:new Date().toISOString(),por:T(()=>me().login,'')||T(()=>localStorage.getItem('systaag_quem'),'')||'sistema',fechadas:p.fechadas.length,canceladas:p.canceladas.length};
  try{save()}catch(e){}
  try{log('crm','v181','CRM: '+p.fechadas.length+' próximas ações fechadas (já houve interação depois delas) e '+p.canceladas.length+' cópias canceladas')}catch(e){}
  console.info('v181: CRM —',p.fechadas.length,'ações fechadas,',p.canceladas.length,'cópias canceladas');
  recarrega()}
V181.desfazer=function(){const tb=tabelas();const ops=[];(tb.tarefas||[]).forEach(t=>{if(t.v181_antes===undefined)return;const a=T(()=>JSON.parse(t.v181_antes),null);if(!a)return;const r=Object.assign({},t,a);delete r.v181_antes;ops.push({table:'tarefas',op:'update',row:r})});aplica(ops);recarrega();return ops.length};
if(!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url)setTimeout(limpezaUnica,3000);
else if(window.__v171pronto)setTimeout(limpezaUnica,500);
else window.addEventListener('v171-pronta',()=>setTimeout(limpezaUnica,500),{once:true});
})();
