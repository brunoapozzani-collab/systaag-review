/* =====================================================================================================
   v130 · INÍCIO = VISÃO EXECUTIVA (30/10/2026)
   Pedido da Diretoria (reunião de 30/10): o Início é o painel da empresa inteira — César quer a visão macro em
   gráficos; Rodolfo quer que cada número abra os registros que o produziram. Decisões do Bruno (30/10):
   · a Visão CEO deixa de ser uma tela separada: mora no Início (mesmo motor V124DIR, mesmas gavetas);
     #/diretoria passa a abrir o Início
   · quem vê o quê, por perfil: a Diretoria vê tudo (caixa, dívidas, resultado); os demais veem só os blocos das
     telas que o perfil deles abre (UQ.nivel); o bloco do Financeiro só para a Diretoria e o perfil Financeiro;
     custo e margem nunca para quem não abre DRE / Resultado por obra
   · caixa em 13 semanas (o relatório que o César pede), com as compras previstas ao lado: contratado × previsto,
     sem contar duas vezes (pedido com título a pagar já está no caixa; o resto entra só no cenário)
   Regras de sempre: cada número abre uma gaveta com exatamente os registros que o somam, e cada linha abre o
   registro original; números que se subtraem mostram a ponte; pt-BR; produtos agrupados (uma linha por produto,
   clique para ver as unidades); "Os números fecham?" mostra conferências calculadas agora, nunca selos fixos.
   Nada aqui grava dados: o painel só lê.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__V130)return;window.__V130=true;
if(typeof SCREENS!=='object'||typeof SCREENS.home!=='function')return;

/* ───────── helpers ───────── */
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const r2=v=>Math.round((+v||0)*100)/100;
const R$=v=>{v=r2(v);return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})};
const Rk=v=>{v=+v||0;const a=Math.abs(v);let t;if(a>=1e6)t=(a/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi';else if(a>=1e3)t=(a/1e3).toLocaleString('pt-BR',{maximumFractionDigits:a>=1e4?0:1})+' mil';else t=a.toLocaleString('pt-BR',{maximumFractionDigits:0});return (v<0?'−':'')+t};
const P0=v=>(isFinite(v)?v*100:0).toLocaleString('pt-BR',{maximumFractionDigits:0})+'%';
const P1=v=>(isFinite(v)?v*100:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const N0=v=>(+v||0).toLocaleString('pt-BR');
const T=(fn,d)=>{try{const v=fn();return v==null?d:v}catch(e){console.error('Início v130',e);return d}};
const hoje=()=>{try{return today()}catch(e){return new Date().toISOString().slice(0,10)}};
const ymOf=d=>String(d||'').slice(0,7);
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const ymLb=m=>MES[+m.slice(5,7)-1]+'/'+m.slice(2,4);
const dBR=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7)+'/'+String(d).slice(0,4):'—';
const dCurto=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7):'—';
const addDias=(d,n)=>{const x=new Date(String(d).slice(0,10)+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const diasEntre=(a,b)=>Math.round((new Date(String(b).slice(0,10)+'T12:00:00')-new Date(String(a).slice(0,10)+'T12:00:00'))/864e5);
const sum=(xs,f)=>r2((xs||[]).reduce((a,x)=>a+(+(f?f(x):x)||0),0));
const getRow=(t,id)=>T(()=>get(t,id),null)||T(()=>(S.db[t]||[]).find(x=>x.id===id),null);
const plural=(n,a,b)=>N0(n)+' '+(+n===1?a:b);

/* ───────── escopo: o mesmo estado de filtros da Visão CEO (VD) ───────── */
const VD=window.VD=window.VD||{ym:null,uni:'',fil:'',drawer:null,rateio:false,por:'uni'};
const UNIS=()=>T(()=>FD1.UNIDADES.slice(),null)||['TAAG','Acústica','Focal','Pós-venda','Corporativo'];
const uniLb=u=>u==='Corporativo'?'Administrativo':u;
const FILS=()=>T(()=>FIL.lista(),['SP','RJ']);
const ADM=()=>T(()=>FIL.ADM,'Administrativo');
const uniP=p=>p?(T(()=>FX1.unidadeDaProposta(p),'')||''):'';
const uniO=o=>o?(T(()=>FX1.unidadeDaObra(o),'')||o.unidade_negocio||''):'';
const filP=p=>T(()=>FIL.daProposta(p),'');
const filO=o=>T(()=>FIL.daObra(o),'');
const noEsc=p=>{if(!p)return false;if(VD.uni&&uniP(p)!==VD.uni)return false;if(VD.fil&&filP(p)!==VD.fil)return false;return true};
const obraEsc=o=>{if(!o)return true;if(VD.fil&&filO(o)!==VD.fil)return false;if(VD.uni){const u=uniO(o);if(u&&u!==VD.uni)return false}return true};
const FRENTE={taag:'TAAG',acustica:'Acústica',focal:'Focal',posvenda:'Pós-venda'};
const negEsc=n=>!VD.uni||!n.frente||FRENTE[String(n.frente).toLowerCase()]===VD.uni;
const escTxt=()=>(VD.uni?uniLb(VD.uni):'Empresa toda')+(VD.fil?' · filial '+VD.fil:'');
const MESES=()=>{const m=T(()=>FS.dreMeses(),[]).slice();const cur=ymOf(hoje());if(m.indexOf(cur)<0)m.unshift(cur);return m};

/* ───────── quem vê o quê ───────── */
const niv=k=>{try{return window.UQ&&UQ.nivel?(+UQ.nivel(k)||0):3}catch(e){return 3}};
const anyN=(...ks)=>ks.some(k=>niv(k)>=1);
const EXEC=()=>niv('diretoria')>=1;
const PERF=()=>T(()=>me().perfil,'')||'';
const AC={
  geral:()=>EXEC(),
  fin:()=>EXEC()||(PERF()==='financeiro'&&anyN('fhoje','fluxo','receber')),
  com:()=>EXEC()||anyN('hoje','pipeline','propostas'),
  est:()=>EXEC()||anyN('epainel','estoque','cotacoes'),
  obr:()=>EXEC()||anyN('copainel','obras','prjpainel'),
  rel:()=>EXEC()||anyN('crmhome','crmparceiros','crmtarefas'),
  pos:()=>EXEC()||anyN('posvisao','chamados','posatend'),
  custo:()=>EXEC()||anyN('robra','dre')
};

/* ───────── memo por desenho ───────── */
let MEMO={};const C=(k,f)=>(k in MEMO)?MEMO[k]:(MEMO[k]=T(f,null));

/* ─────────────────────────────── DADOS ─────────────────────────────── */
const VEND=['vendida','em_obra','concluida'];
const PAB=['rascunho','enviada','em_prevendas','aprovada_cliente','em_revisao','revisao','ajuste','aguardando'];
const Mtot=p=>T(()=>+M.total(p),0)||T(()=>+D.propTotal(p.id),0)||0;
const META_K={'TAAG':'taag','Acústica':'acustica','Focal':'focal','Pós-venda':'posvenda'};
function metaAno(){const m=S.db.metas||{};if(VD.uni)return +m[META_K[VD.uni]]||0;if(+m.empresa)return +m.empresa;return Object.keys(META_K).reduce((a,u)=>a+(+m[META_K[u]]||0),0)}
const nomeCli=p=>T(()=>(getRow('clientes',p.cliente_id)||(p.obra_id&&getRow('clientes',(getRow('obras',p.obra_id)||{}).cliente_id))||(S.db.clientes||[]).find(c=>c.sigla===p.sigla)||{}).nome,'')||p.nome||'';
const propLb=p=>'Proposta '+(p.numero||p.id);

/* comercial */
function com(){return C('com',()=>{
  const y=VD.ym.slice(0,4);const P=S.db.propostas||[];
  const vend=P.filter(p=>VEND.includes(p.estado)&&p.vendida_em&&noEsc(p));
  const mes=vend.filter(p=>ymOf(p.vendida_em)===VD.ym);
  const ano=vend.filter(p=>String(p.vendida_em).slice(0,4)===y&&ymOf(p.vendida_em)<=VD.ym);
  const porMes=Array.from({length:12},(_,i)=>{const m=y+'-'+String(i+1).padStart(2,'0');const ps=vend.filter(p=>ymOf(p.vendida_em)===m);return {m,ps,v:sum(ps,Mtot)}});
  const mAno=VD.fil?0:metaAno();const nMes=+VD.ym.slice(5,7);
  const abertas=P.filter(p=>PAB.includes(p.estado)&&noEsc(p));
  const negs=(S.db.negociacoes||[]).filter(n=>!n.resultado&&negEsc(n));
  const negV=n=>{if(+n.valor>0)return +n.valor;const ps=(n.proposta_ids||[]).map(id=>getRow('propostas',id)).filter(p=>p&&PAB.includes(p.estado));return sum(ps,Mtot)};
  const porC={};ano.forEach(p=>{const cs=(p.consultores&&p.consultores.length?p.consultores:['Sem consultor']);const v=Mtot(p)/cs.length;cs.forEach(c=>{(porC[c]=porC[c]||{nome:c,v:0,n:0,ps:[]});porC[c].v+=v;porC[c].n++;porC[c].ps.push(p)})});
  const cons=Object.values(porC).sort((a,b)=>b.v-a.v);cons.forEach(c=>c.v=r2(c.v));
  const comis=mes.map(p=>({p,c:T(()=>V123C.comprometido(p),null)})).filter(x=>x.c&&(+x.c.valor||0)>0);
  return {y,vend,mes,vMes:sum(mes,Mtot),ano,vAno:sum(ano,Mtot),porMes,mAno,mMes:r2(mAno/12),mYtd:r2(mAno*nMes/12),nMes,
    abertas,vAb:sum(abertas,Mtot),negs,negV,vNeg:sum(negs,negV),pond:sum(negs,n=>negV(n)*(+n.chance||0)/100),semValor:negs.filter(n=>!negV(n)),
    cons,comis,vCom:sum(comis,x=>x.c.valor)}})}

/* estoque e compras — os mesmos motores do Estoque: FX2.estoqueCanon (o número do Estoque) e Q.compute (a demanda
   de cada proposta vendida, com data de necessidade, atendida pelo livre e pelos pedidos — "pedido por propostas" é calculado) */
const custoU=u=>{const p=getRow('produtos',u.produto_id)||{};return (+u.custo>0)?+u.custo:(+p.custo||0)};
const nomeProd=pid=>{const p=getRow('produtos',pid)||{};return (p.nome||pid)+(p.marca?' · '+p.marca:'')};
const pedValor=p=>r2((p.itens||[]).reduce((a,i)=>a+(+i.qtd||0)*(+i.custo||0),0));
const pedQtd=p=>(p.itens||[]).reduce((a,i)=>a+(+i.qtd||0),0);
function est(){return C('est',()=>{
  const us=T(()=>nodeUnits(null),null)||(S.db.unidades||[]).filter(u=>u.estado!=='baixado'&&u.loc_id&&T(()=>bucketOf(u),'')!=='cliente');
  const canon=T(()=>FX2.estoqueCanon(),null)||{total:us.length,nossas:us.length,custo:sum(us,custoU)};
  const q=T(()=>Q.compute(),{rows:[]});const rsvP={};(q.rows||[]).forEach(r=>{rsvP[r.pid]=(rsvP[r.pid]||0)+(+r.rsv||0)});
  const g={livre:[],ped:[],alo:[],fora:[],cons:[]};const usados={};
  us.forEach(u=>{
    if(u.natureza==='consignado'){g.cons.push(u);return}
    if(u.estado==='livre'){const k=u.produto_id;usados[k]=usados[k]||0;if(usados[k]<(rsvP[k]||0)){usados[k]++;g.ped.push(u)}else g.livre.push(u);return}
    if(['separado','montagem','kit','designado'].includes(u.estado)){g.alo.push(u);return}
    g.fora.push(u)});
  const vl={livre:sum(g.livre,custoU),ped:sum(g.ped,custoU),alo:sum(g.alo,custoU),fora:sum(g.fora,custoU)};
  const ped=(S.db.pedidos||[]).filter(p=>p&&p.estado!=='cancelado');
  const temTitulo=p=>(S.db.lancamentos||[]).some(l=>l.tipo==='pagar'&&l.origem==='pedido'&&l.origem_id===p.id);
  const transito=ped.filter(p=>['aprovado','a_receber'].includes(p.estado));
  const cot=ped.filter(p=>p.estado==='cotacao');
  const atras=transito.filter(p=>p.previsao&&p.previsao<hoje());
  const nec=(q.rows||[]).filter(r=>(+r.falta||0)>0).map(r=>{const p=getRow('propostas',r.pr);const pr=getRow('produtos',r.pid)||{};return {r,p,pid:r.pid,q:+r.falta,v:r2((+r.falta)*(+pr.custo||0)),need:r.need||''}}).filter(x=>!VD.uni&&!VD.fil||noEsc(x.p));
  const aComprarMotor=T(()=>(S.db.propostas||[]).filter(p=>['vendida','em_obra'].includes(p.estado)&&(!VD.uni&&!VD.fil||noEsc(p))).reduce((a,p)=>a+(+D.chain(p.id).acomp||0),0),null);
  /* compras previstas para o caixa (ainda sem título a pagar): o que falta comprar (na semana em que a obra precisa)
     + cotações para estoque (sem proposta, na previsão) + pedidos aprovados sem título. Cotação ligada a uma proposta
     já está dentro do "falta comprar" — não entra de novo. */
  const prev=[];nec.forEach(x=>prev.push({tipo:'falta',lb:nomeProd(x.pid),sub:x.p?propLb(x.p):'',data:x.need&&x.need>hoje()?x.need:hoje(),v:x.v,href:x.p?'#/ocprop/'+x.p.id:'#/estoque'}));
  ped.filter(p=>(p.estado==='cotacao'&&!p.proposta_id)||(['aprovado','a_receber'].includes(p.estado)&&!temTitulo(p))).forEach(p=>prev.push({tipo:p.estado==='cotacao'?'cotacao':'pedido',lb:(p.estado==='cotacao'?'Cotação ':'Pedido ')+(p.pc||p.id)+' · '+(p.fornecedor||'a cotar'),sub:plural(pedQtd(p),'item','itens'),data:p.previsao&&p.previsao>hoje()?p.previsao:hoje(),v:pedValor(p),href:'#/cotacao/'+p.id}));
  const cotProp=cot.filter(p=>p.proposta_id);
  return {us,canon,g,vl,ped,transito,cot,cotProp,atras,nec,qNec:nec.reduce((a,x)=>a+x.q,0),vNec:sum(nec,x=>x.v),aComprarMotor,prev,vPrev:sum(prev,x=>x.v),temTitulo}})}

/* caixa 13 semanas — FN.semanas13 (o mesmo do Financeiro › Fluxo de caixa, já com comissões e RT) */
function cx(){return C('cx',()=>{
  const sem=T(()=>FN.semanas13(),[])||[];const c0=T(()=>+FS.caixa(),0)||0;const t=hoje();
  const e=est();const prevS=sem.map(()=>0);
  (e?e.prev:[]).forEach(x=>{let i=sem.findIndex(w=>x.data>=w.inicio&&x.data<=w.fim);if(i<0)i=x.data<=(sem[0]&&sem[0].fim||t)?0:-1;if(i>=0)prevS[i]=r2(prevS[i]+x.v)});
  let acc=0;const cen=sem.map((w,i)=>{acc=r2(acc+prevS[i]);return r2(+w.saldoFinal-acc)});
  const ent=sum(sem,w=>w.entradas),sai=sum(sem,w=>w.saidas);
  const rec=(S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&!l.pago_em);
  const venc=rec.filter(l=>String(l.vencimento||'')<t);
  const cliDe=l=>{const p=l.origem_id?getRow('propostas',l.origem_id):null;return p?nomeCli(p)||propLb(p):(l.categoria||'Sem cliente')};
  const inad={};venc.forEach(l=>{const k=cliDe(l);(inad[k]=inad[k]||{nome:k,v:0,ls:[]});inad[k].v+=+l.valor||0;inad[k].ls.push(l)});
  const fim13=sem.length?sem[sem.length-1].fim:t;
  const rec13=rec.filter(l=>String(l.vencimento||'')<=fim13);
  const pag13=(S.db.lancamentos||[]).filter(l=>l.tipo==='pagar'&&!l.pago_em&&String(l.vencimento||'')<=fim13&&!['fixo','folha'].includes(l.origem));
  const fixoSem=r2(T(()=>FN.fixosMes(),0)*12/52);
  const partic=sum(sem,w=>w.participacoes||0);
  const menor=sem.length?sem.reduce((a,w)=>+w.saldoFinal<+a.saldoFinal?w:a,sem[0]):null;
  const negI=sem.findIndex(w=>+w.saldoFinal<0),negC=cen.findIndex(v=>v<0);
  return {sem,c0,ent,sai,prevS,cen,venc,vVenc:sum(venc,l=>l.valor),inad:Object.values(inad).sort((a,b)=>b.v-a.v),rec13,pag13,fixoSem,partic,menor,negI,negC,cliDe,fim:sem.length?r2(sem[sem.length-1].saldoFinal):c0}})}

/* obras e projetos */
function obr(){return C('obr',()=>{
  const op=T(()=>window.V124DIR.opr(),null)||{obras:[],atras:[]};const at=op.obras||[];const t=hoje();const lim=addDias(t,14);
  const prog=o=>{const es=o.etapas||[];if(!es.length)return null;return es.filter(e=>/finaliz|conclu/i.test(e.status||'')).length/es.length};
  const cls=o=>{const pv=o.entrega&&o.entrega.prevista;if(!pv)return 'sem';if(pv<t)return 'atras';const pr=prog(o);if(pv<=lim&&(pr==null||pr<0.7))return 'risco';return 'ok'};
  const g={ok:[],risco:[],atras:[],sem:[]};at.forEach(o=>g[cls(o)].push(o));
  const prox=at.filter(o=>o.entrega&&o.entrega.prevista&&o.entrega.prevista>=t&&o.entrega.prevista<=addDias(t,60)).sort((a,b)=>a.entrega.prevista.localeCompare(b.entrega.prevista));
  const pend=[];at.forEach(o=>(o.entregaveis||[]).forEach(e=>{if(!/conclu|enviad|aprovad|finaliz|entregue|^ok$/i.test(e.status||''))pend.push({o,e})}));
  const obrasPrj=at.filter(o=>pend.some(x=>x.o===o));
  const mat=at.map(o=>({o,q:T(()=>Q.porObra(o.id),null)})).filter(x=>x.q&&x.q.falta>0);
  return {at,g,prox,prog,cls,pend,obrasPrj,mat,fila:T(()=>window.V124DIR.fila(op),[]),op}})}

/* relacionamento e pós-venda */
function rel(){return C('rel',()=>{
  const TT=window.CRM_T||{};const t=hoje();const d30=addDias(t,-30);
  const parc=S.db.parceiros||[];const pNome=id=>(parc.find(p=>+p.crm_id===+id)||{}).nome||('Parceiro '+id);
  const inter=(TT.interacoes||[]).filter(i=>{const d=String(i.data||'').slice(0,10);return d>=d30&&d<=t});
  const tar=(TT.tarefas||[]).filter(x=>!/conclu|cancel/i.test(x.status||''));
  const tarAtr=tar.filter(x=>x.data_prevista&&x.data_prevista<t);
  const tarProx=tar.filter(x=>x.data_prevista&&x.data_prevista>=t&&x.data_prevista<=addDias(t,7));
  const ativos=parc.filter(p=>/^ativo/i.test(p.status||''));
  const deParc=n=>n.fontes&&(n.fontes.arquitetura||n.fontes.indicador||n.fontes.gerenciadora);
  const negP=(S.db.negociacoes||[]).filter(n=>deParc(n)&&negEsc(n));
  const y=VD.ym.slice(0,4);
  return {parc,pNome,inter,tar,tarAtr,tarProx,ativos,negPAb:negP.filter(n=>!n.resultado),negPFech:negP.filter(n=>n.resultado==='fechada'&&String(n.movido||n.criado||'').slice(0,4)===y),deParc}})}
function pos(){return C('pos',()=>{
  const t=hoje();const os=(S.db.os||[]).filter(o=>o.estado==='aberta');
  const osAtr=os.filter(o=>diasEntre(String(o.criado||t).slice(0,10),t)>7);
  const atd=(S.db.at_atendimentos||[]).filter(a=>a.start_date&&a.start_date>=t&&a.start_date<=addDias(t,30)).sort((a,b)=>a.start_date.localeCompare(b.start_date));
  const pv=(S.db.propostas||[]).filter(p=>uniP(p)==='Pós-venda'&&['aprovada_cliente','enviada'].includes(p.estado));
  return {os,osAtr,atd,pv,vPv:sum(pv,Mtot)}})}

/* conferências — calculadas agora, nunca selos fixos */
function qualidade(){return C('qual',()=>{
  const out=[];
  if(AC.fin()){const tot=T(()=>V124DIR.dre(VD.ym,'',VD.fil),null);let dif=0;if(tot){const soma=UNIS().reduce((a,u)=>a+r2(T(()=>V124DIR.dre(VD.ym,u,VD.fil).ebitda,0)),0);dif=r2(r2(tot.ebitda)-soma)}
    const c=cx();const ponte=c&&c.sem.length?r2(c.c0+c.ent-c.sai-c.fim):0;
    const ok=Math.abs(dif)<0.05&&Math.abs(ponte)<0.01;
    out.push({k:'fin',lb:'Financeiro',st:ok?'ok':'div',txt:ok?'Unidades somam a empresa; o caixa de 13 semanas fecha':(Math.abs(dif)>=0.05?'Unidades ≠ empresa em '+R$(dif):'Caixa de 13 semanas não fecha em '+R$(ponte))})}
  if(AC.est()){const e=est();const nU=e.g.livre.length+e.g.ped.length+e.g.alo.length+e.g.fora.length+e.g.cons.length;const vU=r2(e.vl.livre+e.vl.ped+e.vl.alo+e.vl.fora);
    const okN=nU===e.canon.total,okV=Math.abs(vU-r2(e.canon.custo))<0.01,okF=e.aComprarMotor==null||e.aComprarMotor===e.qNec;
    out.push({k:'est',lb:'Estoque',st:okN&&okV&&okF?'ok':'div',txt:okN&&okV&&okF?'Livre + pedido por propostas + separado + fora de venda = estoque; falta comprar confere com o Estoque':(!okN?'Unidades não fecham ('+N0(nU)+' × '+N0(e.canon.total)+')':!okV?'Valor não fecha em '+R$(vU-e.canon.custo):'Falta comprar: '+N0(e.qNec)+' × '+N0(e.aComprarMotor)+' no Estoque')})}
  if(AC.com()){const c=com();const sem=c.vend.filter(p=>!uniP(p)||!Mtot(p));const semCons=c.ano.filter(p=>!(p.consultores&&p.consultores.length));const n=sem.length+semCons.length+c.semValor.length;
    out.push({k:'com',lb:'Comercial',st:n?'pend':'ok',txt:n?[sem.length?plural(sem.length,'venda sem unidade ou valor','vendas sem unidade ou valor'):'',semCons.length?plural(semCons.length,'venda sem consultor','vendas sem consultor'):'',c.semValor.length?plural(c.semValor.length,'oportunidade sem valor','oportunidades sem valor'):''].filter(Boolean).join(' · '):'Toda venda tem unidade, valor e consultor'})}
  if(AC.obr()){const o=obr();const n=o.g.sem.length;out.push({k:'obr',lb:'Obras',st:n?'pend':'ok',txt:n?plural(n,'obra em andamento sem data de entrega','obras em andamento sem data de entrega'):'Toda obra em andamento tem data de entrega'})}
  return out})}

/* alertas — o que pede alguém agora */
function alertas(){return C('ale',()=>{
  const a=[];
  if(AC.fin()){const c=cx();if(c.venc.length)a.push({sev:3,n:c.venc.length,lb:'Cobranças vencidas',sub:R$(c.vVenc)+' a receber já venceram · '+plural(c.inad.length,'cliente','clientes'),k:'venc'});
    if(c.negI>=0)a.push({sev:3,n:1,lb:'O caixa fica negativo',sub:'na semana de '+dCurto(c.sem[c.negI].inicio)+' — veja o Fluxo de caixa',href:'#/fluxo'});
    else if(c.negC>=0)a.push({sev:2,n:1,lb:'Comprando o que falta, o caixa fica negativo',sub:'no cenário com as compras previstas, na semana de '+dCurto(c.sem[c.negC].inicio),k:'prev'})}
  if(AC.est()){const e=est();if(e.atras.length)a.push({sev:2,n:e.atras.length,lb:'Compras atrasadas',sub:'pedidos a chegar com a previsão já vencida',k:'compAtr'});
    if(e.nec.length)a.push({sev:e.nec.some(x=>x.need&&x.need<=addDias(hoje(),14))?3:2,n:e.qNec,lb:'Itens vendidos ainda sem compra',sub:'o estoque livre e os pedidos não cobrem'+(AC.custo()?' · '+R$(e.vNec):''),k:'nec'})}
  if(AC.obr()){const o=obr();if(o.g.atras.length)a.push({sev:3,n:o.g.atras.length,lb:'Obras atrasadas',sub:'data de entrega já passou',k:'obr_atras'});
    if(o.g.risco.length)a.push({sev:2,n:o.g.risco.length,lb:'Obras em risco',sub:'entrega em até 14 dias com menos de 70% das etapas prontas',k:'obr_risco'})}
  if(EXEC()){const o=obr();const n=(o.op.aprov||[]).length+(o.op.rtd||[]).length;if(n)a.push({sev:2,n,lb:'Aprovações pendentes',sub:'propostas e trocas esperando a Diretoria ou o Financeiro',vd:'op_aprovacao'})}
  if(AC.rel()){const r=rel();if(r.tarAtr.length)a.push({sev:1,n:r.tarAtr.length,lb:'Ações de relacionamento atrasadas',sub:'próximas ações do CRM com a data vencida',k:'tarAtr'})}
  if(AC.pos()){const p=pos();if(p.osAtr.length)a.push({sev:2,n:p.osAtr.length,lb:'Chamados abertos há mais de 7 dias',sub:'Pós-venda',k:'osAtr'})}
  return a.sort((x,y)=>y.sev-x.sev||y.n-x.n)})}

/* ─────────────────────────────── GRÁFICOS (SVG) ─────────────────────────────── */
/* rótulos sempre visíveis; cor nunca sozinha; tooltip compartilhado da v125 (data-tip dentro de .vd .rx) */
const ST={ok:'#0ca30c',risco:'#fab219',atras:'#d03b3b',sem:'#a3a29c'};
function donut(segs,centro,sub){const tot=segs.reduce((a,s)=>a+s.v,0);const R=78,r=52,cx_=100,cy_=100;
  if(!tot)return `<svg viewBox="0 0 200 200" role="img"><circle cx="100" cy="100" r="${(R+r)/2}" fill="none" stroke="var(--rx-grid,#e9e8e4)" stroke-width="${R-r}"/><text x="100" y="104" text-anchor="middle" class="v" style="font-size:22px">0</text></svg>`;
  let a0=-Math.PI/2;const gap=segs.filter(s=>s.v).length>1?0.025:0;
  const arcs=segs.filter(s=>s.v).map(s=>{const a=s.v/tot*Math.PI*2;const a1=a0+gap/2,a2=a0+a-gap/2;a0+=a;const big=a2-a1>Math.PI?1:0;
    const p=(ang,rad)=>(cx_+rad*Math.cos(ang)).toFixed(2)+' '+(cy_+rad*Math.sin(ang)).toFixed(2);
    const d=segs.filter(x=>x.v).length===1?`M ${cx_} ${cy_-R} A ${R} ${R} 0 1 1 ${cx_-0.01} ${cy_-R} L ${cx_-0.01} ${cy_-r} A ${r} ${r} 0 1 0 ${cx_} ${cy_-r} Z`:`M ${p(a1,R)} A ${R} ${R} 0 ${big} 1 ${p(a2,R)} L ${p(a2,r)} A ${r} ${r} 0 ${big} 0 ${p(a1,r)} Z`;
    return `<path d="${d}" fill="${s.cor}" data-tip="${E('<b>'+s.lb+'</b><br>'+N0(s.v)+' · '+P0(s.v/tot)+'<br><span style=opacity:.7>clique para ver a lista</span>')}" onclick="${s.on}"/>`}).join('');
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${E(sub||'')}">${arcs}<text x="100" y="100" text-anchor="middle" class="v" style="font-size:30px">${E(centro)}</text><text x="100" y="122" text-anchor="middle">${E(sub||'')}</text></svg>`}

function barrasMeta(pm,meta,cor,curM){ /* realizado por mês (barras) + meta do mês (traço) — um eixo só, em R$ */
  const W=1000,H=250,L=58,Rr=10,Tp=24,B=34;const n=pm.length;const gw=(W-L-Rr)/n,bw=Math.min(46,gw*.58);
  const hi0=Math.max(meta,...pm.map(x=>x.v),1);const hi=hi0*1.12;const sy=v=>Tp+(H-Tp-B)*(1-v/hi);
  const ticks=[0,hi0/2,hi0].map(v=>`<line class="gl" x1="${L}" x2="${W-Rr}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/><text x="${L-8}" y="${(sy(v)+4).toFixed(1)}" text-anchor="end">${E(Rk(v))}</text>`).join('');
  const bars=pm.map((x,i)=>{const cxp=L+gw*i+gw/2;const y=sy(x.v);const fut=x.m>curM;const atg=meta>0&&x.v>=meta;
    const tip='<b>'+ymLb(x.m)+'</b><br>Vendido '+R$(x.v)+(meta>0?'<br>Meta do mês '+R$(meta)+'<br>'+P0(x.v/meta)+' da meta':'')+'<br>'+plural(x.ps.length,'venda','vendas');
    const lbl=x.v>0?`<text class="v" x="${cxp.toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle">${E(Rk(x.v))}</text>`:'';
    const bar=x.v>0?`<path d="M ${(cxp-bw/2).toFixed(1)} ${sy(0).toFixed(1)} V ${(y+4).toFixed(1)} Q ${(cxp-bw/2).toFixed(1)} ${y.toFixed(1)} ${(cxp-bw/2+4).toFixed(1)} ${y.toFixed(1)} H ${(cxp+bw/2-4).toFixed(1)} Q ${(cxp+bw/2).toFixed(1)} ${y.toFixed(1)} ${(cxp+bw/2).toFixed(1)} ${(y+4).toFixed(1)} V ${sy(0).toFixed(1)} Z" fill="${cor}" opacity="${x.m===curM?1:.78}"/>`:'';
    const hit=`<rect x="${(L+gw*i).toFixed(1)}" y="${Tp}" width="${gw.toFixed(1)}" height="${H-Tp-B}" fill="transparent" data-tip="${E(tip)}" onclick="V130_open('vendMes','${x.m}')"/>`;
    return bar+lbl+`<text x="${cxp.toFixed(1)}" y="${H-12}" text-anchor="middle" style="${x.m===curM?'font-weight:800;fill:var(--rx-ink)':''}${fut?';opacity:.45':''}">${MES[i]}</text>`+(atg?`<text x="${cxp.toFixed(1)}" y="${H-0}" text-anchor="middle" style="fill:#0ca30c;font-weight:800">✓</text>`:'')+hit}).join('');
  const ml=meta>0?`<line x1="${L}" x2="${W-Rr}" y1="${sy(meta).toFixed(1)}" y2="${sy(meta).toFixed(1)}" stroke="var(--rx-ink,#0b0b0b)" stroke-width="2" stroke-dasharray="6 5"/><text x="${W-Rr}" y="${(sy(meta)-6).toFixed(1)}" text-anchor="end" class="v">meta do mês ${E(Rk(meta))}</text>`:'';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Vendido por mês contra a meta">${ticks}<line class="zl" x1="${L}" x2="${W-Rr}" y1="${sy(0)}" y2="${sy(0)}"/>${bars}${ml}</svg>`}

function linhasCaixa(c){ /* duas linhas na mesma escala (R$): saldo contratado × saldo se comprarmos o previsto */
  const W=1000,H=250,L=64,Rr=110,Tp=20,B=30;const pts=[{lb:'hoje',a:c.c0,b:c.c0}].concat(c.sem.map((w,i)=>({lb:dCurto(w.inicio),a:+w.saldoFinal,b:c.cen[i],w})));
  const ys=pts.flatMap(p=>[p.a,p.b]).concat([0]);let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo)hi=lo+1;const pad=(hi-lo)*.1;hi+=pad;if(lo<0)lo-=pad;else lo=0;
  const sx=i=>L+(W-L-Rr)*i/(pts.length-1||1),sy=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));
  const path=k=>pts.map((p,i)=>(i?'L':'M')+sx(i).toFixed(1)+' '+sy(p[k]).toFixed(1)).join(' ');
  const ticks=[lo,(lo+hi)/2,hi].map(v=>`<line class="gl" x1="${L}" x2="${W-Rr}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/><text x="${L-8}" y="${(sy(v)+4).toFixed(1)}" text-anchor="end">${E(Rk(v))}</text>`).join('');
  const zero=lo<0?`<line x1="${L}" x2="${W-Rr}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}" stroke="#d03b3b" stroke-dasharray="5 4"/><text x="${L+4}" y="${(sy(0)-5).toFixed(1)}" style="fill:#d03b3b;font-weight:700">zero</text>`:'';
  const hits=pts.map((p,i)=>{const x0=i===0?sx(0):(sx(i-1)+sx(i))/2,x1=i===pts.length-1?sx(i):(sx(i)+sx(i+1))/2;
    const tip='<b>'+(p.w?'Semana de '+dBR(p.w.inicio):'Hoje')+'</b><br>Saldo contratado '+R$(p.a)+(p.w?'<br>entra '+R$(p.w.entradas)+' · sai '+R$(p.w.saidas):'')+'<br>Com as compras previstas '+R$(p.b);
    return `<rect x="${x0.toFixed(1)}" y="${Tp}" width="${Math.max(1,x1-x0).toFixed(1)}" height="${H-Tp-B}" fill="transparent" data-tip="${E(tip)}"/>`}).join('');
  const dots=(k,cor)=>pts.map((p,i)=>`<circle cx="${sx(i).toFixed(1)}" cy="${sy(p[k]).toFixed(1)}" r="4" fill="${p[k]<0?'#d03b3b':cor}" stroke="var(--card,#fff)" stroke-width="2"/>`).join('');
  const xl=pts.map((p,i)=>i%2===0||i===pts.length-1?`<text x="${sx(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${E(p.lb)}</text>`:'').join('');
  const last=pts[pts.length-1];const ya=sy(last.a),yb=sy(last.b);const sep=Math.abs(ya-yb)<16?(ya<yb?-8:8):0;
  const lab=`<text x="${(sx(pts.length-1)+10).toFixed(1)}" y="${(ya+4-sep).toFixed(1)}" class="v" style="fill:#2a78d6">${E(Rk(last.a))} contratado</text>`+(Math.abs(last.a-last.b)>=0.5?`<text x="${(sx(pts.length-1)+10).toFixed(1)}" y="${(yb+4+sep).toFixed(1)}" class="v">${E(Rk(last.b))} c/ compras</text>`:'');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Saldo de caixa projetado nas próximas 13 semanas">${ticks}${zero}<path d="${path('b')}" fill="none" stroke="var(--rx-sub,#52514e)" stroke-width="2" stroke-dasharray="6 5"/><path d="${path('a')}" fill="none" stroke="#2a78d6" stroke-width="2.5"/>${dots('b','var(--rx-sub,#52514e)')}${dots('a','#2a78d6')}${lab}${xl}${hits}</svg>`}

function barrasSemana(vals,c){ /* compras previstas por semana — gráfico próprio (não divide eixo com o saldo) */
  const W=1000,H=120,L=64,Rr=110,Tp=18,B=24;const n=vals.length;const hi=Math.max(...vals,1)*1.15;const gw=(W-L-Rr)/(n||1),bw=Math.min(40,gw*.55);const sy=v=>Tp+(H-Tp-B)*(1-v/hi);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Compras previstas por semana">${vals.map((v,i)=>{const x=L+gw*i+gw/2;const y=sy(v);const tip='<b>Semana de '+dBR(c.sem[i].inicio)+'</b><br>Compras previstas '+R$(v);
    return (v>0?`<rect x="${(x-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${(sy(0)-y).toFixed(1)}" rx="4" fill="#6250d6"/><text class="v" x="${x.toFixed(1)}" y="${(y-5).toFixed(1)}" text-anchor="middle">${E(Rk(v))}</text>`:'')+`<text x="${x.toFixed(1)}" y="${H-6}" text-anchor="middle">${E(dCurto(c.sem[i].inicio))}</text><rect x="${(L+gw*i).toFixed(1)}" y="${Tp}" width="${gw.toFixed(1)}" height="${H-Tp-B}" fill="transparent" data-tip="${E(tip)}" onclick="V130_open('prev',${i})"/>`}).join('')}<line class="zl" x1="${L}" x2="${W-Rr}" y1="${sy(0)}" y2="${sy(0)}"/></svg>`}

function pilha(segs){ /* barra 100% com rótulos — composição */
  const tot=segs.reduce((a,s)=>a+s.n,0)||1;
  return `<div class="vx-stack" role="img">${segs.filter(s=>s.n).map(s=>`<div style="flex:${s.n};background:${s.cor}" data-tip="${E('<b>'+s.lb+'</b><br>'+N0(s.n)+' unidades'+(s.v!=null?' · '+R$(s.v):'')+'<br><span style=opacity:.7>clique para ver os produtos</span>')}" onclick="${s.on}"><span>${s.n/tot>=0.09?P0(s.n/tot):''}</span></div>`).join('')}</div>
   <div class="lg">${segs.map(s=>`<span style="cursor:pointer" onclick="${s.on}"><i style="background:${s.cor}"></i>${E(s.lb)} · <b>${N0(s.n)}</b>${s.v!=null?' · '+R$(s.v):''}</span>`).join('')}</div>`}

function barrasH(rows,cor){ /* ranking horizontal com rótulo de valor */
  const max=Math.max(...rows.map(r=>r.v),1);
  return `<div class="vx-hb">${rows.map(r=>`<div class="r" onclick="${r.on}" data-tip="${E(r.tip||('<b>'+r.lb+'</b><br>'+R$(r.v)))}"><span class="l">${E(r.lb)}</span><span class="b"><i style="width:${Math.max(2,r.v/max*100).toFixed(1)}%;background:${cor}"></i></span><span class="n">${E(r.vl!=null?r.vl:Rk(r.v))}</span></div>`).join('')}</div>`}

function tipOn(){if(document.getElementById('vd_tip'))return;const t=document.createElement('div');t.id='vd_tip';document.body.appendChild(t);
  document.addEventListener('mousemove',e=>{const el=e.target&&e.target.closest&&e.target.closest('.vd .rx [data-tip]');if(!el){t.style.display='none';return}
    t.innerHTML=el.getAttribute('data-tip');t.style.display='block';const w=t.offsetWidth,h=t.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;t.style.left=x+'px';t.style.top=y+'px'})}

/* ─────────────────────────────── GAVETAS ─────────────────────────────── */
const V=window.V130=window.V130||{dr:null,arg:null,exp:{},on:false};
const rr=()=>{try{renderMain()}catch(e){try{render()}catch(_){}}};
window.V130_open=(k,a)=>{VD.drawer=null;V.dr=k;V.arg=a==null?null:a;V.exp={};rr()};
window.V130_close=()=>{V.dr=null;V.arg=null;rr()};
window.V130_go=h=>{V.dr=null;VD.drawer=null;location.hash=h};
window.V130_tog=k=>{V.exp[k]=!V.exp[k];rr()};
window.V130_sec=id=>{const el=document.getElementById('v130_s_'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})};

const GLOBAIS=/^(venc|entra|sai|prev|est_|transito|cot|compAtr|tar|inter|parc|os|osAtr|atd|pvProp|flx|lugar|devido)/;
const gHead=(t,v,sub)=>`<button class="x" onclick="V130_close()" aria-label="Fechar">×</button><div class="lead">${GLOBAIS.test(V.dr||'')?'Empresa toda · posição de hoje':E(escTxt())+' · '+ymLb(VD.ym)}</div><h3>${t}</h3><div class="big">${v}</div><div class="lead">${sub||''}</div>`;
const conf=(a,b,un)=>Math.abs(r2(a)-r2(b))<0.01?`<div class="note"><span class="ok">✓ a soma das linhas é exatamente o número do cartão</span></div>`:`<div class="note"><span class="bad">A soma das linhas (${un?N0(b):R$(b)}) difere do cartão (${un?N0(a):R$(a)}).</span></div>`;
const abrir=(lb,h)=>`<a class="btnl" href="javascript:void 0" onclick="V130_go('${J(h)}')">${E(lb)} ›</a>`;
const vazio=t=>`<div class="note" style="font-size:14px;padding:14px 0">${t}</div>`;
function tabela(cols,rows,tot){return `<div class="tw"><table class="no-filter"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}${tot||''}</tbody></table></div>`}
const tr=(cells,href,cls)=>`<tr class="${href?'click ':''}${cls||''}"${href?` onclick="V130_go('${J(href)}')"`:''}>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
const trTot=(lb,vals)=>`<tr class="tot"><td>${lb}</td>${vals.map(v=>`<td>${v}</td>`).join('')}</tr>`;

/* produtos agrupados: uma linha por produto, clique para ver as unidades */
function porProduto(us,key,comValor){const g={};us.forEach(u=>{(g[u.produto_id]=g[u.produto_id]||[]).push(u)});
  const rows=Object.entries(g).map(([pid,a])=>({pid,a,v:sum(a,custoU)})).sort((x,y)=>(comValor?y.v-x.v:0)||y.a.length-x.a.length);
  const out=[];rows.forEach(r=>{const k=key+'|'+r.pid;const op=!!V.exp[k];
    out.push(`<tr class="click" onclick="V130_tog('${J(k)}')"><td><b>${op?'▾':'▸'} ${E(nomeProd(r.pid))}</b></td><td>${N0(r.a.length)}</td>${comValor?`<td>${R$(r.v)}</td>`:''}</tr>`);
    if(op)r.a.forEach(u=>{const pr=u.proposta_id?getRow('propostas',u.proposta_id):null;const loc=T(()=>(L.get(u.loc_id)||{}).nome,'')||u.local||'';
      out.push(`<tr class="sub click" onclick="V130_go('#/produto/${J(r.pid)}')"><td>${E(u.serie||u.id)} · ${E(loc)}${pr?' · '+E(propLb(pr)):''}</td><td>${E(u.estado||'')}</td>${comValor?`<td>${R$(custoU(u))}</td>`:''}</tr>`)})});
  return {rows:out,n:us.length,v:sum(us,custoU)}}

function gaveta(k,a){
  const t=hoje();
  /* comercial */
  if(k==='vendMes'||k==='vendAno'){const c=com();const ps=k==='vendAno'?c.ano:(a?((c.porMes.find(x=>x.m===a)||{}).ps||[]):c.mes);const tot=sum(ps,Mtot);
    const ttl=k==='vendAno'?'Vendido no ano até '+ymLb(VD.ym):'Vendido em '+ymLb(a||VD.ym);
    return gHead(ttl,R$(tot),plural(ps.length,'proposta vendida','propostas vendidas')+' · valor da proposta na data da venda')+(ps.length?tabela(['Proposta','Cliente','Unidade','Vendida em','Valor'],ps.slice().sort((x,y)=>String(y.vendida_em).localeCompare(String(x.vendida_em))).map(p=>tr([`<b>${E(propLb(p))}</b>`,E(nomeCli(p)),E(uniP(p)||'—'),dBR(p.vendida_em),R$(Mtot(p))],'#/editor/'+p.id)),trTot('Total',['','','',R$(tot)]))+conf(tot,sum(ps,Mtot)):vazio('Nenhuma venda neste período.'))+abrir('Abrir Comercial › Propostas','#/propostas')}
  if(k==='abertas'){const c=com();return gHead('Propostas em aberto',R$(c.vAb),plural(c.abertas.length,'proposta','propostas')+' ainda não vendidas nem perdidas')+(c.abertas.length?tabela(['Proposta','Cliente','Situação','Valor'],c.abertas.slice().sort((x,y)=>Mtot(y)-Mtot(x)).map(p=>tr([`<b>${E(propLb(p))}</b>`,E(nomeCli(p)),E(({rascunho:'Rascunho',enviada:'Enviada',em_prevendas:'Pré-vendas',aprovada_cliente:'Aprovada pelo cliente'})[p.estado]||p.estado),R$(Mtot(p))],'#/editor/'+p.id)),trTot('Total',['','',R$(c.vAb)])):vazio('Nenhuma proposta em aberto.'))+abrir('Abrir Comercial › Propostas','#/propostas')}
  if(k==='pipe'){const c=com();const ns=c.negs.slice().sort((x,y)=>c.negV(y)*(+y.chance||0)-c.negV(x)*(+x.chance||0));
    return gHead('Expectativa de fechamento',R$(c.pond),'valor de cada oportunidade aberta × a chance que o consultor informou · '+plural(c.negs.length,'oportunidade','oportunidades'))+(ns.length?tabela(['Oportunidade','Consultor','Etapa','Valor','Chance','Esperado'],ns.slice(0,200).map(n=>tr([`<b>${E(n.codinome||n.cliente_nome||n.id)}</b><div class="lead">${E(n.cliente_nome||'')}</div>`,E(n.consultor||'—'),E(n.etapa||''),c.negV(n)?R$(c.negV(n)):'<span class="bad">sem valor</span>',N0(+n.chance||0)+'%',R$(c.negV(n)*(+n.chance||0)/100)],'#/negs')),trTot('Total',['','',R$(c.vNeg),'',R$(c.pond)]))+(ns.length>200?`<div class="note">Mostrando as 200 maiores de ${N0(ns.length)}.</div>`:''):vazio('Nenhuma oportunidade aberta.'))+(c.semValor.length?`<div class="note"><span class="bad">${plural(c.semValor.length,'oportunidade aberta não tem','oportunidades abertas não têm')} valor</span> — entram com R$ 0,00 até o consultor informar.</div>`:'')+(VD.fil?'<div class="note">Oportunidades ainda não têm filial: com uma filial escolhida, aparecem todas.</div>':'')+abrir('Abrir Comercial › Pipeline','#/pipeline')}
  if(k==='consultor'){const c=com();const x=c.cons.find(y=>y.nome===a)||{ps:[],v:0};return gHead('Vendas de '+E(a),R$(x.v),'no ano até '+ymLb(VD.ym)+' · venda com mais de um consultor é dividida em partes iguais')+tabela(['Proposta','Cliente','Vendida em','Parte dele(a)'],x.ps.map(p=>tr([`<b>${E(propLb(p))}</b>`,E(nomeCli(p)),dBR(p.vendida_em),R$(Mtot(p)/((p.consultores||[]).length||1))],'#/editor/'+p.id)),trTot('Total',['','',R$(x.v)]))+abrir('Abrir Relatórios · Comercial','#/rcom')}
  if(k==='comis'){const c=com();return gHead('Comissões e RT geradas',R$(c.vCom),'pelas vendas de '+ymLb(VD.ym)+' · o Financeiro paga conforme a forma de cada uma')+(c.comis.length?tabela(['Proposta','Comissão','RT','Total'],c.comis.map(x=>tr([`<b>${E(propLb(x.p))}</b>`,R$(x.c.com),R$(x.c.rt),R$(x.c.valor)],'#/editor/'+x.p.id)),trTot('Total',[R$(sum(c.comis,x=>x.c.com)),R$(sum(c.comis,x=>x.c.rt)),R$(c.vCom)])):vazio('Nenhuma comissão gerada neste mês.'))+abrir('Abrir Financeiro › Comissões e RT','#/comissoes')}
  /* financeiro */
  if(k==='venc'){const c=cx();return gHead('A receber vencido',R$(c.vVenc),plural(c.venc.length,'título','títulos')+' de '+plural(c.inad.length,'cliente','clientes')+' · cobrar')+(c.inad.length?tabela(['Cliente','Títulos','Mais antigo','Valor'],c.inad.map(x=>tr([`<b>${E(x.nome)}</b>`,N0(x.ls.length),dBR(x.ls.map(l=>l.vencimento).sort()[0]),R$(x.v)],'#/receber/vencidos')),trTot('Total',['','',R$(c.vVenc)]))+conf(c.vVenc,sum(c.inad,x=>x.v)):vazio('Nada vencido.'))+abrir('Abrir A receber › vencidos','#/receber/vencidos')}
  if(k==='entra'){const c=cx();const ls=c.rec13.slice().sort((x,y)=>String(x.vencimento).localeCompare(String(y.vencimento)));return gHead('Entra em 13 semanas',R$(c.ent),'títulos a receber até '+dBR(c.sem.length?c.sem[c.sem.length-1].fim:t)+' (o que já venceu conta na semana 1)')+(ls.length?'':vazio('Nenhum título a receber nas 13 semanas.'))+tabela(['Cliente','Vencimento','Valor'],ls.map(l=>tr([E(c.cliDe(l)),dBR(l.vencimento)+(String(l.vencimento)<t?' <span class="bad">vencido</span>':''),R$(l.valor)],'#/receber/todos')),trTot('Total',['',R$(sum(ls,l=>l.valor))]))+conf(c.ent,sum(ls,l=>l.valor))+abrir('Abrir Financeiro › Fluxo de caixa','#/fluxo')}
  if(k==='sai'){const c=cx();const ls=c.pag13.slice().sort((x,y)=>String(x.vencimento).localeCompare(String(y.vencimento)));const fixos=r2(c.fixoSem*c.sem.length);const tit=sum(ls,l=>l.valor);
    return gHead('Sai em 13 semanas',R$(c.sai),'títulos a pagar + despesas fixas e folha (média semanal) + comissões e RT previstas')+`<table class="no-filter"><tbody><tr class="click" onclick="V130_go('#/pagar/todos')"><td>Títulos a pagar no período</td><td>${R$(tit)}</td></tr><tr><td>Despesas fixas e folha · ${R$(c.fixoSem)} por semana × ${c.sem.length}</td><td>${R$(fixos)}</td></tr><tr><td>Comissões e RT (participações)</td><td>${R$(c.partic)}</td></tr><tr class="tot"><td>Total</td><td>${R$(r2(tit+fixos+c.partic))}</td></tr></tbody></table>`+conf(c.sai,r2(tit+fixos+c.partic))+tabela(['Título','Vencimento','Valor'],ls.map(l=>tr([E(l.categoria||l.origem||'Título')+(l.nf?' · NF '+E(l.nf):''),dBR(l.vencimento),R$(l.valor)],'#/pagar/todos')))+abrir('Abrir Financeiro › Fluxo de caixa','#/fluxo')}
  if(k==='prev'){const e=est();const c=cx();let xs=e.prev;let ttl='Compras previstas nas 13 semanas';let v=e.vPrev;
    if(a!=null&&c.sem[a]){const w=c.sem[a];xs=e.prev.filter(x=>{let i=c.sem.findIndex(s=>x.data>=s.inicio&&x.data<=s.fim);if(i<0&&x.data<=c.sem[0].fim)i=0;return i===+a});ttl='Compras previstas · semana de '+dBR(w.inicio);v=sum(xs,x=>x.v)}
    return gHead(ttl,R$(v),'o que ainda não virou título a pagar: itens vendidos sem compra + cotações para estoque + pedidos sem título')+(xs.length?tabela(['O quê','Para','Quando','Valor'],xs.slice().sort((p,q)=>p.data.localeCompare(q.data)).map(x=>tr([`<b>${E(x.lb)}</b>`,E(x.sub),dBR(x.data),R$(x.v)],x.href)),trTot('Total',['','',R$(sum(xs,x=>x.v))])):vazio('Nada previsto.'))+`<div class="note">Pedido aprovado que já tem título a pagar está no saldo contratado — não entra aqui de novo. Cotação ligada a uma proposta já está dentro de "itens vendidos sem compra".</div>`+abrir('Abrir Estoque › Cotações','#/cotacoes')}
  /* estoque */
  if(k==='est_livre'||k==='est_ped'||k==='est_alo'||k==='est_fora'||k==='est_cons'){const e=est();const m={est_livre:['Estoque livre',e.g.livre,'livre que nenhuma proposta vendida pede — pronto para vender'],est_ped:['Pedido por propostas',e.g.ped,'parte do livre que as propostas vendidas pedem, na ordem da data em que cada obra precisa — nenhuma unidade tem dono até a Separação'],est_alo:['Separado para obras',e.g.alo,'separado, em montagem ou em kit para uma proposta'],est_fora:['Fora de venda',e.g.fora,'showroom, patrimônio, assistência, backup, conferência'],est_cons:['Consignado',e.g.cons,'está aqui, mas não é nosso — não entra no valor']}[k];
    const pp=porProduto(m[1],k,AC.custo()&&k!=='est_cons');return gHead(m[0],AC.custo()&&k!=='est_cons'?R$(pp.v):N0(pp.n)+' un.',N0(pp.n)+' unidades · '+m[2])+(pp.rows.length?tabela(['Produto','Qtd'].concat(AC.custo()&&k!=='est_cons'?['Custo']:[]),pp.rows,trTot('Total',[N0(pp.n)].concat(AC.custo()&&k!=='est_cons'?[R$(pp.v)]:[]))):vazio('Nenhuma unidade.'))+abrir('Abrir Estoque','#/estoque')}
  if(k==='transito'||k==='compAtr'||k==='cot'){const e=est();const ps=k==='transito'?e.transito:k==='cot'?e.cot:e.atras;const ttl={transito:'A chegar (pedidos aprovados)',cot:'Em cotação',compAtr:'Compras atrasadas'}[k];
    return gHead(ttl,AC.custo()?R$(sum(ps,pedValor)):plural(ps.length,'pedido','pedidos'),plural(ps.length,'pedido','pedidos')+' · '+plural(ps.reduce((a,p)=>a+pedQtd(p),0),'item','itens'))+(ps.length?tabela(['Pedido','Fornecedor','Para','Previsão'].concat(AC.custo()?['Valor']:[]),ps.map(p=>{const pr=p.proposta_id?getRow('propostas',p.proposta_id):null;return tr([`<b>${E(p.pc||p.id)}</b>`,E(p.fornecedor||'a cotar'),pr?E(propLb(pr)):'estoque',dBR(p.previsao)+(p.previsao&&p.previsao<t&&k!=='cot'?' <span class="bad">atrasado</span>':'')].concat(AC.custo()?[R$(pedValor(p))]:[]),'#/cotacao/'+p.id)})):vazio('Nenhum pedido.'))+abrir(k==='cot'?'Abrir Estoque › Cotações':'Abrir Estoque › A receber',k==='cot'?'#/cotacoes':'#/areceber')}
  if(k==='nec'){const e=est();const g={};e.nec.forEach(x=>{(g[x.pid]=g[x.pid]||[]).push(x)});
    const rows=[];Object.entries(g).sort((x,y)=>sum(y[1],z=>z.v)-sum(x[1],z=>z.v)).forEach(([pid,xs])=>{const kk='nec|'+pid;const op=!!V.exp[kk];const q=xs.reduce((s,x)=>s+x.q,0);const need=xs.map(x=>x.need).filter(Boolean).sort()[0];
      rows.push(`<tr class="click" onclick="V130_tog('${J(kk)}')"><td><b>${op?'▾':'▸'} ${E(nomeProd(pid))}</b></td><td>${N0(q)}</td><td>${need?dBR(need)+(need<t?' <span class="bad">já passou</span>':''):'sem data'}</td>${AC.custo()?`<td>${R$(sum(xs,x=>x.v))}</td>`:''}</tr>`);
      if(op)xs.forEach(x=>rows.push(`<tr class="sub click" onclick="V130_go('#/ocprop/${J(x.p?x.p.id:'')}')"><td>${x.p?E(propLb(x.p))+' · '+E(nomeCli(x.p)):''}</td><td>${N0(x.q)}</td><td>${dBR(x.need)}</td>${AC.custo()?`<td>${R$(x.v)}</td>`:''}</tr>`))});
    return gHead('Itens vendidos ainda sem compra',N0(e.qNec)+' un.',(AC.custo()?R$(e.vNec)+' ao custo · ':'')+'o livre e os pedidos aprovados não cobrem — por produto, com a data em que a obra precisa')+(rows.length?tabela(['Produto','Falta','Precisa em'].concat(AC.custo()?['Custo']:[]),rows,trTot('Total',[N0(e.qNec),''].concat(AC.custo()?[R$(e.vNec)]:[])))+(e.aComprarMotor!=null?`<div class="note">${e.aComprarMotor===e.qNec?'<span class="ok">✓ o mesmo número do Estoque › Por proposta</span>':'<span class="bad">O Estoque mostra '+N0(e.aComprarMotor)+'</span>'}</div>`:''):vazio('Tudo o que foi vendido está coberto.'))+(e.cotProp.length?`<div class="note">${plural(e.cotProp.length,'cotação já aberta','cotações já abertas')} para esses itens — ainda não aprovadas.</div>`:'')+abrir('Abrir Estoque › Por proposta','#/cep')}
  /* obras */
  if(/^obr_/.test(k)){const o=obr();const key=k.slice(4);const map={ok:['Obras no prazo',o.g.ok],risco:['Obras em risco',o.g.risco],atras:['Obras atrasadas',o.g.atras],sem:['Obras sem data de entrega',o.g.sem],todas:['Obras em andamento',o.at],prox:['Entregas nos próximos 60 dias',o.prox],mat:['Obras com material faltando',o.mat.map(x=>x.o)]};const m=map[key]||map.todas;
    return gHead(m[0],N0(m[1].length),key==='risco'?'entrega em até 14 dias com menos de 70% das etapas prontas':'vendidas e ainda não entregues')+(m[1].length?tabela(['Obra','Entrega prevista','Etapas prontas','Material faltando'],m[1].map(x=>{const pr=o.prog(x);const q=T(()=>Q.porObra(x.id),null);const pv=x.entrega&&x.entrega.prevista;return tr([`<b>${E(x.nome||x.id)}</b><div class="lead">${E(uniO(x)||'')}${x.responsavel?' · '+E(x.responsavel):''}</div>`,pv?dBR(pv)+(pv<t?` <span class="bad">${N0(diasEntre(pv,t))} dias de atraso</span>`:` · em ${N0(diasEntre(t,pv))} dias`):'<span class="bad">sem data</span>',pr==null?'—':P0(pr),q&&q.falta?`<span class="bad">${N0(q.falta)} un.</span>`:'—'],'#/obras/'+x.id)})):vazio('Nenhuma obra.'))+abrir('Abrir Operação › Obras','#/obras')}
  if(k==='prj'){const o=obr();const g=new Map();o.pend.forEach(x=>{if(!g.has(x.o))g.set(x.o,[]);g.get(x.o).push(x.e)});
    return gHead('Projetos pendentes',N0(o.pend.length),'entregáveis de projeto ainda não concluídos, nas obras em andamento')+(g.size?tabela(['Obra','Pendentes','Exemplos'],[...g.entries()].sort((x,y)=>y[1].length-x[1].length).map(([ob,es])=>tr([`<b>${E(ob.nome||ob.id)}</b>`,N0(es.length),E(es.slice(0,3).map(e=>e.nome).join(' · '))],'#/prjobras/'+ob.id)),trTot('Total',[N0(o.pend.length),''])):vazio('Nenhum entregável pendente.'))+abrir('Abrir Projetos','#/prjpainel')}
  /* relacionamento */
  if(k==='tarAtr'||k==='tarProx'||k==='tar'){const r=rel();const xs=(k==='tarAtr'?r.tarAtr:k==='tarProx'?r.tarProx:r.tar).slice().sort((x,y)=>String(x.data_prevista).localeCompare(String(y.data_prevista)));const ttl={tarAtr:'Ações de relacionamento atrasadas',tarProx:'Próximas ações (7 dias)',tar:'Próximas ações em aberto'}[k];
    return gHead(ttl,N0(xs.length),'próximas ações do CRM')+(xs.length?tabela(['Parceiro','Ação','Responsável','Data'],xs.slice(0,200).map(x=>tr([`<b>${E(r.pNome(x.parceiro_id))}</b>`,E(x.sugestao||x.descricao||'').slice(0,80),E(x.responsavel||x.criado_por||'—'),dBR(x.data_prevista)+(x.data_prevista<t?' <span class="bad">atrasada</span>':'')],'#/crmtarefas'))):vazio('Nenhuma ação.'))+abrir('Abrir CRM › Próximas ações','#/crmtarefas')}
  if(k==='inter'){const r=rel();const xs=r.inter.slice().sort((x,y)=>String(y.data).localeCompare(String(x.data)));return gHead('Contatos com parceiros',N0(xs.length),'interações registradas nos últimos 30 dias')+(xs.length?tabela(['Parceiro','Como','Resultado','Quem','Data'],xs.slice(0,200).map(x=>tr([`<b>${E(r.pNome(x.parceiro_id))}</b>`,E(x.tipo_contato||''),E(x.resultado||''),E(x.responsavel||''),dBR(x.data)],'#/crminteracoes'))):vazio('Nenhuma interação nos últimos 30 dias.'))+abrir('Abrir CRM › Interações','#/crminteracoes')}
  if(k==='negP'){const r=rel();const c=com();const xs=r.negPAb;return gHead('Oportunidades vindas de parceiros',N0(xs.length),'abertas, com arquiteto, indicador ou gerenciadora na origem')+(xs.length?tabela(['Oportunidade','Parceiro','Consultor','Valor'],xs.slice(0,200).map(n=>tr([`<b>${E(n.codinome||n.cliente_nome||n.id)}</b>`,E(r.deParc(n)),E(n.consultor||'—'),c.negV(n)?R$(c.negV(n)):'<span class="bad">sem valor</span>'],'#/negs'))):vazio('Nenhuma oportunidade de parceiro aberta.'))+abrir('Abrir CRM › Oportunidades','#/crmoport')}
  if(k==='parc'){const r=rel();const st={};r.parc.forEach(p=>{const s=p.status||'Sem status';st[s]=(st[s]||0)+1});return gHead('Parceiros',N0(r.parc.length),'carteira de arquitetos, indicadores e gerenciadoras')+tabela(['Situação','Parceiros'],Object.entries(st).sort((a,b)=>b[1]-a[1]).map(([s,n])=>tr([E(s),N0(n)],'#/crmparceiros')),trTot('Total',[N0(r.parc.length)]))+abrir('Abrir CRM › Parceiros','#/crmparceiros')}
  /* pós-venda */
  if(k==='os'||k==='osAtr'){const p=pos();const xs=k==='os'?p.os:p.osAtr;return gHead(k==='os'?'Chamados abertos':'Chamados abertos há mais de 7 dias',N0(xs.length),'Pós-venda · solicitações e atendimentos')+(xs.length?tabela(['Chamado','Tipo','Cliente','Aberto há'],xs.map(s=>tr([`<b>${E(s.id)}</b> ${E(s.titulo||'')}`,E(s.tipo||''),E((getRow('clientes',s.cliente_id)||{}).nome||(getRow('obras',s.obra_id)||{}).nome||'—'),N0(Math.max(0,diasEntre(String(s.criado||t).slice(0,10),t)))+' dias'],'#/chamados'))):vazio('Nenhum chamado.'))+abrir('Abrir Pós-venda › Chamados','#/chamados')}
  if(k==='atd'){const p=pos();return gHead('Atendimentos agendados',N0(p.atd.length),'próximos 30 dias')+(p.atd.length?tabela(['Data','Tipo','Proposta','Técnicos'],p.atd.map(x=>{const pr=getRow('propostas',x.proposal_id);return tr([dBR(x.start_date),E(x.tipo||'AT'),pr?E(propLb(pr)):'—',E((x.technicians||[]).map(y=>y.nome||y).join(', '))],'#/posatend')})):vazio('Nenhum atendimento agendado.'))+abrir('Abrir Pós-venda › Atendimentos','#/posatend')}
  if(k==='pvProp'){const p=pos();return gHead('Propostas do Pós-venda a fechar',R$(p.vPv),plural(p.pv.length,'proposta enviada ou aprovada pelo cliente','propostas enviadas ou aprovadas pelo cliente'))+(p.pv.length?tabela(['Proposta','Cliente','Situação','Valor'],p.pv.map(x=>tr([`<b>${E(propLb(x))}</b>`,E(nomeCli(x)),x.estado==='enviada'?'Enviada':'Aprovada pelo cliente',R$(Mtot(x))],'#/editor/'+x.id)),trTot('Total',['','',R$(p.vPv)])):vazio('Nenhuma.'))+abrir('Abrir Pós-venda › Propostas e planos','#/pospropostas')}
  /* conferências */
  if(k==='qual'){const q=qualidade();return gHead('Os números fecham?',q.every(x=>x.st==='ok')?'✓ Sim':'Quase',`conferências calculadas agora, nos registros do sistema — não substituem a validação de cada departamento`)+tabela(['Área','Situação','O que foi conferido'],q.map(x=>tr([`<b>${E(x.lb)}</b>`,x.st==='ok'?'<span class="ok">✓ Fecha</span>':x.st==='pend'?'<span class="warn" style="font-weight:700">! Falta dado</span>':'<span class="bad">✕ Diferença</span>',E(x.txt)],null)))+`<div class="note">Financeiro: as unidades + Administrativo somam a empresa, e caixa de hoje + entradas − saídas = saldo em 13 semanas. Estoque: livre + pedido por propostas + separado + fora de venda + consignado = unidades do Estoque, e o valor bate com o Estoque valorizado. Comercial: toda venda tem unidade, valor e consultor. Obras: toda obra em andamento tem data de entrega.</div>`}
  return ''}

/* ─────────────────────────────── BLOCOS ─────────────────────────────── */
const kp=(lb,v,s,on,cls,id)=>`<div class="card k"${id?` id="${id}"`:''} onclick="${on}" role="button" tabindex="0"><span class="go">Ver detalhes ›</span><div class="lb">${lb}</div><div class="v ${cls||''}">${v}</div><div class="s">${s||''}</div></div>`;
const tile=(lb,v,on,cls,sub)=>`<div class="vx-tile" onclick="${on}" role="button" tabindex="0"><b class="${cls||''}">${v}</b><span>${lb}</span>${sub?`<em>${sub}</em>`:''}</div>`;
const secHead=(n,t,q,link)=>`<div class="vx-sh"><div><div class="vx-n">${n}</div><h2>${t}</h2><div class="q">${q}</div></div>${link?`<a class="vx-lk" href="javascript:void 0" onclick="V130_go('${J(link[1])}')">${E(link[0])} ›</a>`:''}</div>`;

function barra(){
  const ms=MESES();const cur=ymOf(hoje());
  const per=`<select class="per" aria-label="Período" onchange="VD.ym=this.value;VD.drawer=null;V130.dr=null;window.VD_R?VD_R():V130_close()">${ms.map(m=>`<option value="${m}" ${m===VD.ym?'selected':''}>${ymLb(m)}${m===cur?' · este mês':''}</option>`).join('')}</select>`;
  const sel=(k,v)=>`VD.${k}='${J(v)}';VD.drawer=null;V130.dr=null;window.VD_R?VD_R():V130_close()`;
  const us=[['','Empresa']].concat(UNIS().map(u=>[u,uniLb(u)]));
  const fs=[['','Todas as filiais']].concat(FILS().map(f=>[f,f])).concat([[ADM(),'Sem obra (Adm.)']]);
  return `<div class="bar">${per}<div class="seg" role="group" aria-label="Unidade">${us.map(([k,l])=>`<button class="${VD.uni===k?'on':''}" onclick="${sel('uni',k)}">${E(l)}</button>`).join('')}</div><div class="seg" role="group" aria-label="Filial">${fs.map(([k,l])=>`<button class="${VD.fil===k?'on':''}" onclick="${sel('fil',k)}">${E(l)}</button>`).join('')}</div></div>`}

function blocoQual(){const q=qualidade();if(!q.length)return '';
  return `<div class="vx-qual" onclick="V130_open('qual')" role="button" title="Clique para ver o que foi conferido"><b>Os números fecham?</b>${q.map(x=>`<span class="vx-q ${x.st}"><i>${x.st==='ok'?'✓':x.st==='pend'?'!':'✕'}</i>${E(x.lb)}<em>${E(x.st==='ok'?'fecha':x.st==='pend'?'falta dado':'diferença')}</em></span>`).join('')}</div>`}

/* 01 · visão geral — os seis números da Visão CEO + o que está acontecendo agora */
function s01(P){if(!P||!P.k6)return '';
  return `<section class="sec vx-s" id="v130_s_geral">${secHead('01','Visão geral','A saúde da empresa em seis números — cada um abre os registros que o somam.')}${P.k6}${P.oper?`<div class="vx-sub">O que está acontecendo agora</div>${P.oper}`:''}</section>`}

/* 02 · saúde financeira */
function s02(P){if(!AC.fin())return '';const c=cx();const e=est();if(!c)return '';
  const ponte=r2(c.c0+c.ent-c.sai);const fecha=c.sem.length&&Math.abs(ponte-c.fim)<0.01;
  const cenFim=c.cen.length?c.cen[c.cen.length-1]:c.c0;
  const msg=!c.c0&&!c.ent&&!c.sai&&!e.vPrev?'<span class="pill p-b">sem movimentos ainda</span>':c.negI>=0?`<span class="pill p-r">⚠ fica negativo na semana de ${dCurto(c.sem[c.negI].inicio)}</span>`:c.negC>=0?`<span class="pill p-a">! com as compras previstas, fica negativo na semana de ${dCurto(c.sem[c.negC].inicio)}</span>`:`<span class="pill p-g">✓ positivo nas 13 semanas, mesmo comprando o previsto</span>`;
  const tiles=`<div class="vx-tiles c3">${tile('Caixa hoje',R$(c.c0),EXEC()?"VD_open('caixa')":"V130_go('#/fincontas')",c.c0<0?'neg':'')}${tile('Entra em 13 semanas',R$(c.ent),"V130_open('entra')",'pos')}${tile('Sai em 13 semanas',R$(-c.sai),"V130_open('sai')",'neg')}${tile('Saldo em 13 semanas',R$(c.fim),"V130_go('#/fluxo')",c.fim<0?'neg':'')}${tile('Compras previstas',R$(-e.vPrev),"V130_open('prev')",e.vPrev?'warn':'','ainda sem título a pagar')}${tile('A receber vencido',R$(c.vVenc),"V130_open('venc')",c.vVenc?'neg':'',plural(c.inad.length,'cliente inadimplente','clientes inadimplentes'))}</div>`;
  return `<section class="sec vx-s" id="v130_s_fin">${secHead('02','Saúde financeira','Conseguimos pagar o que vem pela frente — incluindo o que ainda falta comprar? Caixa da empresa toda, semana a semana.',['Fluxo de caixa','#/fluxo'])}
   <div class="rx"><div class="card wide">${tiles}
    <h3>Caixa nas próximas 13 semanas ${msg}</h3><div class="pt"><b style="color:#2a78d6">━ Contratado</b>: hoje + títulos a receber − títulos a pagar − fixos, folha, comissões e RT. <b>╌ Com as compras previstas</b>: o mesmo, menos o que ainda vai virar compra (itens vendidos sem compra, cotações para estoque). Clique no gráfico para abrir o Fluxo de caixa.</div>
    ${!c.c0&&!c.ent&&!c.sai&&!e.vPrev?'<div class="vazio">Ainda não há caixa, títulos nem compras para projetar — o gráfico aparece com o primeiro lançamento.</div>':`<div onclick="V130_go('#/fluxo')" style="cursor:pointer">${linhasCaixa(c)}</div>
    <div class="pt" style="margin:6px 0 2px"><b>Compras previstas por semana</b> — clique numa barra para ver o que é</div>${barrasSemana(c.prevS,c)}`}
    <div class="vx-ponte">Ponte: ${R$(c.c0)} + ${R$(c.ent)} − ${R$(c.sai)} = <b>${R$(ponte)}</b> ${fecha?'<span class="ok">✓ confere com o saldo em 13 semanas</span>':'<span class="bad">não confere</span>'} · menos compras previstas ${R$(e.vPrev)} = <b>${R$(cenFim)}</b> no cenário</div>
   </div></div>
   ${P&&P.raiox?P.raiox:''}${P&&P.unid?P.unid:''}</section>`}

/* 03 · comercial e metas */
function s03(){if(!AC.com())return '';const c=com();if(!c)return '';const cor=VD.uni?'var(--u-'+({'TAAG':'taag','Acústica':'acu','Focal':'foc','Pós-venda':'pos'}[VD.uni]||'taag')+')':'#2a78d6';
  const pM=c.mMes>0?c.vMes/c.mMes:null,pA=c.mYtd>0?c.vAno/c.mYtd:null;const falta=Math.max(0,r2(c.mYtd-c.vAno));
  const metaTxt=VD.fil?'a meta não é dividida por filial':c.mAno>0?'meta do ano '+R$(c.mAno)+(VD.uni?' ('+uniLb(VD.uni)+')':' · soma das metas das unidades'):'<span class="bad">sem meta cadastrada</span>';
  const anel=(p,lb)=>{const pc=Math.max(0,Math.min(1,p||0));const R=40,L=2*Math.PI*R;return `<svg viewBox="0 0 100 100" class="vx-ring" role="img" aria-label="${E(lb)}"><circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--rx-grid,#e9e8e4)" stroke-width="10"/><circle cx="50" cy="50" r="${R}" fill="none" stroke="${p>=1?'#0ca30c':cor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(L*pc).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="55" text-anchor="middle" class="v" style="font-size:20px">${p==null?'—':P0(p)}</text></svg>`};
  const top=c.cons.slice(0,8).map(x=>({lb:x.nome,v:x.v,on:`V130_open('consultor','${J(x.nome)}')`,tip:'<b>'+E(x.nome)+'</b><br>'+R$(x.v)+'<br>'+plural(x.n,'venda','vendas')}));
  return `<section class="sec vx-s" id="v130_s_com">${secHead('03','Comercial e metas','Estamos no caminho da meta? Vendido = valor das propostas na data da venda (a receita entra conforme a obra avança).',['Pipeline','#/pipeline'])}
   <div class="rx">
    <div class="card"><h3>Meta × realizado</h3><div class="pt">${metaTxt}</div>
     <div class="vx-meta"><div onclick="V130_open('vendMes')" role="button">${anel(pM,'meta do mês')}<b>${R$(c.vMes)}</b><span>vendido em ${ymLb(VD.ym)}${c.mMes>0?' · meta '+R$(c.mMes):''}</span></div>
     <div onclick="V130_open('vendAno')" role="button">${anel(pA,'meta do ano até agora')}<b>${R$(c.vAno)}</b><span>no ano até ${ymLb(VD.ym)}${c.mYtd>0?' · meta '+R$(c.mYtd):''}</span></div></div>
     ${c.mYtd>0?`<div class="vx-ponte">${falta>0?`Faltam <b>${R$(falta)}</b> para a meta acumulada (${R$(c.mYtd)} − ${R$(c.vAno)})`:`<span class="ok">✓ meta acumulada atingida</span> — ${R$(r2(c.vAno-c.mYtd))} acima`}</div>`:''}</div>
    <div class="card"><h3>Funil</h3><div class="pt">O que pode virar venda.</div><div class="vx-tiles c2">
     ${tile('Propostas em aberto',R$(c.vAb),"V130_open('abertas')",'',plural(c.abertas.length,'proposta','propostas'))}
     ${tile('Expectativa de fechamento',R$(c.pond),"V130_open('pipe')",'','valor × chance · '+plural(c.negs.length,'oportunidade','oportunidades'))}
     ${tile('Propostas fechadas no ano',N0(c.ano.length),"V130_open('vendAno')",'',R$(c.vAno))}
     ${tile('Comissões e RT do mês',R$(c.vCom),"V130_open('comis')",'',plural(c.comis.length,'venda','vendas'))}</div></div>
    <div class="card wide"><h3>Vendido por mês · ${c.y}</h3><div class="pt">Barras = vendido no mês${c.mMes>0?'; tracejado = meta do mês ('+R$(c.mMes)+'); ✓ = meta atingida':''}. Clique num mês para ver as vendas.</div>${barrasMeta(c.porMes,c.mMes,cor,VD.ym)}</div>
    <div class="card wide"><h3>Vendas por consultor · ${c.y}</h3><div class="pt">No ano até ${ymLb(VD.ym)}. Clique para ver as vendas de cada um.</div>${top.length?barrasH(top,cor):'<div class="vazio">Nenhuma venda no ano ainda.</div>'}</div>
   </div></section>`}

/* 04 · estoque e compras */
function s04(){if(!AC.est())return '';const e=est();if(!e)return '';const cus=AC.custo();
  const segs=[{lb:'Livre',n:e.g.livre.length,v:cus?e.vl.livre:null,cor:'#008300',on:"V130_open('est_livre')"},{lb:'Pedido por propostas',n:e.g.ped.length,v:cus?e.vl.ped:null,cor:'#6250d6',on:"V130_open('est_ped')"},{lb:'Separado para obras (inclui montagem e kit)',n:e.g.alo.length,v:cus?e.vl.alo:null,cor:'#e87ba4',on:"V130_open('est_alo')"},{lb:'Fora de venda',n:e.g.fora.length,v:cus?e.vl.fora:null,cor:'#a3a29c',on:"V130_open('est_fora')"},{lb:'Consignado (não é nosso)',n:e.g.cons.length,v:null,cor:'repeating-linear-gradient(45deg,#a3a29c 0 4px,#d6d5cf 4px 8px)',on:"V130_open('est_cons')"}];
  const nU=e.g.livre.length+e.g.ped.length+e.g.alo.length+e.g.fora.length+e.g.cons.length;const vU=r2(e.vl.livre+e.vl.ped+e.vl.alo+e.vl.fora);
  return `<section class="sec vx-s" id="v130_s_est">${secHead('04','Estoque e compras','O que já temos, o que está guardado para quem comprou, o que está chegando e o que ainda falta comprar.',['Estoque','#/epainel'])}
   <div class="rx"><div class="card wide"><h3>O estoque hoje · ${N0(nU)} unidades${cus?' · '+R$(vU):''}</h3><div class="pt">"Pedido por propostas" é calculado: cada proposta vendida pede do livre, na ordem da data em que a obra precisa — nenhuma unidade tem dono até a Separação. Estoque da empresa toda.</div>${pilha(segs)}
    <div class="vx-ponte">Ponte: ${N0(e.g.livre.length)} livre + ${N0(e.g.ped.length)} pedido por propostas + ${N0(e.g.alo.length)} separado + ${N0(e.g.fora.length)} fora de venda + ${N0(e.g.cons.length)} consignado = <b>${N0(nU)}</b> ${nU===e.canon.total?'<span class="ok">✓ as unidades do Estoque</span>':'<span class="bad">≠ '+N0(e.canon.total)+' no Estoque</span>'}${cus?` · valor ${R$(e.vl.livre)} + ${R$(e.vl.ped)} + ${R$(e.vl.alo)} + ${R$(e.vl.fora)} = <b>${R$(vU)}</b> ${Math.abs(vU-e.canon.custo)<0.01?'<span class="ok">✓ o Estoque valorizado</span>':'<span class="bad">≠ '+R$(e.canon.custo)+'</span>'}`:''}</div></div>
    <div class="card wide"><h3>Compras</h3><div class="pt">Do que falta ao que já está a caminho.</div><div class="vx-tiles">
     ${tile('Itens vendidos sem compra',N0(e.qNec)+' un.',"V130_open('nec')",e.qNec?'neg':'',cus?R$(e.vNec)+' ao custo':'livre e pedidos não cobrem')}
     ${tile('Em cotação',plural(e.cot.length,'pedido','pedidos'),"V130_open('cot')",'',cus?R$(sum(e.cot,pedValor)):'')}
     ${tile('A chegar',plural(e.transito.length,'pedido','pedidos'),"V130_open('transito')",'',plural(e.transito.reduce((a,p)=>a+pedQtd(p),0),'item','itens')+(cus?' · '+R$(sum(e.transito,pedValor)):''))}
     ${tile('Compras atrasadas',N0(e.atras.length),"V130_open('compAtr')",e.atras.length?'neg':'','previsão de chegada vencida')}
     ${AC.fin()?tile('Compra prevista · 13 semanas',R$(e.vPrev),"V130_open('prev')",'','ainda sem título a pagar'):''}</div></div>
   </div></section>`}

/* 05 · projetos e obras */
function s05(){if(!AC.obr())return '';const o=obr();if(!o)return '';
  const segs=[{lb:'No prazo',v:o.g.ok.length,cor:ST.ok,on:"V130_open('obr_ok')"},{lb:'Em risco',v:o.g.risco.length,cor:ST.risco,on:"V130_open('obr_risco')"},{lb:'Atrasadas',v:o.g.atras.length,cor:ST.atras,on:"V130_open('obr_atras')"},{lb:'Sem data de entrega',v:o.g.sem.length,cor:ST.sem,on:"V130_open('obr_sem')"}];
  const ic={ok:'✓',risco:'!',atras:'⚠',sem:'?'};
  const tl=o.prox.slice(0,8).map(x=>{const pr=o.prog(x);const d=diasEntre(hoje(),x.entrega.prevista);const cl=o.cls(x);return `<div class="vx-tl" onclick="V130_go('#/obras/${J(x.id)}')" role="button"><span class="d">${dCurto(x.entrega.prevista)}<em>em ${N0(d)} d</em></span><span class="nm">${E(x.nome||x.id)}<em>${E(uniO(x)||'')}</em></span><span class="pg"><i style="width:${pr==null?0:(pr*100).toFixed(0)}%;background:${ST[cl]}"></i></span><span class="pc">${pr==null?'—':P0(pr)} <em>${ic[cl]}</em></span></div>`}).join('');
  return `<section class="sec vx-s" id="v130_s_obr">${secHead('05','Projetos e obras','Estamos entregando no prazo? Obras vendidas e ainda não entregues.',['Operação','#/copainel'])}
   <div class="rx"><div class="card"><h3>Situação das obras</h3><div class="pt">Clique numa fatia para ver as obras.</div><div class="vx-donut">${donut(segs,N0(o.at.length),'em andamento')}<div class="lg" style="flex-direction:column;gap:8px">${segs.map(s=>`<span style="cursor:pointer" onclick="${s.on}"><i style="background:${s.cor}"></i>${ic[{'No prazo':'ok','Em risco':'risco','Atrasadas':'atras','Sem data de entrega':'sem'}[s.lb]]} ${E(s.lb)} · <b>${N0(s.v)}</b></span>`).join('')}</div></div>
     <div class="vx-ponte">${N0(o.g.ok.length)} + ${N0(o.g.risco.length)} + ${N0(o.g.atras.length)} + ${N0(o.g.sem.length)} = <b>${N0(o.at.length)}</b> obras em andamento <span class="ok">✓</span></div></div>
    <div class="card"><h3>Entregas nos próximos 60 dias</h3><div class="pt">Barra = etapas prontas. Clique para abrir a obra.</div>${tl||'<div class="vazio">Nenhuma entrega marcada nos próximos 60 dias.</div>'}${o.prox.length>8?`<a class="btnl" href="javascript:void 0" onclick="V130_open('obr_prox')">Ver as ${N0(o.prox.length)} ›</a>`:''}</div>
    <div class="card wide"><div class="vx-tiles">
     ${tile('Obras em andamento',N0(o.at.length),"V130_open('obr_todas')")}
     ${tile('Obras atrasadas',N0(o.g.atras.length),"V130_open('obr_atras')",o.g.atras.length?'neg':'')}
     ${tile('Entregas em 60 dias',N0(o.prox.length),"V130_open('obr_prox')")}
     ${tile('Projetos pendentes',N0(o.pend.length),"V130_open('prj')",'',plural(o.obrasPrj.length,'obra','obras')+' com entregável aberto')}
     ${(()=>{const qm=o.mat.reduce((a,x)=>a+x.q.falta,0);const e=AC.est()?est():null;const resto=e?e.qNec-qm:0;return tile('Obras com material faltando',N0(o.mat.length),"V130_open('obr_mat')",o.mat.length?'warn':'',plural(qm,'unidade','unidades')+' a comprar'+(e&&resto>0?' · das '+N0(e.qNec)+' sem compra; '+N0(resto)+' em propostas fora das obras em andamento':''))})()}</div></div>
   </div></section>`}

/* 06 · resumo dos departamentos */
function s06(){
  const cards=[];const L_=(lb,v,on,cls)=>`<div class="vx-dl" onclick="event.stopPropagation();${on}" role="button"><span>${lb}</span><b class="${cls||''}">${v}</b></div>`;
  const card=(ic,nome,cor,linhas,href,lb)=>`<div class="card vx-dep" style="--dc:${cor}"><div class="vx-dh"><i class="bi ${ic}"></i><b>${nome}</b></div>${linhas.join('')}<a class="vx-dlink" href="javascript:void 0" onclick="V130_go('${J(href)}')">${E(lb||'Ver relatório')} ›</a></div>`;
  if(AC.com()){const c=com();cards.push(card('bi-briefcase','Comercial','#2a78d6',[L_('Meta do mês',c.mMes>0?P0(c.vMes/c.mMes):'—',"V130_open('vendMes')"),L_('Vendido em '+ymLb(VD.ym),R$(c.vMes),"V130_open('vendMes')"),L_('Propostas em aberto',N0(c.abertas.length),"V130_open('abertas')")],'#/hoje'))}
  if(AC.fin()){const x=cx();cards.push(card('bi-wallet2','Financeiro','#0f766e',[L_('Caixa hoje',R$(x.c0),EXEC()?"VD_open('caixa')":"V130_go('#/fincontas')"),L_('A receber vencido',R$(x.vVenc),"V130_open('venc')",x.vVenc?'neg':''),L_('Menor saldo em 13 semanas',x.menor?R$(x.menor.saldoFinal):'—',"V130_go('#/fluxo')",x.menor&&x.menor.saldoFinal<0?'neg':'')],'#/fhoje'))}
  if(AC.est()){const e=est();cards.push(card('bi-box-seam','Estoque','#008300',[L_('Livre',N0(e.g.livre.length)+' un.',"V130_open('est_livre')"),L_('Pedido por propostas',N0(e.g.ped.length)+' un.',"V130_open('est_ped')"),L_('Falta comprar',N0(e.qNec)+' un.',"V130_open('nec')",e.qNec?'neg':'')],'#/epainel'));
    cards.push(card('bi-cart3','Compras','#6250d6',[L_('Em cotação',N0(e.cot.length),"V130_open('cot')"),L_('A chegar',N0(e.transito.length),"V130_open('transito')"),L_('Atrasadas',N0(e.atras.length),"V130_open('compAtr')",e.atras.length?'neg':'')],'#/cotacoes','Ver cotações'))}
  if(AC.obr()){const o=obr();cards.push(card('bi-pencil-square','Projetos','#b45309',[L_('Entregáveis pendentes',N0(o.pend.length),"V130_open('prj')"),L_('Obras com projeto aberto',N0(o.obrasPrj.length),"V130_open('prj')"),L_('Sem data de entrega',N0(o.g.sem.length),"V130_open('obr_sem')",o.g.sem.length?'warn':'')],'#/prjpainel'));
    cards.push(card('bi-tools','Operação','#475569',[L_('Obras em andamento',N0(o.at.length),"V130_open('obr_todas')"),L_('Atrasadas',N0(o.g.atras.length),"V130_open('obr_atras')",o.g.atras.length?'neg':''),L_('Entregas em 60 dias',N0(o.prox.length),"V130_open('obr_prox')")],'#/copainel'))}
  if(AC.rel()){const r=rel();cards.push(card('bi-people','Relacionamento','#be185d',[L_('Contatos em 30 dias',N0(r.inter.length),"V130_open('inter')"),L_('Ações atrasadas',N0(r.tarAtr.length),"V130_open('tarAtr')",r.tarAtr.length?'neg':''),L_('Oportunidades de parceiros',N0(r.negPAb.length),"V130_open('negP')")],'#/crmhome'))}
  if(AC.pos()){const p=pos();cards.push(card('bi-headset','Pós-venda','#ca8a04',[L_('Chamados abertos',N0(p.os.length),"V130_open('os')"),L_('Atendimentos em 30 dias',N0(p.atd.length),"V130_open('atd')"),L_('Propostas a fechar',N0(p.pv.length),"V130_open('pvProp')")],'#/posvisao'))}
  if(!cards.length)return '';
  return `<section class="sec vx-s" id="v130_s_dep">${secHead('06','Resumo dos departamentos','Cada departamento em três números — clique num número para ver a lista, ou em "Ver relatório" para entrar no departamento.')}<div class="vx-deps">${cards.join('')}</div></section>`}

/* 07 · relacionamento e pós-venda */
function s07(){const okR=AC.rel(),okP=AC.pos();if(!okR&&!okP)return '';
  let h='';
  if(okR){const r=rel();h+=`<div class="card"><h3>Relacionamento com parceiros</h3><div class="pt">Arquitetos, indicadores e gerenciadoras — de onde vêm as obras.</div><div class="vx-tiles c2">
    ${tile('Parceiros na carteira',N0(r.parc.length),"V130_open('parc')",'',N0(r.ativos.length)+' ativos')}
    ${tile('Contatos em 30 dias',N0(r.inter.length),"V130_open('inter')")}
    ${tile('Próximas ações (7 dias)',N0(r.tarProx.length),"V130_open('tarProx')",'',plural(r.tar.length,'ação em aberto','ações em aberto'))}
    ${tile('Ações atrasadas',N0(r.tarAtr.length),"V130_open('tarAtr')",r.tarAtr.length?'neg':'')}
    ${tile('Oportunidades de parceiros',N0(r.negPAb.length),"V130_open('negP')",'','abertas · '+plural(r.negPFech.length,'fechada','fechadas')+' em '+VD.ym.slice(0,4))}</div></div>`}
  if(okP){const p=pos();h+=`<div class="card"><h3>Pós-venda</h3><div class="pt">Chamados, atendimentos e propostas de serviço.</div><div class="vx-tiles c2">
    ${tile('Chamados abertos',N0(p.os.length),"V130_open('os')")}
    ${tile('Abertos há mais de 7 dias',N0(p.osAtr.length),"V130_open('osAtr')",p.osAtr.length?'neg':'')}
    ${tile('Atendimentos em 30 dias',N0(p.atd.length),"V130_open('atd')")}
    ${tile('Propostas a fechar',R$(p.vPv),"V130_open('pvProp')",'',plural(p.pv.length,'proposta','propostas'))}</div></div>`}
  return `<section class="sec vx-s" id="v130_s_rel">${secHead('07','Relacionamento e pós-venda','Quem traz as obras e quem cuida do cliente depois da entrega.')}<div class="rx">${h}</div></section>`}

/* 08 · alertas e pendências */
function s08(P){const a=alertas();const fila=P&&P.fila?P.fila:'';
  const sv={3:['p-r','⚠ Urgente'],2:['p-a','! Atenção'],1:['p-b','• Acompanhar']};
  const rows=a.map(x=>`<div class="vx-al" onclick="${x.vd?`VD_open('${x.vd}')`:x.href?`V130_go('${J(x.href)}')`:`V130_open('${x.k}')`}" role="button"><span class="pill ${sv[x.sev][0]}">${sv[x.sev][1]}</span><b class="n">${N0(x.n)}</b><span class="t"><b>${E(x.lb)}</b><em>${x.sub}</em></span><span class="go">›</span></div>`).join('');
  return `<section class="sec vx-s" id="v130_s_ale">${secHead('08','Alertas e pendências','O que pede alguém agora — o mais urgente primeiro.')}<div class="card" style="border-radius:18px;padding:6px 6px">${rows||'<div class="vazio" style="padding:18px">✓ Nada pedindo atenção agora.</div>'}</div>${fila}</section>`}

/* ═══════════════ OS 4 BLOCOS DO INÍCIO (Bruno, 30/10 22h): só isto ao rolar — nada mais, nada menos ═══════════════
   1 · Fluxo de caixa: dia a dia nos próximos 30 dias, depois semana a semana até 13 semanas (contas a pagar × a receber)
   2 · Lucro por pedido de venda (vendidos no mês escolhido):
       Venda − impostos − custo do produto − comissão/RT − despesas da obra − garantia = lucro (R$)
   3 · Estoque em unidades e R$ (ao custo), o que ainda devemos aos clientes (unid. e R$ ao custo) e cada lugar
   4 · Lucro por linha (TAAG, Acústica, Focal, Pós-venda): resultado da linha menos os gastos diretos dela;
       gastos compartilhados (Administrativo, aluguel…) ficam só no total da empresa                                   */

/* 1 · fluxo de caixa — a mesma receita do FN.semanas13, em dias: título no dia do vencimento (vencido cai no dia 1),
   fixos e folha divididos por dia, comissões/RT da semana divididas pelos 7 dias. Dia 31 em diante: semanas. */
function fluxo(){return C('flx',()=>{
  const sem=T(()=>FN.semanas13(),[])||[];const c0=T(()=>+FS.caixa(),0)||0;const t=hoje();
  const fixoDia=r2(T(()=>FN.fixosMes(),0)*12/365);const nD=sem.length*7||91;
  const rec=(S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&!l.pago_em);
  const pag=(S.db.lancamentos||[]).filter(l=>l.tipo==='pagar'&&!l.pago_em&&!['fixo','folha'].includes(l.origem));
  const fixoSem=T(()=>FN.fixosMes(),0)*12/52;
  const dias=[];for(let d=0;d<nD;d++){const dt=addDias(t,d);const w=sem[Math.floor(d/7)]||{};const dentro=l=>{const v=String(l.vencimento||'');return d===0?v<=dt:v===dt};
    const ls=rec.filter(dentro),ps=pag.filter(dentro);const fx=r2(fixoSem/7),pt=r2((+w.participacoes||0)/7);
    dias.push({d,dt,rec:ls,pag:ps,ent:sum(ls,l=>l.valor),pagV:sum(ps,l=>l.valor),fixo:fx,part:pt})}
  /* cada semana fecha ao centavo com o FN.semanas13: a diferença de arredondamento fica nos fixos do último dia */
  sem.forEach((w,i)=>{const xs=dias.slice(i*7,i*7+7);if(!xs.length)return;const s0=sum(xs,x=>r2(x.pagV+x.fixo+x.part));const dif=r2((+w.saidas||0)-s0);xs[xs.length-1].fixo=r2(xs[xs.length-1].fixo+dif)});
  dias.forEach(x=>{x.sai=r2(x.pagV+x.fixo+x.part)});
  let s=c0;dias.forEach(x=>{s=r2(s+x.ent-x.sai);x.saldo=s});
  const linhas=[];dias.slice(0,30).forEach(x=>linhas.push({lb:dBR(x.dt),curto:dCurto(x.dt),ini:x.dt,fim:x.dt,xs:[x],ent:x.ent,sai:x.sai,saldo:x.saldo,dia:true}));
  for(let i=30;i<dias.length;i+=7){const xs=dias.slice(i,Math.min(i+7,dias.length));const a=xs[0],b=xs[xs.length-1];linhas.push({lb:dCurto(a.dt)+' a '+dCurto(b.dt),curto:dCurto(a.dt),ini:a.dt,fim:b.dt,xs,ent:sum(xs,x=>x.ent),sai:sum(xs,x=>x.sai),saldo:b.saldo,dia:false})}
  const fim=dias.length?dias[dias.length-1].saldo:c0;const fimSem=sem.length?r2(sem[sem.length-1].saldoFinal):c0;
  const d30=dias.slice(0,30);const menor=linhas.reduce((a,x)=>x.saldo<a.saldo?x:a,linhas[0]||{saldo:c0});
  return {c0,dias,linhas,fim,fimSem,ent30:sum(d30,x=>x.ent),sai30:sum(d30,x=>x.sai),s30:d30.length?d30[d30.length-1].saldo:c0,menor,neg:linhas.find(x=>x.saldo<0)}})}

/* 2 · lucro por pedido — os números do motor da obra (FX1/FN.obra, os mesmos do Resultado por obra) */
function pedidos(){return C('ped',()=>{
  const P=(S.db.propostas||[]).filter(p=>VEND.includes(p.estado)&&ymOf(p.vendida_em)===VD.ym);
  const out=[];const obras={};
  P.forEach(p=>{const o=p.obra_id?getRow('obras',p.obra_id):null;
    if(o){if(!obras[o.id]){const r=T(()=>FN.obra(o),null);const xs=r&&r.porProposta||[];const g=T(()=>FPV.garantiaDaObra(o.id),{novo:0,total:0});obras[o.id]={r,xs,vT:sum(xs,x=>x.v),g}}
      const ob=obras[o.id];const x=(ob.xs||[]).find(y=>y.p&&y.p.id===p.id);if(!x||!ob.r){out.push({p,o,falta:true,venda:Mtot(p)});return}
      const sh=ob.vT>0?x.v/ob.vT:1;const so=ob.xs.length===1;
      const prod=so?ob.r.equipProj:Math.max(x.equipC,x.equipR);
      const mo=so?ob.r.moProj:Math.max(x.moC,x.moR);
      const extras=r2((+ob.r.extrasR||0)*sh);
      const gar=r2((+(ob.g.novo!=null?ob.g.novo:ob.g.total)||0)*sh);
      const L={p,o,venda:r2(x.v),imp:r2(x.imp),prod:r2(prod),com:r2((+x.com||0)+(+x.rt||0)),obra:r2(mo+(+x.frete||0)+extras),gar,mo:r2(mo),frete:r2(x.frete),extras,comV:r2(x.com),rtV:r2(x.rt),av:x.av};
      L.lucro=r2(L.venda-L.imp-L.prod-L.com-L.obra-L.gar);L.marg=L.venda?L.lucro/L.venda:0;out.push(L);return}
    const pl=T(()=>FN.propPlano(p),null);if(!pl){out.push({p,o:null,falta:true,venda:Mtot(p)});return}
    const L={p,o:null,venda:r2(pl.tot),imp:r2(pl.imp),prod:r2(pl.equipC),com:r2((+pl.com||0)+(+pl.rt||0)),obra:r2((+pl.moC||0)+(+pl.frete||0)),gar:0,mo:r2(pl.moC),frete:r2(pl.frete),extras:0,comV:r2(pl.com),rtV:r2(pl.rt),av:null};
    L.lucro=r2(L.venda-L.imp-L.prod-L.com-L.obra-L.gar);L.marg=L.venda?L.lucro/L.venda:0;out.push(L)});
  const ok=out.filter(x=>!x.falta);out.sort((a,b)=>(b.lucro||0)-(a.lucro||0));
  const tot={};['venda','imp','prod','com','obra','gar','lucro'].forEach(k=>tot[k]=sum(ok,x=>x[k]));tot.marg=tot.venda?tot.lucro/tot.venda:0;
  return {rows:out,ok,tot}})}

/* 3 · estoque, o que devemos aos clientes e cada lugar */
function estoq(){return C('estq',()=>{
  const us=T(()=>nodeUnits(null),null)||[];const canon=T(()=>FX2.estoqueCanon(),null)||{total:us.length,nossas:us.length,custo:sum(us,custoU)};
  const lugarDe=u=>{const p=T(()=>L.path(u.loc_id),[])||[];const n=p.map(x=>x&&x.nome).filter(Boolean);return n.length>1?n[1]:(n[0]||'Sem lugar')};
  const terrDe=u=>{const p=T(()=>L.path(u.loc_id),[])||[];return (p[0]&&p[0].nome)||''};
  const g={};us.forEach(u=>{const k=lugarDe(u);(g[k]=g[k]||{nome:k,terr:terrDe(u),us:[],nossas:[],cons:[]});g[k].us.push(u);(u.natureza==='consignado'?g[k].cons:g[k].nossas).push(u)});
  const lugares=Object.values(g).map(x=>Object.assign(x,{v:sum(x.nossas,custoU)})).sort((a,b)=>b.v-a.v||b.us.length-a.us.length);
  const rows=(T(()=>Q.compute().rows,[])||[]).filter(r=>(r.qtd-r.ent)>0);
  const cu=pid=>+((getRow('produtos',pid)||{}).custo)||0;
  const dev=rows.map(r=>({r,p:getRow('propostas',r.pr),q:r.qtd-r.ent,v:r2((r.qtd-r.ent)*cu(r.pid)),sep:r.alo,est:r.rsv,cam:r.ag,falta:r.falta}));
  const k=f=>dev.reduce((a,x)=>a+f(x),0);
  return {us,canon,lugares,dev,qDev:k(x=>x.q),vDev:sum(dev,x=>x.v),qSep:k(x=>x.sep),qEst:k(x=>x.est),qCam:k(x=>x.cam),qFalta:k(x=>x.falta)}})}

/* 4 · lucro por linha — o motor da DRE (V124DIR.dre = FS.dre do Financeiro) */
const LIN=['TAAG','Acústica','Focal','Pós-venda'];
function linhas(){return C('lin',()=>{
  const d=u=>T(()=>window.V124DIR.dre(VD.ym,u,''),null)||{receita:0,deducoes:0,cmv:0,diretos:0,variaveis:0,fixas:0,ebitda:0,tecnicos:0,viagens:0,terceiros:0,comissao:0,rt:0};
  const ls=LIN.map(u=>{const x=d(u);const cust=r2((+x.deducoes||0)+(+x.cmv||0)+(+x.diretos||0)+(+x.variaveis||0));return {u,x,rec:r2(x.receita),cust,desp:r2(x.fixas),res:r2(x.ebitda)}});
  const adm=d('Corporativo');const tot=d('');
  const soma=r2(sum(ls,l=>l.res)+r2(adm.ebitda));
  return {ls,adm:{x:adm,desp:r2(-adm.ebitda)},tot:r2(tot.ebitda),totX:tot,soma,dif:r2(r2(tot.ebitda)-soma)}})}

/* ─────────── os blocos ─────────── */
function bloco1(){if(!AC.fin())return '';const f=fluxo();if(!f)return '';
  const W=1000,H=200,L_=70,R_=16,Tp=16,B=26;const pts=[{lb:'hoje',s:f.c0}].concat(f.linhas.map(x=>({lb:x.curto,s:x.saldo,x})));
  const ys=pts.map(p=>p.s).concat([0]);let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo)hi=lo+1;const pad=(hi-lo)*.1;hi+=pad;lo=lo<0?lo-pad:0;
  const sx=i=>L_+(W-L_-R_)*i/(pts.length-1||1),sy=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));
  const path=pts.map((p,i)=>(i?'L':'M')+sx(i).toFixed(1)+' '+sy(p.s).toFixed(1)).join(' ');
  const xd=sx(30);
  const svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Saldo de caixa: 30 dias e depois semanas">${[lo,(lo+hi)/2,hi].map(v=>`<line class="gl" x1="${L_}" x2="${W-R_}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/><text x="${L_-8}" y="${(sy(v)+4).toFixed(1)}" text-anchor="end">${E(Rk(v))}</text>`).join('')}${lo<0?`<line x1="${L_}" x2="${W-R_}" y1="${sy(0)}" y2="${sy(0)}" stroke="#d03b3b" stroke-dasharray="5 4"/>`:''}<line x1="${xd}" x2="${xd}" y1="${Tp}" y2="${H-B}" stroke="var(--rx-sub)" stroke-dasharray="3 4" opacity=".5"/><text x="${xd-6}" y="${Tp+10}" text-anchor="end">dia a dia</text><text x="${xd+6}" y="${Tp+10}">semana a semana</text><path d="${path}" fill="none" stroke="#2a78d6" stroke-width="2.5"/>${pts.map((p,i)=>`<circle cx="${sx(i).toFixed(1)}" cy="${sy(p.s).toFixed(1)}" r="${p.x&&!p.x.dia?4:2.5}" fill="${p.s<0?'#d03b3b':'#2a78d6'}"/>`).join('')}${pts.map((p,i)=>(i<=30&&i%5===0&&i<30)||(p.x&&!p.x.dia&&(i-31)%2===0)?`<text x="${sx(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${E(p.lb)}</text>`:'').join('')}${pts.map((p,i)=>{if(!p.x)return '';const x0=i===0?sx(0):(sx(i-1)+sx(i))/2,x1=i===pts.length-1?sx(i):(sx(i)+sx(i+1))/2;return `<rect x="${x0.toFixed(1)}" y="${Tp}" width="${Math.max(1,x1-x0).toFixed(1)}" height="${H-Tp-B}" fill="transparent" data-tip="${E('<b>'+p.x.lb+'</b><br>entra '+R$(p.x.ent)+'<br>sai '+R$(p.x.sai)+'<br>saldo '+R$(p.x.saldo))}" onclick="V130_open('flx',${i-1})"/>`}).join('')}</svg>`;
  const rows=f.linhas.map((x,i)=>`<tr class="click${x.dia?'':' wk'}" onclick="V130_open('flx',${i})"><td>${x.dia?E(x.lb):'<b>Semana '+E(x.lb)+'</b>'}</td><td class="pos">${x.ent?R$(x.ent):'—'}</td><td class="neg">${x.sai?R$(-x.sai):'—'}</td><td class="${x.saldo<0?'neg':''}"><b>${R$(x.saldo)}</b></td></tr>`).join('');
  const fecha=Math.abs(f.fim-f.fimSem)<0.01;
  return `<section class="sec vx-s" id="v130_s_b1">${secHead('1','Fluxo de caixa','Contas a receber × contas a pagar: dia a dia nos próximos 30 dias, depois semana a semana até 13 semanas.',['Fluxo de caixa','#/fluxo'])}
   <div class="rx"><div class="card wide"><div class="vx-tiles">${tile('Caixa hoje',R$(f.c0),EXEC()?"VD_open('caixa')":"V130_go('#/fincontas')")}${tile('Entra em 30 dias',R$(f.ent30),"V130_open('flx30','ent')",'pos')}${tile('Sai em 30 dias',R$(-f.sai30),"V130_open('flx30','sai')",'neg')}${tile('Saldo em 30 dias',R$(f.s30),"V130_open('flx',29)",f.s30<0?'neg':'')}${tile('Saldo em 13 semanas',R$(f.fim),"V130_go('#/fluxo')",f.fim<0?'neg':'')}</div>
    ${f.neg?`<div class="vx-warn">⚠ O caixa fica negativo em <b>${E(f.neg.lb)}</b> (${R$(f.neg.saldo)}).</div>`:''}
    <div onclick="" style="margin-top:4px">${svg}</div>
    <div class="vx-flx"><table class="no-filter"><thead><tr><th>Quando</th><th>Entra</th><th>Sai</th><th>Saldo</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="vx-ponte">Ponte: ${R$(f.c0)} + entradas − saídas = <b>${R$(f.fim)}</b> em 13 semanas ${fecha?'<span class="ok">✓ o mesmo do Financeiro › Fluxo de caixa</span>':'<span class="bad">≠ '+R$(f.fimSem)+' no Fluxo de caixa</span>'}. Clique num dia ou semana para ver os títulos.</div>
   </div></div></section>`}

