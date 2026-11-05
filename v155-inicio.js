/* =====================================================================================================
   v155 · INÍCIO limpo (05/11/2026)
   1. "A empresa hoje": os 7 balões de status — o nome numa linha, o status numa pílula embaixo, tudo DENTRO do
      balão; 7 por linha quando cabe, senão 4 + 3, senão 2 por linha.
   2. Auditoria do Início:
      · o HTML da Visão executiva (v149) deixava o .vx-top aberto — os 7 blocos ficavam dentro de uma caixa flex
        (o bloco Projetos saía mais estreito que os outros). Fecha o .vx-top no lugar certo.
      · blocos 5, 6 e 7 (Estoque, Financeiro, Pós-vendas) sem o cartão branco dos blocos 1–4 → mesmo cartão.
      · a faixa vazia de 190 px à direita (reservada para a régua flutuante) some.
      · barras: a trilha de cada linha tinha um comprimento diferente (o texto da direita empurrava) → colunas iguais.
      · a marca "hoje" das barras (traço preto) sumia no modo escuro → clara no escuro.
      · o cartão de território vazio do Estoque ("— —") → cartão tracejado "Outro território · cadastrar em Base › Locais".
      · "Em negociação": o rótulo enorme (20 px) e o fundo branco → rótulo normal.
      · a Ponte do Comercial colada no título "Oportunidades em negociação" → respiro.
   3. "Resumos": a régua flutuante da direita (cobria a tela em janelas estreitas) vira UMA FILA DE ATALHOS logo
      abaixo do "Olá, Bruno" e dos dois botões — ícone + departamento + tela, os mesmos links; quebra em 2 linhas em
      telas estreitas; rola com a página. O botão Escamas vira um botãozinho ao lado de "Aprender fazendo".
   Não mexe em dados, no fundo animado (globo/escamas) nem na marca "taag". Só no Início.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__V155INI)return;window.__V155INI=true;
const T=(fn,d)=>{try{const v=fn();return v==null?d:v}catch(e){console.error('v155 início',e);return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const onInicio=()=>document.documentElement.hasAttribute('data-inicio')||T(()=>typeof isHome==='function'&&isHome(),false);

/* ───────── atalhos (os mesmos da régua v147) ───────── */
const TABS=[
  ['#/crmgestao','bi-people','CRM','Painel de Gestão','#be185d'],
  ['#/gestao','bi-briefcase','Comercial','Gestão','#2a78d6'],
  ['#/copainel','bi-tools','Operação','Painel','#475569'],
  ['#/prjpainel','bi-pencil-square','Projetos','Painel','#b45309'],
  ['#/posvisao','bi-headset','Pós-venda','Visão geral','#ca8a04'],
  ['#/epainel','bi-box-seam','Estoque','Painel Geral','#008300'],
  ['#/fhoje','bi-wallet2','Financeiro','Hoje','#0f766e'],
  ['#/pchome','bi-people-fill','Pessoas','Visão','#7c3aed']
];

