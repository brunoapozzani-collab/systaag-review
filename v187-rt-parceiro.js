/* =====================================================================================================
   v187 · TIPO DE PARCERIA → RT, e CLASSIFICAÇÃO AUTOMÁTICA DO PARCEIRO (Bruno, 13/11/2026)
   Pedido do gerente de Relacionamento (áudio de 13/11) + anotação "Critério de classificação":
   1 · No cadastro do parceiro, o campo "Tipo de parceria" define a RT — três casos:
         Só trabalha com a TAAG (vende, indica e só oferece a TAAG) ............................ 15%
         Indica a TAAG e outros (não trabalha ativamente para fechar com a TAAG) ............... 10%
         Só pediu proposta para ter 3 orçamentos (o cliente costuma fechar com outra empresa) ...  5%
       Os % moram na Base (Base › Parceiros › "Tipo de parceria e classificação"). O RT % do parceiro deixa de ser digitado:
       é sempre o do tipo. "Exclusivo com a TAAG" (Sim/Não) continua existindo e segue o tipo.
   2 · A proposta busca a RT do cadastro do parceiro (decisões do Bruno, 13/11):
         · travada no parceiro — na proposta ninguém muda o %; para mudar, muda o tipo no parceiro;
         · cada parceiro da proposta (indicador, gerenciadora, arquitetura…) recebe o % do SEU tipo; a RT da proposta é a soma;
         · vale só para propostas novas / em rascunho / em pré-vendas — enviadas e vendidas ficam com a RT que já têm;
         · parceiro sem tipo → a proposta não pode ser enviada até alguém definir o tipo no cadastro.
   3 · A Classificação (Platinum / Ouro / Prata / Bronze) passa a ser CALCULADA pelos 5 critérios da anotação, sem escolha manual:
         entrada de projeto ............ oportunidades da Pipeline em que o parceiro aparece (indicador, arquitetura, gerenciadora)
         fechamento de projeto ......... dessas, quantas estão FECHADO
         valor total fechado ........... soma do valor dos negócios FECHADO
         fidelidade .................... fechados ÷ (fechados + perdidos) — de quem traz, quanto fecha com a TAAG
         participação no projeto ....... interações registradas com o parceiro (anotações e ajustes de base não contam)
       Cada critério vira 0–100 pontos pela posição do parceiro entre os que já trouxeram projeto; a nota é a média dos 5.
       Faixas (editáveis na Base): Platinum ≥ 75 · Ouro ≥ 50 · Prata ≥ 25 · Bronze abaixo (e quem ainda não trouxe projeto).
   A mesma ligação do CRM (parceiros, Pipeline, De/Para, interações) que o CRM usa para "Oportunidades" é a usada aqui.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v187)return;window.__v187=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{return f()}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nBR=(n,d)=>(+n||0).toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
const R$=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const Err=m=>{try{return new RuleError(m)}catch(e){return new Error(m)}};

/* ───────────── 1 · tipos e regras (Base) ───────────── */
const TIPOS=[
  ['exclusivo','Só trabalha com a TAAG','Vende, indica e só oferece a TAAG'],
  ['indica','Indica a TAAG e outros','Indica a TAAG, mas também indica outros e não trabalha ativamente para fechar com a TAAG'],
  ['cotacao','Só pediu proposta (3 orçamentos)','Pediu a proposta só para apresentar 3 orçamentos — o cliente costuma fechar com outra empresa']];
const DEF_PCT={exclusivo:15,indica:10,cotacao:5};
const DEF_FX={platinum:75,ouro:50,prata:25};
function regras(){const r=S.db.regras=S.db.regras&&typeof S.db.regras==='object'?S.db.regras:{};
  if(!r.rt_tipos||typeof r.rt_tipos!=='object')r.rt_tipos=Object.assign({},DEF_PCT);
  if(!r.classif_faixas||typeof r.classif_faixas!=='object')r.classif_faixas=Object.assign({},DEF_FX);return r}
const pctDe=t=>{const v=regras().rt_tipos[t];return v==null||v===''?DEF_PCT[t]:+v};
const tipoDe=p=>p&&TIPOS.some(x=>x[0]===p.rt_tipo)?p.rt_tipo:'';
const nomeTipo=t=>(TIPOS.find(x=>x[0]===t)||[])[1]||'';
const parcById=id=>(S.db.parceiros||[]).find(p=>p.id===id);
const parcByCrm=cid=>cid==null||cid===''?null:(S.db.parceiros||[]).find(p=>p.crm_id!=null&&+p.crm_id===+cid);

/* o parceiro com tipo tem sempre o % do tipo (e "exclusivo" segue o tipo) */
function amarra(p){const t=tipoDe(p);if(!t)return false;let ch=false;const v=pctDe(t);
  if(+p.rt_pct!==v||p.rt_pct===null){p.rt_pct=v;ch=true}
  if(!!p.exclusivo!==(t==='exclusivo')){p.exclusivo=(t==='exclusivo');ch=true}
  if(p.rt_pendente){delete p.rt_pendente;ch=true}return ch}
function amarraTodos(){let n=0;(S.db.parceiros||[]).forEach(p=>{if(amarra(p))n++});return n}

function setTipo(pid,t){const p=parcById(pid)||parcByCrm(pid);if(!p)throw Err('Parceiro não encontrado.');
  if(t&&!TIPOS.some(x=>x[0]===t))throw Err('Tipo de parceria inválido.');
  const de=tipoDe(p);if(de===t)return;p.rt_tipo=t||'';
  if(t)amarra(p);
  T(()=>carimbo(p,'rt_tipo'));T(()=>log('parceiros',p.id,'tipo de parceria (RT)',de||'—',t?nomeTipo(t)+' · '+pctDe(t)+'%':'—'));
  sincronizaRascunhos();invalida();T(()=>save())}

