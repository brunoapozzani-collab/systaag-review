/* =====================================================================================================
   v124 · APRENDER FAZENDO — o guia que ensina a história demo pelas mãos de quem aprende (29/10/2026)
   Bruno: "I only learn by doing" — em vez de um botão que monta a história sozinho, um guia ao lado da tela
   diz o próximo clique, mostra onde ele está, explica em uma linha por quê, e confere sozinho quando o passo
   foi feito (lendo o próprio sistema, não a tela). Ninguém clica por ele.
   · dados: window.GUIA_CAPS (v124-guia-data.js) — capítulos → passos {tela, menu, faca, digite, alvo, porque, pronto}
   · progresso: localStorage 'systaag_guia124' (sobrevive ao "Começar do zero", que recarrega a página)
   · o botão "Carregar história demo" sai do Início; no lugar entra "Aprender fazendo"
   ===================================================================================================== */
(function(){
'use strict';
if(window.__V124GUIA)return;window.__V124GUIA=true;
const KEY='systaag_guia124';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const ld=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||{}}catch(e){return {}}};
const sv=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};
let ST=Object.assign({on:false,cap:0,passo:0,min:false,feitos:{}},ld());
const CAPS=()=>Array.isArray(window.GUIA_CAPS)?window.GUIA_CAPS:[];
const cap=()=>CAPS()[ST.cap]||null;
const passo=()=>{const c=cap();return c&&c.passos?c.passos[ST.passo]||null:null};
const hashNow=()=>location.hash||'#/home';
const sameScreen=t=>{if(!t)return true;const a=hashNow().split('/').slice(0,2).join('/'),b=String(t).split('/').slice(0,2).join('/');return a===b};
function evalPronto(p){if(!p||!p.pronto)return false;try{return !!(new Function('return ('+p.pronto+')'))()}catch(e){return false}}

/* ───────── encontrar o alvo (na página ou dentro do CRM) ───────── */
function docs(alvo){const out=[];if(alvo&&alvo.frame){const f=document.getElementById(alvo.frame);try{if(f&&f.contentDocument)out.push({d:f.contentDocument,f})}catch(e){}}else out.push({d:document,f:null});return out}
function visivel(el){if(!el)return false;const r=el.getBoundingClientRect();if(r.width<2||r.height<2)return false;const cs=(el.ownerDocument.defaultView||window).getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'}
function acha(alvo){if(!alvo)return null;
  for(const {d,f} of docs(alvo)){
    if(alvo.css){try{const els=[...d.querySelectorAll(alvo.css)].filter(visivel);if(els.length){const t=alvo.texto?els.find(e=>(e.innerText||e.value||'').trim().toLowerCase().includes(String(alvo.texto).toLowerCase())):null;return {el:t||els[0],f}}}catch(e){}}
    if(alvo.texto){const tx=String(alvo.texto).toLowerCase();const cand=[...d.querySelectorAll('button,a,[role=button],[onclick],label,.card,tr,option,summary,input[type=submit]')].filter(visivel).filter(e=>((e.innerText||e.value||'').trim().toLowerCase().includes(tx)));
      if(cand.length){cand.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);return {el:cand[0],f}}}}
  return null}
/* on the wrong screen: the menu control that leads there — the sub-menu link if its section is open, else the
   section's button on the left rail */
