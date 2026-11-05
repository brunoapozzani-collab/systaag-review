/* =====================================================================================================
   v157 · CRM — cada número do CRM cai exatamente nos registros dele, e toda diferença vira ponte (05/11/2026)
   Regra do Bruno: um número clicável abre exatamente os registros que o formam; quando dois números diferem, a
   diferença aparece explícita, com cada termo clicável e o motivo escrito.
     §1 dentro do iframe do CRM (o código é injetado no documento do #crmFrame — o fonte base64 não muda):
        · Painel de Gestão › "Ações em dia (hoje)": o cartão abria as 83 ATRASADAS; agora abre as em dia, e mostra
          "15% = 15 em dia de 98 ações pendentes (98 = 15 em dia + 83 atrasadas)", cada termo clicável
        · Painel de Ações › "Ações em dia": abria TODAS as 98 pendentes; mesma correção e mesma ponte; e a ponte
          "98 pendentes = atrasadas + hoje + 7 dias + futuras no período + depois do período" sob o quadro
        · Oportunidades: os 4 números do topo não abriam nada; agora abrem exatamente as oportunidades de cada um,
          com a ponte "N no filtro = em andamento + fechadas + perdidas"
     §2 fora do iframe — parceiros "fora da planilha do CRM" (crm_fora_planilha, desde 02/11):
        a lista do CRM só mostra a planilha; os que saíram dela continuam na Base. Onde um número de parceiros
        contém algum deles, a ponte diz "345 = 324 na lista do CRM + 21 fora da planilha do CRM (desde 02/11) ›",
        e o termo abre exatamente esses parceiros em Base › Parceiros (filtrado). Vale no Início (bloco
        Relacionamento), no painel lateral do número e na tela de destino (CRM › Parceiros), e o casamento passa a
        ser por registro (id do CRM), não por nome — "Roberto Migotto" fora da planilha casava com o homônimo ativo.
   Só apresentação/navegação: nenhum dado, nenhuma regra de número muda.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v157)return;window.__v157=true;
const V=window.V157=window.V157||{};
const N0=v=>(+v||0).toLocaleString('pt-BR');
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};

/* ═════════════════════════ §1 código que roda DENTRO do iframe do CRM ═════════════════════════ */
function FRAME(){
  if(window.__v157f)return;window.__v157f=true;
  const N0=v=>(+v||0).toLocaleString('pt-BR');
  const F=window.V157F={sets:{},dia:{}};
  const A=(txt,js)=>`<a href="#" class="v157-a" title="Abrir exatamente estes registros" onclick="event.preventDefault();event.stopPropagation();${js};return false">${txt}</a>`;
  const css=document.createElement('style');
  css.textContent='.v157-a{color:inherit;font-weight:700;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer}.v157-a:hover{text-decoration-style:solid}'+
    '.v157-pt{margin:0 0 10px;padding:8px 12px;border-radius:10px;background:rgba(0,113,227,.08);font-size:12.5px;line-height:1.55}'+
    '.tile .d.v157-d{line-height:1.5}.v157-kb{margin:-4px 0 12px;font-size:12.5px;line-height:1.55;color:var(--muted,#6b6b6b)}';
  (document.head||document.documentElement).appendChild(css);
  /* abre a lista de um conjunto, com a ponte no topo da janela */
  F.abrir=function(key){const s=F.sets[key];if(!s)return;const id='v157_'+key;
    CHARTS[id]={title:s.title,groups:[[s.label,s.items.slice()]],kind:s.kind};detalheGrupo(id,0);
    const m=document.getElementById('modal');const c=m&&m.querySelector('.content');
    if(c&&s.ponte){const d=document.createElement('div');d.className='v157-pt';d.innerHTML=s.ponte();c.insertBefore(d,c.firstChild)}};
  const put=(key,o)=>{F.sets[key]=o};

  /* ── Ações em dia: p = 'g' (Painel de Gestão) ou 'h' (Painel de Ações) ── */
  function dia(p,pend,pct,title,emDiaDe){const t=todayISO();
    const atr=pend.filter(x=>x.data_prevista<t), em=pend.filter(emDiaDe), sem=pend.filter(x=>!(x.data_prevista<t)&&!emDiaDe(x));
    F.dia[p]={pct,em:em.length,pend:pend.length,atr:atr.length,sem:sem.length};
    const pt=()=>ponteDia(p);
    put(p+'em',{title,label:'em dia',items:em,kind:'tarefas',ponte:pt});
    put(p+'pend',{title,label:'todas as pendentes',items:pend,kind:'tarefas',ponte:pt});
    put(p+'atr',{title,label:'atrasadas',items:atr,kind:'tarefas',ponte:pt});
    put(p+'sem',{title,label:'sem data prevista',items:sem,kind:'tarefas',ponte:pt})}
  function ponteDia(p){const d=F.dia[p];if(!d)return '';if(!d.pend)return `<b>${d.pct}%</b> = nenhuma ação pendente`;
    return `<b>${d.pct}%</b> = ${A(N0(d.em)+' em dia',`V157F.abrir('${p}em')`)} de ${A(N0(d.pend)+' ações pendentes',`V157F.abrir('${p}pend')`)}`+
      `<br><span style="opacity:.8">${N0(d.pend)} = ${N0(d.em)} em dia + ${A(N0(d.atr)+' atrasadas',`V157F.abrir('${p}atr')`)}${d.sem?' + '+A(N0(d.sem)+' sem data prevista',`V157F.abrir('${p}sem')`):''}</span>`}
  function ligaTile(tile,p){if(!tile||tile.getAttribute('data-v157')===String(F.dia[p].pend)+'/'+F.dia[p].em)return;
    tile.setAttribute('data-v157',String(F.dia[p].pend)+'/'+F.dia[p].em);
    tile.setAttribute('onclick',`V157F.abrir('${p}em')`);tile.title='Abre as ações em dia (as que formam o %)';
    let d=tile.querySelector('.d');if(!d){d=document.createElement('div');d.className='d';tile.appendChild(d)}
    d.classList.add('v157-d');d.innerHTML=ponteDia(p)}

  function gestao(v){const G=window.GD;if(!G||!G.pend)return;const tile=v.querySelector(`.tile[onclick*="CHARTS['g6']"],.tile[data-v157g]`);if(!tile)return;
    tile.setAttribute('data-v157g','1');
    dia('g',G.pend,G.emDia,'Ações em dia (hoje)',x=>!(x.data_prevista<todayISO()));ligaTile(tile,'g')}

  function home(v){const H=window.HK;if(!H||!H.pend)return;const tile=v.querySelector(`.tile[onclick*="CHARTS['hk1']"],.tile[data-v157h]`);if(!tile)return;
    tile.setAttribute('data-v157h','1');const t=todayISO();
    const pct=parseInt((tile.querySelector('.n')||{}).textContent,10);
    dia('h',H.pend,isNaN(pct)?0:pct,'Ações em dia',x=>x.data_prevista>=t);ligaTile(tile,'h');
    /* o quadro: as colunas somam as 98 pendentes? a ponte diz quanto fica fora do período */
    const kb=v.querySelector('.kb');if(!kb)return;
    const f=VIEW.params||{};const de=f.de||t,ate=f.ate||addDays(t,30),t7=addDays(t,7);
    const B={late:H.pend.filter(x=>x.data_prevista<t),today:H.pend.filter(x=>x.data_prevista===t),w7:H.pend.filter(x=>x.data_prevista>t&&x.data_prevista<=t7),
      fut:H.pend.filter(x=>x.data_prevista>t7&&x.data_prevista<=ate),dep:H.pend.filter(x=>x.data_prevista>ate),sem:H.pend.filter(x=>!x.data_prevista)};
    const colN=k=>{const c=kb.querySelector('.kb-col.'+k+' .kb-head .n');return c?parseInt(c.textContent,10):NaN};
    /* só quando o quadro mostra o mesmo recorte das 98 (sem filtro de status / responsável, com as atrasadas) */
    const bate=['late','today','w7','fut'].every(k=>colN(k)===B[k].length)&&de===t;
    let pk=v.querySelector('.v157-kb');
    if(!bate){if(pk)pk.remove();return}
    const lb={late:'atrasadas',today:'hoje',w7:'nos próximos 7 dias',fut:'futuras até '+fmtD(ate),dep:'depois de '+fmtD(ate)+' (fora do período)',sem:'sem data prevista'};
    Object.keys(B).forEach(k=>put('hkb_'+k,{title:'Ações pendentes',label:lb[k],items:B[k],kind:'tarefas',ponte:()=>ponteKb()}));
    put('hkb_all',{title:'Ações pendentes',label:'todas',items:H.pend,kind:'tarefas',ponte:()=>ponteKb()});
    function ponteKb(){return `${A(N0(H.pend.length)+' ações pendentes','V157F.abrir(\'hkb_all\')')} = `+Object.keys(B).filter(k=>B[k].length||['late','today','w7','fut'].includes(k)).map(k=>A(N0(B[k].length)+' '+lb[k],`V157F.abrir('hkb_${k}')`)).join(' + ')}
    const html=`Ponte: ${ponteKb()}`;
    if(!pk){pk=document.createElement('div');pk.className='v157-kb';kb.parentNode.insertBefore(pk,kb)}
    if(pk.getAttribute('data-h')!==html){pk.setAttribute('data-h',html);pk.innerHTML=html}}

  function oport(v){const ch=CHARTS.o_status;if(!ch||!ch.groups)return;const grid=v.querySelector('.grid.c4');if(!grid||grid.getAttribute('data-v157'))return;
    const tiles=[...grid.querySelectorAll(':scope > .tile')];if(tiles.length!==4)return;
    const rows=ch.groups.flatMap(g=>g[1]);
    const fe=rows.filter(o=>o.status==='FECHADO'),pe=rows.filter(o=>o.status==='PERDIDO'),ab=rows.filter(o=>o.status!=='FECHADO'&&o.status!=='PERDIDO');
    const L=[['todas no filtro',rows],['em andamento',ab],['fechadas',fe],['perdidas',pe]];
    /* só liga se os números da tela são exatamente estes conjuntos */
    if(!tiles.every((t,i)=>parseInt((t.querySelector('.n')||{}).textContent,10)===L[i][1].length))return;
    grid.setAttribute('data-v157','1');
    L.forEach(([lb,items],i)=>{const k='op'+i;put(k,{title:'Oportunidades',label:lb,items,kind:'oportunidades',ponte:()=>ponteOp()});
      const t=tiles[i];t.classList.add('click');t.setAttribute('onclick',`V157F.abrir('${k}')`);t.title='Abre exatamente estas oportunidades';
      const l=t.querySelector('.l');if(l&&!/›$/.test(l.textContent))l.textContent+=' ›'});
    function ponteOp(){return `${A(N0(rows.length)+' no filtro',"V157F.abrir('op0')")} = ${A(N0(ab.length)+' em andamento',"V157F.abrir('op1')")} + ${A(N0(fe.length)+' fechadas',"V157F.abrir('op2')")} + ${A(N0(pe.length)+' perdidas',"V157F.abrir('op3')")}`}
    let d=tiles[0].querySelector('.d');if(!d){d=document.createElement('div');d.className='d';tiles[0].appendChild(d)}d.classList.add('v157-d');d.innerHTML=ponteOp()}

  let q=false;
  function fix(){q=false;try{const v=document.getElementById('view');if(!v||typeof VIEW!=='object')return;
    if(['gestao','relatorios','semanal'].includes(VIEW.name))gestao(v);
    else if(VIEW.name==='home')home(v);
    else if(VIEW.name==='oportunidades')oport(v)}catch(e){console.error('v157 crm',e)}}
  new MutationObserver(()=>{if(q)return;q=true;setTimeout(fix,30)}).observe(document.body||document.documentElement,{childList:true,subtree:true});
  fix();
}

