/* =====================================================================================================
   v158 · CLIQUES — os números da Comercial › Gestão que ainda eram texto viram portas (05/11/2026; revisto 08/11)
   Regra do Bruno: todo número clicável abre a tela de destino já filtrada nos registros que o formam (contagem na
   chegada == número); dois números que se subtraem na mesma tela mostram a ponte, com cada termo clicável.
     §1 Comercial › "Negociações por mês": cada barra (registradas / fechadas) e o número dela abrem as negociações
        daquele mês; ponte "N negociações = X nestes meses + Y de outros meses" e o mesmo para as fechadas
     §2 Relações Públicas › "Eventos & indicações": indicações geradas / aprovadas; ponte por resultado e com o total
     §3 Boutique › "Por interesse": cada marca abre as propostas da Focal que têm itens dela (ponte itens → propostas)
     §4 Pós-vendas › "Ordens de serviço" (por tipo) e "Negociações geradas": as OS / negociações de cada barra
     §5 Insights: perdas sem motivo, concentração da carteira, negociações girando, indicações, luminotécnicos,
        OS abertas, clientes para reativação
     §6 Visão Geral: "39,3% de R$ 51,00M", "N negociações · N em aberto", consultores visíveis, tempos médios (com
        "média de N de M", com as que ficam de fora clicáveis); o cartão % CONVERSÃO segue a v164 (ganhas ÷ perdidas)
     §7 rosquinhas (donuts) da Gestão: cada fatia e o número do centro abrem o mesmo que a legenda
   Revisão de 08/11 contra o código de hoje (v159–v166): saíram as portas que uma camada mais nova já faz (o "264" de
   "decididas", o total "568 =" da ponte verde, o "345" do CRM e o "Das N obras em andamento" do Início — a v161e e a
   v157/v156 já ligam esses números; o "os 21" do Início, que copiava uma porta da v157 que chega com 20) e tudo que
   contava "decididas" (definição antiga; a v164 fixou conversão = ganhas ÷ perdidas). Todo clique agora abre primeiro o PAINEL CURTO da v161d (número, "De onde vem", a lista, "Abrir na tela"),
   como os outros números da Gestão; sem a v161d cai na faixa da v156 como antes. Nada é fixo: cada conjunto é calculado
   na hora do clique, a partir da Base.
   Destinos: negociações → a própria Gestão com o "Filtro aplicado" (v124 F20: #/negs redireciona para #/gestao e todos os
   números da tela passam a contar só aquelas; "Mostrando N de M negociações"), por um conjunto exato de ids (chave
   v158s, que a v158 ensina ao negMatch); propostas / OS / parceiros / clientes → a lista com a faixa "Filtrado pelo
   número X: mostrando N de M" da v155/v156.
   Só apresentação/navegação: nenhum dado muda.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v158clk)return;window.__v158clk=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
const N0=v=>(+v||0).toLocaleString('pt-BR');
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const DEC=v=>String(v).replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const W=()=>window.V156||{};
const V=window.V158=window.V158||{};
/* data-v158on guarda a porta: a fiação genérica da Gestão (__comDoors, "every number becomes a door") reescreve depois do
   render todo número "puro" de um cartão com um filtro adivinhado — o posPortas abaixo devolve a porta certa */
const door=(on,html,ti)=>`<a href="javascript:void 0" class="vx-door" data-v158="1" data-v158on="${E('event.stopPropagation();'+on)}"${ti?` data-v158ti="${E(ti)}"`:''} onclick="event.stopPropagation();${on}"${ti?` title="${E(ti)}"`:''}>${html}</a>`;
const ano=()=>String((S.db.meta&&S.db.meta.ano)||new Date().getFullYear());
const dd=d=>T(()=>dias(d),NaN);

/* ───────── conjuntos exatos de registros (chave → ids) ───────── */
V._s={};V._lb={};
const reg=(ids,lb)=>{const key='k'+Math.abs([...String(lb)].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)).toString(36);V._s[key]=new Set(ids.map(String));V._lb[key]=lb;return key};
/* negMatch: a chave v158s restringe ao conjunto; o resto do filtro segue para as camadas de baixo */
function ligaNeg(){const f=window.negMatch;if(typeof f!=='function')return false;if(f.__v158)return true;if(!f.__v156)return false;
  const w=function(n,F){if(!F||!F.v158s)return f.apply(this,arguments);const s=V._s[F.v158s];const G=Object.assign({},F);delete G.v158s;if(s&&!s.has(String(n.id)))return false;return f.call(this,n,G)};
  w.__v158=1;w.__v156=1;window.negMatch=w;return true}
{let n=0;if(!ligaNeg()){const iv=setInterval(()=>{if(ligaNeg()||++n>80)clearInterval(iv)},400)}}

/* as negociações que a Gestão conta (filtro de frente / consultor / busca de cima e, se houver, o "Filtro aplicado" da
   própria Gestão — S.negF, v124 F20: com ele ligado todos os números da tela contam só aquelas) */
const negFOn=()=>{const F=S.negF;return !!(F&&Object.keys(F).some(k=>F[k]))};
const negsG=()=>{const f=S.comF||{};const q=(f.q||'').trim();const nf=negFOn()?S.negF:null;return (S.db.negociacoes||[]).filter(n=>(!f.frente||n.frente===f.frente)&&(!f.cons||T(()=>negCons(n).includes(f.cons),true))&&(!q||T(()=>negMatch(n,{q}),true))&&(!nf||T(()=>negMatch(n,nf),true)))};
/* abre as negociações exatamente nestas. O destino de negociações é a própria Gestão: #/negs redireciona para #/gestao
   (FX2 REDIR2) e a Gestão aplica S.negF a todos os números ("Filtro aplicado: … · Mostrando N de M negociações").
   A chave v158s filtra pelo conjunto exato; o rótulo do filtro diz qual número abriu. */
