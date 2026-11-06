/* =====================================================================================================
   v149 · VISÃO EXECUTIVA = o "Dashboard de Gestão TAAG" dos donos (04/11/2026)
   Bruno (04/11): a Visão executiva do Início passa a ter os sete blocos que os donos pediram — Relacionamento,
   Comercial, Projetos, Operações, Estoque, Financeiro, Pós-vendas — simples, com gráficos, um assunto por bloco.
   Substitui os blocos antigos (Fluxo de caixa, Lucro por linha…), que continuam nas suas telas (Financeiro ›
   Fluxo de caixa, DRE). Decisões do Bruno (04/11): "Previsto" = negociações abertas × chance; Pós-venda lê o
   Pipeline filtrado pela frente Pós-venda.
   v149b (04/11, mais tarde — Bruno: "every number must be clickable, go micro on that number"): TODO número abre
   uma gaveta com exatamente os registros que o somam (a mesma gaveta do Início v130 quando ela já existe; senão
   uma gaveta própria desta tela), cada linha abre o registro original (negociação no Pipeline, proposta no editor,
   obra, parceiro no CRM, produto), e a gaveta diz de onde o número vem e como foi calculado.
   Regras: NADA aqui é calculado de novo — cada número vem do mesmo motor da aba que o mostra (V130API: com/est/
   obr/rel/pos; os KPIs do Operação › Painel e do Projetos › Painel são lidos da própria tela, com o mesmo clique;
   T8()/FS.estoqueCusto() do Estoque › Painel Geral); a régua "Resumos", a entrada e os dados não mudam. pt-BR em
   tudo; cada total mostra a ponte (a soma das partes); produtos agrupados (uma linha por produto, clique para ver
   as unidades). Só lê, nunca grava.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__V149)return;window.__V149=true;
if(typeof SCREENS!=='object'||typeof SCREENS.home!=='function'||!window.V130API){console.warn('v149: Início v130 não encontrado');return}
const API=window.V130API;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const r2=v=>Math.round((+v||0)*100)/100;
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R$=v=>{v=r2(v);return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})};
const R0=v=>{v=Math.round(+v||0);return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR')};
const P1=(a,b)=>(b>0?a/b*100:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const T=(fn,d)=>{try{const v=fn();return v==null?d:v}catch(e){console.error('Visão executiva v149',e);return d}};
const hoje=()=>T(()=>today(),null)||new Date().toISOString().slice(0,10);
const addDias=(d,n)=>{const x=new Date(String(d).slice(0,10)+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const dBR=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7)+'/'+String(d).slice(0,4):'—';
const sum=(xs,f)=>r2((xs||[]).reduce((a,x)=>a+(+(f?f(x):x)||0),0));
const plural=(n,a,b)=>N0(n)+' '+(+n===1?a:b);
const getRow=(t,id)=>T(()=>get(t,id),null)||T(()=>(S.db[t]||[]).find(x=>x.id===id),null);
const AC=API.AC||{};const can=k=>T(()=>AC[k]?AC[k]():true,true);
const COR={azul:'#2a78d6',verde:'#12a150',verm:'#d03b3b',amb:'#e0a400',roxo:'#6f42c1',cinza:'#a3a29c',lar:'#f0702a',teal:'#0ea5a5',preto:'#151821'};
const MY=window.__V149S=window.__V149S||{dr:null,arg:null,exp:{}};

/* ───────── peças de desenho (SVG inline, rótulo sempre visível, cor nunca sozinha) ───────── */
const go=h=>`V130_go('${J(h)}')`;
const op=(k,a)=>`V130_open('${J(k)}'${a!=null?`,'${J(a)}'`:''})`;
const my=(k,a)=>op('v149:'+k,a);
const door=(on,txt)=>`<a href="javascript:void 0" class="vx149-door" onclick="${on}">${txt}</a>`;
function tile(lb,v,on,cls,sub){return `<div class="vx-tile ${cls||''}" role="button" tabindex="0" ${on?`style="cursor:pointer" onclick="${on}"`:''}><b class="${cls||''}">${v}</b><span>${lb}</span>${sub?`<em>${sub}</em>`:''}</div>`}
function donut(segs,centro,centroOn,sub){const tot=segs.reduce((a,s)=>a+(+s.v||0),0);const R=42,r=29,c=50;let a0=-Math.PI/2;
  const arcs=tot?segs.filter(s=>s.v>0).map(s=>{const a=s.v/tot*Math.PI*2;const a1=a0+.02,a2=a0+a-.02;a0+=a;if(a2<=a1)return '';const big=a2-a1>Math.PI?1:0;
    const p=(ang,rad)=>(c+rad*Math.cos(ang)).toFixed(2)+' '+(c+rad*Math.sin(ang)).toFixed(2);
    return `<path d="M${p(a1,R)} A${R} ${R} 0 ${big} 1 ${p(a2,R)} L${p(a2,r)} A${r} ${r} 0 ${big} 0 ${p(a1,r)} Z" fill="${s.cor}" ${s.on?`style="cursor:pointer" onclick="${s.on}"`:''}><title>${E(s.lb)}: ${N0(s.v)}</title></path>`}).join(''):`<circle cx="${c}" cy="${c}" r="${(R+r)/2}" fill="none" stroke="rgba(120,120,128,.18)" stroke-width="${R-r}"/>`;
  return `<div class="vx149-don"><svg viewBox="0 0 100 100">${arcs}<text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="19" font-weight="800" fill="currentColor" ${centroOn?`style="cursor:pointer;text-decoration:underline dotted" onclick="${centroOn}"`:''}>${E(centro)}</text></svg><ul>${segs.map(s=>`<li ${s.on?`style="cursor:pointer" onclick="${s.on}"`:''}><i style="background:${s.cor}"></i><b>${N0(s.v)}</b> ${s.lb}${s.sub?`<em>${s.sub}</em>`:''}</li>`).join('')}${sub?`<li class="vx149-sub">${sub}</li>`:''}</ul></div>`}
function barras(rows){const mx=Math.max(1,...rows.map(r=>+r.max||+r.v||0));
  return `<div class="vx149-bars">${rows.map(r=>{const pct=Math.min(100,(+r.v||0)/(r.max||mx)*100);return `<div class="vx149-bar ${r.tot?'tot':''}" ${r.on?`role="button" style="cursor:pointer" onclick="${r.on}"`:''}><span class="l">${r.lb}</span><span class="t"><i style="width:${pct.toFixed(1)}%;background:${r.cor||COR.azul}"></i>${r.marca!=null?`<u style="left:${Math.min(100,r.marca).toFixed(1)}%"></u>`:''}</span><span class="r">${r.txt}</span></div>`}).join('')}</div>`}
function pilha(segs,ponteTxt,ponteOn){const tot=segs.reduce((a,s)=>a+(+s.v||0),0)||1;
  return `<div class="vx149-stack">${segs.map(s=>s.v>0?`<i style="width:${(s.v/tot*100).toFixed(2)}%;background:${s.cor}" title="${E(s.lb)}: ${N0(s.v)}" ${s.on?`onclick="${s.on}"`:''}></i>`:'').join('')}</div><div class="vx149-leg">${segs.map(s=>`<span ${s.on?`role="button" style="cursor:pointer" onclick="${s.on}"`:''}><i style="background:${s.cor}"></i><b>${N0(s.v)}</b> ${s.lb}</span>`).join('')}</div>${ponteTxt?`<div class="vx149-mini" ${ponteOn?`style="cursor:pointer" onclick="${ponteOn}"`:''}>${ponteTxt}</div>`:''}`}
function gauge(pct,txt,sub,on){const p=Math.max(0,Math.min(1,pct));const L=131.9;return `<div class="vx149-gauge" ${on?`role="button" style="cursor:pointer" onclick="${on}"`:''}><div class="w"><svg viewBox="0 0 100 58"><path d="M8 52A42 42 0 0 1 92 52" fill="none" stroke="rgba(120,120,128,.18)" stroke-width="10" stroke-linecap="round"/><path d="M8 52A42 42 0 0 1 92 52" fill="none" stroke="${COR.verde}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(L*p).toFixed(1)} ${L}"/></svg><div class="gv">${txt}</div></div><div class="gs">${sub||''}</div></div>`}
const u=(txt,on)=>`<u ${on?`role="button" onclick="${on}"`:''}>${txt}</u>`; /* termo da ponte: sempre clicável */
const ponte=(txt,ok)=>`<div class="vx-ponte">Ponte: ${txt} ${ok?`<span class="ok">✓ ${ok}</span>`:''}</div>`;
const box=(t,inner,cls,on)=>`<div class="vx149-box ${cls||''}">${t?`<h4 ${on?`role="button" style="cursor:pointer" onclick="${on}"`:''}>${t}${on?' <span class="vx149-h4go">›</span>':''}</h4>`:''}${inner}</div>`;
const secHead=(n,t,q,link,sem)=>`<div class="vx-sh"><div><a class="vx-n" href="javascript:void 0" onclick="this.closest('section').scrollIntoView({behavior:'smooth',block:'start'})">${n}</a><h2>${t}${sem?` <i class="vx149-dot ${sem}" role="button" title="Por que esta cor?" onclick="${my('sem',n)}"></i>`:''}</h2><div class="q">${q}</div></div>${link?`<a class="vx-lk" href="javascript:void 0" onclick="${go(link[1])}">${E(link[0])} ›</a>`:''}</div>`;
const sec=(id,head,inner)=>`<section class="sec vx-s vx149" id="v130_s_${id}">${head}<div class="rx"><div class="card wide">${inner}</div></div></section>`;