/* o iframe nasce quando o CRM é aberto pela primeira vez: injeta o §1 assim que ele estiver de pé */
function injeta(){const fr=document.getElementById('crmFrame');if(!fr)return;let d,w;try{d=fr.contentDocument;w=fr.contentWindow}catch(e){return}
  if(!d||!w||d.__v157||w.__v157f)return;if(typeof w.detalheGrupo!=='function'||typeof w.go!=='function'||!d.body)return;
  d.__v157=true;try{const s=d.createElement('script');s.textContent='('+FRAME.toString()+')();';(d.head||d.documentElement).appendChild(s)}catch(e){console.error('v157 injeta',e)}}
setInterval(injeta,700);

/* ═════════════════════════ §2 parceiros fora da planilha do CRM ═════════════════════════ */
const SDB=()=>{try{return S.db}catch(e){return null}};
const PS=()=>{const d=SDB();return (d&&d.parceiros)||[]};
const fora=p=>!!(p&&p.crm_fora_planilha);
const desde=list=>{const ds=[...new Set(list.map(p=>String(p.crm_fora_planilha||'')).filter(Boolean))];
  const iso=s=>{const m=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);return m?m[3]+m[2]+m[1]:s};ds.sort((a,b)=>iso(a).localeCompare(iso(b)));
  const s=ds[0]||'';const m=/^(\d{2}\/\d{2})/.exec(s);return m?m[1]:s};
