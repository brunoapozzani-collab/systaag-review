/* =====================================================================================================
   v149 · VISÃO EXECUTIVA = o "Dashboard de Gestão TAAG" dos donos (04/11/2026)
   Bruno (04/11): a Visão executiva do Início passa a ter os sete blocos que os donos pediram — Relacionamento,
   Comercial, Projetos, Operações, Estoque, Financeiro, Pós-vendas — simples, com gráficos, um assunto por bloco.
   Substitui os blocos antigos (Fluxo de caixa, Lucro por linha…), que continuam nas suas telas (Financeiro ›
   Fluxo de caixa, DRE). Decisões do Bruno (04/11): "Previsto" = negociações abertas × chance; Pós-venda lê o
   Pipeline filtrado pela frente Pós-venda.
   Regras: NADA aqui é calculado de novo — cada número vem do mesmo motor da aba que o mostra (V130API: com/est/
   obr/rel/pos/cx; os KPIs do Operação › Painel e do Projetos › Painel são lidos da própria tela, com o mesmo
   clique); a régua "Resumos", a entrada (globo, saudação, botões) e os dados não mudam. pt-BR em tudo; cada
   total mostra a ponte (a soma das partes); cada número abre a gaveta/tela que o forma. Só lê, nunca grava.
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
const RM=v=>{v=+v||0;const a=Math.abs(v);return (v<0?'−':'')+(a>=1e6?'R$ '+(a/1e6).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2})+' mi':a>=1e3?'R$ '+(a/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0})+' mil':R0(a))};
const P1=(a,b)=>(b>0?a/b*100:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const T=(fn,d)=>{try{const v=fn();return v==null?d:v}catch(e){console.error('Visão executiva v149',e);return d}};
const hoje=()=>T(()=>today(),null)||new Date().toISOString().slice(0,10);
const addDias=(d,n)=>{const x=new Date(String(d).slice(0,10)+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const dCurto=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7):'—';
const sum=(xs,f)=>r2((xs||[]).reduce((a,x)=>a+(+(f?f(x):x)||0),0));
const plural=(n,a,b)=>N0(n)+' '+(+n===1?a:b);
const AC=API.AC||{};const can=k=>T(()=>AC[k]?AC[k]():true,true);
const COR={azul:'#2a78d6',verde:'#12a150',verm:'#d03b3b',amb:'#e0a400',roxo:'#6f42c1',cinza:'#a3a29c',lar:'#f0702a',teal:'#0ea5a5',preto:'#151821'};

/* ───────── peças de desenho (SVG inline, rótulo sempre visível, cor nunca sozinha) ───────── */
const door=(on,txt,cls)=>`<a href="javascript:void 0" class="vx149-door ${cls||''}" onclick="${on}">${txt}</a>`;
const go=h=>`V130_go('${J(h)}')`;
const op=(k,a)=>`V130_open('${J(k)}'${a!=null?`,'${J(a)}'`:''})`;
function tile(lb,v,on,cls,sub){return `<div class="vx-tile ${cls||''}" ${on?`style="cursor:pointer" onclick="${on}"`:''}><b class="${cls||''}">${v}</b><span>${lb}</span>${sub?`<em>${sub}</em>`:''}</div>`}
function donut(segs,centro,sub){const tot=segs.reduce((a,s)=>a+(+s.v||0),0);const R=42,r=29,c=50;let a0=-Math.PI/2;
  const arcs=tot?segs.filter(s=>s.v>0).map(s=>{const a=s.v/tot*Math.PI*2;const a1=a0+.02,a2=a0+a-.02;a0+=a;if(a2<=a1)return '';const big=a2-a1>Math.PI?1:0;
    const p=(ang,rad)=>(c+rad*Math.cos(ang)).toFixed(2)+' '+(c+rad*Math.sin(ang)).toFixed(2);
    return `<path d="M${p(a1,R)} A${R} ${R} 0 ${big} 1 ${p(a2,R)} L${p(a2,r)} A${r} ${r} 0 ${big} 0 ${p(a1,r)} Z" fill="${s.cor}" ${s.on?`style="cursor:pointer" onclick="${s.on}"`:''}><title>${E(s.lb)}: ${N0(s.v)}</title></path>`}).join(''):`<circle cx="${c}" cy="${c}" r="${(R+r)/2}" fill="none" stroke="rgba(120,120,128,.18)" stroke-width="${R-r}"/>`;
  return `<div class="vx149-don"><svg viewBox="0 0 100 100">${arcs}<text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="19" font-weight="800" fill="currentColor">${E(centro)}</text></svg><ul>${segs.map(s=>`<li ${s.on?`style="cursor:pointer" onclick="${s.on}"`:''}><i style="background:${s.cor}"></i><b>${N0(s.v)}</b> ${s.lb}${s.sub?`<em>${s.sub}</em>`:''}</li>`).join('')}${sub?`<li class="vx149-sub">${sub}</li>`:''}</ul></div>`}
function barras(rows,opts){opts=opts||{};const mx=Math.max(1,...rows.map(r=>+r.max||+r.v||0));
  return `<div class="vx149-bars">${rows.map(r=>{const pct=Math.min(100,(+r.v||0)/(r.max||mx)*100);return `<div class="vx149-bar ${r.tot?'tot':''}" ${r.on?`style="cursor:pointer" onclick="${r.on}"`:''}><span class="l">${r.lb}</span><span class="t"><i style="width:${pct.toFixed(1)}%;background:${r.cor||COR.azul}"></i>${r.marca!=null?`<u style="left:${Math.min(100,r.marca).toFixed(1)}%"></u>`:''}</span><span class="r">${r.txt}</span></div>`}).join('')}</div>`}
function pilha(segs,ponte){const tot=segs.reduce((a,s)=>a+(+s.v||0),0)||1;
  return `<div class="vx149-stack">${segs.map(s=>s.v>0?`<i style="width:${(s.v/tot*100).toFixed(2)}%;background:${s.cor}" title="${E(s.lb)}: ${N0(s.v)}" ${s.on?`onclick="${s.on}"`:''}></i>`:'').join('')}</div><div class="vx149-leg">${segs.map(s=>`<span ${s.on?`style="cursor:pointer" onclick="${s.on}"`:''}><i style="background:${s.cor}"></i><b>${N0(s.v)}</b> ${s.lb}</span>`).join('')}</div>${ponte?`<div class="vx149-mini">${ponte}</div>`:''}`}
