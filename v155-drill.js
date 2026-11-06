/* =====================================================================================================
   v155 · GAVETA CURTA, BOTÃO EM CIMA (05/11/2026)
   Bruno: clicar num número abria uma janela com TODOS os registros e a explicação, e o link para a tela de verdade
   ficava lá embaixo — era preciso rolar tudo. Desenho escolhido ("short panel, button on top"):
     1. o número grande + o nome dele, e o ✕
     2. UMA linha dizendo de onde vem ("Vem de: CRM › Parceiros"); a explicação longa fica fechada em "como é calculado"
     3. o botão "Abrir na tela, já filtrado →" — abre a tela de destino mostrando só os registros que formam o número
        (sem destino, sem botão)
     4. os 5 primeiros registros (clicáveis como antes) e "+ 31 — ver todos", que abre o resto ali mesmo
   Painel lateral que desliza da direita; fecha com ✕, Esc ou clique fora. Modo escuro pelas variáveis do tema.
   Vale para TODA gaveta de número: a do Início (V130_open, inclusive as v149), a da Diretoria (VD_open) e a lista de
   atividades do Operação › Painel (COP.ope.listaAtv). Só apresentação: nenhum número, regra ou dado muda — o painel é
   montado a partir da gaveta que as camadas anteriores já desenharam (que continua no DOM, escondida).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v155drill)return;window.__v155drill=true;

const ST=window.__V155D=window.__V155D||{all:{},how:{},scroll:{},sp:null,key:null};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const N0=v=>(+v||0).toLocaleString('pt-BR');
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=el=>el?String(el.textContent||'').replace(/\s+/g,' ').trim():'';
const LIM=5;

/* ───────────────────────── estilo ───────────────────────── */
const CSS=`
.v155-hid{display:none!important}
#v155-ov{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.32);display:flex;justify-content:flex-end;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
#v155-ov.v155-in{animation:v155fade .22s ease-out}
#v155-pn{width:min(520px,100vw);height:100%;background:var(--card,#fff);color:var(--tx,#0f172a);display:flex;flex-direction:column;box-shadow:-18px 0 50px rgba(0,0,0,.22);border-radius:22px 0 0 22px;overflow:hidden;font-family:var(--font-sans,-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif)}
#v155-ov.v155-in #v155-pn{animation:v155slide .28s cubic-bezier(.2,.8,.2,1)}
@keyframes v155slide{from{transform:translateX(100%)}to{transform:none}}
@keyframes v155fade{from{background:rgba(0,0,0,0)}to{background:rgba(0,0,0,.32)}}
#v155-pn:focus{outline:none}
#v155-pn .v155-fix{flex:none;padding:22px 24px 14px;border-bottom:1px solid var(--bd,#e5e7eb)}
#v155-pn .v155-top{display:flex;align-items:flex-start;gap:12px}
#v155-pn .v155-top .v155-tt{flex:1;min-width:0}
#v155-pn .v155-num{font-size:44px;line-height:1.02;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;word-break:break-word}
#v155-pn .v155-lb{font-size:17px;font-weight:700;margin-top:4px;line-height:1.3}
#v155-pn .v155-sub{font-size:13px;color:var(--mut,#64748b);margin-top:3px;line-height:1.4}
#v155-pn .v155-x{flex:none;width:34px;height:34px;border-radius:999px;border:0;background:rgba(120,120,128,.14);color:inherit;font-size:16px;line-height:34px;text-align:center;cursor:pointer;padding:0}
#v155-pn .v155-x:hover{background:rgba(120,120,128,.24)}
#v155-pn .v155-src{display:flex;align-items:baseline;gap:10px;margin-top:12px;font-size:13px;color:var(--tx-secondary,#334155)}
#v155-pn .v155-src span{flex:1;min-width:0}
#v155-pn .v155-src b{font-weight:600;color:var(--tx,#0f172a)}
#v155-pn .v155-hw{flex:none;border:0;background:none;color:var(--apple,#0071e3);font-size:12.5px;font-weight:600;cursor:pointer;padding:0;white-space:nowrap}
#v155-pn .v155-how{margin-top:10px;font-size:12.5px;line-height:1.55;color:var(--tx-secondary,#334155);background:rgba(120,120,128,.08);border-radius:12px;padding:10px 12px;max-height:34vh;overflow:auto}
#v155-pn .v155-how>*{margin:0 0 6px}#v155-pn .v155-how>*:last-child{margin-bottom:0}
#v155-pn .v155-how .note,#v155-pn .v155-how .lead{font-size:12.5px;opacity:1}
#v155-pn .v155-how table{width:100%;border-collapse:collapse}#v155-pn .v155-how td{padding:3px 4px;border-bottom:1px solid var(--bd,#e5e7eb)}
#v155-pn .v155-go{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;margin-top:14px;border:0;border-radius:14px;background:var(--apple,#0071e3);color:#fff;font-size:15px;font-weight:700;padding:13px 16px;cursor:pointer;text-align:left;box-shadow:0 6px 16px rgba(0,113,227,.25)}
#v155-pn .v155-go:focus{outline:none}#v155-pn .v155-go:focus-visible{outline:3px solid rgba(0,113,227,.35);outline-offset:2px}
#v155-pn .v155-go:hover{background:var(--apple-hover,#005bb5)}
#v155-pn .v155-go small{display:block;font-size:11.5px;font-weight:500;opacity:.85;margin-top:1px}
#v155-pn .v155-go i{font-style:normal;font-size:18px}
#v155-pn .v155-alt{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font-size:12.5px}
#v155-pn .v155-alt a{color:var(--apple,#0071e3);cursor:pointer;text-decoration:none;font-weight:600}
#v155-pn .v155-sc{flex:1;min-height:0;overflow:auto;padding:6px 24px 28px;-webkit-overflow-scrolling:touch}
#v155-pn .v155-h{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut,#64748b);margin:16px 0 4px}
#v155-pn .v155-it{display:flex;align-items:center;gap:12px;padding:10px 10px;margin:0 -10px;border-radius:12px;min-width:0}
#v155-pn .v155-it+.v155-it{box-shadow:0 -1px 0 var(--bd,#eef0f3)}
#v155-pn .v155-it.click{cursor:pointer}#v155-pn .v155-it.click:hover{background:rgba(0,113,227,.07)}
#v155-pn .v155-it .m{flex:1;min-width:0}
#v155-pn .v155-it .t{font-size:14px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}
#v155-pn .v155-it .t .lead{font-weight:400;font-size:12px;color:var(--mut,#64748b)}
#v155-pn .v155-it .s{font-size:12.5px;color:var(--mut,#64748b);margin-top:2px;line-height:1.35;overflow-wrap:anywhere}
#v155-pn .v155-it .r{flex:none;text-align:right;max-width:46%}
#v155-pn .v155-it .r small{display:block;font-size:10.5px;color:var(--mut,#64748b);text-transform:uppercase;letter-spacing:.04em}
#v155-pn .v155-it .r b{display:block;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}#v155-pn .v155-it .r b.n{white-space:nowrap}
#v155-pn .v155-it.sub{padding:6px 10px 6px 30px}#v155-pn .v155-it.sub .t{font-size:12.5px;font-weight:500}
#v155-pn .v155-it.tot{box-shadow:0 -2px 0 var(--bd,#d1d5db)!important;border-radius:0}#v155-pn .v155-it.tot .t{font-weight:800}#v155-pn .v155-it.tot .r b{font-weight:800}
#v155-pn .v155-more{display:none!important}#v155-pn .v155-all .v155-more{display:flex!important}
#v155-pn .v155-vt{display:block;width:100%;margin:8px 0 4px;border:0;border-radius:12px;background:rgba(120,120,128,.1);color:var(--apple,#0071e3);font-weight:700;font-size:13.5px;padding:10px;cursor:pointer}
#v155-pn .v155-vt:hover{background:rgba(120,120,128,.18)}
#v155-pn .v155-ok{font-size:12px;margin-top:10px;color:var(--mut,#64748b)}
#v155-pn .v155-sc .note{font-size:12.5px;opacity:.8;margin-top:8px}
#v155-pn .ok{color:var(--success,#198754);font-weight:600}#v155-pn .bad{color:var(--danger,#dc3545);font-weight:600}#v155-pn .warn{color:var(--warning,#b45309)}
#v155-pn .v155-sc table{width:100%;border-collapse:collapse;font-size:13px}#v155-pn .v155-sc td,#v155-pn .v155-sc th{padding:7px 6px;border-bottom:1px solid var(--bd,#eef0f3);text-align:left}
#v155-pn .v155-sc ul{padding-left:18px}
#v155-pn .vx149-dot{display:inline-block;width:30px;height:30px;border-radius:50%}
#v155-pn .vx149-dot.gn{background:#12a150}#v155-pn .vx149-dot.am{background:#e0a400}#v155-pn .vx149-dot.rd{background:#d03b3b}#v155-pn .vx149-dot.gr{background:#a3a29c}
body:has(#v155-ov) #v147-rail{display:none}
@media(max-width:600px){#v155-pn{border-radius:0}#v155-pn:focus{outline:none}
#v155-pn .v155-fix{padding:18px 16px 12px}#v155-pn .v155-sc{padding:6px 16px 24px}#v155-pn .v155-num{font-size:36px}}
`;
function css(){if(document.getElementById('v155-css'))return;const s=document.createElement('style');s.id='v155-css';s.textContent=CSS;(document.head||document.documentElement).appendChild(s)}

