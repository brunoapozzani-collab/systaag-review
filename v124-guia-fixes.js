/* ===== guia/fix-capA.js ===== */
/* fix-capA.js — UI gaps found while mapping chapter A (Cadastros — quem trabalha no processo) by clicks */
(function(){
'use strict';
if(window.__FIX_CAPA)return;window.__FIX_CAPA=true;
if(typeof S==='undefined'||!S.db||typeof A==='undefined')return;

/* 1 · Base › Pessoas › Novo colaborador with Classificação = "Custo direto de obra (CMV)" (the técnicos Marcos and
   Cleiton need it: the Apontamento de obra lists only CMV fichas). "Começar do zero" leaves S.db.escala = {} (no
   .alloc / .semana), so A.novoColaborador crashed AFTER pushing the row into the folha ("Cannot set properties of
   undefined"): half-saved ficha, red toast. Same fix as fix-cap1 (each chapter harness loads only its own file):
   give the weekly schedule its alloc table before the action runs. */
if(typeof A.novoColaborador==='function'&&!A.novoColaborador.__capA){const _nc=A.novoColaborador;A.novoColaborador=function(){
  try{const e=S.db.escala;if(e&&typeof e==='object'){if(!e.alloc||typeof e.alloc!=='object')e.alloc={};if(!Array.isArray(e.semana))e.semana=['Seg','Ter','Qua','Qui','Sex']}
    if(!S.db.rhdocs||typeof S.db.rhdocs!=='object')S.db.rhdocs={}}catch(_){}
  return _nc.apply(this,arguments)};
  Object.keys(_nc).forEach(k=>{try{A.novoColaborador[k]=_nc[k]}catch(_){}});A.novoColaborador.__capA=true}

})();

