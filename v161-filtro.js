/* =====================================================================================================
   v161 · NÚMERO → TELA JÁ FILTRADA, SEM FAIXA E SEM TREMER (Bruno, 05/11/2026)
   O que estava errado (visto ao vivo no Chrome do Bruno):
     1. a faixa azul "Filtrado pelo número X … Mostrar tudo ✕" voltava sozinha e a página tremia: a v155 reaplicava o
        filtro a cada 500 ms por 20 s (linhas apareciam e sumiam, a faixa era reinserida, a tela pulava com scrollIntoView);
     2. os controles da própria tela diziam o contrário ("324 de 324", "Todos os status", "Mostrando 911 de 911");
     3. o filtro vazava: depois do 84 (ações atrasadas), o 104 do CRM › Painel de Gestão abriu "Filtrado pelo número 84";
     4. 84 no Início × 83 no CRM: o "hoje" do núcleo era o dia em UTC (depois das 21h de Brasília já era amanhã).
   Agora (este arquivo é o motor; a v155 só delega para ele):
     A. sem faixa. A tela de destino mostra só os registros do número; quando a tela tem um controle que diz exatamente
        isso (status do CRM › Parceiros, "Atrasadas" em Próximas ações, Frente/Consultor do Pipeline, ano das Propostas,
        situação das Obras, situação do Estoque…) é ESSE controle que fica ligado — os contadores da tela batem sozinhos.
        Onde não há controle, as outras linhas ficam escondidas e os contadores da tela são reescritos ("34 de 98 itens").
        Uma etiqueta pequena ("36 Escritórios ativos ×", no estilo da v160) fica onde ficam os filtros; o × devolve a lista
        inteira. A ponte (registros do número que esta lista não mostra) é uma linha discreta logo abaixo — só se existir.
     B. sem tremer: o filtro é aplicado no mesmo quadro em que a lista é desenhada (MutationObserver, que roda antes da
        pintura), nunca por relógio; nada de rolar a tela sozinho; a etiqueta só é recolocada quando a tela se redesenha.
     C. sem vazar: o filtro pertence a UMA chegada — sai ao abrir outro número, ao ir para outra tela (ou outra vista do
        CRM) ou no ×. Um modal/painel aberto depois nunca herda o filtro (só a lista escolhida na chegada é tocada).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161f)return;window.__v161f=true;
const ST=window.__V155D=window.__V155D||{all:{},how:{},scroll:{},sp:null,key:null};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const N0=v=>(+v||0).toLocaleString('pt-BR');
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=el=>el?String(el.textContent||'').replace(/\s+/g,' ').trim():'';
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const cur=()=>(location.hash||'').split('?')[0];
const V=window.V161F={log:[]};
const dlog=m=>{try{V.log.push([Date.now(),m]);if(V.log.length>200)V.log.shift()}catch(e){}};

/* ───────── estilo (no documento principal e dentro do iframe do CRM) ───────── */
const CSS=`
.v161-hid{display:none!important}
.v161-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0 8px}
.v161-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(42,120,214,.12);color:#2a78d6;border-radius:999px;padding:3px 10px;font-size:12px;line-height:1.5;font-weight:500;font-family:inherit}
.v161-tag b{cursor:pointer;font-weight:600;font-size:13px;line-height:1;padding:0 1px}
.v161-tag b:hover{opacity:.7}
.v161-ponte{flex-basis:100%;font-size:11.5px;line-height:1.45;opacity:.72;margin-top:2px}
.v161-ponte a{color:inherit;text-decoration:underline;cursor:pointer}
`;
function css(doc){doc=doc||document;if(!doc||doc.getElementById('v161-css'))return;const s=doc.createElement('style');s.id='v161-css';s.textContent=CSS;(doc.head||doc.documentElement).appendChild(s)}

/* ───────── o CRM (iframe) ───────── */
const CRMV={crmparceiros:'parceiros',crminteracoes:'interacoes',crmtarefas:'tarefas',crmoport:'oportunidades',crmesteira:'esteira',crmgestao:'gestao',crmhome:'home',crmconfig:'config'};
const FR=()=>document.getElementById('crmFrame');
const FW=()=>{const f=FR();try{return f&&f.contentWindow}catch(e){return null}};
const FD=()=>{const f=FR();try{return f&&f.contentDocument}catch(e){return null}};
const fview=()=>T(()=>FW().systaagView(),null);
const fval=code=>T(()=>FW().eval(code),null);
const fToday=()=>fval('todayISO()')||T(()=>today(),'');
const addD=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
/* o CRM decide qual vista mostrar pelo systaagGo do host: quando há uma chegada pendente nesta vista, os filtros
   nativos dela entram já na primeira pintura */
