/* =====================================================================================================
   v169 · PROPOSTAS ENVIADAS VIRAM PROPOSTAS DE VERDADE NO SISTEMA (Bruno, 08/11/2026)
   Pedido: as propostas já enviadas (salvas no Drive Comercial) entram no sistema para a equipe trabalhar nelas.
   Regras do Bruno (08/11): só as negociações ABERTAS do Pipeline (enviada / revisão / aguardando);
   do Drive, só o arquivo MAIS NOVO de cada proposta (opções paralelas A/B/C… entram cada uma como uma proposta);
   preços, miscelâneas, diárias e custo = os do arquivo Excel. A partir daí a equipe edita à vontade.
   Cada proposta nasce ligada à sua negociação (como o "Montar proposta" faz), estado "Enviada".
   Carga feita UMA vez por proposta: depois de criada, o sistema nunca mais sobrescreve (a equipe pode ter mexido).
   Mão de obra: enquanto as diárias forem as do arquivo, vale o valor do arquivo; se alguém mudar as diárias, vale a tabela.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v169)return;window.__v169=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V169_ENV;if(!D||!Array.isArray(D.props)){console.error('v169: v169-propostas-enviadas-data.js não carregou');return}
const T=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R2=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'').trim();
const head=s=>String(s||'').split(' — ')[0];
const mkid=p=>T(()=>uid(p),p+Math.random().toString(36).slice(2,10));
const BY=new Map(D.props.map(x=>[x.id,x]));
const today=()=>new Date().toISOString().slice(0,10);

let IDX=null;
function idx(){if(IDX)return IDX;IDX=new Map();(S.db.produtos||[]).forEach(p=>{const k=nz(head(p.nome));if(!k)return;(IDX.get(k)||IDX.set(k,[]).get(k)).push(p)});return IDX}
function produto(db,m,marca,desc,cu,pu,cat,tp,num){
  if(m==='(miscelânea sem produto)'){let g=db.produtos.find(p=>p._v165misc);if(!g){g={id:mkid('p'),nome:'Miscelânea — linha do Excel sem produto',marca:'TAAG',categoria:'Miscelânea',rastreio:'nenhum',custo:0,preco:0,tipo:'vb',fase:'instalacao',descricao:'Valor que o vendedor colocou numa linha da Proposta Interna sem modelo (só miscelânea).',fotos:[],portas:[],status:'OK',_v165misc:true};db.produtos.push(g)}return g}
  const k=nz(m);const c=idx().get(k)||[];
  let p=c.length===1?c[0]:c.find(x=>nz(x.marca)===nz(marca))||null;
  if(p)return p;
  p={id:mkid('p'),nome:m+(desc?' — '+String(desc).slice(0,90):''),marca:marca||'',categoria:cat&&cat!=='à definir'?cat:'Outros',rastreio:'serial',custo:+cu||0,preco:+pu||0,tipo:tp||'pç',fase:'instalacao',ncm:'',origem:'Nacional',unidade:'un',garantia_meses:12,cst:'',cod_fornecedor:'',apelido:'',nome_comercial:m,fornecedor:'',unidade_venda:'Unidade',desconto_max:0,descricao:'Cadastrado a partir da proposta enviada nº '+num+' (arquivo Excel, 08/11/2026) — modelo não encontrado no catálogo; conferir.',fotos:[],portas:[],aprovado:false,status:'Revisar',revisar:true,_v169:num};
  db.produtos.push(p);(idx().get(k)||idx().set(k,[]).get(k)).push(p);return p}

const DK=()=>T(()=>DISC,['projeto','estrutural','instalacao','programacao']);
const full=s=>{const o={};DK().forEach(k=>o[k]=Math.round((+((s||{})[k])||0)*10000)/10000);return o};
const snap=p=>JSON.stringify((p.blocos||[]).map(b=>full(b.servicos_adj||b.servicos)));
function carregar(db){
  if(!db.v169_carregados||typeof db.v169_carregados!=='object')db.v169_carregados={};
  const feito=db.v169_carregados;let n=0,lin=0,sem=[];const p0=(db.produtos||[]).length;
  D.props.forEach(x=>{if(feito[x.id])return;
    const neg=(db.negociacoes||[]).find(q=>q.id===x.deal);if(!neg){sem.push(x.id);return}
    if((db.propostas||[]).some(q=>q.id===x.id)){feito[x.id]=today();return}
    const cli=neg.cliente_id?T(()=>get('clientes',neg.cliente_id),null):null;
    const obra=neg.cliente_id?(db.obras||[]).find(o=>o.cliente_id===neg.cliente_id):null;
    const cod=neg.codinome||(cli&&cli.sigla)||'';
    const blocos=x.blocos.map(b=>({id:mkid('b'),nome:b.n,servicos:full(b.s),servicos_adj:full(b.s),misc_serv:+b.sm||0,
      serv_linhas:(+b.sm>0?[{id:mkid('sl'),tipo:'avulso',nome:'Miscelânea dos serviços (do arquivo)',valor:+b.sm,origem:'arquivo Excel da proposta'}]:[]),
      itens:b.i.map(([m,marca,desc,q,pu,mi,cu,cat,tp,ln])=>{const pr=produto(db,m,marca,desc,cu,pu,cat,tp,x.numero||cod);lin++;
        return {id:mkid('l'),produto_id:pr.id,qtd:+q||0,preco_unit:+pu||0,custo_unit:+cu||0,xl_pu:+pu||0,xl_cu:+cu||0,misc:+mi||0,ocultar:false,numero_proposta:x.numero,fase:pr.fase||'instalacao',xl_linha:ln,xl_modelo:m}})}));
    const p={id:x.id,numero:x.numero||'',nome:`${cod||neg.cliente_nome} — ${x.opcao||'proposta enviada'}`,sigla:cod,cliente_id:neg.cliente_id||null,cliente_nome:neg.cliente_nome,obra_id:obra?obra.id:null,
      linha:neg.frente||'taag',produto:x.projeto?'projeto':'sistema',estado:x.alt?'alternativa':'enviada',consultores:[neg.consultor].filter(Boolean),margem_taag:30,
      rt:x.rt!=null?Math.round(x.rt*1000)/10:10,bonificacao:x.bonif!=null?Math.round(x.bonif*1000)/10:4.5,negociacao:0,misc_pct:0,porte:'M',distancia:'capital',
      ajuste:-(+x.ajustes_arquivo||0),blocos,...(x.projeto?{honorarios:+x.total_arquivo||0,escopo:'',entregaveis:T(()=>ENTREGAVEIS.slice(0,3),[])}:{}),opcoes:['A'],opcao:'A',versoes:[],vendida_em:null,validado_por:'equipe (enviada antes do sistema)',categoria:(t=>t?t.charAt(0)+t.slice(1).toLowerCase():(x.projeto?'Projeto':'Sistema'))(String(neg.tipo_pipeline||'').trim()),
      negociacao_id:neg.id,fonte:'Arquivo Excel da proposta enviada (Drive Comercial)',
      env:{quando:D.quando,arquivo:x.arquivo,link:x.link,opcao:x.opcao,total_arquivo:x.total_arquivo,ajustes_arquivo:+x.ajustes_arquivo||0,serv_venda:+x.serv_venda||0,custo_mo:+x.custo_mo_arquivo||0,equip_venda:+x.equip_venda||0,obs:x.obs||'',cliente_arquivo:x.cliente_arquivo||'',snap:''}};
    p.env.snap=snap(p);p.env.alternativa=!!x.alt;
    db.propostas.push(p);
    if(!Array.isArray(neg.proposta_ids))neg.proposta_ids=[];if(!neg.proposta_ids.includes(p.id))neg.proposta_ids.push(p.id);
    if(!Array.isArray(neg.timeline))neg.timeline=[];neg.timeline.push({data:today(),o:'Proposta enviada carregada do Drive: '+(x.numero||'')+(x.opcao?' · '+x.opcao:'')+' ('+x.arquivo+')'});
    feito[x.id]=today();n++});
  return {n,lin,novos:(db.produtos||[]).length-p0,sem}}

/* mão de obra: a do arquivo enquanto as diárias forem as do arquivo */
function motor(){if(typeof M!=='object'||!M||typeof M.serv!=='function'||M.serv.__v169)return;const _s=M.serv;
  M.serv=function(p){const r=_s.apply(this,arguments);if(!p||!p.env||p.produto==='projeto'||!(p.blocos&&p.blocos.length))return r;
    if(snap(p)!==p.env.snap)return Object.assign({},r,{do_arquivo:false});
    const mi=(p.blocos||[]).reduce((a,b)=>a+(+b.misc_serv||0),0);
    return Object.assign({},r,{venda:+p.env.serv_venda||0,custo:+p.env.custo_mo||0,misc:mi,do_arquivo:true})};M.serv.__v169=1}

