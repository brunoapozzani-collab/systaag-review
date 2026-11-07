/* =====================================================================================================
   v157 · GESTÃO (abas que a v156 não cobriu) + VISÃO EXECUTIVA — cada número clicável cai filtrado (05/11/2026)
   Regra do Bruno: todo número clicável abre a tela de destino já filtrada nos registros que o formam; dois números
   que se subtraem na mesma tela mostram a ponte, com cada termo clicável e o porquê.
   O que estava errado (varredura de 05/11, clique a clique):
     §1 Metas & Faturamento — os % da meta (36,7% · 46,4% · 46,6% · 4,8% · 16,8%) eram portas "adivinhadas" pela v138
        e abriam Financeiro › DRE (São Paulo e Rio caíam os dois em DRE/TAAG); o realizado não tinha porta; nenhuma
        ponte entre o Grupo e as linhas. Agora: cada linha abre as propostas vendidas dela; ponte R$ e meta.
     §2 Insights — "Grupo em 36,7%" abria DRE › Acústica; "Conversão 38,0%" abria todas as 576 propostas. Agora: as
        propostas vendidas / as 694 negociações decididas (com 264 + 430 clicáveis); os consultores citados também.
     §3 Boutique — "visitas / fechadas / R$" sem porta e a legenda do status sem "Finalizado" (15 ≠ ativo + fechado).
     §4 Pós-vendas — nenhum número abria nada.
     §5 "Mostrar tudo ✕" depois de um número de propostas deixava o filtro da própria lista (ano, frente, filial) ligado.
   Aprovar / Carteira / Dados: as abas de cima da Gestão não existem mais na tela (index.html, _gestao10 força
   S.gTab='dash' e tira a barra de abas) — não há número delas para clicar.
   Só apresentação/navegação: nenhum dado, nenhuma regra de número muda.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v157g)return;window.__v157g=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R$=v=>'R$ '+(Math.round(+v||0)).toLocaleString('pt-BR');
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const ano=()=>String((S.db.meta&&S.db.meta.ano)||new Date().getFullYear());
const V=window.V157=window.V157||{};
const W=()=>window.V156||{};
const tot=p=>T(()=>M.total(p),+p.valor_venda||0);
const fil=p=>T(()=>FIL.daProposta(p),'');
const temCons=(p,c)=>!c||(p.consultores||[]).some(x=>String(x).toLowerCase().includes(String(c).toLowerCase().split(' ')[0]));
const subProps=()=>{const f=S.comF||{};return (S.db.propostas||[]).filter(p=>(!f.frente||p.linha===f.frente)&&temCons(p,f.cons))};
const vendidaP=p=>['vendida','em_obra','concluida'].includes(p.estado)&&!p.demo;
const linhaK=p=>p.linha==='taag'?(fil(p)==='RJ'?'taag_rj':'taag_sp'):(p.linha||'outra');
const LINLB={'':'Grupo TAAG',taag_sp:'TAAG · São Paulo',taag_rj:'TAAG · Rio de Janeiro',acustica:'Acústica',focal:'Focal (FPBN)',posvenda:'Pós-venda (AT)'};
const KDE={};Object.keys(LINLB).forEach(k=>KDE[LINLB[k]]=k);
const door=(on,html,ti)=>`<a href="javascript:void 0" class="vx-door" data-v157="1" onclick="event.stopPropagation();${on}"${ti?` title="${E(ti)}"`:''}>${html}</a>`;
const DEC=v=>String(v).replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
/* negociações no mesmo recorte que a Gestão usa (frente/consultor do filtro de cima) */
const negsG=()=>{const f=S.comF||{};return (S.db.negociacoes||[]).filter(n=>(!f.frente||n.frente===f.frente)&&(!f.cons||T(()=>negCons(n).includes(f.cons),true)))};

/* propostas de uma lista qualquer → Comercial › Propostas filtrada nelas (o mesmo motor da v156) */
V.props=function(ps,lb,nativo){const w=W();if(w.propostas)return w.propostas(ps,lb,nativo||{});location.hash='#/propostas'};
V.propsDe=function(k,lb){const ps=V._sets[k]?V._sets[k]():[];V.props(ps,N0(ps.length)+' · '+lb)};
V._sets={
  vendTodos:()=>subProps().filter(vendidaP),
  concl:()=>subProps().filter(p=>vendidaP(p)&&p.estado==='concluida'),
  emobra:()=>subProps().filter(p=>vendidaP(p)&&p.estado==='em_obra'),
  upg:()=>subProps().filter(p=>p.linha==='posvenda'),
  aguard:()=>subProps().filter(p=>p.aprov&&p.aprov.status==='aguardando'),
  semAno:()=>subProps().filter(p=>vendidaP(p)&&!String(p.vendida_em||'').startsWith(ano()))};