function bloco2(){if(!AC.custo())return '';const d=pedidos();if(!d)return '';const t=d.tot;
  const ms=MESES();const cur=ymOf(hoje());
  const rows=d.rows.map(x=>x.falta?`<tr class="click" onclick="V130_go('#/editor/${J(x.p.id)}')"><td><b>${E(propLb(x.p))}</b><div class="lead">${E(nomeCli(x.p))}</div></td><td>${R$(x.venda)}</td><td colspan="5" class="lead">sem os números da obra ainda</td><td>—</td></tr>`:
    `<tr class="click" onclick="V130_open('pedido','${J(x.p.id)}')"><td><b>${E(propLb(x.p))}</b><div class="lead">${E(nomeCli(x.p))} · ${E(uniP(x.p)||'')}</div></td><td>${R$(x.venda)}</td><td>${R$(-x.imp)}</td><td>${R$(-x.prod)}</td><td>${R$(-x.com)}</td><td>${R$(-x.obra)}</td><td>${x.gar?R$(-x.gar):'—'}</td><td class="${x.lucro<0?'neg':'pos'}"><b>${R$(x.lucro)}</b><div class="lead">${P1(x.marg)}</div></td></tr>`).join('');
  return `<section class="sec vx-s" id="v130_s_b2">${secHead('3','Lucro por pedido de venda','Venda − impostos − custo do produto − comissão/RT − despesas da obra − garantia = lucro.')}
   <div class="rx"><div class="card wide"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><div class="pt" style="margin:0">Pedidos vendidos em <b>${ymLb(VD.ym)}</b> · valores previstos para a obra inteira (custo real quando já passou do planejado). Clique num pedido para ver a conta.</div>
    <select class="per" aria-label="Mês" onchange="VD.ym=this.value;V130.dr=null;V130_close()">${ms.map(m=>`<option value="${m}" ${m===VD.ym?'selected':''}>${ymLb(m)}${m===cur?' · este mês':''}</option>`).join('')}</select></div>
    ${d.rows.length?`<div class="tw"><table class="no-filter vx-ped"><thead><tr><th>Pedido</th><th>Venda</th><th>Impostos</th><th>Custo do produto</th><th>Comissão/RT</th><th>Despesas da obra</th><th>Garantia</th><th>Lucro</th></tr></thead><tbody>${rows}<tr class="tot"><td>Total · ${plural(d.ok.length,'pedido','pedidos')}</td><td>${R$(t.venda)}</td><td>${R$(-t.imp)}</td><td>${R$(-t.prod)}</td><td>${R$(-t.com)}</td><td>${R$(-t.obra)}</td><td>${t.gar?R$(-t.gar):'—'}</td><td class="${t.lucro<0?'neg':'pos'}"><b>${R$(t.lucro)}</b><div class="lead">${P1(t.marg)}</div></td></tr></tbody></table></div>
    <div class="vx-ponte">${R$(t.venda)} − ${R$(t.imp)} − ${R$(t.prod)} − ${R$(t.com)} − ${R$(t.obra)} − ${R$(t.gar)} = <b>${R$(t.lucro)}</b> ${Math.abs(r2(t.venda-t.imp-t.prod-t.com-t.obra-t.gar)-t.lucro)<0.02?'<span class="ok">✓ fecha</span>':''}</div>`:'<div class="vazio">Nenhum pedido vendido neste mês.</div>'}
   </div></div></section>`}

