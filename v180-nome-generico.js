/* =====================================================================================================
   v180 · NOME GENÉRICO DO SYSTAAG (RENDER) ENTRA NA BASE (Bruno, 12/11/2026)
   Pedido: o "nome genérico" de cada produto (o nome que o cliente vê na proposta) vem do SysTaag no Render.
   Regras do Bruno (10/11 e 12/11):
     · nada é inventado nem reescrito — o campo "Nomenclatura genérica (apelido)" recebe EXATAMENTE as palavras do Render;
     · produto do Render sem nome genérico → o apelido daqui fica como está;
     · produto do Render que não existe aqui → NÃO é criado; vai para uma lista em Base › Produtos.
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

/* ───── Base › Produtos: a lista do que o SysTaag tem e a Base não tem ───── */
V180.ver=function(on){S.v180=on||0;S.v180q='';rerender()};
V180.q=function(v){S.v180q=v;const el=document.getElementById('v180-body');if(el)el.innerHTML=linhas()};
function linhas(){const c=casa();const q=nz(S.v180q||'');
  if(S.v180==='amb'){const rs=c.ambiguos.filter(a=>!q||a.k.includes(q));
    return rs.map(a=>`<tr><td><b>${E(a.rs[0][1])}</b><div class="sub" style="font-size:11px">aqui: ${a.prods.map(p=>E(p.nome)).join(' · ')}</div></td><td>${a.rs.map(r=>E(r[3]||'—')+' <span class="sub" style="font-size:11px">(Render '+r[0]+')</span>').join('<br>')}</td></tr>`).join('')||'<tr><td colspan="2" class="sub">nenhum</td></tr>'}
  const rs=c.semPar.filter(r=>!q||nz(r[1]+' '+r[2]+' '+r[3]).includes(q)).sort((a,b)=>(a[2]+a[1]).localeCompare(b[2]+b[1]));
  const lim=rs.slice(0,400);
  return lim.map(r=>`<tr><td class="mono sub">${r[0]}</td><td><b>${E(r[1])}</b></td><td>${E(r[2]||'—')}</td><td>${r[3]?E(r[3]):'<span class="sub">sem nome genérico no Render</span>'}</td></tr>`).join('')+(rs.length>lim.length?`<tr><td colspan="4" class="sub">+ ${N0(rs.length-lim.length)} — use a busca para achar um produto</td></tr>`:'')||'<tr><td colspan="4" class="sub">nenhum</td></tr>'}
function tela(){const c=casa();const P=(S.db.params||{}).v180_ng||{};
  const comNome=D.todos.filter(r=>r[3]).length;const comNomeSem=c.semPar.filter(r=>r[3]).length;const comNomeAmb=c.ambiguos.reduce((a,x)=>a+x.rs.filter(r=>r[3]).length,0);
  const prodsGrav=new Set(c.gravar.map(x=>x.p.id)).size;
  const hd=T(()=>head('Produtos do SysTaag (Render) — nome genérico','O nome genérico (o nome que o cliente vê) vem do SysTaag no Render, com as mesmas palavras. Produto do Render que não existe aqui não é criado: fica nesta lista para alguém decidir.',`<button class="btn-soft" onclick="V180.ver(0)">Voltar aos produtos ✕</button>`),'<h3>Produtos do SysTaag (Render)</h3>');
  const ponte=`<div class="card p-3 mb-2 af-bar" style="display:block;font-size:13px">
    <div><b>${N0(D.total)} produtos no SysTaag</b> = <b>${N0(c.achados.length)}</b> encontrados aqui (mesmo modelo) + <a href="javascript:void 0" onclick="V180.ver('sem')"><b>${N0(c.semPar.length)}</b> sem par aqui ›</a></div>
    <div class="mt-1"><b>${N0(comNome)} com nome genérico</b> = <b>${N0(comNome-comNomeSem-comNomeAmb)}</b> gravados aqui (em ${N0(prodsGrav)} produto(s)) + <a href="javascript:void 0" onclick="V180.ver('sem')">${N0(comNomeSem)} sem par aqui ›</a> + <a href="javascript:void 0" onclick="V180.ver('amb')">${N0(comNomeAmb)} em modelos com dois nomes diferentes no Render ›</a></div>
    <div class="sub mt-1" style="font-size:11.5px">${E(D.fonte)}${P.em?' · carga feita em '+E(new Date(P.em).toLocaleString('pt-BR'))+' por '+E(P.por||'')+' ('+N0(P.gravados)+' gravados'+(P.trocados?', '+N0(P.trocados)+' tinham outro apelido — guardado':'')+')':' · carga ainda não feita neste computador'}</div></div>`;
  const tabs=`<div class="d-flex gap-2 mb-2 flex-wrap align-items-center"><span class="chip ${S.v180==='sem'?'ok':''}" style="cursor:pointer" onclick="V180.ver('sem')">Sem par aqui (${N0(c.semPar.length)})</span><span class="chip ${S.v180==='amb'?'ok':''}" style="cursor:pointer" onclick="V180.ver('amb')">Dois nomes no Render (${N0(c.ambiguos.length)})</span><input class="form-control form-control-sm ms-auto" style="max-width:280px" placeholder="Buscar modelo, marca ou nome…" oninput="V180.q(this.value)"></div>`;
  const th=S.v180==='amb'?'<tr><th>Modelo no Render</th><th>Nomes genéricos no Render</th></tr>':'<tr><th>Id Render</th><th>Modelo</th><th>Marca</th><th>Nome genérico (Render)</th></tr>';
  return hd+ponte+tabs+`<div class="card"><div class="tblwrap"><table class="tbl"><thead>${th}</thead><tbody id="v180-body">${linhas()}</tbody></table></div></div>`}
const chip=()=>{const n=casa().semPar.length;return `<span class="chip" data-v180-chip="1" style="font-size:11px;cursor:pointer" title="nome genérico vindo do SysTaag (Render) e os produtos de lá que não existem aqui" onclick="V180.ver('sem')"><i class="bi bi-tag me-1"></i>SysTaag (Render): ${N0(n)} sem par aqui</span>`};
try{const _dbp=SCREENS.dbprodutos;if(typeof _dbp==='function'&&!_dbp.__v180){SCREENS.dbprodutos=function(arg){const cat=!arg||arg==='catalogo';
    if(cat&&S.v180)return tela();
    let h=_dbp.apply(this,arguments);if(typeof h!=='string'||!cat)return h;
    const k='<span class="ms-auto d-flex gap-1 flex-wrap">';const i=h.indexOf(k);
    if(i>=0)return h.slice(0,i+k.length)+chip()+h.slice(i+k.length);
    const j=h.indexOf('<div class="card');return j>0?h.slice(0,j)+`<div class="mb-2">${chip()}</div>`+h.slice(j):h+chip()};
  SCREENS.dbprodutos.__v180=true;Object.keys(_dbp).forEach(k=>{try{SCREENS.dbprodutos[k]=_dbp[k]}catch(e){}})}}catch(e){console.error('v180 dbprodutos',e)}
window.addEventListener('hashchange',()=>{try{if(!/^#\/dbprodutos/.test(location.hash||''))S.v180=0}catch(e){}});
})();