function gauge(pct,txt,sub){const p=Math.max(0,Math.min(1,pct));const L=131.9;return `<div class="vx149-gauge"><div class="w"><svg viewBox="0 0 100 58"><path d="M8 52A42 42 0 0 1 92 52" fill="none" stroke="rgba(120,120,128,.18)" stroke-width="10" stroke-linecap="round"/><path d="M8 52A42 42 0 0 1 92 52" fill="none" stroke="${COR.verde}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(L*p).toFixed(1)} ${L}"/></svg><div class="gv">${txt}</div></div><div class="gs">${sub||''}</div></div>`}
const ponte=(txt,ok)=>`<div class="vx-ponte">Ponte: ${txt} ${ok?`<span class="ok">✓ ${ok}</span>`:''}</div>`;
const box=(t,inner,cls)=>`<div class="vx149-box ${cls||''}">${t?`<h4>${t}</h4>`:''}${inner}</div>`;
const secHead=(n,t,q,link,sem)=>`<div class="vx-sh"><div><a class="vx-n" href="javascript:void 0" onclick="this.closest('section').scrollIntoView({behavior:'smooth',block:'start'})">${n}</a><h2>${t}${sem?` <i class="vx149-dot ${sem}"></i>`:''}</h2><div class="q">${q}</div></div>${link?`<a class="vx-lk" href="javascript:void 0" onclick="${go(link[1])}">${E(link[0])} ›</a>`:''}</div>`;
const sec=(id,head,inner)=>`<section class="sec vx-s vx149" id="v130_s_${id}">${head}<div class="rx"><div class="card wide">${inner}</div></div></section>`;

/* ───────── ler os KPIs de uma tela do sistema (o MESMO número, o MESMO clique) ───────── */
let KMEMO={};
function kpisDe(fn){if(KMEMO[fn])return KMEMO[fn];return KMEMO[fn]=T(()=>{const h=typeof SCREENS[fn]==='function'?SCREENS[fn]():'';if(typeof h!=='string')return {};const d=document.createElement('div');d.innerHTML=h;const out={};
  d.querySelectorAll('.stat').forEach(s=>{const lb=(s.querySelector('.lb')||{}).textContent||'';const v=(s.querySelector('.v')||{}).textContent||'';const sb=(s.querySelector('.s')||{}).textContent||'';const h0=s.closest('[onclick]');const on=h0?h0.getAttribute('onclick'):'';
    const k=lb.trim().toUpperCase();if(k)out[k]={lb:lb.trim(),n:+String(v).replace(/\./g,'').replace(',','.')||0,v:v.trim(),s:sb.trim(),on:on||''}});
  out.__doc=d;return out},{})}

/* ───────── 1 · RELACIONAMENTO ───────── */
function bRel(){if(!can('rel'))return '';
  const parc=S.db.parceiros||[];const st=p=>String(p.status||'').trim().toLowerCase();
  const ativos=parc.filter(p=>/^ativo/.test(st(p))),aq=parc.filter(p=>/aquec/.test(st(p))),frios=parc.filter(p=>/^frio/.test(st(p))),cont=parc.filter(p=>/contatar/.test(st(p)));
  const base=ativos.length+aq.length+frios.length; /* a "base em trabalho" do CRM › Painel de Gestão: Frio + Em aquecimento + Ativo */
  const TT=window.CRM_T||{};const t=hoje();const tar=(TT.tarefas||[]).filter(x=>!/conclu|cancel/i.test(x.status||''));
  const idsDe=l=>new Set(l.flatMap(p=>[p.id,String(p.crm_id)]));const tarDe=l=>{const ids=idsDe(l);return tar.filter(x=>ids.has(String(x.parceiro_id))||ids.has(x.parceiro_id))};
  const atr=tar.filter(x=>x.data_prevista&&x.data_prevista<t),prox=tar.filter(x=>x.data_prevista&&x.data_prevista>=t&&x.data_prevista<=addDias(t,7));
  const sem=atr.length?'rd':prox.length?'gn':'am';
  const grp=(l,lb,cor)=>({v:l.length,lb,cor,on:go('#/crmparceiros'),sub:`${plural(tarDe(l).length,'próxima ação','próximas ações')} · ${door(op('tar'),'ver')}`});
  const d=donut([grp(ativos,'Escritórios ativos',COR.verde),grp(aq,'Em aquecimento',COR.amb),grp(frios,'Frios',COR.azul)],N0(base),`+ <b>${N0(cont.length)}</b> a contatar (ainda fora da base em trabalho) · ${plural(tarDe(cont).length,'próxima ação','próximas ações')}`);
  const tiles=`<div class="vx-tiles vx-c1">${tile('Próximas ações nos 7 dias',N0(prox.length),op('tarProx'),prox.length?'':'')}${tile('Ações atrasadas',N0(atr.length),op('tarAtr'),atr.length?'neg':'pos')}${tile('Oportunidades vindas de parceiros',N0(T(()=>API.rel().negPAb.length,0)),op('negP'))}</div>`;
  return sec('b1',secHead('1','Relacionamento','Os escritórios que nos indicam obras: quem está ativo, quem está esquentando, quem ainda está frio — e a próxima ação de cada grupo.',['CRM › Painel de Gestão','#/crmgestao'],sem),
    `<div class="vx149-grid c21">${box('Escritórios na base em trabalho',d)}${box('Ações do CRM',tiles)}</div>`+ponte(`<u>${N0(base)}</u> na base em trabalho = <u>${N0(ativos.length)} ativos</u> + <u>${N0(aq.length)} em aquecimento</u> + <u>${N0(frios.length)} frios</u> · carteira inteira <u>${N0(parc.length)}</u> = ${N0(base)} + ${N0(cont.length)} a contatar${parc.length-base-cont.length?' + '+N0(parc.length-base-cont.length)+' não perturbe / out / sem status':''}`,'o mesmo do CRM › Painel de Gestão'))}

