/* =====================================================================================================
   v167 · BASE — "uma visão geral mostra números; os registros moram onde pertencem" (Bruno, 08/11/2026)
   1. Estoque › Painel Geral: a lista "A comprar — crie a cotação do que falta" (uma linha por obra, com botão) vira UM
      cartão-resumo com ponte para o cartão A COMPRAR e o botão "Ver o que falta por obra ›"; a lista inteira, com os
      botões "Criar cotação do que falta", passa a morar em Estoque › Cotações (a tela cujo trabalho é criar cotações).
      Mesmos dados, mesma função (FI.cardFalta / FI.cotar) — nada da cotação foi reescrito.
   2. Base › Produtos é a casa dos custos que faltam: filtro "sem custo de compra (N produtos · M un.)", uma linha por
      produto (fechada; clique abre as unidades) com a quantidade sem custo e o campo "Custo de compra" — gravar escreve
      `custo` em toda unidade do produto que não tem, `custo_fonte` = 'Base › Produtos (digitado por <login> em <data>)',
      um registro no hist da unidade e save(). Início › Estoque, Painel Geral e Estoque mostram só a ponte
      "R$ X = R$ A · N un. com custo + R$ B · M un. sem custo ›" — o link cai em Base › Produtos já filtrado.
   3. Unidades do cliente (produto "Equipamentos do Cliente"): não contam em valor de estoque nem em "sem custo";
      ganham a etiqueta "do cliente" e aparecem como termo da ponte "+ N un. do cliente (não contam)". Nada é apagado:
      se a unidade tinha custo, ele fica guardado em `custo_do_cliente`.
   4. Custos digitados à mão sobrevivem a uma reimportação: S.db._custos_manuais guarda (id → produto, série, custo,
      custo_fonte); criado na 1ª vez a partir das unidades que já têm custo_fonte; reaplicado, idempotente, a cada boot e
      sempre que a lista de unidades muda (reimportação troca os ids → cai para produto + série).
   5. Varredura das visões gerais: Projetos › Painel (lista de 69 obras → resumo + Projetos por obra, já filtrado),
      Painel Geral (lista de cabos → resumo + Cortar Rolo), Comercial › Gestão (rankings longos → 10 primeiros + "ver
      todos"). Os números não mudam: só o lugar da lista.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v167b)return;window.__v167b=true;

const V167=window.V167=window.V167||{};
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
const R$=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const r2=v=>Math.round((+v||0)*100)/100;
const hoje=()=>T(()=>today(),null)||new Date().toISOString().slice(0,10);
const dBR_=iso=>{const s=String(iso||'');return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s};
const login=()=>T(()=>me().login,'')||T(()=>me().nome,'')||'sistema';
const prod=id=>T(()=>get('produtos',id),null)||{};
const unidades=()=>(S.db&&S.db.unidades)||[];
const salvar=()=>{try{save()}catch(e){console.error('v167 save',e)}};
const rerender=()=>{try{renderMain()}catch(e){try{render()}catch(_){}}};
const toast_=(m,bad)=>{try{toast(m,bad)}catch(e){console.log('v167',m)}};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

/* ───────────────────────── estilo ───────────────────────── */
const CSS=`
.v167-tag{display:inline-block;font-size:10.5px;font-weight:600;letter-spacing:.02em;padding:1px 7px;border-radius:999px;background:rgba(120,120,128,.14);color:inherit;vertical-align:middle;margin-left:6px;white-space:nowrap}
.v167-ponte a{color:var(--apple,#0071e3);text-decoration:none;font-weight:600;cursor:pointer}.v167-ponte a:hover{text-decoration:underline}
.v167-resumo{border-left:4px solid #dc3545}
.v167-resumo .v167-big{font-size:26px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.v167-sc input{max-width:140px;display:inline-block}
.v167-sc .v167-us div{padding:1px 0}
.v167-mais{display:block;margin-top:4px;font-size:12.5px;font-weight:600;color:var(--apple,#0071e3);cursor:pointer}
`;
try{const st=document.createElement('style');st.id='v167-css';st.textContent=CSS;document.head.appendChild(st)}catch(e){}