/* preços do arquivo: a sincronização do catálogo (Tabela Taag) não mexe nestas propostas, a menos que a equipe peça */
function protege(){['__aplicarCatalogo','aplicarCatalogo'].forEach(nm=>{const f=window[nm];if(typeof f!=='function'||f.__v169)return;
  const w=function(prodId){const keep=[],hl=new Map();(S.db.propostas||[]).forEach(p=>{if(!p.env||p.env.tabela_hoje)return;hl.set(p,(p.hist_precos||[]).length);
      (p.blocos||[]).forEach(b=>(b.itens||[]).forEach(l=>{if(l.produto_id===prodId)keep.push([l,l.preco_unit,l.custo_unit])}))});
    const r=f.apply(this,arguments);keep.forEach(([l,a,c])=>{l.preco_unit=a;l.custo_unit=c});hl.forEach((n,p)=>{if(p.hist_precos)p.hist_precos.length=n});return r};
  w.__v169=1;try{window[nm]=w}catch(e){}})}
function tabelaHoje(id){const p=T(()=>get('propostas',id),null);if(!p||!p.env)return;let n=0;
  (p.blocos||[]).forEach(b=>(b.itens||[]).forEach(l=>{const pr=T(()=>get('produtos',l.produto_id),null);if(!pr||pr._v165misc||!(+pr.preco>0))return;
    if(Math.abs((l.preco_unit||0)-pr.preco)>0.005||Math.abs((l.custo_unit||0)-(+pr.custo||0))>0.005){(p.hist_precos=p.hist_precos||[]).push({data:today(),produto:head(pr.nome),de:l.preco_unit,para:pr.preco,origem:'Tabela de hoje (pedido na proposta enviada)'});l.preco_unit=+pr.preco;l.custo_unit=+pr.custo||0;n++}}));
  p.env.tabela_hoje=today();T(()=>log('propostas',id,'Proposta enviada '+p.numero+': '+n+' linha(s) passaram para o preço da tabela de hoje'));T(()=>save());T(()=>toast(n+' linha(s) com o preço da tabela de hoje'));T(()=>render())}
