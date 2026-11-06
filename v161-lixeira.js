/* v161 · EXCLUIR SÓ NA BASE (Bruno, 05/11/2026 — decisão final, substitui "todo registro excluível na própria tela")
   "O único lugar onde se exclui uma proposta, uma obra, um cliente é dentro da Base. Hoje há tantos lugares para excluir
    que alguém pode apagar sem querer uma informação muito importante — e isso é perigoso."
   O que este arquivo faz (o v155-lixeira.js ganhou só a trava "naBase" no botão 🗑 e no confirmar):
   1. Fora da Base (toda tela cujo SEC_OF não é 'bd') nenhum controle exclui registro principal — proposta, obra, cliente,
      negociação, pessoa, parceiro, fornecedor, produto (e unidade, que sai com ele), proposta do Pós-venda, lançamento do Financeiro. Os botões antigos do
      core (A.excluirProposta, A.excluirObra, A.rmObra, A.excluirDeal, L.clienteDel, L.obraDel, COP.pos.delP, COP.pos.delUser,
      V139_excluir, bdDel, FUI.remover…) somem da tela E as funções recusam ("Excluir só na Base") se chamadas de outro lugar.
   2. Na Base, toda exclusão de registro principal passa pela Lixeira do v155 (restaurável, com o que veio junto). Os botões
      antigos "apagar" que apagavam de vez (bdDel de produtos/parceiros, "apagar" proposta na árvore) saem onde o 🗑 da Lixeira
      já está na linha; se forem chamados, viram a exclusão pela Lixeira.
   3. Tipos que antes só se excluíam fora da Base ganham a sua tela na Base: Negociações e Lançamentos financeiros (com busca
      e o 🗑 da Lixeira). As propostas do Pós-venda já são propostas da Base (Clientes · Obras · Propostas). O "Apagar" do lançamento no Financeiro vira "Excluir na Base ›",
      que abre Base › Lançamentos financeiros já filtrado nesse lançamento.
   4. "Cancelar proposta" (muda o estado, não exclui) fica onde está, mas troca o ícone de lixeira por ⊗ — lixeira só na Base.
   Itens de linha dentro de um registro em edição (item da proposta, peça da OS, anexo, foto, filtro, linha de lista) ficam. */
(function(){
'use strict';
if(window.__v161lx)return;window.__v161lx=true;
if(typeof S==='undefined'||!S.db)return;

const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const N0=n=>T(()=>(+n||0).toLocaleString('pt-BR'),String(n));
const BRL=v=>'R$ '+T(()=>(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),'0,00');
const dBR=d=>{if(!d)return '—';const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));return m?m[3]+'/'+m[2]+'/'+m[1]:String(d)};
const V=()=>window.V155||{};
const naBase=()=>T(()=>V().naBase(),false);
const kAtual=()=>T(()=>route().k,'');
const msgBase=col=>T(()=>V().soBase(col),'Excluir só na Base.');
const avisa=col=>{try{toast(msgBase(col),true)}catch(e){}};
/* para as funções chamadas dentro de run(): '__need__' é a mensagem que o core cala (run devolve null sem toast de "Feito") */
const PARA=()=>{throw new Error('__need__')};
const ROOTS=['obras','propostas','clientes','negociacoes','pessoas','produtos','fornecedores','parceiros','kits','marcas','categorias','locais','veiculos','contas','catserv','receitas','plataformas','kpmarcas','subetapas'];

/* ───────────── 1 · as funções antigas de exclusão: fora da Base recusam; na Base viram a exclusão pela Lixeira ───────────── */
function guarda(obj,nome,col,opt){opt=opt||{};try{if(!obj||typeof obj[nome]!=='function'||obj[nome].__v161)return false;const f=obj[nome];
  const g=function(id){const c=typeof col==='function'?col.apply(this,arguments):col;
    if(c===null)return f.apply(this,arguments);                 /* não é registro principal: segue como era */
    if(!naBase()){avisa(c);if(opt.run)PARA();return}
    if(c&&id!=null&&V().excluir){V().excluir(c,id);if(opt.run)PARA();return}
    return f.apply(this,arguments)};
  g.__v161=1;g.__orig=f;obj[nome]=g;return true}catch(e){console.error('v161 guarda '+nome,e);return false}}