/* ===== guia/fix-cap1.js ===== */
/* fix-cap1.js — UI gaps found while mapping chapter 1 by clicks */
(function(){
'use strict';
if(window.__FIX_CAP1)return;window.__FIX_CAP1=true;
if(typeof S==='undefined'||!S.db||typeof A==='undefined'||typeof SCREENS==='undefined')return;
const FX=window.FIX1=window.FIX1||{};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

/* 1 · Base › Pessoas › Novo colaborador: the form opens with Classificação = "Custo direto de obra (CMV)".
   On an empty system S.db.escala exists but has no .alloc/.semana, so A.novoColaborador crashed AFTER pushing the
   row into the folha ("Cannot set properties of undefined (setting 'Mariana Costa')"): half-saved person, red toast,
   the Comercial list (CONS) not rebuilt. Fix: make sure the weekly schedule has its tables before the action. */
if(typeof A.novoColaborador==='function'&&!A.novoColaborador.__fx1){const _nc=A.novoColaborador;A.novoColaborador=function(){
  try{const e=S.db.escala;if(e&&typeof e==='object'){if(!e.alloc||typeof e.alloc!=='object')e.alloc={};
      if(!Array.isArray(e.semana)){try{e.semana=semanaAtual()}catch(_){e.semana=[]}}}
    if(!S.db.rhdocs||typeof S.db.rhdocs!=='object')S.db.rhdocs={}}catch(_){}
  return _nc.apply(this,arguments)};
  Object.keys(_nc).forEach(k=>{try{A.novoColaborador[k]=_nc[k]}catch(_){}});A.novoColaborador.__fx1=true}

/* 2 · Base › Clientes · Obras · Propostas › "+ Cliente" only worked through three prompt() boxes in a row
   (nome → sigla → arquiteto, typed free text, no list of partners, no check that the sigla is free).
   Fix: the button opens one small form — Nome, Sigla, Arquitetura (the partners from the Base) — and saves with
   the same A.novoCliente the prompts used. */
FX.novoCliente=function(){
  FX.fecharCliente();
  const arqs=(S.db.parceiros||[]).filter(p=>!p.inativo).slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
  const w=document.createElement('div');w.id='fx1Cli';w.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:10px';
  w.innerHTML=`<div class="card p-3" style="width:min(560px,96vw)"><div class="d-flex justify-content-between align-items-start mb-2"><div><h5 class="mb-0">Novo cliente</h5><div class="sub">Entra na Base agora — Comercial, Operação e Financeiro leem este mesmo cadastro.</div></div><button class="iconbtn" type="button" onclick="FIX1.fecharCliente()"><i class="bi bi-x-lg"></i></button></div>
  <div class="row g-2"><div class="col-md-8"><label class="sub">Nome do cliente *</label><input id="fx1_cli_nome" class="form-control form-control-sm"></div>
  <div class="col-md-4"><label class="sub">Sigla (3–4 letras) *</label><input id="fx1_cli_sigla" class="form-control form-control-sm" maxlength="6" style="text-transform:uppercase"></div>
  <div class="col-12"><label class="sub">Arquitetura (parceiro que trouxe o cliente)</label><select id="fx1_cli_arq" class="form-select form-select-sm"><option value="">— nenhuma —</option>${arqs.map(p=>`<option value="${esc(p.nome)}">${esc(p.nome)}</option>`).join('')}</select></div>
  <div class="col-12"><div class="sub" style="font-size:11px;letter-spacing:.06em;font-weight:700;margin-top:4px">DADOS DA NOTA (ficam no cliente e valem para todas as propostas dele)</div></div>
  <div class="col-md-4"><label class="sub">Pessoa</label><select id="fx1_cli_tipo" class="form-select form-select-sm"><option value="PF">Física (CPF)</option><option value="PJ">Jurídica (CNPJ)</option></select></div>
  <div class="col-md-8"><label class="sub">E-mail</label><input id="fx1_cli_email" type="email" class="form-control form-control-sm"></div>
  <div class="col-12"><label class="sub">Endereço (faturamento / boleto)</label><input id="fx1_cli_end" class="form-control form-control-sm"></div></div>
  <div class="d-flex justify-content-end gap-2 mt-3"><button class="btn-soft" type="button" onclick="FIX1.fecharCliente()">Cancelar</button><button class="btn-apple" type="button" id="fx1_cli_salvar" onclick="FIX1.salvarCliente()">Salvar cliente</button></div></div>`;
  w.addEventListener('click',e=>{if(e.target===w)FX.fecharCliente()});document.body.appendChild(w);
  setTimeout(()=>{const i=document.getElementById('fx1_cli_nome');if(i)i.focus()},0)};
FX.fecharCliente=function(){const m=document.getElementById('fx1Cli');if(m)m.remove()};
FX.salvarCliente=function(){
  const v=id=>(document.getElementById(id)||{}).value||'';
  const nome=v('fx1_cli_nome').trim(),sigla=v('fx1_cli_sigla').trim().toUpperCase(),arq=v('fx1_cli_arq');
  const id=run(()=>{
    if(!nome)throw new RuleError('Informe o nome do cliente.');
    if(!/^[A-Z0-9]{2,6}$/.test(sigla))throw new RuleError('A sigla tem 2 a 6 letras/números, sem espaço.');
    const s=(S.db.clientes||[]).find(c=>String(c.sigla).toUpperCase()===sigla);if(s)throw new RuleError(`A sigla ${sigla} já é do cliente ${s.nome}.`);
    const n=(S.db.clientes||[]).find(c=>nz(c.nome)===nz(nome));if(n)throw new RuleError(`Esse cliente já existe na Base (${n.sigla}).`);
    const cid=A.novoCliente({nome,sigla,arquiteto:arq});const c=get('clientes',cid);
    /* the same record the proposal's Fechamento (nome/CPF/endereço da nota) writes to: cliente.faturamento */
    c.faturamento=Object.assign({razao:nome,doc:'',endereco:'',email:'',tipo:'PF'},c.faturamento||{},{razao:nome,tipo:v('fx1_cli_tipo')==='PJ'?'PJ':'PF',email:v('fx1_cli_email').trim(),endereco:v('fx1_cli_end').trim()});
    put('clientes',c,'dados da nota fiscal (cadastro do cliente)');return cid},'Cliente criado na Base');
  if(id)FX.fecharCliente()};
const _dbc=SCREENS.dbclientes;
if(typeof _dbc==='function')SCREENS.dbclientes=function(){let h=_dbc.apply(this,arguments);if(typeof h!=='string')return h;
  return h.replace(/<button class="btn-apple" onclick="const n=ask\('Nome do cliente'\)[^"]*">/,'<button class="btn-apple" type="button" data-fx1="novo-cliente" onclick="FIX1.novoCliente()">')};

/* 3 · Financeiro › Contas & Pessoas › Comissões & RT › Indicadores (RT): "RT paga" showed "Proporcional ao recebimento"
   for a partner nobody had decided for (it is only the fallback). Picking the option already shown fires no change,
   so the Financeiro could not record its choice. Fix: while the partner has no choice saved, the select starts on
   "— escolher —"; picking any option saves it (A.setModoParceiro, the same call the select already had). */
if(typeof SCREENS.fcontas==='function'){const _fc=SCREENS.fcontas;SCREENS.fcontas=function(arg){let h=_fc.apply(this,arguments);if(typeof h!=='string'||arg!=='comissoes')return h;
  try{(S.db.parceiros||[]).forEach(i=>{if(i.rt_modo)return;const k='id="indm_'+i.id+'"';const a=h.indexOf(k);if(a<0)return;const s=h.lastIndexOf('<select',a);const e=h.indexOf('</select>',a);if(s<0||e<0)return;
    let seg=h.slice(s,e);seg=seg.replace(/ selected(="[^"]*")?/g,'');const o=seg.indexOf('<option');if(o<0)return;seg=seg.slice(0,o)+'<option value="" selected disabled>— escolher (padrão: proporcional) —</option>'+seg.slice(o);h=h.slice(0,s)+seg+h.slice(e)})}catch(e){}
  return h}}

})();

/* ===== guia/fix-cap2.js ===== */
/* fix-cap2.js — UI gaps found while mapping chapter 2 by clicks */
/* Chapter 2 (Projetos) needs no fix: every action of passo2() has a working button/form on
   Projetos › Projetos por obra › <obra> (Editar dados de projeto · Gerar cronograma · lápis do entregável ·
   aba Prazos · + revisão). Proven by /home/claude/guia/cap2/run.js. */

/* ===== guia/fix-cap3.js ===== */
/* fix-cap3.js — UI gaps found while mapping chapter 3 by clicks */
/* Resultado do mapeamento (29/10): o capítulo 3 inteiro (Locais → Entrada manual → Fornecedor → Cotação do que falta →
   orçamento → Aprovar → Dar entrada com NF → Separar) já funciona só com cliques — nenhum prompt()/confirm(), nenhum botão
   que só mostra aviso. Nada a consertar aqui. Prova: /home/claude/guia/cap3/run.js */

/* ===== guia/fix-cap4.js ===== */
/* fix-cap4.js — UI gaps found while mapping chapter 4 by clicks */
(function(){
'use strict';
if(window.__FIX_CAP4)return;window.__FIX_CAP4=true;
if(typeof S==='undefined'||!S.db||typeof A==='undefined')return;

/* 1 · Base › Pessoas › Novo colaborador with Classificação = "Custo direto de obra (CMV)". The Apontamento de obra
   lists ONLY CMV fichas in "Técnico *" — after "Começar do zero" the list is empty, so the técnicos Marcos and
   Cleiton must get a ficha first. On that empty system S.db.escala = {} (no .alloc/.semana) and A.novoColaborador
   crashed AFTER pushing the row into the folha ("Cannot set properties of undefined"): half-saved ficha, red toast.
   Same fix as fix-cap1 / fix-capA (each chapter harness loads only its own file; the flags keep it single). */
if(typeof A.novoColaborador==='function'&&!A.novoColaborador.__fx1&&!A.novoColaborador.__capA&&!A.novoColaborador.__cap4){
  const _nc=A.novoColaborador;A.novoColaborador=function(){
    try{const e=S.db.escala;if(e&&typeof e==='object'){if(!e.alloc||typeof e.alloc!=='object')e.alloc={};
        if(!Array.isArray(e.semana)){try{e.semana=semanaAtual()}catch(_){e.semana=['Seg','Ter','Qua','Qui','Sex']}}}
      if(!S.db.rhdocs||typeof S.db.rhdocs!=='object')S.db.rhdocs={}}catch(_){}
    return _nc.apply(this,arguments)};
  Object.keys(_nc).forEach(k=>{try{A.novoColaborador[k]=_nc[k]}catch(_){}});A.novoColaborador.__cap4=true}

/* 2 · Operação › Obras › ficha da obra › cartão "Entrega técnica": the "Registrar entrega" button asked the date through
   ask() — the prompt() box ("Data da entrega", OK/Cancelar) — so the step only worked through a dialog.
   Fix: the date is a field in the card itself (starts on today), and the same button registers it with the same
   A.setEntrega(oid,'realizada',data). */
if(typeof SCREENS!=='undefined'&&typeof SCREENS.obras==='function'&&!SCREENS.obras.__cap4){
  const _ob=SCREENS.obras;
  SCREENS.obras=function(){
    const h=_ob.apply(this,arguments);if(typeof h!=='string'||h.indexOf('btaag_bt_entrega')<0)return h;
    return h.replace(/<button class="btn-apple" id="btaag_bt_entrega" onclick="const d=ask\(\\?'Data da entrega\\?',today\(\)\);if\(d\)run\(\(\)=>A\.setEntrega\('([^']+)','realizada',d\),'Entrega técnica registrada'\)">/,
      (m,oid)=>'<span class="d-flex align-items-center gap-2"><label class="sub" for="fx4_dt_entrega" style="font-size:12px">Data da entrega</label>'+
        '<input type="date" id="fx4_dt_entrega" class="form-control form-control-sm" style="width:150px" value="'+today()+'">'+
        '<button class="btn-apple" id="btaag_bt_entrega" onclick="const d=(document.getElementById(\'fx4_dt_entrega\')||{}).value||today();run(()=>A.setEntrega(\''+oid+'\',\'realizada\',d),\'Entrega técnica registrada\')">')
      .replace(/(id="btaag_bt_entrega"[^>]*>[\s\S]*?Registrar entrega<\/button>)/,'$1</span>')};
  Object.keys(_ob).forEach(k=>{try{SCREENS.obras[k]=_ob[k]}catch(_){}});SCREENS.obras.__cap4=true}

})();

/* ===== guia/fix-cap5.js ===== */
/* fix-cap5.js — UI gaps found while mapping chapter 5 by clicks */
(function(){
'use strict';
if(window.__fixCap5)return;window.__fixCap5=true;
if(typeof S==='undefined'||!S.db||typeof FN==='undefined')return;

/* C5-01 · Financeiro › A pagar › "Notas que o Estoque recebeu e ainda não viraram conta" listava também as
   ENTRADAS MANUAIS do Estoque (inventário inicial, peças de reposição). Essas entradas não têm pedido nem
   fornecedor — a própria tela de Entrada manual diz "sem pedido de compra … nunca para compra" — então nunca
   viram conta a pagar. Apareciam como linhas "— · R$ 0,00" com um botão "Abrir o pedido" que levava a
   #/cotacao/null (tela vazia), e o título dizia "(3)" quando só havia 1 nota de verdade para aprovar.
   Conserto: a lista de notas a aprovar ignora entrada manual sem pedido. Nada é apagado; a entrada continua
   no Estoque. */
(function(){
  const f=FN.notasPend;if(typeof f!=='function'||f.__cap5)return;
  const g=function(){const r=f.apply(this,arguments);return Array.isArray(r)?r.filter(e=>!(e&&e.manual&&!e.pedido_id)):r};
  g.__cap5=true;FN.notasPend=g;
})();

/* C5-02 · Financeiro › Apontamento de obra: a lista "Técnico *" só mostra quem está na folha com classe CMV.
   Na história (e em qualquer base que começou do zero) os técnicos que já apontaram nesta obra — Marcos,
   Cleiton — não estão na folha, então a lista vinha VAZIA e o apontamento não podia ser salvo por cliques
   ("Escolha o técnico."). A.apontarObra aceita o nome (é assim que os apontamentos anteriores nasceram).
   Conserto: a lista ganha também os técnicos que já têm apontamento gravado (sem repetir quem está na folha),
   e um técnico fora da folha mantém a disciplina dos apontamentos dele (Cleiton = programação), em vez de
   cair em "instalação". */
(function(){
  const lbD={instalacao:'Instalação',programacao:'Programação',projeto:'Projeto',estrutural:'Estrutural'};
  const historico=()=>{const m=new Map();(S.db.apontamentos||[]).forEach(a=>{if(a&&a.tecnico&&!m.has(a.tecnico))m.set(a.tecnico,a.disc||'instalacao')});return m};
  const naFolha=n=>(S.db.folha||[]).some(p=>p.nome===n);
  const esc_=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const f=SCREENS.apontamento;
  if(typeof f==='function'&&!f.__cap5){
    const g=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;
      const ini=h.indexOf('<select id="ap_tec"');if(ini<0)return h;const fim=h.indexOf('</select>',ini);if(fim<0)return h;
      const ja=h.slice(ini,fim);const extra=[...historico()].filter(([n])=>!naFolha(n)&&ja.indexOf('value="'+esc_(n)+'"')<0)
        .map(([n,d])=>`<option value="${esc_(n)}" data-cap5="historico">${esc_(n)} · ${lbD[d]||d}</option>`).join('');
      return extra?h.slice(0,fim)+extra+h.slice(fim):h};
    Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});g.__cap5=true;SCREENS.apontamento=g}
  const a=A.apontarObra;
  if(typeof a==='function'&&!a.__cap5){
    const b=function(x){if(x&&x.tecnico&&!x.disc&&!naFolha(x.tecnico)){const d=historico().get(x.tecnico);if(d)x=Object.assign({},x,{disc:d})}return a.call(this,x)};
    Object.keys(a).forEach(k=>{try{b[k]=a[k]}catch(e){}});b.__cap5=true;A.apontarObra=b}
})();

/* C5-03 · Financeiro › Lançamentos: o botão "Estornar" (v124 F06) é colocado na última coluna da tabela, ao
   lado do lápis. Essa coluna tem width:3% (≈33 px) e a tabela usa table-layout:fixed com overflow:hidden nas
   células — o lápis ocupa a coluna inteira e o "Estornar" ficava CORTADO, invisível: a pessoa não tinha onde
   clicar (só um script achava o botão; com text-overflow:ellipsis o navegador troca o botão inteiro por "…").
   Conserto: quando a tela tem botões/selos de estorno, a última coluna passa a 12% — cabem o lápis e o
   "Estornar" (ou o selo "estornado"/"estorno") — e essa célula não troca mais o botão por "…". Nada mais muda. */
(function(){
  const f=SCREENS.finlanc;if(typeof f!=='function'||f.__cap5)return;
  const g=function(){const h=f.apply(this,arguments);if(typeof h!=='string'||h.indexOf('data-v124-estorno')<0)return h;
    const i=h.lastIndexOf('width:3%;cursor:default');if(i<0)return h;
    return h.slice(0,i)+'width:12%;cursor:default'+h.slice(i+'width:3%;cursor:default'.length)};
  if(!document.getElementById('cap5-css')){const st=document.createElement('style');st.id='cap5-css';
    st.textContent='.lx table.lx-t td:has(> [data-v124-estorno]){text-overflow:clip}';document.head.appendChild(st)}
  Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});g.__cap5=true;SCREENS.finlanc=g;
})();

})();

