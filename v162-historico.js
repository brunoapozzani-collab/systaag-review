/* =====================================================================================================
   v162 · HISTÓRICO DO CLIENTE — "onde paramos" (Bruno, 06/11/2026)
   O pedido: dentro de cada oportunidade do Pipeline, um lugar com o último passo feito com o cliente (o que ele disse
   ou fez), para que o próximo passo seja dado — e o histórico de todas as interações, depois de "Dados".
   Decisões do Bruno (06/11):
     · o histórico é do CLIENTE inteiro; cada anotação leva a etiqueta da negociação em que foi feita, e a aba deixa
       ver "todo o cliente" ou "só esta negociação";
     · cada anotação é só um texto (data e quem anotou entram sozinhos) — "é quase uma observação que fica salva a cada
       passo com o cliente": quando a Próxima ação muda, o passo também fica gravado no histórico;
     · a coluna "Reunião – Gerenciamento de Vendas" da To Do Comercial (que a planilha sobrescreve) entra como a
       primeira anotação de cada negociação, marcada "importado da planilha"; se a planilha trouxer outro texto numa
       próxima leitura, ele entra como anotação nova — nada é sobrescrito;
     · um ícone 💬 em cada cartão do quadro mostra a última interação sem abrir a negociação;
     · a Gestão mostra a mesma informação ("Onde paramos com cada cliente");
     · Fontes do negócio × Cadeia do cliente repetiam a mesma coisa (Cliente = o título; Escritório = Arquitetura;
       Gerenciadora = Gerenciadora — conferido nas 911 negociações, nenhuma diferença): vira um bloco só, com o único
       dado que só a Cadeia tinha (Arquiteto, a pessoa). Quem grava é Fontes; a Cadeia acompanha sozinha (outras telas
       ainda leem n.cadeia).
   Uma fonte: S.db.historico_cliente (Base). Apagar uma anotação só na Base — aqui não há botão de excluir.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v162h)return;window.__v162h=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const p2=x=>String(x).padStart(2,'0');
const agora=()=>{const d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'T'+p2(d.getHours())+':'+p2(d.getMinutes())};
const hoje=()=>agora().slice(0,10);
const brD=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);return m?m[3]+'/'+m[2]+'/'+m[1]+(m[4]?' '+m[4]+':'+m[5]:''):''};
const isoBR=s=>{const m=String(s||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
const diasDesde=iso=>{if(!iso)return null;const a=new Date(String(iso).slice(0,10)+'T12:00'),b=new Date(hoje()+'T12:00');const d=Math.round((b-a)/864e5);return isNaN(d)?null:d};
const quem=()=>T(()=>{const u=me();return u&&(u.nome||u.login)},'')||'—';
const rr=()=>T(()=>render(),null);
const gravar=()=>T(()=>save(),null);
const H=()=>{if(!Array.isArray(S.db.historico_cliente))S.db.historico_cliente=[];return S.db.historico_cliente};
let seq=0;const uid=()=>'HC-'+Date.now().toString(36)+'-'+(++seq).toString(36);
const cliKey=n=>n&&n.cliente_id?String(n.cliente_id):'nm:'+nz(n&&n.cliente_nome);
const etqNeg=n=>{const t=n.tipo_pipeline||T(()=>frenteLb(n.frente),'')||'';const s=n.status_pipeline||(n.resultado||'em aberto');return [t,s].filter(Boolean).join(' · ')};
const UI=window.V162=window.V162||{};
UI.f=UI.f||{};

/* ═════════════ §1 a coluna da planilha entra como primeira anotação (e cada texto novo vira anotação nova) ═════════════ */
const COL=8; /* "Reunião- Gerenciamento de Vendas" */
function importa(){const N=S.db.negociacoes||[];const h=H();
  const ja=new Set(h.filter(e=>e.origem==='planilha').map(e=>e.neg_id+'|'+nz(e.texto)));const jaNome=new Set(h.filter(e=>e.origem==='planilha').map(e=>nz(e.cliente_nome)+'|'+nz(e.texto)));const quando=T(()=>window.V159_PIPE.quando,'')||'';let novos=0;
  N.forEach(n=>{const c=n.planilha&&n.planilha.c;if(!c)return;const txt=String(c[COL]||'').trim();if(!txt||/^[-—.]+$/.test(txt))return;
    const k=nz(n.cliente_nome)+'|'+nz(txt);if(ja.has(n.id+'|'+nz(txt))||(n.v162_planilha===txt))return;
    const primeira=!h.some(e=>e.origem==='planilha'&&e.neg_id===n.id)&&n.v162_planilha==null;
    if(jaNome.has(k)&&primeira){n.v162_planilha=txt;return}
    const dt=primeira?(isoBR(c[12])||isoBR(c[11])||''):quando;
    h.push({id:uid(),nome:(n.cliente_nome||'')+' · '+txt.slice(0,50),cli:cliKey(n),cliente_nome:n.cliente_nome||'',neg_id:n.id,neg_etq:etqNeg(n),texto:txt,quando:dt,
      quem:(n.consultor||c[4]||'')+'',origem:'planilha',
      nota_origem:'To Do Comercial › Pipeline, linha '+n.planilha.linha+(primeira?(dt?' · data de upgrade da planilha':' · a planilha não tem data'):' · texto novo na leitura de '+brD(quando)),
      criado:agora()});
    n.v162_planilha=txt;novos++});
  if(novos){S.db._v162h={importadas:(S.db._v162h&&S.db._v162h.importadas||0)+novos,quando:agora()};gravar()}
  return novos}
