/* =====================================================================================================
   v161e · FECHAMENTO DE 06/11/2026 (Bruno) — os números contam a mesma história do Painel de Controle até a tela
   Causa-raiz achada aqui: v161-coerencia.js e v161d-regras.js usavam a MESMA trava de carga do v161d-drill.js
   (window.__v161d) — o drill carrega antes, então as duas camadas NUNCA rodavam (por isso 241 concluídas com as 4
   fundidas, a ponte das 470 sumida, as regras de 06/11 desligadas). Cada uma ganhou a sua trava (__v161dc / __v161dr).
   Esta camada:
   §1 PAINEL DE CONTROLE → SISTEMA, na tela (Início › Operações, Operação › Painel, Projetos › Painel):
      "349 linhas = 310 da Operação + 35 canceladas + 4 em AT" · "68 em andamento = 47 sistema completo + 30 projeto +
      3 cabeamento + 1 sem status − 13 concluídas pela E.T. realizada" · "237 concluídas = 224 + 13 pela E.T.".
      Tudo calculado: linhas = V161_PAINEL (a exportação da planilha), situação = a Base (V161D.obras()). Cada termo
      abre o painel curto e chega em Operação › Obras com exatamente essas obras. "Das N obras em andamento" (Projetos)
      = o mesmo número da Operação.
   §2 Comercial › Gestão: os números (negociações e propostas) abrem o painel curto antes de filtrar a tela; a faixa
      "Filtro aplicado" vira a etiqueta padrão da v161. Os outros números da Gestão passam pela porta única do v161d.
   §3 Operação › Atividades no menu da Operação.
   §4 Pré-vendas: o 559 contava TODA proposta vendida com sistema/cabeamento (METAS 2026 + Planilha Mestra + os
      atendimentos do Controle de AT, inclusive obras concluídas) e criava um "A fazer" em branco para cada uma. Agora
      conta só o trabalho real: o entregável "Diagrama de equipamentos" do Painel de Controle (o.entregaveis na Base)
      das obras em andamento — com a ponte, cada termo clicável; o mesmo número no menu, na Gestão e no Início.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161e)return;window.__v161e=true;
if(typeof S==='undefined'||!S.db)return;
const X=window.V161E=window.V161E||{};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const N0=v=>(+v||0).toLocaleString('pt-BR');
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const cur=()=>(location.hash||'#/home').split('?')[0];
const rk=()=>cur().replace(/^#\/?/,'').split('/')[0]||'home';
const DR=()=>window.V161D||{};
const sit=o=>T(()=>COP.situacao(o),o.situacao||'');
const dBR=d=>{const s=String(d||'').slice(0,10);return /^\d{4}-\d\d-\d\d$/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—'};
const plural=(n,a,b)=>N0(n)+' '+(+n===1?a:b);
const CSS=`<style id="v161e-css">.v161e-pt{font-size:13px;line-height:1.75}.v161e-pt u[role=button]{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}
.v161e-pt u[role=button]:hover{color:#0a58ca}.v161e-pt .sub{font-size:12px}.v161e-pt b{font-weight:700}.v161e-card{border-left:4px solid #6f42c1}
.v161e-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.v161e-tile{cursor:pointer;border-radius:12px;padding:12px 14px;background:rgba(120,120,128,.08)}
.v161e-tile:hover{background:rgba(61,90,254,.09)}.v161e-tile .n{font-size:26px;font-weight:800;line-height:1.1}.v161e-tile .l{font-size:11px;letter-spacing:.06em;font-weight:700;opacity:.75}.v161e-tile .s{font-size:12px;opacity:.75}
.v161e-bar{display:flex;height:12px;border-radius:999px;overflow:hidden;background:rgba(120,120,128,.15);margin:8px 0}.v161e-bar i{display:block;height:100%;cursor:pointer}</style>`;
function css(){if(document.getElementById('v161e-css'))return;const d=document.createElement('div');d.innerHTML=CSS;(document.head||document.documentElement).appendChild(d.firstElementChild)}
const u=(t,on)=>`<u role="button" onclick="event.stopPropagation();${E(on)}">${t}</u>`;

/* ───────── o painel curto com uma lista de obras (o mesmo do v161d) ───────── */
function tbObras(xs,col){const t=document.createElement('table');
  t.innerHTML=`<thead><tr><th>Obra</th><th>Situação</th><th>${E(col&&col.h||'Na planilha')}</th></tr></thead><tbody>${xs.map(o=>`<tr onclick="location.hash='#/obras/${J(o.id)}'"><td><b>${E(o.nome||o.id)}</b></td><td>${E(sit(o))}</td><td>${E(col&&col.f?col.f(o):(o.statusPlanilha||'—'))}</td></tr>`).join('')}</tbody>`;return t}
