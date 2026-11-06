/* =====================================================================================================
   v161d · COERÊNCIA — o mesmo conceito mostra o mesmo número em todas as telas (Bruno, regra "one number")
   Auditoria independente de 06/11 achou números diferentes para a mesma coisa. Uma definição só, aqui, e as telas leem dela:
   §1 OBRAS. "Fundida" = obra unida a outra (merged_into / inativo — OBR-0129, 0155, 0156, 0285, 0304): sai de TODAS as contas,
      conta na obra que ficou. Antes: Operação › Painel e o Início › Operações contavam 228 concluídas (com 4 fundidas), o
      Pós-venda 224, a Gestão 339 (todas as 470 da Base, inclusive os 111 clientes antigos do Pós-venda) e Operação › Obras
      dizia "Obras (359)". Agora: V161D.obras() — Operação = obras da Mestra (Painel de Controle), sem os clientes antigos do
      Controle de AT e sem as fundidas; "obras da Operação" = em andamento + on hold + concluídas; a lista de Operação › Obras
      mostra também canceladas e AT. Toda tela que mostra outro recorte de propósito ganha a ponte até as 470 da Base.
   §2 ATIVAS por unidade (Início › Operações): "85 ativas" ganha a ponte "= 72 em andamento + 5 on hold + 8 em AT".
   §3 CONSULTOR. Uma negociação com dois consultores ("Isabela + Renata Campos") conta para CADA um nas contagens de abertas
      (o valor divide 50/50 — regra do Bruno para venda com dois vendedores). Início e Gestão usam V161D.consDe() e mostram
      "inclui N compartilhadas" + a ponte "as barras somam 67 = 65 abertas + 2 contadas duas vezes".
   §4 CHANCE. Não havia faixa guardada na Base → vale a do Início (aprovada em 04/11): Alta ≥ 70 · Média 30–69 · Baixa < 30, e
      "sem chance informada" à parte (antes o Início somava as 23 sem chance na Baixa). Gravada em Base › params.chance_faixas
      (editável, uma fonte). A Gestão (antes 75/50/25) e a lista de Negociações passam a usar a mesma régua.
   §5 CONVERSÃO × PLANILHA. Num navegador novo o v140 (CRM de 02/11) reimporta as negociações DEPOIS do v159 ligar cada uma à
      sua linha da planilha — 63 perdiam a linha e as 2 linhas quebradas da importação de 02/11 (FECHADO / PERDIDO) voltavam:
      264 × 265 Fechado, 430 × 433 Perdido, 913 × 911. Conserto: quando o v140 troca as negociações, o v159 roda de novo
      (idempotente). E o selo "≠ planilha" nunca mais fica sozinho: a diferença aparece por nome (qual negociação, qual linha).
   §6 CUSTO "VALOR AGREGADO". Duas linhas do inventário Showroom/Focal (CEP-ESTOQUE-04 rows 31319 e 31413) trazem cada uma o
      valor do PAR inteiro (nota "VALOR AGREGADO - LOWER GRANDE UTOPIA EVO + UPPER GRANDE UTOPIA EVO", R$ 759.521,74) — o par
      entrava duas vezes no estoque ao custo de compra. O valor do conjunto é dividido pelas peças que a nota nomeia (o original
      fica guardado em u.v161d_custo). Ver o relatório: uma das peças está cadastrada como "OD 108 - WHITE" (pergunta ao Bruno).
   §7 OBRA SEM NOME NA PLANILHA. A linha 354 do Painel não tem cliente: a obra se chamava "Linha 354 da planilha" e a árvore de
      Base › Clientes mostrava "undefined · Linha 354 da planilha". Agora: "(sem nome na planilha) · Linha 354" em todas as telas
      (o nome mora na Base; continua na lista de exceções "sem nome" da Mestra, como o Bruno decidiu).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v161d)return;window.__v161d=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R0=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
const R2=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const sit=o=>T(()=>COP.situacao(o),o.situacao||'');
const hoje=()=>new Date().toISOString().slice(0,10);
const D=window.V161D=window.V161D||{};

/* ═════════════════════════ §1 OBRAS — uma definição ═════════════════════════ */
D.fundida=o=>!!(o&&(o.merged_into||o.inativo));
D.SIT=['Em andamento','On hold','Concluída','Cancelada','Assistência técnica'];
D.obras=function(){let all=S.db.obras||[];/* dentro de uma tela de Operação a lista vem recortada (v157/v123/§1): a conta usa a Base inteira */if(Array.isArray(D.ALL)&&D.ALL!==all&&D.ALL.length>all.length)all=D.ALL;const fund=all.filter(D.fundida);const viv=all.filter(o=>o&&!D.fundida(o));
  const leg=viv.filter(o=>o.legadoAT);const op=viv.filter(o=>!o.legadoAT);
  const fora=op.filter(o=>o.ativo===false);const pros=op.filter(o=>o.ativo!==false&&o.prospeccao);
  const lista=op.filter(o=>o.ativo!==false&&!o.prospeccao);/* = Operação › Obras (todas as situações) */
  const by=s=>lista.filter(o=>sit(o)===s);
  const r={all,fund,leg,fora,pros,lista,and:by('Em andamento'),hold:by('On hold'),conc:by('Concluída'),canc:by('Cancelada'),at:by('Assistência técnica')};
  r.outras=lista.filter(o=>!D.SIT.includes(sit(o)));r.operacao=r.and.length+r.hold.length+r.conc.length;
  r.soma=r.lista.length+r.fora.length+r.pros.length+r.leg.length+r.fund.length;r.ok=r.soma===all.length;return r};
