/* v138 — PORTAS (every figure is a door · macro → micro)
   Rule (Bruno): a number a manager reads on an overview must open the detail it summarises — and land filtered.
   Before this layer ~2.800 figures on painéis, pontes and list rows opened nothing (audit layer 19).
   What it does, after every render, on top of whatever the screen already offers (never replaces an existing door):
   §1 rows  — a list row that has a link opens that link when you click anywhere on the row (the row IS the door);
              a row with no control but a proposal code / fixed-cost label opens the matching list filtered by it.
   §2 figures — a number in a card, a ponte sentence or a total row gets a door: the nearest link in the same block,
              else a destination read from the words around it (caixa → contas, a receber → Receber, CMV → DRE, livre → Estoque…),
              else the card's own link or its first filter chip. The destination list opens with its search box already filled.
   §3 V138_go(hash,q) — navigation + "land filtered" (fills the screen's Buscar box, incl. the layer-20 auto search box);
              when the list is on the same screen, it scrolls to it instead.
   Performance: one read phase (textContent, DOM only), one layout read, then one write phase — no layout thrash on 300-row ledgers.
   Nothing here invents numbers: it only connects numbers that already exist to lists that already exist. */
(function(){
'use strict';
if(window.__v138)return;window.__v138=true;
const css=document.createElement('style');css.id='v138-css';css.textContent=`
 tr.v138-row{cursor:pointer}tr.v138-row:hover>td{background:rgba(13,110,253,.06)}
 .v138-door{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;text-decoration-color:rgba(13,110,253,.55)}
 .v138-door:hover{color:#0d6efd}`;document.head.appendChild(css);

/* §3 navigation that lands filtered */
window.__v138_q='';window.__v138n=0;
window.V138_go=function(h,q,ev){try{if(ev){ev.stopPropagation();ev.preventDefault()}}catch(e){}
  window.__v138_q=q||'';const same=(location.hash||'')===h;
  if(same&&!q){/* the list is on this very screen: take the reader to it */const m=document.getElementById('main');const t=m&&[...m.querySelectorAll('table')].find(x=>x.querySelector('tbody tr'));if(t){t.scrollIntoView({behavior:'smooth',block:'start'});t.style.transition='box-shadow .3s';t.style.boxShadow='0 0 0 3px rgba(13,110,253,.35)';setTimeout(()=>t.style.boxShadow='',1200)}return}
  location.hash=h;if(same&&typeof renderMain==='function')renderMain();
  setTimeout(aplicaBusca,60);setTimeout(aplicaBusca,400)};
window.V138_delg=function(n,ev){try{ev.stopPropagation()}catch(e){}const t=document.querySelector(`[data-v138t="${n}"]`);if(t)t.click()};
window.V138_row=function(tr,ev){const t=ev&&ev.target;if(t&&t.closest&&(t.closest('a,button,input,select,label,textarea,summary')||(t.closest('[onclick]')&&t.closest('[onclick]')!==tr)))return;
  const h=tr.getAttribute('data-v138-h'),q=tr.getAttribute('data-v138-q')||'',d=tr.getAttribute('data-v138-del');
  if(d){const el=tr.querySelector(d);if(el){el.click();return}}
  if(h)V138_go(h,q,ev)};
function aplicaBusca(){const q=window.__v138_q;if(!q)return;const m=document.getElementById('main');if(!m)return;
  const inp=[...m.querySelectorAll('input')].find(i=>!i.closest('tbody')&&i.offsetWidth>0&&/buscar|filtr|pesquis|procurar/i.test(i.placeholder||''));
  if(!inp)return;window.__v138_q='';inp.value=q;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('keyup',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}

/* destinations read from the words around a figure (pt-BR) */
const DIC=[
 [/\bsem(ana|\.)\s*\d|realizado|lan[çc]amento|transfer[êe]ncia|por filial/i,'#/finlanc'],
 [/chamado|atendimento/i,'#/chamados'],
 [/pend[êe]ncia|documento|f[ée]rias|lembrete|admiss|desligad/i,'#/colaboradores'],
 [/pap[ée]is|perfil|permiss/i,'#/dbpessoas/papeis'],
 [/\brt\b|remunera|liberad/i,'#/remuneracao'],
 [/\bos\b|ordem de servi/i,'#/fpvos'],
 [/manuten|limpeza|reposi[çc][ãa]o de insumo|toner/i,'#/fcmanut'],
 [/servi[çc]o|estrutural|programa[çc][ãa]o|projeto\b/i,'#/dbservicos'],
 [/\bcaixa\b|saldo|hoje\b|conta/i,'#/fcontas'],
 [/a receber|receb|entradas?\b|parcela|sinal|em aberto|vencid|atrasad|cobran/i,'#/receber'],
 [/a pagar|pagar|sa[ií]das?\b|t[ií]tulos?|comprometid|compromisso|fornecedor/i,'#/pagar'],
 [/receita|dedu|cmv|diretos|vari[áa]veis|fixas|financeiro|resultado|lucro|margem|contrib|despesa/i,'#/dre'],
 [/m[ãa]o de obra|di[áa]ria/i,'#/fpvconc'],
 [/comiss/i,'#/comissoes'],
 [/\bnf\b|notas?\b|ncm|cst|itens/i,'#/nf'],
 [/a comprar|comprad|cota[çc]|compra/i,'#/cotacoes'],
 [/separad/i,'#/separacao'],
 [/no cliente|entregue/i,'#/saidas'],
 [/livre|estoque|unidade|invent|sobra/i,'#/estoque'],
 [/proposta|vendid|venda|pipeline|prospec/i,'#/propostas'],
 [/\bobras?\b/i,'#/obras'],
 [/cliente/i,'#/dbclientes'],
 [/pessoa|colaborador|equipe|folha|sal[áa]rio/i,'#/dbpessoas'],
 [/produto|modelo|equipamento/i,'#/dbprodutos']];
const LINHAS=()=>{try{const f=(S.db.listas&&S.db.listas.frentes)||[];const xs=f.filter(x=>x&&x.venda!==false&&x.k!=='corporativo').map(x=>x.v).filter(Boolean);return xs.length?xs:['TAAG','Acústica','Focal','Pós-venda']}catch(e){return ['TAAG','Acústica','Focal','Pós-venda']}};
function porPalavras(ctx,ls){for(const n of ls){if(n&&ctx.includes(n))return ['#/dre/'+encodeURIComponent(n),'']}
  for(const [re,h] of DIC){if(re.test(ctx))return [h,'']}return null}
const FIG=/^(?:.{0,32}?:\s*)?(R\$\s?)?-?[\d.,]*\d%?(\s*(un\.?|m))?$/; /* also "30 dias: R$ 191.567,80" */
const ZERO=/^(R\$\s?)?-?0([.,]0+)?%?(\s*(un\.?|m))?$/;
const tc=e=>(e&&e.textContent||'').replace(/\s+/g,' ').trim(); /* textContent: no layout */
const codigo=t=>{let m=t.match(/\b(F-\d{3,}|\d{4})\b(?=.*\b(proposta|parcela|plano)\b)/i)||t.match(/proposta\s+(F-\d{3,}|\d{3,})/i);return m?m[1]:''};
const SKIP_UP='thead,th,summary,.chip.sub,h1,h2,h3,h4,a[href],[onclick],button,.rowlink,form,#__dlg,.modal,label,.inicio-hero,[data-v130],.pc-cal,.flow .st';

/* §1 rows — read phase, then write phase */
function linhas(m,ls){
  const W=[];
  m.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.hasAttribute('onclick')||tr.classList.contains('rowlink')||tr.hasAttribute('data-v138'))return;
    if(tr.closest('form,#__dlg,.modal,.inicio-hero,[data-v130]'))return;
    if(tr.querySelector('input,select,textarea'))return;
    const t=tc(tr);if(!/\d/.test(t))return;
    const a=tr.querySelector('a[href^="#"]');
    if(a){W.push([tr,{h:a.getAttribute('href'),q:''}]);return}
    const oc=[...tr.querySelectorAll('[onclick]')].find(e=>e.tagName!=='BUTTON'&&!/excluir|apagar|remover|pagar|baixar|confirmar/i.test(e.textContent||''));
    if(oc){W.push([tr,{del:oc}]);return}
    const c=codigo(t);const tb=tr.closest('table');const th=tc(tb&&tb.tHead);
    let dest=null;
    if(c)dest=['#/propostas',c];
    else if(/^fixo\b/i.test(th))dest=['#/despesas',tc(tr.cells[0])];
    else if(/parcela|vencimento|t[ií]tulo/i.test(th))dest=['#/receber',tc(tr.cells[0])];
    else if(tr.classList.contains('tot')||/^(total|soma|empresa|saldo)/i.test(t))dest=porPalavras(th+' '+t,ls);
    if(dest)W.push([tr,{h:dest[0],q:dest[1]}])});
  W.forEach(([tr,d])=>{tr.setAttribute('data-v138','1');if(d.del){d.del.setAttribute('data-v138-t','1');tr.setAttribute('data-v138-del','[data-v138-t]')}else{tr.setAttribute('data-v138-h',d.h);tr.setAttribute('data-v138-q',d.q||'')}
    tr.classList.add('v138-row');tr.setAttribute('onclick','V138_row(this,event)');if(!tr.title)tr.title='Abrir'});
  return W.length}