function painelObras(sp){const D=DR();if(typeof D.abrir!=='function')return;
  const situ=sp.sit||'';const h=sp.h||'#/obras';
  D.abrir({code:sp.code||`COP.ui.obrasTab='obras';COP.ope.go('obras',{situacao:'${J(situ)}'},'#/obras')`,h,tela:sp.tela||('Operação › Obras e clientes'+(situ?' · '+situ:' · todas as situações')),
    big:N0(sp.xs.length),lb:sp.lb,sub:sp.sub||'',tb:sp.tb||tbObras(sp.xs,sp.col),vem:sp.vem||'Planilha Mestra › Painel de Controle',unid:'obras',
    recs:sp.xs.map(o=>({ids:[o.id],name:o.nome||o.id,h:(sp.recH||'#/obras/')+o.id})),porque:sp.porque||''})}

/* ═════════════════════════ §1 PAINEL DE CONTROLE → SISTEMA ═════════════════════════ */
const TIPO_LB={'sistema completo':'sistema completo','projeto':'projeto','cabeamento':'cabeamento','':'sem status na planilha'};
const FIM=new Set(['concluido','cancelada','on hold','assistencia tecnica']);
function mestra(){const P=window.V161_PAINEL;const D=DR();if(!P||!Array.isArray(P.rows)||typeof D.obras!=='function')return null;
  const r=D.obras();const vivas=(S.db.obras||[]).filter(o=>o&&!D.fundida(o));
  const porL={};vivas.forEach(o=>{if(o.linhaPlanilha!=null&&!o.legadoAT)(porL[String(o.linhaPlanilha)]=porL[String(o.linhaPlanilha)]||[]).push(o)});
  const stDe={};const rowOf={};P.rows.forEach(x=>{(porL[String(x.linha)]||[]).forEach(o=>{stDe[o.id]=nz(x.status);rowOf[o.id]=x})});
  const opSet=new Set(r.and.concat(r.hold,r.conc).map(o=>o.id));
  const L={ope:[],canc:[],at:[],outra:[],semObra:[]};
  P.rows.forEach(x=>{const os=porL[String(x.linha)]||[];if(!os.length){L.semObra.push(x);return}const o=os[0];const s=sit(o);
    if(opSet.has(o.id))L.ope.push(o);else if(s==='Cancelada')L.canc.push(o);else if(s==='Assistência técnica')L.at.push(o);else L.outra.push(o)});
  /* em andamento: o tipo de trabalho na planilha, menos as que a E.T. realizada concluiu */
  const et=r.conc.filter(o=>o.concluidaPorET);const etIds=new Set(et.map(o=>o.id));
  const base=r.and.filter(o=>stDe[o.id]!=null).concat(et);const tipos={};
  base.forEach(o=>{const k=stDe[o.id];(tipos[k]=tipos[k]||[]).push(o)});
  const andSem=r.and.filter(o=>stDe[o.id]==null);
  const concPl=r.conc.filter(o=>!etIds.has(o.id)&&stDe[o.id]==='concluido');const concOutra=r.conc.filter(o=>!etIds.has(o.id)&&stDe[o.id]!=='concluido');
  const holdPl=r.hold;
  return {r,P,L,tipos,et,andSem,concPl,concOutra,holdPl,stDe,rowOf,n:P.rows.length,quando:dBR(P.quando)}}
const ORD=['sistema completo','projeto','cabeamento',''];
const tipoLb=k=>TIPO_LB[k]!=null?TIPO_LB[k]:(k||'sem status')+' na planilha';
X.m=function(key){const m=mestra();if(!m)return;const r=m.r;const tp=k=>m.tipos[k]||[];const Q=`do Painel de Controle de ${m.quando}`;
  const colSt={h:'STATUS na planilha',f:o=>m.stDe[o.id]!=null?(m.rowOf[o.id].status||'(vazio)'):'sem linha na planilha'};
  const S1={
    linhas:{xs:m.L.ope.concat(m.L.canc,m.L.at,m.L.outra),lb:'linhas '+Q+' (com obra na Base)',sit:''},
    ope:{xs:m.L.ope,lb:'linhas da Operação (em andamento, on hold e concluídas)',sit:''},
    canc:{xs:m.L.canc,lb:'canceladas na planilha',sit:'Cancelada'},
    at:{xs:m.L.at,lb:'em assistência técnica (Pós-venda)',sit:'Assistência técnica'},
    and:{xs:r.and,lb:'obras em andamento',sit:'Em andamento'},
    hold:{xs:r.hold,lb:'obras on hold',sit:'On hold'},
    conc:{xs:r.conc,lb:'obras concluídas',sit:'Concluída'},
    et:{xs:m.et,lb:'concluídas pela E.T. realizada (a planilha ainda diz '+(m.et[0]?m.rowOf[m.et[0].id]?m.rowOf[m.et[0].id].status:'sistema completo':'sistema completo')+')',sit:'Concluída',col:{h:'E.T. realizada',f:o=>T(()=>window.V161P.notaET(o),'')||'—'}},
    concpl:{xs:m.concPl,lb:'concluídas na planilha (STATUS concluido)',sit:'Concluída'},
    concoutra:{xs:m.concOutra,lb:'concluídas no sistema com outro STATUS na planilha',sit:'Concluída'},
    andl:{xs:r.and.filter(o=>m.stDe[o.id]!=null),lb:'em andamento com linha no Painel de Controle',sit:'Em andamento'},
    andsem:{xs:m.andSem,lb:'em andamento sem linha no Painel de Controle hoje',sit:'Em andamento'}};
  ORD.concat(Object.keys(m.tipos).filter(k=>!ORD.includes(k))).forEach(k=>{S1['t:'+k]={xs:tp(k),lb:tipoLb(k)+' (STATUS na planilha) — em andamento + as concluídas pela E.T.',sit:''}});
  const s=S1[key];if(!s)return;painelObras(Object.assign({col:colSt},s,{lb:s.lb.charAt(0).toUpperCase()+s.lb.slice(1)}))};