/* ativas (Operação › Painel): em andamento + on hold + assistência técnica, por unidade */
D.ativasUn=function(){const r=D.obras();const out={};r.lista.forEach(o=>{const s=sit(o);if(!['Em andamento','On hold','Assistência técnica'].includes(s))return;const u=o.unidade||'SP';
  const x=out[u]=out[u]||{and:0,hold:0,at:0,n:0};x.n++;if(s==='Em andamento')x.and++;else if(s==='On hold')x.hold++;else x.at++});return out};
const goSit=s=>`COP.ope.go('obras',{situacao:'${J(s)}'},'#/obras')`;
const ua=(t,on)=>on?`<a href="javascript:void 0" onclick="${E(on)}">${t}</a>`:t;
/* a ponte das 470: o mesmo texto em Operação › Obras, Comercial › Gestão e Início */
D.ponteObras=function(modo){const r=D.obras();const n=a=>N0(a.length);
  const op=`${ua(n(r.and)+' em andamento',goSit('Em andamento'))} + ${ua(n(r.hold)+' on hold',goSit('On hold'))} + ${ua(n(r.conc)+' concluídas',goSit('Concluída'))} <span class="sub">(= ${N0(r.operacao)}, as obras da Operação)</span>`;
  const resto=` + ${ua(n(r.canc)+' canceladas',goSit('Cancelada'))} + ${ua(n(r.at)+' em assistência técnica',goSit('Assistência técnica'))}${r.outras.length?' + '+n(r.outras)+' sem situação':''}`;
  const fora=`${r.pros.length?' + '+n(r.pros)+' em prospecção':''}${r.fora.length?' + '+n(r.fora)+' inativas':''} + <a href="#/posobras">${n(r.leg)} clientes antigos do Pós-venda</a> <span class="sub">(Controle de AT)</span>${r.fund.length?` + ${n(r.fund)} fundidas em outra obra <span class="sub">(contam na obra que ficou)</span>`:''}`;
  const ok=r.ok?'<span style="color:#198754">✓</span>':'<span class="bad">✗</span>';
  if(modo==='lista')return `<b>${n(r.lista)} obras nesta lista</b> = ${op}${resto} · fora desta lista${fora.replace(/^ \+/,':')} = <b>${N0(r.all.length)} na Base</b> ${ok}`;
  return `<b>${N0(r.all.length)} obras na Base</b> = ${op}${resto}${fora} ${ok}`};

/* Operação não conta obra fundida (o v157 já tira os clientes antigos do Pós-venda; aqui saem as fundidas) */
function semFundidas(fn){const w=function(arg){if(arg)return fn.apply(this,arguments);const all=S.db.obras;if(!Array.isArray(all)||!all.some(D.fundida))return fn.apply(this,arguments);
  S.db.obras=all.filter(o=>!D.fundida(o));try{return fn.apply(this,arguments)}finally{S.db.obras=all}};Object.keys(fn).forEach(k=>{try{w[k]=fn[k]}catch(e){}});w.__v161dF=1;return w}
function protegeOperacao(){T(()=>Object.keys(SCREENS).forEach(k=>{const f=SCREENS[k];if(typeof f!=='function'||f.__v161dF)return;
  if(!(k==='obras'||(typeof SEC_OF==='object'&&SEC_OF[k]==='ope')))return;SCREENS[k]=semFundidas(f)}))}