/* ───────── 2 · COMERCIAL ───────── */
const LIN_LB={taag_sp:'TAAG · São Paulo',taag_rj:'TAAG · Rio de Janeiro',acustica:'Acústica',focal:'Focal (FPBN)',posvenda:'Pós-venda (AT)'};
const LIN_COR={taag_sp:COR.azul,taag_rj:COR.azul,acustica:COR.lar,focal:COR.verde,posvenda:COR.roxo};
const linhaDe=p=>{const l=String(p.linha||'').toLowerCase();if(l==='taag'){const f=T(()=>FIL.daProposta(p),'');return f==='RJ'?'taag_rj':'taag_sp'}return LIN_LB[l]?l:'outra'};
const negV=(c,n)=>T(()=>c.negV(n),+n.valor||0);
const chanceB=n=>{const ch=+n.chance||0;return ch>=70?'alta':ch>=30?'media':'baixa'};
function bCom(){if(!can('com'))return '';const c=API.com();if(!c)return '';
  const m=S.db.metas||{};const ks=['taag_sp','taag_rj','acustica','focal','posvenda'];const metaTot=ks.reduce((a,k)=>a+(+m[k]||0),0)||(+m.empresa||0);
  const g={};c.ano.forEach(p=>{const k=linhaDe(p);g[k]=g[k]||{n:0,v:0,ps:[]};g[k].n++;g[k].v=r2(g[k].v+T(()=>+M.total(p),0))});
  const vend=sum(c.ano,p=>T(()=>+M.total(p),0));const prev=r2(c.pond||0);const falta=r2(metaTot-vend);
  const fracAno=(()=>{const t=hoje();const y=t.slice(0,4);const d0=new Date(y+'-01-01T12:00:00'),d1=new Date(t+'T12:00:00');return Math.max(0,Math.min(1,(d1-d0)/864e5/365))})();
  const semf=metaTot?(vend/metaTot>=fracAno?'gn':vend/metaTot>=fracAno-.15?'am':'rd'):'am';
  const rows=ks.filter(k=>g[k]||+m[k]).map(k=>{const x=g[k]||{n:0,v:0};const mt=+m[k]||0;const fr=k.startsWith('taag')?'taag':k;const fil=k==='taag_sp'?'SP':k==='taag_rj'?'RJ':'';
    return {lb:LIN_LB[k],v:mt?x.v/mt*100:0,max:100,cor:LIN_COR[k],marca:fracAno*100,txt:`<b>${R0(x.v)}</b> de ${R0(mt)} · ${P1(x.v,mt)} · ${plural(x.n,'proposta','propostas')}`,on:`V130_metaGo('${fr}','${fil}')`}});
  if(g.outra)rows.push({lb:'Sem linha',v:0,max:100,cor:COR.cinza,txt:`<b>${R0(g.outra.v)}</b> · ${plural(g.outra.n,'proposta','propostas')}`,on:op('vendAno')});
  rows.push({lb:'TAAG',tot:true,v:metaTot?vend/metaTot*100:0,max:100,cor:COR.preto,marca:fracAno*100,txt:`<b>${R0(vend)}</b> de ${R0(metaTot)} · ${P1(vend,metaTot)} · ${plural(c.ano.length,'proposta','propostas')}`,on:op('vendAno')});
  const tiles=`<div class="vx-tiles vx-c4"><div class="vx-hi">${tile('Meta '+E(c.y),R0(metaTot),go('#/dblistas/regras'))}</div>${tile('Realizado · '+plural(c.ano.length,'proposta','propostas'),R0(vend),op('vendAno'),'pos',P1(vend,metaTot)+' da meta')}${tile('Previsto · negociações abertas × chance',R0(prev),op('pipe'),'',plural(c.negs.length,'negociação aberta','negociações abertas')+((c.semValor||[]).length?' · '+N0(c.semValor.length)+' sem valor cadastrado':''))}${tile('Faltam para a meta',R0(falta),go('#/gestao'),falta>0?'neg':'pos')}</div>`;
  const termos=ks.filter(k=>g[k]).map(k=>`<u>${N0(g[k].n)} ${LIN_LB[k].replace('TAAG · ','')}</u>`).concat(g.outra?[`<u>${N0(g.outra.n)} sem linha</u>`]:[]).join(' + ');
  /* oportunidades em negociação: o Pipeline (negociações abertas = sem resultado) */
  const N=S.db.negociacoes||[];const fech=N.filter(n=>n.resultado==='fechada'),perd=N.filter(n=>n.resultado==='perdida'),fut=N.filter(n=>n.resultado==='futuro'),ab=N.filter(n=>!n.resultado);
  const negs=c.negs;const vNeg=sum(negs,n=>negV(c,n));
  const byB={alta:[],media:[],baixa:[]};negs.forEach(n=>byB[chanceB(n)].push(n));
  const chance=[['alta','🟢 Alta · 70% ou mais',COR.verde],['media','🟡 Média · 30% a 69%',COR.amb],['baixa','🔴 Baixa · abaixo de 30%',COR.verm]].map(([k,lb,cor])=>({lb,v:byB[k].length,max:Math.max(1,negs.length),cor,txt:`<b>${N0(byB[k].length)}</b> · ${R0(sum(byB[k],n=>negV(c,n)))}`,on:op('pipe')}));
  const byC={};negs.forEach(n=>{const k=n.consultor||'Sem consultor';(byC[k]=byC[k]||{n:0,v:0});byC[k].n++;byC[k].v=r2(byC[k].v+negV(c,n))});
  const cons=Object.entries(byC).sort((a,b)=>b[1].n-a[1].n).slice(0,6).map(([k,x])=>({lb:E(k),v:x.n,max:Math.max(1,negs.length),cor:COR.azul,txt:`<b>${N0(x.n)}</b> · ${R0(x.v)}`,on:op('pipe')}));
  const pNome=id=>{const p=(S.db.parceiros||[]).find(x=>x.id===id||String(x.crm_id)===String(id));return p?p.nome:null};
  const byP={};negs.forEach(n=>{const ps=n.parceiros||{};const id=ps.indicador||ps.arquitetura||ps.gerenciadora;const k=id?(pNome(id)||('Parceiro '+id)):'Sem parceiro (direto)';(byP[k]=byP[k]||{n:0,v:0});byP[k].n++;byP[k].v=r2(byP[k].v+negV(c,n))});
  const parcs=Object.entries(byP).sort((a,b)=>b[1].n-a[1].n).slice(0,6).map(([k,x])=>({lb:E(k),v:x.n,max:Math.max(1,negs.length),cor:COR.teal,txt:`<b>${N0(x.n)}</b> · ${R0(x.v)}`,on:op('negP')}));
  const etapaLb=e=>({desenvolver:'Desenvolver proposta',enviada:'Proposta enviada',revisao:'Revisão de proposta',desenvolvida:'Proposta desenvolvida',encontro:'Encontro',aguardando:'Aguardando'})[String(e||'').toLowerCase()]||(e?String(e):'Sem etapa');
  const byE={};negs.forEach(n=>{const k=etapaLb(n.etapa);byE[k]=(byE[k]||0)+1});const etapas=Object.entries(byE).sort((a,b)=>b[1]-a[1]);
  const conv=fech.length+perd.length?fech.length/(fech.length+perd.length):0;
  const opp=`<div class="vx149-grid c3">
    ${box('Em negociação',`<div class="vx-big" style="padding:10px 0 0"><b>${door(op('pipe'),N0(negs.length))}</b> <span>negociações abertas · ${R0(vNeg)}</span></div><div class="vx149-chips">${etapas.map(([k,v])=>`<span>${N0(v)} ${E(k)}</span>`).join('')}</div>`)}
    ${box('Conversão',gauge(conv,P1(fech.length,fech.length+perd.length),`${N0(fech.length)} ganhas de ${N0(fech.length+perd.length)} decididas`))}
    ${box('Pipeline inteiro',pilha([{lb:'ganhas',v:fech.length,cor:COR.verde,on:go('#/pipeline')},{lb:'perdidas',v:perd.length,cor:COR.cinza,on:go('#/pipeline')},{lb:'futuro',v:fut.length,cor:COR.amb,on:go('#/pipeline')},{lb:'abertas',v:ab.length,cor:COR.azul,on:op('pipe')}],`${N0(N.length)} = ${N0(fech.length)} + ${N0(perd.length)} + ${N0(fut.length)} + ${N0(ab.length)}`))}
   </div>
   <div class="vx149-grid c3" style="margin-top:14px">${box('Por chance de fechamento',barras(chance))}${box('Por consultor',cons.length?barras(cons):'<div class="vx149-vazio">—</div>')}${box('Por parceiro (quem indicou)',parcs.length?barras(parcs):'<div class="vx149-vazio">—</div>')}</div>`;
  return sec('b2',secHead('2','Comercial',`Meta ${E(c.y)}: quanto já vendemos, quanto está previsto e quanto falta — os mesmos números de Comercial › Gestão. Depois, as oportunidades em negociação.`,['Comercial › Gestão','#/gestao'],semf),
    tiles+box('Metas por linha — realizado × meta <span class="vx149-mk"><u></u> hoje já passou '+P1(fracAno*100,100)+' do ano</span>',barras(rows))+
    ponte(`<u>${N0(c.ano.length)} propostas</u> = ${termos||'—'} · <u>${R0(vend)}</u> = ${ks.filter(k=>g[k]).map(k=>R0(g[k].v)).join(' + ')}${g.outra?' + '+R0(g.outra.v):''}`,'o mesmo de Comercial › Propostas')+
    `<h3 class="vx149-h3">Oportunidades em negociação</h3>`+opp)}