function bloco3(){if(!AC.est())return '';const e=estoq();if(!e)return '';const cus=AC.custo();
  const nN=e.us.filter(u=>u.natureza!=='consignado').length,nC=e.us.length-nN;
  const rows=e.lugares.map(x=>`<tr class="click" onclick="V130_open('lugar','${J(x.nome)}')"><td><b>${E(x.nome)}</b><div class="lead">${E(x.terr)}</div></td><td>${N0(x.nossas.length)}${x.cons.length?` <span class="lead">+ ${N0(x.cons.length)} consignado</span>`:''}</td>${cus?`<td>${R$(x.v)}</td>`:''}</tr>`).join('');
  const okU=e.lugares.reduce((a,x)=>a+x.nossas.length,0)===e.canon.nossas,okV=Math.abs(sum(e.lugares,x=>x.v)-r2(e.canon.custo))<0.01;
  return `<section class="sec vx-s" id="v130_s_b3">${secHead('4','Estoque','O que temos, o que ainda devemos aos clientes e onde cada coisa está.',['Estoque','#/epainel'])}
   <div class="rx"><div class="card"><h3>O que temos</h3><div class="pt">Unidades nossas no estoque${cus?', ao custo':''}.</div>
     <div class="vx-big" onclick="V130_open('lugar','*')" role="button"><b>${N0(e.canon.nossas)} un.</b>${cus?`<span>${R$(e.canon.custo)}</span>`:''}${nC?`<em>+ ${N0(nC)} consignado (não é nosso)</em>`:''}</div></div>
    <div class="card"><h3>O que devemos aos clientes</h3><div class="pt">Vendido e ainda não entregue${cus?', ao custo':''}.</div>
     <div class="vx-big" onclick="V130_open('devido')" role="button"><b>${N0(e.qDev)} un.</b>${cus?`<span>${R$(e.vDev)}</span>`:''}</div>
     <div class="vx-ponte">${N0(e.qDev)} = ${N0(e.qSep)} separado + ${N0(e.qEst)} no estoque + ${N0(e.qCam)} a caminho + <b class="${e.qFalta?'neg':''}">${N0(e.qFalta)} a comprar</b> ${e.qSep+e.qEst+e.qCam+e.qFalta===e.qDev?'<span class="ok">✓</span>':''}</div></div>
    <div class="card wide"><h3>Onde está</h3><div class="pt">Cada lugar do estoque. Clique para ver os produtos.</div>
     <div class="tw"><table class="no-filter"><thead><tr><th>Lugar</th><th>Unidades</th>${cus?'<th>Valor (custo)</th>':''}</tr></thead><tbody>${rows}<tr class="tot"><td>Total</td><td>${N0(nN)}${nC?` <span class="lead">+ ${N0(nC)} consignado</span>`:''}</td>${cus?`<td>${R$(sum(e.lugares,x=>x.v))}</td>`:''}</tr></tbody></table></div>
     <div class="vx-ponte">${okU&&okV?'<span class="ok">✓ a soma dos lugares é o total do estoque</span>':'<span class="bad">A soma dos lugares não fecha com o total</span>'}</div></div>
   </div></section>`}