const stP=p=>String(p.status||'').trim().toLowerCase();
const GRP={ativo:/^ativo/,aq:/aquec/,frio:/^frio/,cont:/contatar/};
const LB={ativo:'escritórios ativos',aq:'em aquecimento',frio:'frios',cont:'a contatar',outros:'não perturbe / out / sem status',base:'na base em trabalho','*':'parceiros'};
/* o mesmo conjunto que o número do Início (v149 parcDe / V130 'parc') */
function conjunto(k,a){const ps=PS();
  if(k==='parc')return {list:ps.slice(),lb:'parceiros'};
  if(k!=='v149:parc')return null;
  if(a==='*')return {list:ps.slice(),lb:LB['*']};
  if(a==null||a===''||a==='base')return {list:ps.filter(p=>GRP.ativo.test(stP(p))).concat(ps.filter(p=>GRP.aq.test(stP(p))),ps.filter(p=>GRP.frio.test(stP(p)))),lb:LB.base};
  if(a==='outros')return {list:ps.filter(p=>!Object.values(GRP).some(r=>r.test(stP(p)))),lb:LB.outros};
  if(GRP[a])return {list:ps.filter(p=>GRP[a].test(stP(p))),lb:LB[a]};return null}
/* registro dos conjuntos citados nas pontes (os links guardam só a chave) */
const REG={};let nREG=0;
V.reg=function(list,lb){const k='r'+(++nREG);REG[k]={ids:list.map(p=>p.id),lb};if(nREG>600)delete REG['r'+(nREG-600)];return k};
const doReg=k=>{const r=REG[k];if(!r)return null;const by=new Map(PS().map(p=>[p.id,p]));return {list:r.ids.map(id=>by.get(id)).filter(Boolean),lb:r.lb}};
const A=(txt,js,tt)=>`<a href="#" class="v157-a" title="${E(tt||'Abrir exatamente estes registros')}" onclick="event.preventDefault();event.stopPropagation();(window.top||window).V157.${js};return false">${txt}</a>`;
/* "345 parceiros = 324 na lista do CRM + 21 fora da planilha do CRM (desde 02/11) ›" */
V.ponte=function(list,lb,o={}){const fo=list.filter(fora),de=list.filter(p=>!fora(p));if(!fo.length)return '';const k=V.reg(list,lb);
  const tot=o.semTotal?'':`<b>${N0(list.length)}</b>${lb?' '+E(lb):''} = `;
  const dentro=o.semLinkCRM?`<b>${N0(de.length)}</b> na lista do CRM`:A(`${N0(de.length)} na lista do CRM`,`crm('${k}')`,'Abrir CRM › Parceiros só com estes');
  return `${tot}${dentro} + ${A(`${N0(fo.length)} fora da planilha do CRM (desde ${E(desde(fo))}) ›`,`base('${k}')`,'Abrir Base › Parceiros só com estes')}`};