/* ───────── 3 · PROJETOS ───────── */
function bPrj(){if(!can('obr'))return '';const K=kpisDe('prjpainel');const o=T(()=>API.obr(),null)||{g:{},pend:[]};
  const get=re=>Object.values(K).find(x=>x&&x.lb&&re.test(x.lb))||null;
  const kProj=get(/^projetos em andamento/i),kArq=get(/aguardando arquivos/i),kElab=get(/em elaboração/i),kAprov=get(/aprovados este/i),kBrief=get(/sem briefing/i),kAtr=get(/entregáveis atrasados/i);
  const kAnd=(Object.values(kpisDe('copainel')).find(x=>x&&x.lb&&/^em andamento/i.test(x.lb))||{}).n||0;const ea=kAnd;
  const semf=kAtr&&kAtr.n?'rd':kBrief&&kBrief.n?'am':'gn';
  const row=(k,cor)=>k?{lb:E(k.lb),v:k.n,max:Math.max(1,ea),cor,txt:`<b>${N0(k.n)}</b> ${E(k.s)}`,on:k.on||go('#/prjpainel')}:null;
  const rows=[row(kProj,COR.lar),row(kArq,COR.amb),row(kElab,COR.azul),row(kBrief,COR.verm),row(kAtr,COR.verm)].filter(Boolean);
  const tiles=`<div class="vx-tiles vx-c3">${tile('Obras com projeto em andamento',N0(kProj?kProj.n:0),kProj?kProj.on:go('#/prjpainel'))}${tile('Entregáveis pendentes',N0(o.pend.length),op('prj'))}${tile('Aprovados este mês',N0(kAprov?kAprov.n:0),kAprov?kAprov.on:go('#/prjpainel'),'pos')}</div>`;
  return sec('b3',secHead('3','Projetos',`Das ${N0(ea)} obras em andamento, onde cada uma está na cadeia de projeto — os mesmos números de Projetos › Painel.`,['Projetos › Painel','#/prjpainel'],semf),
    tiles+box('Projetos em andamento — a fila',rows.length?barras(rows)+`<div class="vx149-mini">Uma obra pode estar em mais de uma linha (por isso as linhas não somam ${N0(ea)}). Cada linha abre a lista do Painel de Projetos.</div>`:'<div class="vx149-vazio">Painel de Projetos sem dados.</div>'))}