function bloco4(){if(!AC.fin())return '';const l=linhas();if(!l)return '';
  const cor={'TAAG':'var(--u-taag)','Acústica':'var(--u-acu)','Focal':'var(--u-foc)','Pós-venda':'var(--u-pos)'};
  const mx=Math.max(1,...l.ls.map(x=>Math.abs(x.res)));
  const rows=l.ls.map(x=>`<tr class="click" onclick="V130_open('linha','${J(x.u)}')"><td><b><i class="vx-dot" style="background:${cor[x.u]}"></i>${E(x.u)}</b></td><td>${R$(x.rec)}</td><td>${R$(-x.cust)}</td><td>${R$(-x.desp)}</td><td class="${x.res<0?'neg':'pos'}"><b>${R$(x.res)}</b></td><td style="width:22%"><div class="vx-bar"><i style="width:${(Math.abs(x.res)/mx*100).toFixed(1)}%;background:${x.res<0?'#d03b3b':cor[x.u]}"></i></div></td></tr>`).join('');
  const soma=sum(l.ls,x=>x.res);
  return `<section class="sec vx-s" id="v130_s_b4">${secHead('2','Lucro por linha','Cada linha: o que vendeu − os custos dela − os gastos diretos dela. Os gastos compartilhados ficam só no total da empresa.',['DRE','#/dre'])}
   <div class="rx"><div class="card wide"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><div class="pt" style="margin:0">${ymLb(VD.ym)} · receita conforme o avanço das obras (o mesmo da DRE).</div>
    <select class="per" aria-label="Mês" onchange="VD.ym=this.value;V130.dr=null;V130_close()">${MESES().map(m=>`<option value="${m}" ${m===VD.ym?'selected':''}>${ymLb(m)}</option>`).join('')}</select></div>
    <div class="tw"><table class="no-filter"><thead><tr><th>Linha</th><th>Receita</th><th>Custos da linha</th><th>Gastos diretos</th><th>Resultado</th><th></th></tr></thead><tbody>${rows}
     <tr class="sub2"><td colspan="4"><b>Soma das linhas</b></td><td class="${soma<0?'neg':'pos'}"><b>${R$(soma)}</b></td><td></td></tr>
     <tr class="click" onclick="V130_open('linha','Corporativo')"><td colspan="4">− Gastos compartilhados (Administrativo, aluguel, estrutura)</td><td class="neg">${R$(-l.adm.desp)}</td><td></td></tr>
     <tr class="tot"><td colspan="4">Resultado da empresa</td><td class="${l.tot<0?'neg':'pos'}">${R$(l.tot)}</td><td></td></tr></tbody></table></div>
    <div class="vx-ponte">${R$(soma)} − ${R$(l.adm.desp)} = <b>${R$(l.tot)}</b> ${Math.abs(l.dif)<0.05?'<span class="ok">✓ igual ao resultado da DRE</span>':'<span class="bad">difere da DRE em '+R$(l.dif)+'</span>'}</div>
   </div></div></section>`}

