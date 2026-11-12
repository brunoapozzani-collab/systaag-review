/* =====================================================================================================
   v184 · DESPESAS DOS DEPARTAMENTOS: GESTOR APROVA, FINANCEIRO CONFERE (reunião de 06/11/2026, Financeiro)
   Pedido da reunião: "permitir lançamentos pelos departamentos sem conceder autorização automática de pagamento ou
   reembolso" e "estabelecer aprovação pelo gestor responsável e conferência pelo Financeiro".
   O que estava errado: o Apontamento de obra (técnico aponta diárias + Uber, hotel, alimentação…) gravava cada despesa
   direto como lançamento de saída na conta da empresa — dinheiro "pago" sem ninguém autorizar.
   Agora:
     · as diárias continuam caindo na obra na hora (não é pagamento);
     · cada despesa apontada fica em "Despesas a aprovar" — 1º o gestor responsável aprova (ou recusa, com motivo),
       2º o Financeiro confere; só então ela vira lançamento (a pagar / reembolso) e entra no custo real da obra;
     · quem aprova: Gestão, Diretoria, TI, Chefe dos técnicos, Obras · quem confere: Financeiro, Diretoria, TI;
     · quem lançou não aprova a própria despesa.
   Tela: Financeiro › Despesas a aprovar (e um aviso no Apontamento de obra para o gestor).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v184)return;window.__v184=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R$=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const N0=v=>(+v||0).toLocaleString('pt-BR');
const dBR=s=>{s=String(s||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s};
const rerender=()=>{try{renderMain()}catch(e){}};
const quem=()=>T(()=>me(),null)||{};
const login=()=>quem().login||quem().nome||'';
const GESTOR=['gestao','diretoria','ti','chefetec','obras'],FIN=['financeiro','diretoria','ti'];
const temPerfil=L=>L.indexOf(String(quem().perfil||''))>=0;
const V=window.V184={};
const fila=()=>{S.db.fin=S.db.fin||{};return S.db.fin.despAprov=S.db.fin.despAprov||[]};
const obraNome=id=>T(()=>(S.db.obras||[]).find(o=>o.id===id).nome,id||'—');

/* ───── o apontamento não paga mais nada sozinho ───── */
function liga(){if(typeof A!=='object'||typeof A.apontarObra!=='function')return false;if(A.apontarObra.__v184)return true;
  const f=A.apontarObra;
  A.apontarObra=function(){const antes=new Set(T(()=>S.db.fin.lancamentos.map(l=>l.id),[]));const r=f.apply(this,arguments);
    try{const L=S.db.fin.lancamentos;const novos=L.filter(l=>!antes.has(l.id)&&l.fonte==='apontamento'&&l.tipo==='saida');
      if(novos.length){const ap=T(()=>S.db.apontamentos.find(a=>a.id===r),null);
        novos.forEach(l=>{const i=L.indexOf(l);if(i>=0)L.splice(i,1);
          fila().unshift({id:'da'+l.id,lanc:l,obra_id:l.obra_id,apontamento:l.apontamento,valor:l.valor,descricao:l.descricao,por:login(),em:new Date().toISOString(),status:'gestor'});
          if(ap)(ap.linhas||[]).forEach(x=>{if(x.lanc===l.id){x.lanc='';x.aprov='da'+l.id}})});
        try{log('fin','v184',novos.length+' despesa(s) do apontamento aguardando o gestor (não pagas)')}catch(e){}
        try{save()}catch(e){}
        try{toast(novos.length+' despesa(s) enviada(s) para aprovação do gestor — nada foi pago ainda.')}catch(e){}}
    }catch(e){console.error('v184 apontar',e)}
    return r};
  A.apontarObra.__v184=true;Object.keys(f).forEach(k=>{try{A.apontarObra[k]=f[k]}catch(e){}});return true}

/* ───── as decisões ───── */
const achar=id=>fila().find(x=>x.id===id);
V.aprovar=function(id){const x=achar(id);if(!x||x.status!=='gestor')return;if(!temPerfil(GESTOR))return toast('Só o gestor responsável aprova.',true);if(x.por&&x.por===login())return toast('Quem lançou não aprova a própria despesa.',true);
  x.status='financeiro';x.gestor={por:login(),em:new Date().toISOString()};try{log('fin',x.id,'despesa aprovada pelo gestor')}catch(e){}save();rerender()};
V.conferir=function(id){const x=achar(id);if(!x||x.status!=='financeiro')return;if(!temPerfil(FIN))return toast('Só o Financeiro confere.',true);if(x.por&&x.por===login())return toast('Quem lançou não confere a própria despesa.',true);
  const l=Object.assign({},x.lanc,{aprovacao:{lancadoPor:x.por,lancadoEm:x.em,gestor:x.gestor,financeiro:{por:login(),em:new Date().toISOString()}}});
  S.db.fin.lancamentos.push(l);x.status='lancada';x.fin={por:login(),em:new Date().toISOString(),lanc:l.id};
  const ap=T(()=>S.db.apontamentos.find(a=>a.id===x.apontamento),null);if(ap)(ap.linhas||[]).forEach(y=>{if(y.aprov===x.id)y.lanc=l.id});
  try{log('fin',x.id,'despesa conferida pelo Financeiro → lançamento '+l.id)}catch(e){}save();rerender()};