/* ===== guia/fix-cap6.js ===== */
/* fix-cap6.js — UI gaps found while mapping chapter 6 by clicks */
/* ------------------------------------------------------------------------------------------------------------
   C6-1 · Pós-venda › Chamados: a linha do chamado era um beco sem saída.
   (a) Não havia como ABRIR a OS a partir do chamado. A tela que lança a peça do estoque e fecha a OS
       (Garantia / Cobrável / Contrato) é #/fpvos/<OS>, e o menu do Pós-venda não leva até ela — só um link
       escondido no rodapé ("Solicitações") → aba "Ordens de Serviço" → "Fechar OS". Quem abriu o chamado
       não tinha um clique para continuar.
   (b) A OS herda a obra, a proposta vendida e as séries instaladas (F08 em v124-fixes.js), mas nenhuma tela
       mostrava isso: a pessoa não tinha como VER que nada precisou ser redigitado.
   Conserto (só leitura + navegação, nenhum dado novo): em cada chamado, abaixo do cliente/obra, a linha
   "Proposta … · N equipamentos instalados" (agrupado por produto; clicar abre as séries), e na 1ª coluna o
   botão "Abrir OS" (aberta) / "Ver OS" (fechada), que leva a #/fpvos/<OS>.
   ------------------------------------------------------------------------------------------------------------ */