/* ═════════════════════════ §3 CONSULTOR — uma função ═════════════════════════ */
D.consDe=n=>{const xs=T(()=>negCons(n),[]).filter(x=>x&&x[0]!=='_');return xs.length?Array.from(new Set(xs)):['Sem consultor']};
D.porConsultor=function(list){const m={};(list||[]).forEach(n=>{const ks=D.consDe(n);ks.forEach(k=>{const x=m[k]=m[k]||{nome:k,n:0,comp:0,ids:[]};x.n++;x.ids.push(n.id);if(ks.length>1)x.comp++})});
  return Object.values(m).sort((a,b)=>b.n-a.n||a.nome.localeCompare(b.nome))};
D.compartilhadas=list=>(list||[]).filter(n=>D.consDe(n).length>1);
D.ponteCons=function(list,onde){const rows=D.porConsultor(list);const soma=rows.reduce((a,r)=>a+r.n,0);const comp=D.compartilhadas(list);
  const extra=comp.reduce((a,n)=>a+D.consDe(n).length-1,0);if(!comp.length)return `<div class="vx149-mini v161d-pc">${N0(list.length)} abertas = ${rows.map(r=>N0(r.n)).join(' + ')} ✓</div>`;
  const nomes=comp.slice(0,4).map(n=>E(n.cliente_nome||n.codinome||n.id)+' <span class="sub">('+E(D.consDe(n).join(' + '))+')</span>').join(' · ')+(comp.length>4?' · +'+N0(comp.length-4):'');
  return `<div class="vx149-mini v161d-pc" ${onde==='gestao'?'style="color:#9aa;font-size:11px;margin-top:6px"':''}>As barras somam ${N0(soma)} = ${N0(list.length)} abertas + ${N0(extra)} contada${extra>1?'s':''} duas vezes: ${N0(comp.length)} negociaç${comp.length>1?'ões compartilhadas':'ão compartilhada'} — ${nomes}. Na contagem ela conta para cada consultor; no valor, 50/50. <span style="color:#198754">✓ o mesmo de ${onde==='gestao'?'Início':'Comercial › Gestão'} e do Pipeline</span></div>`};

/* ═════════════════════════ §4 CHANCE — uma régua ═════════════════════════ */
function regua(){const p=S.db.params=S.db.params||{};if(!p.chance_faixas||!(+p.chance_faixas.alta>0)){p.chance_faixas={alta:70,media:30,origem:'Início › Comercial, aprovado pelo Bruno em 04/11/2026 (v161d — a Gestão usava 75/50/25)'};T(()=>save())}return p.chance_faixas}
D.faixa=n=>{const c=n?n.chance:null;if(c==null||c===''||isNaN(+c))return 'sem';const f=regua();const v=+c;return v>=+f.alta?'alta':v>=+f.media?'media':'baixa'};
D.CH_LB=()=>{const f=regua();return {alta:`Alta · ${f.alta}% ou mais`,media:`Média · ${f.media}% a ${f.alta-1}%`,baixa:`Baixa · abaixo de ${f.media}%`,sem:'Sem chance informada'}};
D.FAIXAS=['alta','media','baixa','sem'];
const FCOR={alta:'#198754',media:'#ffc107',baixa:'#fd7e14',sem:'#6c757d'};
D.ponteChance=function(list){const c={alta:0,media:0,baixa:0,sem:0};(list||[]).forEach(n=>c[D.faixa(n)]++);
  return `<div class="vx149-mini v161d-ch">${N0((list||[]).length)} abertas = ${N0(c.alta)} alta + ${N0(c.media)} média + ${N0(c.baixa)} baixa + ${N0(c.sem)} sem chance informada ✓ a mesma régua de Comercial › Gestão</div>`};
/* Gestão: a mesma régua (o array é do núcleo — troca o conteúdo, não a referência) */
function reguaGestao(){T(()=>{if(typeof CHANCE_B==='undefined'||CHANCE_B.__v161d)return;const L=D.CH_LB();CHANCE_B.length=0;
  D.FAIXAS.forEach(k=>CHANCE_B.push([L[k],n=>D.faixa(n)===k,FCOR[k]]));CHANCE_B.__v161d=1});
  T(()=>{if(!window.negFaixa||window.negFaixa.__v161d)return;const f=n=>D.faixa(n);f.__v161d=1;window.negFaixa=f})}

