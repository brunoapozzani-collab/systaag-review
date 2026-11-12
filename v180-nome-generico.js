/* =====================================================================================================
   v180 · NOME GENÉRICO DO SYSTAAG (RENDER) ENTRA NA BASE (Bruno, 12/11/2026)
   Pedido: o "nome genérico" de cada produto (o nome que o cliente vê na proposta) vem do SysTaag no Render.
   Regras do Bruno (10/11 e 12/11):
     · nada é inventado nem reescrito — o campo "Nomenclatura genérica (apelido)" recebe EXATAMENTE as palavras do Render;
     · produto do Render sem nome genérico → o apelido daqui fica como está;
     · produto do Render que não existe aqui → NÃO é criado: o catálogo certo é o daqui (Planilha de Preços, Bruno 12/11);
     · Base › Produtos mostra quantos produtos do catálogo têm nome genérico e a lista dos que faltam, com campo para digitar.
   Como casa: modelo = nome do produto até o " — " (sem acento, maiúsculas, só letras e números). Mesmo modelo = mesmo produto;
   se o Render der dois nomes genéricos diferentes para o mesmo modelo, nada é gravado e o modelo vai para a lista "ambíguos".
   Carga feita UMA vez, depois que a nuvem da Base (v172) terminou a primeira leitura — vale para todos os computadores.
   Desfazer: cada produto alterado guarda o apelido anterior em _apelido_antes (V180.desfazer()).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v180)return;window.__v180=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V180_NG;if(!D||!Array.isArray(D.todos)){console.error('v180: v180-nome-generico-data.js não carregou');return}
const V180=window.V180={};
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');
const modelo=s=>nz(String(s||'').split(' — ')[0]);
const rerender=()=>{try{renderMain()}catch(e){}};
const FONTE='SysTaag (Render) — nome genérico, carga de 12/11/2026';
const login=()=>T(()=>me().login,'')||T(()=>localStorage.getItem('systaag_quem'),'')||'sistema';

/* ───── o casamento (sempre contra a Base de agora: os números da tela nunca ficam velhos) ───── */
function casa(){
  const idx=new Map();(S.db.produtos||[]).forEach(p=>{const k=modelo(p.nome);if(!k)return;(idx.get(k)||idx.set(k,[]).get(k)).push(p)});
  const porModelo=new Map();
  D.todos.forEach(r=>{const k=nz(r[1]);if(!k)return;(porModelo.get(k)||porModelo.set(k,[]).get(k)).push(r)});
  const achados=[],semPar=[],ambiguos=[],gravar=[];
  porModelo.forEach((rs,k)=>{
    const c=idx.get(k)||[];
    if(!c.length){rs.forEach(r=>semPar.push(r));return}
    rs.forEach(r=>achados.push(r));
    const nomes=[...new Set(rs.map(r=>r[3]).filter(Boolean))];
    if(nomes.length>1){ambiguos.push({k,rs,prods:c});return}
    if(nomes.length===1)c.forEach(p=>gravar.push({p,g:nomes[0],r:rs[0]}));
  });
  return {achados,semPar,ambiguos,gravar}
}
V180.casa=casa;

/* ───── a carga (uma vez) ───── */
function aplica(){
  const P=S.db.params=S.db.params||{};
  if(P.v180_ng&&P.v180_ng.em)return;
  if(window.__TREINO)return;
  const est=T(()=>window.NUVEM_BASE.estado(),null);if(est&&est.aguardando)return;
  const c=casa();let n=0,trocados=0;
  c.gravar.forEach(x=>{const p=x.p;const antes=p.apelido||'';if(antes===x.g)return;
    if(antes&&p._apelido_antes===undefined){p._apelido_antes=antes;trocados++}
    p.apelido=x.g;p.apelido_fonte=FONTE+' (Render id '+x.r[0]+')';n++});
  P.v180_ng={em:new Date().toISOString(),por:login(),gravados:n,trocados,fonte:D.fonte,render_total:D.total,render_com_nome:D.com_nome};
  try{log('produtos','v180','Nome genérico do SysTaag (Render) gravado em '+n+' produto(s) — '+trocados+' tinham outro apelido (guardado em _apelido_antes)')}catch(e){}
  try{save()}catch(e){console.error('v180 save',e)}
  console.info('v180: nome genérico gravado em',n,'produtos (',trocados,'trocados )');
  rerender()}