/* ───────── ler os KPIs de uma tela do sistema (o MESMO número, o MESMO clique) ───────── */
let KMEMO={};
function kpisDe(fn){if(KMEMO[fn])return KMEMO[fn];return KMEMO[fn]=T(()=>{const h=typeof SCREENS[fn]==='function'?SCREENS[fn]():'';if(typeof h!=='string')return {};const d=document.createElement('div');d.innerHTML=h;const out={};
  d.querySelectorAll('.stat').forEach(s=>{const lb=(s.querySelector('.lb')||{}).textContent||'';const v=(s.querySelector('.v')||{}).textContent||'';const sb=(s.querySelector('.s')||{}).textContent||'';const h0=s.closest('[onclick]')||s.querySelector('[onclick]');const on=h0?h0.getAttribute('onclick'):'';
    const k=lb.trim().toUpperCase();if(k&&!out[k])out[k]={lb:lb.trim(),n:+String(v).replace(/\./g,'').replace(',','.')||0,v:v.trim(),s:sb.trim(),on:on||''}});
  out.__doc=d;return out},{})}
const kpi=(fn,re)=>{const K=kpisDe(fn);return Object.values(K).find(x=>x&&x.lb&&re.test(x.lb))||null};

/* ───────── dados compartilhados entre blocos e gavetas ───────── */
const SEM_TXT={gn:'tranquilo',am:'atenção',rd:'precisa de alguém',gr:'sem dados'};
const SEMREG={}; /* n → {cls, porque:[...]} — o semáforo explica a si mesmo */
const semafo=(n,cls,porque)=>{SEMREG[n]={cls,porque};return cls};
const stP=p=>String(p.status||'').trim().toLowerCase();
const GRP={ativo:{lb:'Escritórios ativos',re:/^ativo/,cor:COR.verde},aq:{lb:'Em aquecimento',re:/aquec/,cor:COR.amb},frio:{lb:'Frios',re:/^frio/,cor:COR.azul},cont:{lb:'A contatar',re:/contatar/,cor:COR.cinza}};
const parcDe=g=>{const parc=S.db.parceiros||[];if(g==='*')return parc;if(g==='outros')return parc.filter(p=>!Object.values(GRP).some(x=>x.re.test(stP(p))));return parc.filter(p=>GRP[g]&&GRP[g].re.test(stP(p)))};
const tarefasAb=()=>(((window.CRM_T||{}).tarefas)||[]).filter(x=>!/conclu|cancel/i.test(x.status||''));
const tarDe=l=>{const ids=new Set(l.flatMap(p=>[String(p.id),String(p.crm_id)]));return tarefasAb().filter(x=>ids.has(String(x.parceiro_id)))};
const pNome=id=>{const p=(S.db.parceiros||[]).find(x=>x.id===id||String(x.crm_id)===String(id));return p?p.nome:null};
const LIN_LB={taag_sp:'TAAG · São Paulo',taag_rj:'TAAG · Rio de Janeiro',acustica:'Acústica',focal:'Focal (FPBN)',posvenda:'Pós-venda (AT)'};
const LIN_COR={taag_sp:COR.azul,taag_rj:COR.azul,acustica:COR.lar,focal:COR.verde,posvenda:COR.roxo};
const linhaDe=p=>{const l=String(p.linha||'').toLowerCase();if(l==='taag'){const f=T(()=>FIL.daProposta(p),'');return f==='RJ'?'taag_rj':'taag_sp'}return LIN_LB[l]?l:'outra'};
const Mtot=p=>T(()=>+M.total(p),0)||0;
const negV=n=>{const c=T(()=>API.com(),null);return c?T(()=>c.negV(n),+n.valor||0):(+n.valor||0)};
const chanceB=n=>{if(window.V161D&&V161D.faixa)return V161D.faixa(n);const ch=+n.chance||0;return ch>=70?'alta':ch>=30?'media':'baixa'};/* v161d: a régua única (Base › params.chance_faixas) */
const CH_LB={alta:'Alta · 70% ou mais',media:'Média · 30% a 69%',baixa:'Baixa · abaixo de 30%',sem:'Sem chance informada'};try{if(window.V161D&&V161D.CH_LB)Object.assign(CH_LB,V161D.CH_LB())}catch(e){}
const etapaLb=e=>({desenvolver:'Desenvolver proposta',enviada:'Proposta enviada',revisao:'Revisão de proposta',desenvolvida:'Proposta desenvolvida',encontro:'Encontro',aguardando:'Aguardando'})[String(e||'').toLowerCase()]||(e?String(e):'Sem etapa');
const resLb=n=>!n.resultado?'aberta':String(n.resultado).toLowerCase();
const FR_LB={taag:'TAAG',acustica:'Acústica',focal:'Focal',posvenda:'Pós-venda'};
const parcNeg=n=>{const ps=n.parceiros||{};const id=ps.indicador||ps.arquitetura||ps.gerenciadora;return id?(pNome(id)||('Parceiro '+id)):'Sem parceiro (direto)'};
/* negociações filtradas: f = {res, frente, etapa, chance, cons, parc} */
function negs(f){f=f||{};return (S.db.negociacoes||[]).filter(n=>(!f.res||(f.res==='decidida'?['fechada','perdida'].includes(resLb(n)):resLb(n)===f.res))&&(!f.frente||String(n.frente||'').toLowerCase()===f.frente)&&(!f.etapa||etapaLb(n.etapa)===f.etapa)&&(!f.chance||chanceB(n)===f.chance)&&(!f.cons||(window.V161D&&V161D.consDe?V161D.consDe(n).includes(f.cons):(n.consultor||'Sem consultor')===f.cons))&&(!f.parc||parcNeg(n)===f.parc))}
const negF=f=>Object.entries(f).map(([k,v])=>k+'='+v).join('&');const parseF=s=>{const f={};String(s||'').split('&').forEach(kv=>{const i=kv.indexOf('=');if(i>0)f[kv.slice(0,i)]=kv.slice(i+1)});return f};
const sitObra=x=>T(()=>COP.situacao(x),null)||x.situacao||x.statusPlanilha||'';
const obrasAnd=()=>(S.db.obras||[]).filter(x=>x.ativo!==false&&!x.inativo&&sitObra(x)==='Em andamento');
const pvObra=x=>String((x.entrega||{}).prevista||'').slice(0,10);
const bucketObra=x=>{const t=hoje(),d=pvObra(x);if(!d)return 'sem';if(d<t)return 'atras';if(d<=addDias(t,7))return 'd7';if(d<=addDias(t,21))return 'd21';if(d<=addDias(t,60))return 'd60';return 'dmais'};
const BK_LB={atras:'atrasadas (data já passou)',d7:'até 7 dias',d21:'8 a 21 dias',d60:'22 a 60 dias',dmais:'depois de 60 dias',sem:'sem data de entrega'};
const custoU=u=>{const p=getRow('produtos',u.produto_id)||{};return (+u.custo>0)?+u.custo:(+p.custo||0)};
const nomeProd=pid=>{const p=getRow('produtos',pid)||{};return (p.nome||pid)+(p.marca?' · '+p.marca:'')};
const terrDe=u=>{const p=T(()=>L.path(u.loc_id),[])||[];return (p[0]||{}).nome||'Sem lugar'};
const lancs=(tipo,grp)=>{const t=hoje(),d30=addDias(t,30);const L=(S.db.lancamentos||[]).filter(l=>!l.pago_em&&String(l.vencimento||'').slice(0,10)<=d30&&l.tipo===tipo);
  const orig=l=>String(l.origem||l.categoria||'').toLowerCase();const folha=l=>/folha|salari|comiss|rt\b/.test(orig(l)),fixo=l=>!folha(l)&&/fixo|aluguel|conta|assinatura/.test(orig(l));
  const propDe=l=>l.origem_id?getRow('propostas',l.origem_id):null;const linhaR=l=>{const p=propDe(l);const k=p?String(p.linha||'').toLowerCase():'';return k==='acustica'?'TAAG Acoustic':k==='posvenda'?'Pós-vendas':k==='focal'?'Focal':k==='taag'?'Projetos TAAG':'Outros'};
  if(!grp||grp==='*')return L;if(tipo==='pagar')return L.filter(l=>grp==='Folha'?folha(l):grp==='Custos fixos'?fixo(l):!folha(l)&&!fixo(l));return L.filter(l=>linhaR(l)===grp)};

/* ───────── 1 · RELACIONAMENTO ───────── */
function bRel(){if(!can('rel'))return '';
  const parc=S.db.parceiros||[];const ativos=parcDe('ativo'),aq=parcDe('aq'),frios=parcDe('frio'),cont=parcDe('cont');const outros=parc.length-ativos.length-aq.length-frios.length-cont.length;
  const base=ativos.length+aq.length+frios.length; /* a "base em trabalho" do CRM › Painel de Gestão: Frio + Em aquecimento + Ativo */
  const t=hoje();const tar=tarefasAb();const atr=tar.filter(x=>x.data_prevista&&x.data_prevista<t),prox=tar.filter(x=>x.data_prevista&&x.data_prevista>=t&&x.data_prevista<=addDias(t,7));
  const sem=semafo('1',atr.length?'rd':prox.length?'gn':'am',[atr.length?`${N0(atr.length)} ações do CRM com a data vencida → vermelho`:'nenhuma ação do CRM vencida',prox.length?`${N0(prox.length)} ações marcadas para os próximos 7 dias`:'nenhuma ação marcada para os próximos 7 dias → amarelo']);
  const grp=(g,l)=>({v:l.length,lb:GRP[g].lb,cor:GRP[g].cor,on:my('parc',g),sub:`${door(my('tar',g),plural(tarDe(l).length,'próxima ação','próximas ações'))} · clique no número para ver os escritórios`});
  const d=donut([grp('ativo',ativos),grp('aq',aq),grp('frio',frios)],N0(base),my('parc','base'),`+ ${door(my('parc','cont'),`<b>${N0(cont.length)}</b> a contatar`)} (ainda fora da base em trabalho) · ${door(my('tar','cont'),plural(tarDe(cont).length,'próxima ação','próximas ações'))}`);
  const tiles=`<div class="vx-tiles vx-c1">${tile('Próximas ações nos 7 dias',N0(prox.length),op('tarProx'))}${tile('Ações atrasadas',N0(atr.length),op('tarAtr'),atr.length?'neg':'pos')}${tile('Oportunidades vindas de parceiros',N0(T(()=>API.rel().negPAb.length,0)),op('negP'))}</div>`;
  return sec('b1',secHead('1','Relacionamento','Os escritórios que nos indicam obras: quem está ativo, quem está esquentando, quem ainda está frio — e a próxima ação de cada grupo.',['CRM › Painel de Gestão','#/crmgestao'],sem),
    `<div class="vx149-grid c21">${box('Escritórios na base em trabalho',d,'',my('parc','base'))}${box('Ações do CRM',tiles,'',op('tar'))}</div>`+
    ponte(`${u(N0(base)+' na base em trabalho',my('parc','base'))} = ${u(N0(ativos.length)+' ativos',my('parc','ativo'))} + ${u(N0(aq.length)+' em aquecimento',my('parc','aq'))} + ${u(N0(frios.length)+' frios',my('parc','frio'))} · carteira inteira ${u(N0(parc.length),op('parc'))} = ${u(N0(base),my('parc','base'))} + ${u(N0(cont.length)+' a contatar',my('parc','cont'))}${outros?' + '+u(N0(outros)+' não perturbe / out / sem status',my('parc','outros')):''}`,'o mesmo do CRM › Painel de Gestão'))}