(function(){
  'use strict';
  if(typeof SCREENS!=='object'||typeof SCREENS.chamados!=='function'||SCREENS.chamados.__c6)return;
  const _ch=SCREENS.chamados;
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const hashOS=id=>(window.FPV&&typeof FPV.hashOS==='function')?FPV.hashOS(id):'#/fpvos/'+encodeURIComponent(id);
  function herdou(os){
    const p=os.proposta_id&&typeof get==='function'?get('propostas',os.proposta_id):null;
    const eq=os.equipamentos||[];
    if(!p&&!eq.length)return '';
    const por={};eq.forEach(e=>{const k=e.nome||e.produto_id||'equipamento';(por[k]=por[k]||[]).push(e.serie)});
    const resumo=Object.keys(por).map(k=>por[k].length+'× '+esc(String(k).trim())).join(' · ');
    const lista=Object.keys(por).map(k=>`<div><b>${por[k].length}× ${esc(String(k).trim())}</b>: <span class="mono">${por[k].map(esc).join(', ')}</span></div>`).join('');
    const prop=p?`Proposta <b>${esc(String(p.nome||p.numero||'').split(' · ')[0])}</b>`:'';
    return `<div class="sub" style="font-size:11.5px;margin-top:2px" data-c6-herdou-linha="${esc(os.id)}">${prop}${prop&&eq.length?' · ':''}${eq.length?`<details data-c6-herdou="${esc(os.id)}" style="display:inline"><summary style="display:inline;cursor:pointer;text-decoration:underline">${eq.length} equipamentos instalados</summary> <span>(${resumo})</span><div style="margin-top:4px">${lista}</div></details>`:''}</div>`}
  const f=function(){
    const h=_ch.apply(this,arguments);if(typeof h!=='string')return h;
    try{
      const t=document.createElement('template');t.innerHTML=h;
      t.content.querySelectorAll('#v123_chamados tr[data-chamado]').forEach(tr=>{
        const id=tr.getAttribute('data-chamado');if(!id||/^at:/.test(id))return;
        const os=(S.db.os||[]).find(o=>o.id===id);if(!os)return;
        const td=tr.children;
        if(td[1])td[1].insertAdjacentHTML('beforeend',herdou(os));
        if(td[0])td[0].insertAdjacentHTML('beforeend',`<div><button class="btn-soft" style="font-size:12px;margin-top:4px" data-c6-abrir-os="${esc(id)}" onclick="location.hash='${hashOS(id).replace(/'/g,"\\'")}'">${os.estado==='aberta'?'Abrir OS':'Ver OS'}</button></div>`)});
      return t.innerHTML}catch(e){console.warn('[fix-cap6] chamados',e);return h}};
  f.__c6=true;Object.keys(_ch).forEach(k=>{try{f[k]=_ch[k]}catch(e){}});SCREENS.chamados=f;
  try{if(typeof route==='function'&&route().k==='chamados')renderMain()}catch(e){}
})();

