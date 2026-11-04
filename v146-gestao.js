/* v146 — Comercial › Gestão lê o mesmo que as outras abas (Bruno, 03/11/2026: "Focal tem 15 propostas e a Gestão não mostra;
   a informação tem de ser UMA").
   O que estava errado: o filtro de frente/consultor da Gestão filtrava só as negociações (Pipeline) — as propostas vendidas
   (R$ vendido, meta, Boutique) ignoravam o filtro; "264 propostas fechadas" eram negociações, não propostas; as propostas
   vendidas por linha (72 SP · 15 RJ · 2 Acústica · 15 Focal) não apareciam em lugar nenhum; "Ações de relacionamento" lia a
   linha do tempo das negociações (0) e não as interações do CRM (299); "Projetos em execução" lia um estado que as vendas
   reais não têm. Aqui: o filtro vale para propostas também; cada bloco diz de onde vem o número e abre a aba que o forma. */
(function(){
'use strict';
if(window.__v146)return;window.__v146=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R$=v=>'R$ '+(Math.round(+v||0)).toLocaleString('pt-BR');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const LIN={taag:'TAAG',acustica:'Acústica',focal:'Focal (FPBN)',posvenda:'Pós-venda (AT)'};
const ano=()=>String((S.db.meta&&S.db.meta.ano)||new Date().getFullYear());
const vendida=p=>['vendida','em_obra','concluida'].includes(p.estado)&&!p.demo;
const noAno=p=>String(p.vendida_em||'').startsWith(ano());
const fil=p=>{try{return FIL.daProposta(p)}catch(e){return ''}};
const tot=p=>{try{return M.total(p)}catch(e){return +p.valor_venda||0}};
const temCons=(p,c)=>!c||(p.consultores||[]).some(x=>String(x).toLowerCase().includes(String(c).toLowerCase().split(' ')[0]));
/* porta: Propostas já filtrada (frente + status Aprovada = vendida) */
const porta=(fr,txt,extra)=>`<a href="javascript:void 0" class="vx-door" onclick="S.propF={st:'aprovada'${fr?`,fr:'${fr}'`:''}${extra||''}};location.hash='#/propostas';renderMain()">${txt}</a>`;
function linhas(vend){const g={};vend.forEach(p=>{const k=p.linha==='taag'?(fil(p)==='RJ'?'taag_rj':'taag_sp'):(p.linha||'outra');g[k]=g[k]||{n:0,v:0,fr:p.linha};g[k].n++;g[k].v+=tot(p)});
  const ord=['taag_sp','taag_rj','acustica','focal','posvenda','outra'];const lb={taag_sp:'TAAG · São Paulo',taag_rj:'TAAG · Rio de Janeiro',acustica:'Acústica',focal:'Focal (FPBN)',posvenda:'Pós-venda (AT)',outra:'Sem linha'};
  return ord.filter(k=>g[k]).map(k=>({k,lb:lb[k],n:g[k].n,v:g[k].v,fr:g[k].fr}))}
function cardPropostas(vend,f){const L=linhas(vend);const total=vend.reduce((a,p)=>a+tot(p),0);
  const termos=L.map(x=>porta(x.fr,`<b>${N0(x.n)}</b> ${E(x.lb)}`)).join(' + ');
  return `<div class="card p-3 mb-3" id="v146-propostas" style="border-left:4px solid #198754"><div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2"><div><b style="font-size:12px;letter-spacing:.06em">PROPOSTAS VENDIDAS ${E(ano())}</b> <span class="sub" style="font-size:11px">· as mesmas da aba Propostas${f&&f.frente?' · filtro '+E(LIN[f.frente]||f.frente):''}${f&&f.cons?' · '+E(f.cons):''}</span></div>${porta(f&&f.frente||'',`<span class="sub" style="font-size:11px">abrir em Propostas ›</span>`)}</div>
   <div class="d-flex align-items-baseline gap-3 flex-wrap mt-1"><b style="font-size:28px;color:#198754">${porta(f&&f.frente||'',N0(vend.length))}</b><span>propostas · <b>${R$(total)}</b></span></div>
   <div class="sub mt-1" style="font-size:12px">${N0(vend.length)} = ${termos||'—'} <span style="color:#198754">✓</span> · cada número abre a lista filtrada</div>
   <table class="tbl no-filter mt-2" style="font-size:12px"><thead><tr><th>Linha</th><th class="text-end">Propostas</th><th class="text-end">Vendido</th><th class="text-end">Meta ${E(ano())}</th><th class="text-end">% da meta</th></tr></thead><tbody>${L.map(x=>{const m=+((S.db.metas||{})[x.k])||0;return `<tr><td>${porta(x.fr,E(x.lb))}</td><td class="text-end">${porta(x.fr,N0(x.n))}</td><td class="text-end">${R$(x.v)}</td><td class="text-end">${m?R$(m):'—'}</td><td class="text-end">${m?(x.v/m*100).toFixed(1).replace('.',',')+'%':'—'}</td></tr>`}).join('')}</tbody></table></div>`}
function cardCRM(){try{const t=window.CRM_T||{};const inter=(t.interacoes||[]);const tar=(t.tarefas||[]);const hoje=(typeof today==='function'?today():new Date().toISOString().slice(0,10));
  const byM={};inter.forEach(i=>{const k=String(i.data||'').slice(0,7);if(/^\d{4}-\d{2}$/.test(k))byM[k]=(byM[k]||0)+1});const ks=Object.keys(byM).sort().slice(-6);
  const byR={};inter.forEach(i=>{const k=i.responsavel||'—';byR[k]=(byR[k]||0)+1});const R=Object.entries(byR).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const pend=tar.filter(x=>x.status==='pendente');const atr=pend.filter(x=>String(x.data_prevista||'').slice(0,10)<hoje);
  const go=v=>`<a href="javascript:void 0" class="vx-door" onclick="location.hash='#/crmhome';setTimeout(()=>{try{const f=document.getElementById('crmFrame');f&&f.contentWindow&&f.contentWindow.go&&f.contentWindow.go('${v}')}catch(e){}},600)">`;
  return `<div class="card p-3 mb-3" id="v146-crm" style="border-left:4px solid #0dcaf0"><b style="font-size:12px;letter-spacing:.06em">RELACIONAMENTO (CRM) · a planilha lida na Base</b><div class="row g-3 mt-1 text-center"><div class="col"><b style="font-size:24px">${go('interacoes')}${N0(inter.length)}</a></b><div class="sub" style="font-size:11px">interações registradas</div></div><div class="col"><b style="font-size:24px">${go('tarefas')}${N0(pend.length)}</a></b><div class="sub" style="font-size:11px">próximas ações pendentes</div></div><div class="col"><b style="font-size:24px;color:${atr.length?'#dc3545':'inherit'}">${go('tarefas')}${N0(atr.length)}</a></b><div class="sub" style="font-size:11px">atrasadas</div></div><div class="col"><b style="font-size:24px">${go('parceiros')}${N0((S.db.parceiros||[]).filter(p=>!p.inativo&&!p.crm_fora_planilha).length)}</a></b><div class="sub" style="font-size:11px">parceiros</div></div></div>
   <div class="row g-3 mt-1"><div class="col-md-6"><div class="sub" style="font-size:11px;letter-spacing:.06em">INTERAÇÕES POR MÊS</div>${ks.map(k=>`<div class="d-flex align-items-center gap-2" style="font-size:12px"><span style="width:60px">${k.slice(5)}/${k.slice(2,4)}</span><div style="flex:1;height:9px;background:rgba(127,127,127,.15);border-radius:5px;overflow:hidden"><div style="width:${byM[k]/Math.max(...ks.map(x=>byM[x]),1)*100}%;height:100%;background:#0dcaf0"></div></div><b style="width:40px;text-align:right">${byM[k]}</b></div>`).join('')||'<span class="sub">—</span>'}</div><div class="col-md-6"><div class="sub" style="font-size:11px;letter-spacing:.06em">POR RESPONSÁVEL</div>${R.map(([k,v])=>`<div class="d-flex justify-content-between" style="font-size:12px"><span>${E(k)}</span><b>${v}</b></div>`).join('')}</div></div>
   <div class="sub mt-2" style="font-size:11px">Os mesmos números do CRM › Interações e Próximas ações. A linha do tempo das negociações (Hoje) é outra coisa e fica no Pipeline.</div></div>`}catch(e){return ''}}
function obrasCard(){try{const O=S.db.obras||[];const sit={};O.forEach(o=>{const k=o.situacao||o.statusPlanilha||'sem situação';sit[k]=(sit[k]||0)+1});const L=Object.entries(sit).sort((a,b)=>b[1]-a[1]);
  return `<div class="card p-3 mb-3" id="v146-obras" style="border-left:4px solid #6f42c1"><b style="font-size:12px;letter-spacing:.06em">OBRAS · as mesmas de Operação › Obras</b><div class="d-flex align-items-baseline gap-3 mt-1"><b style="font-size:24px"><a href="#/obras" class="vx-door">${N0(O.length)}</a></b><span class="sub" style="font-size:12px">${L.slice(0,6).map(([k,v])=>`<a href="#/obras" class="vx-door">${v} ${E(k)}</a>`).join(' · ')}</span></div></div>`}catch(e){return ''}}
/* ───── o embrulho ───── */
try{const f0=SCREENS.gestao;if(f0&&!f0.__v146){SCREENS.gestao=function(){const f=S.comF||{};const all=S.db.propostas;const sub=all.filter(p=>(!f.frente||p.linha===f.frente)&&temCons(p,f.cons));
    let h;const swap=sub.length!==all.length;try{if(swap)S.db.propostas=sub;h=f0.apply(this,arguments)}finally{if(swap)S.db.propostas=all}
    if(typeof h!=='string')return h;const vend=sub.filter(p=>vendida(p)&&noAno(p));const gs=S.gSub||'geral';
    /* 1) "propostas fechadas" eram negociações */
    h=h.replace('<b>propostas fechadas</b> <span class="sub">no filtro atual','<b>negociações fechadas</b> <span class="sub">no Pipeline (aba Pipeline › Fechadas) · as propostas vendidas estão no bloco verde acima ·');
    /* 2) KPI "ações de relacionamento" = interações do CRM; "projetos em execução" = obras */
    try{const inter=((window.CRM_T||{}).interacoes||[]).length;h=h.replace(/(AÇÕES DE RELACIONAMENTO<\/div><div style="font-size:24px;font-weight:800">)\d+(<\/div><div class="sub" style="font-size:11px">)registradas no Hoje/,`$1${N0(inter)}$2interações do CRM (planilha)`);
      const O=(S.db.obras||[]).length;h=h.replace(/PROJETOS EM EXECUÇÃO(<\/div><div style="font-size:24px;font-weight:800">)\d+(<\/div><div class="sub" style="font-size:11px">)\d+ concluídos/,`OBRAS$1<a href="#/obras" class="vx-door">${N0(O)}</a>$2as de Operação › Obras`)}catch(e){}
    /* 2b) com filtro de frente, o % da meta é da frente, não do grupo */
    try{if(f.frente){const m=S.db.metas||{};const meta=f.frente==='taag'?(+m.taag_sp||0)+(+m.taag_rj||0):(+m[f.frente]||0);const v=vend.reduce((a,p)=>a+tot(p),0);if(meta)h=h.replace(/(VENDIDO \d{4}<\/div><div style="font-size:24px;font-weight:800">[^<]*<\/div><div class="sub" style="font-size:11px">)[^<]*% de [^<]*</,`$1${(v/meta*100).toFixed(1).replace('.',',')}% da meta ${E(LIN[f.frente]||f.frente)} (R$ ${(meta/1e6).toFixed(2).replace('.',',')}M)<`)}}catch(e){}
    /* 3) blocos novos, por aba */
    const ins=(marker,html)=>{const i=h.indexOf(marker);if(i<0)return false;h=h.slice(0,i)+html+h.slice(i);return true};
    if(gs==='geral'){ins('<div class="card p-3 mb-3" style="background:#0e0e12;color:#fff;border:0">',cardPropostas(vend,f)+obrasCard())}
    else if(gs==='boutique'){ins('<div class="row g-2 mb-2">',cardPropostas(vend.filter(p=>p.linha==='focal'),{frente:'focal'}))}
    else if(gs==='rp'){ins('<div class="row g-2 mb-2">',cardCRM())}
    else if(gs==='comercial'){ins('<div class="row g-2 mb-2">',cardPropostas(vend,f))}
    else if(gs==='metas'){ins('<div class="row g-3">',cardPropostas(vend,f))}
    return h};SCREENS.gestao.__v146=1}}catch(e){console.error('v146 gestao',e)}
try{if(/^#\/gestao/.test(location.hash)&&typeof renderMain==='function')renderMain()}catch(e){}
})();
