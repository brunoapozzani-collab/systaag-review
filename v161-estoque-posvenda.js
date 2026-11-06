/* =====================================================================================================
   v161 · ESTOQUE "SEM PROPÓSITO" + PÓS-VENDA FALA UMA LÍNGUA SÓ (Bruno, 05–06/11/2026)

   E1 · Estoque › Painel Geral dizia "ESTOQUE VENDÁVEL 435 un. (435 livre)" e "SEM PROPÓSITO 416 un.", com as propostas
        pedindo 0. Causa (código, não dado): a conta do "sem propósito" (semPropositoList) e o motor T8 deixavam de fora
        os produtos medidos em metros (bobinas de cabo, isMedido) — 19 bobinas no estoque do Bruno. O livre (nodeStats /
        CANON) conta essas bobinas; o sem propósito não. O Início chamava a mesma diferença de "19 un. sem custo no motor
        do Painel" — não era custo, eram as bobinas fora do motor.
        Agora: sem propósito = livre − o que as propostas pedem, contando cada unidade livre (bobinas incluídas, uma
        bobina = uma unidade, como no livre). O R$ é o custo de compra (custo da unidade; vazio → custo do produto, a
        mesma regra do Início) e diz sobre quantas unidades ele está calculado; as unidades sem custo ficam numa lista
        clicável. T8 (o motor do Painel e do Início) passa a contar as bobinas — Início › Estoque e Estoque › Painel
        Geral mostram o mesmo número.
   A1/A2 · Pós-venda: cada número definido UMA vez em V161POS.num(), lendo a Base (CONTROLE_DE_AT carregado pela v157,
        o Pipeline da v159, as obras da Mestra). Regras:
        · Pipeline: negociação cujo consultor é "AT" ou "Dani" (Danielle Collato) é da frente Pós-venda (Bruno) — a Base
          guarda frente='posvenda' nelas; Início, Pipeline e Gestão filtram pela mesma frente.
        · Obras finalizadas (clientes do Pós-venda) = obras Concluídas da Operação + em Assistência técnica + casas do
          Controle de AT (obras legado) + "local a definir". Uma obra em andamento ou cancelada não entra só porque tem
          data de entrega preenchida (a conta antiga somava 13 "sistema completo" em andamento e 1 cancelada).
        · Propostas do Pós-venda = cobradas (vendas da linha AT, as mesmas da meta) + sem cobrança + planos de serviço.
        · Chamados abertos = atendimentos do Controle de AT ainda não concluídos em campo + solicitações (OS) abertas.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161ep)return;window.__v161ep=true;
if(typeof S==='undefined'||!S.db||typeof SCREENS!=='object')return;
const T=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R0=v=>'R$ '+Math.round(+v||0).toLocaleString('pt-BR');
const R2=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dBR=d=>/^\d{4}-\d{2}-\d{2}/.test(d||'')?String(d).slice(0,10).split('-').reverse().join('/'):'—';
const hoje=()=>T(()=>today(),new Date().toISOString().slice(0,10));
const rr=()=>{try{renderMain()}catch(e){try{render()}catch(_){}}};

/* ═════════════════════════════ E1 · SEM PROPÓSITO ═════════════════════════════ */
const custoCompra=u=>{const p=T(()=>get('produtos',u.produto_id),null)||{};return (+u.custo>0)?+u.custo:(+p.custo||0)};
const INV=()=>T(()=>INVS(),['SP','RJ']);
const livreDe=(inv)=>S.db.unidades.filter(u=>u.estado!=='baixado'&&bucketOf(u)==='livre'&&!naoVenda(u)&&(!inv||invDeUnit(u)===inv));
/* por produto e por inventário: sobra = livre − pedido (produto medido: a demanda é em metros e é atendida por corte,
   nenhuma bobina fica reservada — igual ao CANON/invDemand, que nunca contam demanda de medido) */
function spLista(inv){const out={};const invs=inv?[inv]:INV();
  invs.forEach(iv=>{const L=livreDe(iv);const g={};L.forEach(u=>{(g[u.produto_id]=g[u.produto_id]||[]).push(u)});
    Object.keys(g).forEach(pid=>{const us=g[pid];const med=T(()=>isMedido(pid),false);
      const ped=med?0:T(()=>prodInv(pid,iv).pedido,0);const sob=Math.max(0,us.length-ped);if(!sob)return;
      const ord=us.slice().sort((a,b)=>custoCompra(a)-custoCompra(b));const sobU=ord.slice(ord.length-sob);
      const metrosPed=med?T(()=>Q.compute().rows.filter(r=>r.pid===pid&&invDe(r.pr)===iv).reduce((a,r)=>a+Math.max(0,r.qtd-r.ent-r.alo),0),0):0;
      const x=out[pid]=out[pid]||{p:T(()=>get('produtos',pid),null)||{id:pid,nome:pid,marca:''},livre:0,demanda:0,sobra:0,custo:0,units:[],sobraUnits:[],semCusto:0,medido:med,metrosPed:0};
      x.livre+=us.length;x.demanda+=ped;x.sobra+=sob;x.units=x.units.concat(us);x.sobraUnits=x.sobraUnits.concat(sobU);
      x.custo+=sobU.reduce((a,u)=>a+custoCompra(u),0);x.semCusto+=sobU.filter(u=>!(custoCompra(u)>0)).length;x.metrosPed+=metrosPed})});
  return Object.values(out).sort((a,b)=>b.custo-a.custo||b.sobra-a.sobra)}