V.porque=list=>{const fo=list.filter(fora);return fo.length?`saíram da planilha do CRM lida em ${E(desde(fo))}: continuam na Base (podem ter propostas e indicações), mas a lista do CRM só mostra a planilha`:''};
const fechaPainel=()=>{const x=document.querySelector('#v155-pn .v155-x');if(x)try{x.click()}catch(e){}const o=document.getElementById('v155-ov');if(o)o.remove()};
/* o termo "fora da planilha": Base › Parceiros só com esses */
V.base=function(k){const r=doReg(k);if(!r)return;const fo=r.list.filter(fora);fechaPainel();
  const inat=fo.filter(p=>p.inativo);
  const spec={path:'#/dbparceiros',lb:`${N0(fo.length)} · ${r.lb?r.lb+' · ':''}fora da planilha do CRM (desde ${desde(fo)})`,unid:'parceiros',
    /* a Base › Parceiros não lista os inativos: eles ficam fora do filtro (senão o nome casava com um homônimo) e
       entram nomeados na ponte */
    recs:fo.filter(p=>!p.inativo).map(p=>({ids:[String(p.id)],name:p.nome})),
    porque:'',
    ponte:(inat.length?`ponte: ${N0(fo.length)} = ${N0(fo.length-inat.length)} nesta lista + ${N0(inat.length)} ${inat.length===1?'inativo':'inativos'} no cadastro, que a Base › Parceiros não lista: ${inat.map(p=>'<b>'+E(p.nome)+'</b>').join(' · ')} — `:'')+V.porque(fo),
    nav(){try{S.bdQ=''}catch(e){}if(location.hash==='#/dbparceiros'){try{render()}catch(e){}}else location.hash='#/dbparceiros'}};
  if(window.V156&&V156.ir)V156.ir(spec);else spec.nav();
  /* a Base › Parceiros abre com o quadro "Possíveis duplicados" em cima: leva a tela até a faixa do filtro */
  [700,1400,2200,3200,4500].forEach(ms=>setTimeout(()=>{if((location.hash||'').split('?')[0]!=='#/dbparceiros')return;const b=document.querySelector('#main [data-v155ban]');
    if(!b)return;const r=b.getBoundingClientRect();if(r.top<56||r.top>window.innerHeight*.5){try{window.scrollTo(0,window.scrollY+r.top-90)}catch(e){}}},ms))};