/* ───────── §1 Metas & Faturamento ───────── */
function metasHTML(h){
  const vend=subProps().filter(p=>vendidaP(p)&&String(p.vendida_em||'').startsWith(ano()));
  const g={'':{n:0,v:0}};vend.forEach(p=>{const k=linhaK(p);g[k]=g[k]||{n:0,v:0};g[k].n++;g[k].v+=tot(p);g[''].n++;g[''].v+=tot(p)});
  /* cada linha da bateria: a linha inteira (realizado e %) abre as propostas vendidas dela */
  h=h.replace(/<div class="d-flex align-items-center gap-3 py-2" style="border-top:1px solid var\(--bd\)"><span style="width:150px;font-size:13px"><b>([^<]+)<\/b>/g,(m,l)=>{const k=KDE[DEC(l)];if(k==null)return m;const x=g[k]||{n:0};
    return `<div class="d-flex align-items-center gap-3 py-2" data-v157m="${k}" style="border-top:1px solid var(--bd);cursor:pointer" onclick="event.stopPropagation();V156.gestaoProp('${k}')" title="abrir as ${N0(x.n)} propostas vendidas ${ano()}${k?' · '+E(DEC(l)):''}"><span style="width:150px;font-size:13px"><b>${l}</b>`});
  /* o realizado e o % ficam sublinhados (são a porta), sem a porta adivinhada da v138 */
  h=h.replace(/(<span style="position:absolute;left:8px;top:2px;font-size:12px;font-weight:700)(">[\d.,]+%<\/span>)/g,'$1;text-decoration:underline dotted" data-v138f="1$2');
  h=h.replace(/(<span style="width:120px;text-align:right;font-size:13px"><b)(>[^<]*<\/b><div class="sub" style="font-size:11px">realizado<\/div>)/g,'$1 style="text-decoration:underline dotted" data-v138f="1"$2');
  /* ponte: Grupo = soma das linhas (R$ e meta) */
  const mt=S.db.metas||{};const metaTot=((S.db.meta&&+S.db.meta.valor)||+mt.empresa||['taag','acustica','focal','posvenda'].reduce((a,k)=>a+(+mt[k]||0),0));
  const ks=['taag_sp','taag_rj','acustica','focal','posvenda'];const outra=Object.keys(g).filter(k=>k&&!ks.includes(k));
  const sv=ks.concat(outra).reduce((a,k)=>a+((g[k]||{}).v||0),0);const sm=ks.reduce((a,k)=>a+(+mt[k]||0),0);
  const termo=k=>door(`V156.gestaoProp('${k}')`,`${E(LINLB[k]||k)} <b>${R$((g[k]||{}).v||0)}</b>`,`abrir as ${N0((g[k]||{}).n||0)} propostas`);
  const okV=Math.round(sv)===Math.round(g[''].v);const okM=Math.round(sm)===Math.round(metaTot);
  const ponte=`<div class="sub mt-2" data-v157ponte="metas" style="font-size:12px;line-height:1.6"><b>Ponte do realizado:</b> ${door(`V156.gestaoProp('')`,`Grupo <b>${R$(g[''].v)}</b>`,'abrir as '+N0(g[''].n)+' propostas vendidas')} = ${ks.concat(outra).map(termo).join(' + ')} ${okV?'<span style="color:#198754">✓</span>':`<span style="color:#dc3545">· diferença ${R$(g[''].v-sv)}</span>`}<br><b>Ponte da meta:</b> <span data-v138f="1">Grupo <b data-v138f="1">${R$(metaTot)}</b> = ${ks.map(k=>`${E(LINLB[k])} ${R$(+mt[k]||0)}`).join(' + ')}</span> ${okM?'<span style="color:#198754">✓</span>':`<span style="color:#dc3545">· a meta do Grupo (Base › Listas & regras) difere da soma das linhas em ${R$(metaTot-sm)}</span>`} · falta para a meta: ${R$(Math.max(0,metaTot-g[''].v))} = meta − realizado</div>`;
  const a=h.indexOf('ATINGIMENTO DA META POR UNIDADE');if(a>=0){const z=h.indexOf('<div class="col-lg-4">',a);if(z>0){const cut=h.lastIndexOf('</div></div>',z);if(cut>a)h=h.slice(0,cut)+ponte+h.slice(cut)}}
  /* donut "Vendido do grupo": o realizado abre as propostas */
  h=h.replace(/Realizado <b>([^<]+)<\/b> de/,(m,v)=>`Realizado ${door(`V156.gestaoProp('')`,`<b>${v}</b>`,'abrir as '+N0(g[''].n)+' propostas vendidas')} de`);
  return h}