function spResumo(inv){const l=spLista(inv);const livre=livreDe(inv).length;const sob=l.reduce((a,x)=>a+x.sobra,0);
  const med=l.filter(x=>x.medido).reduce((a,x)=>a+x.sobra,0);const semC=l.reduce((a,x)=>a+x.semCusto,0);
  return {lista:l,livre,sobra:sob,pedidas:livre-sob,custo:l.reduce((a,x)=>a+x.custo,0),medido:med,pecas:sob-med,semCusto:semC,comCusto:sob-semC}}
/* a lista que o Painel Geral, a tela Sem propósito e o Capital parado usam */
try{semPropositoList=inv=>spLista(inv||null)}catch(e){console.error('v161 semPropositoList',e)}
/* T8: as bobinas (medido) entram nas unidades, no livre, no sem propósito e no custo */
try{const _T8=T8;T8=function(uf,rf){const r=_T8.apply(this,arguments);try{
    const med=S.db.unidades.filter(u=>u.estado!=='baixado'&&isMedido(u.produto_id)&&(!uf||uf(u)));
    med.forEach(u=>{r.units.push(u);r.total++;const c=custoCompra(u);
      if(bucketOf(u)==='cliente'){r.cliente++;return}
      r.custoTotal+=c;const k=situacao(u);
      if(k==='livre'){r.livre++;r.livreBruto=(r.livreBruto||0)+1;r.sobra++;r.custoLivre+=c;r.custoParado+=c}else if(k==='alocado')r.alocado++;else r.travado++});
    if(!uf&&!rf){const s=spResumo(null);r.sobra=s.sobra;r.custoParado=s.custo;r.semCustoParado=s.semCusto}
  }catch(e){console.error('v161 T8',e)}return r};T8.__v161=true}catch(e){console.error('v161 T8 wrap',e)}

const spLink=(f,inv)=>`S.spInv='${inv||''}';S.spF='${f||''}';location.hash='#/semproposito'`;
function spPonte(s,onBubble){const stop=onBubble?'event.preventDefault();event.stopPropagation();':'';
  const a=(txt,f)=>`<span role="button" style="display:inline;text-decoration:underline dotted;cursor:pointer" onclick="${stop}${spLink(f)}">${txt}</span>`;
  return `${a(N0(s.sobra)+' sem propósito','')} = ${N0(s.livre)} livres − ${N0(s.pedidas)} que as propostas pedem`+
    (s.medido?` · são ${N0(s.pecas)} peças + ${a(N0(s.medido)+' bobinas de cabo','medido')}`:'')+
    ` · ${R0(s.custo)} ao custo de compra sobre ${N0(s.comCusto)} un. com custo`+(s.semCusto?` + ${a(N0(s.semCusto)+' sem custo','semcusto')}`:'')}

/* Painel Geral: o cartão SEM PROPÓSITO e a ponte logo abaixo dos cartões */
try{const _ep=SCREENS.epainel;SCREENS.epainel=function(){let h=_ep.apply(this,arguments);if(typeof h!=='string')return h;try{const s=spResumo(null);
    h=h.replace(/(SEM PROPÓSITO<\/div><div[^>]*>)\s*[\d.]+ un\.(<\/div><div class="sub" style="font-size:12px">)livres que nenhuma proposta pede · [^<]*? parados/,
      (m,a,b)=>`${a}${N0(s.sobra)} un.${b}livres que nenhuma proposta pede · ${R0(s.custo)} parados ao custo de compra (sobre ${N0(s.comCusto)} un.)`+(s.semCusto?` · <span role="button" style="display:inline;text-decoration:underline dotted;cursor:pointer" onclick="event.preventDefault();event.stopPropagation();${spLink('semcusto')}">${N0(s.semCusto)} sem custo</span>`:''));
    const card=`<div class="card p-2 mb-3 v161-sp" style="display:block;font-size:13px;border-left:4px solid #fd7e14"><b>Ponte:</b> ${spPonte(s)} <span class="sub">· o mesmo número no Início › Estoque</span></div>`;
    const i=h.indexOf('POR INVENTÁRIO');const k=i>0?h.lastIndexOf('<div class="card',i):-1;if(k>0)h=h.slice(0,k)+card+h.slice(k)}catch(e){console.error('v161 epainel',e)}return h};
  Object.keys(_ep).forEach(k=>{try{SCREENS.epainel[k]=_ep[k]}catch(e){}})}catch(e){}

