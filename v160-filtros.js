/* =====================================================================================================
   v160 · FILTROS EM UMA LINHA (Bruno, 05/11/2026 — escolheu a opção B)
   As duas fileiras de botões (frentes | consultores) ocupavam meia tela no Pipeline, na Gestão e nas Tarefas de hoje.
   Agora: uma linha só — busca · botão "Filtros" (abre Frente e Consultor em duas listas) · Nova oportunidade.
   O que estiver filtrado aparece como etiqueta pequena com ×. A frase "Todo cliente tem sempre…" vira um ⓘ.
   Os filtros continuam os mesmos (S.comF) — só a apresentação muda: cada escolha roda o mesmo clique do botão antigo.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v160f)return;window.__v160f=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const st=window.V160=window.V160||{aberto:false,acoes:{}};
const css=()=>{if(document.getElementById('v160-css'))return;const s=document.createElement('style');s.id='v160-css';s.textContent=`
.v160-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.v160-bar .v160-q{flex:1 1 260px;min-width:180px;max-width:none!important;width:auto!important}
.v160-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--bd,rgba(0,0,0,.15));background:transparent;border-radius:10px;padding:6px 12px;font-size:13px;cursor:pointer;white-space:nowrap}
.v160-btn.on{border-color:#2a78d6;color:#2a78d6}
.v160-n{background:#2a78d6;color:#fff;border-radius:999px;font-size:11px;padding:0 7px;line-height:18px}
.v160-pop{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px;padding:10px 12px;border:1px solid var(--bd,rgba(0,0,0,.12));border-radius:12px}
.v160-pop label{font-size:12px;opacity:.75;margin-right:4px}
.v160-pop select{font-size:13px;padding:4px 8px;border-radius:8px;border:1px solid var(--bd,rgba(0,0,0,.15));background:transparent;color:inherit}
.v160-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.v160-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(42,120,214,.12);color:#2a78d6;border-radius:999px;padding:3px 10px;font-size:12px}
.v160-tag b{cursor:pointer;font-weight:600}
.v160-i{cursor:help;opacity:.6;font-size:14px}`;document.head.appendChild(s)};
let seq=0;const reg=code=>{const k='a'+(++seq);st.acoes[k]=code;return k};
V160.run=k=>{const c=st.acoes[k];if(!c)return;try{(new Function(c))()}catch(e){console.error('v160',e)}};
V160.sel=el=>{const k=el.value;if(k)V160.run(k)};
V160.toggle=()=>{st.aberto=!st.aberto;const p=document.getElementById('v160-pop');if(p)p.style.display=st.aberto?'flex':'none';const b=document.getElementById('v160-fb');if(b)b.classList.toggle('on',st.aberto)};

function grupos(row){/* a fileira antiga: botões .chip separados por um "|" */
  const gs=[[]];[...row.childNodes].forEach(n=>{if(n.nodeType===1&&n.tagName==='BUTTON')gs[gs.length-1].push(n);else if(n.nodeType===1&&/^\s*\|\s*$/.test(n.textContent))gs.push([])});return gs.filter(g=>g.length)}
const nome=b=>{const t=b.textContent.trim();return t===t.toUpperCase()?t.toLowerCase().replace(/(^|\s|-)(\p{L})/gu,(m,a,c)=>a+c.toUpperCase()):t};
function montar(row){
  st.acoes={};seq=0;const gs=grupos(row);if(!gs.length)return null;
  const rot=['Frente','Consultor'];const tags=[];let n=0;
  const sels=gs.map((g,i)=>{const lb=rot[i]||'Filtro';const todo=g[0];
    const opts=g.map((b,j)=>{const k=reg(b.getAttribute('onclick')||'');const on=b.classList.contains('info');if(on&&j>0){n++;tags.push(`<span class="v160-tag">${E(lb)}: ${E(nome(b))} <b onclick="V160.run('${reg(todo.getAttribute('onclick')||'')}')" title="tirar este filtro">×</b></span>`)}
      return `<option value="${k}"${on?' selected':''}>${E(j===0?(i===0?'Todas as frentes':'Todos os consultores'):nome(b))}</option>`}).join('');
    return `<span><label>${E(lb)}</label><select onchange="V160.sel(this)">${opts}</select></span>`}).join('');
  return {n,html:`<div id="v160-pop" class="v160-pop" style="display:${st.aberto?'flex':'none'}">${sels}</div>${tags.length?`<div class="v160-tags">${tags.join('')}</div>`:''}`}}

