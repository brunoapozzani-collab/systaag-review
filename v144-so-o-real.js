/* v144 · SÓ O QUE É REAL (Bruno, 03/11/2026)
   "Eu só trabalho com informação real." Os registros que o protótipo semeou para demonstração saem da Base, em todos os
   departamentos: as propostas demo (e os itens delas), as 22 negociações demo, os clientes e obras que só existiam para a
   demonstração, as O.S. e atendimentos de exemplo do Pós-venda, as unidades de estoque, pedidos, entradas e saídas de
   exemplo, as tarefas de exemplo, os holerites e os salários de exemplo da folha (as pessoas ficam; o salário vai a 0 até
   o Financeiro real subir a folha).
   Regra para não apagar nada real: um cliente/obra só sai se NÃO está na planilha To Do Comercial (aba Pipeline) pelo nome
   E tudo que aponta para ele é demonstração. Clientes que vieram da Pipeline ou da Planilha Mestra ficam.
   Antes de apagar, a base inteira é guardada na Base › Mapa de entidades › Zona de risco (restaurável). */
(function(){
'use strict';
if(window.__v144)return;window.__v144=true;
if(typeof S==='undefined'||!S.db)return;
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const SEED_CLI=new Set(['c1','c2','c3','c4','c5','c6','c7','c8','c_vmb','c_xl']);
const SEED_NOMES=new Set(['FOCAL POWERED BY NAIM','ARPOADOR SUNSET','FERNANDA SALZANO','CASA P863 ILHABELA']);
const orfaSemente=(db,c)=>!c.origem&&SEED_NOMES.has(nz(c.nome))&&!(db.propostas||[]).some(p=>p.cliente_id===c.id||p.cliente_ref===c.id)&&!(db.negociacoes||[]).some(n=>n.cliente_id===c.id)&&!(db.obras||[]).some(o=>o.cliente_id===c.id&&/Planilha Mestra/i.test(String(o.origem||'')));
const SEED_OBRA=new Set(['o1','o2','o3','o4','o5','o6','o_vmb','o_xl']);
function limpar(db){if(db.af113_zero)return null;const primeira=!db._v144;
  if(primeira)T_(()=>{if(window.V139&&typeof V139.guardar==='function')V139.guardar('antes de tirar a demonstração (v144)')});
  const R={};const conta=(k,n)=>{if(n)R[k]=(R[k]||0)+n};
  const nomesPipe=new Set(((window.CRM_SEED&&CRM_SEED.negociacoes)||[]).map(n=>nz(n.cliente_nome)).concat((db.negociacoes||[]).filter(n=>!n.demo).map(n=>nz(n.cliente_nome))));
  /* 1 · propostas demo e seus itens */
  const SEEDP=/^(pr[1-8]|pr13235|pr12546|pr_xl|p[1-6])$/;const pDemo=new Set((db.propostas||[]).filter(p=>p.fonte!=='METAS 2026'&&(p.demo||SEEDP.test(p.id))).map(p=>p.id));
  const cliDemo=new Set(),obDemo=new Set();(db.propostas||[]).forEach(p=>{if(pDemo.has(p.id)){if(p.cliente_id)cliDemo.add(p.cliente_id);if(p.obra_id)obDemo.add(p.obra_id)}});
  conta('propostas',pDemo.size);db.propostas=(db.propostas||[]).filter(p=>!pDemo.has(p.id));
  const antesIt=(db.itens||[]).length;db.itens=(db.itens||[]).filter(i=>!pDemo.has(i.proposta_id));conta('itens',antesIt-db.itens.length);
  /* 2 · negociações demo */
  const nDemo=(db.negociacoes||[]).filter(n=>n.demo||(!n.origem&&!n.crm_criada&&/^n\d+$/.test(String(n.id))));nDemo.forEach(n=>{if(n.cliente_id)cliDemo.add(n.cliente_id)});conta('negociacoes',nDemo.length);db.negociacoes=(db.negociacoes||[]).filter(n=>!n.demo);
  /* 3 · O.S. / atendimentos / Ret-Troc / consolidados / tarefas de exemplo */
  if(primeira)['os','at_atendimentos','at_relatorios','rettrocs','consolidados','tarefas','pendencias','pedidos_alt','montagens','ajustes_custo','compromissos','relatorios'].forEach(k=>{if(Array.isArray(db[k])&&db[k].length){conta(k,db[k].length);db[k]=[]}});
  if(primeira)['at_fsr'].forEach(k=>{if(db[k]&&typeof db[k]==='object'&&!Array.isArray(db[k])&&Object.keys(db[k]).length){conta(k,Object.keys(db[k]).length);db[k]={}}});
  /* 4 · estoque de exemplo: unidades que não vieram dos inventários reais (arquivos de 02/11), pedidos, entradas, saídas */
  const real=u=>/Invent|Estoque RJ|planilha|\.xlsx|\.pdf/i.test(String(u.origem||''))||!!u.inflow_id;
  const antesU=(db.unidades||[]).length;if(primeira)db.unidades=(db.unidades||[]).filter(u=>real(u)||!(/^u\d+$/.test(String(u.id))||(u.proposta_id&&pDemo.has(u.proposta_id))));else db.unidades=(db.unidades||[]).filter(u=>!(u.proposta_id&&pDemo.has(u.proposta_id)));conta('unidades',antesU-db.unidades.length);
  if(primeira)['pedidos','entradas','saidas'].forEach(k=>{if(Array.isArray(db[k])&&db[k].length){conta(k,db[k].length);db[k]=[]}});
  /* 5 · clientes e obras que só existiam para a demonstração */
  const usado=new Set();(db.propostas||[]).forEach(p=>{if(p.cliente_id)usado.add(p.cliente_id);if(p.cliente_ref)usado.add(p.cliente_ref)});
  (db.negociacoes||[]).forEach(n=>{if(n.cliente_id)usado.add(n.cliente_id)});
  const obrasReais=o=>/Planilha Mestra/i.test(String(o.origem||''));
  const cliFora=new Set((db.clientes||[]).filter(c=>SEED_CLI.has(c.id)||orfaSemente(db,c)||((primeira||cliDemo.has(c.id))&&!c.origem&&!usado.has(c.id)&&!nomesPipe.has(nz(c.nome))&&!(db.obras||[]).some(o=>o.cliente_id===c.id&&obrasReais(o)))).map(c=>c.id));
  const obFora=new Set((db.obras||[]).filter(o=>SEED_OBRA.has(o.id)||(!obrasReais(o)&&(cliFora.has(o.cliente_id)||(obDemo.has(o.id)&&!(db.propostas||[]).some(p=>p.obra_id===o.id&&!pDemo.has(p.id)))))).map(o=>o.id));
  conta('obras',obFora.size);db.obras=(db.obras||[]).filter(o=>!obFora.has(o.id));
  conta('clientes',cliFora.size);db.clientes=(db.clientes||[]).filter(c=>!cliFora.has(c.id));
  (db.propostas||[]).forEach(p=>{if(cliFora.has(p.cliente_ref))p.cliente_ref=null;if(cliFora.has(p.cliente_id)){p.cliente_id=null;p.sigla=''}if(obFora.has(p.obra_id))p.obra_id=null});
  /* 6 · folha: as pessoas ficam, salário e holerites de exemplo saem */
  if(primeira)(db.folha||[]).forEach(f=>{if(+f.salario){f.salario=0;conta('salarios',1)}if(+f.he)f.he=0;if(+f.falta)f.falta=0});
  if(primeira)T_(()=>{const b=PF().beneficios;if(b&&typeof b==='object')Object.keys(b).forEach(k=>{if(+b[k]){b[k]=0;conta('beneficios',1)}})});
  if(primeira&&Array.isArray(db.holerites)&&db.holerites.length){conta('holerites',db.holerites.length);db.holerites=[]}
  const tem=Object.keys(R).length;if(primeira)db._v144={quando:T_(()=>today(),new Date().toISOString().slice(0,10)),removidos:R};
  if(tem){if(primeira)T_(()=>log('base','v144','Demonstração retirada: '+Object.entries(R).map(([k,v])=>v+' '+k).join(', ')));T_(()=>save())}return R}
function boot(){try{const r=limpar(S.db);if(r)console.info('v144',r)}catch(e){console.error('v144',e)}}
boot();
try{const _rm=window.renderMain;window.renderMain=function(){try{if(!S.db.af113_zero&&(!S.db._v144||(S.db.propostas||[]).some(p=>p.fonte!=='METAS 2026'&&(p.demo||/^(pr[1-8]|pr13235|pr12546|pr_xl|p[1-6])$/.test(p.id)))||(S.db.negociacoes||[]).some(n=>n.demo)||(S.db.clientes||[]).some(c=>orfaSemente(S.db,c))))boot()}catch(e){}return _rm.apply(this,arguments)}}catch(e){}
try{if(typeof renderMain==='function')renderMain()}catch(e){}
})();
