/* =====================================================================================================
   v161 · RENTABILIDADE EM ANDAMENTO (Bruno, 05/11/2026)
   "I need something in Início (small) that will show the current profitability of the departments that are
   ongoing. Whenever they click they can see the ongoing proposals and see if they are making money or not."
   Quatro unidades: TAAG · Acústica · Focal · Pós-venda.

   Decisões do Bruno (05/11):
   • "Just delete the contract × progress — take it out." Receita de uma proposta em andamento = o valor CHEIO do
     contrato (o total do motor, FN.propPlano(p).tot = M.total). Sem multiplicador de avanço nesta conta — e o mesmo
     vale para Financeiro › Obras (Lucro real), a página da obra e a Diretoria › Lucratividade (para concordarem).
     A DRE mensal por competência continua com a regra dela (lê porProposta, que não muda aqui).
   • Custos: só o que foi LANÇADO (unidades entregues ao custo de compra, diárias apontadas, viagem 204.x, extras,
     comissões/RT em títulos, horas de projeto, garantia do Pós-venda, saídas da planilha ligadas à obra — onde entram os impostos pagos).
     O imposto planejado da proposta não é custo lançado (antes ele entrava × avanço). Sem custo → a proposta fica positiva e aparece "sem custo lançado ainda" (cinza). Quando um custo
     entra na Base, ele subtrai sozinho — porque tudo vem de FN.obra / FS.obraRow, os motores de Financeiro › Obras.
   • Em andamento = propostas vendidas (vendida / em obra / concluída) das obras com situação "Em andamento"
     (a mesma lista do Início › Operações) + vendas Focal / Acústica sem obra com estado vendida / em obra.
     Só propostas reais: fonte METAS 2026, Planilha Mestra (Painel de Controle) ou Controle de AT; nunca demonstração.
   • Cor: verde ≥ margem mínima (Base › params.fin.margemMin), amarelo 0 até a mínima, vermelho < 0,
     cinza = sem custo lançado ainda (o valor positivo continua visível).

   06/11 (Bruno — "o cartão mente": 110 propostas, 80 sem valor, +100,0% verde com custo zero) — O CARTÃO CONTA OBRAS:
   • uma linha do Painel = uma obra; valor da obra = soma das vendas (valor de venda) das propostas vendidas dela.
   • obra sem venda com valor NUNCA conta como R$ 0: vira a lista com nome "N obras em andamento sem valor de venda na Base
     (chega com as propostas e o Financeiro)".
   • enquanto não houver custo lançado: só o valor vendido — sem margem, sem %, sem verde/amarelo/vermelho, sem resultado:
     "resultado: aguardando custos (produtos entregues e despesas do Financeiro)". Quando a unidade tiver custo real lançado,
     aparecem custos e resultado SÓ das obras que têm valor e custo, com a ponte dizendo quantas obras isso cobre.
   • barra = parte do valor vendido (rotulada), não "quanto da obra está pronto".
   • Focal e Acústica seguem o mesmo desenho (cliente → obra → proposta). As vendas delas sem obra ligada não são valor em
     andamento: aparecem como "N vendas sem obra ligada" (lista com nome) — nenhuma obra é criada nem ligada (aguarda o Bruno).
   • ponte: "81 obras = 29 com valor + 52 sem valor · R$ X = soma das vendas de 29 obras".
   • a mesma honestidade na lista e em Financeiro › Obras: a margem do custo PREVISTO é rotulada como prevista.

   Correção de causa (por que tudo dava zero): FN.obra só via propostas com fin.confirmada; o v142 tirou as vendas
   históricas (METAS / Painel / AT, todas fin.historico) de FI.vendasNaoConfirmadas para elas não caírem em
   "a confirmar" — e com isso as obras deixaram de enxergar as próprias vendas. Aqui, SÓ dentro do escopo da obra
   (FI.comEscopoObra), as vendas históricas reais voltam a contar. A lista "a confirmar" do Financeiro não muda.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161r)return;window.__v161r=true;
const T=(fn,d)=>{try{const v=fn();return v==null?d:v}catch(e){console.error('v161',e);return d}};
if(typeof FN!=='object'||typeof FN.obra!=='function'||typeof FS!=='object'||!window.FX1||!window.FI){console.warn('v161: motor do Financeiro não encontrado');return}
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const r2=v=>Math.round((+v||0)*100)/100;
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R$=v=>{v=r2(v);return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})};
const P1=v=>(v<0?'−':'')+Math.abs(v*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const sum=(xs,f)=>r2((xs||[]).reduce((a,x)=>a+(+(f?f(x):x)||0),0));
const plural=(n,a,b)=>N0(n)+' '+(+n===1?a:b);
const UNIS=['TAAG','Acústica','Focal','Pós-venda'];
const COR={verde:'#12a150',amb:'#e0a400',verm:'#d03b3b',cinza:'#a3a29c'};
const VEND=['vendida','em_obra','concluida'];
const REAL=/METAS 2026|Planilha Mestra|Painel de Controle|Controle de AT/i;
const real=p=>!!p&&!p.demo&&!p.seed&&REAL.test(String(p.fonte||p.origem||''));
const margemMin=()=>{const v=T(()=>+S.db.params.fin.margemMin,NaN);return isFinite(v)?v/100:0.15};
const unidadeDe=p=>T(()=>FX1.unidadeDaProposta(p),'TAAG')||'TAAG';

/* ───────── 0 · causa: dentro do escopo da obra, a venda histórica real conta ───────── */
/* só nas telas da conta da obra (Financeiro › Obras, a página da obra, Diretoria › Lucratividade e este cartão) — a DRE do mês,
   o Fluxo e os outros consumidores de FN.obras() continuam exatamente como antes (senão a venda histórica viraria receita deste mês) */