/* ───────── 2 · COMERCIAL ───────── */
function bCom(){if(!can('com'))return '';const c=API.com();if(!c)return '';
  const m=S.db.metas||{};const ks=['taag_sp','taag_rj','acustica','focal','posvenda'];const metaTot=ks.reduce((a,k)=>a+(+m[k]||0),0)||(+m.empresa||0);
  const g={};c.ano.forEach(p=>{const k=linhaDe(p);g[k]=g[k]||{n:0,v:0};g[k].n++;g[k].v=r2(g[k].v+Mtot(p))});
  const vend=sum(c.ano,Mtot);const prev=r2(c.pond||0);const falta=r2(metaTot-vend);
  const fracAno=(()=>{const t=hoje();const y=t.slice(0,4);const d0=new Date(y+'-01-01T12:00:00'),d1=new Date(t+'T12:00:00');return Math.max(0,Math.min(1,(d1-d0)/864e5/365))})();
  const pct=metaTot?vend/metaTot:0;
  const semf=semafo('2',metaTot?(pct>=fracAno?'gn':pct>=fracAno-.15?'am':'rd'):'am',[`realizado ${P1(vend,metaTot)} da meta`,`hoje já passou ${P1(fracAno*100,100)} do ano`,'verde = realizado ≥ % do ano · amarelo = até 15 pontos abaixo · vermelho = mais de 15 pontos abaixo']);
  const metaGo=k=>{const fr=k.startsWith('taag')?'taag':k;const fil=k==='taag_sp'?'SP':k==='taag_rj'?'RJ':'';return `V130_metaGo('${fr}','${fil}')`};
  const rows=ks.filter(k=>g[k]||+m[k]).map(k=>{const x=g[k]||{n:0,v:0};const mt=+m[k]||0;
    return {lb:LIN_LB[k],v:mt?x.v/mt*100:0,max:100,cor:LIN_COR[k],marca:fracAno*100,txt:`<b>${R0(x.v)}</b> de ${R0(mt)} · ${P1(x.v,mt)} · ${plural(x.n,'proposta','propostas')}`,on:metaGo(k)}});
  if(g.outra)rows.push({lb:'Sem linha',v:0,max:100,cor:COR.cinza,txt:`<b>${R0(g.outra.v)}</b> · ${plural(g.outra.n,'proposta','propostas')}`,on:op('vendAno')});
  rows.push({lb:'TAAG',tot:true,v:pct*100,max:100,cor:COR.preto,marca:fracAno*100,txt:`<b>${R0(vend)}</b> de ${R0(metaTot)} · ${P1(vend,metaTot)} · ${plural(c.ano.length,'proposta','propostas')}`,on:op('vendAno')});
  const tiles=`<div class="vx-tiles vx-c4"><div class="vx-hi">${tile('Meta '+E(c.y)+' · soma das 5 linhas',R0(metaTot),my('meta'))}</div>${tile('Realizado · '+plural(c.ano.length,'proposta','propostas'),R0(vend),op('vendAno'),'pos',P1(vend,metaTot)+' da meta')}${tile('Previsto · negociações abertas × chance',R0(prev),my('neg','res=aberta&pond=1'),'',plural(c.negs.length,'negociação aberta','negociações abertas')+((c.semValor||[]).length?' · '+N0(c.semValor.length)+' sem valor cadastrado':''))}${tile('Faltam para a meta',R0(falta),my('meta'),falta>0?'neg':'pos','meta − realizado')}</div>`;
  const termos=ks.filter(k=>g[k]).map(k=>u(N0(g[k].n)+' '+LIN_LB[k].replace('TAAG · ',''),metaGo(k))).concat(g.outra?[u(N0(g.outra.n)+' sem linha',op('vendAno'))]:[]).join(' + ');
  /* oportunidades em negociação: o Pipeline (negociações abertas = sem resultado) */
  const N=S.db.negociacoes||[];const fech=negs({res:'fechada'}),perd=negs({res:'perdida'}),fut=negs({res:'futuro'}),ab=negs({res:'aberta'});
  const semSt=N.filter(n=>n.resultado==='sem_status');const open=c.negs;const vNeg=sum(open,negV);
  const byB={alta:[],media:[],baixa:[],sem:[]};open.forEach(n=>(byB[chanceB(n)]||byB.sem).push(n));
  const chance=[['alta','🟢 '+CH_LB.alta,COR.verde],['media','🟡 '+CH_LB.media,COR.amb],['baixa','🔴 '+CH_LB.baixa,COR.verm],['sem','⚪ '+CH_LB.sem,COR.cinza]].filter(([k])=>k!=='sem'||byB.sem.length).map(([k,lb,cor])=>({lb,v:byB[k].length,max:Math.max(1,open.length),cor,txt:`<b>${N0(byB[k].length)}</b> · ${R0(sum(byB[k],negV))}`,on:my('neg','res=aberta&chance='+k)}));
  const byC={};open.forEach(n=>{const ks=window.V161D&&V161D.consDe?V161D.consDe(n):[n.consultor||'Sem consultor'];ks.forEach(k=>{(byC[k]=byC[k]||{n:0,v:0,c:0});byC[k].n++;if(ks.length>1)byC[k].c++;byC[k].v=r2(byC[k].v+negV(n)/ks.length)})});/* v161d: conta para cada consultor; valor 50/50 */
  const cons=Object.entries(byC).sort((a,b)=>b[1].n-a[1].n).map(([k,x])=>({lb:E(k),v:x.n,max:Math.max(1,open.length),cor:COR.azul,txt:`<b>${N0(x.n)}</b> · ${R0(x.v)}${x.c?` · <span class="sub">inclui ${N0(x.c)} compartilhada${x.c>1?'s':''}</span>`:''}`,on:my('neg','res=aberta&cons='+k)}));
  const byP={};open.forEach(n=>{const k=parcNeg(n);(byP[k]=byP[k]||{n:0,v:0});byP[k].n++;byP[k].v=r2(byP[k].v+negV(n))});
  const parcs=Object.entries(byP).sort((a,b)=>b[1].n-a[1].n).map(([k,x])=>({lb:E(k),v:x.n,max:Math.max(1,open.length),cor:COR.teal,txt:`<b>${N0(x.n)}</b> · ${R0(x.v)}`,on:my('neg','res=aberta&parc='+k)}));
  const mais=(rows,n)=>rows.length>n?rows.slice(0,n).concat([{lb:`<i>+ ${N0(rows.length-n)} outros</i>`,v:0,max:1,cor:COR.cinza,txt:`<b>${N0(rows.slice(n).reduce((a,r)=>a+r.v,0))}</b>`,on:my('neg','res=aberta')}]):rows;
  const byE={};open.forEach(n=>{const k=etapaLb(n.etapa);byE[k]=(byE[k]||0)+1});const etapas=Object.entries(byE).sort((a,b)=>b[1]-a[1]);
  const conv=fech.length+perd.length?fech.length/(fech.length+perd.length):0;
  const opp=`<div class="vx149-grid c3">
    ${box('Em negociação',`<div class="vx-big" style="padding:10px 0 0"><b>${door(my('neg','res=aberta'),N0(open.length))}</b> <span>negociações abertas · ${door(my('neg','res=aberta'),R0(vNeg))}</span></div><div class="vx149-chips">${etapas.map(([k,v])=>`<span role="button" onclick="${my('neg','res=aberta&etapa='+k)}">${N0(v)} ${E(k)}</span>`).join('')}</div>`,'',my('neg','res=aberta'))}
    ${box('Conversão',gauge(conv,P1(fech.length,fech.length+perd.length),`${door(my('neg','res=fechada'),N0(fech.length)+' ganhas')} de ${door(my('neg','res=decidida'),N0(fech.length+perd.length)+' decididas')}`,my('neg','res=decidida')),'',my('neg','res=decidida'))}
    ${box('Pipeline inteiro',pilha([{lb:'ganhas',v:fech.length,cor:COR.verde,on:my('neg','res=fechada')},{lb:'perdidas',v:perd.length,cor:COR.cinza,on:my('neg','res=perdida')},{lb:'futuro',v:fut.length,cor:COR.amb,on:my('neg','res=futuro')},{lb:'abertas',v:ab.length,cor:COR.azul,on:my('neg','res=aberta')}].concat(semSt.length?[{lb:'status vazio',v:semSt.length,cor:COR.verm,on:"S.comF={};location.hash='#/pipeline'"}]:[]),`${N0(N.length)} = ${N0(fech.length)} + ${N0(perd.length)} + ${N0(fut.length)} + ${N0(ab.length)}${semSt.length?' + '+N0(semSt.length)+' status vazio':''}`,my('neg','')),'',my('neg',''))}
   </div>
   <div class="vx149-grid c3" style="margin-top:14px">${box('Por chance de fechamento',barras(chance)+(window.V161D&&V161D.ponteChance?V161D.ponteChance(open):''),'',my('neg','res=aberta'))}${box('Por consultor',(cons.length?barras(mais(cons,6)):'<div class="vx149-vazio">—</div>')+(window.V161D&&V161D.ponteCons?V161D.ponteCons(open,'inicio'):''),'',my('neg','res=aberta'))}${box('Por parceiro (quem indicou)',parcs.length?barras(mais(parcs,6)):'<div class="vx149-vazio">—</div>','',my('neg','res=aberta'))}</div>`;
  return sec('b2',secHead('2','Comercial',`Meta ${E(c.y)}: quanto já vendemos, quanto está previsto e quanto falta — os mesmos números de Comercial › Gestão. Depois, as oportunidades em negociação.`,['Comercial › Gestão','#/gestao'],semf),
    tiles+box('Metas por linha — realizado × meta <span class="vx149-mk" role="button" onclick="'+my('ano')+'"><u></u> hoje já passou '+P1(fracAno*100,100)+' do ano</span>',barras(rows),'',my('meta'))+
    ponte(`${u(N0(c.ano.length)+' propostas',op('vendAno'))} = ${termos||'—'} · ${u(R0(vend),op('vendAno'))} = ${ks.filter(k=>g[k]).map(k=>u(R0(g[k].v),metaGo(k))).join(' + ')}${g.outra?' + '+u(R0(g.outra.v),op('vendAno')):''}`,'o mesmo de Comercial › Propostas')+
    `<h3 class="vx149-h3">Oportunidades em negociação</h3>`+opp)}

