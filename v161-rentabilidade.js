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
function calc0(){
  const rows=[];let excl=0;const obs=obrasAnd();obs.forEach(o=>{const d=daObra(o);excl+=d.excl;rows.push(...d.rows)});
  const so=semObra();rows.push(...so);
  const U={};UNIS.forEach(u=>U[u]={u,rows:[],contratado:0,custos:0,resultado:0,margem:0,semValor:0,semCusto:0});
  rows.forEach(L=>{const k=U[L.uni]?L.uni:'TAAG';(U[k].rows).push(L)});
  UNIS.forEach(u=>{const x=U[u];x.contratado=sum(x.rows,L=>L.contratado);x.custos=sum(x.rows,L=>L.custos);x.resultado=r2(x.contratado-x.custos);x.margem=x.contratado?x.resultado/x.contratado:0;
    x.semValor=x.rows.filter(L=>!L.contratado).length;x.semCusto=x.rows.filter(L=>L.contratado&&!L.custos).length;
    x.cor=!x.rows.length?'nd':!x.contratado?'sv':!x.custos?'gr':x.resultado<0?'rd':x.margem<margemMin()?'am':'gn';
    x.obras=new Set(x.rows.filter(L=>L.o).map(L=>L.o.id));x.nSemObra=x.rows.filter(L=>!L.o).length;
    x.rows.sort((a,b)=>b.contratado-a.contratado||String(a.cliente).localeCompare(String(b.cliente),'pt'))});
  const v={U,rows,obras:obs.length,excl,tot:{n:rows.length,contratado:sum(rows,L=>L.contratado),custos:sum(rows,L=>L.custos)}};v.tot.resultado=r2(v.tot.contratado-v.tot.custos);
  return v}
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
function tileHTML(){const R=calc();const mm=margemMin();const mx=Math.max(1,...UNIS.map(u=>R.U[u].contratado));
  const rows=UNIS.map(u=>{const x=R.U[u];const w=x.contratado/mx*100;const wc=x.contratado?Math.min(1,x.custos/x.contratado):0;
    const cor=x.cor==='rd'?COR.verm:x.cor==='am'?COR.amb:x.cor==='gn'?COR.verde:COR.cinza;
    const sub=!x.rows.length?'nenhuma em andamento':plural(x.rows.length,'proposta','propostas')+(x.semValor?' · '+N0(x.semValor)+' sem valor':'');
    return `<div class="v161-row" role="button" tabindex="0" data-uni="${E(u)}" onclick="${op('uni',u)}"><div class="l"><b>${E(u)}</b><span>${sub}</span></div>
      <div class="t" title="contratado ${E(R$(x.contratado))} · custos lançados ${E(R$(x.custos))}"><i style="width:${(w*(1-wc)).toFixed(1)}%;background:${cor}"></i><i style="width:${(w*wc).toFixed(1)}%;background:${COR.verm};opacity:.55"></i></div>
      <div class="r"><b class="${x.resultado<0?'v161-neg':x.resultado>0?'v161-pos':''}">${R$(x.resultado)}</b>${x.contratado?' ('+(x.resultado>=0?'+':'')+P1(x.margem)+')':''}<span>${R$(x.contratado)} contratado − ${R$(x.custos)} custos · ${chip(x.cor)}</span></div></div>`}).join('');
  const u=(t,on)=>`<u role="button" onclick="${on}">${t}</u>`;
  const pont=`<div class="vx-ponte">Ponte: ${u(R$(R.tot.contratado)+' contratado',op('uni','*'))} = ${UNIS.map(k=>u(R$(R.U[k].contratado)+' '+E(k),op('uni',k))).join(' + ')} · ${u(plural(R.tot.n,'proposta','propostas'),op('uni','*'))} = ${UNIS.map(k=>u(N0(R.U[k].rows.length)+' '+E(k),op('uni',k))).join(' + ')} · resultado ${u(R$(R.tot.resultado),op('uni','*'))} = ${R$(R.tot.contratado)} − ${R$(R.tot.custos)} custos lançados</div>`;
  css();return `<div class="vx149-box v161" id="v161_tile" data-n="${R.tot.n}" data-total="${R.tot.contratado}"><h4 role="button" style="cursor:pointer" onclick="${op('uni','*')}">Rentabilidade em andamento <span class="v161-mm">contrato cheio − custos lançados · verde ≥ ${P1(mm)} de margem (Base)</span> <span class="vx149-h4go">›</span></h4>${rows}</div>`+pont}