/* ───────── 4 · OPERAÇÕES ───────── */
function bOpe(){if(!can('obr'))return '';const K=kpisDe('copainel');
  const get=re=>Object.values(K).find(x=>x&&x.lb&&re.test(x.lb))||null;
  const kAnd=get(/^em andamento/i),kHold=get(/^on hold/i),kConc=get(/^conclu/i),kPend=get(/pendências abertas/i),kAtv=get(/atividades atrasadas/i),k7=get(/próximos 7 dias/i);
  const tot=(kAnd?kAnd.n:0)+(kHold?kHold.n:0)+(kConc?kConc.n:0);
  /* obras ativas por unidade: lidas da própria tela (mesma lista, mesmo clique) */
  const uns=[];T(()=>{const d=K.__doc;if(!d)return;[...d.querySelectorAll('div')].filter(x=>/^Unidade /.test((x.querySelector('b')||{}).textContent||'')&&x.querySelector('.chip')).forEach(x=>{const lb=x.querySelector('b').textContent.trim();const n=+x.querySelector('.chip').textContent.replace(/\./g,'')||0;const sb=(x.querySelector('.sub')||{}).textContent||'';const mAnd=/(\d+) em andamento/.exec(sb);if(uns.some(u=>u.lb===lb))return;uns.push({lb,n,and:mAnd?+mAnd[1]:n,sub:sb.trim(),on:x.getAttribute('onclick')||''})})});
  
  /* previsão de entrega: as obras "Em andamento" de Operação › Obras (o mesmo filtro do Painel), pela data de entrega prevista de cada obra */
  const t=hoje();const w1=addDias(t,7),w2=addDias(t,21),w3=addDias(t,60);
  const sit=x=>T(()=>C.situacao(x),null)||x.situacao||x.statusPlanilha||'';
  const and=(S.db.obras||[]).filter(x=>x.ativo!==false&&!x.inativo&&sit(x)==='Em andamento');
  const pv=x=>String((x.entrega||{}).prevista||'').slice(0,10);
  const atrs=and.filter(x=>pv(x)&&pv(x)<t),p1=and.filter(x=>pv(x)>=t&&pv(x)<=w1),p2=and.filter(x=>pv(x)>w1&&pv(x)<=w2),p3=and.filter(x=>pv(x)>w2&&pv(x)<=w3),p4=and.filter(x=>pv(x)>w3),semD=and.filter(x=>!pv(x));
  const semf=(kAtv&&kAtv.n)||atrs.length?'rd':semD.length?'am':'gn';
  const goObras=`COP.ope.go('obras',{situacao:'Em andamento'},'#/obras')`;
  const esq=box('Obras · '+N0(tot)+' no total',pilha([{lb:'em andamento',v:kAnd?kAnd.n:0,cor:COR.azul,on:kAnd?kAnd.on:''},{lb:'on hold',v:kHold?kHold.n:0,cor:COR.amb,on:kHold?kHold.on:''},{lb:'concluídas',v:kConc?kConc.n:0,cor:COR.verde,on:kConc?kConc.on:''}],`${N0(tot)} = ${N0(kAnd?kAnd.n:0)} + ${N0(kHold?kHold.n:0)} + ${N0(kConc?kConc.n:0)}`)+
    (uns.length?barras(uns.map(u=>({lb:E(u.lb),v:u.and,max:Math.max(1,kAnd?kAnd.n:1),cor:COR.azul,txt:`<b>${N0(u.and)}</b> em andamento · ${N0(u.n)} ativas`,on:u.on||go('#/obras')}))):'')+
    `<div class="vx-tiles vx-c2" style="margin-top:12px">${tile('Atividades atrasadas',N0(kAtv?kAtv.n:0),kAtv?kAtv.on:go('#/copainel'),kAtv&&kAtv.n?'neg':'pos','fim previsto já passou')}${tile('Atividades nos próximos 7 dias',N0(k7?k7.n:0),k7?k7.on:go('#/copainel'))}</div>`);
  const dir=box('Previsão de entrega · das '+N0(and.length)+' obras em andamento',pilha([{lb:'atrasadas',v:atrs.length,cor:COR.verm,on:goObras},{lb:'até 7 dias',v:p1.length,cor:COR.verde,on:goObras},{lb:'8 a 21 dias',v:p2.length,cor:COR.azul,on:goObras},{lb:'22 a 60 dias',v:p3.length,cor:COR.teal,on:goObras},{lb:'depois de 60 dias',v:p4.length,cor:COR.roxo,on:goObras},{lb:'sem data de entrega',v:semD.length,cor:COR.cinza,on:goObras}],`${N0(and.length)} = ${N0(atrs.length)} + ${N0(p1.length)} + ${N0(p2.length)} + ${N0(p3.length)} + ${N0(p4.length)} + ${N0(semD.length)}`)+
    `<div class="vx-tiles vx-c2" style="margin-top:12px">${tile('Entregam nos próximos 7 dias',N0(p1.length),goObras,'pos')}${tile('Sem data de entrega',N0(semD.length),goObras,semD.length?'neg':'','a data fica em Operação › Obras › Entrega')}</div>`);
  return sec('b4',secHead('4','Operações','Obras em andamento e o que entrega nos próximos dias — os mesmos números de Operação › Painel.',['Operação › Painel','#/copainel'],semf),
    `<div class="vx149-grid c2">${esq}${dir}</div>`+ponte(`<u>${N0(kAnd?kAnd.n:0)}</u> em andamento${uns.length?' = '+uns.map(u=>`<u>${N0(u.and)} ${E(u.lb.replace('Unidade ',''))}</u>`).join(' + '):''} · com data de entrega: ${N0(and.length-semD.length)} · sem data: ${N0(semD.length)}`,and.length===(kAnd?kAnd.n:0)?'o mesmo de Operação › Obras':''))}

