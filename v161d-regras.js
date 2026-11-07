/* =====================================================================================================
   v161d · AS REGRAS DO BRUNO DE 06/11/2026 (Comercial · Pós-venda · Estoque)
   R1 Comercial › Pipeline "Fechadas R$ 0": uma negociação FECHADA (STATUS Fechado na aba Pipeline da To Do Comercial)
      empresta o valor da venda do mesmo cliente na METAS 2026. Ligação negociação ↔ venda pelo cliente (o mesmo cadastro
      de cliente, ou o mesmo nome sem a sigla). Cliente com várias vendas: a de data mais próxima da data de fechamento
      (decisão do cliente → data de upgrade) — e a negociação entra na lista "para conferir". Cada venda empresta o valor
      a UMA negociação só (senão o mesmo R$ seria somado duas vezes). Sem venda: "valor não cadastrado".
      Nada é gravado: o valor é lido da Base a cada desenho (uma verdade — a venda da METAS).
   R3b Estoque: proposta que pede cabo em metros reserva BOBINAS INTEIRAS. metros → menor conjunto de bobinas livres que
      cobre (menos bobinas; entre elas, a de menor sobra); o que faltar vira bobinas a comprar (ceil pelo comprimento da
      bobina). Entra no motor da demanda (Q.compute): a linha da proposta passa a pedir N bobinas, com o texto
      "120 m → 1 bobina de 305 m". Hoje nenhuma proposta pede cabo — a prova é um teste em memória (V161D.bob.teste).
   R5 Vendas METAS 2026 sem obra → a obra existente do cliente (uma candidata clara); o resto fica em Base › Conferência Mestra.
   R3c Pós-venda › PERFIL DE ACESSO: os perfis do Pós-venda (antes a tabela at_usuarios, uma lista de pessoas à parte)
      passam a morar no login de cada pessoa em Base › Usuários e permissões (usuarios.posvenda). Uma pessoa = um registro:
      at_usuarios vira uma LEITURA do login (não há segunda lista). Pós-venda lê o perfil do login de quem entrou; a caixa
      do Pós-venda vira um resumo só de leitura com o link "editar em Base › Usuários e permissões".
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161dr)return;window.__v161dr=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v===undefined||v===null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R0=v=>'R$ '+Math.round(+v||0).toLocaleString('pt-BR');
const R2=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const nz=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const ISO=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||'').slice(0,10))&&String(v).length>=10;
const dBR=d=>ISO(d)?String(d).slice(0,10).split('-').reverse().join('/'):'—';
const hoje=()=>T(()=>today(),new Date().toISOString().slice(0,10));
const plural=(n,a,b)=>N0(n)+' '+(n===1?a:b);
const rr=()=>{try{renderMain()}catch(e){try{render()}catch(_){}}};
const D=window.V161D=window.V161D||{};

/* ═══════════════════════════════ R1 · FECHADAS EMPRESTAM O VALOR DA VENDA METAS ═══════════════════════════════ */
const brIso=s=>{const m=String(s||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
/* data de fechamento: DATA DE DECISÃO DO CLIENTE (col. N) → DATA DE UPGRADE (col. M) → a data de upgrade guardada */
function dataFech(n){const c=n.planilha&&n.planilha.c||[];const a=brIso(c[13]);if(a)return {d:a,de:'data de decisão do cliente'};const b=brIso(c[12]);if(b)return {d:b,de:'data de upgrade'};
  const u=String(n.data_upgrade||'').slice(0,10);if(ISO(u))return {d:u,de:'data de upgrade'};return {d:'',de:''}}
/* nome do cliente sem a sigla ("TAR - …") e sem parênteses */
const chaveNome=s=>{let t=String(s||'').replace(/\([^)]*\)/g,' ');t=t.replace(/^\s*[A-Za-zÀ-ú0-9]{2,6}\s+-\s+/,'');return nz(t)};
const dias=(a,b)=>Math.abs((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/864e5);
let MF=null;
function fechadas(){const key=(S.db.negociacoes||[]).length+'|'+(S.db.propostas||[]).length;if(MF&&MF.key===key&&Date.now()-MF.t<1500)return MF.v;
  const F=(S.db.negociacoes||[]).filter(n=>n&&n.resultado==='fechada');
  const MT=(S.db.propostas||[]).filter(p=>p&&p.fonte==='METAS 2026'&&!p.demo&&!p.excluida&&(+p.valor_venda||0)>0&&['vendida','em_obra','concluida'].includes(p.estado));
  const byId={},byNome={};MT.forEach(p=>{[p.cliente_id,p.cliente_ref].filter(Boolean).forEach(id=>{(byId[id]=byId[id]||new Set()).add(p)});const k=chaveNome(p.cliente_nome);if(k)(byNome[k]=byNome[k]||new Set()).add(p)});
  const cands=n=>{const s=new Map();if(n.cliente_id&&byId[n.cliente_id])byId[n.cliente_id].forEach(p=>s.set(p.id,{p,via:'cadastro do cliente'}));const k=chaveNome(n.cliente_nome);if(k&&byNome[k])byNome[k].forEach(p=>{if(!s.has(p.id))s.set(p.id,{p,via:'nome do cliente'})});return [...s.values()]};
  const ord=F.map(n=>({n,f:dataFech(n)})).sort((a,b)=>(a.f.d||'9999').localeCompare(b.f.d||'9999')||((a.n.planilha||{}).linha||1e9)-((b.n.planilha||{}).linha||1e9));
  const usada=new Map();const map={};const list=[];
  ord.forEach(({n,f})=>{const cs=cands(n);const livres=cs.filter(c=>!usada.has(c.p.id));
    const dist=c=>{const dv=String(c.p.vendida_em||'');if(!ISO(dv))return 9e9;if(!f.d)return 9e8+(+dv.replace(/\D/g,''));return dias(f.d,dv.slice(0,10))};
    livres.sort((a,b)=>dist(a)-dist(b)||String(a.p.numero).localeCompare(String(b.p.numero)));
    const rec={n,fech:f,cands:cs.length,venda:null,via:'',flags:[]};
    if(livres.length){const c=livres[0];rec.venda=c.p;rec.via=c.via;usada.set(c.p.id,n);
      if(cs.length>1)rec.flags.push(`o cliente tem ${N0(cs.length)} vendas na METAS 2026 (${cs.map(x=>'nº '+x.p.numero).join(', ')}) — escolhida a de data mais próxima do fechamento`);
      const dv=String(c.p.vendida_em||'');if(!ISO(dv))rec.flags.push('a venda nº '+c.p.numero+' não tem dia na planilha METAS');
      else if(f.d&&dias(f.d,dv.slice(0,10))>180)rec.flags.push(`datas distantes: fechou em ${dBR(f.d)} (${f.de}), a venda é de ${dBR(dv)}`);
      if(!f.d)rec.flags.push('a linha da planilha não tem data de fechamento');}
    else if(cs.length){const o=usada.get(cs[0].p.id);rec.flags.push(`a venda METAS do cliente (${cs.map(x=>'nº '+x.p.numero).join(', ')}) já está em outra negociação fechada${o&&o.planilha?' (linha '+o.planilha.linha+')':''} — cada venda conta uma vez`)}
    map[n.id]=rec;list.push(rec)});
  const v={map,list,MT:MT.length};MF={key,t:Date.now(),v};return v}
D.fechadas=()=>{MF=null;return fechadas()};
D.valorFechada=n=>{const r=n&&fechadas().map[n.id];return r&&r.venda?+r.venda.valor_venda||0:0};
const tagVenda=r=>r&&r.venda?`<span class="v161d-tag" title="O valor é o da venda do mesmo cliente na planilha METAS 2026 (${E(r.via)})">valor da venda METAS nº ${E(r.venda.numero)}</span>`:'';
/* o mesmo conjunto que o quadro do Pipeline usa (filtros de frente e consultor) */
function fechFiltradas(){const f=S.comF||{};return (S.db.negociacoes||[]).filter(n=>n.resultado==='fechada'&&(!f.frente||n.frente===f.frente)&&(!f.cons||T(()=>negCons(n).includes(f.cons),true)))}
function resumoFech(){const R=fechadas();const xs=fechFiltradas().map(n=>R.map[n.id]).filter(Boolean);const com=xs.filter(r=>r.venda),sem=xs.filter(r=>!r.venda),fl=xs.filter(r=>r.flags.length);
  return {xs,com,sem,fl,v:com.reduce((a,r)=>a+(+r.venda.valor_venda||0),0)}}
D.resumoFech=resumoFech;
D.fechLista=k=>{const r=resumoFech();const xs=k==='com'?r.com:k==='sem'?r.sem:k==='flag'?r.fl:r.xs;const tit={com:'Fechadas com venda METAS',sem:'Fechadas sem venda na METAS 2026 · valor não cadastrado',flag:'Fechadas para conferir'}[k]||'Negociações fechadas';
  const rows=xs.slice().sort((a,b)=>(b.venda?+b.venda.valor_venda:0)-(a.venda?+a.venda.valor_venda:0)||String(a.n.cliente_nome).localeCompare(String(b.n.cliente_nome))).map(r=>`<tr class="rowlink" onclick="V161D.abrirNeg('${J(r.n.id)}')"><td class="sub">${r.n.planilha?N0(r.n.planilha.linha):'—'}</td><td><b>${E(r.n.cliente_nome||r.n.id)}</b><div class="sub" style="font-size:11px">${E(r.n.consultor||'—')}</div></td><td>${r.fech.d?dBR(r.fech.d):'—'}<div class="sub" style="font-size:10.5px">${E(r.fech.de)}</div></td><td class="text-end">${r.venda?`<b>${R0(r.venda.valor_venda)}</b><div>${tagVenda(r)}</div><div class="sub" style="font-size:10.5px">${E(r.venda.cliente_nome)} · ${ISO(r.venda.vendida_em)?dBR(r.venda.vendida_em):'2026 (sem dia)'}</div>`:'<span class="sub">valor não cadastrado</span>'}</td><td style="font-size:11.5px;max-width:280px">${r.flags.map(x=>`<div class="v161d-flag">⚠ ${E(x)}</div>`).join('')}</td></tr>`).join('');
  const tv=xs.reduce((a,r)=>a+(r.venda?+r.venda.valor_venda:0),0);
  fecharModal();const d=document.createElement('div');d.id='v161d-modal';d.className='v161-modal';d.onclick=e=>{if(e.target===d)fecharModal()};
  d.innerHTML=`<div class="card p-3 v161-mcard" style="width:min(980px,96vw)"><div class="d-flex justify-content-between align-items-start"><div><div class="sub" style="font-size:11px;letter-spacing:.1em">${E(tit.toUpperCase())}</div><b style="font-size:26px">${N0(xs.length)}</b> <span class="sub">· ${R0(tv)}</span><div class="sub" style="font-size:12px">A aba Pipeline da To Do Comercial não tem valor: a negociação fechada empresta o valor da venda do mesmo cliente na METAS 2026. Cliente com várias vendas → a de data mais próxima do fechamento. Cada venda conta uma vez. Clique numa linha para abrir a negociação.</div></div><button class="iconbtn" onclick="V161D.fecharModal()"><i class="bi bi-x-lg"></i></button></div>
   <div class="tblwrap mt-2" style="max-height:62vh;overflow:auto"><table class="tbl" style="font-size:12.5px"><thead><tr><th>Linha</th><th>Cliente · consultor</th><th>Fechou em</th><th class="text-end">Valor</th><th>Conferir</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="sub">Nenhuma.</td></tr>'}</tbody></table></div></div>`;document.body.appendChild(d)};
function fecharModal(){const el=document.getElementById('v161d-modal');if(el)el.remove()}
D.fecharModal=fecharModal;
D.abrirNeg=id=>{fecharModal();S.deal=id;S.dealTab='comercial';if(location.hash!=='#/pipeline')location.hash='#/pipeline';else rr()};
function fimDiv(h,ini){const re=/<div\b|<\/div>/g;re.lastIndex=ini;let d=0,m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(d===0)return m.index+6}return -1}
function telaPipeline(h){const r=resumoFech();const st='event.stopPropagation();';
  const u=(t,k)=>`<u role="button" onclick="${st}V161D.fechLista('${k}')">${t}</u>`;
  /* o cartão Fechadas: o valor emprestado das vendas METAS */
  h=h.replace(/(<div class="sub" style="font-size:12px">Fechadas<\/div><div style="font-size:26px;font-weight:800">\d+<\/div><div class="sub" style="font-size:11px">)[\s\S]*?(<\/div><\/div><\/div>)/,
    (m,a,b)=>`${a}<span id="v161d-fechv" data-v="${Math.round(r.v)}" style="font-weight:700;color:#146c43">${R0(r.v)}</span> <span class="v161d-tag" role="button" onclick="${st}V161D.fechLista('com')">valor das vendas METAS</span><div style="font-size:10.5px">${u(N0(r.com.length)+' com venda METAS','com')} · ${u(N0(r.sem.length)+' sem venda','sem')}</div>${b}`);
  const ponte=`<div class="v161-ponte mb-3" id="v161d-fech" data-com="${r.com.length}" data-sem="${r.sem.length}" data-v="${Math.round(r.v)}">Fechadas: <b>${R0(r.v)}</b> = ${u(N0(r.com.length)+' fechadas com venda METAS',  'com')} (${R0(r.v)}) + ${u(N0(r.sem.length)+' sem venda',  'sem')} (valor não cadastrado — o cliente não tem venda na METAS 2026${r.sem.some(x=>x.cands)?' ou a venda dele já está em outra fechada':''})${r.fl.length?` · ${u(N0(r.fl.length)+' para conferir','flag')} <span class="sub">(várias vendas do cliente, datas distantes ou venda sem dia)</span>`:''} <span class="sub">· a aba Pipeline não tem valor: cada fechada empresta o valor da venda do mesmo cliente na METAS 2026 (uma venda conta uma vez)</span></div>`;
  const k=h.indexOf('>Fechadas</div>');if(k>0){const ini=h.lastIndexOf('<div class="row g-2 mb-3">',k);const fim=ini>=0?fimDiv(h,ini):-1;if(fim>0)h=h.slice(0,fim)+ponte+h.slice(fim)}
  return h}
function ligaPipeline(){if(typeof SCREENS!=='object'||typeof SCREENS.pipeline!=='function')return false;if(SCREENS.pipeline.__v161d)return true;const _p=SCREENS.pipeline;
  SCREENS.pipeline=function(){const h=_p.apply(this,arguments);if(typeof h!=='string')return h;try{return telaPipeline(h)}catch(e){console.error('v161d pipeline',e);return h}};SCREENS.pipeline.__v161d=true;return true}
/* a gaveta da negociação fechada diz de onde vem o valor */
function ligaGaveta(){if(typeof dealDrawer!=='function')return false;if(dealDrawer.__v161d)return true;const dd=dealDrawer;
  dealDrawer=function(){const h=dd.apply(this,arguments);try{if(typeof h!=='string'||!h)return h;const n=S.deal?T(()=>get('negociacoes',S.deal),null):null;if(!n||n.resultado!=='fechada')return h;
      const r=fechadas().map[n.id];const card=`<div class="card p-3 my-2" id="v161d-negv" style="background:rgba(25,135,84,.07)"><div class="sub" style="font-size:10px;letter-spacing:.08em">VALOR DA NEGOCIAÇÃO FECHADA</div>${r&&r.venda?`<b style="font-size:20px">${R0(r.venda.valor_venda)}</b> ${tagVenda(r)}<div class="sub" style="font-size:11.5px">${E(r.venda.nome||r.venda.cliente_nome)} · vendida em ${ISO(r.venda.vendida_em)?dBR(r.venda.vendida_em):'2026 (sem dia na planilha)'} · ligada pelo ${E(r.via)}</div>`:`<b style="font-size:16px">valor não cadastrado</b><div class="sub" style="font-size:11.5px">${r&&r.cands?'A venda METAS deste cliente já está em outra negociação fechada — cada venda conta uma vez.':'O cliente não tem venda na METAS 2026, e a aba Pipeline não tem coluna de valor.'}</div>`}${r&&r.flags.length?r.flags.map(x=>`<div class="v161d-flag" style="font-size:11.5px">⚠ ${E(x)}</div>`).join(''):''}</div>`;
      const i=h.indexOf('<div class="tabs my-2">');if(i>0)return h.slice(0,i)+card+h.slice(i);const j=h.lastIndexOf('</div>');return j>0?h.slice(0,j)+card+h.slice(j):h}catch(e){console.error('v161d gaveta',e);return h}};
  dealDrawer.__v161d=true;return true}

/* ═══════════════════════════════ R3b · CABO EM METROS → BOBINAS INTEIRAS ═══════════════════════════════ */
const BOB=D.bob=D.bob||{};
const medido=pid=>T(()=>isMedido(pid),false);
BOB.nominal=pid=>{const p=T(()=>get('produtos',pid),null)||{};const m=String(p.nome||'').match(/(\d{2,4})\s*(m|mts|metros)\b/i);if(m)return +m[1];
  const ini=(S.db.unidades||[]).filter(u=>u.produto_id===pid).map(u=>+u.metros_ini||+u.metros||0);const mx=Math.max(0,...ini);return mx||305};
const livreBob=(u,inv)=>u&&u.estado!=='baixado'&&T(()=>bucketOf(u),'')==='livre'&&!T(()=>naoVenda(u),false)&&(+u.metros||0)>0&&(!inv||T(()=>invDeUnit(u),'')===inv);
/* o menor conjunto de bobinas que cobre os metros: primeiro o menor número de bobinas, depois a menor sobra */
BOB.escolher=function(rolos,metros){metros=+metros||0;const L=(rolos||[]).map(u=>({u,m:+u.metros||0})).filter(x=>x.m>0).sort((a,b)=>b.m-a.m);
  if(metros<=0)return {usa:[],cobre:0,falta:0,sobra:0};
  let acc=0,k=0;while(k<L.length&&acc<metros){acc+=L[k].m;k++}
  if(acc<metros)return {usa:L.map(x=>x.u),cobre:acc,falta:metros-acc,sobra:0};
  /* entre os conjuntos de k bobinas que cobrem, o de menor total (menos sobra) — busca exata com poda (n pequeno), senão o guloso */
  let best=L.slice(0,k),bestS=acc;
  if(L.length<=24){const pre=[];let s=0;for(let i=L.length-1;i>=0;i--){s+=L[i].m;pre[i]=s}
    const top=(i,c)=>{let t=0;for(let j=i;j<i+c&&j<L.length;j++)t+=L[j].m;return t}; /* maior soma possível com c bobinas a partir de i (lista decrescente) */
    const go=(i,c,sum,pick)=>{if(sum>=bestS&&c<k)return;if(c===k){if(sum>=metros&&sum<bestS){bestS=sum;best=pick.slice()}return}
      if(i>=L.length||L.length-i<k-c)return;if(sum+top(i,k-c)<metros)return;
      pick.push(L[i]);go(i+1,c+1,sum+L[i].m,pick);pick.pop();go(i+1,c,sum,pick)};go(0,0,0,[])}
  return {usa:best.map(x=>x.u),cobre:bestS,falta:0,sobra:bestS-metros}};
BOB.texto=function(metros,usa,compra,nom){const ls=(usa||[]).map(u=>+u.metros||0);const g={};ls.forEach(m=>g[m]=(g[m]||0)+1);
  const parte=Object.keys(g).length<=1?(ls.length?`${N0(ls.length)} ${ls.length===1?'bobina':'bobinas'} de ${N0(ls[0])} m`:''):`${N0(ls.length)} bobinas (${ls.map(m=>N0(m)+' m').join(' + ')})`;
  const cp=compra?`${N0(compra)} ${compra===1?'bobina':'bobinas'} de ${N0(nom)} m a comprar`:'';
  return `${N0(metros)} m → ${[parte,cp].filter(Boolean).join(' + ')||'nada'}`};
/* para cada linha (proposta × produto medido) da demanda: as bobinas que ela reserva, na ordem da demanda */
/* os metros vêm dos itens da proposta (a fonte): a lista memorizada do Q.demanda tem o qtd do cabo trocado por 1 pelo motor antigo */
BOB.metrosDe=(pr,pid)=>{const p=T(()=>get('propostas',pr),null);if(!p)return 0;let m=0;T(()=>blocosDe(p).forEach(b=>(b.itens||[]).forEach(l=>{if((l.substituto||l.produto_id)===pid)m+=+l.qtd||0})));return m};
BOB.plano=function(rows){const dem={};(rows||[]).forEach(x=>{if(medido(x.pid)){const k=x.pr+'|'+x.pid;if(dem[k]==null)dem[k]=BOB.metrosDe(x.pr,x.pid)}});
  const pool={};const out={};
  (rows||[]).filter(x=>medido(x.pid)).forEach(x=>{const k=x.pr+'|'+x.pid;const m=dem[k]||0;const inv=T(()=>invDe(x.pr),'');const pk=x.pid+'|'+inv;
    if(!pool[pk])pool[pk]=(S.db.unidades||[]).filter(u=>u.produto_id===x.pid&&livreBob(u,inv));
    if(x.ent>0){out[k]={metros:m,usa:[],compra:0,entregue:true,txt:N0(m)+' m → entregue'};return}
    const esc=BOB.escolher(pool[pk],m);const ids=new Set(esc.usa.map(u=>u.id));pool[pk]=pool[pk].filter(u=>!ids.has(u.id));
    const nom=BOB.nominal(x.pid);const compra=esc.falta>0?Math.ceil(esc.falta/nom):0;
    out[k]={metros:m,usa:esc.usa,compra,nominal:nom,sobra:esc.sobra,txt:BOB.texto(m,esc.usa,compra,nom)}});
  return out};
/* o motor: a linha medida pede N bobinas (as livres que cobrem + as a comprar), não "1" */
try{if(typeof Q==='object'&&typeof Q.compute==='function'&&!Q.compute.__v161d){const _qc=Q.compute;Q.compute=function(){const r=_qc.apply(Q,arguments);
    try{if(!r||!Array.isArray(r.rows)||r.__v161d)return r;const med=r.rows.filter(x=>medido(x.pid));if(med.length){const pl=BOB.plano(r.rows);
        med.forEach(x=>{const b=pl[x.pr+'|'+x.pid];if(!b)return;x.metros=b.metros;x.bobTxt=b.txt;x.bobinas=b.usa.map(u=>u.id);if(b.entregue)return;
          x.qtd=b.usa.length+b.compra;x.ent=0;x.alo=0;x.rsv=b.usa.length;x.ag=0;x.falta=b.compra})}
      r.__v161d=true}catch(e){console.error('v161d bobinas',e)}return r};Q.compute.__v161d=true}}catch(e){console.error('v161d Q.compute',e)}
/* a demanda por inventário passa a contar as bobinas pedidas (o motor antigo deixava o cabo de fora) */
try{if(typeof invDemand==='function'&&!invDemand.__v161d){const _id=invDemand;invDemand=function(inv){const d=_id.apply(this,arguments);try{if(!d||typeof d!=='object')return d;
      const rows=T(()=>Q.compute().rows,[]).filter(x=>medido(x.pid)&&T(()=>invDe(x.pr),'')===inv);if(!rows.length)return d;
      [...new Set(rows.map(x=>x.pid))].forEach(pid=>{const p=T(()=>prodInv(pid,inv),null);if(!p)return;['pedido','demanda'].forEach(k=>{if(typeof d[k]==='number')d[k]+=p.pedido});
        if(typeof d.acomprar==='number')d.acomprar+=p.acomprar;if(typeof d.cobre==='number')d.cobre+=p.cobre;if(typeof d.reservado==='number')d.reservado+=p.cobre;if(typeof d.aguardando==='number')d.aguardando+=p.aguardando})}catch(e){console.error('v161d invDemand',e)}return d};
    invDemand.__v161d=true;try{window.invDemand=invDemand}catch(e){}}}catch(e){}
BOB.textoDe=(pid,inv)=>{const rows=T(()=>Q.compute().rows,[]).filter(x=>x.pid===pid&&x.bobTxt&&(!inv||T(()=>invDe(x.pr),'')===inv));return rows.map(x=>x.bobTxt)};
/* prova em memória: põe um item de cabo numa proposta real só durante a conta (save desligado), tira e confere que a Base voltou igual */
BOB.teste=function(metrosLista,pidEscolhido){const real=u=>!!u.origem;
  const prod=pidEscolhido||T(()=>{const c={};(S.db.unidades||[]).forEach(u=>{if(medido(u.produto_id)&&livreBob(u))c[u.produto_id]=(c[u.produto_id]||0)+(real(u)?100:1)});return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]},null);
  if(!prod)return {erro:'nenhuma bobina livre no estoque'};
  const pr=(S.db.propostas||[]).find(p=>['vendida','em_obra'].includes(p.estado)&&!p.demo&&T(()=>(S.db.unidades||[]).some(u=>u.produto_id===prod&&livreBob(u,invDe(p.id))),false));if(!pr)return {erro:'nenhuma proposta no inventário das bobinas'};
  const inv=T(()=>invDe(pr.id),'');const antes=JSON.stringify(S.db);const _save=window.save,_save_=window.save_;let gravou=0;
  const bl0=pr.blocos;const inval=()=>{try{if(typeof window.__v153_invalida==='function')window.__v153_invalida()}catch(e){}};
  try{window.save=function(){gravou++};window.save_=function(){gravou++}}catch(e){}
  const res=[];try{(metrosLista||[120]).forEach(m=>{pr.blocos=(Array.isArray(bl0)?bl0:[]).concat([{id:'v161d_teste',nome:'teste em memória',itens:[{id:'v161d_l',produto_id:prod,qtd:m,preco_unit:0,custo_unit:0}],servicos:{}}]);inval();
      const row=T(()=>Q.compute().rows.find(x=>x.pr===pr.id&&x.pid===prod),null);const pi=T(()=>prodInv(prod,inv),{});const id=T(()=>invDemand(inv),{});
      res.push({metros:m,texto:row&&row.bobTxt,bobinasPedidas:row&&row.qtd,daBase:row&&row.rsv,aComprar:row&&row.falta,prodInv:{pedido:pi.pedido,cobre:pi.cobre,acomprar:pi.acomprar,livre:pi.livre,sobra:pi.sobra},invDemand_pedido:id.pedido,
        rolos:(row&&row.bobinas||[]).map(x=>{const u=get('unidades',x);return u?(u.serie||u.id)+' · '+N0(u.metros)+' m':x})})})}
  finally{if(bl0===undefined)delete pr.blocos;else pr.blocos=bl0;inval();try{window.save=_save;window.save_=_save_}catch(e){}}
  const livres=(S.db.unidades||[]).filter(u=>u.produto_id===prod&&livreBob(u,inv)).map(u=>+u.metros).sort((a,b)=>b-a);
  return {produto:T(()=>get('produtos',prod).nome,prod),proposta:pr.numero,inventario:inv,bobinasLivres:livres,nominal:BOB.nominal(prod),res,baseIgualDepois:JSON.stringify(S.db)===antes,gravou,
    depois:T(()=>{const row=Q.compute().rows.find(x=>x.pr===pr.id&&x.pid===prod);return row?'ficou na demanda (erro)':'nada na demanda'},'?')}};