function caminho(tela){if(!tela)return null;const k=String(tela).replace(/^#\/?/,'').split('/')[0];if(!k)return null;
  const a=[...document.querySelectorAll('#subnav a[href^="#/'+k+'"]')].find(visivel);if(a)return {el:a,f:null};
  let lb=null;try{const sec=SEC_OF[k];const n=(NAV||[]).find(x=>x.id===sec);lb=n&&n.label}catch(e){}
  if(!lb)return null;const b=[...document.querySelectorAll('#rail button')].find(x=>x.title===lb&&visivel(x));return b?{el:b,f:null}:null}
/* ───────── v126 · conferir os campos ANTES de salvar (30/10) ─────────
   Bruno salvou a ficha da Carla com a Classificação que já vinha escolhida (CMV) em vez de "Despesa administrativa": o
   sistema aceitou, o guia ficou esperando para sempre e "Me mostre onde" não achava mais o botão. Agora:
   · cada campo pedido no painel ganha ✓ (certo) ou ✗ (diferente — e mostra o que está escrito agora);
   · o clique em Salvar com campo errado NÃO salva: o guia segura, contorna em vermelho o campo e diz o que trocar;
   · se algo já foi salvo errado (antes desta versão), o painel diz exatamente o que ficou diferente e como corrigir. */
const nz=s=>String(s==null?'':s).replace(/ /g,' ').replace(/[‐-―−]/g,'-').replace(/\s+/g,' ').trim();
const sa=s=>nz(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const CTL='input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file]),select,textarea';
const LBQ='label,.sub,.form-label,.lbl,th,dt,small,span,b,strong,div,td,p,legend,h6';
function lbTxt(el){let t='';for(const n of el.childNodes){if(n.nodeType===3)t+=n.textContent;else if(n.nodeType===1&&!n.matches(CTL)&&!n.querySelector('input,select,textarea,button'))t+=' '+n.textContent}return sa(t).replace(/[\s*:]+$/,'').trim()}
function esperado(v){let e=nz(v).replace(/\s*\([^()]*\)\s*$/,'').trim();if(!e||/\b(hoje|daqui|anteontem|ontem|amanh)/i.test(e))return null;return e}
/* e2e (30/10): "Hotel — equipe na obra (3 noites)" — the parentheses can be part of the text, not a hint: both count */
const variantes=v=>{const a=nz(v),b=esperado(v);return b==null?[]:[...new Set([a,b])]};
function num(v){v=nz(v).replace(/^R\$\s*/,'');if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(v)||/^-?\d+,\d+$/.test(v))return +v.replace(/\./g,'').replace(',','.');if(/^-?\d+(\.\d+)?$/.test(v))return +v;return null}
function campoEl(root,campo){const k=sa(campo).replace(/[\s*:]+$/,'');if(!k)return null;
  for(const l of root.querySelectorAll(LBQ)){if(!visivel(l)||lbTxt(l)!==k)continue;
    if(l.tagName==='LABEL'){const i=l.querySelector(CTL);if(i&&visivel(i))return i;if(l.htmlFor){const c=l.ownerDocument.getElementById(l.htmlFor);if(c&&visivel(c)&&c.matches(CTL))return c}}
    if(l.querySelector('input,select,textarea'))continue;
    let pa=l.parentElement;for(let n=0;n<3&&pa;n++,pa=pa.parentElement){
      const c=[...pa.querySelectorAll(CTL)].filter(visivel).find(c=>l.compareDocumentPosition(c)&4);
      if(c){const entre=[...pa.querySelectorAll('label,.sub,.form-label,.lbl')].some(x=>x!==l&&!x.contains(l)&&!x.contains(c)&&(l.compareDocumentPosition(x)&4)&&(x.compareDocumentPosition(c)&4)&&lbTxt(x));if(!entre)return c;break}}}
  return null}
function compara(c,valor){const e=esperado(valor);if(e==null)return null;const vs=variantes(valor);
  if(c.tagName==='SELECT'){const op=[...c.options];let m=op.filter(o=>vs.some(x=>sa(o.text)===sa(x)));if(!m.length)m=op.filter(o=>sa(o.text).startsWith(sa(e)));if(m.length!==1)return null;const cur=c.options[c.selectedIndex];
    return {ok:cur===m[0],agora:cur?nz(cur.text):'',bloq:true}}
  const v=nz(c.value);if(c.type==='date'){const d=e.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!d)return null;return {ok:v===d[3]+'-'+d[2]+'-'+d[1],agora:v,bloq:true}}
  const busca=c.type==='search'||c.hasAttribute('list')||/busc|pesquis|procur|digite para/i.test(c.placeholder||'');
  const ne=num(e);if(ne!=null){const nc=num(v);return {ok:nc!=null&&Math.abs(nc-ne)<0.005,agora:v,bloq:!busca}}
  const maius=e===e.toUpperCase()&&/[A-Z]/.test(e);const ok=vs.some(x=>maius?sa(v)===sa(x):v===x);
  return {ok,agora:v,bloq:!busca}}