/* ===== guia/fix-cap7.js ===== */
/* fix-cap7.js — UI gaps found while mapping chapter 7 by clicks */
/* Nenhum conserto necessário: o capítulo 7 inteiro (Ret/Troc com cliente → Diretoria → Financeiro → consolidado,
   cotação → orçamento → aprovar → entrada NF 004688 → separar → despachar) já se faz só com cliques nas telas
   existentes, sem prompt()/confirm()/alert(). Prova: /home/claude/guia/cap7/run.js (22/22 passos). */

/* ===== guia/fix-main.js ===== */
/* fix-main.js — F23 · Financeiro › DRE › "Ponte do mês: resultado → caixa"
   The cash side of the bridge read only S.db.fin.lancamentos (planilha + manual entries) and left out the ERP's
   paid titles, which live in FST.lancamentos as derived entries. In the demo month the bridge said cash moved
   −R$ 3.596,30, while R$ 50.000 had come in from the client and R$ 12.310 had gone to the supplier — the gap was
   hidden inside "outros ajustes". The bridge now reads the same single ledger the Fluxo de caixa reads
   (FST.lancamentos, by data de caixa), so the two screens agree and "outros" only holds real accrual items. */
(function(){
'use strict';
if(window.__FIX_MAIN_F23)return;window.__FIX_MAIN_F23=true;
if(typeof FC!=='object'||typeof FC.bridgeMes!=='function'||typeof FST!=='object')return;
const r2=v=>Math.round((+v||0)*100)/100;
const ymx=d=>String(d||'').slice(0,7);
const _b=FC.bridgeMes;
FC.bridgeMes=function(m,uni){
  const p=_b.apply(this,arguments);if(!p||typeof p!=='object')return p;
  try{
    const dc=l=>{try{return FC.caixa(l)}catch(e){return l.data_caixa||l.data}};
    const mov=(FST.lancamentos||[]).filter(l=>l&&l.tipo!=='transferencia'&&ymx(dc(l))===p.m);
    const entrou=r2(mov.filter(l=>l.tipo==='entrada').reduce((x,l)=>x+(+l.valor||0),0));
    const saiu=r2(mov.filter(l=>l.tipo==='saida').reduce((x,l)=>x+(+l.valor||0),0));
    p.entrou=entrou;p.saiu=saiu;p.varCaixa=r2(entrou-saiu);p.nMov=mov.length;
    p.outros=r2(p.varCaixa-p.res+p.aReceber-p.aPagar);
  }catch(e){console.error('F23 ponte do mês',e)}
  return p};
})();