function instalaGuardas(){
  const A_=T(()=>A,null),L_=T(()=>L,null),POS=T(()=>COP.pos,null);
  if(A_){guarda(A_,'excluirProposta','propostas',{run:1});guarda(A_,'excluirObra','obras',{run:1});guarda(A_,'rmObra','obras',{run:1});
    guarda(A_,'excluirDeal','negociacoes',{run:1});guarda(A_,'excluirCliente','clientes',{run:1});guarda(A_,'delBanco','contas',{run:1})}
  if(L_){guarda(L_,'clienteDel','clientes',{run:1});guarda(L_,'obraDel','obras',{run:1});guarda(L_,'catDel','categorias',{run:1});guarda(L_,'marcaDel','marcas',{run:1})}
  /* proposta do Pós-venda = uma proposta da Base (S.db.at_propostas é vista de S.db.propostas, linha 'posvenda') */
  if(POS){if(typeof POS.delP==='function'&&!POS.delP.__v161){const f=POS.delP;const g=function(){if(!naBase()){avisa('propostas');return}return f.apply(this,arguments)};g.__v161=1;POS.delP=g}
    /* usuário do Pós-venda = uma pessoa: sai junto com ela em Base › Pessoas */
    if(typeof POS.delUser==='function'&&!POS.delUser.__v161){const f=POS.delUser;const g=function(){if(!naBase()){avisa('pessoas');return}return f.apply(this,arguments)};g.__v161=1;POS.delUser=g}}
  if(window.AF107)guarda(window.AF107,'apagarCliente','clientes');
  if(typeof window.V139_excluir==='function'&&!window.V139_excluir.__v161){const f=window.V139_excluir;const g=function(){if(!naBase()){avisa('pessoas');return}return f.apply(this,arguments)};g.__v161=1;window.V139_excluir=g}
  /* Financeiro › lançamento: "Apagar" leva para Base › Lançamentos financeiros, já filtrado */
  if(window.FUI&&typeof FUI.remover==='function'&&!FUI.remover.__v161){const f=FUI.remover;const g=function(id){if(naBase())return f.apply(this,arguments);
      if(String(id).indexOf('erp:')===0)return f.apply(this,arguments);   /* o core já recusa os do ERP com a explicação dele */
      try{window.fcloseModal&&fcloseModal()}catch(e){}location.hash='#/dbfinlanc/'+encodeURIComponent(id)};g.__v161=1;FUI.remover=g}
  /* bdDel (grades da Base): registro principal vai pela Lixeira; fora da Base, recusa */
  if(typeof window.bdDel==='function'&&!window.bdDel.__v161){const f=window.bdDel;const g=function(tabela,id,path){
      const raiz=!path&&ROOTS.includes(tabela)&&T(()=>(S.db[tabela]||[]).some(r=>r&&r.id===id),false);
      if(!naBase()){if(raiz||ROOTS.includes(tabela)){avisa(tabela);return}return f.apply(this,arguments)}
      if(raiz&&V().excluir){V().excluir(tabela,id);return}
      return f.apply(this,arguments)};g.__v161=1;window.bdDel=g;try{bdDel=g}catch(e){}}
}
instalaGuardas();setTimeout(instalaGuardas,1500);setTimeout(instalaGuardas,6000);

/* ───────────── 2 · os botões: fora da Base somem; na Base, os antigos "apagar de vez" saem onde já há o 🗑 da Lixeira ───────────── */
/* exclusão de registro principal — onclick que contém: */
const MESTRE=['A.excluirProposta(','A.excluirObra(','A.rmObra(','A.excluirDeal(','A.excluirCliente(','L.clienteDel(','L.obraDel(','L.catDel(','L.marcaDel(','A.delBanco(','AF107.apagarCliente(',
  'V139_excluir(','COP.pos.delP(','COP.pos.delUser(','V155.excluir(',"S.s64.confirm[",'S.db.fornecedores=S.db.fornecedores.filter','S.db.produtos=S.db.produtos.filter'];
