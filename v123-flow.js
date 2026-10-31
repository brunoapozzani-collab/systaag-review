/* ============================================================================
   V123 · FLOW — um registro criado num departamento é visto e movido pelo próximo.
   Uma ficha por coisa. Área: Operação, Projetos, Pós-venda, modelo da obra, menu do Estoque.
   1  Pós-venda → Financeiro: parcelas do plano / proposta AT viram títulos a receber (unidade Pós-venda);
      confirmar num lado = registrar no outro. Proposta AT tem total real (M.total).
   2  Chamados: OS (Solicitações) e Atendimentos ligados nos dois sentidos, uma entrada de menu.
   3  Projetos: entregáveis da obra são a lista única; a Prancheta (docs) é derivada.
   4  Progresso da obra: checklist (o.etapas) é o modelo; atividades da Operação e fase Execução são vista calculada.
   5  Obra: "Proposta(s)" e "Consultor comercial" calculados das propostas ligadas (somente leitura).
   6  Obra em prospecção até uma proposta ser vendida; listas da Operação/Projetos/Financeiro escondem (com filtro).
   7  Faturamento: proposta/Financeiro leem o faturamento do cliente ao vivo, salvo override na proposta.
   8  Comercial › Hoje mostra as próximas ações do CRM dos parceiros das negociações (somente leitura).
   9  Operação › Nova obra abre o mesmo fluxo do Comercial (cliente → obra → proposta).
   10 Estoque: "A receber" (mercadoria) passa a se chamar "A chegar".
   SHARED TOUCH: window.put (pós-processa obras/atividades/at_propostas/at_atendimentos/clientes/propostas),
   window.render (passo de sincronização antes de desenhar), window.save (protege a lista de obras filtrada),
   M.total (só propostas Pós-venda sem itens), A.receber (título do Pós-venda marca a parcela).
============================================================================ */
(function(){
if(window.__V123_flow)return;window.__V123_flow=true;
const F=window.__V123F={log:[]};
const T=()=>{try{return COP.today()}catch(e){return new Date().toISOString().slice(0,10)}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nBR=n=>Number(n||0).toLocaleString('pt-BR');
const R$=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const dBR=d=>d?String(d).slice(0,10).split('-').reverse().join('/'):'—';
const r2=v=>Math.round((+v||0)*100)/100;
const safe=(f,lb)=>{try{return f()}catch(e){console.warn('V123 flow',lb||'',e)}};
const audit=(mod,id,txt,oid)=>safe(()=>COP.audit(mod,id,txt,oid||null));
const db=()=>S.db;
const obraOf=id=>id?(S.db.obras||[]).find(o=>o.id===id):null;
const propOf=id=>id?(S.db.propostas||[]).find(p=>p.id===id):null;
const SOLD=['vendida','em_obra','concluida'];
let busy=0; /* re-entrancy guard for the sync helpers */

/* =========================================================================
   1 · Pós-venda → Financeiro
   ========================================================================= */
const isPV=p=>p&&p.linha==='posvenda'&&p.at;
const atTotal=at=>{if(!at)return 0;if(at.proposal_type==='SERVICE_PLAN')return r2((at.proposal_value_cents||0)*((at.payments||[]).length||0)/100);return r2(((at.proposal_value_cents||0)+(at.additional_value_cents||0)-(at.discount_value_cents||0))/100)};
F.atTotal=atTotal;
/* M.total: a proposta AT/plano sem itens carrega o total do cadastro do Pós-venda */
safe(()=>{const _t=M.total;M.total=function(p){const v=_t.apply(this,arguments);if(v)return v;if(isPV(p))return atTotal(p.at);return v}},'M.total');
/* as listas do Comercial leem M.resumo(p).tot: mesma regra; margem = resultado líquido do Pós-venda */
safe(()=>{const _rs=M.resumo;M.resumo=function(p){const R=_rs.apply(this,arguments);if(R&&!R.tot&&isPV(p)){const t=atTotal(p.at);if(t){R.tot=t;let liq=t;try{liq=COP.pos.calc(p.at).total/100}catch(e){}R.margem=liq;R.mg=liq/t}}return R}},'M.resumo');
const tid=(p,i)=>'l_pv_'+p.id+'_'+i;
const lancOf=id=>(S.db.lancamentos||[]).find(l=>l.id===id);
function novoTitulo(p,id,valor,venc,cat,extra){const o=obraOf(p.obra_id);const l=Object.assign({id,tipo:'receber',origem:'proposta',origem_id:p.id,valor:r2(valor),vencimento:venc||T(),pago_em:null,categoria:cat,unidade:'Pós-venda',obra_id:o?o.id:null,sem_obra:!o,centro_custo:'',revisao:false,revisao_motivo:'',fd1:true,pv:true},extra||{});put('lancamentos',l,'Pós-venda → título a receber');return l}
let pvGuard=false;
/* mode 'backfill': já pago no Pós-venda → título pago na data do vencimento, sem mexer no caixa (histórico)
   mode 'live': mudança agora → recebimento/estorno de verdade (caixa) */
function syncPV(p,mode){if(!isPV(p))return 0;const at=p.at;let n=0;
 if(at.proposal_type==='SERVICE_PLAN'){const pays=at.payments||[];const v=(at.proposal_value_cents||0)/100;
  pays.forEach((x,i)=>{const id=tid(p,i);let l=lancOf(id);
   if(!l){if(!v)return;l=novoTitulo(p,id,v,x.dueDate,`Plano ${i+1}/${pays.length} · ${at.proposal_number}`,{pv_i:i});n++;
    if(x.paid){if(mode==='live'){pvGuard=true;try{A.receber(id)}finally{pvGuard=false}}else{l.pago_em=x.dueDate||T();l.pv_backfill=true}}return}
   if(!l.pago_em&&r2(v)!==r2(l.valor)){l.valor=r2(v);n++}
   if(!l.pago_em&&x.dueDate&&l.vencimento!==x.dueDate){l.vencimento=x.dueDate;n++}
   if(x.paid&&!l.pago_em){n++;if(mode==='live'){pvGuard=true;try{A.receber(id)}finally{pvGuard=false}}else{l.pago_em=x.dueDate||T();l.pv_backfill=true}}
   else if(!x.paid&&l.pago_em){n++;estornar(l)}});
  /* plano reconfigurado com menos parcelas: títulos abertos excedentes saem; pagos ficam (histórico) */
  S.db.lancamentos=S.db.lancamentos.filter(l=>!(l.pv&&l.origem_id===p.id&&l.pv_i!=null&&l.pv_i>=pays.length&&!l.pago_em));
 }else{const id=tid(p,'at');let l=lancOf(id);const tot=atTotal(at);const ok=at.approval_status==='APROVADO'&&tot>0;
  if(!l&&ok){l=novoTitulo(p,id,tot,at.technical_delivery_date&&at.technical_delivery_date>T()?at.technical_delivery_date:T(),`Proposta AT ${at.proposal_number}`,{pv_i:'at'});n++;if(at.pago_at&&mode!=='live'){l.pago_em=at.pago_at}}
  else if(l&&!l.pago_em){if(!ok){S.db.lancamentos=S.db.lancamentos.filter(x=>x!==l);n++}else if(r2(l.valor)!==tot){l.valor=tot;n++}}}
 return n}
function estornar(l){const v=+l.valor||0;l.pago_em=null;l.liquida_em=null;if(!l.pv_backfill)safe(()=>{S.db.caixa.saldo=S.db.caixa.saldo-v});l.pv_backfill=false;safe(()=>log('lancamentos',l.id,'recebimento estornado (Pós-venda)'))}
F.syncPV=syncPV;
/* Pós-venda › Confirmar/Estornar parcela = recebimento no Financeiro (passa pelo put do at_propostas) */
/* Financeiro › Registrar recebimento de um título do Pós-venda = parcela paga no Pós-venda */
safe(()=>{const _r=A.receber;A.receber=function(lid){const l=lancOf(lid);const r=_r.apply(this,arguments);
 if(!pvGuard&&l&&l.pv)safe(()=>{const p=propOf(l.origem_id);if(!isPV(p))return;const l2=lancOf(lid)||l;
  if(l.pv_i==='at'){p.at.pago_at=l2.pago_em||T()}else{const x=(p.at.payments||[])[l.pv_i];if(x&&!x.paid){x.paid=true;x.paid_at=l2.pago_em||T()}}
  audit('posvenda',p.id,'recebimento registrado no Financeiro: '+(l.categoria||''),p.obra_id)},'receber→pv');return r}},'A.receber');
F.backfillPV=()=>{let n=0;(S.db.propostas||[]).filter(isPV).forEach(p=>{n+=syncPV(p,'backfill')});return n};

/* =========================================================================
   2 · Chamados = OS (Solicitações) + Atendimentos, ligados nos dois sentidos
   ========================================================================= */
const atends=()=>S.db.at_atendimentos||[];
const osList=()=>S.db.os||[];
const sitAt=c=>safe(()=>COP.pos.sitOf(c))||'agend';
let pendingOS=null; /* OS que pediu "Agendar atendimento" */
function osParaAtend(c){const p=propOf(c.proposal_id);const o=p?obraOf(p.obra_id):null;const cli=o?o.cliente_id:(p&&p.at&&p.at.cliente_id)||null;if(!cli)return null;
 const before=new Set(osList().map(x=>x.id));
 safe(()=>A.abrirOS({cliente_id:cli,titulo:'Atendimento '+(c.tipo||'AT')+(p&&p.at?' · '+(p.at.name||p.at.proposal_number):''),obra:o?o.id:'',tipo:'Atendimento AT',proxima:'Executar o atendimento agendado'}),'abrirOS');
 const os=osList().find(x=>!before.has(x.id));if(!os)return null;os.atendimento_id=c.id;os.origem='Atendimento';if(o&&!os.obra_id)os.obra_id=o.id;if(sitAt(c)==='fin'){os.estado='concluida';os.concluida_em=c.end_date||T()}c.os_id=os.id;return os}
F.backfillChamados=()=>{let n=0;atends().forEach(c=>{if(c.os_id&&osList().some(o=>o.id===c.os_id))return;const os=osList().find(o=>o.atendimento_id===c.id);if(os){c.os_id=os.id;return}if(osParaAtend(c))n++});return n};
/* o atendimento concluído fecha o chamado ligado; reaberto reabre */
function syncChamados(){atends().forEach(c=>{const os=c.os_id&&osList().find(o=>o.id===c.os_id);if(!os)return;if(os.atendimento_id!==c.id)os.atendimento_id=c.id;const fin=sitAt(c)==='fin';if(fin&&os.estado==='aberta'){os.estado='concluida';os.concluida_em=T()}})}
COP.pos.agendarDoChamado=osId=>{const os=osList().find(o=>o.id===osId);if(!os)return;const oid=os.obra_id||null;
 const ok=(S.db.propostas||[]).filter(p=>isPV(p)&&safe(()=>COP.pos.elegivel(p.at))&&(!oid||p.obra_id===oid)&&(!os.cliente_id||(obraOf(p.obra_id)||{}).cliente_id===os.cliente_id));
 if(!ok.length){toast('Este cliente ainda não tem proposta AT aprovada nem plano vigente. Crie a proposta do Pós-venda primeiro — o atendimento nasce dela.',true);safe(()=>COP.pos.novaPropostaComercial(oid||undefined));return}
 _na.call(COP.pos,ok[0].id);pendingOS=osId};
const _na=COP.pos.novoAtend;COP.pos.novoAtend=function(){pendingOS=null;return _na.apply(this,arguments)};
COP.pos.abrirChamado=()=>{const cls=(S.db.clientes||[]).slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
 COP.form('Abrir chamado',[{k:'cliente_id',l:'Cliente',t:'select',opts:cls.map(c=>[c.id,(c.sigla?c.sigla+' — ':'')+c.nome]),v:'',req:true,w:'col-12',empty:'Selecione o cliente'},{k:'obra_id',l:'Obra (opcional)',t:'select',opts:(S.db.obras||[]).map(o=>[o.id,o.nome]),v:'',w:'col-12',empty:'—'},{k:'titulo',l:'O que o cliente pediu',v:'',req:true,w:'col-12'},{k:'tipo',l:'Tipo',t:'select',opts:['Chamado','Diagnóstico','Garantia','Retorno de obra','Visita cobrável','Visita técnica'],v:'Chamado',empty:false}],
 v=>{if(!v.cliente_id||!String(v.titulo||'').trim())throw new RuleError('Informe o cliente e o pedido.');A.abrirOS({cliente_id:v.cliente_id,titulo:String(v.titulo).trim(),obra:v.obra_id||'',tipo:v.tipo||'Chamado'})},{msg:'Chamado aberto — agende o atendimento na mesma linha',ok:'Abrir chamado'})};
function telaChamados(){syncChamados();const os=osList().filter(o=>o.tipo!=='Retomada'&&!o.retomada);const linkAt=new Set(os.map(o=>o.atendimento_id).filter(Boolean));
 const soltos=atends().filter(c=>!linkAt.has(c.id));const cliN=id=>((S.db.clientes||[]).find(c=>c.id===id)||{}).nome||'—';
 const atCell=c=>{const p=propOf(c.proposal_id);const s=sitAt(c);return `<a href="#/posatend" onclick="setTimeout(()=>COP.pos.editAtend('${esc(c.id)}'),300)">${dBR(c.start_date)} · ${esc(c.period||'')}</a> <span class="chip ${s==='fin'?'ok':s==='aberto'?'warn':'info'}">${s==='fin'?'concluído':s==='aberto'?'em aberto':'agendado'}</span>${p&&p.at?`<div class="sub" style="font-size:11px">${esc(p.at.proposal_number)} · ${esc((c.technicians||[]).join(', ')||'sem técnico')}</div>`:''}`};
 const rows=os.slice().sort((a,b)=>String(b.criado||'').localeCompare(String(a.criado||''))).map(o=>{const c=o.atendimento_id&&atends().find(x=>x.id===o.atendimento_id);const ob=obraOf(o.obra_id);
  return `<tr data-chamado="${esc(o.id)}"><td class="mono"><b>${esc(o.id)}</b></td><td><b>${esc(o.titulo||o.desc||'')}</b><div class="sub" style="font-size:11.5px">${esc(cliN(o.cliente_id))}${ob?' · '+esc(ob.nome):o.obra?' · '+esc(o.obra):''}</div></td><td>${esc(o.tipo||'Chamado')}</td><td>${dBR(o.criado)}</td><td><span class="chip ${o.estado==='aberta'?'warn':'ok'}">${o.estado==='aberta'?'aberto':'concluído'}</span></td><td data-at="${c?esc(c.id):''}">${c?atCell(c):(o.estado==='aberta'?`<button class="btn-soft" style="font-size:12px" onclick="COP.pos.agendarDoChamado('${esc(o.id)}')"><i class="bi bi-calendar-plus me-1"></i>Agendar atendimento</button>`:'<span class="sub">—</span>')}</td></tr>`});
 const rows2=soltos.map(c=>{const p=propOf(c.proposal_id);const ob=p?obraOf(p.obra_id):null;return `<tr data-chamado="at:${esc(c.id)}"><td class="mono"><b>—</b></td><td><b>Atendimento ${esc(c.tipo||'AT')}</b><div class="sub" style="font-size:11.5px">${esc(ob?cliN(ob.cliente_id)+' · '+ob.nome:'')}</div></td><td>${esc(c.tipo||'AT')}</td><td>${dBR((c.created_at||'').slice(0,10)||c.start_date)}</td><td>—</td><td data-at="${esc(c.id)}">${atCell(c)}</td></tr>`});
 const ab=os.filter(o=>o.estado==='aberta');const com=ab.filter(o=>o.atendimento_id).length;
 const kpi=(lb,v,sub)=>`<div class="col-6 col-md-3"><div class="card p-3"><div class="sub" style="font-size:10.5px;letter-spacing:.06em">${lb}</div><div style="font-size:24px;font-weight:800">${v}</div><div class="sub" style="font-size:11.5px">${sub||''}</div></div></div>`;
 return head('Chamados','Um lugar só para o pedido do cliente: o chamado (OS) e o atendimento técnico ligado a ele. Agendar um atendimento liga os dois; um atendimento novo abre o chamado sozinho.',`<button class="btn-soft" onclick="COP.pos.novoAtend()"><i class="bi bi-calendar-plus me-1"></i>Novo atendimento</button><button class="btn-apple" onclick="COP.pos.abrirChamado()"><i class="bi bi-plus-lg me-1"></i>Abrir chamado</button>`)
  +`<div class="row g-2 mb-3" id="v123_ch_kpi" data-abertos="${ab.length}" data-com="${com}" data-sem="${ab.length-com}">${kpi('CHAMADOS ABERTOS',nBR(ab.length),`${nBR(ab.length)} = ${nBR(com)} com atendimento + ${nBR(ab.length-com)} sem atendimento`)}${kpi('COM ATENDIMENTO',nBR(com),'agendado ou em campo')}${kpi('SEM ATENDIMENTO',nBR(ab.length-com),'agende na própria linha')}${kpi('ATENDIMENTOS',nBR(atends().length),'todos ligados a um chamado'+(soltos.length?` · ${nBR(soltos.length)} sem chamado`:''))}</div>`
  +`<div class="card"><div class="tblwrap"><table class="tbl" id="v123_chamados"><thead><tr><th>Chamado</th><th>Pedido · cliente · obra</th><th>Tipo</th><th>Aberto em</th><th>Situação</th><th>Atendimento</th></tr></thead><tbody>${rows.concat(rows2).join('')||'<tr><td colspan="6" class="place">Nenhum chamado.</td></tr>'}</tbody></table></div></div>`
  +`<div class="sub mt-2" style="font-size:12px">Retomadas do vendedor continuam em <a href="#/posvenda">Solicitações (painel do Pós-venda)</a> · agenda completa em <a href="#/posatend">Atendimentos</a>.</div>`}
SCREENS.chamados=telaChamados;
safe(()=>{LABEL.chamados='Chamados';SEC_OF.chamados='pos';if(typeof OWNER==='object')OWNER.chamados='pos'},'chamados route');

/* =========================================================================
   3 · Projetos: entregáveis = lista única; Prancheta (o.docs) derivada
   ========================================================================= */
const ENT=()=>COP.ENTREGAVEIS||[];
const DOCL=()=>(typeof DOCS!=='undefined'&&Array.isArray(DOCS))?DOCS:[];
const entToDoc=s=>s==='Aprovado'||s==='Concluído'?'C':['Em elaboração','Enviado','Revisão'].includes(s)?'A':s==='Aguardando projeto arq.'?'A/P':'N/A';
const docToEnt=(d,cur)=>d==='C'||d==='OK'?'Aprovado':d==='A'?(['Em elaboração','Enviado','Revisão'].includes(cur)?cur:'Em elaboração'):d==='A/R'?'Enviado':d==='A/P'?'Aguardando projeto arq.':'N/A';
const RK={'N/A':0,'A/P':1,'A/R':2,'A':2,'OK':3,'C':3};
const revN=e=>+String((e&&e.rev)||'').replace(/\D/g,'')||0;
const revS=n=>n?'R'+String(n).padStart(2,'0'):'';
function entIdx(o,i){const nm=ENT()[i];let k=(o.entregaveis||[]).findIndex(e=>e.nome===nm);if(k<0&&o.entregaveis&&o.entregaveis[i]&&!ENT().includes(o.entregaveis[i].nome))k=i;return k}
function deriveDocs(o){if(!Array.isArray(o.entregaveis)||!o.entregaveis.length)return false;const L=DOCL();if(!L.length)return false;let ch=false;
 const nd=L.map((d,i)=>{const k=entIdx(o,i);const e=k>=0?o.entregaveis[k]:null;const old=(o.docs||[])[i]||{};const st=e?entToDoc(e.status):(old.status||'A/P');const rv=e?revN(e):(+old.rev||0);if(old.doc!==d||old.status!==st||(+old.rev||0)!==rv)ch=true;return Object.assign({},old,{doc:d,rev:rv,status:st})});
 if(ch||(o.docs||[]).length!==nd.length)o.docs=nd;return ch}
function migraDocs(o){if(o.v123_docs)return false;const L=DOCL();o.entregaveis=Array.isArray(o.entregaveis)?o.entregaveis:[];
 L.forEach((d,i)=>{const doc=(o.docs||[])[i];const k=entIdx(o,i);if(k<0){if(!ENT()[i])return;o.entregaveis.push({nome:ENT()[i],status:doc?docToEnt(doc.status):'N/A',rev:doc?revS(+doc.rev||0):'',enviado:''});return}
  const e=o.entregaveis[k];if(!doc)return;if((RK[doc.status]||0)>(RK[entToDoc(e.status)]||0))e.status=docToEnt(doc.status,e.status);if((+doc.rev||0)>revN(e))e.rev=revS(+doc.rev)});
 o.v123_docs=1;deriveDocs(o);return true}
function faseProjetos(o){const es=(o.entregaveis||[]).filter(e=>e.status!=='N/A');if(!es.length)return;const f=(o.fases||{}).projetos||{};if((!f.status||f.status==='Não iniciado'||f.status==='N/A')&&es.some(e=>e.status!=='Aguardando projeto arq.')){o.fases=Object.assign({},o.fases||{},{projetos:Object.assign({},f,{status:'Em andamento',data:f.data||T()})})}}
safe(()=>{const _s=A.docStatus,_r=A.docRev;
 A.docStatus=function(oid,i,st){const o=obraOf(oid);if(!o||!ENT()[i])return _s.apply(this,arguments);migraDocs(o);const ents=(o.entregaveis||[]).map(e=>Object.assign({},e));let k=entIdx({entregaveis:ents},i);if(k<0){ents.push({nome:ENT()[i],status:'N/A',rev:'',enviado:''});k=ents.length-1}
  ents[k].status=docToEnt(st,ents[k].status);put('obras',Object.assign({},o,{entregaveis:ents}),'Prancheta: '+ents[k].nome+' → '+ents[k].status)};
 A.docRev=function(oid,i){const o=obraOf(oid);if(!o||!ENT()[i])return _r.apply(this,arguments);migraDocs(o);const ents=(o.entregaveis||[]).map(e=>Object.assign({},e));let k=entIdx({entregaveis:ents},i);if(k<0){ents.push({nome:ENT()[i],status:'N/A',rev:'',enviado:''});k=ents.length-1}
  ents[k].rev=revS(revN(ents[k])+1);ents[k].status='Revisão';put('obras',Object.assign({},o,{entregaveis:ents}),'Prancheta: nova revisão de '+ents[k].nome)}},'docs wrappers');

/* =========================================================================
   4 · Progresso: o.etapas (checklist) é o modelo; atividades da Operação e fase Execução são vista
   ========================================================================= */
const ET2AT=s=>{s=String(s||'');if(/^(finalizado|conclu)/i.test(s))return 'Concluído';if(/^em andamento/i.test(s))return 'Em andamento';if(/pend/i.test(s))return 'Bloqueado';if(/^aguardando (obra|instala)/i.test(s))return 'Aguardando';if(/^n\/a$/i.test(s))return 'N/A';return 'Não iniciado'};
const AT2ET=(s,cur)=>{if(ET2AT(cur)===s||(s==='Parcialmente concluído'&&ET2AT(cur)==='Em andamento'))return cur;return {'Concluído':'Finalizado','Em andamento':'Em andamento','Parcialmente concluído':'Em andamento','Bloqueado':'Com Pendências','Aguardando':'Aguardando obra','Não iniciado':'Aguardando definição','N/A':cur}[s]||cur};
const obraAtiva=o=>o&&o.situacao!=='Concluída'&&o.situacao!=='Cancelada'&&!(o.entrega&&o.entrega.realizada);
function etapaId(o,e,i){if(!e.id)e.id='et_'+o.id+'_'+i;return e.id}
function mirror(o){if(!o||!Array.isArray(o.etapas)||!o.etapas.length)return 0;S.db.atividades=S.db.atividades||[];let n=0;const ativa=obraAtiva(o);
 o.etapas.forEach((e,i)=>{const eid=etapaId(o,e,i);let a=S.db.atividades.find(x=>x.etapa_id===eid&&x.obra_id===o.id);
  if(!a){if(!ativa)return;a={id:'ATV_'+eid,obra_id:o.id,etapa_id:eid,num:i+1,item:String(i+1),grupo:(COP.ATV_GRUPOS||[]).includes(e.etapa)?e.etapa:'Estrutural',nome:e.subetapa||e.nome||e.etapa||('Etapa '+(i+1)),requisito:'',status:'Não iniciado',pct:0,peso:1,urgencia:'Normal',inicioPlan:'',fimPlan:'',previsaoFim:'',previsoesAnteriores:[],responsavel_id:'',equipe:[],obs:'',ativo:true,origem:'Checklist da obra (o.etapas)',criadoEm:new Date().toISOString()};S.db.atividades.push(a);n++}
  const st=ET2AT(e.status);if(a.status!==st){a.status=st;n++}if(st==='Concluído'&&a.pct!==100){a.pct=100;n++}if(st!=='Concluído'&&a.pct===100){a.pct=0;n++}
  if(st==='Bloqueado'&&!a.motivoBloqueio)a.motivoBloqueio='Com pendências no checklist';
  const nm=e.subetapa||e.nome||a.nome;if(a.nome!==nm){a.nome=nm;n++}if((e.ini||'')!==(a.inicioPlan||'')){a.inicioPlan=e.ini||'';n++}if((e.fim||'')!==(a.fimPlan||'')){a.fimPlan=e.fim||'';n++}});
 /* etapa removida do checklist → atividade espelho sai da lista (fica no histórico) */
 const ids=new Set(o.etapas.map(e=>e.id));S.db.atividades.forEach(a=>{if(a.obra_id===o.id&&a.etapa_id&&!ids.has(a.etapa_id)&&a.ativo!==false){a.ativo=false;n++}});
 /* fase Execução = leitura do checklist */
 const L=o.etapas;const fin=L.filter(e=>ET2AT(e.status)==='Concluído').length;const mov=L.some(e=>['Concluído','Em andamento','Bloqueado'].includes(ET2AT(e.status)));
 const calc=fin===L.length?'Concluído':mov?'Em andamento':'Não iniciado';const fx=(o.fases||{}).execucao||{};const obs=`Calculada do checklist: ${fin}/${L.length} etapas finalizadas`;
 if(fx.status!==calc||fx._calc!==calc||fx.obs!==obs){o.fases=Object.assign({},o.fases||{},{execucao:Object.assign({},fx,{status:calc,_calc:calc,obs,data:fx.data||''})});n++}
 return n}
F.mirror=mirror;
/* atividade-espelho editada na Operação → a etapa do checklist muda (o checklist é o dono) */
function atvParaEtapa(a){if(!a||!a.etapa_id)return;const o=obraOf(a.obra_id);if(!o)return;const e=(o.etapas||[]).find(x=>x.id===a.etapa_id);if(!e)return;const ns=AT2ET(a.status,e.status);
 let ch=false;if(ns!==e.status){e.status=ns;ch=true;if(ns==='Finalizado'&&!e.fim)e.fim=T();if(!e.ini&&ns!=='Aguardando definição')e.ini=T()}
 if(a.inicioPlan&&a.inicioPlan!==e.ini){e.ini=a.inicioPlan;ch=true}if(a.fimPlan&&a.fimPlan!==e.fim){e.fim=a.fimPlan;ch=true}
 if(ch){audit('obras',o.id,`Checklist · ${e.subetapa||e.etapa}: ${e.status} (pela Operação)`,o.id);mirror(o)}}
/* fase Execução marcada Concluído na Operação → todas as etapas do checklist finalizadas */
function faseExecManual(o){const fx=(o.fases||{}).execucao;if(!fx||!Array.isArray(o.etapas)||!o.etapas.length)return;if(fx.status==='Concluído'&&fx._calc!=='Concluído'){o.etapas.forEach(e=>{if(ET2AT(e.status)!=='Concluído'){e.status='Finalizado';if(!e.fim)e.fim=T()}});audit('obras',o.id,'Fase Execução concluída → checklist finalizado',o.id)}}

/* =========================================================================
   5 · Obra: Proposta(s) e Consultor comercial = leitura das propostas ligadas
   ========================================================================= */
function vinculos(o){const ps=(S.db.propostas||[]).filter(p=>p.obra_id===o.id);if(!ps.length)return null;
 const nums=ps.slice().sort((a,b)=>String(a.numero).localeCompare(String(b.numero))).map(p=>String(p.numero));
 const cons=[...new Set(ps.filter(p=>p.estado!=='perdida').flatMap(p=>p.consultores||[]).filter(Boolean))];return {nums:nums.join(' / '),cons:cons.join(', ')}}
function syncVinculos(o){const v=vinculos(o);if(!v)return 0;let n=0;if(!o.v123_orig)o.v123_orig={propostasPlanilha:o.propostasPlanilha||'',comercial:o.comercial||''};
 if(o.propostasPlanilha!==v.nums){o.propostasPlanilha=v.nums;n++}if(v.cons&&o.comercial!==v.cons){o.comercial=v.cons;n++}return n}
F.vinculos=vinculos;

/* =========================================================================
   6 · Prospecção: obra existe desde o rascunho, mas só entra nas listas depois do Vendido
   ========================================================================= */
const EXEC_EV=s=>['Concluído','Em andamento','Bloqueado'].includes(ET2AT(s));
function prosp(o){if(!o||o.situacao==='Concluída'||o.situacao==='Cancelada'||(o.entrega&&o.entrega.realizada))return false;const ps=(S.db.propostas||[]).filter(p=>p.obra_id===o.id);if(!ps.length)return false;
 if(ps.some(p=>SOLD.includes(p.estado)||(p.linha==='posvenda'&&p.estado==='aprovada_cliente')))return false;
 if((o.etapas||[]).some(e=>EXEC_EV(e.status)))return false; /* já tem trabalho de campo: não é prospecção */
 return true}
F.prosp=prosp;
let showProsp=false;F.setShow=v=>{showProsp=!!v;render()};
let swapped=null;
function comObras(fn,self,args){if(showProsp||swapped)return fn.apply(self,args);const real=S.db.obras;const vis=real.filter(o=>!prosp(o));if(vis.length===real.length)return fn.apply(self,args);
 swapped={real,vis};S.db.obras=vis;try{return fn.apply(self,args)}finally{const extra=S.db.obras.filter(o=>!real.includes(o)&&!real.some(r=>r.id===o.id));S.db.obras=real;extra.forEach(o=>real.push(o));swapped=null}}
safe(()=>{const _sv=window.save;window.save=function(){if(swapped){const cur=S.db.obras;S.db.obras=swapped.real;try{return _sv.apply(this,arguments)}finally{S.db.obras=cur}}return _sv.apply(this,arguments)}},'save guard');
const LISTAS=[['obras',a=>!a],['planejamento',()=>true],['execucao',()=>true],['prjobras',a=>!a],['prjpainel',()=>true],['fobras',a=>!a],['copainel',()=>true],['cronogramas',a=>!a],['agendaobras',()=>true]];
F.wrapListas=()=>LISTAS.forEach(([k,cond])=>{const f=SCREENS[k];if(typeof f!=='function'||f.__v123p)return;const w=function(arg){return cond(arg)?comObras(f,this,arguments):f.apply(this,arguments)};w.__v123p=true;SCREENS[k]=w});
function barraProsp(k,arg){const L=LISTAS.find(x=>x[0]===k);if(!L||!L[1](arg))return '';const n=(S.db.obras||[]).filter(prosp);if(!n.length)return '';
 return `<div class="card p-2 px-3 mb-2" id="v123_prosp" data-n="${n.length}" data-show="${showProsp?1:0}" style="border-left:4px solid #6f42c1;font-size:12.5px"><i class="bi bi-hourglass-split me-1" style="color:#6f42c1"></i>${showProsp?`Mostrando também <b>${nBR(n.length)}</b> obra(s) em prospecção (proposta ainda não vendida).`:`<b>${nBR(n.length)}</b> obra(s) em prospecção (proposta ainda não vendida) não aparecem aqui até o Vendido.`} <a href="javascript:void(0)" onclick="__V123F.setShow(${!showProsp})">${showProsp?'Esconder prospecção':'Mostrar prospecção'}</a></div>`}

/* =========================================================================
   7 · Faturamento: o cliente é o dono; a proposta só guarda override explícito
   ========================================================================= */
const cliDe=p=>{const o=obraOf(p.obra_id);const id=(o&&o.cliente_id)||p.cliente_id;let c=id?(S.db.clientes||[]).find(x=>x.id===id):null;if(!c&&p.sigla)c=(S.db.clientes||[]).find(x=>x.sigla===p.sigla);return c||null};
const fatDe=c=>{if(!c)return null;if(!c.faturamento)c.faturamento={razao:c.nome||'',doc:'',endereco:'',email:'',tipo:'PF'};return c.faturamento};
const vendidaP=p=>SOLD.includes(p.estado);
const nfEmitida=p=>(S.db.lancamentos||[]).some(l=>l.origem_id===p.id&&l.tipo==='receber'&&(l.nf||(l.nfs||[]).length));
/* aberta: a nota da proposta é a do cliente (editar no Fechamento grava no cliente — regra já existente);
   vendida: o Financeiro (Faturar para) lê o cliente ao vivo, salvo override explícito na proposta (NF já emitida guarda os próprios dados no título) */
function fatSync(p){const c=cliDe(p);const cf=fatDe(c);if(!cf)return 0;const ov=p.fat_ovr||{};let n=0;const razao=ov.razao?ov.razao_v:(cf.razao||c.nome||''),doc=ov.doc?ov.doc_v:(cf.doc||'');
 if(p.fin){const f=p.fin.faturar||(p.fin.faturar={});if(f.razao!==razao){f.razao=razao;n++}if(f.doc!==doc){f.doc=doc;n++}const outro=!!(ov.razao||ov.doc);if(f.outro!==outro){f.outro=outro;n++}}
 if(p.fechamento&&!vendidaP(p)){const fe=p.fechamento;const r0=cf.razao||c.nome||'',d0=cf.doc||'';if((fe.nf_nome||'')!==r0){fe.nf_nome=r0;n++}if((fe.nf_cpf||'')!==d0){fe.nf_cpf=d0;n++}}return n}
function fatMigra(){if(S.db.v123_fat)return 0;let n=0;(S.db.propostas||[]).forEach(p=>{const c=cliDe(p);const cf=fatDe(c);if(!cf)return;const fe=p.fechamento||{};
  /* proposta aberta com dado de nota que o cliente não tem: sobe para o cliente (sem perda) */
  if(!vendidaP(p)){if(fe.nf_cpf&&!cf.doc){cf.doc=fe.nf_cpf;n++}return}
  const f=(p.fin&&p.fin.faturar)||null;if(!f)return;const ov={};
  if(f.razao&&f.razao!==(cf.razao||c.nome)){ov.razao=true;ov.razao_v=f.razao}
  if(f.doc&&f.doc!==cf.doc){if(!cf.doc&&!f.outro){cf.doc=f.doc;n++}else{ov.doc=true;ov.doc_v=f.doc}}
  if(Object.keys(ov).length){p.fat_ovr=ov;n++}});S.db.v123_fat=1;return n}
function setOverride(p,k,v){const c=cliDe(p);const cf=fatDe(c)||{};const base=k==='razao'?(cf.razao||(c&&c.nome)||''):(cf.doc||'');const ov=Object.assign({},p.fat_ovr||{});v=String(v==null?'':v).trim();
 if(!v||v===base){delete ov[k];delete ov[k+'_v']}else{ov[k]=true;ov[k+'_v']=v}p.fat_ovr=ov;fatSync(p)}
safe(()=>{const _sf=A.setFat;A.setFat=function(pr,k,v){const p=propOf(pr);if(p&&(k==='razao'||k==='doc')){setOverride(p,k,v);if(p.fin){p.fin.faturar=Object.assign({},p.fin.faturar||{},{[k]:String(v==null?'':v).trim()||p.fin.faturar[k]})}fatSync(p);put('propostas',p,'faturamento (override desta proposta)');return}return _sf.apply(this,arguments)};
 A.fatLimparOverride=pr=>{const p=propOf(pr);if(!p)return;p.fat_ovr={};fatSync(p);put('propostas',p,'faturamento volta a ser o do cliente')}},'fat wrappers');
F.fatSync=fatSync;

/* =========================================================================
   SINCRONIZAÇÃO · put (pós-processamento) e render (passo antes de desenhar)
   ========================================================================= */
let syncing=false;
function syncObra(o){if(!o)return;migraDocs(o);deriveDocs(o);faseProjetos(o);mirror(o);syncVinculos(o);o.prospeccao=prosp(o)}
safe(()=>{const _put=window.put;window.put=function(t,row,acao){
 if(t==='obras'&&row&&!syncing){safe(()=>faseExecManual(row))}
 const r=_put.apply(this,arguments);if(syncing)return r;syncing=true;
 try{
  if(t==='obras'&&row)syncObra(obraOf(row.id)||row);
  else if(t==='atividades'&&row&&row.etapa_id)atvParaEtapa((S.db.atividades||[]).find(a=>a.id===row.id)||row);
  else if(t==='at_propostas'&&row){const p=propOf(row.id)||(S.db.propostas||[]).find(x=>x.at===row);if(p)syncPV(p,'live')}
  else if(t==='propostas'&&row){const p=propOf(row.id);if(p){fatSync(p);if(p.obra_id)syncObra(obraOf(p.obra_id))}}
  else if(t==='clientes'&&row){(S.db.propostas||[]).forEach(p=>{const c=cliDe(p);if(c&&c.id===row.id)fatSync(p)})}
  else if(t==='at_atendimentos'&&row){const c=atends().find(x=>x.id===row.id);if(c&&!c.os_id){const pend=pendingOS&&osList().find(o=>o.id===pendingOS);if(pend&&!pend.atendimento_id){pend.atendimento_id=c.id;c.os_id=pend.id;audit('posvenda',c.id,'atendimento ligado ao chamado '+pend.id)}else osParaAtend(c);pendingOS=null}}
 }catch(e){console.warn('V123 flow put',t,e)}finally{syncing=false}return r};
},'put');
function syncTudo(){if(syncing)return;syncing=true;try{(S.db.obras||[]).forEach(o=>safe(()=>syncObra(o),'syncObra'));(S.db.propostas||[]).forEach(p=>safe(()=>fatSync(p)));safe(syncChamados)}finally{syncing=false}}
F.syncTudo=syncTudo;

/* =========================================================================
   8 · Comercial › Hoje: próximas ações do CRM dos parceiros das negociações (somente leitura)
   ========================================================================= */
function crmAcoes(){const tar=((window.CRM_T&&CRM_T.tarefas)||[]).filter(t=>!t.concluida&&!/conclu|feita|cancel/i.test(String(t.status||'pendente')));if(!tar.length)return [];
 const par=S.db.parceiros||[];const byCrm={};par.forEach(p=>{if(p.crm_id!=null)byCrm[+p.crm_id]=p});const byNome={};par.forEach(p=>{byNome[String(p.nome||'').trim().toLowerCase()]=p});
 const f=S.comF||{};const negs=(S.db.negociacoes||[]).filter(n=>!n.resultado&&(!f.frente||n.frente===f.frente));const out=[];
 negs.forEach(n=>{const ps=new Set();Object.values(n.parceiros||{}).forEach(id=>{const p=par.find(x=>x.id===id);if(p)ps.add(p)});[...Object.values(n.fontes||{}),...Object.values(n.cadeia||{})].forEach(nm=>{const p=byNome[String(nm||'').trim().toLowerCase()];if(p)ps.add(p)});
  ps.forEach(p=>tar.filter(t=>+t.parceiro_id===+p.crm_id).forEach(t=>{if(!out.some(x=>x.t===t))out.push({t,p,n})}))});
 return out.sort((a,b)=>String(a.t.data_prevista||'').localeCompare(String(b.t.data_prevista||'')))}
F.crmAcoes=crmAcoes;
function blocoCRM(){const L=crmAcoes();const td=T();const at=L.filter(x=>String(x.t.data_prevista||'').slice(0,10)<td).length;
 return `<div class="card p-3 mt-3" id="v123_crm_hoje" data-n="${L.length}" data-atras="${at}"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><h6 class="mb-0"><i class="bi bi-people me-1"></i>Próximas ações do CRM nestas negociações <span class="chip ${at?'warn':'info'}">${nBR(L.length)}${at?` · ${nBR(at)} atrasada(s)`:''}</span></h6><a class="btn-soft" style="font-size:12px" href="#/crmtarefas">Abrir no CRM</a></div><div class="sub mb-2" style="font-size:12px">As mesmas tarefas do CRM (Próximas ações) dos parceiros ligados às suas negociações abertas — só leitura: concluir é no CRM.</div>`
  +(L.length?`<div class="tblwrap"><table class="tbl no-filter"><thead><tr><th>Data</th><th>Parceiro</th><th>Ação</th><th>Responsável</th><th>Negociação</th></tr></thead><tbody>${L.map(x=>`<tr><td class="mono ${String(x.t.data_prevista||'').slice(0,10)<td?'text-danger':''}">${dBR(x.t.data_prevista)}</td><td><b>${esc(x.p.nome)}</b></td><td>${esc(x.t.sugestao||'')}${x.t.descricao?`<div class="sub" style="font-size:11.5px">${esc(String(x.t.descricao).slice(0,140))}</div>`:''}</td><td>${esc(x.t.responsavel||'—')}</td><td>${esc(x.n.codinome||x.n.cliente_nome||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="sub">Nenhuma próxima ação do CRM pendente para os parceiros das negociações abertas.</div>')+'</div>'}

/* =========================================================================
   9 · Operação › Nova obra = o fluxo do Comercial (cliente → obra → proposta)
   ========================================================================= */
safe(()=>{const _fo=COP.ope.formObra;COP.ope.formObra=function(id){if(!id){S.v123NovaObra=true;location.hash='#/nova';setTimeout(()=>safe(()=>toast('A obra nasce com a proposta: escolha o cliente, a obra (ou "nova obra") e crie o rascunho — o mesmo caminho do Comercial.')),60);return}
  /* editar obra: Proposta(s) e Consultor comercial são leitura das propostas ligadas */
  const o=obraOf(id);const v=o&&vinculos(o);if(!v)return _fo.apply(this,arguments);const _f=COP.form;COP.form=function(title,fields){try{(fields||[]).forEach(f=>{if(f&&(f.k==='propostasPlanilha'||f.k==='comercial')){f.ro=true;f.v=f.k==='propostasPlanilha'?v.nums:(v.cons||f.v);f.help='Vem das propostas desta obra (Comercial) — muda lá.'}})}catch(e){}COP.form=_f;return _f.apply(this,arguments)};try{return _fo.apply(this,arguments)}finally{COP.form=_f}}},'formObra');

/* =========================================================================
   10 · Estoque: "A receber" (mercadoria) → "A chegar"
   ========================================================================= */
safe(()=>{NAV.forEach(s=>(s.items||[]).forEach(it=>{if(it[0]==='areceber')it[1]='A chegar'}));LABEL.areceber='A chegar'},'nav areceber');
safe(()=>{const _ar=SCREENS.areceber;if(typeof _ar==='function'&&!_ar.__v123){const w=function(){let h=_ar.apply(this,arguments);if(typeof h==='string')h=h.replace(/(<h[1-6][^>]*>(?:\s*<[^>]+>)*\s*)A receber(\s*<)/,'$1A chegar$2');return h};w.__v123=true;SCREENS.areceber=w}},'areceber title');
/* textos do Estoque que apontavam para "A receber" (Cotações etc.) */
const ESTQ=new Set(['epainel','estoque','obrascompras','cotacoes','reposicao','areceber','entradas','separacao','montagens','saidas','conferencia','travado','rma','baixas','cortarrolo','manutencao','compras','cotacao','cep']);

/* =========================================================================
   render: sincroniza antes de desenhar; pós-passes de tela e menu
   ========================================================================= */
safe(()=>{const _rd=window.render;window.render=function(){safe(syncTudo,'syncTudo');return _rd.apply(this,arguments)}},'render');
safe(()=>{const _rm=window.renderMain;window.renderMain=function(){F.wrapListas();const r=_rm.apply(this,arguments);safe(()=>{const {k,arg}=route();const m=document.getElementById('main');if(!m)return;
  const b=!m.querySelector('#v123_prosp')&&barraProsp(k,arg);if(b){const h=m.querySelector('.d-flex.justify-content-between,h4,h5');const box=document.createElement('div');box.innerHTML=b;const first=m.firstElementChild;if(first&&first.nextSibling)m.insertBefore(box.firstChild,first.nextSibling);else m.prepend(box.firstChild)}
  if((k==='obras'||k==='prjobras'||k==='fobras')&&arg){const o=obraOf(arg);if(o&&prosp(o)&&!m.querySelector('#v123_prosp_obra')){const d=document.createElement('div');d.innerHTML=`<div class="card p-2 px-3 mb-2" id="v123_prosp_obra" style="border-left:4px solid #6f42c1;font-size:12.5px"><span class="chip pur">Prospecção</span> Nenhuma proposta desta obra foi vendida ainda — ela aparece nas listas da Operação, Projetos e Financeiro no Vendido.</div>`;m.prepend(d.firstChild)}}
  if(k==='hoje'&&!m.querySelector('#v123_crm_hoje')){const d=document.createElement('div');d.innerHTML=blocoCRM();m.appendChild(d.firstChild)}
  if(ESTQ.has(k)){const w=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let n;const L=[];while(n=w.nextNode()){if(/\b[Aa] receber\b|\bA RECEBER\b/.test(n.textContent)&&!/R\$/.test(n.textContent))L.push(n)}L.forEach(n=>n.textContent=n.textContent.replace(/\bA receber\b/g,'A chegar').replace(/\ba receber\b/g,'a chegar').replace(/\bA RECEBER\b/g,'A CHEGAR'))}
  if(k==='nova'&&S.v123NovaObra){const hd=m.querySelector('h4,h5,h1,h2,h3');if(hd&&!m.querySelector('#v123_nova_obra')){const d=document.createElement('div');d.innerHTML=`<div class="card p-2 px-3 mb-2" id="v123_nova_obra" style="border-left:4px solid #0d6efd;font-size:12.5px">Vindo de <b>Operação › Nova obra</b>: a obra nasce aqui, junto com a proposta (cliente → obra → proposta). Ela aparece na Operação quando a proposta for vendida.</div>`;m.prepend(d.firstChild)}}
 },'renderMain post');return r}},'renderMain');
safe(()=>{const _rn=window.renderNav;window.renderNav=function(){const r=_rn.apply(this,arguments);safe(()=>{const sn=document.getElementById('subnav');if(!sn)return;const k=route().k;
  sn.querySelectorAll('a[href="#/areceber"]').forEach(a=>{const tn=[...a.childNodes].find(n=>n.nodeType===3&&/A receber/.test(n.textContent));if(tn)tn.textContent=tn.textContent.replace('A receber','A chegar')});
  const sol=sn.querySelector('a[href="#/posvenda"]');const at=sn.querySelector('a[href="#/posatend"]');
  if(sol||at){let a=sol||at;if(!sn.querySelector('a[href="#/chamados"]')){const n=document.createElement('a');n.setAttribute('href','#/chamados');const ab=osList().filter(o=>o.estado==='aberta'&&!o.retomada&&o.tipo!=='Retomada').length;n.innerHTML='Chamados'+(ab?`<span class="cnt">${ab}</span>`:'');a.parentNode.insertBefore(n,a)}
   if(sol)sol.remove();if(at)at.remove();}
  const ch=sn.querySelector('a[href="#/chamados"]');if(ch)ch.classList.toggle('on',k==='chamados');
  if(k==='chamados'&&!ch){/* menu sem o grupo aberto: nada */}
 },'renderNav post');return r}},'renderNav');

/* =========================================================================
   migração única (sem perda) + primeira sincronização
   ========================================================================= */
safe(()=>{const d=S.db;const rep={};
 if(!d.v123_flow_mig){rep.titulosPV=F.backfillPV();rep.chamados=F.backfillChamados();rep.fat=fatMigra();d.v123_flow_mig={em:T(),...rep}}
 else{fatMigra()}
 syncTudo();F.wrapListas();F.mig=d.v123_flow_mig;if(!d.v123_flow_saved){d.v123_flow_saved=1;safe(()=>save())}},'migração');
safe(()=>{if(document.getElementById('main'))render()},'first render');
})();