let ESC=0,HIST=0;
const _esc=FI.comEscopoObra;
if(typeof _esc==='function')FI.comEscopoObra=function(f){ESC++;try{return _esc.apply(FI,arguments)}finally{ESC--}};
/* a memória de um instante do v153 (FN.vendidas / FN.obra / FX1.propostasDaObra) guarda o resultado sem saber do contexto:
   ao entrar e ao sair deste escopo ela é invalidada, para nenhum número de dentro vazar para fora (nem o contrário) */
const bump=()=>{try{if(typeof window.__v153_invalida==='function')window.__v153_invalida()}catch(e){}MEMO=null};
const comHist=f=>{if(!HIST++)bump();try{return f()}finally{if(!--HIST)bump()}};
const _vend=FN.vendidas;
FN.vendidas=function(){const all=_vend.apply(FN,arguments);if(!HIST)return all;
  const ids=new Set(all.map(p=>p.id));
  return all.concat((S.db.propostas||[]).filter(p=>!ids.has(p.id)&&VEND.includes(p.estado)&&p.fin&&!p.fin.confirmada&&p.fin.historico&&real(p)))};

/* ───────── 1 · sem "contrato × avanço": receita = contrato cheio, impostos da proposta cheios ───────── */
const _obra=FN.obra;
/* as obras vindas da Planilha Mestra não têm o bloco fin_real (custo real ainda vazio): o motor antigo lia o.fin_real.extras e
   quebrava assim que a obra passou a enxergar as suas vendas — o bloco nasce vazio (zero extras, zero diárias), como numa obra nova */
const finReal=o=>{if(o&&typeof o==='object'&&!o.fin_real)o.fin_real={dias:{projeto:0,estrutural:0,instalacao:0,programacao:0},extras:0};else if(o&&o.fin_real){if(!o.fin_real.dias)o.fin_real.dias={projeto:0,estrutural:0,instalacao:0,programacao:0};if(o.fin_real.extras==null)o.fin_real.extras=0}};
FN.obra=function(o){finReal(o);const r=_obra.apply(FN,arguments);if(!r||r.__v161)return r;
  try{const impAv=+r.impReal||0,imp=+r.imp||0; /* imposto planejado × avanço saía do custo real: sem avanço, imposto só conta quando é lançado (saída da planilha ligada à obra) */
    if(Array.isArray(r.prs)&&r.prs.length){r.custoR=r2((+r.custoR||0)-impAv);r.impReal=0;r.impPlanejado=r2(imp)}
    r.receitaR=r2(r.v);r.resR=r2(r.v-r.custoR);r.__v161=true}catch(e){console.error('v161 FN.obra',e)}
  return r};
/* o guarda do Pós-venda (FPV) confere que a função viva de FN.obra é a dele ou que a prova passa; este embrulho chama o dele
   por baixo (a garantia continua no número — o carimbo posvendaGarantia segue no resultado), então a viva registrada passa a
   ser esta, como o v153 já faz com a memória */
const vivo=(nome,nova,velha)=>{try{if(window.FPV&&FPV.__vivos&&FPV.__vivos[nome]===velha&&velha.__fpv){nova.__fpv=velha.__fpv;nova.__fpvNome=velha.__fpvNome;FPV.__vivos[nome]=nova}}catch(e){}};
vivo('FN.obra',FN.obra,_obra);
const _row=FS.obraRow;
FS.obraRow=function(o){const x=_row.apply(FS,arguments);if(!x)return x;
  try{x.receitaR=r2(x.contratado);x.lucroReal=r2(x.contratado-x.custoReal)}catch(e){}
  return x};

/* a ponte do custo real da obra (FC.ponteObra) dizia "impostos pelo avanço físico": passa a ser o imposto cheio, e continua fechando com r.custoR */
T(()=>{const fc=typeof FC==='object'?FC:window.FC;if(!fc||typeof fc.ponteObra!=='function')return;const _p=fc.ponteObra;
  fc.ponteObra=function(oid){const x=_p.apply(fc,arguments);if(!x||!x.r)return x;
    try{const imp=r2(x.r.imp);x.termos=x.termos.map(t=>/^Impostos pelo avanço/.test(t[0])?['Impostos lançados (estão nas saídas da planilha ligadas à obra)',0,t[2],'o imposto planejado ('+R$(imp)+') não é mais multiplicado pelo avanço — conta quando a guia/NF é lançada']:t);
      x.impAv=0;x.soma=r2(x.termos.reduce((a,t)=>a+t[1],0));x.custoR=r2(x.r.custoR);x.fecha=Math.abs(x.soma-x.custoR)<0.011}catch(e){}return x}});

/* ───────── 2 · o motor desta tela: uma linha por proposta em andamento, tudo vindo de FN.obra / FS.obraRow ───────── */
const sitObra=o=>T(()=>COP.situacao(o),null)||o.situacao||o.statusPlanilha||'';
const obrasAnd=()=>(S.db.obras||[]).filter(o=>o&&o.ativo!==false&&!o.inativo&&!o.merged_into&&!o.demo&&sitObra(o)==='Em andamento');
const travelCdc=()=>T(()=>new Set(FD1.TRAVEL.map(t=>t.cdc)),new Set(['204.1','204.2','204.3','204.4','204.5']));
const nomeCli=p=>T(()=>(get('clientes',p.cliente_id)||{}).nome,'')||p.cliente_nome||'';
function linhaVazia(p,o,uni){return {p,o,uni,numero:String(p.numero||p.id),cliente:nomeCli(p)||(o&&o.nome)||p.nome||'',obraNome:o?o.nome:'',
  contratado:0,linhas:{equip:0,mo:0,viagem:0,extras:0,projeto:0,garantia:0,planilha:0,com:0,outros:0},custos:0,resultado:0,margem:0,cor:'gr'}}