/* ───────────────────────── ler a gaveta que já existe ───────────────────────── */
const HASH_RE=/(?:V130_go|VD_go|V138_go|go)\(\s*'(#\/[^']*)'|location\.hash\s*=\s*'(#\/[^']*)'|location\.replace\(\s*'(#\/[^']*)'/;
const hashOf=code=>{const m=String(code||'').match(HASH_RE);return m?(m[1]||m[2]||m[3]):''};
const telaDe=lb=>String(lb||'').replace(/\s*[›>→]\s*$/,'').replace(/^\s*(Abrir|Ver|Mudar a meta)\s*/i,'').replace(/^\(|\)$/g,'').trim();

/* uma tabela → itens de lista (título · linha cinza · valor à direita), mantendo o clique de cada linha */
function lerTabela(tbl){
  const hs=[...tbl.querySelectorAll('thead th')].map(txt);
  const out={hs,rows:[],n:0};
  [...tbl.querySelectorAll('tbody > tr')].forEach(tr=>{
    const tds=[...tr.children].filter(c=>c.tagName==='TD'||c.tagName==='TH');if(!tds.length)return;
    const kind=tr.classList.contains('tot')?'tot':tr.classList.contains('sub')?'sub':'row';
    if(kind==='row')out.n++;
    out.rows.push({kind,tr,tds,on:tr.getAttribute('onclick')||''});
  });
  return out}
function itemHTML(t,r){
  const on=r.on?` onclick="${E(r.on)}"`:'';const cls='v155-it'+(r.on?' click':'')+(r.kind==='sub'?' sub':'')+(r.kind==='tot'?' tot':'');
  const cells=r.tds.map(td=>td.innerHTML.trim());const ttx=r.tds.map(txt);
  if(r.kind==='sub'){const parts=cells.map((c,i)=>ttx[i]&&ttx[i]!=='—'?c:'').filter(Boolean);
    const last=parts.length>1?parts.pop():'';return `<div class="${cls}"${on}><div class="m"><div class="t">${parts.join(' · ')}</div></div>${last?`<div class="r"><b>${last}</b></div>`:''}</div>`}
  if(cells.length===1)return `<div class="${cls}"${on}><div class="m"><div class="t">${cells[0]}</div></div></div>`;
  const li=cells.length-1;const mid=[];
  for(let i=1;i<li;i++){const v=ttx[i];if(!v||v==='—')continue;mid.push(/^[\d.,%\s−+-]+(un\.)?$/.test(v)&&t.hs[i]?`${E(t.hs[i])} ${cells[i]}`:cells[i])}
  const lh=t.hs[li]||'';
  return `<div class="${cls}"${on}><div class="m"><div class="t">${cells[0]||'&nbsp;'}</div>${mid.length?`<div class="s">${mid.join(' · ')}</div>`:''}</div><div class="r">${lh&&r.kind!=='tot'?`<small>${E(lh)}</small>`:''}<b${/^[R$\s\d.,%−+-]*(un\.)?$/.test(ttx[li])?' class="n"':''}>${cells[li]}</b></div></div>`}

/* o que cada linha identifica: ids (no clique) e nomes (1ª coluna) — usado para filtrar a tela de destino */
function chaves(tabs){const ids=new Set(),names=new Set();let deal=false;
  tabs.forEach(t=>t.rows.forEach(r=>{if(r.kind!=='row')return;const on=r.on;let m;
    const re=/#\/[a-z0-9_]+\/([^'"\s)?&]+)/gi;while((m=re.exec(on)))ids.add(decodeURIComponent(m[1]));
    const rd=/S\.deal\s*=\s*'([^']+)'/.exec(on);if(rd){ids.add(rd[1]);deal=true}
    const ri=/\bid\s*:\s*'?([\w-]+)'?/.exec(on);if(ri)ids.add(ri[1]);
    const rt=/_tog\('([^']+)'\)/.exec(on);if(rt){const seg=rt[1].split('|');if(seg.length>1)ids.add(seg[seg.length-1])}
    const c0=r.tds[0];if(c0){const b=c0.querySelector('b');let s=txt(b||c0).replace(/^[▸▾►▼]\s*/,'');if(s&&s.length>=2&&!/^total$/i.test(s))names.add(s)}}));
  return {ids:[...ids].filter(x=>String(x).length>=3),names:[...names],deal}}