const SEL_MESTRE=MESTRE.map(s=>'[onclick*="'+s.replace(/"/g,'\\"')+'"]').join(',')+','+ROOTS.map(t=>`[onclick*="bdDel('${t}'"]`).join(',');
/* na Base: as exclusões antigas que apagavam de vez (o 🗑 do v155 na mesma linha as substitui) */
const SEL_VELHO_BASE=['A.excluirProposta(','A.excluirObra(','A.rmObra(','L.clienteDel(','L.obraDel(','AF107.apagarCliente('].map(s=>'[onclick*="'+s+'"]').join(',')+','+ROOTS.map(t=>`[onclick*="bdDel('${t}'"]`).join(',');
let limpando=false,nFora=0;
function limpa(){if(limpando)return;limpando=true;try{
  const base=naBase();
  if(!base){
    document.querySelectorAll(SEL_MESTRE).forEach(el=>{if(el.closest('#v155-ov'))return;
      const b=el.closest('button,a,[role=button]')||el;if(b.closest('#v155-ov'))return;b.remove();nFora++});
    /* o painel "Excluir a proposta …? Sim, excluir" (editor) e o "Excluir <cotação>? …" ficam sem o gatilho; o da proposta some */
    document.querySelectorAll('#main span').forEach(sp=>{if(/^Excluir a proposta .* Não dá para desfazer\.$/.test((sp.textContent||'').trim()))sp.remove()});
    /* Financeiro › lançamento (modal): "Apagar" → "Excluir na Base ›" */
    document.querySelectorAll('[onclick^="FUI.remover("]').forEach(b=>{if(b.__v161)return;b.__v161=1;const q=/FUI\.remover\('([^']+)'\)/.exec(b.getAttribute('onclick')||'');if(!q)return;
      b.textContent='Excluir na Base ›';b.title='Excluir só na Base — abre Base de dados › Lançamentos financeiros, já filtrado neste lançamento (vai para a Lixeira e pode voltar). Para desfazer um lançamento certo-mas-errado, use Estornar.';
      b.classList.remove('danger');b.style.opacity='.8'});
  }else{
    document.querySelectorAll('#main '+SEL_VELHO_BASE.split(',').join(',#main ')).forEach(el=>{const tr=el.closest('tr');const b=el.closest('button,a')||el;
      if(tr&&tr.querySelector('[data-v155]'))b.remove()});
  }
  /* "Cancelar proposta" não exclui — tira o ícone de lixeira dele (lixeira só na Base) */
  document.querySelectorAll('[onclick*="A.cancelarProp("] i.bi-trash,[onclick*="A.cancelarProp("] i.bi-trash3').forEach(i=>{i.className='bi bi-x-circle';const b=i.closest('button');if(b&&!b.title)b.title='Cancelar a proposta (não exclui)'});
}catch(e){console.error('v161 limpa',e)}finally{limpando=false}}

/* ───────────── 3 · as telas novas da Base ───────────── */
const ST=S.v161=S.v161||{q:{}};
const TELAS={
  dbnegociacoes:{t:'Negociações',col:'negociacoes',ic:'bi-kanban',
    sub:'As negociações da Pipeline (a carteira do Comercial). Excluir uma negociação é só aqui: ela vai para a Lixeira com as tarefas dela e volta inteira no Restaurar. As propostas da negociação ficam — moram na obra.',
    rows:()=>S.db.negociacoes||[],
    busca:n=>[n.cliente_nome,n.codinome,n.etapa,n.consultor,n.frente,n.id].join(' '),
    cols:[['Cliente',n=>E(n.cliente_nome||n.codinome||'—')+(n.codinome&&n.cliente_nome&&n.codinome!==n.cliente_nome?`<div class="sub" style="font-size:11px">${E(n.codinome)}</div>`:'')],
      ['Etapa',n=>`<span class="chip">${E(n.etapa||'—')}</span>`],['Consultor',n=>E(n.consultor||'—')],['Valor',n=>BRL(n.valor),'text-end'],['Criada',n=>dBR(n.criado)],['Resultado',n=>E(n.resultado||'em aberto')]]},
  dbfinlanc:{t:'Lançamentos financeiros',col:'fin.lancamentos',ic:'bi-cash-coin',
    sub:'Os lançamentos do Financeiro (planilha e manuais). Excluir é só aqui: vai para a Lixeira e volta no Restaurar. Para desfazer um lançamento que aconteceu mas está errado, use <b>Estornar</b> em Financeiro › Lançamentos — o histórico fica.',
    rows:()=>T(()=>S.db.fin.lancamentos,[])||[],
    busca:l=>[l.descricao,l.favorecido,l.conta,l.cdc,l.obra_id,l.fonte,l.id,l.valor].join(' '),
    cols:[['Data',l=>dBR(l.data||l.data_caixa)],['Descrição',l=>E(l.descricao||'—')+(l.favorecido?`<div class="sub" style="font-size:11px">${E(l.favorecido)}</div>`:'')],
      ['Tipo',l=>`<span class="chip">${E(l.tipo||'—')}</span>`],['Valor',l=>BRL(l.valor),'text-end'],['Conta',l=>E(l.conta||'—')],['Origem',l=>E(l.fonte||'—')]]}
};
const LIM=100;
function tela(k,arg){const cfg=TELAS[k];const all=cfg.rows();const pode=T(()=>V().pode(),false);
  const id=arg?decodeURIComponent(arg):'';const q=(ST.q[k]||'').trim().toLowerCase();
  let sub=all;if(id)sub=all.filter(r=>r&&String(r.id)===id);else if(q.length>=2)sub=all.filter(r=>r&&T(()=>cfg.busca(r),'').toLowerCase().indexOf(q)>=0);
  const vis=sub.slice(0,LIM);
  const hd=(typeof head==='function'?head(cfg.t,cfg.sub):`<h1 class="h1">${E(cfg.t)}</h1><div class="sub">${cfg.sub}</div>`);
  const lix=T(()=>(S.db.lixeira||[]).filter(b=>b.raiz&&b.raiz.c===cfg.col).length,0);
  const topo=`<div class="card p-3 mb-3 d-flex flex-row flex-wrap gap-4 align-items-center" style="border-radius:18px">
    <div><div style="font-size:40px;font-weight:800;line-height:1">${N0(all.length)}</div><div class="sub">${E(cfg.t.toLowerCase())} na Base</div></div>
    <div><div style="font-size:40px;font-weight:800;line-height:1;opacity:.45">${N0(lix)}</div><div class="sub"><a href="#/dblixeira">na Lixeira</a> (podem voltar)</div></div>
    <div class="ms-auto" style="min-width:260px">${id?`<div class="chip" style="font-size:13px">Filtrado: ${N0(sub.length)} de ${N0(all.length)} · <a href="#/${k}">ver todos</a></div>`:
      `<input class="form-control" id="v161-q" placeholder="Buscar (mín. 2 letras)…" value="${E(ST.q[k]||'')}" oninput="V161.busca('${k}',this.value)">`}</div></div>`;
  const aviso=pode?'':`<div class="card p-2 mb-2 sub" style="border-radius:12px"><i class="bi bi-lock me-1"></i>Excluir registros é uma permissão de Gestor — peça em Pessoas &amp; Cultura › Usuários e permissões.</div>`;
  const linhas=vis.map(r=>`<tr>${cfg.cols.map(c=>`<td class="${c[2]||''}">${T(()=>c[1](r),'—')}</td>`).join('')}<td class="text-end" style="width:44px">${pode?`<button class="v155-tr" data-v161="${E(cfg.col)}|${E(r.id)}" title="Excluir ${E(T(()=>V().tipo(cfg.col).s,'registro'))} (vai para a Lixeira)" onclick="V155.excluir('${J(cfg.col)}','${J(r.id)}')"><i class="bi bi-trash3"></i></button>`:''}</td></tr>`).join('');
  const rodape=`<div class="sub mt-2" style="font-size:12px">Mostrando ${N0(vis.length)} de ${N0(sub.length)}${sub.length!==all.length?' (de '+N0(all.length)+' no total)':''}${sub.length>LIM?' — busque para achar os outros':''}.</div>`;
  const tabela=all.length?`<div class="card p-0" style="border-radius:16px;overflow:auto"><table class="tbl table table-sm mb-0 fx2-wrapped"><thead><tr>${cfg.cols.map(c=>`<th class="${c[2]||''}">${E(c[0])}</th>`).join('')}<th></th></tr></thead><tbody>${linhas||`<tr><td colspan="${cfg.cols.length+1}" class="sub p-3">Nada encontrado.</td></tr>`}</tbody></table></div>${rodape}`
    :`<div class="card p-4 text-center" style="border-radius:18px"><div style="font-size:40px;opacity:.35"><i class="bi ${cfg.ic}"></i></div><div class="sub mt-1">Nenhum registro ainda.</div></div>`;
  return hd+topo+aviso+tabela}
let tq=null;
window.V161=Object.assign(window.V161||{},{naBase,limpa,busca(k,v){ST.q[k]=v;clearTimeout(tq);tq=setTimeout(()=>{try{render()}catch(e){try{renderMain()}catch(e2){}}
  setTimeout(()=>{const i=document.getElementById('v161-q');if(i){i.focus();const n=i.value.length;i.setSelectionRange(n,n)}},30)},280)},
  contar(){/* para o teste: controles visíveis agora que excluem registro principal */const vis=el=>el.offsetParent!==null||!!el.closest('#modalRoot');
    const els=[...document.querySelectorAll(SEL_MESTRE+',[data-v155],#v155-hdbtn,[data-v161],[onclick^="FUI.remover("]')].filter(vis).filter(el=>!el.closest('#v155-ov'));
    return els.filter(el=>!(/^FUI\.remover\(/.test(el.getAttribute('onclick')||'')&&/Excluir na Base/.test(el.textContent))).length}});
try{Object.keys(TELAS).forEach(k=>{SCREENS[k]=function(arg){return tela(k,arg)};LABEL[k]=TELAS[k].t;SEC_OF[k]='bd';if(window.OWNER)OWNER[k]='bd'})}catch(e){console.error('v161 telas',e)}
function menu(){try{const bd=NAV.find(s=>s.id==='bd');if(!bd)return;const ks=Object.keys(TELAS);if(ks.every(k=>bd.items.some(i=>i[0]===k)))return;
  ks.forEach(k=>{if(bd.items.some(i=>i[0]===k))return;const li=bd.items.findIndex(i=>i[0]==='dblixeira');const it=[k,TELAS[k].t];if(li>=0)bd.items.splice(li,0,it);else bd.items.push(it)})}catch(e){}}
menu();

/* ───────────── 4 · instalação ───────────── */
try{const _rm=window.renderMain;if(typeof _rm==='function'&&!_rm.__v161){const g=function(){menu();const r=_rm.apply(this,arguments);try{instalaGuardas();limpa()}catch(e){}return r};
  for(const k in _rm)try{g[k]=_rm[k]}catch(e){}g.__v161=1;window.renderMain=g;try{renderMain=g}catch(e){}}}catch(e){console.error('v161 renderMain',e)}
try{const _rn=window.renderNav;if(typeof _rn==='function'&&!_rn.__v161){const g=function(){menu();return _rn.apply(this,arguments)};for(const k in _rn)try{g[k]=_rn[k]}catch(e){}g.__v161=1;window.renderNav=g;try{renderNav=g}catch(e){}}}catch(e){}
try{let t=null;const mo=new MutationObserver(ms=>{if(limpando)return;if(!ms.some(x=>x.addedNodes&&x.addedNodes.length))return;clearTimeout(t);t=setTimeout(limpa,140)});
  const st=()=>{if(document.body)mo.observe(document.body,{childList:true,subtree:true});else setTimeout(st,300)};st()}catch(e){}
window.addEventListener('hashchange',()=>setTimeout(limpa,200));
setTimeout(()=>{menu();try{renderNav()}catch(e){}limpa()},1600);
})();

/* v161c · CRM (iframe próprio): "Excluir parceiro" também só na Base — achado da auditoria 06/11 (324 → 323 sem passar pela Lixeira) */
(function(){
'use strict';
const MSG='Excluir parceiro só na Base — abra Base de dados › Parceiros (vai para a Lixeira e pode voltar).';
function trava(){try{const f=document.getElementById('crmFrame');const w=f&&f.contentWindow;if(!w||!w.document)return;
  if(typeof w.excluirParceiro==='function'&&!w.excluirParceiro.__v161){const g=function(){try{(typeof w.toast==='function'?w.toast(MSG,true):(typeof toast==='function'&&toast(MSG,true)))}catch(e){}return false};g.__v161=1;w.excluirParceiro=g}
  if(!w.__v161mo&&w.document.body){w.__v161mo=1;const some=()=>{w.document.querySelectorAll('[onclick*="excluirParceiro("]').forEach(b=>b.remove())};some();
    try{new w.MutationObserver(some).observe(w.document.body,{childList:true,subtree:true})}catch(e){}}
}catch(e){}}
function liga(){const f=document.getElementById('crmFrame');if(f&&!f.__v161lx){f.__v161lx=1;f.addEventListener('load',()=>{trava();setTimeout(trava,800)})}trava()}
try{new MutationObserver(liga).observe(document.body||document.documentElement,{childList:true,subtree:false})}catch(e){}
setInterval(liga,2000);liga();
})();