const LINHAS_LB={equip:'Equipamentos entregues (custo de compra)',mo:'Diárias apontadas (mão de obra)',viagem:'Viagem da obra (204.x · Uber, hotel, diárias, terceiros, frete)',extras:'Extras lançados na obra',projeto:'Horas de projeto',garantia:'Pós-venda em garantia',planilha:'Saídas da planilha ligadas à obra',com:'Comissões / RT (títulos)',outros:'Outros ajustes da obra'};
function fechar(L){L.custos=r2(Object.values(L.linhas).reduce((a,v)=>a+(+v||0),0));L.resultado=r2(L.contratado-L.custos);L.margem=L.contratado?L.resultado/L.contratado:0;
  L.cor=!L.contratado?'sv':!L.custos?'gr':L.resultado<0?'rd':L.margem<margemMin()?'am':'gn';return L}
/* uma obra → as linhas das suas propostas; o custo da obra que não é de uma proposta vai para a venda-base (a 1ª, a mesma das diárias) */
function daObra(o){const r=T(()=>FN.obra(o),null);if(!r||!Array.isArray(r.porProposta)||!r.porProposta.length)return {rows:[],excl:0};
  const x=T(()=>FS.obraRow(o),{custoReal:r.custoR,planilha:0});
  let excl=0;const rows=[];const TV=travelCdc();
  const viag=(S.db.fin&&S.db.fin.lancamentos||[]).filter(l=>l.obra_id===o.id&&l.tipo==='saida'&&TV.has(l.cdc));
  r.porProposta.forEach(pp=>{const p=pp.p;if(!real(p)){excl++;return}const L=linhaVazia(p,o,unidadeDe(p));
    L.contratado=r2(pp.v);L.linhas.equip=r2(pp.equipR);L.linhas.mo=r2(pp.moR);L.linhas.com=r2(pp.comR);L.impPlan=r2(pp.imp);rows.push(L)});
  if(!rows.length)return {rows,excl};
  /* viagem com proposta marcada vai para ela; o resto da obra, para a venda-base */
  const byId={};rows.forEach(L=>byId[L.p.id]=L);const base=byId[r.porProposta[0].p.id]||rows[0];
  let vSem=0;viag.forEach(l=>{const L=l.proposta_id&&byId[l.proposta_id];if(L)L.linhas.viagem=r2(L.linhas.viagem+(+l.valor||0));else vSem+=+l.valor||0});
  const vTot=r2(r.viagem?r.viagem.total:0);base.linhas.viagem=r2(base.linhas.viagem+vSem);
  base.linhas.extras=r2((+r.extrasR||0)-vTot);base.linhas.projeto=r2(r.projeto?r.projeto.custo:0);base.linhas.garantia=r2(+r.fpvLiq||0);base.linhas.planilha=r2(+x.planilha||0);
  /* fecha ao centavo com o Custo real de Financeiro › Obras (o que sobrar, nomeado, vai em "outros") */
  const tot=r2(rows.reduce((a,L)=>a+Object.values(L.linhas).reduce((b,v)=>b+(+v||0),0),0));
  const alvo=r2(+x.custoReal||0);const excCusto=r2(r.porProposta.filter(pp=>!real(pp.p)).reduce((a,pp)=>a+(+pp.equipR||0)+(+pp.moR||0)+(+pp.comR||0),0));
  const d=r2(alvo-excCusto-tot);if(Math.abs(d)>=0.01)base.linhas.outros=r2(base.linhas.outros+d);
  rows.forEach(fechar);return {rows,excl}}
function semObra(){return (S.db.propostas||[]).filter(p=>!p.obra_id&&['vendida','em_obra'].includes(p.estado)&&['focal','acustica'].includes(String(p.linha||'').toLowerCase())&&real(p)).map(p=>{
  const L=linhaVazia(p,null,unidadeDe(p));const pl=T(()=>FN.propPlano(p),null);L.contratado=r2(pl?pl.tot:T(()=>M.total(p),0));
  L.linhas.equip=r2(T(()=>FX1.equipReal([p]).total,0));L.impPlan=r2(pl?pl.imp:0);
  L.linhas.com=r2(sum((S.db.lancamentos||[]).filter(l=>l.categoria==='Comissão / RT'&&l.origem_id===p.id),l=>l.valor));
  const TV=travelCdc();L.linhas.viagem=r2(sum((S.db.fin&&S.db.fin.lancamentos||[]).filter(l=>l.proposta_id===p.id&&l.tipo==='saida'&&TV.has(l.cdc)),l=>l.valor));
  return fechar(L)})}
