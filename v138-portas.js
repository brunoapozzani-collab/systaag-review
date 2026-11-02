/* v138 — PORTAS (every figure is a door · macro → micro)
   Rule (Bruno): a number a manager reads on an overview must open the detail it summarises — and land filtered.
   Before this layer ~2.800 figures on painéis, pontes and list rows opened nothing (audit layer 19).
   What it does, after every render, on top of whatever the screen already offers (never replaces an existing door):
   §1 rows  — a list row that has a link opens that link when you click anywhere on the row (the row IS the door);
              a row with no control but a proposal code / fixed-cost label opens the matching list filtered by it.
   §2 figures — a number in a card, a ponte sentence or a total row gets a door: the nearest link in the same block,
              else a destination read from the words around it (caixa → contas, a receber → Receber, CMV → DRE, livre → Estoque…),
              else the card's own link. The destination list opens with its search box already filled (lands filtered).
   §3 V138_go(hash,q) — navigation + "land filtered" (fills the screen's Buscar box, incl. the layer-20 auto search box).
   Nothing here invents numbers: it only connects numbers that already exist to lists that already exist. */
(function(){
'use strict';
if(window.__v138)return;window.__v138=true;
const css=document.createElement('style');css.id='v138-css';css.textContent=`
 tr.v138-row{cursor:pointer}tr.v138-row:hover>td{background:rgba(13,110,253,.06)}
 .v138-door{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;text-decoration-color:rgba(13,110,253,.55)}
 .v138-door:hover{color:#0d6efd}`;document.head.appendChild(css);

/* §3 navigation that lands filtered */
window.__v138_q='';
window.V138_go=function(h,q,ev){try{if(ev){ev.stopPropagation();ev.preventDefault()}}catch(e){}
  window.__v138_q=q||'';const same=(location.hash||'')===h;
  if(same&&!q){/* the list is on this very screen: take the reader to it */const m=document.getElementById('main');const t=m&&[...m.querySelectorAll('table')].find(x=>x.querySelectorAll('tbody tr').length>0);if(t){t.scrollIntoView({behavior:'smooth',block:'start'});t.style.transition='box-shadow .3s';t.style.boxShadow='0 0 0 3px rgba(13,110,253,.35)';setTimeout(()=>t.style.boxShadow='',1200)}return}
  location.hash=h;if(same&&typeof renderMain==='function')renderMain();
  setTimeout(aplicaBusca,60);setTimeout(aplicaBusca,400)};
window.__v138n=0;window.V138_delg=function(n,ev){try{ev.stopPropagation()}catch(e){}const t=document.querySelector(`[data-v138t="${n}"]`);if(t)t.click()};
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
function porPalavras(ctx){const ls=LINHAS();for(const n of ls){if(n&&ctx.includes(n))return ['#/dre/'+encodeURIComponent(n),'']}
  for(const [re,h] of DIC){if(re.test(ctx))return [h,'']}return null}
const FIG=/^(?:.{0,32}?:\s*)?(R\$\s?)?-?[\d.,]*\d%?(\s*(un\.?|m))?$/; /* also "30 dias: R$ 191.567,80" */
const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
const txt=e=>(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim();
const codigo=t=>{let m=t.match(/\b(F-\d{3,}|\d{4})\b(?=.*\b(proposta|parcela|plano)\b)/i)||t.match(/proposta\s+(F-\d{3,}|\d{3,})/i);return m?m[1]:''};

/* §1 rows */
function linhas(m){
  m.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.hasAttribute('onclick')||tr.classList.contains('rowlink')||tr.hasAttribute('data-v138'))return;
    if(tr.closest('form,#__dlg,.modal,.inicio-hero,[data-v130]'))return;
    if(tr.querySelector('input,select,textarea'))return;
    if(!/\d/.test(tr.innerText||''))return;
    tr.setAttribute('data-v138','1');
    const a=tr.querySelector('a[href^="#"]');
    if(a){tr.setAttribute('data-v138-h',a.getAttribute('href'));}
    else{const oc=[...tr.querySelectorAll('[onclick]')].find(e=>e.tagName!=='BUTTON'&&!/excluir|apagar|remover|pagar|baixar|confirmar/i.test(e.innerText||''));
      if(oc){oc.setAttribute('data-v138-t','1');tr.setAttribute('data-v138-del','[data-v138-t]')}
      else{const t=txt(tr);const c=codigo(t);const th=txt(tr.closest('table').querySelector('thead')||document.createElement('x'));
        let dest=null;
        if(c)dest=['#/propostas',c];
        else if(/^fixo\b/i.test(th))dest=['#/despesas',(tr.cells[0]&&txt(tr.cells[0]))||''];
        else if(/parcela|vencimento|t[ií]tulo/i.test(th))dest=['#/receber',(tr.cells[0]&&txt(tr.cells[0]))||''];
        else if(tr.classList.contains('tot')||/^(total|soma|empresa|saldo)/i.test(t)){const ctx=th+' '+t;dest=porPalavras(ctx)}
        if(!dest)return;tr.setAttribute('data-v138-h',dest[0]);tr.setAttribute('data-v138-q',dest[1])}}
    tr.classList.add('v138-row');tr.setAttribute('onclick','V138_row(this,event)');tr.title=tr.title||'Abrir';});}