/* ═══════════════════════════════ R3c · PERFIL DO PÓS-VENDA NO LOGIN (Usuários e permissões) ═══════════════════════════════ */
const ROLES_PV=['ADMINISTRADOR','GERENCIAL','LIDER','TECNICO'];
const ROLE_LB={ADMINISTRADOR:'Administrador',GERENCIAL:'Gerencial',LIDER:'Líder',TECNICO:'Técnico'};
const pessoa=id=>(S.db.pessoas||[]).find(p=>p&&p.id===id)||null;
const nomesDe=p=>[p.nome,p.nomeCompleto,...(p.apelidos||[])].filter(Boolean).map(nz);
/* a pessoa da Base que é este usuário do Pós-venda: o vínculo guardado, conferido pelo primeiro nome; senão e-mail; senão nome */
function pessoaDoAT(a){const pn=nz(a.name).split(' ')[0];const conf=p=>!!p&&nomesDe(p).some(n=>n.split(' ').includes(pn)||n===nz(a.name));
  const viaId=pessoa(a.pessoa_id);if(conf(viaId))return viaId;
  const em=nz(a.email);const P=S.db.pessoas||[];if(em){const x=P.find(p=>[p.email,p.emailAlternativo].some(e=>e&&nz(e)===em));if(conf(x))return x}
  const xs=P.filter(p=>nomesDe(p).includes(nz(a.name)));return xs.length===1?xs[0]:null}