/* ───────── §2 Insights ───────── */
function insightsHTML(h){
  const N=negsG();const fech=N.filter(n=>n.resultado==='fechada').length,perd=N.filter(n=>n.resultado==='perdida').length;
  const vAll=V._sets.vendTodos();const vAno=vAll.filter(p=>String(p.vendida_em||'').startsWith(ano()));
  /* "Grupo em X% da meta": as vendidas que a frase soma (todas as vendidas, de qualquer ano) */
  /* a frase soma TODAS as vendidas; as que não têm data de venda valem R$ 0 hoje — então o número é o das vendidas do ano,
     e a ponte diz isso (sem isso o leitor vê 544 na lista e 104 na Metas) */
  const fora=vAll.filter(p=>!String(p.vendida_em||'').startsWith(ano()));const vFora=fora.reduce((a,p)=>a+tot(p),0);
  h=h.replace(/Grupo em <b>([\d.,]+)%<\/b> da meta \(([^)]*)\)\./,(m,p,mid)=>{const zero=Math.round(vFora)===0;const on=zero?`V156.gestaoProp('')`:`V157.propsDe('vendTodos','propostas vendidas (todos os anos)')`;
    const nAb=zero?vAno.length:vAll.length;
    const pt=fora.length?` <span class="sub" style="font-size:12px">· ${zero?`= ${door(`V156.gestaoProp('')`,N0(vAno.length)+' propostas vendidas em '+ano())}; as outras ${door(`V157.propsDe('semAno','propostas vendidas sem data de venda em ${ano()}')`,N0(fora.length)+' vendidas')} não têm venda em ${ano()} e valem R$ 0`:`${N0(vAll.length)} vendidas = ${N0(vAno.length)} de ${ano()} + ${N0(fora.length)} de outros anos (${R$(vFora)})`}</span>`:'';
    return `Grupo em ${door(on,`<b>${p}%</b>`,'abrir as '+N0(nAb)+' propostas vendidas que formam o número')} da meta (${door(on,mid)}).${pt}`});
  /* as lacunas por linha: "Acústica (5%)" → as propostas vendidas da linha */
  [['acustica','Acústica'],['focal','Focal (FPBN)'],['focal','Focal'],['posvenda','Pós-venda (AT)'],['posvenda','Pós-venda']].forEach(([k,l])=>{
    const re=new RegExp('(\\s|, |>)('+l.replace(/[()]/g,'\\$&')+') \\((-?[\\d.,]+|NaN|Infinity)%\\)');h=h.replace(re,(m,pre,lb,v)=>{const n=subProps().filter(p=>vendidaP(p)&&String(p.vendida_em||'').startsWith(ano())&&linhaK(p)===k).length;return n?`${pre}${door(`V156.gestaoProp('${k}')`,`${lb} (${v}%)`,'abrir as '+n+' propostas vendidas de '+lb)}`:m})});
  /* conversão = ganhas ÷ perdidas (Bruno, 07/11/2026) */
  h=h.replace(/Conversão do pipeline <b>([^<]*)<\/b> \((\d+) ganhas, (\d+) perdidas\)/,(m,p,g,pd)=>`Conversão do pipeline ${door(`V156.negF({res:'decidida'})`,`<b>${p}</b>`,`abrir as ${N0(fech+perd)} negociações decididas (${g} ganhas + ${pd} perdidas)`)} (${door(`V156.negF({res:'fechada'})`,`${g} ganhas`)}, ${door(`V156.negF({res:'perdida'})`,`${pd} perdidas`)} · conversão = ${g} ganhas ÷ ${pd} perdidas)`);
  /* "Carteira concentrada: Edson (291) e Renata (253)" → as negociações de cada um */
  const top=T(()=>count(N,n=>n.consultor),[]).slice(0,2);
  top.forEach(([c,v])=>{const s=`${E(c)} (${v})`;const i=h.indexOf(s);const j=h.indexOf(c+' ('+v+')');const at=i>=0?i:j;const raw=i>=0?s:c+' ('+v+')';if(at<0)return;
    h=h.slice(0,at)+door(`V156.negF({consultor:'${J(c)}'})`,raw,`abrir as ${v} negociações de ${c}`)+h.slice(at+raw.length)});
  /* propostas paradas na aprovação interna */
  const ag=V._sets.aguard().length;h=h.replace(/<li>(\d+) propostas paradas na aprovação interna/,(m,n)=>+n?`<li>${door(`V157.propsDe('aguard','propostas aguardando aprovação interna')`,n+' propostas')} paradas na aprovação interna`:m);
  return h}

