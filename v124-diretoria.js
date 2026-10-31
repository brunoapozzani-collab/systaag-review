/* =====================================================================================================
   v124 · DIRETORIA › VISÃO CEO — reconstruída (29/10/2026)
   O que a Diretoria vê ao abrir o SYSTAAG. Regras do Bruno:
   · seis números de dinheiro no topo, cada um clicável e abrindo exatamente os registros que o somam
   · filtros: período · unidade (TAAG, Acústica, Focal, Pós-venda, Administrativo) · filial (SP, RJ…)
   · "Resultado gerencial" = receita − custos das obras (equipamento, diárias, viagem, terceiros,
     comissão/RT, impostos sobre venda) − despesas da empresa (Administrativo). Não é o lucro contábil.
   · números que se subtraem na mesma tela mostram a ponte entre eles (unidades + filiais = empresa)
   · saldos (caixa, a receber, a pagar, estoque) são a posição no FIM do período — nunca somados por mês
   · tudo em pt-BR · uma ideia por bloco · nenhum número recalculado por conta própria: cada um vem do
     motor do departamento que o produz (FS.dre, FS.caixa, FS.rec/FS.pag, FX2.estoqueCanon, FN.semanas13)
   ===================================================================================================== */
(function(){
'use strict';
if(window.__V124DIR)return;window.__V124DIR=true;
if(typeof SCREENS!=='object')return;
/* ENGINE FIX found by this screen's reconciliation (unidades ≠ empresa em −R$ 4.212,21 de comissões):
   v123-commission.js re-soma comissão/RT da DRE e, nas vendas de loja (Focal) sem obra, chama
   unidadeDaProposta(p) — uma função que só existe dentro do bloco FX1, não no escopo global. No
   consolidado (uni vazio) a chamada nunca acontece; na DRE da Focal ela lança erro, o try engole e a
   comissão da loja some da Focal. Publicar o mesmo helper no escopo global devolve a comissão à Focal
   e faz unidades + Administrativo = empresa ao centavo. */
try{if(typeof window.unidadeDaProposta!=='function'&&window.FX1&&typeof FX1.unidadeDaProposta==='function')window.unidadeDaProposta=FX1.unidadeDaProposta}catch(e){}

/* ENGINE RULE (Bruno, 29/10/2026): o custo de uma OS fechada como GARANTIA pesa na unidade que VENDEU a obra
   de origem (ex.: TAAG), não no Pós-venda. O consolidado não muda — só a linha onde o custo aparece.
   Também: na DRE por filial, o Pós-venda do mês entra só na filial da obra de origem (sem obra → Administrativo),
   em vez de entrar inteiro em cada filial. Vale para o Financeiro › DRE e para a Visão CEO (o mesmo motor). */
window.__V124_FIL=window.__V124_FIL||'';
(function(){
  if(typeof FS!=='object'||typeof FS.dre!=='function'||FS.dre.__v124gar)return;
  const r2_=v=>Math.round((+v||0)*100)/100;
  const PV=()=>{try{return (window.FPV&&FPV.UNIDADE)||'Pós-venda'}catch(e){return 'Pós-venda'}};
  /* um fecho do Pós-venda partido nas linhas da DRE (as mesmas que FPV.dreMes soma) */
  function partes(f){const pc=(f.pecas||[]).reduce((a,p)=>a+(+p.custo||0)*(+p.qtd||1),0);const mo=f.mo_na_agregada?0:(+f.horas||0)*(+f.custo_hora||0);
    const cus=+f.custo_gravado||0;return {receita:r2_(f.receita),tecnicos:r2_(mo),cmv:r2_(pc),viagens:r2_(Math.max(0,cus-mo-pc))}}
  function obraOrig(f){try{return f.obra_origem_id?get('obras',f.obra_origem_id):null}catch(e){return null}}
  function uniOrig(f){const o=obraOrig(f);if(!o)return '';try{return FX1.unidadeDaObra(o)||o.unidade_negocio||''}catch(e){return o.unidade_negocio||''}}
  function filOrig(f){const o=obraOrig(f);try{return o?FIL.daObra(o):FIL.ADM}catch(e){return ''}}
  const _dre=FS.dre;
  FS.dre=function(m,uni){
    const r=_dre.apply(this,arguments);if(!r||typeof r!=='object')return r;
    let rows=[];try{const a=FPV.dreMes(m);rows=(a&&a.rows)||[]}catch(e){return r}
    if(!rows.length)return r;
    const fil=window.__V124_FIL||'';const pv=PV();const d={receita:0,tecnicos:0,cmv:0,viagens:0};
    const mv=(p,s)=>{Object.keys(d).forEach(k=>d[k]+=s*p[k])};
    rows.forEach(f=>{const p=partes(f);const g=f.modo==='garantia'&&f.obra_origem_id;const uo=g?uniOrig(f):'';
      /* filial: o que o motor somou do Pós-venda inteiro sai das filiais que não são a da obra */
      if(fil&&(!uni||uni===pv)&&filOrig(f)!==fil)mv(p,-1);
      if(!g||!uo||uo===pv)return;
      if(fil&&filOrig(f)!==fil)return;
      if(uni===pv)mv(p,-1);else if(uni===uo){mv(p,+1)}});
    if(!Object.values(d).some(v=>Math.abs(v)>=0.005))return r;
    const o=Object.assign({},r);Object.keys(d).forEach(k=>o[k]=r2_((+o[k]||0)+d[k]));
    if(d.receita&&r.receita)o.deducoes=r2_((+r.deducoes||0)*(o.receita/r.receita));o.deducoes=r2_(o.deducoes);o.recLiq=r2_(o.receita-o.deducoes);o.diretos=r2_((+o.tecnicos||0)+(+o.viagens||0)+(+o.terceiros||0));
    o.mc=r2_(o.recLiq-(+o.cmv||0)-o.diretos-(+o.variaveis||0));o.mcPct=o.receita?o.mc/o.receita:0;o.ebitda=r2_(o.mc-(+o.fixas||0));o.res=r2_(o.ebitda-(+o.financeiro||0));
    o.garantiaReatribuida=d;return o};
  FS.dre.__v124gar=true;
})();

/* ───────── helpers ───────── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const r2=v=>Math.round((+v||0)*100)/100;
const R$=v=>{v=r2(v);return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})};
const Rk=v=>{v=+v||0;const a=Math.abs(v);let t;if(a>=1e6)t=(a/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi';else if(a>=1e3)t=(a/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0})+' mil';else t=a.toLocaleString('pt-BR',{maximumFractionDigits:0});return (v<0?'−':'')+t};
const P1=v=>(isFinite(v)?v*100:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const N0=v=>(+v||0).toLocaleString('pt-BR');
const hoje=()=>{try{return today()}catch(e){return new Date().toISOString().slice(0,10)}};
const ymOf=d=>String(d||'').slice(0,7);
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const ymLb=m=>MES[+m.slice(5,7)-1]+'/'+m.slice(2,4);
const dBR=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7)+'/'+String(d).slice(0,4):'—';
const diasEntre=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const fimMes=m=>{const y=+m.slice(0,4),mm=+m.slice(5,7);return m+'-'+String(new Date(y,mm,0).getDate()).padStart(2,'0')};
const sum=(xs,f)=>r2((xs||[]).reduce((a,x)=>a+(+(f?f(x):x)||0),0));
const T=(fn,d)=>{try{const v=fn();return v==null?d:v}catch(e){console.error('Visão CEO',e);return d}};
const uniP=p=>p?(T(()=>FX1.unidadeDaProposta(p),'')||''):'';
const uniO=o=>o?(T(()=>FX1.unidadeDaObra(o),'')||o.unidade_negocio||''):'';
const getRow=(t,id)=>T(()=>get(t,id),null)||T(()=>(S.db[t]||[]).find(x=>x.id===id),null);

/* ───────── estado dos filtros ───────── */
const VD=window.VD=window.VD||{ym:null,uni:'',fil:'',drawer:null,rateio:false,por:'uni'};
const UNIS=()=>{const u=T(()=>FD1.UNIDADES.slice(),null)||['TAAG','Acústica','Focal','Pós-venda','Corporativo'];return u};
const LINHAS=()=>UNIS().filter(u=>u!=='Corporativo');
const uniLb=u=>u==='Corporativo'?'Administrativo':u;
const FILS=()=>T(()=>FIL.lista(),['SP','RJ']);
const ADM=()=>T(()=>FIL.ADM,'Administrativo');
const MESES=()=>{const m=T(()=>FS.dreMeses(),[]);const cur=ymOf(hoje());if(m.indexOf(cur)<0)m.unshift(cur);return m};
const atual=()=>VD.ym===ymOf(hoje());

/* ───────── 1. o resultado (DRE) — sempre o motor do Financeiro, com a filial aplicada por dentro ───────── */
/* filial: o mesmo FS.dre roda com as obras, as vendas de loja e os lançamentos limitados à filial
   (regra 29/10: tudo da obra vai para a filial da proposta; custo sem obra vai para Administrativo). */
function comFilial(fil,fn){
  if(!fil)return fn();
  const adm=fil===ADM();
  const sv={obras:FN.obras,focal:FN.focal,fixos:FN.fixosMes,atual:FN.dreAtual};
  const d=Object.getOwnPropertyDescriptor(FST,'lancamentos');const fil0=window.__V124_FIL;
  try{
    window.__V124_FIL=fil;
    FN.obras=function(){const r=sv.obras.apply(FN,arguments)||[];return adm?[]:r.filter(x=>T(()=>FIL.daObra(x.o),'')===fil)};
    if(typeof sv.focal==='function')FN.focal=function(){const r=sv.focal.apply(FN,arguments)||[];return r.filter(x=>{if(x.obra)return !adm&&T(()=>FIL.daObra(typeof x.obra==='object'?x.obra:getRow('obras',x.obra)),'')===fil;return !adm&&T(()=>FIL.daProposta(x.p),'')===fil})};
    if(!adm){FN.fixosMes=()=>0;if(typeof sv.atual==='function')FN.dreAtual=function(){const r=sv.atual.apply(FN,arguments)||{};return Object.assign({},r,{dep:0,finres:0})}}
    if(d&&d.get)Object.defineProperty(FST,'lancamentos',{configurable:true,enumerable:d.enumerable,get(){return d.get.call(FST).filter(l=>T(()=>FIL.doLanc(l),adm?fil:'')===fil)},set(v){return d.set.call(FST,v)}});
    return fn();
  }finally{
    window.__V124_FIL=fil0||'';FN.obras=sv.obras;if(sv.focal)FN.focal=sv.focal;FN.fixosMes=sv.fixos;if(sv.atual)FN.dreAtual=sv.atual;
    if(d)Object.defineProperty(FST,'lancamentos',d);
  }
}
const ZERO={receita:0,deducoes:0,cmv:0,tecnicos:0,viagens:0,terceiros:0,comissao:0,rt:0,fixas:0,financeiro:0,recLiq:0,diretos:0,variaveis:0,mc:0,ebitda:0,res:0};
let CACHE={};
function dre(ym,uni,fil){const k=ym+'|'+(uni||'')+'|'+(fil||'');if(CACHE[k])return CACHE[k];
  const r=T(()=>comFilial(fil,()=>FS.dre(ym,uni||'')),null)||Object.assign({},ZERO);CACHE[k]=r;return r}
/* resultado gerencial = antes do resultado financeiro (juros, tarifas, depreciação) e do IR */
const ger=d=>r2(d.ebitda);
const custosObra=d=>r2(d.deducoes+d.cmv+d.diretos+d.variaveis);

/* ───────── 2. os saldos — posição no fim do período ───────── */
function caixaContas(){
  const contas=(S.db.contas||[]).filter(c=>c&&c.ativo!==false);
  const tot=T(()=>FS.caixa(),null);
  const rows=contas.map(c=>({nome:c.nome,saldo:r2(c.saldo),filial:T(()=>FIL.daConta(c.nome),'')||''})).filter(r=>r.saldo!==0||true);
  return {tot:tot==null?sum(rows,r=>r.saldo):r2(tot),rows};
}
/* movimentos de caixa depois de uma data (para voltar o saldo de hoje ao fim de um mês passado) */
function movDepois(b,contaOk){
  const ls=T(()=>FST.lancamentos,[])||[];let v=0;
  ls.forEach(l=>{if(!l||l.tipo==='transferencia')return;const dc=String(l.data_caixa||l.data||'');if(!(dc>b))return;if(contaOk&&!contaOk(l.conta))return;v+=(l.tipo==='entrada'?1:-1)*(+l.valor||0)});
  return r2(v)}
function caixa(){
  const cx=caixaContas();const fil=VD.fil;const b=fimMes(VD.ym);
  let rows=cx.rows;if(fil)rows=rows.filter(r=>(r.filial||ADM())===fil||(!r.filial&&fil===ADM()));
  const contaOk=fil?(n=>rows.some(r=>r.nome===n)):null;
  let tot=fil?sum(rows,r=>r.saldo):cx.tot;
  const depois=atual()?0:movDepois(b,contaOk);
  return {tot:r2(tot-depois),hoje:tot,depois,rows,semConta:fil&&!rows.length}}

/* títulos: a filial e a unidade de cada título */
function propDoTitulo(l){return l.origem_id?getRow('propostas',l.origem_id):null}
function obraDoTitulo(l){if(l.obra_id&&l.obra_id!=='empresa')return getRow('obras',l.obra_id);const p=propDoTitulo(l);return p&&p.obra_id?getRow('obras',p.obra_id):null}
function filDoTitulo(l){const o=obraDoTitulo(l);if(o)return T(()=>FIL.daObra(o),'');const p=propDoTitulo(l);if(p)return T(()=>FIL.daProposta(p),'');return ADM()}
function uniDoTitulo(l){if(l.unidade)return l.unidade;const p=propDoTitulo(l);if(p)return uniP(p)||uniO(obraDoTitulo(l))||'';return 'Corporativo'}
function titulos(tipo){
  const b=fimMes(VD.ym);const cur=atual();
  let rows;
  if(cur){const r=T(()=>(tipo==='receber'?FS.rec('todos',VD.uni):FS.pag('todos',VD.uni)),null);rows=r&&Array.isArray(r.rows)?r.rows.slice():(S.db.lancamentos||[]).filter(l=>l.tipo===tipo&&!l.pago_em&&(!VD.uni||uniDoTitulo(l)===VD.uni))}
  else rows=(S.db.lancamentos||[]).filter(l=>l.tipo===tipo&&String(l.criado||l.emissao||l.data||l.vencimento||'')<=b&&(!l.pago_em||String(l.pago_em)>b)&&(!VD.uni||uniDoTitulo(l)===VD.uni));
  if(VD.fil)rows=rows.filter(l=>filDoTitulo(l)===VD.fil);
  const ref=cur?hoje():b;
  const venc=rows.filter(l=>String(l.vencimento||'')<ref);
  return {rows,tot:sum(rows,l=>l.valor),vencido:sum(venc,l=>l.valor),nVenc:venc.length}}

/* estoque: o mesmo número do Estoque (FX2.estoqueCanon), aberto por produto */
function estoque(){
  const canon=T(()=>FX2.estoqueCanon(),null);
  const us=(T(()=>nodeUnits(null),null)||(S.db.unidades||[]).filter(u=>u.estado!=='baixado'&&u.loc_id&&T(()=>bucketOf(u),'')!=='cliente')).filter(u=>u.natureza!=='consignado');
  const por={};us.forEach(u=>{const p=getRow('produtos',u.produto_id)||{};const c=(+u.custo>0)?+u.custo:(+p.custo||0);const k=u.produto_id;(por[k]=por[k]||{nome:p.nome||u.produto_id,marca:p.marca||'',q:0,v:0,us:[]});por[k].q++;por[k].v+=c;por[k].us.push(u)});
  const rows=Object.values(por).sort((a,b)=>b.v-a.v);rows.forEach(r=>r.v=r2(r.v));
  const tot=canon?r2(canon.custo):sum(rows,r=>r.v);
  return {tot,rows,listado:sum(rows,r=>r.v),n:canon?canon.nossas:us.length}}

/* comercial do período: vendido, recebido */
const VEND=['vendida','em_obra','concluida'];
const Mtot=p=>T(()=>+M.total(p),0)||T(()=>+D.propTotal(p.id),0)||0;
function noEscopo(p){if(!p)return false;if(VD.uni&&uniP(p)!==VD.uni)return false;if(VD.fil&&T(()=>FIL.daProposta(p),'')!==VD.fil)return false;return true}
function vendidas(){return (S.db.propostas||[]).filter(p=>VEND.includes(p.estado)&&ymOf(p.vendida_em)===VD.ym&&noEscopo(p))}
function recebidos(){return (S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&l.pago_em&&ymOf(l.pago_em)===VD.ym&&(!VD.uni||uniDoTitulo(l)===VD.uni)&&(!VD.fil||filDoTitulo(l)===VD.fil))}

/* ───────── 3. o painel operacional — cada contador é a lista que ele conta ───────── */
const ESTLB={rascunho:'Rascunho',enviada:'Enviada ao cliente',em_prevendas:'Em pré-vendas',aprovada_cliente:'Aprovada pelo cliente',vendida:'Vendida',em_obra:'Em obra',concluida:'Concluída',perdida:'Perdida'};
const PAB=['rascunho','enviada','em_prevendas','aprovada_cliente','em_revisao','ajuste','aguardando'];
function opr(){
  const P=(S.db.propostas||[]).filter(noEscopoOp);
  const abertas=P.filter(p=>PAB.includes(p.estado));
  const aprov=P.filter(p=>p.aprov&&['aguardando','em_andamento'].includes(p.aprov.status)&&!VEND.includes(p.estado)&&p.estado!=='perdida');
  const rtd=(S.db.rettrocs||[]).filter(r=>/^aguardando_(diretoria|financeiro|consolidado)$/.test(r.status||''));
  const obras=(S.db.obras||[]).filter(o=>{const ps=(S.db.propostas||[]).filter(p=>p.obra_id===o.id);return ps.some(p=>VEND.includes(p.estado))&&!(o.entrega&&o.entrega.realizada)&&o.situacao!=='concluida'&&o.situacao!=='cancelada'&&obraEscopo(o)});
  const atras=obras.filter(o=>o.entrega&&o.entrega.prevista&&o.entrega.prevista<hoje());
  const compras=(S.db.pedidos||[]).filter(p=>['cotacao','aprovado','a_receber'].includes(p.estado)&&(!p.proposta_id||noEscopoOp(getRow('propostas',p.proposta_id))));
  const os=(S.db.os||[]).filter(o=>o.estado==='aberta'&&(!o.obra_id||obraEscopo(getRow('obras',o.obra_id))));
  return {abertas,aprov,rtd,obras,atras,compras,os}}
function noEscopoOp(p){if(!p)return true;return noEscopo(p)}
function obraEscopo(o){if(!o)return true;if(VD.fil&&T(()=>FIL.daObra(o),'')!==VD.fil)return false;if(VD.uni){const u=uniO(o);if(u&&u!==VD.uni)return false}return true}
const nomeCli=p=>T(()=>(getRow('clientes',p.cliente_id)||(S.db.clientes||[]).find(c=>c.sigla===p.sigla)||{}).nome,'')||'';
function fila(o){
  const out=[];const t=hoje();
  o.aprov.forEach(p=>{const falta=[!(p.aprov&&p.aprov.rodolfo)?'Rodolfo':null,!(p.aprov&&p.aprov.thais)?'Thaís':null].filter(Boolean);
    const desde=(p.aprov&&p.aprov.desde)||((p.aprov&&p.aprov.hist||[]).slice(-1)[0]||{}).data||p.atualizado_em||p.criado||t;
    out.push({oc:'Proposta '+(p.numero||''),sub:nomeCli(p)+' · '+R$(Mtot(p)),resp:falta.length?falta.join(' + '):'Diretoria',sit:'Aprovação pendente',desde,href:'#/editor/'+p.id,grav:2})});
  o.rtd.forEach(r=>{const st={aguardando_diretoria:'Diretoria aprova',aguardando_financeiro:'Financeiro libera',aguardando_consolidado:'Consolidado libera'}[r.status]||r.status;
    out.push({oc:'Ret/Troc '+(r.numero||r.id),sub:(r.titulo||r.motivo||'troca de equipamento'),resp:/diretoria/.test(r.status)?'Diretoria':'Financeiro',sit:st,desde:r.atualizado_em||r.criado||t,href:'#/rettroc/'+r.id,grav:2})});
  o.atras.forEach(x=>out.push({oc:'Obra '+(x.nome||x.id),sub:'entrega prevista '+dBR(x.entrega.prevista),resp:x.responsavel||'Operação',sit:'Atrasada',desde:x.entrega.prevista,href:'#/obras/'+x.id,grav:3}));
  o.compras.filter(p=>p.estado==='a_receber').forEach(p=>out.push({oc:'Compra '+(p.pc||p.nome||p.id),sub:(p.fornecedor||''),resp:'Estoque',sit:'Aguardando entrega',desde:p.aprovado_em||p.criado||t,href:'#/areceber',grav:1}));
  out.forEach(x=>{x.dias=Math.max(0,diasEntre(String(x.desde).slice(0,10),t))});
  return out.sort((a,b)=>b.grav-a.grav||b.dias-a.dias)}

/* ───────── 4. a tela ───────── */
const CSS=`<style id="v124dir-css">
.vd{--g:#16a34a;--r:#dc2626;--a:#d97706;--b:#2563eb;max-width:1180px}
.vd h1{font-size:28px;font-weight:800;letter-spacing:-.02em;margin:0}
.vd .lead{color:var(--sub,#6b7280);font-size:13px}
.vd .bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0 18px}
.vd .seg{display:inline-flex;background:var(--bg2,rgba(120,120,128,.12));border-radius:10px;padding:3px;gap:2px}
.vd .seg button{border:0;background:transparent;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;color:inherit;opacity:.75}
.vd .seg button.on{background:var(--card,#fff);opacity:1;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.vd select.per{border:0;background:var(--bg2,rgba(120,120,128,.12));border-radius:10px;padding:8px 12px;font-weight:700;font-size:13px;color:inherit}
.vd .scope{font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(37,99,235,.1);color:var(--b)}
.vd .k6{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:900px){.vd .k6{grid-template-columns:1fr 1fr}}
.vd .k{border-radius:18px;padding:18px 20px;cursor:pointer;transition:transform .12s, box-shadow .12s;position:relative}
.vd .k:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.vd .k .lb{font-size:13px;font-weight:600;opacity:.7}
.vd .k .v{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:4px 0 2px;font-variant-numeric:tabular-nums}
.vd .k .s{font-size:12px;opacity:.75;line-height:1.45}
.vd .k .go{position:absolute;right:16px;top:16px;font-size:12px;font-weight:700;color:var(--b);opacity:.0;transition:opacity .12s}
.vd .k:hover .go{opacity:1}
.vd .neg{color:var(--r)} .vd .pos{color:var(--g)} .vd .warn{color:var(--a)}
.vd .sec{margin-top:30px}
.vd .sec h2{font-size:19px;font-weight:800;margin:0 0 2px;letter-spacing:-.01em}
.vd .sec .q{font-size:13px;opacity:.7;margin-bottom:12px}
.vd table.t{width:100%;border-collapse:collapse;font-size:14px}
.vd table.t th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;font-weight:700;text-align:right;padding:10px 14px;border-bottom:1px solid var(--bd,#e5e7eb)}
.vd table.t th:first-child,.vd table.t td:first-child{text-align:left}
.vd table.t td{padding:12px 14px;text-align:right;border-bottom:1px solid var(--bd,#eef0f2);font-variant-numeric:tabular-nums}
.vd table.t tr.click{cursor:pointer} .vd table.t tr.click:hover td{background:rgba(37,99,235,.05)}
.vd table.t tr.tot td{font-weight:800;border-top:2px solid var(--bd,#d1d5db);border-bottom:0}
.vd table.t tr.on td{background:rgba(37,99,235,.08)}
.vd .ok{font-size:12px;font-weight:700;color:var(--g)} .vd .bad{font-size:12px;font-weight:700;color:var(--r)}
.vd .o6{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
@media(max-width:1000px){.vd .o6{grid-template-columns:repeat(3,1fr)}}
.vd .o{border-radius:16px;padding:14px 16px;cursor:pointer}
.vd .o:hover{box-shadow:0 6px 18px rgba(0,0,0,.08)}
.vd .o .n{font-size:30px;font-weight:800;line-height:1.1}
.vd .o .l{font-size:12px;font-weight:600;opacity:.75}
.vd .pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}
.vd .p-r{background:rgba(220,38,38,.1);color:var(--r)} .vd .p-a{background:rgba(217,119,6,.12);color:var(--a)} .vd .p-g{background:rgba(22,163,74,.1);color:var(--g)} .vd .p-b{background:rgba(37,99,235,.1);color:var(--b)}
.vd .chart{width:100%;height:auto;display:block}
.vd .chart text{font-size:11px;fill:currentColor;opacity:.6}
.vd .chart .ax{stroke:currentColor;opacity:.1}
.vd .foot{margin:34px 0 10px;font-size:12px;opacity:.65;display:flex;gap:16px;flex-wrap:wrap}
.vd.vd-ov{max-width:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1050;display:flex;justify-content:flex-end}
.vd-dr{width:min(760px,100%);height:100%;overflow:auto;background:var(--card,#fff);padding:26px 28px;box-shadow:-10px 0 40px rgba(0,0,0,.2)}
.vd-dr h3{font-size:22px;font-weight:800;margin:0}
.vd-dr .big{font-size:34px;font-weight:800;letter-spacing:-.02em;margin:6px 0 4px;font-variant-numeric:tabular-nums}
.vd-dr .x{float:right;border:0;background:var(--bg2,rgba(120,120,128,.12));border-radius:999px;width:34px;height:34px;font-size:18px}
.vd-dr table{width:100%;border-collapse:collapse;font-size:13px;margin-top:14px}
.vd-dr th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;opacity:.6;text-align:right;padding:8px 10px;border-bottom:1px solid var(--bd,#e5e7eb)}
.vd-dr td{padding:9px 10px;text-align:right;border-bottom:1px solid var(--bd,#f0f1f3);font-variant-numeric:tabular-nums}
.vd-dr th:first-child,.vd-dr td:first-child{text-align:left}
.vd-dr tr.tot td{font-weight:800;border-top:2px solid var(--bd,#d1d5db)}
.vd-dr tr.click{cursor:pointer} .vd-dr tr.click:hover td{background:rgba(37,99,235,.06)}
.vd-dr tr.sub td{font-size:12px;opacity:.75;padding-left:26px}
.vd-dr .note{font-size:12px;opacity:.7;margin-top:10px;line-height:1.5}
.vd-dr a.btnl{display:inline-block;margin-top:16px;font-weight:700;font-size:13px}
.vd .k .v,.vd table.t td,.vd-dr td,.vd .o .n{white-space:nowrap}
.vd .seg{max-width:100%;overflow-x:auto;flex-wrap:nowrap}.vd .seg button{white-space:nowrap;flex:0 0 auto}
.vd .tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
@media(max-width:600px){.vd .k6{grid-template-columns:1fr}.vd .k .v{font-size:26px}.vd h1{font-size:24px}.vd .o6{grid-template-columns:1fr 1fr}.vd-dr{padding:18px 16px}.vd-dr .big{font-size:28px}.vd table.t td,.vd table.t th{padding:10px 10px}}
</style>`;

const sel=(k,v)=>`VD.${k}=${typeof v==='string'?`'${J(v)}'`:v};VD.drawer=null;window.VD_R()`;
window.VD_R=()=>{CACHE={};try{renderMain()}catch(e){render()}};
window.VD_open=k=>{VD.drawer=k;window.VD_R()};
window.VD_close=()=>{VD.drawer=null;window.VD_R()};
window.VD_go=h=>{VD.drawer=null;location.hash=h};

function escopoTxt(){const p=[];p.push(VD.uni?uniLb(VD.uni):'Empresa toda');if(VD.fil)p.push('filial '+VD.fil);return p.join(' · ')}
function barra(){
  const ms=MESES();const cur=ymOf(hoje());
  const per=`<select class="per" aria-label="Período" onchange="VD.ym=this.value;VD.drawer=null;window.VD_R()">${ms.map(m=>`<option value="${m}" ${m===VD.ym?'selected':''}>${ymLb(m)}${m===cur?' · este mês':''}</option>`).join('')}</select>`;
  const us=[['','Empresa']].concat(UNIS().map(u=>[u,uniLb(u)]));
  const fs=[['','Todas as filiais']].concat(FILS().map(f=>[f,f])).concat([[ADM(),'Sem obra (Adm.)']]);
  return `<div class="bar">${per}<div class="seg" role="group" aria-label="Unidade">${us.map(([k,l])=>`<button class="${VD.uni===k?'on':''}" onclick="${sel('uni',k)}">${E(l)}</button>`).join('')}</div><div class="seg" role="group" aria-label="Filial">${fs.map(([k,l])=>`<button class="${VD.fil===k?'on':''}" onclick="${sel('fil',k)}">${E(l)}</button>`).join('')}</div></div>`}

function kpi(id,lb,v,s,cls){return `<div class="card k" id="vd_k_${id}" onclick="VD_open('${id}')" role="button" tabindex="0"><span class="go">Ver detalhes ›</span><div class="lb">${lb}</div><div class="v ${cls||''}">${v}</div><div class="s">${s||''}</div></div>`}

function telaTopo(x){
  const d=x.d;const metaMes=r2((+((S.db.metas||{}).empresa)||0)/12);
  const pctMeta=metaMes>0&&!VD.uni&&!VD.fil?` · ${P1(d.receita/metaMes)} da meta do mês (${R$(metaMes)})`:'';
  const cx=x.cx,rc=x.rc,pg=x.pg,es=x.es;
  const saldoLb=atual()?'hoje':'em '+dBR(fimMes(VD.ym));
  return `<div class="k6">
   ${kpi('receita','Receita do período',R$(d.receita),`reconhecida pelo avanço das obras${pctMeta}<br>vendido ${R$(x.vend)} · recebido ${R$(x.receb)}`)}
   ${kpi('resultado','Resultado gerencial',R$(ger(d)),`contribuição das obras ${R$(d.mc)} − despesas da empresa ${R$(d.fixas)}<br>margem ${P1(d.receita?ger(d)/d.receita:0)} · antes de juros e IR`,ger(d)<0?'neg':'pos')}
   ${kpi('caixa','Saldo de caixa',cx.semConta?'—':R$(cx.tot),(cx.semConta?'esta filial não tem conta bancária própria — o caixa é da empresa':`${N0(cx.rows.length)} contas · saldo ${saldoLb}`)+(VD.uni?'<br><b>o caixa é da empresa toda</b> — não se divide por unidade':''),cx.tot<0?'neg':'')}
   ${kpi('receber','Contas a receber',R$(rc.tot),`${N0(rc.rows.length)} títulos em aberto ${saldoLb}${rc.vencido?`<br><span class="neg">${R$(rc.vencido)} vencido (${N0(rc.nVenc)})</span>`:'<br>nada vencido'}`)}
   ${kpi('pagar','Contas a pagar',R$(pg.tot),`${N0(pg.rows.length)} títulos em aberto ${saldoLb}${pg.vencido?`<br><span class="neg">${R$(pg.vencido)} vencido (${N0(pg.nVenc)})</span>`:'<br>nada vencido'}`)}
   ${kpi('estoque','Estoque valorizado',R$(es.tot),`${N0(es.n)} unidades nossas, ao custo · posição de hoje`+(VD.uni||VD.fil?'<br><b>estoque da empresa toda</b>':''))}
  </div>`}

/* quem dá lucro e quem consome */
function telaUnidades(x){
  const por=VD.por==='fil'?'fil':'uni';
  const tot=dre(VD.ym,'',VD.fil&&por==='uni'?VD.fil:'');
  let linhas;
  if(por==='uni')linhas=UNIS().map(u=>({k:u,lb:uniLb(u),d:dre(VD.ym,u,VD.fil)}));
  else linhas=FILS().concat([ADM()]).map(f=>({k:f,lb:f===ADM()?'Sem obra (Administrativo)':'Filial '+f,d:dre(VD.ym,VD.uni,f)}));
  const totD=por==='uni'?tot:dre(VD.ym,VD.uni,'');
  const somaRec=sum(linhas,l=>l.d.receita),somaMc=sum(linhas,l=>l.d.mc),somaFix=sum(linhas,l=>l.d.fixas),somaRes=sum(linhas,l=>ger(l.d));
  const dif=r2(ger(totD)-somaRes),difRec=r2(totD.receita-somaRec);
  const recAll=sum(linhas.filter(l=>l.d.receita>0),l=>l.d.receita);
  const fixT=r2(totD.fixas);
  const rate=l=>VD.rateio&&l.k!=='Corporativo'&&l.k!==ADM()&&recAll>0?r2(fixT*Math.max(0,l.d.receita)/recAll):0;
  const resR=l=>VD.rateio?(l.k==='Corporativo'||l.k===ADM()?r2(ger(l.d)+fixT):r2(ger(l.d)-rate(l))):ger(l.d);
  const on=k=>por==='uni'?VD.uni===k:VD.fil===k;
  const click=l=>por==='uni'?sel('uni',on(l.k)?'':l.k):sel('fil',on(l.k)?'':l.k);
  const rows=linhas.map(l=>{const r=resR(l);const mg=l.d.receita?l.d.mc/l.d.receita:0;return `<tr class="click ${on(l.k)?'on':''}" onclick="${click(l)}"><td><b>${E(l.lb)}</b></td><td>${R$(l.d.receita)}</td><td>${R$(custosObra(l.d))}</td><td>${R$(l.d.mc)}</td><td>${l.d.receita?P1(mg):'—'}</td>${VD.rateio?`<td>${R$(-rate(l)|| (l.k==='Corporativo'||l.k===ADM()?fixT:0))}</td>`:`<td>${R$(-l.d.fixas)}</td>`}<td class="${r<0?'neg':'pos'}"><b>${R$(r)}</b></td></tr>`}).join('');
  const arred=Math.abs(dif)<0.05&&Math.abs(difRec)<0.05;
  const difRow=!arred?`<tr class="click" onclick="VD_open('semunidade')"><td><span class="bad">Sem ${por==='uni'?'unidade':'filial'}</span> <span class="lead">— registros que ainda não dizem de quem são</span></td><td>${R$(difRec)}</td><td></td><td></td><td></td><td></td><td class="neg"><b>${R$(dif)}</b></td></tr>`:'';
  const ponte=arred?`<span class="ok">✓ ${linhas.map(l=>l.lb.replace('Filial ','')).join(' + ')} = ${VD.uni&&por==='fil'?uniLb(VD.uni):'empresa'}${Math.abs(dif)>=0.005?` (${R$(Math.abs(dif))} de arredondamento dos impostos)`:', ao centavo'}</span>`:`<span class="bad">A soma das linhas difere do total em ${R$(dif)} — a linha "Sem ${por==='uni'?'unidade':'filial'}" mostra o quê.</span>`;
  return `<div class="sec"><div class="d-flex justify-content-between align-items-end flex-wrap gap-2"><div><h2>Quem dá lucro e quem consome</h2><div class="q">${ymLb(VD.ym)} · clique numa linha para ver só ela no painel inteiro</div></div>
   <div class="d-flex gap-2 align-items-center"><div class="seg"><button class="${por==='uni'?'on':''}" onclick="${sel('por','uni')}">Por unidade</button><button class="${por==='fil'?'on':''}" onclick="${sel('por','fil')}">Por filial</button></div>
   <div class="seg"><button class="${!VD.rateio?'on':''}" onclick="${sel('rateio',false)}">Sem rateio</button><button class="${VD.rateio?'on':''}" onclick="${sel('rateio',true)}">Com rateio</button></div></div></div>
   <div class="card p-0 tw" style="border-radius:18px"><table class="t no-filter" id="vd_unidades"><thead><tr><th>${por==='uni'?'Unidade':'Filial'}</th><th>Receita</th><th>Custos das obras</th><th>Contribuição</th><th>Margem</th><th>${VD.rateio?'Rateio da empresa':'Despesas da empresa'}</th><th>Resultado gerencial</th></tr></thead><tbody>${rows}${difRow}
   <tr class="tot"><td>${VD.uni&&por==='fil'?uniLb(VD.uni):'Empresa'}</td><td>${R$(totD.receita)}</td><td>${R$(custosObra(totD))}</td><td>${R$(totD.mc)}</td><td>${totD.receita?P1(totD.mc/totD.receita):'—'}</td><td>${R$(-totD.fixas)}</td><td class="${ger(totD)<0?'neg':'pos'}">${R$(ger(totD))}</td></tr></tbody></table></div>
   <div class="mt-2">${ponte}${VD.rateio?' <span class="lead">· rateio: as despesas da empresa divididas pela receita de cada linha (regra provisória — a Diretoria define a regra final)</span>':''}</div></div>`}

/* caixa: 13 semanas */
function svgCaixa(sem,saldo0){
  const W=1100,H=190,L=70,Rr=16,Tp=16,B=28;const pts=[{x:'hoje',y:saldo0}].concat(sem.map(w=>({x:dBR(w.ini||w.inicio||w.de||w.semana||'').slice(0,5),y:+w.saldoFinal||0})));
  const ys=pts.map(p=>p.y).concat([0]);let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo)hi=lo+1;const pad=(hi-lo)*.08;lo-=pad;hi+=pad;
  const sx=i=>L+(W-L-Rr)*i/(pts.length-1||1),sy=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));
  const d=pts.map((p,i)=>(i?'L':'M')+sx(i).toFixed(1)+' '+sy(p.y).toFixed(1)).join(' ');
  const ticks=[lo+pad,(lo+hi)/2,hi-pad].map(v=>`<text x="${L-8}" y="${(sy(v)+4).toFixed(1)}" text-anchor="end">${E(Rk(v))}</text><line class="ax" x1="${L}" x2="${W-Rr}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/>`).join('');
  const zero=lo<0?`<line x1="${L}" x2="${W-Rr}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}" stroke="#dc2626" stroke-dasharray="5 4"/>`:'';
  const dots=pts.map((p,i)=>`<circle cx="${sx(i).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="${p.y<0?4:3}" fill="${p.y<0?'#dc2626':'#2563eb'}"><title>${E(p.x+' · '+R$(p.y))}</title></circle>`).join('');
  const xl=pts.map((p,i)=>`<text x="${sx(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${E(p.x)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Saldo de caixa projetado nas próximas 13 semanas">${ticks}${zero}<path d="${d}" fill="none" stroke="#2563eb" stroke-width="2.5"/>${dots}${xl}</svg>`}