function loginDa(p){const us=(S.db.usuarios||[]).filter(u=>u.pessoa_id===p.id);return us.find(u=>u.ativo&&!u.duplicado_de)||us[0]||null}
function novoLogin(p,a){const nome=p.nomeCompleto||p.nome||a.name;const base=nz(p.nome||nome).replace(/\s+/g,'.')||'pessoa';let login=base,i=2;while((S.db.usuarios||[]).some(x=>x.login===login))login=base+(i++);
  const u={id:T(()=>uid('usr'),'usr_'+Date.now().toString(36)),login,nome,email:p.email||a.email||'',setor:p.dep||'Pós-venda',cargo:p.cargo||'',grupos:['Pós Venda'],perfil:'tecnico',papel:'operador',ativo:true,excecoes:{},fonte:'Pós-venda › Usuários (perfil de acesso movido para Usuários e permissões, 06/11/2026)',pessoa_id:p.id};
  S.db.usuarios=S.db.usuarios||[];S.db.usuarios.push(u);return u}
/* migração única: cada linha de at_usuarios vira o perfil do Pós-venda do login da pessoa */
function migra(db,lista){const F=db._v161d=db._v161d||{};if(F.atMigrado)return 0;let n=0;const sem=[];const feitos=[];
  (lista||[]).forEach(a=>{if(!a||!a.name)return;const p=pessoaDoAT(a);
    if(!p){sem.push({id:a.id,name:a.name,email:a.email||'',role:a.role,active:a.active?1:0,motivo:a.pessoa_id?'o vínculo antigo apontava para '+((pessoa(a.pessoa_id)||{}).nome||a.pessoa_id)+', que não é esta pessoa':'nenhuma pessoa com este nome ou e-mail na Base'});n++;return}
    /* o e-mail do Pós-venda vai para a pessoa (Roni e Felipy só tinham e-mail lá) */
    const em=String(a.email||'').toLowerCase();if(em&&![p.email,p.emailAlternativo].some(e=>e&&String(e).toLowerCase()===em)){if(!p.email)p.email=em;else if(!p.emailAlternativo)p.emailAlternativo=em;else p.emailsPosvenda=Array.from(new Set([...(p.emailsPosvenda||[]),em]));n++}
    let u=loginDa(p);const criado=!u;if(!u)u=novoLogin(p,a);
    u.posvenda={perfil:a.role,id:a.id,nome:a.name,ativo:a.active?1:0,email:a.email||u.email||'',origem:'Pós-venda › Usuários (at_usuarios)',movidoEm:hoje()};n++;
    feitos.push({pessoa:p.id,nome:p.nome,login:u.login,perfil:a.role,loginCriado:criado})});
  F.atMigrado=hoje();F.atSemPessoa=sem;F.atFeitos=feitos;
  if(n)T(()=>log('usuarios','v161d','Pós-venda › Usuários: '+feitos.length+' perfis movidos para o login da pessoa (Usuários e permissões)'+(sem.length?' · '+sem.length+' sem pessoa na Base':'')));return n}
