/* =====================================================================================================
   v233 · CATEGORIAS DE PRODUTO — Categoria de estoque + Categoria comercial (Bruno, 25/11/2026)
   Regras do Bruno (BRIEF nova proposta, 25/11):
     · dois campos por produto: "Categoria de estoque" (= p.categoria: quem manuseia/instala) e "Categoria comercial"
       (= p.categoria_comercial: como a proposta se organiza para o cliente). Um produto = um registro;
     · começa com as categorias propostas no arquivo (SYSTAAG-Produtos-PROPOSTA-categorias-21-11-2026.xlsx), correções depois na Base;
     · quem tem acesso à Base edita as duas num lugar só: Base › Produtos › Categorias.
   Regra de ritmo (Bruno) para escrever na Base compartilhada: SIMULAR → ARQUIVO DE DESFAZER salvo → GRAVAR EM LOTES → CONFERIR.
     · nada é gravado sozinho ao abrir; só o Bruno vê os botões de carga; nunca em modo treino; nunca antes da 1ª leitura da nuvem;
     · a simulação refaz, numa cópia, o total de TODAS as propostas e a etapa de cada produto com as categorias novas: se algum
       total mudar, ou se a categoria de estoque nova não existir em Base › Categorias (sem etapa), o produto fica de fora e vai
       para uma lista com nome;
     · cada produto gravado guarda o valor anterior em _cat_antes (V233CAT.desfazer()).
   "Conta como" (linha da Contagem da obra) é guardado como referência (p.conta_como); as diárias continuam vindo da receita do
   produto (p.receita_id), que é a que fecha com o Excel — trocar a receita muda diárias e totais e fica para a Base, produto a produto.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v233)return;window.__v233=true;
if(typeof S==='undefined'||!S.db)return;
/* o arquivo de categorias (312 KB) só é baixado quando o Bruno clica em Simular — não pesa na abertura do sistema */
let D=window.V233_CAT||{total:2128,itens:[]};
const V=window.V233CAT={};
V.carrega=function(){if(window.V233_CAT&&window.V233_CAT.itens&&window.V233_CAT.itens.length){D=window.V233_CAT;return Promise.resolve(D)}
 return new Promise((res,rej)=>{const s=document.createElement('script');s.src='v233-categorias-data.js?v=1';s.onload=()=>{D=window.V233_CAT;D&&D.itens?res(D):rej(new Error('arquivo de categorias vazio'))};s.onerror=()=>rej(new Error('arquivo de categorias não carregou'));document.head.appendChild(s)})};
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(+v||0).toLocaleString('pt-BR');
const BR=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const login=()=>T(()=>me().login,'')||'sistema';
const ehBruno=()=>login()==='bruno.pozzani';
const rerender=()=>{try{renderMain()}catch(e){try{render()}catch(_){}}};
const FONTE='categorias 21/11/2026 (arquivo do rascunho da nova proposta, carga de 25/11/2026)';
const LOTE=150;
const limpaEst=s=>String(s||'').replace(/\s*\(nova\)\s*$/i,'').trim();
const prods=()=>(S.db.produtos||[]);
const ativos=()=>prods().filter(p=>p&&!p.inativo&&!p.merged_into&&!p._apagado);
const COMERCIAIS=['Home Theater e Cinema','Som ambiente','Áudio Hi-Fi','Vídeo (TV, projeção, LED)','Iluminação','Automação e controle','Rede e Wi-Fi','Câmeras','Climatização','Cabos e infraestrutura','Energia e rack','Acessórios','Acústica','Serviços (não é produto)'];
V.COMERCIAIS=COMERCIAIS;
V.comerciais=()=>{const s=new Set(COMERCIAIS);prods().forEach(p=>{if(p.categoria_comercial)s.add(p.categoria_comercial)});return [...s]};
V.estoques=()=>{const s=new Set((S.db.categorias||[]).map(c=>c.nome));prods().forEach(p=>{if(p.categoria)s.add(p.categoria)});return [...s].sort((a,b)=>a.localeCompare(b,'pt-BR'))};
const catBase=nome=>(S.db.categorias||[]).find(c=>c.nome===nome)||null;
const temEtapa=nome=>!!catBase(nome)||!!(typeof FASE_PRODUTO==='object'&&FASE_PRODUTO&&FASE_PRODUTO[nome]);