function ponteMestra(){const m=mestra();if(!m)return '';const r=m.r;const o=k=>`V161E.m('${k}')`;const n=a=>N0(a.length);
  const ks=ORD.filter(k=>(m.tipos[k]||[]).length).concat(Object.keys(m.tipos).filter(k=>!ORD.includes(k)&&m.tipos[k].length));
  const somaT=ks.reduce((a,k)=>a+m.tipos[k].length,0);const andOk=somaT-m.et.length+m.andSem.length===r.and.length;
  const concOk=m.concPl.length+m.et.length+m.concOutra.length===r.conc.length;
  const linOk=m.L.ope.length+m.L.canc.length+m.L.at.length+m.L.outra.length+m.L.semObra.length===m.n;
  const ok=b=>b?' <span style="color:#198754">✓</span>':' <span class="bad">✗</span>';
  const l1=`<b>Painel de Controle</b> <span class="sub">(${m.quando})</span>: ${u(N0(m.n)+' linhas',o('linhas'))} = ${u(n(m.L.ope)+' da Operação',o('ope'))} + ${u(n(m.L.canc)+' canceladas',o('canc'))} + ${u(n(m.L.at)+' em assistência técnica (Pós-venda)',o('at'))}`+
    (m.L.outra.length?` + ${n(m.L.outra)} em outra situação`:'')+(m.L.semObra.length?` + ${n(m.L.semObra)} sem obra na Base`:'')+ok(linOk)+
    ` <span class="sub">· ${n(m.L.ope)} da Operação = ${u(N0(r.and.length-m.andSem.length)+' em andamento',o(m.andSem.length?'andl':'and'))} + ${u(n(r.hold)+' on hold',o('hold'))} + ${u(n(r.conc)+' concluídas',o('conc'))}${m.andSem.length?` · a Operação tem ainda ${u(plural(m.andSem.length,'obra em andamento sem linha na planilha','obras em andamento sem linha na planilha'),o('andsem'))} (criada no app ou fora do Painel de hoje)`:''}</span>`;
  const l2=`${u('<b>'+n(r.and)+' em andamento</b>',o('and'))} = ${ks.map(k=>u(N0(m.tipos[k].length)+' '+E(tipoLb(k)),o('t:'+k))).join(' + ')}${m.et.length?` − ${u(N0(m.et.length)+' concluídas pela E.T. realizada',o('et'))}`:''}${m.andSem.length?` + ${u(N0(m.andSem.length)+' sem linha na planilha',o('andsem'))}`:''}${ok(andOk)}`+
    `<div class="sub">na planilha, STATUS mistura o tipo de trabalho (sistema completo, projeto, cabeamento) com a etapa (concluído, cancelada, on hold…) — por isso o tipo vira "em andamento" no sistema</div>`;
  const l3=`${u('<b>'+n(r.conc)+' concluídas</b>',o('conc'))} = ${u(n(m.concPl)+' concluídas na planilha',o('concpl'))}${m.et.length?` + ${u(n(m.et)+' pela E.T. realizada',o('et'))} <span class="sub">(a planilha ainda diz sistema completo)</span>`:''}${m.concOutra.length?` + ${u(n(m.concOutra)+' com outro STATUS na planilha',o('concoutra'))}`:''}${ok(concOk)}`;
  css();return `<div class="card p-3 mb-3 v161e-card v161e-pt" id="v161e-mestra" data-linhas="${m.n}" data-and="${r.and.length}" data-conc="${r.conc.length}"><div>${l1}</div><div style="margin-top:6px">${l2}</div><div style="margin-top:6px">${l3}</div></div>`}
X.ponteMestra=ponteMestra;X.mestra=mestra;

