/* v161 · PROJETOS E OPERAÇÃO LEEM O PAINEL DE CONTROLE (Bruno, 05/11/2026)
   O que estava errado: o v150 trazia da Planilha Mestra só a identidade de cada obra (cliente, status, responsáveis). Os
   entregáveis, os arquivos recebidos, as diárias e as etapas de execução eram a cópia de 26/09 (COP.SEED) — parada desde
   então —, o "(A)" da planilha nunca virava "em andamento" (por isso 0 em elaboração), o vazio virava "Aguardando
   arquiteto" (por isso 81 aguardando), o Início contava os entregáveis N/A e os vazios como pendentes (1.944) e a entrega
   prevista nunca era preenchida (por isso 81 sem data). Regras do Bruno (05/11):
   · Projetos: UMA barra por obra ("ABA · 7 de 9 entregáveis prontos", N/A não conta), cor = onde está parada; clicar na
     obra mostra os 12 entregáveis como chips (data de envio + revisão). O detalhe é lido do Painel (uma verdade).
   · Entrega prevista = término da Programação AV; sem ela, o fim da execução da E.T.; senão "sem data" (lista com nome).
   · Obra = uma linha do Painel com as propostas aninhadas (modelo do v150). Concluídas/canceladas guardam o histórico.
   §1 Sincronização re-executável com v161-painel-data.js (gerado da planilha por tools/gen-v161-painel.py), chave = a
      mesma linha do v150 (obra.linhaPlanilha). Grava no MODELO QUE O SISTEMA JÁ USA: o.entregaveis (12), o.arquivosRecebidos
      (5), o.etapas (checklist — o v123 espelha em atividades da Operação), o.execucaoPlanilha, o.diariasContratadas/Executadas,
      o.entrega.prevista. Campo editado no app (diferente do que a última sincronização gravou, ou com registro na auditoria)
      NÃO é sobrescrito: fica, e vira bandeira em Base › Conferência Mestra.
   §2 As 371 atividades "Planilha Mestra (Painel de Controle)" da cópia de 26/09 saem da lista (ativo:false, histórico) —
      as etapas de hoje chegam pelo checklist; nada é apagado.
   §3 Projetos › Painel: números reais (em andamento = obra com ≥1 (A); aguardando arquitetura = próximo entregável (A/P) ou
      arquivo da arquitetura não recebido; prontos; aprovados no mês = (C) enviado no mês), a ponte das obras em andamento,
      a barra por obra, a tabela por projetista e a ponte do total de obras com Operação.
   §4 Página da obra (Projetos e Operação): barra + chips dos 12 entregáveis, arquivos recebidos, etapas, diárias, entrega.
   §5 window.V161P = os mesmos números para o Início (v130 lê os entregáveis pendentes daqui).
   §6 (Bruno, 06/11/2026) Obra cuja linha do Painel ainda diz "sistema completo" (em andamento) mas cuja Entrega Técnica
      (arquivo ET da v151) diz "Realizada" ESTÁ CONCLUÍDA: situação Concluída na Base (vale para Operação, Projetos, Início
      e clientes do Pós-venda), etapas finalizadas, com a nota o.concluidaPorET ("concluída pela E.T. realizada em
      dd/mm/aaaa (a planilha ainda diz sistema completo)") e a lista em Base › Conferência Mestra. Se a planilha mudar o
      status, ou a E.T. deixar de dizer Realizada, a nota sai e vale a planilha de novo.
      Etapa com término vencido e sem "OK" = atrasada (a mesma regra da Operação: previsão de fim < hoje e não concluída);
      entregável em branco na planilha = "sem status". */
