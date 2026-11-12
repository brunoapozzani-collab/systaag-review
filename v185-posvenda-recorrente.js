/* =====================================================================================================
   v185 · PÓS-VENDA — RECEITA RECORRENTE, VENCIMENTOS E RENOVAÇÕES DOS PLANOS DE SERVIÇO (reunião de 06/11/2026)
   Pedido da reunião: "apresentar receita recorrente, vencimentos e renovações".
   Os planos são os 25 importados do CONTROLE DE AT (aba 2024-2026 PS) + os que a equipe criar: propostas do Pós-venda do
   tipo Plano de Serviço, aprovadas e não canceladas. Valor = mensalidade.
   Renovação de cada plano = o mês de renovação escrito na planilha; sem ele, o aniversário do contrato (mês do início);
   sem os dois, "sem data" (lista para a equipe completar). Nada é inventado: cada número abre os planos que o formam.
   Pós-venda › Visão geral mostra os números; Pós-venda › Propostas mostra a lista de cada número.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v185)return;window.__v185=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R$=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const N0=v=>(+v||0).toLocaleString('pt-BR');
const rerender=()=>{try{renderMain()}catch(e){}};
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const mesIdx=s=>MESES.findIndex(m=>nz(m)===nz(s));
const V=window.V185={};
V.planos=()=>(S.db.propostas||[]).filter(p=>p&&p.linha==='posvenda'&&p.at&&p.at.proposal_type==='SERVICE_PLAN'&&!/cancel|recus|perdid/i.test(String(p.at.approval_status||'')+' '+String(p.at.open_status||'')+' '+String(p.estado||''))&&!p.inativo&&!p.merged_into);
const valor=p=>Math.max(0,((+p.at.proposal_value_cents||0)+(+p.at.additional_value_cents||0)-(+p.at.discount_value_cents||0))/100);
const anual=p=>String(p.at.plan_modality||'').toUpperCase()==='ANUAL';
const mensal=p=>anual(p)?valor(p)/12:valor(p);
V.renova=p=>{const a=p.at;let m=mesIdx(a.mes_renovacao),fonte='mês de renovação da planilha';
  if(m<0&&/^\d{4}-\d{2}/.test(String(a.contract_date||''))){m=+String(a.contract_date).slice(5,7)-1;fonte='aniversário do contrato'}
  if(m<0)return null;const hoje=new Date();let ano=hoje.getFullYear();if(m<hoje.getMonth())ano++;
  return {m,ano,fonte,chave:ano+'-'+String(m+1).padStart(2,'0')}};
V.resumo=()=>{const P=V.planos();const ate=new Date();const k0=ate.getFullYear()+'-'+String(ate.getMonth()+1).padStart(2,'0');
  const r={planos:P,mes:P.reduce((a,p)=>a+mensal(p),0),porMes:{},semData:[],planilha:0,aniversario:0,fim:[]};
  P.forEach(p=>{const x=V.renova(p);if(!x){r.semData.push(p);return}x.fonte==='aniversário do contrato'?r.aniversario++:r.planilha++;(r.porMes[x.chave]=r.porMes[x.chave]||[]).push(p)});
  r.esteMes=r.porMes[k0]||[];
  P.forEach(p=>{const f=String(p.at.plan_end_date||'');if(/^\d{4}-\d{2}-\d{2}/.test(f))r.fim.push({p,f})});
  return r};
V.ir=function(k){S.v185=k;location.hash='#/pospropostas'};V.sair=function(){S.v185=0;rerender()};

function card(){const r=V.resumo();if(!r.planos.length)return '';
  const hoje=new Date();const meses=[];for(let i=0;i<12;i++){const d=new Date(hoje.getFullYear(),hoje.getMonth()+i,1);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');meses.push({k,lb:MESES[d.getMonth()].slice(0,3)+'/'+String(d.getFullYear()).slice(2),ps:r.porMes[k]||[]})}
  const max=Math.max(1,...meses.map(m=>m.ps.length));
  const barras=meses.map(m=>`<a href="javascript:void 0" onclick="V185.ir('${m.k}')" title="${N0(m.ps.length)} plano(s) · ${R$(m.ps.reduce((a,p)=>a+mensal(p),0))}/mês" style="flex:1;text-align:center;text-decoration:none;color:inherit"><div style="height:70px;display:flex;align-items:flex-end;justify-content:center"><div style="width:70%;background:${m.ps.length?'#0d6efd':'rgba(120,120,128,.15)'};border-radius:6px 6px 0 0;height:${Math.max(4,Math.round(66*m.ps.length/max))}px"></div></div><div style="font-size:11px;font-weight:700">${N0(m.ps.length)}</div><div class="sub" style="font-size:10px">${m.lb}</div></a>`).join('');
  const comData=r.planilha+r.aniversario;
  return `<div class="card p-3 mb-3" id="v185-rec"><div class="d-flex justify-content-between flex-wrap gap-2"><h6 class="m-0">Planos de serviço · receita recorrente</h6><a href="javascript:void 0" onclick="V185.ir('todos')" class="sub">ver os ${N0(r.planos.length)} planos ›</a></div>
    <div class="d-flex flex-wrap gap-4 mt-2 align-items-end">
      <div><div class="sub" style="font-size:11px;letter-spacing:.06em">POR MÊS</div><div style="font-size:26px;font-weight:800">${R$(r.mes)}</div><div class="sub" style="font-size:12px">${N0(r.planos.length)} planos ativos</div></div>
      <div><div class="sub" style="font-size:11px;letter-spacing:.06em">POR ANO</div><div style="font-size:26px;font-weight:800">${R$(r.mes*12)}</div><div class="sub" style="font-size:12px">mensalidade × 12</div></div>
      <div><div class="sub" style="font-size:11px;letter-spacing:.06em">RENOVAM ESTE MÊS</div><div style="font-size:26px;font-weight:800"><a href="javascript:void 0" onclick="V185.ir('${new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')}')">${N0(r.esteMes.length)}</a></div><div class="sub" style="font-size:12px">${R$(r.esteMes.reduce((a,p)=>a+mensal(p),0))}/mês</div></div>
    </div>
    <div class="sub mt-3 mb-1" style="font-size:11px;letter-spacing:.06em">RENOVAÇÕES NOS PRÓXIMOS 12 MESES</div><div class="d-flex gap-1">${barras}</div>
    <div class="sub mt-2" style="font-size:12px">${N0(r.planos.length)} planos = ${N0(r.planilha)} com mês de renovação na planilha + ${N0(r.aniversario)} pelo aniversário do contrato + <a href="javascript:void 0" onclick="V185.ir('semdata')">${N0(r.semData.length)} sem data ›</a>${comData?` · os ${N0(comData)} com data estão nas barras acima`:''}</div></div>`}
function lista(k){const r=V.resumo();let ps,tit;
  if(k==='todos'){ps=r.planos;tit='Planos de serviço ativos'}else if(k==='semdata'){ps=r.semData;tit='Planos sem data de renovação'}else{ps=r.porMes[k]||[];const [a,m]=k.split('-');tit='Planos que renovam em '+MESES[+m-1]+'/'+a}
  ps=ps.slice().sort((a,b)=>String(a.at.client_name).localeCompare(String(b.at.client_name)));
  const rows=ps.map(p=>{const x=V.renova(p);return `<tr class="rowlink" onclick="S.v185=0;location.hash='#/pospropostas/${E(p.id)}'"><td><b>${E(p.at.client_name||'')}</b><div class="sub" style="font-size:11px">${E(p.at.proposal_number||'')} · ${E(p.at.service_plan_tier||'')}</div></td><td class="text-end mono">${R$(mensal(p))}</td><td>${x?MESES[x.m]+'/'+x.ano+' <span class="sub" style="font-size:11px">('+x.fonte+')</span>':'<span class="sub">sem data — falta mês de renovação e início do contrato</span>'}</td></tr>`}).join('');
  const hd=T(()=>head(tit+' ('+N0(ps.length)+')','Valor = mensalidade do plano. Renovação = mês de renovação da planilha; sem ele, o aniversário do contrato.',`<button class="btn-soft" onclick="V185.sair()">Ver todas as propostas ✕</button>`),`<h3>${tit}</h3>`);
  return hd+`<div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Cliente</th><th class="text-end">Mensalidade</th><th>Próxima renovação</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="sub">nenhum</td></tr>'}</tbody><tfoot><tr><td><b>Total</b></td><td class="text-end mono"><b>${R$(ps.reduce((a,p)=>a+mensal(p),0))}</b></td><td></td></tr></tfoot></table></div></div>`}
function liga(){if(typeof SCREENS!=='object')return;
  const w=(nome,fn)=>{const f=SCREENS[nome];if(typeof f!=='function'||f.__v185)return;SCREENS[nome]=function(){return fn(f,this,arguments)};SCREENS[nome].__v185=true;Object.keys(f).forEach(k=>{try{SCREENS[nome][k]=f[k]}catch(e){}})};
  w('posvisao',(f,t,a)=>{let h=f.apply(t,a);if(typeof h!=='string'||h.indexOf('id="v185-rec"')>=0)return h;const c=T(()=>card(),'');const i=h.indexOf('<div class="card');return i>=0?h.slice(0,i)+c+h.slice(i):h+c});
  w('pospropostas',(f,t,a)=>{if(!a[0]&&S.v185)return lista(S.v185);return f.apply(t,a)})}
liga();try{const _rm=window.renderMain;if(typeof _rm==='function'&&!_rm.__v185){window.renderMain=function(){try{liga()}catch(e){}return _rm.apply(this,arguments)};window.renderMain.__v185=true}}catch(e){}
window.addEventListener('hashchange',()=>{try{if(!/^#\/pospropostas\/?$/.test(location.hash||''))S.v185=0}catch(e){}});
})();