/* ═════════════════════════ §4 PRÉ-VENDAS — os diagramas que faltam ═════════════════════════ */
const DONE=s=>s==='Aprovado'||s==='Concluído';
const ELAB=s=>s==='Em elaboração'||s==='Em andamento'||s==='Enviado'||s==='Revisão';
const PVK={aguardando:['aguardando arquitetura (A/P)','#d68a00'],andamento:['em andamento (A)','#2a78d6'],semst:['sem status na planilha','#8f969d'],feito:['já feitos (C)','#1a9e5c'],na:['não se aplica (N/A)','#b9bec3'],semlinha:['sem linha no Painel','#d9dce0']};
const AFAZER=['aguardando','andamento','semst'];
const diagE=o=>(o.entregaveis||[]).find(e=>e&&nz(e.nome)==='diagrama de equipamentos')||null;
function pvK(o){const e=diagE(o);if(!e)return 'semlinha';const s=e.status||'';if(DONE(s))return 'feito';if(s==='N/A')return 'na';if(ELAB(s))return 'andamento';if(s==='Aguardando projeto arq.')return 'aguardando';return 'semst'}
function pv(){const D=DR();const and=typeof D.obras==='function'?D.obras().and:(S.db.obras||[]).filter(o=>!o.merged_into&&!o.inativo&&!o.legadoAT&&sit(o)==='Em andamento');
  const b={};Object.keys(PVK).forEach(k=>b[k]=[]);and.forEach(o=>b[pvK(o)].push(o));Object.values(b).forEach(xs=>xs.sort((a,c)=>String(a.nome).localeCompare(String(c.nome),'pt')));
  const af=AFAZER.reduce((a,k)=>a.concat(b[k]),[]);return {and,b,af,n:af.length}}
X.pv=pv;
const colPv={h:'Diagrama de equipamentos',f:o=>{const e=diagE(o);if(!e)return 'sem linha no Painel';return (e.statusPainel||e.status||'vazio')+(e.enviado?' · enviado '+dBR(e.enviado):'')+(e.rev?' · '+e.rev:'')}};
X.p=function(k){const R=pv();const xs=k==='afazer'?R.af:k==='and'?R.and:(R.b[k]||[]);const lb=k==='afazer'?'diagramas de equipamentos a fazer (obras em andamento)':k==='and'?'obras em andamento':'diagramas '+(PVK[k]?PVK[k][0]:k);
  painelObras({xs,lb:lb.charAt(0).toUpperCase()+lb.slice(1),code:`COP.ui.prevendas={st:'${J(k)}'};location.hash='#/prevendas'`,h:'#/prevendas',tela:'Comercial › Pré-vendas',col:colPv,recH:'#/prjobras/',
    vem:'Planilha Mestra › Painel de Controle · entregável "Diagrama de equipamentos"'})};
function pontePv(R){const b=R.b;const o=k=>`V161E.p('${k}')`;const n=k=>N0(b[k].length);
  return `${u('<b>'+N0(R.n)+' diagramas a fazer</b>',o('afazer'))} = ${u(n('aguardando')+' aguardando arquitetura (A/P)',o('aguardando'))} + ${u(n('andamento')+' em andamento (A)',o('andamento'))} + ${u(n('semst')+' sem status',o('semst'))}`+
    ` · já feitos ${u(n('feito')+' (C)',o('feito'))} · não se aplica ${u(n('na')+' (N/A)',o('na'))}${b.semlinha.length?` · ${u(n('semlinha')+' sem linha no Painel',o('semlinha'))}`:''}`+
    `<div class="sub">das ${u(N0(R.and.length)+' obras em andamento',o('and'))} = ${N0(R.n)} a fazer + ${n('feito')} feitos + ${n('na')} N/A${b.semlinha.length?' + '+n('semlinha')+' sem linha':''} ${R.n+b.feito.length+b.na.length+b.semlinha.length===R.and.length?'<span style="color:#198754">✓</span>':'<span class="bad">✗</span>'} · lido do entregável "Diagrama de equipamentos" do Painel de Controle (a Base) — obra concluída, cancelada ou histórica nunca é pendência</div>`}
X.pontePv=()=>pontePv(pv());
/* o que o 559 contava (para a ponte "antes"): toda proposta vendida com sistema/cabeamento, de todas as fontes */
function antigo(){const fn=T(()=>compDe,null);if(typeof fn!=='function')return null;const c={};let n=0;
  (S.db.propostas||[]).forEach(p=>{const cc=T(()=>fn(p),null);if(!cc||p.linha==='focal'||!(cc.sistema&&cc.sistema.on||cc.cabeamento&&cc.cabeamento.on)||!['vendida','em_obra','aprovada_cliente'].includes(p.estado))return;n++;
    const f=/METAS/i.test(p.fonte||p.origem||'')?'vendas da METAS 2026':/Controle de AT/i.test(p.fonte||p.origem||'')?'atendimentos do Controle de AT (Pós-venda)':/Painel de Controle|Planilha Mestra/i.test(p.fonte||p.origem||'')?'propostas da Planilha Mestra':'outras';c[f]=(c[f]||0)+1});return {n,c}}