/* §2 figures outside doors */
function figuras(m){
  m.querySelectorAll('b,span,td,div,strong,em,i,small,p').forEach(e=>{
    if(e.children.length||!vis(e))return;const t0=txt(e);if(!FIG.test(t0))return;const t=t0.replace(/^.{0,32}?:\s*/,'');if(/^(R\$\s?)?-?0([.,]0+)?%?(\s*(un\.?|m))?$/.test(t))return;
    if(e.closest('thead,th,summary,.chip.sub,h1,h2,h3,h4,a[href],[onclick],button,.rowlink,form,#__dlg,.modal,label,.inicio-hero,[data-v130],.pc-cal,.flow .st'))return;
    if(e.closest('#main > div:first-child'))return;
    const card=e.closest('.card')||e.closest('tr')||e.parentElement;
    let dest=null;
    // (a) nearest link in the same block
    let blk=e.parentElement;for(let i=0;i<3&&blk&&blk!==card.parentElement;i++){const a=[...blk.querySelectorAll('a[href^="#"]')].find(x=>!x.closest('button'));if(a){dest=[a.getAttribute('href'),''];break}blk=blk.parentElement}
    // (b) the words around it (row label + column header + sentence)
    if(!dest){let ctx='';const tr=e.closest('tr');if(tr){ctx+=' '+txt(tr.cells[0]||tr);const tb=tr.closest('table');const i=[...tr.children].indexOf(e.closest('td,th'));const th=tb&&tb.tHead&&tb.tHead.rows[0]&&tb.tHead.rows[0].cells[i];if(th)ctx+=' '+txt(th);const cap=tb&&tb.closest('.card');if(cap)ctx+=' '+txt(cap).slice(0,120)}
      let p=e.parentElement;while(p&&p!==card&&txt(p).length<40&&p.parentElement)p=p.parentElement;const full=txt(p||e.parentElement);const at=full.indexOf(t);ctx+=' '+full.slice(Math.max(0,at-90),at+t.length+60);
      dest=porPalavras(ctx)}
    // (c) the card's own link — or its first clickable control (a chip/span that already filters a list)
    if(!dest&&card){const a=card.querySelector('a[href^="#"]');if(a)dest=[a.getAttribute('href'),''];
      else{const oc=[...card.querySelectorAll('[onclick]')].find(x=>x!==e&&!x.contains(e)&&!(x.tagName==='BUTTON'&&/excluir|apagar|remover|salvar|pagar|baixar|confirmar|novo|nova|adicionar/i.test(x.innerText||'')));
        if(oc){const n=oc.getAttribute('data-v138t')||('t'+(++window.__v138n));oc.setAttribute('data-v138t',n);e.classList.add('v138-door');e.setAttribute('onclick',`V138_delg('${n}',event)`);if(!e.title)e.title='Abrir a lista por trás deste número';return}}}
    if(!dest)return;
    e.classList.add('v138-door');e.setAttribute('onclick',`V138_go('${dest[0].replace(/'/g,'')}','${String(dest[1]).replace(/'/g,'')}',event)`);if(!e.title)e.title='Abrir a lista por trás deste número'});}

function portas(){try{const m=document.getElementById('main');if(!m)return;if(/^#\/(home)?$/.test(location.hash||''))return;linhas(m);figuras(m)}catch(e){console.warn('v138',e)}}
window.V138_portas=portas;
try{const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);try{portas();setTimeout(portas,0);aplicaBusca()}catch(e){}return r}}catch(e){}
try{const mo=new MutationObserver(ms=>{if(ms.some(x=>x.addedNodes&&x.addedNodes.length))clearTimeout(window.__v138t),window.__v138t=setTimeout(portas,30)});const start=()=>{const m=document.getElementById('main');if(m)mo.observe(m,{childList:true,subtree:true});else setTimeout(start,300)};start()}catch(e){}
setTimeout(portas,800);
})();