/* at_usuarios é uma LEITURA do login (Usuários e permissões) — não há segunda lista */
function derivados(){const out=[];(S.db.usuarios||[]).forEach(u=>{const pv=u&&u.posvenda;if(!pv||!pv.perfil)return;const p=pessoa(u.pessoa_id);
    out.push({id:pv.id||('pv_'+u.id),email:pv.email||u.email||'',name:pv.nome||(p&&p.nome)||u.nome,role:pv.perfil,active:(u.ativo!==false&&pv.ativo!==0)?1:0,pessoa_id:u.pessoa_id||null,login:u.login})});
  ((S.db._v161d||{}).atSemPessoa||[]).forEach(a=>out.push(Object.assign({},a,{pessoa_id:null,semPessoa:true})));return out}
D.pvUsuarios=derivados;
function aplicaLinha(row){if(!row)return;const L=S.db.usuarios||[];const F=S.db._v161d=S.db._v161d||{};
  let u=L.find(x=>x.posvenda&&x.posvenda.id===row.id)||(row.pessoa_id?L.find(x=>x.pessoa_id===row.pessoa_id):null)||(row.email?L.find(x=>x.email&&nz(x.email)===nz(row.email)):null);
  if(!u){const sp=(F.atSemPessoa||[]).find(x=>x.id===row.id);if(sp){Object.assign(sp,{name:row.name,email:row.email,role:row.role,active:row.active?1:0});return}
    const p=pessoaDoAT(row);if(!p){(F.atSemPessoa=F.atSemPessoa||[]).push({id:row.id||T(()=>uid('atu'),'atu_'+Date.now()),name:row.name,email:row.email||'',role:row.role,active:row.active?1:0,motivo:'cadastrado no Pós-venda sem pessoa na Base'});return}
    u=loginDa(p)||novoLogin(p,row)}
  u.posvenda=Object.assign({},u.posvenda||{},{perfil:row.role,id:row.id||(u.posvenda||{}).id||('pv_'+u.id),nome:row.name||(u.posvenda||{}).nome||u.nome,ativo:row.active?1:0,email:row.email||(u.posvenda||{}).email||u.email})}