function aplicar(){const m=document.getElementById('main');if(!m)return;
  const row=[...m.querySelectorAll('div.d-flex')].find(d=>!d.dataset.v160&&[...d.children].some(b=>b.tagName==='BUTTON'&&/S\.comF=/.test(b.getAttribute('onclick')||'')));
  if(!row)return;css();const r=montar(row);if(!r)return;
  /* a linha: busca existente (se houver) · Filtros · Nova oportunidade (se houver) */
  const topo=m.querySelector('button[onclick^="wizard(0)"]');const card=topo&&topo.closest('.card');
  const q=[...m.querySelectorAll('input')].find(i=>/^Buscar/i.test(i.placeholder||''));
  const bar=document.createElement('div');bar.className='v160-bar';bar.dataset.v160='1';
  const btn=`<button id="v160-fb" class="v160-btn${st.aberto?' on':''}" onclick="V160.toggle()"><i class="bi bi-sliders"></i> Filtros${r.n?` <span class="v160-n">${r.n}</span>`:''}</button>`;
  const wrap=document.createElement('div');wrap.className='card p-2 mb-2';wrap.dataset.v160='1';
  if(card){const frase=card.querySelector('span.sub');const dica=frase?frase.textContent.trim():'';card.dataset.v160='1';
    card.innerHTML='';card.classList.remove('mb-3');card.classList.add('mb-2');card.appendChild(bar);
    if(q){const old=q.parentElement;q.classList.add('v160-q');bar.appendChild(q);if(old&&old!==bar&&!old.querySelector('input,select,button')&&!old.textContent.replace(/Mostrando[^]*$/,'').trim()){}}
    else{bar.insertAdjacentHTML('beforeend','<span class="v160-q"></span>')}
    bar.insertAdjacentHTML('beforeend',btn+(dica?`<span class="v160-i" title="${E(dica)}">ⓘ</span>`:''));bar.appendChild(topo);
    card.insertAdjacentHTML('beforeend',r.html);row.remove()}
  else{wrap.appendChild(bar);if(q){q.classList.add('v160-q');bar.appendChild(q)}else bar.insertAdjacentHTML('beforeend','<span class="v160-q"></span>');
    bar.insertAdjacentHTML('beforeend',btn);wrap.insertAdjacentHTML('beforeend',r.html);row.replaceWith(wrap)}
  /* o "Mostrando N de M" que ficou sozinho na linha da busca */
  [...m.querySelectorAll('span,div')].forEach(x=>{if(!x.dataset.v160&&!x.children.length&&/^Mostrando \d/.test(x.textContent.trim())){const p=x.parentElement;x.style.fontSize='12px';if(p&&p.children.length===1){p.style.margin='0 0 6px';p.style.minHeight='0'}}});
  /* contêiner da busca antiga, agora vazio */
  m.querySelectorAll('div').forEach(d=>{if(!d.dataset.v160&&d.children.length===0&&!d.textContent.trim()&&/d-flex|card/.test(d.className)&&d.closest('#main')===m&&d.parentElement===m)d.remove()})}

let pend=false;const agenda=()=>{if(pend)return;pend=true;requestAnimationFrame(()=>{pend=false;try{aplicar()}catch(e){console.error('v160',e)}})};
const liga=()=>{const m=document.getElementById('main');if(!m)return false;new MutationObserver(agenda).observe(m,{childList:true,subtree:true});agenda();return true};
if(!liga()){let k=0;const iv=setInterval(()=>{if(liga()||++k>80)clearInterval(iv)},250)}
})();