function telaCaixa(){
  const sem=T(()=>FN.semanas13(),[])||[];const cx0=T(()=>FS.caixa(),0);
  if(!sem.length)return '';
  const menor=sem.reduce((a,w)=>(+w.saldoFinal<+a.saldoFinal?w:a),sem[0]);const neg=sem.filter(w=>+w.saldoFinal<0);
  const ent=sum(sem,w=>w.entradas),sai=sum(sem,w=>w.saidas);
  const venc=sum((S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&!l.pago_em&&String(l.vencimento||'')<hoje()),l=>l.valor);
  const msg=neg.length?`<span class="pill p-r">fica negativo a partir de ${E(dBR(neg[0].ini||neg[0].inicio||'').slice(0,5)||'semana '+(sem.indexOf(neg[0])+1))}</span>`:`<span class="pill p-g">positivo nas 13 semanas</span>`;
  return `<div class="sec"><h2>Conseguimos pagar o que vem pela frente?</h2><div class="q">Caixa da empresa toda, projetado semana a semana: hoje + o que entra − o que sai (títulos, despesas fixas, folha e parcelas). ${msg}</div>
   <div class="card p-3" style="border-radius:18px;cursor:pointer" onclick="VD_go('#/fluxo')" title="Abrir Financeiro › Fluxo de caixa">${svgCaixa(sem,cx0)}
   <table class="t mt-2 no-filter" style="font-size:13px"><tbody><tr><td>Caixa hoje</td><td><b>${R$(cx0)}</b></td><td>Entra em 13 semanas</td><td class="pos"><b>${R$(ent)}</b></td><td>Sai em 13 semanas</td><td class="neg"><b>${R$(-sai)}</b></td></tr>
   <tr><td>A receber vencido (cobrar)</td><td class="${venc?'neg':''}"><b>${R$(venc)}</b></td><td>Menor saldo</td><td class="${+menor.saldoFinal<0?'neg':''}"><b>${R$(menor.saldoFinal)}</b></td><td>Saldo em 13 semanas</td><td><b>${R$(sem[sem.length-1].saldoFinal)}</b></td></tr></tbody></table>
   <div class="lead mt-1">Ponte: ${R$(cx0)} + ${R$(ent)} − ${R$(sai)} = ${R$(r2(cx0+ent-sai))} ${Math.abs(r2(cx0+ent-sai)-r2(sem[sem.length-1].saldoFinal))<0.01?'<span class="ok">✓ confere</span>':'<span class="bad">não confere</span>'} · clique para abrir o Fluxo de caixa</div></div></div>`}