/* ───────── §3 Boutique ───────── */
function boutiqueHTML(h){
  const fo=(S.db.negociacoes||[]).filter(n=>n.frente==='focal');const at=fo.filter(n=>!n.resultado).length,fc=fo.filter(n=>n.resultado==='fechada').length;
  const pe=fo.filter(n=>n.resultado==='perdida').length,fu=fo.filter(n=>n.resultado&&n.resultado!=='fechada'&&n.resultado!=='perdida').length;
  const nf=(F,txt,ti)=>/^(<b>)?0(<\/b>)?$/.test(String(txt).trim())||/^<b>0<\/b> visitas$/.test(txt)?txt:door(`V156.negF(${E(JSON.stringify(F))})`,txt,ti);
  const a=h.indexOf('VISITAS &amp; CONVERSÃO')>=0?h.indexOf('VISITAS &amp; CONVERSÃO'):h.indexOf('VISITAS & CONVERSÃO');
  if(a>=0){const z=h.indexOf('POR INTERESSE',a);let seg=h.slice(a,z>0?z:h.length);
    seg=seg.replace(/<b style="font-size:26px">(\d+)<\/b><div class="sub" style="font-size:11px">visitas<\/div>/,(m,n)=>+n?`<b style="font-size:26px">${nf({frente:'focal'},n,'abrir as '+n+' visitas (negociações da Focal)')}</b><div class="sub" style="font-size:11px">visitas</div>`:m);
    seg=seg.replace(/<b style="font-size:26px">(\d+)<\/b><div class="sub" style="font-size:11px">fechadas<\/div>/,(m,n)=>+n?`<b style="font-size:26px">${nf({frente:'focal',res:'fechada'},n,'abrir as '+n+' visitas fechadas')}</b><div class="sub" style="font-size:11px">fechadas</div>`:m);
    seg=seg.replace(/<b style="font-size:26px">(R\$[^<]*)<\/b><div class="sub" style="font-size:11px">([^<]*% da meta)<\/div>/,(m,v,p)=>`<b style="font-size:26px">${door(`V156.gestaoProp('focal')`,v,'abrir as propostas vendidas da Focal')}</b><div class="sub" style="font-size:11px">${door(`V156.gestaoProp('focal')`,p.replace(/(\d)\.(\d)/,'$1,$2'))}</div>`);
    /* POR STATUS: a legenda não tinha "Finalizado" — o total não fechava */
    seg=seg.replace(/<div><b>(\d+)<\/b> · Ativo<\/div><div><b>(\d+)<\/b> · Fechado<\/div>/,(m,x,y)=>`<div>${nf({frente:'focal',res:'jogo'},`<b>${x}</b>`)} · Ativo</div><div>${nf({frente:'focal',res:'fechada'},`<b>${y}</b>`)} · Fechado</div><div>${nf({frente:'focal',res:'perdida'},`<b>${pe}</b>`)} · Perdido</div>${fu?`<div>${nf({frente:'focal',res:'futuro'},`<b>${fu}</b>`)} · No futuro</div>`:''}<div class="sub" style="font-size:10.5px;margin-top:4px">Ponte: ${nf({frente:'focal'},`<b>${N0(fo.length)}</b> visitas`)} = ${x} ativas + ${y} fechadas + ${pe} perdidas${fu?' + '+fu+' no futuro':''} ${at+fc+pe+fu===fo.length?'<span style="color:#198754">✓</span>':''}</div>`);
    h=h.slice(0,a)+seg+h.slice(z>0?z:h.length)}
  /* POR CONSULTOR (visitas): cada barra abre as visitas do consultor */
  const c0=h.indexOf('POR CONSULTOR',h.indexOf('POR INTERESSE')>=0?h.indexOf('POR INTERESSE'):0);
  if(c0>=0){const z=h.indexOf('<div class="col-lg-4">',c0);let seg=h.slice(c0,z>0?z:h.length);
    seg=seg.replace(/<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px"><span style="([^"]*)" title="([^"]*)">([^<]*)<\/span>([\s\S]*?)<b style="width:70px;text-align:right">(\d[\d.]*)<\/b><\/div>/g,(m,st,ti,lb,mid,nn)=>{if(!+nn)return m;
      return `<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();V156.negF(${E(JSON.stringify({frente:'focal',consultor:DEC(ti)}))})" title="abrir as ${nn} visitas de ${ti}"><span style="${st}" title="${ti}">${lb}</span>${mid}<b style="width:70px;text-align:right;text-decoration:underline dotted">${nn}</b></div>`});
    h=h.slice(0,c0)+seg+h.slice(z>0?z:h.length)}
  return h}

