/* =====================================================================================================
   v159 · PIPELINE = A PLANILHA (Bruno, 05/11/2026 — "fix the pipeline to look exactly like the sheet")
   O que estava errado: 9 linhas da aba Pipeline da To Do Comercial têm o STATUS em branco. O protótipo as contava
   como abertas, em "Desenvolver proposta" (18 + 9 = 27), e o Pipeline dizia 65 negociações abertas — a planilha tem 56.
   §1 Base: cada negociação da Pipeline guarda a sua linha da planilha (número da linha + as 17 colunas, como estão)
      em n.planilha. STATUS em branco = resultado "sem_status" (não é aberta, nem fechada, nem perdida, nem futuro) e
      etapa "Sem status na planilha". A tela lê só a Base (uma fonte).
   §2 KPI: ganha sem_status; as pontes passam a ser 913 = fechadas + perdidas + futuro + abertas + sem status.
   §3 Comercial › Pipeline abre na vista "Como na planilha": as mesmas colunas, na mesma ordem, as mesmas linhas,
      o mesmo texto; os totais por STATUS com a ponte, cada número filtra a tabela. O quadro antigo fica na aba "Quadro".
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v159p)return;window.__v159p=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V159_PIPE;if(!D||!Array.isArray(D.rows)){console.error('v159: v159-pipeline-planilha-data.js não carregou');return}
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const ST=10,CONS=4,TIPO=9,CLI=3;
const ABERTOS=['proposta enviada','desenvolver proposta','revisao de proposta','proposta desenvolvida','aguardando apresentacao'];
const SEM='Sem status na planilha';

/* ---------- §1 a linha da planilha entra na Base ---------- */
function liga(){const db=S.db;const N=db.negociacoes||[];let mud=0;const byId={};N.forEach(n=>byId[n.id]=n);
  const livres=N.filter(n=>/^Pipeline \(/.test(n.origem||''));const usados=new Set();const falta=[];
  D.rows.forEach((r,i)=>{let n=byId['pl'+(i+1)];
    if(!n||usados.has(n.id)||(nz(n.cliente_nome)!==nz(r.c[CLI])&&nz(n.status_pipeline)!==nz(r.c[ST])))n=livres.find(x=>!usados.has(x.id)&&nz(x.cliente_nome)===nz(r.c[CLI])&&nz(x.status_pipeline)===nz(r.c[ST]))||null;
    if(!n){falta.push(r.linha);return}usados.add(n.id);
    const pl={linha:r.linha,c:r.c};if(nz(n.status_pipeline)!==nz(r.c[ST])&&r.c[ST]){n.status_pipeline=r.c[ST];mud++}if(JSON.stringify(n.planilha)!==JSON.stringify(pl)){n.planilha=pl;mud++}
    if(!r.c[ST]){if(n.resultado!=='sem_status'){n.resultado='sem_status';mud++}if(n.etapa!==SEM){n.etapa=SEM;mud++}}
    else if(n.resultado==='sem_status'){n.resultado=null;n.etapa='desenvolver';mud++}});
  const fora=livres.filter(n=>!usados.has(n.id)).map(n=>n.id);
  db._v159={quando:D.quando,linhas:D.rows.length,ligadas:usados.size,sem_negociacao:falta,fora_da_planilha:fora};
  return mud}
const mud=T(liga,0);

/* ---------- §2 KPI conta os sem status ---------- */
if(typeof window.KPI==='function'&&!KPI.__v159){const _k=window.KPI;window.KPI=function(fn){const o=_k.apply(this,arguments);
  try{const N=fn?S.db.negociacoes.filter(fn):S.db.negociacoes;o.sem_status=N.filter(n=>n.resultado==='sem_status').length}catch(e){}return o};KPI.__v159=true}

/* ---------- §3 a vista "Como na planilha" ---------- */
const UI=window.V159=window.V159||{};UI.f=UI.f||{};
const linhas=()=>(S.db.negociacoes||[]).filter(n=>n.planilha).sort((a,b)=>a.planilha.linha-b.planilha.linha);
const stKey=n=>nz(n.planilha.c[ST])||'_vazio';
function rotulos(xs,i){const m={};xs.forEach(n=>{const v=n.planilha.c[i];const k=nz(v)||'_vazio';(m[k]=m[k]||{k,n:0,sp:{}});m[k].n++;m[k].sp[v]=(m[k].sp[v]||0)+1});
  return Object.values(m).map(g=>({k:g.k,n:g.n,lb:g.k==='_vazio'?'(em branco)':Object.entries(g.sp).sort((a,b)=>b[1]-a[1])[0][0]})).sort((a,b)=>b.n-a.n)}
UI.set=(k,v)=>{UI.f[k]=UI.f[k]===v?'':v;T(()=>renderMain())};
UI.q=v=>{UI.f.q=v;clearTimeout(UI._t);UI._t=setTimeout(()=>{const el=document.getElementById('v159-tb');if(el){el.innerHTML=corpo();const c=document.getElementById('v159-n');if(c)c.textContent=UI._n}},180)};
UI.limpar=()=>{UI.f={};T(()=>renderMain())};
UI.abrir=id=>{S.deal=id;S.pipeTab='quadro';T(()=>renderMain())};
function filtradas(){const f=UI.f;const q=nz(f.q);return linhas().filter(n=>(!f.st||stKey(n)===f.st)&&(!f.cons||nz(n.planilha.c[CONS])===f.cons)&&(!f.tipo||nz(n.planilha.c[TIPO])===f.tipo)&&(!f.grupo||(f.grupo==='abertas'?ABERTOS.includes(stKey(n)):true))&&(!q||nz(n.planilha.c.join(' ')).includes(q)))}
function corpo(){const xs=filtradas();UI._n=N0(xs.length)+' de '+N0(linhas().length)+' linhas';
  return xs.map(n=>{const c=n.planilha.c;return `<tr onclick="V159.abrir('${J(n.id)}')" title="Abrir a negociação">`+
    `<td class="v159-ln">${n.planilha.linha}</td>`+c.map((v,i)=>`<td class="${i===0&&v?'v159-ch':''}${i===ST&&!v?' v159-vz':''}">${i===ST&&!v?'(em branco)':E(v)}</td>`).join('')+'</tr>'}).join('')||`<tr><td colspan="18" class="sub" style="padding:16px">Nenhuma linha com este filtro.</td></tr>`}
function vista(){const all=linhas();const f=UI.f;const G=D.rows.length;const st=rotulos(all,ST);
  const ab=all.filter(n=>ABERTOS.includes(stKey(n))).length,vz=all.filter(n=>stKey(n)==='_vazio').length;
  const chip=(k,v,lb,n,on)=>`<span role="button" class="v159-chip${on?' on':''}" onclick="V159.set('${k}','${J(v)}')"><b>${N0(n)}</b> ${E(lb)}</span>`;
  const ponte=`${N0(all.length)} linhas = `+st.map(g=>`<u role="button" onclick="V159.set('st','${J(g.k)}')">${N0(g.n)} ${E(g.lb)}</u>`).join(' + ')+
    ` · abertas: <u role="button" onclick="V159.set('grupo','abertas')">${N0(ab)}</u> = `+st.filter(g=>ABERTOS.includes(g.k)).map(g=>`${N0(g.n)} ${E(g.lb.toLowerCase())}`).join(' + ')+
    (vz?` · <u role="button" onclick="V159.set('st','_vazio')">${N0(vz)} sem status</u> (STATUS em branco na planilha — não contam como abertas)`:'');
  const sel=(k,i,lb)=>`<select class="form-select form-select-sm" style="width:auto" onchange="V159.set('${k}',this.value)"><option value="">${lb}: todos</option>${rotulos(all,i).map(g=>`<option value="${E(g.k)}"${f[k]===g.k?' selected':''}>${E(g.lb)} (${N0(g.n)})</option>`).join('')}</select>`;
  const B=S.db._v159||{};const aviso=(B.sem_negociacao||[]).length||(B.fora_da_planilha||[]).length?`<div class="note"><span class="bad">${N0((B.sem_negociacao||[]).length)} linha(s) da planilha sem negociação na Base${(B.sem_negociacao||[]).length?' (linhas '+B.sem_negociacao.join(', ')+')':''} · ${N0((B.fora_da_planilha||[]).length)} negociação(ões) da Base que não estão mais na planilha</span></div>`:'';
  return `<div class="card p-3 mb-2 v159">
    <div class="d-flex flex-wrap justify-content-between gap-2 align-items-baseline"><div><b>Como na planilha</b> <span class="sub">· ${E(D.fonte)} · ${N0(G)} linhas com cliente</span></div><span class="sub" id="v159-n">${UI._n||''}</span></div>
    <div class="v159-chips">${st.map(g=>chip('st',g.k,g.lb,g.n,f.st===g.k)).join('')}</div>
    <div class="v159-ponte">${ponte}</div>${aviso}
    <div class="d-flex flex-wrap gap-2 my-2">${sel('cons',CONS,'Consultor')}${sel('tipo',TIPO,'Tipo')}<input class="form-control form-control-sm" style="max-width:280px" placeholder="Buscar em todas as colunas…" value="${E(f.q||'')}" oninput="V159.q(this.value)">${Object.values(f).some(Boolean)?'<button class="btn-soft" onclick="V159.limpar()">Limpar filtros</button>':''}</div>
    <div class="v159-wrap"><table class="v159-t"><thead><tr><th>Linha</th>${D.cab.map(h=>`<th>${E(h)}</th>`).join('')}</tr></thead><tbody id="v159-tb">${corpo()}</tbody></table></div></div>`}
function css(){if(document.getElementById('v159-css'))return;const s=document.createElement('style');s.id='v159-css';s.textContent=`
.v159-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 6px}.v159-chip{background:var(--bs-tertiary-bg,#f1f3f5);border-radius:999px;padding:4px 10px;font-size:12.5px;cursor:pointer}.v159-chip.on{background:#0d6efd;color:#fff}
.v159-ponte{font-size:12.5px;line-height:1.7}.v159-ponte u{cursor:pointer;text-decoration-style:dotted}
.v159-wrap{overflow:auto;max-height:70vh;border:1px solid rgba(0,0,0,.12);border-radius:8px}
.v159-t{border-collapse:collapse;font-size:12px;min-width:2200px;width:100%}.v159-t th{position:sticky;top:0;background:#b7b7b7;color:#111;font-weight:700;text-align:center;padding:8px 6px;border:1px solid #999;z-index:1}
.v159-t td{border:1px solid rgba(0,0,0,.12);padding:6px;text-align:center;vertical-align:middle;max-width:260px}.v159-t tbody tr{cursor:pointer}.v159-t tbody tr:hover td{background:rgba(13,110,253,.06)}
.v159-t td.v159-ln{background:#f1f3f5;color:#666;font-variant-numeric:tabular-nums}.v159-t td.v159-ch{background:#2f6fd1;color:#fff;font-weight:600}.v159-t td.v159-vz{color:#b02a37;font-style:italic}`;document.head.appendChild(s)}

function ligaTela(){if(typeof SCREENS!=='object'||typeof SCREENS.pipeline!=='function'||SCREENS.pipeline.__v159)return false;const _p=SCREENS.pipeline;
  SCREENS.pipeline=function(){const tab=S.deal?'quadro':(S.pipeTab||'planilha');css();
    const tabs=`<div class="tabs mb-2">${[['planilha','Como na planilha'],['quadro','Quadro']].map(([k,l])=>`<button class="${tab===k?'on':''}" onclick="S.pipeTab='${k}';S.deal=null;renderMain()">${l}</button>`).join('')}</div>`;
    let h=_p.apply(this,arguments);if(typeof h!=='string')return h;
    /* a ponte do quadro também conta os sem status */
    h=h.replace(/(\+ <span style="color:#0d6efd">(\d+) em jogo<\/span>)(<\/span>)/,(m,a,b,c)=>{const k=T(()=>KPI(),{});return a+(k.sem_status?` + <span style="color:#b02a37">${k.sem_status} sem status</span>`:'')+c});
    if(tab==='quadro')return tabs+h;
    const cab=T(()=>head('Pipeline','A aba Pipeline da planilha To Do Comercial, linha por linha, como ela é — cada número filtra a tabela; clique numa linha para abrir a negociação.'),'<h4>Pipeline</h4>');
    return cab+tabs+vista()};
  SCREENS.pipeline.__v159=true;return true}
if(!ligaTela()){let n=0;const iv=setInterval(()=>{if(ligaTela()||++n>40)clearInterval(iv)},250)}

if(mud){T(()=>save_())}
T(()=>{if(typeof route==='function'&&route().k==='pipeline')renderMain()});
})();