/* ─────────── as gavetas dos 4 blocos ─────────── */
function gaveta4(k,a){const t=hoje();
  if(k==='flx'){const f=fluxo();const x=f.linhas[+a];if(!x)return '';const rec=x.xs.flatMap(y=>y.rec),pag=x.xs.flatMap(y=>y.pag);const fixo=sum(x.xs,y=>y.fixo),part=sum(x.xs,y=>y.part);
    return gHead(x.dia?'Caixa em '+x.lb:'Caixa na semana '+x.lb,R$(x.saldo),'saldo no fim '+(x.dia?'do dia':'da semana')+' · entra '+R$(x.ent)+' · sai '+R$(x.sai))+
     `<h4 class="vx-h4">Entra · ${R$(x.ent)}</h4>`+(rec.length?tabela(['Cliente','Vencimento','Valor'],rec.map(l=>tr([E(cx().cliDe(l)),dBR(l.vencimento)+(String(l.vencimento)<t?' <span class="bad">vencido</span>':''),R$(l.valor)],'#/receber/todos'))):vazio('Nada a receber.'))+
     `<h4 class="vx-h4">Sai · ${R$(x.sai)}</h4>`+tabela(['O quê','Vencimento','Valor'],pag.map(l=>tr([E(l.categoria||l.origem||'Título')+(l.nf?' · NF '+E(l.nf):''),dBR(l.vencimento),R$(l.valor)],'#/pagar/todos')).concat([tr(['Despesas fixas e folha (média por dia)','',R$(fixo)],null)]).concat(part?[tr(['Comissões e RT previstas','',R$(part)],null)]:[]),trTot('Total',['',R$(r2(sum(pag,l=>l.valor)+fixo+part))]))+conf(x.sai,r2(sum(pag,l=>l.valor)+fixo+part))+abrir('Abrir Financeiro › Fluxo de caixa','#/fluxo')}
  if(k==='flx30'){const f=fluxo();const d=f.dias.slice(0,30);if(a==='ent'){const ls=d.flatMap(y=>y.rec);return gHead('Entra em 30 dias',R$(f.ent30),'títulos a receber até '+dBR(d[d.length-1].dt))+(ls.length?tabela(['Cliente','Vencimento','Valor'],ls.map(l=>tr([E(cx().cliDe(l)),dBR(l.vencimento)+(String(l.vencimento)<t?' <span class="bad">vencido</span>':''),R$(l.valor)],'#/receber/todos')),trTot('Total',['',R$(sum(ls,l=>l.valor))])):vazio('Nada a receber em 30 dias.'))+conf(f.ent30,sum(ls,l=>l.valor))}
    const ls=d.flatMap(y=>y.pag);const fixo=sum(d,y=>y.fixo),part=sum(d,y=>y.part);return gHead('Sai em 30 dias',R$(f.sai30),'títulos a pagar + fixos e folha + comissões/RT')+tabela(['O quê','Vencimento','Valor'],ls.map(l=>tr([E(l.categoria||l.origem||'Título'),dBR(l.vencimento),R$(l.valor)],'#/pagar/todos')).concat([tr(['Despesas fixas e folha (30 dias)','',R$(fixo)],null)]).concat(part?[tr(['Comissões e RT previstas','',R$(part)],null)]:[]),trTot('Total',['',R$(r2(sum(ls,l=>l.valor)+fixo+part))]))+conf(f.sai30,r2(sum(ls,l=>l.valor)+fixo+part))}
  if(k==='pedido'){const x=pedidos().rows.find(y=>y.p.id===a);if(!x||x.falta)return '';
    const L_=(lb,v,sub,h)=>`<tr${h?` class="click" onclick="V130_go('${J(h)}')"`:''}><td>${lb}${sub?`<div class="lead">${sub}</div>`:''}</td><td>${v}</td></tr>`;
    return gHead(propLb(x.p)+' · '+E(nomeCli(x.p)),R$(x.lucro),'lucro previsto · margem '+P1(x.marg)+(x.av!=null?' · obra '+P0(x.av)+' avançada':''))+`<table class="no-filter"><tbody>${L_('<b>Venda</b> (produtos + serviços)',R$(x.venda),'',`#/editor/${x.p.id}`)}${L_('− Impostos sobre a venda',R$(-x.imp))}${L_('− Custo do produto',R$(-x.prod),'preço de compra; o real quando já passou do planejado')}${L_('− Comissão e RT',R$(-x.com),'comissão '+R$(x.comV)+' · RT '+R$(x.rtV),'#/comissoes')}${L_('− Despesas da obra',R$(-x.obra),'técnicos '+R$(x.mo)+' · frete '+R$(x.frete)+(x.extras?' · viagens e extras '+R$(x.extras):''),x.o?`#/fobras/${x.o.id}`:'')}${L_('− Garantia (pós-venda)',x.gar?R$(-x.gar):'—','',x.o?`#/fpvgar/${x.o.id}`:'')}<tr class="tot"><td>= Lucro</td><td class="${x.lucro<0?'neg':'pos'}">${R$(x.lucro)}</td></tr></tbody></table>`+(x.o?abrir('Abrir Resultado da obra','#/fobras/'+x.o.id):abrir('Abrir o pedido','#/editor/'+x.p.id))}
  if(k==='lugar'){const e=estoq();const us=a==='*'?e.us:((e.lugares.find(x=>x.nome===a)||{}).us||[]);const nos=us.filter(u=>u.natureza!=='consignado');const pp=porProduto(us,'lug|'+a,AC.custo());
    return gHead(a==='*'?'Estoque — todos os lugares':E(a),AC.custo()?R$(sum(nos,custoU)):N0(nos.length)+' un.',N0(nos.length)+' unidades nossas'+(us.length>nos.length?' + '+N0(us.length-nos.length)+' consignado':'')+' · uma linha por produto, clique para ver as unidades')+(pp.rows.length?tabela(['Produto','Qtd'].concat(AC.custo()?['Custo']:[]),pp.rows,trTot('Total',[N0(pp.n)].concat(AC.custo()?[R$(pp.v)]:[]))):vazio('Nenhuma unidade.'))+abrir('Abrir Estoque','#/estoque')}
  if(k==='devido'){const e=estoq();const g={};e.dev.forEach(x=>{const id=x.p?x.p.id:'?';(g[id]=g[id]||{p:x.p,xs:[]}).xs.push(x)});
    const rows=[];Object.values(g).sort((a,b)=>sum(b.xs,x=>x.v)-sum(a.xs,x=>x.v)).forEach(G=>{const kk='dev|'+(G.p?G.p.id:'');const op=!!V.exp[kk];const q=G.xs.reduce((s,x)=>s+x.q,0),fa=G.xs.reduce((s,x)=>s+x.falta,0);
      rows.push(`<tr class="click" onclick="V130_tog('${J(kk)}')"><td><b>${op?'▾':'▸'} ${G.p?E(propLb(G.p))+' · '+E(nomeCli(G.p)):'—'}</b></td><td>${N0(q)}</td><td>${fa?`<span class="bad">${N0(fa)}</span>`:'—'}</td>${AC.custo()?`<td>${R$(sum(G.xs,x=>x.v))}</td>`:''}</tr>`);
      if(op)G.xs.forEach(x=>rows.push(`<tr class="sub click" onclick="V130_go('#/ocprop/${J(G.p?G.p.id:'')}')"><td>${E(nomeProd(x.r.pid))}</td><td>${N0(x.q)}</td><td>${x.falta?N0(x.falta):'—'}</td>${AC.custo()?`<td>${R$(x.v)}</td>`:''}</tr>`))});
    return gHead('O que devemos aos clientes',N0(e.qDev)+' un.',(AC.custo()?R$(e.vDev)+' ao custo · ':'')+'vendido e ainda não entregue, por pedido — clique para ver os produtos')+(rows.length?tabela(['Pedido','Unidades','A comprar'].concat(AC.custo()?['Custo']:[]),rows,trTot('Total',[N0(e.qDev),N0(e.qFalta)].concat(AC.custo()?[R$(e.vDev)]:[]))):vazio('Nada a entregar.'))+abrir('Abrir Estoque › Por proposta','#/cep')}
  if(k==='linha'){const l=linhas();const x=a==='Corporativo'?l.adm.x:(l.ls.find(y=>y.u===a)||{}).x;if(!x)return '';const R_=(lb,v)=>`<tr><td>${lb}</td><td>${R$(v)}</td></tr>`;
    if(a==='Corporativo')return gHead('Gastos compartilhados',R$(l.adm.desp),'Administrativo: aluguel, estrutura e o que não é de uma linha — fica só no total da empresa')+`<table class="no-filter"><tbody>${R_('Despesas da estrutura',-x.fixas)}${(+x.receita||0)?R_('Receitas sem linha',x.receita):''}<tr class="tot"><td>Total</td><td>${R$(x.ebitda)}</td></tr></tbody></table>`+abrir('Abrir Financeiro › DRE','#/dre');
    return gHead('Lucro da linha '+E(a),R$(x.ebitda),ymLb(VD.ym)+' · o mesmo motor da DRE')+`<table class="no-filter"><tbody>${R_('<b>Receita</b>',x.receita)}${R_('− Impostos',-(+x.deducoes||0))}${R_('− Custo dos produtos',-(+x.cmv||0))}${R_('− Técnicos',-(+x.tecnicos||0))}${R_('− Viagens',-(+x.viagens||0))}${R_('− Terceiros e frete',-(+x.terceiros||0))}${R_('− Comissão',-(+x.comissao||0))}${R_('− RT',-(+x.rt||0))}${R_('− Gastos diretos da linha',-(+x.fixas||0))}<tr class="tot"><td>= Resultado da linha</td><td class="${x.ebitda<0?'neg':'pos'}">${R$(x.ebitda)}</td></tr></tbody></table>`+abrir('Abrir Financeiro › DRE','#/dre')}
  return ''}

/* ─────────────────────────────── A VISÃO CEO, AGORA DENTRO DO INÍCIO ─────────────────────────────── */
const DIR=SCREENS.diretoria;const isHome=()=>T(()=>route().k==='home',false);
function ceoParts(){
  if(typeof DIR!=='function')return {css:''};
  const h=T(()=>DIR.call(SCREENS),'');if(typeof h!=='string')return {css:''};
  const box=document.createElement('div');box.innerHTML=h;
  const P={};P.css=[...box.querySelectorAll('style')].map(s=>{const o=s.outerHTML;s.remove();return o}).join('');
  const root=box.querySelector('#vd_root');if(!root||!EXEC())return P;
  const k6=root.querySelector('.k6');P.k6=k6?k6.outerHTML:'';
  const rx=root.querySelector('#vd_raiox');P.raiox=rx?rx.outerHTML:'';
  [...root.querySelectorAll(':scope > .sec')].forEach(s=>{const t=(s.querySelector('h2')||{}).textContent||'';
    if(/Quem dá lucro/.test(t))P.unid=s.outerHTML;
    if(/acontecendo agora/.test(t)){const o6=s.querySelector('.o6');P.oper=o6?o6.outerHTML:'';const f=s.querySelector('#vd_fila');const card=f?f.closest('.card'):null;P.fila=card?`<div style="margin-top:14px">${card.outerHTML}</div>`:''}});
  const ov=box.querySelector('.vd-ov');
  if(ov&&VD.drawer==='op_aprovacao'){const o=T(()=>window.V124DIR.opr(),null);const bg=ov.querySelector('.big');if(o&&bg){const n1=(o.aprov||[]).length,n2=(o.rtd||[]).length;bg.textContent=N0(n1+n2);bg.insertAdjacentHTML('afterend',`<div class="lead">${plural(n1,'proposta','propostas')} + ${plural(n2,'Ret/Troc','Ret/Trocs')} = ${N0(n1+n2)} <span class="ok">✓ o número do cartão</span></div>`)}}
  P.drawer=ov?ov.outerHTML:'';
  const ft=root.querySelector('.foot');P.foot=ft?ft.innerHTML:'';
  return P}

/* ─────────────────────────────── A TELA ─────────────────────────────── */
const CSS=`<style id="v130-css">
.vx{--u-taag:#2a78d6;--u-acu:#eb6834;--u-foc:#1baf7a;--u-pos:#eda100;--u-adm:#8a8984;--rx-ink:#0b0b0b;--rx-sub:#52514e;--rx-grid:#e9e8e4}
:root[data-theme="dark"] .vx{--u-taag:#3987e5;--u-acu:#d95926;--u-foc:#199e70;--u-pos:#c98500;--u-adm:#8f8e88;--rx-ink:#f0efec;--rx-sub:#c3c2b7;--rx-grid:#2c2c2a}
.vx .rx{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:900px){.vx .rx{grid-template-columns:1fr}}
.vx .rx .card{border-radius:18px;padding:18px 20px;min-width:0}
.vx .rx .wide{grid-column:1/-1}
.vx .rx h3{font-size:15px;font-weight:800;margin:0 0 2px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.vx .rx .pt{font-size:12.5px;color:var(--rx-sub);margin-bottom:10px;line-height:1.45}
.vx .rx svg{width:100%;height:auto;display:block;overflow:visible}
.vx .rx svg text{font-size:11px;fill:var(--rx-sub)}
.vx .rx svg text.v{fill:var(--rx-ink);font-weight:700}
.vx .rx svg .gl{stroke:var(--rx-grid);stroke-width:1}
.vx .rx svg .zl{stroke:var(--rx-sub);stroke-width:1;opacity:.6}
.vx .rx [data-tip]{cursor:pointer}
.vx .rx .lg{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;margin-top:8px;color:var(--rx-sub)}
.vx .rx .lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.vx .rx .vazio,.vx .vazio{font-size:13px;color:var(--rx-sub);padding:18px 0}
#vd_tip{position:fixed;z-index:2147483001;pointer-events:none;background:var(--card,#fff);color:inherit;border-radius:10px;padding:8px 11px;font-size:12.5px;box-shadow:0 8px 24px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06);display:none;max-width:280px;line-height:1.4}
.vx{max-width:1280px;margin:28px auto 0;padding:26px 26px 40px;position:relative;z-index:1;border-radius:28px;background:rgba(246,246,248,.80);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);box-shadow:0 -1px 0 rgba(255,255,255,.6) inset,0 20px 60px rgba(0,0,0,.06)}
:root[data-theme="dark"] .vx{background:rgba(18,18,20,.78);box-shadow:0 20px 60px rgba(0,0,0,.35)}
@media(max-width:600px){.vx{padding:16px 12px 30px;border-radius:20px;margin-top:16px}}
.vx .vx-top{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-top:6px}
.vx .hello{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;opacity:.55}
.vx h1{font-size:34px;font-weight:800;letter-spacing:-.025em;margin:2px 0 0;line-height:1.1}
.vx .acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.vx .acts .inicio-more-btn{margin:0!important}
.vx .vx-nav{position:relative;z-index:20;border-radius:14px;display:flex;gap:6px;overflow-x:auto;padding:10px 2px;margin:10px 0 0;background:transparent;scrollbar-width:none}
#v130_navfix{background:rgba(246,246,248,.86);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-radius:0}
:root[data-theme="dark"] #v130_navfix{background:rgba(18,18,20,.86)}
.vx .vx-nav::-webkit-scrollbar{display:none}
.vx .vx-nav button{flex:0 0 auto;border:1px solid var(--bd,#e5e7eb);background:var(--card,#fff);color:inherit;border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:700;white-space:nowrap}
.vx .vx-nav button:hover{border-color:#2a78d6;color:#2a78d6}
.vx .vx-nav button.al{background:rgba(208,59,59,.1);border-color:rgba(208,59,59,.35);color:#b42318}
.vx .vx-s{scroll-margin-top:118px;margin-top:34px}
#v130_navfix{position:fixed;top:60px;z-index:1030;display:none;margin:0!important;padding:8px 18px!important;box-shadow:0 6px 16px rgba(0,0,0,.06);border-bottom:1px solid var(--bd,#e5e7eb)}
#v130_navfix.on{display:flex}
.vx .vx-sh{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.vx .vx-n{font-size:11px;font-weight:800;letter-spacing:.12em;color:#2a78d6;opacity:.9}
.vx .vx-sh h2{font-size:22px;font-weight:800;letter-spacing:-.015em;margin:1px 0 2px}
.vx .vx-sh .q{font-size:13px;opacity:.7;margin:0;max-width:760px}
.vx .vx-lk{font-weight:700;font-size:13px;white-space:nowrap}
.vx .sec .d-flex.gap-2.align-items-center{flex-wrap:wrap}
.vx .vx-sub{font-size:13px;font-weight:800;margin:20px 0 10px;opacity:.85}
.vx .vx-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:12px}
.vx .vx-tiles.c2{grid-template-columns:1fr 1fr}
.vx .vx-tiles.c3{grid-template-columns:repeat(3,1fr)}
@media(max-width:900px){.vx .vx-tiles.c3{grid-template-columns:1fr 1fr}}
.vx .vx-tile{background:rgba(120,120,128,.07);border-radius:14px;padding:12px 14px;cursor:pointer;transition:background .12s,transform .12s;min-width:0}
.vx .vx-tile:hover{background:rgba(42,120,214,.09);transform:translateY(-1px)}
.vx .vx-tile b{display:block;font-size:21px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vx .vx-tile span{display:block;font-size:12px;font-weight:600;opacity:.75;margin-top:2px}
.vx .vx-tile em{display:block;font-style:normal;font-size:11.5px;opacity:.6;margin-top:2px}
.vx .neg{color:#d03b3b}.vx .pos{color:#0a8a0a}.vx .warn{color:#b26b00}
.vx .vx-ponte{font-size:12.5px;opacity:.85;margin-top:10px;line-height:1.6}
.vx .vx-ponte .ok,.vx .ok{color:#0a8a0a;font-weight:700}.vx .vx-ponte .bad,.vx .bad{color:#d03b3b;font-weight:700}
.vx .vx-stack{display:flex;height:38px;border-radius:10px;overflow:hidden;gap:2px;margin:6px 0 4px}
.vx .vx-stack>div{display:flex;align-items:center;justify-content:center;cursor:pointer;min-width:6px;transition:filter .12s}
.vx .vx-stack>div:hover{filter:brightness(1.08)}
.vx .vx-stack span{color:#fff;font-size:12px;font-weight:800;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.vx .vx-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.vx .vx-meta>div{text-align:center;cursor:pointer;border-radius:14px;padding:8px 6px}
.vx .vx-meta>div:hover{background:rgba(42,120,214,.06)}
.vx .vx-meta b{display:block;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.vx .vx-meta span{display:block;font-size:12px;opacity:.7}
.vx .rx svg.vx-ring{width:118px;height:118px;margin:0 auto 4px;display:block}
.vx .vx-donut{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.vx .rx .vx-donut svg{width:190px;height:190px;flex:0 0 auto}
.vx .vx-donut svg path{cursor:pointer;stroke:var(--card,#fff);stroke-width:2}
.vx .vx-hb .r{display:grid;grid-template-columns:minmax(110px,180px) 1fr 82px;gap:10px;align-items:center;padding:5px 4px;border-radius:8px;cursor:pointer}
.vx .vx-hb .r:hover{background:rgba(42,120,214,.06)}
.vx .vx-hb .l{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vx .vx-hb .b{height:14px;background:rgba(120,120,128,.1);border-radius:4px;overflow:hidden}
.vx .vx-hb .b i{display:block;height:100%;border-radius:0 4px 4px 0}
.vx .vx-hb .n{font-size:13px;font-weight:800;text-align:right;font-variant-numeric:tabular-nums}
.vx .vx-tl{display:grid;grid-template-columns:64px 1fr 110px 58px;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid var(--bd,#eef0f2);cursor:pointer}
.vx .vx-tl:hover{background:rgba(42,120,214,.05)}
.vx .vx-tl .d{font-weight:800;font-size:14px}.vx .vx-tl em{display:block;font-style:normal;font-size:11px;opacity:.6;font-weight:600}
.vx .vx-tl .nm{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vx .vx-tl .pg{height:8px;background:rgba(120,120,128,.12);border-radius:4px;overflow:hidden}.vx .vx-tl .pg i{display:block;height:100%}
.vx .vx-tl .pc{font-size:12.5px;font-weight:800;text-align:right}.vx .vx-tl .pc em{display:inline;font-size:12px}
.vx .vx-deps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:1100px){.vx .vx-deps{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.vx .vx-deps{grid-template-columns:1fr}.vx .vx-tiles.c2,.vx .vx-tiles.c3{grid-template-columns:1fr}.vx h1{font-size:27px}.vx .vx-meta{grid-template-columns:1fr}.vx .vx-tl{grid-template-columns:56px 1fr 60px}.vx .vx-tl .pg{display:none}}
.vx .vx-dep{border-radius:18px;padding:16px 16px 12px;border-top:4px solid var(--dc);display:flex;flex-direction:column}
.vx .vx-dh{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:15px}.vx .vx-dh i{color:var(--dc);font-size:18px}
.vx .vx-dl{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:7px 6px;border-radius:8px;cursor:pointer;font-size:13px}
.vx .vx-dl:hover{background:rgba(42,120,214,.07)}.vx .vx-dl span{opacity:.75}.vx .vx-dl b{font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}
.vx .vx-dlink{margin-top:auto;padding-top:8px;font-size:12.5px;font-weight:700}
.vx .vx-al{display:grid;grid-template-columns:118px 56px 1fr 20px;gap:10px;align-items:center;padding:12px 12px;border-radius:12px;cursor:pointer}
.vx .vx-al+.vx-al{border-top:1px solid var(--bd,#eef0f2)}
.vx .vx-al:hover{background:rgba(42,120,214,.05)}
.vx .vx-al .n{font-size:24px;font-weight:800;text-align:center;font-variant-numeric:tabular-nums}
.vx .vx-al .t b{display:block;font-size:14px}.vx .vx-al .t em{display:block;font-style:normal;font-size:12px;opacity:.7}
.vx .vx-al .go{font-size:20px;opacity:.4}
@media(max-width:600px){.vx .vx-al{grid-template-columns:1fr 50px}.vx .vx-al .t{grid-column:1/-1}.vx .vx-al .go{display:none}}
.vx .vx-qual{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 0;padding:10px 14px;border-radius:14px;background:rgba(120,120,128,.06);cursor:pointer;font-size:13px}
.vx .vx-qual:hover{background:rgba(42,120,214,.07)}
.vx .vx-q{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 4px;border-radius:999px;background:var(--card,#fff);font-weight:700}
.vx .vx-q i{font-style:normal;width:20px;height:20px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:12px}
.vx .vx-q em{font-style:normal;font-weight:600;opacity:.6}
.vx .vx-q.ok i{background:#0ca30c}.vx .vx-q.pend i{background:#b26b00}.vx .vx-q.div i{background:#d03b3b}
.vx .vx-alcount{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:12px;padding:8px 14px;font-weight:700;font-size:13px;background:rgba(208,59,59,.1);color:#b42318;cursor:pointer}
.vx .vx-alcount.ok{background:rgba(12,163,12,.1);color:#0a7a0a}
.vx .vx-flx{max-height:330px;overflow:auto;margin-top:10px;border-radius:12px;border:1px solid var(--bd,#eef0f2)}
.vx .vx-flx table{width:100%;border-collapse:collapse;font-size:13px}
.vx .vx-flx th{position:sticky;top:0;background:var(--card,#fff);font-size:11px;text-transform:uppercase;letter-spacing:.05em;opacity:.7;text-align:right;padding:8px 12px;border-bottom:1px solid var(--bd,#e5e7eb)}
.vx .vx-flx td{padding:7px 12px;text-align:right;border-bottom:1px solid var(--bd,#f0f1f3);font-variant-numeric:tabular-nums;white-space:nowrap}
.vx .vx-flx th:first-child,.vx .vx-flx td:first-child{text-align:left}
.vx .vx-flx tr.click{cursor:pointer}.vx .vx-flx tr.click:hover td{background:rgba(42,120,214,.06)}
.vx .vx-flx tr.wk td{background:rgba(120,120,128,.05)}
.vx table.vx-ped,.vx .rx table{width:100%;border-collapse:collapse;font-size:13.5px}
.vx .rx table th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;opacity:.65;text-align:right;padding:9px 10px;border-bottom:1px solid var(--bd,#e5e7eb);white-space:nowrap}
.vx .rx table td{padding:10px 10px;text-align:right;border-bottom:1px solid var(--bd,#f0f1f3);font-variant-numeric:tabular-nums;white-space:nowrap}
.vx .rx table th:first-child,.vx .rx table td:first-child{text-align:left;white-space:normal}
.vx .rx table tr.click{cursor:pointer}.vx .rx table tr.click:hover td{background:rgba(42,120,214,.06)}
.vx .rx table tr.tot td{font-weight:800;border-top:2px solid var(--bd,#d1d5db);border-bottom:0}
.vx .rx table tr.sub2 td{background:rgba(120,120,128,.05)}
.vx .vx-big{cursor:pointer;border-radius:16px;padding:14px 16px;background:rgba(120,120,128,.07)}
.vx .vx-big:hover{background:rgba(42,120,214,.09)}
.vx .vx-big b{display:block;font-size:34px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.vx .vx-big span{display:block;font-size:20px;font-weight:700;opacity:.85;font-variant-numeric:tabular-nums}
.vx .vx-big em{display:block;font-style:normal;font-size:12px;opacity:.6;margin-top:4px}
.vx .vx-dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;vertical-align:0}
.vx .vx-bar{height:10px;background:rgba(120,120,128,.1);border-radius:4px;overflow:hidden}.vx .vx-bar i{display:block;height:100%;border-radius:0 4px 4px 0}
.vx .vx-warn{margin:6px 0 8px;padding:9px 12px;border-radius:12px;background:rgba(208,59,59,.08);color:#b42318;font-size:13px}
.vd-dr .vx-h4,.vx-h4{font-size:14px;font-weight:800;margin:18px 0 0}
.vx .vx-foot{margin:34px 0 10px;font-size:12px;opacity:.65;display:flex;gap:16px;flex-wrap:wrap}
.vx .vx-mine{font-size:13px;opacity:.7;margin-top:4px}
</style>`;

const saud=()=>{const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'};
const primeiroNome=()=>T(()=>String(me().nome||'').split(' ')[0],'')||'';
const NAVL=[['geral','Visão geral'],['fin','Financeiro'],['com','Comercial'],['est','Estoque e compras'],['obr','Projetos e obras'],['dep','Departamentos'],['rel','Relacionamento e pós-venda'],['ale','Alertas']];

function build(){
  MEMO={};
  if(!VD.ym||MESES().indexOf(VD.ym)<0)VD.ym=ymOf(hoje());
  if(VD.drawer&&V.dr)V.dr=null;
  VD.uni='';VD.fil='';
  const exec=EXEC();
  const P=T(ceoParts,{css:''});tipOn();
  const b=[T(bloco1,''),T(bloco4,''),T(bloco2,''),T(bloco3,'')];
  if(!b.some(Boolean))return null; /* sem nenhum bloco para este perfil: só a entrada */
  const hh=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const dr=V.dr?T(()=>gaveta4(V.dr,V.arg)||gaveta(V.dr,V.arg),''):'';
  return `${P?P.css:''}${CSS}<div class="vd vx fx2-wrapped" id="v130_root">
   <div class="vx-top"><div><div class="hello">${exec?'Visão executiva':'O seu painel'}</div><h1>A empresa hoje</h1><div class="lead">Cada número abre os registros que o formam.</div></div></div>
   ${b.join('')}
   <div class="vx-foot"><span>Atualizado às ${hh} · recalcula a cada ação no sistema</span></div>
  </div>${dr?`<div class="vd vd-ov fx2-wrapped" style="background:rgba(0,0,0,.38)" onclick="if(event.target===this)V130_close()"><div class="vd-dr" id="v130_drawer">${dr}</div></div>`:''}`}

/* O Início: a entrada de sempre (logo em movimento, saudação, Começar do zero, Aprender fazendo, Escamas/Partículas)
   fica exatamente como era; rolando para baixo vem a visão executiva. O fundo animado continua vivo atrás, desfocado
   sob o painel para não atrapalhar a leitura. "Resumo dos departamentos" agora desce até o resumo novo. */
const HOME0=SCREENS.home;
function entrada(args){let h='';try{h=HOME0.apply(SCREENS,args)}catch(e){console.error('Início v130',e);h=''}
  if(typeof h!=='string'||!h)return h;
  try{const box=document.createElement('div');box.innerHTML=h;
    box.querySelectorAll('.inicio-old').forEach(x=>x.remove());
    box.querySelectorAll('.inicio-more-btn').forEach(b=>{if(/__inicioMore/.test(b.getAttribute('onclick')||'')){b.setAttribute('onclick',"V130_sec('b1')");b.setAttribute('title','Desce até a visão da empresa');const ch=b.querySelector('.bi-chevron-down,.bi-chevron-up');if(ch)ch.className='bi bi-arrow-down'}});
    return box.innerHTML}catch(e){return h}}
SCREENS.home=function(){
  const top=entrada(arguments);
  let h=null;try{h=build()}catch(e){console.error('Início v130',e);h=null}
  V.on=!!h;return h?(top||'')+h:top};
Object.keys(HOME0).forEach(k=>{try{SCREENS.home[k]=HOME0[k]}catch(e){}});SCREENS.home.__v130=true;SCREENS.home.__v130orig=HOME0;

/* a Visão CEO mora no Início: #/diretoria abre o Início (a função continua existindo para o Início usar) */
if(typeof DIR==='function'){
  SCREENS.diretoria=function(){if(T(()=>route().k,'')==='diretoria'&&EXEC()){setTimeout(()=>{if(T(()=>route().k,'')==='diretoria')location.replace('#/home')},0)}return DIR.apply(this,arguments)};
  Object.keys(DIR).forEach(k=>{try{SCREENS.diretoria[k]=DIR[k]}catch(e){}});SCREENS.diretoria.__v130orig=DIR;
  try{LABEL.diretoria='Visão executiva (Início)'}catch(e){}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&V.dr){V130_close()}});