function voltaArquivo(id){const p=T(()=>get('propostas',id),null);if(!p||!p.env)return;let n=0;
  (p.blocos||[]).forEach(b=>(b.itens||[]).forEach(l=>{if(l.xl_pu==null)return;if(Math.abs((l.preco_unit||0)-l.xl_pu)>0.005||Math.abs((l.custo_unit||0)-l.xl_cu)>0.005){l.preco_unit=l.xl_pu;l.custo_unit=l.xl_cu;n++}}));
  delete p.env.tabela_hoje;T(()=>log('propostas',id,'Proposta enviada '+p.numero+': '+n+' linha(s) voltaram ao preço do arquivo'));T(()=>save());T(()=>toast(n+' linha(s) de volta ao preço do arquivo'));T(()=>render())}
/* opções paralelas da mesma negociação: só UMA está "Enviada" (conta no pipeline); as outras ficam "alternativa" (não somam duas vezes) */
const grupo=deal=>D.props.some(d=>d.deal===deal&&d.alt);
function irmas(p){const x=BY.get(p.id);if(!x||!grupo(x.deal))return [];return (S.db.propostas||[]).filter(q=>q.env&&q.id!==p.id&&q.negociacao_id===p.negociacao_id)}
function principal(id){const p=T(()=>get('propostas',id),null);if(!p||!p.env)return;
  irmas(p).forEach(q=>{if(q.estado==='enviada'){q.estado='alternativa';q.env.alternativa=true}});
  if(p.estado==='alternativa')p.estado='enviada';p.env.alternativa=false;
  T(()=>log('propostas',id,'Opção principal da negociação: '+p.numero+' · '+p.env.opcao));T(()=>save());T(()=>toast('Agora a opção principal é '+p.env.opcao));T(()=>render())}