function ligaFrame(){const w=FW();if(!w||typeof w.systaagGo!=='function'||w.systaagGo.__v161)return;
  const o=w.systaagGo;const g=function(v,p){try{if(L&&L.crm&&v===L.crm&&L.nat&&L.nat.crm&&(!p||!Object.keys(p).length))p=Object.assign({},L.nat.crm)}catch(e){}return o.call(this,v,p)};
  g.__v161=true;w.systaagGo=g;
  /* atalhos do host que chamam o go() do CRM direto, sem filtros (ex.: V156.crm abre a vista 600 ms depois): enquanto a
     chegada está pendente/ativa e ninguém clicou, a mesma vista recebe os mesmos filtros nativos */
  try{const go0=w.go;if(typeof go0==='function'&&!go0.__v161){const gg=function(v,p){try{if(L&&L.crm&&v===L.crm&&L.nat&&L.nat.crm&&ULT<=L.t0+250&&(!p||!Object.keys(p).length))p=Object.assign({},L.nat.crm)}catch(e){}return go0.call(this,v,p)};gg.__v161=true;w.go=gg}}catch(e){}
  try{const d=w.document;if(!d||!d.body)return;css(d);if(!d.__v161o){d.__v161o=1;new MutationObserver(onMut).observe(d.body||d.documentElement,{childList:true,subtree:true});
    d.addEventListener('pointerdown',()=>{ULT=Date.now()},true);d.addEventListener('keydown',ev=>{if(ev.key!=='Tab')ULT=Date.now()},true)}}catch(e){}}

/* ───────── os filtros nativos: o controle da própria tela que diz exatamente o número ───────── */
const GRP={ativo:/^ativo/,aq:/aquec/,frio:/^frio/,cont:/contatar/};
function crmStatus(g){const all=fval('STATUS.slice()')||[];if(g==='*')return null;
  if(g==='base')return all.filter(s=>GRP.ativo.test(nz(s))||GRP.aq.test(nz(s))||GRP.frio.test(nz(s)));
  if(g==='outros')return all.filter(s=>!Object.values(GRP).some(r=>r.test(nz(s))));
  return GRP[g]?all.filter(s=>GRP[g].test(nz(s))):null}
const qs=a=>{const o={};String(a||'').split('&').forEach(kv=>{if(!kv)return;const i=kv.indexOf('=');const k=i<0?kv:kv.slice(0,i);o[k]=i<0?'':decodeURIComponent(kv.slice(i+1))});return o};
/* devolve {crm:{params do CRM}} ou {set(),clear(),still()} para o estado da tela principal */
function nativo(base,key){const k=key&&key.k,a=key&&key.a;
  /* v166: telas que mostram só os primeiros 30 cartões ("carregar mais") abrem com todos, para o número caber inteiro */
  if(base==='#/posobras')return {set(){COP.ui.posobras=Object.assign({},COP.ui.posobras||{},{lim:100000})},clear(){try{const o=Object.assign({},COP.ui.posobras||{});delete o.lim;COP.ui.posobras=o}catch(e){}},still(){return true},desc:'todas as obras finalizadas na tela'};
  if(base==='#/crmparceiros'){
    /* os status vêm da configuração do CRM: lidos quando o iframe estiver pronto (na 1ª abertura ele ainda não existe) */
    if(k==='v149:parc'&&a&&a!=='*'){const N={desc:'status do grupo '+a};let cache=null;
      Object.defineProperty(N,'crm',{enumerable:true,get(){if(cache)return cache;const st=crmStatus(a);if(st&&st.length){cache={status:st};N.desc='status '+st.join(' + ')}return cache}});return N}
    return null}
  if(base==='#/crmtarefas'){
    if(k==='tarAtr')return {crm:{estado:'late'},desc:'Status: Atrasadas'};
    if(k==='tarProx'){const N={desc:'De hoje até hoje + 7 dias'};let cache=null;Object.defineProperty(N,'crm',{enumerable:true,get(){if(cache)return cache;const t=fToday();if(t)cache={de:t,ate:addD(t,7)};return cache}});return N}
    return null}
  if(base==='#/crmoport'){
    if(k==='v149:neg'){const q=qs(a);const R={fechada:['FECHADO'],perdida:['PERDIDO'],futuro:['FUTURO'],decidida:['FECHADO','PERDIDO']};const p={};
      if(q.res&&R[q.res])p.status=R[q.res];if(q.cons)p.cons=q.cons;if(Object.keys(p).length)return {crm:p,desc:JSON.stringify(p)}}
    return null}
  if(base==='#/pipeline'){
    if(k==='v149:neg'){const q=qs(a);if(q.res&&q.res!=='aberta')return null;const F={};if(q.frente)F.frente=q.frente;if(q.cons)F.cons=q.cons;
      return {set(){S.comF=Object.assign({},F)},clear(){S.comF={}},still(){const f=S.comF||{};return (f.frente||'')===(F.frente||'')&&(f.cons||'')===(F.cons||'')},desc:'S.comF='+JSON.stringify(F)}}
    return null}
  if(base==='#/propostas'){
    if(k==='vendAno'){const ano=String(T(()=>S.db.meta.ano,'')||new Date().getFullYear());
      return {set(){S.propF={vano:ano}},clear(){S.propF={}},still(){return (S.propF||{}).vano===ano},desc:'vendidas em '+ano}}
    return null}
  if(base==='#/obras'){
    if(k==='v149:obras')return {set(){COP.ui.obras={situacao:'Em andamento'};COP.ui.obrasTab='obras'},clear(){COP.ui.obras={}},still(){return (COP.ui.obras||{}).situacao==='Em andamento'},desc:'Situação: Em andamento'};
    return null}
  if(base==='#/prjobras'){
    /* os entregáveis pendentes contam obras de várias situações: a lista abre em "Todas as situações" e o resto fica de fora */
    if(k==='prj')return {set(){COP.ui.prjobras={situacao:'*'}},clear(){COP.ui.prjobras={}},still(){return (COP.ui.prjobras||{}).situacao==='*'},desc:'Situação: todas'};
    return null}
  if(base==='#/estoque'){
    const SIT={est_livre:'livre',est_alo:'alocado',est_cons:'consignado',est_fora:'patrimonio'};
    /* o seletor "Disponibilidade" da lista de produtos (S.plF.est.sit) — fica marcado, e a Qtd de cada produto passa a ser
       só a das unidades nessa situação */
    if(SIT[k]){const X=SIT[k];return {set(){S.estSit=null;S.estCat=null;S.plF=Object.assign({},S.plF||{});S.plF.est=Object.assign({},S.plF.est||{},{sit:X})},
      clear(){try{if(S.plF&&S.plF.est){const o=Object.assign({},S.plF.est);delete o.sit;S.plF=Object.assign({},S.plF,{est:o})}}catch(e){}},
      still(){return ((S.plF||{}).est||{}).sit===X},desc:'Disponibilidade: '+X}}
    return null}
  return null}