V.negs=function(xs,lb){const key=reg(xs.map(n=>n.id),lb);V._lb[key]=lb;
  try{V155_limpar()}catch(e){}try{S.negF={v158s:key}}catch(e){}
  if((location.hash||'').split('?')[0]==='#/gestao'){try{renderMain()}catch(e){try{render()}catch(_){}}try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){}}else location.hash='#/gestao'};
/* um número = um "spec" (o mesmo formato do V156.ir): destino, rótulo, registros e a navegação que liga o filtro da tela */
const negSpec=(xs,lb)=>({path:'#/gestao',lb:N0(xs.length)+' · '+lb,unid:'negociações',recs:[],xs,nav(){V.negs(xs,lb)}});
V._g={};V._nav={};/* conjuntos registrados no render; o clique calcula os registros NA HORA: V158.go('chave',this) */
const negLb=n=>n.cliente_nome||n.codinome||n.id;
const tbDe=sp=>{const t=document.createElement('table');
  if(sp.xs)t.innerHTML=`<thead><tr><th>Negociação</th><th>Situação</th><th>Consultor</th></tr></thead><tbody>${sp.xs.map(n=>`<tr><td><b>${E(negLb(n))}</b></td><td>${E(n.resultado?String(n.resultado):(n.status_pipeline||n.etapa||'em jogo'))}</td><td>${E(n.consultor||'—')}</td></tr>`).join('')}</tbody>`;
  else t.innerHTML=`<thead><tr><th>${E(sp.unid==='OS'?'OS':sp.unid.charAt(0).toUpperCase()+sp.unid.slice(1))}</th></tr></thead><tbody>${(sp.recs||[]).map(r=>`<tr${r.h?` onclick="location.hash='${J(r.h)}'"`:''}><td><b>${E(r.name||(r.ids||[])[0]||'')}</b></td></tr>`).join('')}</tbody>`;return t};
const cap1=s=>{s=String(s||'').trim();return s.charAt(0).toUpperCase()+s.slice(1)};
/* abre o número: painel curto da v161d (como os outros números da Gestão) → "Abrir na tela" liga o filtro; sem v161d, a faixa da v156 */
function abre(k,sp,el){const D=window.V161D||{};const n=sp.xs?sp.xs.length:(sp.recs||[]).length;V._nav[k]=sp.nav;
  if(typeof D.abrir!=='function'){const w=W();if(typeof w.ir==='function'&&!sp.xs)w.ir(sp);else sp.nav();return}
  /* o número grande do painel é SEMPRE a contagem da lista; quando o clique foi num texto que não é essa contagem ("728 dias",
     "02/26", "≈60%", "22" itens de uma marca), o painel diz de qual número veio — e a ponte, se houver */
  let dito='';try{const t=String(el&&(el.namespaceURI==='http://www.w3.org/2000/svg'?[...el.childNodes].filter(x=>x.nodeType===3).map(x=>x.nodeValue).join(''):(el.innerText||el.textContent))||'').replace(/\s+/g,' ').trim();
    const m=/^(\d[\d.]*)$/.exec(t)||/^(\d[\d.]*) (?:negociações|fechadas|indicações|em aberto|com|sem|aprovadas|em jogo|perdidas|no futuro|perdas|clientes|luminotécnicos|nestes|destes|de outros)\b/.exec(t);
    if(t&&!(m&&+m[1].replace(/\./g,'')===n))dito=`do número "${t.slice(0,40)}"`}catch(e){}
  D.abrir({code:`V158.nav('${J(k)}')`,h:sp.path,tela:sp.xs?'Comercial › Gestão · só estas negociações':T(()=>D.telaNome(sp.path),sp.path),big:N0(n),lb:cap1(String(sp.lb).replace(/^[\d.]+ · /,'')),sub:[dito,sp.ponte||''].filter(Boolean).join(' · '),tb:tbDe(sp),
    vem:sp.xs?'Comercial › Gestão · Pipeline (aba Pipeline da To Do Comercial)':'Comercial › Gestão',unid:sp.unid,recs:sp.xs?[]:sp.recs,ponteLanding:sp.ponte||''})}
V.nav=function(k){const f=V._nav[k];if(typeof f==='function')f()};
V.go=function(k,el){const g=V._g[k];if(!g)return;try{const xs=g.f();abre(k,g.kind==='negs'?negSpec(xs,g.lb):g.open(xs),el)}catch(e){console.error('v158 go',e)}};
const G=(k,lb,f)=>{V._g[k]={kind:'negs',lb,f};return `V158.go('${J(k)}',this)`};
const GO=(k,f,open)=>{V._g[k]={kind:'x',f,open};return `V158.go('${J(k)}',this)`};
/* propostas: Comercial › Propostas filtrada nelas (o mesmo motor da v156), com ponte */
const propRec=p=>({ids:[p.id],name:(p.numero?'#'+p.numero+' · ':'')+(T(()=>(getRow('obras',p.obra_id)||{}).nome,'')||p.nome||p.cliente_nome||p.id),h:'#/editor/'+p.id});
V.props=function(ps,lb,nativo,ponte){const nav=()=>{try{S.propF=Object.assign({st:'',fr:'',q:'',cons:'',ym:'',fil:'',vano:''},nativo||{})}catch(e){}location.hash='#/propostas';try{renderMain()}catch(e){}};
  return {path:'#/propostas',lb,unid:'propostas',ponte,recs:ps.map(propRec),limpa(){try{S.propF={}}catch(e){}try{renderMain()}catch(e){}},nav}};