/* ═════════════════════════ §5 PLANILHA × BASE (Pipeline) ═════════════════════════ */
const NEG0=S.db.negociacoes;
function religa(){/* o v140 trocou as negociações depois do v159: roda o v159 de novo (idempotente; guarda própria) */
  if(!window.V159_PIPE||S.db.negociacoes===NEG0)return false;
  (S.db.negociacoes||[]).forEach(n=>{if(/^Pipeline \(/.test(n.origem||''))delete n.v159_aplicado});
  try{delete window.__v159p}catch(e){window.__v159p=false}
  const s=document.createElement('script');s.src='v159-pipeline-planilha.js?v161d='+Date.now();s.onload=()=>{T(()=>renderMain())};document.body.appendChild(s);D.religou=new Date().toISOString();return true}
const ST_RES={fechado:'fechada',perdido:'perdida',futuro:'futuro'};
const resDe=n=>n.resultado||'aberta';
const nomeN=n=>n.cliente_nome||n.codinome||n.id;
D.confere=function(){const P=window.V159_PIPE;if(!P||!Array.isArray(P.rows))return null;const N=(S.db.negociacoes||[]).filter(n=>!n.demo);
  const byL={};N.forEach(n=>{if(n.planilha&&n.planilha.linha!=null)byL[n.planilha.linha]=n});
  const rowRes=r=>{const s=nz(r.c[10]);return !s?'sem_status':ST_RES[s]||'aberta'};
  const semNeg=P.rows.filter(r=>!byL[r.linha]);const soSist=N.filter(n=>!n.planilha);
  const dif=P.rows.filter(r=>byL[r.linha]&&rowRes(r)!==resDe(byL[r.linha])).map(r=>({r,n:byL[r.linha]}));
  const conta=k=>({pl:P.rows.filter(r=>rowRes(r)===k).length,sis:N.filter(n=>resDe(n)===k).length});
  return {P,N,semNeg,soSist,dif,fech:conta('fechada'),perd:conta('perdida'),linhas:P.rows.length,ok:!semNeg.length&&!soSist.length&&!dif.length}};
const RLB={fechada:'Fechado',perdida:'Perdido',futuro:'Futuro',aberta:'aberta',sem_status:'status vazio'};
D.explica=function(c){c=c||D.confere();if(!c)return '';const L=a=>a.slice(0,5).join(' · ')+(a.length>5?` · +${N0(a.length-5)}`:'');const parts=[];
  ['fechada','perdida'].forEach(k=>{const x=k==='fechada'?c.fech:c.perd;if(x.pl===x.sis)return;
    const menos=c.dif.filter(d=>(c.P.rows.includes(d.r)&&(d.r.c[10]&&ST_RES[nz(d.r.c[10])]===k))).map(d=>`${E(nomeN(d.n))} (linha ${N0(d.r.linha)}: planilha ${RLB[k]}, sistema ${RLB[resDe(d.n)]})`)
      .concat(c.semNeg.filter(r=>ST_RES[nz(r.c[10])]===k).map(r=>`${E(r.c[3]||'?')} (linha ${N0(r.linha)}: ainda sem negociação no sistema)`));
    const mais=c.dif.filter(d=>resDe(d.n)===k).map(d=>`${E(nomeN(d.n))} (linha ${N0(d.r.linha)}: planilha ${RLB[ST_RES[nz(d.r.c[10])]||(nz(d.r.c[10])?'aberta':'sem_status')]}, sistema ${RLB[k]})`)
      .concat(c.soSist.filter(n=>resDe(n)===k).map(n=>`${E(nomeN(n))} (${E(n.id)}: só no sistema, sem linha na planilha)`));
    parts.push(`${RLB[k]}: sistema ${N0(x.sis)} = planilha ${N0(x.pl)}${menos.length?` − ${N0(menos.length)} [${L(menos)}]`:''}${mais.length?` + ${N0(mais.length)} [${L(mais)}]`:''}`)});
  if(c.N.length!==c.linhas||c.soSist.length||c.semNeg.length)parts.push(`${N0(c.N.length)} negociações = ${N0(c.linhas)} linhas${c.soSist.length?` + ${N0(c.soSist.length)} só no sistema [${L(c.soSist.map(n=>`${E(nomeN(n))} (${E(RLB[resDe(n)]||resDe(n))})`))}]`:''}${c.semNeg.length?` − ${N0(c.semNeg.length)} linhas ainda sem negociação [${L(c.semNeg.map(r=>`linha ${N0(r.linha)} ${E(r.c[3]||'')}`))}]`:''}`);
  const outras=c.dif.filter(d=>!['fechada','perdida'].includes(resDe(d.n))&&!['fechada','perdida'].includes(ST_RES[nz(d.r.c[10])]));
  if(outras.length)parts.push(`status diferente (não muda a conversão): ${L(outras.map(d=>`${E(nomeN(d.n))} (linha ${N0(d.r.linha)}: planilha ${E(d.r.c[10]||'em branco')}, sistema ${RLB[resDe(d.n)]||resDe(d.n)})`))}`);
  return parts.join(' · ')};

/* ═════════════════════════ §6 CUSTO "VALOR AGREGADO" (um conjunto em várias linhas) ═════════════════════════ */
function custoAgregado(){const us=S.db.unidades||[];const g={};let n=0;const antes=[];
  us.forEach(u=>{const m=/^VALOR AGREGADO\s*-\s*(.+)$/i.exec(String(u.nf||'').trim());if(!m)return;const orig=u.v161d_custo?u.v161d_custo.original:+u.custo;if(!(orig>0))return;
    const k=nz(m[1])+'|'+orig;(g[k]=g[k]||{pecas:m[1].split(/\s+\+\s+/).length,us:[],orig}).us.push(u)});
  Object.values(g).forEach(x=>{if(x.pecas<2||x.us.length!==x.pecas)return;const v=Math.round(x.orig/x.pecas*100)/100;
    x.us.forEach(u=>{if(u.v161d_custo&&+u.custo===v)return;antes.push({id:u.id,serie:u.serie,de:+u.custo,para:v});
      u.v161d_custo={original:x.orig,pecas:x.pecas,quando:hoje(),porque:'nota "VALOR AGREGADO" = valor do conjunto inteiro repetido em cada peça; dividido pelas '+x.pecas+' peças que a nota nomeia (v161d)'};u.custo=v;n++})});
  if(n){D.custoAgregado=antes;T(()=>save());T(()=>log('unidades','v161d',n+' unidades com "VALOR AGREGADO" (o conjunto repetido em cada peça) passam a carregar a sua parte do custo'))}
  return n}

/* ═════════════════════════ §7 OBRA SEM NOME NA PLANILHA ═════════════════════════ */
D.SEM_NOME='(sem nome na planilha)';
function semNome(){let n=0;(S.db.obras||[]).forEach(o=>{const m=/^Linha (\d+) da planilha$/.exec(String(o.nome||''));if(!m)return;o.nome_v150=o.nome;o.nome=D.SEM_NOME+' · Linha '+m[1];n++});
  if(n){T(()=>save());T(()=>log('obras','v161d',n+' obra(s) sem nome no Painel de Controle: "'+D.SEM_NOME+' · Linha N"'))}return n}

/* ═════════════════════════ as telas ═════════════════════════ */
function bloco(h,i){if(i<0)return null;let d=0;const re=/<div\b|<\/div>/g;re.lastIndex=i;let m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(!d)return {ini:i,fim:m.index+6}}return null}
const wrap=(k,post)=>{const f=SCREENS[k];if(typeof f!=='function'||f.__v161dP)return;const w=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;try{return post(h,arguments[0])}catch(e){console.error('v161d '+k,e);return h}};
  Object.keys(f).forEach(x=>{try{w[x]=f[x]}catch(e){}});w.__v161dP=1;w.__v161dF=f.__v161dF;SCREENS[k]=w};