/* ───────── 4 · a gaveta (vira o painel curto do v155) ───────── */
const go=h=>`V130_go('${J(h)}')`;
/* a linha abre a conta da obra (ou a proposta, se for venda sem obra) por uma função desta camada — sem rota no clique, a linha
   não ganha botão de excluir de outra camada (excluir é só na Base) */
const linkL=L=>L.o?`V161.ir('o','${J(L.o.id)}')`:`V161.ir('p','${J(L.p.id)}')`;
V161.ir=(t,id)=>{ST.dr=null;ST.arg=null;try{const o=document.getElementById('v155-ov');if(o)o.remove()}catch(e){}let h='#/fobras/'+id;
  /* venda sem obra: abre Comercial › Propostas já buscando o número (o editor ainda não abre propostas importadas sem itens) */
  if(t==='p'){const p=T(()=>get('propostas',id),null);h='#/propostas';try{S.propF={st:'',fr:'',q:String(p?p.numero:id),cons:'',ym:''}}catch(e){}}
  try{GO0(h)}catch(e){location.hash=h}};
function gaveta(k,a){if(k!=='uni')return '';const R=calc();const xs=a==='*'?R.rows.slice().sort((x,y)=>y.contratado-x.contratado):(R.U[a]||{rows:[]}).rows;
  const lb=a==='*'?'todas as unidades':a;const c=sum(xs,L=>L.contratado),cu=sum(xs,L=>L.custos),res=r2(c-cu);
  const semC=xs.filter(L=>L.contratado&&!L.custos).length,semV=xs.filter(L=>!L.contratado).length;
  const nObras=new Set(xs.filter(L=>L.o).map(L=>L.o.id)).size,nSem=xs.filter(L=>!L.o).length;
  const trs=xs.map(L=>`<tr class="click" onclick="${linkL(L)}"><td><b>${E(L.numero)}</b> · ${E(L.cliente||'—')}${L.obraNome&&L.obraNome!==L.cliente?` <span style="opacity:.7">(${E(L.obraNome)})</span>`:''}<div style="margin-top:3px">${chip(L.cor)}${L.contratado&&L.custos?` <span style="font-size:12px;opacity:.75">margem ${P1(L.margem)}</span>`:''}</div></td>${a==='*'?`<td>${E(L.uni)}</td>`:''}<td>contratado ${R$(L.contratado)}</td><td>custos ${R$(L.custos)}</td><td><span class="${L.resultado<0?'v161-neg':''}">${R$(L.resultado)}</span></td></tr>`).join('');
  return `<button class="x" onclick="V130_close()" aria-label="Fechar">×</button><div class="lead">Empresa toda · posição de hoje</div>`+
    `<h3>Rentabilidade em andamento · ${E(lb)}<span data-v161="${E(a)}" hidden></span></h3><div class="big">${R$(res)}</div>`+
    `<div class="lead">${R$(c)} contratado − ${R$(cu)} custos lançados · ${plural(xs.length,'proposta','propostas')} em ${plural(nObras,'obra','obras')}${nSem?' + '+plural(nSem,'venda sem obra','vendas sem obra'):''}${semC?' · '+N0(semC)+' sem custo lançado ainda':''}${semV?' · '+N0(semV)+' sem valor de contrato':''}</div>`+
    `<div class="vx149-fonte"><b>De onde vem:</b> Financeiro › Obras (FN.obra / FS.obraRow). Contratado = valor cheio do contrato de cada proposta vendida (sem multiplicar pelo avanço). Custos = só o que já foi lançado na Base: equipamentos entregues ao custo de compra, diárias apontadas, viagem 204.x, extras, horas de projeto, garantia do Pós-venda, saídas da planilha ligadas à obra (onde entram também os impostos pagos) e comissões/RT. O imposto planejado da proposta não entra enquanto não é lançado. Em andamento = propostas das obras com situação "Em andamento" + vendas Focal/Acústica sem obra ainda vendidas. Cor: verde ≥ ${P1(margemMin())} (Base › margem mínima), amarelo abaixo dela, vermelho negativo, cinza sem custo lançado.</div>`+
    (xs.length?`<div class="tw"><table class="no-filter"><thead><tr><th>Proposta · cliente / obra</th>${a==='*'?'<th>Unidade</th>':''}<th>Contratado</th><th>Custos</th><th>Resultado</th></tr></thead><tbody>${trs}<tr class="tot"><td>Total</td>${a==='*'?'<td></td>':''}<td>contratado ${R$(c)}</td><td>custos ${R$(cu)}</td><td>${R$(res)}</td></tr></tbody></table></div>`+
      (Math.abs(c-(a==='*'?R.tot.contratado:R.U[a].contratado))<0.01?`<div class="note"><span class="ok">✓ a soma das linhas é exatamente o número do cartão</span></div>`:`<div class="note"><span class="bad">A soma das linhas difere do cartão.</span></div>`)
      :`<div class="note">Nenhuma proposta em andamento nesta unidade.</div>`)+
    `<a class="btnl" href="javascript:void 0" onclick="V161.abrir('${J(a)}')/* V130_go('#/fobras') */">Abrir Financeiro › Obras ›</a>`}

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
  const R=calc();const xs=ST.f.uni==='*'?R.rows:(R.U[ST.f.uni]||{rows:[]}).rows;const ids=new Set(xs.filter(L=>L.o).map(L=>L.o.id));return all.filter(o=>ids.has(o.id))};