/* ───────── CSS ───────── */
const CSS=`
/* a régua flutuante sai; o conteúdo usa a largura toda */
#v147-rail{display:none!important}
@media (min-width:1100px){html[data-inicio] #v130_root.vx{padding-right:26px}}
/* o Escamas fixo some no Início (vira botão na entrada) */
html[data-inicio] #bg-toggle{display:none!important}

/* entrada: saudação + botões + atalhos, juntos no canto de baixo do herói */
.inicio-hero .v155-hb{position:absolute;left:1.4rem;right:114px;bottom:1.4rem;display:flex;flex-direction:column;align-items:stretch;gap:14px;text-align:left;container-type:inline-size;container-name:v155hb;z-index:2}
.inicio-hero .v155-hb .inicio-greet,.inicio-hero .v155-hb .inicio-more{position:static;left:auto;bottom:auto;padding:0}
.inicio-hero .v155-hb .inicio-more{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.inicio-hero .v155-hb .inicio-more .inicio-more-btn{margin:0!important}
.inicio-more-btn.v155-esc{padding:8px 12px}
.inicio-more-btn.v155-esc i{font-size:12px}
.v155-tiles{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;margin:0;padding:0}
@container v155hb (max-width:999px){.v155-tiles{grid-template-columns:repeat(4,minmax(0,1fr))}}
@container v155hb (max-width:520px){.v155-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
.v155-tiles a{display:flex;align-items:center;gap:8px;min-width:0;box-sizing:border-box;padding:10px 10px;border-radius:14px;text-decoration:none;color:var(--tx,#111);
  background:var(--card,rgba(255,255,255,.86));border:1px solid var(--bd,rgba(0,0,0,.08));box-shadow:0 4px 14px rgba(0,0,0,.05);
  backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);transition:transform .12s,box-shadow .12s,background .12s;user-select:none}
.v155-tiles a:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.09);background:var(--card-hover,#f8fafc)}
.v155-tiles a:focus-visible{outline:2px solid #3D5AFE;outline-offset:2px}
.v155-tiles a i{flex:none;width:18px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--dc)}
.v155-tiles a span{display:block;min-width:0;font:700 12.5px/1.2 var(--font-sans,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v155-tiles a small{display:block;font-weight:500;font-size:11px;line-height:1.25;color:var(--mut,#6b7280);white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
:root[data-theme="dark"] .v155-tiles a{box-shadow:0 4px 14px rgba(0,0,0,.35)}
:root[data-theme="dark"] .v155-tiles a i{color:color-mix(in srgb,var(--dc) 55%,#fff)}

/* 1 · os balões de status: nome numa linha, pílula embaixo, nada sai do balão */
.vx .vx149-sem{display:flex!important;flex-wrap:wrap;gap:10px;container-type:inline-size;container-name:v155sem;margin:18px 0 6px}
.vx .vx149-sem>a{box-sizing:border-box;flex:0 0 calc((100% - 60px)/7);min-width:0;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:12px 10px!important;overflow:hidden;text-align:center;transition:box-shadow .12s,transform .12s}
.vx .vx149-sem>a:hover{transform:translateY(-1px);box-shadow:0 0 0 2px rgba(61,90,254,.22)}
@container v155sem (max-width:999px){.vx .vx149-sem>a{flex-basis:calc((100% - 30px)/4)}}
@container v155sem (max-width:560px){.vx .vx149-sem>a{flex-basis:calc((100% - 10px)/2)}}
.vx .vx149-sem>a>b{display:block;max-width:100%;font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vx .vx149-sem>a>span{display:inline-flex!important;align-items:center;gap:6px;max-width:100%;box-sizing:border-box;padding:3px 9px 3px 7px;border-radius:999px;font-size:11px!important;font-weight:600!important;line-height:1.3;opacity:1!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(120,120,128,.14);color:var(--mut,#6b7280)}
.vx .vx149-sem>a>span .vx149-dot{flex:none;width:8px!important;height:8px!important;margin:0!important;cursor:help}
.vx .vx149-sem>a>i.vx149-dot{flex:none}
.vx .vx149-sem>a>span.st-gn{background:rgba(18,161,80,.12);color:#0b7a3b}
.vx .vx149-sem>a>span.st-am{background:rgba(224,164,0,.16);color:#8a6400}
.vx .vx149-sem>a>span.st-rd{background:rgba(208,59,59,.12);color:#b42323}
:root[data-theme="dark"] .vx .vx149-sem>a>span.st-gn{background:rgba(18,161,80,.22);color:#6fe0a0}
:root[data-theme="dark"] .vx .vx149-sem>a>span.st-am{background:rgba(224,164,0,.22);color:#ffd166}
:root[data-theme="dark"] .vx .vx149-sem>a>span.st-rd{background:rgba(208,59,59,.24);color:#ff9b9b}
:root[data-theme="dark"] .vx .vx149-sem>a>span.st-gr{background:rgba(160,160,168,.18);color:#c3c2b7}

/* 2 · blocos: o mesmo cartão para os 7, a mesma largura */
.vx .vx-top:has(>section){display:block}
.vx #v130_s_b5,.vx #v130_s_b6,.vx #v130_s_b7{background:var(--card,#fff);border-radius:28px;padding:30px 32px;box-shadow:0 1px 2px rgba(20,30,60,.05),0 12px 32px rgba(20,30,60,.06);margin-top:24px;min-width:0}
@media(max-width:600px){.vx #v130_s_b5,.vx #v130_s_b6,.vx #v130_s_b7{padding:20px 16px;border-radius:22px;margin-top:16px}}
.vx .vx149 .vx149-h3{margin:30px 0 12px}
/* barras: a trilha começa e termina no mesmo lugar em todas as linhas */
@media(min-width:601px){
 .vx .vx149-bars{display:grid!important;grid-template-columns:minmax(110px,170px) minmax(140px,1fr) auto;column-gap:12px}
 .vx .vx149-bars>.vx149-bar{grid-column:1/-1;grid-template-columns:subgrid!important;gap:0 12px}
}
.vx .vx149-bar .l{min-width:0;overflow-wrap:break-word}
.vx .vx149-bar .r{min-width:0;white-space:normal!important}
/* caixa estreita: rótulo e número na mesma linha, a barra embaixo, de ponta a ponta — nada sai da caixa */
.vx .vx149-box{container-type:inline-size}
@container (max-width:460px){
 .vx .vx149-bars{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;column-gap:10px}
 .vx .vx149-bars>.vx149-bar{grid-column:1/-1;display:grid!important;grid-template-columns:subgrid!important;row-gap:6px!important;padding:8px 0}
 .vx .vx149-bar .l{grid-column:1;grid-row:1}
 .vx .vx149-bar .r{grid-column:2;grid-row:1;text-align:right;white-space:nowrap}
 .vx .vx149-bar .t{grid-column:1/-1;grid-row:2}
}
/* números dos cartões: nunca quebram ("R$" sozinho numa linha) — encolhem com o cartão */
.vx .vx-s .vx-tile{container-type:inline-size}
.vx .vx-s .vx-tile>b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(14px,10.5cqi,21px)}
:root[data-theme="dark"] .vx .vx149-bar .t u,:root[data-theme="dark"] .vx .vx149-mk u{background:#fff}
:root[data-theme="dark"] .vx .vx149-bar.tot .t i{background:#e9e9ee!important}
:root[data-theme="dark"] .vx .vx-s .vx-tile.pos>span,:root[data-theme="dark"] .vx .vx-s .vx-tile.pos>em{color:#5fd18f!important;opacity:1!important}
:root[data-theme="dark"] .vx .vx-s .vx-tile.neg>span,:root[data-theme="dark"] .vx .vx-s .vx-tile.neg>em{color:#ff8f8f!important;opacity:1!important}
:root[data-theme="dark"] .vx .vx-s .vx-tile b.pos{color:#3fcf7f}:root[data-theme="dark"] .vx .vx-s .vx-tile b.neg{color:#ff6b6b}
/* Em negociação: número grande, rótulo normal */
.vx .vx149-box .vx-big{background:transparent!important;padding:6px 0 0!important;cursor:default}
.vx .vx149-box .vx-big b{font-size:40px;line-height:1.05}
.vx .vx149-box .vx-big>span{font-size:13.5px!important;font-weight:600!important;opacity:.75;margin-top:4px}
/* Projetos: o mesmo fundo dos outros blocos (a v130 deixava um cartão cinza a mais em volta) */
.vx #v130_s_b3.vx149.vx-s .rx>.card.card{background:transparent!important;padding:0!important;box-shadow:none!important}
#v130_root{scroll-margin-top:72px}
/* território ainda não cadastrado: um convite, não um buraco */
.vx .vx-tile.v155-ph{background:transparent!important;border:1.5px dashed rgba(120,120,128,.35);display:flex;flex-direction:column;justify-content:center;box-sizing:border-box}
.vx .vx-tile.v155-ph b{font-size:15px!important;color:var(--mut,#6b7280)}
.vx .vx-tile.v155-ph em{color:#3D5AFE;opacity:1!important}
:root[data-theme="dark"] .vx .vx-tile.v155-ph em{color:#8fa2ff}
`;
function css(){if(document.getElementById('v155-inicio-css'))return;const st=document.createElement('style');st.id='v155-inicio-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st)}

/* ───────── fecha o .vx-top que a v149 deixava aberto (só na string do Início) ───────── */
function fixHtml(h){
  if(typeof h!=='string')return h;
  const i0=h.indexOf('<div class="vx-top">');const iCss=h.indexOf('<style id="v149css">',i0);
  if(i0<0||iCss<0)return h;
  /* conta as divs entre o início do .vx-top e o CSS da v149: se sobrar uma aberta, fecha antes do CSS */
  const seg=h.slice(i0,iCss);const ab=(seg.match(/<div\b/g)||[]).length,fe=(seg.match(/<\/div>/g)||[]).length;
  if(ab-fe===1)return h.slice(0,iCss)+'</div>'+h.slice(iCss);
  return h}
function wrapHome(){
  if(typeof SCREENS!=='object'||typeof SCREENS.home!=='function'||SCREENS.home.__v155)return;
  const H=SCREENS.home;
  SCREENS.home=function(){const h=H.apply(this,arguments);return T(()=>fixHtml(h),h)};
  Object.keys(H).forEach(k=>{try{SCREENS.home[k]=H[k]}catch(e){}});SCREENS.home.__v155=true;
}

/* ───────── a régua flutuante sai (e devolve as bolhas de chat ao lugar de sempre) ───────── */
function killRail(){
  const r=document.getElementById('v147-rail');if(r)r.remove();
  ['bg-toggle','um-bubble','taag-chat-bubble'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    ['top','bottom','right','left','transform'].forEach(k=>{if(e.style.getPropertyValue(k))e.style.removeProperty(k)})});
}