let CHK=null,ESCOPO=null;
function confereCampos(p,h){if(!p||!(p.digite||[]).length||!h||!h.el)return null;
  const ds=p.digite;let best=null;
  if(ESCOPO&&ESCOPO.id===p.id&&ESCOPO.alvo===h.el&&ESCOPO.root.isConnected)best=ESCOPO.root;
  else{let el=h.el.parentElement,bn=0;for(let n=0;el&&n<9;n++,el=el.parentElement){const k=ds.filter(d=>campoEl(el,d.campo)).length;if(k>bn){bn=k;best=el}if(k===ds.length)break;if(el.id==='main'||el.tagName==='BODY')break}
    ESCOPO={id:p.id,alvo:h.el,root:best}}
  if(!best)return {id:p.id,rows:ds.map(d=>({campo:d.campo,ok:null}))};
  return {id:p.id,rows:ds.map(d=>{let c=campoEl(best,d.campo);if(!c)return {campo:d.campo,ok:null};
    /* e2e (30/10): "Obra" = a filter box ("nº ou cliente") followed by the real list: the list is what counts */
    if(c.tagName==='INPUT'&&c.parentElement){const sl=[...c.parentElement.querySelectorAll('select')].find(x=>visivel(x)&&(c.compareDocumentPosition(x)&4));if(sl&&compara(sl,d.valor))c=sl}
    const r=compara(c,d.valor);return r?Object.assign({campo:d.campo,el:c,vazio:!nz(c.value)},r):{campo:d.campo,ok:null}})}}
const ruins=ch=>ch?ch.rows.filter(r=>r.ok===false&&r.bloq):[];
let TENTOU=null;
function contorna(){/* depois de uma tentativa de salvar, os campos errados ficam contornados em vermelho */
  document.querySelectorAll('[data-g124bad]').forEach(e=>{e.style.outline='';e.style.outlineOffset='';e.removeAttribute('data-g124bad')});
  try{const f=document.querySelectorAll('iframe');f.forEach(fr=>{try{fr.contentDocument.querySelectorAll('[data-g124bad]').forEach(e=>{e.style.outline='';e.removeAttribute('data-g124bad')})}catch(e){}})}catch(e){}
  if(!CHK||TENTOU!==CHK.id)return;ruins(CHK).forEach(r=>{r.el.setAttribute('data-g124bad','1');r.el.style.outline='3px solid #dc2626';r.el.style.outlineOffset='2px'})}
function guarda(ev){try{if(!ST.on)return;const p=passo();if(!p||!(p.digite||[]).length)return;const h=acha(p.alvo);if(!h)return;
  if(!(h.el===ev.target||h.el.contains(ev.target)))return;const ch=confereCampos(p,h);const b=ruins(ch);if(!b.length)return;
  ev.preventDefault();ev.stopImmediatePropagation();CHK=ch;TENTOU=p.id;contorna();ultimo='';desenha();
  try{toast('Ainda não salvei: '+b.map(r=>r.campo+(r.vazio?' está vazio':' está “'+r.agora+'”')).join(' · ')+'. Acerte o que está em vermelho e clique de novo.',true)}catch(e){}
  try{(window.__G124LOG=window.__G124LOG||[]).push({passo:p.id,segurou:b.map(r=>r.campo+'='+r.agora)})}catch(e){}}catch(e){}}
document.addEventListener('click',guarda,true);
function guardaFrames(){document.querySelectorAll('iframe').forEach(f=>{try{const d=f.contentDocument;if(d&&!d.__g124g){d.__g124g=1;d.addEventListener('click',guarda,true)}}catch(e){}})}
/* já salvo, mas diferente do pedido: cada tipo de passo sabe dizer o quê e como corrigir */
function confereFicha(p){const d=k=>{const x=(p.digite||[]).find(x=>x.campo===k);return x?x.valor:null};const nome=d('Nome');if(!nome)return null;
  const fs=(S.db.folha||[]).filter(f=>sa(f.nome)===sa(nome));if(!fs.length)return null;const f=fs.find(f=>f.nome===nome)||fs[0];const dif=[];let corr=null,bot=null;
  if(f.nome!==nome)dif.push('o nome ficou “'+f.nome+'” (o guia espera “'+nome+'”, igualzinho)');
  let CL={};try{CL=CLASSE_LB}catch(e){}const cl=d('Classificação'),ck=cl&&Object.keys(CL).find(k=>CL[k]===cl);const fz=[];
  if(ck&&f.classe!==ck){dif.push('a Classificação ficou “'+(CL[f.classe]||f.classe)+'” — o certo é “'+cl+'”');fz.push('em “Classificação”, escolha “'+cl+'”')}
  const dc=d('Disciplina (técnico)');if(dc&&f.disc!==sa(dc)){dif.push('a Disciplina ficou “'+(f.disc||'nenhuma')+'” — o certo é “'+dc+'”');fz.push('em “Disciplina (técnico)”, escolha “'+dc+'”')}
  if(fz.length){const alvo=ck&&f.classe!==ck?'classe':'disc';
    corr={tela:'#/colaboradores/'+encodeURIComponent(f.nome),menu:'Base de dados › Pessoas › clique em '+f.nome+' (abre a ficha)',faca:'Na ficha de '+f.nome+', no quadro Cadastro, '+fz.join(' e depois ')+'.',alvo:{css:'select[data-g126="'+alvo+'"]',texto:'',frame:null}}}
  const np=(S.db.pessoas||[]).filter(x=>x.nome===f.nome).length;if(np>1)dif.push(f.nome+' aparece '+np+' vezes na Base');if(!f.pessoa_id)dif.push('a ficha não ficou ligada a uma pessoa da Base');
  return dif.length?{msg:'A ficha de '+f.nome+' já foi salva, mas '+dif.join('; ')+'.',corr,bot}:null}
