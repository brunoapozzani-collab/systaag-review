/* =====================================================================================================
   v190 · ESTOQUE › a tabela "O QUE TEMOS · EM QUE SITUAÇÃO · EM QUAL LUGAR" (Bruno, 18/11/2026)
   O que estava errado: tocar num número (ex.: Livre × Focal = 171) mandava para o Início — a rota #/sit mostrava
   "Abrindo…" com o texto de tela em construção, e a regra da v123 ("tela que não existe → tela mais próxima")
   jogava para #/home logo depois. Quando não ia para o Início, a página voltava para o topo e a lista ficava lá embaixo.
   Agora: o número fica no Estoque, liga os filtros da lista de produtos (situação + lugar) e DESCE até a lista,
   que mostra exatamente as unidades daquele número. Os cabeçalhos (Inventário SP, Focal…) continuam abrindo o lugar.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v190)return;window.__v190=true;
const txt=el=>el?String(el.textContent||'').replace(/\s+/g,' ').trim():'';
const SK={'livre':'livre','separado':'alocado','alocado':'alocado','não à venda · de terceiro':'terceiro','não à venda · da empresa':'empresa'};
const nomeNo=id=>{try{const p=L.path(id);return (p[1]||p[p.length-1]||{}).nome||null}catch(e){return null}};
function matriz(){const m=document.getElementById('main');if(!m)return null;
  return [...m.querySelectorAll('.card')].find(c=>/^O QUE TEMOS/i.test(txt(c.querySelector('.sub'))))||null}
function descer(){let n=0;const go=()=>{const el=document.getElementById('estLista');if(el){try{el.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){el.scrollIntoView()}}else if(n++<10)setTimeout(go,60)};setTimeout(go,30)}
function aplicar(sit,lugar){
  S.estCat=null;S.estSit=sit||null;
  S.plF=Object.assign({},S.plF||{});S.plF.est=lugar?{lugar}:{};
  renderMain();descer()}
document.addEventListener('click',function(e){
  if((location.hash||'').split('?')[0]!=='#/estoque')return;
  const card=matriz();if(!card||!card.contains(e.target))return;
  const tbl=card.querySelector('table');if(!tbl||!tbl.contains(e.target))return;
  const td=e.target.closest('td');if(!td||!td.closest('tbody'))return;   /* cabeçalhos: seguem abrindo o lugar */
  const tr=td.closest('tr');const cells=[...tr.children];const i=cells.indexOf(td);if(i<1)return;
  const a=td.querySelector('a[href^="#/sit/"]');
  const hdr=[...tbl.querySelectorAll('thead tr')].pop();const heads=hdr?[...hdr.children]:[];
  const ultima=i===cells.length-1;
  let sit=null,lugar=null;
  if(a){const p=a.getAttribute('href').replace(/^#\/sit\//,'').split('/');sit=p[0];lugar=nomeNo(p[1])}
  else{
    const rot=txt(tr.querySelector('td b')).toLowerCase();
    if(SK[rot])sit=SK[rot];
    else if(!/^total no lugar/i.test(txt(cells[0])))return;
    if(!ultima){const h=heads[i]&&heads[i].querySelector('a[href^="#/lugar/"]');if(h){lugar=decodeURIComponent(h.getAttribute('href').split('/').pop())}}
  }
  if(!/^\d/.test(txt(td)))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  aplicar(sit,lugar)},true);
/* as bolinhas (<a href="#/sit/…">) eram capturadas por camadas antigas antes deste clique: perdem o href e ganham o mesmo comportamento */
function desarmar(){if((location.hash||'').split('?')[0]!=='#/estoque')return;const card=matriz();if(!card)return;
  card.querySelectorAll('tbody a[href^="#/sit/"]').forEach(a=>{const p=a.getAttribute('href').replace(/^#\/sit\//,'').split('/');
    a.setAttribute('data-v190',p[0]+'|'+(p[1]||''));a.removeAttribute('href');a.style.cursor='pointer';
    a.onclick=function(ev){ev.preventDefault();ev.stopPropagation();aplicar(p[0],nomeNo(p[1]))}})}
const mo=new MutationObserver(()=>desarmar());
const liga=()=>{const m=document.getElementById('main');if(m){mo.observe(m,{childList:true,subtree:true});desarmar()}else setTimeout(liga,200)};liga();
window.addEventListener('hashchange',()=>setTimeout(desarmar,0));
})();