let MEMO=null;
function calc(){if(MEMO&&Date.now()-MEMO.t<1500)return MEMO.v;const v=comHist(calc0);MEMO={t:Date.now(),v};return v}
const totP=p=>r2(T(()=>+M.total(p),+p.valor_venda||0)||0);
const obrasDoCli=p=>nomeCli(p)||p.nome||'';
function calc0(){
  const obs=obrasAnd();const U={};UNIS.forEach(u=>U[u]={u,obras:[],comValor:[],semValor:[],valor:0,custos:0,comCusto:[],valorCusto:0,custoCusto:0,semObra:[],vSemObra:0});
  const O=obs.map(o=>{const d=daObra(o);const ps=(S.db.propostas||[]).filter(p=>p&&p.obra_id===o.id&&VEND.includes(p.estado)&&real(p));
    const porU={};ps.forEach(p=>{const k=U[unidadeDe(p)]?unidadeDe(p):'TAAG';const x=porU[k]=porU[k]||{v:0,ps:[]};x.v=r2(x.v+totP(p));x.ps.push(p)});
    if(!Object.keys(porU).length)porU.TAAG={v:0,ps:[]};
    const cu={};d.rows.forEach(L=>{const k=U[L.uni]?L.uni:'TAAG';cu[k]=r2((cu[k]||0)+L.custos)});
    const valor=r2(Object.values(porU).reduce((a,x)=>a+x.v,0)),custos=r2(Object.values(cu).reduce((a,x)=>a+x,0));
    return {o,porU,cu,valor,custos,cliente:T(()=>(get('clientes',o.cliente_id)||{}).nome,'')||''}});
  O.forEach(x=>Object.keys(x.porU).forEach(k=>{const X=U[k];const v=x.porU[k].v,c=+(x.cu[k]||0);const e={x,o:x.o,v,c,ps:x.porU[k].ps};
    X.obras.push(e);(v>0?X.comValor:X.semValor).push(e);X.valor=r2(X.valor+v);if(c>0.009){X.custos=r2(X.custos+c);if(v>0){X.comCusto.push(e);X.valorCusto=r2(X.valorCusto+v);X.custoCusto=r2(X.custoCusto+c)}}}));
  semObra().forEach(L=>{const k=U[L.uni]?L.uni:'TAAG';U[k].semObra.push(L);U[k].vSemObra=r2(U[k].vSemObra+L.contratado)});
  UNIS.forEach(k=>{const X=U[k];const by=(a,b)=>b.v-a.v||String(a.o.nome).localeCompare(String(b.o.nome),'pt');X.obras.sort(by);X.comValor.sort(by);X.semValor.sort((a,b)=>String(a.o.nome).localeCompare(String(b.o.nome),'pt'))});
  const com=O.filter(x=>x.valor>0),sem=O.filter(x=>!(x.valor>0)),cc=com.filter(x=>x.custos>0.009);
  const so=UNIS.reduce((a,k)=>a.concat(U[k].semObra),[]);
  const multi=O.filter(x=>Object.keys(x.porU).length>1).length;
  return {U,O,com,sem,comCusto:cc,semObra:so,multi,obras:O.length,
    tot:{obras:O.length,com:com.length,sem:sem.length,valor:r2(com.reduce((a,x)=>a+x.valor,0)),custos:r2(O.reduce((a,x)=>a+x.custos,0)),valorCusto:r2(cc.reduce((a,x)=>a+x.valor,0)),custoCusto:r2(cc.reduce((a,x)=>a+x.custos,0)),vSemObra:r2(so.reduce((a,L)=>a+L.contratado,0))}}}
const V161=window.V161=window.V161||{};
V161.calc=()=>{MEMO=null;return calc()};V161.comHist=comHist;V161.UNIS=UNIS;
/* Diretoria › Lucratividade: as mesmas linhas, regrupadas por obra (produto · garantia · despesas · impostos/comissões) */
V161.obraLucro=function(o,x,r){const d=comHist(()=>daObra(o));const all=d.rows;const s=k=>sum(all,L=>L.linhas[k]);
  const produto=s('equip'),gar=s('garantia'),despesas=r2(s('mo')+s('viagem')+s('extras')+s('projeto')+s('planilha')+s('outros')),impCom=r2(s('com'));
  const receita=r2(x?x.contratado:sum(all,L=>L.contratado));return {receita,produto,gar,despesas,impCom,lucro:r2(receita-produto-gar-despesas-impCom)}};