/* ───────── a chegada ───────── */
let L=null;let ULT=0;let KEY=null;
['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev,e=>{if(ev==='keydown'&&e.key==='Tab')return;ULT=Date.now()},true));
/* a v155 avisa quando o botão "Abrir na tela, já filtrado" é clicado: guarda de qual número ele veio */
V.desde=function(){const u=T(()=>window.V156.ult,null);KEY=u&&Date.now()-u.t<10*60e3?{k:u.k,a:u.a,t:Date.now()}:{k:null,a:null,t:Date.now()}};
/* chamado logo ANTES de navegar: liga o filtro nativo para a tela já nascer filtrada */
V.arm=function(sp,extra){
  if(!sp){V.limpar();return}
  if(L&&L.sp===sp)return;
  if(L)fim(false);
  const base=String(sp.path||'').split('?')[0];
  const key=KEY&&Date.now()-KEY.t<4000?KEY:null;KEY=null;
  L={sp,base,crm:CRMV[base.replace(/^#\//,'')]||null,t0:Date.now(),active:false,nat:null,regos:0,ins:0,host:null,M:0,n:0,
    recsAt:extra&&extra.recsAt||null,limpa:extra&&extra.limpa||null,hide:extra&&extra.hide||null,key};
  try{L.nat=nativo(base,key)}catch(e){console.error('v161 nativo',e);L.nat=null}
  if(L.nat&&L.nat.set)try{L.nat.set()}catch(e){console.error('v161 nativo set',e);L.nat=null}
  dlog('arm '+base+' '+(key?key.k+'|'+key.a:'-')+' nat='+(L.nat?L.nat.desc:'-'));
  ligaFrame();
  /* chega na tela de destino? o filtro nativo do CRM, quando o CRM já está aberto nessa vista */
};
/* depois de navegar: se a tela já era a de destino (o hash não mudou), redesenha uma vez com o filtro nativo */
V.depois=function(){if(!L)return;if(cur()!==L.base)return;
  try{if(L.crm){if(L.nat&&L.nat.crm&&fview()===L.crm){const w=FW();if(w)w.systaagGo(L.crm,Object.assign({},L.nat.crm))}}
    else if(L.nat&&L.nat.set){renderMain()}}catch(e){}
  sync()};

/* o estado de filtro que a porta (V156) ligou na tela: ao sair dela, volta ao normal */
const RESET={'#/propostas':()=>{S.propF={}},'#/negs':()=>{S.negF={}},'#/estoque':()=>{S.estCat=null;S.estSit=null},'#/obras':()=>{COP.ui.obras={}},'#/prjobras':()=>{COP.ui.prjobras={}}};
/* termina a chegada. restaura=true (×): devolve a lista inteira já redesenhada; false: só solta (foi para outro lugar) */
function fim(restaura){const l=L;if(!l)return;L=null;if(ST.sp===l.sp)ST.sp=null;dlog('fim '+l.base+' '+(restaura?'×':'solto'));
  [document,FD()].forEach(d=>{if(!d)return;try{d.querySelectorAll('.v161-hid').forEach(x=>x.classList.remove('v161-hid'));d.querySelectorAll('[data-v161chip],[data-v161vz]').forEach(x=>x.remove());
    d.querySelectorAll('[data-v161t]').forEach(x=>{if(x.__v161o!=null){x.data=x.__v161o;x.__v161o=null}x.removeAttribute&&x.removeAttribute('data-v161t')})}catch(e){}});
  (l.txt||[]).forEach(n=>{try{if(n.__v161o!=null){n.data=n.__v161o;n.__v161o=null}}catch(e){}});
  if(l.nat&&l.nat.clear)try{l.nat.clear()}catch(e){}
  if(l.limpa&&restaura)try{l.limpa()}catch(e){}
  else if(l.limpa&&RESET[l.base])try{RESET[l.base]()}catch(e){}
  if(restaura){
    if(l.crm){try{if(fview()===l.crm){const w=FW();if(l.nat&&l.nat.crm)w.systaagGo(l.crm,{});else w.render()}}catch(e){}}
    else if(cur()===l.base&&!l.limpa){try{renderMain()}catch(e){}}}
}
V.limpar=function(){fim(false)};
V.tirar=function(){fim(true)};
V.ativo=()=>L?{base:L.base,lb:L.sp.lb,n:L.n,M:L.M,ins:L.ins,nat:L.nat?L.nat.desc:null,active:L.active}:null;

/* ───────── aplicar: síncrono, idempotente, chamado pelo observador antes da pintura ───────── */
const EXC='#v155-ov,.vd-ov,.v155-hid,#modal,.modal-bg,[data-v161chip],[data-v155ban],[data-v161vz]';
function raiz(){if(L.crm){const d=FD();return d&&d.body?d.body:null}return document.getElementById('main')}
function candidatos(root,recs){const out=[];
  root.querySelectorAll('table').forEach(t=>{if(t.closest(EXC))return;if(t.parentElement&&t.parentElement.closest('table'))return;
    const rows=[...t.querySelectorAll(':scope > tbody > tr')].filter(r=>!r.classList.contains('tot')&&!/^total\b/i.test(txt(r.firstElementChild)));
    if(rows.length)out.push({rows,host:t.closest('.tblwrap,.tw,.tablewrap,.table-responsive')||t,table:t})});
  const g={};root.querySelectorAll('[onclick]').forEach(e=>{if(e.tagName==='TR'||e.closest('table')||e.closest(EXC))return;const oc=e.getAttribute('onclick')||'';if(!/'[^']{3,}'/.test(oc))return;
    const sh=oc.replace(/'[^']*'/g,"''").replace(/\d+/g,'0');(g[sh]=g[sh]||[]).push(e)});
  Object.values(g).forEach(xs=>{if(xs.length<3)return;const c=cartoes(xs);out.push({rows:c,host:comum(c),cards:true})});
  return out}
/* cartões com vários cliques do mesmo registro (ex.: Pós-venda › Propostas: 3 links por proposta): a "linha" é o cartão
   inteiro — o ancestral de cada registro que é filho direto do contêiner da lista — para esconder/mostrar o cartão todo */
const IDRE=/#\/[a-z0-9_]+\/([^'"\s)?&]+)/i;
function cartoes(xs){const by=new Map();let semId=0;
  xs.forEach(e=>{const oc=e.getAttribute('onclick')||'';const m=IDRE.exec(oc)||/\('([A-Za-z]{2,}[-_][\w.-]+)'/.exec(oc);if(!m){semId++;return} /* v166: cartões cujo clique é uma função com o id ('OBR-…'), não um #/endereço */const k=m[1];let l=by.get(k);if(!l)by.set(k,l=[]);l.push(e)});
  if(semId||by.size===xs.length||by.size<2)return xs;
  const lcas=[...by.values()].map(l=>l.length===1?l[0]:comum(l));const C=comum(lcas);if(!C)return xs;
  const rows=lcas.map(e=>{let x=e;while(x&&x.parentElement!==C)x=x.parentElement;return x});
  if(rows.some(r=>!r)||new Set(rows).size!==rows.length)return lcas;
  return rows}
function comum(xs){let a=xs[0].parentElement;while(a&&!xs.every(x=>a.contains(x)))a=a.parentElement;return a||xs[0].parentElement}
let EM=false;
function sync(){
  if(EM)return;
  if(!L){if(ST.sp&&ST.sp.__v161!==true){ST.sp.__v161=true;V.arm(ST.sp)}if(!L)return}
  EM=true;
  try{
    const sp=L.sp;
    if(ST.sp!==sp){if(!ST.sp){fim(false);return}V.arm(ST.sp);if(!L)return}
    const agora=Date.now();const clicou=ULT>L.t0+250;
    /* fora da tela de destino */
    if(L.crm){
      /* o CRM troca o endereço sozinho (#/crmhome enquanto o iframe abre): quem decide é a vista do iframe */
      if(!/^#\/crm/.test(cur())){if(L.active||clicou||agora-L.t0>10000)fim(false);return}
      /* v161d: depois de chegar, o endereço foi para outra vista (digitado, voltar, menu) → a chegada acabou */
      if(L.active&&cur()!==L.base){fim(false);return}
      ligaFrame();const v=fview();
      if(v!==L.crm){
        if(clicou){fim(false);return}
        /* o CRM, ao abrir pela primeira vez, volta para a página inicial dele: leva de volta (no máx. 4 vezes) */
        if(v&&L.regos<4&&T(()=>FW().systaagReady(),false)){L.regos++;dlog('rego '+v+'→'+L.crm);try{FW().systaagGo(L.crm,L.nat&&L.nat.crm?Object.assign({},L.nat.crm):{})}catch(e){}}
        else if(agora-L.t0>12000)fim(false);
        return}
      const NP=L.nat&&L.nat.crm;
      if(NP){const P=fval('VIEW.params')||{};const ok=Object.keys(NP).every(k=>JSON.stringify(P[k])===JSON.stringify(NP[k]));
        if(!ok){
          /* a pessoa mexeu no filtro pelo próprio CRM (Limpar, outro status…) → a chegada acabou */
          if(L.active||clicou){fim(false);return}
          /* o CRM abriu esta vista sem o filtro (iframe ainda nascendo): abre de novo, já com ele */
          if(L.regos<4){L.regos++;dlog('rego params');try{FW().systaagGo(L.crm,Object.assign({},NP))}catch(e){}return}}}}
    else if(cur()!==L.base){if(L.active||clicou||agora-L.t0>10000)fim(false);return}
    else if(L.active&&L.nat&&L.nat.still&&!T(()=>L.nat.still(),true)){fim(false);return}
    const root=raiz();if(!root)return;
    /* registros lidos da própria tela de destino (quando a regra do número só existe nela) */
    if((!sp.recs||!sp.recs.length)&&L.recsAt){const r=T(()=>L.recsAt(),null);if(!r||!r.length)return;
      sp.recs=r.map(x=>({ids:(x.ids||[]).map(String),name:x.name||'',nn:nz(x.name||''),toks:x.toks||[],h:x.h||''}));sp.n=sp.recs.length;if(L.ponteF)sp.ponte=L.ponteF(r);L.recsAt=null}
    const recs=sp.recs||[];
    if(!recs.length){if(!sp.zero)return;
      /* v166: o número é 0 → a lista principal da tela fica vazia (não a lista inteira), com "Mostrando 0 de M" e a etiqueta */
      const cz=candidatos(root,[]).filter(c=>!c.cards||c.rows.length>=3).sort((a,b)=>(b.table?1:0)-(a.table?1:0)||b.rows.length-a.rows.length);
      const bz=cz[0];if(!bz){if(!L.active&&agora-L.t0<1500)return;L.active=true;return}
      L.active=true;bz.n=0;bz.ok=bz.rows.map(()=>false);bz.miss=[];
      bz.rows.forEach(r=>r.classList.add('v161-hid'));
      if(bz.table){const tb=bz.table.querySelector(':scope > tbody');if(tb&&!tb.querySelector('[data-v161vz]')){const cols=Math.max(1,(bz.rows[0]&&bz.rows[0].children.length)||1);
        const tr=root.ownerDocument.createElement('tr');tr.setAttribute('data-v161vz','1');tr.innerHTML='<td colspan="'+cols+'" style="text-align:center;padding:18px;opacity:.7">Nenhum registro — o número clicado é 0 ('+E(rotulo(sp))+')</td>';tb.appendChild(tr)}}
      L.M=bz.rows.length;L.n=0;L.host=bz.host;L.miss=[];contadores(root,bz,L.M,0);mostrando(root,bz,0);etiqueta(root,bz);
      window.__V161_last={n:0,M:L.M,lb:sp.lb,path:L.base,zero:true};return}
    const cs=candidatos(root,recs);if(!cs.length)return;
    let best=null;
    cs.forEach(c=>{const as=window.V155D.casar(recs,c.rows);c.ok=as.ok;c.n=as.n;c.miss=as.miss;if(!best||c.n>best.n||(c.n===best.n&&c.n>0&&c.rows.length>best.rows.length))best=c});
    if(!best||!best.n){if(!L.active&&agora-L.t0<1500)return;/* a lista ainda não chegou */}
    L.active=true;
    const M=best.rows.length,n=best.n;
    if(n){best.rows.forEach((r,i)=>{if(best.ok[i])r.classList.remove('v161-hid');else r.classList.add('v161-hid')});
      if(n<M&&best.table)best.table.querySelectorAll(':scope > tbody > tr').forEach(r=>{if(r.classList.contains('tot')||/^total\b/i.test(txt(r.firstElementChild)))r.classList.add('v161-hid')})}
    L.M=M;L.n=n;L.host=best.host;L.miss=best.miss||[];
    if(n&&n<M)contadores(root,best,M,n);else if(n&&L.txt&&L.txt.length){/* (a tela redesenhou sem precisar) */}
    if(n)mostrando(root,best,n);
    etiqueta(root,best);
    window.__V161_last={n,M,lb:sp.lb,path:L.base,miss:L.miss.map(r=>r.name),nat:L.nat?L.nat.desc:null,ins:L.ins,
      escondidas:best.rows.filter((r,i)=>!best.ok[i]).slice(0,6).map(r=>txt(r).slice(0,60))};
  }catch(e){console.error('v161 filtro',e)}
  finally{EM=false}}
V.sync=sync;

/* os contadores da tela ("98 itens", "95 obra(s)", "Mostrando 911 de 911", "324 de 324") passam a dizer o filtro */
function contadores(root,best,M,n){
  const fm=[String(M),N0(M)].filter((x,i,a)=>a.indexOf(x)===i).map(x=>x.replace(/\./g,'\\.')).join('|');
  const re1=new RegExp('(^|[^\\d.,])('+fm+')( de )(\\d[\\d.]*)');
  const re2=new RegExp('(^|[^\\d.,])('+fm+')(\\s+(?:itens|item|obra\\(s\\)|obras|ordem\\(ns\\)|ordens|propostas?|negocia[çc][õo]es|produtos?|registros?|parceiros?|linhas?|resultados?|a[çc][õo]es|unidades|pessoas|chamados))(?![\\w])','i');
  const reS=new RegExp('^\\s*('+fm+')\\s*$');
  const d=root.ownerDocument;const w=d.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);let t;const mexi=L.txt=L.txt||[];let k=0;
  /* a lista em cartões pode ser a tela inteira: o limite é o 1º cartão */
  const ref=(best.host===root||best.host.contains(root))?best.rows[0]:best.host;
  while((t=w.nextNode())&&k<4000){k++;if(ref.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING&&!ref.contains(t))break;
    const p=t.parentElement;if(!p||ref.contains(t)||p.closest(EXC+',script,style,option,select,textarea'))continue;

    const s0=t.__v161o!=null?t.__v161o:t.data;let s=s0;
    /* v166: frase com valor ("R$ 779.042 = resultado das 769 propostas") fala do total — trocar só a contagem a deixaria falsa */
    {const blk=p.closest('p,li,td,div,span')||p;const bt=txt(blk);if(/R\$/.test(bt)&&bt.length<500&&!/^\s*Mostrando /.test(s0))continue}
    const rm=/^(\s*Mostrando )(\d[\d.]*)( de )/.exec(s);
    if(rm&&+rm[2].replace(/\./g,'')>n)s=s.replace(rm[0],rm[1]+N0(n)+rm[3]);
    else if(re1.test(s))s=s.replace(re1,(m,a,b,c,dd)=>a+N0(n)+c+dd);
    else if(re2.test(s))s=s.replace(re2,(m,a,b,c)=>a+N0(n)+' de '+b+c);
    else if(reS.test(s)&&p.closest('.chip,.badge,h1,h2,h3,h4,.section-title,.muted'))s=N0(n)+' de '+s.trim();
    if(s!==t.data){if(t.__v161o==null){t.__v161o=t.data;mexi.push(t)}t.data=s}}}

/* "Mostrando A de B" acima da lista descreve o que está na tela: A = o que ficou visível (também quando o filtro nativo
   já cortou a lista, mas a tela conta mais coisas do que o quadro mostra — ex.: Pipeline "Mostrando 268 de 268") */
function mostrando(root,best,n){const d=root.ownerDocument;const w=d.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);let t,k=0;const mexi=L.txt=L.txt||[];
  while((t=w.nextNode())&&k<600){k++;if(!/Mostrando \d/.test(t.data))continue;const p=t.parentElement;if(!p||best.host.contains(t)&&!best.cards||p.closest(EXC))continue;
    const rm=/^(\s*Mostrando )(\d[\d.]*)( de )/.exec(t.data);if(!rm)continue;if(+rm[2].replace(/\./g,'')<=n)continue;
    if(t.__v161o==null){t.__v161o=t.data;mexi.push(t)}t.data=t.data.replace(rm[0],rm[1]+N0(n)+rm[3])}}
/* a etiqueta ("36 Escritórios ativos ×") onde ficam os filtros da tela, e a ponte numa linha discreta */
function rotulo(sp){let s=String(sp.lb||'').trim();s=s.replace(/\s+·\s+/,' ');return s}
function etiqueta(root,best){
  const d=root.ownerDocument;css(d);
  let box=d.querySelector('[data-v161chip]');
  const ponte=ponteTxt(best);
  const html=`<span class="v161-tag">${E(rotulo(L.sp))} <b role="button" title="Mostrar tudo" aria-label="Tirar o filtro">×</b></span>${ponte?`<div class="v161-ponte">${ponte}</div>`:''}`;
  /* o filtro nativo que a tela já desenha como etiqueta própria ("Filtro: vendidas em 2026 · limpar ✕", "Consultor: X ×")
     fica escondido — a etiqueta do número é a única, e o × dela desliga o mesmo filtro */
  if(L.nat){const antes=el=>!!(best.host.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_PRECEDING)||(best.cards&&best.host.contains(el));
    root.querySelectorAll('.chip.info,.v160-tag').forEach(c=>{if(c.closest('[data-v161chip]')||!antes(c))return;const t=txt(c);
      if(c.classList.contains('v160-tag')){c.classList.add('v161-hid');return}
      if(/^Filtro:/i.test(t)){const p=c.parentElement;if(p&&p!==root&&p.querySelectorAll('.chip').length===1)p.classList.add('v161-hid');else c.classList.add('v161-hid')}})}
  if(L.hide)root.querySelectorAll(L.hide).forEach(c=>{if(!c.closest('[data-v161chip]'))c.classList.add('v161-hid')});
  titulo(root,best);
  const novo=!box;
  if(novo){box=d.createElement('div');box.className='v161-chips';box.setAttribute('data-v161chip','1')}
  if(box.getAttribute('data-h')!==html){box.setAttribute('data-h',html);box.innerHTML=html;liga(box)}
  /* lugar: onde ficam os filtros da tela; se a tela se reorganizou depois (ex.: a v160 monta a barra de filtros no
     quadro seguinte), a etiqueta muda junto — antes da pintura, sem recriar */
  const lugar=onde(root,best);
  if(lugar.dentro){if(box.parentElement!==lugar.dentro)lugar.dentro.appendChild(box)}
  else if(lugar.depois){if(box.previousElementSibling!==lugar.depois)lugar.depois.parentNode.insertBefore(box,lugar.depois.nextSibling)}
  else if(novo||!box.isConnected||!root.contains(box)){/* logo acima da lista, sempre DENTRO da tela (a lista em cartões pode ocupar a tela toda) */
    let h=best.host;if(h===root||h.contains(root)){h=best.rows[0];while(h&&h.parentElement!==root)h=h.parentElement}
    if(h&&h.parentNode)h.parentNode.insertBefore(box,h);else root.insertBefore(box,root.firstChild)}
  if(novo){L.ins++;dlog('chip '+L.ins)}}
/* o número do título ("Propostas 1.345") passa a dizer o filtro: "568 de 1.345" */
function titulo(root,best){const n=L.n||best.n;if(!n)return;const h=root.querySelector('h1,.h1');if(!h)return;const c=h.querySelector('.chip,.badge');if(!c)return;
  const w=root.ownerDocument.createTreeWalker(c,NodeFilter.SHOW_TEXT,null);let t;const mexi=L.txt=L.txt||[];
  while((t=w.nextNode())){const s0=t.__v161o!=null?t.__v161o:t.data;const m=/^\s*(\d[\d.]*)\s*$/.exec(s0);if(!m)continue;const X=+m[1].replace(/\./g,'');if(!(X>n))continue;
    const s=N0(n)+' de '+N0(X);if(t.data!==s){if(t.__v161o==null){t.__v161o=t.data;mexi.push(t)}t.data=s}}}
/* a mesma etiqueta para quem filtra a tela por conta própria (ex.: Rentabilidade → Financeiro › Obras) */
V.chipHTML=function(label,onclickCode,ponteHtml){return `<div class="v161-chips" data-v161chip="1" data-v161own="1"><span class="v161-tag">${E(label)} <b role="button" title="Mostrar tudo" aria-label="Tirar o filtro" onclick="${E(onclickCode)}">×</b></span>${ponteHtml?`<div class="v161-ponte">${ponteHtml}</div>`:''}</div>`};
V.chip=function(label,onClear,opts){opts=opts||{};css(document);const tp=document.createElement('template');tp.innerHTML=V.chipHTML(label,'',opts.ponte||'');const box=tp.content.firstElementChild;
  const b=box.querySelector('.v161-tag b');b.removeAttribute('onclick');b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();box.remove();try{onClear&&onClear()}catch(e){console.error('v161 chip',e)}});
  if(opts.before&&opts.before.parentNode)opts.before.parentNode.insertBefore(box,opts.before);else if(opts.into)opts.into.appendChild(box);return box};
function liga(box){const b=box.querySelector('.v161-tag b');if(b)b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();fim(true)});
  box.querySelectorAll('[data-v161go]').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();const h=a.getAttribute('data-v161go');fim(false);try{(window.top||window).location.hash=h}catch(e){location.hash=h}}))}