/* ───────────────────────── 3 · unidades do cliente ───────────────────────── */
const CLI_RE=/equipamentos do cliente/i;
const isCli=u=>!!u&&CLI_RE.test(String(prod(u.produto_id).nome||''));
V167.isCliente=isCli;
V167.unidadesCliente=()=>unidades().filter(u=>u.estado!=='baixado'&&isCli(u));
/* idempotente: uma unidade do cliente nunca entra no valor do estoque — o custo que tinha fica guardado, não some */
function normalizaClientes(){let n=0;unidades().forEach(u=>{if(!isCli(u))return;if(+u.custo>0){u.custo_do_cliente=+u.custo;u.custo=0;u.custo_fonte='do cliente — não conta no estoque (v167)';n++}});return n}

/* ───────────────────────── 4 · custos manuais que sobrevivem à reimportação ───────────────────────── */
const mapa=()=>{if(!S.db._custos_manuais||typeof S.db._custos_manuais!=='object')S.db._custos_manuais={};return S.db._custos_manuais};
function registra(u,fonte){const m=mapa();m[u.id]={produto_id:u.produto_id,serie:u.serie||'',custo:+u.custo,custo_fonte:fonte||u.custo_fonte||'',em:hoje()};return m[u.id]}
/* 1ª vez (e a cada boot, para novas digitações feitas por outras telas): toda unidade com custo_fonte e custo > 0 entra no mapa */
function semear(){let n=0;const m=mapa();unidades().forEach(u=>{if(!u.custo_fonte||!(+u.custo>0)||isCli(u))return;const e=m[u.id];if(e&&+e.custo===+u.custo&&e.custo_fonte===u.custo_fonte)return;registra(u);n++});return n}
/* reaplica: pelo id; se a reimportação trocou o id, pelo produto + série (a série gerada é determinística) */
function reaplicar(){const m=S.db._custos_manuais;if(!m)return 0;const us=unidades();const byId=new Map(us.map(u=>[u.id,u]));const byKey=new Map();
  us.forEach(u=>{const k=u.produto_id+'|'+(u.serie||'');if(!byKey.has(k))byKey.set(k,[]);byKey.get(k).push(u)});
  let n=0;Object.keys(m).forEach(id=>{const e=m[id];if(!e||!(+e.custo>0))return;let u=byId.get(id);
    if(!u){const l=byKey.get(e.produto_id+'|'+(e.serie||''))||[];u=l.find(x=>!(+x.custo>0))||l.find(x=>!m[x.id])||null;if(!u)return}
    if(isCli(u))return;
    /* alguém digitou outro custo depois (fonte diferente, custo > 0): vale o mais novo — o mapa aprende */
    if(+u.custo>0&&u.custo_fonte&&u.custo_fonte!==e.custo_fonte){if(u.id!==id)delete m[id];registra(u);return}
    if(+u.custo===+e.custo&&u.custo_fonte===e.custo_fonte){if(u.id!==id){m[u.id]=e;delete m[id]}return}
    u.custo=+e.custo;u.custo_fonte=e.custo_fonte;n++;if(u.id!==id){m[u.id]=e;delete m[id]}});
  return n}
let bootRef=null,bootLen=-1,bootando=false;
function boot(motivo){if(bootando||typeof S==='undefined'||!S||!S.db||!Array.isArray(S.db.unidades))return;bootando=true;try{
  const a=normalizaClientes(),b=semear(),c=reaplicar();bootRef=S.db.unidades;bootLen=S.db.unidades.length;
  V167.ultimoBoot={quando:new Date().toISOString(),motivo:motivo||'',clientesZerados:a,semeados:b,reaplicados:c,noMapa:Object.keys(mapa()).length};
  if(a||b||c){salvar();try{if(c)log('unidades','v167','Custos manuais reaplicados: '+c+' unidade(s) ('+(motivo||'boot')+')')}catch(e){}}
}catch(e){console.error('v167 boot',e)}finally{bootando=false}}
V167.boot=boot;V167.reaplicar=()=>{const n=reaplicar();if(n)salvar();return n};
/* a lista de unidades mudou (reimportação, "Começar do zero", carga de planilha) → reaplica */
function vigia(){try{if(typeof S!=='undefined'&&S&&S.db&&S.db.unidades&&(S.db.unidades!==bootRef||S.db.unidades.length!==bootLen))boot('lista de unidades mudou')}catch(e){}}
boot('carga do arquivo');
/* as cargas (inventário 02/11, planilhas) rodam depois deste arquivo e podem demorar: vigia a cada 1,5 s nos 3 primeiros minutos, depois a cada 10 s */
{const t0=Date.now();const iv=setInterval(()=>{vigia();if(Date.now()-t0>180e3){clearInterval(iv);setInterval(vigia,10e3)}},1500)}
/* e antes de cada gravação: o que uma carga escreveu passa pela reaplicação antes de ir para o localStorage */
try{const s0=window.save;if(typeof s0==='function'&&!s0.__v167){const sv=function(){try{vigia()}catch(e){}return s0.apply(this,arguments)};Object.keys(s0).forEach(k=>{try{sv[k]=s0[k]}catch(e){}});sv.__v167=true;window.save=sv}}catch(e){}
try{const _rm=window.renderMain;if(typeof _rm==='function'&&!_rm.__v167){window.renderMain=function(){vigia();return _rm.apply(this,arguments)};window.renderMain.__v167=true}}catch(e){}