/* gaveta .vd-dr (Início V130/v149 e Diretoria VD) → descrição */
function lerGaveta(dr){
  const D={src:dr,ov:dr.closest('.vd-ov')||dr,close:null,big:'',lb:'',sub:'',ctx:'',fonte:'',btn:null,alts:[],how:[],list:[],tabs:[]};
  const x=dr.querySelector(':scope > .x');D.close=()=>{if(x&&x.isConnected)x.click();else{try{V130_close()}catch(e){}try{VD_close()}catch(e){}}};
  let seenH3=false,seenBig=false,pendH='';
  [...dr.childNodes].forEach(n=>{
    if(n.nodeType===3){if(n.textContent.trim())D.list.push({html:E(n.textContent)});return}
    if(n.nodeType!==1)return;const c=n.classList;
    if(c.contains('x'))return;
    if(n.tagName==='H3'&&!seenH3){seenH3=true;D.lb=n.innerHTML;return}
    if(c.contains('big')&&!seenBig){seenBig=true;D.big=n.innerHTML;return}
    if(c.contains('lead')){if(!seenH3){D.ctx=n.innerHTML;return}if(seenBig&&!D.sub&&txt(n)){D.sub=n.innerHTML;return}if(txt(n))D.how.push(n.outerHTML);return}
    if(c.contains('vx149-fonte')){D.fonte=txt(n).replace(/^De onde vem:\s*/i,'');return}
    if(n.tagName==='A'&&c.contains('btnl')){D.alts.push({lb:txt(n),on:n.getAttribute('onclick')||'',el:n});return}
    if(/^H[456]$/.test(n.tagName)){pendH=n.innerHTML;return}
    const tbl=n.tagName==='TABLE'?n:(c.contains('tw')||c.contains('tblwrap'))?n.querySelector('table'):null;
    if(tbl){const t=lerTabela(tbl);t.h=pendH;pendH='';D.tabs.push(t);D.list.push({tab:t});return}
    if(c.contains('note')){if(n.querySelector('.ok,.bad')&&/soma|mesmo n[uú]mero|bate|fecha/i.test(txt(n))){D.list.push({ok:n.innerHTML});return}
      if(/padding:\s*14px/.test(n.getAttribute('style')||'')){D.list.push({html:n.outerHTML});return}
      D.how.push(n.outerHTML);return}
    if(pendH){D.list.push({html:`<div class="v155-h">${pendH}</div>`});pendH=''}
    D.list.push({html:n.outerHTML})});
  /* o botão principal = o último "Abrir …" (o link do rodapé de antes); os outros ficam pequenos abaixo dele */
  if(D.alts.length){const b=D.alts.pop();if(hashOf(b.on))D.btn=b;else D.alts.push(b)}
  alvo(D);return D}