/* a faixa de blocos acompanha a rolagem (a página rola na janela; #main corta o sticky) */
function navFix(){const n=document.getElementById('v130_nav'),f=document.getElementById('v130_navfix');if(!n||!f)return;const r=n.getBoundingClientRect();const on=r.bottom<62;
  if(on){const m=document.getElementById('main')||n.parentElement;const mr=m.getBoundingClientRect();f.style.left=Math.max(0,mr.left)+'px';f.style.width=mr.width+'px'}f.classList.toggle('on',on)}
window.addEventListener('scroll',navFix,{passive:true});window.addEventListener('resize',navFix);

/* o guia "Aprender fazendo" (capítulo da Visão CEO) passa a apontar para o Início */
T(()=>{(window.GUIA_CAPS||[]).forEach(c=>(c.passos||[]).forEach(p=>{
  if(p.tela==='#/diretoria')p.tela='#/home';
  if(/Diretoria › Visão CEO/.test(p.menu||''))p.menu='Início › Visão executiva';
  if(p.id==='c8p01'){p.faca='No menu da esquerda, clique em “Início” (a casinha) e role a página para baixo: a Visão CEO agora mora no Início, logo abaixo da entrada.';p.alvo={css:'#rail button[title="Início"]',texto:'Início',frame:null};p.pronto="(location.hash===''||location.hash.indexOf('#/home')===0)&&!!document.getElementById('v130_root')"}
  if(p.id==='c8p06'){p.faca='Volte para “Empresa” e, em “Saúde financeira”, clique no gráfico de caixa das 13 semanas.'}
  if(typeof p.porque==='string')p.porque=p.porque.replace(/Visão CEO/g,'Visão executiva do Início')}))},null);

/* a aba Diretoria sai do menu: a Visão CEO agora é o Início (Bruno, 30/10: "não tem propósito — apague") */
T(()=>{const i=NAV.findIndex(s=>s&&s.id==='dir');if(i>=0)NAV.splice(i,1)},null);
T(()=>{if(!document.getElementById('v130-nodir')){const st=document.createElement('style');st.id='v130-nodir';st.textContent='#rail button[title="Diretoria"],#rail [onclick*="#/diretoria"]{display:none!important}';document.head.appendChild(st)}},null);
window.V130API={com,est,cx,obr,rel,pos,qualidade,alertas,build,gaveta,AC};
try{render()}catch(e){try{if(isHome())renderMain()}catch(_){}}
})();