function onde(root,best){
  const antes=el=>el&&(best.host.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_PRECEDING)&&!el.closest(EXC);
  if(L.crm){const fs=[...root.querySelectorAll('.filters')].filter(antes);if(fs.length)return {depois:fs[fs.length-1]};return {}}
  const antes2=el=>antes(el)||(best.cards&&best.host.contains(el)&&!el.closest(EXC));
  const tags=[...root.querySelectorAll('.v160-tags')].filter(antes2);if(tags.length)return {dentro:tags[tags.length-1]};
  const bar=[...root.querySelectorAll('.v160-bar')].filter(antes2);if(bar.length){const c=bar[bar.length-1].closest('.card')||bar[bar.length-1];return {dentro:c}}
  /* blocos de filtro do protótipo (selects/busca) logo acima da lista */
  const sel=[...root.querySelectorAll('select,input[type=text],input[type=search],input:not([type])')].filter(antes);
  if(sel.length){let c=sel[sel.length-1].closest('.card,.filterbar,.filters,.row,.d-flex');if(c&&!c.contains(best.host)){const cc=c.closest('.card');return {depois:cc&&!cc.contains(best.host)?cc:c}}}
  return {}}
function ponteTxt(best){const sp=L.sp;const miss=best.miss||[];const nm=sp.unid||'registros';const parts=[];
  const lk=r=>r.h?`<a data-v161go="${E(r.h)}">${E(r.name||'(sem nome)')}</a>`:`${E(r.name||'(sem nome)')}`;
  if(!best.n)parts.push(`nenhum dos ${N0((sp.recs||[]).length)} ${E(nm)} aparece nesta lista`);
  else if(miss.length)parts.push(`${N0(sp.recs.length)} ${E(nm)} = ${N0(best.n)} nesta lista + ${N0(miss.length)} que esta lista não mostra${sp.porque?' ('+E(sp.porque)+')':''}: ${miss.slice(0,12).map(lk).join(' · ')}${miss.length>12?` · + ${N0(miss.length-12)}`:''}`);
  if(sp.ponte&&best.n)parts.unshift(E(sp.ponte));
  /* v166 (Bruno 07/11 — números têm de fechar na tela): o filtro da própria tela mostra mais linhas do que o número clicado → dizer quem são as outras */
  {const tot=(best.rows||[]).length,fora=tot-(best.n||0);if(L.nat&&best.n&&fora>0){const pq=/Estoque livre/i.test(sp.lb||'')?'também têm unidade livre, mas toda ela já é pedida por propostas vendidas — estão em “Pedido por propostas”':'não fazem parte deste número';
    parts.push(`a tela com o filtro “${E(L.nat.desc||"")}” tem ${N0(tot)}: ${N0(best.n)} deste número + ${N0(fora)} que ${pq}`)}}
  return parts.join(' · ')}