/* §2 figures outside doors — read phase (DOM only), one layout read, write phase */
function figuras(m,ls){
  const cand=[];
  m.querySelectorAll('b,span,td,div,strong,em,i,small,p').forEach(e=>{
    if(e.children.length||e.hasAttribute('data-v138f'))return;const t0=tc(e);if(!t0||t0.length>48||!FIG.test(t0))return;const t=t0.replace(/^.{0,32}?:\s*/,'');if(ZERO.test(t))return;
    if(e.closest(SKIP_UP)||e.closest('#main > div:first-child'))return;
    cand.push([e,t])});
  if(!cand.length)return 0;
  const vis=cand.filter(([e])=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}); /* one layout for all */
  const W=[];
  vis.forEach(([e,t])=>{
    const card=e.closest('.card')||e.closest('tr')||e.parentElement;
    let dest=null;
    let blk=e.parentElement;for(let i=0;i<3&&blk&&card&&blk!==card.parentElement;i++){const a=[...blk.querySelectorAll('a[href^="#"]')].find(x=>!x.closest('button'));if(a){dest=[a.getAttribute('href'),''];break}blk=blk.parentElement}
    if(!dest){let ctx='';const tr=e.closest('tr');if(tr){ctx+=' '+tc(tr.cells[0]||tr);const tb=tr.closest('table');const i=[...tr.children].indexOf(e.closest('td,th'));const th=tb&&tb.tHead&&tb.tHead.rows[0]&&tb.tHead.rows[0].cells[i];if(th)ctx+=' '+tc(th);const cap=tb&&tb.closest('.card');if(cap){const fc=cap.firstElementChild;ctx+=' '+tc(fc&&fc!==tb.parentElement?fc:null).slice(0,120)}}
      let p=e.parentElement;while(p&&p!==card&&tc(p).length<40&&p.parentElement)p=p.parentElement;const full=tc(p||e.parentElement);const at=full.indexOf(t);ctx+=' '+full.slice(Math.max(0,at-90),at+t.length+60);
      dest=porPalavras(ctx,ls)}
    if(!dest&&card){const a=card.querySelector('a[href^="#"]');if(a)dest=[a.getAttribute('href'),''];
      else{const oc=[...card.querySelectorAll('[onclick]')].find(x=>x!==e&&!x.contains(e)&&!(x.tagName==='BUTTON'&&/excluir|apagar|remover|salvar|pagar|baixar|confirmar|novo|nova|adicionar/i.test(x.textContent||'')));
        if(oc){W.push([e,{del:oc}]);return}}}
    if(dest)W.push([e,{h:dest[0],q:dest[1]}])});
  W.forEach(([e,d])=>{e.setAttribute('data-v138f','1');e.classList.add('v138-door');if(!e.title)e.title='Abrir a lista por trás deste número';
    if(d.del){const n=d.del.getAttribute('data-v138t')||('t'+(++window.__v138n));d.del.setAttribute('data-v138t',n);e.setAttribute('onclick',`V138_delg('${n}',event)`)}
    else e.setAttribute('onclick',`V138_go('${d.h.replace(/'/g,'')}','${String(d.q).replace(/'/g,'')}',event)`)});
  return W.length}