/* Início */
function home(h){if(h.indexOf('data-v161d-home')>=0)return h;h+='<span data-v161d-home hidden></span>';const r=D.obras();
  /* Operações: o total de Operação + a ponte até as 470 */
  const tot=r.operacao;const a=`${N0(tot)} = ${N0(r.and.length)} + ${N0(r.hold.length)} + ${N0(r.conc.length)}</div>`;
  if(h.indexOf(a)>=0)h=h.replace(a,`${N0(tot)} = ${N0(r.and.length)} em andamento + ${N0(r.hold.length)} on hold + ${N0(r.conc.length)} concluídas <span class="v161d-op">(as obras da Operação) · Base: ${N0(r.all.length)} = ${N0(tot)} + ${N0(r.canc.length)} canceladas + ${N0(r.at.length)} em assistência técnica + ${N0(r.leg.length)} clientes antigos do Pós-venda${r.fund.length?' + '+N0(r.fund.length)+' fundidas em outra obra':''}${r.pros.length?' + '+N0(r.pros.length)+' em prospecção':''}${r.fora.length?' + '+N0(r.fora.length)+' inativas':''}${r.outras.length?' + '+N0(r.outras.length)+' sem situação':''} ${r.ok?'✓':'✗'}</span></div>`);
  /* ativas por unidade: a ponte */
  const un=D.ativasUn();h=h.replace(/<b>([\d.]+)<\/b> em andamento · ([\d.]+) ativas/g,(m,x,y)=>{const and=+x.replace(/\./g,''),n=+y.replace(/\./g,'');
    const u=Object.values(un).find(z=>z.and===and&&z.n===n);if(!u)return m+' <span class="sub">(ativas = em andamento + on hold + em assistência técnica)</span>';
    return `${m} <span class="sub">(= ${N0(u.and)} em andamento + ${N0(u.hold)} on hold + ${N0(u.at)} em assistência técnica)</span>`});
  /* Conversão: a diferença por nome */
  h=h.replace(/(<span class="v161-bad">≠ planilha:[^<]*<\/span>)/,(m)=>{const x=D.explica();return m+(x?` <span class="v161d-dif" style="font-size:12px">— a diferença, por nome: ${x}</span>`:'')});
  h=h.replace(/(<span class="v161-ok">✓ confere com a planilha:[^<]*<\/span>)/,(m)=>{const c=D.confere();if(!c||c.ok)return m;const x=D.explica(c);return m+(x?` <span class="v161d-dif" style="font-size:12px">· ${x}</span>`:'')});
  return h}