function conferePasso(p){if(!p)return null;try{if(/A\.novoColaborador/.test((p.alvo&&p.alvo.css)||''))return confereFicha(p)}catch(e){}return null}
let CF=null;
function rectDe(h){const r=h.el.getBoundingClientRect();if(!h.f)return r;const fr=h.f.getBoundingClientRect();return {left:r.left+fr.left,top:r.top+fr.top,width:r.width,height:r.height}}

/* ───────── a interface ───────── */
const CSS=`<style id="guia124-css">
#g124{position:fixed;left:18px;bottom:18px;z-index:2147483000;width:380px;max-width:calc(100vw - 36px);max-height:calc(100vh - 36px);display:flex;flex-direction:column;background:var(--card,#fff);color:inherit;border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.06);font-size:14px;overflow:hidden}
#g124 .hd{display:flex;align-items:center;gap:8px;padding:12px 16px 8px;font-size:12px;font-weight:700;letter-spacing:.02em;opacity:.8;flex:0 0 auto;cursor:grab;user-select:none;touch-action:none}#g124 .hd .grip{opacity:.5;font-size:14px;letter-spacing:-2px}#g124.arrasta .hd{cursor:grabbing}
#g124 .hd .x{margin-left:auto;border:0;background:transparent;font-size:18px;line-height:1;opacity:.6;cursor:pointer;padding:2px 6px}
#g124 .bar{height:4px;background:rgba(120,120,128,.15);margin:0 16px;border-radius:4px;overflow:hidden}#g124 .bar i{display:block;height:100%;background:#2563eb;border-radius:4px;transition:width .3s}
#g124 .bd{padding:14px 18px 6px;overflow-y:auto;flex:1 1 auto;min-height:0;overscroll-behavior:contain}#g124 .bar,#g124 .st,#g124 .ft{flex:0 0 auto}
#g124 .n{font-size:12px;opacity:.6;font-weight:600}
#g124 .faca{font-size:19px;font-weight:800;line-height:1.3;margin:4px 0 10px;letter-spacing:-.01em}
#g124 .dig{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
#g124 .dig div{display:flex;justify-content:space-between;gap:10px;background:rgba(37,99,235,.07);border-radius:10px;padding:6px 10px;font-size:13px;cursor:copy}#g124 .dig.muitos div{padding:4px 9px;font-size:12px}#g124 .dig.muitos{gap:4px}
#g124 .dig b{font-weight:700;text-align:right}
#g124 .dig div.ok{background:rgba(22,163,74,.1)}#g124 .dig div.ok span{color:#15803d}
#g124 .dig div.bad{background:rgba(220,38,38,.12)}#g124 .dig div.bad span{color:#b91c1c;font-weight:700}#g124 .dig small{display:block;font-weight:500;font-size:11.5px;opacity:.85}
#g124 .cf{background:rgba(220,38,38,.09);border:1px solid rgba(220,38,38,.35);border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.45;margin-bottom:10px}#g124 .cf ul{margin:6px 0 0;padding-left:18px}#g124 .cf button{border:0;border-radius:10px;padding:7px 11px;font-weight:700;font-size:12.5px;cursor:pointer;background:#2563eb;color:#fff}
#g124 .pq{font-size:12.5px;opacity:.72;line-height:1.45;margin-bottom:10px}
#g124 .menu{font-size:12px;margin-bottom:10px;padding:7px 10px;border-radius:10px;background:rgba(217,119,6,.1)}
#g124 .st{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;padding:10px 18px;border-top:1px solid rgba(120,120,128,.15)}
#g124 .st .dot{width:10px;height:10px;border-radius:50%;background:#9ca3af;animation:g124p 1.4s infinite}
#g124 .st.ok{color:#16a34a}#g124 .st.ok .dot{background:#16a34a;animation:none}
@keyframes g124p{0%,100%{opacity:.35}50%{opacity:1}}
#g124 .ft{display:flex;gap:8px;padding:0 18px 16px;flex-wrap:wrap}
#g124 .ft button{border:0;border-radius:10px;padding:8px 12px;font-weight:700;font-size:13px;cursor:pointer;background:rgba(120,120,128,.14);color:inherit}
#g124 .ft button.pri{background:#2563eb;color:#fff}
#g124.dir{left:auto;right:96px}
#g124.min .bd,#g124.min .ft,#g124.min .bar{display:none}
#g124ring{position:fixed;z-index:2147482999;pointer-events:none;border:3px solid #2563eb;border-radius:12px;box-shadow:0 0 0 6px rgba(37,99,235,.18);transition:all .15s;animation:g124r 1.3s infinite}
@keyframes g124r{0%,100%{box-shadow:0 0 0 4px rgba(37,99,235,.25)}50%{box-shadow:0 0 0 12px rgba(37,99,235,.05)}}
#g124 .fim h4{font-size:20px;font-weight:800;margin:4px 0 8px}#g124 .fim ul{padding-left:18px;margin:0 0 8px;font-size:13px;line-height:1.5}
#g124 .caps{display:flex;flex-direction:column;gap:6px;margin:6px 0 4px}
#g124 .caps button{text-align:left;border:0;border-radius:10px;padding:8px 10px;background:rgba(120,120,128,.08);color:inherit;font-size:13px;cursor:pointer}
#g124 .caps button.on{background:rgba(37,99,235,.12);font-weight:700}
</style>`;
let ring=null,box=null,mostrar=false,okDesde=0;
/* v126 (30/10): Bruno não alcançava o "minimizar" — com muitos campos o painel passava do alto da tela. Agora ele nunca é
   mais alto que a janela (o meio rola), e dá para arrastar pelo título para qualquer lugar; duplo clique volta ao canto. */