/* ───────────────────────── 2 · a população "sem custo" (a MESMA dos valores: T8().units) ───────────────────────── */
function pop(){const t=T(()=>T8(),null);const us=t?t.units:unidades().filter(u=>u.estado!=='baixado');const bucket=u=>T(()=>bucketOf(u),'');
  const com=[],sem=[],cli=[];let vCom=0,vSem=0;
  us.forEach(u=>{if(bucket(u)==='cliente')return;if(isCli(u)){cli.push(u);return}const c=+u.custo>0?+u.custo:0;if(c>0){com.push(u);vCom+=c}else{sem.push(u);vSem+=(+prod(u.produto_id).custo||0)}});
  const prods=[...new Set(sem.map(u=>u.produto_id))];
  return {us,com,sem,cli,vCom:r2(vCom),vSem:r2(vSem),total:r2(vCom+vSem),totalMotor:t?r2(+t.custoTotal):null,prods}}
V167.pop=pop;
/* a ponte que toda tela de valor mostra: R$ X = R$ A · N com custo + R$ B · M sem custo › (+ do cliente) */
V167.ponteCusto=function(prefixo){const p=pop();
  const sem=p.sem.length?`<a href="javascript:void 0" onclick="V167.irSemCusto()">${N0(p.sem.length)} un. sem custo de compra ›</a>`:'<b>0 un. sem custo de compra</b>';
  const cli=p.cli.length?` + <a href="javascript:void 0" onclick="V167.irCliente()">${N0(p.cli.length)} un. do cliente (não contam)</a>`:'';
  const dif=p.totalMotor!=null&&Math.abs(p.totalMotor-p.total)>0.5?` <span class="sub">(o motor do Painel soma ${R$(p.totalMotor)})</span>`:'';
  return `<span class="v167-ponte" data-v167-ponte="1" data-com="${p.com.length}" data-sem="${p.sem.length}" data-cli="${p.cli.length}">${prefixo||''}<b>${R$(p.total)}</b> = ${R$(p.vCom)} · ${N0(p.com.length)} un. com custo de compra + ${R$(p.vSem)} · ${sem}${p.sem.length?' <span class="sub">(pelo custo do catálogo)</span>':''}${cli}${dif}</span>`};
/* o link "sem custo" cai em Base › Produtos já filtrado nos produtos dessas unidades */
V167.irSemCusto=function(){const p=pop();const recs=p.prods.map(id=>({ids:[id],name:prod(id).nome||id,h:'#/produto/'+id}));
  const nav=()=>{S.v167sc=1;if((location.hash||'').split('?')[0]==='#/dbprodutos')rerender();else location.hash='#/dbprodutos'};
  const W=window.V156;if(W&&typeof W.ir==='function')W.ir({path:'#/dbprodutos',lb:N0(p.sem.length)+' un. sem custo de compra',unid:'produtos',recs,nav,limpa(){S.v167sc=0;rerender()},ponte:`${N0(p.sem.length)} un. em ${N0(p.prods.length)} produto(s) — uma linha por produto`});else nav()};
/* o termo "do cliente" cai no Estoque filtrado no produto do cliente */
V167.irCliente=function(){const cl=V167.unidadesCliente();const pids=[...new Set(cl.map(u=>u.produto_id))];const recs=pids.map(id=>({ids:[id],name:prod(id).nome||id,h:'#/produto/'+id}));
  const W=window.V156;if(W&&typeof W.ir==='function')W.ir({path:'#/estoque',lb:N0(cl.length)+' un. do cliente (não contam)',unid:'produtos',recs,nav(){location.hash='#/estoque'}});else location.hash='#/estoque'};