function instala(db){if(!db||typeof db!=='object')return;const d=Object.getOwnPropertyDescriptor(db,'at_usuarios');if(d&&d.get&&d.get.__v161d)return;
  T(()=>migra(db,d&&Array.isArray(d.value)?d.value:[]),0);
  const g=function(){return db===S.db?derivados():[]};g.__v161d=true;
  Object.defineProperty(db,'at_usuarios',{configurable:true,enumerable:true,get:g,set(v){/* quem atribuir uma lista inteira (código antigo do Pós-venda) grava no login */
      if(!Array.isArray(v))return;const ids=new Set(v.map(x=>x&&x.id));(S.db.usuarios||[]).forEach(u=>{if(u.posvenda&&!ids.has(u.posvenda.id))delete u.posvenda});
      const F=S.db._v161d||{};F.atSemPessoa=(F.atSemPessoa||[]).filter(x=>ids.has(x.id));v.forEach(aplicaLinha)}})}
instala(S.db);
/* put('at_usuarios', …) do Pós-venda antigo também grava no login */
try{const _put=put;put=function(t,row,acao){if(t==='at_usuarios'&&row){aplicaLinha(row);T(()=>log('usuarios',row.id,acao||'perfil do Pós-venda'));return row}return _put.apply(this,arguments)};try{window.put=put}catch(e){}}catch(e){console.error('v161d put',e)}

/* quem está usando o sistema → o perfil do Pós-venda dele (do login) */
function atual(){const u=T(()=>me(),null);const pv=u&&u.posvenda&&u.posvenda.perfil&&u.ativo!==false&&u.posvenda.ativo!==0?u.posvenda:null;
  if(pv)return {role:pv.perfil,name:pv.nome||u.nome,id:pv.id,login:u.login,de:'login'};
  const nv=T(()=>UQ.nivel('posvisao'),3);const role=nv>=3?'ADMINISTRADOR':nv>=1?'GERENCIAL':'TECNICO';
  return {role,name:u?u.nome:'—',id:null,login:u?u.login:'',de:'perfil SYSTAAG'}}
D.pvAtual=atual;
D.irUsuarios=()=>{try{UQ.tab('membros')}catch(e){}location.hash='#/equipe';setTimeout(()=>{const el=document.getElementById('v161d-pv');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},250)};
function resumoBar(){const a=atual();const L=derivados().filter(x=>x.active);const c={};L.forEach(x=>c[x.role]=(c[x.role]||0)+1);
  const desc=['ADMINISTRADOR','GERENCIAL'].includes(a.role)?'Gestão: cadastra propostas, agenda, ajusta horários e relatórios.':a.role==='LIDER'?'Líder: Field Service e relatórios das suas O.S.; relatórios gerenciais de atendimentos.':'Técnico: apenas as suas O.S. e relatórios.';
  return `<div class="d-flex align-items-center gap-2 flex-wrap mb-3 v161d-pvbar" id="v161d-pvbar" style="font-size:12px"><span class="sub" style="font-size:11px;font-weight:700;letter-spacing:1px">PERFIL DE ACESSO</span><span class="chip ${a.role==='ADMINISTRADOR'?'pur':a.role==='GERENCIAL'?'info':''}">${E(a.role)} · ${E(a.name)}</span><span class="sub">${a.de==='login'?'do seu login':'você não tem perfil do Pós-venda; vem do seu perfil SYSTAAG'} · ${E(desc)}</span><span class="sub">· ${N0(L.length)} ativos = ${ROLES_PV.map(r=>N0(c[r]||0)+' '+ROLE_LB[r].toLowerCase()).join(' + ')}</span><a href="javascript:void 0" onclick="V161D.irUsuarios()" style="font-weight:600">editar em Base › Usuários e permissões ›</a></div>`}