/* ───────── 5 · ESTOQUE ───────── */
function bEst(){if(!can('est'))return '';const e=API.est();if(!e)return '';const custo=can('custo');
  /* territórios = Base › Locais nível 1 (SP, RJ, Focal…), unidades agrupadas pelo caminho do lugar — o mesmo da gaveta "lugar" do Início */
  const LOC=S.db.locais||[];const n1s=LOC.filter(l=>l.nivel===1&&!l.inativo);const terr={};n1s.forEach(a=>terr[a.nome]={nome:a.nome,us:[],nossas:[]});
  const custoU=u=>{const p=T(()=>get('produtos',u.produto_id),null)||(S.db.produtos||[]).find(x=>x.id===u.produto_id)||{};return (+u.custo>0)?+u.custo:(+p.custo||0)};
  (e.us||[]).forEach(u=>{const p=T(()=>L.path(u.loc_id),[])||[];const a=(p[0]||{}).nome||'Sem lugar';(terr[a]=terr[a]||{nome:a,us:[],nossas:[]});terr[a].us.push(u);if(u.natureza!=='consignado')terr[a].nossas.push(u)});
  const ts=Object.values(terr);const totU=ts.reduce((a,x)=>a+x.us.length,0);/* os mesmos motores do Estoque › Painel Geral: T8().custoTotal (inventário ao custo de compra) e FS.estoqueCusto() (patrimônio = nossas) */
  const T8U=T(()=>T8(),null);const custoTot=T8U?r2(+T8U.custoTotal):sum(e.us,custoU);const cTer={};((T8U||{}).units||[]).forEach(u=>{const k=String(u.local||'').split(' › ')[0];cTer[k]=r2((cTer[k]||0)+(+u.custo||0))});const custoDe=x=>cTer[x.nome]!=null?cTer[x.nome]:sum(x.us,custoU);const nT8=((T8U||{}).units||[]).length;const custoNos=T(()=>+FS.estoqueCusto(),null)??e.canon.custo;const custoTer=r2(custoTot-custoNos);
  const livre=(e.g.livre||[]).length,ped=(e.g.ped||[]).length,alo=(e.g.alo||[]).length,fora=(e.g.fora||[]).length,cons=(e.g.cons||[]).length;
  const semf=e.nec.length||e.atras.length?'rd':e.transito.length?'am':'gn';
  const tiles=`<div class="vx-tiles vx-c4"><div class="vx-hi">${tile('Estoque principal · '+plural(e.canon.total,'unidade','unidades'),custo?R$(custoTot):N0(e.canon.total)+' un.',go('#/epainel'),'',custo?'ao custo de compra · nossas '+R$(custoNos)+' + de terceiro '+R$(custoTer):'')}</div>${ts.slice(0,3).map(x=>tile(E(x.nome),N0(x.us.length)+' un.',go('#/epainel'),'',custo?R$(custoDe(x))+' ao custo de compra':'')).join('')}${ts.length<3?Array.from({length:3-ts.length},()=>tile('—','—',go('#/dblocais'),'','território ainda não cadastrado na Base › Locais')).join(''):''}</div>`;
  const comp=box('Das '+N0(e.canon.total)+' unidades',pilha([{lb:'livres',v:livre,cor:COR.verde,on:op('est_livre')},{lb:'pedidas por propostas',v:ped,cor:COR.azul,on:op('est_ped')},{lb:'separadas / em montagem',v:alo,cor:COR.roxo,on:op('est_alo')},{lb:'fora de venda',v:fora,cor:COR.cinza,on:op('est_fora')},{lb:'consignadas',v:cons,cor:COR.amb,on:op('est_cons')}],`${N0(livre+ped+alo+fora+cons)} = ${N0(livre)} + ${N0(ped)} + ${N0(alo)} + ${N0(fora)} + ${N0(cons)}`));
  const acomp=box('A comprar',`<div class="vx-tiles vx-c2">${tile('Itens vendidos ainda sem compra',N0(e.qNec),op('nec'),e.qNec?'neg':'pos',custo&&e.qNec?R$(e.vNec)+' ao custo de catálogo':'o estoque livre e os pedidos cobrem tudo')}${tile('A chegar (pedidos aprovados)',N0(e.transito.length),op('transito'),e.atras.length?'neg':'',e.atras.length?plural(e.atras.length,'pedido atrasado','pedidos atrasados'):'')}</div>`);
  return sec('b5',secHead('5','Estoque','O que temos nos estoques (ao custo de compra) e o que falta comprar para as obras — os mesmos números de Estoque › Painel Geral.',['Estoque › Painel Geral','#/epainel'],semf),
    tiles+`<div class="vx149-grid c2">${comp}${acomp}</div>`+ponte(`<u>${N0(totU)}</u> unidades = ${ts.map(x=>`<u>${N0(x.us.length)} ${E(x.nome)}</u>`).join(' + ')}${custo?` · <u>${R$(custoTot)}</u> = ${ts.map(x=>R$(custoDe(x))).join(' + ')}${nT8&&nT8!==e.canon.total?` (custo sobre ${N0(nT8)} un.; ${N0(e.canon.total-nT8)} un. sem custo no motor do Painel)`:''} = patrimônio ${R$(custoNos)} (${N0(e.canon.nossas)} un. nossas) + ${R$(custoTer)} (${N0(e.canon.total-e.canon.nossas)} un. de terceiro)`:''}`,'o mesmo de Estoque › Painel Geral'))}

/* ───────── 6 · FINANCEIRO ───────── */
function bFin(){if(!can('fin'))return '';const t=hoje();const d30=addDias(t,30);
  const caixa=T(()=>+FS.caixa(),0)||0;const L=(S.db.lancamentos||[]).filter(l=>!l.pago_em&&String(l.vencimento||'').slice(0,10)<=d30);
  const pag=L.filter(l=>l.tipo==='pagar'),rec=L.filter(l=>l.tipo==='receber');
  const vencP=pag.filter(l=>String(l.vencimento||'')<t),vencR=rec.filter(l=>String(l.vencimento||'')<t);
  const orig=l=>String(l.origem||l.categoria||'').toLowerCase();
  const folha=pag.filter(l=>/folha|salari|comiss|rt\b/.test(orig(l))),fixos=pag.filter(l=>!folha.includes(l)&&/fixo|aluguel|conta|assinatura/.test(orig(l))),vari=pag.filter(l=>!folha.includes(l)&&!fixos.includes(l));
  const propDe=l=>l.origem_id?(T(()=>get('propostas',l.origem_id),null)||(S.db.propostas||[]).find(p=>p.id===l.origem_id)):null;
  const linhaR=l=>{const p=propDe(l);const k=p?String(p.linha||'').toLowerCase():'';return k==='acustica'?'TAAG Acoustic':k==='posvenda'?'Pós-vendas':k==='focal'?'Focal':k==='taag'?'Projetos TAAG':'Outros'};
  const byR={'Projetos TAAG':[],'TAAG Acoustic':[],'Pós-vendas':[],'Focal':[],'Outros':[]};rec.forEach(l=>byR[linhaR(l)].push(l));
  const vP=sum(pag,l=>l.valor),vR=sum(rec,l=>l.valor);const vazio=!caixa&&!L.length;
  const semf=vazio?'gr':(caixa<0||vencR.length||vencP.length)?'rd':(caixa+vR-vP<0?'am':'gn');
  const tiles=`<div class="vx-tiles vx-c4"><div class="vx-hi">${tile('Saldo em caixa hoje',R$(caixa),go('#/fincontas'),caixa<0?'neg':'')}</div>${tile('Contas a receber · 30 dias',R$(vR),go('#/receber'),'pos',plural(rec.length,'parcela','parcelas')+(vencR.length?' · '+plural(vencR.length,'vencida','vencidas'):''))}${tile('Contas a pagar · 30 dias',R$(-vP),go('#/pagar'),'neg',plural(pag.length,'título','títulos')+(vencP.length?' · '+plural(vencP.length,'vencido','vencidos'):''))}${tile('Caixa daqui a 30 dias',R$(caixa+vR-vP),go('#/fluxo'),caixa+vR-vP<0?'neg':'')}</div>`;
  const mx=Math.max(1,vP,vR);
  const aPag=box('Contas a pagar · '+R$(vP),barras([{lb:'Folha',v:sum(folha,l=>l.valor),max:mx,cor:COR.verm,txt:`<b>${R$(sum(folha,l=>l.valor))}</b> · ${N0(folha.length)}`,on:go('#/folha')},{lb:'Custos fixos',v:sum(fixos,l=>l.valor),max:mx,cor:COR.verm,txt:`<b>${R$(sum(fixos,l=>l.valor))}</b> · ${N0(fixos.length)}`,on:go('#/pagar')},{lb:'Custos variáveis',v:sum(vari,l=>l.valor),max:mx,cor:COR.verm,txt:`<b>${R$(sum(vari,l=>l.valor))}</b> · ${N0(vari.length)}`,on:go('#/pagar')}]));
  const aRec=box('Contas a receber · '+R$(vR),barras(Object.keys(byR).filter(k=>k!=='Outros'||byR[k].length).map(k=>({lb:k,v:sum(byR[k],l=>l.valor),max:mx,cor:COR.verde,txt:`<b>${R$(sum(byR[k],l=>l.valor))}</b> · ${N0(byR[k].length)}`,on:go('#/receber')}))));
  return sec('b6',secHead('6','Financeiro','Caixa hoje, o que sai e o que entra nos próximos 30 dias — os mesmos títulos de Financeiro › Hoje.',['Financeiro › Hoje','#/fhoje'],semf),
    tiles+`<div class="vx149-grid c2">${aPag}${aRec}</div>`+(vazio?`<div class="vx-ponte" style="background:rgba(224,164,0,.1)">Ainda sem lançamentos reais — os valores aparecem assim que o Financeiro for carregado na Base.</div>`:ponte(`<u>${R$(caixa)}</u> hoje + <u>${R$(vR)}</u> a receber − <u>${R$(vP)}</u> a pagar = <u>${R$(caixa+vR-vP)}</u> em 30 dias · a pagar = ${R$(sum(folha,l=>l.valor))} folha + ${R$(sum(fixos,l=>l.valor))} fixos + ${R$(sum(vari,l=>l.valor))} variáveis`,'o mesmo de Financeiro › Hoje')))}