X.antigo=antigo;
/* o v97 criava um "A fazer" em branco para cada venda ao desenhar a tela: só os que alguém tocou ficam */
function limpaBrancos(){const L=S.db.prevendas_diag;if(!Array.isArray(L))return 0;const keep=L.filter(d=>d&&(d.status!=='A fazer'||d.rev||d.data||(d.arquivos||[]).length));const n=L.length-keep.length;
  if(n){S.db.prevendas_diag=keep;T(()=>log('prevendas_diag','v161e',n+' marcadores "A fazer" em branco criados automaticamente pela tela (sem arquivo, revisão ou data) saíram — o Pré-vendas conta o diagrama do Painel de Controle'));T(()=>save())}return n}
function telaPv(h){if(typeof h!=='string'||h.indexOf('v161e-pv')>=0)return h;const R=pv();const A=antigo();const f=(T(()=>COP.ui.prevendas,null)||{});const st=f.st||'afazer';
  /* os 3 cartões de diagrama: os números reais */
  const blk=(x,i0)=>{let d=0;const re=/<div\b|<\/div>/g;re.lastIndex=i0;let mm;while((mm=re.exec(x))){d+=mm[0]==='</div>'?-1:1;if(!d)return mm.index+6}return -1};
  const mk=(lb,n,s,k,cor)=>`<div class="col-6 col-lg-3"><div class="card p-3 h-100" role="button" style="cursor:pointer;border-top:4px solid ${cor}" onclick="V161E.p('${k}')"><div class="sub" style="font-size:11px;letter-spacing:.08em;font-weight:700">${E(lb)}</div><div style="font-size:30px;font-weight:800">${N0(n)}</div><div class="sub" style="font-size:12px">${E(s)}</div></div></div>`;
  const i=h.indexOf('<div class="row g-3 mb-3">');const fimRow=i>=0?blk(h,i):-1;
  if(i>=0&&fimRow>0&&h.slice(i,fimRow).indexOf('DIAGRAMAS A FAZER')>=0){const c1=h.indexOf('<div class="col-6 col-lg-3">',i);const c1e=c1>=0?blk(h,c1):-1;
    if(c1e>0&&c1e<fimRow)h=h.slice(0,c1e)+mk('DIAGRAMAS A FAZER',R.n,'obras em andamento sem o diagrama pronto','afazer','#d93a3a')+mk('EM ANDAMENTO (A)',R.b.andamento.length,'diagrama em elaboração','andamento','#2a78d6')+mk('JÁ FEITOS (C)',R.b.feito.length,'diagrama pronto nas obras em andamento','feito','#1a9e5c')+h.slice(fimRow-6)}
  const pont=`<div class="card p-3 mb-3 v161e-card v161e-pt" id="v161e-pv" data-n="${R.n}"><div>${pontePv(R)}</div>${A&&A.n?`<div class="sub" style="margin-top:4px">Antes esta tela dizia <b>${N0(A.n)}</b>: contava toda proposta vendida com sistema ou cabeamento — ${Object.entries(A.c).map(([k,v])=>N0(v)+' '+E(k)).join(' + ')} —, inclusive de obras concluídas, e criava um "A fazer" em branco para cada uma. Não era trabalho do Pré-vendas.</div>`:''}</div>`;
  const ii=h.indexOf('<div class="row g-3 mb-3">');if(ii>=0)h=h.slice(0,ii)+pont+h.slice(ii);
  /* a lista: as obras em andamento e o diagrama de cada uma (o Painel de Controle) */
  const a=h.indexOf('<div class="mt-3"></div>');const b=h.indexOf('<div class="card p-3 mt-3"><div class="sub" style="font-size:12.5px"><b>Mecanismo');
  const xs=st==='afazer'?R.af:st==='and'?R.and:(R.b[st]||[]);
  const opts=[['afazer','A fazer ('+N0(R.n)+')'],['aguardando','Aguardando arquitetura (A/P) ('+N0(R.b.aguardando.length)+')'],['andamento','Em andamento (A) ('+N0(R.b.andamento.length)+')'],['semst','Sem status ('+N0(R.b.semst.length)+')'],['feito','Já feitos (C) ('+N0(R.b.feito.length)+')'],['na','Não se aplica (N/A) ('+N0(R.b.na.length)+')'],['semlinha','Sem linha no Painel ('+N0(R.b.semlinha.length)+')'],['and','Todas as obras em andamento ('+N0(R.and.length)+')']];
  const props=o=>(S.db.propostas||[]).filter(p=>p.obra_id===o.id&&['vendida','em_obra','concluida','aprovada_cliente'].includes(p.estado)).map(p=>'#'+(p.numero||p.id));
  const rows=xs.map(o=>{const e=diagE(o);const k=pvK(o);return `<tr onclick="location.hash='#/prjobras/${J(o.id)}'" style="cursor:pointer"><td><b>${E(o.nome||o.id)}</b><div class="sub" style="font-size:11px">${E(props(o).slice(0,4).join(' · ')||'—')}${o.unidade?' · '+E(o.unidade):''}</div></td><td><span class="chip" style="border-left:4px solid ${PVK[k][1]}">${E(PVK[k][0])}</span></td><td class="mono">${e&&e.statusPainel?E(e.statusPainel):'—'}</td><td class="mono">${e?dBR(e.enviado):'—'}</td><td class="mono">${E(e&&e.rev||'—')}</td><td class="sub" style="font-size:12px">atualizar em Projetos › obra ›</td></tr>`}).join('');
  const sec=`<div class="mt-3"></div><div class="card p-3 mb-3"><div class="d-flex flex-wrap gap-2 align-items-center mb-2"><b style="font-size:15px">Diagramas de equipamentos · obras em andamento</b><select class="form-select form-select-sm ms-auto" style="max-width:320px" onchange="COP.ui.prevendas={st:this.value};render()">${opts.map(([v,l])=>`<option value="${v}"${v===st?' selected':''}>${E(l)}</option>`).join('')}</select></div>`+
    `<div class="sub mb-2" style="font-size:12px">Mostrando ${N0(xs.length)} de ${N0(R.and.length)} obras em andamento · o status vem do Painel de Controle (C pronto · A em andamento · A/P aguardando a arquitetura · N/A não se aplica)</div>`+
    `<div class="tblwrap"><table class="tbl"><thead><tr><th>Obra · propostas</th><th>Diagrama</th><th>Na planilha</th><th>Enviado</th><th>Rev</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="sub">nenhuma obra nesta situação</td></tr>'}</tbody></table></div></div>`;
  if(a>=0&&b>a)h=h.slice(0,a)+sec+h.slice(b);
  css();return h}
