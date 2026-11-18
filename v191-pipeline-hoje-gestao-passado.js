/* =====================================================================================================
   v191 · PIPELINE = HOJE E FUTURO · GESTÃO = O QUE JÁ ACONTECEU (Bruno, 18/11/2026)
   "A ideia do pipeline é ver a informação de hoje. As propostas fechadas não são relevantes hoje — filtrar por cliente e
    por consultores ativos: futuro, presente. (…) Na Gestão quero entender toda a informação do passado, de um jeito fácil,
    porque essa informação está na planilha."
   PIPELINE
     · os cartões Fechadas e Perdidas e a faixa "Fechadas: R$ …" saem; a conta do topo passa a ser só o que está vivo:
       N = em jogo + status vazio + no futuro (cada termo abre a lista). Um link leva o passado para a Gestão.
     · Filtros › Consultor: só quem tem negociação em jogo ou no futuro (ex.: Felipe, que só tem uma fechada, sai);
       cada nome mostra quantas tem. Ex-consultores só aparecem se ainda carregam alguma viva.
     · Filtros › Cliente (novo): os clientes com negociação em jogo ou no futuro.
     · (Tarefas de hoje usa o mesmo filtro de consultor.)
   GESTÃO
     · nova seção "O QUE JÁ ACONTECEU": as negociações decididas da aba Pipeline da To Do Comercial — fechadas e perdidas —
       por ano (gráfico) e por consultor (tabela), conversão = fechadas ÷ perdidas (regra do Bruno, 07/11), valor das
       fechadas = venda METAS emprestada (regra R1 de 06/11). Todo número abre a lista exata (Comercial › Negociações).
       Data de cada uma: decisão do cliente → upgrade → envio da proposta (colunas da planilha); sem nenhuma = "sem data".
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v191)return;window.__v191=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R0=v=>'R$ '+Math.round(+v||0).toLocaleString('pt-BR');
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const txt=el=>el?String(el.textContent||'').replace(/\s+/g,' ').trim():'';
const cur=()=>(location.hash||'').split('?')[0];
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const NEG=()=>(S.db&&S.db.negociacoes)||[];
const vivo=n=>n&&n.resultado!=='fechada'&&n.resultado!=='perdida';
const consDe=n=>T(()=>negCons(n),[n.consultor]);
const st=window.V191=window.V191||{ano:'*'};

/* conjuntos exatos → a lista Comercial › Negociações já filtrada (mecanismo da v158) */
function abrir(ids,lb){const V=window.V158=window.V158||{};V._s=V._s||{};V._lb=V._lb||{};
  const key='v191'+Math.abs([...String(lb)].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)).toString(36);
  V._s[key]=new Set(ids.map(String));V._lb[key]=lb;S.negF={v158s:key};
  if(cur()==='#/negs'){try{renderMain()}catch(e){}}else location.hash='#/negs'}
const REG={};let seq=0;
const porta=(ids,lb,html,style)=>{const k='r'+(++seq);REG[k]={ids,lb};return `<a href="javascript:void 0" class="v191-door" style="${style||''}" title="Abrir as ${N0(ids.length)} negociações" onclick="event.stopPropagation();V191.go('${k}')">${html}</a>`};
st.go=k=>{const r=REG[k];if(r)abrir(r.ids,r.lb)};

/* ═════════════ PIPELINE ═════════════ */
/* o cliente escolhido em Filtros › Cliente estreita a lista no próprio desenho (como o Indicador da v160) */
function envolvePipe(){['pipeline','hoje'].forEach(nm=>{const f0=SCREENS&&SCREENS[nm];if(typeof f0!=='function'||f0.__v191)return;
  const W=function(){const cli=(S.comF||{}).cli;const all=S.db.negociacoes;
    if(cli)S.db.negociacoes=all.filter(n=>nz(n.cliente_nome)===nz(cli));
    try{if(nm==='pipeline')st.vivos=S.db.negociacoes.filter(n=>vivo(n)&&T(()=>negMatch(n,{frente:(S.comF||{}).frente,cons:(S.comF||{}).cons}),true)).map(n=>n.id);
      return f0.apply(this,arguments)}finally{S.db.negociacoes=all}};
  Object.keys(f0).forEach(x=>{if(x!=='__v160i')try{W[x]=f0[x]}catch(e){}});W.__v191=true;SCREENS[nm]=W})}