function religa(){let k=0;(S.db.propostas||[]).forEach(p=>{if(!p.env||!p.negociacao_id)return;const n=(S.db.negociacoes||[]).find(q=>q.id===p.negociacao_id);if(!n)return;if(!Array.isArray(n.proposta_ids))n.proposta_ids=[];if(!n.proposta_ids.includes(p.id)){n.proposta_ids.push(p.id);k++}});if(k)T(()=>save());return k}
function cartao(p){const x=p.env;if(!x)return '';const ev=T(()=>M.equip(p),{venda:0,custo:0});const sv=T(()=>M.serv(p),{venda:0,custo:0});
  const tot=ev.venda+sv.venda+(p.ajuste||0);const t0=x.total_arquivo;const dif=t0!=null?tot-t0:0;
  return `<div class="card p-3 mb-3" style="border-left:4px solid #0dcaf0"><div class="d-flex justify-content-between flex-wrap gap-2"><div><b style="color:#0aa2c0">✉ Proposta enviada — veio do arquivo Excel do Drive</b>`+
    `<div class="sub" style="font-size:12.5px">Arquivo: <a href="${E(x.link)}" target="_blank" rel="noopener">${E(x.arquivo)}</a>${t0!=null?' · total do arquivo '+R2(t0):''}${x.obs?' · '+E(x.obs):''}</div></div>`+
    `<a class="btn-soft" href="#/enviadas">Propostas enviadas</a></div>`+
    (()=>{const ir=irmas(p);if(!ir.length)return '';const lst=ir.map(q=>`<a href="#/editor/${E(q.id)}">${E(q.env.opcao)}</a>${q.estado==='enviada'?' (principal)':''}`).join(' · ');
      return p.estado==='alternativa'?`<div class="mt-2" style="font-size:13px;background:#f1f3f5;border-radius:8px;padding:6px 10px">Esta é uma <b>opção alternativa</b> (${E(x.opcao)}) — não soma no pipeline para não contar a mesma negociação duas vezes. Outras opções: ${lst}. <button class="btn-soft ms-2" onclick="V169.principal('${E(p.id)}')">Tornar esta a opção principal</button></div>`
        :`<div class="mt-2 sub" style="font-size:12.5px">Opção principal desta negociação (é a que soma no pipeline). Outras opções enviadas: ${lst}.</div>`})()+
    `<div class="mt-2" style="font-size:13px">Agora: equipamentos <b>${R2(ev.venda)}</b> + mão de obra <b>${R2(sv.venda)}</b> ${(p.ajuste||0)<0?'−':'+'} ajuste <b>${R2(Math.abs(p.ajuste||0))}</b> = <b>${R2(tot)}</b>`+
    (t0!=null?(Math.abs(dif)<0.01?` = total do arquivo ✓`:` · diferença para o arquivo ${R2(dif)}${x.obs&&/não recalculou/.test(x.obs)?' (o Excel não recalculou)':' (mudanças feitas aqui no sistema)'}`):'')+`</div>`+
    `<div class="sub mt-1" style="font-size:12px">Mão de obra ${sv.do_arquivo?'= o valor do arquivo (diárias do arquivo)':'recalculada pela tabela de diárias (as diárias foram alteradas aqui)'} · custo: equipamentos ${R2(ev.custo)} + mão de obra ${R2(sv.custo)}. Pode editar à vontade — o arquivo no Drive não muda.</div>`+
    `<div class="mt-2 d-flex gap-2 flex-wrap align-items-center" style="font-size:12.5px"><span class="sub">Preços: <b>${x.tabela_hoje?'da tabela de hoje (desde '+E(x.tabela_hoje.split('-').reverse().join('/'))+')':'os do arquivo enviado ao cliente'}</b></span>`+
    (x.tabela_hoje?`<button class="btn-soft" onclick="V169.voltaArquivo('${E(p.id)}')">Voltar aos preços do arquivo</button>`:`<button class="btn-soft" onclick="V169.tabelaHoje('${E(p.id)}')">Usar os preços da tabela de hoje</button>`)+`</div></div>`}