UI.importadas=T(importa,0);
/* se a Base for trocada depois (carga gravada, importação, Começar do zero), a leitura roda de novo na Base nova */
let dbVisto=S.db;T(()=>{const r0=window.render;if(typeof r0==='function'&&!r0.__v162h){const W=function(){if(S.db!==dbVisto){dbVisto=S.db;T(importa,0)}return r0.apply(this,arguments)};W.__v162h=true;window.render=W}},null);

/* ═════════════ consultas (uma fonte: S.db.historico_cliente) ═════════════ */
const ord=(a,b)=>String(b.quando||'').localeCompare(String(a.quando||''))||String(b.criado||'').localeCompare(String(a.criado||''));
function doCliente(n){const k=cliKey(n),nm=nz(n.cliente_nome);return H().filter(e=>e.cli===k||(nm&&nz(e.cliente_nome)===nm)).sort(ord)}
function daNeg(n){return H().filter(e=>e.neg_id===n.id).sort(ord)}
UI.ultima=n=>daNeg(n)[0]||null;
UI.doCliente=doCliente;

/* ═════════════ gravar uma anotação ═════════════ */
function anota(nid,texto,origem,extra){const n=T(()=>get('negociacoes',nid),null);if(!n)return null;
  const e={id:uid(),nome:(n.cliente_nome||'')+' · '+String(texto).trim().slice(0,50),cli:cliKey(n),cliente_nome:n.cliente_nome||'',neg_id:n.id,neg_etq:etqNeg(n),texto:String(texto).trim(),quando:agora(),quem:quem(),origem:origem||'sistema',criado:agora()};
  if(extra)Object.assign(e,extra);
  T(()=>put('historico_cliente',e,'anotação no histórico do cliente'),null);if(!H().some(x=>x.id===e.id))H().push(e);
  if(origem!=='proxima'){n.gestao=e.texto;n.v162_ultima=e.quando}
  n.movido=T(()=>today(),hoje());
  gravar();return e}
UI.salvar=nid=>{const el=document.getElementById('v162-txt');const t=String(el&&el.value||'').trim();
  if(!t){T(()=>toast('Escreva o que o cliente disse ou fez.',true),null);if(el)el.focus();return}
  if(anota(nid,t,'sistema')){T(()=>toast('Salvo no histórico do cliente'),null);rr()}};
UI.aba=(nid,v)=>{UI.f[nid]=v;rr()};

/* a Próxima ação mudou → o passo fica gravado no histórico */
T(()=>{if(typeof A==='object'&&typeof A.setProxima==='function'&&!A.setProxima.__v162h){const o=A.setProxima;
  A.setProxima=function(id,acao,data){const n=T(()=>get('negociacoes',id),null);const antes=n&&n.proxima?String(n.proxima.acao||''):'';const r=o.apply(this,arguments);
    try{if(n&&String(acao||'').trim()&&nz(acao)!==nz(antes)&&acao!=='Definir próximo passo')anota(id,'Próxima ação: '+String(acao).trim()+(data?' · até '+brD(data):''),'proxima')}catch(e){console.warn('v162 próxima',e)}
    return r};A.setProxima.__v162h=true}},null);