function pipeTopo(m){
  const eqCard=[...m.children].find(c=>!c.dataset.v191&&/^\d[\d.]*\s*=\s*\d/.test(txt(c))&&/fechadas/.test(txt(c))&&/em jogo/.test(txt(c)));
  if(!eqCard)return;eqCard.dataset.v191='1';
  const sp=eqCard.querySelector('span');const parts=[...sp.children];
  const pega=re=>parts.find(p=>re.test(txt(p)));
  const jogo=pega(/em jogo$/),vazio=pega(/status vazio$/),fut=pega(/futuro$/);
  const n=el=>el?+(txt(el).match(/^[\d.]+/)||['0'])[0].replace(/\./g,''):0;
  const tot=n(jogo)+n(vazio)+n(fut);
  const ids=st.vivos||NEG().filter(vivo).map(x=>x.id);
  sp.innerHTML='';
  sp.insertAdjacentHTML('beforeend',porta(ids,'Negociações de hoje e do futuro',`<b>${N0(tot)}</b>`,'color:inherit')+' de hoje e do futuro = ');
  const termos=[jogo,vazio,fut].filter(Boolean);
  termos.forEach((t,i)=>{if(i)sp.insertAdjacentText('beforeend',' + ');if(t===fut)t.textContent=n(fut).toLocaleString('pt-BR')+' no futuro';sp.appendChild(t)});
  const fonte=eqCard.querySelector('span.sub');
  if(fonte)fonte.innerHTML=`fechadas e perdidas são o passado → <a href="#/gestao" onclick="V191.ano='*';setTimeout(()=>{const e=document.getElementById('v191-hist');if(e)e.scrollIntoView({behavior:'smooth',block:'start'})},400)">Gestão › O que já aconteceu</a>`;
  /* cartões Fechadas · No futuro · Perdidas: saem */
  const row=[...m.children].find(c=>c.classList.contains('row')&&/Fechadas/.test(txt(c))&&/Perdidas/.test(txt(c)));
  if(row)row.remove(); /* "No futuro" já está na conta do topo (e abre a lista) */
  const ponte=m.querySelector('#v161d-fech');if(ponte)ponte.remove();
  /* "Mostrando 911 de 911 negociações" contava o passado: só fica quando há busca digitada */
  [...m.querySelectorAll('[data-comsearch] span.sub')].forEach(s=>{const mm=txt(s).match(/^Mostrando ([\d.]+) de ([\d.]+) negocia/);if(mm&&mm[1]===mm[2])s.style.display='none'})}

/* Filtros: Consultor só com quem tem negociação viva · Cliente novo */
function filtros(m,tela){
  const pop=m.querySelector('#v160-pop');if(!pop||pop.dataset.v191)return;pop.dataset.v191='1';
  const F=S.comF||{};
  const base=NEG().filter(n=>vivo(n)&&(!F.frente||n.frente===F.frente));
  const sels=[...pop.querySelectorAll('select')];
  const sc=sels.find(s=>[...s.options].some(o=>/Todos os consultores/.test(o.text)));
  if(sc){[...sc.options].forEach((o,i)=>{if(!i)return;const code=(window.V160&&V160.acoes&&V160.acoes[o.value])||'';const mm=code.match(/cons:'([^']*)'/);if(!mm)return;
      const c=mm[1];const k=base.filter(n=>T(()=>negMatch(n,{cons:c}),false)).length;
      if(!k&&!o.selected){o.remove();return}
      o.text=o.text.replace(/\s*\(\d[\d.]*\)$/,'')+` (${N0(k)})`})}
  if(tela!=='pipeline')return;
  const vivos=base.filter(n=>!F.cons||T(()=>negMatch(n,{cons:F.cons}),true));
  const cont={};vivos.forEach(n=>{const c=String(n.cliente_nome||'').trim();if(c)cont[c]=(cont[c]||0)+1});
  const nomes=Object.keys(cont).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const cli=F.cli||'';
  if(cli&&!cont[cli])nomes.unshift(cli);
  const html=`<span><label>Cliente</label><select onchange="S.comF={...(S.comF||{}),cli:this.value};render()"><option value="">Todos os clientes (${N0(nomes.length)})</option>${nomes.map(c=>`<option value="${E(c)}"${c===cli?' selected':''}>${E(c)}${cont[c]?' ('+cont[c]+')':''}</option>`).join('')}</select></span>`;
  if(sc&&sc.parentElement)sc.parentElement.insertAdjacentHTML('afterend',html);else pop.insertAdjacentHTML('beforeend',html);
  if(cli){let tags=pop.nextElementSibling;if(!tags||!tags.classList.contains('v160-tags')){pop.insertAdjacentHTML('afterend','<div class="v160-tags"></div>');tags=pop.nextElementSibling}
    tags.insertAdjacentHTML('beforeend',`<span class="v160-tag">Cliente: ${E(cli)} <b onclick="S.comF={...(S.comF||{}),cli:''};render()" title="tirar este filtro">×</b></span>`);
    const n=document.querySelector('#v160-fb .v160-n');if(n)n.textContent=String((+n.textContent||0)+1);else{const b=document.getElementById('v160-fb');if(b)b.insertAdjacentHTML('beforeend',' <span class="v160-n">1</span>')}}}