/* ───────── 3 · peças de desenho ───────── */
const CHIP={gn:['no lucro · acima da margem mínima',COR.verde],am:['lucro abaixo da margem mínima',COR.amb],rd:['dando prejuízo',COR.verm],gr:['sem custo lançado ainda',COR.cinza],sv:['sem valor de contrato na Base',COR.cinza],nd:['nenhuma proposta em andamento',COR.cinza]};
const chip=c=>`<span class="v161-chip v161-${c}">${E(CHIP[c][0])}</span>`;
const op=(k,a)=>`V130_open('v161:${J(k)}'${a!=null?`,'${J(a)}'`:''})`;
const ST=window.__V161S=window.__V161S||{dr:null,arg:null,f:null};
const CSS=`<style id="v161css">
.vx .v161{margin-top:14px}
.vx .v161 h4 .v161-mm{font-weight:400;font-size:12px;opacity:.7;margin-left:6px}
.vx .v161-row{display:grid;grid-template-columns:minmax(120px,160px) minmax(80px,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-top:1px solid rgba(120,120,128,.14);font-size:13.5px;cursor:pointer}
.vx .v161-row:first-of-type{border-top:0}.vx .v161-row:hover{background:rgba(61,90,254,.05)}
.vx .v161-row .l b{display:block}.vx .v161-row .l span{font-size:12px;opacity:.7}
.vx .v161-row .t{position:relative;height:12px;background:rgba(120,120,128,.16);border-radius:999px;overflow:hidden;display:flex}
.vx .v161-row .t i{display:block;height:100%}
.vx .v161-row .r{text-align:right;white-space:nowrap}.vx .v161-row .r b{border-bottom:2px dotted rgba(120,120,128,.6)}.vx .v161-row .r>span{display:block;font-size:12px;opacity:.75}.vx .v161-row .r .v161-chip{margin-left:4px}
.v161-chip{display:inline-block;border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:600;white-space:nowrap}
.v161-gn{background:rgba(18,161,80,.14);color:#0b7a3b}.v161-am{background:rgba(224,164,0,.18);color:#8a6500}.v161-rd{background:rgba(208,59,59,.14);color:#b02a2a}.v161-gr,.v161-sv,.v161-nd{background:rgba(120,120,128,.16);color:inherit;opacity:.85}
.v161-pos{color:#0b7a3b}.v161-neg{color:#b02a2a}
#v161_obra .v161-pl td,#v161_obra .v161-pl th{padding:5px 8px}
@media(max-width:600px){.vx .v161-row{grid-template-columns:1fr}.vx .v161-row .r{text-align:left}}
</style>`;
function css(){if(document.getElementById('v161css'))return;const d=document.createElement('div');d.innerHTML=CSS;const st=d.firstElementChild;if(st)(document.head||document.documentElement).appendChild(st)}
const AGUARDA='resultado: aguardando custos (produtos entregues e despesas do Financeiro)';
const lk=(t,on)=>`<u role="button" onclick="event.stopPropagation();${on}">${t}</u>`;
function tileHTML(){const R=calc();const mx=Math.max(1,R.tot.valor);
  const rows=UNIS.map(u=>{const x=R.U[u];const w=x.valor/mx*100;
    const sub=!x.obras.length&&!x.semObra.length?'nenhuma obra em andamento':[x.obras.length?`${plural(x.obras.length,'obra em andamento','obras em andamento')} · ${N0(x.comValor.length)} com valor de venda · ${x.semValor.length?lk(N0(x.semValor.length)+' sem valor na Base',op('sv',u)):'0 sem valor na Base'}`:'nenhuma obra em andamento',x.semObra.length?lk(plural(x.semObra.length,'venda sem obra ligada','vendas sem obra ligada'),op('so',u)):''].filter(Boolean).join(' · ');
    const res=x.custos>0?`custos lançados ${R$(x.custoCusto)} em ${plural(x.comCusto.length,'obra','obras')} com valor e custo · resultado dessas obras ${R$(r2(x.valorCusto-x.custoCusto))}`:AGUARDA;
    return `<div class="v161-row" role="button" tabindex="0" data-uni="${E(u)}" data-obras="${x.obras.length}" data-com="${x.comValor.length}" data-sem="${x.semValor.length}" data-semobra="${x.semObra.length}" onclick="${op('uni',u)}"><div class="l"><b>${E(u)}</b><span>${sub}</span></div>
      <div class="t" title="parte do valor vendido em andamento: ${E(R$(x.valor))} de ${E(R$(R.tot.valor))}"><i style="width:${w.toFixed(1)}%;background:#2a78d6"></i></div>
      <div class="r">${x.obras.length?`<b>${R$(x.valor)}</b><span>valor vendido${x.comValor.length?' de '+plural(x.comValor.length,'obra','obras'):''} · ${E(res)}</span>`:`<b>—</b><span>nenhuma obra em andamento${x.semObra.length?' · as vendas sem obra não são valor em andamento':''}</span>`}</div></div>`}).join('');
  const u=(t,on)=>`<u role="button" onclick="${on}">${t}</u>`;const tt=R.tot;
  const pont=`<div class="vx-ponte" id="v161_ponte" data-obras="${tt.obras}" data-com="${tt.com}" data-sem="${tt.sem}">Ponte: ${u(plural(tt.obras,'obra em andamento','obras em andamento'),op('uni','*'))} = ${u(N0(tt.com)+' com valor',op('uni','*'))} + ${u(N0(tt.sem)+' sem valor',op('sv','*'))} <span class="sub">(sem valor de venda na Base — chega com as propostas e o Financeiro; não conta como R$ 0)</span> · ${R$(tt.valor)} = soma das vendas de ${plural(tt.com,'obra','obras')} = ${UNIS.filter(k=>R.U[k].comValor.length).map(k=>u(R$(R.U[k].valor)+' '+E(k),op('uni',k))).join(' + ')||'—'}`+
    (R.multi?` <span class="sub">(${plural(R.multi,'obra tem','obras têm')} vendas de duas unidades e aparece${R.multi===1?'':'m'} nas duas linhas)</span>`:'')+
    (R.semObra.length?` · ${u(plural(R.semObra.length,'venda sem obra ligada','vendas sem obra ligada'),op('so','*'))} (${UNIS.filter(k=>R.U[k].semObra.length).map(k=>N0(R.U[k].semObra.length)+' '+E(k)).join(' + ')} · ${R$(tt.vSemObra)}) fora do valor em andamento — ainda não têm obra`:'')+
    ` · ${tt.custos>0?`custos lançados ${R$(tt.custoCusto)} em ${plural(R.comCusto.length,'obra','obras')} com valor e custo · resultado dessas obras ${R$(r2(tt.valorCusto-tt.custoCusto))}`:AGUARDA}</div>`;
  css();return `<div class="vx149-box v161" id="v161_tile" data-obras="${tt.obras}" data-total="${tt.valor}"><h4 role="button" style="cursor:pointer" onclick="${op('uni','*')}">Rentabilidade em andamento <span class="v161-mm">por obra · valor vendido · barra = parte do valor vendido</span> <span class="vx149-h4go">›</span></h4>${rows}</div>`+pont}

/* ───────── 4 · a gaveta (vira o painel curto do v155) ───────── */
const go=h=>`V130_go('${J(h)}')`;
/* a linha abre a conta da obra (ou a proposta, se for venda sem obra) por uma função desta camada — sem rota no clique, a linha
   não ganha botão de excluir de outra camada (excluir é só na Base) */
const linkL=L=>L.o?`V161.ir('o','${J(L.o.id)}')`:`V161.ir('p','${J(L.p.id)}')`;
V161.ir=(t,id)=>{ST.dr=null;ST.arg=null;try{const o=document.getElementById('v155-ov');if(o)o.remove()}catch(e){}let h='#/fobras/'+id;
  /* venda sem obra: abre Comercial › Propostas já buscando o número (o editor ainda não abre propostas importadas sem itens) */
  if(t==='p'){const p=T(()=>get('propostas',id),null);h='#/propostas';try{S.propF={st:'',fr:'',q:String(p?p.numero:id),cons:'',ym:''}}catch(e){}}
  try{GO0(h)}catch(e){location.hash=h}};