/* o termo "na lista do CRM": CRM › Parceiros só com esses (pelo id do CRM) */
V.crm=function(k){const r=doReg(k);if(!r)return;const de=r.list.filter(p=>!fora(p));fechaPainel();
  const spec={path:'#/crmparceiros',lb:`${N0(de.length)} · ${r.lb?r.lb+' ':''}na lista do CRM`,unid:'parceiros',recs:de.map(p=>({ids:p.crm_id!=null?[String(p.crm_id)]:[],name:p.nome})),porque:'',v157:1,
    nav(){if(window.V156&&V156.crm)V156.crm('parceiros');else location.hash='#/crmparceiros'}};
  if(window.V156&&V156.ir)V156.ir(spec);else spec.nav()};

/* ── a tela de destino CRM › Parceiros: casa por registro e mostra a ponte com o motivo ── */
function ligaAjusta(){const P=window.V156;if(!P||typeof P.ajusta!=='function')return false;if(P.ajusta.__v157)return true;
  const a0=P.ajusta;
  const W=function(sp){try{if(sp&&sp.recs&&/^#\/crmparceiros/.test(sp.path||'')&&!/na lista do CRM$/.test(sp.lb||'')){
      const ps=PS();let list=null,lb='';
      const byCrm=new Map();ps.forEach(p=>{if(p.crm_id!=null&&p.crm_id!=='')byCrm.set(String(p.crm_id),p)});
      if(sp.recs.length&&sp.recs.every(r=>r.ids&&r.ids.length&&r.ids.some(i=>byCrm.has(String(i))))){
        list=sp.recs.map(r=>byCrm.get(String(r.ids.find(i=>byCrm.has(String(i))))));lb=/parceiros/.test(sp.unid||'')?'parceiros':''}
      else{const u=P.ult||{};const c=Date.now()-(u.t||0)<10*60e3?conjunto(u.k,u.a):null;if(c&&c.list.length===sp.recs.length){list=c.list;lb=c.lb}}
      if(list){const fo=list.filter(fora);
        if(!fo.length){if(sp.recs.some(r=>!r.ids||!r.ids.length))sp.recs=list.map(p=>({ids:p.crm_id!=null?[String(p.crm_id)]:[],name:p.nome,nn:nz(p.nome),toks:[],h:''}));return}
        const de=list.filter(p=>!fora(p));
        sp.recs=de.map(p=>({ids:p.crm_id!=null?[String(p.crm_id)]:[],name:p.nome,nn:nz(p.nome),toks:[],h:''}));
        sp.ponte=`ponte: ${V.ponte(list,lb,{semLinkCRM:true})} — ${V.porque(list)}`;sp.porque='';return}}
    }catch(e){console.error('v157 ajusta',e)}
    return a0.apply(this,arguments)};
  W.__v157=true;P.ajusta=W;return true}
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
if(!ligaAjusta()){let n=0;const iv=setInterval(()=>{if(ligaAjusta()||++n>80)clearInterval(iv)},500)}