function ligaRole(){const P=T(()=>COP.pos,null);if(!P||!P.role)return false;const R=P.role;if(R.__v161d)return true;
  R.role=()=>atual().role;
  R.userOf=r=>{const a=atual();if(a.role===r)return {id:a.id,name:a.name,role:r,active:1};return derivados().find(x=>x.active&&x.role===r)||{name:'—',role:r}};
  R.name=()=>atual().name;
  R.set=()=>{T(()=>toast('O perfil do Pós-venda vem do login — edite em Base › Usuários e permissões.'));D.irUsuarios()};R.setUser=R.set;
  R.bar=resumoBar;R.__v161d=true;
  /* cadastro de usuário do Pós-venda: só em Usuários e permissões */
  P.userForm=()=>D.irUsuarios();P.toggleUser=()=>D.irUsuarios();P.delUser=()=>D.irUsuarios();return true}
/* Pós-venda › Usuários: lista só de leitura, com o link para editar */
function ligaPosUsuarios(){if(typeof SCREENS!=='object'||typeof SCREENS.posusuarios!=='function')return false;if(SCREENS.posusuarios.__v161d)return true;const _u=SCREENS.posusuarios;
  SCREENS.posusuarios=function(){let h=_u.apply(this,arguments);if(typeof h!=='string')return h;try{
      h=h.replace(/<button class="btn-apple"[^>]*onclick="COP\.pos\.userForm\(\)"[^>]*>[\s\S]*?<\/button>/,`<a class="btn-apple" href="javascript:void 0" onclick="V161D.irUsuarios()"><i class="bi bi-pencil me-1"></i>editar em Base › Usuários e permissões</a>`);
      h=h.replace(/<td class="text-nowrap"><button class="iconbtn" onclick="COP\.pos\.userForm\('[^']*'\)"[\s\S]*?<\/td>/g,`<td class="text-nowrap"><a class="sub" href="javascript:void 0" onclick="V161D.irUsuarios()" style="font-size:12px">editar na Base ›</a></td>`);
      h=h.replace(/<button class="chip ([^"]*)" style="cursor:pointer;border:1px solid var\(--bd\)" onclick="COP\.pos\.toggleUser\('[^']*'\)" title="Alternar">/g,'<button class="chip $1" style="border:1px solid var(--bd)" disabled title="A situação vem do login em Usuários e permissões">');
      h=h.replace('Controle de acesso do Pós-venda. O e-mail precisa corresponder à conta usada no login.','Quem usa o Pós-venda e com que perfil — lido do login de cada pessoa em Base › Usuários e permissões (uma pessoa, um cadastro).');
    }catch(e){console.error('v161d posusuarios',e)}return h};Object.keys(_u).forEach(k=>{try{SCREENS.posusuarios[k]=_u[k]}catch(e){}});SCREENS.posusuarios.__v161d=true;return true}
/* Base › Usuários e permissões: o cartão "Perfil no Pós-venda" (onde se edita) */
D.pvSet=(login,role)=>{const u=(S.db.usuarios||[]).find(x=>x.login===login);if(!u)return;const antes=u.posvenda&&u.posvenda.perfil||'—';
  if(!role){delete u.posvenda}else u.posvenda=Object.assign({id:'pv_'+u.id,nome:u.nome,ativo:1,email:u.email||''},u.posvenda||{},{perfil:role});
  T(()=>log('usuarios',login,'perfil do Pós-venda '+antes+' → '+(role||'—')));T(()=>save());rr()};
D.pvAtivo=(login)=>{const u=(S.db.usuarios||[]).find(x=>x.login===login);if(!u||!u.posvenda)return;u.posvenda.ativo=u.posvenda.ativo===0?1:0;T(()=>log('usuarios',login,'Pós-venda '+(u.posvenda.ativo?'ativado':'desativado')));T(()=>save());rr()};
function cardPV(){const admin=T(()=>{const u=me();return u&&(u.perfil==='ti'||u.perfil==='diretoria')},true);const L=(S.db.usuarios||[]).filter(u=>u.posvenda&&u.posvenda.perfil);const sem=(S.db._v161d||{}).atSemPessoa||[];
  const ativos=L.filter(u=>u.ativo!==false&&u.posvenda.ativo!==0);const c={};ativos.forEach(u=>c[u.posvenda.perfil]=(c[u.posvenda.perfil]||0)+1);
  const sel=u=>`<select class="form-select form-select-sm" style="width:auto" ${admin?`onchange="V161D.pvSet('${J(u.login)}',this.value)"`:'disabled'}><option value="">— sem acesso ao Pós-venda —</option>${ROLES_PV.map(r=>`<option value="${r}"${u.posvenda&&u.posvenda.perfil===r?' selected':''}>${r}</option>`).join('')}</select>`;
  const rows=L.slice().sort((a,b)=>ROLES_PV.indexOf(a.posvenda.perfil)-ROLES_PV.indexOf(b.posvenda.perfil)||String(a.nome).localeCompare(String(b.nome),'pt-BR')).map(u=>{const p=pessoa(u.pessoa_id)||{};const at=u.ativo!==false&&u.posvenda.ativo!==0;
    return `<tr data-login="${E(u.login)}"><td><b>${E(p.nomeCompleto||p.nome||u.nome)}</b><div class="sub" style="font-size:11px">no Pós-venda: ${E(u.posvenda.nome||u.nome)} · pessoa ${E(u.pessoa_id||'—')}</div></td><td class="mono" style="font-size:12px">${E(u.login)}</td><td style="font-size:12px">${E(u.posvenda.email||u.email||'')}${p.email&&u.posvenda.email&&nz(p.email)!==nz(u.posvenda.email)?`<div class="sub" style="font-size:11px">pessoa: ${E(p.email)}</div>`:''}</td><td>${sel(u)}</td><td><button class="chip ${at?'ok':''}" style="border:1px solid var(--bd);${admin?'cursor:pointer':''}" ${admin?`onclick="V161D.pvAtivo('${J(u.login)}')"`:'disabled'}>${at?'ATIVO':'INATIVO'}</button></td></tr>`}).join('');
  const semL=sem.map(a=>`<tr style="background:rgba(253,126,20,.07)"><td><b>${E(a.name)}</b><div class="sub" style="font-size:11px">⚠ ${E(a.motivo||'sem pessoa na Base')}</div></td><td class="sub">sem login</td><td style="font-size:12px">${E(a.email)}</td><td><span class="chip">${E(a.role)}</span></td><td><span class="chip ${a.active?'ok':''}">${a.active?'ATIVO':'INATIVO'}</span></td></tr>`).join('');
  const sem_=(S.db.usuarios||[]).filter(u=>!u.posvenda&&u.ativo!==false).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const add=admin?`<div class="d-flex gap-2 align-items-center flex-wrap mt-2" style="font-size:12px"><span class="sub">Dar acesso ao Pós-venda a</span><select id="v161d-pvadd" class="form-select form-select-sm" style="width:auto"><option value="">escolha a pessoa…</option>${sem_.map(u=>`<option value="${E(u.login)}">${E(u.nome)} (${E(u.login)})</option>`).join('')}</select><select id="v161d-pvaddr" class="form-select form-select-sm" style="width:auto">${ROLES_PV.map(r=>`<option>${r}</option>`).join('')}</select><button class="btn-soft" onclick="const l=document.getElementById('v161d-pvadd').value;if(l)V161D.pvSet(l,document.getElementById('v161d-pvaddr').value)">Dar acesso</button></div>`:'';
  return `<div class="card p-3 mb-3" id="v161d-pv" data-n="${ativos.length}" style="border-left:4px solid #6f42c1"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><h6 class="m-0"><i class="bi bi-headset me-1"></i>Perfil no Pós-venda <span class="sub" style="font-weight:400;font-size:12px">· antes era uma lista à parte em Pós-venda › Usuários; agora é o login de cada pessoa</span></h6><span class="chip info">${N0(ativos.length)} ativos = ${ROLES_PV.map(r=>N0(c[r]||0)+' '+ROLE_LB[r].toLowerCase()).join(' + ')}</span></div>
   <div class="sub mb-2" style="font-size:12px">O Pós-venda lê daqui o perfil de quem entrou: ADMINISTRADOR e GERENCIAL fazem a gestão; LÍDER e TÉCNICO veem as suas O.S.</div>
   <div class="tblwrap"><table class="tbl" style="font-size:13px"><thead><tr><th>Pessoa (Base › Pessoas)</th><th>Login</th><th>E-mail</th><th>Perfil no Pós-venda</th><th>Situação</th></tr></thead><tbody>${rows}${semL}</tbody></table></div>${add}</div>`}
