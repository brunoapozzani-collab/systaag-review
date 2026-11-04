/* v150 · A PLANILHA MESTRA ENTRA PARA FICAR EM DIA (Bruno, 04/11/2026)
   O que a pesquisa de 04/11 achou: a Planilha Mestra já estava dentro do protótipo — uma cópia de 26/09 (COP.SEED: 340 clientes,
   343 obras, 884 pré-vendas) que roda UMA vez e nunca mais se atualiza. Em um mês ela ficou para trás: 9 obras novas,
   11 mudanças de status, 6 clientes renomeados. Os números de proposta de cada linha do Painel só existiam como TEXTO na
   obra (propostasPlanilha) — nenhuma proposta era um registro, e a Pipeline estava carregada DUAS vezes (negociacoes e prevendas).
   Regras do Bruno: obra = uma linha do Painel com as propostas aninhadas · Projetos só com o status geral · obra concluída/AT
   vira cliente do Pós-venda · NADA SE SOBREPÕE: toda diferença entre fontes vira uma bandeira na tela, nunca é escondida ·
   as 4 obras de assistência técnica que saíram da planilha FICAM (é trabalho do Pós-venda) · linhas sem número/nome ficam
   como estão · "CMG - Fernanda e Newton" em dobro NÃO é fundido, só sinalizado.
   §1 Sincronização RE-EXECUTÁVEL com a cópia da planilha (v150-mestra-data.js): casa linha ↔ obra pelo número de proposta
      (depois pelo nome), aplica status/nome/números/responsáveis/parceiros/endereço, cria as obras novas, marca as obras
      que não têm mais linha. Cada alteração vira uma bandeira em Base › Conferência Mestra.
   §2 Uma proposta = um registro: cada número do Painel vira uma proposta ligada à obra pelo id (número reutilizado em outra
      obra = outra proposta, número + cliente). As vendas da METAS 2026 que já existiam só ganham o elo com a obra
      (o v142 quebrava "11.327" em "11" e "327" — aqui o número é lido inteiro). Sem itens, sem valor inventado: a venda
      continua sendo o que a METAS diz; estas propostas não contam como venda de 2026.
   §3 Pipeline uma vez só: "prevendas" deixa de ser tabela e passa a ser uma leitura das negociações (Operação › Aprovações
      continua funcionando, lendo a mesma fonte do CRM/Comercial).
   §4 Responsáveis por id: comercial / resp. projetos / resp. obra (texto da planilha) ganham *_ids apontando para Pessoas;
      nome que não existe em Pessoas vira bandeira, nunca cadastro inventado.
   §5 Base › Conferência Mestra: os números fecham na tela (349 linhas = ligadas + novas; obras = ligadas + novas + sem linha)
      e cada bandeira abre a obra. */