function gaveta(k,a){if(!['uni','sv','so'].includes(k))return '';const R=calc();const all=a==='*';const lb=all?'todas as unidades':a;
  const X=all?null:R.U[a];if(!all&&!X)return '';
  const com=all?R.com.map(x=>({x,o:x.o,v:x.valor,c:x.custos,ps:Object.values(x.porU).reduce((q,y)=>q.concat(y.ps),[])})):X.comValor;
  const sem=all?R.sem.map(x=>({x,o:x.o,v:0,c:x.custos,ps:Object.values(x.porU).reduce((q,y)=>q.concat(y.ps),[])})):X.semValor;
  const so=all?R.semObra:X.semObra;const temCusto=com.some(e=>e.c>0.009);
  const vt=r2(com.reduce((s_,e)=>s_+e.v,0));const cc=com.filter(e=>e.c>0.009);
  const nums=e=>e.ps.map(p=>E(p.numero)).join(', ')||'—';
  const tCom=com.map(e=>`<tr class="click" onclick="V161.ir('o','${J(e.o.id)}')"><td><b>${E(e.o.nome)}</b><div style="font-size:12px;opacity:.75">${E(e.x.cliente||'')} · propostas ${nums(e)}</div></td><td>${R$(e.v)}</td>${temCusto?`<td>${e.c>0.009?R$(e.c):'—'}</td><td>${e.c>0.009?R$(r2(e.v-e.c)):'aguardando custos'}</td>`:''}</tr>`).join('');
  const tSem=sem.map(e=>`<tr class="click" onclick="V161.ir('o','${J(e.o.id)}')"><td><b>${E(e.o.nome)}</b><div style="font-size:12px;opacity:.75">${E(e.x.cliente||'')} · ${e.ps.length?'propostas '+nums(e)+' sem valor de venda':'nenhuma proposta vendida ligada'}</div></td><td>sem valor de venda na Base</td></tr>`).join('');
  const tSo=so.map(L=>`<tr class="click" onclick="V161.ir('p','${J(L.p.id)}')"><td><b>${E(L.numero)}</b> · ${E(L.cliente||'—')}</td><td>${E(L.uni)}</td><td>${R$(L.contratado)}</td></tr>`).join('');
  const secCom=`<h4 style="margin-top:14px">${plural(com.length,'obra com valor de venda','obras com valor de venda')} · ${R$(vt)}</h4>`+(com.length?`<div class="tw"><table class="no-filter"><thead><tr><th>Obra · cliente · propostas</th><th>Valor vendido</th>${temCusto?'<th>Custos lançados</th><th>Resultado</th>':''}</tr></thead><tbody>${tCom}<tr class="tot"><td>Total</td><td>${R$(vt)}</td>${temCusto?`<td>${R$(cc.reduce((s_,e)=>s_+e.c,0))}</td><td>${plural(cc.length,'obra com custo','obras com custo')}</td>`:''}</tr></tbody></table></div>`:'<div class="note">Nenhuma.</div>');
  const secSem=`<h4 style="margin-top:14px" id="v161_sv">${plural(sem.length,'obra em andamento sem valor de venda na Base','obras em andamento sem valor de venda na Base')} <span style="font-weight:400;font-size:12px;opacity:.75">(chega com as propostas e o Financeiro — não conta como R$ 0)</span></h4>`+(sem.length?`<div class="tw"><table class="no-filter"><thead><tr><th>Obra · cliente</th><th>Valor</th></tr></thead><tbody>${tSem}</tbody></table></div>`:'<div class="note">Nenhuma.</div>');
  const secSo=so.length?`<h4 style="margin-top:14px" id="v161_so">${plural(so.length,'venda sem obra ligada','vendas sem obra ligada')} · ${R$(so.reduce((s_,L)=>s_+L.contratado,0))} <span style="font-weight:400;font-size:12px;opacity:.75">(METAS 2026 sem obra — fora do valor em andamento; nenhuma obra foi criada nem ligada)</span></h4><div class="tw"><table class="no-filter"><thead><tr><th>Proposta · cliente</th><th>Unidade</th><th>Valor da venda</th></tr></thead><tbody>${tSo}</tbody></table></div>`:'';
  const obrasN=com.length+sem.length;
  const head_=`<button class="x" onclick="V130_close()" aria-label="Fechar">×</button><div class="lead">Empresa toda · posição de hoje</div>`+
    `<h3>Rentabilidade em andamento · ${E(k==='sv'?'sem valor de venda':k==='so'?'vendas sem obra':lb)}${k==='uni'?`<span data-v161="${E(a)}" hidden></span>`:''}</h3><div class="big">${k==='sv'?plural(sem.length,'obra','obras'):k==='so'?plural(so.length,'venda','vendas'):R$(vt)}</div>`+
    `<div class="lead">valor vendido · ${plural(obrasN,'obra em andamento','obras em andamento')} = ${N0(com.length)} com valor + ${N0(sem.length)} sem valor · ${R$(vt)} = soma das vendas de ${plural(com.length,'obra','obras')}${so.length?' · '+plural(so.length,'venda sem obra ligada','vendas sem obra ligada')+' fora':''} · ${temCusto?`custos lançados em ${plural(cc.length,'obra','obras')} com valor e custo`:E(AGUARDA)}</div>`+
    `<div class="vx149-fonte"><b>De onde vem:</b> uma linha do Painel de Controle = uma obra (situação Em andamento, a mesma lista do Início › Operações). Valor da obra = soma do valor de venda das propostas vendidas dela (METAS 2026, Painel de Controle, Controle de AT). Obra sem venda com valor fica na lista com nome — não é R$ 0. Custos = só o que já foi lançado na Base (equipamentos entregues ao custo de compra, diárias apontadas, viagem 204.x, extras, projeto, garantia, saídas da planilha ligadas à obra, comissões); enquanto não há custo lançado, não há margem nem resultado.</div>`;
  const ordem=k==='sv'?secSem+secCom+secSo:k==='so'?secSo+secCom+secSem:secCom+secSem+secSo;
  return head_+ordem+(k==='uni'?`<a class="btnl" href="javascript:void 0" onclick="V161.abrir('${J(a)}')">Abrir Financeiro › Obras (estas obras) ›</a>`:'')}