/* ───────── vigias: tudo por evento, nada por relógio ───────── */
function vigiaFrame(){const f=FR();if(!f||f.__v161l)return;f.__v161l=1;f.addEventListener('load',()=>{ligaFrame();if(L)sync()});ligaFrame()}
function onMut(ms){vigiaFrame();if(!L&&!ST.sp)return;if(EM)return;
  /* só as nossas mudanças (etiqueta) não pedem nova rodada */
  if(ms.every(m=>[...m.addedNodes,...m.removedNodes].every(n=>n.nodeType===1&&(n.hasAttribute&&n.hasAttribute('data-v161chip')||n.closest&&n.closest('[data-v161chip]'))||n.nodeType===3&&n.parentElement&&n.parentElement.closest('[data-v161chip]'))))return;
  if(!document.getElementById('crmFrame')||!(FD()||{}).__v161o)ligaFrame();
  sync()}
try{new MutationObserver(onMut).observe(document.body||document.documentElement,{childList:true,subtree:true})}catch(e){console.error('v161 vigia',e)}
/* v161d (06/11): qualquer navegação que não seja a da própria chegada a termina — clique, endereço digitado, voltar.
   (capture: roda antes do render do núcleo, para a tela nova nunca nascer com o filtro de antes) */
window.addEventListener('hashchange',()=>{if(!L||cur()===L.base)return;
  /* a tela de destino abriu numa sub-rota sua (#/fcontas → #/fcontas/contas): é a mesma chegada */
  if(!L.active&&cur().indexOf(L.base+'/')===0){L.base=cur();return}
  if(L.crm&&!L.active&&/^#\/crm/.test(cur())&&ULT<=L.t0+250&&Date.now()-L.t0<12000)return;/* o CRM abrindo pela 1ª vez passa pela página inicial dele */
  fim(false)},true);
/* abrir outro número solta o filtro de antes (a gaveta nova nunca herda) */
function envolveOpen(nome){const O=window[nome];if(typeof O!=='function'||O.__v161)return false;const W=function(){try{if(L)fim(false)}catch(e){}return O.apply(this,arguments)};
  Object.keys(O).forEach(k=>{try{W[k]=O[k]}catch(e){}});W.__v161=true;window[nome]=W;return true}
function envolveTudo(){let ok=true;['V130_open','VD_open'].forEach(n=>{if(typeof window[n]==='function')envolveOpen(n);else ok=false});return ok}
if(!envolveTudo()){let i=0;const iv=setInterval(()=>{if(envolveTudo()||++i>40)clearInterval(iv)},500)}

/* ───────── o endereço do CRM na 1ª abertura ─────────
   v124 põe no endereço a vista que o iframe acabou de desenhar; na 1ª abertura o iframe desenha a página inicial e,
   DENTRO desse aviso, já abre a vista pedida — o aviso de fora chegava por último e deixava #/crmhome com Parceiros na tela */
const ROTA={home:'crmhome',parceiros:'crmparceiros',parceiro:'crmparceiros',interacoes:'crminteracoes',tarefas:'crmtarefas',oportunidades:'crmoport',esteira:'crmesteira',gestao:'crmgestao',relatorios:'crmgestao',semanal:'crmgestao',config:'crmconfig'};
function ligaRota(){const R=window.crmFrameRendered;if(typeof R!=='function'||R.__v161)return false;
  const W=function(name){const r=R.apply(this,arguments);try{const v=fview();const k=v&&ROTA[v];const c=String(location.hash||'').replace(/^#\/?/,'').split('/')[0];
    if(k&&v!==name&&/^crm/.test(c)&&c!==k&&!(c==='crmparceiro'&&v==='parceiro'))history.replaceState(history.state,'','#/'+k)}catch(e){}return r};
  W.__v161=true;window.crmFrameRendered=W;return true}
if(!ligaRota()){let i=0;const iv=setInterval(()=>{if(ligaRota()||++i>40)clearInterval(iv)},500)}

/* ───────── V156.ir sem relógio: liga a chegada antes de navegar, o observador faz o resto ───────── */
function trocaIr(){const W=window.V156;if(!W||typeof W.ir!=='function'||W.ir.__v161)return false;
  const ir=function(spec){
    if(!window.V155D){try{spec.nav()}catch(e){}return}
    try{if(L)fim(false)}catch(e){}
    const recs=(spec.recs||[]).map(r=>({ids:(r.ids||[]).map(String).filter(x=>x.length>=1),name:r.name||'',nn:nz(r.name||''),toks:r.toks||[],h:r.h||''}));
    const sp={path:spec.path,ids:[],names:[],recs,n:recs.length,lb:spec.lb,unid:spec.unid,ponte:spec.ponte,porque:spec.porque,t:Date.now(),t0:Date.now(),fixed:false,__v161:true};
    if(!sp.porque&&recs.length)try{W.ajusta(sp)}catch(e){}
    const temRecs=recs.length||typeof spec.recsAt==='function';
    ST.sp=temRecs?sp:null;
    if(temRecs){V.arm(sp,{recsAt:recs.length?null:spec.recsAt,limpa:typeof spec.limpa==='function'?spec.limpa:null,hide:spec.hide||null});if(L&&spec.ponteF)L.ponteF=spec.ponteF}
    try{spec.nav()}catch(e){console.error('v156 nav',e);try{location.hash=spec.path}catch(_){}}
    V.depois()};
  ir.__v161=true;W.ir=ir;return true}
if(!trocaIr()){let i=0;const iv=setInterval(()=>{if(trocaIr()||++i>40)clearInterval(iv)},250)}

css(document);
})();