/* ───────────── 2 · a proposta busca a RT do parceiro ───────────── */
const RASCUNHO=['rascunho','em_prevendas'];
const negDe=p=>(S.db.negociacoes||[]).find(n=>(n.proposta_ids||[]).includes(p.id));
const decidido=n=>!!n&&(['fechada','perdida','ganha'].includes(String(n.resultado||''))||/FECHADO|PERDIDO/i.test(String(n.status_pipeline||'')));
/* negócio "novo": nenhuma proposta dele passou do rascunho / pré-vendas e ele ainda não foi decidido */
function negTravado(n){if(!n||decidido(n))return false;const ps=(n.proposta_ids||[]).map(id=>T(()=>get('propostas',id),null)).filter(Boolean);
  return ps.every(p=>RASCUNHO.includes(p.estado))}
function propTravada(p){if(!p||!RASCUNHO.includes(p.estado))return false;const n=negDe(p);return n?negTravado(n):true}
function listaDe(p){return T(()=>window.RTF2.lista(p),null)||((negDe(p)||{}).rt_rec)||p.rt_rec||[]}
function semTipoNa(p){return listaDe(p).map(x=>parcById(x.pid)).filter(pa=>pa&&!tipoDe(pa))}

/* aplica o % do tipo em cada recebedor dos negócios / propostas ainda em rascunho */
function sincronizaRascunhos(){let n=0;
  const fix=lista=>{let ch=false;(lista||[]).forEach(x=>{const pa=parcById(x.pid);const t=tipoDe(pa);if(t&&+x.pct!==pctDe(t)){x.pct=pctDe(t);ch=true}});return ch};
  (S.db.negociacoes||[]).forEach(ng=>{if((ng.rt_rec||[]).length&&negTravado(ng)&&fix(ng.rt_rec)){ng.rt_negociado=ng.rt_rec.reduce((a,x)=>a+(+x.pct||0),0);n++}});
  (S.db.propostas||[]).forEach(p=>{if((p.rt_rec||[]).length&&RASCUNHO.includes(p.estado)&&!negDe(p)&&fix(p.rt_rec))n++});
  return n}

const travadoMsg=pa=>{const t=tipoDe(pa);return t?`A RT de ${pa.nome} vem do cadastro dele: ${nomeTipo(t)} = ${pctDe(t)}%. Para mudar, mude o "Tipo de parceria" no parceiro (CRM › Parceiros › Editar ou Base › Parceiros).`
  :`${pa?pa.nome:'Este parceiro'} ainda não tem "Tipo de parceria" no cadastro — defina o tipo no parceiro (CRM › Parceiros › Editar ou Base › Parceiros) e a RT vem sozinha.`};
const bloqueioEnvio=p=>{const f=semTipoNa(p);if(!f.length)return '';
  return `Não dá para enviar a proposta ${p.numero||''}: ${f.map(x=>x.nome).join(', ')} ${f.length>1?'não têm':'não tem'} o "Tipo de parceria" no cadastro, e é ele que define a RT. Defina em CRM › Parceiros › Editar (ou Base › Parceiros).`};

function ligaAcoes(){if(typeof A!=='object')return false;let ok=true;
  const w=(k,fn)=>{if(typeof A[k]!=='function'){ok=false;return}if(A[k].__v187)return;const f=A[k];A[k]=fn(f);A[k].__v187=true};
  w('rtRecAdd',f=>function(nid,pid,pct){const ng=T(()=>get('negociacoes',nid),null);const pa=parcById(pid);
    if(ng&&negTravado(ng)&&pa){const t=tipoDe(pa);return f.call(this,nid,pid,t?pctDe(t):0)}return f.apply(this,arguments)});
  w('rtRecPct',f=>function(nid,pid,pct){const ng=T(()=>get('negociacoes',nid),null);
    if(ng&&negTravado(ng))throw Err(travadoMsg(parcById(pid)));return f.apply(this,arguments)});
  w('enviarPrevendas',f=>function(pr){const p=T(()=>get('propostas',pr),null);if(p&&propTravada(p)){sincronizaRascunhos();const m=bloqueioEnvio(p);if(m)throw Err(m)}return f.apply(this,arguments)});
  w('validar',f=>function(pr){const p=T(()=>get('propostas',pr),null);if(p&&propTravada(p)){sincronizaRascunhos();const m=bloqueioEnvio(p);if(m)throw Err(m)}return f.apply(this,arguments)});
  w('setIndicador',f=>function(id,k,v){if(k==='rt_pct')throw Err(travadoMsg(parcById(id)));return f.apply(this,arguments)});
  if(window.RTF2&&!window.RTF2.__v187){const R=window.RTF2;const _p=R.pct,_a=R.add;
    R.pct=function(pr,pid,v){const p=T(()=>get('propostas',pr),null);if(p&&propTravada(p))throw Err(travadoMsg(parcById(pid)));return _p.apply(this,arguments)};
    R.add=function(pr,pid){const r=_a.apply(this,arguments);if(sincronizaRascunhos())T(()=>save());return r};
    R.__v187=true}else if(!window.RTF2)ok=false;
  return ok}

/* ───────────── 3 · classificação pelos 5 critérios ───────────── */
const CRITERIOS=[
  ['entradas','Entrada de projeto','oportunidades da Pipeline em que o parceiro aparece (indicador, arquitetura ou gerenciadora)'],
  ['fechados','Fechamento de projeto','dessas oportunidades, quantas estão FECHADO'],
  ['valor','Valor total fechado','soma do valor dos negócios FECHADO'],
  ['fidelidade','Fidelidade','fechados ÷ (fechados + perdidos): de quem traz, quanto fecha com a TAAG'],
  ['participacao','Participação no projeto c/ cliente','interações registradas com o parceiro no CRM (reuniões, visitas, ligações…; anotações e ajustes de base não contam)']];
