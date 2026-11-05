/* v157 · CONTROLE DE AT 2026 ENTRA NO PÓS-VENDA (Bruno, 05/11/2026)
   A planilha CONTROLE_DE_AT_2026_SISTEMA.xlsm é a verdade do Pós-venda (regra de 04/11). Esta carga coloca no Pós-venda,
   sem tocar nos números do Comercial:
   §1 744 atendimentos de jan–out/2026 → uma proposta do Pós-venda (tabela única de propostas, linha 'posvenda', cadastro AT em p.at) + um atendimento (at_atendimentos) + o status de
      campo (at_fsr) por linha. Valor, cobrança extra, repasse, custo de equipamento, deslocamento e custo técnico vêm da
      planilha; a receita do Pós-venda é a soma (valor + extra) e fecha com a planilha.
   §2 Regras do Bruno (05/11): locais diferentes (SP, Laranjeiras, FBV…) = obras diferentes do mesmo cliente · casal/família
      = um cliente · casa que mudou de dono ("X EX Y") = a mesma obra, o novo dono é o cliente e o histórico fica na casa ·
      cliente sem obra no Painel = cliente + "obra legado" (origem Controle AT) · linha sem local, quando o cliente tem mais
      de uma obra = lista "Local a definir" · PIX e D (depósito) são forma de pagamento · número repetido com preço diferente
      = dois serviços (o segundo ganha "-B").
   §3 25 Planos de Serviço (aba 2024-2026 PS) → planos de serviço (mesma tabela, tipo SERVICE_PLAN). Mensalidade paga é do Financeiro: nenhuma
      parcela é inventada, então o plano não soma receita até o Financeiro registrar o pagamento.
   §4 Bônus técnico: a regra (10% × (valor − custo técnico − deslocamento); P.S. = R$ 60) é calculada e guardada em cada
      linha; o custo que entra no resultado de 2026 é o bônus que a planilha registra (o que foi pago). A diferença fica à
      vista na Conferência AT.
   §5 Histórico: totais mensais 2021–2025 (aba Gráfico) só para o gráfico de crescimento.
   §6 Telas: Pós-venda › Carteira do Pós-venda (lista 2: clientes atendidos em 2026 + planos + obras concluídas há 3 meses
      ou mais + nomes de cold call) e Pós-venda › Conferência AT (os números fecham na tela).
   Re-executável: chave = D.quando; registros com o mesmo id são atualizados, nunca duplicados. */