function posiciona(){if(!box)return;const P=ST.pos;if(!P){box.style.left=box.style.top='';box.style.right=box.style.bottom='';return}
  const w=box.offsetWidth||380,h=box.offsetHeight||200;const x=Math.max(8,Math.min(P.x,innerWidth-w-8)),y=Math.max(8,Math.min(P.y,innerHeight-Math.min(h,innerHeight-16)-8));
  box.style.left=x+'px';box.style.top=y+'px';box.style.right='auto';box.style.bottom='auto'}
function arrasto(){let d=null;
  box.addEventListener('pointerdown',ev=>{const hd=ev.target.closest('.hd');if(!hd||ev.target.closest('button'))return;const r=box.getBoundingClientRect();d={dx:ev.clientX-r.left,dy:ev.clientY-r.top,id:ev.pointerId};box.classList.add('arrasta');try{hd.setPointerCapture(ev.pointerId)}catch(e){}ev.preventDefault()});
  box.addEventListener('pointermove',ev=>{if(!d)return;ST.pos={x:ev.clientX-d.dx,y:ev.clientY-d.dy};posiciona()});
  const fim=()=>{if(!d)return;d=null;box.classList.remove('arrasta');sv(ST)};box.addEventListener('pointerup',fim);box.addEventListener('pointercancel',fim);
  box.addEventListener('dblclick',ev=>{if(!ev.target.closest('.hd')||ev.target.closest('button'))return;ST.pos=null;sv(ST);posiciona()});
  window.addEventListener('resize',posiciona)}
function ensure(){if(!document.getElementById('guia124-css'))document.head.insertAdjacentHTML('beforeend',CSS);
  if(!box){box=document.createElement('div');box.id='g124';document.body.appendChild(box);arrasto()}
  if(!ring){ring=document.createElement('div');ring.id='g124ring';ring.style.display='none';document.body.appendChild(ring)}}