function banner(){const R=calc();const a=ST.f.uni;const xs=a==='*'?R.rows:(R.U[a]||{rows:[]}).rows;const lb=a==='*'?'todas as unidades':a;
  const ob=xs.filter(L=>L.o),sem=xs.filter(L=>!L.o);const ids=new Set(ob.map(L=>L.o.id));
  const cObra=comHist(()=>sum([...ids].map(id=>T(()=>FS.obraRow(get('obras',id)),{contratado:0})),x=>x.contratado));const cU=sum(ob,L=>L.contratado);const outras=r2(cObra-cU);
  const lk=L=>`<a href="javascript:void 0" onclick="V161.ir('p','${J(L.p.id)}')" style="color:inherit;text-decoration:underline">${E(L.numero)} · ${E(L.cliente)}</a>`;
  return `<div class="card p-3 mb-3" id="v161_ban" data-n="${ids.size}" style="background:rgba(0,113,227,.10);display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:240px"><b>Filtrado pela Rentabilidade em andamento · ${E(lb)}</b>: ${plural(xs.length,'proposta','propostas')} = ${N0(ob.length)} em ${plural(ids.size,'obra','obras')} desta lista${sem.length?` + ${plural(sem.length,'venda sem obra','vendas sem obra')} (não aparecem aqui): ${sem.slice(0,10).map(lk).join(' · ')}${sem.length>10?' · + '+N0(sem.length-10):''}`:''}.`+
    ` Contratado nas obras ${R$(cObra)} = ${R$(cU)} de ${E(lb)}${outras>=0.01?` + ${R$(outras)} de outras unidades nas mesmas obras`:''}${sem.length?` · fora da lista: ${R$(sum(sem,L=>L.contratado))}`:''}.</span><button type="button" class="btn-soft" onclick="V161.limpar()">Mostrar tudo ✕</button></div>`}
V161.limpar=()=>{ST.f=null;try{render()}catch(e){}};
const _fob=SCREENS.fobras;
SCREENS.fobras=function(arg){const self=this,args=arguments;let h=comHist(()=>_fob.apply(self,args));if(typeof h!=='string')return h;
  try{if(!arg){h=h.replace('Lucro real = receita reconhecida (avanço) − custo real.','Lucro real = contratado (valor cheio do contrato, sem multiplicar pelo avanço) − custo real lançado.').replace('Contratado = propostas confirmadas pelo Financeiro','Contratado = propostas vendidas (confirmadas pelo Financeiro ou vindas da METAS 2026 / Painel de Controle / Controle de AT), valor cheio');
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
  ${tr('Resultado',(L,raw)=>raw?L.resultado:`<span class="${L.resultado<0?'v161-neg':'v161-pos'}">${R$(L.resultado)}</span>`,true)}
  <tr><td>Situação</td>${d.rows.map(L=>`<td class="text-end">${chip(L.cor)}${L.contratado?`<div class="sub">${P1(L.margem)}</div>`:''}</td>`).join('')}${d.rows.length>1?'<td></td>':''}</tr>
  </tbody></table></div><div class="sub mt-1" style="font-size:12px">Ponte: ${R$(c)} contratado − ${R$(cu)} custos = ${R$(r2(c-cu))} · o mesmo Contratado e Custo real da linha desta obra em Financeiro › Obras.</div></div>`}

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