function ligaPv(){const f=T(()=>SCREENS.prevendas,null);if(typeof f!=='function'||f.__v161e)return !!(f&&f.__v161e);
  const W=function(){const d0=window.diagDe;/* desenhar a tela não cria mais registros */
    window.diagDe=p=>((S.db.prevendas_diag||[]).find(x=>x.proposta_id===p.id))||{proposta_id:p.id,status:'A fazer',rev:'',data:'',arquivos:[]};
    let h;try{h=f.apply(this,arguments)}finally{window.diagDe=d0}try{return telaPv(h)}catch(e){console.error('v161e prevendas',e);return h}};
  Object.keys(f).forEach(k=>{try{W[k]=f[k]}catch(e){}});W.__v161e=true;SCREENS.prevendas=W;return true}

/* ═════════════════════════ telas-resumo: as pontes no lugar ═════════════════════════ */
function wrap(k,post){const f=T(()=>SCREENS[k],null);if(typeof f!=='function'||f.__v161eP)return !!(f&&f.__v161eP);
  const W=function(arg){let h=f.apply(this,arguments);if(typeof h!=='string'||arg)return h;try{return post(h)}catch(e){console.error('v161e '+k,e);return h}};
  Object.keys(f).forEach(x=>{try{W[x]=f[x]}catch(e){}});W.__v161eP=true;SCREENS[k]=W;return true}
const andN=()=>T(()=>DR().obras().and.length,null);
/* "Das 81 obras em andamento" (Projetos): o mesmo número da Operação */
function mesmoAnd(h){const n=andN();if(n==null)return h;
  return h.replace(/Das [\d.]+ obras em andamento/g,`Das ${N0(n)} obras em andamento`).replace(/das [\d.]+ em andamento/g,`das ${N0(n)} em andamento`)
    .replace(/(por isso as linhas não somam (?:<a[^>]*>)?)[\d.]+/,`$1${N0(n)}`)}
function home(h){if(h.indexOf('id="v161e-mestra"')>=0)return h;h=mesmoAnd(h);
  const i=h.indexOf('v161d-op');let k=i>=0?h.indexOf('<div class="vx149-bars">',i):-1;if(k<0){const a=h.indexOf('Obras · ');k=a>=0?h.indexOf('<div class="vx149-bars">',a):-1}
  if(k>0)h=h.slice(0,k)+ponteMestra().replace('card p-3 mb-3','vx149-mini').replace('style=""','')+h.slice(k);
  /* Projetos: o Pré-vendas no Início (o mesmo número da tela) */
  const R=pv();const q=h.indexOf('Cada linha abre a lista do Painel de Projetos já filtrada.');
  if(q>0){const e=h.indexOf('</div>',q)+6;h=h.slice(0,e)+`<div class="vx149-mini v161e-pt" id="v161e-pvhome" data-n="${R.n}"><b>Pré-vendas</b> · ${pontePv(R)}</div>`+h.slice(e)}
  return h}
function copainel(h){if(h.indexOf('id="v161e-mestra"')>=0)return h;const i=h.indexOf('<div class="row');if(i<0)return h+ponteMestra();return h.slice(0,i)+ponteMestra()+h.slice(i)}
function prjpainel(h){if(h.indexOf('id="v161e-mestra"')>=0)return h;h=mesmoAnd(h);const i=h.indexOf('id="v161-ponte"');const s=i>=0?h.lastIndexOf('<div class="card',i):-1;
  if(s>=0)return h.slice(0,s)+ponteMestra()+h.slice(s);const k=h.indexOf('<div class="row');return k>=0?h.slice(0,k)+ponteMestra()+h.slice(k):h+ponteMestra()}