function total(){return CAPS().reduce((a,c)=>a+(c.passos||[]).length,0)}
function feitosAntes(){let n=0;for(let i=0;i<ST.cap;i++)n+=(CAPS()[i].passos||[]).length;return n+ST.passo}
function desenha(){
  if(!ST.on){if(box)box.style.display='none';if(ring)ring.style.display='none';return}
  ensure();box.style.display='';const lado=box.classList.contains('dir');box.className=(ST.min?'min':'')+(lado?' dir':'');posiciona();
  const c=cap();if(!c){box.innerHTML='';return}
  const p=passo();const pct=Math.round(feitosAntes()/Math.max(1,total())*100);
  const hd=`<div class="hd" title="Arraste para mover · duplo clique volta ao canto"><span class="grip">⋮⋮</span><span>Aprender fazendo · Capítulo ${ST.cap+1} de ${CAPS().length} · ${E(c.depto||'')}</span><button class="x" title="${ST.min?'Abrir':'Minimizar'}" onclick="GUIA.min()">${ST.min?'▴':'▾'}</button><button class="x" title="Fechar o guia (o progresso fica guardado)" onclick="GUIA.fechar()">×</button></div><div class="bar"><i style="width:${pct}%"></i></div>`;
  if(!p){/* fim do capítulo */
    const prox=CAPS()[ST.cap+1];
    box.innerHTML=hd+`<div class="bd fim"><div class="n">Capítulo ${ST.cap+1} concluído</div><h4>${E(c.titulo)}</h4>${c.aprendeu?`<ul>${c.aprendeu.map(x=>`<li>${E(x)}</li>`).join('')}</ul>`:''}<div class="pq">${E(c.objetivo||'')}</div></div><div class="ft">${prox?`<button class="pri" onclick="GUIA.cap(${ST.cap+1})">Próximo: ${E(prox.titulo)} →</button>`:`<button class="pri" onclick="GUIA.fechar()">Terminei a história</button>`}<button onclick="GUIA.lista()">Capítulos</button></div>`;
    ring.style.display='none';return}
  if(ST.lista){box.innerHTML=hd+`<div class="bd"><div class="n">Escolha onde continuar</div><div class="caps">${CAPS().map((k,i)=>`<button class="${i===ST.cap?'on':''}" onclick="GUIA.cap(${i})">${i+1}. ${E(k.titulo)} <span style="opacity:.6">· ${(k.passos||[]).length} passos</span></button>`).join('')}</div><div class="pq">Os capítulos seguem a ordem da história: cada um começa de onde o anterior terminou.</div></div><div class="ft"><button onclick="GUIA.lista(false)">Voltar ao passo</button></div>`;return}
  const pronto=evalPronto(p);const fx=!pronto&&CF&&CF.corr?CF.corr:null;const q=fx||p;const fora=q.tela&&!sameScreen(q.tela);
  const st=d=>{const r=CHK&&CHK.id===p.id?CHK.rows.find(x=>x.campo===d.campo):null;if(!r||r.ok==null)return {c:'',m:''};if(r.ok)return {c:'ok',m:'✓ '};if(r.vazio&&TENTOU!==p.id)return {c:'',m:''};return {c:'bad',m:'✗ ',a:r.vazio?'está vazio':'agora: “'+r.agora+'”'}};
  const dig=(p.digite||[]).length?`<div class="dig${p.digite.length>6?' muitos':''}">${p.digite.map(d=>{const x=st(d);return `<div class="${x.c}" title="Clique para copiar" onclick="GUIA.copia('${J(d.valor)}')"><span>${x.m}${E(d.campo)}${x.a?`<small>${E(x.a)}</small>`:''}</span><b>${E(d.valor)}</b></div>`}).join('')}</div>`:'';
  const rb=CHK&&CHK.id===p.id&&TENTOU===p.id?ruins(CHK):[];
  const seg=rb.length?`<div class="cf"><b>Ainda não salvei.</b> Acerte o que está em vermelho e clique de novo em “${E((p.alvo&&p.alvo.texto)||'Salvar')}”:<ul>${rb.map(r=>`<li>${E(r.campo)}: ${r.vazio?'está vazio':'está “'+E(r.agora)+'”'} → ${E(esperado((p.digite.find(d=>d.campo===r.campo)||{}).valor)||'')}</li>`).join('')}</ul></div>`:'';
  const cf=!pronto&&CF?`<div class="cf"><b>Já foi salvo, mas ficou diferente do pedido.</b> ${E(CF.msg)}${CF.bot?`<button class="pri" style="margin-top:8px" onclick="GUIA._corrige()">${E(CF.bot.lb)}</button>`:''}${CF.corr?'<div style="margin-top:6px;opacity:.75">“Me mostre onde” leva você até lá.</div>':''}</div>`:'';
  box.innerHTML=hd+`<div class="bd"><div class="n">Passo ${ST.passo+1} de ${c.passos.length}${p.secao?' · '+E(p.secao):''}</div><div class="faca">${E(fx?'Corrija: '+fx.faca:p.faca)}</div>${fora?`<div class="menu">Você está em outra tela. Vá por: <b>${E(q.menu||q.tela)}</b></div>`:(q.menu?`<div class="pq" style="margin-bottom:6px">Tela: ${E(q.menu)}</div>`:'')}${cf}${seg}${dig}<div class="pq"><b>Por quê:</b> ${E(p.porque||'')}</div></div>
   <div class="st ${pronto?'ok':''}"><span class="dot"></span>${pronto?'Feito! Seguindo para o próximo passo…':(CF?'Esperando a correção':'Esperando você fazer este passo')}</div>
   <div class="ft"><button class="pri" onclick="GUIA.mostra()">Me mostre onde</button>${ST.passo>0||ST.cap>0?'<button onclick="GUIA.volta()">← Voltar</button>':''}<button onclick="GUIA.lista()">Capítulos</button></div>`;
}
function anel(){
  if(!ST.on||ST.min||ST.lista||!ring){if(ring)ring.style.display='none';return}
  let p=passo();if(!p){ring.style.display='none';return}
  if(CF&&CF.corr&&!evalPronto(p))p=CF.corr;
  /* e2e fix (29/10): on the wrong screen the learner must use the side menu, which is on the LEFT — the panel (bottom-left)
     covered the lower rail buttons (e.g. "Base de dados"). While the screen is wrong, the panel stays on the right. */
  if(p.tela&&!sameScreen(p.tela)){if(box&&!box.classList.contains('dir'))box.classList.add('dir');
    const c=mostrar?caminho(p.tela):null;if(!c){ring.style.display='none';return}const r=rectDe(c);ring.style.display='';ring.style.left=(r.left-6)+'px';ring.style.top=(r.top-6)+'px';ring.style.width=(r.width+12)+'px';ring.style.height=(r.height+12)+'px';return}
  /* e2e fix (29/10): the panel kept off the target only after "Me mostre onde"; a learner who clicks without asking found the
     button under the panel. Now the panel moves away from the step's target on every tick; the ring still shows only on request. */
  const h=acha(p.alvo);if(!h){ring.style.display='none';return}
  const r=rectDe(h);desvia(r);if(!mostrar){ring.style.display='none';return}
  ring.style.display='';ring.style.left=(r.left-6)+'px';ring.style.top=(r.top-6)+'px';ring.style.width=(r.width+12)+'px';ring.style.height=(r.height+12)+'px'}
