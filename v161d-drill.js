/* =====================================================================================================
   v161d · TODO NÚMERO ABRE O PAINEL CURTO E CHEGA JÁ FILTRADO (Bruno, padrão de 05/11/2026; auditoria de 06/11)
   O que a auditoria achou (e o porquê):
     1g. Números que pulavam o painel: no Início (Projetos, Operações, Estoque, Financeiro) e em TODO o Operação › Painel
         o clique ia direto para uma tela (COP.ope.go / COP.prj.go / V130_go / location.hash), sem o painel curto; em
         Projetos "7 com projeto em andamento" e "42 aguardando arquivos" só redesenhavam o Início (V161P.filtro mudava
         o filtro da lista de Projetos › Painel, que não está no Início). Painéis sem o botão "Abrir na tela": 133
         atividades atrasadas (o modal do Operação não tem destino — não existia uma lista de atividades), 129 chamados
         abertos e 280 sem cobrança (o link era COP.pos.go, que o v155 não reconhecia como destino).
     1h. 264 ganhas: o botão dizia "Comercial › Pipeline" e a v156 mandava para CRM › Oportunidades.
     1i. 224 concluídas na Operação → Pós-venda › Obras finalizadas (essa lista só tem 34 delas); Rentabilidade · Focal →
         Financeiro › Obras (as 14 vendas Focal não têm obra: 0 linhas).
   Agora:
     A. Porta única: nas telas-resumo (Início, Operação › Painel, Projetos › Painel) o clique num número que navegaria
        direto abre o painel curto (número, "Vem de", "Abrir na tela, já filtrado" no topo, os 5 primeiros + ver todos).
        Os registros do painel são a própria lista de destino, desenhada com o mesmo filtro (SCREENS[tela]() com o estado
        que o clique ligaria, sem navegar e devolvendo o estado em seguida) — o painel e a tela nunca discordam.
        "Abrir na tela" roda o clique original (os controles da própria tela ficam ligados) e a etiqueta única da v161;
        o × devolve os controles ao que eram antes do clique.
     B. Destinos corrigidos/adicionados (gaveta → tela): ganhas/perdidas/futuro/decididas → Comercial › Pipeline ›
        Negociações (situação ligada); 224 concluídas → Operação › Obras (situação Concluída); Rentabilidade de uma
        unidade sem obras → Comercial › Propostas com as vendas; chamados abertos → Pós-venda › Field Service; sem
        cobrança → Pós-venda › Propostas; atividades atrasadas / 7 dias → Operação › Atividades (tela nova, a mesma
        lista do modal do Painel).
     C. Rentabilidade → Financeiro › Obras: a faixa azul vira a etiqueta padrão da v161 (V161F.chipHTML), a ponte embaixo.
     D. Contagens nos títulos/abas em pt-BR (Propostas 1.345, Clientes (1.020)).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161d)return;window.__v161d=true;
if(typeof S==='undefined'||!S.db)return;
const V=window.V161D=window.V161D||{};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const N0=v=>(+v||0).toLocaleString('pt-BR');
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const txt=el=>el?String(el.textContent||'').replace(/\s+/g,' ').trim():'';
const cur=()=>(location.hash||'#/home').split('?')[0];
const rota=h=>{const s=String(h||'').replace(/^#\/?/,'').split('?')[0]||'home';const [k,arg]=s.split('/');return {k,arg}};
const C=()=>window.COP||{};
const SEC={home:'Início',com:'Comercial',pos:'Pós-venda',ope:'Operação',cop:'Operação',prj:'Projetos',est:'Estoque',fin:'Financeiro',crm:'CRM',base:'Base',db:'Base'};
function telaNome(h){const {k}=rota(h);const lb=T(()=>LABEL[k],'')||k;const sc=T(()=>SEC_OF[k],'');const s=SEC[sc]||'';
  if(k==='negs')return 'Comercial › Pipeline › Negociações';
  return s&&s!==lb?s+' › '+lb:lb}

/* ───────── estado: foto e devolução (S fora da Base, COP.ui, V161P.f) ───────── */
const PULA=new Set(['db','eventos','changed']);
const cl=v=>{try{return v===undefined?undefined:JSON.parse(JSON.stringify(v))}catch(e){return v}};
const js=v=>{try{return JSON.stringify(v)}catch(e){return '?'}};
function foto(){const s={};Object.keys(S).forEach(k=>{if(PULA.has(k))return;const v=S[k];if(typeof v==='function')return;s[k]=js(v)});
  const u={};const ui=C().ui||{};Object.keys(ui).forEach(k=>{u[k]=js(ui[k])});
  return {s,u,pf:js(T(()=>window.V161P.f,null))}}