/* F24 · the CRM did not see the company's people. "Responsável pelo relacionamento" offered only LINK E CO. and
   "Responsável pela próxima ação" only BRUNO POZZANI, even after Mariana Costa had her account — adding her
   there was possible only through a prompt box inside the CRM. Owner's rule: ONE people/access base feeds every
   department. Now every active user account of the Comercial side (perfil comercial / pré-vendas / gestão /
   diretoria, or a person in the Comercial department) is mirrored into the CRM's own tables: as a CRM user (so she
   can own a próxima ação) and as a responsável comercial + relacionamento. Additive only; nothing is renamed or
   deleted, and a person already there (same name) is never added twice. */
(function(){
'use strict';
if(window.__FIX_MAIN_F24)return;window.__FIX_MAIN_F24=true;
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const COM=/^(comercial|prevendas|gestao|diretoria)$/i;
function pessoasComerciais(){
  const out=[];const us=(S.db.usuarios||[]).filter(u=>u&&u.ativo!==false);
  us.forEach(u=>{if(u.login==='bruno.pozzani')return;const dep=String(u.dep||u.departamento||u.area||'');
    if(COM.test(String(u.perfil||''))||/comercial/i.test(dep))out.push({nome:u.nome||u.login,login:u.login,area:/diretoria/i.test(u.perfil||'')?'Diretoria':'Comercial',pessoa_id:u.pessoa_id||null})});
  (S.db.folha||[]).forEach(f=>{if(f&&/comercial/i.test(String(f.dep||f.departamento||''))&&!out.some(o=>nz(o.nome)===nz(f.nome)))out.push({nome:f.nome,login:'',area:'Comercial',pessoa_id:f.id||null})});
  return out}
function sync(){
  const T=window.CRM_T;if(!T||!Array.isArray(T.responsaveis)||!Array.isArray(T.usuarios))return false;
  let ch=false;const nid=a=>a.reduce((m,r)=>Math.max(m,+r.id||0),0)+1;
  pessoasComerciais().forEach(p=>{const N=nz(p.nome);if(!N)return;
    ['comercial','relacionamento'].forEach(tipo=>{if(!T.responsaveis.some(r=>nz(r.nome)===N&&r.tipo===tipo)){T.responsaveis.push({id:nid(T.responsaveis),nome:N,tipo,ativo:'1',pessoa_id:p.pessoa_id});ch=true}});
    if(!T.usuarios.some(u=>nz(u.nome)===N||(p.login&&u.login===p.login))){T.usuarios.push({id:nid(T.usuarios),nome:N,login:p.login||N,area:p.area,perfil:'padrao',email:'',telefone:'',ativo:1,senha_hash:''});ch=true}});
  if(ch){try{if(typeof window.CRM_persistT==='function')window.CRM_persistT()}catch(e){}}
  return ch}
window.__crmSyncPessoas=sync;
const _save=window.save;
if(typeof _save==='function'){window.save=function(){const r=_save.apply(this,arguments);try{sync()}catch(e){console.error('F24',e)}return r}}
try{sync()}catch(e){}
})();