/* ───────────────────────── 2 · Base › Produtos: o filtro "sem custo de compra" ───────────────────────── */
V167.semCusto=function(on){S.v167sc=on?1:0;if(!on)try{V155_limpar()}catch(e){}rerender()};
V167.tog=function(pid){S.v167open=S.v167open||{};S.v167open[pid]=!S.v167open[pid];rerender()};
V167.setCusto=function(pid,v){let s=String(v==null?'':v).trim().replace(/^R\$\s*/,'');if(/,/.test(s))s=s.replace(/\./g,'').replace(',','.');const n=+s;if(!(n>0))return toast_('Digite um custo de compra maior que zero (ex.: 1.250,00).',true);
  const us=unidades().filter(u=>u.produto_id===pid&&u.estado!=='baixado'&&!(+u.custo>0)&&!isCli(u));if(!us.length)return toast_('Todas as unidades deste produto já têm custo.',true);
  const fonte=`Base › Produtos (digitado por ${login()} em ${dBR_(hoje())})`;
  us.forEach(u=>{u.custo=r2(n);u.custo_fonte=fonte;(u.hist=u.hist||[]).push({em:hoje(),por:login(),tipo:'custo',titulo:'Custo de compra '+R$(n)+' digitado em Base › Produtos',para:'',ref:{}});registra(u,fonte)});
  try{log('unidades',pid,'Custo de compra '+R$(n)+' digitado em Base › Produtos para '+us.length+' unidade(s) de '+(prod(pid).nome||pid))}catch(e){}
  salvar();toast_('Custo de compra '+R$(n)+' gravado em '+N0(us.length)+' unidade(s) de '+(prod(pid).nome||pid));rerender()};
const chipSemCusto=()=>{const p=pop();if(!p.sem.length)return '';return `<span class="chip warn" data-v167-chip="1" style="font-size:11px;cursor:pointer" title="produtos com unidades no inventário sem custo de compra — digite o custo aqui" onclick="V167.semCusto(1)"><i class="bi bi-cash-coin me-1"></i>sem custo de compra (${N0(p.prods.length)} produtos · ${N0(p.sem.length)} un.)</span>`};
function telaSemCusto(){const p=pop();const open=S.v167open||{};
  const by={};p.sem.forEach(u=>{(by[u.produto_id]=by[u.produto_id]||[]).push(u)});
  const inv=pid=>p.us.filter(u=>u.produto_id===pid&&T(()=>bucketOf(u),'')!=='cliente').length;
  const lista=Object.keys(by).map(pid=>({pid,p:prod(pid),us:by[pid]})).sort((a,b)=>b.us.length-a.us.length||String(a.p.marca||'').localeCompare(String(b.p.marca||''))||String(a.p.nome||'').localeCompare(String(b.p.nome||'')));
  const lugar=u=>T(()=>u.local,'')||T(()=>L.pathStr(u.loc_id),'')||'';
  const rows=lista.map(x=>{const o=!!open[x.pid];const cat=+x.p.custo||0;
    /* as unidades abrem DENTRO da linha do produto (não como linhas novas): o filtro do número casa um produto = uma linha */
    const subs=o?`<div class="v167-us mt-1" style="font-size:12px;color:var(--mut,#64748b)">${x.us.map(u=>`<div>· ${E(u.serie||'sem série')}${u.metros!=null?' · '+N0(u.metros)+' m':''} — ${E(lugar(u))}${u.estado?' · '+E(u.estado):''}${u.natureza&&u.natureza!=='venda'?' · '+E(u.natureza):''}</div>`).join('')}</div>`:'';
    return `<tr class="rowlink" data-v155="${E(x.pid)}" onclick="V167.tog('${J(x.pid)}')"><td><b>${o?'▾':'▸'} ${E(x.p.nome||x.pid)}</b><div class="sub" style="font-size:11px">${E(x.p.marca||'')}${x.p.categoria?' · '+E(x.p.categoria):''}</div>${subs}</td><td class="text-end"><span class="chip warn">${N0(x.us.length)}</span><div class="sub" style="font-size:11px">de ${N0(inv(x.pid))} no inventário</div></td><td class="text-end">${cat?R$(cat):'<span class="sub">—</span>'}</td><td onclick="event.stopPropagation()"><input type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="ex.: 1.250,00" title="grava o custo de compra em toda unidade deste produto que ainda não tem; saia do campo para gravar" onchange="V167.setCusto('${J(x.pid)}',this.value)"></td><td><span style="color:#0d6efd;cursor:pointer;font-size:11px;white-space:nowrap" onclick="event.stopPropagation();location.hash='#/produto/${E(x.pid)}'"><i class="bi bi-box-arrow-up-right me-1"></i>ficha</span></td></tr>`}).join('');
  const hd=T(()=>head('Produtos','Um registro por produto, tudo dele aqui: identificação, preço (a Tabela Taag), fiscal e estoque. Comercial, Estoque e Financeiro leem desta mesma linha — não existe outro cadastro de produto.',`<button class="btn-apple" onclick="produtoForm()"><i class="bi bi-plus-lg me-1"></i>Novo produto</button>`),'<h3>Produtos</h3>');
  const bar=`<div class="card p-2 px-3 mb-2 af-bar" id="v167-sc-bar" data-prods="${lista.length}" data-un="${p.sem.length}" style="border-left:4px solid #fd7e14;font-size:13px"><div class="d-flex flex-wrap gap-2 align-items-center"><span><b>Sem custo de compra: ${N0(lista.length)} produtos · ${N0(p.sem.length)} un.</b> <span class="sub">— uma linha por produto; clique na linha para ver as unidades. Digite o custo de compra e saia do campo: ele vai para toda unidade do produto que ainda não tem, com a fonte e a data.</span></span><button class="btn-soft ms-auto" onclick="V167.semCusto(0)">Mostrar todos os produtos ✕</button></div>${p.cli.length?`<div class="sub mt-1" style="font-size:12px">${N0(p.cli.length)} un. do cliente ficam fora desta conta e do valor do estoque (<a href="javascript:void 0" onclick="V167.irCliente()">ver no Estoque</a>).</div>`:''}</div>`;
  const tbl=`<div class="card v167-sc"><div class="tblwrap"><table class="tbl"><thead><tr><th>Produto</th><th class="text-end">Un. sem custo</th><th class="text-end">Custo do catálogo</th><th>Custo de compra (R$)</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="sub">nenhuma unidade sem custo de compra</td></tr>'}</tbody></table></div></div>`;
  return hd+bar+tbl}