(function(){
'use strict';
if(window.__v157)return;window.__v157=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V157_AT;if(!D||!Array.isArray(D.rows)){console.error('v157: v157-controle-at-data.js não carregou');return}
const FONTE='Controle de AT 2026 (Pós-venda)';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hoje=()=>T_(()=>today(),new Date().toISOString().slice(0,10));
const c$=v=>Math.round((+v||0)*100);
const BRL=c=>((+c||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const N0=v=>(+v||0).toLocaleString('pt-BR');
const fmtD=d=>/^\d{4}-\d{2}-\d{2}/.test(d||'')?String(d).slice(0,10).split('-').reverse().join('/'):(d||'—');
const treino=()=>T_(()=>localStorage.getItem('systaag_treino_on')==='1',false);
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const addM=(d,m)=>{const x=new Date(String(d).slice(0,10)+'T12:00:00');x.setMonth(x.getMonth()+m);return x.toISOString().slice(0,10)};

function estado(db){db._v157=db._v157||{};return db._v157}
const vivas=db=>(db.obras||[]).filter(o=>!o.merged_into&&!o.inativo);

/* ---------- §2 obras e clientes ---------- */
function porLinha(db){const m={};vivas(db).forEach(o=>{if(o.linhaPlanilha!=null&&!m[o.linhaPlanilha])m[o.linhaPlanilha]=o});return m}
function acharCliente(db,chave){const info=D.clientes[chave]||{nome:chave,grafias:[]};const alvos=new Set([info.nome].concat(info.grafias||[]).map(norm));
  return (db.clientes||[]).find(c=>!c.merged_into&&(alvos.has(norm(c.nome))||(c.aliases||[]).some(a=>alvos.has(norm(a)))))||null}
function clienteDoAT(db,chave,obrasPainel){
  const F=estado(db);F.cli=F.cli||{};if(F.cli[chave]&&get('clientes',F.cli[chave]))return get('clientes',F.cli[chave]);
  const viaObra=obrasPainel.map(o=>o&&o.cliente_id&&T_(()=>get('clientes',o.cliente_id),null)).find(Boolean);
  let c=viaObra||acharCliente(db,chave);
  if(!c){const info=D.clientes[chave]||{nome:chave,grafias:[]};const n=(db.clientes||[]).filter(x=>/^CLI-AT/.test(x.id)).length+1;
    c={id:'CLI-AT'+String(n).padStart(3,'0'),nome:info.nome,sigla:T_(()=>siglaDe(info.nome),''),aliases:(info.grafias||[]).filter(g=>norm(g)!==norm(info.nome)),arquiteto:'',cidade:'',contato:'',ativo:true,origem:FONTE,criadoEm:hoje()};
    db.clientes.push(c)}
  F.cli[chave]=c.id;return c}
function obraLegado(db,L,cliente){
  const id='OBR-AT'+String(D.legados.indexOf(L)+1).padStart(3,'0');let o=(db.obras||[]).find(x=>x.id===id);
  if(o){if(!o.merged_into&&!o.inativo&&cliente&&!o.cliente_id)o.cliente_id=cliente.id;return o}
  o={id,cliente_id:cliente?cliente.id:null,nome:L.nome,endereco:'',programador:'',etapas:[],docs:[],keypads:{},prog:{},agenda:[],entrega:{prevista:'',realizada:''}};
  try{if(typeof mig90==='function')o=mig90(o)}catch(e){}
  o.v90=true;o.etapas=o.etapas||[];o.contatos=o.contatos||[];o.agenda=o.agenda||[];o.projetos=o.projetos||[];o.docs=o.docs||[];
  Object.assign(o,{fases:{},ambientes:[],sistemas:[],notas:[],obs:L.nota||'',origem:FONTE,legadoAT:true,localAT:L.local||'',donoAnterior:L.prev?L.prev:'',
    unidade:/RJ|ANGRA/i.test(L.local||'')?'RJ':'SP',situacao:'Concluída',statusPlanilha:'',urgencia:'Normal',ativo:true,criadoEm:hoje()});
  db.obras.push(o);return o}

/* ---------- §1 atendimentos ---------- */
const GRUPOS_NOVOS=['AT-PADRÃO','P.S','PROPOSTA','RETORNO','CORTESIA','GARANTIA','LEVANTAMENTO','EMERGENCIAL','AT-PLANTÃO','AT-NOTURNO','AT-APÓS AS 18H','AT-MANUTENÇÃO','REMOTO','EXECUÇÃO','FOCAL','OBRAS'];
/* uma proposta do Pós-venda = um registro na tabela única de propostas (linha 'posvenda'), com o cadastro AT em p.at (bloco 62.2) */
function upsert(db,byId,at,extra,c,o){const ex=byId[at.id];
  const p=ex||{id:at.id,blocos:[],ajuste:0,rt:0,bonificacao:0,negociacao:0,margem_taag:30,misc_pct:0,porte:'M',distancia:'capital',consultores:[],produto:'sistema',linha:'posvenda'};
  Object.assign(p,{numero:at.proposal_number,nome:at.name,cliente_nome:at.client_name,sigla:c&&c.sigla||'',cliente_id:at.cliente_id||null,obra_id:at.obra_id||null,linha:'posvenda',
    fonte:FONTE,sem_itens:true,valor_venda:0,aprov:{status:'aprovada',hist:[{em:D.quando,por:'Controle de AT',acao:'atendimento registrado a partir da planilha CONTROLE DE AT 2026'}]},
    fin:{confirmada:false,historico:true,obs:'Atendimento do Pós-venda (planilha CONTROLE DE AT 2026). Recebimento é do Financeiro.'}},extra);
  if(ex&&ex.at){Object.assign(ex.at,at,{sequence_number:ex.at.sequence_number||at.sequence_number})}else p.at=at;
  if(!ex){db.propostas.push(p);byId[at.id]=p}return p}
function carregar(db){const F=estado(db);if(F.quando===D.quando)return 0;
  db.propostas=db.propostas||[];db.at_atendimentos=db.at_atendimentos||[];db.at_fsr=db.at_fsr||{};db.at_listas=db.at_listas||{};
  /* as propostas de exemplo que o protótipo semeou no Pós-venda (p1…p6) não são reais — saem (regra "só o real", 03/11) */
  const demo=db.propostas.filter(p=>p.linha==='posvenda'&&/^p\d+$/.test(String(p.id))&&!p.fonte);
  if(demo.length){F.demoRetiradas=(F.demoRetiradas||0)+demo.length;const ids=new Set(demo.map(p=>p.id));db.propostas=db.propostas.filter(p=>!ids.has(p.id));
    db.at_atendimentos=db.at_atendimentos.filter(c=>!ids.has(c.proposal_id))}
  const l=db.at_listas;l.grupos=Array.isArray(l.grupos)?l.grupos:[];GRUPOS_NOVOS.forEach(g=>{if(!l.grupos.includes(g))l.grupos.push(g)});
  const byL=porLinha(db);F.flags=[];const flag=(tipo,x)=>F.flags.push(Object.assign({tipo},x));
  const obraDe={};const semPainel=new Set();
  /* obras do Painel ligadas por linha */
  D.rows.forEach(r=>{if(r.linha!=null){const o=byL[r.linha];if(o)obraDe['P'+r.linha]=o;else semPainel.add(r.linha)}});
  semPainel.forEach(n=>flag('linha_painel_ausente',{linha:n}));
  /* clientes (um por chave do AT) e obras legado */
  const painelDoCli={};D.rows.forEach(r=>{const o=r.obra&&obraDe[r.obra];if(o)(painelDoCli[r.cli]=painelDoCli[r.cli]||[]).push(o);
    (r.cands||[]).forEach(n=>{const oc=byL[n];if(oc)(painelDoCli[r.cli]=painelDoCli[r.cli]||[]).push(oc)})});
  const cliDe={};const chaves=new Set(D.rows.map(r=>r.cli).concat(D.planos.map(p=>p.cli).filter(Boolean)));
  chaves.forEach(k=>{cliDe[k]=clienteDoAT(db,k,painelDoCli[k]||[])});
  D.legados.forEach(L=>{const o=obraLegado(db,L,cliDe[L.cli]);obraDe[L.chave]=o});
  /* linhas sem local: ficam numa obra "<cliente> — local a definir" (visível), nunca dentro de uma obra escolhida sozinha
     (a regra da árvore colocaria a proposta na única obra do cliente ou criaria uma obra sem nome) */
  const lad={};D.rows.filter(r=>r.revisar).forEach(r=>{if(lad[r.cli])return;const c=cliDe[r.cli];const id='OBR-ATX'+String(Object.keys(lad).length+1).padStart(2,'0');
    let o=(db.obras||[]).find(x=>x.id===id);
    if(!o){o=obraLegado(db,{nome:((D.clientes[r.cli]||{}).nome||r.cli)+' — local a definir',local:'',prev:'',nota:'Atendimentos do Controle de AT sem local: mover cada um para a obra certa. '+r.revisar},c);
      const ix=db.obras.indexOf(o);o.id=id;o.localADefinir=true;o.obs='Atendimentos do Controle de AT sem local: mover cada um para a obra certa. '+r.revisar}
    lad[r.cli]=o});
  /* linhas do Painel ausentes no sistema: a linha fica no cliente e entra na lista para decidir */
  /* um cliente do AT com obras em mais de um cadastro de cliente: fica à vista, nunca fundido */
  Object.keys(painelDoCli).forEach(k=>{const ids=[...new Set(painelDoCli[k].map(o=>o.cliente_id).filter(Boolean))];if(ids.length>1)flag('cliente_em_dois_cadastros',{cli:k,nome:(D.clientes[k]||{}).nome||k,clientes:ids})});
  const byId={};db.propostas.forEach(p=>{if(p.linha==='posvenda')byId[p.id]=p});const cardBy={};db.at_atendimentos.forEach(c=>cardBy[c.id]=c);
  let n=0,seq=(db.at_seq&&db.at_seq.at)||7;
  D.rows.forEach(r=>{const o=r.obra?obraDe[r.obra]:(r.revisar?lad[r.cli]:null);const c=cliDe[r.cli];const nome=(D.clientes[r.cli]||{}).nome||r.original;
    const fechado=r.fs==='CONCLUIDO'&&!r.pend;
    const base={id:r.id,sequence_number:++seq,proposal_number:r.numero,proposal_type:'AT',request_group:r.grupo||'',name:(r.desc||'Atendimento')+'',client_name:nome,at_cliente:r.cli,
      postal_code:'',address:o&&o.endereco||'',open_status:fechado?'FECHADO':'EM ABERTO',approval_status:'APROVADO',
      proposal_value_cents:c$(r.valor),proposal_note:'',additional_value_cents:c$(r.extra),additional_note:r.extra?'Cobrança extra (planilha)':'',discount_value_cents:0,discount_note:'',total_note:'',
      technical_delivery_date:r.data||'',remote_management_enabled:/REMOTO/.test(r.grupo)?1:0,contract_date:'',plan_modality:'',plan_end_date:'',service_plan_tier:'',first_payment_date:'',payments:[],
      third_party_cents:c$(r.repasse),equipment_cost_cents:c$(r.eq),distance_km:0,displacement_cost_cents:c$(r.desl),technical_bonus_cents:c$(r.bonus_planilha),bonus_regra_cents:c$(r.bonus),
      custo_tecnico_planilha_cents:c$(r.tec),obra_id:o?o.id:'',cliente_id:c?c.id:'',created_at:(r.data||D.quando)+' 08:00:00',contacts:[],
      origem:FONTE,fonteAT:{mes:r.mes,linha:r.linha_aba,cliente_planilha:r.original,executor:r.executor_raw,status:r.status_raw,grupo:r.grupo_raw,pagamento:r.pag_raw},
      pendencia:r.pend||'',pendencia_tipo:r.pend_tipo||'',forma_pagamento:r.forma||'',pago_em:r.pago_em||'',relatorio_planilha:r.relatorio,
      localAT:r.loc||'',donoAnterior:r.prev||'',revisar:r.revisar||'',notaAT:r.nota||'',origem_venda:r.grupo==='PROPOSTA'?'Pós-venda':''};
    upsert(db,byId,base,{estado:'aprovada_cliente',data_atendimento:r.data||'',categoria:r.grupo||'AT',filial:o&&o.unidade==='RJ'?'RJ':'SP'},c,o);
    const cid='atc26-'+r.id.slice(5);const card={id:cid,proposal_id:r.id,start_date:r.data||'',end_date:r.data||'',period:'',vehicle:'',services:r.desc||'',technicians:r.exec||[],attachments:[],
      created_at:(r.data||D.quando)+' 08:00:00',tipo:'AT',solicitante:'Pós-venda',custo_depto:'Pós-venda',cobranca:(r.valor+r.extra)>0?'Cobrável':'Sem cobrança',justificativa:'',origem:FONTE};
    if(cardBy[cid])Object.assign(cardBy[cid],card);else{db.at_atendimentos.push(card);cardBy[cid]=card}
    db.at_fsr[cid]={status:r.fs,checkin_at:null,checkout_at:null,report:r.relatorio===true?'Relatório entregue (planilha: OK)':r.relatorio===false?'Sem relatório (planilha: S/R)':'',pending_notes:r.pend||'',updated_by:'Controle de AT'};
    if(r.revisar)flag('local_a_definir',{id:r.id,cli:r.cli,nome,numero:r.numero,data:r.data,desc:r.desc,valor:r.valor+r.extra,motivo:r.revisar});
    if(!r.status_raw)flag('sem_status',{id:r.id,nome,numero:r.numero,data:r.data});
    n++});
  /* §3 planos de serviço */
  D.planos.forEach(p=>{const id='ps26-'+p.numero;const o=p.obra?obraDe[p.obra]:null;const c=p.cli?cliDe[p.cli]:null;const num=p.numero.slice(0,3)+'-'+p.numero.slice(3);
    const dup=db.propostas.find(x=>x.id!==id&&x.linha==='posvenda'&&x.at&&x.at.proposal_type==='SERVICE_PLAN'&&String(x.at.proposal_number)===num);if(dup)return flag('plano_ja_existia',{numero:num,id:dup.id});
    const base={id,sequence_number:0,proposal_number:num,proposal_type:'SERVICE_PLAN',request_group:'P.S',name:'Plano de Serviços '+(p.tier||''),client_name:c?((D.clientes[p.cli]||{}).nome||c.nome):p.nome_planilha,at_cliente:p.cli||'',
      postal_code:'',address:o&&o.endereco||'',open_status:'EM ABERTO',approval_status:'APROVADO',proposal_value_cents:c$(p.valor),proposal_note:'Mensalidade (aba 2024-2026 PS)',additional_value_cents:0,additional_note:'',discount_value_cents:0,discount_note:'',total_note:'',
      technical_delivery_date:'',remote_management_enabled:1,contract_date:p.inicio||'',plan_modality:'MENSAL',plan_end_date:'',service_plan_tier:p.tier||'',first_payment_date:'',payments:[],
      third_party_cents:0,equipment_cost_cents:0,distance_km:0,displacement_cost_cents:0,technical_bonus_cents:0,obra_id:o?o.id:'',cliente_id:c?c.id:'',created_at:(p.inicio||D.quando)+' 08:00:00',
      contacts:p.email?[{name:'Envio de boleto',role:'Financeiro do cliente',phone:'',email:p.email}]:[],origem:FONTE,mes_renovacao:p.mes_renovacao||'',renovacao_2026:p.renovacao_2026||'',nome_planilha:p.nome_planilha};
    upsert(db,byId,base,{estado:'aprovada_cliente',vendida_em:'',categoria:'Plano de Serviços',filial:o&&o.unidade==='RJ'?'RJ':'SP'},c,o);
    if(!o)flag('plano_sem_obra',{numero:num,nome:base.client_name})});
  db.at_seq=db.at_seq||{at:7,ps:550};db.at_seq.at=Math.max(db.at_seq.at||0,seq);
  /* §5 histórico */
  db.at_historico={fonte:D.fonte,anos:D.historico,grafico2026:D.grafico2026_digitado};
  F.quando=D.quando;F.linhas=D.rows.length;F.cli=F.cli||{};
  return n}

/* ---------- conta: o que a tela mostra ---------- */
function numeros(){const db=S.db;const F=estado(db);const atv=()=>(db.propostas||[]).filter(p=>p.linha==='posvenda'&&p.at&&p.at.origem===FONTE).map(p=>p.at);const ps=atv().filter(p=>p.proposal_type==='AT');
  const com=ps.filter(p=>p.obra_id);const ob=p=>T_(()=>get('obras',p.obra_id),null);const painel=com.filter(p=>{const o=ob(p);return o&&!o.legadoAT});const leg=com.filter(p=>{const o=ob(p);return o&&o.legadoAT&&!o.localADefinir});
  const sem=ps.filter(p=>!p.obra_id||!ob(p)||ob(p).localADefinir);const rec=p=>(p.proposal_value_cents||0)+(p.additional_value_cents||0);const soma=a=>a.reduce((n,p)=>n+rec(p),0);
  const planilha=Math.round(D.rows.reduce((n,r)=>n+(r.valor+r.extra)*100,0));
  return {F,ps,painel,leg,sem,soma,planilha,planos:atv().filter(p=>p.proposal_type==='SERVICE_PLAN')}}

/* ---------- §6 telas ---------- */
const tile=(l,v,s,cls,on)=>`<div class="col-md-3 col-6"><div class="card p-3 h-100" ${on?`style="cursor:pointer" onclick="${on}"`:''}><div class="sub" style="font-size:11px;letter-spacing:.06em">${l}</div><div style="font-size:26px;font-weight:800" class="${cls||''}">${v}</div><div class="sub" style="font-size:12px">${s}</div></div></div>`;
const ok='<span style="color:#198754">✓</span>',nok='<span style="color:#dc3545">✗</span>';
const obraLink=(id,txt)=>id?`<a href="#/obras/${E(id)}">${E(txt||id)}</a>`:E(txt||'—');
const irGer=(extra)=>`COP.pos&&COP.pos.go('posgerencial','posgerencial',Object.assign({tipo:'propostas'},${extra||'{}'}))`;
function barras(){const H=(S.db.at_historico||{}).anos||{};const anos=Object.keys(H).sort();const r=numeros();
  const tot={};anos.forEach(a=>tot[a]=H[a].reduce((n,v)=>n+v,0));const a26=r.soma(r.ps)/100;tot['2026 (jan–out)']=a26;
  const max=Math.max(...Object.values(tot),1);
  return Object.entries(tot).map(([a,v])=>`<div class="d-flex align-items-center gap-2 mb-1" style="font-size:13px"><span style="width:110px">${E(a)}</span><div style="flex:1;background:var(--bd);border-radius:4px;height:18px"><div style="width:${Math.round(v/max*100)}%;height:18px;border-radius:4px;background:${/2026/.test(a)?'#0d6efd':'#9ec5fe'}"></div></div><b class="mono" style="width:130px;text-align:right">${BRL(Math.round(v*100))}</b></div>`).join('')}
function telaConf(){const r=numeros();const F=r.F;const fl=F.flags||[];const por=t=>fl.filter(f=>f.tipo===t);
  const tot=r.ps.length,np=r.painel.length,nl=r.leg.length,ns=r.sem.length;
  const eq1=`${N0(tot)} atendimentos na planilha = ${N0(np)} em obras do Painel + ${N0(nl)} em obras legado + ${N0(ns)} com local a definir ${tot===np+nl+ns&&tot===D.rows.length?ok:nok}`;
  const eq2=`${BRL(r.soma(r.ps))} de receita 2026 = ${BRL(r.soma(r.painel))} (Painel) + ${BRL(r.soma(r.leg))} (legado) + ${BRL(r.soma(r.sem))} (local a definir) · planilha: ${BRL(r.planilha)} ${r.soma(r.ps)===r.planilha?ok:nok}`;
  const bReg=r.ps.reduce((n,p)=>n+(p.bonus_regra_cents||0),0),bPl=r.ps.reduce((n,p)=>n+(p.technical_bonus_cents||0),0);
  const G=(S.db.at_historico||{}).grafico2026||[];const mesC=m=>r.ps.filter(p=>p.fonteAT&&p.fonteAT.mes===m).reduce((n,p)=>n+(p.proposal_value_cents||0)+(p.additional_value_cents||0),0);
  const gRows=MESES.slice(0,10).map((m,i)=>{const s=mesC(i+1),g=Math.round((G[i]||0)*100),d=s-g;return `<tr><td>${m}/2026</td><td class="mono">${BRL(s)}</td><td class="mono">${BRL(g)}</td><td class="mono ${d?'rd':''}">${d?BRL(d):'—'}</td></tr>`}).join('');
  const lista=(titulo,items,fmt,sub)=>items.length?`<div class="card p-3 mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><h6 class="m-0">${titulo} <span class="chip">${N0(items.length)}</span></h6>${sub?`<span class="sub">${sub}</span>`:''}</div><div class="table-responsive"><table class="table table-sm mb-0">${items.map(fmt).join('')}</table></div></div>`:'';
  const grupoLad={};por('local_a_definir').forEach(f=>(grupoLad[f.nome]=grupoLad[f.nome]||[]).push(f));
  const ladRows=Object.entries(grupoLad).map(([nm,a])=>({nm,a}));
  const notas=r.ps.concat(r.planos).filter(p=>p.notaAT);const notaUn={};notas.forEach(p=>{const k=p.client_name+'|'+(p.localAT||'');notaUn[k]=notaUn[k]||{p,n:0};notaUn[k].n++});
  return head('Conferência AT',`A planilha CONTROLE DE AT 2026 (${E(D.fonte)}) comparada com o que entrou no Pós-venda. Nada se sobrepõe: cada diferença está aqui.`)+
   `<div class="row g-3 mb-3">${tile('ATENDIMENTOS 2026',N0(tot),'jan–out/2026','',irGer())}${tile('RECEITA 2026',BRL(r.soma(r.ps)),'valor + cobrança extra','gr',"location.hash='#/posresultado'")}${tile('CLIENTES',N0(Object.keys(D.clientes).length),'casal/família = um cliente','',"location.hash='#/poscarteira'")}${tile('LOCAL A DEFINIR',N0(ns),'linhas sem obra certa',ns?'rd':'',"document.getElementById('v157-lad')&&document.getElementById('v157-lad').scrollIntoView({behavior:'smooth'})")}</div>
    <div class="card p-3 mb-3" style="border-left:4px solid #198754"><div>${eq1}</div><div class="mt-1">${eq2}</div>
    <div class="mt-1">${N0(r.planos.length)} planos de serviço · mensalidades ${BRL(r.planos.reduce((n,p)=>n+(p.proposal_value_cents||0),0))}/mês (a receita do plano entra quando o Financeiro registra o pagamento)</div>
    <div class="sub mt-1" style="font-size:12px">A receita fica só no Pós-venda (centro de custo próprio): não soma nas vendas do Comercial. ${F.demoRetiradas?N0(F.demoRetiradas)+' propostas de exemplo do Pós-venda foram retiradas (não eram reais).':''}</div></div>`+
   `<div class="row g-3 mb-3"><div class="col-lg-6"><div class="card p-3 h-100"><h6>Crescimento do Pós-venda</h6><div class="sub mb-2" style="font-size:12px">2021–2025: totais da aba Gráfico · 2026: soma dos atendimentos</div>${barras()}</div></div>
    <div class="col-lg-6"><div class="card p-3 h-100"><h6>2026: soma das linhas × total digitado no Gráfico</h6><div class="sub mb-2" style="font-size:12px">No sistema o total do mês é a soma das linhas; os totais digitados à mão na aba Gráfico ficam só para comparação.</div><table class="table table-sm mb-0"><tr><th>Mês</th><th>Soma das linhas</th><th>Digitado no Gráfico</th><th>Diferença</th></tr>${gRows}</table></div></div></div>`+
   `<div id="v157-lad">`+lista('Local a definir (a linha fica no cliente até a equipe dizer qual obra)',ladRows,x=>`<tr><td><b>${E(x.nm)}</b></td><td>${N0(x.a.length)} atendimento(s) · ${BRL(Math.round(x.a.reduce((n,f)=>n+f.valor,0)*100))}</td><td class="sub">${E(x.a[0].motivo)}</td><td><a href="javascript:void 0" onclick="${irGer(`{busca:'${E(x.nm).replace(/'/g,'')}'}`)}">ver as linhas</a></td></tr>`,'cliente · linhas · obras possíveis')+`</div>`+
   lista('Notas da carga (casas que mudaram de dono, linhas em dobro no Painel, lugares parecidos)',Object.values(notaUn),x=>`<tr><td><b>${E(x.p.client_name)}</b>${x.p.localAT?' · '+E(x.p.localAT):''}</td><td>${obraLink(x.p.obra_id,T_(()=>get('obras',x.p.obra_id).nome,''))}</td><td class="sub">${E(x.p.notaAT)}</td><td>${N0(x.n)}</td></tr>`,'cliente · obra · nota · atendimentos')+
   lista('Mesmo cliente em mais de um cadastro (não foi fundido)',por('cliente_em_dois_cadastros'),f=>`<tr><td><b>${E(f.nome)}</b></td><td>${f.clientes.map(id=>E(T_(()=>get('clientes',id).nome,id))).join('<br>')}</td></tr>`,'as obras do Painel deste cliente estão em cadastros diferentes')+
   lista('Linhas do Painel que não estão no sistema',por('linha_painel_ausente'),f=>`<tr><td>linha ${E(f.linha)} do Painel de Controle</td></tr>`)+
   lista('Atendimentos sem status na planilha',por('sem_status'),f=>`<tr><td>${E(f.numero)}</td><td>${E(f.nome)}</td><td>${fmtD(f.data)}</td></tr>`,'ficam como "Pendente"')+
   lista('Planos sem obra definida',por('plano_sem_obra'),f=>`<tr><td>${E(f.numero)}</td><td>${E(f.nome)}</td></tr>`,'o plano fica no cliente')+
   `<div class="card p-3 mb-3"><h6>Bônus técnico</h6><div>Regra (10% × (valor − custo técnico − deslocamento); P.S. = R$ 60): <b>${BRL(bReg)}</b> · registrado na planilha (o que foi pago): <b>${BRL(bPl)}</b> · diferença <b class="${bReg-bPl?'rd':''}">${BRL(bReg-bPl)}</b></div><div class="sub mt-1" style="font-size:12px">O resultado de 2026 usa o que a planilha registra; a regra fica calculada em cada atendimento para comparação.</div></div>`+
   `<div class="sub" style="font-size:12px">Fonte: ${E(D.fonte)} · a planilha é só lida · para atualizar, gera-se uma nova cópia (v157-controle-at-data.js) e a carga reaplica sem duplicar.</div>`}

/* Carteira do Pós-venda — lista 2 */
function carteira(){const db=S.db;const td=hoje();const lim=addM(td,-3);const map={};
  const add=(k,nome,motivo,extra)=>{const x=map[k]=map[k]||{nome,motivos:new Set(),obras:new Set(),ultimo:'',n:0,receita:0,plano:''};x.motivos.add(motivo);Object.assign(x,extra&&{} );return x};
  (db.propostas||[]).filter(p=>p.linha==='posvenda'&&p.at&&p.at.origem===FONTE).map(p=>p.at).forEach(p=>{const k=p.at_cliente||p.client_name;const x=add(k,p.client_name,p.proposal_type==='SERVICE_PLAN'?'Plano de serviço':'Atendido em 2026');
    if(p.obra_id)x.obras.add(p.obra_id);if(p.proposal_type==='SERVICE_PLAN')x.plano=p.service_plan_tier||'plano';else{x.n++;x.receita+=(p.proposal_value_cents||0)+(p.additional_value_cents||0);if((p.technical_delivery_date||'')>x.ultimo)x.ultimo=p.technical_delivery_date}});
  const jaObras=new Set();Object.values(map).forEach(x=>x.obras.forEach(id=>jaObras.add(id)));
  /* o mesmo cliente (cadastro) de um atendido em 2026 fica na mesma linha da carteira */
  const keyDoCli={};(db.propostas||[]).filter(p=>p.linha==='posvenda'&&p.at&&p.at.origem===FONTE).forEach(p=>{if(p.cliente_id&&!keyDoCli[p.cliente_id])keyDoCli[p.cliente_id]=p.at.at_cliente||p.at.client_name});
  let garantia=0,semData=0;
  /* uma data que aparece em 10 obras ou mais é carimbo de carga (seed, Mestra), não data de conclusão */
  const freq={};vivas(db).forEach(o=>{const d=o.entrega&&o.entrega.realizada;if(d)freq[d]=(freq[d]||0)+1});
  vivas(db).filter(o=>!o.legadoAT&&T_(()=>COP.situacao(o),o.situacao)==='Concluída').forEach(o=>{if(jaObras.has(o.id))return;
    const et=o.et&&/^\d{4}-\d{2}-\d{2}$/.test(o.et.fim||'')&&/realizad/i.test(o.et.situacao||'')?o.et.fim:'';
    const real=(o.entrega&&o.entrega.realizada)||'';const conhecida=et||(real&&freq[real]<10&&real!==o.criadoEm?real:'');
    if(conhecida&&conhecida>lim){garantia++;return}
    if(!conhecida)semData++;
    const c=T_(()=>get('clientes',o.cliente_id),null);const k=(c&&keyDoCli[c.id])||('OBRA|'+(c?c.id:o.id));const x=add(k,c?c.nome:o.nome,conhecida?'Obra concluída há 3 meses ou mais':'Obra concluída (data não informada)');x.obras.add(o.id)});
  (db.at_coldcall||[]).forEach(cc=>{add('CC|'+cc.id,cc.nome,'Cold call')});
  return {lista:Object.entries(map).map(([k,x])=>Object.assign(x,{k})),garantia,semData}}
function telaCarteira(){const u=(window.COP&&COP.ui&&(COP.ui.poscarteira=COP.ui.poscarteira||{}))||{};const r=carteira();const L=r.lista;
  const cnt=m=>L.filter(x=>x.motivos.has(m)).length;const fil=u.m?L.filter(x=>x.motivos.has(u.m)):L;const q=norm(u.q||'');const vis=fil.filter(x=>!q||norm(x.nome).includes(q)).sort((a,b)=>(b.ultimo||'').localeCompare(a.ultimo||'')||a.nome.localeCompare(b.nome));
  const multi=L.filter(x=>x.motivos.size>1).length;const soma=cnt('Atendido em 2026')+cnt('Plano de serviço')+cnt('Obra concluída há 3 meses ou mais')+cnt('Obra concluída (data não informada)')+cnt('Cold call');
  const ch=(m,l)=>`<button class="btn-soft ${u.m===m?'on':''}" style="font-size:12px" onclick="COP.ui.poscarteira.m=${m?`'${m}'`:'null'};render()">${l} <b>${N0(m?cnt(m):L.length)}</b></button>`;
  return head('Carteira do Pós-venda','Lista 2: os clientes que o Pós-venda atende e para quem oferece serviços pontuais. Separada da lista do Comercial (2026 → hoje).',
    `<button class="btn-apple" onclick="COP.v157.coldcall()"><i class="bi bi-telephone-plus me-1"></i>Adicionar nome (cold call)</button>`)+
   `<div class="card p-3 mb-3" style="border-left:4px solid #0d6efd"><div>${N0(L.length)} clientes na carteira = ${N0(soma)} entradas por motivo − ${N0(soma-L.length)} que aparecem em mais de um motivo (${N0(multi)} clientes) ${soma-L.length>=0?ok:nok}</div>
    <div class="sub mt-1" style="font-size:12px">${N0(r.garantia)} obra(s) concluída(s) há menos de 3 meses fica(m) fora: está(ão) na garantia, com a Operação. ${r.semData?N0(r.semData)+' obras concluídas não têm data de conclusão registrada (a E.T. não anotou o fim) e entram como "data não informada".':''}</div></div>
   <div class="d-flex flex-wrap gap-1 mb-2">${ch(null,'Todos')}${ch('Atendido em 2026','Atendidos em 2026')}${ch('Plano de serviço','Com plano')}${ch('Obra concluída há 3 meses ou mais','Concluídas +3 meses')}${ch('Obra concluída (data não informada)','Concluídas, data não informada')}${ch('Cold call','Cold call')}</div>
   <input class="form-control form-control-sm mb-2" style="max-width:360px" placeholder="Buscar cliente" value="${E(u.q||'')}" oninput="COP.ui.poscarteira.q=this.value;clearTimeout(window.__v157t);window.__v157t=setTimeout(()=>{render();const e=document.querySelector('[data-v157q]');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}},250)" data-v157q>
   <div class="card p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Cliente</th><th>Por que está aqui</th><th>Obras</th><th>Atend. 2026</th><th>Receita 2026</th><th>Último atendimento</th></tr></thead><tbody>${vis.slice(0,u.lim||80).map(x=>`<tr><td><b>${E(x.nome)}</b>${x.plano?` <span class="chip ok">${E(x.plano)}</span>`:''}</td><td class="sub" style="font-size:12px">${[...x.motivos].map(E).join(' · ')}</td><td style="font-size:12px">${[...x.obras].slice(0,3).map(id=>obraLink(id,T_(()=>get('obras',id).nome,id))).join('<br>')}${x.obras.size>3?'<br>+'+(x.obras.size-3):''}</td><td>${x.n?`<a href="javascript:void 0" onclick="${irGer(`{busca:'${E(x.nome).replace(/'/g,'')}'}`)}">${N0(x.n)}</a>`:'—'}</td><td class="mono">${x.receita?BRL(x.receita):'—'}</td><td>${fmtD(x.ultimo)}</td></tr>`).join('')||'<tr><td colspan="6" class="sub">Nenhum cliente neste filtro.</td></tr>'}</tbody></table></div></div>
   ${vis.length>(u.lim||80)?`<div class="text-center mt-2"><button class="btn-soft" onclick="COP.ui.poscarteira.lim=${(u.lim||80)+80};render()">Mostrar mais (${N0(vis.length-(u.lim||80))})</button></div>`:''}`}

window.COP=window.COP||{};COP.v157={coldcall(){const nome=(window.prompt?prompt('Nome do cliente para o cold call do Pós-venda:'):'')||'';if(!nome.trim())return;
  const db=S.db;db.at_coldcall=db.at_coldcall||[];db.at_coldcall.push({id:'cc'+Date.now().toString(36),nome:nome.trim(),criadoEm:hoje()});T_(()=>save());render()},numeros,carteira};

try{SCREENS.posconfat=telaConf;SCREENS.poscarteira=telaCarteira;
  [['poscarteira','Carteira do Pós-venda'],['posconfat','Conferência AT']].forEach(([k,l])=>{LABEL[k]=l;SEC_OF[k]='pos';if(typeof OWNER==='object')OWNER[k]='pos'});
  const pos=NAV.find(s=>s.id==='pos');if(pos){[['poscarteira','Carteira do Pós-venda'],['posconfat','Conferência AT']].forEach(it=>{if(!pos.items.some(([k])=>k===it[0]))pos.items.push(it)})}
  const _rn=window.renderNav;window.renderNav=function(){const r=_rn.apply(this,arguments);try{if(S.__dept!=='pos')return r;const sn=document.getElementById('subnav');if(!sn||sn.querySelector('[data-v157]'))return r;
    const k=T_(()=>route().k,'');const it=[['poscarteira','Carteira do Pós-venda'],['posconfat','Conferência AT']];
    sn.insertAdjacentHTML('beforeend',`<div data-v157 class="sub" style="font-size:10px;letter-spacing:.06em;padding:8px 10px 2px;font-weight:700"><span><i class="bi bi-people me-1"></i>CARTEIRA E CARGA</span></div>`+it.map(([key,lb])=>`<a href="#/${key}" class="${key===k?'on':''}">${lb}</a>`).join(''))}catch(e){}return r}}catch(e){console.error('v157 tela',e)}

/* ---------- Comercial não muda (regra do Bruno, 05/11) ----------
   Os atendimentos do Controle de AT são do Pós-venda: não são venda do Comercial (V142.real = falso, como as propostas do Painel no v150)
   e não aparecem na lista de Propostas do Comercial — só as 39 vendas de upgrade (grupo PROPOSTA) aparecem lá, marcadas
   "origem Pós-venda", sem somar na meta. A receita deles fica no Resultado do Pós-venda. */
const ehAT=p=>p&&p.fonte===FONTE;
const ehUpgrade=p=>ehAT(p)&&p.at&&p.at.origem_venda==='Pós-venda';
try{if(window.V142&&typeof V142.real==='function'&&!V142.real.__v157){const f=V142.real;V142.real=function(p){if(ehAT(p))return false;return f.apply(this,arguments)};V142.real.__v157=1}}catch(e){}
function semAT(fn,keep){return function(){const all=S.db.propostas;if(!Array.isArray(all))return fn.apply(this,arguments);
  S.db.propostas=all.filter(p=>!ehAT(p)||(keep&&keep(p)));try{return fn.apply(this,arguments)}finally{S.db.propostas=all}}}
try{if(typeof SCREENS.propostas==='function'&&!SCREENS.propostas.__v157){const _p=SCREENS.propostas;SCREENS.propostas=semAT(function(){let h=_p.apply(this,arguments);
  if(typeof h==='string'){const n=(S.db.propostas||[]).filter(ehUpgrade).length;if(n)h=h.replace(/(<\/h\d>)/,`$1<div class="sub" style="font-size:12px;margin:-4px 0 8px">${N0(n)} upgrades vendidos pelo Pós-venda aparecem nesta lista (linha Pós-venda) e não somam na meta: a receita é do Pós-venda › Resultado. Os atendimentos do Pós-venda ficam no Pós-venda.</div>`)}return h},ehUpgrade);SCREENS.propostas.__v157=1}}catch(e){console.error('v157 propostas',e)}

/* ---------- Operação não muda ----------
   As obras legado e as "local a definir" são do Pós-venda (clientes antigos, fora do Painel de Controle): não entram nas contas
   nem nas listas da Operação, que seguem iguais ao Painel. Elas aparecem no Pós-venda (Carteira, Obras finalizadas) e no cliente. */
function semLegado(fn){return function(arg){if(arg)return fn.apply(this,arguments);const all=S.db.obras;if(!Array.isArray(all))return fn.apply(this,arguments);
  S.db.obras=all.filter(o=>!o.legadoAT);try{return fn.apply(this,arguments)}finally{S.db.obras=all}}}
function protegerOperacao(){try{Object.keys(SCREENS).forEach(k=>{const f=SCREENS[k];if(typeof f!=='function'||f.__v157o)return;
    if(!(k==='obras'||(typeof SEC_OF==='object'&&SEC_OF[k]==='ope')))return;const w=semLegado(f);w.__v157o=1;SCREENS[k]=w})}catch(e){console.error('v157 operação',e)}}
protegerOperacao();

/* ---------- boot ---------- */
function boot(){try{const db=S.db;if(db.af113_zero||treino())return;
    const n=carregar(db);if(n){T_(()=>log('propostas','v157','Controle de AT '+D.quando+': '+n+' atendimentos, '+D.planos.length+' planos'));T_(()=>save())}
  }catch(e){console.error('v157',e)}}
boot();
try{const _rm=window.renderMain;window.renderMain=function(){try{const db=S.db;if(db&&!db.af113_zero&&!treino()&&!(db._v157&&db._v157.quando===D.quando))boot();protegerOperacao()}catch(e){}return _rm.apply(this,arguments)}}catch(e){}
})();