(function(){
'use strict';
if(window.__v150)return;window.__v150=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V150_MESTRA;if(!D||!Array.isArray(D.rows)){console.error('v150: v150-mestra-data.js não carregou');return}
const FONTE='Planilha Mestra TAAG (Painel de Controle)';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(+v||0).toLocaleString('pt-BR');
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const hoje=()=>T_(()=>today(),new Date().toISOString().slice(0,10));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/* números de proposta: "12.923 / 13.159", "13132", "11.513/ 12.023" → ['12923','13159'] — o ponto é separador de milhar, nunca quebra o número */
const nums=s=>{const t=String(s||'');const out=[];const seen=new Set();
  (t.match(/\d{2}\.\d{3}/g)||[]).forEach(n=>{const k=n.replace('.','');if(!seen.has(k)){seen.add(k);out.push(k)}});
  (t.replace(/\d{2}\.\d{3}/g,' ').match(/(?<![\d.])\d{5,6}(?![\d.])/g)||[]).forEach(k=>{if(!seen.has(k)){seen.add(k);out.push(k)}});
  return out};
const SIT={'concluido':'Concluída','cancelada':'Cancelada','on hold':'On hold','assistencia tecnica':'Assistência técnica'};
const situacaoDe=st=>SIT[norm(st)]||'Em andamento';
const EST={'concluido':'concluida','cancelada':'perdida','projeto':'vendida'};
const estadoDe=st=>EST[norm(st)]||'em_obra';
const pessoasSplit=s=>String(s||'').split(/\s*[\/,+&]\s*|\s+e\s+/i).map(x=>x.trim()).filter(x=>x&&x!=='-');
const ALIAS={danielle:'daniele',dani:'daniele',andre:'andre'};
const treino=()=>T_(()=>localStorage.getItem('systaag_treino_on')==='1',false);

function estado(db){db._v150=db._v150||{};return db._v150}
function flag(db,tipo,o,extra){const F=estado(db);F.flags=F.flags||[];F.flags.push(Object.assign({tipo,obra_id:o&&o.id||null,obra:o&&o.nome||'',quando:hoje()},extra||{}))}

/* ---------- §1 sincronização ---------- */
function indices(db){const byNum={},byNome={};(db.obras||[]).forEach(o=>{if(o.merged_into||o.inativo)return;
  const txt=[o.propostasPlanilha,o.v123_orig&&o.v123_orig.propostasPlanilha].filter(Boolean).join(' / ');
  nums(txt).forEach(n=>(byNum[n]=byNum[n]||[]).push(o));
  const k=norm(o.nome);if(k)(byNome[k]=byNome[k]||[]).push(o);
  T_(()=>{const c=get('clientes',o.cliente_id);const kc=norm(c&&c.nome);if(kc&&kc!==k)(byNome[kc]=byNome[kc]||[]).push(o)})});return {byNum,byNome}}

function clienteParaLinha(db,row){const k=norm(row.cliente);if(!k)return null;
  const byName={};(db.clientes||[]).forEach(c=>{byName[norm(c.nome)]=c;(c.aliases||[]).forEach(a=>{byName[norm(a)]=c})});
  if(byName[k])return byName[k];
  const id='CLI-M'+String(row.linha).padStart(4,'0');
  const c={id,nome:row.cliente,sigla:T_(()=>siglaDe(row.cliente),''),aliases:[],arquiteto:row.arquitetura||'',cidade:row.cidade||'',contato:'',ativo:true,origem:D.fonte,criadoEm:hoje()};
  db.clientes.push(c);return c}

function novaObra(db,row){const c=clienteParaLinha(db,row);const id='OBR-M'+String(row.linha).padStart(4,'0');
  let o={id,cliente_id:c?c.id:null,nome:row.cliente||('Linha '+row.linha+' da planilha'),endereco:row.endereco||'',programador:'',etapas:[],docs:[],keypads:{},prog:{},agenda:[],entrega:{prevista:'',realizada:''}};
  try{if(typeof mig90==='function')o=mig90(o)}catch(e){}
  o.v90=true;o.etapas=o.etapas||[];o.contatos=o.contatos||[];o.agenda=o.agenda||[];o.projetos=o.projetos||[];o.docs=o.docs||[];
  const C_=window.COP||{};
  o.entregaveis=(C_.ENTREGAVEIS||[]).map(n=>({nome:n,status:'N/A',rev:'',enviado:''}));
  o.arquivosRecebidos=(C_.ARQ_RECEBIDOS||[]).map(n=>({nome:n,recebido:'Não recebido',rev:''}));
  Object.assign(o,{fases:{},ambientes:[],sistemas:[],arquitetura:row.arquitetura||'',briefing:row.briefing||'',cidade:row.cidade||'',unidade:/^RJ$/i.test(row.cidade||'')?'RJ':'SP',comercial:row.comercial||'',consolidadoArq:row.consolidado||'',
    engenharia:row.engenharia||'',gerenciadora:row.gerenciadora||'',luminotecnico:row.luminotecnico||'',notas:[],obs:'',origem:D.fonte,propostasPlanilha:row.propostas||'',respObra:row.respObra||'',respProjetos:row.respProjetos||'',
    situacao:situacaoDe(row.status),statusPlanilha:row.status||'',urgencia:'Normal',ativo:true,linhaPlanilha:row.linha,criadoEm:hoje()});
  if(o.situacao==='Concluída'&&!o.entrega.realizada)o.entrega.realizada=hoje();
  db.obras.push(o);return o}

function aplicarLinha(db,o,row){let n=0;const mud=[];
  const st=row.status||'';if(st&&norm(o.statusPlanilha)!==norm(st)){mud.push({campo:'status',antes:o.statusPlanilha||'',depois:st});o.statusPlanilha=st;o.situacao=situacaoDe(st);
    if(o.situacao==='Concluída'&&o.entrega&&!o.entrega.realizada)o.entrega.realizada=hoje();n++}
  if(!st)flag(db,'sem_status',o,{linha:row.linha,propostas:row.propostas,mantido:o.statusPlanilha||''});
  if(row.cliente&&norm(o.nome)!==norm(row.cliente)){const antes=o.nome;mud.push({campo:'nome',antes,depois:row.cliente});o.nome=row.cliente;n++;
    /* o cliente só é renomeado quando esta é a única obra dele e o nome era o mesmo da obra — senão fica bandeira */
    T_(()=>{const c=get('clientes',o.cliente_id);if(!c)return;const outras=(db.obras||[]).filter(x=>x.cliente_id===c.id&&x.id!==o.id).length;
      if(!outras&&norm(c.nome)===norm(antes)){c.aliases=Array.from(new Set([...(c.aliases||[]),c.nome]));c.__v137_nome=c.nome;c.nome=row.cliente;try{put('clientes',c,'v150 rename')}catch(e){}}
      else if(norm(c.nome)!==norm(row.cliente))flag(db,'cliente_nome',o,{linha:row.linha,antes:c.nome,depois:row.cliente})})}
  const a=nums(o.propostasPlanilha).join(','),b=nums(row.propostas).join(',');
  if(row.propostas&&a!==b){mud.push({campo:'propostas',antes:o.propostasPlanilha||'',depois:row.propostas});o.propostasPlanilha=row.propostas;n++}
  [['comercial','comercial'],['respProjetos','respProjetos'],['respObra','respObra'],['gerenciadora','gerenciadora'],['arquitetura','arquitetura'],['engenharia','engenharia'],['luminotecnico','luminotecnico'],['endereco','endereco'],['cidade','cidade'],['briefing','briefing'],['consolidadoArq','consolidado']]
    .forEach(([k,rk])=>{const v=row[rk]||'';if(v&&v!=='-'&&norm(o[k])!==norm(v)){mud.push({campo:k,antes:o[k]||'',depois:v});o[k]=v;n++}});
  o.linhaPlanilha=row.linha;
  if(mud.length)flag(db,'alterada',o,{linha:row.linha,propostas:row.propostas,mudancas:mud});
  return n}

function sincronizar(db){const F=estado(db);if(F.quando===D.quando)return 0;
  F.quando=D.quando;F.fonte=D.fonte;F.flags=[];let n=0;const {byNum,byNome}=indices(db);const usadas=new Set();const ligadas=new Set();
  D.rows.forEach(row=>{const ns=nums(row.propostas);let cands=[];ns.forEach(k=>(byNum[k]||[]).forEach(o=>{if(!cands.includes(o))cands.push(o)}));
    const porNome=(byNome[norm(row.cliente)]||[]).filter(o=>!usadas.has(o.id))[0]||null;
    /* número reutilizado em outra linha: a obra já tomada por uma linha anterior não vale — o nome decide; sem nome livre, a linha é outra obra */
    const tomada=cands.length&&cands.every(o=>usadas.has(o.id));
    cands=cands.filter(o=>!usadas.has(o.id));
    if(tomada&&!cands.length&&porNome)cands=[porNome];
    if(cands.length>1){const same=cands.filter(o=>norm(o.nome)===norm(row.cliente));if(same.length===1)cands=same;else if(porNome&&cands.includes(porNome))cands=[porNome];else{flag(db,'ambigua',null,{linha:row.linha,propostas:row.propostas,cliente:row.cliente,obras:cands.map(o=>o.id+' '+o.nome)});return}}
    if(!cands.length&&porNome)cands=[porNome];
    if(!ns.length&&!row.cliente){flag(db,'sem_numero_nem_nome',null,{linha:row.linha,status:row.status});return}
    if(!cands.length){const o=novaObra(db,row);usadas.add(o.id);ligadas.add(row.linha);flag(db,'nova',o,{linha:row.linha,propostas:row.propostas,status:row.status,desdobrada:tomada});n++;
      if(!ns.length)flag(db,'sem_numero',o,{linha:row.linha,cliente:row.cliente,status:row.status});return}
    const o=cands[0];
    usadas.add(o.id);ligadas.add(row.linha);n+=aplicarLinha(db,o,row);
    if(!ns.length)flag(db,'sem_numero',o,{linha:row.linha,cliente:row.cliente,status:row.status});
    if(!row.cliente)flag(db,'sem_nome',o,{linha:row.linha,propostas:row.propostas,status:row.status})});
  /* obras da planilha que hoje não têm linha: ficam (assistência técnica = Pós-venda) */
  (db.obras||[]).forEach(o=>{if(o.merged_into||o.inativo)return;if(usadas.has(o.id)){delete o.semLinhaMestra;return}
    if(/Planilha Mestra/.test(o.origem||'')){o.semLinhaMestra=D.quando;flag(db,'sem_linha_hoje',o,{status:o.statusPlanilha,propostas:o.propostasPlanilha})}});
  /* um número em mais de uma obra: cada uma é uma obra (número + cliente), mas fica à vista */
  const dup={};(db.obras||[]).forEach(o=>{if(o.merged_into||o.inativo)return;nums(o.propostasPlanilha).forEach(k=>(dup[k]=dup[k]||[]).push(o))});
  Object.keys(dup).forEach(k=>{if(dup[k].length>1)flag(db,'numero_em_duas_obras',null,{numero:k,obras:dup[k].map(o=>o.id+' '+o.nome)})});
  F.ligadas=usadas.size;F.linhas=D.rows.length;F.linhasLigadas=ligadas.size;
  return n}

/* ---------- §2 uma proposta = um registro ---------- */
function propostas(db){db.propostas=db.propostas||[];let criadas=0,ligadas=0;
  const byNum={};db.propostas.forEach(p=>{if(p.demo)return;const k=String(p.numero||'').replace(/\D/g,'');if(k)(byNum[k]=byNum[k]||[]).push(p)});
  (db.obras||[]).forEach(o=>{if(o.merged_into||o.inativo)return;const ns=nums(o.propostasPlanilha);if(!ns.length)return;
    ns.forEach(k=>{const ex=byNum[k]||[];
      if(ex.some(p=>p.obra_id===o.id))return;
      const livres=ex.filter(p=>!p.obra_id);
      if(livres.length===1&&(!livres[0].cliente_id||livres[0].cliente_id===o.cliente_id)){const p=livres[0];p.obra_id=o.id;if(!p.cliente_id&&o.cliente_id){p.cliente_id=o.cliente_id;p.sigla=T_(()=>get('clientes',o.cliente_id).sigla,p.sigla||'')}ligadas++;return}
      if(ex.some(p=>p.cliente_id&&p.cliente_id===o.cliente_id))return; /* mesma proposta, mesmo cliente, outra obra do cliente: não duplica */
      const id='pm_'+k+'_'+o.id;if(db.propostas.some(p=>p.id===id))return;
      const st=o.statusPlanilha||'';const c=T_(()=>get('clientes',o.cliente_id),null);
      const p={id,numero:k,nome:(o.nome||'')+' — '+(st||'obra')+' (Painel)',cliente_nome:o.nome||'',sigla:c?c.sigla||'':'',cliente_id:o.cliente_id||null,obra_id:o.id,
        linha:'taag',produto:norm(st)==='projeto'?'projeto':'sistema',categoria:st?st.charAt(0).toUpperCase()+st.slice(1):'Obra',estado:estadoDe(st),consultores:pessoasSplit(o.comercial),vendida_em:'',
        blocos:[],ajuste:0,rt:0,bonificacao:0,negociacao:0,margem_taag:30,misc_pct:0,porte:'M',distancia:'capital',valor_venda:0,
        fonte:FONTE,mestra:true,sem_itens:true,filial:o.unidade==='RJ'?'RJ':'SP',
        aprov:{status:'aprovada',hist:[{em:hoje(),por:'Planilha Mestra',acao:'proposta registrada a partir do Painel de Controle (linha '+(o.linhaPlanilha||'?')+')'}]},
        fin:{confirmada:false,historico:true,obs:'Proposta do Painel de Controle: valor e itens não vêm da planilha — a venda real é a da METAS 2026 / do editor.'}};
      if(p.estado==='perdida')p.motivo_perda='Obra cancelada (Painel de Controle)';
      db.propostas.push(p);(byNum[k]=byNum[k]||[]).push(p);criadas++})});
  const F=estado(db);F.propostasCriadas=(F.propostasCriadas||0)+criadas;F.propostasLigadas=(F.propostasLigadas||0)+ligadas;return criadas+ligadas}

/* as propostas do Painel não são vendas de 2026: a venda é a da METAS (v142) */
try{if(window.V142&&typeof V142.real==='function'&&!V142.real.__v150){const f=V142.real;V142.real=function(p){if(p&&p.mestra)return false;return f.apply(this,arguments)};V142.real.__v150=1}}catch(e){}

/* ---------- §3 prevendas = leitura das negociações ---------- */
function prevendaDe(g){const st=T_(()=>oppStatus(g),null)||(g.resultado==='fechada'?'FECHADO':g.resultado==='perdida'?'PERDIDO':g.resultado==='futuro'?'FUTURO':String(g.etapa||'').toUpperCase());
  return {id:g.id,cliente:g.cliente_nome||'',consultor:g.consultor||'',status:st,tipo:g.tipo_pipeline||g.frente||'',prob:g.chance,arquitetura:(g.cadeia&&(g.cadeia.arquiteto||g.cadeia.escritorio))||(g.fontes&&g.fontes.arquitetura)||'',obs:(g.proxima&&g.proxima.acao)||'',data:g.data_upgrade||g.movido||g.criado||'',negociacao:true}}
function umaPipeline(db){const d=Object.getOwnPropertyDescriptor(db,'prevendas');
  if(!d||!d.get){const F=estado(db);if(Array.isArray(db.prevendas)&&db.prevendas.length&&!F.prevendasRetiradas)F.prevendasRetiradas=db.prevendas.length;try{delete db.prevendas}catch(e){}
    Object.defineProperty(db,'prevendas',{get(){return (S.db.negociacoes||[]).filter(g=>!g.demo).map(prevendaDe)},set(v){},configurable:true,enumerable:false})}}
try{const O=window.COP&&COP.ope;if(O&&!O.__v150prev){O.__v150prev=1;O.prevenda=(id,st)=>{const g=(S.db.negociacoes||[]).find(x=>x.id===id);if(!g)return;const res=/FECH/i.test(st)?'fechada':/PERD/i.test(st)?'perdida':/FUT/i.test(st)?'futuro':null;
  const go=()=>run(()=>{g.resultado=res;g.status_pipeline=String(st).toUpperCase();g.movido=hoje();put('negociacoes',g,'update')},'Pipeline atualizada');
  if(typeof COP.confirmBox==='function')COP.confirmBox(`Marcar a negociação como ${st}?`,E(g.cliente_nome||''),go);else if(confirm(`Marcar a negociação de ${g.cliente_nome} como ${st}?`))go()}}}catch(e){}

/* ---------- §4 responsáveis por id ---------- */
const DEP={comercial:/comercial|vendas/i,respProjetos:/projet/i,respObra:/tecnic|obra|operac/i};
function pessoaId(db,nome,papel){const k=norm(nome).split(' ')[0];if(!k)return null;const kk=ALIAS[k]||k;
  let hit=(db.pessoas||[]).filter(p=>{const n=norm(p.nome).split(' ')[0];const nc=norm(p.nomeCompleto||'').split(' ')[0];return n===kk||nc===kk});
  if(hit.length>1){const ex=hit.filter(p=>norm(p.nome)===norm(nome)||norm(p.nomeCompleto||'')===norm(nome));if(ex.length)hit=ex}
  if(hit.length>1&&DEP[papel]){const d=hit.filter(p=>DEP[papel].test(String(p.departamento||p.dep||'')+' '+String(p.cargo||'')));if(d.length)hit=d}
  if(hit.length>1){const at=hit.filter(p=>!p.desligado);if(at.length===1)hit=at}
  if(hit.length>1){pessoaId.dup=pessoaId.dup||{};pessoaId.dup[nome]=hit.map(p=>p.id+' · '+(p.nomeCompleto||p.nome)+' · '+(p.cargo||'')+' · '+(p.departamento||p.dep||'')+(p.desligado?' · desligado':''))}
  return hit.length===1?hit[0].id:(hit.length?'?':null)}
function responsaveis(db){let n=0;const faltam={};pessoaId.dup={};
  (db.obras||[]).forEach(o=>{if(o.merged_into||o.inativo)return;[['comercial','comercial_ids'],['respProjetos','respProjetos_ids'],['respObra','respObra_ids']].forEach(([k,ik])=>{
    const nomes=pessoasSplit(o[k]);const ids=[];nomes.forEach(nm=>{const id=pessoaId(db,nm,k);if(id&&id!=='?')ids.push(id);else (faltam[nm]=faltam[nm]||[]).push(o.id)});
    const cur=(o[ik]||[]).join(',');if(cur!==ids.join(',')){o[ik]=ids;n++}})});
  const F=estado(db);F.pessoasFaltam=Object.keys(faltam).map(nm=>({nome:nm,obras:faltam[nm].length,candidatos:pessoaId.dup[nm]||null}));return n}

/* ---------- §5 a tela ---------- */
function resumo(){const db=S.db;const F=estado(db);const fl=F.flags||[];const por=t=>fl.filter(f=>f.tipo===t);
  const obras=(db.obras||[]).filter(o=>!o.merged_into&&!o.inativo);const daMestra=obras.filter(o=>/Planilha Mestra/.test(o.origem||''));
  return {F,fl,por,obras,daMestra,novas:por('nova').length,semLinha:por('sem_linha_hoje').length,alteradas:por('alterada').length,repetidas:por('linha_repetida').length,ambiguas:por('ambigua').length,
    propMestra:(db.propostas||[]).filter(p=>p.mestra).length,propLigadas:F.propostasLigadas||0}}
const obraLink=(id,txt)=>id?`<a href="#/obras/${E(id)}">${E(txt||id)}</a>`:E(txt||'');
function tela(){const r=resumo();const F=r.F;const linhas=F.linhas||D.rows.length;const ligadas=F.linhasLigadas||0;
  const eq1=`${N0(linhas)} linhas na planilha = ${N0(ligadas-r.novas)} ligadas a obras que já existiam + ${N0(r.novas)} obras novas${r.ambiguas?' + '+N0(r.ambiguas)+' ambíguas':''}${r.por('sem_numero_nem_nome').length?' + '+N0(r.por('sem_numero_nem_nome').length)+' sem número nem nome':''}`;
  const totalObras=r.daMestra.length;const eq2=`${N0(totalObras)} obras da planilha no sistema = ${N0(F.ligadas||0)} com linha hoje + ${N0(r.semLinha)} sem linha hoje (ficam: assistência técnica = Pós-venda)`;
  const tile=(l,v,s,cls)=>`<div class="col-md-3 col-6"><div class="card p-3 h-100"><div class="sub" style="font-size:11px;letter-spacing:.06em">${l}</div><div style="font-size:26px;font-weight:800" class="${cls||''}">${v}</div><div class="sub" style="font-size:12px">${s}</div></div></div>`;
  const lista=(titulo,items,fmt,sub)=>items.length?`<div class="card p-3 mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><h6 class="m-0">${titulo} <span class="chip">${N0(items.length)}</span></h6>${sub?`<span class="sub">${sub}</span>`:''}</div><div class="table-responsive"><table class="table table-sm mb-0">${items.map(fmt).join('')}</table></div></div>`:'';
  const mud=m=>m.map(x=>`<div><b>${E(x.campo)}</b>: <span class="sub">${E(x.antes||'—')}</span> → ${E(x.depois)}</div>`).join('');
  return head('Conferência Mestra',`A Planilha Mestra (Painel de Controle) lida em ${E(D.quando.split('-').reverse().join('/'))} comparada com a Base. Nada se sobrepõe: cada diferença está aqui, com o nome e a obra.`)+
   `<div class="row g-3 mb-3">${tile('LINHAS NA PLANILHA',N0(linhas),'Painel de Controle, '+E(D.quando.split('-').reverse().join('/')))}${tile('OBRAS NOVAS',N0(r.novas),'criadas a partir da planilha',r.novas?'rd':'')}${tile('MUDANÇAS APLICADAS',N0(r.alteradas),'status · nome · números · responsáveis')}${tile('PROPOSTAS DO PAINEL',N0(r.propMestra),N0(r.propLigadas)+' vendas da METAS ligadas à obra')}</div>
    <div class="card p-3 mb-3" style="border-left:4px solid #198754"><div>${eq1} <span style="color:#198754">✓</span></div><div class="mt-1">${eq2} <span style="color:#198754">✓</span></div><div class="sub mt-1" style="font-size:12px">Pipeline: ${N0((db=>db.negociacoes||[])(S.db).filter(g=>!g.demo).length)} negociações, uma vez só — "pré-vendas" agora é uma leitura delas (${N0(F.prevendasRetiradas||0)} cópias retiradas).</div></div>`+
   lista('Obras novas (uma linha da planilha = uma obra)',r.por('nova'),f=>`<tr><td>${E(f.linha)}</td><td>${obraLink(f.obra_id,f.obra)}</td><td>${E(f.propostas||'sem número')}</td><td><span class="chip">${E(f.status||'sem status')}</span></td><td class="sub">${f.desdobrada?'o número já estava em outra obra — a linha é outra obra (número + cliente)':'não existia no sistema'}</td></tr>`,'linha · obra · propostas · status')+
   lista('Mudanças aplicadas (a planilha manda nestes campos)',r.por('alterada'),f=>`<tr><td>${E(f.linha)}</td><td>${obraLink(f.obra_id,f.obra)}</td><td>${mud(f.mudancas||[])}</td></tr>`,'linha · obra · o que mudou')+
   lista('Obras sem linha na planilha hoje (ficam — assistência técnica é Pós-venda)',r.por('sem_linha_hoje'),f=>`<tr><td>${obraLink(f.obra_id,f.obra)}</td><td><span class="chip">${E(f.status||'—')}</span></td><td>${E(f.propostas||'—')}</td></tr>`)+
   lista('Para decidirmos juntos: nome do cliente diferente da planilha',r.por('cliente_nome'),f=>`<tr><td>${E(f.linha)}</td><td>${obraLink(f.obra_id,f.obra)}</td><td><span class="sub">${E(f.antes)}</span> → ${E(f.depois)}</td></tr>`,'o cliente tem outras obras, por isso não foi renomeado')+
   lista('Para decidirmos juntos: linha ambígua (vários candidatos)',r.por('ambigua'),f=>`<tr><td>${E(f.linha)}</td><td>${E(f.cliente)}</td><td>${E(f.propostas)}</td><td>${(f.obras||[]).map(E).join('<br>')}</td></tr>`)+
   lista('Mesmo número de proposta em mais de uma obra (cada uma é uma proposta: número + cliente)',r.por('numero_em_duas_obras'),f=>`<tr><td><b>${E(f.numero)}</b></td><td>${(f.obras||[]).map(x=>obraLink(x.split(' ')[0],x)).join('<br>')}</td></tr>`)+
   lista('Linhas sem número de proposta (ficam como estão)',r.por('sem_numero').concat(r.por('sem_numero_nem_nome')),f=>`<tr><td>${E(f.linha)}</td><td>${obraLink(f.obra_id,f.obra||f.cliente||'—')}</td><td><span class="chip">${E(f.status||'—')}</span></td></tr>`)+
   lista('Linhas sem status na planilha (o sistema mantém o que tinha)',r.por('sem_status'),f=>`<tr><td>${E(f.linha)}</td><td>${obraLink(f.obra_id,f.obra)}</td><td>${E(f.propostas)}</td><td><span class="chip">${E(f.mantido||'sem status')}</span></td></tr>`)+
   lista('Linhas sem nome de cliente (ficam como estão)',r.por('sem_nome'),f=>`<tr><td>${E(f.linha)}</td><td>${E(f.propostas)}</td><td><span class="chip">${E(f.status||'—')}</span></td></tr>`)+
   lista('Responsáveis da planilha sem UMA pessoa certa em Pessoas',F.pessoasFaltam||[],f=>`<tr><td><b>${E(f.nome)}</b></td><td>${N0(f.obras)} obra(s)</td><td>${f.candidatos?'<span class="chip warn">cadastro em dobro?</span> '+f.candidatos.map(E).join('<br>'):'<span class="sub">ninguém com esse nome</span>'}</td></tr>`,'não foi criado nem fundido ninguém — é para decidirmos: qual é a pessoa certa')+
   `<div class="sub" style="font-size:12px">Fonte: ${E(D.fonte)} · a planilha é só lida, nunca escrita · para atualizar de novo, gera-se uma nova cópia (v150-mestra-data.js) e a sincronização reaplica, sem duplicar.</div>`}
try{SCREENS.dbmestra=tela;if(typeof SEC_OF==='object')SEC_OF.dbmestra='bd';if(typeof LABEL==='object')LABEL.dbmestra='Conferência Mestra';
  const bd=NAV.find(s=>s.id==='bd');if(bd&&!bd.items.some(([k])=>k==='dbmestra')){const i=bd.items.findIndex(([k])=>k==='dbclientes');bd.items.splice(i>=0?i+1:1,0,['dbmestra','Conferência Mestra'])}}catch(e){console.error('v150 tela',e)}

/* ---------- boot ---------- */
function boot(){try{const db=S.db;if(db.af113_zero||treino()){umaPipeline(db);return}
    const a=sincronizar(db);const b=propostas(db);const c=responsaveis(db);umaPipeline(db);
    if(a+b+c){T_(()=>log('obras','v150','Planilha Mestra '+D.quando+': '+a+' alterações, '+b+' propostas ligadas/criadas, '+c+' responsáveis por id'));T_(()=>save())}
  }catch(e){console.error('v150',e)}}
boot();
try{const _rm=window.renderMain;window.renderMain=function(){try{const db=S.db;if(db&&!db.af113_zero&&!treino()&&(!(db._v150&&db._v150.quando===D.quando)||!(Object.getOwnPropertyDescriptor(db,'prevendas')||{}).get))boot()}catch(e){}return _rm.apply(this,arguments)}}catch(e){}
})();
