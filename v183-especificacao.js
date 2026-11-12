/* =====================================================================================================
   v183 · ESPECIFICAÇÃO TÉCNICA VALIDADA ANTES DA INSTALAÇÃO (reunião de 06/11/2026, Projetos e Obras)
   Pedido da reunião: "garantir que as especificações técnicas sejam validadas antes da instalação" e "reduzir retrabalhos
   e ret/troc decorrentes de erros de concepção".
   Como funciona:
     · a especificação de uma obra = os entregáveis técnicos do Painel de Controle que a instalação usa (diagrama,
       executivo, quadro, cabos, bayface, medidas, keypads, planta de forro); N/A não conta;
     · quando todos os que se aplicam estão Aprovados/Concluídos, Projetos (ou a Gestão) toca "Validar especificação" —
       fica gravado quem validou e quando (o.especValidada); a Gestão pode validar com pendência, escrevendo o motivo;
     · se uma etapa de instalação (quadro, caixas, keypads, rack, equipamentos) já começou sem a validação, a obra ganha
       a bandeira vermelha "instalação começou sem especificação validada";
     · Projetos › Painel mostra os três números (sem validação com instalação começada · prontas para validar ·
       validadas) e cada um abre a lista certa em Projetos › Obras.
   As datas de instalação vêm do Painel de Controle (planilha); por isso o sistema AVISA — não consegue impedir a equipe
   de instalar. O registro da validação é do sistema.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v183)return;window.__v183=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(+v||0).toLocaleString('pt-BR');
const hoje=()=>new Date().toISOString().slice(0,10);
const dBR=s=>{s=String(s||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s};
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const rerender=()=>{try{renderMain()}catch(e){}};
const quem=()=>T(()=>me(),null)||{};
const PODE=['projetos','prevendas','gestao','diretoria','ti'];const GESTAO=['gestao','diretoria','ti'];
const pode=()=>PODE.indexOf(String(quem().perfil||''))>=0;const ehGestao=()=>GESTAO.indexOf(String(quem().perfil||''))>=0;
const TEC=['diagrama','executivo','quadro','cabos','bayface','medidas','keypad','forro'];
const DONE=s=>s==='Aprovado'||s==='Concluído';
const V=window.V183={};
const obra=id=>(S.db.obras||[]).find(o=>o.id===id);
const ativa=o=>o&&!o.merged_into&&!o.inativo&&o.situacao==='Em andamento'&&!o.prospeccao;

V.espec=o=>{const es=(o.entregaveis||[]).filter(e=>e&&e.status!=='N/A'&&TEC.some(k=>nz(e.nome).includes(k)));
  return {itens:es,prontos:es.filter(e=>DONE(e.status)),falta:es.filter(e=>!DONE(e.status))}};
V.instalacao=o=>(o.etapas||[]).filter(e=>/instala|montagem do quadro/.test(nz(e.subetapa))&&(e.status==='Em andamento'||e.status==='Finalizado'||(e.ini&&e.ini<=hoje())));
V.estado=o=>{const s=V.espec(o);const inst=V.instalacao(o);const val=o.especValidada&&o.especValidada.em;
  const k=val?'validada':inst.length?'semval':!s.itens.length?'semitens':!s.falta.length?'pronta':'elaboracao';return {k,s,inst,val}};

V.validar=function(id){const o=obra(id);if(!o)return;if(!pode())return toast('Só Projetos ou a Gestão validam a especificação.',true);
  const st=V.estado(o);let obs='';
  if(st.s.falta.length){if(!ehGestao())return toast('Faltam '+st.s.falta.length+' entregável(is) técnico(s) aprovados — só a Gestão valida com pendência.',true);
    obs=prompt('Validar com pendência ('+st.s.falta.map(e=>e.nome).join(', ')+'). Escreva o motivo:','');if(!obs||!obs.trim())return toast('Sem motivo, a especificação não foi validada.',true)}
  o.especValidada={em:new Date().toISOString(),por:quem().login||quem().nome||'',nome:quem().nome||quem().login||'',obs:obs||'',pendentes:st.s.falta.map(e=>e.nome),instalacaoJaComecada:st.inst.length>0};
  try{log('obras',o.id,'Especificação técnica validada'+(obs?' com pendência: '+obs:''))}catch(e){}
  try{save()}catch(e){}toast('Especificação técnica de '+(o.nome||o.id)+' validada.');rerender()};
V.desfazer=function(id){const o=obra(id);if(!o||!o.especValidada)return;if(!ehGestao())return toast('Só a Gestão desfaz uma validação.',true);
  (o.especValidadaHist=o.especValidadaHist||[]).push(Object.assign({desfeitaEm:new Date().toISOString(),desfeitaPor:quem().login||''},o.especValidada));delete o.especValidada;
  try{log('obras',o.id,'Validação da especificação desfeita')}catch(e){}try{save()}catch(e){}rerender()};

function card(o){const st=V.estado(o);const s=st.s;
  const chips=s.itens.map(e=>`<span class="chip ${DONE(e.status)?'ok':''}" style="font-size:11px">${DONE(e.status)?'✓ ':''}${E(e.nome)} · ${E(e.status||'sem status')}</span>`).join(' ');
  const cor={validada:'#198754',semval:'#dc3545',pronta:'#0d6efd',elaboracao:'#fd7e14',semitens:'#6c757d'}[st.k];
  let topo='';
  if(st.k==='validada'){const v=o.especValidada;topo=`<b style="color:${cor}">✓ Especificação validada</b> por ${E(v.nome||v.por)} em ${dBR(v.em)}${v.obs?` <span class="chip warn" style="font-size:11px">com pendência: ${E(v.obs)}</span>`:''}${v.instalacaoJaComecada?' <span class="sub">(validada depois de a instalação começar)</span>':''}`}
  else if(st.k==='semval')topo=`<b style="color:${cor}">⚠ A instalação começou sem a especificação validada</b> <span class="sub">— ${st.inst.map(e=>E(e.subetapa)+(e.ini?' ('+dBR(e.ini)+')':'')).join(' · ')}</span>`;
  else if(st.k==='pronta')topo=`<b style="color:${cor}">Pronta para validar</b> <span class="sub">— todos os ${N0(s.itens.length)} entregáveis técnicos estão aprovados</span>`;
  else if(st.k==='elaboracao')topo=`<b style="color:${cor}">${N0(s.prontos.length)} de ${N0(s.itens.length)} entregáveis técnicos aprovados</b> <span class="sub">— a instalação só deve começar depois da validação</span>`;
  else topo=`<b>Nenhum entregável técnico se aplica</b> <span class="sub">— todos estão N/A no Painel de Controle</span>`;
  const btn=st.k==='validada'?(ehGestao()?`<button class="btn-soft" style="font-size:12px" onclick="V183.desfazer('${E(o.id)}')">Desfazer validação</button>`:'')
    :pode()?`<button class="btn-apple" style="font-size:12px" onclick="V183.validar('${E(o.id)}')"><i class="bi bi-patch-check me-1"></i>Validar especificação${s.falta.length?' (com pendência)':''}</button>`:`<span class="sub" style="font-size:11.5px">Projetos ou a Gestão validam</span>`;
  return `<div class="card p-3 mb-3" id="v183-espec" data-k="${st.k}" style="border-left:4px solid ${cor}"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><h6 class="m-0">Especificação técnica para a instalação</h6>${btn}</div>
    <div style="font-size:13px">${topo}</div>${chips?`<div class="d-flex flex-wrap gap-1 mt-2">${chips}</div>`:''}</div>`}
function injeta(h,c){if(typeof h!=='string'||h.indexOf('id="v183-espec"')>=0)return h;const i=h.indexOf('<div class="card p-3 mb-3" id="v161-obra"');if(i>=0)return h.slice(0,i)+c+h.slice(i);const j=h.indexOf('<div class="tabs');return j>=0?h.slice(0,j)+c+h.slice(j):h+c}

/* Projetos › Painel: os três números; Projetos › Obras: a lista de cada um */
const RT={semval:'Instalação começou sem especificação validada',pronta:'Prontas para validar',validada:'Especificação validada'};
V.ir=function(k){S.v183=k;location.hash='#/prjobras'};V.sair=function(){S.v183=0;rerender()};
function numeros(){const os=(S.db.obras||[]).filter(ativa);const c={semval:0,pronta:0,validada:0,elaboracao:0,semitens:0};os.forEach(o=>c[V.estado(o).k]++);c.total=os.length;return c}
function linhaPainel(){const c=numeros();
  return `<div class="card p-3 mb-3" id="v183-painel"><h6 class="m-0 mb-1">Especificação técnica antes da instalação</h6>
    <div style="font-size:13px"><b>${N0(c.total)} obras em andamento</b> = <a href="javascript:void 0" onclick="V183.ir('semval')"><b style="color:#dc3545">${N0(c.semval)}</b> instalação começou sem validação ›</a> + <a href="javascript:void 0" onclick="V183.ir('pronta')"><b>${N0(c.pronta)}</b> prontas para validar ›</a> + <a href="javascript:void 0" onclick="V183.ir('validada')"><b>${N0(c.validada)}</b> validadas ›</a> + ${N0(c.elaboracao)} com entregáveis técnicos em elaboração + ${N0(c.semitens)} sem entregável técnico (N/A)</div></div>`}