/* operacional */
function telaOper(o){
  const tiles=[['abertas','Propostas em aberto',o.abertas.length],['aprovacao','Aguardando aprovação',o.aprov.length+o.rtd.length],['obras','Obras em andamento',o.obras.length],['atrasadas','Obras atrasadas',o.atras.length],['compras','Compras pendentes',o.compras.length],['os','Atendimentos abertos',o.os.length]];
  const f=fila(o).slice(0,8);
  return `<div class="sec"><h2>O que está acontecendo agora</h2><div class="q">Cada número é a lista que ele conta — clique para ver.</div>
   <div class="o6">${tiles.map(([k,l,n])=>`<div class="card o" id="vd_o_${k}" onclick="VD_open('op_${k}')" role="button"><div class="n ${k==='atrasadas'&&n?'neg':''}">${N0(n)}</div><div class="l">${l}</div></div>`).join('')}</div>
   <div class="card p-0 mt-3 tw" style="border-radius:18px"><div class="p-3 pb-0"><b>Fila da Diretoria</b> <span class="lead">— o que espera alguém decidir, o mais urgente primeiro</span></div>
   ${f.length?`<table class="t no-filter" id="vd_fila"><thead><tr><th>Ocorrência</th><th>Responsável</th><th>Situação</th><th>Esperando há</th></tr></thead><tbody>${f.map(x=>`<tr class="click" onclick="VD_go('${J(x.href)}')"><td><b>${E(x.oc)}</b><div class="lead">${E(x.sub)}</div></td><td>${E(x.resp)}</td><td><span class="pill ${x.sit==='Atrasada'?'p-r':x.grav>=2?'p-a':'p-b'}">${E(x.sit)}</span></td><td>${N0(x.dias)} dia${x.dias===1?'':'s'}</td></tr>`).join('')}</tbody></table>`:'<div class="p-3 lead">Nada esperando a Diretoria.</div>'}</div></div>`}