function ligaEditor(){if(typeof SCREENS!=='object'||typeof SCREENS.editor!=='function')return false;if(SCREENS.editor.__v169)return true;const _e=SCREENS.editor;
  SCREENS.editor=function(id){const h=_e.apply(this,arguments);const p=T(()=>get('propostas',id),null);if(!p||!p.env||typeof h!=='string')return h;const c=cartao(p);
    const anchor='<h4 class="mb-2">Ambientes e trabalhos</h4>';const i=h.indexOf(anchor);return i>=0?h.slice(0,i)+c+h.slice(i):c+h};
  SCREENS.editor.__v169=true;return true}

/* a lista: negociações abertas × propostas carregadas (ponte à vista) */
function tela(arg){const db=S.db;const f=T(()=>decodeURIComponent(arg||''),'');
  const abertas=(db.negociacoes||[]).filter(n=>['enviada','revisao','aguardando'].includes(n.etapa));
  const props=(db.propostas||[]).filter(p=>p.env);
  const comP=abertas.filter(n=>props.some(p=>p.negociacao_id===n.id));const semP=abertas.filter(n=>!props.some(p=>p.negociacao_id===n.id));
  const princ=props.filter(p=>p.estado!=='alternativa'),alts=props.filter(p=>p.estado==='alternativa');const tot=princ.reduce((a,p)=>a+T(()=>M.total(p),0),0);
  const tile=(k,n,lb,cor,sub)=>`<a class="card p-3 d-block" style="text-decoration:none;border-top:4px solid ${cor};min-width:220px;flex:1" href="#/enviadas/${k}"><div style="font-size:28px;font-weight:800;color:${cor}">${N0(n)}</div><div style="font-size:13px">${E(lb)}</div>${sub?`<div class="sub">${sub}</div>`:''}</a>`;
  const tiles=tile('com',comP.length,'negociações com a proposta carregada','#0aa2c0',`${N0(princ.length)} propostas principais · ${R2(tot)} no pipeline`)+tile('sem',semP.length,'sem arquivo Excel no Drive (só PDF/apresentação)','#6c757d','');
  const ponte=`Ponte: <b>${N0(abertas.length)}</b> negociações abertas (enviada / revisão / aguardando) = <a href="#/enviadas/com">${N0(comP.length)} com proposta</a> + <a href="#/enviadas/sem">${N0(semP.length)} sem arquivo</a> · ${N0(props.length)} propostas = ${N0(princ.length)} principais (somam no pipeline) + ${N0(alts.length)} opções alternativas (A, B, C… da mesma negociação; não somam)`;
  const ETP={enviada:'enviada',revisao:'revisão',aguardando:'aguardando'};
  const linhas=(f==='sem'?[]:comP).map(n=>{const ps=props.filter(p=>p.negociacao_id===n.id);
    ps.sort((a,b)=>(a.estado==='alternativa')-(b.estado==='alternativa'));return ps.map((p,i)=>{const t=T(()=>M.total(p),0);const nl=(p.blocos||[]).reduce((a,b)=>a+b.itens.length,0);
      return `<tr class="rowlink" onclick="location.hash='#/editor/${E(p.id)}'">${i===0?`<td rowspan="${ps.length}"><b>${E(n.cliente_nome)}</b><div class="sub">${E(n.consultor||'')} · ${E(ETP[n.etapa]||n.etapa)}</div></td>`:''}<td><b>#${E(p.numero||'—')}</b></td><td>${E(p.env.opcao||'—')}${p.estado==='alternativa'?' <span class="chip">alternativa</span>':(ps.length>1&&ps.some(q=>q.estado==='alternativa')?' <span class="chip info">principal</span>':'')}</td><td class="text-end">${N0(nl)}</td><td class="text-end">${R2(t)}</td><td class="sub" style="font-size:12px"><a href="${E(p.env.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${E(p.env.arquivo)}</a>${p.env.obs?'<div>'+E(p.env.obs)+'</div>':''}</td></tr>`}).join('')}).join('');
  const semL=(f==='com'?[]:semP).map(n=>`<tr class="rowlink" onclick="location.hash='#/pipeline'"><td><b>${E(n.cliente_nome)}</b><div class="sub">${E(n.consultor||'')} · ${E(ETP[n.etapa]||n.etapa)}</div></td><td colspan="5" class="sub">Nenhum arquivo Excel da proposta no Drive (só PDF / apresentação)</td></tr>`).join('');
  return `<h1 class="mb-1">Propostas enviadas — no sistema</h1><div class="sub mb-3">As negociações abertas do Pipeline com a proposta que foi enviada, lida do arquivo Excel do Drive (o mais novo de cada proposta): ambientes, produtos, miscelâneas, diárias e custo. Clique para abrir e trabalhar nela.</div>
  <div class="d-flex gap-3 flex-wrap mb-2">${tiles}</div><div class="v161-ponte mb-3" style="font-size:13px">${ponte}${f?` · <a href="#/enviadas">mostrar todas</a>`:''}</div>
  <div class="card p-0"><table class="tbl"><thead><tr><th>Negociação</th><th>Nº</th><th>Opção</th><th class="text-end">Linhas</th><th class="text-end">Total agora</th><th>Arquivo</th></tr></thead><tbody>${linhas}${semL}</tbody></table></div>`}