/* ───────── 3 · PROJETOS ───────── */
function bPrj(){if(!can('obr'))return '';const o=T(()=>API.obr(),null)||{pend:[]};
  const kProj=kpi('prjpainel',/fase projetos em andamento|^projetos em andamento/i),kArq=kpi('prjpainel',/aguardando arquivos/i),kElab=kpi('prjpainel',/em elaboração/i),kAprov=kpi('prjpainel',/aprovados este/i),kBrief=kpi('prjpainel',/sem briefing/i),kAtr=kpi('prjpainel',/entregáveis atrasados/i);
  const kAnd=kpi('copainel',/^em andamento/i);const ea=kAnd?kAnd.n:obrasAnd().length;
  const semf=semafo('3',kAtr&&kAtr.n?'rd':kBrief&&kBrief.n?'am':'gn',[kAtr&&kAtr.n?`${N0(kAtr.n)} entregáveis com prazo vencido → vermelho`:'nenhum entregável atrasado',kBrief&&kBrief.n?`${N0(kBrief.n)} obras em andamento sem briefing → amarelo`:'todas as obras em andamento têm briefing']);
  const row=(k,cor)=>k?{lb:E(k.lb),v:k.n,max:Math.max(1,ea),cor,txt:`<b>${N0(k.n)}</b> ${E(k.s)}`,on:k.on||go('#/prjpainel')}:null;
  const rows=[row(kProj,COR.lar),row(kArq,COR.amb),row(kElab,COR.azul),row(kBrief,COR.verm),row(kAtr,COR.verm)].filter(Boolean);
  const tiles=`<div class="vx-tiles vx-c3">${tile('Obras com projeto em andamento',N0(kProj?kProj.n:0),kProj?kProj.on:go('#/prjpainel'),'','das '+N0(ea)+' em andamento')}${tile('Entregáveis pendentes',N0(o.pend.length),op('prj'))}${tile('Aprovados este mês',N0(kAprov?kAprov.n:0),kAprov?kAprov.on:go('#/prjpainel'),'pos')}</div>`;
  return sec('b3',secHead('3','Projetos',`Das ${N0(ea)} obras em andamento, onde cada uma está na cadeia de projeto — os mesmos números de Projetos › Painel.`,['Projetos › Painel','#/prjpainel'],semf),
    tiles+box('Projetos em andamento — a fila',rows.length?barras(rows)+`<div class="vx149-mini">Uma obra pode estar em mais de uma linha (por isso as linhas não somam ${door(kAnd?kAnd.on:go('#/obras'),N0(ea))}). Cada linha abre a lista do Painel de Projetos já filtrada.</div>`:'<div class="vx149-vazio">Painel de Projetos sem dados.</div>','',go('#/prjpainel')))}

/* ───────── 4 · OPERAÇÕES ───────── */
function bOpe(){if(!can('obr'))return '';const K=kpisDe('copainel');
  const kAnd=kpi('copainel',/^em andamento/i),kHold=kpi('copainel',/^on hold/i),kConc=kpi('copainel',/^conclu/i),kAtv=kpi('copainel',/atividades atrasadas/i),k7=kpi('copainel',/próximos 7 dias/i);
  const tot=(kAnd?kAnd.n:0)+(kHold?kHold.n:0)+(kConc?kConc.n:0);
  /* obras ativas por unidade: lidas da própria tela (mesma lista, mesmo clique) */
  const uns=[];T(()=>{const d=K.__doc;if(!d)return;[...d.querySelectorAll('div[onclick]')].filter(x=>/^Unidade /.test((x.querySelector('b')||{}).textContent||'')&&x.querySelector('.chip')).forEach(x=>{const lb=x.querySelector('b').textContent.trim();if(uns.some(y=>y.lb===lb))return;const n=+x.querySelector('.chip').textContent.replace(/\./g,'')||0;const sb=(x.querySelector('.sub')||{}).textContent||'';const mAnd=/(\d+) em andamento/.exec(sb);uns.push({lb,n,and:mAnd?+mAnd[1]:n,on:x.getAttribute('onclick')||''})})});
  const and=obrasAnd();const bk={};and.forEach(x=>{(bk[bucketObra(x)]=bk[bucketObra(x)]||[]).push(x)});const nb=k=>(bk[k]||[]).length;
  const semf=semafo('4',(kAtv&&kAtv.n)||nb('atras')?'rd':nb('sem')?'am':'gn',[kAtv&&kAtv.n?`${N0(kAtv.n)} atividades com o fim previsto já passado → vermelho`:'nenhuma atividade atrasada',nb('atras')?`${N0(nb('atras'))} obras com a data de entrega já passada → vermelho`:'nenhuma obra com entrega vencida',nb('sem')?`${N0(nb('sem'))} obras em andamento sem data de entrega → amarelo`:'todas as obras têm data de entrega']);
  const unOn=u=>u.on||`COP.ope.go('obras',{situacao:'ativas',unidade:'${J(u.lb.replace('Unidade ',''))}'},'#/obras')`;
  const esq=box('Obras · '+N0(tot)+' no total',pilha([{lb:'em andamento',v:kAnd?kAnd.n:0,cor:COR.azul,on:kAnd?kAnd.on:''},{lb:'on hold',v:kHold?kHold.n:0,cor:COR.amb,on:kHold?kHold.on:''},{lb:'concluídas',v:kConc?kConc.n:0,cor:COR.verde,on:kConc?kConc.on:''}],`${N0(tot)} = ${N0(kAnd?kAnd.n:0)} + ${N0(kHold?kHold.n:0)} + ${N0(kConc?kConc.n:0)}`,go('#/obras'))+
    (uns.length?barras(uns.map(u=>({lb:E(u.lb),v:u.and,max:Math.max(1,kAnd?kAnd.n:1),cor:COR.azul,txt:`<b>${N0(u.and)}</b> em andamento · ${N0(u.n)} ativas`,on:unOn(u)}))):'')+
    `<div class="vx-tiles vx-c2" style="margin-top:12px">${tile('Atividades atrasadas',N0(kAtv?kAtv.n:0),kAtv?kAtv.on:go('#/copainel'),kAtv&&kAtv.n?'neg':'pos','fim previsto já passou')}${tile('Atividades nos próximos 7 dias',N0(k7?k7.n:0),k7?k7.on:go('#/copainel'))}</div>`,'',go('#/obras'));
  const segs=[['atras',COR.verm],['d7',COR.verde],['d21',COR.azul],['d60',COR.teal],['dmais',COR.roxo],['sem',COR.cinza]].map(([k,cor])=>({lb:BK_LB[k],v:nb(k),cor,on:my('obras',k)}));
  const dir=box('Previsão de entrega · das '+N0(and.length)+' obras em andamento',pilha(segs,`${N0(and.length)} = ${segs.map(s=>N0(s.v)).join(' + ')}`,my('obras','*'))+
    `<div class="vx-tiles vx-c2" style="margin-top:12px">${tile('Entregam nos próximos 7 dias',N0(nb('d7')),my('obras','d7'),'pos')}${tile('Sem data de entrega',N0(nb('sem')),my('obras','sem'),nb('sem')?'neg':'','a data fica em Operação › Obras › Entrega')}</div>`,'',my('obras','*'));
  return sec('b4',secHead('4','Operações','Obras em andamento e o que entrega nos próximos dias — os mesmos números de Operação › Painel.',['Operação › Painel','#/copainel'],semf),
    `<div class="vx149-grid c2">${esq}${dir}</div>`+ponte(`${u(N0(kAnd?kAnd.n:0)+' em andamento',kAnd?kAnd.on:go('#/obras'))}${uns.length?' = '+uns.map(x=>u(N0(x.and)+' '+E(x.lb.replace('Unidade ','')),unOn(x))).join(' + '):''} · com data de entrega: ${u(N0(and.length-nb('sem')),my('obras','comdata'))} · sem data: ${u(N0(nb('sem')),my('obras','sem'))}`,and.length===(kAnd?kAnd.n:0)?'o mesmo de Operação › Obras':''))}