/* ───── o plano: o que o arquivo pede, contra a Base de agora ───── */
function plano(){
  const idx=new Map(prods().map(p=>[p.id,p]));const fora=[],nomeDif=[],semEtapa=[],linhas=[];
  D.itens.forEach(r=>{const [id,est0,com,calc,conf,nomeArq]=r;const p=idx.get(id);if(!p){fora.push(r);return}
    const est=limpaEst(est0);
    const mudaEst=(p.categoria||'')!==est,mudaCom=(p.categoria_comercial||'')!==com,mudaCalc=(p.conta_como||'')!==(calc||'');
    if(String(p.nome||'').trim()!==String(nomeArq||'').trim())nomeDif.push({id,base:p.nome,arquivo:nomeArq});
    const L={id,p,est,com,calc:calc||'',conf,mudaEst,mudaCom,mudaCalc};
    if(mudaEst&&!temEtapa(est))semEtapa.push(L);
    linhas.push(L)});
  const noArq=new Set(D.itens.map(r=>r[0]));
  const semLinha=prods().filter(p=>p&&!noArq.has(p.id));
  return {linhas,fora,nomeDif,semEtapa,semLinha}
}
V.plano=plano;

/* total de cada proposta e etapa de cada produto, numa cópia das propostas (nada da Base real é tocado) */
function fotografa(){
  const real=S.db.propostas;const copia=JSON.parse(JSON.stringify(real));const tot={};
  S.db.propostas=copia;
  try{copia.forEach(p=>{if(p._apagado)return;tot[p.id]=T(()=>Math.round(M.resumo(p).tot*100)/100,null)})}
  finally{S.db.propostas=real}
  const fase={};prods().forEach(p=>{fase[p.id]=T(()=>__faseDe(p.id),'')});
  return {tot,fase}
}
/* simular: aplica em memória, mede, volta tudo — devolve o que mudaria e o que fica de fora */
V.simular=function(){
  if(!D.itens.length)throw new Error('Carregue o arquivo antes: V233CAT.carrega()');
  const P=plano();const antes=fotografa();const bak=new Map();
  const vai=P.linhas.filter(L=>!(L.mudaEst&&!temEtapa(L.est)));
  vai.forEach(L=>{bak.set(L.id,[L.p.categoria,L.p.categoria_comercial,L.p.conta_como]);L.p.categoria=L.est;L.p.categoria_comercial=L.com;L.p.conta_como=L.calc});
  let depois;try{depois=fotografa()}finally{bak.forEach((v,id)=>{const p=get('produtos',id);p.categoria=v[0];if(v[1]===undefined)delete p.categoria_comercial;else p.categoria_comercial=v[1];if(v[2]===undefined)delete p.conta_como;else p.conta_como=v[2]})}
  const totDif=Object.keys(antes.tot).filter(id=>antes.tot[id]!==depois.tot[id]).map(id=>({id,numero:T(()=>get('propostas',id).numero,''),antes:antes.tot[id],depois:depois.tot[id]}));
  const faseDif=Object.keys(antes.fase).filter(id=>antes.fase[id]!==depois.fase[id]).map(id=>({id,nome:T(()=>get('produtos',id).nome,''),antes:antes.fase[id],depois:depois.fase[id]}));
  /* produtos cuja troca de etapa mexe num total ficam de fora */
  const prodTot=new Set();totDif.forEach(t=>{const p=get('propostas',t.id);T(()=>blocosDe(p),[]).forEach(b=>(b.itens||[]).forEach(l=>{if(faseDif.some(f=>f.id===l.produto_id))prodTot.add(l.produto_id)}))});
  const grava=vai.filter(L=>(L.mudaEst||L.mudaCom||L.mudaCalc)&&!prodTot.has(L.id));
  const porCom={};P.linhas.forEach(L=>porCom[L.com]=(porCom[L.com]||0)+1);
  const R={em:new Date().toISOString(),por:login(),arquivo:D.total,naBase:P.linhas.length,foraDaBase:P.fora.map(r=>({id:r[0],nome:r[5]})),
    semLinhaNoArquivo:P.semLinha.map(p=>({id:p.id,nome:p.nome})),nomeDiferente:P.nomeDif,
    semEtapa:P.semEtapa.map(L=>({id:L.id,nome:L.p.nome,categoria:L.est})),
    gravar:grava.length,mudaEstoque:grava.filter(L=>L.mudaEst).length,mudaComercial:grava.filter(L=>L.mudaCom).length,mudaContaComo:grava.filter(L=>L.mudaCalc).length,
    totaisQueMudariam:totDif,produtosQueMudamDeEtapa:faseDif.length,produtosBarradosPorTotal:[...prodTot],
    porComercial:porCom,somaComercial:Object.values(porCom).reduce((a,b)=>a+b,0)};
  V._sim=R;V._grava=grava.map(L=>L.id);return R
};