/* OS: Pós-venda › OS */
V.os=function(xs,lb,ponte){const nav=()=>{try{S.pvTab='os'}catch(e){}location.hash='#/posvenda/os';try{renderMain()}catch(e){}};
  return {path:'#/posvenda/os',lb:N0(xs.length)+' · '+lb,unid:'OS',ponte,recs:xs.map(o=>({ids:[String(o.id)],name:String(o.id)})),nav}};

/* ───────── §1 Comercial › Negociações por mês ───────── */
function comercialHTML(h){const a=h.indexOf('NEGOCIAÇÕES POR MÊS');if(a<0)return h;const z0=h.indexOf('<div class="col-lg-4">',a);const z=z0>0?z0:h.length;let seg=h.slice(a,z);
  const N=negsG();const mes=n=>String(n.criado||'').slice(0,7);const ks=[];
  seg=seg.replace(/<div style="flex:1;text-align:center;font-size:9px"><div style="display:flex;align-items:end;gap:1px;height:90px"><div style="flex:1;height:([\d.]+)%;background:#0d6efd" title="(\d+) registradas"><\/div><div style="flex:1;height:([\d.]+)%;background:#198754" title="(\d+) fechadas"><\/div><\/div>(\d{2})\/(\d{2})<\/div>/g,(m,h1,n1,h2,n2,mm,yy)=>{
    const k='20'+yy+'-'+mm;ks.push(k);const lbM=mm+'/'+yy;
    const oR=G('mes:'+k,'negociações criadas em '+lbM,()=>negsG().filter(n=>mes(n)===k));
    const oF=G('mesf:'+k,'negociações criadas em '+lbM+' e fechadas',()=>negsG().filter(n=>mes(n)===k&&n.resultado==='fechada'));
    return `<div style="flex:1;text-align:center;font-size:9px" data-v158mes="${k}"><div style="display:flex;align-items:end;gap:1px;height:90px"><div style="flex:1;height:${h1}%;background:#0d6efd;cursor:pointer" title="abrir as ${n1} negociações criadas em ${lbM}" data-v158on="event.stopPropagation();${oR}" onclick="event.stopPropagation();${oR}"></div><div style="flex:1;height:${h2}%;background:#198754;cursor:pointer" title="abrir as ${n2} fechadas (criadas em ${lbM})" data-v158on="event.stopPropagation();${oF}" onclick="event.stopPropagation();${oF}"></div></div>${door(oR,lbM,'abrir as '+n1+' negociações criadas em '+lbM)}<div style="font-size:10px;line-height:1.3;white-space:nowrap">${+n1?door(oR,`<b style="color:#0d6efd">${n1}</b>`,`abrir as ${n1} negociações criadas em ${lbM}`):'0'}·${+n2?door(oF,`<b style="color:#198754">${n2}</b>`,`abrir as ${n2} fechadas criadas em ${lbM}`):'0'}</div></div>`});
  if(!ks.length)return h;
  seg=seg.replace('<div class="d-flex align-items-end gap-1" style="height:110px">','<div class="d-flex align-items-end gap-1" style="min-height:110px">');
  const K=new Set(ks);const dentro=N.filter(n=>K.has(mes(n))),antes=N.filter(n=>!K.has(mes(n)));const fD=dentro.filter(n=>n.resultado==='fechada'),fA=antes.filter(n=>n.resultado==='fechada');const k0=ks[0].slice(5)+'/'+ks[0].slice(2,4),k1=ks[ks.length-1].slice(5)+'/'+ks[ks.length-1].slice(2,4);
  const oT=G('mes:*','negociações (todas)',()=>negsG()),oD=G('mes:in','negociações criadas de '+k0+' a '+k1,()=>negsG().filter(n=>K.has(mes(n)))),oA=G('mes:out','negociações criadas fora de '+k0+'–'+k1,()=>negsG().filter(n=>!K.has(mes(n))));
  const oFT=G('mesf:*','negociações fechadas',()=>negsG().filter(n=>n.resultado==='fechada')),oFD=G('mesf:in','fechadas criadas de '+k0+' a '+k1,()=>negsG().filter(n=>K.has(mes(n))&&n.resultado==='fechada')),oFA=G('mesf:out','fechadas criadas fora de '+k0+'–'+k1,()=>negsG().filter(n=>!K.has(mes(n))&&n.resultado==='fechada'));
  const ponte=`<div class="sub mt-2" data-v158ponte="mes" style="font-size:11px;line-height:1.5"><span style="color:#0d6efd">■</span> registradas · <span style="color:#198754">■</span> fechadas (pelo mês em que a negociação foi criada)<br><b>Ponte:</b> ${door(oT,`<b>${N0(N.length)}</b> negociações`)} = ${door(oD,`${N0(dentro.length)} nestes ${ks.length} meses`)} + ${door(oA,`${N0(antes.length)} de outros meses`)} ${dentro.length+antes.length===N.length?'<span style="color:#198754">✓</span>':''}<br>${door(oFT,`<b>${N0(fD.length+fA.length)}</b> fechadas`)} = ${door(oFD,`${N0(fD.length)} destes meses`)} + ${door(oFA,`${N0(fA.length)} de outros meses`)}</div>`;
  seg=seg.replace(/(<\/div><\/div>)(<\/div><\/div>)$/,'$1'+ponte+'$2');if(seg.indexOf('data-v158ponte="mes"')<0){const c=seg.lastIndexOf('</div></div>');if(c>0)seg=seg.slice(0,c)+ponte+seg.slice(c)}
  return h.slice(0,a)+seg+h.slice(z)}