V.recusar=function(id){const x=achar(id);if(!x||(x.status!=='gestor'&&x.status!=='financeiro'))return;
  const etapa=x.status==='gestor'?GESTOR:FIN;if(!temPerfil(etapa))return toast('Você não decide esta etapa.',true);
  const m=prompt('Motivo da recusa (volta para quem lançou):','');if(!m||!m.trim())return;
  x.recusa={por:login(),em:new Date().toISOString(),motivo:m.trim(),etapa:x.status};x.status='recusada';try{log('fin',x.id,'despesa recusada: '+m)}catch(e){}save();rerender()};

/* ───── a tela ───── */
const ROT={gestor:'1 · Aguardando o gestor',financeiro:'2 · Aguardando a conferência do Financeiro',recusada:'Recusadas',lancada:'Conferidas (viraram lançamento)'};
function tabela(st){const L=fila().filter(x=>x.status===st);const tot=L.reduce((a,x)=>a+(+x.valor||0),0);
  const pode=st==='gestor'?temPerfil(GESTOR):st==='financeiro'?temPerfil(FIN):false;
  const rows=L.slice(0,st==='lancada'?30:500).map(x=>`<tr><td>${dBR(x.lanc&&x.lanc.data||x.em)}</td><td><b>${E(x.descricao)}</b><div class="sub" style="font-size:11px">obra: ${E(obraNome(x.obra_id))} · lançado por ${E(x.por||'—')}</div>${x.recusa?`<div class="sub" style="font-size:11px;color:#dc3545">recusada por ${E(x.recusa.por)}: ${E(x.recusa.motivo)}</div>`:''}${x.gestor?`<div class="sub" style="font-size:11px">gestor: ${E(x.gestor.por)} · ${dBR(x.gestor.em)}</div>`:''}</td><td class="text-end mono">${R$(x.valor)}</td><td class="text-end" style="white-space:nowrap">${pode?(st==='gestor'?`<button class="btn-apple" style="font-size:12px" onclick="V184.aprovar('${E(x.id)}')">Aprovar</button>`:`<button class="btn-apple" style="font-size:12px" onclick="V184.conferir('${E(x.id)}')">Conferir e lançar</button>`)+` <button class="btn-soft" style="font-size:12px" onclick="V184.recusar('${E(x.id)}')">Recusar</button>`:''}</td></tr>`).join('');
  return `<div class="card p-3 mb-3" data-v184="${st}"><div class="d-flex justify-content-between flex-wrap gap-2"><h6 class="m-0">${ROT[st]}</h6><span class="sub">${N0(L.length)} despesa(s) · ${R$(tot)}${pode?'':st==='gestor'||st==='financeiro'?' · você só acompanha esta etapa':''}</span></div>
    <div class="tblwrap mt-2"><table class="tbl"><thead><tr><th>Data</th><th>Despesa</th><th class="text-end">Valor</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="sub">nenhuma</td></tr>'}</tbody></table></div></div>`}
SCREENS.despaprov=function(){const F=fila();const c=s=>F.filter(x=>x.status===s);const sm=L=>L.reduce((a,x)=>a+(+x.valor||0),0);
  const hd=T(()=>head('Despesas a aprovar','Despesas lançadas pelos departamentos (Apontamento de obra). Nada é pago sozinho: 1º o gestor responsável aprova, 2º o Financeiro confere — só aí vira lançamento e entra no custo real da obra.'),'<h3>Despesas a aprovar</h3>');
  const ponte=`<div class="card p-3 mb-3 af-bar" style="display:block;font-size:13px"><b>${N0(F.length)} despesas lançadas · ${R$(sm(F))}</b> = ${N0(c('gestor').length)} com o gestor (${R$(sm(c('gestor')))}) + ${N0(c('financeiro').length)} com o Financeiro (${R$(sm(c('financeiro')))}) + ${N0(c('lancada').length)} conferidas (${R$(sm(c('lancada')))}) + ${N0(c('recusada').length)} recusadas (${R$(sm(c('recusada')))})</div>`;
  return hd+ponte+tabela('gestor')+tabela('financeiro')+tabela('recusada')+tabela('lancada')};
try{LABEL.despaprov='Despesas a aprovar';SEC_OF.despaprov='fin'}catch(e){}
try{if(typeof SCREEN_DEPS==='object')SCREEN_DEPS.despaprov=['fin','obras']}catch(e){}
try{if(typeof FS==='object'&&Array.isArray(FS.MENU)&&!FS.MENU.some(m=>m[0]==='despaprov')){const i=FS.MENU.findIndex(m=>m[0]==='pagar');FS.MENU.splice(i>=0?i+1:FS.MENU.length,0,['despaprov','Despesas a aprovar','bi-check2-square'])}}catch(e){}

/* aviso no Apontamento de obra */
function ligaTela(){const f=SCREENS.apontamento;if(typeof f!=='function'||f.__v184)return;
  SCREENS.apontamento=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;const g=fila().filter(x=>x.status==='gestor'),fi=fila().filter(x=>x.status==='financeiro');
    const b=`<div class="card p-2 px-3 mb-3" id="v184-aviso" style="border-left:4px solid #0d6efd;font-size:13px">As despesas deste apontamento <b>não são pagas na hora</b>: vão para o gestor aprovar e o Financeiro conferir. Agora: <a href="#/despaprov">${N0(g.length)} com o gestor · ${N0(fi.length)} com o Financeiro ›</a></div>`;
    const i=h.indexOf('<div class="card p-3 mb-3">');return i>=0?h.slice(0,i)+b+h.slice(i):b+h};
  SCREENS.apontamento.__v184=true;Object.keys(f).forEach(k=>{try{SCREENS.apontamento[k]=f[k]}catch(e){}})}
if(!liga()){let n=0;const t=setInterval(()=>{if(liga()||++n>40)clearInterval(t)},250)}
ligaTela();
})();