(function(){
'use strict';
if(window.__v161p)return;window.__v161p=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V161_PAINEL;if(!D||!Array.isArray(D.rows)){console.error('v161: v161-painel-data.js não carregou');return}
const C=window.COP||{};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(+v||0).toLocaleString('pt-BR');
const P1=(a,b)=>b?(100*a/b).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—';
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const hoje=()=>T_(()=>C.today(),new Date().toISOString().slice(0,10));
const dBR=d=>{const s=String(d||'').slice(0,10);return /^\d{4}-\d\d-\d\d$/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—'};
const ISO=v=>/^\d{4}-\d\d-\d\d$/.test(String(v||''));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const treino=()=>T_(()=>localStorage.getItem('systaag_treino_on')==='1',false);
const QBR=D.quando.split('-').reverse().join('/');
const ENTS=()=>(C.ENTREGAVEIS&&C.ENTREGAVEIS.length===12)?C.ENTREGAVEIS:D.rows[0].ent.map(e=>e.n);
const ARQS=()=>(C.ARQ_RECEBIDOS&&C.ARQ_RECEBIDOS.length===5)?C.ARQ_RECEBIDOS:D.rows[0].arq.map(a=>a.n);
/* vocabulário da planilha → vocabulário do sistema (C.ENTREGAVEL_ST / C.RECEBIDO_ST) */
const ST_ENT={'C':'Concluído','A':'Em elaboração','A/P':'Aguardando projeto arq.','N/A':'N/A','':'Sem informação'};
const DONE=s=>s==='Aprovado'||s==='Concluído';
const ELAB=s=>s==='Em elaboração'||s==='Em andamento'||s==='Enviado'||s==='Revisão';
const AGU=s=>s==='Aguardando projeto arq.';
const SEMST=s=>!s||s==='Sem informação';
/* etapas do Painel → subetapas do checklist (o.etapas) — os nomes do checklist ligam o estoque (categoria → subetapa) */
const ET_MAP=[['Cabeamento',['Cabeamento']],['Recorte e instalação de caixas acústicas',['Instalações de caixas acústicas']],['Montagem do quadro de automação',['Montagem do Quadro de Automação']],
  ['Instalação de keypads e pulsadores',['Instalação de Keypads']],['Instalação de rack e equipamentos',['Instalação do rack','Instalação de equipamentos']],['Programação ON/OFF',['Programação ON/OFF']],['Programação AV',['Programação AV']]];
const ETAPA_DE=sub=>/^programa/i.test(sub)?'Programação':/rack|equipamentos/i.test(sub)?'Áudio e Vídeo':'Estrutural';

function estado(db){db._v161=db._v161||{};return db._v161}
function flag(db,tipo,o,extra){const F=estado(db);F.flags=F.flags||[];F.flags.push(Object.assign({tipo,obra_id:o&&o.id||null,obra:o&&o.nome||'',linha:o&&o.linhaPlanilha||null},extra||{}))}
/* editado no app: houve registro humano na auditoria desta obra citando o campo (antes da 1ª sincronização v161) */
function auditou(o,re,nome){const n=norm(nome);return (S.db.cop_auditoria||[]).some(a=>a&&a.obra_id===o.id&&re.test(String(a.modulo||''))&&norm(a.acao).includes(n))}
/* aplica um valor da planilha a um campo: igual → nada; editado no app → fica e vira bandeira; senão grava */
function aplica(db,o,snap,key,cur,novo,ehEditado,grava,rotulo){
  if(cur===novo){snap[key]=novo;return 0}
  const editado=(key in snap)?cur!==snap[key]:ehEditado();
  if(editado){flag(db,'editado_no_app',o,{campo:rotulo,no_app:cur,planilha:novo});return 0}
  grava();snap[key]=novo;return 1}

function etStatus(x,concl,t){const a=x.ini||'',b=x.fim||'';
  const di=ISO(a)?a:'',df=ISO(b)?b:'';const txt=[a,b].filter(v=>v[0]==='?').map(v=>v.slice(1)).join(' · ');
  if(a==='NA'||b==='NA')return {st:'N/A',ini:'',fim:'',txt};
  if(b==='OK'||(a==='OK'&&!df))return {st:'Finalizado',ini:di,fim:df,txt};
  if(!di&&!df)return concl?null:{st:'Aguardando obra',ini:'',fim:'',txt};
  if(concl)return {st:'Finalizado',ini:di,fim:df,txt};
  const comecou=a==='OK'||(di&&di<=t)||(!di&&df&&df<=t);
  return {st:comecou?'Em andamento':'Aguardando obra',ini:di,fim:df,txt}}

/* ---------- §1 sincronização ---------- */
function sincObra(db,o,row,t){let n=0;const snap=o._v161=o._v161||{};['ent','arq','et','cp'].forEach(k=>snap[k]=snap[k]||{});
  const concl=/^(concluido|cancelada)$/i.test(norm(row.status))||!!o.concluidaPorET;
  /* entregáveis: os 12 do Painel, na ordem do sistema; prazo/link/obs digitados no app ficam */
  const nomes=ENTS();const ex=Array.isArray(o.entregaveis)?o.entregaveis:[];const usados=new Set();
  const novos=nomes.map((nm,k)=>{const r=row.ent[k];let e=ex.find(x=>x&&!usados.has(x)&&x.nome===nm)||ex.find(x=>x&&!usados.has(x)&&norm(x.nome)===norm(nm))||null;
    if(e)usados.add(e);e=e||{nome:nm,status:'',rev:'',enviado:''};e.nome=nm;
    const novo=[ST_ENT[r.st]||'Sem informação',r.rev||'',r.env||''].join('|');const cur=[e.status||'',e.rev||'',e.enviado||''].join('|');
    n+=aplica(db,o,snap.ent,nm,cur,novo,()=>auditou(o,/projetos/i,nm),()=>{e.status=ST_ENT[r.st]||'Sem informação';e.rev=r.rev||'';e.enviado=r.env||''},'Entregável · '+nm);
    e.statusPainel=r.st||'';if(r.obs)e.obsPainel=r.obs;else delete e.obsPainel;e.fonte=D.fonte;return e});
  const sobra=ex.filter(x=>x&&!usados.has(x));const guarda=sobra.filter(x=>x.link||x.prazo||x.obs||auditou(o,/projetos/i,x.nome||''));
  if(sobra.length){n++;if(guarda.length)guarda.forEach(x=>flag(db,'entregavel_fora_do_painel',o,{campo:x.nome,no_app:x.status}))}
  if(sobra.length||ex.length!==12||ex.some((x,i)=>x!==novos[i]))o.entregaveis=novos.concat(guarda);
  /* arquivos recebidos da arquitetura */
  const an=ARQS();const ax=Array.isArray(o.arquivosRecebidos)?o.arquivosRecebidos:[];const ausados=new Set();
  const anovos=an.map((nm,k)=>{const r=row.arq[k];let a=ax.find(x=>x&&!ausados.has(x)&&norm(x.nome)===norm(nm))||null;if(a)ausados.add(a);a=a||{nome:nm};a.nome=nm;
    const rec=r.st==='Recebido'?'Recebido':r.st==='Não recebido'?'Não recebido':r.st==='N/A'?'N/A':''; /* vazio na planilha = sem registro (o sistema conta como não recebido) */
    const novo=[rec,r.rev||'',r.data||''].join('|');const cur=[a.recebido||'',a.rev||'',a.recebidoEm||''].join('|');
    n+=aplica(db,o,snap.arq,nm,cur,novo,()=>auditou(o,/projetos/i,'Projetos recebidos: '+nm),()=>{a.recebido=rec;a.rev=r.rev||'';a.recebidoEm=r.data||''},'Arquivo recebido · '+nm);
    a.valorPainel=r.raw||'';return a});
  if(ax.length!==5||ax.some((x,i)=>x!==anovos[i])){o.arquivosRecebidos=anovos.concat(ax.filter(x=>x&&!ausados.has(x)&&(x.link||x.obs)));n++}
  /* plataforma de projetos (só leitura do Painel) */
  const pl={ferramenta:row.plat.ferramenta||'',usa:row.plat.usa||'',nome:row.plat.nome||''};if(JSON.stringify(o.plataformaProjetos||{})!==JSON.stringify(pl)){o.plataformaProjetos=pl;n++}
  /* etapas de execução → checklist (o.etapas); o v123 espelha em atividades da Operação */
  o.etapas=Array.isArray(o.etapas)?o.etapas:[];
  ET_MAP.forEach(([nomePainel,subs],k)=>{const x=row.ex[k];const s=etStatus(x,concl,t);if(!s)return;
    subs.forEach((sub,j)=>{let e=o.etapas.find(y=>norm(y.subetapa)===norm(sub));let info0='';
      const novo=j?[s.st,'',''].join('|'):[s.st,s.ini,s.fim].join('|');
      if(!e){e={id:'et_'+o.id+'_v161_'+norm(sub).replace(/ /g,'_'),etapa:ETAPA_DE(sub),subetapa:sub,status:'',ini:'',fim:'',obs:'',info:''};o.etapas.push(e);snap.et[sub]=[e.status,e.ini,e.fim].join('|');n++}
      const cur=[e.status||'',e.ini||'',e.fim||''].join('|');
      n+=aplica(db,o,snap.et,sub,cur,novo,()=>auditou(o,/checklist|obras/i,sub),()=>{e.status=s.st;e.ini=j?'':s.ini;e.fim=j?'':s.fim},'Etapa · '+sub);
      if(subs.length>1&&sub!==subs[0])info0=' · as datas ficam em '+subs[0]+' (o Painel tem uma coluna só)';
      const info='Painel de Controle '+QBR+' · '+nomePainel+(x.ini||x.fim?': '+[x.ini,x.fim].map(v=>ISO(v)?dBR(v):String(v||'—').replace(/^\?/,'')).join(' → '):'')+(s.txt?' · '+s.txt:'')+info0;
      if(e.info!==info){e.info=info;n++}})});
  const vi=o.etapas.find(y=>norm(y.subetapa)==='vistoria inicial');
  if(vi){const comecou=o.etapas.some(y=>y!==vi&&/^(finalizado|em andamento)$/i.test(y.status||''));const novoV=comecou?'Finalizado||':'';
    if(novoV)n+=aplica(db,o,snap.et,'Vistoria Inicial',[vi.status||'',vi.ini||'',vi.fim||''].join('|'),novoV,()=>auditou(o,/checklist|obras/i,'Vistoria'),()=>{vi.status='Finalizado';vi.info='Deduzida (v161): o Painel de Controle não tem coluna de vistoria; a execução já começou, então a vistoria aconteceu'},'Etapa · Vistoria Inicial')}
  const exe=row.ex.map(x=>({item:x.n,inicio:ISO(x.ini)?x.ini:'',termino:ISO(x.fim)?x.fim:'',status:[x.ini,x.fim].some(v=>v==='OK')?'OK':[x.ini,x.fim].some(v=>v==='NA')?'N/A':[x.ini,x.fim].map(v=>v&&v[0]==='?'?v.slice(1):'').filter(Boolean).join(' · '),fonte:D.fonte}));
  if(JSON.stringify(o.execucaoPlanilha||[])!==JSON.stringify(exe)){o.execucaoPlanilha=exe;n++}
  /* diárias */
  [['diariasContratadas',row.dv,'Diárias vendidas'],['diariasExecutadas',row.de,'Diárias executadas']].forEach(([k,v,lb])=>{const nv=v==null?'':String(v);const cur=o[k]==null?'':String(o[k]);
    n+=aplica(db,o,snap.cp,k,cur,nv,()=>false,()=>{o[k]=v==null?null:v},lb)});
  /* entrega prevista = término da Programação AV → fim da execução da E.T. → sem data */
  o.entrega=o.entrega||{};const av=row.ex[6].fim;let pv='',fonte='';
  if(ISO(av)){pv=av;fonte='Programação AV · término (Painel de Controle '+QBR+')'}
  else if(o.et&&ISO(String(o.et.fim||'').slice(0,10))){pv=String(o.et.fim).slice(0,10);fonte='Fim da execução (E.T.)'}
  n+=aplica(db,o,snap.cp,'entrega.prevista',o.entrega.prevista||'',pv,()=>!!o.entrega.prevista,()=>{o.entrega.prevista=pv},'Entrega prevista');
  const fx=(o.entrega.prevista||'')===pv?fonte:(o.entrega.prevista?'digitada no app':'');if(o.entrega.previstaFonte!==fx){o.entrega.previstaFonte=fx;n++}
  if(snap.quando!==D.quando){snap.quando=D.quando;snap.linha=row.linha;n++}
  return n}

function sincronizar(db){const F=estado(db);const t=hoje();F.flags=[];let n=0,ligadas=0;const tocadas=[];
  const byLinha={};(db.obras||[]).forEach(o=>{if(o.merged_into||o.inativo||!o.linhaPlanilha)return;(byLinha[o.linhaPlanilha]=byLinha[o.linhaPlanilha]||[]).push(o)});
  D.rows.forEach(row=>{const os=byLinha[row.linha]||[];if(!os.length){flag(db,'linha_sem_obra',null,{linha:row.linha,cliente:row.cliente});return}
    if(os.length>1)flag(db,'linha_em_duas_obras',os[0],{linha:row.linha,obras:os.map(o=>o.id)});
    const o=os[0];
    if(norm(o.nome)!==norm(row.cliente)&&!(String(o.propostasPlanilha||'').replace(/\D/g,'')&&String(row.propostas||'').replace(/\D/g,'')===String(o.propostasPlanilha||'').replace(/\D/g,'')))flag(db,'nome_diferente',o,{linha:row.linha,planilha:row.cliente});
    ligadas++;const k=sincObra(db,o,row,t);if(k){n+=k;tocadas.push(o)}});
  /* §2 as atividades "Painel de Controle" da cópia de 26/09 saem da lista (ficam no histórico) */
  const comLinha=new Set(Object.values(byLinha).flat().map(o=>o.id));let ret=0;
  (db.atividades||[]).forEach(a=>{if(!a||a.ativo===false||a.etapa_id||!/^Planilha Mestra TAAG \(Painel de Controle\)$/.test(a.origem||'')||!comLinha.has(a.obra_id))return;
    if((db.cop_auditoria||[]).some(x=>x&&x.registro===a.id)){flag(db,'atividade_editada_mantida',T_(()=>C.obra(a.obra_id),null),{campo:a.nome});return}
    a.ativo=false;a.retiradaV161='Cópia de 26/09 do Painel de Controle — substituída pelas etapas lidas em '+QBR+' (checklist da obra → atividades)';ret++});
  F.atividadesRetiradas=(F.atividadesRetiradas||0)+ret;n+=ret;
  F.quando=D.quando;F.fonte=D.fonte;F.linhas=D.rows.length;F.ligadas=ligadas;F.excecoes=(D.excecoes||[]).length;F.rodouEm=t;
  /* o checklist mudou → as atividades-espelho e a fase Execução acompanham (v123) */
  const M=window.__V123F;if(M&&typeof M.mirror==='function')tocadas.forEach(o=>T_(()=>M.mirror(o)));
  return n}

/* ---------- §5 números (uma conta, usada por Projetos e pelo Início) ---------- */
const P=window.V161P=window.V161P||{};
/* ---------- §6 concluída pela E.T. realizada (Bruno, 06/11/2026) ---------- */
const etReal=o=>/realizad/i.test(String((o.et||{}).situacao||''));
const planConcl=o=>/^(concluido|cancelada)$/i.test(norm(o.statusPlanilha));
function concluiPorET(db){let n=0;const t=hoje();
  (db.obras||[]).forEach(o=>{if(!o||o.merged_into||o.inativo||o.legadoAT)return;const m=o.concluidaPorET;
    if(m){/* a planilha mudou o status, ou a E.T. não diz mais Realizada: vale a planilha */
      if(!etReal(o)||planConcl(o)||norm(o.statusPlanilha)!==norm(m.statusPlanilha)){if(o.situacao==='Concluída'&&!planConcl(o))o.situacao=m.antes||'Em andamento';delete o.concluidaPorET;n++}
      return}
    if(!etReal(o)||planConcl(o))return;if(T_(()=>C.situacao(o),o.situacao)!=='Em andamento')return;
    const et=o.et||{};const d=ISO(et.data)?et.data:ISO(et.fim)?et.fim:'';
    o.concluidaPorET={data:d,dataDe:ISO(et.data)?'data da E.T.':ISO(et.fim)?'fim da execução na E.T. (a coluna da data da E.T. está vazia)':'sem data na E.T.',antes:o.situacao||'Em andamento',statusPlanilha:o.statusPlanilha||'',fonte:et.fonte||'',regra:'Bruno 06/11/2026: E.T. realizada = obra concluída',em:t};
    o.situacao='Concluída';o.entrega=o.entrega||{};if(!o.entrega.realizada&&d)o.entrega.realizada=d;n++});
  return n}
P.notaET=o=>{const m=o&&o.concluidaPorET;return m?`concluída pela E.T. realizada em ${m.data?dBR(m.data):'(sem data)'} (a planilha ainda diz ${m.statusPlanilha||o.statusPlanilha||'em andamento'})`:''};
P.concluidasET=()=>(S.db.obras||[]).filter(o=>o&&o.concluidaPorET&&!o.merged_into&&!o.inativo);

const ativas=()=>(S.db.obras||[]).filter(o=>!o.merged_into&&!o.inativo);
const sit=o=>T_(()=>C.situacao(o),o.situacao||'');
const emAnd=()=>ativas().filter(o=>o.ativo!==false&&sit(o)==='Em andamento'&&!o.prospeccao);
const temLinha=o=>!!(o._v161&&o._v161.quando&&o.linhaPlanilha&&!o.semLinhaMestra);
const atrasadoE=e=>e.prazo&&e.prazo<hoje()&&!DONE(e.status)&&e.status!=='Enviado'&&e.status!=='N/A';
P.estado=o=>{const es=(o.entregaveis||[]).filter(e=>e&&e.status!=='N/A');const pr=es.filter(e=>DONE(e.status)).length;
  const r={total:es.length,prontos:pr,andamento:es.filter(e=>ELAB(e.status)).length,aguardando:es.filter(e=>AGU(e.status)).length,semst:es.filter(e=>SEMST(e.status)).length,
    atrasados:es.filter(atrasadoE).length,na:(o.entregaveis||[]).length-es.length};
  const prox=es.find(e=>!DONE(e.status));const arqNao=(o.arquivosRecebidos||[]).some(a=>a&&norm(a.nome)==='arquitetura'&&a.recebido==='Não recebido');
  r.k=!temLinha(o)?'semlinha':!r.total?'vazio':pr===r.total?'pronto':r.atrasados?'atrasado':r.andamento?'andamento':(prox&&AGU(prox.status))||arqNao?'aguardando':'semstatus';
  r.prox=prox||null;return r};
P.K={andamento:['com entregável em andamento','#2a78d6','info'],aguardando:['aguardando a arquitetura','#d68a00','warn'],atrasado:['com prazo vencido','#d93a3a','bad'],
  semstatus:['sem status na planilha','#8f969d',''],pronto:['com projeto pronto','#1a9e5c','ok'],vazio:['sem entregável aplicável (tudo N/A)','#b9bec3',''],semlinha:['sem linha no Painel hoje','#b9bec3','']};
P.ORDEM=['andamento','aguardando','atrasado','semstatus','pronto','vazio','semlinha'];
P.resumo=()=>{const ea=emAnd();const b={};P.ORDEM.forEach(k=>b[k]=[]);ea.forEach(o=>b[P.estado(o).k].push(o));
  const lin=ea.filter(temLinha);const ents=[];lin.forEach(o=>(o.entregaveis||[]).forEach(e=>{if(e&&e.status!=='N/A')ents.push({o,e})}));
  const m=hoje().slice(0,7);const aprovMes=[];ativas().filter(temLinha).forEach(o=>(o.entregaveis||[]).forEach(e=>{if(e&&DONE(e.status)&&String(e.enviado||'').slice(0,7)===m)aprovMes.push({o,e})}));
  return {ea,b,ents,elab:ents.filter(x=>ELAB(x.e.status)),agu:ents.filter(x=>AGU(x.e.status)),semst:ents.filter(x=>SEMST(x.e.status)),prontos:ents.filter(x=>DONE(x.e.status)),
    atr:ents.filter(x=>atrasadoE(x.e)),aprovMes,mes:m,semBrief:ea.filter(o=>String(o.briefing||'').toLowerCase()!=='sim')}};
/* entregáveis pendentes = o que a planilha marca como em andamento ou aguardando — vazio (sem status) e N/A não contam */
P.pendentes=obras=>{const out=[];(obras||emAnd()).filter(temLinha).forEach(o=>(o.entregaveis||[]).forEach(e=>{if(e&&(ELAB(e.status)&&e.status!=='Enviado'||AGU(e.status)))out.push({o,e})}));return out};
P.semStatus=obras=>{let n=0;(obras||emAnd()).filter(temLinha).forEach(o=>(o.entregaveis||[]).forEach(e=>{if(e&&SEMST(e.status))n++}));return n};
P.filtro=k=>{P.f=k||null;if(typeof render==='function')render();setTimeout(()=>{const el=document.getElementById('v161-lista');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},80)};

/* ---------- §3 telas ---------- */
const stat_=(lb,v,s,cls)=>typeof stat==='function'?stat(lb,v,s,cls):`<div class="card stat"><div class="lb">${lb}</div><div class="v ${cls||''}">${v}</div><div class="s">${s||''}</div></div>`;
const kbtn=(lb,v,s,cls,on)=>`<div class="col-6 col-lg" style="cursor:pointer" onclick="${E(on)}">${stat_(lb,N0(v),s,cls)}</div>`;
const barra=(o,r)=>{r=r||P.estado(o);const k=P.K[r.k];const pc=r.total?Math.round(100*r.prontos/r.total):0;
  return `<div title="${E(k[0])}" style="display:flex;align-items:center;gap:8px;min-width:160px"><div style="flex:1;height:8px;background:var(--bd,#e5e7eb);border-radius:5px;overflow:hidden"><div style="width:${pc}%;height:100%;background:${k[1]}"></div></div><span class="mono" style="font-size:12px;white-space:nowrap">${N0(r.prontos)} de ${N0(r.total)}</span></div>`};
const curto=nm=>String(nm).replace('Estudo de pontos / anteprojeto','Estudo de pontos').replace('Infraestrutura / projeto executivo','Executivo').replace('Planta forro / recorte e instalação de caixas','Planta forro').replace('Lista de medidas dos equipamentos','Medidas').replace('Diagrama de equipamentos','Diagrama');
const CHIP={'Concluído':'ok','Aprovado':'ok','Em elaboração':'info','Em andamento':'info','Enviado':'info','Revisão':'warn','Aguardando projeto arq.':'warn','N/A':'','Sem informação':''};
const LEG={'Concluído':'(C) concluído','Aprovado':'aprovado','Em elaboração':'(A) em andamento','Aguardando projeto arq.':'(A/P) aguardando arquitetura','N/A':'(N/A) não se aplica','Sem informação':'sem status na planilha'};
function chips(o){return `<div class="d-flex flex-wrap gap-1">${(o.entregaveis||[]).map((e,i)=>{const na=e.status==='N/A';
    return `<span class="chip ${CHIP[e.status]||''}" style="${na?'opacity:.45;':''}${SEMST(e.status)?'border:1px dashed var(--bd,#ccc);':''}cursor:pointer;font-size:11.5px" title="${E(e.nome)} · ${E(LEG[e.status]||e.status||'—')}${e.enviado?' · enviado '+dBR(e.enviado):''}${e.rev?' · '+E(e.rev):''}${e.obsPainel?' · planilha: '+E(e.obsPainel):''}" onclick="COP.prj&&COP.prj.formEnt&&COP.prj.formEnt('${E(o.id)}',${i})">${E(curto(e.nome))}${e.enviado?` · <span class="mono">${dBR(e.enviado).slice(0,5)}/${dBR(e.enviado).slice(8)}</span>`:''}${e.rev?` · <span class="mono">${E(e.rev)}</span>`:''}</span>`}).join('')}</div>`}
const plink=o=>`<a href="#/prjobras/${E(o.id)}"><b>${E(o.nome||o.id)}</b></a>`;

/* balanceia <div>…</div> a partir de i */
function bloco(h,i){if(i<0)return null;let d=0;const re=/<div\b|<\/div>/g;re.lastIndex=i;let m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(!d)return h.slice(i,m.index+6)}return null}
function cardCom(h,txt){const k=h.indexOf(txt);if(k<0)return '';const i=h.lastIndexOf('<div class="card p-3 mb-3">',k);return bloco(h,i)||''}
function rowCom(h,txt){const k=h.indexOf(txt);if(k<0)return '';const i=h.lastIndexOf('<div class="row g-3 mb-3">',k);return bloco(h,i)||''}

/* P4: o total de obras com a mesma régua da Operação (Operação não vê os clientes antigos do Pós-venda — v157 — nem a prospecção — v123) */
function ponteObras(){const all=S.db.obras||[];const leg=all.filter(o=>o.legadoAT);const op=all.filter(o=>!o.legadoAT);
  const fora=op.filter(o=>o.ativo===false).length;const vis=op.filter(o=>o.ativo!==false&&!o.prospeccao);const pros=op.filter(o=>o.ativo!==false&&o.prospeccao).length;
  const n=s=>vis.filter(o=>sit(o)===s).length;
  const and=n('Em andamento'),hold=n('On hold'),conc=n('Concluída'),canc=n('Cancelada'),asst=n('Assistência técnica');const outros=vis.length-and-hold-conc-canc-asst;
  const go=(s)=>`COP.ope.go('obras',{situacao:'${s}'},'#/obras')`;const u=(t,on)=>`<a href="javascript:void 0" onclick="${E(on)}">${t}</a>`;
  const soma1=and+hold+conc+canc+asst+outros+pros+fora+leg.length;
  const ln=op.filter(o=>!o.merged_into&&!o.inativo&&temLinha(o)).length;const semL=op.filter(o=>!(!o.merged_into&&!o.inativo&&temLinha(o)));
  const fund=semL.filter(o=>o.merged_into||o.inativo).length;const semLs={};semL.filter(o=>!o.merged_into&&!o.inativo).forEach(o=>{const k=sit(o)||'sem situação';semLs[k]=(semLs[k]||0)+1});
  const soma2=ln+semL.length+leg.length;
  return {txt:`<b>${N0(all.length)} obras na Base</b> = ${u(N0(and)+' em andamento',go('Em andamento'))} + ${u(N0(hold)+' on hold',go('On hold'))} + ${u(N0(conc)+' concluídas',go('Concluída'))}${P.concluidasET().length?` <span class="sub">(${N0(P.concluidasET().length)} pela E.T. realizada)</span>`:''} <span class="sub">(= ${N0(and+hold+conc)}, o total de Operação)</span> + ${u(N0(canc)+' canceladas',go('Cancelada'))} + ${u(N0(asst)+' em assistência técnica',go('Assistência técnica'))}${outros?' + '+N0(outros)+' sem situação':''}${pros?' + '+N0(pros)+' em prospecção (fora das listas até o Vendido)':''}${fora?' + '+N0(fora)+' inativas':''} + <a href="#/posobras">${N0(leg.length)} clientes antigos do Pós-venda</a> <span class="sub">(Controle de AT — fora da Operação)</span> ${soma1===all.length?'<span style="color:#198754">✓</span>':'<span class="bad">✗</span>'}`,
    txt2:`Por origem: ${N0(ln)} com linha no Painel de Controle de ${QBR} + ${N0(semL.length)} da Mestra sem linha hoje (${[fund?N0(fund)+' fundidas em outra obra':'',...Object.entries(semLs).map(([k,v])=>N0(v)+' '+k.toLowerCase())].filter(Boolean).join(' · ')}) + ${N0(leg.length)} do Controle de AT = ${N0(soma2)} ${soma2===all.length?'<span style="color:#198754">✓</span>':'<span class="bad">✗</span>'}`,
    and,hold,conc,canc,asst,ln,semL:semL.length,leg:leg.length,total:all.length,ok:soma1===all.length&&soma2===all.length}}

function painel(inner){const r=P.resumo();const ea=r.ea;const b=r.b;const nb=k=>b[k].length;
  const go=k=>`V161P.filtro('${k}')`;
  const kp=`<div class="row g-3 mb-3">
   ${kbtn('Obras com a fase Projetos em andamento',nb('andamento'),'têm entregável (A) em andamento na planilha','bl',go('andamento'))}
   ${kbtn('Aguardando arquivos do arquiteto',nb('aguardando'),'próximo entregável (A/P) ou arquitetura não recebida',nb('aguardando')?'rd':'gr',go('aguardando'))}
   ${kbtn('Obras com projeto pronto',nb('pronto'),'todos os entregáveis aplicáveis (C)','gr',go('pronto'))}
   ${kbtn('Entregáveis em elaboração',r.elab.length,'(A) nas obras em andamento','bl',`COP.prj.go('prjcrono',{st:'Em elaboração'})`)}
   ${kbtn('Aprovados este mês',r.aprovMes.length,'entregáveis (C) enviados em '+r.mes.slice(5)+'/'+r.mes.slice(0,4),'gr',`COP.prj.go('prjcrono',{st:'aprovados',mes:'${r.mes}',sit:'*'})`)}
   ${kbtn('Obras sem briefing',r.semBrief.length,'em andamento',r.semBrief.length?'rd':'gr',`COP.prj.go('prjobras',{briefing:'pendente'})`)}
   ${kbtn('Entregáveis atrasados',r.atr.length,'prazo vencido (prazo dado no app)',r.atr.length?'rd':'gr',`COP.prj.go('prjcrono',{atraso:'1'})`)}
  </div>`;
  const termos=P.ORDEM.filter(k=>nb(k)).map(k=>`<a href="javascript:void 0" onclick="${E(go(k))}"><b style="color:${P.K[k][1]}">${N0(nb(k))}</b> ${E(P.K[k][0])}</a>`);
  const soma=P.ORDEM.reduce((a,k)=>a+nb(k),0);
  const pont=`<div class="card p-3 mb-3" id="v161-ponte" data-ea="${ea.length}" data-soma="${soma}" style="font-size:13.5px"><div><b>${N0(ea.length)} obras em andamento</b> = ${termos.join(' + ')} ${soma===ea.length?'<span style="color:#198754">✓</span>':'<span class="bad">✗</span>'}</div>
   <div class="sub mt-1" style="font-size:12px">Entregáveis das obras com linha no Painel (N/A não conta): ${N0(r.ents.length)} = ${N0(r.prontos.length)} prontos (C) + ${N0(r.elab.length)} em andamento (A) + ${N0(r.agu.length)} aguardando arquitetura (A/P) + ${N0(r.semst.length)} sem status na planilha. <b>Entregáveis pendentes</b> (o número do Início) = ${N0(r.elab.length)} (A) + ${N0(r.agu.length)} (A/P) = ${N0(r.elab.length+r.agu.length)} — vazio e N/A não são pendência. Lido do Painel de Controle de ${QBR}.</div></div>`;
  /* lista: uma barra por obra */
  const f=P.f&&P.K[P.f]?P.f:null;const lista=(f?b[f]:ea).slice().sort((x,y)=>P.ORDEM.indexOf(P.estado(x).k)-P.ORDEM.indexOf(P.estado(y).k)||String(x.nome).localeCompare(String(y.nome),'pt-BR'));
  const rows=lista.map(o=>{const s=P.estado(o);const k=P.K[s.k];const nx=s.prox?`<div class="sub" style="font-size:11px">próximo: ${E(curto(s.prox.nome))} · ${E(LEG[s.prox.status]||s.prox.status)}</div>`:'';
    return `<tr class="rowlink" data-obra="${E(o.id)}" data-k="${s.k}" onclick="location.hash='#/prjobras/${E(o.id)}'"><td>${plink(o)}<div class="sub" style="font-size:11px">${E(o.respProjetos||'sem projetista')} · ${E(o.statusPlanilha||'')}</div></td><td style="min-width:220px">${barra(o,s)}${nx}</td><td><span class="chip ${k[2]}">${E(k[0])}</span></td><td class="mono" style="font-size:12px">${s.andamento?N0(s.andamento)+' (A)':''}${s.aguardando?' '+N0(s.aguardando)+' (A/P)':''}${s.semst?' <span class="sub">'+N0(s.semst)+' sem status</span>':''}</td></tr>`});
  const filtros=`<div class="d-flex flex-wrap gap-1 align-items-center">${f?`<span class="chip ${P.K[f][2]}" style="cursor:pointer" onclick="V161P.filtro(null)">${E(P.K[f][0])} · ${N0(b[f].length)} ×</span>`:`<span class="sub" style="font-size:12px">clique num número acima para filtrar</span>`}</div>`;
  const tbl=`<div class="tblwrap"><table class="tbl"><thead><tr><th>Obra</th><th>Entregáveis prontos</th><th>Onde está</th><th>Abertos</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="4" class="sub">nenhuma obra</td></tr>'}</tbody></table></div>`;
  const lst=`<div id="v161-lista" data-n="${lista.length}" data-f="${f||''}">`+(T_(()=>C.section(`Onde está cada projeto · ${N0(lista.length)} obra(s)`,tbl,filtros),'')||tbl)+`</div>`;
  /* por projetista */
  const grp={};ea.forEach(o=>{const k=o.respProjetos||'(sem projetista)';(grp[k]=grp[k]||[]).push(o)});
  const pr=Object.entries(grp).sort((a,b)=>b[1].length-a[1].length).map(([k,l])=>{const st=l.map(o=>P.estado(o));const s=f=>st.reduce((a,x)=>a+x[f],0);
    return `<tr class="rowlink" onclick="COP.prj.go('prjobras',{projetista:'${E(k==='(sem projetista)'?'__sem':k)}'})"><td><b>${E(k)}</b></td><td class="mono">${N0(l.length)}</td><td class="mono">${N0(s('prontos'))} de ${N0(s('total'))}</td><td class="mono">${N0(s('andamento'))}</td><td class="mono">${N0(s('aguardando'))}</td><td class="mono sub">${N0(s('semst'))}</td></tr>`});
  const porProj=T_(()=>C.section('Obras por projetista',`<div class="tblwrap"><table class="tbl"><thead><tr><th>Projetista</th><th>Obras</th><th>Prontos</th><th>Em andamento (A)</th><th>Aguardando arq. (A/P)</th><th>Sem status</th></tr></thead><tbody>${pr.join('')}</tbody></table></div>`,`<a href="#/prjobras" class="btn-soft">Ver todas</a>`),'');
  const ex=rowCom(inner,'AGUARDANDO ACEITE DA ARQUITETURA');const prazos=cardCom(inner,'Próximos prazos de entregáveis');
  const k5=inner.indexOf('<div class="col-12 col-xl-5">');const dir=k5>=0?bloco(inner,k5):'';
  const pO=ponteObras();const nProj=T_(()=>[...new Set((S.db.obras||[]).map(o=>o.respProjetos).filter(Boolean))].length,0);
  const hd=T_(()=>head('Painel de projetos',`${N0(ea.length)} obras em andamento · ${N0(nProj)} projetistas · ${N0(pO.total)} obras no total`,`<button class="btn-soft" onclick="COP.prj.go('prjarquivos',{})"><i class="bi bi-folder2-open me-1"></i>Arquivos recebidos</button><button class="btn-apple" onclick="COP.prj.formHoras()"><i class="bi bi-clock me-1"></i>Lançar horas</button>`),'<h1 class="h1">Painel de projetos</h1>');
  const pob=`<div class="card p-2 px-3 mb-3" id="v161-obras-ponte" data-total="${pO.total}" data-ok="${pO.ok?1:0}" data-op="${pO.and+pO.hold+pO.conc}" style="font-size:12px"><div>${pO.txt}</div><div class="sub" style="font-size:11px">${pO.txt2}</div></div>`;
  return hd+pob+ex+kp+pont+lst+`<div class="row g-3"><div class="col-12 col-xl-7">${porProj}${prazos}</div>${dir||''}</div>`}

/* §4 página da obra */
function cardObra(o,ops){const s=P.estado(o);const k=P.K[s.k];const linha=temLinha(o);
  const arq=(o.arquivosRecebidos||[]).map(a=>`<span class="chip ${a.recebido==='Recebido'?'ok':a.recebido==='Não recebido'?'bad':''}" title="${E(a.nome)} · ${E(a.recebido||'—')}${a.recebidoEm?' em '+dBR(a.recebidoEm):''}" style="font-size:11.5px">${E(a.nome)}${a.recebidoEm?' · <span class="mono">'+dBR(a.recebidoEm)+'</span>':a.recebido?' · '+E(a.recebido.toLowerCase()):' · sem registro'}${a.rev?' · <span class="mono">'+E(a.rev)+'</span>':''}</span>`).join(' ');
  const atrE=x=>!o.concluidaPorET&&x.status!=='OK'&&x.status!=='N/A'&&x.termino&&x.termino<hoje();
  const et=(o.execucaoPlanilha||[]).map(x=>`<span class="chip ${x.status==='OK'?'ok':x.status==='N/A'?'':atrE(x)?'bad':x.inicio&&x.inicio<=hoje()?'info':''}" style="font-size:11.5px" title="${E(x.item)}${x.status?' · '+E(x.status):''}${atrE(x)?' · atrasada: o término passou sem OK na planilha':''}">${E(x.item)}${x.status==='OK'?' · OK':x.status==='N/A'?' · N/A':atrE(x)?' · <b>atrasada</b>':''}${x.inicio||x.termino?' · <span class="mono">'+(x.inicio?dBR(x.inicio).slice(0,5):'—')+' → '+(x.termino?dBR(x.termino):'—')+'</span>':''}${x.status&&!/^(OK|N\/A)$/.test(x.status)?' · '+E(x.status):''}</span>`).join(' ');
  const pv=(o.entrega||{}).prevista;const dv=o.diariasContratadas,de=o.diariasExecutadas;
  const diar=dv==null&&de==null?'<span class="sub">sem diárias no Painel</span>':`<b>${N0(de||0)}</b> executadas de <b>${N0(dv||0)}</b> vendidas${dv!=null&&de!=null?(de>dv?` <span class="chip bad" style="font-size:11px">${N0(de-dv)} além do vendido</span>`:` · saldo ${N0(dv-de)}`):''}`;
  return `<div class="card p-3 mb-3" id="v161-obra" data-k="${s.k}" data-prontos="${s.prontos}" data-total="${s.total}">
   <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><h6 class="m-0">${ops?'Projeto e execução · Painel de Controle':'Entregáveis · Painel de Controle'} <span class="sub" style="font-weight:400">${linha?'lido em '+QBR+' · linha '+E(o.linhaPlanilha):'esta obra não tem linha no Painel hoje — dados da cópia anterior'}</span></h6><span class="chip ${k[2]}">${E(k[0])}</span></div>
   <div class="mb-2" style="max-width:520px">${barra(o,s)}<div class="sub" style="font-size:12px">${N0(s.prontos)} de ${N0(s.total)} entregáveis prontos${s.na?' · '+N0(s.na)+' N/A não contam':''}${s.semst?' · '+N0(s.semst)+' sem status na planilha':''}</div></div>
   ${o.concluidaPorET?`<div class="mb-2" id="v161-notaet" style="font-size:12.5px;padding:6px 10px;border-radius:8px;background:rgba(25,135,84,.08)"><i class="bi bi-check2-circle me-1" style="color:#198754"></i><b>${E(P.notaET(o))}</b> <span class="sub">· regra do Bruno (06/11): E.T. realizada = obra concluída · data = ${E(o.concluidaPorET.dataDe)}</span></div>`:''}
   ${chips(o)}
   <div class="sub mt-2" style="font-size:11.5px">Legenda: <span class="chip ok" style="font-size:10.5px">(C) concluído</span> <span class="chip info" style="font-size:10.5px">(A) em andamento</span> <span class="chip warn" style="font-size:10.5px">(A/P) aguardando arquitetura</span> <span class="chip" style="font-size:10.5px;border:1px dashed var(--bd,#ccc)">sem status</span> <span class="chip" style="font-size:10.5px;opacity:.45">N/A</span> · data = projeto enviado · Rxx = revisão · clique num chip para editar no app (vira bandeira se a planilha disser outra coisa)</div>
   <div class="mt-3"><div class="sub mb-1" style="font-size:11px;font-weight:600">ARQUIVOS RECEBIDOS DA ARQUITETURA</div>${arq||'<span class="sub">—</span>'}${o.plataformaProjetos&&(o.plataformaProjetos.ferramenta||o.plataformaProjetos.nome)?`<span class="sub ms-2" style="font-size:11.5px">· plataforma: ${E(o.plataformaProjetos.ferramenta||'')}${o.plataformaProjetos.nome?' — '+E(o.plataformaProjetos.nome):''}</span>`:''}</div>
   <div class="mt-3"><div class="sub mb-1" style="font-size:11px;font-weight:600">EXECUÇÃO (ETAPAS DO PAINEL)</div>${et||'<span class="sub">—</span>'}</div>
   <div class="row g-2 mt-2" style="font-size:13px"><div class="col-12 col-md-6"><div class="sub" style="font-size:11px">ENTREGA PREVISTA</div>${pv?'<b>'+dBR(pv)+'</b> <span class="sub">'+E((o.entrega||{}).previstaFonte||'')+'</span>':'<span class="bad">sem data</span> <span class="sub">— sem término da Programação AV no Painel e sem fim da execução na E.T.</span>'}</div><div class="col-12 col-md-6"><div class="sub" style="font-size:11px">DIÁRIAS</div>${diar}</div></div></div>`}
function injeta(h,card,depoisDoPrimeiroCard){if(typeof h!=='string')return h;
  if(depoisDoPrimeiroCard){const i=h.indexOf('<div class="card p-3 mb-3">');const b=i>=0?bloco(h,i):null;if(b)return h.slice(0,i+b.length)+card+h.slice(i+b.length)}
  const i=h.indexOf('<div class="tabs');return i>=0?h.slice(0,i)+card+h.slice(i):h+card}

function telas(){
  const p0=SCREENS.prjpainel;if(p0&&!p0.__v161){SCREENS.prjpainel=function(){const h=p0.apply(this,arguments);if(typeof h!=='string')return h;try{return painel(h)}catch(e){console.error('v161 painel',e);return h}};SCREENS.prjpainel.__v161=1;SCREENS.prjpainel.__v123p=true}
  const o0=SCREENS.prjobras;if(o0&&!o0.__v161){SCREENS.prjobras=function(arg){const h=o0.apply(this,arguments);if(!arg||typeof h!=='string')return h;const o=T_(()=>C.obra(arg),null);if(!o)return h;try{return injeta(h,cardObra(o,false),true)}catch(e){console.error('v161 obra',e);return h}};SCREENS.prjobras.__v161=1;SCREENS.prjobras.__v123p=o0.__v123p}
  const f0=SCREENS.obras;if(f0&&!f0.__v161){SCREENS.obras=function(arg){const h=f0.apply(this,arguments);if(!arg||typeof h!=='string')return h;const o=T_(()=>C.obra(arg),null);if(!o||!o.linhaPlanilha)return h;try{return injeta(h,cardObra(o,true))}catch(e){console.error('v161 ficha',e);return h}};SCREENS.obras.__v161=1;SCREENS.obras.__v123p=f0.__v123p}
  /* Base › Conferência Mestra: exceções de data e campos editados no app */
  const m0=SCREENS.dbmestra;if(m0&&!m0.__v161){SCREENS.dbmestra=function(){const h=m0.apply(this,arguments);if(typeof h!=='string')return h;const F=S.db._v161||{};const fl=F.flags||[];const ex=D.excecoes||[];
    const amb=ex.filter(x=>/hoje/.test(x.tipo));const ed=fl.filter(x=>x.tipo==='editado_no_app');const outras=fl.filter(x=>x.tipo!=='editado_no_app');
    const COLN=c=>c>=66?['Cabeamento','Caixas acústicas','Quadro','Keypads','Rack e equipamentos','Programação ON/OFF','Programação AV'][Math.floor((c-66)/2)]+(c%2?' · término':' · início'):c>=28&&c<64?ENTS()[Math.floor((c-28)/3)]+' · enviado':c>=15&&c<25?ARQS()[Math.floor((c-15)/2)]:'coluna '+c;
    const card=`<div class="card p-3 mb-3" id="v161-conf"><h6 class="m-0 mb-2">Painel de Controle ${E(QBR)} — entregáveis, arquivos, diárias e etapas <span class="chip">${N0(F.ligadas||0)} de ${N0(D.rows.length)} linhas ligadas</span></h6>
      <div class="sub mb-2" style="font-size:12px">${E(D.regraAno)}</div>
      <div><b>Datas com ano ambíguo (regra "hoje")</b> <span class="chip warn">${N0(amb.length)}</span> ${amb.map(x=>`<div style="font-size:12px">linha ${E(x.linha)} · ${E(x.cliente)} · ${E(COLN(x.coluna))}: "${E(x.valor)}" → <b>${dBR(x.data)}</b></div>`).join('')}</div>
      <details class="mt-2"><summary style="font-size:12.5px">Outras ${N0(ex.length-amb.length)} correções de data (ano do vizinho na mesma linha · digitação corrigida)</summary>${ex.filter(x=>!/hoje/.test(x.tipo)).map(x=>`<div style="font-size:12px">linha ${E(x.linha)} · ${E(x.cliente)} · ${E(COLN(x.coluna))}: "${E(x.valor)}" → ${x.data?dBR(x.data):'—'} <span class="sub">${E(x.tipo)}</span></div>`).join('')}</details>
      <div class="mt-2"><b>Editado no app — a planilha diz outra coisa (o app foi mantido)</b> <span class="chip ${ed.length?'warn':''}">${N0(ed.length)}</span>${ed.slice(0,200).map(x=>`<div style="font-size:12px"><a href="#/prjobras/${E(x.obra_id)}">${E(x.obra)}</a> · ${E(x.campo)}: app <b>${E(x.no_app||'—')}</b> · planilha ${E(x.planilha||'—')}</div>`).join('')}</div>
      ${outras.length?`<details class="mt-2"><summary style="font-size:12.5px">Outras bandeiras ${N0(outras.length)}</summary>${outras.map(x=>`<div style="font-size:12px">${E(x.tipo)} · linha ${E(x.linha||'—')} · ${E(x.obra||x.cliente||'')} ${E(x.planilha||x.campo||'')}</div>`).join('')}</details>`:''}
      ${(()=>{const xs=P.concluidasET().slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));return `<div class="mt-2" id="v161-conf-et" data-n="${xs.length}"><b>Concluídas pela E.T. realizada — a planilha ainda diz outra coisa</b> <span class="chip ${xs.length?'info':''}">${N0(xs.length)}</span> <span class="sub" style="font-size:12px">regra do Bruno (06/11): E.T. "Realizada" = obra concluída em todo o sistema</span>${xs.map(o=>`<div style="font-size:12px"><a href="#/obras/${E(o.id)}">${E(o.nome)}</a> · linha ${E(o.linhaPlanilha||'—')} · ${E(P.notaET(o))} <span class="sub">· data = ${E(o.concluidaPorET.dataDe)}</span></div>`).join('')}</div>`})()}
      <div class="sub mt-2" style="font-size:12px">${N0(F.atividadesRetiradas||0)} atividades da cópia de 26/09 saíram da lista (histórico). Fonte: ${E(D.fonte)} · arquivo v161-painel-data.js gerado por tools/gen-v161-painel.py.</div></div>`;
    const i=h.lastIndexOf('<div class="sub" style="font-size:12px">Fonte:');return i>=0?h.slice(0,i)+card+h.slice(i):h+card};SCREENS.dbmestra.__v161=1}}
telas();

/* ---------- boot ---------- */
function boot(){try{const db=S.db;if(db.af113_zero||treino())return;const n=concluiPorET(db)+sincronizar(db);
    if(n){T_(()=>log('obras','v161','Painel de Controle '+D.quando+': '+n+' campos de projeto/execução atualizados'));T_(()=>save())}}catch(e){console.error('v161',e)}}
boot();
try{const _rm=window.renderMain;window.renderMain=function(){try{telas();const db=S.db;if(db&&!db.af113_zero&&!treino()&&(!db._v161||db._v161.quando!==D.quando))boot()}catch(e){}return _rm.apply(this,arguments)}}catch(e){}
})();
