/* v170 · Comercial › Gestão com a mesma cara em toda a tela (Bruno, 09-Nov-2026)
   Bruno: "metade da página é bonita (os donuts dos consultores) e a outra metade — o topo — não tem desenho, não tem
   efeito nos números". Esta camada NÃO calcula nada de novo: ela pega a tela que as camadas anteriores já montaram
   (v146, v156, v158, v161, v161e, v162, v169) e só muda a FORMA — os mesmos números, os mesmos links (cada <a>/<u> é
   reaproveitado, com o seu onclick), agora em cartões com anel (donut), número grande e animação de entrada.
   Regras do Bruno que esta camada cumpre:
   · 09/11: o 312 (obras da Operação, com as concluídas) sai da frente — o que importa é o trabalho que AINDA falta:
     em andamento + on hold + assistência técnica; concluídas/canceladas ficam em segundo plano, com a conta inteira
     (486 na Base) escondida atrás de "ver a conta completa" — os números continuam batendo na tela (09/09).
   · 09/11: a faixa "✉ 37 propostas enviadas já estão no sistema…" (v169) sai — ocupava espaço sem dizer nada.
   · separadores pt-BR, um clique leva à lista já filtrada (reaproveitando os links que já existiam). */
(function(){'use strict';
const T=(f,d)=>{try{return f()}catch(e){return d}};
const N0=v=>(+v||0).toLocaleString('pt-BR');
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* lê "R$ 15.324.668", "46,4%", "1.234" → número */
const num=s=>{const m=String(s||'').replace(/\s/g,'').match(/-?[\d.]+(,\d+)?/);if(!m)return NaN;return +m[0].replace(/\./g,'').replace(',','.')};
const pct1=v=>(Math.round(v*10)/10).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';

const CSS=`
@property --g170v{syntax:'<number>';inherits:false;initial-value:0}
.g170-ring{flex:none;display:block}
.g170-ring circle.seg{fill:none;stroke-width:12;stroke-linecap:butt;transform:rotate(-90deg);transform-origin:50% 50%;
  stroke-dasharray:var(--g170v) calc(100 - var(--g170v));animation:g170in .9s cubic-bezier(.2,.7,.2,1) both}
.g170-ring circle.trk{fill:none;stroke:rgba(127,127,127,.16);stroke-width:12}
.g170-ring text{font-weight:800;fill:currentColor}
@keyframes g170in{from{--g170v:0}}
@media (prefers-reduced-motion:reduce){.g170-ring circle.seg{animation:none}}
.g170-kpi{position:relative;overflow:hidden}
.g170-kpi .g170-kin{display:flex;align-items:center;justify-content:space-between;gap:10px}
.g170-kpi .g170-kin>div:first-child{min-width:0}
.g170-kpi .g170-ring{width:58px;height:58px;margin:-2px -2px -2px 0}
.g170-kpi .g170-kval{font-size:22px!important;white-space:nowrap;letter-spacing:-.01em}
.g170-hero{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.g170-hero .g170-ring{width:112px;height:112px}
.g170-big{font-size:34px;font-weight:800;line-height:1;letter-spacing:-.01em}
.g170-big a,.g170-big u{text-decoration:none!important;color:inherit}
.g170-big a:hover,.g170-big u:hover{text-decoration:underline dotted!important}
.g170-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.g170-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;background:var(--card-subtle,rgba(127,127,127,.08));border:1px solid var(--bd,rgba(127,127,127,.2));font-size:12.5px;cursor:pointer;line-height:1.2}
.g170-chip i{width:9px;height:9px;border-radius:3px;display:inline-block;flex:none}
.g170-chip b{font-size:13.5px}
.g170-chip a,.g170-chip u{text-decoration:none!important;color:inherit!important}
.g170-chip:hover{border-color:var(--bd-focus,#0071e3)}
.g170-chip.mut{opacity:.72}
.g170-eq{font-size:12px;color:var(--mut,#9aa);margin-top:8px}
.g170-eq a,.g170-eq u{color:inherit}
.g170-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:10px;margin-top:12px}
.g170-line{border:1px solid var(--bd,rgba(127,127,127,.2));border-radius:12px;padding:12px 12px 10px;background:var(--card-subtle,rgba(127,127,127,.05));display:flex;flex-direction:column;gap:6px;min-width:0}
.g170-line .g170-ring{width:76px;height:76px;align-self:center}
.g170-line .nm{font-size:12px;font-weight:700;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g170-line .nm a{color:inherit;text-decoration:none}.g170-line .nm a:hover{text-decoration:underline dotted}
.g170-line .vl{font-size:15px;font-weight:800;line-height:1.1}
.g170-line .mt{font-size:11px;color:var(--mut,#9aa)}
.g170-line .pr a{font-size:11.5px}
.g170-more{font-size:12px;margin-top:10px}
.g170-more summary{cursor:pointer;color:var(--mut,#9aa);list-style:none;display:inline-flex;align-items:center;gap:6px}
.g170-more summary::-webkit-details-marker{display:none}
.g170-more summary::before{content:'▸';font-size:11px}
.g170-more[open] summary::before{content:'▾'}
.g170-more>div{margin-top:6px}
.g170-num{font-variant-numeric:tabular-nums}
.g170-top{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px}
.g170-lbl{font-size:12px;letter-spacing:.06em;font-weight:700}
.g170-sub{font-size:11.5px;color:var(--mut,#9aa)}
`;
function css(){if(document.getElementById('g170-css'))return;const s=document.createElement('style');s.id='g170-css';s.textContent=CSS;document.head.appendChild(s)}

/* anel: partes [{v,c,l}] · centro = texto (o número grande vem de fora, quando o anel é pequeno) */
function ring(parts,center,opt){opt=opt||{};const tot=parts.reduce((a,p)=>a+(+p.v>0?+p.v:0),0)||1;let off=0;let i=0;
  const segs=parts.filter(p=>+p.v>0).map(p=>{const v=p.v/tot*100;const s=`<circle class="seg" cx="50" cy="50" r="40" pathLength="100" stroke="${p.c}" style="--g170v:${v.toFixed(3)};stroke-dashoffset:${(-off).toFixed(3)};animation-delay:${(i++*60)}ms"><title>${E(p.l||'')}: ${N0(p.v)}</title></circle>`;off+=v;return s}).join('');
  const fs=opt.fs||(String(center).length>4?15:String(center).length>3?18:22);
  return `<svg class="g170-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="40"/>${segs}${center!=null?`<text x="50" y="50" dy=".36em" text-anchor="middle" font-size="${fs}">${E(center)}</text>`:''}</svg>`}
const chip=(inner,color,mut)=>`<span class="g170-chip${mut?' mut':''}"><i style="background:${color}"></i>${inner}</span>`;
/* o link original (com onclick, data-v158…) vira o conteúdo do chip — um clique leva à lista já filtrada */
const wrapLink=(el,color,mut)=>{if(!el)return '';const c=el.cloneNode(true);c.removeAttribute('style');return chip(c.outerHTML,color,mut)};
const findText=(root,sel,re)=>Array.from(root.querySelectorAll(sel)).find(a=>re.test(a.textContent));

/* ───────── 1) KPIs do topo ───────── */
function kpis(doc){const h5=Array.from(doc.querySelectorAll('h5')).find(h=>/^Visão Geral/.test(h.textContent.trim()));if(!h5)return;
  const row=h5.nextElementSibling;if(!row||!row.classList.contains('row'))return;
  row.querySelectorAll(':scope>div>.card').forEach(card=>{if(card.classList.contains('g170-kpi'))return;const kids=Array.from(card.children);if(kids.length<2)return;
    const lbl=kids[0],val=kids[1],sub=kids[2];const L=lbl.textContent.replace(/\s+/g,' ').trim();let r='';
    if(/VENDIDO/.test(L)){const p=num(sub&&sub.textContent);if(isFinite(p))r=ring([{v:p,c:'#198754',l:'realizado'},{v:Math.max(0,100-p),c:'rgba(127,127,127,.18)',l:'falta'}],pct1(p),{fs:17})}
    else if(/CONVERS/.test(L)){const g=num((findText(sub,'a',/ganhas/)||{}).textContent),pd=num((findText(sub,'a',/perdidas/)||{}).textContent);if(isFinite(g)&&isFinite(pd))r=ring([{v:g,c:'#198754',l:'ganhas'},{v:pd,c:'#dc3545',l:'perdidas'}],null)}
    else if(/^.?\s*OBRAS/.test(L)){/* 09/11: o trabalho que ainda falta, não o total com as concluídas */
      const o=T(()=>window.V161D.obras());if(o){const and=o.and.length,hold=o.hold.length,at=o.at.length,ativ=and+hold+at;
        lbl.innerHTML=`<span class="chip" style="font-size:9px">▣</span> OBRAS EM TRABALHO`;
        const a=val.querySelector('a');const on=a?a.getAttribute('onclick'):"event.stopPropagation();location.hash='#/copainel'";
        val.innerHTML=`<a href="javascript:void 0" class="vx-door g170-num" title="Operação › Painel: o que ainda está em trabalho" onclick="${E(on)}">${N0(ativ)}</a>`;
        if(sub)sub.innerHTML=`<a href="javascript:void 0" onclick="event.stopPropagation();COP.ope.go('obras',{situacao:'Em andamento'},'#/obras')">${N0(and)} em andamento</a> · <a href="javascript:void 0" onclick="event.stopPropagation();COP.ope.go('obras',{situacao:'On hold'},'#/obras')">${N0(hold)} on hold</a> · <a href="javascript:void 0" onclick="event.stopPropagation();COP.ope.go('obras',{situacao:'Assistência técnica'},'#/obras')">${N0(at)} assist. técnica</a>`;
        r=ring([{v:and,c:'#6f42c1',l:'em andamento'},{v:hold,c:'#b197fc',l:'on hold'},{v:at,c:'#0dcaf0',l:'assistência técnica'}],null)}}
    else if(/NEGOCIA/.test(L))r=ring([{v:1,c:'#0d6efd',l:'negociações'}],null);
    else r=ring([{v:1,c:'#20c997',l:''}],null);
    val.classList.add('g170-num','g170-kval');card.classList.add('g170-kpi');
    const left=document.createElement('div');left.append(lbl,val);if(sub)left.append(sub);
    card.innerHTML=`<div class="g170-kin"></div>`;card.firstChild.append(left);if(r)card.firstChild.insertAdjacentHTML('beforeend',r)})}

/* ───────── 2) Propostas vendidas do ano — a meta por linha vira cartões com anel ───────── */
function vendidas(doc){const card=doc.querySelector('#v146-propostas');if(!card||card.dataset.g170)return;card.dataset.g170='1';
  const rows=Array.from(card.querySelectorAll('table tbody tr'));if(!rows.length)return;
  const head=card.children[0];const heroLine=card.children[1];const ponte=card.children[2];const tbl=card.querySelector('table');const after=tbl?tbl.nextElementSibling:null;
  const total=heroLine?heroLine.querySelector('b a'):null;const valor=heroLine?findText(heroLine,'a',/R\$/):null;
  let somaV=0,somaM=0;const lines=rows.map(tr=>{const td=tr.children;const nome=td[0].querySelector('a')||td[0];const props=td[1].querySelector('a')||td[1];const v=num(td[2].textContent),m=num(td[3].textContent),p=num(td[4].textContent);somaV+=v||0;somaM+=m||0;
    const cor=p>=50?'#198754':p>=20?'#ffc107':'#dc3545';
    return `<div class="g170-line"><div class="nm">${nome.outerHTML}</div>${ring([{v:p,c:cor,l:'da meta'},{v:Math.max(0,100-p),c:'rgba(127,127,127,.18)',l:'falta'}],pct1(p),{fs:17})}<div class="vl g170-num">${E(td[2].textContent.trim())}</div><div class="mt">meta ${E(td[3].textContent.trim())}</div><div class="pr">${props.outerHTML.replace('>'+props.textContent+'<','>'+E(props.textContent.trim())+' propostas<')}</div></div>`}).join('');
  const pg=somaM?somaV/somaM*100:0;
  const hero=`<div class="g170-hero mt-2">${ring([{v:somaV,c:'#198754',l:'realizado'},{v:Math.max(0,somaM-somaV),c:'rgba(127,127,127,.18)',l:'falta'}],pct1(pg),{fs:17})}<div><div class="g170-big g170-num" style="color:#198754">${total?total.outerHTML:''}</div><div style="font-size:13px;margin-top:6px">propostas vendidas · <b class="g170-num">${valor?valor.outerHTML:''}</b></div><div class="g170-sub">de R$ ${N0(somaM)} de meta no ano · ${pct1(pg)} atingido</div></div></div>`;
  card.innerHTML='';card.append(head);card.insertAdjacentHTML('beforeend',hero+`<div class="g170-grid">${lines}</div>`);
  if(ponte){ponte.classList.add('g170-eq');card.append(ponte)}if(after){after.classList.add('g170-sub');after.style.marginTop='8px';card.append(after)}}

/* ───────── 3) Obras — o trabalho que falta na frente; concluídas e a conta da Base atrás ───────── */
function obras(doc){const card=doc.querySelector('#v146-obras');if(!card||card.dataset.g170)return;card.dataset.g170='1';
  const o=T(()=>window.V161D.obras());if(!o)return;const and=o.and.length,hold=o.hold.length,at=o.at.length,conc=o.conc.length,canc=o.canc.length,ativ=and+hold+at;
  const A=re=>findText(card,'a',re);const aAnd=A(/em andamento/),aHold=A(/on hold/),aConc=A(/conclu/),aCanc=A(/cancelad/),aAt=A(/assist/),aTot=card.querySelector('b a');
  const contaCompleta=card.children[2]?card.children[2].innerHTML:'';
  card.innerHTML=`<div class="g170-top"><span class="g170-lbl">OBRAS EM TRABALHO · o que ainda temos para entregar</span><span class="g170-sub">as mesmas de Operação › Obras e do Início</span></div>
  <div class="g170-hero mt-2">${ring([{v:and,c:'#6f42c1',l:'em andamento'},{v:hold,c:'#b197fc',l:'on hold'},{v:at,c:'#0dcaf0',l:'assistência técnica'}],null)}
   <div><div class="g170-big g170-num" style="color:#6f42c1"><a href="javascript:void 0" title="Operação › Painel" onclick="${E(aTot?aTot.getAttribute('onclick'):"location.hash='#/copainel'")}">${N0(ativ)}</a></div><div style="font-size:13px;margin-top:6px">obras em trabalho hoje</div>
    <div class="g170-chips">${wrapLink(aAnd,'#6f42c1')}${wrapLink(aHold,'#b197fc')}${wrapLink(aAt,'#0dcaf0')}</div>
    <div class="g170-eq g170-num">${N0(ativ)} = ${N0(and)} em andamento + ${N0(hold)} on hold + ${N0(at)} em assistência técnica <span style="color:#198754">✓</span></div></div></div>
  <div class="g170-chips" style="margin-top:14px">${wrapLink(aConc,'#198754',true)}${wrapLink(aCanc,'#6c757d',true)}<span class="g170-sub" style="align-self:center">já entregues ou encerradas — não são trabalho pendente</span></div>
  ${contaCompleta?`<details class="g170-more"><summary>ver a conta completa da Base</summary><div class="sub" style="font-size:12px">${contaCompleta}</div></details>`:''}`}

/* ───────── 4) Pré-vendas — os diagramas que faltam ───────── */
function prevendas(doc){const card=doc.querySelector('#v161e-pvg');if(!card||card.dataset.g170)return;card.dataset.g170='1';
  const U=re=>findText(card,'u',re);const uAf=U(/a fazer/),uAg=U(/aguardando/),uAn=U(/em andamento \(A\)/),uSem=U(/sem status/),uFe=U(/\(C\)/),uNa=U(/N\/A/);
  const ag=num(uAg&&uAg.textContent),an=num(uAn&&uAn.textContent),sem=num(uSem&&uSem.textContent),fe=num(uFe&&uFe.textContent),na=num(uNa&&uNa.textContent),af=num(uAf&&uAf.textContent);
  if(!isFinite(af))return;const sub=card.querySelector('.sub');
  const lbl=card.querySelector('b');const title=lbl?lbl.textContent:'PRÉ-VENDAS · diagramas de equipamentos';
  const onAf=uAf?uAf.getAttribute('onclick'):'';
  card.innerHTML=`<div class="g170-top"><span class="g170-lbl">${E(title)}</span><span class="g170-sub">lido do Painel de Controle (a Base)</span></div>
  <div class="g170-hero mt-2">${ring([{v:ag,c:'#d68a00',l:'aguardando arquitetura'},{v:an,c:'#2a78d6',l:'em andamento'},{v:sem,c:'#8f969d',l:'sem status'}],null)}
   <div><div class="g170-big g170-num"><u role="button" onclick="${E(onAf)}">${N0(af)}</u></div><div style="font-size:13px;margin-top:6px">diagramas a fazer</div>
    <div class="g170-chips">${wrapLink(uAg,'#d68a00')}${wrapLink(uAn,'#2a78d6')}${wrapLink(uSem,'#8f969d')}</div></div></div>
  <div class="g170-chips" style="margin-top:14px">${wrapLink(uFe,'#1a9e5c',true)}${wrapLink(uNa,'#b9bec3',true)}</div>
  ${sub?`<div class="g170-eq">${sub.innerHTML}</div>`:''}`}

/* ───────── 5) Onde paramos — a barra fina vira anel ───────── */
function ondeParamos(doc){const card=doc.querySelector('[data-v162g="1"]');if(!card||card.dataset.g170)return;card.dataset.g170='1';
  const bar=card.querySelector('.v162-bar');if(!bar)return;const parts=Array.from(bar.children).map(d=>({v:num((d.getAttribute('title')||'').split(':').pop()),c:d.style.background||d.style.backgroundColor,l:(d.getAttribute('title')||'').split(':')[0]}));
  const line=bar.nextElementSibling;const tot=parts.reduce((a,p)=>a+(p.v||0),0);
  const wrap=document.createElement('div');wrap.className='g170-hero mt-3';wrap.innerHTML=ring(parts,N0(tot),{fs:22});
  const txt=document.createElement('div');if(line){line.classList.remove('mt-2');txt.append(line)}wrap.append(txt);bar.replaceWith(wrap)}

/* ───────── 6) a faixa "✉ N propostas enviadas já estão no sistema" (v169) sai — ocupava espaço ───────── */
function semFaixa(doc){doc.querySelectorAll('a.card[href="#/enviadas"],a.card[data-v161dh="#/enviadas"],a.card[onclick*="#/enviadas"]').forEach(a=>{if(/j\u00e1 est\u00e3o no sistema/.test(a.textContent))a.remove()})}

function aplica(doc){css();T(()=>semFaixa(doc));
  if(Array.from(doc.querySelectorAll('h5')).some(x=>/^Visão Geral/.test(x.textContent.trim()))){T(()=>kpis(doc));T(()=>vendidas(doc));T(()=>obras(doc));T(()=>prevendas(doc));T(()=>ondeParamos(doc))}}
function transforma(h){if(typeof h!=='string'||!h)return h;const t=document.createElement('template');t.innerHTML=h;const doc=t.content;aplica(doc);
  const d=document.createElement('div');d.append(doc);return d.innerHTML}
/* camadas que mexem na tela DEPOIS de montada (v162 "Onde paramos", v161d) passam pela mesma forma */
function depois(){const m=document.getElementById('main');if(!m||!/^#\/gestao/.test(location.hash))return;aplica(m);anima()}

/* números que "chegam": contagem rápida do zero até o valor, no formato que já está na tela */
function anima(){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('#main .g170-num').forEach(el=>{if(el.dataset.g170a)return;el.dataset.g170a='1';
    const node=(function find(n){for(const c of n.childNodes){if(c.nodeType===3&&/\d/.test(c.nodeValue))return c;if(c.nodeType===1){const r=find(c);if(r)return r}}return null})(el);if(!node)return;
    const txt=node.nodeValue;const m=txt.match(/[\d.]+(,\d+)?/);if(!m)return;const fim=num(m[0]);if(!isFinite(fim)||fim===0)return;
    const dec=(m[0].split(',')[1]||'').length;const t0=performance.now(),dur=650;
    const fmt=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
    const step=now=>{const k=Math.min(1,(now-t0)/dur);const e=1-Math.pow(1-k,3);node.nodeValue=txt.replace(m[0],fmt(fim*e));if(k<1)requestAnimationFrame(step);else node.nodeValue=txt};requestAnimationFrame(step)})}

function liga(){if(typeof SCREENS!=='object')return false;let n=0;
  ['gestao','pipeline','negociacoes'].forEach(k=>{const f=SCREENS[k];if(typeof f!=='function'||f.__v170)return;
    const w=function(){const h=f.apply(this,arguments);const out=transforma(h);if(k==='gestao'){setTimeout(depois,0);setTimeout(depois,400)}return out};w.__v170=1;Object.keys(f).forEach(x=>{try{w[x]=f[x]}catch(e){}});SCREENS[k]=w;n++});return n}
window.V170={transforma,anima,aplica,depois};
css();liga();
/* outras camadas ainda embrulham SCREENS.gestao nos primeiros segundos (v169 usa um intervalo): esta fica sempre por fora */
let tent=0;const iv=setInterval(()=>{let n=0;try{n=liga()}catch(e){}if(n&&/^#\/gestao/.test(location.hash))T(()=>render());if(++tent>100)clearInterval(iv)},250);
})();