function gestao(h){if(h.indexOf('id="v161e-pvg"')>=0)return h;
  /* a faixa "Filtro aplicado" (F20 do v124) vira a etiqueta padrão da v161 */
  const F=S.negF;h=h.replace(/<div class="card p-2 mb-2 d-flex flex-row align-items-center gap-2" style="border-left:4px solid #0d6efd"><b>Filtro aplicado:<\/b> <span>([^<]*)<\/span>[\s\S]*?limpar filtro<\/a><\/div>/,(m0,desc)=>{
    const n=T(()=>(S.db.negociacoes||[]).filter(x=>negMatch(x,F)).length,null);const V=window.V161F;if(!V||!V.chipHTML)return m0;
    return V.chipHTML(`${n!=null?N0(n)+' negociações · ':''}${descF(F)||desc}`,'__negLimpar()','todos os números desta tela contam só estas negociações')});
  /* Pré-vendas na Gestão: o mesmo número da tela */
  const R=pv();const card=`<div class="card p-3 mb-3 v161e-card v161e-pt" id="v161e-pvg" data-n="${R.n}"><b style="font-size:12px;letter-spacing:.06em">PRÉ-VENDAS · diagramas de equipamentos</b><div>${pontePv(R)}</div></div>`;
  const k=h.indexOf('id="v146-obras"');const s=k>=0?h.lastIndexOf('<div class="card',k):-1;
  if(s>=0){let d=0;const re=/<div\b|<\/div>/g;re.lastIndex=s;let mm;while((mm=re.exec(h))){d+=mm[0]==='</div>'?-1:1;if(!d){const e=mm.index+6;return h.slice(0,e)+card+h.slice(e)}}}
  return h}

/* ═════════════════════════ §2 Comercial › Gestão: o painel antes do filtro ═════════════════════════ */
const RESLB={fechada:'fechadas',perdida:'perdidas',jogo:'em jogo',aberta:'abertas',decidida:'decididas',futuro:'no futuro'};
const KLB={consultor:'consultor',cons:'consultor',parc:'parceiro',etapa:'etapa',faixa:'chance',chance:'chance',frente:'frente',q:'busca'};
const descF=F=>Object.keys(F||{}).filter(k=>F[k]).map(k=>k==='res'?(RESLB[F[k]]||F[k]):(KLB[k]||k)+': '+F[k]).join(' · ');
function capNeg(code,el){const f0=S.negF;const ng=window.negGo;const W=window.V156;const nf=W&&W.negF;let F=null;
  try{window.negGo=i=>{S.negF=Object.assign({},(window.__ND||[])[i])};if(W)W.negF=G=>{const c=S.comF||{};S.negF=Object.assign({},c.frente?{frente:c.frente}:{},c.cons?{cons:c.cons}:{},G)};
    S.negF=null;new Function('event',String(code).replace(/(^|[^.\w])location\.hash\s*=/g,'$1void ')).call(el,{stopPropagation(){},preventDefault(){}});F=S.negF}catch(e){F=null}
  finally{window.negGo=ng;if(W)W.negF=nf;S.negF=f0}return F}
function capIr(code,el){const W=window.V156;if(!W||typeof W.ir!=='function')return null;const ir0=W.ir;let cap=null;
  try{W.ir=sp=>{cap=sp};new Function('event',code).call(el,{stopPropagation(){},preventDefault(){}})}catch(e){cap=null}finally{W.ir=ir0}return cap}
const negLb=n=>n.cliente_nome||n.codinome||n.id;
function tbNeg(xs){const t=document.createElement('table');
  t.innerHTML=`<thead><tr><th>Negociação</th><th>Situação</th><th>Consultor</th></tr></thead><tbody>${xs.map(n=>`<tr><td><b>${E(negLb(n))}</b></td><td>${E(n.resultado?String(n.resultado):(n.status_pipeline||n.etapa||'em jogo'))}</td><td>${E(n.consultor||'—')}</td></tr>`).join('')}</tbody>`;return t}