/* a tela Sem propósito: uma linha por produto (clique abre as unidades), filtros Todos / bobinas / sem custo */
S.spExp=S.spExp||{};
window.V161_spTog=pid=>{S.spExp[pid]=!S.spExp[pid];rr()};
SCREENS.semproposito=function(){const inv=S.spInv||'';const f=S.spF||'';const s=spResumo(inv||null);let list=s.lista;
  if(f==='medido')list=list.filter(x=>x.medido);if(f==='semcusto')list=list.filter(x=>x.semCusto);
  const un=x=>f==='semcusto'?x.sobraUnits.filter(u=>!(custoCompra(u)>0)):x.sobraUnits;
  const tot=list.reduce((a,x)=>a+un(x).length,0),tr=list.reduce((a,x)=>a+un(x).reduce((b,u)=>b+custoCompra(u),0),0);
  const chip=(v,l,n)=>`<button class="${f===v?'on':''}" onclick="S.spF='${v}';renderMain()">${l} <b>${N0(n)}</b></button>`;
  const rows=[];list.forEach(x=>{const us=un(x);const open=!!S.spExp[x.p.id];
    rows.push(`<tr class="rowlink" onclick="V161_spTog('${J(x.p.id)}')"><td><b>${open?'▾':'▸'} ${E(x.p.nome)}</b>${x.medido?' <span class="chip info" style="font-size:10px">bobina · metros</span>':''}</td><td>${E(x.p.marca||'')}</td><td class="text-end">${N0(x.livre)}</td><td class="text-end">${x.demanda?N0(x.demanda):(x.metrosPed?N0(x.metrosPed)+' m (corte)':'—')}</td><td class="text-end"><span class="chip warn">${N0(us.length)}</span></td><td class="text-end">${R2(us.reduce((a,u)=>a+custoCompra(u),0))}${us.some(u=>!(custoCompra(u)>0))?` <span class="chip bad" style="font-size:10px">${N0(us.filter(u=>!(custoCompra(u)>0)).length)} sem custo</span>`:''}</td><td class="sub" style="font-size:12px">${[...new Set(us.map(u=>T(()=>locStr(u),u.local||'')))].slice(0,3).map(E).join(' · ')}</td></tr>`);
    if(open)us.forEach(u=>rows.push(`<tr class="sub" style="font-size:12px"><td style="padding-left:28px">${E(u.serie||'sem série')}${u.metros?' · '+N0(u.metros)+' m':''}</td><td>${E(u.natureza||'')}</td><td colspan="2">${E(T(()=>locStr(u),u.local||''))}</td><td class="text-end">1</td><td class="text-end">${custoCompra(u)>0?R2(custoCompra(u)):'<span class="chip bad">sem custo</span>'}</td><td>${E(u.origem||u.nf||'')}</td></tr>`))});
  return `<div class="sub mb-2" style="font-size:13px"><a href="#/epainel">Painel Geral</a> › Sem propósito</div>`+
    head(`<i class="bi bi-question-circle me-1 text-warning"></i>Sem propósito <span class="chip warn">${N0(tot)} un.</span> <span class="sub" style="font-size:14px;font-weight:400">${R0(tr)} parados ao custo de compra</span>`,'Unidades livres que <b>nenhuma proposta ativa pede</b>: sobra de compra, retorno, cancelamento. Ou viram insumo, ou entram numa próxima proposta, ou saem (venda avulsa / devolução). Uma linha por produto — clique para ver as unidades.')+
    `<div class="card p-2 mb-2" style="display:block;font-size:13px;border-left:4px solid #fd7e14"><b>Ponte:</b> ${spPonte(s)}</div>`+
    `<div class="tabs">${[['','Todos'],...INV().map(i=>[i,'Inventário '+i])].map(([v,l])=>`<button class="${inv===v?'on':''}" onclick="S.spInv='${v}';renderMain()">${l}</button>`).join('')}</div>`+
    `<div class="tabs" style="margin-top:-4px">${chip('','Todas as unidades',s.sobra)}${chip('medido','Bobinas de cabo',s.medido)}${chip('semcusto','Sem custo cadastrado',s.semCusto)}</div>`+
    `<div class="tblwrap"><table class="tbl" style="font-size:13px"><thead><tr><th>Produto</th><th>Marca</th><th class="text-end">Livre</th><th class="text-end">Pedido</th><th class="text-end">Sem propósito</th><th class="text-end">Custo de compra</th><th>Onde</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="7" class="sub">Nada neste filtro.</td></tr>'}<tr style="background:rgba(127,127,127,.06)"><td><b>Total</b></td><td></td><td></td><td></td><td class="text-end"><b>${N0(tot)}</b></td><td class="text-end"><b>${R2(tr)}</b></td><td></td></tr></tbody></table></div>`+
    (f==='semcusto'?`<div class="sub mt-2" style="font-size:12px">Sem custo = a unidade não tem custo de compra e o produto também não tem custo cadastrado. O valor parado é calculado só sobre as unidades com custo; estas entram na contagem, com R$ 0.</div>`:'')};

/* ═════════════════════════════ A1/A2 · PÓS-VENDA ═════════════════════════════ */
const FONTE_AT='Controle de AT 2026 (Pós-venda)';
const ehPosCons=c=>/(^|[^A-Za-zÀ-ú])AT([^A-Za-zÀ-ú]|$)/.test(String(c||''))||/\bdani(elle)?\b/i.test(String(c||''));
/* a Base: negociação do Pipeline com consultor AT / Dani = frente Pós-venda (idempotente; guarda a frente anterior) */
function frentePos(){let n=0;(S.db.negociacoes||[]).forEach(x=>{if(!x||!ehPosCons(x.consultor))return;if(x.frente!=='posvenda'){x.frente_antes_v161=x.frente||'';x.frente='posvenda';x.v161_frente='consultor '+x.consultor+' = Pós-venda (Bruno, 05/11)';n++}});
  if(n){T(()=>save());T(()=>log('negociacoes','v161',n+' negociações do Pipeline com consultor AT/Dani passam para a frente Pós-venda'))}return n}
T(frentePos,0);