/* ───────── 7 · PÓS-VENDAS ───────── */
function bPos(){if(!can('pos'))return '';const p=API.pos();const c=T(()=>API.com(),null);
  const N=(S.db.negociacoes||[]).filter(n=>String(n.frente||'').toLowerCase()==='posvenda');const ab=N.filter(n=>!n.resultado);
  const fech=N.filter(n=>n.resultado==='fechada'),perd=N.filter(n=>n.resultado==='perdida');
  const byB={alta:[],media:[],baixa:[]};ab.forEach(n=>byB[chanceB(n)].push(n));const vv=n=>c?negV(c,n):(+n.valor||0);
  const chance=[['alta','🟢 Alta · 70% ou mais',COR.verde],['media','🟡 Média · 30% a 69%',COR.amb],['baixa','🔴 Baixa · abaixo de 30%',COR.verm]].map(([k,lb,cor])=>({lb,v:byB[k].length,max:Math.max(1,ab.length),cor,txt:`<b>${N0(byB[k].length)}</b> · ${R0(sum(byB[k],vv))}`,on:go('#/pipeline')}));
  const semf=(p&&p.osAtr.length)?'rd':(p&&p.os.length)?'am':'gn';
  const tiles=`<div class="vx-tiles vx-c3">${tile('Em negociação (Pipeline · Pós-venda)',N0(ab.length),go('#/pipeline'),'',R0(sum(ab,vv)))}${tile('Propostas AT enviadas ou aprovadas',N0(p?p.pv.length:0),op('pvProp'),'pos',p?R$(p.vPv):'')}${tile('Chamados abertos',N0(p?p.os.length:0),op('os'),p&&p.osAtr.length?'neg':'',p&&p.osAtr.length?plural(p.osAtr.length,'há mais de 7 dias','há mais de 7 dias'):'')}</div>`;
  return sec('b7',secHead('7','Pós-vendas','Oportunidades de assistência técnica em negociação (o Pipeline, frente Pós-venda) e os chamados abertos.',['Pós-venda › Visão geral','#/posvisao'],semf),
    tiles+`<div class="vx149-grid c2">${box('Por chance de fechamento',ab.length?barras(chance):'<div class="vx149-vazio">Nenhuma negociação de pós-venda aberta no Pipeline.</div>')}${box('Pipeline Pós-venda',pilha([{lb:'ganhas',v:fech.length,cor:COR.verde},{lb:'perdidas',v:perd.length,cor:COR.cinza},{lb:'abertas',v:ab.length,cor:COR.azul}],`${N0(N.length)} = ${N0(fech.length)} + ${N0(perd.length)} + ${N0(ab.length)}${N.length-fech.length-perd.length-ab.length?' + '+N0(N.length-fech.length-perd.length-ab.length)+' futuro':''}`))}</div>`)}

/* ───────── semáforo: a empresa num olhar ───────── */
function semaforo(blocks){const lb={b1:'Relacionamento',b2:'Comercial',b3:'Projetos',b4:'Operações',b5:'Estoque',b6:'Financeiro',b7:'Pós-vendas'};
  return `<div class="vx149-sem">${blocks.map(b=>{const m=/<i class="vx149-dot (\w+)"><\/i>/.exec(b.html)||[];const cls=m[1]||'gr';const t={gn:'tranquilo',am:'atenção',rd:'precisa de alguém',gr:'sem dados'}[cls];return `<a href="javascript:void 0" onclick="V130_sec('${b.id}')"><i class="vx149-dot ${cls}"></i><b>${lb[b.id]}</b><span>${t}</span></a>`}).join('')}</div>`}