/* ── estilo (documento de cima) ── */
(function(){const s=document.createElement('style');s.id='v157-css';
  s.textContent='.v157-a{color:inherit;font-weight:700;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer}.v157-a:hover{text-decoration-style:solid}'+
  '#v155-pn .v157-pp{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.14);font-size:13px;line-height:1.5}#v155-pn .v157-pp small{display:block;margin-top:4px;font-size:12px;opacity:.8}'+
  '.v157-ip{margin-top:6px;font-size:inherit}.v157-ip small{opacity:.8}.v157-dn{font-size:12px;opacity:.85}';
  (document.head||document.documentElement).appendChild(s)})();

/* ── painel lateral do número (v155): a ponte e o motivo logo abaixo de "Vem de" ── */
function painel(){const pn=document.getElementById('v155-pn');if(!pn||pn.querySelector('.v157-pp'))return;
  const u=(window.V156&&V156.ult)||{};if(Date.now()-(u.t||0)>8000)return;const c=conjunto(u.k,u.a);if(!c)return;
  const big=parseInt(String((pn.querySelector('.v155-num')||{}).textContent||'').replace(/\./g,''),10);if(big!==c.list.length)return;
  const h=V.ponte(c.list,c.lb);if(!h)return;
  const d=document.createElement('div');d.className='v157-pp';d.innerHTML=`${h}<small>${V.porque(c.list)}</small>`;
  const ref=pn.querySelector('.v155-src')||pn.querySelector('.v155-top');if(ref&&ref.parentNode)ref.parentNode.insertBefore(d,ref.nextSibling)}