function lista(k){const os=(S.db.obras||[]).filter(o=>ativa(o)&&V.estado(o).k===k).sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
  const rows=os.map(o=>{const st=V.estado(o);return `<tr class="rowlink" onclick="S.v183=0;location.hash='#/prjobras/${E(o.id)}'"><td><b>${E(o.nome||o.id)}</b><div class="sub" style="font-size:11px">${E(o.numero?'obra nº '+o.numero:'')}</div></td><td>${N0(st.s.prontos.length)} de ${N0(st.s.itens.length)}</td><td style="font-size:12px">${k==='validada'?E((o.especValidada.nome||o.especValidada.por)+' · '+dBR(o.especValidada.em)):st.inst.map(e=>E(e.subetapa)).join(' · ')||'—'}</td></tr>`}).join('');
  const hd=T(()=>head(RT[k]+' ('+N0(os.length)+')','Obras em andamento · a especificação técnica são os entregáveis do Painel de Controle que a instalação usa.',`<button class="btn-soft" onclick="V183.sair()">Ver todas as obras ✕</button>`),`<h3>${RT[k]}</h3>`);
  return hd+`<div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Obra</th><th>Entregáveis técnicos aprovados</th><th>${k==='validada'?'Validada por':'Etapas de instalação já começadas'}</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="sub">nenhuma</td></tr>'}</tbody></table></div></div>`}

