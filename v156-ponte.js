/* =====================================================================================================
   v156 · PONTE — todo número clicável cai na tela de destino JÁ FILTRADO nos registros que o formam (05/11/2026)
   Regra do Bruno: clicar num número abre a tela de destino mostrando exatamente os registros daquele número; quando
   a lista de destino não tem algum deles, a diferença aparece NOMEADA na faixa ("205 = 203 nesta lista + 2 que esta
   lista não mostra: X · Y"), nunca como um vão sem explicação.
   O motor do filtro é o da v155 (gaveta → "Abrir na tela, já filtrado"), agora casando UM registro com UMA linha
   (id quando a linha tem id; senão o nome + as outras colunas). Aqui ficam:
     §1 V156.ir(spec) — a mesma faixa/filtro para portas que não passam por gaveta (ex.: Comercial › Gestão)
     §2 um clique = uma gaveta: num cartão clicável com um número clicável dentro, vale o número de dentro
     §3 Comercial › Gestão — propostas vendidas por linha / total (eram "status Aprovada + frente": 559 em vez de 72),
        fechadas por consultor / parceiro, obras por situação, interações do CRM
     §4 gavetas cujo destino não tem os registros (Pipeline mostra só as abertas → ganhas/perdidas vão para CRM ›
        Oportunidades, que lista todas)
     §5 demais painéis (Estoque › Painel Geral, Pós-venda, Pessoas, Projetos, Financeiro) — ver o fim do arquivo
   Só apresentação/navegação: nenhum dado, nenhuma regra de número muda.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v156)return;window.__v156=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const V=window.V156=window.V156||{};
const ano=()=>String((S.db.meta&&S.db.meta.ano)||new Date().getFullYear());

/* ───────── §1 ir: navega e filtra pelos registros ───────── */
/* spec = {path, nav(), recs:[{ids:[..], name, h}], lb, unid, ponte, porque} */
V.ir=function(spec){
  const ST=window.__V155D;if(!ST||!window.V155D){try{spec.nav()}catch(e){}return}
  /* registros lidos da própria tela de destino (quando a regra do número só existe nela) */
  if(typeof spec.recsAt==='function'&&!spec.recs){try{V155_limpar()}catch(e){}try{spec.nav()}catch(e){}const t0=Date.now();
    const iv=setInterval(()=>{const on=(location.hash||'').split('?')[0]===spec.path;let r=null;if(on)try{r=spec.recsAt()}catch(e){}
      if(r&&r.length){clearInterval(iv);V.ir(Object.assign({},spec,{recs:r,recsAt:null,ponte:spec.ponteF?spec.ponteF(r):spec.ponte,nav(){}}))}else if(Date.now()-t0>9000)clearInterval(iv)},300);return}
  try{V155_limpar()}catch(e){}
  const recs=(spec.recs||[]).map(r=>({ids:(r.ids||[]).map(String).filter(x=>x.length>=1),name:r.name||'',nn:String(r.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(),toks:r.toks||[],h:r.h||''}));
  const sp={path:spec.path,ids:[],names:[],recs,n:recs.length,lb:spec.lb,unid:spec.unid,ponte:spec.ponte,porque:spec.porque,t:Date.now(),t0:Date.now(),fixed:false};
  if(!sp.porque)try{V.ajusta(sp)}catch(e){}
  ST.sp=recs.length?sp:null;
  try{spec.nav()}catch(e){console.error('v156 nav',e);try{location.hash=spec.path}catch(_){}}
  if(!ST.sp)return;let i=0;const iv=setInterval(()=>{if(ST.sp!==sp||++i>40){clearInterval(iv);return}try{V155D.aplicar()}catch(e){}},500);
  setTimeout(()=>{try{V155D.aplicar()}catch(e){}},80)};
const go=(h)=>()=>{location.hash=h};
const propRec=p=>({ids:[p.id],name:(p.numero?'#'+p.numero+' · ':'')+(T(()=>(getRow('obras',p.obra_id)||{}).nome,'')||p.nome||p.cliente_nome||p.id),h:'#/editor/'+p.id});
V.propostas=function(ps,lb,nativo){V.ir({path:'#/propostas',lb,unid:'propostas',recs:ps.map(propRec),
  nav(){try{S.propF=Object.assign({st:'',fr:'',q:'',cons:'',ym:'',fil:'',vano:''},nativo||{})}catch(e){}location.hash='#/propostas';try{renderMain()}catch(e){}}})};

/* ───────── §2 um clique, uma gaveta: o número de dentro ganha do cartão de fora ───────── */
function envolve(){const O=window.V130_open;if(typeof O!=='function'||O.__v156)return false;
  const W=function(k,a){try{const ev=window.event;if(ev&&ev.type==='click'){if(ev.__v156o)return;ev.__v156o=1}}catch(e){}V.ult={k:String(k),a:a==null?null:a,t:Date.now()};return O.apply(this,arguments)};
  W.__v156=true;window.V130_open=W;return true}
if(!envolve()){let n=0;const iv=setInterval(()=>{if(envolve()||++n>60)clearInterval(iv)},500)}

/* ───────── §3 Comercial › Gestão ───────── */
const LINLB={taag_sp:'TAAG · São Paulo',taag_rj:'TAAG · Rio de Janeiro',acustica:'Acústica',focal:'Focal (FPBN)',posvenda:'Pós-venda (AT)',outra:'Sem linha'};
const fil=p=>T(()=>FIL.daProposta(p),'');
const temCons=(p,c)=>!c||(p.consultores||[]).some(x=>String(x).toLowerCase().includes(String(c).toLowerCase().split(' ')[0]));
const linhaK=p=>p.linha==='taag'?(fil(p)==='RJ'?'taag_rj':'taag_sp'):(p.linha||'outra');
/* as mesmas propostas que o bloco verde da Gestão conta (v146): vendidas no ano, sem demonstração, no filtro de frente/consultor */
function vendGestao(){const f=S.comF||{};const gs=S.gSub||'geral';
  let v=(S.db.propostas||[]).filter(p=>(!f.frente||p.linha===f.frente)&&temCons(p,f.cons)).filter(p=>['vendida','em_obra','concluida'].includes(p.estado)&&!p.demo&&String(p.vendida_em||'').startsWith(ano()));
  if(gs==='boutique')v=v.filter(p=>p.linha==='focal');return v}
V.gestaoProp=function(k){const f=S.comF||{};const vend=vendGestao();const ps=k?vend.filter(p=>linhaK(p)===k):vend;
  const lb=N0(ps.length)+' · propostas vendidas '+ano()+(k?' · '+(LINLB[k]||k):'')+(f.cons?' · '+f.cons:'');
  const fr=k?(k.startsWith('taag')?'taag':k):((S.gSub==='boutique')?'focal':(f.frente||''));
  V.propostas(ps,lb,{fr,fil:k==='taag_sp'?'SP':k==='taag_rj'?'RJ':'',vano:ano()})};
/* fechadas por consultor / parceiro: o mesmo filtro de negociações que os outros números da Gestão usam */
V.negF=function(F){const c=S.comF||{};try{S.negF=Object.assign({},c.frente?{frente:c.frente}:{},c.cons?{cons:c.cons}:{},F)}catch(e){}location.hash='#/negs'};
V.rolar=function(sel){try{const el=document.querySelector(sel);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.transition='box-shadow .3s';el.style.boxShadow='0 0 0 3px rgba(13,110,253,.35)';setTimeout(()=>el.style.boxShadow='',1400)}}catch(e){}};
V.obrasSit=function(sit){const O=S.db.obras||[];const xs=sit==null?O:O.filter(o=>(o.situacao||o.statusPlanilha||'sem situação')===sit);
  V.ir({path:'#/obras',lb:N0(xs.length)+' · obras'+(sit?' · '+sit:''),unid:'obras',recs:xs.map(o=>({ids:[o.id],name:o.nome||o.id,h:'#/obras/'+o.id})),
    nav(){try{COP.ui.obrasTab='obras'}catch(e){}try{if(COP.ope&&COP.ope.go){COP.ope.go('obras',{situacao:sit||''},'#/obras');return}}catch(e){}try{COP.ui.obras={situacao:sit||''}}catch(e){}location.hash='#/obras'}})};