/* ── Início › Relacionamento: a ponte da carteira ganha o termo "fora da planilha" ── */
function inicio(){if(!/^#\/(home|inicio)?$/.test((location.hash||'#/home').split('?')[0])&&location.hash)return;
  const ps=PS();if(!ps.some(fora))return;
  document.querySelectorAll('.vx-ponte').forEach(pt=>{if(!/carteira inteira/.test(pt.textContent||''))return;
    const all=conjunto('parc').list,cont=conjunto('v149:parc','cont').list,out=conjunto('v149:parc','outros').list,base=conjunto('v149:parc','base').list;
    const fo=all.filter(fora);
    const parts=[[cont,'a contatar'],[out,'não perturbe / out / sem status'],[base,'na base em trabalho']].map(([l,lb])=>[l.filter(fora),l,lb]).filter(x=>x[0].length);
    const html=`Na lista do CRM: ${V.ponte(all,'parceiros')}${parts.length>1||parts.length&&parts[0][0].length!==fo.length?' · os '+N0(fo.length)+' = '+parts.map(([f,l,lb])=>A(`${N0(f.length)} dos ${N0(l.length)} ${lb}`,`base('${V.reg(l,lb)}')`,'Abrir Base › Parceiros só com estes')).join(' + '):''}<br><small>${V.porque(all)}</small>`;
    let d=pt.querySelector('.v157-ip');const key=fo.length+'|'+all.length+'|'+parts.map(x=>x[0].length+'/'+x[1].length).join(',');
    if(d&&d.getAttribute('data-k')===key)return;if(!d){d=document.createElement('div');d.className='v157-ip';pt.appendChild(d)}
    d.setAttribute('data-k',key);d.innerHTML=html});
  /* "+ 198 a contatar" (ao lado da rosca) */
  document.querySelectorAll('[onclick*="v149:parc"][onclick*="\'cont\'"]').forEach(el=>{if(el.closest('.vx-ponte')||el.__v157)return;
    const host=el.parentNode;if(!host||host.querySelector(':scope > .v157-dn'))return;el.__v157=1;
    const cont=conjunto('v149:parc','cont').list;const f=cont.filter(fora);if(!f.length)return;
    const s=document.createElement('span');s.className='v157-dn';s.innerHTML=` · ${A(`${N0(f.length)} deles fora da planilha do CRM ›`,`base('${V.reg(cont,'a contatar')}')`,'Abrir Base › Parceiros só com estes')}`;
    el.insertAdjacentElement('afterend',s)})}

/* ── o filtro da v155 que ficou no CRM escondido: ao sair do CRM por um link de ponte, o iframe (ainda visível por
   um instante) recebia a faixa/linhas escondidas do destino seguinte e as guardava — ao voltar, a lista do CRM
   aparecia filtrada por um número velho. Fora das telas do CRM, o iframe é limpo. ── */
setInterval(()=>{if(/^#\/crm/.test(location.hash||''))return;const fr=document.getElementById('crmFrame');let d;try{d=fr&&fr.contentDocument}catch(e){return}if(!d||!d.body)return;
  d.querySelectorAll('[data-v155ban]').forEach(b=>b.remove());d.querySelectorAll('[data-v155h]').forEach(x=>{x.style.removeProperty('display');x.removeAttribute('data-v155h')})},1000);

let fila=false;const roda=()=>{fila=false;try{painel()}catch(e){console.error('v157 painel',e)}try{inicio()}catch(e){console.error('v157 inicio',e)}};
try{new MutationObserver(ms=>{if(fila)return;if(ms.every(m=>m.target&&m.target.closest&&m.target.closest('.v157-ip,.v157-pp,.v157-dn')))return;fila=true;setTimeout(roda,40)}).observe(document.body||document.documentElement,{childList:true,subtree:true})}catch(e){}
window.addEventListener('hashchange',()=>setTimeout(roda,120));
setTimeout(roda,500);
})();