function ligaTela(){if(typeof SCREENS!=='object')return false;if(!SCREENS.enviadas){SCREENS.enviadas=tela;T(()=>{if(typeof LABEL==='object')LABEL.enviadas='Propostas enviadas'})}
  ['pipeline','negociacoes','gestao'].forEach(k=>{const f=SCREENS[k];if(typeof f!=='function'||f.__v169)return;const w=function(){const h=f.apply(this,arguments);if(typeof h!=='string')return h;const ps=(S.db.propostas||[]).filter(p=>p.env);if(!ps.length)return h;
    const ban=`<a class="card p-2 px-3 mb-3 d-block" href="#/enviadas" style="text-decoration:none;border-left:4px solid #0dcaf0;font-size:13px">✉ <b>${N0(ps.length)} propostas enviadas</b> já estão no sistema, lidas do Excel do Drive — abrir a lista →</a>`;
    const i=h.indexOf('</h1>');if(i<0)return ban+h;const j=h.indexOf('</div>',i);return j>0&&j-i<400?h.slice(0,j+6)+ban+h.slice(j+6):h.slice(0,i+5)+ban+h.slice(i+5)};w.__v169=1;Object.keys(f).forEach(x=>{try{w[x]=f[x]}catch(e){}});SCREENS[k]=w});return true}

function boot(){try{const db=S.db;if(!db||db.af113_zero||!Array.isArray(db.propostas)||!Array.isArray(db.negociacoes))return;const r=carregar(db);
  if(r.n){db._v169={quando:D.quando,propostas:r.n,linhas:r.lin,produtos_novos:r.novos};T(()=>log('propostas','v169','Propostas enviadas carregadas do Drive: '+r.n+' propostas, '+r.lin+' linhas'));T(()=>save())}
  if(r.sem.length)console.warn('v169: negociação não encontrada para',r.sem)}catch(e){console.error('v169',e)}}
window.V169={dados:D,tabelaHoje,voltaArquivo,principal};
protege();motor();boot();T(()=>religa());document.addEventListener('DOMContentLoaded',()=>{protege();T(()=>religa())});
let tent=0;const iv=setInterval(()=>{let a=false,b=false;try{a=ligaEditor();b=ligaTela()}catch(e){}if((a&&b)||++tent>80){clearInterval(iv);protege();T(()=>religa());try{if(/^#\/(editor|enviadas)/.test(location.hash))render()}catch(e){}}},250);
})();