/* ───────── §2 Relações Públicas › Eventos & indicações ───────── */
const RESLB={jogo:'em jogo',fechada:'aprovadas (fechadas)',perdida:'perdidas',futuro:'no futuro',sem_status:'com status vazio'};
const indSet=()=>negsG().filter(n=>n.fontes&&n.fontes.indicador);
function rpHTML(h){const a=h.indexOf('EVENTOS &amp; INDICAÇÕES')>=0?h.indexOf('EVENTOS &amp; INDICAÇÕES'):h.indexOf('EVENTOS & INDICAÇÕES');if(a<0)return h;let seg=h.slice(a);
  const N=negsG();const I=indSet();const oI=G('ind','negociações que nasceram de indicação',indSet);const oA=G('ind:fechada','aprovadas (via indicação)',()=>indSet().filter(n=>n.resultado==='fechada'));
  seg=seg.replace(/<b style="font-size:26px">(\d+)<\/b><div class="sub" style="font-size:11px">indicações geradas<\/div>/,(m,n)=>+n?`<b style="font-size:26px">${door(oI,n,'abrir as '+n+' negociações com indicador')}</b><div class="sub" style="font-size:11px">indicações geradas</div>`:m);
  seg=seg.replace(/<b style="font-size:26px">(\d+)<\/b><div class="sub" style="font-size:11px">aprovadas \(via indicação\)<\/div>/,(m,n)=>+n?`<b style="font-size:26px">${door(oA,n,'abrir as '+n+' negociações fechadas com indicador')}</b><div class="sub" style="font-size:11px">aprovadas (via indicação)</div>`:m);
  const g={};I.forEach(n=>{const r=n.resultado||'jogo';g[r]=(g[r]||0)+1});const ord=['fechada','jogo','perdida','futuro','sem_status'].concat(Object.keys(g).filter(k=>!RESLB[k]));
  const termos=ord.filter(k=>g[k]).map(k=>door(G('ind:'+k,'indicações · '+(RESLB[k]||k),()=>indSet().filter(n=>(n.resultado||'jogo')===k)),`${N0(g[k])} ${RESLB[k]||k}`));
  const sem=N.length-I.length;const oT=G('ind:tot','negociações (todas)',()=>negsG());const oS=G('ind:sem','negociações sem indicador',()=>negsG().filter(n=>!(n.fontes&&n.fontes.indicador)));
  const ponte=`<div class="sub mt-2" data-v158ponte="ind" style="font-size:11px;line-height:1.5"><b>Ponte:</b> ${door(oI,`<b>${N0(I.length)}</b> indicações`)} = ${termos.join(' + ')} ${ord.reduce((s,k)=>s+(g[k]||0),0)===I.length?'<span style="color:#198754">✓</span>':''}<br>${door(oT,`${N0(N.length)} negociações`)} = ${door(oI,N0(I.length)+' com indicador')} + ${door(oS,`${N0(sem)} sem indicador`)}</div>`;
  seg=seg.replace(/(<div class="sub" style="font-size:11px">aprovadas \(via indicação\)<\/div><\/div><\/div>)/,'$1'+ponte);
  return h.slice(0,a)+seg}

/* ───────── §3 Boutique › Por interesse (marcas) ───────── */
const barDoor=(st,ti,lb,mid,nn,on,tt)=>`<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px;cursor:pointer" data-v158on="${E('event.stopPropagation();'+on)}" data-v158ti="${E(tt)}" onclick="event.stopPropagation();${on}" title="${E(tt)}"><span style="${st}" title="${ti}">${lb}</span>${mid}<b style="width:70px;text-align:right;text-decoration:underline dotted">${nn}</b></div>`;
const fpAll=()=>(S.db.propostas||[]).filter(p=>p.linha==='focal');
const marcaDe=l=>T(()=>(get('produtos',l.produto_id)||{}).marca,'')||'—';
const itensDe=p=>T(()=>blocosDe(p).flatMap(b=>b.itens||[]),[]);
const marcaGO=m=>GO('marca:'+m,()=>fpAll().filter(p=>itensDe(p).some(l=>marcaDe(l)===m)),ps=>{const nl=fpAll().reduce((a,p)=>a+itensDe(p).filter(l=>marcaDe(l)===m).length,0);
  return V.props(ps,N0(ps.length)+' · propostas da Focal com '+m,{fr:'focal'},`${N0(nl)} itens ${m} em ${N0(ps.length)} propostas`)});