/* Fontes manda, Cadeia acompanha (Escritório = Arquitetura, Gerenciadora = Gerenciadora) */
function espelha(n){if(!n||!n.fontes)return;n.cadeia=n.cadeia||{};const f=n.fontes;
  if((f.arquitetura||'')!==(n.cadeia.escritorio||''))n.cadeia.escritorio=f.arquitetura||'';
  if((f.gerenciadora||'')!==(n.cadeia.gerenciadora||''))n.cadeia.gerenciadora=f.gerenciadora||''}
T(()=>{const p0=window.put;if(typeof p0==='function'&&!p0.__v162h){const W=function(t,row){if(t==='negociacoes')T(()=>espelha(row),null);return p0.apply(this,arguments)};W.__v162h=true;window.put=W}},null);
/* na abertura nada é mexido: hoje só 2 negociações (Vagner Andreazzi, Nadia e Gustavo) têm Escritório "TAAG" na Cadeia com a
   Arquitetura da planilha em branco — vale a planilha; a Cadeia passa a acompanhar Fontes na próxima gravação de cada uma */

/* ═════════════ estilo ═════════════ */
(function css(){if(document.getElementById('v162-css'))return;const s=document.createElement('style');s.id='v162-css';s.textContent=`
.v162-ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:20px;border-radius:7px;font-size:12px;cursor:pointer;border:1px solid var(--bd,rgba(0,0,0,.12));background:transparent;line-height:1;padding:0}
.v162-ic.on{background:rgba(13,110,253,.10);border-color:rgba(13,110,253,.35)}
.v162-ic.off{opacity:.45}
.v162-ic:hover{transform:scale(1.08)}
#v162-pop{position:fixed;z-index:200;max-width:330px;min-width:240px;background:var(--card,#fff);color:inherit;border:1px solid var(--bd,rgba(0,0,0,.12));border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.25);padding:12px 14px;font-size:13px}
#v162-pop .t{white-space:pre-wrap;line-height:1.4;margin:6px 0 8px;font-weight:500}
#v162-pop .m{font-size:11.5px;opacity:.7}
#v162-pop a{font-size:12.5px;text-decoration:none;cursor:pointer}
.v162-h{font-size:11px;letter-spacing:.08em;font-weight:700}
.v162-ult{background:rgba(13,110,253,.06);border:1px solid rgba(13,110,253,.18);border-radius:12px;padding:10px 12px;cursor:pointer}
.v162-ult .t{white-space:pre-wrap;font-weight:600;font-size:13px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.v162-seg{display:inline-flex;border:1px solid var(--bd,rgba(0,0,0,.15));border-radius:10px;overflow:hidden}
.v162-seg button{border:0;background:transparent;padding:5px 10px;font-size:12px;color:inherit;cursor:pointer}
.v162-seg button.on{background:#0d6efd;color:#fff}
.v162-it{position:relative;padding:2px 0 12px 18px;border-left:2px solid rgba(13,110,253,.35);margin-left:6px}
.v162-it:before{content:'';position:absolute;left:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:#0d6efd}
.v162-it.pl:before{background:#6c757d}.v162-it.px:before{background:#198754}
.v162-it .t{white-space:pre-wrap;font-size:13px;line-height:1.4}
.v162-it .m{font-size:11px;opacity:.7}
.v162-tag{display:inline-block;font-size:10.5px;border-radius:999px;padding:1px 8px;background:rgba(127,127,127,.12);margin-left:4px}
.v162-tag.este{background:rgba(13,110,253,.12);color:#0d6efd}
.v162-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;background:rgba(127,127,127,.12)}
.v162-bar div{height:100%;cursor:pointer}
.v162-row{display:grid;grid-template-columns:minmax(150px,1.1fr) minmax(200px,2.4fr) 120px;gap:10px;padding:8px 6px;border-bottom:1px solid var(--bd,rgba(0,0,0,.08));cursor:pointer;align-items:center}
.v162-row:hover{background:rgba(13,110,253,.05)}
.v162-row .t{font-size:12.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap}
@media(max-width:700px){.v162-row{grid-template-columns:1fr}}
[data-dealdrawer] .tabs{display:flex;flex-wrap:nowrap;gap:4px}
[data-dealdrawer] .tabs button{flex:1 1 auto;min-width:0;padding-left:6px!important;padding-right:6px!important;font-size:13px!important;white-space:nowrap}
`;document.head.appendChild(s)})();