function ligaEquipe(){if(typeof SCREENS!=='object'||typeof SCREENS.equipe!=='function')return false;if(SCREENS.equipe.__v161d)return true;const _q=SCREENS.equipe;
  SCREENS.equipe=function(){let h=_q.apply(this,arguments);if(typeof h!=='string')return h;try{if(!/class="on" onclick="UQ\.tab\('membros'\)"/.test(h))return h;const i=h.indexOf('<div class="uq-tabs"');if(i<0)return h;const f=fimDiv(h,i);if(f<0)return h;return h.slice(0,f)+cardPV()+h.slice(f)}catch(e){console.error('v161d equipe',e);return h}};
  Object.keys(_q).forEach(k=>{try{SCREENS.equipe[k]=_q[k]}catch(e){}});SCREENS.equipe.__v161d=true;return true}
/* a tela da Equipe é desenhada direto pelo renderMain da camada de permissões: o cartão entra depois do desenho */
function cardNoMain(){try{if(!/^#\/equipe(\/|$)/.test(location.hash||''))return;const m=document.getElementById('main');if(!m||m.querySelector('#v161d-pv'))return;
  const on=m.querySelector('.uq-tabs button.on');if(!on||!/membros/.test(on.getAttribute('onclick')||''))return;const tabs=m.querySelector('.uq-tabs');if(tabs)tabs.insertAdjacentHTML('afterend',cardPV())}catch(e){console.error('v161d cardNoMain',e)}}

/* ═══════════════════════════════ R5 · VENDA METAS SEM OBRA → A OBRA DO CLIENTE (Bruno, 06/11 06:51, opção a) ═══════════════════════════════
   Cada venda METAS 2026 sem obra é ligada à obra EXISTENTE do mesmo cliente quando a ligação é clara (sigla da obra = iniciais
   do cliente + sobrenome igual, ou o nome do cliente — acento e grafia tolerados: "Beatriz E Thomas Fuchs" ↔ "BTF - Beatriz e
   Tomas Fuchs"), e só quando há UMA obra candidata. Várias candidatas ou nenhuma: lista de conferência em Base › Conferência
   Mestra, sem ligar, sem contar como em andamento, nenhuma obra criada. A venda ligada segue a situação da obra. Re-executável:
   nunca troca uma obra que alguém pôs no app; a ligação guarda a origem (p.obra_ligada.via = "ligada pelo nome do cliente"). */
const STOP=new Set(['e','de','da','do','dos','das','apto','apartamento','casa','ap','sr','sra','obra','residencia']);
const toks=s=>nz(String(s||'').replace(/\([^)]*\)/g,m=>' '+m.slice(1,-1)+' ')).split(' ').filter(t=>t&&t.length>=2&&!STOP.has(t)&&!/\d/.test(t));
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>1)return 9;const m=a.length,n=b.length;let prev=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}return prev[n]};
const tm=(a,b)=>a===b||a.replace(/h/g,'')===b.replace(/h/g,'')||(Math.min(a.length,b.length)>=5&&lev(a,b)<=1);
const siglaObra=o=>{const m=String(o.nome||'').match(/^\s*([A-Z]{2,6})\s+-\s+/);return m?m[1]:''};
function candidatas(p,obras){const st=toks(p.cliente_nome);if(!st.length)return [];const ini=st.map(t=>t[0]).join('').toUpperCase();const sob=st[st.length-1];
  return obras.filter(o=>{const ot=new Set([...toks(String(o.nome||'').replace(/^\s*[A-Z]{2,6}\s+-\s+/,'')),...toks(T(()=>get('clientes',o.cliente_id).nome,''))]);const oa=[...ot];
    const todos=st.every(t=>oa.some(x=>tm(t,x)));const sg=siglaObra(o);const porSigla=sg&&sg===ini&&oa.some(x=>tm(sob,x));return todos||porSigla})}
function ligaVendas(db){if(!db||db.af113_zero)return 0;const F=db._v161d=db._v161d||{};let n=0;
  const obras=(db.obras||[]).filter(o=>o&&!o.merged_into&&!o.inativo&&!o.legadoAT&&!o.demo);
  const res={ligadas:[],amb:[],sem:[],manual:[]};
  (db.propostas||[]).filter(p=>p&&p.fonte==='METAS 2026'&&!p.demo&&!p.excluida).forEach(p=>{
    const lg=p.obra_ligada;
    if(p.obra_id&&!(lg&&lg.obra===p.obra_id)){
      /* v163: o MESMO número em várias linhas do Painel (ex.: 12881 em Haras Larissa, Hotel Unique e ISP RJ - Irene Silva) — a importação pegou a primeira linha.
         A venda da METAS vai para a obra desse número cujo cliente é o cliente da venda (só quando há exatamente uma). Uma troca feita no app não é desfeita. */
      if(!(lg&&lg.desligadaNoApp)){const num=String(p.numero||'');const ids=new Set((db.propostas||[]).filter(x=>x&&x!==p&&String(x.numero||'')===num&&x.obra_id).map(x=>x.obra_id));ids.add(p.obra_id);
        if(ids.size>1){const cs=candidatas(p,obras.filter(o=>ids.has(o.id)));if(cs.length===1&&cs[0].id!==p.obra_id){const o=cs[0];const de=T(()=>get('obras',p.obra_id).nome,p.obra_id);p.obra_id=o.id;if(o.cliente_id)p.cliente_id=o.cliente_id;
          p.obra_ligada={obra:o.id,via:'mesmo número em várias linhas do Painel — ligada pela obra do cliente da venda (antes: '+de+')',regra:'Bruno 07/11/2026',em:hoje(),obraNome:o.nome};res.ligadas.push({p,o});n++;return}}}
      return} /* obra posta pela importação (Painel) ou no app: não se mexe */
    if(p.obra_id&&lg){const o=obras.find(x=>x.id===p.obra_id);if(o){res.ligadas.push({p,o});return}delete p.obra_ligada;p.obra_id=null;n++}
    if(lg&&lg.desligadaNoApp)return;
    const cs=candidatas(p,obras);
    if(cs.length===1){const o=cs[0];p.obra_id=o.id;if(!p.cliente_id&&o.cliente_id)p.cliente_id=o.cliente_id;p.obra_ligada={obra:o.id,via:'ligada pelo nome do cliente',regra:'Bruno 06/11/2026 (opção a)',em:hoje(),obraNome:o.nome};res.ligadas.push({p,o});n++}
    else if(cs.length>1)res.amb.push({p,cs});else res.sem.push({p})});
  const sit=o=>T(()=>COP.situacao(o),o.situacao||'');
  F.vendasObra={quando:hoje(),ligadas:res.ligadas.map(x=>({p:x.p.id,o:x.o.id})),amb:res.amb.map(x=>({p:x.p.id,cs:x.cs.map(o=>o.id)})),sem:res.sem.map(x=>x.p.id)};
  D._vendasObra=res;D._sit=sit;
  if(n){T(()=>log('propostas','v161d','METAS 2026 sem obra: '+n+' ligações pelo nome do cliente'));T(()=>save())}return n}