/* ───────── 5. as gavetas: cada número aberto nos registros que o somam ───────── */
function gaveta(k,x){
  const head=(t,v,sub)=>`<button class="x" onclick="VD_close()" aria-label="Fechar">×</button><div class="lead">${E(escopoTxt())} · ${ymLb(VD.ym)}</div><h3>${t}</h3><div class="big">${v}</div><div class="lead">${sub||''}</div>`;
  const totRow=(lb,v,cols)=>`<tr class="tot"><td>${lb}</td>${'<td></td>'.repeat(cols)}<td>${R$(v)}</td></tr>`;
  const conf=(a,b)=>Math.abs(r2(a)-r2(b))<0.01?`<div class="note"><span class="ok">✓ a soma das linhas é exatamente o número do cartão</span></div>`:`<div class="note"><span class="bad">A soma das linhas (${R$(b)}) difere do cartão (${R$(a)}) em ${R$(r2(a-b))}.</span></div>`;
  const d=x.d;
  if(k==='receita'||k==='resultado'){
    const L=[['Receita reconhecida',d.receita,0],['Impostos sobre a venda',-d.deducoes,1],['Equipamento (custo de compra)',-d.cmv,1],['Técnicos (diárias apontadas)',-d.tecnicos,1],['Viagens (hotel, Uber, alimentação)',-d.viagens,1],['Terceiros e frete',-d.terceiros,1],['Comissões',-d.comissao,1],['RT',-d.rt,1]];
    const obras=T(()=>FN.obras(),[])||[];
    const ob=[];comFilial(VD.fil,()=>{(T(()=>FN.obras(),[])||[]).forEach(r=>{(r.porProposta||[]).forEach(p=>{if(VD.uni&&p.unidade!==VD.uni)return;if(!(p.receitaR||p.custoR))return;ob.push({o:r.o,p:p.p,rec:r2(p.receitaR),av:p.av,v:p.v,uni:p.unidade})})})});
    const recOb=sum(ob,y=>y.rec);
    const tbl=`<table class="no-filter"><tbody>${L.map(([l,v,s])=>`<tr class="${s?'sub':''}"><td>${s?'− ':''}${l}</td><td>${R$(v)}</td></tr>`).join('')}
     <tr class="tot"><td>= Contribuição das obras</td><td>${R$(d.mc)}</td></tr><tr class="sub"><td>− Despesas da empresa (aluguel, folha adm., contas…)</td><td>${R$(-d.fixas)}</td></tr>
     <tr class="tot"><td>= Resultado gerencial</td><td class="${ger(d)<0?'neg':'pos'}">${R$(ger(d))}</td></tr><tr class="sub"><td>− Resultado financeiro (juros, tarifas, depreciação)</td><td>${R$(-d.financeiro)}</td></tr><tr class="tot"><td>= Resultado depois do financeiro</td><td>${R$(d.res)}</td></tr></tbody></table>`;
    const obT=ob.length?`<div class="mt-4"><b>De onde vem a receita</b> <span class="lead">— cada venda, pelo avanço da obra</span><table class="no-filter"><thead><tr><th>Proposta · obra</th><th>Unidade</th><th>Vendido</th><th>Avanço</th><th>Receita</th></tr></thead><tbody>${ob.sort((a,b)=>b.rec-a.rec).map(y=>`<tr class="click" onclick="VD_go('#/fobras/${J(y.o.id)}')"><td><b>${E(y.p&&y.p.numero||'')}</b> · ${E(y.o.nome||'')}</td><td>${E(uniLb(y.uni||''))}</td><td>${R$(y.v)}</td><td>${P1(y.av)}</td><td>${R$(y.rec)}</td></tr>`).join('')}
      ${Math.abs(r2(d.receita-recOb))>=0.01?`<tr><td>Vendas de loja (Focal) e Pós-venda cobrável</td><td></td><td></td><td></td><td>${R$(r2(d.receita-recOb))}</td></tr>`:''}<tr class="tot"><td>Total</td><td></td><td></td><td></td><td>${R$(d.receita)}</td></tr></tbody></table></div>`:'';
    const vd=x.vendL,rb=x.recebL;
    const est=`<div class="mt-4"><b>Vendido, reconhecido e recebido não são a mesma coisa</b><table class="no-filter"><tbody><tr><td>Vendido no mês (contratos fechados)</td><td>${R$(x.vend)}</td></tr><tr><td>Receita reconhecida (pelo avanço de cada obra)</td><td>${R$(d.receita)}</td></tr><tr><td>Recebido no mês (dinheiro que entrou)</td><td>${R$(x.receb)}</td></tr></tbody></table><div class="note">Uma venda de R$ 100.000 aprovada hoje entra como vendida; vira receita conforme a obra avança (entrega de equipamento + serviço feito); e vira caixa quando o cliente paga cada parcela.</div></div>`;
    return head(k==='receita'?'Receita do período':'Resultado gerencial',R$(k==='receita'?d.receita:ger(d)),'Mesmo motor do Financeiro › DRE'+(d.fonte?' · base: '+E(d.fonte):''))+tbl+obT+est+`<a class="btnl" href="javascript:VD_go('#/dre')">Abrir no Financeiro › DRE ›</a>`}
  if(k==='caixa'){const c=x.cx;return head('Saldo de caixa',c.semConta?'—':R$(c.tot),atual()?'Saldo de hoje em cada conta':'Saldo em '+dBR(fimMes(VD.ym))+' = saldo de hoje menos o que se movimentou depois')+
    `<table class="no-filter"><thead><tr><th>Conta</th><th>Filial</th><th>Saldo hoje</th></tr></thead><tbody>${c.rows.map(r=>`<tr class="click" onclick="VD_go('#/finlanc')"><td><b>${E(r.nome)}</b></td><td>${E(r.filial||'empresa')}</td><td>${R$(r.saldo)}</td></tr>`).join('')}
    <tr class="tot"><td>Total hoje</td><td></td><td>${R$(c.hoje)}</td></tr>${atual()?'':`<tr class="sub"><td>− movimentos depois de ${dBR(fimMes(VD.ym))}</td><td></td><td>${R$(-c.depois)}</td></tr><tr class="tot"><td>Saldo no fim do período</td><td></td><td>${R$(c.tot)}</td></tr>`}</tbody></table>${conf(c.hoje,sum(c.rows,r=>r.saldo))}<div class="note">Transferências entre contas da própria empresa não contam como entrada. Empréstimos entram no caixa mas não na receita.</div><a class="btnl" href="javascript:VD_go('#/finlanc')">Abrir no Financeiro › Lançamentos ›</a>`}
  if(k==='receber'||k==='pagar'){const t=k==='receber'?x.rc:x.pg;const ref=atual()?hoje():fimMes(VD.ym);
    const rows=t.rows.slice().sort((a,b)=>String(a.vencimento||'').localeCompare(String(b.vencimento||'')));
    const quem=l=>{if(k==='receber'){const p=propDoTitulo(l);return (p?nomeCli(p):'')||l.favorecido||l.descricao||'—'}return l.fornecedor||l.favorecido||l.descricao||l.categoria||'—'};
    const ref2=l=>{const p=propDoTitulo(l);const o=obraDoTitulo(l);return [p&&p.numero,o&&o.nome].filter(Boolean).join(' · ')||l.categoria||''};
    return head(k==='receber'?'Contas a receber':'Contas a pagar',R$(t.tot),`${N0(rows.length)} títulos em aberto · ${t.vencido?`<span class="neg">${R$(t.vencido)} vencido</span>`:'nada vencido'}`)+
    `<table class="no-filter"><thead><tr><th>${k==='receber'?'Cliente':'Fornecedor / despesa'}</th><th>Proposta · obra</th><th>Vence</th><th>Valor</th></tr></thead><tbody>${rows.map(l=>{const v=String(l.vencimento||'')<ref;return `<tr class="click" onclick="VD_go('#/${k}')"><td><b>${E(quem(l))}</b><div class="lead">${E(l.categoria||'')}</div></td><td>${E(ref2(l))}</td><td class="${v?'neg':''}">${dBR(l.vencimento)}${v?` · ${N0(diasEntre(l.vencimento,ref))} d atraso`:''}</td><td>${R$(l.valor)}</td></tr>`}).join('')}${totRow('Total',t.tot,2)}</tbody></table>${conf(t.tot,sum(rows,l=>l.valor))}<a class="btnl" href="javascript:VD_go('#/${k}')">Abrir no Financeiro › ${k==='receber'?'A receber':'A pagar'} ›</a>`}
  if(k==='estoque'){const s=x.es;return head('Estoque valorizado',R$(s.tot),`${N0(s.n)} unidades nossas (consignado não conta) · ao preço de custo · clique num produto para ver as unidades`)+
    `<table class="no-filter"><thead><tr><th>Produto</th><th>Qtd.</th><th>Custo total</th></tr></thead><tbody>${s.rows.map((r,i)=>{const k=r.us[0]&&r.us[0].produto_id;const ab=VD.exp===k;return `<tr class="click" onclick="VD.exp=VD.exp==='${J(k)}'?null:'${J(k)}';window.VD_R()"><td>${ab?'▾':'▸'} <b>${E(r.nome)}</b> <span class="lead">${E(r.marca)}</span></td><td>${N0(r.q)}</td><td>${R$(r.v)}</td></tr>`+(ab?r.us.map(u=>`<tr class="sub"><td>${E(u.serial||u.sn||'sem série')} · ${E((getRow('locais',u.loc_id)||{}).nome||u.loc_id||'')}</td><td>1</td><td>${R$((+u.custo>0)?+u.custo:((getRow('produtos',u.produto_id)||{}).custo||0))}</td></tr>`).join(''):'')}).join('')}${totRow('Total',s.listado,1)}</tbody></table>${conf(s.tot,s.listado)}<a class="btnl" href="javascript:VD_go('#/estoque')">Abrir no Estoque ›</a>`}
  if(k==='semunidade'){
    const por=VD.por==='fil'?'fil':'uni';
    const tot=por==='uni'?dre(VD.ym,'',VD.fil):dre(VD.ym,VD.uni,'');
    const ks=por==='uni'?UNIS().map(u=>dre(VD.ym,u,VD.fil)):FILS().concat([ADM()]).map(f=>dre(VD.ym,VD.uni,f));
    const LN=[['receita','Receita',1],['deducoes','Impostos sobre a venda',-1],['cmv','Equipamento',-1],['tecnicos','Técnicos',-1],['viagens','Viagens',-1],['terceiros','Terceiros e frete',-1],['comissao','Comissões',-1],['rt','RT',-1],['fixas','Despesas da empresa',-1]];
    const dif=LN.map(([kk,l,sg])=>({l,v:r2(sg*(tot[kk]-ks.reduce((a,d)=>a+(+d[kk]||0),0)))})).filter(x=>Math.abs(x.v)>=0.01);
    const semU=por==='uni'?(S.db.obras||[]).filter(o=>{const u=uniO(o);return !u||UNIS().indexOf(u)<0}).filter(o=>(S.db.propostas||[]).some(p=>p.obra_id===o.id&&VEND.includes(p.estado))):[];
    const totDif=sum(dif,x=>x.v);
    return head('Sem '+(por==='uni'?'unidade':'filial'),R$(totDif),'O que o motor da DRE soma na empresa mas que não pertence a nenhuma linha. Cada valor abaixo é a diferença entre o total da empresa e a soma das linhas, linha a linha da DRE.')+
     `<table class="no-filter"><thead><tr><th>Linha da DRE</th><th>Valor sem dono</th></tr></thead><tbody>${dif.map(x=>`<tr><td>${E(x.l)}</td><td>${R$(x.v)}</td></tr>`).join('')}<tr class="tot"><td>Efeito no resultado</td><td>${R$(totDif)}</td></tr></tbody></table>`+
     (semU.length?`<div class="mt-4"><b>Obras vendidas sem unidade de negócio</b><table class="no-filter"><tbody>${semU.map(o=>`<tr class="click" onclick="VD_go('#/fobras/${J(o.id)}')"><td><b>${E(o.nome||o.id)}</b></td><td>definir a unidade ›</td></tr>`).join('')}</tbody></table></div>`:'')+
     `<div class="note">Corrige-se dando unidade/filial à obra ou ao lançamento (Financeiro › Obras ou › Lançamentos). Quando todos têm dono, esta linha some e a ponte fecha ao centavo.</div>`}
  if(k.indexOf('op_')===0){const o=x.op;const kk=k.slice(3);
    const P=(lst,tt)=>head(tt,N0(lst.length),'')+`<table class="no-filter"><thead><tr><th>Proposta</th><th>Cliente</th><th>Situação</th><th>Valor</th></tr></thead><tbody>${lst.map(p=>`<tr class="click" onclick="VD_go('#/editor/${J(p.id)}')"><td><b>${E(p.numero||'')}</b><div class="lead">${E(p.nome||'')}</div></td><td>${E(nomeCli(p))}</td><td>${E(ESTLB[p.estado]||p.estado)}</td><td>${R$(Mtot(p))}</td></tr>`).join('')}</tbody></table>`;
    const O=(lst,tt)=>head(tt,N0(lst.length),'')+`<table class="no-filter"><thead><tr><th>Obra</th><th>Entrega prevista</th><th>Situação</th></tr></thead><tbody>${lst.map(b=>{const at=b.entrega&&b.entrega.prevista&&b.entrega.prevista<hoje();return `<tr class="click" onclick="VD_go('#/obras/${J(b.id)}')"><td><b>${E(b.nome||b.id)}</b></td><td class="${at?'neg':''}">${dBR(b.entrega&&b.entrega.prevista)}${at?` · ${N0(diasEntre(b.entrega.prevista,hoje()))} d atraso`:''}</td><td>${E(b.situacao||'em andamento')}</td></tr>`}).join('')}</tbody></table>`;
    if(kk==='abertas')return P(o.abertas,'Propostas em aberto');
    if(kk==='aprovacao')return P(o.aprov,'Aguardando aprovação')+(o.rtd.length?`<div class="mt-3"><b>Ret/Troc aguardando</b><table class="no-filter"><tbody>${o.rtd.map(r=>`<tr class="click" onclick="VD_go('#/rettroc/${J(r.id)}')"><td>${E(r.numero||r.id)}</td><td>${E(r.status)}</td></tr>`).join('')}</tbody></table></div>`:'');
    if(kk==='obras')return O(o.obras,'Obras em andamento');
    if(kk==='atrasadas')return O(o.atras,'Obras atrasadas');
    if(kk==='compras')return head('Compras pendentes',N0(o.compras.length),'cotação → aprovada → a chegar')+`<table class="no-filter"><thead><tr><th>Compra</th><th>Fornecedor</th><th>Situação</th></tr></thead><tbody>${o.compras.map(p=>`<tr class="click" onclick="VD_go('#/${p.estado==='a_receber'?'areceber':'cotacoes'}')"><td><b>${E(p.pc||p.nome||p.id)}</b></td><td>${E(p.fornecedor||'—')}</td><td>${E({cotacao:'Em cotação',aprovado:'Aprovada',a_receber:'A chegar'}[p.estado]||p.estado)}</td></tr>`).join('')}</tbody></table>`;
    if(kk==='os')return head('Atendimentos abertos',N0(o.os.length),'Pós-venda')+`<table class="no-filter"><thead><tr><th>OS</th><th>Cliente</th><th>Aberta há</th></tr></thead><tbody>${o.os.map(s=>`<tr class="click" onclick="VD_go('#/posvenda')"><td><b>${E(s.id)}</b> · ${E(s.titulo||s.desc||'')}</td><td>${E((getRow('clientes',s.cliente_id)||{}).nome||'')}</td><td>${N0(Math.max(0,diasEntre(String(s.criado||hoje()).slice(0,10),hoje())))} dias</td></tr>`).join('')}</tbody></table>`}
  return ''}

