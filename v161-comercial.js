/* =====================================================================================================
   v161 · COMERCIAL — propostas abrem, status reais, estado (UF), meses certos, de onde vêm os números (Bruno, 05/11/2026)
   §1 V1  Abrir uma proposta: o editor (#/editor/<id>) quebrava ("Cannot read properties of undefined (reading 'map')")
          nas 1.334 propostas importadas (METAS 2026, Painel de Controle, Controle de AT) — elas não têm itens/opções,
          e o erro jogava a tela para o Início. Agora o editor tem uma guarda: proposta sem itens → "ficha da proposta"
          com o que a Base sabe; e qualquer outro erro do editor também cai na ficha, nunca no Início.
          A gaveta da negociação (Pipeline) ganhou a mesma guarda e mostra as propostas do mesmo cliente.
   §2 V2  (06/11: texto do Bruno — sem valor porque os rascunhos das propostas ainda não foram criados no protótipo)
          Pipeline sem valor: a aba Pipeline da To Do Comercial não tem coluna de valor (A..Q, conferido no Drive em
          05/11) e nenhuma negociação está ligada a uma proposta aberta com valor. Nada é inventado: o "N sem valor"
          vira uma lista com nome, e a ponte "Previsto = Σ valor × chance de N com valor · M sem valor" fica à vista.
   §3 V3  Filtro de estado (UF) em Comercial › Propostas: Painel de Controle (coluna CIDADE) → endereço da obra →
          CEP → aba da METAS → endereço do AT → filial. Ponte "1.334 = … SP + … RJ + …".
   §4 V4  Cartões de status = o estado real de cada proposta (vendida, em obra, concluída, perdida, cliente aprovou…),
          cada cartão filtra a lista; contagem e valor descrevem o mesmo conjunto; ponte "1.334 = …".
   §5 V5  Vendas por mês: o mês era lido com new Date("2026-02-01") (UTC → no Brasil vira 31/01) e as vendas sem data
          ("2026") caíam em dezembro. Agora o mês sai do texto da data; sem data → "sem data"; data futura → "sem data".
   §6 V6  Conversão no Início: "de onde vem" + conferência ao vivo com a planilha (window.V159_PIPE).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161c)return;window.__v161c=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R0=v=>'R$ '+Math.round(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const plural=(n,a,b)=>N0(n)+' '+(n===1?a:b);
const hojeISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtDt=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:''};
const tot=p=>T(()=>+M.total(p),0)||0;
const estLb=e=>T(()=>estadoChip(e),[e||'—',''])[0];
const frLb=l=>T(()=>frenteLb(l),l||'—');
const VEND=['vendida','em_obra','concluida'];
const UI=window.V161=window.V161||{};

/* ═════════════ §3 estado (UF) de cada proposta ═════════════ */
const UFS=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const UF_NOME={SP:'São Paulo',RJ:'Rio de Janeiro',MG:'Minas Gerais',SC:'Santa Catarina',PR:'Paraná',RS:'Rio Grande do Sul',GO:'Goiás',MS:'Mato Grosso do Sul',BA:'Bahia',ES:'Espírito Santo',DF:'Distrito Federal',MT:'Mato Grosso',PE:'Pernambuco',CE:'Ceará'};
const CID={'sao paulo':'SP',campinas:'SP',braganca:'SP','braganca paulista':'SP',valinhos:'SP',jundiai:'SP','porto feliz':'SP',guaruja:'SP',alphaville:'SP',itupeva:'SP','monte mor':'SP',itatiba:'SP',barueri:'SP',santana:'SP',ubatuba:'SP',ilhabela:'SP','campos do jordao':'SP',mangaratiba:'RJ','rio de janeiro':'RJ','angra dos reis':'RJ',buzios:'RJ',petropolis:'RJ',niteroi:'RJ'};
function ufCep(s){const m=String(s||'').match(/\b(\d{5})-?\d{3}\b/);if(!m)return '';const c=+m[1].slice(0,2);
  return c<=19?'SP':c<=28?'RJ':c===29?'ES':c<=39?'MG':c<=48?'BA':c===49?'SE':c<=56?'PE':c===57?'AL':c===58?'PB':c===59?'RN':c<=63?'CE':c===64?'PI':c===65?'MA':c<=68?'PA':c===69?'AM':c<=73?'DF':c<=76?'GO':c===77?'TO':c===78?'MT':c===79?'MS':c<=87?'PR':c<=89?'SC':'RS'}
function ufTxt(s){s=String(s||'');let last='';const re=/(?:^|[^A-Za-z])([A-Z]{2})(?![A-Za-z])/g;let m;while((m=re.exec(s)))if(UFS.has(m[1]))last=m[1];
  if(last)return last;const k=nz(s);for(const c in CID)if(k.includes(c))return CID[c];return ''}
function ufCidade(c){c=String(c||'').trim();if(!c)return '';if(UFS.has(c.toUpperCase()))return c.toUpperCase();return CID[nz(c)]||''}
let MESTRA_UF=null;
function mestraUF(){if(MESTRA_UF)return MESTRA_UF;MESTRA_UF={};const R=T(()=>window.V150_MESTRA.rows,[])||[];
  R.forEach(r=>{const uf=ufCidade(r.cidade)||ufTxt(r.endereco)||ufCep(r.endereco);if(!uf)return;String(r.propostas||'').split(/[\/,;e]+/).forEach(x=>{const n=x.replace(/\D/g,'');if(n.length>=4&&!MESTRA_UF[n])MESTRA_UF[n]=uf})});return MESTRA_UF}