function liga(){if(typeof SCREENS!=='object')return false;let ok=true;
  const w=(nome,fn)=>{const f=SCREENS[nome];if(typeof f!=='function'){ok=false;return}if(f.__v183)return;SCREENS[nome]=function(){return fn(f,this,arguments)};SCREENS[nome].__v183=true;Object.keys(f).forEach(k=>{try{SCREENS[nome][k]=f[k]}catch(e){}})};
  w('obras',(f,t,a)=>{const h=f.apply(t,a);const o=a[0]&&obra(a[0]);return o?T(()=>injeta(h,card(o)),h):h});
  w('prjobras',(f,t,a)=>{if(!a[0]&&S.v183)return lista(S.v183);const h=f.apply(t,a);const o=a[0]&&obra(a[0]);return o?T(()=>injeta(h,card(o)),h):h});
  w('prjpainel',(f,t,a)=>{let h=f.apply(t,a);if(typeof h!=='string'||h.indexOf('id="v183-painel"')>=0)return h;const c=T(()=>linhaPainel(),'');const i=h.indexOf('<div class="card');return i>=0?h.slice(0,i)+c+h.slice(i):h+c});
  return ok}
liga();try{const _rm=window.renderMain;if(typeof _rm==='function'&&!_rm.__v183){window.renderMain=function(){try{liga()}catch(e){}return _rm.apply(this,arguments)};window.renderMain.__v183=true}}catch(e){}
window.addEventListener('hashchange',()=>{try{if(!/^#\/prjobras\/?$/.test(location.hash||''))S.v183=0}catch(e){}});
})();