/* ═════════════ GESTÃO · O QUE JÁ ACONTECEU ═════════════ */
const brIso=s=>{const m=String(s||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
const dataDe=n=>{const c=(n.planilha&&n.planilha.c)||[];return brIso(c[13])||brIso(c[12])||brIso(c[11])||''};
const anoDe=n=>dataDe(n).slice(0,4)||'sem data';
const exDe=nome=>{const e=(S.db.equipe||[]).find(x=>nz(x.nome)===nz(nome)||(x.apelidos||[]).some(a=>nz(a)===nz(nome)));return !!(e&&e.ativo===false)};
const quem=n=>{const xs=T(()=>negCons(n),[]).filter(x=>x&&!/^_/.test(x));return xs.length?[...new Set(xs)].join(' + '):(String(n.consultor||'').trim()||'—')};
const valor=n=>T(()=>window.V161D.valorFechada(n),0)||0;
const dBR=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
function css(){if(document.getElementById('v191-css'))return;const s=document.createElement('style');s.id='v191-css';s.textContent=`
#v191-hist .v191-chips{display:flex;gap:6px;flex-wrap:wrap}
#v191-hist .v191-chip{border:1px solid var(--bd,rgba(0,0,0,.15));background:transparent;border-radius:999px;padding:3px 12px;font-size:12.5px;cursor:pointer;color:inherit}
#v191-hist .v191-chip.on{background:#2a78d6;border-color:#2a78d6;color:#fff}
#v191-hist .v191-big{font-size:34px;font-weight:800;line-height:1}
#v191-hist .v191-tile{border-radius:16px;padding:14px 16px;height:100%}
#v191-hist a.v191-door,.v191-door{color:inherit;text-decoration:underline dotted;cursor:pointer}
#v191-hist table td,#v191-hist table th{padding:6px 10px;font-size:13px}
#v191-hist .v191-bar{cursor:pointer}#v191-hist .v191-bar:hover{opacity:.8}`;document.head.appendChild(s)}
function decididas(){const F=S.comF||{};return NEG().filter(n=>(n.resultado==='fechada'||n.resultado==='perdida')&&(!F.frente||n.frente===F.frente)&&(!F.cons||T(()=>negMatch(n,{cons:F.cons}),true)))}
function historia(){
  const all=decididas();const anos=[...new Set(all.map(anoDe))].sort((a,b)=>a==='sem data'?1:b==='sem data'?-1:a.localeCompare(b));
  if(st.ano!=='*'&&!anos.includes(st.ano))st.ano='*';
  const xs=st.ano==='*'?all:all.filter(n=>anoDe(n)===st.ano);
  const fe=xs.filter(n=>n.resultado==='fechada'),pe=xs.filter(n=>n.resultado==='perdida');
  const comV=fe.filter(n=>valor(n)>0);const vt=comV.reduce((a,n)=>a+valor(n),0);
  const conv=pe.length?Math.round(fe.length/pe.length*100):null;
  const ids=a=>a.map(n=>n.id);const per=st.ano==='*'?'todos os anos':st.ano;
  const chips=`<div class="v191-chips">${['*'].concat(anos).map(a=>`<button class="v191-chip${st.ano===a?' on':''}" onclick="V191.ano='${J(a)}';renderMain()">${a==='*'?'Todos os anos':E(a)}</button>`).join('')}</div>`;
  /* gráfico por ano: fechadas × perdidas (cada barra abre a lista) */
  const porAno=anos.map(a=>({a,f:all.filter(n=>anoDe(n)===a&&n.resultado==='fechada'),p:all.filter(n=>anoDe(n)===a&&n.resultado==='perdida')}));
  const mx=Math.max(1,...porAno.map(x=>Math.max(x.f.length,x.p.length)));const H=120,bw=26,gap=14,gw=bw*2+gap+26;
  const svg=`<svg viewBox="0 0 ${porAno.length*gw+10} ${H+52}" style="width:100%;max-width:${porAno.length*gw*1.6+20}px;height:auto;display:block">${porAno.map((x,i)=>{const x0=10+i*gw;const hf=x.f.length/mx*H,hp=x.p.length/mx*H;const on=st.ano==='*'||st.ano===x.a;
    REG['bf'+i]={ids:ids(x.f),lb:'Fechadas · '+x.a};REG['bp'+i]={ids:ids(x.p),lb:'Perdidas · '+x.a};
    return `<g opacity="${on?1:.35}"><rect class="v191-bar" x="${x0}" y="${H-hf+22}" width="${bw}" height="${Math.max(hf,1)}" rx="4" fill="#198754" onclick="V191.go('bf${i}')"><title>${x.f.length} fechadas em ${x.a}</title></rect><text x="${x0+bw/2}" y="${H-hf+17}" font-size="11" text-anchor="middle" fill="currentColor">${x.f.length}</text>
      <rect class="v191-bar" x="${x0+bw+4}" y="${H-hp+22}" width="${bw}" height="${Math.max(hp,1)}" rx="4" fill="#dc3545" onclick="V191.go('bp${i}')"><title>${x.p.length} perdidas em ${x.a}</title></rect><text x="${x0+bw+4+bw/2}" y="${H-hp+17}" font-size="11" text-anchor="middle" fill="currentColor">${x.p.length}</text>
      <text x="${x0+bw+2}" y="${H+40}" font-size="12" text-anchor="middle" fill="currentColor" opacity=".75">${E(x.a)}</text></g>`}).join('')}</svg>`;
  /* por consultor: o campo consultor da planilha (a soma das linhas = o total) */
  const g={};xs.forEach(n=>{const c=quem(n);(g[c]=g[c]||{f:[],p:[]})[n.resultado==='fechada'?'f':'p'].push(n)});
  const linhas=Object.entries(g).sort((a,b)=>b[1].f.length-a[1].f.length||b[1].p.length-a[1].p.length);
  const ult=a=>a.map(dataDe).filter(Boolean).sort().pop()||'';
  const tab=`<div class="table-responsive"><table class="table mb-0"><thead><tr><th>Consultor</th><th class="text-end">Fechadas</th><th class="text-end">Perdidas</th><th class="text-end">Conversão</th><th class="text-end">Valor das fechadas (METAS)</th><th class="text-end">Última decisão</th></tr></thead><tbody>${linhas.map(([c,x])=>{const v=x.f.reduce((a,n)=>a+valor(n),0);
      return `<tr><td><b>${E(c)}</b>${c.split(' + ').some(exDe)?' <span class="chip" style="font-size:10px">ex-consultor</span>':''}</td><td class="text-end">${x.f.length?porta(ids(x.f),'Fechadas · '+c+' · '+per,N0(x.f.length),'color:#198754;font-weight:700'):'—'}</td><td class="text-end">${x.p.length?porta(ids(x.p),'Perdidas · '+c+' · '+per,N0(x.p.length),'color:#dc3545'):'—'}</td><td class="text-end">${x.p.length?Math.round(x.f.length/x.p.length*100)+'%':(x.f.length?'só fechadas':'—')}</td><td class="text-end">${v?porta(ids(x.f.filter(n=>valor(n)>0)),'Fechadas com venda METAS · '+c,R0(v)):'<span class="sub">—</span>'}</td><td class="text-end sub">${dBR(ult(x.f.concat(x.p)))}</td></tr>`}).join('')}
    <tr style="background:rgba(127,127,127,.06)"><td class="sub">Total</td><td class="text-end"><b>${N0(fe.length)}</b></td><td class="text-end"><b>${N0(pe.length)}</b></td><td class="text-end"><b>${conv==null?'—':conv+'%'}</b></td><td class="text-end"><b>${R0(vt)}</b></td><td></td></tr></tbody></table></div>`;
  const tile=(bg,lb,big,sub)=>`<div class="col-12 col-md-4"><div class="v191-tile" style="background:${bg}"><div class="sub" style="font-size:12px">${lb}</div><div class="v191-big">${big}</div><div class="sub" style="font-size:12px;margin-top:4px">${sub}</div></div></div>`;
  return `<div class="card p-3 mb-3" id="v191-hist" data-v191="1">
   <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2"><div><div class="sub" style="font-size:11px;letter-spacing:.06em">O QUE JÁ ACONTECEU · o passado do Comercial</div><div class="sub" style="font-size:12px">as negociações que já se decidiram na aba Pipeline da To Do Comercial — fechadas e perdidas</div></div>${chips}</div>
   <div class="row g-2 mb-3">
    ${tile('rgba(25,135,84,.12)','Fechadas · '+E(per),porta(ids(fe),'Fechadas · '+per,N0(fe.length),'color:#146c43'),`${porta(ids(comV),'Fechadas com venda METAS · '+per,R0(vt),'font-weight:700;color:#146c43')} em ${N0(comV.length)} com venda METAS · ${N0(fe.length-comV.length)} sem valor cadastrado`)}
    ${tile('rgba(220,53,69,.1)','Perdidas · '+E(per),porta(ids(pe),'Perdidas · '+per,N0(pe.length),'color:#b02a37'),'propostas que o cliente não fechou')}
    ${tile('rgba(42,120,214,.1)','Conversão (fechadas ÷ perdidas)',conv==null?'—':conv+'%',`${porta(ids(xs),'Decididas · '+per,N0(xs.length))} decididas = ${N0(fe.length)} fechadas + ${N0(pe.length)} perdidas ✓`)}
   </div>
   <div class="row g-3"><div class="col-12 col-lg-4"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em">POR ANO · <span style="color:#198754">■</span> fechadas <span style="color:#dc3545">■</span> perdidas</div>${svg}</div>
    <div class="col-12 col-lg-8"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em">POR CONSULTOR · ${E(per)}</div>${tab}</div></div>
   <div class="sub mt-2" style="font-size:11.5px">Fonte: aba Pipeline da To Do Comercial (status Fechado / Perdido) · ano = data de decisão do cliente → data de upgrade → data de envio da proposta; sem nenhuma, "sem data" · valor = a venda do mesmo cliente na METAS 2026 · clique em qualquer número para ver as negociações.</div></div>`}
function gestao(m){if(m.querySelector('#v191-hist'))return;css();
  const alvo=[...m.querySelectorAll('.card')].find(c=>/^OBRAS EM TRABALHO/i.test(txt(c).slice(0,40)));
  let html;try{html=historia()}catch(e){console.error('v191 gestão',e);return}
  const box=alvo&&alvo.closest('#main > *');
  if(box&&box.parentElement===m)box.insertAdjacentHTML('beforebegin',html);else if(alvo)alvo.insertAdjacentHTML('beforebegin',html);else m.insertAdjacentHTML('beforeend',html)}

/* ═════════════ ligação ═════════════ */
function passo(){envolvePipe();const m=document.getElementById('main');if(!m)return;const h=cur();
  try{if(h==='#/pipeline'){pipeTopo(m);filtros(m,'pipeline')}else if(h==='#/hoje')filtros(m,'hoje');else if(h==='#/gestao')gestao(m)}catch(e){console.error('v191',e)}}
let agendado=false;const mo=new MutationObserver(()=>{if(agendado)return;agendado=true;Promise.resolve().then(()=>{agendado=false;mo.disconnect();try{passo()}finally{liga()}})});
function liga(){const m=document.getElementById('main');if(m)mo.observe(m,{childList:true,subtree:true})}
const ini=()=>{if(!document.getElementById('main')){setTimeout(ini,200);return}passo();liga()};ini();
window.addEventListener('hashchange',()=>setTimeout(()=>{mo.disconnect();try{passo()}finally{liga()}},0));
})();