const sit=o=>T(()=>COP.situacao(o),o.situacao||'');
const vivas=()=>(S.db.obras||[]).filter(o=>o&&!o.merged_into&&!o.inativo);
const fsrSt=c=>((S.db.at_fsr||{})[c.id]||{}).status||'PENDENTE';
const vendidaP=p=>['vendida','em_obra','concluida'].includes(p.estado)&&!p.demo;
const Mt=p=>T(()=>+M.total(p),0)||0;
const resN=n=>!n.resultado?'aberta':String(n.resultado).toLowerCase();
function num(){const db=S.db;const O=vivas();
  const conc=O.filter(o=>!o.legadoAT&&sit(o)==='Concluída');const at=O.filter(o=>!o.legadoAT&&sit(o)==='Assistência técnica');
  const leg=O.filter(o=>o.legadoAT&&!o.localADefinir);const lad=O.filter(o=>o.legadoAT&&o.localADefinir);
  const fin=conc.concat(at,leg,lad);const finIds=new Set(fin.map(o=>o.id));
  const fora=O.filter(o=>!finIds.has(o.id)&&o.entrega&&o.entrega.realizada);const foraAnd=fora.filter(o=>sit(o)!=='Cancelada'),foraCan=fora.filter(o=>sit(o)==='Cancelada');
  const pv=(db.propostas||[]).filter(p=>p.linha==='posvenda'&&!p.demo&&!p.excluida);
  const planos=pv.filter(p=>p.at&&p.at.proposal_type==='SERVICE_PLAN');const ats=pv.filter(p=>!(p.at&&p.at.proposal_type==='SERVICE_PLAN'));
  const cob=ats.filter(vendidaP),semCob=ats.filter(p=>!vendidaP(p));const vCob=cob.reduce((a,p)=>a+Mt(p),0);
  const mens=planos.reduce((a,p)=>a+((p.at&&p.at.proposal_value_cents)||0)/100,0);
  const aprov=pv.filter(p=>['aprovada_cliente','enviada'].includes(p.estado));
  const cards=db.at_atendimentos||[];const pend=cards.filter(c=>fsrSt(c)!=='CONCLUIDO');const t=hoje();
  const lim7=new Date(new Date(t+'T12:00:00').getTime()-7*864e5).toISOString().slice(0,10);const pendAtr=pend.filter(c=>c.start_date&&String(c.start_date).slice(0,10)<lim7);
  const pendProp=new Set(pend.map(c=>c.proposal_id));
  const abertas=pv.filter(p=>p.at&&p.at.open_status==='EM ABERTO');const abPlan=abertas.filter(p=>p.at.proposal_type==='SERVICE_PLAN');
  const abCampo=abertas.filter(p=>p.at.proposal_type!=='SERVICE_PLAN'&&pendProp.has(p.id));const abPend=abertas.filter(p=>p.at.proposal_type!=='SERVICE_PLAN'&&!pendProp.has(p.id));
  const os=(db.os||[]).filter(o=>o.estado==='aberta');
  const N=(db.negociacoes||[]).filter(n=>n.frente==='posvenda');const by=k=>N.filter(n=>resN(n)===k);
  const neg={all:N,aberta:by('aberta'),fechada:by('fechada'),perdida:by('perdida'),futuro:by('futuro'),sem_status:by('sem_status')};
  neg.outras=N.length-neg.aberta.length-neg.fechada.length-neg.perdida.length-neg.futuro.length-neg.sem_status.length;
  const negV=n=>+n.valor||((n.proposta_ids||[]).reduce((a,id)=>a+T(()=>Mt(get('propostas',id)),0),0));
  return {conc,at,leg,lad,fin,foraAnd,foraCan,pv,planos,ats,cob,semCob,vCob,mens,aprov,cards,pend,pendAtr,abertas,abPlan,abCampo,abPend,os,
    chamados:pend.length+os.length,neg,negV,vNeg:neg.aberta.reduce((a,n)=>a+negV(n),0),meta:+((db.metas||{}).posvenda)||0}}
window.V161POS={num,frentePos,ehPosCons};

/* ---------- gaveta do Início (mesmo desenho das gavetas da Visão executiva) ---------- */
let DR=null;
window.V161_open=(k,a)=>{DR={k,a};rr()};
try{const _cl=window.V130_close;window.V130_close=function(){const had=!!DR;DR=null;if(had){rr();return}return _cl&&_cl.apply(this,arguments)}}catch(e){}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&DR){DR=null;rr()}});
const op=(k,a)=>`V161_open('${J(k)}'${a!=null?`,'${J(a)}'`:''})`;
const gHead=(t,v,sub,fonte)=>`<button class="x" onclick="V130_close()" aria-label="Fechar">×</button><div class="lead">Empresa toda · posição de hoje</div><h3>${t}</h3><div class="big">${v}</div><div class="lead">${sub||''}</div>${fonte?`<div class="vx149-fonte"><b>De onde vem:</b> ${fonte}</div>`:''}`;
const tabela=(cols,rows)=>`<div class="tw"><table class="no-filter"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const trr=(cells,on)=>`<tr class="${on?'click':''}"${on?` onclick="${on}"`:''}>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
const abrir=(lb,on)=>`<a class="btnl" href="javascript:void 0" onclick="${on}">${E(lb)} ›</a>`;
const goH=h=>`V130_close();location.hash='${J(h)}'`;
const cliNome=p=>(p.at&&p.at.client_name)||T(()=>get('clientes',p.cliente_id).nome,'')||p.cliente_nome||p.nome||'—';
const obraCli=o=>T(()=>get('clientes',o.cliente_id).nome,'')||'—';
function semInfo(r){const cls=r.pendAtr.length?'rd':r.chamados?'am':'gn';
  return {cls,porque:[r.pendAtr.length?`${N0(r.pendAtr.length)} atendimentos em aberto há mais de 7 dias → vermelho`:'nenhum atendimento parado há mais de 7 dias',r.chamados?`${N0(r.chamados)} chamados abertos (atendimentos do Controle de AT não concluídos em campo + solicitações) → amarelo`:'nenhum chamado aberto']}}