/* ───────── Escamas: o botão de sempre (#bg-toggle) comandado de dentro da entrada ───────── */
function escSync(btn){const tg=document.getElementById('bg-toggle');if(!btn)return;
  if(!tg){btn.style.display='none';return}btn.style.display='';
  const ic=document.getElementById('bg-toggle-icon'),lb=document.getElementById('bg-toggle-label');
  const html=`<i class="${E(ic?ic.className:'bi bi-hexagon-fill')}"></i>${E(lb?lb.textContent.trim():'Escamas')}`;
  if(btn.innerHTML!==html)btn.innerHTML=html;const t=tg.getAttribute('title')||'Mudar o fundo';if(btn.title!==t)btn.title=t}

/* ───────── decora a entrada e os blocos depois de cada render ───────── */
function decorate(){
  if(!onInicio())return;
  killRail();
  const hero=document.querySelector('#main .inicio-hero');
  if(hero&&!hero.querySelector('.v155-hb')){
    const greet=hero.querySelector('.inicio-greet'),more=hero.querySelector('.inicio-more');
    if(greet||more){
      const hb=document.createElement('div');hb.className='v155-hb';
      if(greet)hb.appendChild(greet);if(more)hb.appendChild(more);
      if(more&&!more.querySelector('.v155-esc')){const b=document.createElement('button');b.type='button';b.className='inicio-more-btn v155-esc';
        b.onclick=function(e){e.preventDefault();const tg=document.getElementById('bg-toggle');if(tg)tg.click();setTimeout(()=>escSync(b),30);setTimeout(()=>escSync(b),400)};
        more.appendChild(b);escSync(b)}
      const nav=document.createElement('nav');nav.className='v155-tiles';nav.setAttribute('aria-label','Resumo de cada departamento');
      nav.innerHTML=TABS.map(t=>`<a href="${t[0]}" style="--dc:${t[4]}" title="${E(t[2])} › ${E(t[3])}"><i class="bi ${t[1]}"></i><span>${E(t[2])}<small>${E(t[3])}</small></span></a>`).join('');
      hb.appendChild(nav);hero.appendChild(hb);
    }
  }
  if(hero)fitHero(hero);
  /* "Visão executiva ↓" desce até o começo da visão (com os 7 balões), não direto ao bloco 1 */
  T(()=>{const b=hero&&hero.querySelector('.inicio-more-btn[onclick*="V130_sec"]');if(b&&!b.__v155){b.__v155=1;b.setAttribute('onclick',"(function(){var r=document.getElementById('v130_root');if(r)r.scrollIntoView({behavior:'smooth',block:'start'});else if(window.V130_sec)V130_sec('b1')})()")}},null);
  /* balões de status: o ponto entra na pílula do status */
  document.querySelectorAll('#v130_root .vx149-sem>a').forEach(a=>{const dot=a.querySelector(':scope>i.vx149-dot'),sp=a.querySelector(':scope>span');
    if(!sp)return;const cls=(dot||sp.querySelector('.vx149-dot')||{className:''}).className.match(/\b(gn|am|rd|gr)\b/);
    if(dot)sp.insertBefore(dot,sp.firstChild);
    const want='st-'+(cls?cls[1]:'gr');if(!sp.classList.contains(want)){sp.classList.remove('st-gn','st-am','st-rd','st-gr');sp.classList.add(want)}
    const nm=(a.querySelector(':scope>b')||{}).textContent||'';const st=(sp.textContent||'').trim();if(nm&&st)a.setAttribute('aria-label',nm+': '+st)});
  /* Estoque: território ainda não cadastrado */
  document.querySelectorAll('#v130_s_b5 .vx-tile[onclick*="#/dblocais"]').forEach(t=>{if(t.classList.contains('v155-ph'))return;
    const b=t.querySelector('b');if(!b||b.textContent.trim()!=='—')return;t.classList.add('v155-ph');t.title='Cadastrar um território em Base › Locais';
    t.innerHTML='<b>Outro território</b><em>cadastrar em Base › Locais ›</em>'});
}
/* o herói tem a altura da janela; se a janela for baixa demais, cresce o suficiente para a marca não encostar nos atalhos */
function fitHero(hero){T(()=>{const hb=hero.querySelector('.v155-hb'),logo=hero.querySelector('.inicio-logo');if(!hb||!logo)return;
  const need=Math.ceil((logo.offsetHeight||0)+2*(hb.offsetHeight+22)+40);const cur=parseFloat(hero.style.minHeight)||0;
  if(Math.abs(cur-need)>2)hero.style.minHeight=need+'px'},null)}