/* ───────── §4 Pós-vendas ───────── */
function posvHTML(h){
  const a=h.indexOf('INDICADORES REAIS');if(a<0)return h;const z=h.indexOf('ORDENS DE SERVIÇO',a);let seg=h.slice(a,z>0?z:h.length);
  const M_={'concluídos':['concl','propostas vendidas concluídas'],'em execução':['emobra','propostas vendidas em obra'],'upgrades':['upg','propostas de upgrade (linha Pós-venda)']};
  seg=seg.replace(/<b style="font-size:24px">(\d+)<\/b><div class="sub" style="font-size:11px">([^<]+)<\/div>/g,(m,n,l)=>{const k=M_[l];if(!k||!+n)return m;
    return `<b style="font-size:24px">${door(`V157.propsDe('${k[0]}','${J(k[1])}')`,n,'abrir as '+n+' '+k[1])}</b><div class="sub" style="font-size:11px">${l}</div>`});
  seg=seg.replace(/<b style="font-size:24px">(\d+)<\/b><div class="sub" style="font-size:11px">assistências<\/div>/,(m,n)=>+n?`<b style="font-size:24px">${door(`V157.assist()`,n,'abrir as '+n+' unidades em assistência')}</b><div class="sub" style="font-size:11px">assistências</div>`:m);
  return h.slice(0,a)+seg+h.slice(z>0?z:h.length)}
V.assist=function(){const us=(S.db.unidades||[]).filter(u=>u.estado==='assistencia');const g={};us.forEach(u=>{(g[u.produto_id]=g[u.produto_id]||[]).push(u)});const pids=Object.keys(g);
  const nm=pid=>T(()=>{const p=get('produtos',pid)||{};return (p.nome||pid)+(p.marca?' · '+p.marca:'')},pid);
  W().ir({path:'#/estoque',lb:N0(us.length)+' un. · em assistência',unid:'produtos',ponte:`${N0(us.length)} un. em ${N0(pids.length)} produtos`,recs:pids.map(pid=>({ids:[pid],name:nm(pid),h:'#/produto/'+pid})),
    nav(){try{S.estCat=null;S.estSit=null;S.plF={}}catch(e){}location.hash='#/estoque';try{renderMain()}catch(e){}}})};

/* ───────── §6 Visão executiva (Início › Comercial): "+ 2 outros 5" / "+ 20 outros 28" abriam as 65 abertas ───────── */
const pNome=id=>{const p=(S.db.parceiros||[]).find(x=>x.id===id||String(x.crm_id)===String(id));return p?p.nome:null};
const parcNeg=n=>{const ps=n.parceiros||{};const id=ps.indicador||ps.arquitetura||ps.gerenciadora;return id?(pNome(id)||('Parceiro '+id)):'Sem parceiro (direto)'};
V.outros=function(kind,keys){const ks=new Set(keys);const key=n=>kind==='cons'?(n.consultor||'Sem consultor'):parcNeg(n);
  const xs=(S.db.negociacoes||[]).filter(n=>!n.resultado&&!ks.has(key(n)));const grp={};xs.forEach(n=>{grp[key(n)]=1});
  W().ir({path:'#/pipeline',lb:N0(xs.length)+' · negociações abertas · '+(kind==='cons'?'outros consultores':'outros parceiros'),unid:'negociações',
    ponte:`${N0(xs.length)} = as abertas de ${Object.keys(grp).map(E).join(', ')}`,recs:xs.map(n=>({ids:[n.id],name:n.codinome||n.cliente_nome||n.id})),nav(){location.hash='#/pipeline'}})};