/* ───────── 6. a tela ───────── */
function podeVer(){try{if(!window.UQ||!UQ.nivel)return true;return UQ.nivel('diretoria')>=1}catch(e){return true}}
const _old=SCREENS.diretoria;
SCREENS.diretoria=function(){
  CACHE={};
  if(!VD.ym||MESES().indexOf(VD.ym)<0)VD.ym=ymOf(hoje());
  if(!podeVer())return CSS+`<div class="vd"><h1>Visão CEO</h1><div class="card p-4 mt-3" style="border-left:4px solid #dc2626;border-radius:14px"><h5 class="mb-1">Acesso restrito à Diretoria</h5><div class="lead">Caixa, dívidas e resultado da empresa são vistos só pela Diretoria. Peça acesso em Pessoas › Usuários e permissões.</div></div></div>`;
  const x={};
  x.d=dre(VD.ym,VD.uni,VD.fil);
  x.cx=T(caixa,{tot:0,hoje:0,depois:0,rows:[]});x.rc=T(()=>titulos('receber'),{rows:[],tot:0,vencido:0,nVenc:0});x.pg=T(()=>titulos('pagar'),{rows:[],tot:0,vencido:0,nVenc:0});x.es=T(estoque,{tot:0,rows:[],listado:0,n:0});
  x.vendL=T(vendidas,[]);x.vend=sum(x.vendL,Mtot);x.recebL=T(recebidos,[]);x.receb=sum(x.recebL,l=>l.valor);
  x.op=T(opr,{abertas:[],aprov:[],rtd:[],obras:[],atras:[],compras:[],os:[]});
  const agora=new Date();const hh=agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const h=`${CSS}<div class="vd fx2-wrapped" id="vd_root"><div class="d-flex justify-content-between align-items-end flex-wrap gap-2"><div><h1>Visão CEO</h1><div class="lead">A empresa inteira numa tela. Cada número abre os registros que o somam.</div></div><span class="scope">${E(escopoTxt())} · ${ymLb(VD.ym)}</span></div>
   ${barra()}
   ${telaTopo(x)}
   ${T(()=>telaUnidades(x),'<div class="sec bad">Não foi possível montar a tabela por unidade.</div>')}
   ${T(telaCaixa,'')}
   ${T(()=>telaOper(x.op),'')}
   <div class="foot"><span>Atualizado às ${hh} · o painel recalcula a cada ação no sistema</span><span>Resultado gerencial = receita − custos das obras − despesas da empresa · não é o lucro contábil</span><span>Saldos = posição no fim do período; nunca somados mês a mês</span></div>
  </div>${VD.drawer?`<div class="vd vd-ov fx2-wrapped" style="background:rgba(0,0,0,.38)" onclick="if(event.target===this)VD_close()"><div class="vd-dr" id="vd_drawer">${T(()=>gaveta(VD.drawer,x),'')}</div></div>`:''}`;
  return h};
SCREENS.diretoria.__v124=true;SCREENS.diretoria.__old=_old;
try{LABEL.diretoria='Visão CEO'}catch(e){}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&VD.drawer){VD_close()}});
window.V124DIR={dre,comFilial,caixa,titulos,estoque,opr,fila,VD};
/* the page already rendered before this file loaded: redraw if we are on the screen */
try{if(typeof route==='function'&&route().k==='diretoria')renderMain()}catch(e){try{render()}catch(_){}}
})();