/* alguém trocou/limpou a obra no app: a ligação automática não volta */
try{const _p2=put;put=function(t,row,acao){if(t==='propostas'&&row&&row.obra_ligada&&row.obra_id!==row.obra_ligada.obra){row.obra_ligada=Object.assign({},row.obra_ligada,{desligadaNoApp:hoje()})}return _p2.apply(this,arguments)};try{window.put=put}catch(e){}}catch(e){}
D.vendasObra=()=>{ligaVendas(S.db);const r=D._vendasObra||{ligadas:[],amb:[],sem:[]};const sit=D._sit||(()=>'');const v=xs=>xs.reduce((a,x)=>a+(+x.p.valor_venda||0),0);
  const and=r.ligadas.filter(x=>sit(x.o)==='Em andamento'),conc=r.ligadas.filter(x=>sit(x.o)==='Concluída'),outra=r.ligadas.filter(x=>!['Em andamento','Concluída'].includes(sit(x.o)));
  const pelaRegra=r.ligadas.filter(x=>x.p.obra_ligada);
  return {r,and,conc,outra,pelaRegra,cont:{ligadas:r.ligadas.length,vLigadas:v(r.ligadas),emAndamento:and.length,vAnd:v(and),concluida:conc.length,vConc:v(conc),outraSituacao:outra.length,vOutra:v(outra),ambiguas:r.amb.length,vAmb:v(r.amb),semObra:r.sem.length,vSem:v(r.sem)}}};
function cardVendas(){const X=D.vendasObra();const c=X.cont;const row=(x,extra)=>`<div style="font-size:12px"><b>nº ${E(x.p.numero)}</b> · ${E(x.p.cliente_nome)} · ${R0(x.p.valor_venda)}${extra||''}</div>`;
  const ob=o=>`<a href="#/obras/${E(o.id)}">${E(o.nome)}</a> <span class="sub">(${E(D._sit(o)||'—')})</span>`;
  return `<div class="card p-3 mb-3" id="v161d-vendas" data-lig="${c.ligadas}" data-amb="${c.ambiguas}" data-sem="${c.semObra}" data-conc="${c.concluida}"><h6 class="m-0 mb-1">Vendas METAS 2026 sem obra → obra do cliente <span class="chip info">${N0(c.ligadas)} ligadas · ${R0(c.vLigadas)}</span></h6>
   <div class="sub mb-2" style="font-size:12px">Regra do Bruno (06/11, opção a): a venda sem obra vai para a obra existente do mesmo cliente quando há UMA obra clara (nome do cliente ou sigla + sobrenome; acento e grafia tolerados). Várias candidatas ou nenhuma: ficam aqui, sem ligar, fora do "em andamento". Nenhuma obra é criada. Ligação feita aqui leva "ligada pelo nome do cliente"; obra trocada no app não é desfeita.</div>
   <div><b>Ligadas a obra em andamento</b> <span class="chip">${N0(c.emAndamento)} · ${R0(c.vAnd)}</span>${X.and.map(x=>row(x,' → '+ob(x.o)+(x.p.obra_ligada?'':' <span class="sub">· ligação anterior</span>'))).join('')}</div>
   <div class="mt-2"><b>Venda 2026 em obra concluída</b> <span class="chip warn">${N0(c.concluida)} · ${R0(c.vConc)}</span> <span class="sub" style="font-size:12px">não é valor em andamento</span>${X.conc.map(x=>row(x,' → '+ob(x.o))).join('')}</div>
   ${X.outra.length?`<div class="mt-2"><b>Ligadas a obra em outra situação</b> <span class="chip">${N0(c.outraSituacao)} · ${R0(c.vOutra)}</span>${X.outra.map(x=>row(x,' → '+ob(x.o))).join('')}</div>`:''}
   <div class="mt-2"><b>Ambíguas — várias obras candidatas (não ligadas)</b> <span class="chip warn">${N0(c.ambiguas)} · ${R0(c.vAmb)}</span>${X.r.amb.map(x=>row(x,' · candidatas: '+x.cs.map(ob).join(' · '))).join('')}</div>
   <div class="mt-2"><b>Sem obra do cliente (não ligadas)</b> <span class="chip">${N0(c.semObra)} · ${R0(c.vSem)}</span>${X.r.sem.map(x=>row(x,` <span class="sub">· ${E(x.p.linha||'')} · ${E(x.p.fonte_linha||'')}</span>`)).join('')}</div></div>`}
function ligaMestra(){if(typeof SCREENS!=='object'||typeof SCREENS.dbmestra!=='function')return false;if(SCREENS.dbmestra.__v161d)return true;const _m=SCREENS.dbmestra;
  SCREENS.dbmestra=function(){let h=_m.apply(this,arguments);if(typeof h!=='string')return h;try{const c=cardVendas();const i=h.indexOf('<div class="card p-3 mb-3" id="v161-conf">');return i>=0?h.slice(0,i)+c+h.slice(i):h+c}catch(e){console.error('v161d mestra',e);return h}};
  Object.keys(_m).forEach(k=>{try{SCREENS.dbmestra[k]=_m[k]}catch(e){}});SCREENS.dbmestra.__v161d=true;return true}
T(()=>ligaVendas(S.db),0);

/* ═══════════════════════════════ ligação ═══════════════════════════════ */
function css(){if(document.getElementById('v161d-css'))return;const s=document.createElement('style');s.id='v161d-css';s.textContent=`
.v161d-tag{display:inline-block;font-size:10px;font-weight:600;padding:1px 7px;border-radius:999px;background:rgba(25,135,84,.13);color:#146c43;white-space:nowrap;cursor:pointer}
.v161d-flag{color:#a05a00}
.v161-modal{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2000;display:flex;align-items:center;justify-content:center}.v161-mcard{width:min(760px,94vw);max-height:86vh;overflow:auto}
.v161-ponte{font-size:12.5px;line-height:1.7;color:var(--bs-secondary-color,#555)}.v161-ponte u{cursor:pointer;text-decoration-style:dotted}`;document.head.appendChild(s)}
function liga(){css();const a=ligaPipeline(),b=ligaGaveta(),c=ligaRole(),d=ligaPosUsuarios(),e=ligaEquipe(),f=ligaMestra();return a&&b&&c&&d&&e&&f}
if(!liga()){let n=0;const iv=setInterval(()=>{if(liga()||++n>60)clearInterval(iv)},250)}
try{const _rm=window.renderMain;window.renderMain=function(){try{instala(S.db);ligaRole();if(!(S.db._v161d||{}).vendasObra)ligaVendas(S.db)}catch(e){}const r=_rm.apply(this,arguments);cardNoMain();return r}}catch(e){}
T(()=>{const k=route().k;if(['pipeline','equipe','posusuarios'].includes(k)||/^pos/.test(k))renderMain()});
})();