const normCRM=s=>String(s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim();
let MEMO=null,MEMO_T=0;const invalida=()=>{MEMO=null};
function negValor(ng){if(!ng)return 0;/* o mesmo valor que o Pipeline mostra nas fechadas (venda METAS do cliente) */const vf=T(()=>+window.V161D.valorFechada(ng),0);if(vf>0)return vf;const c=T(()=>window.V130API.com(),null);if(c&&typeof c.negV==='function'){const v=T(()=>+c.negV(ng),0);if(v>0)return v}
  if(+ng.valor>0)return +ng.valor;return (ng.proposta_ids||[]).map(id=>T(()=>get('propostas',id),null)).filter(Boolean).reduce((a,p)=>a+(T(()=>+M.total(p),0)||0),0)}
function calcula(){
  if(MEMO&&Date.now()-MEMO_T<20000)return MEMO;
  const tb=T(()=>JSON.parse(CRM_SERVER.api(JSON.stringify({action:'loadAll'}))).tables,null);if(!tb)return null;
  const PAR=tb.parceiros||[],PIPE=tb.pipeline||[],DEP=tb.depara||[],INT=tb.interacoes||[];
  /* o mesmo De/Para do CRM (pidMap / indId / arqId / gerId) */
  const m=new Map();PAR.forEach(p=>{const k=normCRM(p.nome);if(k&&!m.has(k))m.set(k,+p.id)});
  DEP.forEach(d=>{const k=normCRM(d.nome_pipeline);if(!k)return;const pap=String(d.papel||'').toLowerCase();m.set(pap?k+'|'+pap:k,d.parceiro_id!==''&&d.parceiro_id!=null?+d.parceiro_id:'')});
  const pidFor=(nome,papel,strict)=>{const n=normCRM(nome);if(!n)return '';if(papel&&m.has(n+'|'+papel))return m.get(n+'|'+papel);if(strict)return '';return m.has(n)?m.get(n):''};
  const ids=new Set(PAR.map(p=>+p.id));const valido=id=>{const n=+id;return n&&ids.has(n)?n:''};
  const quem=o=>{const s=new Set();[valido(o.parceiro_id)||pidFor(o.indicador,'indicador'),pidFor(o.arquitetura,'arquitetura'),pidFor(o.gerenciadora,'gerenciadora')||pidFor(o.indicador,'gerenciadora',true)||pidFor(o.arquitetura,'gerenciadora',true)].forEach(x=>{if(x)s.add(+x)});return s};
  const NEG=new Map((S.db.negociacoes||[]).map(n=>[n.id,n]));
  const D=new Map();const d=id=>{if(!D.has(id))D.set(id,{entradas:0,fechados:0,perdidos:0,valor:0,participacao:0,opps:[]});return D.get(id)};
  PIPE.forEach(o=>{const st=String(o.status||'').toUpperCase();const fe=/FECHADO/.test(st),pe=/PERDIDO/.test(st);const v=fe?negValor(NEG.get(o.neg_id)):0;
    quem(o).forEach(id=>{const x=d(id);x.entradas++;if(fe){x.fechados++;x.valor+=v}if(pe)x.perdidos++;x.opps.push({cliente:o.cliente||'',status:o.status||'',data:o.data_indicacao||'',valor:v,neg:o.neg_id||''})})});
  INT.forEach(i=>{if(i.origem==='ajuste'||i.origem==='anotacao'||i.tipo_contato==='ANOTAÇÃO'||i.tipo_contato==='AJUSTE DE BASE')return;const id=+i.parceiro_id;if(id)d(id).participacao++});
  D.forEach(x=>{x.fidelidade=(x.fechados+x.perdidos)?x.fechados/(x.fechados+x.perdidos):0});
  /* pontos 0–100 por critério: posição entre quem já trouxe projeto (empates dividem a posição) */
  const base=[...D.entries()].filter(([,x])=>x.entradas>0);const N=base.length;
  CRITERIOS.forEach(([k])=>{const vals=base.map(([,x])=>x[k]).sort((a,b)=>a-b);
    base.forEach(([,x])=>{const v=x[k];if(!(v>0)){(x.pts=x.pts||{})[k]=0;return}let lo=0,eq=0;vals.forEach(y=>{if(y<v)lo++;else if(y===v)eq++});
      (x.pts=x.pts||{})[k]=N>1?Math.round(100*(lo+(eq-1)/2)/(N-1)):100})});
  const fx=regras().classif_faixas;
  const classe=pts=>pts>=+fx.platinum?'Platinum':pts>=+fx.ouro?'Ouro':pts>=+fx.prata?'Prata':'Bronze';
  D.forEach(x=>{if(x.entradas>0){x.nota=Math.round(CRITERIOS.reduce((a,[k])=>a+(x.pts[k]||0),0)/CRITERIOS.length);x.classe=classe(x.nota)}else{x.nota=0;x.classe='Bronze';x.pts={};CRITERIOS.forEach(([k])=>x.pts[k]=0)}});
  MEMO={D,N,crm:PAR.map(p=>+p.id)};MEMO_T=Date.now();return MEMO}
function dadoDe(crmId){const c=calcula();if(!c)return null;return c.D.get(+crmId)||{entradas:0,fechados:0,perdidos:0,valor:0,participacao:0,fidelidade:0,opps:[],nota:0,classe:'Bronze',pts:{entradas:0,fechados:0,valor:0,fidelidade:0,participacao:0}}}
/* grava a classificação calculada no parceiro (só quando muda) */
function gravaClassificacao(){const c=calcula();if(!c)return 0;let n=0;
  (S.db.parceiros||[]).forEach(p=>{if(p.inativo||p.crm_id==null)return;const x=dadoDe(p.crm_id);if(!x)return;if(p.classificacao!==x.classe){p.classificacao=x.classe;n++}if(!p.classif_auto){p.classif_auto=true;n++}});
  return n}

/* ───────────── 4 · gravações: só depois de a nuvem ter sido lida (nunca sobe cópia velha) ───────────── */
let MIGROU=false;
function passo(){let n=0;
  if(!MIGROU){(S.db.parceiros||[]).forEach(p=>{if(!p.rt_tipo&&p.exclusivo===true){p.rt_tipo='exclusivo';n++}});MIGROU=true}
  n+=amarraTodos();n+=sincronizaRascunhos();invalida();n+=gravaClassificacao();
  if(n)T(()=>save());return n}
function quandoPronto(fn){if(window.__TREINO||!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url){setTimeout(fn,1500);return}
  if(window.__v172pronto){fn();return}window.addEventListener('v172-pronta',()=>setTimeout(fn,300),{once:true})}
quandoPronto(()=>{T(passo);setInterval(()=>T(passo),120000)});

/* ───────────── 5 · o servidor do CRM: tipo de parceria entra e sai; classificação é a calculada ───────────── */
function ligaCRM(){if(typeof CRM_SERVER!=='object'||typeof CRM_SERVER.api!=='function')return false;if(CRM_SERVER.api.__v187)return true;
  const f=CRM_SERVER.api;
  CRM_SERVER.api=function(payload){let req=null;try{req=JSON.parse(payload||'{}')}catch(e){}
    const out=f.apply(this,arguments);if(!req)return out;
    try{
      if(req.action==='loadAll'){const r=JSON.parse(out);if(r&&r.ok&&r.tables&&Array.isArray(r.tables.parceiros)){
          r.tables.parceiros.forEach(row=>{const p=parcByCrm(row.id);if(!p)return;row.rt_tipo=tipoDe(p);if(row.rt_tipo)row.rt=pctDe(row.rt_tipo)});return JSON.stringify(r)}}
      const mexe=(req.table==='parceiros'&&(req.action==='insert'||req.action==='update'))||(req.action==='batch'&&(req.ops||[]).some(o=>o.table==='parceiros'))||req.action==='renameValues';
      if(mexe){const r=JSON.parse(out);
        const pend=PEND&&Date.now()-PEND.quando<15000&&(req.action==='insert'?PEND.crm==null:+PEND.crm===+(req.row&&req.row.id))?PEND:null;if(pend)PEND=null;
        if(r&&r.ok&&req.row&&(req.row.rt_tipo!==undefined||pend)){if(req.row.rt_tipo===undefined)req.row.rt_tipo=pend.tipo;const p=parcByCrm(req.action==='insert'?r.id:(req.row.id||r.id));
          if(p){const t=TIPOS.some(x=>x[0]===req.row.rt_tipo)?req.row.rt_tipo:'';const de=tipoDe(p);p.rt_tipo=t;if(de!==t)T(()=>log('parceiros',p.id,'tipo de parceria (RT)',de||'—',t?nomeTipo(t)+' · '+pctDe(t)+'%':'—'))}}
        /* nada que o formulário mande desfaz o tipo nem a classificação calculada */
        amarraTodos();sincronizaRascunhos();invalida();const c=calcula();
        if(c)(S.db.parceiros||[]).forEach(p=>{if(p.crm_id==null||p.inativo)return;const x=c.D.get(+p.crm_id);const cl=x?x.classe:'Bronze';if(p.classif_auto&&p.classificacao!==cl)p.classificacao=cl});
        T(()=>save())}
    }catch(e){console.warn('v187 CRM api',e)}
    return out};
  CRM_SERVER.api.__v187=true;Object.keys(f).forEach(k=>{try{CRM_SERVER.api[k]=f[k]}catch(e){}});return true}

/* o próprio CRM (quadro): "RT %" + "Exclusivo?" viram "Tipo de parceria"; a classificação vira um selo com a nota.
   Mesmo jeito da v173: entra no quadro quando ele está de pé (e de novo se ele for recriado) e ajusta a tela depois de desenhada. */
function ajustaQuadro(d,w){
  /* formulário do parceiro */
  const rt=d.querySelector('#modal #f_rt');
  if(rt&&!d.querySelector('#modal #f_rttipo')){const bt=d.querySelector('#modal button[onclick^="salvarParceiro("]');const m=bt&&/salvarParceiro\((\d+|null)\)/.exec(bt.getAttribute('onclick')||'');
    const crmId=m&&m[1]!=='null'?+m[1]:null;const fRT=rt.closest('.field');const ex=d.querySelector('#modal #f_excl');const fEx=ex&&ex.closest('.field');
    if(fRT){const box=d.createElement('div');box.innerHTML=window.V187.formSel(crmId);
      fRT.innerHTML='';const lb=d.createElement('label');lb.innerHTML='Tipo de parceria (define a RT) <span class="req">*</span>';fRT.appendChild(lb);fRT.appendChild(box.firstElementChild);
      const hint=d.createElement('div');hint.className='hint';hint.textContent=window.V187.formDica();fRT.appendChild(hint);
      rt.type='hidden';rt.value=window.V187.rtVal(crmId);fRT.appendChild(rt);
      fRT.classList.add('span');if(fEx)fEx.style.display='none';
      const s=d.getElementById('f_rttipo');if(s&&ex)s.addEventListener('change',()=>{ex.value=s.value==='exclusivo'?'Sim':'Não'})}
    const cl=d.querySelector('#modal #f_classe');if(cl&&!cl.__v187){cl.__v187=true;cl.disabled=true;cl.title='Automática — calculada pelos 5 critérios';
      const h=cl.closest('.field')&&cl.closest('.field').querySelector('.hint');if(h)h.textContent='Automática: entrada de projeto, fechamento, valor fechado, fidelidade e participação'}}
  /* página do parceiro */
  const sc=d.querySelector('select[onchange^="mudarClassificacao("]');
  if(sc){const m=/mudarClassificacao\((\d+)/.exec(sc.getAttribute('onchange')||'');if(m){const id=+m[1];const x=dadoDe(id)||{classe:'Bronze',nota:0};
    const b=d.createElement('button');b.className='btn';b.title='Classificação automática — clique para ver os 5 critérios';
    b.innerHTML=`<span class="tag cl-${E(x.classe)}">${E(x.classe)}</span> <b>${x.nota}</b> <span class="muted small">pts</span>`;
    b.onclick=()=>window.V187.detalhe(id);sc.replaceWith(b)}}
  const ed=d.querySelector('button[onclick^="openParceiro("]');
  if(ed){const m=/openParceiro\((\d+)\)/.exec(ed.getAttribute('onclick')||'');if(m){d.querySelectorAll('dl.kv dt').forEach(dt=>{if(dt.textContent.trim()!=='RT')return;const dd=dt.nextElementSibling;if(!dd||dd.__v187)return;dd.__v187=true;dd.innerHTML=window.V187.rtHtml(+m[1])})}}}
function injetaQuadro(){const fr=document.getElementById('crmFrame');if(!fr)return;let d,w;try{d=fr.contentDocument;w=fr.contentWindow}catch(e){return}
  if(!d||!w||!d.body||w.__v187)return;if(typeof w.salvarParceiro!=='function'||typeof w.openParceiro!=='function')return;
  w.__v187=true;
  const sv=w.salvarParceiro;w.salvarParceiro=function(id){const s=d.getElementById('f_rttipo');
    if(s&&!s.value){try{w.invalid('f_rttipo','Escolha o tipo de parceria — é ele que define a RT')}catch(e){}return false}
    PEND={crm:id==null?null:+id,tipo:s?s.value:undefined,quando:Date.now()};return sv.apply(this,arguments)};
  let ag=false;const mo=new w.MutationObserver(()=>{if(ag)return;ag=true;w.requestAnimationFrame(()=>{ag=false;T(()=>ajustaQuadro(d,w))})});
  mo.observe(d.body,{childList:true,subtree:true});T(()=>ajustaQuadro(d,w))}
setInterval(injetaQuadro,700);
let PEND=null;

/* API que o CRM (dentro do quadro) chama */
const TAGCOR={exclusivo:'background:#e6f6ec;color:#116633',indica:'background:#e8f1ff;color:#0b4fa3',cotacao:'background:#fff4e5;color:#8a4b00'};
window.V187={
  tipos:()=>TIPOS.map(([k,l,d])=>({k,l,d,pct:pctDe(k)})),pct:pctDe,tipoDe:pid=>tipoDe(parcById(pid)||parcByCrm(pid)),
  rtVal(crmId){const p=parcByCrm(crmId);const t=tipoDe(p);return t?pctDe(t):''},
  formDica(){return TIPOS.map(([k,l])=>pctDe(k)+'% = '+l).join(' · ')},
  formSel(crmId){const p=crmId!=null?parcByCrm(crmId):null;const t=tipoDe(p);const m=JSON.stringify(Object.fromEntries(TIPOS.map(([k])=>[k,pctDe(k)]))).replace(/"/g,"'");
    const on=`var m=${m},t=this.value;document.getElementById('f_rt').value=t?m[t]:'';document.getElementById('f_excl').value=t==='exclusivo'?'Sim':'Não';document.getElementById('f_rtshow').textContent=t?('RT '+m[t]+'%'):'escolha o tipo'`;
    return `<div style="display:flex;gap:10px;align-items:center"><select id="f_rttipo" onchange="${on}" style="flex:1"><option value="">Escolher…</option>${TIPOS.map(([k,l,d])=>`<option value="${k}" ${t===k?'selected':''} title="${E(d)}">${E(l)} — ${pctDe(k)}%</option>`).join('')}</select><b id="f_rtshow" style="white-space:nowrap">${t?'RT '+pctDe(t)+'%':'escolha o tipo'}</b></div>`},
  rtHtml(crmId){const p=parcByCrm(crmId);const t=tipoDe(p);
    return t?`<b>${pctDe(t)}%</b> · <span class="tag" style="${TAGCOR[t]}" title="${E((TIPOS.find(x=>x[0]===t)||[])[2])}">${E(nomeTipo(t))}</span>`
      :`<span class="tag" style="background:#fde2e1;color:#b42318" title="Sem o tipo, proposta com este parceiro não pode ser enviada. Defina em Editar.">Tipo de parceria a definir</span>`},
  nota(crmId){const x=dadoDe(crmId);return x?x.nota:0},
  dado:dadoDe,setTipo,
  detalhe(crmId){abreDetalhe(crmId)},
  recalcular(){invalida();return passo()},
  _int:{negTravado,propTravada,sincronizaRascunhos,calcula,semTipoNa}};

/* ───────────── 6 · janela "por que esta classificação" ───────────── */
function fecha(){const el=document.getElementById('v187-ov');if(el)el.remove()}
window.V187.fecha=fecha;
function abreDetalhe(crmId){fecha();const p=parcByCrm(crmId);const x=dadoDe(crmId);if(!p||!x)return;const fx=regras().classif_faixas;
  const val=k=>k==='valor'?R$(x.valor):k==='fidelidade'?((x.fechados+x.perdidos)?nBR(x.fidelidade*100)+'% <span style="color:#6b7280">('+x.fechados+' fechados de '+(x.fechados+x.perdidos)+' decididos)</span>':'<span style="color:#6b7280">nenhum decidido</span>'):nBR(x[k]);
  const barra=v=>`<div style="height:6px;border-radius:4px;background:rgba(127,127,127,.15);margin-top:4px"><div style="height:6px;border-radius:4px;width:${v}%;background:#0b6bcb"></div></div>`;
  const linhas=CRITERIOS.map(([k,l,d])=>`<tr><td style="padding:8px 6px"><b>${E(l)}</b><div style="font-size:11.5px;color:#6b7280">${E(d)}</div></td><td style="padding:8px 6px;text-align:right;white-space:nowrap">${val(k)}</td><td style="padding:8px 6px;width:120px"><b>${x.pts[k]||0}</b> pts${barra(x.pts[k]||0)}</td></tr>`).join('');
  const opps=(x.opps||[]).slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0,8).map(o=>`<tr><td style="padding:4px 6px">${E(o.cliente)}</td><td style="padding:4px 6px">${E(o.status)}</td><td style="padding:4px 6px;text-align:right">${o.valor?R$(o.valor):'—'}</td></tr>`).join('');
  const t=tipoDe(p);const c=calcula();
  const ov=document.createElement('div');ov.id='v187-ov';ov.style.cssText='position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.35);display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px;overflow:auto';
  ov.onclick=e=>{if(e.target===ov)fecha()};
  ov.innerHTML=`<div style="background:var(--card,#fff);color:inherit;border-radius:16px;max-width:720px;width:100%;padding:22px 24px;box-shadow:0 20px 60px rgba(0,0,0,.25)">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div style="font-size:12px;letter-spacing:.06em;color:#6b7280">CLASSIFICAÇÃO AUTOMÁTICA</div><h4 style="margin:2px 0 0">${E(p.nome)}</h4></div><button onclick="V187.fecha()" style="border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer" title="Fechar">×</button></div>
   <div style="display:flex;gap:18px;align-items:center;margin:14px 0 6px;flex-wrap:wrap"><div style="font-size:40px;font-weight:800;line-height:1">${x.nota}<span style="font-size:15px;font-weight:600;color:#6b7280"> / 100</span></div><div><div style="font-size:20px;font-weight:700">${E(x.classe)}</div><div style="font-size:12px;color:#6b7280">nota = média dos 5 critérios · Platinum ≥ ${fx.platinum} · Ouro ≥ ${fx.ouro} · Prata ≥ ${fx.prata} · Bronze abaixo</div></div>
   <div style="margin-left:auto;text-align:right"><div style="font-size:12px;color:#6b7280">Tipo de parceria</div>${t?`<b>${E(nomeTipo(t))} · RT ${pctDe(t)}%</b>`:'<b style="color:#b42318">a definir</b>'}</div></div>
   ${x.entradas?'':'<div style="padding:8px 10px;border-radius:10px;background:rgba(127,127,127,.08);font-size:13px;margin:6px 0">Este parceiro ainda não aparece em nenhuma oportunidade da Pipeline — fica Bronze até trazer o primeiro projeto.</div>'}
   <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13.5px">${linhas}</table>
   <div style="font-size:11.5px;color:#6b7280;margin-top:6px">Os pontos de cada critério (0–100) mostram a posição do parceiro entre os ${c?c.N:0} parceiros que já trouxeram projeto: 100 = o melhor, 50 = no meio, 0 = não tem.</div>
   ${opps?`<div style="margin-top:14px;font-weight:700;font-size:13px">Oportunidades na Pipeline (${x.entradas}${x.entradas>8?', 8 mais recentes':''})</div><table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px">${opps}</table>`:''}
   <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap"><button class="btn-soft" onclick="V187.fecha();location.hash='#/rtclassif'">Ver todos os parceiros</button><button class="btn-apple" onclick="V187.fecha()">OK</button></div></div>`;
  document.body.appendChild(ov)}

/* ───────────── 7 · Base › Parceiros: coluna "Tipo de parceria" no lugar de "RT padrão %" + o cartão das regras ───────────── */
const SEL_TIPOS=()=>[['','— a definir —'],...TIPOS.map(([k,l])=>[k,l+' · '+pctDe(k)+'%'])];
function ligaGrid(){if(typeof window.bdGrid!=='function'||typeof window.bdSet!=='function')return false;
  if(!window.bdGrid.__v187){const g=window.bdGrid;window.bdGrid=function(o){if(o&&o.tabela==='parceiros'&&Array.isArray(o.cols)){
      o=Object.assign({},o);o.cols=[].concat(...o.cols.map(c=>c&&c.k==='rt_pct'?[{k:'rt_tipo',l:'Tipo de parceria',t:'select',w:'220px',opts:SEL_TIPOS},{k:'_rt187',l:'RT %',t:'ro',f:r=>tipoDe(r)?`<b>${pctDe(tipoDe(r))}%</b>`:'<span class="chip bad" style="font-size:10.5px;white-space:nowrap">definir tipo</span>'}]:[c]));
      if(o.tpl){o.tpl=Object.assign({},o.tpl,{rt_tipo:'',rt_pct:null})}}
    return g.apply(this,[o].concat([].slice.call(arguments,1)))};window.bdGrid.__v187=true}
  if(!window.bdSet.__v187){const s=window.bdSet;window.bdSet=function(tabela,id,k,v){
      if(tabela==='parceiros'&&k==='rt_pct'){T(()=>toast(travadoMsg(parcById(id)),true));return}
      if(tabela==='parceiros'&&k==='rt_tipo'){try{setTipo(id,v)}catch(e){T(()=>toast(e.message,true))}T(()=>renderMain());return}
      return s.apply(this,arguments)};window.bdSet.__v187=true}
  return true}

function cartaoRegras(naTela){const r=regras();const P=(S.db.parceiros||[]).filter(p=>!p.inativo);const com=P.filter(p=>tipoDe(p));const sem=P.length-com.length;
  const por=TIPOS.map(([k,l])=>({k,l,n:P.filter(p=>tipoDe(p)===k).length}));
  const inp=(onch,v,w)=>`<input type="number" step="0.5" min="0" max="100" class="form-control form-control-sm text-end" style="width:${w||70}px;display:inline-block" value="${v}" onchange="${onch}">`;
  return `<div class="card p-3 mb-3" data-v187="regras" style="border-left:4px solid #0b6bcb;display:block"><div class="d-flex justify-content-between flex-wrap gap-2"><div><b>Tipo de parceria → RT</b><div class="sub" style="font-size:12px">O tipo, escolhido no cadastro do parceiro, define a RT. A proposta busca o % daqui — ninguém digita o % na proposta.</div></div>${naTela?'':'<a href="#/rtclassif" class="btn-soft" style="text-decoration:none;align-self:flex-start">Classificação dos parceiros ›</a>'}</div>
   <div class="row g-2 mt-1">${TIPOS.map(([k,l,d])=>`<div class="col-md-4"><div class="p-2" style="border-radius:10px;background:rgba(127,127,127,.06)"><div class="d-flex justify-content-between align-items-center gap-2"><b style="font-size:13px">${E(l)}</b><span>${inp(`run(()=>V187._setPct('${k}',this.value),'RT do tipo salva — vale para todos os parceiros deste tipo e para as propostas em rascunho')`,pctDe(k))} %</span></div><div class="sub" style="font-size:11.5px">${E(d)}</div></div></div>`).join('')}</div>
   <div class="mt-2" style="font-size:13px"><b>${nBR(P.length)}</b> parceiros = ${por.map(x=>`<a href="#/rtclassif/${x.k}">${nBR(x.n)} ${E(x.l)}</a>`).join(' + ')} + <a href="#/rtclassif/semtipo" style="color:#b42318"><b>${nBR(sem)}</b> sem tipo</a> <span class="sub">(proposta com parceiro sem tipo não pode ser enviada)</span></div>
   <div class="mt-2 sub" style="font-size:12px">Classificação automática — faixas da nota (0–100): Platinum ≥ ${inp(`run(()=>V187._setFx('platinum',this.value),'Faixa salva')`,r.classif_faixas.platinum,64)} · Ouro ≥ ${inp(`run(()=>V187._setFx('ouro',this.value),'Faixa salva')`,r.classif_faixas.ouro,64)} · Prata ≥ ${inp(`run(()=>V187._setFx('prata',this.value),'Faixa salva')`,r.classif_faixas.prata,64)} · Bronze abaixo</div></div>`}
window.V187._setPct=(k,v)=>{if(!TIPOS.some(x=>x[0]===k))throw Err('Tipo inválido.');const n=+String(v).replace(',','.');if(!(n>=0&&n<=100))throw Err('Informe um % de 0 a 100.');
  regras().rt_tipos[k]=n;T(()=>log('regras','rt_tipos',k+' = '+n+'%'));amarraTodos();sincronizaRascunhos();invalida();T(()=>save())};
window.V187._setFx=(k,v)=>{const n=+v;if(!(n>=0&&n<=100))throw Err('Informe uma nota de 0 a 100.');regras().classif_faixas[k]=n;invalida();gravaClassificacao();T(()=>save())};

/* a tela "Classificação dos parceiros" — todos os parceiros, os 5 critérios, a nota e o tipo */
function telaClassif(arg){const c=calcula();const P=(S.db.parceiros||[]).filter(p=>!p.inativo&&p.crm_id!=null);
  const f=arg||'';const rows=P.map(p=>({p,x:dadoDe(p.crm_id)||{},t:tipoDe(p)})).filter(r=>!f||(f==='semtipo'?!r.t:TIPOS.some(x=>x[0]===f)?r.t===f:['Platinum','Ouro','Prata','Bronze'].includes(f)?r.x.classe===f:true))
    .sort((a,b)=>(b.x.nota||0)-(a.x.nota||0)||String(a.p.nome).localeCompare(String(b.p.nome),'pt-BR'));
  const cnt=k=>P.filter(p=>(dadoDe(p.crm_id)||{}).classe===k).length;
  const chip=(k,l,n)=>`<a href="#/rtclassif/${k}" class="chip ${f===k?'info':''}" style="text-decoration:none">${l} · ${nBR(n)}</a>`;
  const filtros=`<div class="d-flex flex-wrap gap-2 mb-2"><a href="#/rtclassif" class="chip ${!f?'info':''}" style="text-decoration:none">Todos · ${nBR(P.length)}</a>${['Platinum','Ouro','Prata','Bronze'].map(k=>chip(k,k,cnt(k))).join('')}<span class="sub">|</span>${TIPOS.map(([k,l])=>chip(k,l,P.filter(p=>tipoDe(p)===k).length)).join('')}${chip('semtipo','Sem tipo',P.filter(p=>!tipoDe(p)).length)}</div>`;
  const bridge=`<div class="sub mb-2" style="font-size:12.5px">${nBR(P.length)} parceiros = ${['Platinum','Ouro','Prata','Bronze'].map(k=>nBR(cnt(k))+' '+k).join(' + ')} · ${c?nBR(c.N):0} já trouxeram projeto (os demais ficam Bronze)</div>`;
  const tb=`<div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Parceiro</th><th>Classificação</th><th class="text-end">Nota</th>${CRITERIOS.map(([,l])=>`<th class="text-end">${E(l)}</th>`).join('')}<th>Tipo de parceria · RT</th></tr></thead><tbody>${rows.slice(0,600).map(({p,x,t})=>`<tr class="rowlink" onclick="V187.detalhe(${+p.crm_id})"><td><b>${E(p.nome)}</b></td><td><span class="chip">${E(x.classe||'Bronze')}</span></td><td class="text-end"><b>${x.nota||0}</b></td><td class="text-end">${nBR(x.entradas)}</td><td class="text-end">${nBR(x.fechados)}</td><td class="text-end">${x.valor?R$(x.valor):'—'}</td><td class="text-end">${(x.fechados+x.perdidos)?nBR((x.fidelidade||0)*100)+'%':'—'}</td><td class="text-end">${nBR(x.participacao)}</td><td>${t?E(nomeTipo(t))+' · <b>'+pctDe(t)+'%</b>':'<span class="chip bad">definir tipo</span>'}</td></tr>`).join('')||'<tr><td colspan="9" class="place">Nenhum parceiro neste filtro.</td></tr>'}</tbody></table></div></div>`;
  return (typeof head==='function'?head('Classificação dos parceiros','Calculada pelos 5 critérios: entrada de projeto, fechamento, valor total fechado, fidelidade e participação no projeto com o cliente. Clique num parceiro para ver o porquê.'):'<h1>Classificação dos parceiros</h1>')+cartaoRegras(true)+filtros+bridge+tb}

const BAR_DE='a RT não foi negociada; o Financeiro não paga RT a eles até o % ser preenchido.';
const BAR_PARA='sem o tipo de parceria a RT não está definida, e proposta com eles não pode ser enviada.';
const barra=h=>{if(typeof h!=='string'||h.indexOf(BAR_DE)<0)return h;h=h.replace(BAR_DE,BAR_PARA);const i=h.indexOf('parceiro(s) com <span class="af-chip af-def">RT a definir</span>');
  return i>=0?h.slice(0,i)+'parceiro(s) com <span class="af-chip af-def">tipo de parceria a definir</span>'+h.slice(i+'parceiro(s) com <span class="af-chip af-def">RT a definir</span>'.length):h};
function ligaTelas(){if(typeof SCREENS!=='object')return false;
  if(!SCREENS.rtclassif){SCREENS.rtclassif=telaClassif;T(()=>{LABEL.rtclassif='Classificação dos parceiros'});T(()=>{SEC_OF.rtclassif=SEC_OF.dbparceiros||'bd'})}
  window.parceirosSemRT=function(){return (S.db.parceiros||[]).filter(p=>!p.inativo&&!tipoDe(p))};
  if(typeof SCREENS.crmparceiros==='function'&&!SCREENS.crmparceiros.__v187){const g=SCREENS.crmparceiros;SCREENS.crmparceiros=function(){return barra(g.apply(this,arguments))};Object.keys(g).forEach(k=>{try{SCREENS.crmparceiros[k]=g[k]}catch(e){}});SCREENS.crmparceiros.__v187=true}
  if(typeof SCREENS.dbparceiros==='function'&&!SCREENS.dbparceiros.__v187){const g=SCREENS.dbparceiros;
    SCREENS.dbparceiros=function(){let h=barra(g.apply(this,arguments));if(typeof h!=='string'||h.indexOf('data-v187="regras"')>=0)return h;
      const i=h.indexOf('<div class="card"><div class="tblwrap">');const j=h.indexOf('Cada célula salva ao sair dela');const at=j>=0?h.lastIndexOf('<div',j):i;
      return at>=0?h.slice(0,at)+cartaoRegras()+h.slice(at):cartaoRegras()+h};
    Object.keys(g).forEach(k=>{try{SCREENS.dbparceiros[k]=g[k]}catch(e){}});SCREENS.dbparceiros.__v187=true}
  return true}

/* ───────────── 8 · os campos de RT % espalhados pelas telas: travados onde a RT vem do parceiro ───────────── */
function trata(root){
  (root.querySelectorAll?root:document).querySelectorAll('input[onchange*="A.rtRecPct("],input[onchange*="RTF2.pct("],input[onchange*="A.setIndicador("]').forEach(el=>{
    if(el.__v187)return;const oc=el.getAttribute('onchange')||'';let m,pid=null,trava=false;
    if((m=oc.match(/A\.rtRecPct\('([^']+)','([^']+)'/))){const ng=T(()=>get('negociacoes',m[1]),null);pid=m[2];trava=ng&&negTravado(ng)}
    else if((m=oc.match(/RTF2\.pct\('([^']+)',(?:decodeURIComponent\('([^']+)'\)|'([^']+)')/))){const p=T(()=>get('propostas',m[1]),null);pid=m[2]?decodeURIComponent(m[2]):m[3];trava=p&&propTravada(p)}
    else if((m=oc.match(/A\.setIndicador\('([^']+)','rt_pct'/))){pid=m[1];
      const pa=parcById(pid);el.__v187=true;const s=document.createElement('select');s.className='form-select form-select-sm';s.style.cssText='width:200px;display:inline-block';
      s.innerHTML=SEL_TIPOS().map(([v,l])=>`<option value="${v}" ${tipoDe(pa)===v?'selected':''}>${E(l)}</option>`).join('');
      s.onchange=function(){try{setTipo(pid,this.value);T(()=>toast('Tipo de parceria salvo — a RT vem dele'))}catch(e){T(()=>toast(e.message,true))}T(()=>renderMain())};
      s.title='A RT vem do tipo de parceria';el.replaceWith(s);return}
    el.__v187=true;if(!trava)return;const pa=parcById(pid);const t=tipoDe(pa);
    el.disabled=true;el.removeAttribute('onchange');el.value=t?pctDe(t):(el.value||0);el.title=travadoMsg(pa);
    const tag=document.createElement('span');tag.className='chip '+(t?'':'bad');tag.style.cssText='font-size:10.5px;white-space:nowrap;margin-left:4px';tag.title=travadoMsg(pa);
    tag.textContent=t?'do cadastro · '+nomeTipo(t):'parceiro sem tipo';el.insertAdjacentElement('afterend',tag)});
  /* aviso no cartão de RT da proposta em rascunho */
  (root.querySelectorAll?root:document).querySelectorAll('[data-rtcard2]').forEach(card=>{if(card.__v187)return;card.__v187=true;
    const m=(card.innerHTML.match(/RTF2\.(?:pct|add|del)\('([^']+)'/)||[]);const p=m[1]&&T(()=>get('propostas',m[1]),null);if(!p||!propTravada(p))return;
    const f=semTipoNa(p);const d=document.createElement('div');d.className='p-2 mb-2';d.style.cssText='border-radius:8px;font-size:12.5px;'+(f.length?'background:rgba(220,53,69,.08)':'background:rgba(11,107,203,.07)');
    d.innerHTML=f.length?`<b>${E(f.map(x=>x.nome).join(', '))}</b> ${f.length>1?'não têm':'não tem'} o tipo de parceria no cadastro — a proposta não pode ser enviada até definir (CRM › Parceiros › Editar).`:'A RT de cada parceiro vem do cadastro dele (tipo de parceria). Para mudar o %, mude o tipo no parceiro.';
    const h6=card.querySelector('h6');const alvo=h6&&h6.parentElement&&h6.parentElement.nextElementSibling;if(alvo)alvo.insertAdjacentElement('afterend',d);else card.appendChild(d)})}
let agendado=false;const obs=new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;T(()=>trata(document))})});

/* ───────────── arranque ───────────── */
function liga(){const a=T(ligaAcoes,false),b=T(ligaCRM,false),c=T(ligaGrid,false),d=T(ligaTelas,false);return a&&b&&c&&d}
if(!liga()){let n=0;const t=setInterval(()=>{if(liga()||++n>60)clearInterval(t)},250)}
const comeca=()=>{try{obs.observe(document.body,{childList:true,subtree:true})}catch(e){}T(()=>trata(document))};
if(document.body)comeca();else document.addEventListener('DOMContentLoaded',comeca);
})();