/* ═════════════ §2 ícone 💬 no cartão do quadro + janelinha com a última interação ═════════════ */
UI.fecharPop=()=>{const p=document.getElementById('v162-pop');if(p)p.remove()};
UI.pop=(ev,nid)=>{try{ev.stopPropagation();ev.preventDefault()}catch(e){}UI.fecharPop();const n=T(()=>get('negociacoes',nid),null);if(!n)return;
  const u=UI.ultima(n);const tot=doCliente(n).length;const d=u?diasDesde(u.quando):null;
  const p=document.createElement('div');p.id='v162-pop';p.onclick=e=>e.stopPropagation();
  p.innerHTML=`<div class="d-flex justify-content-between align-items-center"><span class="v162-h sub">ÚLTIMA INTERAÇÃO · ${E(n.cliente_nome||n.codinome||'')}</span><span style="cursor:pointer;opacity:.6" onclick="V162.fecharPop()">✕</span></div>`+
    (u?`<div class="t">${E(u.texto)}</div><div class="m">${u.quando?E(brD(u.quando))+(d!=null?' · há '+N0(d)+(d===1?' dia':' dias'):''):'sem data'} · ${E(u.quem||'—')}${u.origem==='planilha'?' · importado da planilha':''}</div>`
      :`<div class="t" style="opacity:.7">Nenhuma interação registrada nesta negociação ainda.</div>`)+
    `<div class="mt-2"><a onclick="V162.abrir('${J(nid)}')">${tot?'Ver histórico do cliente ('+N0(tot)+') →':'Registrar a primeira interação →'}</a></div>`;
  document.body.appendChild(p);
  const r=(ev.currentTarget||ev.target).getBoundingClientRect();const w=p.offsetWidth,h=p.offsetHeight;
  let x=Math.min(window.innerWidth-w-10,Math.max(10,r.left-w/2+r.width/2)),y=r.bottom+6;if(y+h>window.innerHeight-10)y=Math.max(10,r.top-h-6);
  p.style.left=x+'px';p.style.top=y+'px'};