/* Comercial › Gestão */
function gestao(h){if(h.indexOf('data-v161d-gest')>=0)return h;h+='<span data-v161d-gest hidden></span>';const r=D.obras();
  /* OBRAS: o tile e o cartão falam da mesma coisa que Operação */
  h=h.replace(/(OBRAS<\/div><div style="font-size:24px;font-weight:800">)<a [^>]*class="vx-door"[^>]*>[^<]*(<\/a><\/div><div class="sub" style="font-size:11px">)as de Operação › Obras/,
    `$1<a href="javascript:void 0" class="vx-door" title="Operação › Painel: em andamento + on hold + concluídas" onclick="event.stopPropagation();location.hash='#/copainel'">${N0(r.operacao)}$2obras da Operação <span class="v161d-g">· de ${N0(r.all.length)} na Base</span>`);
  const i=h.indexOf('id="v146-obras"');if(i>=0&&h.indexOf('OBRAS · as mesmas de Operação › Obras',i)>=0){const st=h.lastIndexOf('<div class="card',i);const b=bloco(h,st);
    if(b){const n=a=>N0(a.length);const novo=`<div class="card p-3 mb-3 v161d-g" id="v146-obras" style="border-left:4px solid #6f42c1"><b style="font-size:12px;letter-spacing:.06em">OBRAS · as mesmas de Operação › Obras e do Início</b><div class="d-flex align-items-baseline gap-3 mt-1 flex-wrap"><b style="font-size:24px">${ua(N0(r.operacao),"location.hash='#/copainel'")}</b><span class="sub" style="font-size:12px">obras da Operação = ${ua(n(r.and)+' em andamento',goSit('Em andamento'))} · ${ua(n(r.hold)+' on hold',goSit('On hold'))} · ${ua(n(r.conc)+' concluídas',goSit('Concluída'))}</span></div><div class="sub mt-1" style="font-size:12px">${D.ponteObras()}</div></div>`;
      h=h.slice(0,b.ini)+novo+h.slice(b.fim)}}
  /* POR CONSULTOR: a mesma função do Início (inclui as compartilhadas), com a ponte */
  const f=S.comF||{};const q=((S.comF||{}).q||'').trim();const jogo=(S.db.negociacoes||[]).filter(n=>!n.resultado&&T(()=>negMatch(n,{frente:f.frente,cons:f.cons,q}),true));
  const k0=h.indexOf('POR CONSULTOR</div>');const ini=k0>=0?h.lastIndexOf('<div class="mt-3">',k0):-1;const b2=bloco(h,ini);
  if(b2&&typeof stack==='function'){const L=D.CH_LB();const base=JSON.stringify(Object.assign({res:'jogo'},f.frente?{frente:f.frente}:{},f.q?{q:f.q}:{})).replace(/"/g,"'");
    const go=extra=>`event.stopPropagation();S.negF=Object.assign(${base},${JSON.stringify(extra).replace(/"/g,"'")});location.hash='#/negs'`;
    const rows=D.porConsultor(jogo).map(x=>{const m=jogo.filter(n=>D.consDe(n).includes(x.nome));
      const seg=D.FAIXAS.map(k=>({l:L[k],v:m.filter(n=>D.faixa(n)===k).length,c:FCOR[k],k}));
      let st=stack(seg,m.length);seg.forEach(s=>{st=st.replace(`title="${s.l}: ${s.v}"`,`title="${s.l}: ${s.v}" data-v161d-go="${E(go(Object.assign({faixa:s.k},x.nome==='Sem consultor'?{}:{cons:x.nome})))}"`)});
      return `<div class="d-flex align-items-center gap-2 mt-1"><span style="width:150px;font-size:12px">${E(x.nome)} <span style="color:#9aa" data-v161d-go="${E(go(x.nome==='Sem consultor'?{}:{cons:x.nome}))}">${N0(x.n)}</span>${x.comp?` <span style="color:#9aa;font-size:10px">inclui ${N0(x.comp)} compartilhada${x.comp>1?'s':''}</span>`:''}</span><div style="flex:1">${st}</div></div>`}).join('');
    h=h.slice(0,b2.ini)+`<div class="mt-3"><div style="font-size:11px;letter-spacing:.08em;color:#9aa">POR CONSULTOR</div>${rows}${D.ponteCons(jogo,'gestao')}</div>`+h.slice(b2.fim);
    h=h.replace(/Consultores \(\d+ visíveis\)/,`Consultores (${N0(D.porConsultor(jogo).filter(x=>x.nome!=='Sem consultor').length)} com negociação aberta)`)}
  /* POR CHANCE: a mesma régua do Início, cada faixa abre a lista */
  const L=D.CH_LB();D.FAIXAS.forEach(k=>{const lb=L[k];const base=Object.assign({res:'jogo'},f.frente?{frente:f.frente}:{},f.cons?{cons:f.cons}:{},f.q?{q:f.q}:{},{faixa:k});
    const on=E(`event.stopPropagation();S.negF=${JSON.stringify(base).replace(/"/g,"'")};location.hash='#/negs'`);
    h=h.replace(new RegExp(`(<div title="${lb.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}: \\d+")(?! data-v161d-go)`),`$1 data-v161d-go="${on}"`);
    h=h.replace(`</span> ${lb} <b>`,`</span> ${lb} <b data-v161d-go="${on}">`)});
  h=h.replace('POR CHANCE DE FECHAMENTO · ','<span class="v161d-g"></span>POR CHANCE DE FECHAMENTO · ');
  const kk=h.indexOf('POR CHANCE DE FECHAMENTO · ');if(kk>=0){const c={alta:0,media:0,baixa:0,sem:0};jogo.forEach(n=>c[D.faixa(n)]++);const e2=h.indexOf('<div class="mt-3"><div style="font-size:11px;letter-spacing:.08em;color:#9aa">POR CONSULTOR',kk);
    if(e2>0)h=h.slice(0,e2)+`<div style="font-size:11px;color:#9aa;margin-top:4px">${N0(jogo.length)} em aberto = ${N0(c.alta)} alta + ${N0(c.media)} média + ${N0(c.baixa)} baixa + ${N0(c.sem)} sem chance informada <span style="color:#198754">✓ a mesma régua do Início (${E(String(regua().alta))}% / ${E(String(regua().media))}%)</span></div>`+h.slice(e2)}
  return h}
/* depois das portas do núcleo (__comDoors), as nossas ficam por cima */
function portas(){const m=document.getElementById('main');if(!m)return;m.querySelectorAll('[data-v161d-go]').forEach(el=>{el.setAttribute('onclick',el.getAttribute('data-v161d-go'));el.style.cursor='pointer';el.setAttribute('title',(el.getAttribute('title')||'')+' · abrir as negociações')})}

/* Negociações: o seletor de chance com a mesma régua */
function negs(h){const F=S.negF||{};const L=D.CH_LB();
  h=h.replace(/(<select[^>]*>)<option value="">Toda chance<\/option>[\s\S]*?<\/select>/,(m,a)=>a+`<option value="">Toda chance</option>`+D.FAIXAS.map(k=>`<option value="${k}" ${F.faixa===k?'selected':''}>${E(L[k])}</option>`).join('')+'</select>');
  if(F.faixa&&L[F.faixa])h=h.replace(/(Negociações <span class="sub" style="font-size:15px;font-weight:400">[^<]*?)(Sem info)/,(m,a)=>a+L[F.faixa]);return h}

/* Operação › Obras: a lista diz o que contém e o que fica de fora */
function obras(h,arg){if(arg||h.indexOf('v161d-ol')>=0)return h;const tab=T(()=>COP.ui.obrasTab,'obras')||'obras';if(tab!=='obras')return h;
  const i=h.indexOf('<div class="tabs mb-3">');const b=bloco(h,i);if(!b)return h;
  return h.slice(0,b.fim)+`<div class="card p-2 mb-3 v161d-ol" style="font-size:12.5px;border-left:4px solid #6f42c1">${D.ponteObras('lista')}</div>`+h.slice(b.fim)}

/* Projetos › Painel: o painel usa a mesma conta (ponteObras do v161-projetos-operacao, já sem fundidas) — nada a trocar */

/* Base › Clientes: obra sem cliente não mostra "undefined" */
function dbclientes(h){return h.replace(/>undefined · /g,'>')}

/* ═════════════════════════ liga tudo ═════════════════════════ */
function ligaTelas(){protegeOperacao();reguaGestao();
  wrap('home',home);wrap('gestao',gestao);wrap('negs',negs);wrap('obras',obras);wrap('dbclientes',dbclientes);
  T(()=>{const so=window.__showroomOnde;if(typeof so==='function'&&!so.__v161d){const w=function(){const r=so.apply(this,arguments);T(portas);return r};w.__v161d=1;window.__showroomOnde=w}})}
T(semNome);T(custoAgregado);T(regua);ligaTelas();
function depoisDoBoot(){T(religa);T(semNome);T(custoAgregado);ligaTelas();T(()=>renderMain())}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',depoisDoBoot);else setTimeout(depoisDoBoot,0);
/* camadas que embrulham as telas depois de nós: a nossa volta a ficar por fora; as importações tardias também passam aqui */
try{const _rm=window.renderMain;window.renderMain=function(){D.ALL=S.db.obras;T(semNome);T(ligaTelas);const r=_rm.apply(this,arguments);T(portas);return r}}catch(e){}
})();