function ufDe(p){if(!p)return {uf:'',de:''};
  const num=String(p.numero||'').replace(/\D/g,'');const mu=mestraUF()[num];if(mu)return {uf:mu,de:'Painel de Controle (CIDADE)'};
  const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;
  if(o){const u=ufTxt(o.endereco)||ufCep(o.endereco)||ufCidade(o.cidade)||ufCidade(o.uf);if(u)return {uf:u,de:'endereço da obra'}}
  const at=p.at||{};const ua=ufTxt(at.address)||ufCep(at.postal_code)||ufCep(at.address);if(ua)return {uf:ua,de:'endereço do atendimento'};
  const fl=nz(p.fonte_linha);if(/^sao paulo/.test(fl))return {uf:'SP',de:'aba São Paulo da METAS 2026'};if(/^rio de janeiro/.test(fl))return {uf:'RJ',de:'aba Rio de Janeiro da METAS 2026'};
  const f=String(p.filial||'').toUpperCase();if(UFS.has(f))return {uf:f,de:'filial da proposta'};
  return {uf:'',de:''}}
UI.ufDe=ufDe;

/* ═════════════ conjunto filtrado (o mesmo predicado de Comercial › Propostas) ═════════════ */
function passa(p,f,semEstado){f=f||{};
  if(!(S.propDemo||!p.demo))return false;
  if(f.fil&&T(()=>FIL.daProposta(p),'')!==f.fil)return false;
  if(f.vano&&!(VEND.includes(p.estado)&&String(p.vendida_em||'').startsWith(f.vano)))return false;
  if(f.q&&![p.numero,p.nome,T(()=>cliente(p.id),''),p.obra_id?T(()=>get('obras',p.obra_id).nome,''):''].join(' ').toLowerCase().includes(f.q))return false;
  if(f.cons&&!(p.consultores||[]).includes(f.cons))return false;
  if(f.st&&(p.aprov?.status||'em_andamento')!==f.st)return false;
  if(f.fr&&p.linha!==f.fr)return false;
  if(f.ym&&String(p.vendida_em||'').slice(0,7)!==f.ym)return false;
  if(f.uf&&(ufDe(p).uf||'_sem')!==f.uf)return false;
  if(!semEstado&&f.estado&&p.estado!==f.estado)return false;
  return true}
const ORDEM=['rascunho','em_prevendas','enviada','revisao','aprovada_cliente','vendida','em_obra','concluida','perdida'];
const COR={rascunho:'#6c757d',em_prevendas:'#6f42c1',enviada:'#0d6efd',revisao:'#fd7e14',aprovada_cliente:'#20c997',vendida:'#198754',em_obra:'#0d6efd',concluida:'#146c43',perdida:'#dc3545'};
function porEstado(xs){const g={};xs.forEach(p=>{const k=p.estado||'_sem';const o=g[k]=g[k]||{k,n:0,v:0,sv:0};o.n++;const v=tot(p);o.v+=v;if(!v)o.sv++});
  return Object.values(g).sort((a,b)=>{const ia=ORDEM.indexOf(a.k),ib=ORDEM.indexOf(b.k);return (ia<0?99:ia)-(ib<0?99:ib)})}
const setF=(k,v)=>{S.propF=Object.assign({},S.propF||{});S.propF[k]=S.propF[k]===v?'':v;T(()=>renderMain())};
UI.est=v=>setF('estado',v);UI.uf=v=>setF('uf',v);
UI.selEst=v=>{S.propF=Object.assign({},S.propF||{},{estado:v});T(()=>renderMain())};
UI.selUf=v=>{S.propF=Object.assign({},S.propF||{},{uf:v});T(()=>renderMain())};

/* ═════════════ §5 vendas por mês, sem fuso e sem mês inventado ═════════════ */
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function vendasMes(ano){const hoje=hojeISO();const vend=(S.db.propostas||[]).filter(p=>VEND.includes(p.estado)&&!p.demo&&String(p.vendida_em||'').startsWith(String(ano)));
  const m=Array.from({length:12},()=>({n:0,v:0}));const sem={n:0,v:0,fut:0};
  vend.forEach(p=>{const d=String(p.vendida_em||'');const ok=/^\d{4}-\d{2}/.test(d)&&!p.data_desconhecida&&d.slice(0,10)<=hoje;const v=tot(p);
    if(ok){const i=+d.slice(5,7)-1;m[i].n++;m[i].v+=v}else{sem.n++;sem.v+=v;if(/^\d{4}-\d{2}/.test(d)&&d.slice(0,10)>hoje)sem.fut++}});
  return {vend,m,sem,total:vend.reduce((a,p)=>a+tot(p),0)}}