V180.desfazer=function(){let n=0;(S.db.produtos||[]).forEach(p=>{if(String(p.apelido_fonte||'').indexOf(FONTE)===0){p.apelido=p._apelido_antes!==undefined?p._apelido_antes:'';delete p._apelido_antes;delete p.apelido_fonte;n++}});
  if(S.db.params)S.db.params.v180_ng={desfeito:new Date().toISOString(),por:login()};try{save()}catch(e){}rerender();return n};
/* sem nuvem (arquivo aberto sozinho) aplica na hora; com nuvem, só depois da primeira leitura dela */
if(!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url){setTimeout(aplica,2500)}
else if(window.__v172pronto)setTimeout(aplica,300);
else window.addEventListener('v172-pronta',()=>setTimeout(aplica,300),{once:true});

/* ───── Base › Produtos: quantos produtos DESTE catálogo já têm nome genérico, e a lista dos que faltam ─────
   12/11/2026 (Bruno): "a informação correta é a do Vercel — veio da Planilha de Preços, que acabou de ser atualizada; o que
   faltava era só o nome genérico". Por isso a tela mostra o catálogo daqui (não os produtos do Render que não existem aqui):
   os que já têm nome genérico e os que ainda não têm — esses ganham um campo para a equipe digitar. */
const catalogo=()=>(S.db.produtos||[]).filter(p=>p&&!p.inativo&&!p.merged_into);
const doRender=p=>String(p.apelido_fonte||'').indexOf(FONTE)===0;
const tem=p=>String(p.apelido||'').trim()!=='';
V180.ver=function(on){S.v180=on||0;S.v180q='';rerender()};
V180.q=function(v){S.v180q=v;const el=document.getElementById('v180-body');if(el)el.innerHTML=linhas()};
V180.set=function(pid,v){const p=(S.db.produtos||[]).find(x=>x.id===pid);if(!p)return;const s=String(v==null?'':v).trim();if(!s)return;
  const antes=p.apelido||'';if(antes===s)return;p.apelido=s;p.apelido_fonte='Base › Produtos (digitado por '+login()+' em '+new Date().toLocaleDateString('pt-BR')+')';
  try{log('produtos',pid,'Nome genérico: "'+antes+'" → "'+s+'"')}catch(e){}try{save()}catch(e){}try{toast('Nome genérico gravado: '+s)}catch(e){}
  const el=document.getElementById('v180-body');if(el)el.innerHTML=linhas();const b=document.getElementById('v180-ponte');if(b)b.outerHTML=ponte()};
function ambiguo(){const m=new Map();casa().ambiguos.forEach(a=>a.prods.forEach(p=>m.set(p.id,[...new Set(a.rs.map(r=>r[3]).filter(Boolean))])));return m}
function linhas(){const q=nz(S.v180q||'');const amb=ambiguo();
  const rs=catalogo().filter(p=>!tem(p)&&(!q||nz(p.nome+' '+p.marca+' '+p.categoria).includes(q))).sort((a,b)=>String(a.marca+a.nome).localeCompare(String(b.marca+b.nome)));
  return rs.map(p=>{const a=amb.get(p.id);return `<tr><td><b>${E(p.nome)}</b><div class="sub" style="font-size:11px">${E(p.marca||'')}${p.categoria?' · '+E(p.categoria):''}</div>${a?`<div class="sub" style="font-size:11px;color:#b45309">o SysTaag (Render) tem dois nomes para este modelo: ${a.map(E).join(' · ')} — escolha um</div>`:''}</td><td style="min-width:260px"><input type="text" class="form-control form-control-sm" placeholder="ex.: CAIXA ACÚSTICA" onchange="V180.set('${E(p.id)}',this.value)" title="digite e saia do campo: grava o nome genérico deste produto"></td></tr>`}).join('')
    ||'<tr><td colspan="2" class="sub">todos os produtos têm nome genérico ✓</td></tr>'}