/* the panel never covers what the learner must click: if the target sits under it, it moves to the other side */
const cobre=(r,b)=>!(r.left>b.right+8||r.left+r.width<b.left-8||r.top>b.bottom+8||r.top+r.height<b.top-8);
function desvia(r){if(!box||!r||ST.pos)return;if(!cobre(r,box.getBoundingClientRect()))return;const dir=box.classList.contains('dir');box.classList.toggle('dir',!dir);
  /* e2e fix (29/10): a target that sits under BOTH positions made the panel flip on every tick; then it stays where it was */
  if(cobre(r,box.getBoundingClientRect()))box.classList.toggle('dir',dir)}
/* o relógio: confere o passo, anda sozinho quando ficou pronto, segue o alvo na tela */
let ultimo='';
function tick(){if(!ST.on)return;try{const m=document.getElementById('mg-ask');if(m)desvia(m.getBoundingClientRect())}catch(e){}const p=passo();
  guardaFrames();
  if(p){const pr=evalPronto(p);
    try{CF=pr?null:conferePasso(p);if(CF&&CF.corr&&evalPronto(CF.corr))CF.corr=null}catch(e){CF=null}
    try{const h=(p.digite||[]).length&&!pr&&!CF?acha(p.alvo):null;CHK=h?confereCampos(p,h):null}catch(e){CHK=null}
    if(TENTOU&&TENTOU!==p.id)TENTOU=null;contorna();
    if(pr){if(!okDesde){okDesde=Date.now();desenha()}else if(Date.now()-okDesde>1100){okDesde=0;ST.feitos[p.id]=1;ST.passo++;mostrar=false;sv(ST);desenha()}}
    else if(okDesde){okDesde=0;desenha()}
    const sig=ST.cap+'|'+ST.passo+'|'+hashNow()+'|'+pr+'|'+(CF?CF.msg+(CF.corr?1:0):'')+'|'+(TENTOU||'')+'|'+(CHK?CHK.rows.map(r=>r.ok+':'+(r.agora||'')).join(','):'');if(sig!==ultimo){ultimo=sig;desenha()}}
  anel()}