/* arquivo de desfazer: os três campos de todos os produtos, como estão agora */
V.arquivoDesfazer=function(){
  const dados={gerado:new Date().toISOString(),por:login(),fonte:'Base › Produtos antes da carga v233',produtos:prods().map(p=>({id:p.id,nome:p.nome,categoria:p.categoria??null,categoria_comercial:p.categoria_comercial??null,conta_como:p.conta_como??null}))};
  const txt=JSON.stringify(dados);
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='SYSTAAG-desfazer-categorias-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.json';document.body.appendChild(a);a.click();a.remove()}catch(e){}
  try{localStorage.setItem('v233:desfazer',txt)}catch(e){}
  V._desfazerOk=dados.produtos.length;return dados.produtos.length
};

const fila=()=>T(()=>{const e=window.NUVEM_BASE&&NUVEM_BASE.estado();return e?(+e.fila||+e.pendentes||0):0},0);
const espera=ms=>new Promise(r=>setTimeout(r,ms));
/* gravar: só Bruno, só depois de simular e de salvar o arquivo de desfazer; lotes de 150 com a fila da nuvem vazia entre eles */
V.gravar=async function(){
  if(!ehBruno())throw new Error('Só o Bruno grava a carga de categorias.');
  if(window.__TREINO)throw new Error('Modo treino: nada vai para a Base.');
  const est=T(()=>window.NUVEM_BASE.estado(),null);if(est&&est.aguardando)throw new Error('A nuvem ainda não terminou a primeira leitura.');
  if(!V._sim||!V._grava)throw new Error('Simule antes de gravar.');
  if(!V._desfazerOk)throw new Error('Salve o arquivo de desfazer antes de gravar.');
  const ids=V._grava.slice();const total=ids.length;let feitos=0;
  for(let i=0;i<ids.length;i+=LOTE){
    const lote=ids.slice(i,i+LOTE);
    lote.forEach(id=>{const p=get('produtos',id);const r=D.itens.find(x=>x[0]===id);if(!p||!r)return;
      if(p._cat_antes===undefined)p._cat_antes={categoria:p.categoria??null,categoria_comercial:p.categoria_comercial??null,conta_como:p.conta_como??null};
      p.categoria=limpaEst(r[1]);p.categoria_comercial=r[2];p.conta_como=r[3]||'';p.categoria_confianca=r[4]||'';p.categoria_fonte=FONTE;p.atualizado_em=T(()=>today(),'');feitos++});
    try{log('produtos','v233','Categorias: lote '+(i/LOTE+1)+' — '+lote.length+' produto(s)')}catch(e){}
    try{save()}catch(e){console.error('v233 save',e)}
    V._progresso={feitos,total};rerender();
    for(let k=0;k<120&&fila()>0;k++)await espera(1000);
    await espera(400)}
  S.db.params=S.db.params||{};S.db.params.v233_cat={em:new Date().toISOString(),por:login(),gravados:feitos,fonte:FONTE};
  try{save()}catch(e){}
  const C=V.conferir();rerender();return {gravados:feitos,conferencia:C}
};
/* conferir: o número que tem que fechar — produtos = soma das categorias comerciais */
V.conferir=function(){
  const ps=prods().filter(p=>p&&!p._apagado);const por={};let sem=0;
  ps.forEach(p=>{const c=p.categoria_comercial;if(!c){sem++;return}por[c]=(por[c]||0)+1});
  const soma=Object.values(por).reduce((a,b)=>a+b,0);
  return {produtos:ps.length,somaDasCategorias:soma,semCategoriaComercial:sem,fecha:soma+sem===ps.length,porComercial:por}
};
V.desfazer=function(){
  if(!ehBruno())throw new Error('Só o Bruno desfaz a carga.');let n=0;
  prods().forEach(p=>{if(p&&p._cat_antes){const a=p._cat_antes;p.categoria=a.categoria;if(a.categoria_comercial==null)delete p.categoria_comercial;else p.categoria_comercial=a.categoria_comercial;if(a.conta_como==null)delete p.conta_como;else p.conta_como=a.conta_como;delete p._cat_antes;delete p.categoria_fonte;delete p.categoria_confianca;n++}});
  if(S.db.params)S.db.params.v233_cat={desfeito:new Date().toISOString(),por:login()};try{save()}catch(e){}rerender();return n
};
/* edição produto a produto (qualquer pessoa com acesso à Base) */
V.set=function(pid,campo,v){
  if(!['categoria','categoria_comercial'].includes(campo))return;
  const p=get('produtos',pid);if(!p)return;const s=String(v==null?'':v).trim();if(!s)return;
  const antes=p[campo]||'';if(antes===s)return;
  if(campo==='categoria'&&!temEtapa(s)){try{toast('"'+s+'" ainda não existe em Base › Categorias (sem etapa). Crie a categoria lá primeiro.',true)}catch(e){}rerender();return}
  p[campo]=s;p.atualizado_em=T(()=>today(),'');
  try{log('produtos',pid,(campo==='categoria'?'Categoria de estoque':'Categoria comercial')+': "'+antes+'" → "'+s+'"')}catch(e){}
  try{save()}catch(e){}try{toast((campo==='categoria'?'Categoria de estoque':'Categoria comercial')+' gravada: '+s)}catch(e){}
  rerender()
};