function ponte(){const C=catalogo();const com=C.filter(tem);const r=com.filter(doRender).length;const sem=C.length-com.length;const P=(S.db.params||{}).v180_ng||{};
  return `<div class="card p-3 mb-2 af-bar" id="v180-ponte" style="display:block;font-size:13px">
    <div><b>${N0(C.length)} produtos no catálogo</b> = <b>${N0(com.length)}</b> com nome genérico (${N0(r)} vindos do SysTaag + ${N0(com.length-r)} digitados aqui ou que já tinham) + <b style="color:${sem?'#b45309':'inherit'}">${N0(sem)}</b> sem nome genérico</div>
    <div class="sub mt-1" style="font-size:11.5px">O catálogo é o daqui (Planilha de Preços). Do SysTaag veio só o nome genérico, com as mesmas palavras, nos produtos do mesmo modelo${P.em?' — carga feita em '+E(new Date(P.em).toLocaleString('pt-BR'))+' por '+E(P.por||''):''}. Os que o SysTaag não tinha ficam aqui para a equipe digitar.</div></div>`}
function tela(){const hd=T(()=>head('Produtos sem nome genérico','O nome genérico é o nome que o cliente vê na proposta. Digite e saia do campo: grava na hora, para todos.',`<button class="btn-soft" onclick="V180.ver(0)">Voltar aos produtos ✕</button>`),'<h3>Produtos sem nome genérico</h3>');
  const busca=`<div class="d-flex mb-2"><input class="form-control form-control-sm ms-auto" style="max-width:280px" placeholder="Buscar modelo, marca ou categoria…" oninput="V180.q(this.value)"></div>`;
  return hd+ponte()+busca+`<div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Produto</th><th>Nome genérico</th></tr></thead><tbody id="v180-body">${linhas()}</tbody></table></div></div>`}
const chip=()=>{const C=catalogo();const sem=C.filter(p=>!tem(p)).length;return `<span class="chip ${sem?'warn':'ok'}" data-v180-chip="1" style="font-size:11px;cursor:pointer" title="produtos do catálogo sem nome genérico (o nome que o cliente vê)" onclick="V180.ver('sem')"><i class="bi bi-tag me-1"></i>nome genérico: ${N0(C.length-sem)} de ${N0(C.length)}${sem?' · '+N0(sem)+' sem':''}</span>`};
try{const _dbp=SCREENS.dbprodutos;if(typeof _dbp==='function'&&!_dbp.__v180){SCREENS.dbprodutos=function(arg){const cat=!arg||arg==='catalogo';
    if(cat&&S.v180)return tela();
    let h=_dbp.apply(this,arguments);if(typeof h!=='string'||!cat)return h;
    const k='<span class="ms-auto d-flex gap-1 flex-wrap">';const i=h.indexOf(k);
    if(i>=0)return h.slice(0,i+k.length)+chip()+h.slice(i+k.length);
    const j=h.indexOf('<div class="card');return j>0?h.slice(0,j)+`<div class="mb-2">${chip()}</div>`+h.slice(j):h+chip()};
  SCREENS.dbprodutos.__v180=true;Object.keys(_dbp).forEach(k=>{try{SCREENS.dbprodutos[k]=_dbp[k]}catch(e){}})}}catch(e){console.error('v180 dbprodutos',e)}
window.addEventListener('hashchange',()=>{try{if(!/^#\/dbprodutos/.test(location.hash||''))S.v180=0}catch(e){}});
})();