/* v161d · Grande Utopia EVO (Bruno, 06/11: "faça o que for melhor para o número total")
   1) a peça de série A1BUCH01000064 estava como "OD 108 - WHITE" (produto que só existe por essa linha) — o registro de
      consignado da Audiogene diz que é a LOWER do par → vai para LOWER/UPPER GDE UTOPIA EVO (o produto do par)
   2) o mesmo par aparecia duas vezes: consignado Audiogene (12/2025, 1 unidade com as 2 séries, R$ 759.521,74) e nosso
      (Showroom 02/11/2026, as 2 peças) → conta uma vez só, como nosso (o registro mais novo: a consignação terminou na compra);
      o registro de consignado vai para a Base › Lixeira com o motivo (pode voltar no Restaurar). Roda uma vez por Base. */
(function(){
'use strict';
const K='utopia1';
function roda(){try{
  if(typeof S==='undefined'||!S.db||!Array.isArray(S.db.unidades)||!window.V155)return false;
  const F=S.db._v161d=S.db._v161d||{};if(F[K])return true;
  const U=S.db.unidades;const ser=u=>String(u.serie||u.serial||'').toUpperCase();
  const pecaLow=U.find(u=>ser(u)==='A1BUCH01000064');const pecaUp=U.find(u=>ser(u)==='A1BUDH01000063');
  const consig=U.find(u=>/A1BUCH01000064/.test(ser(u))&&/A1BUDH01000063/.test(ser(u)));
  if(!pecaLow&&!consig){F[K]={quando:new Date().toISOString(),nada:true};return true}
  const log={quando:new Date().toISOString(),acoes:[]};
  if(pecaLow&&pecaUp&&pecaLow.produto_id!==pecaUp.produto_id){log.acoes.push({un:pecaLow.id,produto_antes:pecaLow.produto_id,produto_depois:pecaUp.produto_id});pecaLow.produto_antes_v161d=pecaLow.produto_id;pecaLow.produto_id=pecaUp.produto_id}
  if(consig&&pecaLow&&pecaUp&&window.V155&&typeof V155.plano==='function'&&typeof V155.mover==='function'){
    try{const x=V155.plano('unidades',consig.id);if(x){x.motivo='Consignação Audiogene encerrada — o mesmo par Grande Utopia EVO está no Inventário Showroom (02/11/2026) como nosso; contava duas vezes (v161d, 06/11/2026)';
      V155.mover(x);log.acoes.push({lixeira:consig.id,valor:consig.custo})}}catch(e){log.erro=String(e.message||e)}}
  F[K]=log;try{save()}catch(e){}return true}catch(e){console.error('v161d utopia',e);return true}}
let n=0;const iv=setInterval(()=>{if(roda()||++n>60)clearInterval(iv)},1000);
})();