/* ───── Base › Produtos › Categorias (um lugar só) ───── */
V.ver=function(on){S.v233c=on?1:0;S.v233q=S.v233q||'';rerender()};
V.q=function(k,v){S.v233f=S.v233f||{};S.v233f[k]=v;const el=document.getElementById('v233-body');if(el)el.innerHTML=linhas()};
function linhas(){
  const f=S.v233f||{};const q=String(f.q||'').toLowerCase();
  const rs=ativos().filter(p=>(!f.com||(p.categoria_comercial||'— sem —')===f.com)&&(!f.est||(p.categoria||'')===f.est)&&(!q||(p.nome+' '+(p.marca||'')+' '+p.id).toLowerCase().includes(q)))
    .sort((a,b)=>String((a.marca||'')+a.nome).localeCompare(String((b.marca||'')+b.nome),'pt-BR'));
  const EST=V.estoques(),COM=V.comerciais();
  const opt=(arr,v)=>(v&&!arr.includes(v)?[v,...arr]:arr).map(x=>`<option${x===v?' selected':''}>${E(x)}</option>`).join('');
  return rs.slice(0,400).map(p=>`<tr><td class="mono" style="font-size:11px">${E(p.id)}</td><td><b>${E(p.nome)}</b><div class="sub" style="font-size:11px">${E(p.marca||'')}${p.conta_como?' · conta como: '+E(p.conta_como):''}${p.categoria_confianca==='conferir'?' · <span style="color:#b45309">conferir</span>':''}</div></td>
    <td><select class="form-select form-select-sm" onchange="V233CAT.set('${E(p.id)}','categoria',this.value)"><option value=""></option>${opt(EST,p.categoria||'')}</select></td>
    <td><select class="form-select form-select-sm" onchange="V233CAT.set('${E(p.id)}','categoria_comercial',this.value)"><option value="">— sem —</option>${opt(COM,p.categoria_comercial||'')}</select></td></tr>`).join('')
    +(rs.length>400?`<tr><td colspan="4" class="sub">mostrando 400 de ${N0(rs.length)} — use a busca ou os filtros</td></tr>`:'')
    ||'<tr><td colspan="4" class="sub">nenhum produto com esse filtro</td></tr>'
}
function painel(){
  const C=V.conferir();const f=S.v233f||{};const P=(S.db.params||{}).v233_cat||{};const sim=V._sim;
  const chips=Object.entries(C.porComercial).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<button class="btn-soft" style="font-size:11.5px;margin:2px" onclick="V233CAT.q('com',${f.com===k?"''":"'"+E(k).replace(/'/g,"\\'")+"'"})">${E(k)} <b>${N0(n)}</b></button>`).join('')
    +(C.semCategoriaComercial?`<button class="btn-soft" style="font-size:11.5px;margin:2px;color:#b45309" onclick="V233CAT.q('com','— sem —')">sem categoria comercial <b>${N0(C.semCategoriaComercial)}</b></button>`:'');
  const carga=!ehBruno()?'':`<div class="mt-2 p-2" style="border:1px dashed #94a3b8;border-radius:10px;font-size:12px">
    <b>Carga do arquivo de categorias (${N0(D.total)} produtos)</b> — ${P.em?'gravada em '+E(new Date(P.em).toLocaleString('pt-BR'))+' por '+E(P.por)+' ('+N0(P.gravados)+' produtos)':P.desfeito?'desfeita em '+E(new Date(P.desfeito).toLocaleString('pt-BR')):'ainda não gravada'}
    <div class="d-flex gap-2 flex-wrap mt-1">
      <button class="btn-soft" onclick="V233CAT.carrega().then(()=>{V233CAT.simular();V233CAT.ver(1)}).catch(e=>toast(e.message,true))">1 · Simular</button>
      <button class="btn-soft" ${sim?'':'disabled'} onclick="V233CAT.arquivoDesfazer();V233CAT.ver(1)">2 · Salvar arquivo de desfazer${V._desfazerOk?' ✓':''}</button>
      <button class="btn-apple" ${sim&&V._desfazerOk?'':'disabled'} onclick="if(confirm('Gravar as categorias em '+(V233CAT._grava||[]).length+' produtos, em lotes de 150?'))V233CAT.gravar().then(r=>{toast('Categorias gravadas: '+r.gravados+' · conferência '+(r.conferencia.fecha?'fecha ✓':'NÃO fecha'))}).catch(e=>toast(e.message,true))">3 · Gravar em lotes</button>
      ${P.em?`<button class="btn-soft" onclick="if(confirm('Voltar as categorias de todos os produtos ao que eram antes da carga?'))toast('Desfeito em '+V233CAT.desfazer()+' produtos')">Desfazer a carga</button>`:''}
    </div>
    ${V._progresso?`<div class="sub mt-1">gravando… ${N0(V._progresso.feitos)} de ${N0(V._progresso.total)}</div>`:''}
    ${sim?`<div class="sub mt-1" style="font-size:11.5px">Simulação (${E(new Date(sim.em).toLocaleTimeString('pt-BR'))}): ${N0(sim.naBase)} do arquivo estão na Base · <b>${N0(sim.gravar)}</b> a gravar (estoque ${N0(sim.mudaEstoque)}, comercial ${N0(sim.mudaComercial)}, conta como ${N0(sim.mudaContaComo)}) · soma das categorias comerciais do arquivo ${N0(sim.somaComercial)} ${sim.somaComercial===D.total?'= '+N0(D.total)+' ✓':'≠ '+N0(D.total)+' ✗'}
      <br>Totais de proposta que mudariam: <b style="color:${sim.totaisQueMudariam.length?'#dc3545':'#198754'}">${N0(sim.totaisQueMudariam.length)}</b>${sim.totaisQueMudariam.length?' ('+sim.totaisQueMudariam.slice(0,12).map(t=>E(t.numero)+': '+BR(t.antes)+' → '+BR(t.depois)).join(' · ')+') — os produtos que causam isso ficam de fora: '+N0(sim.produtosBarradosPorTotal.length):''}
      · produtos que mudam de etapa: ${N0(sim.produtosQueMudamDeEtapa)}
      <br>Fora da carga — categoria de estoque sem etapa em Base › Categorias: <b>${N0(sim.semEtapa.length)}</b>${sim.semEtapa.length?' ('+[...new Set(sim.semEtapa.map(x=>x.categoria))].map(E).join(', ')+')':''}
      · no arquivo e não na Base: ${N0(sim.foraDaBase.length)}${sim.foraDaBase.length?' ('+sim.foraDaBase.slice(0,8).map(x=>E(x.id)).join(', ')+')':''}
      · na Base e não no arquivo: ${N0(sim.semLinhaNoArquivo.length)}${sim.semLinhaNoArquivo.length?' ('+sim.semLinhaNoArquivo.slice(0,8).map(x=>E(x.id)+' '+E(x.nome)).join(', ')+')':''}
      · nome diferente do arquivo: ${N0(sim.nomeDiferente.length)}</div>`:''}
  </div>`;
  return `<div class="card p-3 mb-3" id="v233-cat" style="border-left:4px solid #2563EB">
   <div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><b><i class="bi bi-tags me-1"></i>Categorias dos produtos</b>
   <div class="sub" style="font-size:12px"><b>Categoria de estoque</b> = quem manuseia e instala (define a etapa, por Base › Categorias). <b>Categoria comercial</b> = como a proposta se organiza para o cliente. Um produto, um registro.</div></div>
   <button class="btn-soft" style="font-size:12px" onclick="V233CAT.ver(0)">fechar</button></div>
   <div class="mt-2" style="font-size:12.5px">${N0(C.produtos)} produtos = ${N0(C.somaDasCategorias)} com categoria comercial${C.semCategoriaComercial?' + '+N0(C.semCategoriaComercial)+' sem':''} <b style="color:${C.fecha?'#198754':'#dc3545'}">${C.fecha?'✓ fecha':'✗ não fecha'}</b></div>
   <div class="mt-1">${chips}</div>${carga}
   <div class="d-flex gap-2 mt-2 flex-wrap"><input class="form-control form-control-sm" style="max-width:280px" placeholder="buscar produto, marca ou ID…" value="${E(f.q||'')}" oninput="V233CAT.q('q',this.value)">
   <select class="form-select form-select-sm" style="max-width:220px" onchange="V233CAT.q('est',this.value)"><option value="">toda categoria de estoque</option>${V.estoques().map(x=>`<option${x===f.est?' selected':''}>${E(x)}</option>`).join('')}</select>
   ${f.com?`<span class="chip">${E(f.com)} <a href="#" onclick="V233CAT.q('com','');V233CAT.ver(1);return false">×</a></span>`:''}</div>
   <div class="tblwrap mt-2" style="max-height:520px;overflow:auto"><table class="tbl" style="font-size:12.5px"><thead><tr><th>ID</th><th>Produto</th><th>Categoria de estoque</th><th>Categoria comercial</th></tr></thead><tbody id="v233-body">${linhas()}</tbody></table></div></div>`
}
V.painel=painel;
const ponte=()=>{const C=V.conferir();return `<div class="d-flex align-items-center gap-2 mb-2" id="v233-ponte"><button class="btn-soft" style="font-size:12px" onclick="V233CAT.ver(1)"><i class="bi bi-tags me-1"></i>Categorias (estoque e comercial)</button><span class="sub" style="font-size:11.5px">${N0(C.somaDasCategorias)} de ${N0(C.produtos)} com categoria comercial</span></div>`};
['dbprodutos','produtos'].forEach(n=>{const f=SCREENS[n];if(typeof f!=='function')return;SCREENS[n]=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;
  const extra=S.v233c?painel():ponte();const i=h.indexOf('<div class="card');return i>=0?h.slice(0,i)+extra+h.slice(i):extra+h}});
})();