function boutiqueHTML(h){const a=h.indexOf('POR INTERESSE');if(a<0)return h;const z0=h.indexOf('<div class="row g-2">',a);const z=z0>0?z0:h.length;let seg=h.slice(a,z);let tot=0,mostr=0;
  const all={};fpAll().forEach(p=>itensDe(p).forEach(l=>{const m=marcaDe(l);all[m]=(all[m]||0)+1;tot++}));
  seg=seg.replace(/<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px"><span style="([^"]*)" title="([^"]*)">([^<]*)<\/span>([\s\S]*?)<b style="width:70px;text-align:right">(\d[\d.]*)<\/b><\/div>/g,(m,st,ti,lb,mid,nn)=>{const v=DEC(ti);mostr+=+nn.replace(/\./g,'');if(!+nn.replace(/\./g,''))return m;
    const np=fpAll().filter(p=>itensDe(p).some(l=>marcaDe(l)===v)).length;
    return barDoor(st,ti,lb,mid,nn,marcaGO(v),'abrir as '+np+' propostas da Focal com itens '+v+' ('+nn+' itens)')});
  if(tot){const outras=tot-mostr;const oT=GO('marca:*',()=>fpAll().filter(p=>itensDe(p).length),ps=>V.props(ps,N0(ps.length)+' · propostas da Focal com itens',{fr:'focal'},`${N0(tot)} itens em ${N0(ps.length)} propostas`));
    const p=`<div class="sub mt-2" data-v158ponte="marca" style="font-size:11px">contagem = itens (linhas) nas propostas da Focal · <b>Ponte:</b> ${door(oT,`<b>${N0(tot)}</b> itens`)} = ${N0(mostr)} nas marcas acima${outras?` + ${N0(outras)} de outras marcas`:''} <span style="color:#198754">✓</span></div>`;
    const c=seg.lastIndexOf('</div></div></div>');if(c>0)seg=seg.slice(0,c)+p+seg.slice(c)}
  return h.slice(0,a)+seg+h.slice(z)}