const SEMTXT={gn:'tranquilo',am:'atenção',rd:'precisa de alguém',gr:'sem dados'};
function gaveta(k,a){const r=num();
  if(k==='sem'){const s=semInfo(r);return gHead('Por que Pós-vendas está assim: «'+SEMTXT[s.cls]+'»?',`<i class="vx149-dot ${s.cls}" style="width:22px;height:22px"></i>`,'a cor é calculada agora, com os registros do sistema')+`<ul class="vx149-why">${s.porque.map(x=>`<li>${E(x)}</li>`).join('')}</ul>`}
  if(k==='fin'){const G={conc:['Concluídas na Operação',r.conc],at:['Em assistência técnica',r.at],leg:['Casas do Controle de AT (obras legado)',r.leg],lad:['Local a definir (atendimentos sem obra certa)',r.lad],fora:['Fora: com data de entrega mas em andamento/cancelada',r.foraAnd.concat(r.foraCan)]};
    const xs=a&&G[a]?G[a][1]:r.fin;const lb=a&&G[a]?G[a][0]:'Todas as obras finalizadas';
    return gHead('Clientes do Pós-venda · '+E(lb),N0(xs.length),'obras — cada obra concluída vira cliente do Pós-venda','Base › obras: situação da Operação (Planilha Mestra › Painel de Controle) e as obras que o Controle de AT criou para clientes antigos.')+
      tabela(['Obra','Cliente','Situação','Unidade','Origem'],xs.slice().sort((x,y)=>String(x.nome).localeCompare(String(y.nome))).slice(0,400).map(o=>trr([`<b>${E(o.nome)}</b>`,E(obraCli(o)),E(sit(o)),E(o.unidade||'SP'),E(o.legadoAT?'Controle de AT':o.linhaPlanilha!=null?'Mestra linha '+o.linhaPlanilha:(o.origem||'—'))],goH('#/obras/'+o.id))))+abrir('Abrir Pós-venda › Obras finalizadas',goH('#/posobras'))}
  if(k==='prop'){const G={cob:['Cobradas (vendas da linha AT)',r.cob],sem:['Atendimentos sem cobrança',r.semCob],plan:['Planos de serviço',r.planos],aprov:['Aprovadas sem valor de venda (sem cobrança + planos)',r.aprov],ab:['Em aberto',r.abertas],abc:['Em aberto · atendimento em campo',r.abCampo],abp:['Em aberto · concluído em campo com pendência',r.abPend],abpl:['Em aberto · planos ativos',r.abPlan]};
    const xs=a&&G[a]?G[a][1]:r.pv;const lb=a&&G[a]?G[a][0]:'Todas as propostas do Pós-venda';const v=xs.reduce((s,p)=>s+Mt(p),0);
    return gHead('Pós-venda · '+E(lb),N0(xs.length),'propostas · '+R0(v)+' de venda','Controle de AT 2026 (planilha do Pós-venda), carregado na tabela única de propostas, linha Pós-venda. Valor de venda = valor + cobrança extra do atendimento; plano de serviço e atendimento sem cobrança não são venda.')+
      tabela(['Nº','Cliente','Grupo','Data','Situação','Venda'],xs.slice().sort((x,y)=>String((y.at||{}).technical_delivery_date||'').localeCompare(String((x.at||{}).technical_delivery_date||''))).slice(0,1000).map(p=>trr([`<b>${E(p.numero||'')}</b>`,E(cliNome(p)),E((p.at&&p.at.request_group)||p.categoria||'—'),dBR((p.at&&p.at.technical_delivery_date)||p.data_atendimento),E((p.at&&p.at.open_status)||p.estado),Mt(p)?R0(Mt(p)):'—'],`V130_close();COP.pos&&COP.pos.go('pospropostas','pospropostas',{busca:'${J(p.numero||'')}'})`)))+(xs.length>1000?`<div class="note">mostrando 1.000 de ${N0(xs.length)}</div>`:'')+abrir('Abrir Pós-venda › Propostas',`V130_close();COP.pos&&COP.pos.go('pospropostas','pospropostas',{})`)}
  if(k==='pend'){const xs=a==='atr'?r.pendAtr:r.pend;const t=hoje();
    return gHead(a==='atr'?'Atendimentos em aberto há mais de 7 dias':'Chamados abertos · atendimentos em aberto',N0(xs.length+(a==='atr'?0:r.os.length)),`${N0(xs.length)} atendimentos do Controle de AT não concluídos em campo`+(a==='atr'?'':` + ${N0(r.os.length)} solicitações (OS) abertas`),'Pós-venda › Field Service: status do atendimento em campo (PENDENTE ou EM ANDAMENTO). É o mesmo número de "Atendimentos pendentes" em Pós-venda › Visão geral.')+
      tabela(['Data','Cliente','Serviço','Status','Há'],xs.slice().sort((x,y)=>String(x.start_date).localeCompare(String(y.start_date))).slice(0,400).map(c=>{const p=T(()=>get('propostas',c.proposal_id),null)||{};const d=c.start_date?Math.round((new Date(t+'T12:00:00')-new Date(String(c.start_date).slice(0,10)+'T12:00:00'))/864e5):null;
        return trr([dBR(c.start_date),E(cliNome(p)),E(String(c.services||'').slice(0,70)),E(fsrSt(c)),d!=null?N0(d)+' dias':'—'],`V130_close();COP.pos&&COP.pos.go('posfield','posfield',{st:'${J(fsrSt(c))}'})`)}))+abrir('Abrir Pós-venda › Field Service',`V130_close();COP.pos&&COP.pos.go('posfield','posfield',{st:''})`)}
  return ''}