/* §4 every list can be filtered — also lists made of cards (.rowlink) and the Painel Geral, which the layer-20 box skipped */
function busca(m){try{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
  if(m.querySelector('[data-v138-busca]'))return;
  const has=[...m.querySelectorAll('input,select')].filter(e=>vis(e)&&!e.closest('tbody')).some(e=>e.tagName==='INPUT'?/buscar|filtr|pesquis/i.test(e.placeholder||''):/^(todos|todas|marca|categoria|fornecedor|estado|status|invent|lugar|disponib|cobertura|fase|cliente|obra|motivo|tipo|per[ií]odo)/i.test((e.options[0]||{}).text||''));if(has)return;
  const tabs=[...m.querySelectorAll('table')].filter(t=>vis(t)&&!t.classList.contains('no-filter')&&t.querySelectorAll('tbody tr').length>=3).sort((a,b)=>b.rows.length-a.rows.length);
  const links=[...m.querySelectorAll('.rowlink')].filter(vis);
  let items,anchor;if(tabs.length){items=[...tabs[0].querySelectorAll('tbody tr')];anchor=tabs[0].closest('.tblwrap')||tabs[0]}else if(links.length>=5){items=links;anchor=links[0].closest('.card,.list,.col-12,.row')||links[0]}else return;
  const box=document.createElement('div');box.className='d-flex gap-2 align-items-center mb-2';box.setAttribute('data-v138-busca','1');box.innerHTML='<input class="form-control form-control-sm" style="max-width:280px" placeholder="Buscar nesta lista…"><span class="sub" style="font-size:12px"></span>';
  const inp=box.querySelector('input'),cnt=box.querySelector('span');const nz=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  inp.addEventListener('input',()=>{const q=nz(inp.value).trim();let n=0;items.forEach(r=>{const ok=!q||nz(r.textContent).includes(q);r.style.setProperty('display',ok?'':'none','important');if(ok)n++});cnt.textContent=q?`${n} de ${items.length}`:''});
  anchor.parentElement.insertBefore(box,anchor)}catch(e){}}

let busy=false;
function portas(){if(busy||window.__v138_off)return;busy=true;try{const m=document.getElementById('main');if(!m)return;if(/^#\/(home)?$/.test(location.hash||''))return;const ls=LINHAS();linhas(m,ls);figuras(m,ls);busca(m)}catch(e){console.warn('v138',e)}finally{busy=false}}
window.V138_portas=portas;
try{const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);try{portas();aplicaBusca()}catch(e){}return r}}catch(e){}
try{const mo=new MutationObserver(ms=>{if(busy)return;if(ms.some(x=>x.addedNodes&&x.addedNodes.length)){clearTimeout(window.__v138t);window.__v138t=setTimeout(portas,80)}});const start=()=>{const m=document.getElementById('main');if(m)mo.observe(m,{childList:true,subtree:true});else setTimeout(start,300)};start()}catch(e){}
setTimeout(portas,800);
})();