/* ───────── 5 · ESTOQUE ───────── */
function bEst(){if(!can('est'))return '';const e=API.est();if(!e)return '';const custo=can('custo');
  /* territórios = Base › Locais nível 1 (SP, RJ, Focal…), unidades agrupadas pelo caminho do lugar; custos = T8() (o motor do Painel Geral) */
  const LOC=S.db.locais||[];const terr={};LOC.filter(l=>l.nivel===1&&!l.inativo).forEach(a=>terr[a.nome]={nome:a.nome,us:[]});
  (e.us||[]).forEach(u=>{const a=terrDe(u);(terr[a]=terr[a]||{nome:a,us:[]});terr[a].us.push(u)});
  const ts=Object.values(terr);const totU=ts.reduce((a,x)=>a+x.us.length,0);
  const T8U=T(()=>T8(),null);const custoTot=T8U?r2(+T8U.custoTotal):sum(e.us,custoU);const custoNos=T(()=>+FS.estoqueCusto(),null)??e.canon.custo;const custoTer=r2(custoTot-custoNos);
  const cTer={};((T8U||{}).units||[]).forEach(x=>{const k=String(x.local||'').split(' › ')[0];cTer[k]=r2((cTer[k]||0)+(+x.custo||0))});const custoDe=x=>cTer[x.nome]!=null?cTer[x.nome]:sum(x.us,custoU);const nT8=((T8U||{}).units||[]).length;
  const livre=(e.g.livre||[]).length,ped=(e.g.ped||[]).length,alo=(e.g.alo||[]).length,fora=(e.g.fora||[]).length,cons=(e.g.cons||[]).length;
  const semf=semafo('5',e.nec.length||e.atras.length?'rd':e.transito.length?'am':'gn',[e.qNec?`${N0(e.qNec)} itens vendidos que o livre e os pedidos não cobrem → vermelho`:'nada a comprar',e.atras.length?`${N0(e.atras.length)} pedidos a chegar com a previsão vencida → vermelho`:'nenhum pedido atrasado',e.transito.length?`${N0(e.transito.length)} pedidos a chegar → amarelo`:'nada a chegar']);
  const tiles=`<div class="vx-tiles vx-c4"><div class="vx-hi">${tile('Estoque principal · '+plural(e.canon.total,'unidade','unidades'),custo?R$(custoTot):N0(e.canon.total)+' un.',my('terr','*'),'',custo?'ao custo de compra · nossas '+R$(custoNos)+' + de terceiro '+R$(custoTer):'')}</div>${ts.slice(0,3).map(x=>tile(E(x.nome),N0(x.us.length)+' un.',my('terr',x.nome),'',custo?R$(custoDe(x))+' ao custo de compra':'')).join('')}${ts.length<3?Array.from({length:3-ts.length},()=>tile('—','—',go('#/dblocais'),'','território ainda não cadastrado na Base › Locais')).join(''):''}</div>`;
  const comp=box('Das '+N0(e.canon.total)+' unidades',pilha([{lb:'livres',v:livre,cor:COR.verde,on:op('est_livre')},{lb:'pedidas por propostas',v:ped,cor:COR.azul,on:op('est_ped')},{lb:'separadas / em montagem',v:alo,cor:COR.roxo,on:op('est_alo')},{lb:'fora de venda',v:fora,cor:COR.cinza,on:op('est_fora')},{lb:'consignadas',v:cons,cor:COR.amb,on:op('est_cons')}],`${N0(livre+ped+alo+fora+cons)} = ${N0(livre)} + ${N0(ped)} + ${N0(alo)} + ${N0(fora)} + ${N0(cons)}`,my('terr','*')),'',my('terr','*'));
  const acomp=box('A comprar',`<div class="vx-tiles vx-c2">${tile('Itens vendidos ainda sem compra',N0(e.qNec),op('nec'),e.qNec?'neg':'pos',custo&&e.qNec?R$(e.vNec)+' ao custo de catálogo':'o estoque livre e os pedidos cobrem tudo')}${tile('A chegar (pedidos aprovados)',N0(e.transito.length),op('transito'),e.atras.length?'neg':'',e.atras.length?plural(e.atras.length,'pedido atrasado','pedidos atrasados'):'')}</div>`,'',op('nec'));
  return sec('b5',secHead('5','Estoque','O que temos nos estoques (ao custo de compra) e o que falta comprar para as obras — os mesmos números de Estoque › Painel Geral.',['Estoque › Painel Geral','#/epainel'],semf),
    tiles+`<div class="vx149-grid c2">${comp}${acomp}</div>`+ponte(`${u(N0(totU)+' unidades',my('terr','*'))} = ${ts.map(x=>u(N0(x.us.length)+' '+E(x.nome),my('terr',x.nome))).join(' + ')}${custo?` · ${u(R$(custoTot),my('terr','*'))} = ${ts.map(x=>u(R$(custoDe(x)),my('terr',x.nome))).join(' + ')}${nT8&&nT8!==e.canon.total?` (custo sobre ${u(N0(nT8)+' un.',my('terr','*'))}; ${u(N0(e.canon.total-nT8)+' un. sem custo no motor do Painel',my('terr','semcusto'))})`:''} = patrimônio ${u(R$(custoNos)+' ('+N0(e.canon.nossas)+' un. nossas)',go('#/fhoje'))} + ${u(R$(custoTer)+' ('+N0(e.canon.total-e.canon.nossas)+' un. de terceiro)',op('est_cons'))}`:''}`,'o mesmo de Estoque › Painel Geral'))}

/* ───────── 6 · FINANCEIRO ───────── */
function bFin(){if(!can('fin'))return '';const t=hoje();
  const caixa=T(()=>+FS.caixa(),0)||0;const pag=lancs('pagar','*'),rec=lancs('receber','*');
  const vencP=pag.filter(l=>String(l.vencimento||'')<t),vencR=rec.filter(l=>String(l.vencimento||'')<t);
  const vP=sum(pag,l=>l.valor),vR=sum(rec,l=>l.valor);const vazio=!caixa&&!pag.length&&!rec.length;
  const semf=semafo('6',vazio?'gr':(caixa<0||vencR.length||vencP.length)?'rd':(caixa+vR-vP<0?'am':'gn'),[vazio?'sem caixa e sem títulos lançados → cinza':'',caixa<0?'caixa negativo → vermelho':'',vencR.length?`${N0(vencR.length)} parcelas a receber vencidas → vermelho`:'',vencP.length?`${N0(vencP.length)} títulos a pagar vencidos → vermelho`:'',caixa+vR-vP<0?'caixa fica negativo em 30 dias → amarelo':''].filter(Boolean));
  const tiles=`<div class="vx-tiles vx-c4"><div class="vx-hi">${tile('Saldo em caixa hoje',R$(caixa),go('#/fincontas'),caixa<0?'neg':'','Financeiro › Contas')}</div>${tile('Contas a receber · 30 dias',R$(vR),my('lanc','receber|*'),'pos',plural(rec.length,'parcela','parcelas')+(vencR.length?' · '+plural(vencR.length,'vencida','vencidas'):''))}${tile('Contas a pagar · 30 dias',R$(-vP),my('lanc','pagar|*'),'neg',plural(pag.length,'título','títulos')+(vencP.length?' · '+plural(vencP.length,'vencido','vencidos'):''))}${tile('Caixa daqui a 30 dias',R$(caixa+vR-vP),go('#/fluxo'),caixa+vR-vP<0?'neg':'','caixa + a receber − a pagar · Fluxo de caixa')}</div>`;
  const mx=Math.max(1,vP,vR);
  const br=(tipo,grp,cor)=>{const l=lancs(tipo,grp);return {lb:grp,v:sum(l,x=>x.valor),max:mx,cor,txt:`<b>${R$(sum(l,x=>x.valor))}</b> · ${plural(l.length,'título','títulos')}`,on:my('lanc',tipo+'|'+grp)}};
  const aPag=box('Contas a pagar · '+R$(vP),barras([br('pagar','Folha',COR.verm),br('pagar','Custos fixos',COR.verm),br('pagar','Custos variáveis',COR.verm)]),'',my('lanc','pagar|*'));
  const recG=['Projetos TAAG','TAAG Acoustic','Pós-vendas','Focal'].concat(lancs('receber','Outros').length?['Outros']:[]);
  const aRec=box('Contas a receber · '+R$(vR),barras(recG.map(g=>br('receber',g,COR.verde))),'',my('lanc','receber|*'));
  return sec('b6',secHead('6','Financeiro','Caixa hoje, o que sai e o que entra nos próximos 30 dias — os mesmos títulos de Financeiro › Hoje.',['Financeiro › Hoje','#/fhoje'],semf),
    tiles+`<div class="vx149-grid c2">${aPag}${aRec}</div>`+(vazio?`<div class="vx-ponte" style="background:rgba(224,164,0,.1)">Ainda sem lançamentos reais — os valores aparecem assim que o Financeiro for carregado na Base (${door(go('#/finlanc'),'Financeiro › Lançamentos')}).</div>`:ponte(`${u(R$(caixa),go('#/fincontas'))} hoje + ${u(R$(vR),my('lanc','receber|*'))} a receber − ${u(R$(vP),my('lanc','pagar|*'))} a pagar = ${u(R$(caixa+vR-vP),go('#/fluxo'))} em 30 dias · a pagar = ${['Folha','Custos fixos','Custos variáveis'].map(g=>u(R$(sum(lancs('pagar',g),x=>x.valor))+' '+g.toLowerCase(),my('lanc','pagar|'+g))).join(' + ')}`,'o mesmo de Financeiro › Hoje')))}