/* ===== guia/fix-e2e.js ===== */
/* fix-e2e.js — fixes found by the END-TO-END run of "Aprender fazendo" (all 12 chapters chained, from the empty system,
   with the guide running). Written 29/10/2026. */

/* E1 · CRM: the address did not follow the CRM's own menu.
   Inside Relacionamento (CRM) the side sub-menu is hidden (body.crm-full) and the learner moves with the CRM's own buttons
   inside the frame (Parceiros, Interações, Oportunidades…). Those clicks changed the CRM view but never the address: the page
   stayed on #/crmhome. The guide compares the address with the step's screen, so on "Clique em Novo parceiro" it kept saying
   "Você está em outra tela. Vá por: Relacionamento (CRM) › Parceiros" while the learner WAS on Parceiros, and "Me mostre onde"
   refused to highlight. There was no click path to #/crmparceiros, #/crminteracoes or #/crmoport at all.
   Now, when the CRM frame reports the view it rendered (crmFrameRendered), the address is set to that view's route with
   history.replaceState — no hashchange, so no re-render and no frame reload (an open partner card or form stays open). */
(function(){
'use strict';
if(window.__FIX_E2E_E1)return;window.__FIX_E2E_E1=true;
/* same map as the CRM embedding (VIEWS / KEY_OF there are not global) */
const ROTA={home:'crmhome',parceiros:'crmparceiros',parceiro:'crmparceiros',interacoes:'crminteracoes',tarefas:'crmtarefas',oportunidades:'crmoport',esteira:'crmesteira',gestao:'crmgestao',relatorios:'crmgestao',semanal:'crmgestao',config:'crmconfig'};
const _r=window.crmFrameRendered;if(typeof _r!=='function')return;
window.crmFrameRendered=function(name){const r=_r.apply(this,arguments);
  try{const k=ROTA[name];const cur=String(location.hash||'').replace(/^#\/?/,'').split('/')[0];
    /* only while the CRM is on screen, and never over a single-partner route (#/crmparceiro/<id>) that is already right */
    if(k&&/^crm/.test(cur)&&cur!==k&&!(cur==='crmparceiro'&&name==='parceiro')){history.replaceState(history.state,'','#/'+k);
      document.querySelectorAll('#subnav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+k))}}catch(e){}
  return r};
})();