const CSS=`<style id="v149css">
.vx .vx149-sem{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:18px 0 6px}
.vx .vx149-sem a{background:var(--card,#fff);border-radius:16px;padding:12px 12px;box-shadow:0 1px 3px rgba(0,0,0,.05);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;text-decoration:none;color:inherit}
.vx .vx149-sem a span{display:block;font-size:11px;font-weight:400;opacity:.65}
.vx .vx149-dot{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none;vertical-align:middle}
.vx .vx149-dot.gn{background:${COR.verde}}.vx .vx149-dot.am{background:${COR.amb}}.vx .vx149-dot.rd{background:${COR.verm}}.vx .vx149-dot.gr{background:${COR.cinza}}
.vx .vx-sh h2 .vx149-dot{width:11px;height:11px;margin-left:6px}
.vx .vx149-grid{display:grid;gap:14px;margin-top:14px}.vx .vx149-grid.c2{grid-template-columns:1fr 1fr}.vx .vx149-grid.c3{grid-template-columns:repeat(3,minmax(0,1fr))}.vx .vx149-grid.c21{grid-template-columns:2fr 1fr}
.vx .vx149-box{background:rgba(120,120,128,.07);border-radius:18px;padding:16px 18px;min-width:0}
.vx .vx149-box h4{font-size:14px;font-weight:700;margin:0 0 10px}
.vx .vx149-box .vx-tile{background:var(--card,#fff)}
.vx .vx149-h3{font-size:19px;font-weight:800;margin:26px 0 0;letter-spacing:-.01em}
.vx .vx149-don{display:flex;align-items:center;gap:18px}.vx .vx149-don svg{width:140px;height:140px;flex:none}
.vx .vx149-don ul{list-style:none;margin:0;padding:0;font-size:14px}.vx .vx149-don li{padding:5px 0}.vx .vx149-don li i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px}
.vx .vx149-don li b{display:inline-block;min-width:34px}.vx .vx149-don li em{display:block;font-style:normal;font-size:12.5px;opacity:.7;margin-left:18px}.vx .vx149-don li.vx149-sub{font-size:12.5px;opacity:.7}
.vx .vx149-bars{display:flex;flex-direction:column}
.vx .vx149-bar{display:grid;grid-template-columns:minmax(120px,170px) 1fr auto;gap:12px;align-items:center;padding:7px 0;border-top:1px solid rgba(120,120,128,.14);font-size:13.5px;min-width:0}
.vx .vx149-bar:first-child{border-top:0}.vx .vx149-bar.tot{font-weight:700;border-top:2px solid rgba(120,120,128,.3)}
.vx .vx149-bar .t{position:relative;height:12px;background:rgba(120,120,128,.16);border-radius:999px;overflow:visible}
.vx .vx149-bar .t i{display:block;height:100%;border-radius:999px}
.vx .vx149-bar .t u{position:absolute;top:-4px;width:2px;height:20px;background:#111;opacity:.55}
.vx .vx149-bar .r{text-align:right;opacity:.85;white-space:nowrap}.vx .vx149-bar .r b{opacity:1}
.vx .vx149-mk{font-weight:400;font-size:12px;opacity:.7;margin-left:8px}.vx .vx149-mk u{display:inline-block;width:2px;height:12px;background:#111;opacity:.55;vertical-align:middle;margin-right:5px}
.vx .vx149-stack{height:24px;border-radius:999px;overflow:hidden;display:flex;background:rgba(120,120,128,.16);margin:6px 0 10px}.vx .vx149-stack i{display:block;height:100%;cursor:pointer}
.vx .vx149-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:13px}.vx .vx149-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}
.vx .vx149-mini{font-size:12.5px;opacity:.7;margin-top:10px}
.vx .vx149-gauge{width:170px;margin:0 auto;text-align:center}.vx .vx149-gauge .w{position:relative}.vx .vx149-gauge .w svg{display:block;width:100%}.vx .vx149-gauge .gv{position:absolute;left:0;right:0;bottom:0;font-size:24px;font-weight:800;line-height:1}.vx .vx149-gauge .gs{font-size:12.5px;opacity:.7;margin-top:8px}
.vx .vx149-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.vx .vx149-chips span{background:var(--card,#fff);border-radius:999px;padding:5px 11px;font-size:12.5px;font-weight:600}
.vx .vx149-vazio{opacity:.6;font-size:13.5px;padding:10px 0}
.vx .vx149-door{color:inherit;text-decoration:none;border-bottom:2px dotted rgba(120,120,128,.6)}
.vx .vx-tiles.vx-c1{display:grid;grid-template-columns:1fr;gap:10px}.vx .vx-tiles.vx-c3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.vx .vx-tiles.vx-c2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.vx .vx-s .vx-tile em{display:block;font-style:normal;font-size:12px;opacity:.65;margin-top:4px}
.vx .vx-s .vx-tile b.pos{color:${COR.verde}}.vx .vx-s .vx-tile b.neg{color:${COR.verm}}
.vx .vx-ponte .ok{color:${COR.verde};font-weight:600}.vx .vx-ponte u{text-decoration:none;border-bottom:1px dotted rgba(120,120,128,.7)}
@media(max-width:1100px){.vx .vx149-sem{grid-template-columns:repeat(4,1fr)}}
@media(max-width:900px){.vx .vx149-grid.c2,.vx .vx149-grid.c3,.vx .vx149-grid.c21{grid-template-columns:1fr}.vx .vx-tiles.vx-c3{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.vx .vx149-sem{grid-template-columns:1fr 1fr}.vx .vx149-bar{grid-template-columns:1fr;gap:4px}.vx .vx149-bar .r{text-align:left}.vx .vx-tiles.vx-c3,.vx .vx-tiles.vx-c2{grid-template-columns:1fr}.vx .vx149-don{flex-direction:column;align-items:flex-start}}
</style>`;

/* ───────── montagem: troca só os blocos; a entrada, a régua Resumos, o rodapé e as gavetas ficam ───────── */
function blocos(){KMEMO={};const bs=[['b1',bRel],['b2',bCom],['b3',bPrj],['b4',bOpe],['b5',bEst],['b6',bFin],['b7',bPos]].map(([id,f])=>({id,html:T(f,'')})).filter(b=>b.html);
  if(!bs.length)return null;return CSS+semaforo(bs)+bs.map(b=>b.html).join('')}
const HOME_V130=SCREENS.home;
SCREENS.home=function(){let h=HOME_V130.apply(this,arguments);if(typeof h!=='string'||h.indexOf('id="v130_root"')<0)return h;
  try{const i0=h.indexOf('<div class="vx-top">');const i1=h.indexOf('<div class="vx-foot">');if(i0<0||i1<0)return h;
    const topEnd=h.indexOf('</div></div>',i0)+'</div></div>'.length; /* fecha .vx-top */
    const novo=blocos();if(!novo)return h;
    const top=h.slice(i0,topEnd).replace('Cada número abre os registros que o formam.','Sete áreas, um assunto por bloco. Verde = tranquilo · amarelo = atenção · vermelho = precisa de alguém. Cada número abre os registros que o formam — os mesmos das abas.');
    return h.slice(0,i0)+top+novo+h.slice(i1)}catch(e){console.error('Visão executiva v149',e);return h}};
Object.keys(HOME_V130).forEach(k=>{try{SCREENS.home[k]=HOME_V130[k]}catch(e){}});SCREENS.home.__v149=true;
try{if(typeof isHome==='function'?isHome():/^#\/(home)?$|^#?$/.test(location.hash)){if(typeof renderMain==='function')renderMain();else render()}}catch(e){}
})();