/* devolve as chaves que mudaram desde a foto */
function devolve(f){if(!f)return;Object.keys(S).forEach(k=>{if(PULA.has(k)||typeof S[k]==='function')return;if(!(k in f.s)){try{delete S[k]}catch(e){}return}if(js(S[k])!==f.s[k])S[k]=f.s[k]===undefined?undefined:JSON.parse(f.s[k])});
  Object.keys(f.s).forEach(k=>{if(!(k in S))S[k]=f.s[k]===undefined?undefined:JSON.parse(f.s[k])});
  const ui=C().ui;if(ui){Object.keys(ui).forEach(k=>{if(!(k in f.u)){delete ui[k];return}if(js(ui[k])!==f.u[k])ui[k]=f.u[k]===undefined?undefined:JSON.parse(f.u[k])});
    Object.keys(f.u).forEach(k=>{if(!(k in ui)&&f.u[k]!==undefined)ui[k]=JSON.parse(f.u[k])})}
  if(window.V161P&&js(V161P.f)!==f.pf)V161P.f=f.pf===undefined?null:JSON.parse(f.pf)}

/* ───────── ensaio: roda o clique sem navegar, só para saber para onde ele vai e com que filtro ───────── */
const ANO=()=>String(T(()=>S.db.meta.ano,'')||new Date().getFullYear());
function ensaio(code,el){
  const f0=foto();const cap={h:null};const stubs=[];
  const stub=(o,k,fn)=>{if(!o||typeof o[k]!=='function')return;stubs.push([o,k,o[k]]);o[k]=fn};
  stub(window,'render',()=>{});stub(window,'renderMain',()=>{});stub(window,'V130_close',()=>{});
  stub(window,'V130_go',h=>{cap.h=h});
  stub(window,'V130_metaGo',(k,fil)=>{S.propF={st:'',fr:k||'',q:'',cons:'',ym:'',fil:fil||'',vano:ANO()};cap.h='#/propostas'});
  const c=C();
  stub(c.ope,'go',(screen,state,hash)=>{c.ui[screen]=state||{};cap.h=hash||('#/'+screen)});
  stub(c.prj,'go',(screen,f)=>{c.ui[screen]=Object.assign({},f||{});cap.h='#/'+screen});
  stub(c.pos,'go',(k,screen,st)=>{const u=c.ui[screen]=c.ui[screen]||{};Object.assign(u,st||{});cap.h='#/'+k});
  stub(window.V161P,'filtro',k=>{V161P.f=k||null;cap.h='#/prjpainel'});
  window.__V161D_cap=cap;let html=null,ok=true;
  try{const code2=String(code).replace(/\(window\.top\|\|window\)\.location\.hash\s*=/g,'__V161D_cap.h=').replace(/(^|[^.\w])location\.hash\s*=/g,'$1__V161D_cap.h=');
    new Function('event',code2).call(el||window,{preventDefault(){},stopPropagation(){},type:'click'})}catch(e){ok=false}
  if(ok&&cap.h){const {k,arg}=rota(cap.h);const fn=T(()=>SCREENS[k],null);
    if(typeof fn==='function'){const h0=location.hash;try{history.replaceState(history.state,'',cap.h)}catch(e){}
      try{html=fn(arg)}catch(e){html=null}finally{try{history.replaceState(history.state,'',h0)}catch(e){}}}}
  const f1=foto();
  stubs.reverse().forEach(([o,k,f])=>{o[k]=f});
  devolve(f0);
  return ok&&cap.h?{h:cap.h,html,f0,f1}:null}