/* ───────── 7 · PÓS-VENDAS ───────── */
function bPos(){if(!can('pos'))return '';const p=API.pos();
  const N=negs({frente:'posvenda'});const ab=negs({frente:'posvenda',res:'aberta'}),fech=negs({frente:'posvenda',res:'fechada'}),perd=negs({frente:'posvenda',res:'perdida'});const fut=N.length-ab.length-fech.length-perd.length;
  const byB={alta:[],media:[],baixa:[],sem:[]};ab.forEach(n=>(byB[chanceB(n)]||byB.sem).push(n));
  const chance=[['alta','🟢 '+CH_LB.alta,COR.verde],['media','🟡 '+CH_LB.media,COR.amb],['baixa','🔴 '+CH_LB.baixa,COR.verm],['sem','⚪ '+CH_LB.sem,COR.cinza]].filter(([k])=>k!=='sem'||byB.sem.length).map(([k,lb,cor])=>({lb,v:byB[k].length,max:Math.max(1,ab.length),cor,txt:`<b>${N0(byB[k].length)}</b> · ${R0(sum(byB[k],negV))}`,on:my('neg','frente=posvenda&res=aberta&chance='+k)}));
  const semf=semafo('7',(p&&p.osAtr.length)?'rd':(p&&p.os.length)?'am':'gn',[p&&p.osAtr.length?`${N0(p.osAtr.length)} chamados abertos há mais de 7 dias → vermelho`:'nenhum chamado parado há mais de 7 dias',p&&p.os.length?`${N0(p.os.length)} chamados abertos → amarelo`:'nenhum chamado aberto']);
  const tiles=`<div class="vx-tiles vx-c3">${tile('Em negociação (Pipeline · Pós-venda)',N0(ab.length),my('neg','frente=posvenda&res=aberta'),'',R0(sum(ab,negV)))}${tile('Propostas AT enviadas ou aprovadas',N0(p?p.pv.length:0),op('pvProp'),'pos',p?R$(p.vPv):'')}${tile('Chamados abertos',N0(p?p.os.length:0),op('os'),p&&p.osAtr.length?'neg':'',p&&p.osAtr.length?N0(p.osAtr.length)+' há mais de 7 dias':'')}</div>`;
  return sec('b7',secHead('7','Pós-vendas','Oportunidades de assistência técnica em negociação (o Pipeline, frente Pós-venda) e os chamados abertos.',['Pós-venda › Visão geral','#/posvisao'],semf),
    tiles+`<div class="vx149-grid c2">${box('Por chance de fechamento',ab.length?barras(chance):`<div class="vx149-vazio">Nenhuma negociação de pós-venda aberta no Pipeline · ${door(my('neg','frente=posvenda'),'ver todas as de pós-venda')}</div>`,'',my('neg','frente=posvenda&res=aberta'))}${box('Pipeline Pós-venda',pilha([{lb:'ganhas',v:fech.length,cor:COR.verde,on:my('neg','frente=posvenda&res=fechada')},{lb:'perdidas',v:perd.length,cor:COR.cinza,on:my('neg','frente=posvenda&res=perdida')},{lb:'abertas',v:ab.length,cor:COR.azul,on:my('neg','frente=posvenda&res=aberta')}],`${N0(N.length)} = ${N0(fech.length)} + ${N0(perd.length)} + ${N0(ab.length)}${fut?' + '+N0(fut)+' futuro':''}`,my('neg','frente=posvenda')),'',my('neg','frente=posvenda'))}</div>`)}

/* ───────── semáforo: a empresa num olhar ───────── */
function semaforo(blocks){const lb={b1:'Relacionamento',b2:'Comercial',b3:'Projetos',b4:'Operações',b5:'Estoque',b6:'Financeiro',b7:'Pós-vendas'};
  return `<div class="vx149-sem">${blocks.map(b=>{const n=b.id.slice(1);const r=SEMREG[n]||{cls:'gr'};return `<a href="javascript:void 0" onclick="V130_sec('${b.id}')" title="Clique para ir ao bloco · o ponto explica a cor"><i class="vx149-dot ${r.cls}" onclick="event.stopPropagation();${my('sem',n)}"></i><b>${lb[b.id]}</b><span>${SEM_TXT[r.cls]}</span></a>`}).join('')}</div>`}