function posHome(){if(!/^#\/home/.test(location.hash||'#/home')&&(location.hash||'')!=='')return;const r=document.getElementById('v130_root');if(!r)return;
  r.querySelectorAll('[onclick*="v149:neg"]').forEach(e=>{if(e.__v157)return;const t=(e.textContent||'').replace(/\s+/g,' ').trim();if(!/^\+ \d[\d.]* outros/.test(t))return;
    const par=e.parentElement;if(!par)return;const sib=[...par.querySelectorAll('[onclick*="v149:neg"]')].filter(x=>x!==e);let kind=null;const keys=[];
    sib.forEach(x=>{const m=/res=aberta&(cons|parc)=([^'"]*)'/.exec((x.getAttribute('onclick')||'').replace(/&amp;/g,'&'));if(m){kind=m[1];keys.push(m[2].replace(/\\'/g,"'"))}});
    if(!kind)return;e.__v157=1;e.setAttribute('data-v157k',JSON.stringify(keys));e.setAttribute('onclick',`event.stopPropagation();V157.outros('${kind}',JSON.parse(this.getAttribute('data-v157k')))`)})}
(function(){const P=W().pos;if(Array.isArray(P))P.push(posHome);else{let n=0;const iv=setInterval(()=>{const Q=W().pos;if(Array.isArray(Q)){Q.push(posHome);clearInterval(iv)}else if(++n>40)clearInterval(iv)},500)}})();

/* Visão executiva › Estoque: o cartão mostra o custo do motor do Painel (só as unidades que têm custo lá, ex.: 880 de 905);
   a gaveta soma também as sem custo no motor pelo custo do produto (R$ 6.283.110,57 × 6.272.482,97 no cartão) — a gaveta
   agora mostra a ponte entre os dois números */
const brl=t=>{const m=/R\$\s?([\d.]+,\d{2})/.exec(t||'');return m?+m[1].replace(/\./g,'').replace(',','.'):null};
const R2=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function posGaveta(){const pn=document.getElementById('v155-pn');if(!pn||pn.__v157)return;const u=W().ult||{};if(u.k!=='v149:terr'||u.a==='semcusto')return;
  const el=[...pn.querySelectorAll('div,span,p')].find(x=>!x.children.length&&/ao custo de compra/.test(x.textContent||''));if(!el)return;const vD=brl(el.textContent);
  const tile=[...document.querySelectorAll(`#v130_root [onclick*="v149:terr"]`)].find(x=>(x.getAttribute('onclick')||'').indexOf(`'${u.a}')`)>=0&&brl(x.textContent)!=null);if(!tile||vD==null)return;
  const vT=brl(tile.textContent);if(vT==null||Math.abs(vD-vT)<0.005)return;pn.__v157=1;const d=document.createElement('div');d.className='v157-ponte';d.style.cssText='font-size:12px;margin-top:4px;opacity:.85';
  d.innerHTML=`Ponte com o cartão: ${R2(vD)} = ${R2(vT)} do cartão (custo do motor do Painel) + ${R2(vD-vT)} das unidades sem custo no motor do Painel, aqui pelo custo do produto · <a href="javascript:void 0" style="color:inherit;text-decoration:underline" onclick="V130_open('v149:terr','semcusto')">ver essas unidades</a>`;
  el.insertAdjacentElement('afterend',d)}
(function(){const f=()=>{const P=W().pos;if(Array.isArray(P)){P.push(posGaveta);return true}return false};if(!f()){let n=0;const iv=setInterval(()=>{if(f()||++n>40)clearInterval(iv)},500)}})();

function gestaoHTML(h){if(typeof h!=='string')return h;const gs=S.gSub||'geral';
  if(gs==='metas')h=metasHTML(h);else if(gs==='insights')h=insightsHTML(h);else if(gs==='boutique')h=boutiqueHTML(h);else if(gs==='posvendas')h=posvHTML(h);
  return h}
function liga(){if(typeof SCREENS!=='object'||typeof SCREENS.gestao!=='function'||!SCREENS.gestao.__v156)return false;if(SCREENS.gestao.__v157)return true;
  const g0=SCREENS.gestao;const Wr=function(){const h=g0.apply(this,arguments);try{return gestaoHTML(h)}catch(e){console.error('v157 gestao',e);return h}};
  Object.keys(g0).forEach(k=>{try{Wr[k]=g0[k]}catch(e){}});Wr.__v157=true;SCREENS.gestao=Wr;return true}
if(!liga()){let n=0;const iv=setInterval(()=>{if(liga()||++n>60)clearInterval(iv)},500)}
try{if(/^#\/gestao/.test(location.hash)&&typeof renderMain==='function')renderMain()}catch(e){}
})();