/* ───────── §4 Pós-vendas › Ordens de serviço / Negociações geradas ───────── */
const osAll=()=>S.db.os||[];
const barRe0=/<div class="d-flex align-items-center gap-2 py-1" style="font-size:12px"><span style="([^"]*)" title="([^"]*)">([^<]*)<\/span>([\s\S]*?)<b style="width:70px;text-align:right">(\d[\d.]*)<\/b><\/div>/g;
const barRe=barRe0;
function posvHTML(h){const a=h.indexOf('ORDENS DE SERVIÇO');if(a<0)return h;const b=h.indexOf('NEGOCIAÇÕES GERADAS',a);const z0=h.indexOf('<div class="row g-2">',b>0?b:a);const z=z0>0?z0:h.length;let seg=h.slice(a,z);
  const bN=seg.indexOf('NEGOCIAÇÕES GERADAS');const b0=bN>0?seg.lastIndexOf('<div class="col-lg-4">',bN):-1;let s1=b0>0?seg.slice(0,b0):seg,s2=b0>0?seg.slice(b0):'';let tot=0;
  s1=s1.replace(barRe,(m,st,ti,lb,mid,nn)=>{const v=DEC(ti);const n=+nn.replace(/\./g,'');tot+=n;if(!n)return m;
    const on=GO('os:'+v,()=>osAll().filter(o=>(o.tipo||'—')===v),xs=>V.os(xs,'OS · '+v));return barDoor(st,ti,lb,mid,nn,on,'abrir as '+nn+' OS do tipo '+v)});
  if(osAll().length){const oT=GO('os:*',osAll,xs=>V.os(xs,'OS (todas)'));const c=s1.lastIndexOf('</div></div></div>');
    if(c>0)s1=s1.slice(0,c)+`<div class="sub mt-2" data-v158ponte="os" style="font-size:11px"><b>Ponte:</b> ${door(oT,`<b>${N0(osAll().length)}</b> OS`)} = soma dos tipos (${N0(tot)}) ${tot===osAll().length?'<span style="color:#198754">✓</span>':''}</div>`+s1.slice(c)}
  const R=n=>String(n.codinome||'').endsWith('-R');
  const NG={'Reativação':['negs','negociações de reativação (frente Pós-venda)',()=>(S.db.negociacoes||[]).filter(n=>n.frente==='posvenda'&&R(n))],'Buscas ativas':['negs','buscas ativas (frente Pós-venda)',()=>(S.db.negociacoes||[]).filter(n=>n.frente==='posvenda'&&!R(n))],'Identificadas em OS':['os','OS que viraram proposta',()=>osAll().filter(o=>o.proposta_id)]};
  s2=s2.replace(barRe,(m,st,ti,lb,mid,nn)=>{const v=DEC(ti);const d=NG[v];if(!d||!+nn.replace(/\./g,''))return m;
    const on=d[0]==='negs'?G('ng:'+v,d[1],d[2]):GO('ng:'+v,d[2],xs=>V.os(xs,d[1]));return barDoor(st,ti,lb,mid,nn,on,'abrir as '+nn+' '+d[1])});
  return h.slice(0,a)+s1+s2+h.slice(z)}

/* ───────── §5 Insights ───────── */
const topCons=()=>T(()=>count(negsG(),n=>n.consultor),[]).slice(0,2);
function insightsHTML(h){
  const perdSem=()=>negsG().filter(n=>n.resultado==='perdida'&&!n.motivo);
  h=h.replace(/(\s|>)(\d[\d.]*) perdas sem motivo/,(m,pre,n)=>+n?`${pre}${door(G('ins:semmot','perdas sem motivo',perdSem),n+' perdas sem motivo','abrir as '+n+' negociações perdidas sem motivo')}`:m);
  h=h.replace(/somam ≈(\d+)% das oportunidades/,(m,p)=>{const tc=topCons();if(!tc.length)return m;const ks=tc.map(x=>x[0]);const N=negsG();const s=tc.reduce((a,x)=>a+x[1],0);
    const on=G('ins:top','negociações de '+ks.join(' e '),()=>negsG().filter(n=>ks.includes(n.consultor)));
    return `somam ${door(on,'≈'+p+'%','abrir as '+s+' negociações de '+ks.join(' e '))} das ${door(G('ins:tot','negociações (todas)',()=>negsG()),'oportunidades')} <span class="sub" style="font-size:12px">· ${door(on,N0(s))} de ${door(G('ins:tot','negociações (todas)',()=>negsG()),N0(N.length))} = ${tc.map(x=>door(G('ins:c:'+x[0],'negociações de '+x[0],()=>negsG().filter(n=>n.consultor===x[0])),N0(x[1]),'abrir as '+x[1]+' negociações de '+x[0])).join(' + ')} (÷ ${N0(N.length)})</span>`});
  /* (a frase "Conversão do pipeline … · N decididas = G + P" saiu: a v164 reescreveu a frase — ganhas ÷ perdidas — e liga os números) */
  h=h.replace(/<li>(\d[\d.]*) negociações girando/,(m,n)=>+n?`<li>${door(G('ins:gir','negociações girando (>14 dias sem movimento)',()=>negsG().filter(x=>!x.resultado&&dd(x.movido)>14)),n+' negociações','abrir as '+n+' negociações em jogo paradas há mais de 14 dias')} girando`:m);
  h=h.replace(/<li>(\d[\d.]*) negociações nasceram de indicação; (\d[\d.]*) luminotécnicos/,(m,a,b)=>`<li>${+a?door(G('ind','negociações que nasceram de indicação',indSet),a+' negociações','abrir as '+a+' negociações com indicador'):a} nasceram de indicação; ${+b?door(GO('ins:lumin',()=>(S.db.parceiros||[]).filter(p=>p.tipo==='luminotecnico'),lumin),b+' luminotécnicos','abrir os '+b+' luminotécnicos em Base › Parceiros'):b+' luminotécnicos'}`);
  h=h.replace(/<li>(\d[\d.]*) OS abertas, (\d[\d.]*) há mais de 7 dias/,(m,a,b)=>{const ab=()=>osAll().filter(o=>o.estado==='aberta');
    const A=+a?door(GO('ins:osab',ab,xs=>V.os(xs,'OS abertas')),a+' OS abertas'):a+' OS abertas';const B=+b?door(GO('ins:os7',()=>ab().filter(o=>dd(o.criado)>7),xs=>V.os(xs,'OS abertas há mais de 7 dias')),b+' há mais de 7 dias'):b+' há mais de 7 dias';
    return `<li>${A}, ${B}${+a?` <span class="sub" style="font-size:12px">· ${a} abertas = ${b} há mais de 7 dias + ${N0(+a-(+b))} recentes</span>`:''}`});
  h=h.replace(/<li>(\d[\d.]*) clientes concluídos sem negociação aberta/,(m,n)=>+n?`<li>${door(GO('ins:reat',reatSet,reativar),n+' clientes','abrir os '+n+' clientes com obra concluída e sem negociação aberta')} concluídos sem negociação aberta`:m);
  return h}
const lumin=ps=>({path:'#/dbparceiros',lb:N0(ps.length)+' · luminotécnicos',unid:'parceiros',recs:ps.map(p=>({ids:[String(p.id)],name:p.nome||p.id})),nav(){location.hash='#/dbparceiros'}});
/* com o filtro de frente/consultor ligado, a Gestão (v146) só enxerga as propostas daquele recorte — a frase conta assim */
const temCons=(p,c)=>!c||(p.consultores||[]).some(x=>String(x).toLowerCase().includes(String(c).toLowerCase().split(' ')[0]));
const subProps=()=>{const f=S.comF||{};return (S.db.propostas||[]).filter(p=>(!f.frente||p.linha===f.frente)&&temCons(p,f.cons))};
const reatSet=()=>{const P=subProps();return (S.db.clientes||[]).filter(c=>P.some(p=>p.sigla===c.sigla&&p.estado==='concluida')&&!(S.db.negociacoes||[]).some(n=>n.cliente_id===c.id&&!n.resultado))};
const reativar=cs=>({path:'#/dbclientes',lb:N0(cs.length)+' · clientes concluídos sem negociação aberta (Reativação)',unid:'clientes',recs:cs.map(c=>({ids:[String(c.id)],name:c.nome||c.id})),nav(){location.hash='#/dbclientes'}});

/* ───────── §6 Visão Geral ───────── */
const envioSet=()=>negsG().filter(n=>(['enviada','revisao'].includes(n.etapa)||n.resultado)&&n.criado&&n.movido&&isFinite(dd(n.criado)-dd(n.movido)));
const negocSet=()=>negsG().filter(n=>n.resultado==='fechada'&&n.criado&&isFinite(dd(n.criado)));
function geralHTML(h){
  h=h.replace(/<div class="sub" style="font-size:11px">([\d.,]+%) de (R\$ [\d.,]+M)<\/div>/,(m,p,mt)=>`<div class="sub" style="font-size:11px">${door("V156.gestaoProp('')",p,'abrir as propostas vendidas no ano que formam o %')} de ${door("S.gSub='metas';render()",mt,'ver a meta por unidade (Metas & Faturamento)')}</div>`);
  /* % CONVERSÃO: a v164 (07/11) fixou conversão = ganhas ÷ perdidas (Início, De onde vem, Insights: 265 ÷ 433 = 61,2%), mas
     este cartão ainda sai com a conta antiga (ganhas ÷ decididas: "38,0% · 265 de 698 decididas"). Só quando o cartão mostra
     a conta antiga, ele passa a mostrar a da v164, com os mesmos números do próprio cartão (ganhas = G, perdidas = D − G) e
     as mesmas portas da v164 (V156.negF fechada / perdida). Quando a camada dona do cartão corrigir, isto deixa de agir. */
  h=h.replace(/(CONVERSÃO<\/div><div [^>]*>)([\d.,]+)%(<\/div><div class="sub" style="font-size:11px">)(\d[\d.]*) de (\d[\d.]*) decididas(<\/div>)/,(m,a,pc,b,g,d,z)=>{
    const G1=+g.replace(/\./g,''),D1=+d.replace(/\./g,''),P1=D1-G1;const shown=+pc.replace(/\./g,'').replace(',','.');
    if(!(D1>0&&P1>0)||Math.abs(G1/D1*100-shown)>0.06)return m;
    const nv=(G1/P1*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
    return `${a}${nv}%${b}${door("V156.negF({res:'fechada'})",N0(G1)+' ganhas','abrir as '+N0(G1)+' negociações ganhas (fechadas)')} ÷ ${door("V156.negF({res:'perdida'})",N0(P1)+' perdidas','abrir as '+N0(P1)+' negociações perdidas')}${z}`});
  const oT=G('g:tot','negociações (todas)',()=>negsG()),oJ=G('g:jogo','negociações em aberto',()=>negsG().filter(n=>!n.resultado));
  h=h.replace(/(<div style="font-size:12px;color:#9aa">)(\d[\d.]*) negociações · (\d[\d.]*) em aberto ·/,(m,pre,a,b)=>`${pre}${door(oT,a+' negociações')} · ${door(oJ,b+' em aberto')} ·`);
  h=h.replace(/(POR CHANCE DE FECHAMENTO · )(\d[\d.]*)( em aberto)/,(m,a,b,c)=>a+door(oJ,b+c,'abrir as '+b+' negociações em aberto'));
  h=h.replace(/>Consultores \((\d+) visíveis\)</,(m,n)=>`>${door("V156.rolar('[data-v158l=cons]')",'Consultores ('+n+' visíveis)','ver a tabela por consultor logo abaixo')}<`);
  h=h.replace(/(letter-spacing:\.06em")(>NEGOCIAÇÕES POR CONSULTOR<\/b>)/,'$1 data-v158l="cons"$2');
  h=h.replace(/(TEMPO MÉDIO PARA ENVIO DA PROPOSTA<\/b>[\s\S]*?)<b style="font-size:22px">(\d[\d.]* dias)<\/b>/,(m,pre,v)=>{const n=envioSet().length;if(!n)return m;const on=G('g:envio','negociações da média de envio da proposta',envioSet);
    const T0=negsG().filter(x=>['enviada','revisao'].includes(x.etapa)||x.resultado);const fora=T0.length-n;
    return `${pre}<b style="font-size:22px">${door(on,v,'abrir as '+n+' negociações que formam a média')}</b> <span class="sub" style="font-size:11px">· média de ${door(on,N0(n)+' negociações')}${fora>0?` (de ${door(G('g:envio:t','negociações com proposta enviada ou decididas',()=>negsG().filter(x=>['enviada','revisao'].includes(x.etapa)||x.resultado)),N0(T0.length))} enviadas/decididas; ${door(G('g:envio:f','enviadas/decididas sem as duas datas',()=>{const S1=new Set(envioSet().map(x=>x.id));return negsG().filter(x=>(['enviada','revisao'].includes(x.etapa)||x.resultado)&&!S1.has(x.id))}),N0(fora)+' sem as duas datas')})`:''}</span>`});
  h=h.replace(/(TEMPO MÉDIO DE NEGOCIAÇÃO<\/b>[\s\S]*?)<b style="font-size:22px">(\d[\d.]* dias)<\/b>/,(m,pre,v)=>{const n=negocSet().length;if(!n)return m;const on=G('g:negoc','negociações fechadas da média de negociação',negocSet);
    const F0=negsG().filter(x=>x.resultado==='fechada');const fora=F0.length-n;
    return `${pre}<b style="font-size:22px">${door(on,v,'abrir as '+n+' fechadas que formam a média')}</b> <span class="sub" style="font-size:11px">· média de ${door(on,N0(n)+' fechadas')}${fora>0?` (de ${door(G('g:fech:t','negociações fechadas',()=>negsG().filter(x=>x.resultado==='fechada')),N0(F0.length)+' fechadas')}; ${door(G('g:negoc:f','fechadas sem data de criação',()=>{const S1=new Set(negocSet().map(x=>x.id));return negsG().filter(x=>x.resultado==='fechada'&&!S1.has(x.id))}),N0(fora)+' sem data de criação')})`:''}</span>`});
  return h}

function gestaoHTML(h){if(typeof h!=='string')return h;const gs=S.gSub||'geral';
  /* (o total "568 =" do bloco verde saiu: a v156/v157 já liga esse número) */
  h=h.replace(/v158s: ([a-z0-9]+)/,(m,k)=>V._lb[k]?`${E(V._lb[k])}`:'conjunto de um número (abra o número de novo)');
  if(gs==='geral')h=geralHTML(h);else if(gs==='comercial')h=comercialHTML(h);else if(gs==='rp')h=rpHTML(h);else if(gs==='boutique')h=boutiqueHTML(h);else if(gs==='posvendas')h=posvHTML(h);else if(gs==='insights')h=insightsHTML(h);
  return h}
let tries=0;
function liga(){if(typeof SCREENS!=='object'||typeof SCREENS.gestao!=='function')return false;const g0=SCREENS.gestao;if(g0.__v158)return true;
  if(!g0.__v157&&++tries<40)return false;/* espera a v157 embrulhar primeiro (as portas dela vêm antes das minhas) */
  const Wr=function(){const h=g0.apply(this,arguments);try{return gestaoHTML(h)}catch(e){console.error('v158 gestao',e);return h}};
  Object.keys(g0).forEach(k=>{try{Wr[k]=g0[k]}catch(e){}});Wr.__v158=true;SCREENS.gestao=Wr;return true}
if(!liga()){let n=0;const iv=setInterval(()=>{if(liga()||++n>80){clearInterval(iv);try{if(/^#\/gestao/.test(location.hash)&&typeof renderMain==='function')renderMain()}catch(e){}}},500)}
else{try{if(/^#\/gestao/.test(location.hash)&&typeof renderMain==='function')renderMain()}catch(e){}}

/* ───────── §7 rosquinhas da Gestão: fatias e centro abrem o que a legenda abre ───────── */
const ETQ=()=>{const o={};T(()=>ETAPAS_DEAL,[]).forEach(([k,l])=>o[l]=k);return o};
function posDonut(){if(!/^#\/gestao/.test(location.hash))return;const m=document.getElementById('main');if(!m)return;
  m.querySelectorAll('svg').forEach(svg=>{if(svg.__v158)return;const leg=svg.nextElementSibling;if(!leg)return;const paths=[...svg.querySelectorAll('path')];if(!paths.length)return;svg.__v158=1;
    const items=[...leg.children].map(d=>{const t=(d.textContent||'').replace(/\s+/g,' ').trim();const mm=/^(\d[\d.]*) · (.+)$/.exec(t);if(!mm)return null;const el=d.hasAttribute('onclick')?d:d.querySelector('[onclick]');return {n:+mm[1].replace(/\./g,''),l:mm[2],el}}).filter(Boolean);
    paths.forEach(p=>{const ti=p.querySelector('title');if(!ti)return;const mm=/^(.*): (\d+)$/.exec(ti.textContent||'');if(!mm)return;const it=items.find(x=>x.l===mm[1]&&x.n===+mm[2]&&x.el);if(!it)return;
      p.setAttribute('onclick',it.el.getAttribute('onclick'));p.style.cursor='pointer'});
    const tx=svg.querySelector('text');if(!tx)return;const tv=(tx.textContent||'').trim();const card=svg.closest('.card');const cap=card?((card.querySelector('b,div')||{}).textContent||'').replace(/\s+/g,' ').trim():'';
    let on=null,tt='';const soma=items.reduce((a,x)=>a+x.n,0);
    if(/^■ /.test(cap)||ETQ()[cap.replace(/^■\s*/,'')]){const et=ETQ()[cap.replace(/^■\s*/,'')];if(et){on=G('d:et:'+et,'em jogo · '+cap.replace(/^■\s*/,''),()=>negsG().filter(n=>!n.resultado&&n.etapa===et));tt='abrir as '+tv+' negociações em jogo nesta etapa'}}
    else if(/^PIPELINE POR STATUS/.test(cap)){on=G('d:pipe','negociações em jogo + fechadas + perdidas',()=>negsG().filter(n=>!n.resultado||n.resultado==='fechada'||n.resultado==='perdida'));tt='abrir as '+tv+' negociações (em jogo + fechadas + perdidas; as "no futuro" ficam de fora da rosquinha)'}
    else if(/^PROPOSTAS POR STATUS/.test(cap)){on=GO('d:prop',subProps,ps=>V.props(ps,N0(ps.length)+' · propostas (todas as situações)',{}));tt='abrir as '+tv+' propostas'}
    else if(/^VENDIDO DO GRUPO/.test(cap)){on="V156.gestaoProp('')";tt='abrir as propostas vendidas no ano'}
    else if(/^POR STATUS/.test(cap)&&(S.gSub==='boutique')){on=G('d:focal','visitas da Focal',()=>(S.db.negociacoes||[]).filter(n=>n.frente==='focal'));tt='abrir as '+tv+' visitas'}
    if(!on||!+tv.replace(/\D/g,''))return;if(/^\d/.test(tv)&&!/%$/.test(tv)&&soma&&+tv.replace(/\./g,'')!==soma&&!/^VENDIDO/.test(cap))tt+=' (legenda soma '+soma+')';
    tx.setAttribute('onclick','event.stopPropagation();'+on);tx.style.cursor='pointer';tx.style.textDecoration='underline dotted';const t2=document.createElementNS('http://www.w3.org/2000/svg','title');t2.textContent=tt;tx.appendChild(t2)})}

/* ───────── §8 Início: nada (08/11) ─────────
   "345" e "Das N obras em andamento" já são portas da v157/v161e. "· os 21 =" reusava a porta irmã "21 fora da planilha do
   CRM" (v157-crm, V157.base('r1')), que hoje chega em Base › Parceiros com 20 (não 21) — uma porta que não confere não é
   copiada; a correção é na v157-crm. */

function posPortas(){if(!/^#\/gestao/.test(location.hash))return;document.querySelectorAll('#main [data-v158on]').forEach(e=>{const on=e.getAttribute('data-v158on');if(e.getAttribute('onclick')!==on)e.setAttribute('onclick',on);
  const ti=e.getAttribute('data-v158ti');if(ti&&e.getAttribute('title')!==ti)e.setAttribute('title',ti);if(e.tagName==='A'&&!e.getAttribute('href'))e.setAttribute('href','javascript:void 0')})}
const POSF=[posPortas,posDonut];
(function(){const f=()=>{const P=W().pos;if(Array.isArray(P)){POSF.forEach(x=>P.push(x));return true}return false};
  if(!f()){let n=0;const iv=setInterval(()=>{if(f()||++n>60){clearInterval(iv);if(n>60){try{new MutationObserver(()=>POSF.forEach(x=>{try{x()}catch(e){}})).observe(document.body,{childList:true,subtree:true})}catch(e){}}}},500)}})();
})();