const NEGRE=/negGo\(|V156\.negF\(|S\.negF\s*=/,PROPRE=/V156\.gestaoProp\(/;
function gestaoClick(ev){if(ev.button||rk()!=='gestao')return;const t=ev.target;if(!t||!t.closest)return;const m=document.getElementById('main');if(!m||!m.contains(t))return;
  if(t.closest('#v155-ov,.vd-ov,select,input,textarea,[data-v161chip],.v161-chips'))return;
  const el=t.closest('[onclick]');if(!el||!m.contains(el)||el.tagName==='TR'||el.tagName==='BUTTON')return;
  const code=String(el.getAttribute('onclick')||'');const neg=NEGRE.test(code),prop=PROPRE.test(code);if(!neg&&!prop)return;
  const D=DR();if(typeof D.abrir!=='function'||typeof D.numLb!=='function')return;
  const nl=D.numLb(el);if(!nl||!nl.big)return;const nBig=/^\d[\d.]*$/.test(nl.big)?+nl.big.replace(/\./g,''):null;
  if(neg){const F=capNeg(code,el);if(!F)return;const xs=T(()=>(S.db.negociacoes||[]).filter(n=>negMatch(n,F)),null);if(!xs)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();const ds=descF(F);
    const lb0=String(nl.lb||'').trim();const lb=!ds?(lb0||'todas as negociações'):(!lb0||nz(ds).indexOf(nz(lb0))>=0?ds:lb0+' · '+ds);
    D.abrir({code,h:'#/gestao',tela:'Comercial › Gestão'+(ds?' · só estas negociações':''),big:nl.big,lb:lb.charAt(0).toUpperCase()+lb.slice(1),sub:'',tb:tbNeg(xs),vem:'Comercial › Gestão · Pipeline (aba Pipeline da To Do Comercial)',unid:'negociações',recs:[],
      ponte:nBig!=null&&nBig!==xs.length?`${N0(nBig)} no número · ${N0(xs.length)} negociações com este filtro`:''});return}
  const cap=capIr(code,el);if(!cap||!Array.isArray(cap.recs))return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  const tb=document.createElement('table');tb.innerHTML=`<thead><tr><th>Proposta</th></tr></thead><tbody>${cap.recs.map(r=>`<tr onclick="location.hash='${J(r.h||'')}'"><td><b>${E(r.name||(r.ids||[])[0]||'')}</b></td></tr>`).join('')}</tbody>`;
  D.abrir({code,h:cap.path,tela:T(()=>D.telaNome(cap.path),cap.path),big:nl.big,lb:nl.lb||cap.lb||'',sub:'',tb,vem:'Comercial › Gestão',unid:cap.unid||'propostas',recs:cap.recs,ponteLanding:cap.ponte||'',porque:cap.porque||'',
    ponte:nBig!=null&&nBig!==cap.recs.length?`${N0(nBig)} no número · ${N0(cap.recs.length)} na lista`:''})}
window.addEventListener('click',ev=>{try{gestaoClick(ev)}catch(e){console.error('v161e gestão',e)}},true);

/* ═════════════════════════ §3 menu da Operação + o número do Pré-vendas no menu ═════════════════════════ */
function ligaMenu(){const nav=T(()=>NAV,null);if(!Array.isArray(nav))return false;const ope=nav.find(s=>s.id==='ope');if(!ope||!Array.isArray(ope.items))return false;
  if(!T(()=>SCREENS.opeatividades,null))return false;
  if(!ope.items.some(([k])=>k==='opeatividades')){let i=ope.items.findIndex(([k])=>k==='copainel');if(i<0)i=ope.items.findIndex(([k])=>k==='obras');ope.items.splice(i>=0?i+1:ope.items.length,0,['opeatividades','Atividades'])}
  T(()=>{SEC_OF.opeatividades='ope'});T(()=>{LABEL.opeatividades='Atividades'});return true}
function ligaNav(){const rn=window.renderNav;if(typeof rn!=='function'||rn.__v161e)return !!(rn&&rn.__v161e);
  const W=function(){const r=rn.apply(this,arguments);try{const a=document.querySelector('#subnav a[href="#/prevendas"]');if(a&&!a.querySelector('.cnt')){const n=pv().n;if(n){const s=document.createElement('span');s.className='cnt';s.title='diagramas de equipamentos a fazer (obras em andamento)';s.textContent=N0(n);a.appendChild(s)}}}catch(e){}return r};
  W.__v161e=true;Object.keys(rn).forEach(k=>{try{W[k]=rn[k]}catch(e){}});window.renderNav=W;try{renderNav=W}catch(e){}return true}

/* ═════════════════════════ ligar ═════════════════════════ */
function liga(){let ok=true;
  ok=ligaPv()&&ok;ok=wrap('home',home)&&ok;ok=wrap('copainel',copainel)&&ok;ok=wrap('prjpainel',prjpainel)&&ok;ok=wrap('gestao',gestao)&&ok;ok=ligaMenu()&&ok;ok=ligaNav()&&ok;
  const D=DR();if(D.FONTES&&!D.FONTES.has('gestao'))D.FONTES.add('gestao');if(!D.FONTES)ok=false;
  return ok}
let tent=0;const iv=setInterval(()=>{let ok=false;try{ok=liga()}catch(e){console.error('v161e liga',e)}if(ok||++tent>80){clearInterval(iv);try{limpaBrancos()}catch(e){}try{renderNav()}catch(e){}try{const k=rk();if(['home','copainel','prjpainel','gestao','prevendas'].includes(k))renderMain()}catch(e){}}},250);
try{liga()}catch(e){}
})();