/* destino: o link do rodapé de antes; quando ele leva a um painel sem a lista desses registros, a lista que os tem */
function alvo(D){const b=D.btn;if(!b)return;b.h=hashOf(b.on);b.tela=telaDe(b.lb);const k=chaves(D.tabs);D.k=k;
  const lb=txt(Object.assign(document.createElement('div'),{innerHTML:D.lb}));
  const links=new Set();D.tabs.forEach(t=>t.rows.forEach(r=>{if(r.kind!=='row')return;const m=/(#\/[a-z0-9_]+)\/[^'"\s)]+/i.exec(r.on);if(m)links.add(m[1])}));
  let to=null,tela=null;
  if(/^#\/epainel\b/.test(b.h)){const m=lb.match(/^Invent[aá]rio\s+(SP|RJ)$/i);if(m){to='#/lugar/'+m[1].toUpperCase();tela='Estoque › '+lb}else{to='#/estoque';tela='Estoque › Equipamentos'}}
  else if(/^#\/prjpainel\b/.test(b.h)&&links.size===1&&links.has('#/prjobras')){to='#/prjobras';tela='Projetos › Obras'}
  if(to){b.code=b.on.split(b.h).join(to);b.h=to;b.tela=tela}else b.code=b.on}

/* Operação › Painel: "Atividades atrasadas (171)" abria um modal com a lista inteira */
function lerModal(m){
  const h5=m.querySelector('h5');const t=txt(h5);const mm=t.match(/^(.*?)\s*\((\d[\d.]*)\)\s*$/);
  const D={src:m,ov:m,close:()=>{m.remove()},big:mm?E(N0(+mm[2].replace(/\./g,''))):'',lb:E(mm?mm[1]:t),sub:'',ctx:'',fonte:'Operação › Painel · atividades das obras ativas',btn:null,alts:[],how:[],list:[],tabs:[]};
  const head=h5&&h5.closest('.d-flex');
  [...m.children].forEach(n=>{if(n===head)return;if(n.classList.contains('sub')){D.how.push(n.outerHTML);return}
    const tbl=n.tagName==='TABLE'?n:n.querySelector('table');if(tbl){const t=lerTabela(tbl);D.tabs.push(t);D.list.push({tab:t});return}D.list.push({html:n.outerHTML})});
  return D}

/* ───────────────────────── montar o painel ───────────────────────── */
let CUR=null;
function keyOf(D){return nz(D.lb).slice(0,80)+'|'+nz(txt(Object.assign(document.createElement('div'),{innerHTML:D.big})))}
function montar(D){
  css();const key=keyOf(D);const novo=!document.getElementById('v155-ov')||ST.key!==key;
  const velho=document.getElementById('v155-ov');
  if(velho){const sc=velho.querySelector('.v155-sc');if(sc&&ST.key)ST.scroll[ST.key]=sc.scrollTop;velho.remove()}
  ST.key=key;CUR=D;
  D.ov.classList.add('v155-hid');
  const fonteCurta=D.fonte?D.fonte.split(/[,(;]|\.\s/)[0].replace(/\.$/,'').trim():'';
  const vem=fonteCurta||(D.btn?telaDe(D.btn.lb):'')||(D.alts[0]?telaDe(D.alts[0].lb):'');
  const how=[];if(D.fonte&&D.fonte!==fonteCurta)how.push(`<div><b>De onde vem:</b> ${E(D.fonte)}</div>`);if(D.ctx)how.push(`<div>${D.ctx}</div>`);how.push(...D.how);
  const temHow=how.length>0;const abreHow=!!ST.how[key];
  /* lista */
  let li='',tix=0;
  D.list.forEach(p=>{
    if(p.tab){const t=p.tab;const k=key+'|'+(tix++);const all=!!ST.all[k];let i=0,hid=0;let rows='';let lastHidden=false;
      t.rows.forEach(r=>{let more=false;if(r.kind==='row'){i++;more=i>LIM;lastHidden=more}else if(r.kind==='sub'){more=lastHidden}
        if(more)hid+=r.kind==='row'?1:0;const h=itemHTML(t,r);rows+=more?h.replace('class="v155-it','class="v155-more v155-it'):h});
      const nome=t.h||(t.hs[0]?E(t.hs[0]):'Registros');
      if(t.rows.length)li+=`<div class="v155-h">${nome}${t.n?` · ${N0(t.n)}`:''}</div>`;
      li+=`<div class="v155-tab${all?' v155-all':''}" data-k="${E(k)}">${rows}</div>`;
      if(hid)li+=`<button class="v155-vt" data-k="${E(k)}" data-n="${hid}">${all?'Mostrar só os '+LIM+' primeiros':'+ '+N0(hid)+' — ver todos'}</button>`;
      return}
    if(p.ok){li+=`<div class="v155-ok">${p.ok}</div>`;return}
    li+=p.html});
  const ov=document.createElement('div');ov.id='v155-ov';if(novo)ov.className='v155-in';
  ov.innerHTML=`<aside id="v155-pn" role="dialog" aria-modal="true" aria-label="${E(txt(Object.assign(document.createElement('div'),{innerHTML:D.lb})))}">
    <div class="v155-fix">
      <div class="v155-top"><div class="v155-tt"><div class="v155-num">${D.big||''}</div><div class="v155-lb">${D.lb||''}</div>${D.sub?`<div class="v155-sub">${D.sub}</div>`:''}</div><button class="v155-x" aria-label="Fechar" title="Fechar (Esc)">✕</button></div>
      ${vem||temHow?`<div class="v155-src"><span>${vem?`Vem de: <b>${E(vem)}</b>`:''}</span>${temHow?`<button class="v155-hw" aria-expanded="${abreHow}">como é calculado ${abreHow?'▴':'▾'}</button>`:''}</div>`:''}
      ${temHow?`<div class="v155-how"${abreHow?'':' hidden'}>${how.join('')}</div>`:''}
      ${D.btn?`<button class="v155-go"><span>${D.tabs.some(t=>t.n)?'Abrir na tela, já filtrado':'Abrir na tela'}<small>${E(D.btn.tela||telaDe(D.btn.lb))}</small></span><i>→</i></button>`:''}
      ${D.alts.length?`<div class="v155-alt">${D.alts.map((a,i)=>`<a data-i="${i}">${E(a.lb)}</a>`).join('')}</div>`:''}
    </div>
    <div class="v155-sc">${li}</div></aside>`;
  document.body.appendChild(ov);
  const pn=ov.querySelector('#v155-pn');
  ov.addEventListener('click',e=>{if(e.target===ov)fechar()});
  pn.querySelector('.v155-x').addEventListener('click',fechar);
  const hw=pn.querySelector('.v155-hw');if(hw)hw.addEventListener('click',()=>{ST.how[key]=!ST.how[key];const h=pn.querySelector('.v155-how');h.hidden=!ST.how[key];hw.textContent='como é calculado '+(ST.how[key]?'▴':'▾');hw.setAttribute('aria-expanded',ST.how[key])});
  pn.querySelectorAll('.v155-vt').forEach(b=>b.addEventListener('click',()=>{const k=b.getAttribute('data-k');ST.all[k]=!ST.all[k];const box=[...pn.querySelectorAll('.v155-tab')].find(x=>x.getAttribute('data-k')===k);if(box)box.classList.toggle('v155-all',!!ST.all[k]);b.textContent=ST.all[k]?'Mostrar só os '+LIM+' primeiros':'+ '+N0(+b.getAttribute('data-n'))+' — ver todos'}));
  const go=pn.querySelector('.v155-go');if(go)go.addEventListener('click',()=>irFiltrado(D));
  pn.querySelectorAll('.v155-alt a').forEach(a=>a.addEventListener('click',()=>{const x=D.alts[+a.getAttribute('data-i')];if(x&&x.el)x.el.click()}));
  const sc=pn.querySelector('.v155-sc');if(!novo&&ST.scroll[key])sc.scrollTop=ST.scroll[key];
  pn.setAttribute('tabindex','-1');if(novo)setTimeout(()=>{try{pn.focus({preventScroll:true})}catch(e){}},30);
}
function fechar(){const D=CUR;tirar();if(D)try{D.close()}catch(e){console.error('v155 fechar',e)}}
function tirar(){const o=document.getElementById('v155-ov');if(o)o.remove();CUR=null;ST.key=null}

/* ───────────────────────── abrir a tela já filtrada ───────────────────────── */
/* os filtros que a própria tela guarda: zerados para que a lista mostre todos e o destaque escolha exatamente os do número */
const ZERA={'#/propostas':()=>{S.propF={}},'#/negs':()=>{S.negF={}},'#/estoque':()=>{S.estCat=null;S.estSit=null;S.plF={}},
  '#/prjobras':()=>{COP.ui.prjobras={situacao:'*'}},'#/obras':()=>{COP.ui.obras={}}};
/* v156: cada linha da gaveta = UM registro (ids do clique, ou o nome + as outras colunas) — a tela de destino mostra
   uma linha por registro, e o que ela não tiver aparece nomeado na faixa (a ponte), nunca como diferença sem explicação */
const NUMC=/^(R\$\s?)?[−+-]?[\d.,]+%?(\s*(un\.?|dias?|d))?$/i;
function recsDe(tabs){const R=[];const cnt={};
  tabs.forEach(t=>t.rows.forEach(r=>{if(r.kind!=='row')return;const on=r.on||'';const ids=[];let m;let prod=false;
    const re=/#\/[a-z0-9_]+\/([^'"\s)?&]+)/gi;while((m=re.exec(on)))ids.push(decodeURIComponent(m[1]));
    const rd=/S\.deal\s*=\s*'([^']+)'/.exec(on);if(rd)ids.push(rd[1]);
    const ri=/\bid\s*:\s*'?([\w-]+)'?/.exec(on);if(ri)ids.push(ri[1]);
    const rt=/_tog\('([^']+)'\)/.exec(on);if(rt){const seg=rt[1].split('|');if(seg.length>1){ids.push(seg[seg.length-1]);prod=/^(est_|terr|nec)/.test(seg[0])}}
    const c0=r.tds[0];const b0=c0&&c0.querySelector('b');const name=txt(b0||c0).replace(/^[▸▾►▼]\s*/,'');
    const toks=r.tds.slice(1).map(td=>txt(td)).filter(x=>x&&x!=='—'&&x.length>=2&&!NUMC.test(x)).map(nz).filter(x=>x.length>=2&&x.length<=90);
    const u=[...new Set(ids.filter(x=>String(x).length>=3||/^[a-z]\d$/i.test(String(x))))];u.forEach(x=>cnt[x]=(cnt[x]||0)+1);
    const hm=/(#\/[^'"\s)]+)/.exec(on);
    const nn=nz(name);let nn2=nn.split(' · ')[0].split(' — ')[0].trim();if(nn2===nn){const pm=/\(([^)]+)\)/.exec(nn);if(pm)nn2=pm[1].trim()}
    R.push({ids:u,name,nn,nn2:nn2!==nn&&nn2.length>=2?nn2:'',toks,h:prod&&u.length?'#/produto/'+u[u.length-1]:(hm&&hm[1].split('/').length>2?hm[1]:'')})}));
  /* um "id" repetido em várias linhas (ex.: todas abrem '#/receber/vencidos') não identifica ninguém */
  R.forEach(r=>{r.ids=r.ids.filter(x=>cnt[x]===1)});return R}
function irFiltrado(D){
  const b=D.btn;if(!b)return;const code=b.code||b.on;const h=b.h||hashOf(code);const k=D.k||chaves(D.tabs);
  const n=D.tabs.reduce((a,t)=>a+t.n,0);
  try{if(window.V156&&typeof V156.painel==='function'&&V156.painel(D,{h,code,el:b.el,tirar}))return}catch(e){console.error('v156 painel',e)}
  const recs=recsDe(D.tabs);
  const h0=(D.tabs[0]&&D.tabs[0].hs[0])||'';const unid=h0?nz(h0).replace(/^(.*[^s])$/,'$1s').replace(/oes$/,'ões'):'';
  const bigT=txt(Object.assign(document.createElement('div'),{innerHTML:D.big}));const bigN=/^\d[\d.]*$/.test(bigT)?+bigT.replace(/\./g,''):null;
  const subT=txt(Object.assign(document.createElement('div'),{innerHTML:D.sub||''}));const subU=/^(\d[\d.]*) unidades\b/.exec(subT);
  const ponte=recs.length&&(/un\.$/.test(bigT)||(bigN!=null&&bigN!==recs.length))?`${bigT} em ${N0(recs.length)} ${unid||'linhas'}`:(recs.length&&subU?`${subU[1]} un. em ${N0(recs.length)} ${unid||'linhas'}`:'');
  ST.sp=(k.ids.length||k.names.length)&&n?{path:h,ids:k.ids,names:k.names,recs,unid,ponte,n:recs.length||n,lb:txt(Object.assign(document.createElement('div'),{innerHTML:D.big}))+' · '+txt(Object.assign(document.createElement('div'),{innerHTML:D.lb})),t:Date.now(),t0:Date.now(),fixed:false}:null;
  try{const base=h.split('?')[0];if(ST.sp&&ZERA[base])ZERA[base]()}catch(e){}
  try{if(ST.sp&&window.V156&&typeof V156.ajusta==='function')V156.ajusta(ST.sp)}catch(e){}
  tirar();
  try{new Function(code).call(b.el)}catch(e){console.error('v155 abrir',e);try{location.hash=h}catch(_){}}
  /* a tela (ou o iframe do CRM) pode demorar: tenta de novo até achar a lista, por até 20 s */
  const sp=ST.sp;if(sp){let i=0;const iv=setInterval(()=>{if(ST.sp!==sp||++i>40){clearInterval(iv);return}aplicar()},500)}
  setTimeout(aplicar,80)}

const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function bate(sp){
  const idRe=sp.ids.length?new RegExp('(^|[^\\w-])('+sp.ids.slice(0,1500).map(esc).join('|')+')(?=[^\\w-]|$)'):null;
  const nm=sp.names.map(nz).filter(x=>x.length>=2);const nmSet=new Set(nm);const nmLong=nm.filter(x=>x.length>=6);
  return tr=>{if(idRe){const h=tr.outerHTML;const oc=[...tr.querySelectorAll('[onclick]')].map(e=>e.getAttribute('onclick')).join(' ')+' '+(tr.getAttribute('onclick')||'')+' '+[...tr.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).join(' ');if(idRe.test(oc)||idRe.test(h.slice(0,400)))return true}
    if(!nm.length)return false;
    const cs=(tr.tagName==='TR'?[...tr.children]:[tr,...tr.querySelectorAll('b,strong')]).map(td=>{const b=td.querySelector&&td.querySelector('b,strong,a');return [nz(td.textContent),b?nz(b.textContent):'']});
    if(cs.some(([a,b])=>nmSet.has(a)||(b&&nmSet.has(b))))return true;
    if(nmLong.length){const all=nz(tr.textContent);return nmLong.some(x=>all.includes(x))}
    return false}}
function docs(){const m=document.getElementById('main');const r=[];if(m)r.push(m);
  document.querySelectorAll('iframe').forEach(f=>{try{const w=f.getBoundingClientRect();if(w.width>0&&f.contentDocument&&f.contentDocument.body)r.push(f.contentDocument.body)}catch(e){}});return r}
const BAN_ST='display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 10px;padding:10px 14px;border-radius:12px;background:rgba(0,113,227,.10);color:inherit;font:600 13px/1.4 -apple-system,BlinkMacSystemFont,sans-serif';
let aplicando=false;
function aplicar(){
  const sp=ST.sp;if(!sp)return;
  const cur=(location.hash||'').split('?')[0];const alvo=sp.path.split('?')[0];
  const noAlvo=cur===alvo||cur.indexOf(alvo+'/')===0||alvo.indexOf(cur+'/')===0;
  if(!noAlvo){
    /* 05/11 v157: a pessoa clicou em outra coisa depois de chegar (ex.: Início no menu) — solta o destaque, não puxa de volta */
    if(ULT_CLIQUE>sp.t0+300){limpar();return}
    /* o CRM (iframe) às vezes volta para a página inicial dele ao abrir pela 1ª vez: leva de volta à tela pedida, uma vez */
    const VIEW={crmparceiros:'parceiros',crminteracoes:'interacoes',crmtarefas:'tarefas',crmoport:'oportunidades',crmesteira:'esteira',crmgestao:'gestao',crmhome:'home'};
    const vk=VIEW[alvo.replace(/^#\//,'')];
    if(vk&&/^#\/crm/.test(cur)&&Date.now()-sp.t0<12000){const now=Date.now();if(!sp.fg||now-sp.fg>1400){sp.fg=now;try{const f=document.getElementById('crmFrame');const w=f&&f.contentWindow;if(w&&typeof w.go==='function')w.go(vk)}catch(e){}}sp.t=now;return}
    if(!sp.renav&&Date.now()-sp.t<6000){sp.renav=true;sp.t=Date.now();try{location.hash=sp.path}catch(e){}return}
    if(Date.now()-sp.t>4000){limpar();}return}
  aplicando=true;
  try{
    const recs=sp.recs&&sp.recs.length?sp.recs:null;const f=recs?null:bate(sp);let best=null;
    const cand=(items,host,root)=>{if(!items.length)return;let ok,n;
      if(recs){const as=casar(recs,items);ok=as.ok;n=as.n;if(!best||n>best.n||(n===best.n&&n>0&&items.length>best.rows.length))best={rows:items,ok,n,root,host,miss:as.miss,dup:as.dup}}
      else{n=0;ok=items.map(r=>{const v=f(r);if(v)n++;return v});
        if(!best||n>best.n||(n===best.n&&n>0&&items.length>best.rows.length))best={rows:items,ok,n,root,host}}};
    docs().forEach(root=>{
      root.querySelectorAll('table').forEach(t=>{if(t.closest('#v155-ov,.vd-ov,.v155-hid'))return;cand([...t.querySelectorAll(':scope > tbody > tr')].filter(r=>!r.classList.contains('tot')&&!(recs&&/^total\b/i.test(txt(r.firstElementChild)))),t.closest('.tblwrap,.tw')||t,root)});
      /* listas em cartões (ex.: o quadro do Pipeline): cartões com o mesmo formato de clique formam um grupo */
      const g={};root.querySelectorAll('[onclick]').forEach(e=>{if(e.tagName==='TR'||e.closest('table,#v155-ov,.vd-ov,[data-v155ban]'))return;const oc=e.getAttribute('onclick')||'';if(!/'[^']{3,}'/.test(oc))return;
        const sh=oc.replace(/'[^']*'/g,"''").replace(/\d+/g,'0');(g[sh]=g[sh]||[]).push(e)});
      Object.values(g).forEach(xs=>{if(xs.length>=3)cand(xs,root.firstElementChild,root)})});
    document.querySelectorAll('[data-v155ban]').forEach(b=>{if(!best||b.nextElementSibling!==best.host)b.remove()});
    docs().forEach(r=>r.querySelectorAll('[data-v155ban]').forEach(b=>{if(!best||b.nextElementSibling!==best.host)b.remove()}));
    if(!best)return;
    const tot=best.rows.length;
    if(best.n){best.rows.forEach((r,i)=>{if(best.ok[i]){if(r.hasAttribute('data-v155h')){r.style.removeProperty('display');r.removeAttribute('data-v155h')}}else if(!r.hasAttribute('data-v155h')){r.style.setProperty('display','none','important');r.setAttribute('data-v155h','1')}})}
    /* a linha "Total · abrir todas" soma a lista inteira: com o filtro ligado ela mentiria — fica escondida junto */
    if(recs&&best.n&&best.host&&best.host.querySelectorAll)best.host.querySelectorAll('tbody > tr').forEach(r=>{if((r.classList.contains('tot')||/^total\b/i.test(txt(r.firstElementChild)))&&!r.hasAttribute('data-v155h')){r.style.setProperty('display','none','important');r.setAttribute('data-v155h','1')}});
    const host=best.host;if(!host||!host.parentNode)return;let ban=host.previousElementSibling;
    if(!ban||!ban.hasAttribute('data-v155ban')){ban=host.ownerDocument.createElement('div');ban.setAttribute('data-v155ban','1');ban.style.cssText=BAN_ST;host.parentNode.insertBefore(ban,host)}
    let msg;
    if(recs){const miss=best.miss||[];const nm=sp.unid||'registros';
      const lk=r=>r.h?`<a href="javascript:void 0" data-v155go="${E(r.h)}" style="color:inherit;text-decoration:underline">${E(r.name||'(sem nome)')}</a>`:`<b>${E(r.name||'(sem nome)')}</b>`;
      if(!best.n)msg=`Não achei nesta lista os ${N0(recs.length)} ${nm} de <b>${E(sp.lb)}</b> — mostrando tudo`;
      else if(!miss.length)msg=`Filtrado pelo número <b>${E(sp.lb)}</b>: mostrando ${N0(best.n)} de ${N0(tot)}${sp.ponte?` <span style="font-weight:500;opacity:.8">· ${sp.ponte}</span>`:''}`;
      else msg=`Filtrado pelo número <b>${E(sp.lb)}</b>: mostrando ${N0(best.n)} de ${N0(tot)} · <span style="font-weight:500">ponte: ${N0(recs.length)} ${nm} = ${N0(best.n)} nesta lista + ${N0(miss.length)} que esta lista não mostra${sp.porque?' ('+E(sp.porque)+')':''}: ${miss.slice(0,12).map(lk).join(' · ')}${miss.length>12?` · + ${N0(miss.length-12)}`:''}</span>`}
    else{const dif=best.n!==sp.n?` <span style="font-weight:500;opacity:.8">(o número tem ${N0(sp.n)} — ${best.n?'nesta lista cada um pode ocupar mais de uma linha ou faltar':'esta lista não mostra estes registros'})</span>`:'';
      msg=best.n?`Filtrado pelo número <b>${E(sp.lb)}</b>: mostrando ${N0(best.n)} de ${N0(tot)}${dif}`:`Não achei nesta lista os registros de <b>${E(sp.lb)}</b> — mostrando tudo`}
    if(ban.getAttribute('data-msg')!==msg){ban.setAttribute('data-msg',msg);ban.innerHTML=`<span style="flex:1;min-width:200px">${msg}</span><button type="button" style="border:0;border-radius:999px;padding:6px 12px;background:rgba(120,120,128,.18);color:inherit;font:600 12.5px -apple-system,sans-serif;cursor:pointer">Mostrar tudo ✕</button>`;
      ban.querySelector('button').addEventListener('click',limpar);
      ban.querySelectorAll('[data-v155go]').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();const h=a.getAttribute('data-v155go');limpar();try{(window.top||window).location.hash=h}catch(e){location.hash=h}}))}
    ban.style.background=best.n&&!(best.miss&&best.miss.length)?'rgba(0,113,227,.10)':'rgba(245,158,11,.14)';
    if(!sp.fixed){sp.fixed=true;try{ban.scrollIntoView({block:'center'})}catch(e){}}
    window.__V155_last={n:best.n,tot,sp:sp.n,lb:sp.lb,path:cur,miss:(best.miss||[]).map(r=>r.name)};
  }catch(e){console.error('v155 filtro',e)}finally{setTimeout(()=>{aplicando=false},0)}}
/* casa cada registro com UMA linha (um para um): pelo id quando a linha tem id; senão pelo nome + as outras colunas */
const TOKRE=/[\w.-]{3,}/g;
function casar(recs,items){
  const at=items.map(r=>{let s=(r.getAttribute('onclick')||'')+' '+(r.getAttribute('href')||'')+' '+(r.getAttribute('data-v155')||'');
    r.querySelectorAll('[onclick],[href],[data-v155]').forEach(e=>{s+=' '+(e.getAttribute('onclick')||'')+' '+(e.getAttribute('href')||'')+' '+(e.getAttribute('data-v155')||'')});return s});
  const idx=new Map();at.forEach((s,i)=>{const seen=new Set();s.split(/[^\w.-]+/).forEach(tk=>{if(tk.length<2||seen.has(tk))return;seen.add(tk);let l=idx.get(tk);if(!l)idx.set(tk,l=[]);l.push(i)})});
  /* os ids do destino podem vir codificados (#/produto/c%201) */
  const tx=items.map(r=>nz(r.textContent));const bs=items.map(r=>{const b=r.querySelector('b,strong');return b?nz(b.textContent):''});
  const used=new Array(items.length).fill(false);const ok=new Array(items.length).fill(false);const miss=[];let n=0;
  const porId=recs.filter(r=>r.ids.length),porNome=recs.filter(r=>!r.ids.length);
  porId.forEach(r=>{let hit=-1;for(const id of r.ids){const l=idx.get(id)||idx.get(encodeURIComponent(id));if(l){hit=l.find(i=>!used[i]);if(hit==null)hit=-1;if(hit>=0)break}}
    if(hit<0&&r.nn){/* a lista não carrega o id: cai para o nome */hit=melhor(r,true);if(hit<0)hit=melhor(r,false)}
    if(hit>=0){used[hit]=ok[hit]=true;n++}else miss.push(r)});
  function melhor(r,soExato){let bi=-1,bsc=-1;for(let i=0;i<items.length;i++){if(used[i])continue;const t=tx[i];
      const exato=bs[i]===r.nn||(!!r.nn2&&bs[i]===r.nn2);if(soExato&&!exato)continue;if(!exato&&!(r.nn.length>=2&&t.includes(r.nn))&&!(r.nn2&&r.nn2.length>=4&&t.includes(r.nn2)))continue;
      let sc=(exato?100:0);r.toks.forEach(k=>{if(t.includes(k))sc+=10});if(sc>bsc){bsc=sc;bi=i}}return bi}
  /* 1º quem tem o nome exato na linha; depois os outros, do mais restrito (menos linhas possíveis) ao mais solto */
  const resto=[];porNome.forEach(r=>{const hit=r.nn?melhor(r,true):-1;if(hit>=0){used[hit]=ok[hit]=true;n++}else resto.push(r)});
  const cands=r=>{let k=0;for(let i=0;i<items.length;i++){if(!used[i]&&r.nn&&(tx[i].includes(r.nn)||(r.nn2&&r.nn2.length>=4&&tx[i].includes(r.nn2))))k++}return k};
  resto.map(r=>[r,cands(r)]).sort((x,y)=>x[1]-y[1]).forEach(([r])=>{const hit=r.nn?melhor(r,false):-1;if(hit>=0){used[hit]=ok[hit]=true;n++}else miss.push(r)});
  return {ok,n,miss}}
function limpar(){ST.sp=null;docs().forEach(r=>{r.querySelectorAll('[data-v155h]').forEach(x=>{x.style.removeProperty('display');x.removeAttribute('data-v155h')});r.querySelectorAll('[data-v155ban]').forEach(b=>b.remove())});document.querySelectorAll('[data-v155ban]').forEach(b=>b.remove())}
window.V155_limpar=limpar;

/* ───────────────────────── vigia: toda gaveta nova vira o painel ───────────────────────── */
let fila=false;let ULT_CLIQUE=0,ULT_HASH=0;try{window.addEventListener('hashchange',()=>{ULT_HASH=Date.now()},{capture:true})}catch(e){}try{['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev,()=>{ULT_CLIQUE=Date.now()},{capture:true}))}catch(e){}
function varrer(){fila=false;
  try{
    const dr=[...document.querySelectorAll('.vd-dr')].filter(d=>!d.closest('#v155-ov'));
    const nova=dr.find(d=>!d.hasAttribute('data-v155'));
    if(nova){dr.forEach(d=>d.setAttribute('data-v155','1'));
      /* 05/11 v157: gaveta que reaparece sozinha ao voltar para a tela (estado antigo) não abre o painel — só abre logo depois de um clique de verdade */
      if(Date.now()-ULT_CLIQUE>2500||ULT_HASH>=ULT_CLIQUE){const x=nova.querySelector(':scope > .x');try{if(x)x.click()}catch(e){}}
      else{const D=lerGaveta(nova);if(D.lb||D.big||D.list.length)montar(D)}}
    else if(CUR&&!(CUR.src&&CUR.src.isConnected)){tirar()}
    const mods=[...document.querySelectorAll('body > .card.p-3[style*="position: fixed"]')].filter(m=>m.hasAttribute('data-v155ativ')&&!m.hasAttribute('data-v155'));
    mods.forEach(m=>{m.setAttribute('data-v155','1');montar(lerModal(m))});
  }catch(e){console.error('v155 gaveta',e)}
  if(ST.sp&&!aplicando)aplicar()}
const agenda=()=>{if(fila)return;fila=true;(window.requestAnimationFrame||setTimeout)(varrer)};
try{new MutationObserver(ms=>{if(aplicando)return;if(ms.every(m=>m.target&&m.target.closest&&m.target.closest('#v155-ov')))return;agenda()}).observe(document.body||document.documentElement,{childList:true,subtree:true})}catch(e){console.error('v155 vigia',e)}
/* o CRM mora num iframe: vigia também dentro dele enquanto um filtro está ativo */
setInterval(()=>{if(!ST.sp)return;docs().forEach(r=>{if(r.ownerDocument!==document&&!r.__v155o){r.__v155o=true;try{new MutationObserver(()=>{if(!aplicando&&ST.sp)agenda()}).observe(r,{childList:true,subtree:true})}catch(e){}}})},700);
window.addEventListener('hashchange',()=>setTimeout(()=>{if(ST.sp)aplicar()},60));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('v155-ov')){e.stopPropagation();fechar()}},true);

/* Operação › Painel: a lista de atividades marca o modal que ela abre, para ele virar o painel */
function ligaAtv(){try{if(typeof COP!=='object'||!COP.ope||typeof COP.ope.listaAtv!=='function'||COP.ope.listaAtv.__v155)return false;
  const o=COP.ope.listaAtv;const w=function(){const antes=new Set(document.body.children);const r=o.apply(this,arguments);
    [...document.body.children].filter(c=>!antes.has(c)&&c.classList.contains('card')).forEach(c=>c.setAttribute('data-v155ativ','1'));agenda();return r};
  w.__v155=true;COP.ope.listaAtv=w;return true}catch(e){return false}}
if(!ligaAtv()){let n=0;const iv=setInterval(()=>{if(ligaAtv()||++n>120)clearInterval(iv)},1000)}

css();agenda();
window.V155D={montar,lerGaveta,aplicar,limpar,recsDe,casar,st:ST};
})();