/* plumbing: chaves "v161:…" no V130_open */
const OPEN0=window.V130_open,CLOSE0=window.V130_close,GO0=window.V130_go;
if(typeof OPEN0==='function'){
  window.V130_open=(k,a)=>{if(String(k).startsWith('v161:')){ST.dr=String(k).slice(5);ST.arg=a==null?null:a}else{ST.dr=null;ST.arg=null}return OPEN0(k,a)};
  window.V130_close=()=>{ST.dr=null;ST.arg=null;return CLOSE0()};
  window.V130_go=h=>{ST.dr=null;ST.arg=null;return GO0(h)};
}

/* ───────── 5 · "Abrir na tela, já filtrado" → Financeiro › Obras só com as obras dessas propostas ───────── */
V161.abrir=function(a){ST.f={uni:a,t:Date.now()};ST.dr=null;ST.arg=null;
  try{if(typeof FS.obF==='function'){FS.obF('status','');FS.obF('uni','')}}catch(e){}
  try{if(window.V155D&&V155D.limpar)V155D.limpar()}catch(e){}
  try{const o=document.getElementById('v155-ov');if(o)o.remove()}catch(e){}
  if(location.hash==='#/fobras'){try{render()}catch(e){}}else{try{GO0('#/fobras')}catch(e){location.hash='#/fobras'}}};
/* o painel do v155 pergunta ao v156 antes de filtrar sozinho: a gaveta desta tela tem o seu próprio filtro exato */
(function liga(n){if(window.V156&&typeof V156.painel==='function'&&!V156.painel.__v161){const P=V156.painel;V156.painel=function(D,ctx){const m=/data-v161="([^"]*)"/.exec(String(D&&D.lb||''));
    if(m){try{if(ctx&&ctx.tirar)ctx.tirar()}catch(e){}V161.abrir(m[1].replace(/&amp;/g,'&'));return true}return P.apply(this,arguments)};V156.painel.__v161=true;return}
  if(n<60)setTimeout(()=>liga(n+1),500)})(0);