/* ---------- Início › bloco 7 Pós-vendas: lê só V161POS.num() ---------- */
const COR={verde:'#12a150',cinza:'#a3a29c',azul:'#2a78d6',roxo:'#7c5cc4',amb:'#d9a400',lar:'#e8742c',teal:'#1a9e9e'};
const tile=(lb,v,on,cls,sub)=>`<div class="vx-tile ${cls||''}" role="button" tabindex="0" ${on?`style="cursor:pointer" onclick="${on}"`:''}><b class="${cls||''}">${v}</b><span>${lb}</span>${sub?`<em>${sub}</em>`:''}</div>`;
const pilha=(segs,txt,on)=>{const tot=segs.reduce((a,s)=>a+(+s.v||0),0)||1;return `<div class="vx149-stack">${segs.map(s=>s.v>0?`<i style="width:${(s.v/tot*100).toFixed(2)}%;background:${s.cor}" title="${E(s.lb)}: ${N0(s.v)}" ${s.on?`onclick="${s.on}"`:''}></i>`:'').join('')}</div><div class="vx149-leg">${segs.map(s=>`<span ${s.on?`role="button" style="cursor:pointer" onclick="${s.on}"`:''}><i style="background:${s.cor}"></i><b>${N0(s.v)}</b> ${s.lb}</span>`).join('')}</div>${txt?`<div class="vx149-mini" ${on?`style="cursor:pointer" onclick="${on}"`:''}>${txt}</div>`:''}`};
const box=(t,inner,on)=>`<div class="vx149-box">${t?`<h4 ${on?`role="button" style="cursor:pointer" onclick="${on}"`:''}>${t}${on?' <span class="vx149-h4go">›</span>':''}</h4>`:''}${inner}</div>`;
const u=(txt,on)=>`<u ${on?`role="button" onclick="${on}"`:''}>${txt}</u>`;
const negOp=a=>`V130_open('v149:neg','${J(a)}')`;
function bloco7(){const r=num();const s=semInfo(r);const ng=r.neg;
  const head=`<div class="vx-sh"><div><a class="vx-n" href="javascript:void 0" onclick="this.closest('section').scrollIntoView({behavior:'smooth',block:'start'})">7</a><h2>Pós-vendas <i class="vx149-dot ${s.cls}" role="button" title="Por que esta cor?" onclick="${op('sem')}"></i></h2><div class="q">Quem já é cliente (toda obra concluída), o que o Pós-venda vendeu, o que está em negociação no Pipeline e os atendimentos em aberto — os mesmos números de Pós-venda › Visão geral, de Comercial (linha AT) e da Operação.</div></div><a class="vx-lk" href="javascript:void 0" onclick="V130_go('#/posvisao')">Pós-venda › Visão geral ›</a></div>`;
  const tiles=`<div class="vx-tiles vx-c4">${tile('Clientes do Pós-venda · obras finalizadas',N0(r.fin.length),op('fin'),'',`${N0(r.conc.length)} concluídas na Operação + ${N0(r.fin.length-r.conc.length)} do Pós-venda`)}${tile('Vendido em 2026 · linha AT',R0(r.vCob),op('prop','cob'),'pos',`${N0(r.cob.length)} atendimentos cobrados${r.meta?' · '+(r.vCob/r.meta*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% de '+R0(r.meta):''}`)}${tile('Em negociação (Pipeline · Pós-venda)',N0(ng.aberta.length),negOp('frente=posvenda&res=aberta'),'',r.vNeg?R0(r.vNeg):(ng.aberta.length?'sem valor cadastrado na planilha':'R$ 0'))}${tile('Chamados abertos',N0(r.chamados),op('pend'),r.pendAtr.length?'neg':'',r.pendAtr.length?`${N0(r.pendAtr.length)} há mais de 7 dias`:'atendimentos em aberto')}</div>`;
  const bProp=box(`Propostas do Pós-venda · ${N0(r.pv.length)}`,pilha([{lb:'cobradas',v:r.cob.length,cor:COR.verde,on:op('prop','cob')},{lb:'sem cobrança',v:r.semCob.length,cor:COR.cinza,on:op('prop','sem')},{lb:'planos de serviço',v:r.planos.length,cor:COR.roxo,on:op('prop','plan')}],`${N0(r.pv.length)} = ${N0(r.cob.length)} + ${N0(r.semCob.length)} + ${N0(r.planos.length)}`,op('prop'))+
    `<div class="vx149-mini" style="margin-top:6px">${u(N0(r.abertas.length)+' em aberto',op('prop','ab'))} = ${u(N0(r.abCampo.length)+' com atendimento em campo',op('prop','abc'))} + ${u(N0(r.abPend.length)+' concluídos com pendência',op('prop','abp'))} + ${u(N0(r.abPlan.length)+' planos ativos',op('prop','abpl'))}</div>`,op('prop'));
  const bNeg=box('Pipeline Pós-venda (consultor AT / Dani)',pilha([{lb:'ganhas',v:ng.fechada.length,cor:COR.verde,on:negOp('frente=posvenda&res=fechada')},{lb:'perdidas',v:ng.perdida.length,cor:COR.cinza,on:negOp('frente=posvenda&res=perdida')},{lb:'abertas',v:ng.aberta.length,cor:COR.azul,on:negOp('frente=posvenda&res=aberta')},{lb:'futuro',v:ng.futuro.length,cor:COR.teal,on:negOp('frente=posvenda&res=futuro')}].concat(ng.sem_status.length?[{lb:'sem status',v:ng.sem_status.length,cor:COR.amb,on:negOp('frente=posvenda&res=sem_status')}]:[]),`${N0(ng.all.length)} = ${N0(ng.fechada.length)} + ${N0(ng.perdida.length)} + ${N0(ng.aberta.length)} + ${N0(ng.futuro.length)}${ng.sem_status.length?' + '+N0(ng.sem_status.length):''}${ng.outras?' + '+N0(ng.outras)+' outras':''}`,negOp('frente=posvenda')),negOp('frente=posvenda'));
  const ponte=`<div class="vx-ponte">Ponte: ${u(N0(r.fin.length)+' obras finalizadas',op('fin'))} = ${u(N0(r.conc.length)+' concluídas na Operação',op('fin','conc'))} + ${u(N0(r.at.length)+' em assistência técnica',op('fin','at'))} + ${u(N0(r.leg.length)+' casas do Controle de AT',op('fin','leg'))} + ${u(N0(r.lad.length)+' local a definir',op('fin','lad'))}`+
    ` · ${u(N0(r.aprov.length)+' aprovadas sem valor',op('prop','aprov'))} = ${N0(r.aprov.length-r.planos.length)} atendimentos sem cobrança + ${N0(r.planos.length)} planos (mensalidades ${R0(r.mens)}/mês entram quando o Financeiro registra o pagamento)`+
    ` · ${u(N0(r.chamados)+' chamados abertos',op('pend'))} = ${N0(r.pend.length)} atendimentos não concluídos em campo + ${N0(r.os.length)} solicitações (OS) <span class="ok">✓ o mesmo de Pós-venda › Visão geral e de Comercial › Gestão (linha AT ${R0(r.vCob)} · ${N0(r.cob.length)})</span></div>`;
  return {html:`<section class="sec vx-s vx149" id="v130_s_b7">${head}<div class="rx"><div class="card wide">${tiles}<div class="vx149-grid c2">${bProp}${bNeg}</div>${ponte}</div></div></section>`,cls:s.cls}}
/* Início › Estoque: a ponte do sem propósito (o mesmo motor do Painel Geral) */
function ponteEst(){const s=spResumo(null);return `<div class="vx-ponte v161-sp">Sem propósito: ${spPonte(s).replace(/location\.hash=/g,"V130_close();location.hash=")} <span class="ok">✓ o mesmo de Estoque › Painel Geral</span></div>`}
try{const _home=SCREENS.home;SCREENS.home=function(){let h=_home.apply(this,arguments);if(typeof h!=='string'||h.indexOf('id="v130_s_b7"')<0)return h;
    try{const b=bloco7();const i=h.indexOf('<section class="sec vx-s vx149" id="v130_s_b7">');const j=i>=0?h.indexOf('</section>',i):-1;if(i>=0&&j>i)h=h.slice(0,i)+b.html+h.slice(j+10);
      h=h.replace(/(<i class="vx149-dot )\w+(" onclick="event\.stopPropagation\(\);)V130_open\('v149:sem','7'\)("><\/i><b>Pós-vendas<\/b><span>)[^<]*(<\/span>)/,(m,a,c,d,e)=>a+b.cls+c+op('sem')+d+SEMTXT[b.cls]+e);
      const k=h.indexOf('id="v130_s_b5"');if(k>0){const z=h.indexOf('</section>',k);const w=h.lastIndexOf('</div></div>',z);if(w>k)h=h.slice(0,w)+ponteEst()+h.slice(w)}
      /* Comercial (linha AT): os 464 são as cobradas das 769 do Pós-venda */
      h=h.replace(/(Pós-venda \(AT\)[\s\S]{0,400}?· )([\d.]+) propostas/,(m,a,n)=>`${a}${n} propostas <span class="sub">(atendimentos cobrados · de ${N0(num().pv.length)} do Pós-venda)</span>`);
      if(DR){const dr=T(()=>gaveta(DR.k,DR.a),'');if(dr)h+=`<div class="vd vd-ov fx2-wrapped" style="background:rgba(0,0,0,.38)" onclick="if(event.target===this)V130_close()"><div class="vd-dr" id="v161_drawer">${dr}</div></div>`}
    }catch(e){console.error('v161 início',e)}return h};
  Object.keys(_home).forEach(k=>{try{SCREENS.home[k]=_home[k]}catch(e){}})}catch(e){console.error('v161 home',e)}

/* ---------- Pós-venda › Visão geral e Obras finalizadas: a mesma definição ---------- */
function soFinalizadas(fn){return function(){const all=S.db.obras;if(!Array.isArray(all))return fn.apply(this,arguments);
  const ids=new Set(num().fin.map(o=>o.id));S.db.obras=all.filter(o=>ids.has(o.id)||!(o.entrega&&o.entrega.realizada)&&!['Concluída','Assistência técnica'].includes(sit(o)));
  try{return fn.apply(this,arguments)}finally{S.db.obras=all}}}
function cardPos(r){const go=(s,f)=>`COP.pos&&COP.pos.go('${s}','${s}',${f||'{}'})`;const a=(t,on)=>`<a href="javascript:void 0" onclick="${on}">${t}</a>`;
  const sit_=v=>`COP.ui=COP.ui||{};COP.ui.posobras=Object.assign(COP.ui.posobras||{},{sit:'${v}'});location.hash='#/posobras';render()`;
  return `<div class="card p-3 mb-3 v161-pos" style="border-left:4px solid #0d6efd;font-size:13px"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em;font-weight:700">PÓS-VENDA EM UMA LÍNGUA SÓ — os mesmos números do Início, do Comercial (linha AT) e da Operação</div>`+
    `<div><b>${a(N0(r.fin.length)+' obras finalizadas','location.hash=\'#/posobras\'')}</b> (clientes do Pós-venda) = ${a(N0(r.conc.length)+' concluídas na Operação',sit_('Concluída'))} + ${a(N0(r.at.length)+' em assistência técnica',sit_('Assistência técnica'))} + ${N0(r.leg.length)} casas do Controle de AT + ${N0(r.lad.length)} com local a definir`+(r.foraAnd.length+r.foraCan.length?` <span class="sub">· fora da conta: ${N0(r.foraAnd.length)} em andamento e ${N0(r.foraCan.length)} cancelada(s) que só tinham data de entrega preenchida</span>`:'')+`</div>`+
    `<div class="mt-1"><b>${a(N0(r.pv.length)+' propostas cadastradas',go('pospropostas'))}</b> = ${N0(r.cob.length)} cobradas (${R0(r.vCob)} vendidos — a linha AT da meta, o mesmo do Comercial) + ${N0(r.semCob.length)} atendimentos sem cobrança (garantia, cortesia, retorno) + ${N0(r.planos.length)} planos de serviço</div>`+
    `<div class="mt-1"><b>${a(N0(r.abertas.length)+' em aberto',go('pospropostas',"{status:'EM ABERTO'}"))}</b> = ${a(N0(r.abCampo.length)+' com atendimento em campo',go('posfield',"{st:''}"))} + ${N0(r.abPend.length)} concluídos em campo com pendência + ${N0(r.abPlan.length)} planos ativos</div>`+
    `<div class="mt-1"><b>${a(N0(r.chamados)+' chamados abertos',go('posfield',"{st:''}"))}</b> (Início) = ${N0(r.pend.length)} atendimentos pendentes em campo + ${N0(r.os.length)} solicitações (OS) abertas</div>`+
    `<div class="mt-1"><b>${a(N0(r.neg.aberta.length)+' em negociação',"location.hash='#/pipeline'")}</b> no Pipeline, frente Pós-venda (consultor AT / Dani): ${N0(r.neg.all.length)} = ${N0(r.neg.fechada.length)} ganhas + ${N0(r.neg.perdida.length)} perdidas + ${N0(r.neg.aberta.length)} abertas + ${N0(r.neg.futuro.length)} futuro${r.neg.sem_status.length?' + '+N0(r.neg.sem_status.length)+' sem status':''}</div></div>`}
try{const _pv=SCREENS.posvisao;const w=soFinalizadas(_pv);SCREENS.posvisao=function(){let h=w.apply(this,arguments);if(typeof h!=='string')return h;try{const r=num();
    h=h.replace('Chegam da Operação',`${N0(r.conc.length)} concluídas + ${N0(r.fin.length-r.conc.length)} do Pós-venda`);
    h=h.replace(/(<b>Solicitações abertas \(OS\): \d+<\/b>)/,`$1 <span class="sub">· com os ${N0(r.pend.length)} atendimentos pendentes do Controle de AT são os ${N0(r.chamados)} chamados abertos do Início</span>`);
    const i=h.indexOf('<div class="row g-3 mb-3">');if(i>0)h=h.slice(0,i)+cardPos(r)+h.slice(i)}catch(e){console.error('v161 posvisao',e)}return h};
  Object.keys(_pv).forEach(k=>{try{SCREENS.posvisao[k]=_pv[k]}catch(e){}})}catch(e){}
try{const _po=SCREENS.posobras;SCREENS.posobras=soFinalizadas(_po);Object.keys(_po).forEach(k=>{try{SCREENS.posobras[k]=_po[k]}catch(e){}})}catch(e){}

/* ---------- Comercial › Gestão: a linha AT diz de onde vêm os 464 ---------- */
try{const _g=SCREENS.gestao;SCREENS.gestao=function(){let h=_g.apply(this,arguments);if(typeof h!=='string')return h;try{
    let i=h.search(/<td[^>]*>(\s|<a[^>]*>)*Pós-venda \(AT\)\s*(<\/a>)?\s*<\/td>/);if(i<0)return h;const j=h.indexOf('</table>',i);if(j<0)return h;const r=num();const k=h.indexOf('</div>',j);
    const ln=`<div class="sub mt-2 v161-at" style="font-size:12px">Pós-venda (AT): <b>${N0(r.cob.length)}</b> = os atendimentos cobrados do Controle de AT (${R0(r.vCob)}) · as <a href="#/posvisao">${N0(r.pv.length)} propostas do Pós-venda</a> = ${N0(r.cob.length)} cobradas + ${N0(r.semCob.length)} sem cobrança + ${N0(r.planos.length)} planos — sem cobrança e plano não são venda · em negociação no Pipeline (consultor AT / Dani): ${N0(r.neg.aberta.length)}</div>`;
    h=h.slice(0,j+8)+ln+h.slice(j+8)}catch(e){console.error('v161 gestão',e)}return h};
  Object.keys(_g).forEach(k=>{try{SCREENS.gestao[k]=_g[k]}catch(e){}})}catch(e){}

/* a cada tela: a regra AT/Dani vale também para negociações novas */
try{const _rm=window.renderMain;window.renderMain=function(){T(frentePos,0);return _rm.apply(this,arguments)}}catch(e){}
})();
