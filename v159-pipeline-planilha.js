/* =====================================================================================================
   v159 · PIPELINE = A PLANILHA (Bruno, 05/11/2026 — "fix the pipeline to look exactly like the sheet")
   O que estava errado: 9 linhas da aba Pipeline da To Do Comercial têm o STATUS em branco. O protótipo as contava
   como abertas, em "Desenvolver proposta" (18 + 9 = 27), e o Pipeline dizia 65 negociações abertas — a planilha tem 56.
   §1 Base: cada negociação da Pipeline guarda a sua linha da planilha (número da linha + as 17 colunas, como estão)
      em n.planilha. STATUS em branco = resultado "sem_status" (não é aberta, nem fechada, nem perdida, nem futuro) e
      etapa "Sem status na planilha". A tela lê só a Base (uma fonte).
   §2 KPI: ganha sem_status; as pontes passam a ser 913 = fechadas + perdidas + futuro + abertas + sem status.
   §3 (retirado 05/11 — o Bruno quer o desenho de antes) Comercial › Pipeline abria na vista "Como na planilha": as mesmas colunas, na mesma ordem, as mesmas linhas,
      o mesmo texto; os totais por STATUS com a ponte, cada número filtra a tabela. O quadro antigo fica na aba "Quadro".
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v159p)return;window.__v159p=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V159_PIPE;if(!D||!Array.isArray(D.rows)){console.error('v159: v159-pipeline-planilha-data.js não carregou');return}
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const ST=10,CONS=4,TIPO=9,CLI=3;
const ABERTOS=['proposta enviada','desenvolver proposta','revisao de proposta','proposta desenvolvida','aguardando apresentacao'];
const SEM='Sem status na planilha';

/* ---------- §1 a linha da planilha entra na Base ---------- */
function liga(){const db=S.db;const N=db.negociacoes||[];let mud=0;
  const iso=d=>{const m=String(d||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
  /* 19/11: as negociações novas da planilha nascem aqui (id fixo, o mesmo em todos os computadores) — antes da ligação */
  T(()=>criaNovas(db,iso),null);
  const L=N.filter(n=>/^Pipeline \(/.test(n.origem||'')).sort((a,b)=>(+String(a.id).replace(/\D/g,'')||0)-(+String(b.id).replace(/\D/g,'')||0));
  const byId={};(db.negociacoes||[]).forEach(n=>{byId[n.id]=n});
  const usados=new Set();const falta=[];
  const pts=(n,r)=>(nz(n.status_pipeline)===nz(r.c[ST])?2:0)+(String(n.data_upgrade||'').slice(0,10)===iso(r.c[12])?1:0)+(nz(n.consultor)===nz(r.c[CONS])?1:0)+(nz(n.cliente_nome)===nz(r.c[CLI])?3:0)+(nz(n.tipo_pipeline)===nz(r.c[TIPO])?1:0);
  let ptr=0;const mudSt=[];
  D.rows.forEach(r=>{let n=null;
    /* 19/11: a leitura diz a qual negociação cada linha pertence (r.id) — as linhas mudam de lugar na planilha */
    if(r.id){n=byId[r.id]||null;if(!n||usados.has(n.id)){falta.push(r.linha);return}}
    else{let best=null,bp=-1;for(let k=Math.max(0,ptr-8);k<Math.min(L.length,ptr+9);k++){const x=L[k];if(usados.has(x.id))continue;const p=pts(x,r)-Math.abs(k-ptr)*0.01;if(p>bp){bp=p;best=k}}
      if(best==null||bp<4){const k=L.findIndex(x=>!usados.has(x.id)&&nz(x.cliente_nome)===nz(r.c[CLI]));if(k>=0){best=k;bp=9}}
      if(best==null||bp<4){falta.push(r.linha);return}
      n=L[best];ptr=best+1}
    usados.add(n.id);
    const pl={linha:r.linha,c:r.c};const novo=JSON.stringify(n.planilha)!==JSON.stringify(pl);if(novo){n.planilha=pl;mud++}
    if(!novo&&n.v159_aplicado===D.quando)return; n.v159_aplicado=D.quando;
    /* o STATUS da planilha manda: resultado e etapa seguem o que está escrito nela hoje */
    const stAntes=n.status_pipeline||(n.resultado==='sem_status'?'(em branco)':'');
    const st=nz(r.c[ST]);const RES={fechado:'fechada',perdido:'perdida',futuro:'futuro'};const ETP={'proposta enviada':'enviada','desenvolver proposta':'desenvolver','revisao de proposta':'revisao','proposta desenvolvida':'desenvolvida','aguardando apresentacao':'aguardando'};
    let res,etp;if(!st){res='sem_status';etp=SEM}else if(RES[st]){res=RES[st];etp=n.etapa===SEM?'desenvolver':n.etapa}else if(ETP[st]){res=null;etp=ETP[st]}else{res=n.resultado;etp=n.etapa}
    if((n.resultado||null)!==(res||null)){n.resultado=res;mud++}if(n.etapa!==etp){n.etapa=etp;mud++}
    if(r.c[ST]&&n.status_pipeline!==r.c[ST]){n.status_pipeline=r.c[ST];mud++}
    if(r.c[ST]&&stAntes&&nz(stAntes)!==st&&n.v159_criada!==D.quando)mudSt.push({n,de:stAntes,para:r.c[ST],linha:r.linha});
    if(r.c[CONS]&&n.consultor!==r.c[CONS]){n.consultor=r.c[CONS];mud++}
    if(r.c[TIPO]&&n.tipo_pipeline!==r.c[TIPO]){n.tipo_pipeline=r.c[TIPO];mud++}
    if(r.c[8]&&n.gestao!==r.c[8]){n.gestao=r.c[8];mud++}
    [[11,'data_envio'],[12,'data_upgrade'],[13,'data_decisao'],[15,'previsao_obra']].forEach(([i,k])=>{const v=iso(r.c[i]);if(v&&n[k]!==v){n[k]=v;mud++}});
    if(r.c[14]&&n.motivo_perda!==r.c[14]){n.motivo_perda=r.c[14];mud++}
    const ch=r.c[0]===''?null:+String(r.c[0]).replace(',','.');if(r.c[0]!==''&&!isNaN(ch)&&n.chance!==ch){n.chance=ch;mud++}});
  /* 19/11 (Bruno): mudança de STATUS na planilha também vira uma linha no Histórico do cliente */
  mud+=T(()=>historicoStatus(db,mudSt),0);
  /* 19/11 (Bruno): negociação que saiu da planilha e ele disse o que fazer (D.saiu) */
  mud+=T(()=>saiuDaPlanilha(db,usados),0);
  N.forEach(n=>{if(n.planilha&&!usados.has(n.id)){delete n.planilha;mud++}});
  let fora=L.filter(n=>!usados.has(n.id)&&!n.v159_saiu).map(n=>n.id);
  /* linhas que a nossa importação de 02/11 quebrou (o STATUS caiu na coluna CLIENTE): não são negociações — saem da Base */
  const lixo=L.filter(n=>!usados.has(n.id)&&/^(fechado|perdido|futuro)$/.test(nz(n.cliente_nome)));
  if(lixo.length){const ids=new Set(lixo.map(n=>n.id));db.negociacoes=db.negociacoes.filter(n=>!ids.has(n.id));db._v159_removidas=(db._v159_removidas||[]).concat(lixo.map(n=>({id:n.id,cliente_nome:n.cliente_nome,quando:D.quando,motivo:'linha quebrada da importação de 02/11 (STATUS na coluna CLIENTE)'})));mud+=lixo.length;fora=fora.filter(id=>!ids.has(id))}
  db._v159={quando:D.quando,linhas:D.rows.length,ligadas:usados.size,sem_negociacao:falta,fora_da_planilha:fora};
  return mud}

/* ---------- §1b (19/11) negociações novas, status no histórico, as que saíram ---------- */
const p2=x=>String(x).padStart(2,'0');
const agora=()=>{const d=new Date;return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'T'+p2(d.getHours())+':'+p2(d.getMinutes())};
const hs=s=>{let x=2166136261;for(const ch of String(s)){x^=ch.codePointAt(0);x=Math.imul(x,16777619)>>>0}return x.toString(36)};
const brD=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:''};
function H(db){if(!Array.isArray(db.historico_cliente))db.historico_cliente=[];return db.historico_cliente}
function criaNovas(db,iso){const NV=D.novas||{};let n0=0;db.negociacoes=db.negociacoes||[];db.clientes=db.clientes||[];
  Object.keys(NV).forEach(l=>{const s=NV[l];const r=D.rows.find(x=>String(x.linha)===String(l));if(!r||!s.id)return;
    if(db.negociacoes.some(n=>n.id===s.id))return;
    if((db._v159_apagadas||[]).includes(s.id))return; /* apagada na Base de propósito: não volta */
    let cid=s.cliente_id&&db.clientes.some(c=>c.id===s.cliente_id)?s.cliente_id:null;
    if(!cid){cid='c_'+s.id;if(!db.clientes.some(c=>c.id===cid))db.clientes.push({id:cid,nome:r.c[CLI],sigla:s.codinome||'',aliases:[],arquiteto:s.arquitetura?s.arquitetura.nome:'',origem:'Pipeline (planilha To Do Comercial, '+brD(D.quando)+')'})}
    const cli=db.clientes.find(c=>c.id===cid);const f=x=>x?x.nome:'';const pid=x=>x?x.id:'';
    db.negociacoes.push({id:s.id,codinome:s.codinome||'',cliente_nome:r.c[CLI],cliente_id:cid,frente:s.frente||'taag',consultor:r.c[CONS]||s.consultor||'',
      tipo_pipeline:r.c[TIPO]||s.tipo||'',status_pipeline:'',etapa:'desenvolver',resultado:null,chance:null,valor:0,
      criado:iso(r.c[1])||D.quando,movido:D.quando,data_upgrade:iso(r.c[12]),data_envio:iso(r.c[11]),data_decisao:'',motivo_perda:'',previsao_obra:'',gestao:'',
      fontes:{indicador:f(s.indicador),arquitetura:f(s.arquitetura),gerenciadora:f(s.gerenciadora)},
      parceiros:{indicador:pid(s.indicador),arquitetura:pid(s.arquitetura),gerenciadora:pid(s.gerenciadora)},
      cadeia:{arquiteto:f(s.arquitetura),escritorio:f(s.arquitetura),gerenciadora:f(s.gerenciadora)},
      proposta_ids:[],proxima:{acao:'Acompanhar com o consultor',data:'',resultado_anterior:''},
      timeline:[{data:D.quando,o:'Negociação nova na planilha To Do Comercial (linha '+l+'), lida em '+brD(D.quando)+(cli&&cli.id===s.cliente_id?' · cliente que já estava na Base: '+cli.nome:' · cliente novo na Base')+(s.nota_regra?' · '+s.nota_regra:'')}],
      origem:'Pipeline (planilha To Do Comercial, '+brD(D.quando)+')',v159_criada:D.quando});n0++});
  return n0}
function etq(n){return[n.tipo_pipeline,n.status_pipeline||n.resultado||'em aberto'].filter(Boolean).join(' · ')}
function cliK(n){return n.cliente_id?String(n.cliente_id):'nm:'+nz(n.cliente_nome)}
function historicoStatus(db,xs){if(!xs.length)return 0;const h=H(db);const ja=new Set(h.map(e=>e.id));let k=0;
  xs.forEach(({n,de,para,linha})=>{const id='HC-st-'+n.id+'-'+hs(D.quando+'|'+nz(de)+'>'+nz(para));if(ja.has(id))return;
    const txt='Status na planilha: '+de+' → '+para;
    h.push({id,nome:(n.cliente_nome||'')+' · '+txt.slice(0,50),cli:cliK(n),cliente_nome:n.cliente_nome||'',neg_id:n.id,neg_etq:etq(n),texto:txt,quando:D.quando,
      quem:(n.consultor||'')+'',origem:'planilha',tipo:'status',nota_origem:'To Do Comercial › Pipeline, linha '+linha+' · status mudou na leitura de '+brD(D.quando),criado:agora()});
    (n.timeline=n.timeline||[]).push({data:D.quando,o:txt+' (leitura de '+brD(D.quando)+')'});ja.add(id);k++});
  return k}
function saiuDaPlanilha(db,usados){let k=0;const h=H(db);
  (D.saiu||[]).forEach(s=>{const n=(db.negociacoes||[]).find(x=>x.id===s.id);if(!n||usados.has(n.id)||n.v159_saiu===D.quando)return;
    const de=n.status_pipeline||'';n.v159_saiu=D.quando;
    if(s.acao==='perdido'){n.resultado='perdida';n.status_pipeline='PERDIDO';if(!n.motivo_perda)n.motivo_perda='Saiu da planilha To Do Comercial ('+brD(D.quando)+')';if(!n.data_decisao)n.data_decisao=D.quando}
    const txt='Saiu da planilha To Do Comercial em '+brD(D.quando)+(s.acao==='perdido'?' — marcada como Perdido'+(de?' (era '+de+')':''):'');
    const id='HC-saiu-'+n.id+'-'+hs(D.quando);
    if(!h.some(e=>e.id===id))h.push({id,nome:(n.cliente_nome||'')+' · '+txt.slice(0,50),cli:cliK(n),cliente_nome:n.cliente_nome||'',neg_id:n.id,neg_etq:etq(n),texto:txt,quando:D.quando,
      quem:(n.consultor||'')+'',origem:'planilha',tipo:'status',nota_origem:s.regra||'',criado:agora()});
    (n.timeline=n.timeline||[]).push({data:D.quando,o:txt});k++});
  return k}
const mud=T(liga,0);

/* ---------- §2 KPI conta os sem status ---------- */
if(typeof window.KPI==='function'&&!KPI.__v159){const _k=window.KPI;window.KPI=function(fn){const o=_k.apply(this,arguments);
  try{const N=fn?S.db.negociacoes.filter(fn):S.db.negociacoes;o.sem_status=N.filter(n=>n.resultado==='sem_status').length}catch(e){}return o};KPI.__v159=true}

/* ---------- §3 a vista "Como na planilha" ---------- */
const UI=window.V159=window.V159||{};UI.f=UI.f||{};
const linhas=()=>(S.db.negociacoes||[]).filter(n=>n.planilha).sort((a,b)=>a.planilha.linha-b.planilha.linha);
const stKey=n=>nz(n.planilha.c[ST])||'_vazio';
function rotulos(xs,i){const m={};xs.forEach(n=>{const v=n.planilha.c[i];const k=nz(v)||'_vazio';(m[k]=m[k]||{k,n:0,sp:{}});m[k].n++;m[k].sp[v]=(m[k].sp[v]||0)+1});
  return Object.values(m).map(g=>({k:g.k,n:g.n,lb:g.k==='_vazio'?'(em branco)':Object.entries(g.sp).sort((a,b)=>b[1]-a[1])[0][0]})).sort((a,b)=>b.n-a.n)}
UI.set=(k,v)=>{UI.f[k]=UI.f[k]===v?'':v;T(()=>renderMain())};
UI.q=v=>{UI.f.q=v;clearTimeout(UI._t);UI._t=setTimeout(()=>{const el=document.getElementById('v159-tb');if(el){el.innerHTML=corpo();const c=document.getElementById('v159-n');if(c)c.textContent=UI._n}},180)};
UI.limpar=()=>{UI.f={};T(()=>renderMain())};
UI.abrir=id=>{S.deal=id;S.pipeTab='quadro';T(()=>renderMain())};
function filtradas(){const f=UI.f;const q=nz(f.q);return linhas().filter(n=>(!f.st||stKey(n)===f.st)&&(!f.cons||nz(n.planilha.c[CONS])===f.cons)&&(!f.tipo||nz(n.planilha.c[TIPO])===f.tipo)&&(!f.grupo||(f.grupo==='abertas'?ABERTOS.includes(stKey(n)):true))&&(!q||nz(n.planilha.c.join(' ')).includes(q)))}
function corpo(){const xs=filtradas();UI._n=N0(xs.length)+' de '+N0(linhas().length)+' linhas';
  return xs.map(n=>{const c=n.planilha.c;return `<tr onclick="V159.abrir('${J(n.id)}')" title="Abrir a negociação">`+
    `<td class="v159-ln">${n.planilha.linha}</td>`+c.map((v,i)=>`<td class="${i===0&&v?'v159-ch':''}${i===ST&&!v?' v159-vz':''}">${i===ST&&!v?'(em branco)':E(v)}</td>`).join('')+'</tr>'}).join('')||`<tr><td colspan="18" class="sub" style="padding:16px">Nenhuma linha com este filtro.</td></tr>`}
function vista(){const all=linhas();const f=UI.f;const G=D.rows.length;const st=rotulos(all,ST);
  const ab=all.filter(n=>ABERTOS.includes(stKey(n))).length,vz=all.filter(n=>stKey(n)==='_vazio').length;
  const chip=(k,v,lb,n,on)=>`<span role="button" class="v159-chip${on?' on':''}" onclick="V159.set('${k}','${J(v)}')"><b>${N0(n)}</b> ${E(lb)}</span>`;
  const ponte=`${N0(all.length)} linhas = `+st.map(g=>`<u role="button" onclick="V159.set('st','${J(g.k)}')">${N0(g.n)} ${E(g.lb)}</u>`).join(' + ')+
    ` · abertas: <u role="button" onclick="V159.set('grupo','abertas')">${N0(ab)}</u> = `+st.filter(g=>ABERTOS.includes(g.k)).map(g=>`${N0(g.n)} ${E(g.lb.toLowerCase())}`).join(' + ')+
    (vz?` · <u role="button" onclick="V159.set('st','_vazio')">${N0(vz)} sem status</u> (STATUS em branco na planilha — não contam como abertas)`:'');
  const sel=(k,i,lb)=>`<select class="form-select form-select-sm" style="width:auto" onchange="V159.set('${k}',this.value)"><option value="">${lb}: todos</option>${rotulos(all,i).map(g=>`<option value="${E(g.k)}"${f[k]===g.k?' selected':''}>${E(g.lb)} (${N0(g.n)})</option>`).join('')}</select>`;
  const B=S.db._v159||{};const aviso=(B.sem_negociacao||[]).length||(B.fora_da_planilha||[]).length?`<div class="note"><span class="bad">${N0((B.sem_negociacao||[]).length)} linha(s) da planilha sem negociação na Base${(B.sem_negociacao||[]).length?' (linhas '+B.sem_negociacao.join(', ')+')':''} · ${N0((B.fora_da_planilha||[]).length)} negociação(ões) da Base que não estão mais na planilha</span></div>`:'';
  return `<div class="card p-3 mb-2 v159">
    <div class="d-flex flex-wrap justify-content-between gap-2 align-items-baseline"><div><b>Como na planilha</b> <span class="sub">· ${E(D.fonte)} · ${N0(G)} linhas com cliente</span></div><span class="sub" id="v159-n">${UI._n||''}</span></div>
    <div class="v159-chips">${st.map(g=>chip('st',g.k,g.lb,g.n,f.st===g.k)).join('')}</div>
    <div class="v159-ponte">${ponte}</div>${aviso}
    <div class="d-flex flex-wrap gap-2 my-2">${sel('cons',CONS,'Consultor')}${sel('tipo',TIPO,'Tipo')}<input class="form-control form-control-sm" style="max-width:280px" placeholder="Buscar em todas as colunas…" value="${E(f.q||'')}" oninput="V159.q(this.value)">${Object.values(f).some(Boolean)?'<button class="btn-soft" onclick="V159.limpar()">Limpar filtros</button>':''}</div>
    <div class="v159-wrap"><table class="v159-t"><thead><tr><th>Linha</th>${D.cab.map(h=>`<th>${E(h)}</th>`).join('')}</tr></thead><tbody id="v159-tb">${corpo()}</tbody></table></div></div>`}
function css(){if(document.getElementById('v159-css'))return;const s=document.createElement('style');s.id='v159-css';s.textContent=`
.v159-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 6px}.v159-chip{background:var(--bs-tertiary-bg,#f1f3f5);border-radius:999px;padding:4px 10px;font-size:12.5px;cursor:pointer}.v159-chip.on{background:#0d6efd;color:#fff}
.v159-ponte{font-size:12.5px;line-height:1.7}.v159-ponte u{cursor:pointer;text-decoration-style:dotted}
.v159-wrap{overflow:auto;max-height:70vh;border:1px solid rgba(0,0,0,.12);border-radius:8px}
.v159-t{border-collapse:collapse;font-size:12px;min-width:2200px;width:100%}.v159-t th{position:sticky;top:0;background:#b7b7b7;color:#111;font-weight:700;text-align:center;padding:8px 6px;border:1px solid #999;z-index:1}
.v159-t td{border:1px solid rgba(0,0,0,.12);padding:6px;text-align:center;vertical-align:middle;max-width:260px}.v159-t tbody tr{cursor:pointer}.v159-t tbody tr:hover td{background:rgba(13,110,253,.06)}
.v159-t td.v159-ln{background:#f1f3f5;color:#666;font-variant-numeric:tabular-nums}.v159-t td.v159-ch{background:#2f6fd1;color:#fff;font-weight:600}.v159-t td.v159-vz{color:#b02a37;font-style:italic}`;document.head.appendChild(s)}

const COL_LB='STATUS VAZIO';
function colunaVazia(){const f=S.comF||{};const xs=(S.db.negociacoes||[]).filter(n=>n.resultado==='sem_status'&&(!f.frente||n.frente===f.frente)&&(!f.cons||T(()=>negCons(n).includes(f.cons),true)));
  const card=n=>{let h=T(()=>dealCard(n),'');const ln=n.planilha?'linha '+n.planilha.linha+' da planilha':'';
    return h.replace(/<\/div>\s*$/,`<div class="sub" style="font-size:11px;color:#b02a37;margin-top:4px">⚠ STATUS em branco${ln?' · '+ln:''} — defina a etapa</div></div>`)};
  return `<div style="min-width:230px;flex:1"><div class="card p-2 mb-2 d-flex flex-row justify-content-between" style="border:1px dashed #b02a37"><b style="font-size:11px;letter-spacing:.06em;color:#b02a37">${COL_LB}</b><span class="sub">${xs.length}</span></div>${xs.map(card).join('')||'<div class="sub text-center py-3" style="font-size:12px">—</div>'}</div>`}
function depoisDaColuna(h,rot){const k=h.indexOf('>'+rot+'</b>');if(k<0)return -1;const ini=h.lastIndexOf('<div style="min-width:230px;flex:1">',k);if(ini<0)return -1;
  const re=/<div\b|<\/div>/g;re.lastIndex=ini;let d=0,m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(d===0)return m.index+6}return -1}
function ligaTela(){if(typeof SCREENS!=='object'||typeof SCREENS.pipeline!=='function'||SCREENS.pipeline.__v159)return false;const _p=SCREENS.pipeline;
  /* 05/11 (Bruno): a tela fica com o desenho de antes — só os dados vêm certos da planilha; a ponte do quadro conta os sem status;
     e a última coluna do quadro, depois de "Revisão de proposta", é STATUS VAZIO: as negociações sem status ficam à vista, para alguém resolver */
  SCREENS.pipeline=function(){let h=_p.apply(this,arguments);if(typeof h!=='string')return h;
    h=h.replace(/(\+ <span style="color:#0d6efd">(\d+) em jogo<\/span>)(<\/span>)/,(m,a,b,c)=>{const f=S.comF||{};const k=T(()=>KPI(n=>(!f.frente||n.frente===f.frente)&&(!f.cons||negCons(n).includes(f.cons))),{});return a+(k.sem_status?` + <span style="color:#b02a37">${k.sem_status} status vazio</span>`:'')+c});
    const ix=depoisDaColuna(h,'REVISÃO DE PROPOSTA');if(ix>0)h=h.slice(0,ix)+colunaVazia()+h.slice(ix);return h.replace(/>NaNd</g,'>—<')};
  SCREENS.pipeline.__v159=true;
  /* card sem data de criação mostrava "NaNd" — sem data, mostra "—" */
  T(()=>{if(typeof dealCard==='function'&&!dealCard.__v159){const dc=dealCard;dealCard=function(n){return String(dc.apply(this,arguments)).replace(/>NaNd</g,'>—<')};dealCard.__v159=true}});
  /* tirar da coluna: escolher uma etapa (ou fechar/perder) na negociação resolve o "sem status" */
  T(()=>{if(A&&A.moverEtapa&&!A.moverEtapa.__v159){const mv=A.moverEtapa;A.moverEtapa=function(id,etapa){const n=get('negociacoes',id);if(n&&n.resultado==='sem_status')n.resultado=null;return mv.apply(this,arguments)};A.moverEtapa.__v159=true}});
  return true}
if(!ligaTela()){let n=0;const iv=setInterval(()=>{if(ligaTela()||++n>40)clearInterval(iv)},250)}

/* 19/11: save_ não existe mais no escopo global — sem gravar, a leitura nova ficava só na memória e sumia */
if(mud){T(()=>{if(typeof save_==='function')save_();else save()})}
/* 19/11: a nuvem (v172) aplica a cópia dela POR CIMA da local ao abrir — o que a leitura fez antes disso some.
   Por isso a leitura roda de novo depois da primeira leitura da nuvem, grava (sobe para a nuvem) e então o Histórico (v162) importa os textos novos. */
function quandoPronto(fn){if(window.__TREINO||!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url){setTimeout(fn,1500);return}
  if(window.__v172pronto){setTimeout(fn,300);return}window.addEventListener('v172-pronta',()=>setTimeout(fn,300),{once:true})}
quandoPronto(()=>{const m=T(liga,0);if(m)T(()=>save());T(()=>{if(window.V162&&typeof V162.reimporta==='function')V162.reimporta()});
  T(()=>{if(typeof route==='function'&&route().k==='pipeline')renderMain()})});
T(()=>{if(typeof route==='function'&&route().k==='pipeline')renderMain()});
})();