try{const _dbp=SCREENS.dbprodutos;if(typeof _dbp==='function'&&!_dbp.__v167){SCREENS.dbprodutos=function(arg){const cat=!arg||arg==='catalogo';
    if(cat&&S.v167sc)return telaSemCusto();
    let h=_dbp.apply(this,arguments);if(typeof h!=='string'||!cat)return h;
    const chip=chipSemCusto();if(!chip)return h;
    const k='<span class="ms-auto d-flex gap-1 flex-wrap">';const i=h.indexOf(k);
    if(i>=0)return h.slice(0,i+k.length)+chip+h.slice(i+k.length);
    const j=h.indexOf('<div class="card');return j>0?h.slice(0,j)+`<div class="mb-2">${chip}</div>`+h.slice(j):h+chip};
  SCREENS.dbprodutos.__v167=true;Object.keys(_dbp).forEach(k=>{try{SCREENS.dbprodutos[k]=_dbp[k]}catch(e){}})}}catch(e){console.error('v167 dbprodutos',e)}
window.addEventListener('hashchange',()=>{try{if(!/^#\/dbprodutos/.test(location.hash||''))S.v167sc=0}catch(e){}});

/* ───────────────────────── 1 · Painel Geral: resumo; Cotações: a lista ───────────────────────── */
const FALTA_RE=/<div class="card p-3 mb-3" id="fi_falta"[\s\S]*?<\/tbody><\/table><\/div><\/div>/;
function cardAComprarResumo(){const rows=T(()=>FI.faltaPorDestino(),[]);if(!rows.length)return '';
  const tot=r2(rows.reduce((a,x)=>a+x.custo,0)),un=rows.reduce((a,x)=>a+x.un,0);const t=T(()=>T8(),{});const tile=+t.acomprar||0;const dif=r2(tile-un);
  const ponte=Math.abs(dif)>0.001
    ?`Ponte com o cartão <b>A COMPRAR</b>: ${N0(tile)} un. = <b>${N0(un)}</b> nesta lista por obra ${dif>0?'+':'−'} ${N0(Math.abs(dif))} un. que a lista por proposta ${dif>0?'dá como reservadas do estoque livre, mas são consignadas / patrimônio (não à venda) — por isso o cartão manda comprar':'conta a mais'}`
    :`O mesmo número do cartão <b>A COMPRAR</b> desta tela: ${N0(un)} un. ✓`;
  return `<div class="card p-3 mb-3 v167-resumo" id="v167_falta" data-n="${rows.length}" data-un="${un}" data-custo="${tot}"><div class="d-flex flex-wrap align-items-center gap-3"><div style="flex:1;min-width:260px"><div class="sub" style="font-size:11px;letter-spacing:.06em">A COMPRAR</div><div class="v167-big">${N0(rows.length)} obras/vendas · ${N0(un)} un. · ${R$(tot)}</div><div class="sub mt-1" style="font-size:12.5px">${ponte}</div></div><a class="btn-apple" href="#/cotacoes" style="white-space:nowrap"><i class="bi bi-cart me-1"></i>Ver o que falta por obra ›</a></div></div>`}
try{const _ep=SCREENS.epainel;if(typeof _ep==='function'&&!_ep.__v167){SCREENS.epainel=function(){let h=_ep.apply(this,arguments);if(typeof h!=='string')return h;
    try{if(FALTA_RE.test(h))h=h.replace(FALTA_RE,cardAComprarResumo())}catch(e){console.error('v167 epainel falta',e)}
    try{const ponte=`<div class="sub mt-1" style="font-size:12.5px">${V167.ponteCusto('Custo de compra: ')}</div>`;const k=h.indexOf('af-bar af-epk');
      if(k>0){const fim=h.indexOf('</div>',k);h=h.slice(0,fim)+ponte+h.slice(fim)}else{const i=h.indexOf('<div class="row');const card=`<div class="card p-2 mb-3 af-bar" style="display:block">${ponte}</div>`;h=i>0?h.slice(0,i)+card+h.slice(i):h+card}}catch(e){console.error('v167 epainel ponte',e)}
    return h};SCREENS.epainel.__v167=true;Object.keys(_ep).forEach(k=>{try{SCREENS.epainel[k]=_ep[k]}catch(e){}})}}catch(e){console.error('v167 epainel',e)}
try{const _cq=SCREENS.cotacoes;if(typeof _cq==='function'&&!_cq.__v167){SCREENS.cotacoes=function(){let h=_cq.apply(this,arguments);if(typeof h!=='string')return h;
    const card=T(()=>FI.cardFalta(),'');if(!card)return h;
    const intro=card.replace('<h6 class="mb-0">A comprar — crie a cotação do que falta','<h6 class="mb-0"><i class="bi bi-cart me-1"></i>A comprar — crie a cotação do que falta').replace('O mesmo número do cartão <b>A COMPRAR</b> desta tela:','O mesmo número do cartão <b>A COMPRAR</b> de <a href="#/epainel">Estoque › Painel Geral</a>:');
    const i=h.indexOf('FLUXO DO COMPRADOR');const k=i>0?h.lastIndexOf('<div class="d-flex',i):-1;
    if(k>0)return h.slice(0,k)+intro+h.slice(k);const j=h.indexOf('<div class="tabs');const e=j>=0?h.indexOf('</div>',j)+6:-1;return e>0?h.slice(0,e)+intro+h.slice(e):intro+h};
  SCREENS.cotacoes.__v167=true;Object.keys(_cq).forEach(k=>{try{SCREENS.cotacoes[k]=_cq[k]}catch(e){}})}}catch(e){console.error('v167 cotacoes',e)}

/* ───────────────────────── 5 · Painel Geral: cabos (medido) viram resumo; a lista mora em Cortar Rolo ───────────────────────── */
try{if(typeof window.medidoLine==='function'&&!window.medidoLine.__v167){window.medidoLine=function(){try{const cabos=(S.db.produtos||[]).filter(p=>p.rastreio==='medido');if(!cabos.length)return '';
    let rolos=0,m=0,dem=0,falta=0,nFalta=0;const vend=(S.db.propostas||[]).filter(x=>['vendida','em_obra'].includes(x.estado));
    cabos.forEach(p=>{const rs=unidades().filter(u=>u.produto_id===p.id&&u.metros!=null&&T(()=>bucketOf(u),'')==='livre');const mm=rs.reduce((a,u)=>a+u.metros,0);const d=vend.reduce((a,x)=>a+blocosDe(x).reduce((b,bl)=>b+bl.itens.filter(l=>(l.substituto||l.produto_id)===p.id).reduce((c,l)=>c+l.qtd,0),0),0);rolos+=rs.length;m+=mm;dem+=d;if(d>mm){falta+=d-mm;nFalta++}});
    return `<div class="card p-2 mb-3" id="v167_cabos" data-prod="${cabos.length}" data-falta="${nFalta}" style="font-size:13px"><b><i class="bi bi-scissors me-1"></i>Cabos (medido, em metros — fora da contagem de unidades):</b> ${N0(cabos.length)} produtos · ${N0(rolos)} rolos · ${N0(m)} m em estoque · ${N0(dem)} m vendidos · ${nFalta?`<span class="chip bad">${N0(nFalta)} com falta · ${N0(r2(falta))} m</span>`:'<span class="chip ok">tudo coberto</span>'} · ${N0(cabos.length-nFalta)} cobertos <a href="#/cortarrolo">Ver cabo a cabo em Cortar Rolo →</a></div>`}catch(e){console.error('v167 cabos',e);return ''}};window.medidoLine.__v167=true}}catch(e){}

/* ───────────────────────── 5 · Projetos › Painel: a lista de obras mora em Projetos por obra ───────────────────────── */
try{const _pp=SCREENS.prjpainel;if(typeof _pp==='function'&&!_pp.__v167){SCREENS.prjpainel=function(){let h=_pp.apply(this,arguments);if(typeof h!=='string'||h.indexOf('id="v161-lista"')<0)return h;
    try{const tp=document.createElement('template');tp.innerHTML=h;const el=tp.content.getElementById('v161-lista');if(!el)return h;
      const n=+el.getAttribute('data-n')||0;const f=el.getAttribute('data-f')||'';const P=window.V161P||{};const lb=f&&P.K&&P.K[f]?P.K[f][0]:'';
      const d=document.createElement('div');d.className='card p-3 mb-3';d.id='v167_prj_lista';d.setAttribute('data-n',String(n));
      d.innerHTML=`<div class="d-flex flex-wrap align-items-center gap-3"><div style="flex:1;min-width:240px"><b>Onde está cada projeto · ${N0(n)} obra(s)${lb?' · '+E(lb):''}</b><div class="sub" style="font-size:12px">a lista, obra por obra, mora em Projetos › Projetos por obra — os números acima abrem lá, já filtrados</div></div><a class="btn-soft" href="javascript:void 0" onclick="V167.prjLista('${J(f)}')">Ver as ${N0(n)} obras ›</a></div>`;
      el.replaceWith(d);return tp.innerHTML}catch(e){console.error('v167 prjpainel',e);return h}};SCREENS.prjpainel.__v167=true;Object.keys(_pp).forEach(k=>{try{SCREENS.prjpainel[k]=_pp[k]}catch(e){}})}}catch(e){console.error('v167 prjpainel',e)}
V167.prjLista=function(k){const P=window.V161P;if(!P||typeof P.resumo!=='function'){location.hash='#/prjobras';return}
  const r=P.resumo();const obras=k&&r.b&&r.b[k]?r.b[k]:r.ea;const lb=k&&P.K&&P.K[k]?P.K[k][0]:'em andamento';
  const recs=obras.map(o=>({ids:[o.id],name:o.nome||o.id,h:'#/prjobras/'+o.id}));
  const nav=()=>{try{if(window.C&&C.ui)C.ui.prjobras={situacao:'Em andamento'}}catch(e){}location.hash='#/prjobras';rerender()};
  const W=window.V156;if(W&&typeof W.ir==='function')W.ir({path:'#/prjobras',lb:N0(obras.length)+' obras · '+lb,unid:'obras',recs,nav});else nav()};
/* clicar num número do Painel de projetos (V161P.filtro) agora abre Projetos por obra filtrado, em vez de filtrar uma lista que não está mais ali */
try{const P=window.V161P;if(P&&typeof P.filtro==='function'&&!P.filtro.__v167){const f0=P.filtro;P.filtro=function(k){if(!k){P.f=null;return f0.apply(this,arguments)}P.f=null;V167.prjLista(k)};P.filtro.__v167=true}}catch(e){}

/* ───────────────────────── 2 · Estoque (lista): a ponte do custo em cima da tabela ───────────────────────── */
try{const _es=SCREENS.estoque;if(typeof _es==='function'&&!_es.__v167){SCREENS.estoque=function(){let h=_es.apply(this,arguments);if(typeof h!=='string')return h;
    try{const bar=`<div class="card p-2 px-3 mb-3 af-bar" id="v167_est_ponte" style="display:block;font-size:13px">${V167.ponteCusto('Custo de compra do inventário: ')}</div>`;
      const i=h.indexOf('TODOS OS PRODUTOS');const k=i>0?h.lastIndexOf('<div class="card',i):-1;
      if(k>0)h=h.slice(0,k)+bar+h.slice(k);else{const j=h.indexOf('<div class="card');h=j>0?h.slice(0,j)+bar+h.slice(j):h+bar}}catch(e){console.error('v167 estoque',e)}
    return h};SCREENS.estoque.__v167=true;Object.keys(_es).forEach(k=>{try{SCREENS.estoque[k]=_es[k]}catch(e){}})}}catch(e){console.error('v167 estoque',e)}

/* ───────────────────────── DOM: Início › Estoque (ponte), etiqueta "do cliente", Gestão (rankings) ───────────────────────── */
function pontInicio(){if(!/^#\/(home)?$/.test((location.hash||'').split('?')[0])&&(location.hash||'')!=='')return;
  const sec=document.getElementById('v130_s_b5');if(!sec||sec.querySelector('#v167_inicio_ponte'))return;
  const card=sec.querySelector('.card.wide')||sec;const pontes=card.querySelectorAll('.vx-ponte');const last=pontes.length?pontes[pontes.length-1]:null;
  const d=document.createElement('div');d.className='vx-ponte';d.id='v167_inicio_ponte';d.innerHTML=V167.ponteCusto('Custo de compra: ')+' <span class="ok">✓ o mesmo de Estoque › Painel Geral e Base › Produtos</span>';
  if(last)last.insertAdjacentElement('afterend',d);else card.appendChild(d)}
function tagCliente(){const m=document.getElementById('main');if(!m)return;
  m.querySelectorAll('table tbody tr').forEach(tr=>{if(tr.hasAttribute('data-v167tag'))return;const b=tr.querySelector('td b, td strong, td a');const t=(tr.firstElementChild||tr).textContent||'';if(!CLI_RE.test(t))return;tr.setAttribute('data-v167tag','1');if(b&&!b.querySelector('.v167-tag')){const s=document.createElement('span');s.className='v167-tag';s.title='equipamento do cliente guardado no nosso estoque — não conta no valor nem em "sem custo"';s.textContent='do cliente';b.appendChild(s)}})}
function gestaoRankings(){if(!/^#\/gestao/.test(location.hash||''))return;const m=document.getElementById('main');if(!m)return;const LIM=10;
  m.querySelectorAll('div').forEach(box=>{if(box.hasAttribute('data-v167rk')||box.closest('table,#v155-ov'))return;const kids=[...box.children];if(kids.length<=LIM+2)return;
    const k0=kids.find(k=>/d-flex/.test(k.className||'')&&/py-1/.test(k.className||''));if(!k0)return;const cls=k0.className;const same=kids.filter(k=>k.className===cls);if(same.length<=LIM+2||same.length<kids.length-2)return;
    box.setAttribute('data-v167rk','1');same.slice(LIM).forEach(k=>{k.style.setProperty('display','none','important');k.setAttribute('data-v167hid','1')});
    const a=document.createElement('a');a.className='v167-mais';a.href='javascript:void 0';a.textContent=`+ ${N0(same.length-LIM)} — ver todos os ${N0(same.length)} ›`;
    a.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const hid=box.querySelectorAll('[data-v167hid]');const aberto=a.getAttribute('data-open')==='1';hid.forEach(k=>{if(aberto)k.style.setProperty('display','none','important');else k.style.removeProperty('display')});a.setAttribute('data-open',aberto?'0':'1');a.textContent=aberto?`+ ${N0(same.length-LIM)} — ver todos os ${N0(same.length)} ›`:`mostrar só os ${LIM} primeiros ▴`});
    box.appendChild(a)})}
const pos=()=>{try{pontInicio()}catch(e){}try{tagCliente()}catch(e){}try{gestaoRankings()}catch(e){}};
try{if(window.V156&&Array.isArray(V156.pos))V156.pos.push(pos);else{let q=false;new MutationObserver(()=>{if(q)return;q=true;setTimeout(()=>{q=false;pos()},40)}).observe(document.body,{childList:true,subtree:true})}}catch(e){}
window.addEventListener('hashchange',()=>setTimeout(pos,120));setTimeout(pos,500);

try{if(document.getElementById('main')&&typeof renderMain==='function')renderMain()}catch(e){}
})();