UI.vendasMes=vendasMes;
function cardHist(xs){const meta=S.db.meta||{};const ano=meta.ano||new Date().getFullYear();const g=porEstado(xs);const mx=Math.max(1,...g.map(s=>s.v));
  const vm=vendasMes(ano);const mxm=Math.max(1,...vm.m.map(x=>x.v),vm.sem.v);const ymHoje=hojeISO().slice(0,7);
  const bar=(lb,x,cor,dim)=>`<div class="v161-mb" title="${E(lb)}: ${R0(x.v)} · ${plural(x.n,'venda','vendas')}"><div class="v161-mbv" style="height:${Math.round(x.v/mxm*100)}%;background:${cor}${dim?';opacity:.35':''}"></div><span>${E(lb)}</span></div>`;
  const meses=vm.m.map((x,i)=>{const ym=ano+'-'+String(i+1).padStart(2,'0');return ym>ymHoje?'':bar(MES[i],x,'#0d6efd')}).join('')+(vm.sem.n?bar('sem data',vm.sem,'#6c757d'):'');
  const termos=vm.m.map((x,i)=>x.n?`${MES[i]} ${R0(x.v)}`:'').filter(Boolean).join(' + ');
  return `<div class="card p-3 mb-3 v161-hist"><div class="d-flex justify-content-between"><b style="font-size:12px;letter-spacing:.06em">ANÁLISE POR STATUS · VALOR TOTAL (R$)</b><a href="javascript:void(0)" onclick="S.propHist=false;render()">Minimizar</a></div>
   ${g.map(s=>`<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px;cursor:pointer" onclick="V161.est('${J(s.k)}')"><span style="width:150px">${E(estLb(s.k))} <span class="sub">(${N0(s.n)})</span></span><div style="flex:1;height:10px;background:rgba(127,127,127,.12);border-radius:5px;overflow:hidden"><div style="width:${s.v/mx*100}%;height:100%;background:${COR[s.k]||'#6c757d'}"></div></div><b style="width:110px;text-align:right">${R0(s.v)}</b></div>`).join('')}
   <div class="sub mt-3" style="font-size:11px;letter-spacing:.08em;font-weight:700">VENDAS POR MÊS ${E(ano)} · até ${fmtDt(hojeISO())}</div>
   <div class="v161-meses">${meses}</div>
   <div class="v161-ponte">Ponte: ${R0(vm.total)} vendidos em ${E(ano)} = ${termos||'—'}${vm.sem.n?` + <b>sem data ${R0(vm.sem.v)}</b> (${plural(vm.sem.n,'venda','vendas')} da METAS 2026 sem dia na planilha${vm.sem.fut?` · ${N0(vm.sem.fut)} com data futura`:''} — contam no ano, em nenhum mês)`:''}</div></div>`}

/* ═════════════ §4 + §3 + §5 na tela Comercial › Propostas ═════════════ */
function telaPropostas(h){const f=S.propF||{};const P=(S.db.propostas||[]);
  const base=P.filter(p=>passa(p,f,true));const g=porEstado(base);const nB=base.length;
  /* cartões de status = estado real */
  const cards=`<div class="row g-2 mb-1 v161-cards">${g.map(s=>`<div class="col-6 col-md-4 col-lg-2"><div class="card p-3 rowlink${f.estado===s.k?' v161-on':''}" style="border-top:4px solid ${COR[s.k]||'#6c757d'}" onclick="V161.est('${J(s.k)}')" title="Clique para ver só estas propostas"><div class="sub" style="font-size:10px;letter-spacing:.08em">${E(estLb(s.k).toUpperCase())}</div><div style="font-size:28px;font-weight:800;color:${COR[s.k]||'#6c757d'}">${N0(s.n)}</div><div class="sub" style="font-size:11px">${R0(s.v)}</div>${s.sv?`<div class="sub" style="font-size:10.5px">${N0(s.sv)} sem valor na Base</div>`:''}</div></div>`).join('')}</div>`;
  const comV=base.filter(p=>tot(p)).length;const semV=nB-comV;const vT=base.reduce((a,p)=>a+tot(p),0);
  const fontesSem={};base.filter(p=>!tot(p)).forEach(p=>{const k=/Painel/.test(p.fonte||'')?'Painel de Controle':/Controle de AT/.test(p.fonte||'')?'Controle de AT':p.fonte||'sem fonte';fontesSem[k]=(fontesSem[k]||0)+1});
  const ponteSt=`<div class="v161-ponte mb-3">Ponte: <b>${N0(nB)}</b> propostas = ${g.map(s=>`<u role="button" onclick="V161.est('${J(s.k)}')">${N0(s.n)} ${E(estLb(s.k).toLowerCase())}</u>`).join(' + ')} · valor <b>${R0(vT)}</b> = soma de ${plural(comV,'proposta com valor','propostas com valor')}${semV?` · ${N0(semV)} sem valor na Base (${Object.entries(fontesSem).map(([k,n])=>N0(n)+' '+E(k)).join(', ')} — a planilha não traz valor nem itens)`:''}${f.estado?` · <a href="javascript:void 0" onclick="V161.est('${J(f.estado)}')">mostrar todos os status</a>`:''}</div>`;
  h=h.replace(/<div class="row g-2 mb-3">(?:<div class="col-6 col-md-4 col-lg-2"><div class="card p-3 rowlink" style="border-top:4px solid #[0-9a-f]+" onclick="S\.propF=[^"]*">[\s\S]*?<\/div><\/div><\/div>)+<\/div>/,()=>cards+ponteSt);
  /* análise por status + vendas por mês */
  h=h.replace(/<div class="card p-3 mb-3"><div class="d-flex justify-content-between"><b style="font-size:12px;letter-spacing:.06em">ANÁLISE POR STATUS[\s\S]*?VENDAS POR MÊS[^<]*<\/div><\/div>/,()=>cardHist(base));
  /* seletor STATUS = estado real */
  const selEst=`<select class="form-select form-select-sm" onchange="V161.selEst(this.value)"><option value="">Todos os status</option>${g.map(s=>`<option value="${E(s.k)}"${f.estado===s.k?' selected':''}>${E(estLb(s.k))} (${N0(s.n)})</option>`).join('')}</select>`;
  h=h.replace(/<select class="form-select form-select-sm" onchange="S\.propF=\{\.\.\.\(S\.propF\|\|\{\}\),st:this\.value\};renderMain\(\)">[\s\S]*?<\/select>/,()=>selEst);
  /* filtro ESTADO (UF) */
  const baseUf=P.filter(p=>passa(p,Object.assign({},f,{uf:''}),false));const gu={};baseUf.forEach(p=>{const u=ufDe(p).uf||'_sem';gu[u]=(gu[u]||0)+1});
  const ufs=Object.entries(gu).sort((a,b)=>(a[0]==='_sem')-(b[0]==='_sem')||b[1]-a[1]);const ufLb=u=>u==='_sem'?'sem estado':u;
  const selUf=`<div class="col-md-2"><label class="sub" style="font-size:10px;letter-spacing:.08em">ESTADO (UF)</label><select class="form-select form-select-sm" onchange="V161.selUf(this.value)"><option value="">Todos os estados</option>${ufs.map(([u,n])=>`<option value="${E(u)}"${f.uf===u?' selected':''}>${E(u==='_sem'?'Sem estado':u+(UF_NOME[u]?' · '+UF_NOME[u]:''))} (${N0(n)})</option>`).join('')}</select></div>`;
  h=h.replace('<div class="col-md-4"><label class="sub" style="font-size:10px;letter-spacing:.08em">NOME DA OBRA</label>','<div class="col-md-3"><label class="sub" style="font-size:10px;letter-spacing:.08em">NOME DA OBRA</label>');
  h=h.replace('<div class="col-md-2 d-flex align-items-end"><button class="btn-soft w-100" onclick="S.propF={};render()">',selUf+'<div class="col-md-1 d-flex align-items-end"><button class="btn-soft w-100" onclick="S.propF={};render()">');
  const ponteUf=`<div class="v161-ponte mb-3">Estado: <b>${N0(baseUf.length)}</b> = ${ufs.map(([u,n])=>`<u role="button" onclick="V161.uf('${J(u)}')"${f.uf===u?' style="font-weight:700"':''}>${N0(n)} ${E(ufLb(u))}</u>`).join(' + ')} <span class="sub">(estado vem da coluna CIDADE do Painel de Controle, do endereço da obra, do CEP, da aba da METAS ou da filial)</span></div>`;
  const ix=h.indexOf('ESTADO (UF)');if(ix>0){const ini=h.lastIndexOf('<div class="card p-3 mb-3">',ix);const fim=ini>=0?fimDiv(h,ini):-1;if(fim>0)h=h.slice(0,fim)+ponteUf+h.slice(fim)}
  /* linhas fora do estado escolhido ficam escondidas (o "Mostrando N de M" conta só as visíveis) */
  if(f.uf){h=h.replace(/<tr class="rowlink" onclick="location\.hash='#\/editor\/([^']+)'"/g,(m,id)=>{const p=T(()=>get('propostas',id),null);return p&&(ufDe(p).uf||'_sem')!==f.uf?m+' style="display:none" data-v161-fora="1"':m})}
  /* colunas: o status real primeiro */
  h=h.replace('<th>Status interno</th>','<th>Aprovação interna</th>').replace('<th>Etapa com o cliente</th>','<th>Status</th>');
  return h}
function fimDiv(h,ini){const re=/<div\b|<\/div>/g;re.lastIndex=ini;let d=0,m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(d===0)return m.index+6}return -1}
function ligaPropostas(){if(typeof SCREENS!=='object'||typeof SCREENS.propostas!=='function'||SCREENS.propostas.__v161)return !!(SCREENS.propostas&&SCREENS.propostas.__v161);
  const _p=SCREENS.propostas;SCREENS.propostas=function(){const h=_p.apply(this,arguments);if(typeof h!=='string')return h;try{return telaPropostas(h)}catch(e){console.warn('v161 propostas',e);return h}};SCREENS.propostas.__v161=true;return true}

/* ═════════════ §1 ficha da proposta (editor nunca quebra) ═════════════ */
function semItens(p){const its=T(()=>(S.db.itens||[]).some(i=>i.proposta_id===p.id),false);const bl=(p.blocos||[]).some(b=>(b.itens||[]).length);return !its&&!bl}
function pNome(id){if(!id)return '';const P=S.db.parceiros||[];const x=P.find(q=>q.id===id||String(q.crm_id)===String(id)||'p'+q.crm_id===id);return x?x.nome:''}
function negsDaProposta(p){const N=S.db.negociacoes||[];const ck=[p.cliente_ref,p.cliente_id].filter(Boolean);return {lig:N.filter(n=>(n.proposta_ids||[]).includes(p.id)),cli:N.filter(n=>ck.includes(n.cliente_id))}}
function cadeia(p){const out=[];const {lig,cli}=negsDaProposta(p);const add=(papel,nome,via)=>{if(nome&&!out.some(o=>o.papel===papel&&nz(o.nome)===nz(nome)))out.push({papel,nome,via})};
  lig.forEach(n=>{const ps=n.parceiros||{},fo=n.fontes||{};add('Indicador',pNome(ps.indicador)||fo.indicador,'negociação ligada');add('Arquitetura',pNome(ps.arquitetura)||fo.arquitetura,'negociação ligada');add('Gerenciadora',pNome(ps.gerenciadora)||fo.gerenciadora,'negociação ligada')});
  const c=T(()=>(S.db.clientes||[]).find(x=>x.id===p.cliente_ref||x.id===p.cliente_id),null);
  if(c)(c.parceiros||[]).forEach(x=>{const nm=pNome(x.id);if(nm)String(x.papeis||'parceiro').split(' · ').forEach(pp=>add(pp.charAt(0).toUpperCase()+pp.slice(1),nm,'cadastro do cliente'))});
  if(!out.length)cli.forEach(n=>{const fo=n.fontes||{};add('Indicador',pNome((n.parceiros||{}).indicador)||fo.indicador,'Pipeline do mesmo cliente');add('Arquitetura',fo.arquitetura,'Pipeline do mesmo cliente');add('Gerenciadora',fo.gerenciadora,'Pipeline do mesmo cliente')});
  const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;if(o&&!out.length){add('Arquitetura',o.arquitetura,'obra');add('Gerenciadora',o.gerenciadora,'obra')}
  return out}
function fonteDe(p){const f=p.fonte||'';let l=p.fonte_linha||'';if(!l){const h=((p.aprov||{}).hist||[]).map(x=>x.acao||'').join(' ');const m=h.match(/linha\s+(\d+)/i);if(m)l='linha '+m[1]}
  if(!l&&p.at&&p.at.fonteAT){const a=p.at.fonteAT;l=(a.mes?'mês '+a.mes+' · ':'')+(a.linha?'linha '+a.linha:'')}
  return f?(f+(l?' · '+l:'')):'cadastrada no sistema'}
function ficha(p,erro){const R=T(()=>M.resumo(p),null);const v=tot(p);const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;const u=ufDe(p);const cad=cadeia(p);const {lig,cli}=negsDaProposta(p);
  const cl=T(()=>cliente(p.id),'')||p.cliente_nome||'—';const dt=p.data_desconhecida||!/^\d{4}-\d{2}-\d{2}/.test(String(p.vendida_em||''))?(p.vendida_em?`${E(String(p.vendida_em).slice(0,4))} <span class="sub">(sem dia na planilha)</span>`:'—'):fmtDt(p.vendida_em);
  const kv=(l,x)=>`<div class="v161-kv"><span>${l}</span><b>${x}</b></div>`;
  const negL=lig.length?lig:cli;
  return `<div class="v161-ficha">
  <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3"><div><div class="sub" style="font-size:11px;letter-spacing:.14em">PROPOSTA</div><h3 class="mb-0" style="font-weight:800">#${E(p.numero)} <span class="chip ${T(()=>estadoChip(p.estado)[1],'')}" style="font-size:12px;vertical-align:middle">${E(estLb(p.estado))}</span></h3><div class="sub">${E(p.nome||'')}</div></div>
   <div class="d-flex gap-2"><a class="btn-soft" href="#/propostas"><i class="bi bi-arrow-left me-1"></i>Propostas</a></div></div>
  <div class="row g-3">
   <div class="col-lg-4"><div class="card p-3 h-100" style="border-top:4px solid #198754"><div class="sub" style="font-size:10px;letter-spacing:.08em">VALOR TOTAL</div><div style="font-size:30px;font-weight:800;color:${v?'#198754':'#6c757d'}">${v?R0(v):'sem valor'}</div><div class="sub" style="font-size:11.5px">${v?(+p.valor_venda?'valor de venda da planilha':'valor do atendimento (Controle de AT)'):'a planilha de origem não traz valor desta proposta'}</div>
     <div class="mt-3">${kv('RT',`${(+p.rt||0).toLocaleString('pt-BR')}%`)}${kv('Data de venda',dt)}${kv('Frente',E(frLb(p.linha)))}</div></div></div>
   <div class="col-lg-4"><div class="card p-3 h-100"><div class="sub" style="font-size:10px;letter-spacing:.08em">CLIENTE · OBRA</div><div style="font-size:18px;font-weight:700">${E(cl)}</div>
     ${o?`<a href="#/obras/${E(o.id)}" class="d-block mt-1" style="text-decoration:none"><i class="bi bi-building me-1"></i>${E(o.nome||o.id)}</a><div class="sub" style="font-size:11.5px">${E(o.endereco||'')}</div>`:'<div class="sub mt-1">sem obra ligada</div>'}
     <div class="mt-3">${kv('Estado (UF)',u.uf?`${E(u.uf)} <span class="sub" style="font-weight:400">· ${E(u.de)}</span>`:'—')}${kv('Filial',E(p.filial||'—'))}${kv('Consultor(es)',E((p.consultores||[]).join(' + ')||'—'))}</div></div></div>
   <div class="col-lg-4"><div class="card p-3 h-100"><div class="sub" style="font-size:10px;letter-spacing:.08em">QUEM INDICOU · CADEIA</div>
     ${cad.length?cad.map(c=>kv(E(c.papel),`${E(c.nome)} <span class="sub" style="font-weight:400">· ${E(c.via)}</span>`)).join(''):'<div class="sub mt-1">Nenhum indicador ou parceiro registrado para este cliente.</div>'}
     ${negL.length?`<div class="sub mt-3" style="font-size:10px;letter-spacing:.08em">${lig.length?'NEGOCIAÇÃO LIGADA':'NEGOCIAÇÕES DO MESMO CLIENTE NO PIPELINE'}</div>${negL.slice(0,6).map(n=>`<a href="javascript:void 0" class="d-block" style="font-size:12.5px;text-decoration:none" onclick="S.deal='${J(n.id)}';S.dealTab='comercial';location.hash='#/pipeline'">${E(n.cliente_nome||n.id)} <span class="sub">· ${E(n.status_pipeline||n.resultado||'aberta')}${n.planilha?' · linha '+n.planilha.linha:''}</span></a>`).join('')}`:''}</div></div>
  </div>
  <div class="card p-3 mt-3" style="background:rgba(13,110,253,.05);border:1px dashed rgba(13,110,253,.4)"><b><i class="bi bi-box-seam me-1"></i>Produtos ainda não carregados</b><div class="sub" style="font-size:12.5px">A lista chega quando a proposta for importada. ${R&&R.tot?'':'Sem itens, a margem não é calculável.'}</div></div>
  <div class="sub mt-2" style="font-size:11.5px"><i class="bi bi-database me-1"></i>Fonte: ${E(fonteDe(p))}${erro?' · o editor completo não abriu esta proposta e mostrou a ficha':''}</div></div>`}
UI.ficha=ficha;
function ligaEditor(){if(typeof SCREENS!=='object'||typeof SCREENS.editor!=='function')return false;if(SCREENS.editor.__v161)return true;const _e=SCREENS.editor;
  SCREENS.editor=function(id){const p=T(()=>get('propostas',id),null);
    if(p&&semItens(p)&&(p.fonte||p.mestra||p.sem_itens||!Array.isArray(p.opcoes)))return ficha(p);
    try{return _e.apply(this,arguments)}catch(e){console.warn('v161: editor caiu na ficha',id,e);return p?ficha(p,true):`<div class="card place">Proposta não encontrada.</div>`}};
  SCREENS.editor.__v161=true;T(()=>{if(typeof LABEL==='object')LABEL.editor='Proposta'});return true}

/* gaveta da negociação: nunca quebra; mostra as propostas do mesmo cliente */
function fichaNeg(n){const kv=(l,x)=>`<div class="v161-kv"><span>${l}</span><b>${x||'—'}</b></div>`;const c=n.planilha?n.planilha.c:[];
  return `<div class="card p-3" data-dealdrawer style="position:fixed;right:12px;top:64px;bottom:12px;width:min(430px,94vw);overflow:auto;z-index:60;box-shadow:0 20px 60px rgba(0,0,0,.35)"><div class="d-flex justify-content-between"><div><b style="font-size:18px">${E(n.cliente_nome||n.codinome||n.id)}</b><div class="sub" style="font-size:12px">${E(frLb(n.frente))} · ${E(n.consultor||'—')}</div></div><button class="iconbtn" onclick="S.deal=null;render()"><i class="bi bi-x-lg"></i></button></div>
   <div class="mt-2">${kv('Status na planilha',E(n.status_pipeline||'(em branco)'))}${kv('Chance',n.chance==null?'—':n.chance+'%')}${kv('Indicador',E((n.fontes||{}).indicador))}${kv('Arquitetura',E((n.fontes||{}).arquitetura))}${kv('Gerenciadora',E((n.fontes||{}).gerenciadora))}${kv('Tipo',E(n.tipo_pipeline))}${kv('Data de upgrade',fmtDt(n.data_upgrade))}${kv('Reunião (gestão)',E(n.gestao))}${kv('Linha da planilha',n.planilha?N0(n.planilha.linha):'')}</div>
   ${propsCliente(n)}</div>`}
function propsCliente(n){const ck=n.cliente_id;const ps=ck?(S.db.propostas||[]).filter(p=>!p.demo&&(p.cliente_ref===ck||p.cliente_id===ck)):[];if(!ps.length)return '';
  return `<div class="sub mt-3 mb-1" style="font-size:11px;letter-spacing:.08em;font-weight:700">PROPOSTAS DO MESMO CLIENTE NA BASE <span style="font-weight:400">(não ligadas a esta negociação)</span></div>${ps.slice(0,12).map(p=>`<a class="card p-2 mb-1 d-block" href="#/editor/${E(p.id)}" style="text-decoration:none"><div class="d-flex justify-content-between"><b>#${E(p.numero)}</b><span class="sub">${E(estLb(p.estado))}</span></div><div class="sub" style="font-size:12px">${E(p.nome||'')} · ${tot(p)?R0(tot(p)):'sem valor'}</div></a>`).join('')}${ps.length>12?`<div class="sub">+ ${N0(ps.length-12)} outras</div>`:''}`}
function ligaGaveta(){if(typeof dealDrawer!=='function')return false;if(dealDrawer.__v161)return true;const dd=dealDrawer;
  dealDrawer=function(){const n=S.deal?T(()=>get('negociacoes',S.deal),null):null;if(!n)return '';
    /* negociações importadas da planilha não têm os campos que a gaveta completa espera (ajuda, timeline…):
       preenche só durante o desenho, sem gravar nada na Base */
    const add=[];const arr=['ajuda','proposta_ids','timeline','consultores','fontes_hist'];arr.forEach(k=>{if(!Array.isArray(n[k])){add.push([k,n[k],k in n]);n[k]=[]}});
    ['proxima','fontes','cadeia','parceiros'].forEach(k=>{if(!n[k]||typeof n[k]!=='object'){add.push([k,n[k],k in n]);n[k]={}}});
    const volta=()=>add.forEach(([k,v,had])=>{if(had)n[k]=v;else delete n[k]});
    try{let h;try{h=dd.apply(this,arguments)}finally{volta()}if(typeof h!=='string')return h;const extra=(n.proposta_ids||[]).length?'':propsCliente(n);return extra?h.replace('<div class="card place py-3"><i class="bi bi-file-earmark"></i>Nenhuma proposta vinculada.</div>','<div class="card place py-3"><i class="bi bi-file-earmark"></i>Nenhuma proposta vinculada.</div>'+extra):h}
    catch(e){console.warn('v161: gaveta da negociação caiu na ficha',n.id,e);return fichaNeg(n)}};
  dealDrawer.__v161=true;return true}

/* ═════════════ §2 + §6 Início › Comercial e Pipeline ═════════════ */
const resOf=n=>n.resultado?String(n.resultado):'aberta';
const PAB=['rascunho','enviada','em_prevendas','aprovada_cliente','em_revisao','revisao','ajuste','aguardando'];
function negV(n){const c=T(()=>window.V130API.com(),null);if(c&&typeof c.negV==='function')return T(()=>+c.negV(n),0)||0;if(+n.valor>0)return +n.valor;return ((n.proposta_ids||[]).map(id=>T(()=>get('propostas',id),null)).filter(p=>p&&PAB.includes(p.estado))).reduce((a,p)=>a+tot(p),0)}
function abertas(){const c=T(()=>window.V130API.com(),null);return c&&Array.isArray(c.negs)?c.negs:(S.db.negociacoes||[]).filter(n=>!n.resultado)}
UI.semValorLista=()=>abertas().filter(n=>!negV(n));
UI.fechar=()=>{const el=document.getElementById('v161-modal');if(el)el.remove()};
UI.abrirNeg=id=>{UI.fechar();S.deal=id;S.dealTab='comercial';if(location.hash!=='#/pipeline')location.hash='#/pipeline';else T(()=>render())};
UI.semValor=()=>{UI.fechar();const xs=UI.semValorLista().slice().sort((a,b)=>String(a.consultor||'').localeCompare(String(b.consultor||''))||String(a.cliente_nome||'').localeCompare(String(b.cliente_nome||'')));
  const d=document.createElement('div');d.id='v161-modal';d.className='v161-modal';d.onclick=e=>{if(e.target===d)UI.fechar()};
  d.innerHTML=`<div class="card p-3 v161-mcard"><div class="d-flex justify-content-between align-items-start"><div><div class="sub" style="font-size:11px;letter-spacing:.1em">NEGOCIAÇÕES ABERTAS SEM VALOR</div><b style="font-size:26px">${N0(xs.length)}</b><div class="sub" style="font-size:12px">Ainda não há valor porque as propostas destas negociações não foram criadas (rascunhos) dentro do protótipo. Quando o rascunho da proposta for montado na negociação, o valor dele entra no Previsto sozinho. Clique numa linha para abrir a negociação no Pipeline.</div></div><button class="iconbtn" onclick="V161.fechar()"><i class="bi bi-x-lg"></i></button></div>
   <div class="tblwrap mt-2" style="max-height:60vh;overflow:auto"><table class="tbl" style="font-size:12.5px"><thead><tr><th>Linha</th><th>Cliente</th><th>Consultor</th><th>Status na planilha</th><th class="text-end">Chance</th></tr></thead><tbody>${xs.map(n=>`<tr class="rowlink" onclick="V161.abrirNeg('${J(n.id)}')"><td class="sub">${n.planilha?N0(n.planilha.linha):'—'}</td><td><b>${E(n.cliente_nome||n.id)}</b></td><td>${E(n.consultor||'—')}</td><td>${E(n.status_pipeline||'—')}</td><td class="text-end">${n.chance==null?'—':N0(n.chance)+'%'}</td></tr>`).join('')}</tbody></table></div></div>`;document.body.appendChild(d)};
function conferePlanilha(){const D=window.V159_PIPE;if(!D||!Array.isArray(D.rows))return null;const c={fechado:0,perdido:0,futuro:0,aberta:0,vazio:0};
  D.rows.forEach(r=>{const s=nz(r.c[10]);if(!s)c.vazio++;else if(c[s]!=null&&s!=='aberta')c[s]++;else c.aberta++});return c}
UI.conferePlanilha=conferePlanilha;
function telaHome(h){if(h.indexOf('Previsto · negociações abertas × chance')<0)return h;
  const N=S.db.negociacoes||[];const ab=abertas();const comV=ab.filter(n=>negV(n));const semV=ab.length-comV.length;const prev=comV.reduce((a,n)=>a+negV(n)*(+n.chance||0)/100,0);
  h=h.replace(/(\d[\d.]*) sem valor cadastrado/,(m,x)=>`<u role="button" onclick="event.stopPropagation();V161.semValor()" title="Ainda não há valor porque as propostas (rascunhos) não foram criadas dentro do protótipo">${x} sem valor — rascunhos ainda não criados</u>`);
  const ix=h.indexOf('Previsto · negociações abertas × chance');const ini=h.lastIndexOf('<div class="vx-tiles',ix);const fim=ini>=0?fimDiv(h,ini):-1;
  if(fim>0){const pt=`<div class="vx-ponte v161-prev">Ponte: Previsto <b>${R0(prev)}</b> = Σ valor × chance de ${plural(comV.length,'negociação com valor','negociações com valor')} · <u role="button" onclick="V161.semValor()">${plural(semV,'sem valor','sem valor')}</u> <span class="sub">(ainda não há valor porque as propostas destas negociações não foram criadas — rascunhos — dentro do protótipo; o Previsto sobe quando o rascunho for montado)</span></div>`;h=h.slice(0,fim)+pt+h.slice(fim)}
  /* conversão: de onde vem */
  const k={fech:N.filter(n=>resOf(n)==='fechada').length,perd:N.filter(n=>resOf(n)==='perdida').length,fut:N.filter(n=>resOf(n)==='futuro').length,ab:ab.length,sem:N.filter(n=>resOf(n)==='sem_status').length};
  const pl=conferePlanilha();const ok=pl&&pl.fechado===k.fech&&pl.perdido===k.perd;
  const j=h.indexOf('>Conversão');if(j>0){const bi=h.lastIndexOf('<div class="vx149-box',j);const bf=bi>=0?fimDiv(h,bi):-1;
    if(bf>0){const txt=`<div class="v161-deonde">De onde vem: ${N0(k.fech+k.perd)} decididas = ${N0(k.fech)} ganhas + ${N0(k.perd)} perdidas (negociações da aba Pipeline da planilha To Do Comercial com STATUS Fechado / Perdido); ${N0(k.fut)} futuro e ${N0(k.ab)} abertas${k.sem?` e ${N0(k.sem)} com status vazio`:''} não contam.${pl?` <span class="${ok?'v161-ok':'v161-bad'}">${ok?'✓ confere com a planilha':'≠ planilha'}: ${N0(pl.fechado)} Fechado · ${N0(pl.perdido)} Perdido em ${N0(pl.fechado+pl.perdido+pl.futuro+pl.aberta+pl.vazio)} linhas</span>`:''}</div>`;
      h=h.slice(0,bf-6)+txt+h.slice(bf-6)}}
  return h}
function telaPipeline(h){
  /* "Fechadas R$ 0": desde 06/11 (Bruno) a fechada empresta o valor da venda METAS do cliente — v161d-regras.js (R1) */
  return h}
function ligaTelas(){let ok=true;
  if(typeof SCREENS==='object'&&typeof SCREENS.home==='function'){if(!SCREENS.home.__v161){const _h=SCREENS.home;SCREENS.home=function(){const h=_h.apply(this,arguments);if(typeof h!=='string')return h;try{return telaHome(h)}catch(e){console.warn('v161 home',e);return h}};SCREENS.home.__v161=true}}else ok=false;
  if(typeof SCREENS==='object'&&typeof SCREENS.pipeline==='function'){if(!SCREENS.pipeline.__v161){const _q=SCREENS.pipeline;SCREENS.pipeline=function(){const h=_q.apply(this,arguments);if(typeof h!=='string')return h;try{return telaPipeline(h)}catch(e){return h}};SCREENS.pipeline.__v161=true}}else ok=false;
  return ok}

function css(){if(document.getElementById('v161c-css'))return;const s=document.createElement('style');s.id='v161c-css';s.textContent=`
.v161-ponte{font-size:12.5px;line-height:1.7;color:var(--bs-secondary-color,#555)}.v161-ponte u{cursor:pointer;text-decoration-style:dotted}
.v161-cards .card.v161-on{outline:2px solid #0d6efd;outline-offset:-2px}
.v161-meses{display:flex;align-items:flex-end;gap:6px;height:120px;margin:8px 0 4px;padding-top:6px}
.v161-mb{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;min-width:28px}.v161-mbv{width:70%;border-radius:4px 4px 0 0;min-height:2px}.v161-mb span{font-size:10.5px;color:#6c757d;margin-top:3px;white-space:nowrap}
.v161-kv{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--bd,rgba(0,0,0,.08));font-size:13px}.v161-kv span{color:#6c757d}.v161-kv b{text-align:right}
.v161-modal{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2000;display:flex;align-items:center;justify-content:center}.v161-mcard{width:min(760px,94vw);max-height:86vh;overflow:auto}
.v161-deonde{font-size:11.5px;line-height:1.5;margin-top:8px;color:#6c757d}.v161-ok{color:#198754;font-weight:600}.v161-bad{color:#dc3545;font-weight:600}
.vx-ponte.v161-prev u{cursor:pointer}`;document.head.appendChild(s)}

function liga(){css();const a=ligaEditor(),b=ligaPropostas(),c=ligaGaveta(),d=ligaTelas();return a&&b&&c&&d}
if(!liga()){let n=0;const iv=setInterval(()=>{if(liga()||++n>60)clearInterval(iv)},250)}
T(()=>{const k=route().k;if(['editor','propostas','home','pipeline'].includes(k))renderMain()});
})();