window.addEventListener('hashchange',()=>{if(ST.f&&!/^#\/fobras(\/|$)/.test(location.hash))ST.f=null});
const _obras=FS.obras;
FS.obras=function(){const all=_obras.apply(FS,arguments);if(!ST.f||!/^#\/fobras$/.test(location.hash||''))return all;
  const R=calc();const ids=new Set(ST.f.uni==='*'?R.O.map(x=>x.o.id):((R.U[ST.f.uni]||{obras:[]}).obras.map(e=>e.o.id)));return all.filter(o=>ids.has(o.id))};
function banner(){const R=calc();const a=ST.f.uni;const all=a==='*';const lb=all?'todas as unidades':a;const X=all?null:R.U[a]||{obras:[],comValor:[],semValor:[],semObra:[],valor:0};
  const nO=all?R.obras:X.obras.length,nC=all?R.com.length:X.comValor.length,nS=all?R.sem.length:X.semValor.length,v=all?R.tot.valor:X.valor,so=all?R.semObra:X.semObra;
  const lkp=L=>`<a href="javascript:void 0" onclick="V161.ir('p','${J(L.p.id)}')" style="color:inherit;text-decoration:underline">${E(L.numero)} · ${E(L.cliente)}</a>`;
  return `<div class="card p-3 mb-3" id="v161_ban" data-n="${nO}" style="background:rgba(0,113,227,.10);display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:240px"><b>Filtrado pela Rentabilidade em andamento · ${E(lb)}</b>: ${plural(nO,'obra em andamento','obras em andamento')} = ${N0(nC)} com valor de venda + ${N0(nS)} sem valor na Base · ${R$(v)} = soma das vendas de ${plural(nC,'obra','obras')}${so.length?` · ${plural(so.length,'venda sem obra ligada','vendas sem obra ligada')} (não aparecem aqui): ${so.slice(0,10).map(lkp).join(' · ')}${so.length>10?' · + '+N0(so.length-10):''}`:''}. A coluna Margem desta tabela é a PREVISTA (custo previsto); o resultado real aguarda os custos lançados.</span><button type="button" class="btn-soft" onclick="V161.limpar()">Mostrar tudo ✕</button></div>`}
V161.limpar=()=>{ST.f=null;try{render()}catch(e){}};
const _fob=SCREENS.fobras;
SCREENS.fobras=function(arg){const self=this,args=arguments;let h=comHist(()=>_fob.apply(self,args));if(typeof h!=='string')return h;
  try{if(!arg){h=h.replace('Lucro real = receita reconhecida (avanço) − custo real.','Lucro real = contratado (valor cheio do contrato, sem multiplicar pelo avanço) − custo real lançado.').replace('Contratado = propostas confirmadas pelo Financeiro','Contratado = propostas vendidas (confirmadas pelo Financeiro ou vindas da METAS 2026 / Painel de Controle / Controle de AT), valor cheio');
      h=h.replace('<th class="text-end">Margem</th>','<th class="text-end" title="Lucro previsto ÷ contratado — calculada com o custo PREVISTO, não com custos lançados">Margem prevista</th>').replace('<th class="text-end">Lucro previsto</th>','<th class="text-end" title="contratado − custo previsto">Lucro previsto</th>').replace('<th class="text-end">Lucro real</th>','<th class="text-end" title="contratado − custos já lançados (sem custo lançado = o próprio contratado: ainda não é resultado)">Lucro real (só lançados)</th>');
      h=h.replace('o custo previsto × real e a margem.','o custo previsto × real e a margem PREVISTA (com o custo previsto). Lucro real só desconta o que já foi lançado — sem custo lançado ainda não é resultado.');
      if(ST.f){const i=h.indexOf('<div class="card p-3 mb-3" id="fs_obras_ponte"');const b=banner();h=i>=0?h.slice(0,i)+b+h.slice(i):b+h}}
    else{const o=T(()=>get('obras',arg),null);if(o){h=h.replace(/recebido − custo real/g,'contratado − custo real');const c=comHist(()=>cardObra(o));if(c){const i=h.indexOf('<div class="card');h=i>=0?h.slice(0,i)+c+h.slice(i):h+c}}}
  }catch(e){console.error('v161 fobras',e)}return h};
Object.keys(_fob).forEach(k=>{try{SCREENS.fobras[k]=_fob[k]}catch(e){}});
vivo('SCREENS.fobras',SCREENS.fobras,_fob);
/* a página da obra: o resultado de cada proposta, com todas as linhas de custo (mesmo zeradas) */
function cardObra(o){css();const d=daObra(o);if(!d.rows.length)return '';const ks=Object.keys(LINHAS_LB).filter(k=>k!=='outros'||d.rows.some(L=>L.linhas.outros));
  const c=sum(d.rows,L=>L.contratado),cu=sum(d.rows,L=>L.custos);const and=sitObra(o)==='Em andamento';
  const th=d.rows.map(L=>`<th class="text-end">${E(L.numero)}<div class="sub" style="font-weight:400">${E(L.uni)}</div></th>`).join('');
  const tr=(lb,f,bold)=>`<tr${bold?' style="font-weight:700"':''}><td>${lb}</td>${d.rows.map(L=>`<td class="text-end">${f(L)}</td>`).join('')}${d.rows.length>1?`<td class="text-end"><b>${R$(sum(d.rows,L=>+String(f(L,true))||0))}</b></td>`:''}</tr>`;
  const num=k=>(L,raw)=>raw?L.linhas[k]:R$(L.linhas[k]);
  return `<div class="card p-3 mb-3 fx2-wrapped" id="v161_obra" data-contratado="${c}" data-custos="${cu}"><h6 class="mb-0">Rentabilidade ${and?'em andamento':'da obra'} · contrato cheio − custos lançados</h6><div class="sub mb-2">Receita = valor cheio de cada contrato (sem multiplicar pelo avanço). Custos = só o que já foi lançado na Base; cada linha entra sozinha quando o custo é lançado (Operação › Apontamento de obra, Estoque, Financeiro). Custo da obra que não é de uma proposta fica na venda-base (${E(d.rows[0].numero)}).</div>
  <div class="tblwrap"><table class="tbl v161-pl no-filter"><thead><tr><th>Linha</th>${th}${d.rows.length>1?'<th class="text-end">Obra</th>':''}</tr></thead><tbody>
  ${tr('Contratado (valor cheio)',(L,raw)=>raw?L.contratado:R$(L.contratado),true)}
  ${ks.map(k=>tr('− '+E(LINHAS_LB[k]),num(k))).join('')}
  ${tr('Custos lançados',(L,raw)=>raw?L.custos:R$(L.custos),true)}
  ${tr('Resultado',(L,raw)=>raw?(L.custos>0.009?L.resultado:0):(L.custos>0.009?`<span class="${L.resultado<0?'v161-neg':'v161-pos'}">${R$(L.resultado)}</span>`:'<span class="sub">aguardando custos</span>'),true)}
  <tr><td>Situação</td>${d.rows.map(L=>`<td class="text-end">${L.custos>0.009?chip(L.cor)+(L.contratado?`<div class="sub">${P1(L.margem)}</div>`:''):`<span class="v161-chip v161-gr">${L.contratado?'aguardando custos':'sem valor de venda na Base'}</span>`}</td>`).join('')}${d.rows.length>1?'<td></td>':''}</tr>
  </tbody></table></div><div class="sub mt-1" style="font-size:12px">Ponte: ${R$(c)} contratado${cu>0.009?` − ${R$(cu)} custos lançados = ${R$(r2(c-cu))}`:` · ${E(AGUARDA)}`} · o mesmo Contratado e Custo real da linha desta obra em Financeiro › Obras.</div></div>`}

/* ───────── 6 · Início: o cartão pequeno dentro do bloco Financeiro + a gaveta ───────── */
const can=()=>T(()=>{const AC=(window.V130API||{}).AC||{};return AC.fin?AC.fin():true},true);
const HOME0=SCREENS.home;
SCREENS.home=function(){let h=HOME0.apply(this,arguments);if(typeof h!=='string'||h.indexOf('id="v130_root"')<0)return h;
  try{if(can()&&h.indexOf('id="v161_tile"')<0){const i=h.indexOf('id="v130_s_b6"');let tile=null;
      if(i>=0){const j=h.indexOf('</section>',i);const k=h.lastIndexOf('</div></div></section>',j+10);if(j>0&&k>i){tile=tileHTML();h=h.slice(0,k)+tile+h.slice(k)}}
      if(!tile){const f=h.indexOf('<div class="vx-foot">');if(f>=0)h=h.slice(0,f)+`<section class="sec vx-s vx149" id="v130_s_b6r"><div class="rx"><div class="card wide">${tileHTML()}</div></div></section>`+h.slice(f)}}
    if(ST.dr&&h.indexOf('id="v130_drawer"')<0){const dr=T(()=>gaveta(ST.dr,ST.arg),'');if(dr)h+=`<div class="vd vd-ov fx2-wrapped" style="background:rgba(0,0,0,.38)" onclick="if(event.target===this)V130_close()"><div class="vd-dr" id="v130_drawer">${dr}</div></div>`}
  }catch(e){console.error('v161 home',e)}return h};
Object.keys(HOME0).forEach(k=>{try{SCREENS.home[k]=HOME0[k]}catch(e){}});
try{if(/^#\/(home)?$|^#?$/.test(location.hash)){if(typeof renderMain==='function')renderMain();else render()}}catch(e){}
})();