document.addEventListener('click',e=>{const p=document.getElementById('v162-pop');if(p&&!p.contains(e.target))p.remove()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')UI.fecharPop()});
window.addEventListener('hashchange',()=>UI.fecharPop());
UI.abrir=nid=>{UI.fecharPop();T(()=>{const el=document.getElementById('v161-modal');if(el)el.remove()},null);S.deal=nid;S.dealTab='historico';if(!/^#\/pipeline/.test(location.hash))location.hash='#/pipeline';else rr()};
function icone(n){const u=UI.ultima(n);const tip=u?(u.texto.length>140?u.texto.slice(0,140)+'…':u.texto):'Nenhuma interação registrada';
  return `<button type="button" class="v162-ic ${u?'on':'off'}" title="${E('Última interação: '+tip)}" onclick="V162.pop(event,'${J(n.id)}')" onmousedown="event.stopPropagation()">💬</button>`}
function ligaCartao(){if(typeof dealCard!=='function')return false;if(dealCard.__v162h)return true;const dc=dealCard;
  const W=function(n){let h=dc.apply(this,arguments);try{if(typeof h!=='string'||!n)return h;const i=h.lastIndexOf('<span style="font-size:11px;color:');const f=i>=0?h.indexOf('</span>',i):-1;
      return f>0?h.slice(0,i)+'<span class="d-flex align-items-center gap-2">'+icone(n)+h.slice(i,f+7)+'</span>'+h.slice(f+7):h.replace(/<\/div>\s*$/,`<div class="text-end">${icone(n)}</div></div>`)}catch(e){return h}};
  W.__v162h=true;Object.keys(dc).forEach(k=>{try{W[k]=dc[k]}catch(e){}});dealCard=W;return true}

/* ═════════════ helpers de HTML (fecha a div certa) ═════════════ */
function fimDiv(h,ini){const re=/<div\b|<\/div>/g;re.lastIndex=ini;let d=0,m;while((m=re.exec(h))){if(m[0]==='</div>'){d--;if(d===0)return m.index+6}else d++}return -1}

/* ═════════════ §3 Fontes do negócio + Cadeia do cliente = um bloco ═════════════ */
function umBloco(h){const ci=h.indexOf('>CADEIA DO CLIENTE</div>');if(ci<0)return h;
  const hs=h.lastIndexOf('<div',ci);const card=h.indexOf('<div',ci+1);const cf=fimDiv(h,card);if(hs<0||card<0||cf<0)return h;
  const cad=h.slice(card,cf);let arqRow='';const ai=cad.indexOf('<span class="sub">Arquiteto</span>');
  if(ai>=0){const rs=cad.lastIndexOf('<div class="d-flex justify-content-between py-1"',ai);const re=rs>=0?fimDiv(cad,rs):-1;if(rs>=0&&re>0)arqRow=cad.slice(rs,re)}
  h=h.slice(0,hs)+h.slice(cf);
  if(arqRow){const fi=h.indexOf('<span class="sub">Arquitetura</span>');if(fi>=0){const rs=h.lastIndexOf('<div class="d-flex justify-content-between py-1"',fi);const re=rs>=0?fimDiv(h,rs):-1;if(re>0)h=h.slice(0,re)+arqRow.replace('<span class="sub">Arquiteto</span>','<span class="sub" title="a pessoa — a Arquitetura acima é o escritório">Arquiteto</span>')+h.slice(re)}}
  return h}

/* ═════════════ §4 a aba Histórico e a "última interação" no Comercial ═════════════ */
function abaHist(n){const todos=doCliente(n);const deste=todos.filter(e=>e.neg_id===n.id);const outros=todos.length-deste.length;
  const outrasNegs=new Set(todos.filter(e=>e.neg_id!==n.id).map(e=>e.neg_id)).size;
  const modo=UI.f[n.id]||'cliente';const xs=modo==='neg'?deste:todos;
  const item=e=>{const este=e.neg_id===n.id;const d=diasDesde(e.quando);
    return `<div class="v162-it ${e.origem==='planilha'?'pl':e.origem==='proxima'?'px':''}"><div class="m">${e.quando?E(brD(e.quando)):'sem data'}${d!=null?' · há '+N0(d)+(d===1?' dia':' dias'):''} · <b>${E(e.quem||'—')}</b>${modo==='cliente'?`<span class="v162-tag ${este?'este':''}">${este?'esta negociação':E(e.neg_etq||'outra negociação')}</span>`:''}${e.origem==='planilha'?'<span class="v162-tag">importado da planilha</span>':''}${e.origem==='proxima'?'<span class="v162-tag">próxima ação</span>':''}</div><div class="t">${E(e.texto)}</div>${e.nota_origem?`<div class="m" style="font-size:10.5px">${E(e.nota_origem)}</div>`:''}</div>`};
  return `<div class="v162-h sub mb-1">O QUE O CLIENTE DISSE OU FEZ</div>
  <textarea id="v162-txt" class="form-control" rows="3" placeholder="Ex.: Cliente pediu revisão do projetor e vai responder até sexta." style="font-size:13px"></textarea>
  <div class="d-flex justify-content-between align-items-center mt-1"><span class="sub" style="font-size:11px">entra com a data de agora e o seu nome (${E(quem())})</span><button class="btn-apple" onclick="V162.salvar('${J(n.id)}')"><i class="bi bi-check2 me-1"></i>Salvar no histórico</button></div>
  <div class="d-flex justify-content-between align-items-center mt-3 mb-2 flex-wrap gap-2"><span class="v162-h sub">HISTÓRICO DO CLIENTE</span>
   <span class="v162-seg"><button class="${modo==='cliente'?'on':''}" onclick="V162.aba('${J(n.id)}','cliente')">Todo o cliente (${N0(todos.length)})</button><button class="${modo==='neg'?'on':''}" onclick="V162.aba('${J(n.id)}','neg')">Só esta negociação (${N0(deste.length)})</button></span></div>
  ${outros?`<div class="sub mb-2" style="font-size:11.5px">${N0(todos.length)} = ${N0(deste.length)} desta negociação + ${N0(outros)} de ${N0(outrasNegs)} ${outrasNegs===1?'outra negociação':'outras negociações'} do mesmo cliente</div>`:''}
  ${xs.length?xs.map(item).join(''):`<div class="card place py-3" style="text-align:center"><i class="bi bi-chat-left-text"></i> Nenhuma interação registrada ${modo==='neg'?'nesta negociação':'com este cliente'} ainda.</div>`}
  <div class="sub mt-2" style="font-size:11px"><i class="bi bi-database me-1"></i>Base › Histórico do cliente · apagar uma anotação só na Base</div>`}
function cartaoUlt(n){const u=UI.ultima(n);const tot=doCliente(n).length;const d=u?diasDesde(u.quando):null;
  return `<div class="v162-ult mb-3" onclick="S.dealTab='historico';render()"><div class="d-flex justify-content-between"><span class="v162-h sub">💬 ONDE PARAMOS · ÚLTIMA INTERAÇÃO</span><span class="sub" style="font-size:11px">histórico (${N0(tot)}) →</span></div>`+
   (u?`<div class="t mt-1">${E(u.texto)}</div><div class="sub" style="font-size:11px">${u.quando?E(brD(u.quando))+(d!=null?' · há '+N0(d)+(d===1?' dia':' dias'):''):'sem data'} · ${E(u.quem||'—')}${u.origem==='planilha'?' · importado da planilha':''}</div>`
     :`<div class="sub mt-1" style="font-size:12.5px">Nada registrado ainda — toque para anotar o que o cliente disse ou fez.</div>`)+`</div>`}
function ligaGaveta(){if(typeof dealDrawer!=='function')return false;if(dealDrawer.__v162h)return true;const dd=dealDrawer;
  const W=function(){const n=S.deal?T(()=>get('negociacoes',S.deal),null):null;if(!n)return dd.apply(this,arguments);
    const hist=S.dealTab==='historico';let h;
    if(hist){S.dealTab='dados';try{h=dd.apply(this,arguments)}finally{S.dealTab='historico'}}else h=dd.apply(this,arguments);
    if(typeof h!=='string'||!h)return h;
    try{
      /* a aba nova, depois de Dados */
      h=h.replace(/(<button class="[^"]*" onclick="S\.dealTab='dados';render\(\)">Dados<\/button>)/,`$1<button class="${hist?'on':''}" onclick="S.dealTab='historico';render()">Histórico</button>`);
      if(hist){h=h.replace(/<button class="on" onclick="S\.dealTab='dados';render\(\)">/,`<button class="" onclick="S.dealTab='dados';render()">`);
        const ti=h.indexOf('<div class="tabs');const te=ti>=0?fimDiv(h,ti):-1;
        if(te>0){const fim=h.lastIndexOf('</div>');h=h.slice(0,te)+abaHist(n)+h.slice(fim)}}
      else if(!S.dealTab||S.dealTab==='comercial'){
        h=umBloco(h);
        const pi=h.indexOf('<div class="card p-3 mb-3" style="background:rgba(25,135,84,.06)">');const pe=pi>=0?fimDiv(h,pi):-1;
        if(pe>0)h=h.slice(0,pe)+cartaoUlt(n)+h.slice(pe)}
    }catch(e){console.warn('v162 gaveta',e)}
    return h};
  W.__v162h=true;Object.keys(dd).forEach(k=>{try{W[k]=dd[k]}catch(e){}});dealDrawer=W;return true}

/* ═════════════ §5 Gestão — "Onde paramos com cada cliente" ═════════════ */
const FAIXAS=[['nada','sem nenhuma anotação','#6c757d',x=>!x.u],['semdata','anotação sem data','#adb5bd',x=>x.u&&x.d==null],['mais','há mais de 30 dias','#dc3545',x=>x.u&&x.d!=null&&x.d>30],['30','há 8 a 30 dias','#fd7e14',x=>x.u&&x.d!=null&&x.d>7&&x.d<=30],['7','nos últimos 7 dias','#198754',x=>x.u&&x.d!=null&&x.d<=7]];
const peso=x=>!x.u?3e9:x.d==null?2e9:x.d;
function abertasFiltradas(){const f=S.comF||{};const ind=f.ind;
  return (S.db.negociacoes||[]).filter(n=>!n.resultado&&(!f.frente||n.frente===f.frente)&&(!f.cons||T(()=>negCons(n).includes(f.cons),true))&&
    (!ind||T(()=>{const xs=window.V160.indsDe(n);return ind==='_sem'?!xs.length:xs.some(x=>nz(x)===ind)},true)))}
UI.gf=null;UI.gTodas=false;
UI.gFaixa=k=>{UI.gf=UI.gf===k?null:k;UI.gTodas=false;rr()};
UI.gMais=()=>{UI.gTodas=!UI.gTodas;rr()};
function blocoGestao(){const ns=abertasFiltradas().map(n=>{const u=UI.ultima(n);return {n,u,d:u?diasDesde(u.quando):null}});
  const cont=FAIXAS.map(([k,lb,cor,fn])=>({k,lb,cor,v:ns.filter(fn).length}));
  const sel=UI.gf?ns.filter(FAIXAS.find(f=>f[0]===UI.gf)[3]):ns;
  sel.sort((a,b)=>peso(b)-peso(a));
  const lim=UI.gTodas?sel.length:8;const tot=ns.length||1;
  const row=x=>{const n=x.n,u=x.u;return `<div class="v162-row" onclick="V162.abrir('${J(n.id)}')"><div><b style="font-size:13px">${E(n.cliente_nome||n.codinome||n.id)}</b><div class="sub" style="font-size:11px">${E(T(()=>negCons(n).join(' + '),n.consultor||'—'))} · ${E(n.status_pipeline||n.etapa||'')}</div></div><div class="t">${u?E(u.texto):'<span class="sub">nenhuma interação registrada</span>'}</div><div style="font-size:11.5px;text-align:right">${u?`<b style="color:${x.d==null?'#6c757d':x.d>30?'#dc3545':x.d>7?'#fd7e14':'#198754'}">${x.d==null?'sem data':'há '+N0(x.d)+(x.d===1?' dia':' dias')}</b><div class="sub" style="font-size:10.5px">${E(u.quem||'—')}${u.origem==='planilha'?' · planilha':''}</div>`:'—'}</div></div>`};
  return `<div class="card p-3 mb-3" data-v162g="1"><div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><b style="font-size:17px">💬 Onde paramos com cada cliente</b><div class="sub" style="font-size:12px">a última interação de cada negociação em aberto · clique numa linha para abrir o histórico</div></div><span class="sub" style="font-size:11px">fonte: Base › Histórico do cliente</span></div>
  <div class="v162-bar mt-3">${cont.filter(c=>c.v).map(c=>`<div style="width:${c.v/tot*100}%;background:${c.cor};${UI.gf&&UI.gf!==c.k?'opacity:.35':''}" title="${E(c.lb)}: ${N0(c.v)}" onclick="V162.gFaixa('${c.k}')"></div>`).join('')}</div>
  <div class="mt-2" style="font-size:12.5px"><b>${N0(ns.length)} em aberto</b> = ${cont.filter(c=>c.v).map(c=>`<u role="button" style="cursor:pointer;color:${c.cor};${UI.gf===c.k?'font-weight:700':''}" onclick="V162.gFaixa('${c.k}')">${N0(c.v)} ${c.lb}</u>`).join(' + ')} <span style="color:#198754">${cont.reduce((a,c)=>a+c.v,0)===ns.length?'✓':''}</span>${UI.gf?` · <a href="javascript:void 0" onclick="V162.gFaixa('${UI.gf}')">mostrar todas ✕</a>`:''}</div>
  <div class="mt-2">${sel.slice(0,lim).map(row).join('')||'<div class="sub py-2">Nenhuma negociação nesta faixa.</div>'}</div>
  ${sel.length>8?`<div class="mt-2"><a href="javascript:void 0" onclick="V162.gMais()">${UI.gTodas?'mostrar só as 8 mais antigas':'ver todas ('+N0(sel.length)+')'}</a></div>`:''}
  <div class="sub mt-2" style="font-size:11px">Primeiro as mais esquecidas: sem nenhuma anotação, depois as mais antigas. A data das anotações importadas é a "data de upgrade" da planilha.</div></div>`}
UI.blocoGestao=blocoGestao;
function ligaGestao(){if(typeof SCREENS!=='object'||typeof SCREENS.gestao!=='function')return false;if(SCREENS.gestao.__v162h)return true;const g0=SCREENS.gestao;
  const W=function(){const h=g0.apply(this,arguments);try{if(typeof h!=='string')return h;
      const mk='<span style="color:#fd7e14">Pipeline</span> de Vendas e Relacionamento';const i=h.indexOf(mk);
      if(i>=0){const s=h.lastIndexOf('<div class="card p-3 mb-3" style="background:#0e0e12',i);if(s>=0)return h.slice(0,s)+blocoGestao()+h.slice(s)}
      if(S.gSub==='comercial'){const j=h.indexOf('NEGOCIAÇÕES POR MÊS');if(j>=0){const s=h.lastIndexOf('<div class="card',j);if(s>=0)return h.slice(0,s)+blocoGestao()+h.slice(s)}}
    }catch(e){console.warn('v162 gestão',e)}return h};
  Object.keys(g0).forEach(k=>{try{W[k]=g0[k]}catch(e){}});W.__v162h=true;SCREENS.gestao=W;return true}

/* ═════════════ §6 Base — o histórico aparece como tabela da Base (para conferir e, só lá, apagar) ═════════════ */
UI.bq=UI.bq||'';UI.bo=UI.bo||'';
UI.bBusca=v=>{UI.bq=v;rr();setTimeout(()=>{const el=document.getElementById('v162-bq');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}},0)};
UI.bOrig=v=>{UI.bo=UI.bo===v?'':v;rr()};
UI.excluir=id=>{if(!T(()=>V155.pode(),false)){T(()=>toast('Só quem tem a permissão de excluir (Base › Usuários e permissões) apaga uma anotação.',true),null);return}T(()=>V155.excluir('historico_cliente',id),null)};
function telaBase(){const all=H().slice().sort(ord);const ORI=[['planilha','importadas da planilha'],['sistema','anotadas no sistema'],['proxima','próximas ações']];
  const c=ORI.map(([k,l])=>({k,l,v:all.filter(e=>(e.origem||'sistema')===k).length}));
  const q=nz(UI.bq);const xs=all.filter(e=>(!UI.bo||(e.origem||'sistema')===UI.bo)&&(!q||nz([e.cliente_nome,e.texto,e.quem,e.neg_etq].join(' ')).includes(q)));
  const pode=T(()=>V155.pode(),false);const lim=xs.length;
  return T(()=>head('Histórico do cliente','Toda interação anotada nas negociações do Pipeline — uma fonte para a gaveta, o ícone 💬 do quadro e a Gestão.'),'<h4>Histórico do cliente</h4>')+
  `<div class="card p-3 mb-3"><div style="font-size:13px"><b>${N0(all.length)} anotações</b> = ${c.filter(x=>x.v).map(x=>`<u role="button" style="cursor:pointer;${UI.bo===x.k?'font-weight:700;color:#0d6efd':''}" onclick="V162.bOrig('${x.k}')">${N0(x.v)} ${x.l}</u>`).join(' + ')} <span style="color:#198754">${c.reduce((a,x)=>a+x.v,0)===all.length?'✓':''}</span></div>
   <input id="v162-bq" class="form-control mt-2" placeholder="Buscar cliente, texto, pessoa…" value="${E(UI.bq)}" onchange="V162.bBusca(this.value)" onkeydown="if(event.key==='Enter')V162.bBusca(this.value)">
   ${xs.length!==all.length?'<div class="sub mt-1" style="font-size:11.5px">filtrado · <a href="javascript:void 0" onclick="V162.bo=\'\';V162.bq=\'\';render()">mostrar todas ✕</a></div>':''}</div></div>
  <div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Quando</th><th>Cliente</th><th>Negociação</th><th>Quem</th><th>O que aconteceu</th><th>Origem</th>${pode?'<th></th>':''}</tr></thead><tbody>${xs.slice(0,lim).map(e=>`<tr class="rowlink" style="cursor:pointer" onclick="V162.abrir('${J(e.neg_id)}')"><td style="white-space:nowrap">${e.quando?E(brD(e.quando)):'sem data'}</td><td>${E(T(()=>get('negociacoes',e.neg_id).cliente_nome,'')||e.cliente_nome)}</td><td class="sub" style="font-size:12px">${E(e.neg_etq||e.neg_id)}</td><td>${E(e.quem||'—')}</td><td style="white-space:pre-wrap;max-width:420px">${E(e.texto)}</td><td class="sub" style="font-size:12px">${e.origem==='planilha'?'planilha':e.origem==='proxima'?'próxima ação':'sistema'}</td>${pode?`<td><button class="iconbtn" title="Excluir (vai para a Lixeira)" onclick="event.stopPropagation();V162.excluir('${J(e.id)}')"><i class="bi bi-trash"></i></button></td>`:''}</tr>`).join('')}</tbody></table></div></div>`}
T(()=>{SCREENS.dbhistorico=telaBase;if(typeof SEC_OF==='object')SEC_OF.dbhistorico='bd';if(typeof LABEL==='object')LABEL.dbhistorico='Histórico do cliente';
  const bd=NAV.find(s=>s.id==='bd');if(bd&&!bd.items.some(([k])=>k==='dbhistorico')){const i=bd.items.findIndex(([k])=>k==='dbmestra');bd.items.splice(i>=0?i+1:bd.items.length,0,['dbhistorico','Histórico do cliente'])}},null);

/* liga tudo (as camadas anteriores podem ter trocado as funções depois do boot) */
let tent=0;function ligaTudo(){const a=T(ligaCartao,false),b=T(ligaGaveta,false),c=T(ligaGestao,false);if((!a||!b||!c)&&++tent<40)setTimeout(ligaTudo,250);else rr()}
ligaTudo();
setTimeout(()=>{T(ligaCartao,0);T(ligaGaveta,0);T(ligaGestao,0)},3000);
})();