const CRMV={oport:'oportunidades',interacoes:'interacoes',tarefas:'tarefas',parceiros:'parceiros'};
V.crmParams=function(view,params){const t0=Date.now();const iv=setInterval(()=>{try{const w=document.getElementById('crmFrame').contentWindow;
    if(w&&w.eval('typeof VIEW')==='object'&&w.eval('VIEW.name')===view){const P=w.eval('VIEW.params')||{};if(Object.keys(params).some(k=>P[k]!==params[k]))w.eval('VIEW.params=Object.assign(VIEW.params||{},'+JSON.stringify(params)+');render()')}}catch(e){}
    if(Date.now()-t0>7000)clearInterval(iv)},350)};
V.crm=function(view){location.hash='#/crm'+view;setTimeout(()=>{try{const f=document.getElementById('crmFrame');f&&f.contentWindow&&f.contentWindow.go&&f.contentWindow.go(CRMV[view]||view)}catch(e){}},600)};

const PORTA_RE=/onclick="S\.propF=\{st:'aprovada'(?:,fr:'[a-z_]*')?\};location\.hash='#\/propostas';renderMain\(\)"/g;
function gestaoHTML(h){if(typeof h!=='string')return h;
  /* 3a) bloco verde: total + uma porta por linha, na ordem em que o v146 as escreve */
  const i0=h.indexOf('id="v146-propostas"');
  if(i0>=0){const i1=h.indexOf('id="v146-obras"',i0);const end=i1>0?i1:h.length;let card=h.slice(i0,end);
    const vend=vendGestao();const g={};vend.forEach(p=>{const k=linhaK(p);g[k]=1});const ord=['taag_sp','taag_rj','acustica','focal','posvenda','outra'].filter(k=>g[k]);
    const seq=['',''].concat(ord);ord.forEach(k=>seq.push(k,k));let n=0;
    card=card.replace(PORTA_RE,()=>{const k=seq[n++];return `onclick="event.stopPropagation();V156.gestaoProp('${k||''}')"`});
    /* o R$ do total (a v138 mandava para a DRE): é o valor das mesmas propostas */
    card=card.replace(/(<span>propostas · )<b>(R\$[^<]*)<\/b>/,`$1<a href="javascript:void 0" class="vx-door" onclick="event.stopPropagation();V156.gestaoProp('')"><b>$2</b></a>`);
    h=h.slice(0,i0)+card+h.slice(end)}
  /* 3b) obras por situação (iam todas para a lista inteira) */
  const o0=h.indexOf('id="v146-obras"');
  if(o0>=0){const o1=h.indexOf('</div></div>',o0);const end=o1>0?o1:h.length;let c=h.slice(o0,end);
    c=c.replace(/<a href="#\/obras" class="vx-door">(\d[\d.]*) ([^<]+)<\/a>/g,(m,nn,sit)=>{const s=sit.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');return `<a href="javascript:void 0" class="vx-door" onclick="event.stopPropagation();V156.obrasSit('${J(s)}')">${nn} ${sit}</a>`});
    c=c.replace(/<a href="#\/obras" class="vx-door">(\d[\d.]*)<\/a>/,`<a href="javascript:void 0" class="vx-door" onclick="event.stopPropagation();V156.obrasSit(null)">$1</a>`);
    h=h.slice(0,o0)+c+h.slice(end)}
  /* 3b2) KPIs do topo: "OBRAS 359" (abria Obras nas ativas = 95) e "VENDIDO 2026" (sem porta) */
  h=h.replace(/<a href="#\/obras" class="vx-door">(\d[\d.]*)<\/a>/g,`<a href="javascript:void 0" class="vx-door" onclick="event.stopPropagation();V156.obrasSit(null)">$1</a>`);
  h=h.replace(/(VENDIDO \d{4}<\/div>)<div style="font-size:24px;font-weight:800">([^<]*)<\/div>/,`$1<div style="font-size:24px;font-weight:800;cursor:pointer;text-decoration:underline dotted" onclick="event.stopPropagation();V156.gestaoProp('')" title="abrir as propostas vendidas no ano">$2</div>`);
  /* 3c) KPI "Ações de relacionamento" = interações do CRM → CRM › Interações (ia para #/hoje) */
  h=h.replace(/(<div[^>]*onclick=")event\.stopPropagation\(\);location\.hash='#\/hoje'("[^>]*>\s*\d[\d.]*\s*<\/div><div class="sub" style="font-size:11px">interações do CRM)/,`$1event.stopPropagation();V156.crm('interacoes')$2`);
  /* 3d) "264 negociações fechadas" · fechadas por consultor / parceiro */
  h=h.replace(/<b style="font-size:28px;color:#198754">(\d[\d.]*)<\/b> <b>negociações fechadas<\/b>/,`<b style="font-size:28px;color:#198754;cursor:pointer;text-decoration:underline dotted" onclick="event.stopPropagation();V156.negF({res:'fechada'})" title="abrir as negociações fechadas">$1</b> <b>negociações fechadas</b>`);
  h=h.replace(/<span class="text-center"><b style="font-size:18px">(\d[\d.]*)<\/b><div class="sub" style="font-size:10px">(consultores|parceiros)<\/div><\/span>/g,(m,nn,w)=>`<span class="text-center" style="cursor:pointer" onclick="event.stopPropagation();V156.rolar('[data-v156l=${w}]')" title="ver a lista por ${w==='consultores'?'consultor':'parceiro'} logo abaixo"><b style="font-size:18px;text-decoration:underline dotted">${nn}</b><div class="sub" style="font-size:10px">${w}</div></span>`);
  ['CONSULTOR','PARCEIRO'].forEach(W=>{const mk='letter-spacing:.06em">FECHADAS POR '+W+'</div>';let a=h.indexOf(mk);if(a<0)return;
    const b=h.indexOf('<div class="col-md-6">',a);const z=b>0?b:(h.indexOf('</div></div></div>',a)>0?h.indexOf('</div></div></div>',a):h.length);
    let blk=h.slice(a,z);const fk=W==='CONSULTOR'?'consultor':'parc';
    blk=blk.replace(/<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px"><span style="([^"]*)" title="([^"]*)">([^<]*)<\/span>([\s\S]*?)<b style="width:70px;text-align:right">(\d[\d.]*)<\/b><\/div>/g,(m,st,ti,lb,mid,nn)=>{const v=ti.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
      return `<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();V156.negF({res:'fechada',${fk}:'${J(v)}'})" title="abrir as ${nn} negociações fechadas de ${E(v)}"><span style="${st}" title="${ti}">${lb}</span>${mid}<b style="width:70px;text-align:right;text-decoration:underline dotted">${nn}</b></div>`});
    blk=blk.replace(mk,mk.replace('">FECHADAS','" data-v156l="'+(W==='CONSULTOR'?'consultores':'parceiros')+'">FECHADAS'));
    h=h.slice(0,a)+blk+h.slice(z)});
  /* 3e) gráficos de barras / legendas da Gestão (Comercial, RP, Visão Geral): cada número abre as negociações dele */
  const DEC=v=>String(v).replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  const PAN=[['FLUXO &amp; VOLUME · negociações por consultor','consultor',{}],['FLUXO & VOLUME · negociações por consultor','consultor',{}],['INDICAÇÕES POR PARCEIRO','parc',{}],['POR CONSULTOR</b><span class="sub" style="font-size:11px">Top 8','consultor',{}],
    ['POR ESCRITÓRIO PARCEIRO','parc',{}],['POR CLIENTE','cliente',{}],['POR TIPO</b><span class="sub" style="font-size:11px">11 tipos','tipo',{}],['PROPOSTAS POR MOTIVO (PERDAS)','motivo',{res:'perdida'}],
    ['CONTATOS POR MÊS','actm',{}],['POR RESULTADO','acto',{}]];
  const barRe=/<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px"><span style="([^"]*)" title="([^"]*)">([^<]*)<\/span>([\s\S]*?)<b style="width:70px;text-align:right">(\d[\d.]*)<\/b><\/div>/g;
  const bloco=(mk,fn)=>{let a=h.indexOf(mk);while(a>=0){const z0=h.indexOf('<div class="card p-3',a+mk.length);const z=z0>0?z0:h.length;const seg=h.slice(a,z);const ns=fn(seg);h=h.slice(0,a)+ns+h.slice(z);a=h.indexOf(mk,a+ns.length)}};
  const MES={jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12'};
  PAN.forEach(([t,k,base])=>bloco(t,seg=>seg.replace(barRe,(m,st,ti,lb,mid,nn)=>{if(!+nn.replace(/\./g,''))return m;let v=DEC(ti);
      if(k==='actm'){const mm=/^(\d{4})-(\d{2})$/.exec(v);if(!mm&&v!=='—')return m}
      const F=Object.assign({},base,{[k]:v});return `<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();V156.negF(${E(JSON.stringify(F)).replace(/&quot;/g,"&quot;")})" title="abrir as ${nn} negociações"><span style="${st}" title="${ti}">${lb}</span>${mid}<b style="width:70px;text-align:right;text-decoration:underline dotted">${nn}</b></div>`})));
  /* legendas "<b>27</b> · Desenvolver proposta" (Pipeline por status) e "<b>291</b> · Edson" (RP · por responsável) */
  const ETQ={};T(()=>ETAPAS_DEAL,[]).forEach(([k,l])=>ETQ[l]=k);
  const leg=(mk,fn)=>bloco(mk,seg=>seg.replace(/<div><b>(\d[\d.]*)<\/b> · ([^<]+)<\/div>/g,(m,nn,l)=>{if(!+nn.replace(/\./g,''))return m;const F=fn(DEC(l).trim());if(!F)return m;
    return `<div style="cursor:pointer" onclick="event.stopPropagation();V156.negF(${E(JSON.stringify(F))})" title="abrir as ${nn} negociações"><b style="text-decoration:underline dotted">${nn}</b> · ${l}</div>`}));
  leg('PIPELINE POR STATUS',l=>ETQ[l]?{res:'jogo',etapa:ETQ[l]}:l==='Fechadas'?{res:'fechada'}:l==='Perdidas'?{res:'perdida'}:null);
  leg('>POR RESPONSÁVEL</b><span class="sub" style="font-size:11px"></span></div><div class="mt-2"><div class="d-flex gap-2 align-items-center"><svg',l=>({consultor:l}));
  /* 3f) Propostas por status / por tipo → a lista de Propostas com exatamente essas */
  const APL={};T(()=>Object.entries(APROV_LB),[]).forEach(([k,[l]])=>APL[l]=k);
  bloco('PROPOSTAS POR STATUS',seg=>seg.replace(/<div><b>(\d[\d.]*)<\/b> · ([^<]+)<\/div>/g,(m,nn,l)=>{const k=APL[DEC(l).trim()];if(!k||!+nn.replace(/\./g,''))return m;
    return `<div style="cursor:pointer" onclick="event.stopPropagation();V156.propSt('${k}')" title="abrir as ${nn} propostas"><b style="text-decoration:underline dotted">${nn}</b> · ${l}</div>`}));
  bloco('PROPOSTAS POR TIPO',seg=>seg.replace(barRe,(m,st,ti,lb,mid,nn)=>{if(!+nn.replace(/\./g,''))return m;
    return `<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();V156.propTipo('${J(DEC(ti))}')" title="abrir as ${nn} propostas"><span style="${st}" title="${ti}">${lb}</span>${mid}<b style="width:70px;text-align:right;text-decoration:underline dotted">${nn}</b></div>`}));
  /* 3g) bloco do CRM (v146): cada número abre a lista do CRM filtrada nos registros dele */
  const c0=h.indexOf('id="v146-crm"');if(c0>=0){const c1=h.indexOf('Os mesmos números do CRM',c0);const end=c1>0?c1:h.length;let c=h.slice(c0,end);
    const ks=['inter','pend','atr','parc'];let i=0;
    c=c.replace(/<a href="javascript:void 0" class="vx-door" onclick="location\.hash='#\/crmhome';setTimeout\(\(\)=>\{try\{const f=document\.getElementById\('crmFrame'\);f&&f\.contentWindow&&f\.contentWindow\.go&&f\.contentWindow\.go\('[a-z]+'\)\}catch\(e\)\{\}\},600\)">/g,()=>`<a href="javascript:void 0" class="vx-door" onclick="event.stopPropagation();V156.crmN('${ks[i++]||'inter'}')">`);
    c=c.replace(/<span style="width:60px">(\d{2})\/(\d{2})<\/span>([\s\S]*?)<b style="width:40px;text-align:right">(\d+)<\/b>/g,(m,mm,yy,mid,nn)=>`<span style="width:60px;cursor:pointer" onclick="event.stopPropagation();V156.crmN('mes','20${yy}-${mm}')">${mm}/${yy}</span>${mid}<b style="width:40px;text-align:right;cursor:pointer;text-decoration:underline dotted" onclick="event.stopPropagation();V156.crmN('mes','20${yy}-${mm}')">${nn}</b>`);
    c=c.replace(/<div class="d-flex justify-content-between" style="font-size:12px"><span>([^<]*)<\/span><b>(\d+)<\/b><\/div>/g,(m,r,nn)=>`<div class="d-flex justify-content-between" style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();V156.crmN('resp','${J(DEC(r))}')"><span>${r}</span><b style="text-decoration:underline dotted">${nn}</b></div>`);
    h=h.slice(0,c0)+c+h.slice(end)}
  return h}
const subProps=()=>{const f=S.comF||{};return (S.db.propostas||[]).filter(p=>(!f.frente||p.linha===f.frente)&&temCons(p,f.cons))};
V.propSt=function(k){const ps=subProps().filter(p=>((p.aprov&&p.aprov.status)||'em_andamento')===k);const l=T(()=>APROV_LB[k][0],k);V.propostas(ps,N0(ps.length)+' · propostas · '+l,{st:k})};
V.propTipo=function(t){const F={Projeto:p=>p.produto==='projeto',Sistema:p=>p.produto!=='projeto'&&p.linha==='taag','Acústica':p=>p.linha==='acustica',Upgrade:p=>p.linha==='posvenda',Equipamento:p=>p.linha==='focal'}[t]||(()=>false);
  const ps=subProps().filter(F);V.propostas(ps,N0(ps.length)+' · propostas · '+t,{})};
/* CRM: interações / próximas ações / parceiros, pelos ids do CRM */
V.crmN=function(k,a){const t=window.CRM_T||{};const hoje=T(()=>today(),new Date().toISOString().slice(0,10));const pn={};(S.db.parceiros||[]).forEach(p=>{if(p.crm_id!=null)pn[String(p.crm_id)]=p.nome});
  const iRec=i=>({ids:[String(i.id)],name:pn[String(i.parceiro_id)]||('Parceiro '+i.parceiro_id),toks:[]});
  if(k==='inter'||k==='mes'||k==='resp'){let xs=t.interacoes||[];let lb='interações do CRM';if(k==='mes'){xs=xs.filter(i=>String(i.data||'').slice(0,7)===a);lb+=' · '+a.slice(5)+'/'+a.slice(2,4)}if(k==='resp'){xs=xs.filter(i=>(i.responsavel||'—')===a);lb+=' · '+a}
    /* a lista do CRM abre nos últimos 3 meses: o período vira o das interações do número */
    const ds=xs.map(i=>String(i.data||'').slice(0,10)).filter(Boolean).sort();const per={de:ds[0]||'',ate:ds[ds.length-1]||''};
    V.ir({path:'#/crminteracoes',lb:N0(xs.length)+' · '+lb,unid:'interações',recs:xs.map(iRec),nav(){V.crm('interacoes');V.crmParams('interacoes',per)}});return}
  if(k==='pend'||k==='atr'){let xs=(t.tarefas||[]).filter(x=>x.status==='pendente');if(k==='atr')xs=xs.filter(x=>String(x.data_prevista||'').slice(0,10)<hoje);
    V.ir({path:'#/crmtarefas',lb:N0(xs.length)+' · '+(k==='atr'?'próximas ações atrasadas':'próximas ações pendentes'),unid:'ações',recs:xs.map(x=>({ids:[String(x.id)],name:pn[String(x.parceiro_id)]||('Parceiro '+x.parceiro_id)})),nav(){V.crm('tarefas')}});return}
  if(k==='parc'){const ps=(S.db.parceiros||[]).filter(p=>!p.inativo&&!p.crm_fora_planilha);V.ir({path:'#/crmparceiros',lb:N0(ps.length)+' · parceiros',unid:'parceiros',recs:ps.map(p=>({ids:p.crm_id!=null?[String(p.crm_id)]:[],name:p.nome})),nav(){V.crm('parceiros')}})}};
function ligaGestao(){if(typeof SCREENS!=='object'||typeof SCREENS.gestao!=='function')return false;if(SCREENS.gestao.__v156)return true;
  const g0=SCREENS.gestao;const W=function(){const h=g0.apply(this,arguments);try{return gestaoHTML(h)}catch(e){console.error('v156 gestao',e);return h}};W.__v156=true;
  Object.keys(g0).forEach(k=>{try{W[k]=g0[k]}catch(e){}});W.__v156=true;SCREENS.gestao=W;return true}

/* "Fechadas por consultor" agrupa pelo campo consultor exato ("Edson Tostes Freitas" 96); o filtro cons do negMatch
   conta também as negociações divididas ("André + Halef") — 99. A chave "consultor" filtra pelo campo exato. */
function ligaNeg(){const f=window.negMatch;if(typeof f!=='function')return false;if(f.__v156)return true;
  const EX={consultor:n=>String(n.consultor||'—'),cliente:n=>String(n.cliente_nome||'—'),tipo:n=>String(n.tipo||''),motivo:n=>String(n.motivo||'')};
  const ACT=/Conversamos|Adiado|Indicou|Oportunidade recebida/;
  const w=function(n,F){if(!F)return f.apply(this,arguments);const ks=Object.keys(F).filter(k=>F[k]!=null&&F[k]!==''&&(EX[k]||k==='acto'||k==='actm'));if(!ks.length)return f.apply(this,arguments);
    for(const k of ks){if(EX[k]){if(EX[k](n)!==String(F[k]))return false}
      else{const acts=(n.timeline||[]).filter(x=>ACT.test(x.o||''));if(k==='acto'&&!acts.some(x=>String(x.o||'').replace(/ —.*/,'')===F.acto))return false;if(k==='actm'&&!acts.some(x=>(String(x.data||'').slice(0,7)||'—')===F.actm))return false}}
    const G=Object.assign({},F);ks.forEach(k=>delete G[k]);return f.call(this,n,G)};w.__v156=1;window.negMatch=w;return true}
/* Pipeline: o cartão "No futuro" abria as em jogo (res:'jogo') */
function ligaPipeline(){if(typeof SCREENS!=='object'||typeof SCREENS.pipeline!=='function')return false;if(SCREENS.pipeline.__v156)return true;
  const p0=SCREENS.pipeline;const W=function(){let h=p0.apply(this,arguments);if(typeof h!=='string')return h;
    return h.replace(/onclick="S\.negF=\{res:'jogo'\};location\.hash='#\/negs'"([^>]*>\s*<div class="sub"[^>]*>No futuro)/,`onclick="S.negF={res:'futuro'};location.hash='#/negs'"$1`)};
  Object.keys(p0).forEach(k=>{try{W[k]=p0[k]}catch(e){}});W.__v156=true;SCREENS.pipeline=W;return true}

/* ───────── §4 gavetas cujo destino não lista os registros ───────── */
/* chamado pela v155 ao clicar "Abrir na tela, já filtrado"; true = a v156 cuidou */
V.painel=function(D,ctx){const u=V.ult||{};const recente=Date.now()-(u.t||0)<10*60e3;if(!recente)return false;
  const rd=window.V155D&&V155D.recsDe;if(!rd)return false;const recs=rd(D.tabs);
  const lb=txtOf(D.big)+' · '+txtOf(D.lb);
  /* negociações já decididas / no futuro: o quadro do Pipeline só mostra as abertas → CRM › Oportunidades lista todas */
  if(u.k==='v149:neg'&&!/(^|&)res=aberta(&|$)/.test(String(u.a||''))){ctx.tirar();
    V.ir({path:'#/crmoport',lb,unid:'negociações',recs,nav(){V.crm('oport')}});return true}
  /* "Parceiros 345" (gaveta por situação): o número conta parceiros, não situações → CRM › Parceiros com os 345 */
  if(u.k==='parc'){const ps=(S.db.parceiros||[]);ctx.tirar();
    V.ir({path:'#/crmparceiros',lb,unid:'parceiros',recs:ps.map(p=>({ids:p.crm_id!=null&&p.crm_id!==''?[String(p.crm_id)]:[],name:p.nome||p.id})),nav(){V.crm('parceiros')}});return true}
  return false};
/* o porquê da ponte, quando a diferença tem uma causa conhecida nos dados */
V.ajusta=function(sp){if(!sp||!sp.recs)return;if(/^#\/crmparceiros/.test(sp.path)){const fora=new Set((S.db.parceiros||[]).filter(p=>p.crm_fora_planilha).map(p=>String(p.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()));
  const n=sp.recs.filter(r=>fora.has(r.nn)).length;if(n)sp.porque=`${n} estão no sistema marcados "fora da planilha do CRM" — a lista do CRM só mostra a planilha`}};
const txtOf=h=>{const d=document.createElement('div');d.innerHTML=h||'';return String(d.textContent||'').replace(/\s+/g,' ').trim()};

/* ───────── portas que as camadas de DOM desenham depois do render ───────── */
const POS=[];V.pos=POS;
POS.push(()=>{if(!/^#\/gestao/.test(location.hash))return;
  document.querySelectorAll('#main [onclick*="#/hoje"]').forEach(e=>{const s=e.nextElementSibling;if(s&&/interações do CRM/.test(s.textContent||'')&&!e.__v156){e.__v156=1;e.setAttribute('onclick',"event.stopPropagation();V156.crm('interacoes')");e.title='abrir CRM › Interações'}})});
let posQ=false;const posRun=()=>{posQ=false;POS.forEach(f=>{try{f()}catch(e){console.error('v156 pos',e)}})};
try{new MutationObserver(()=>{if(posQ)return;posQ=true;setTimeout(posRun,30)}).observe(document.body||document.documentElement,{childList:true,subtree:true})}catch(e){}
window.addEventListener('hashchange',()=>setTimeout(posRun,80));


/* Gestão / Pipeline: as portas negGo das legendas "por status" e das barras por consultor usam o filtro "cons" (consultor
   contido, conta as divididas) ou chutam "parc" para um nome de consultor ("AT", "Isabela + Renata Campos" → 0). Cada porta
   agora se confere: se o filtro dela não dá o número mostrado, troca pelo filtro do campo exato que dá. */
POS.push(()=>{if(!/^#\/(gestao|pipeline|negs)/.test(location.hash))return;const ND=window.__ND||[];const c=S.comF||{};
  const cnt=G=>{const M=Object.assign({},c.frente?{frente:c.frente}:{},c.cons?{cons:c.cons}:{},G);return (S.db.negociacoes||[]).filter(x=>negMatch(x,M)).length};
  document.querySelectorAll('#main [onclick*="negGo("]').forEach(e=>{if(e.__v156n)return;e.__v156n=1;const m=/negGo\((\d+)\)/.exec(e.getAttribute('onclick')||'');if(!m)return;const F=ND[+m[1]];if(!F||!(F.cons||F.parc))return;
    const t=(e.textContent||'').trim();if(/%|R\$/.test(t))return;const shown=+t.replace(/\D/g,'');if(!shown)return;
    const own=Object.assign({},F);if(c.frente&&own.frente===c.frente)delete own.frente;if(c.cons&&own.cons===c.cons)delete own.cons;
    if(cnt(own)===shown)return;const alts=[];const sem=(o,k)=>{const x=Object.assign({},o);delete x[k];return x};
    if(F.cons)alts.push(Object.assign(sem(own,'cons'),{consultor:F.cons}));if(F.parc)alts.push(Object.assign(sem(own,'parc'),{consultor:F.parc}));
    const G=alts.find(a=>cnt(a)===shown);if(G)e.setAttribute('onclick',`event.stopPropagation();V156.negF(${JSON.stringify(G)})`)})});

/* Início › Operações: "72 em andamento · 85 ativas" e a ponte "82 em andamento = 72 SP + 10 RJ" abriam as 85 ATIVAS de SP */
POS.push(()=>{if(!/^#\/(home|inicio)?$/.test((location.hash||'#/home').split('?')[0])&&!/^#\/home/.test(location.hash))return;
  document.querySelectorAll('#main [onclick*="situacao:\'ativas\',unidade:"]').forEach(e=>{if(e.__v156)return;const t=(e.textContent||'').replace(/\s+/g,' ').trim();
    if(!(/^\d[\d.]* (SP|RJ)$/.test(t)||/em andamento/.test(t)))return;e.__v156=1;e.setAttribute('onclick',e.getAttribute('onclick').replace("situacao:'ativas'","situacao:'Em andamento'"))})});

/* ───────── §5 Estoque ───────── */
/* 5a) o filtro de situação da lista do Estoque (S.estSit / página do lugar) voltou a ser o antigo — "livre" pegava 729
   unidades (303 produtos) e "da empresa" 0 — enquanto a tabela de cima conta 441 e 176 pela situação canônica. A v141
   já corrigia isso, mas uma camada posterior reescreve window.__fMatch. Aqui a correção fica presa ao nome. */
(function(){const wrap=f=>{if(typeof f!=='function'||f.__v156)return f;const w=function(u,k){if(k==='terceiro'||k==='empresa'||k==='alocado'||k==='livre'){const s=T(()=>situacao(u),null);return k==='livre'?['livre','reservado','sem_proposito'].includes(s):s===k}return f.apply(this,arguments)};w.__v156=1;w.__v141=1;return w};
  let cur=wrap(window.__fMatch);try{Object.defineProperty(window,'__fMatch',{configurable:true,get(){return cur},set(v){cur=wrap(v)}})}catch(e){window.__fMatch=cur}})();
/* 5b) número de unidades → a lista de produtos do Estoque, filtrada nos produtos dessas unidades */
const nomeP=pid=>T(()=>{const p=getRow('produtos',pid)||get('produtos',pid)||{};return (p.nome||pid)+(p.marca?' · '+p.marca:'')},pid);
const unidadesDe=k=>{const us=T(()=>nodeUnits(null),[])||[];const sit=u=>T(()=>situacao(u),'');
  if(k==='*')return us;if(k==='vendavel')return us.filter(u=>['livre','reservado','sem_proposito','alocado'].includes(sit(u)));
  if(k==='nao_venda')return us.filter(u=>['terceiro','empresa'].includes(sit(u))||u.estado==='conferencia');
  if(k==='livre')return us.filter(u=>['livre','reservado','sem_proposito'].includes(sit(u)));return us.filter(u=>sit(u)===k)};
V.estoque=function(k,lbTxt){const us=unidadesDe(k);const g={};us.forEach(u=>{(g[u.produto_id]=g[u.produto_id]||[]).push(u)});
  const pids=Object.keys(g);const LB={'*':'unidades no estoque',vendavel:'vendáveis (livre + separado)',nao_venda:'não estão à venda',livre:'livres',alocado:'separadas',terceiro:'de terceiro (consignado)',empresa:'da empresa (patrimônio)'};
  V.ir({path:'#/estoque',lb:N0(us.length)+' un. · '+(lbTxt||LB[k]||k),unid:'produtos',ponte:`${N0(us.length)} un. em ${N0(pids.length)} produtos (a coluna Qtd é o total do produto)`,
    recs:pids.map(pid=>({ids:[pid],name:nomeP(pid),h:'#/produto/'+pid})),
    nav(){try{S.estCat=null;S.estSit=null;S.plF={}}catch(e){}location.hash='#/estoque';try{renderMain()}catch(e){}}})};
POS.push(()=>{if(!/^#\/epainel/.test(location.hash))return;const m=document.getElementById('main');if(!m)return;
  /* bolha "ESTOQUE VENDÁVEL" (abria a lista inteira) */
  m.querySelectorAll('a.card[href="#/estoque"]').forEach(a=>{if(a.__v156||!/^ESTOQUE VENDÁVEL/i.test((a.textContent||'').trim()))return;a.__v156=1;a.setAttribute('href','javascript:void 0');a.setAttribute('onclick',"event.preventDefault();V156.estoque('vendavel')")});
  /* linha "Total" de POR INVENTÁRIO: total / livre / não à venda abriam a lista inteira */
  m.querySelectorAll('[onclick*="location.hash=\'#/estoque\'"]').forEach(e=>{if(e.__v156)return;const oc=e.getAttribute('onclick')||'';if(/estCat|estSit/.test(oc))return;
    const td=e.closest('td');const tr=e.closest('tr');const tb=e.closest('table');if(!td||!tr||!tb)return;const i=[...tr.children].indexOf(td);const th=[...tb.querySelectorAll('thead th')][i];const h=th?(th.textContent||'').trim().toUpperCase():'';
    const k=/^TOTAL/.test(h)?'*':/^LIVRE/.test(h)?'livre':/N[ÃA]O À VENDA/.test(h)?'nao_venda':/SEPARADO/.test(h)?'alocado':null;if(!k)return;e.__v156=1;e.setAttribute('onclick',`event.stopPropagation();V156.estoque('${k}')`)});
  /* "Patrimônio 176" e os outros motivos de "não à venda" usam o filtro da lista (agora certo); nada a trocar */});

/* 5c) Financeiro › Hoje › PATRIMÔNIO (abria Dívidas, que está vazia): o patrimônio é caixa + estoque nosso a custo − dívidas → as unidades nossas */
V.patrimonio=function(ponte){const us=unidadesDe('*').filter(u=>T(()=>situacao(u),'')!=='terceiro');const g={};us.forEach(u=>{(g[u.produto_id]=g[u.produto_id]||[]).push(u)});const pids=Object.keys(g);
  V.ir({path:'#/estoque',lb:'Patrimônio · '+N0(us.length)+' un. nossas (estoque a custo)',unid:'produtos',ponte:(ponte?ponte+' · ':'')+`${N0(us.length)} un. em ${N0(pids.length)} produtos`,
    recs:pids.map(pid=>({ids:[pid],name:nomeP(pid),h:'#/produto/'+pid})),nav(){try{S.estCat=null;S.estSit=null;S.plF={}}catch(e){}location.hash='#/estoque';try{renderMain()}catch(e){}}})};
POS.push(()=>{if(!/^#\/fhoje/.test(location.hash))return;document.querySelectorAll('#main a[href="#/fcontas/dividas"]').forEach(a=>{if(a.__v156||!/^PATRIM[ÔO]NIO/i.test((a.textContent||'').trim()))return;a.__v156=1;
  const sub=[...a.querySelectorAll('div,span')].map(x=>(x.textContent||'').replace(/\s+/g,' ').trim()).find(t=>/^caixa R\$/.test(t))||'';a.setAttribute('data-v156p',sub.replace(/\s*\(.*?\)\s*/,' '));
  a.setAttribute('href','javascript:void 0');a.setAttribute('onclick',"event.preventDefault();V156.patrimonio(this.getAttribute('data-v156p'))")})});

/* ───────── §6b Pessoas › Visão: certificações vencidas / avaliações pendentes abriam a lista inteira ───────── */
V.pcTreinos=function(){try{COP.ui.pctreinos=Object.assign({},COP.ui.pctreinos||{},{st:'vencida'})}catch(e){}location.hash='#/pctreinos';try{render()}catch(e){}};
V.pcAval=function(n){const d90=new Date(Date.now()-90*864e5).toISOString().slice(0,10);
  const iso=t=>{const m=/(\d{2})\/(\d{2})\/(\d{4})/.exec(t);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
  V.ir({path:'#/pcmetas',lb:N0(n)+' · avaliações pendentes (> 90 dias sem avaliação)',unid:'pessoas',nav(){location.hash='#/pcmetas'},
    recsAt(){const t=[...document.querySelectorAll('#main table')].find(x=>/ÚLTIMA AVALIAÇÃO/i.test(x.querySelector('thead')?x.querySelector('thead').textContent:''));if(!t)return null;
      const hs=[...t.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim().toUpperCase());const ci=hs.findIndex(x=>/ÚLTIMA AVALIAÇÃO/.test(x));
      return [...t.querySelectorAll(':scope>tbody>tr')].filter(tr=>{const c=tr.children[ci];const tx=c?(c.textContent||'').trim():'';const d=iso(tx);return /pendente/i.test(tx)||!tx||tx==='—'||(d&&d<d90)}).map(tr=>{const b=tr.querySelector('b');return {name:(b?b.textContent:tr.children[0].textContent).trim()}})}})};
POS.push(()=>{if(!/^#\/pchome/.test(location.hash))return;document.querySelectorAll('#main [href="#/pctreinos"],#main [href="#/pcmetas"]').forEach(a=>{if(a.__v156)return;const t=(a.textContent||'').replace(/\s+/g,' ').trim();
  if(a.getAttribute('href')==='#/pctreinos'&&/^Certificações vencidas/i.test(t)){a.__v156=1;a.setAttribute('href','javascript:void 0');a.setAttribute('onclick','event.preventDefault();V156.pcTreinos()')}
  else if(a.getAttribute('href')==='#/pcmetas'&&/^Avaliações pendentes/i.test(t)){const m=/Avaliações pendentes\s*(\d+)/i.exec(t);a.__v156=1;a.setAttribute('href','javascript:void 0');a.setAttribute('onclick',`event.preventDefault();V156.pcAval(${m?+m[1]:0})`)}})});

/* 5d) números de UNIDADES que abrem uma lista de PRODUTOS já filtrada pela própria tela (categoria, lugar, sem propósito,
   patrimônio): a lista fica como está e a faixa faz a ponte "266 un. em 122 produtos" */
const linhasLista=()=>{const m=document.getElementById('main');if(!m)return null;const t=[...m.querySelectorAll('table')].map(t=>[t,[...t.querySelectorAll(':scope>tbody>tr')].filter(r=>!r.classList.contains('tot')&&!/^total\b/i.test((r.firstElementChild&&r.firstElementChild.textContent||'').trim())&&r.offsetParent!==null)]).sort((a,b)=>b[1].length-a[1].length)[0];
  if(!t||!t[1].length)return null;const hs=[...t[0].querySelectorAll('thead th')].map(x=>(x.textContent||'').trim());if(!/Equipamento|Produto/i.test(hs[0]||''))return null;
  return t[1].map(r=>{const b=r.querySelector('b');const oc=r.getAttribute('onclick')||'';const m2=/\{'([^']+)':!false\}/.exec(oc);return {ids:m2?[m2[1]]:[],name:(b?b.textContent:r.firstElementChild.textContent).trim()}})};
V.unidades=function(code,n,lb,path){V.ir({path:path||'#/estoque',lb:N0(n)+' un. · '+lb,unid:'produtos',nav(){try{new Function(code)()}catch(e){console.error('v156 nav',e)}},recsAt:linhasLista,ponteF:r=>`${N0(n)} un. em ${N0(r.length)} produtos (a coluna Qtd é o total de cada produto)`})};
POS.push(()=>{if(!/^#\/epainel/.test(location.hash))return;const m=document.getElementById('main');if(!m)return;const tx=e=>(e.textContent||'').replace(/\s+/g,' ').trim();
  m.querySelectorAll('[onclick*="S.estCat="],[onclick*="S.estSit=\'empresa\'"],[onclick*="S.estSit=\'terceiro\'"],[onclick*="S.lugarSit="],[onclick*="#/lugar/"]').forEach(e=>{if(e.__v156)return;const oc=e.getAttribute('onclick')||'';if(/V156\./.test(oc))return;
    const t=tx(e);const mm=/(\d[\d.]*)\s*$/.exec(t)||/^(\d[\d.]*)/.exec(t);if(!mm)return;const n=+mm[1].replace(/\./g,'');if(!n)return;
    let lb=t.replace(mm[1],'').trim();const cat=/S\.estCat='([^']+)'/.exec(oc);if(cat)lb=cat[1];const lug=/#\/lugar\/([A-Z]+)/.exec(oc);
    if(/S\.lugarSit=/.test(oc)){const k=/k:'([a-z_]+)'/.exec(oc);lb='Inventário '+(lug?lug[1]:'')+' · '+(k?k[1]:'')}else if(lug&&!lb)lb='Inventário '+lug[1];else if(lug&&/^Inventário/.test(lb))lb='Inventário '+lug[1];
    const path=lug?'#/lugar/'+lug[1]:'#/estoque';e.__v156=1;e.setAttribute('data-v156c',oc.replace(/^event\.stopPropagation\(\);/,''));
    e.setAttribute('onclick',`event.stopPropagation();V156.unidades(this.getAttribute('data-v156c'),${n},'${J(lb)}','${path}')`)});
  const sp=[...m.querySelectorAll('a.card[href="#/semproposito"]')].find(a=>!a.__v156&&/^SEM PROPÓSITO/i.test(tx(a)));
  if(sp){const mm=/SEM PROPÓSITO\s*(\d[\d.]*)/i.exec(tx(sp));if(mm){sp.__v156=1;sp.setAttribute('href','javascript:void 0');sp.setAttribute('onclick',`event.preventDefault();V156.unidadesSP(${+mm[1].replace(/\./g,'')})`)}}});
V.unidadesSP=function(n){V.ir({path:'#/semproposito',lb:N0(n)+' un. · sem propósito',unid:'produtos',nav(){location.hash='#/semproposito'},
  recsAt(){const m=document.getElementById('main');const t=m&&[...m.querySelectorAll('table')].find(x=>/Sobra/i.test(x.querySelector('thead')?x.querySelector('thead').textContent:''));if(!t)return null;
    return [...t.querySelectorAll(':scope>tbody>tr')].filter(r=>r.querySelector('b')).map(r=>({name:r.querySelector('b').textContent.trim()}))},ponteF:r=>`${N0(n)} un. de sobra em ${N0(r.length)} produtos (coluna Sobra)`})};
/* 5e) o "Mostrando N de M" automático das listas grandes contava também a linha "Total" (e as linhas escondidas pelo filtro):
   "Mostrando 75 de 75" para 74 produtos. Agora conta só os registros. */
POS.push(()=>{document.querySelectorAll('#main .fx2-most').forEach(sp=>{const bar=sp.closest('.fx2-search');let h=bar&&bar.nextElementSibling;while(h&&h.hasAttribute&&h.hasAttribute('data-v155ban'))h=h.nextElementSibling;if(!h)return;
  const t=h.tagName==='TABLE'?h:h.querySelector&&h.querySelector('table');if(!t)return;
  const rs=[...t.querySelectorAll('tbody tr')].filter(r=>!r.classList.contains('sum')&&!r.classList.contains('tot')&&!r.classList.contains('sub')&&!/^total\b/i.test((r.firstElementChild&&r.firstElementChild.textContent||'').trim()));
  const vis=rs.filter(r=>r.style.display!=='none').length;const txt=`Mostrando ${N0(vis)} de ${N0(rs.length)}`;if(sp.textContent!==txt){sp.textContent=txt;sp.dataset.n=vis;sp.dataset.m=rs.length}})});

/* ───────── §6 Projetos › Painel: "Executivos cobráveis" (a v138 mandava para Comercial › Propostas) ───────── */
const entOf=(o,nome)=>(o.entregaveis||[]).find(e=>e.nome===nome)||{nome,status:'N/A'};
const revN=e=>+String(e.rev||'').replace(/\D/g,'')||0;
const revVend=o=>{const ps=(S.db.propostas||[]).filter(p=>p.obra_id===o.id);return ps.length?Math.max(...ps.map(p=>p.revisoes_vendidas==null?3:+p.revisoes_vendidas)):3};
V.prjCobr=function(){const sit=o=>T(()=>COP.situacao(o),o.situacao);const xs=(S.db.obras||[]).filter(o=>sit(o)==='Em andamento'&&revN(entOf(o,'Infraestrutura / projeto executivo'))>revVend(o));
  V.ir({path:'#/prjobras',lb:N0(xs.length)+' · executivos cobráveis (4ª revisão ou mais)',unid:'obras',recs:xs.map(o=>({ids:[o.id],name:o.nome||o.id,h:'#/prjobras/'+o.id})),
    nav(){try{COP.prj.go('prjobras',{situacao:'*'})}catch(e){location.hash='#/prjobras'}}})};
POS.push(()=>{if(!/^#\/prjpainel/.test(location.hash))return;document.querySelectorAll('#main .card').forEach(c=>{if(c.__v156)return;const t=(c.textContent||'').replace(/\s+/g,' ').trim();if(!/^EXECUTIVOS COBRÁVEIS/i.test(t))return;
  const v=[...c.querySelectorAll('[onclick]')].find(x=>/V138_go\('#\/propostas'/.test(x.getAttribute('onclick')||''));c.__v156=1;const el=v||c;el.setAttribute('onclick',"event.stopPropagation();V156.prjCobr()");el.style.cursor='pointer'})});

/* Pós-venda › Visão geral: "Online 11 / Offline 4 / Com nobreak 6" são links para #/posmonit: depois do filtro do Savant,
   o link seguia para #/posmonit, que abre Clientes consolidados (4) em vez do Savant filtrado */
POS.push(()=>{if(!/^#\/posvisao/.test(location.hash))return;document.querySelectorAll('#main a[href="#/posmonit"][onclick*="goMonit("]').forEach(e=>{if(e.__v156)return;const oc=e.getAttribute('onclick')||'';
  e.__v156=1;e.setAttribute('href','javascript:void 0');if(!/stopPropagation/.test(oc))e.setAttribute('onclick','event.preventDefault();event.stopPropagation();'+oc)})});
/* "Obras finalizadas 250" abria a lista com 30 e "Mostrar mais (220 restantes)" — o número abre as 250 */
POS.push(()=>{if(!/^#\/posvisao/.test(location.hash))return;document.querySelectorAll('#main [onclick="location.hash=\'#/posobras\'"]').forEach(e=>{if(e.__v156)return;e.__v156=1;
  e.setAttribute('onclick',"try{COP.ui.posobras=Object.assign({},COP.ui.posobras||{},{lim:100000});delete COP.ui.posobras.sit}catch(e){};location.hash='#/posobras'")})});
/* ───────── §7 Pós-venda: a lista do Savant mostra 10 por vez — um número que abre a lista mostra todas as dele ───────── */
(function(){let n=0;const iv=setInterval(()=>{try{if(window.COP&&COP.pos&&typeof COP.pos.goMonit==='function'&&!COP.pos.goMonit.__v156){const g=COP.pos.goMonit;const w=function(tab,extra){try{COP.ui.posmonit=COP.ui.posmonit||{};COP.ui.posmonit.savLim=1000}catch(e){}return g.apply(this,arguments)};w.__v156=1;COP.pos.goMonit=w;clearInterval(iv)}}catch(e){}if(++n>60)clearInterval(iv)},500)})();

/* ───────── liga ───────── */
function liga(){const a=ligaGestao(),b=ligaPipeline(),c=ligaNeg();return a&&b&&c}
if(!liga()){let n=0;const iv=setInterval(()=>{if(liga()||++n>60)clearInterval(iv)},500)}
try{if(/^#\/(gestao|pipeline)/.test(location.hash)&&typeof renderMain==='function')renderMain()}catch(e){}
})();