/* ───────── GAVETAS desta tela (as do Início v130 continuam valendo para as chaves antigas) ───────── */
const gHead=(t,v,sub,fonte)=>`<button class="x" onclick="V130_close()" aria-label="Fechar">×</button><div class="lead">Empresa toda · posição de hoje</div><h3>${t}</h3><div class="big">${v}</div><div class="lead">${sub||''}</div>${fonte?`<div class="vx149-fonte"><b>De onde vem:</b> ${fonte}</div>`:''}`;
const tabela=(cols,rows,tot)=>`<div class="tw"><table class="no-filter"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}${tot||''}</tbody></table></div>`;
const tr=(cells,on,cls)=>`<tr class="${on?'click ':''}${cls||''}"${on?` onclick="${on}"`:''}>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
const trTot=(lb,vals)=>`<tr class="tot"><td>${lb}</td>${vals.map(v=>`<td>${v}</td>`).join('')}</tr>`;
const abrir=(lb,h)=>`<a class="btnl" href="javascript:void 0" onclick="${go(h)}">${E(lb)} ›</a>`;
const vazio=t=>`<div class="note">${E(t)}</div>`;
const conf=(a,b,un)=>Math.abs(r2(a)-r2(b))<0.01?`<div class="note"><span class="ok">✓ a soma das linhas é exatamente o número do cartão</span></div>`:`<div class="note"><span class="bad">A soma das linhas (${un?N0(b):R$(b)}) difere do cartão (${un?N0(a):R$(a)}).</span></div>`;
const nomeCli=p=>T(()=>(getRow('clientes',p.cliente_id)||{}).nome,'')||p.cliente_nome||p.nome||'';
const dealGo=n=>`S.deal='${J(n.id)}';location.hash='#/pipeline'`;

function gaveta149(k,a){
  /* semáforo: por que esta cor */
  if(k==='sem'){const r=SEMREG[a]||{cls:'gr',porque:[]};const lb={1:'Relacionamento',2:'Comercial',3:'Projetos',4:'Operações',5:'Estoque',6:'Financeiro',7:'Pós-vendas'}[a];
    return gHead('Por que '+E(lb)+' está assim: «'+SEM_TXT[r.cls]+'»?',`<i class="vx149-dot ${r.cls}" style="width:22px;height:22px"></i>`,'a cor é calculada agora, com os registros do sistema')+`<ul class="vx149-why">${(r.porque||[]).map(x=>`<li>${E(x)}</li>`).join('')}</ul><div class="note">Regra: verde = nada pendente · amarelo = algo para acompanhar · vermelho = algo vencido ou que pede alguém agora · cinza = ainda sem dados na Base.</div>`}
  if(k==='ano'){const t=hoje();const d=Math.round((new Date(t+'T12:00:00')-new Date(t.slice(0,4)+'-01-01T12:00:00'))/864e5);return gHead('Quanto do ano já passou',P1(d,365),`${N0(d)} dias desde 01/01/${t.slice(0,4)} ÷ 365`,'a data de hoje do sistema. É o traço vertical nas barras de meta: uma linha abaixo do traço está atrasada em relação à meta do ano.')}
  /* relacionamento: escritórios por grupo */
  if(k==='parc'){const g=a==='base'?null:a;const l=g?parcDe(g):[].concat(parcDe('ativo'),parcDe('aq'),parcDe('frio'));const lb=g?(GRP[g]?GRP[g].lb:g==='outros'?'Não perturbe / out / sem status':'Carteira inteira'):'Base em trabalho (ativos + em aquecimento + frios)';
    const tar=tarefasAb();const nTar=p=>tar.filter(x=>String(x.parceiro_id)===String(p.crm_id)||String(x.parceiro_id)===String(p.id)).length;
    return gHead(lb,N0(l.length),plural(l.length,'escritório / parceiro','escritórios / parceiros'),'CRM › Parceiros, campo "Status do relacionamento" (a planilha To Do Comercial lida na Base). Próximas ações = tarefas pendentes do CRM ligadas ao parceiro.')+
      (l.length?tabela(['Escritório','Tipo','Status','PR / consultor','Cidade','Próximas ações'],l.slice().sort((x,y)=>String(x.nome).localeCompare(String(y.nome))).map(p=>tr([`<b>${E(p.nome)}</b>`,E(p.tipo_crm||p.tipo||'—'),E(p.status||'—'),E(p.responsavel_rel||p.pr||p.responsavel_com||'—'),E(p.cidade||'—'),N0(nTar(p))],go('#/crmparceiros'))),trTot('Total',['','','','',N0(l.length)])):vazio('Nenhum escritório neste grupo.'))+abrir('Abrir CRM › Parceiros','#/crmparceiros')}
  if(k==='tar'){const l=parcDe(a);const xs=tarDe(l).slice().sort((x,y)=>String(x.data_prevista).localeCompare(String(y.data_prevista)));const t=hoje();
    return gHead('Próximas ações · '+E(GRP[a]?GRP[a].lb:a),N0(xs.length),'tarefas pendentes do CRM ligadas a estes escritórios','CRM › Próximas ações (tarefas com status pendente), ligadas ao parceiro pelo seu id no CRM.')+
      (xs.length?tabela(['Escritório','Ação','Data prevista','Responsável'],xs.map(x=>tr([`<b>${E(pNome(x.parceiro_id)||('Parceiro '+x.parceiro_id))}</b>`,E(x.sugestao||x.descricao||'—').slice(0,90),(x.data_prevista&&x.data_prevista<t?`<span class="bad">${dBR(x.data_prevista)}</span>`:dBR(x.data_prevista)),E(x.responsavel||'—')],go('#/crmtarefas')))):vazio('Nenhuma ação pendente para este grupo.'))+abrir('Abrir CRM › Próximas ações','#/crmtarefas')}
  /* comercial: meta por linha */
  if(k==='meta'){const c=API.com();const m=S.db.metas||{};const ks=['taag_sp','taag_rj','acustica','focal','posvenda'];const g={};c.ano.forEach(p=>{const kk=linhaDe(p);g[kk]=g[kk]||{n:0,v:0};g[kk].n++;g[kk].v=r2(g[kk].v+Mtot(p))});
    const tot=ks.reduce((x,kk)=>x+(+m[kk]||0),0);const vend=sum(c.ano,Mtot);
    return gHead('Meta '+E(c.y)+' por linha',R0(tot),`realizado ${R0(vend)} · faltam ${R0(tot-vend)}`,'as metas vivem só na Base › Listas & regras (planilha METAS 2026: SP 33 mi · RJ 5 mi · Acústica 5 mi · FPBN 5 mi · AT 3 mi). Realizado = propostas vendidas no ano, pelo valor na data da venda (Comercial › Propostas).')+
      tabela(['Linha','Meta','Realizado','Faltam','% da meta'],ks.map(kk=>{const x=g[kk]||{n:0,v:0};const mt=+m[kk]||0;const fr=kk.startsWith('taag')?'taag':kk;const fil=kk==='taag_sp'?'SP':kk==='taag_rj'?'RJ':'';return tr([`<b>${E(LIN_LB[kk])}</b>`,R0(mt),R0(x.v)+' · '+plural(x.n,'proposta','propostas'),R0(mt-x.v),P1(x.v,mt)],`V130_metaGo('${fr}','${fil}')`)}),trTot('TAAG',[R0(tot),R0(vend),R0(tot-vend),P1(vend,tot)]))+conf(tot,ks.reduce((x,kk)=>x+(+m[kk]||0),0))+abrir('Mudar a meta (Base › Listas & regras)','#/dblistas/regras')}
  /* negociações (Pipeline) com filtro */
  if(k==='neg'){const f=parseF(a);const xs=negs(f);const pond=f.pond==='1';const tot=sum(xs,negV);const totP=sum(xs,n=>negV(n)*(+n.chance||0)/100);
    const desc=[f.frente?'frente '+(FR_LB[f.frente]||f.frente):'',f.res?(f.res==='aberta'?'abertas (sem resultado)':f.res==='decidida'?'decididas (ganhas + perdidas)':f.res):'todas',f.etapa?'etapa '+f.etapa:'',f.chance?'chance '+CH_LB[f.chance].toLowerCase():'',f.cons?'consultor '+f.cons:'',f.parc?'parceiro '+f.parc:''].filter(Boolean).join(' · ');
    const semV=xs.filter(n=>!negV(n)).length;
    return gHead('Negociações · '+E(desc),pond?R0(totP):N0(xs.length),(pond?`soma de valor × chance · ${plural(xs.length,'negociação','negociações')}`:`${R0(tot)} em valor`)+(semV?` · ${N0(semV)} sem valor cadastrado`:''),'Comercial › Pipeline (negociações). Valor = valor da negociação ou, se vazio, das propostas ligadas a ela. Chance = % cadastrada na negociação. Cada linha abre a negociação no Pipeline.')+
      (xs.length?tabela(['Cliente','Frente','Etapa','Chance','Consultor','Parceiro','Valor'].concat(pond?['× chance']:[]),xs.slice().sort((x,y)=>(+y.chance||0)-(+x.chance||0)).map(n=>tr([`<b>${E(n.cliente_nome||nomeCli(n)||n.codinome||n.id)}</b>`,E(FR_LB[String(n.frente||'').toLowerCase()]||n.frente||'—'),E(etapaLb(n.etapa))+(n.resultado?' · '+E(n.resultado):''),N0(+n.chance||0)+'%',E(n.consultor||'—'),E(parcNeg(n)),negV(n)?R0(negV(n)):'<span class="bad">sem valor</span>'].concat(pond?[R0(negV(n)*(+n.chance||0)/100)]:[]),dealGo(n))),trTot('Total',['','','','','',R0(tot)].concat(pond?[R0(totP)]:[]))):vazio('Nenhuma negociação com este filtro.'))+abrir('Abrir Comercial › Pipeline','#/pipeline')}
  /* operações: obras por previsão de entrega */
  if(k==='obras'){const and=obrasAnd();const xs=a==='*'?and:a==='comdata'?and.filter(x=>pvObra(x)):and.filter(x=>bucketObra(x)===a);const lb=a==='*'?'todas as em andamento':a==='comdata'?'com data de entrega':BK_LB[a];
    return gHead('Obras em andamento · '+E(lb),N0(xs.length),plural(xs.length,'obra','obras'),'Operação › Obras com situação "Em andamento"; a data é o campo Entrega › prevista de cada obra (Operação › Obras › abrir a obra › Entrega). Sem data = o campo está vazio.')+
      (xs.length?tabela(['Obra','Cliente','Unidade','Responsável','Entrega prevista'],xs.slice().sort((x,y)=>String(pvObra(x)||'9').localeCompare(String(pvObra(y)||'9'))).map(o=>tr([`<b>${E(o.nome)}</b>`,E((getRow('clientes',o.cliente_id)||{}).nome||'—'),E(o.unidade||'SP'),E(o.respObra||'—'),pvObra(o)?dBR(pvObra(o)):'<span class="bad">sem data</span>'],go('#/obras/'+o.id)))):vazio('Nenhuma obra neste grupo.'))+abrir('Abrir Operação › Obras',"#/obras")}
  /* estoque: unidades por território, uma linha por produto */
  if(k==='terr'){const e=API.est();const T8U=T(()=>T8(),null);const cu={};((T8U||{}).units||[]).forEach(x=>cu[x.id]=+x.custo||0);
    let us=e.us||[];if(a==='semcusto')us=us.filter(x=>cu[x.id]==null);else if(a!=='*')us=us.filter(x=>terrDe(x)===a);
    const lb=a==='*'?'Estoque principal · todos os territórios':a==='semcusto'?'Unidades sem custo no motor do Painel':a;const custo=can('custo');const cv=x=>cu[x.id]!=null?cu[x.id]:custoU(x);
    const g={};us.forEach(x=>{(g[x.produto_id]=g[x.produto_id]||[]).push(x)});const rows=Object.entries(g).map(([pid,l])=>({pid,l,v:sum(l,cv)})).sort((x,y)=>y.v-x.v||y.l.length-x.l.length);
    const out=[];rows.forEach(r=>{const kk='terr|'+a+'|'+r.pid;const open=!!MY.exp[kk];
      out.push(`<tr class="click" onclick="V149_tog('${J(kk)}')"><td><b>${open?'▾':'▸'} ${E(nomeProd(r.pid))}</b></td><td>${N0(r.l.length)}</td>${custo?`<td>${R$(r.v)}</td>`:''}</tr>`);
      if(open)r.l.forEach(x=>out.push(`<tr class="sub click" onclick="${go('#/produto/'+r.pid)}"><td>&nbsp;&nbsp;${E(x.serie||'sem série')} · ${E(T(()=>L.path(x.loc_id).map(p=>p.nome).join(' › '),'')||'—')} · ${E(x.estado||'')}${x.natureza==='consignado'?' · consignada':''}</td><td>1</td>${custo?`<td>${R$(cv(x))}</td>`:''}</tr>`))});
    return gHead(E(lb),N0(us.length)+' un.',(custo?R$(sum(us,cv))+' ao custo de compra · ':'')+'uma linha por produto — clique para ver as unidades','Estoque › Painel Geral (motor T8 / CANON): unidades no estoque, agrupadas pelo nível 1 da Base › Locais. Custo de compra = custo da unidade ou, se vazio, do produto.')+
      (us.length?tabela(['Produto','Unidades'].concat(custo?['Custo de compra']:[]),out,trTot('Total',[N0(us.length)].concat(custo?[R$(sum(us,cv))]:[]))):vazio('Nenhuma unidade.'))+abrir('Abrir Estoque › Painel Geral','#/epainel')}
  /* financeiro: títulos */
  if(k==='lanc'){const [tipo,grp]=String(a).split('|');const xs=lancs(tipo,grp||'*').slice().sort((x,y)=>String(x.vencimento).localeCompare(String(y.vencimento)));const t=hoje();
    return gHead((tipo==='pagar'?'Contas a pagar':'Contas a receber')+' · 30 dias'+(grp&&grp!=='*'?' · '+E(grp):''),R$(sum(xs,x=>x.valor)),plural(xs.length,'título','títulos')+' com vencimento até '+dBR(addDias(t,30)),'Financeiro › Lançamentos: títulos do tipo '+tipo+' ainda não pagos, vencendo em até 30 dias. Folha = origem folha/salário/comissão; fixos = origem fixo; o resto = variáveis. A receber por linha = a linha da proposta de origem.')+
      (xs.length?tabela(['Vencimento','Descrição','Origem','Valor'],xs.map(l=>tr([(String(l.vencimento||'')<t?`<span class="bad">${dBR(l.vencimento)}</span>`:dBR(l.vencimento)),E(l.descricao||l.categoria||'—'),E(l.origem||'—'),R$(l.valor)],go('#/finlanc'))),trTot('Total',['','','',R$(sum(xs,x=>x.valor))])):vazio('Nenhum título lançado neste grupo.'))+abrir('Abrir Financeiro › '+(tipo==='pagar'?'A pagar':'A receber'),tipo==='pagar'?'#/pagar':'#/receber')}
  return ''}

/* ───────── plumbing das gavetas: V130_open com chave "v149:…" abre a gaveta daqui ───────── */
const OPEN0=window.V130_open,CLOSE0=window.V130_close,GO0=window.V130_go;
window.V130_open=(k,a)=>{if(String(k).startsWith('v149:')){MY.dr=String(k).slice(5);MY.arg=a==null?null:a;MY.exp={}}else{MY.dr=null;MY.arg=null}return OPEN0(k,a)};
window.V130_close=()=>{MY.dr=null;MY.arg=null;return CLOSE0()};
window.V130_go=h=>{MY.dr=null;MY.arg=null;return GO0(h)};
window.V149_tog=kk=>{MY.exp[kk]=!MY.exp[kk];try{renderMain()}catch(e){try{render()}catch(_){}}};

const CSS=`<style id="v149css">
.vx .vx149-sem{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:18px 0 6px}
.vx .vx149-sem a{background:var(--card,#fff);border-radius:16px;padding:12px 12px;box-shadow:0 1px 3px rgba(0,0,0,.05);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;text-decoration:none;color:inherit}
.vx .vx149-sem a span{display:block;font-size:11px;font-weight:400;opacity:.65}
.vx .vx149-dot{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none;vertical-align:middle;cursor:pointer}
.vx .vx149-dot.gn{background:${COR.verde}}.vx .vx149-dot.am{background:${COR.amb}}.vx .vx149-dot.rd{background:${COR.verm}}.vx .vx149-dot.gr{background:${COR.cinza}}
.vd .vx149-dot{display:inline-block;border-radius:50%}.vd .vx149-dot.gn{background:${COR.verde}}.vd .vx149-dot.am{background:${COR.amb}}.vd .vx149-dot.rd{background:${COR.verm}}.vd .vx149-dot.gr{background:${COR.cinza}}
.vx .vx-sh h2 .vx149-dot{width:11px;height:11px;margin-left:6px}
.vx .vx149-grid{display:grid;gap:14px;margin-top:14px}.vx .vx149-grid.c2{grid-template-columns:1fr 1fr}.vx .vx149-grid.c3{grid-template-columns:repeat(3,minmax(0,1fr))}.vx .vx149-grid.c21{grid-template-columns:2fr 1fr}
.vx .vx149-box{background:rgba(120,120,128,.07);border-radius:18px;padding:16px 18px;min-width:0}
.vx .vx149-box h4{font-size:14px;font-weight:700;margin:0 0 10px}.vx .vx149-box h4 .vx149-h4go{color:#3D5AFE;font-weight:800}
.vx .vx149-box .vx-tile{background:var(--card,#fff)}
.vx .vx149-h3{font-size:19px;font-weight:800;margin:26px 0 0;letter-spacing:-.01em}
.vx .vx149-don{display:flex;align-items:center;gap:18px}.vx .vx149-don svg{width:140px;height:140px;flex:none}
.vx .vx149-don ul{list-style:none;margin:0;padding:0;font-size:14px}.vx .vx149-don li{padding:5px 0}.vx .vx149-don li i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px}
.vx .vx149-don li b{display:inline-block;min-width:34px;border-bottom:2px dotted rgba(120,120,128,.6)}.vx .vx149-don li em{display:block;font-style:normal;font-size:12.5px;opacity:.75;margin-left:18px}.vx .vx149-don li.vx149-sub{font-size:12.5px;opacity:.8}
.vx .vx149-bars{display:flex;flex-direction:column}
.vx .vx149-bar{display:grid;grid-template-columns:minmax(120px,170px) 1fr auto;gap:12px;align-items:center;padding:7px 0;border-top:1px solid rgba(120,120,128,.14);font-size:13.5px;min-width:0}
.vx .vx149-bar:hover{background:rgba(61,90,254,.05)}
.vx .vx149-bar:first-child{border-top:0}.vx .vx149-bar.tot{font-weight:700;border-top:2px solid rgba(120,120,128,.3)}
.vx .vx149-bar .t{position:relative;height:12px;background:rgba(120,120,128,.16);border-radius:999px;overflow:visible}
.vx .vx149-bar .t i{display:block;height:100%;border-radius:999px}
.vx .vx149-bar .t u{position:absolute;top:-4px;width:2px;height:20px;background:#111;opacity:.55}
.vx .vx149-bar .r{text-align:right;opacity:.85;white-space:nowrap}.vx .vx149-bar .r b{opacity:1;border-bottom:2px dotted rgba(120,120,128,.6)}
.vx .vx149-mk{font-weight:400;font-size:12px;opacity:.7;margin-left:8px;cursor:pointer}.vx .vx149-mk u{display:inline-block;width:2px;height:12px;background:#111;opacity:.55;vertical-align:middle;margin-right:5px}
.vx .vx149-stack{height:24px;border-radius:999px;overflow:hidden;display:flex;background:rgba(120,120,128,.16);margin:6px 0 10px}.vx .vx149-stack i{display:block;height:100%;cursor:pointer}
.vx .vx149-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:13px}.vx .vx149-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}.vx .vx149-leg span b{border-bottom:2px dotted rgba(120,120,128,.6)}
.vx .vx149-mini{font-size:12.5px;opacity:.75;margin-top:10px}.vx .vx149-mini[onclick]{cursor:pointer;text-decoration:underline dotted}
.vx .vx149-gauge{width:170px;margin:0 auto;text-align:center}.vx .vx149-gauge .w{position:relative}.vx .vx149-gauge .w svg{display:block;width:100%}.vx .vx149-gauge .gv{position:absolute;left:0;right:0;bottom:0;font-size:24px;font-weight:800;line-height:1}.vx .vx149-gauge .gs{font-size:12.5px;opacity:.8;margin-top:8px}
.vx .vx149-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.vx .vx149-chips span{background:var(--card,#fff);border-radius:999px;padding:5px 11px;font-size:12.5px;font-weight:600;cursor:pointer}.vx .vx149-chips span:hover{box-shadow:0 0 0 2px rgba(61,90,254,.25)}
.vx .vx149-vazio{opacity:.7;font-size:13.5px;padding:10px 0}
.vx .vx149-door{color:inherit;text-decoration:none;border-bottom:2px dotted rgba(120,120,128,.6);cursor:pointer}
.vx .vx-tiles.vx-c1{display:grid;grid-template-columns:1fr;gap:10px}.vx .vx-tiles.vx-c3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.vx .vx-tiles.vx-c2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.vx .vx-s .vx-tile{cursor:pointer}.vx .vx-s .vx-tile:hover{box-shadow:0 0 0 2px rgba(61,90,254,.25)}
.vx .vx-s .vx-tile em{display:block;font-style:normal;font-size:12px;opacity:.65;margin-top:4px}
.vx .vx-s .vx-tile b.pos{color:${COR.verde}}.vx .vx-s .vx-tile b.neg{color:${COR.verm}}
.vx .vx-ponte .ok{color:${COR.verde};font-weight:600}.vx .vx-ponte u{text-decoration:none;border-bottom:1px dotted rgba(120,120,128,.8);cursor:pointer}.vx .vx-ponte u:hover{color:#3D5AFE}
.vd .vx149-fonte{font-size:12.5px;background:rgba(61,90,254,.07);border-radius:12px;padding:10px 12px;margin:10px 0 12px}
.vd .vx149-why{margin:10px 0 0 18px;font-size:14px}.vd .vx149-why li{padding:4px 0}
body:has(#v130_drawer) #v147-rail{display:none} /* a régua Resumos não cobre a gaveta aberta */
@media(max-width:1100px){.vx .vx149-sem{grid-template-columns:repeat(4,1fr)}}
@media(max-width:900px){.vx .vx149-grid.c2,.vx .vx149-grid.c3,.vx .vx149-grid.c21{grid-template-columns:1fr}.vx .vx-tiles.vx-c3{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.vx .vx149-sem{grid-template-columns:1fr 1fr}.vx .vx149-bar{grid-template-columns:1fr;gap:4px}.vx .vx149-bar .r{text-align:left}.vx .vx-tiles.vx-c3,.vx .vx-tiles.vx-c2{grid-template-columns:1fr}.vx .vx149-don{flex-direction:column;align-items:flex-start}}
</style>`;

/* ───────── montagem: troca só os blocos; a entrada, a régua Resumos, o rodapé e as gavetas ficam ───────── */
function blocos(){KMEMO={};for(const k in SEMREG)delete SEMREG[k];const bs=[['b1',bRel],['b2',bCom],['b3',bPrj],['b4',bOpe],['b5',bEst],['b6',bFin],['b7',bPos]].map(([id,f])=>({id,html:T(f,'')})).filter(b=>b.html);
  if(!bs.length)return null;return CSS+semaforo(bs)+bs.map(b=>b.html).join('')}
const HOME_V130=SCREENS.home;
SCREENS.home=function(){let h=HOME_V130.apply(this,arguments);if(typeof h!=='string'||h.indexOf('id="v130_root"')<0)return h;
  try{const i0=h.indexOf('<div class="vx-top">');const i1=h.indexOf('<div class="vx-foot">');if(i0<0||i1<0)return h;
    const topEnd=h.indexOf('</div></div>',i0)+'</div></div>'.length; /* fecha .vx-top */
    const novo=blocos();if(!novo)return h;
    const top=h.slice(i0,topEnd).replace('Cada número abre os registros que o formam.','Sete áreas, um assunto por bloco. Verde = tranquilo · amarelo = atenção · vermelho = precisa de alguém (clique no ponto para saber por quê). Cada número abre os registros que o formam — os mesmos das abas.');
    h=h.slice(0,i0)+top+novo+h.slice(i1);
    if(MY.dr){const dr=T(()=>gaveta149(MY.dr,MY.arg),'');if(dr&&h.indexOf('id="v130_drawer"')<0)h+=`<div class="vd vd-ov fx2-wrapped" style="background:rgba(0,0,0,.38)" onclick="if(event.target===this)V130_close()"><div class="vd-dr" id="v130_drawer">${dr}</div></div>`}
    return h}catch(e){console.error('Visão executiva v149',e);return h}};
Object.keys(HOME_V130).forEach(k=>{try{SCREENS.home[k]=HOME_V130[k]}catch(e){}});SCREENS.home.__v149=true;
try{if(typeof isHome==='function'?isHome():/^#\/(home)?$|^#?$/.test(location.hash)){if(typeof renderMain==='function')renderMain();else render()}}catch(e){}
})();