/* a lista de destino dentro do HTML da tela: a tabela (ou o grupo de cartões) com os registros */
const IDRE=/#\/[a-z0-9_]+\/[^'"\s)?&]+/i;
function lista(html,n){if(!html)return null;const t=document.createElement('template');t.innerHTML=html;const R=t.content;const cs=[];
  R.querySelectorAll('table').forEach(tb=>{if(tb.parentElement&&tb.parentElement.closest('table'))return;if(tb.closest('.modal,.vd-ov'))return;
    const rows=[...tb.querySelectorAll(':scope > tbody > tr')].filter(r=>!r.classList.contains('tot')&&!/^total\b/i.test(txt(r.firstElementChild))&&!/display:\s*none/.test(r.getAttribute('style')||'')&&(r.children.length>1||(r.getAttribute('onclick')||'').length>3));
    if(!rows.length)return;const ids=rows.filter(r=>IDRE.test((r.getAttribute('onclick')||'')+' '+[...r.querySelectorAll('[onclick],a[href]')].map(e=>e.getAttribute('onclick')||e.getAttribute('href')).join(' '))).length;
    cs.push({tb,rows,ids})});
  const g={};R.querySelectorAll('[onclick]').forEach(e=>{if(e.closest('table'))return;const oc=e.getAttribute('onclick')||'';if(!/'[^']{3,}'/.test(oc))return;
    const sh=oc.replace(/'[^']*'/g,"''").replace(/\d+/g,'0');(g[sh]=g[sh]||[]).push(e)});
  Object.values(g).forEach(xs=>{if(xs.length<3)return;const tb=document.createElement('table');tb.innerHTML='<thead><tr><th>Registro</th></tr></thead><tbody></tbody>';const bd=tb.tBodies[0];
    xs.forEach(e=>{const tr=document.createElement('tr');tr.setAttribute('onclick',e.getAttribute('onclick'));const h=e.querySelector('h6,b,strong');const nm=h?txt(h):'';const all=txt(e);
      tr.innerHTML=`<td><b>${E(nm||all.slice(0,60))}</b>${nm?`<div class="sub" style="font-size:12px">${E(all.replace(nm,'').trim().slice(0,110))}</div>`:''}</td>`;bd.appendChild(tr)});
    cs.push({tb,rows:[...bd.children],ids:xs.filter(e=>IDRE.test(e.getAttribute('onclick')||'')).length,cards:true})});
  if(!cs.length)return null;
  let best=cs.find(c=>n!=null&&c.rows.length===n&&!c.cards)||cs.find(c=>n!=null&&c.rows.length===n);
  if(!best)best=cs.slice().sort((a,b)=>(b.ids-a.ids)||(b.rows.length-a.rows.length))[0];
  /* só as linhas da lista (sem as de total) */
  const tb=best.tb.cloneNode(true);const keep=new Set(best.rows.map(r=>[...best.tb.querySelectorAll(':scope > tbody > tr')].indexOf(r)));
  if(!best.cards)[...tb.querySelectorAll(':scope > tbody > tr')].forEach((r,i)=>{if(!keep.has(i))r.remove()});
  return {tb,n:best.rows.length}}

/* número e rótulo do elemento clicado */
const NUMRE=/R\$\s?[\d.]+(?:,\d+)?|\d[\d.]*(?:,\d+)?\s?%?(?:\s?un\.)?/;
const cap1=s=>{s=String(s||'').trim();if(s&&s===s.toUpperCase()&&/[A-ZÀ-Ú]{3}/.test(s))s=s.charAt(0)+s.slice(1).toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
function numLb(el){const lbE=el.querySelector('.lb'),vE=el.querySelector('.v'),sE=el.querySelector('.s');
  if(lbE&&vE)return {big:txt(vE),lb:cap1(txt(lbE)),sub:sE?txt(sE):''};
  const t=String(el.innerText||el.textContent||'').split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean).join(' · ');const m=NUMRE.exec(t);if(!m)return null;
  let lb=(t.slice(0,m.index)+' '+t.slice(m.index+m[0].length)).replace(/[›→]/g,' ').replace(/\s+/g,' ').replace(/(\s*·\s*)+/g,' · ').replace(/^[·\s-]+|[·\s-]+$/g,'').trim();
  return {big:m[0].trim(),lb:cap1(lb),sub:''}}

/* ───────── o painel (o mesmo do v155: montado a partir de uma gaveta escondida) ───────── */
let PEND=null;
function abrir(spec){
  try{const o=document.getElementById('v155-ov');if(o)o.remove()}catch(e){}
  document.querySelectorAll('.vd-ov[data-v161d]').forEach(x=>x.remove());
  try{if(window.V156)V156.ult={k:'v161d',a:spec.code,t:Date.now()}}catch(e){}
  const ov=document.createElement('div');ov.className='vd-ov';ov.setAttribute('data-v161d','1');ov.style.display='none';
  const dr=document.createElement('div');dr.className='vd-dr';dr.setAttribute('data-v155','1');
  const tela=spec.tela||telaNome(spec.h);
  const ponte=spec.ponte||'';
  dr.innerHTML=`<button class="x" aria-label="Fechar">×</button><h3>${E(spec.lb||'')}</h3><div class="big">${E(spec.big||'')}</div>${spec.sub||ponte?`<div class="lead">${E([spec.sub,ponte].filter(Boolean).join(' · '))}</div>`:''}`+
    `<div class="vx149-fonte"><b>De onde vem:</b> ${E(spec.vem||tela)}</div>`;
  if(spec.tb){const w=document.createElement('div');w.className='tw';w.appendChild(spec.tb);dr.appendChild(w)}
  const a=document.createElement('a');a.className='btnl';a.href='javascript:void 0';a.setAttribute('onclick',`V161D.vai()/* V130_go('${J(spec.h)}') */`);a.textContent='Abrir '+tela+' ›';dr.appendChild(a);
  ov.appendChild(dr);document.body.appendChild(ov);
  dr.querySelector('.x').addEventListener('click',()=>ov.remove());
  PEND=spec;let D=null;try{D=V155D.lerGaveta(dr)}finally{PEND=null}
  D.__v161d=spec;V.D=D;V.cur=spec;
  V155D.montar(D)}
/* "Abrir na tela, já filtrado" */
V.vai=function(){const D=V.D;if(D&&D.__v161d)ir(D,D.__v161d)};
function ir(D,spec){
  document.querySelectorAll('.vd-ov[data-v161d]').forEach(x=>x.remove());
  let recs=spec.recs;if(!recs){try{recs=V155D.recsDe(D.tabs||[])}catch(e){recs=[]}}
  const lb=txt(Object.assign(document.createElement('div'),{innerHTML:D.big||''}))+' · '+txt(Object.assign(document.createElement('div'),{innerHTML:D.lb||''}));
  const h0=(D.tabs&&D.tabs[0]&&D.tabs[0].hs[0])||'';
  let antes=null;const base=String(spec.h).split('?')[0];
  try{if(window.V156)V156.ult={k:'v161d',a:spec.code,t:Date.now()}}catch(e){}
  V156.ir({path:base,lb,unid:spec.unid||(h0?h0.toLowerCase().replace(/^(.*[^s])$/,'$1s'):'registros'),recs,hide:spec.hide,ponte:spec.ponteLanding,porque:spec.porque,
    nav(){antes=foto();try{new Function('event',spec.code).call(window,{preventDefault(){},stopPropagation(){},type:'click'})}catch(e){console.error('v161d nav',e);try{location.hash=spec.h}catch(_){}}
      if(cur()===base)try{renderMain()}catch(e){}
      /* Projetos › Painel: a lista filtrada fica no fim da página — uma rolagem só, na chegada (a mesma que o clique no próprio Painel faz) */
      if(base==='#/prjpainel')setTimeout(()=>{const el=document.getElementById('v161-lista');if(el)try{el.scrollIntoView({block:'start'})}catch(e){}},120)},
    limpa(){devolve(antes);if(spec.limpa)try{spec.limpa()}catch(e){}if(cur()===base)try{renderMain()}catch(e){}}})}

/* ───────── A · a porta única nas telas-resumo ───────── */
const FONTES=new Set(['home','copainel','prjpainel','posvisao','epainel','fhoje']);
const NAVRE=/COP\.(?:ope|prj|pos)\.go\(|V130_go\(|V130_metaGo\(|location\.hash\s*=|V161P\.filtro\(/;
const NAO=/V130_open|V161_open|VD_open|V157|V156\.|semValor|\.form|formObra|put\(|save\(|scrollIntoView|crm\(|listaAtv|V161P\.filtro\(null\)/;
/* clique que vai a UM registro (#/obras/OBR-0007, #/pospropostas/mt_F1) não é número: é a linha */
const REG=/['"]#\/[a-z0-9_]+\/(?:[A-Z]{2,}-?\d|[a-z]{1,5}_[\w-]+|[^'"\/]*\d{3,})[^'"]*['"]/;
/* destinos que o clique antigo escolhia mal — com os registros exatos do número quando a lista de destino tem mais */
const vivas=()=>(S.db.obras||[]).filter(o=>o&&!o.merged_into&&!o.inativo);
const sitO=o=>T(()=>COP.situacao(o),o.situacao||'');
const TROCA=[
  /* "Obras · 315 no total" = em andamento + on hold + concluídas (o mesmo do Operação › Painel) */
  {re:/^V130_go\('#\/obras'\)$/,code:"COP.ui.obrasTab='obras';COP.ope.go('obras',{situacao:''},'#/obras')",
   ids:()=>(S.db.obras||[]).filter(o=>o.ativo!==false&&['Em andamento','On hold','Concluída'].includes(sitO(o))).map(o=>o.id),porque:'canceladas e em assistência técnica não entram no total'},
  /* Pós-venda › Visão geral: "224 concluídas na Operação" / "8 em assistência técnica" — a lista é a da Operação */
  {re:/COP\.ui\.posobras=.*sit:'Concluída'/,code:"COP.ui.obrasTab='obras';COP.ope.go('obras',{situacao:'Concluída'},'#/obras')",ids:()=>vivas().filter(o=>!o.legadoAT&&sitO(o)==='Concluída').map(o=>o.id)},
  /* "129 com atendimento em campo" = os atendimentos do Field Service ainda não concluídos (o Início diz o mesmo) */
  {re:/posfield',\{st:''\}/,code:"COP.pos.go('posfield','posfield',{st:''})",keep:tr=>!/Conclu[íi]d/i.test(tr.textContent||''),porque:'os concluídos não entram'},
  {re:/COP\.ui\.posobras=.*sit:'Assistência técnica'/,code:"COP.ui.obrasTab='obras';COP.ope.go('obras',{situacao:'Assistência técnica'},'#/obras')",ids:()=>vivas().filter(o=>!o.legadoAT&&sitO(o)==='Assistência técnica').map(o=>o.id)}];
const UNID=new Set(['semproposito','estoque','lugar','produtos','travado']);
const why=m=>{(V.log=V.log||[]).push(m);if(V.log.length>50)V.log.shift()};
function porta(ev){
  if(ev.button)return;const {k}=rota(cur());if(!FONTES.has(k))return;
  const t=ev.target;if(!t||!t.closest)return;const m=document.getElementById('main');if(!m||!m.contains(t))return;
  if(t.closest('#v155-ov,.vd-ov,select,input,textarea,[data-v161chip]'))return;
  const el=t.closest('[onclick],a[href^="#/"]');if(!el||!m.contains(el))return;
  if(el.tagName==='BUTTON'||el.tagName==='TR'||el.closest('tr'))return;
  let code=el.getAttribute('onclick')||(el.tagName==='A'?`location.hash='${J(el.getAttribute('href'))}'`:'');
  code=String(code).trim();if(!code||!NAVRE.test(code)||NAO.test(code)||REG.test(code)){why('code '+code.slice(0,80));return}
  const nl=numLb(el);if(!nl||!nl.big){why('nonum');return}
  const tr=TROCA.find(x=>x.re.test(code));if(tr)code=tr.code;
  const nBig=/^\d[\d.]*$/.test(nl.big.replace(/\s?un\.$/,''))?+nl.big.replace(/\s?un\.$/,'').replace(/\./g,''):null;
  const r=ensaio(code,el);if(!r){why('ensaio '+code.slice(0,80));return}
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  let L=lista(r.html,tr&&(tr.ids||tr.keep)?null:nBig);let recs=null,ponte='',porque='';
  if(tr&&tr.keep&&L){[...L.tb.querySelectorAll(':scope > tbody > tr')].forEach(x=>{if(!tr.keep(x))x.remove()});L.n=L.tb.querySelectorAll(':scope > tbody > tr').length}
  if(tr&&tr.ids&&L){const ids=new Set(tr.ids());const tot=L.n;
    [...L.tb.querySelectorAll(':scope > tbody > tr')].forEach(x=>{const m=/#\/[a-z0-9_]+\/([^'"\s)?&]+)/i.exec((x.getAttribute('onclick')||'')+' '+[...x.querySelectorAll('[onclick],a[href]')].map(e=>e.getAttribute('onclick')||e.getAttribute('href')).join(' '));if(!m||!ids.has(decodeURIComponent(m[1])))x.remove()});
    L.n=L.tb.querySelectorAll(':scope > tbody > tr').length;
    if(L.n!==tot){ponte=`${N0(L.n)} de ${N0(tot)} na lista de ${telaNome(r.h)}`;porque=tr.porque||''}}
  const tela=telaNome(r.h);const {k:dk}=rota(r.h);
  if(!ponte&&L&&nBig!=null&&L.n!==nBig)ponte=UNID.has(dk)||/un\.$/.test(nl.big)?`${N0(nBig)} un. em ${N0(L.n)} produtos`:`${N0(nBig)} no número · ${N0(L.n)} na lista de ${tela}`;
  const hide=r.h==='#/prjpainel'?'[onclick^="V161P.filtro(null)"]':null;
  abrir({code,h:r.h,tela,big:nl.big,lb:nl.lb||tela,sub:nl.sub,tb:L?L.tb:null,ponte,ponteLanding:UNID.has(dk)?ponte:'',porque,hide,vem:tela,recs})}
document.addEventListener('click',ev=>{try{porta(ev)}catch(e){console.error('v161d porta',e)}},true);
/* v161e: as peças do painel curto, para outras camadas abrirem o mesmo painel (Gestão, pontes da Planilha Mestra, Pré-vendas) */
V.abrir=abrir;V.numLb=numLb;V.telaNome=telaNome;V.FONTES=FONTES;

/* Projetos: "7 com projeto em andamento" (Início ou Projetos › Painel) — a lista filtrada mora em Projetos › Painel */
(function ligaP(n){const P=window.V161P;if(P&&typeof P.filtro==='function'&&!P.filtro.__v161d){const f0=P.filtro;
    const W=function(k){if(cur()!=='#/prjpainel'&&k){P.f=k;location.hash='#/prjpainel';return}return f0.apply(this,arguments)};W.__v161d=true;P.filtro=W;return}
  if(n<60)setTimeout(()=>ligaP(n+1),500)})(0);

/* ───────── B · destinos das gavetas que já existem (chamado pelo v155 ao ler a gaveta) ───────── */
const qs=a=>{const o={};String(a||'').split('&').forEach(kv=>{if(!kv)return;const i=kv.indexOf('=');const k=i<0?kv:kv.slice(0,i);o[k]=i<0?'':decodeURIComponent(kv.slice(i+1))});return o};
const ult=()=>{const u=T(()=>window.V156.ult,null);return u&&Date.now()-u.t<10*60e3?u:null};
const NAVF=/COP\.pos\.go\('(\w+)'|COP\.ope\.go\('\w+',[^)]*'(#\/\w+)'\)|COP\.prj\.go\('(\w+)'/;
V.alvo=function(D){
  if(PEND){const s=PEND;if(D.btn){D.btn.h=s.h;D.btn.tela=s.tela||telaNome(s.h);D.btn.code=D.btn.on}return}
  const u=ult();const k=u&&u.k,a=u&&u.a;
  /* gaveta sem destino reconhecido: o link "Abrir …" que usa COP.pos.go / COP.ope.go vira o botão */
  if(!D.btn&&D.alts&&D.alts.length){const i=D.alts.map(x=>NAVF.exec(x.on||'')).findIndex(Boolean);
    if(i>=0){const b=D.alts.splice(i,1)[0];const m=NAVF.exec(b.on);const h=m[1]?'#/'+m[1]:m[2]?m[2]:'#/'+m[3];b.h=h;b.tela=telaNome(h);b.code=b.on;D.btn=b;
      D.__v161d={code:String(b.on).replace(/^\s*V130_close\(\);?/,''),h,tela:b.tela}}}
  const b=D.btn;if(!b)return;
  /* negociações decididas / no futuro / todas: Comercial › Pipeline › Negociações com a situação ligada */
  if(k==='v149:neg'){const q=qs(a);if(q.res!=='aberta'){const F={};if(q.res&&/^(fechada|perdida|futuro)$/.test(q.res))F.res=q.res;['frente','cons','parc','etapa'].forEach(x=>{if(q[x])F[x]=q[x]});
      /* a lista de negociações do Comercial (#/negs) foi fundida na Gestão (FX2.legacy: negs → #/gestao, um painel, não
         uma lista); a lista com TODAS as negociações e o filtro de status é CRM › Oportunidades — o botão diz isso */
      const RL={fechada:'Fechadas',perdida:'Perdidas',futuro:'Futuro',decidida:'Fechadas + perdidas'};
      b.h='#/crmoport';b.tela='Comercial › Pipeline'+(RL[q.res]?' · '+RL[q.res]:' · todas')+' (lista em CRM › Oportunidades)';
      /* v161e: "Vem de" diz o mesmo (o Pipeline é a origem; a lista com todas as decididas mora no CRM) */
      if(D.fonte)D.how.unshift(`<div><b>De onde vem:</b> ${E(D.fonte)}</div>`);D.fonte='Comercial › Pipeline'+(RL[q.res]?' · '+RL[q.res]:' · todas')+' — lista em CRM › Oportunidades';return}}
  /* 224 concluídas na Operação (e as em assistência técnica): Operação › Obras com a situação ligada */
  if(k==='v161x:fin'&&(a==='conc'||a==='at')){const sit=a==='conc'?'Concluída':'Assistência técnica';
    b.h='#/obras';b.tela='Operação › Obras e clientes · '+sit;
    D.__v161d={code:`COP.ui.obrasTab='obras';COP.ope.go('obras',{situacao:'${sit}'},'#/obras')`,h:'#/obras',tela:b.tela,unid:'obras'};return}
  /* Rentabilidade de uma unidade cujas vendas não têm obra (Focal): Comercial › Propostas com essas vendas */
  if(k==='v161:uni'&&a&&a!=='*'){const rows=(D.tabs||[]).flatMap(t=>t.rows.filter(r=>r.kind==='row'));
    const ps=rows.map(r=>/V161\.ir\('p','([^']+)'\)/.exec(r.on||'')).filter(Boolean);
    if(rows.length&&ps.length===rows.length){b.h='#/propostas';b.tela='Comercial › Propostas';
      const recs=ps.map(m=>{const p=T(()=>get('propostas',m[1]),null);return {ids:[m[1]],name:p&&p.numero?'#'+p.numero:'',h:'#/editor/'+m[1]}});
      D.__v161d={code:`S.propF={st:'',fr:'',q:'',cons:'',ym:'',fil:'',vano:''};location.hash='#/propostas'`,h:'#/propostas',tela:b.tela,unid:'propostas',recs};return}}
};
/* a v156 desviava as negociações decididas para CRM › Oportunidades; as portas desta camada vêm primeiro */
(function ligaPainel(n){const W=window.V156;if(W&&typeof W.painel==='function'&&W.painel.__v161&&!W.painel.__v161d){const P0=W.painel;
    const P=function(D,ctx){if(D&&D.__v161d){try{ctx&&ctx.tirar&&ctx.tirar()}catch(e){}ir(D,D.__v161d);return true}return P0.apply(this,arguments)};P.__v161=true;P.__v161d=true;W.painel=P;return}
  if(n<80)setTimeout(()=>ligaPainel(n+1),250)})(0);
/* V161_open (Pós-venda no Início) também diz de qual número veio — sem isso a v156 usava o último V130_open */
(function ligaO(n){const O=window.V161_open;if(typeof O==='function'&&!O.__v161d){const W=function(k,a){try{if(window.V156)V156.ult={k:'v161x:'+k,a:a==null?null:a,t:Date.now()}}catch(e){}return O.apply(this,arguments)};W.__v161d=true;window.V161_open=W;return}
  if(n<60)setTimeout(()=>ligaO(n+1),500)})(0);

/* ───────── Operação › Atividades: a lista que o modal "Atividades atrasadas" mostrava, agora como tela ───────── */
function capAtv(tipo){const c=C();if(!c.ope||!c.ope.__listaAtv0)return null;let out=null;const i0=c.info;c.info=(t,h)=>{out={t,h}};
  try{c.ope.__listaAtv0(tipo)}catch(e){}finally{c.info=i0}return out}
const ATVT={atrasadas:'Atrasadas (fim previsto já passou)',prox7:'Nos próximos 7 dias'};
function atvScreen(){const u=C().ui.opeatividades=C().ui.opeatividades||{};const tipo=u.tipo||'';
  const ls=(tipo?[tipo]:['atrasadas','prox7']).map(t=>{const r=capAtv(t);if(!r)return null;const tp=document.createElement('template');tp.innerHTML=r.h;const tb=tp.content.querySelector('table');
    return {t,tb,rows:tb?[...tb.querySelectorAll('tbody > tr')].filter(x=>x.children.length>1):[]}}).filter(Boolean);
  const seen=new Set();const rows=[];let thead='';ls.forEach(l=>{if(l.tb&&!thead)thead=l.tb.querySelector('thead')?l.tb.querySelector('thead').outerHTML:'';l.rows.forEach(r=>{const k=r.outerHTML;if(seen.has(k))return;seen.add(k);rows.push(r.outerHTML)})});
  const nA=(capAtv('atrasadas')||{t:''}).t.match(/\((\d+)\)/),nP=(capAtv('prox7')||{t:''}).t.match(/\((\d+)\)/);
  const sel=`<select class="form-select form-select-sm" style="max-width:300px" onchange="COP.ui.opeatividades={tipo:this.value};render()"><option value="">Atrasadas + próximos 7 dias</option>${Object.entries(ATVT).map(([v,l])=>`<option value="${v}"${tipo===v?' selected':''}>${l}</option>`).join('')}</select>`;
  const hd=T(()=>head('Atividades',`OPERAÇÃO · atividades das obras ativas · ${nA?N0(+nA[1]):'—'} atrasadas · ${nP?N0(+nP[1]):'—'} nos próximos 7 dias`),'<h1 class="h1">Atividades</h1>');
  return hd+`<div class="card p-2 mb-2"><div class="d-flex flex-wrap gap-2 align-items-center">${sel}<span class="sub ms-auto" style="font-size:12px">${N0(rows.length)} atividade(s)</span></div></div>`+
    `<div class="tblwrap"><table class="tbl">${thead}<tbody>${rows.join('')||'<tr><td colspan="4" class="sub">nenhuma atividade</td></tr>'}</tbody></table></div>`}
(function ligaAtv(n){const c=C();if(c.ope&&typeof c.ope.listaAtv==='function'&&typeof SCREENS==='object'){
    if(!c.ope.__listaAtv0){/* a original (antes do v155, que só marca o modal) */let o=c.ope.listaAtv;c.ope.__listaAtv0=o}
    if(!SCREENS.opeatividades){SCREENS.opeatividades=atvScreen;try{LABEL.opeatividades='Atividades'}catch(e){}try{SEC_OF.opeatividades=SEC_OF.copainel||'ope'}catch(e){}}
    if(!c.ope.listaAtv.__v161d){const W=function(tipo){const r=capAtv(tipo);if(!r)return c.ope.__listaAtv0.apply(this,arguments);
        const m=/^(.*?)\s*\((\d[\d.]*)\)\s*$/.exec(String(r.t||''));const tp=document.createElement('template');tp.innerHTML=r.h;const tb=tp.content.querySelector('table');const sub=tp.content.querySelector('.sub');
        abrir({code:`COP.ui.opeatividades={tipo:'${J(tipo)}'};location.hash='#/opeatividades'`,h:'#/opeatividades',tela:'Operação › Atividades',big:m?N0(+m[2]):'',lb:m?m[1]:r.t,sub:sub?txt(sub):'',tb,vem:'Operação › atividades das obras ativas'})};
      W.__v161d=true;W.__v155=true;c.ope.listaAtv=W}
    return}
  if(n<120)setTimeout(()=>ligaAtv(n+1),500)})(0);

/* ───────── C · Rentabilidade → Financeiro › Obras: a faixa vira a etiqueta padrão ───────── */
(function ligaF(n){if(typeof SCREENS==='object'&&typeof SCREENS.fobras==='function'&&window.V161F&&V161F.chipHTML){const f0=SCREENS.fobras;if(f0.__v161d)return;
    const W=function(arg){let h=f0.apply(this,arguments);if(typeof h!=='string'||arg)return h;
      const i=h.indexOf('<div class="card p-3 mb-3" id="v161_ban"');if(i<0)return h;
      const j=h.indexOf('</div>',h.indexOf('</button>',i));if(j<0)return h;const ban=h.slice(i,j+6);
      const tp=document.createElement('template');tp.innerHTML=ban;const sp=tp.content.querySelector('span');const b=sp&&sp.querySelector('b');
      const lb=b?txt(b).replace(/^Filtrado pela\s+/i,''):'Rentabilidade em andamento';if(b)b.remove();
      const ponte=sp?sp.innerHTML.replace(/^\s*:\s*/,''):'';
      return h.slice(0,i)+V161F.chipHTML(cap1(lb),'V161.limpar()',ponte)+h.slice(j+6)};
    Object.keys(f0).forEach(k=>{try{W[k]=f0[k]}catch(e){}});W.__v161d=true;SCREENS.fobras=W;return}
  if(n<60)setTimeout(()=>ligaF(n+1),500)})(0);

/* ───────── CRM › Painel de Gestão: o detalhe de cada número (a janela do CRM) vira o mesmo painel curto ───────── */
const CRMK={parceiros:['#/crmparceiros','parceiros',"V156.crm('parceiros')"],tarefas:['#/crmtarefas','tarefas',"V156.crm('tarefas')"],
  oportunidades:['#/crmoport','oportunidades',"V156.crm('oport')"],interacoes:['#/crminteracoes','interacoes',"V156.crm('interacoes')"]};
function ligaCRM(){const f=document.getElementById('crmFrame');let w=null;try{w=f&&f.contentWindow}catch(e){}if(!w||typeof w.detalheGrupo!=='function'||w.detalheGrupo.__v161d)return;
  const o=w.detalheGrupo;const W=function(id,i){const r=o.apply(this,arguments);
    try{const v=T(()=>w.systaagView(),'');const ch=T(()=>w.eval('CHARTS')[id],null);const K=ch&&CRMK[ch.kind];
      if(!K||!/^(gestao|home|semanal|relatorios)$/.test(v||''))return r;
      const m=w.document.getElementById('modal');const tb0=m&&m.querySelector('.content table');if(!tb0)return r;
      const t=txt(m.querySelector('header h2'));const mm=/^(.*?)\s*\((\d[\d.]*)\)\s*$/.exec(t);let lb=mm?mm[1]:t;const ps=lb.split(' · ');if(ps.length===2&&ps[0]===ps[1])lb=ps[0];
      const pt=m.querySelector('.v157-pt');
      const tb=document.importNode(tb0,true);tb.querySelectorAll('tr[onclick]').forEach(x=>{const c=String(x.getAttribute('onclick')).replace(/closeModal\(\);?/,'');
        x.setAttribute('onclick',`try{document.getElementById('crmFrame').contentWindow.eval(${E(JSON.stringify(c))})}catch(e){}`)});
      try{w.closeModal()}catch(e){m.remove()}
      abrir({code:K[2],h:K[0],tela:telaNome(K[0]),big:mm?N0(+mm[2].replace(/\./g,'')):'',lb,sub:pt?txt(pt):'',tb,vem:'CRM › Painel de Gestão',unid:K[1]})}catch(e){console.error('v161d crm',e)}
    return r};
  W.__v161d=true;w.detalheGrupo=W}
setInterval(()=>{if(/^#\/crm/.test(cur()))try{ligaCRM()}catch(e){}},700);

/* ───────── D · contagens nos títulos e abas em pt-BR ───────── */
const ANOS=x=>x>=1990&&x<=2099;
function fmtBadges(root){if(!root)return;const sel='h1,h2,h3,h4,h5,h6,.h1,.tabs button,.tabs a,h1 .chip,.section-title,.card-title,.badge';
  root.querySelectorAll(sel).forEach(el=>{if(el.closest('#v155-ov,[data-v161chip],input,textarea,select'))return;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null);let t;
    while((t=w.nextNode())){const s=t.data;if(!/\d{4}/.test(s))continue;
      const n=s.replace(/(^|[\s(])(\d{4,})(?=$|[\s)·,;:])/g,(m0,a,d)=>{const x=+d;if(ANOS(x)||d.length>9)return m0;return a+x.toLocaleString('pt-BR')});
      if(n!==s)t.data=n}})}
V.fmtBadges=fmtBadges;
/* links com número nas telas-resumo: o núcleo navega os <a href="#/…"> já na fase de captura da janela (antes de
   qualquer outra camada); com o destino no onclick, o clique passa pela porta única como os outros números */
function linksPorta(root){if(!root||!FONTES.has(rota(cur()).k))return;
  root.querySelectorAll('a[href^="#/"]').forEach(a=>{if(a.hasAttribute('onclick')||a.closest('.dropdown-menu,nav,.tabs,#v155-ov,[data-v161chip]'))return;const h=a.getAttribute('href');
    if(!/\d/.test(a.textContent||'')||REG.test(`'${h}'`))return;a.setAttribute('data-v161dh',h);a.setAttribute('href','javascript:void 0');a.setAttribute('onclick',`location.hash='${J(h)}'`)})}
let fq=false;const fRun=()=>{fq=false;const m=document.getElementById('main');try{fmtBadges(m)}catch(e){}try{linksPorta(m)}catch(e){}};
try{new MutationObserver(ms=>{if(fq)return;if(!ms.some(m=>m.target&&m.target.id==='main'||m.target&&m.target.closest&&m.target.closest('#main')))return;fRun()}).observe(document.body,{childList:true,subtree:true})}catch(e){}
fRun();
})();