let q=0;const later=()=>{if(q)return;q=1;requestAnimationFrame(()=>{q=0;T(decorate,null)})};
function start(){
  css();wrapHome();killRail();
  const skip=n=>{const e=n&&n.nodeType===1?n:n&&n.parentElement;return !!(e&&e.closest&&e.closest('#inicio-stage,#hbs-wrap,#bgCanvas,#taag-chat-window,#um-win'))};
  new MutationObserver(muts=>{for(const m of muts){if(m.type==='childList'&&!skip(m.target)){later();return}}}).observe(document.body,{childList:true,subtree:true});
  /* o Escamas de verdade muda de rótulo quando o fundo troca */
  const syncAll=()=>document.querySelectorAll('.v155-esc').forEach(escSync);
  const tg=document.getElementById('bg-toggle');if(tg)new MutationObserver(syncAll).observe(tg,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title']});
  window.addEventListener('resize',()=>{later();setTimeout(later,120)});
  window.addEventListener('hashchange',()=>{setTimeout(later,0);setTimeout(later,60);setTimeout(killRail,500)});
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['data-inicio','data-theme','data-bg']});
  /* re-renderiza o Início uma vez para a correção do HTML valer já */
  T(()=>{if(onInicio()&&document.getElementById('v130_root')){if(typeof renderMain==='function')renderMain();else if(typeof render==='function')render()}},null);
  later();setTimeout(later,300);setTimeout(later,1500);
}
try{if(document.body)start();else document.addEventListener('DOMContentLoaded',start)}catch(e){console.error('v155 início',e)}
})();