window.GUIA={
  iniciar(i){ST={on:true,cap:i||0,passo:0,min:false,feitos:{},lista:false};sv(ST);mostrar=false;okDesde=0;ultimo='';desenha()},
  continuar(){ST.on=true;ST.lista=false;sv(ST);desenha()},
  fechar(){ST.on=false;sv(ST);desenha()},
  min(){ST.min=!ST.min;sv(ST);desenha()},
  cap(i){ST.cap=i;ST.passo=0;ST.lista=false;sv(ST);mostrar=false;okDesde=0;/* pula os passos que já estão feitos no sistema */const c=cap();while(c&&c.passos[ST.passo]&&evalPronto(c.passos[ST.passo])&&c.passos[ST.passo].pula!==false)ST.passo++;sv(ST);desenha()},
  volta(){if(ST.passo>0)ST.passo--;else if(ST.cap>0){ST.cap--;ST.passo=Math.max(0,(cap().passos||[]).length-1)}mostrar=false;okDesde=0;sv(ST);desenha()},
  lista(v){ST.lista=v!==false;sv(ST);desenha()},
  mostra(){mostrar=true;let p=passo();if(!p)return;if(CF&&CF.corr&&!evalPronto(p))p=CF.corr;if(p.tela&&!sameScreen(p.tela)){const c=caminho(p.tela);if(c){setTimeout(anel,50);try{toast('Primeiro vá para a tela: '+(p.menu||p.tela)+' — o contorno azul mostra por onde.')}catch(e){}}else{try{toast('Primeiro abra a tela: '+(p.menu||p.tela))}catch(e){}}return}const h=acha(p.alvo);if(h){try{h.el.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}setTimeout(anel,350)}else{try{toast(CF?'Este passo já foi salvo — veja no painel o que ficou diferente e como corrigir.':'Não achei o botão nesta tela — confira se você está na tela certa ou role a página.',true)}catch(e){}}},
  _corrige(){try{if(CF&&CF.bot)CF.bot.fn()}catch(e){}},
  _ir(id){CAPS().forEach((c,ci)=>(c.passos||[]).forEach((x,pi)=>{if(x.id===id){ST.on=true;ST.cap=ci;ST.passo=pi;ST.lista=false}}));sv(ST);ultimo='';desenha()},
  _camposDe(id){let p=null;for(const c of CAPS())for(const x of c.passos||[])if(x.id===id)p=x;const h=p&&acha(p.alvo);ESCOPO=null;const c=confereCampos(p,h);return c&&c.rows.map(r=>({campo:r.campo,ok:r.ok,agora:r.agora,tag:r.el&&(r.el.tagName+'#'+r.el.id+'.'+r.el.className)}))},
  _campos(){const p=passo();const h=p&&acha(p.alvo);const c=confereCampos(p,h);return c&&c.rows.map(r=>({campo:r.campo,ok:r.ok,agora:r.agora,bloq:r.bloq}))},
  copia(v){try{navigator.clipboard.writeText(v);toast('Copiado: '+v)}catch(e){}},
  estado:()=>JSON.parse(JSON.stringify(ST)),
  _tick:tick,_acha:acha,_pronto:evalPronto
};
/* Início: "Aprender fazendo" no lugar de "Carregar história demo" */
const BOT='<button class="inicio-more-btn" type="button" style="margin-left:8px" id="guia124-btn" onclick="GUIA.iniciar(0)" title="Monte você mesmo, passo a passo, uma venda inteira — do CRM ao Ret/Troc — com o guia ao lado"><i class="bi bi-mortarboard me-1"></i>Aprender fazendo</button>';
const _home=SCREENS.home;
if(typeof _home==='function')SCREENS.home=function(){let h=_home.apply(this,arguments);if(typeof h!=='string')return h;
  const k=h.match(/<button[^>]*id="demo124-btn"[\s\S]*?<\/button>/);if(k)h=h.replace(k[0],BOT);else if(h.indexOf('guia124-btn')<0){const i=h.indexOf('Começar do zero</button>');if(i>0){const j=i+'Começar do zero</button>'.length;h=h.slice(0,j)+BOT+h.slice(j)}}
  return h};
/* the demo button may also be inserted after render: swap it there too */
setInterval(()=>{try{const b=document.getElementById('demo124-btn');if(b){b.insertAdjacentHTML('afterend',BOT);b.remove()}}catch(e){}},700);
setInterval(tick,400);
window.addEventListener('hashchange',()=>{setTimeout(desenha,50)});
const go=()=>{try{if(ST.on)desenha();if(typeof route==='function'&&route().k==='home')renderMain()}catch(e){}};
if(document.readyState==='complete')go();else window.addEventListener('load',go);
})();
