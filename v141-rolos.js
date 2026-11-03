/* v141 — ROLOS DE CABO NA CONTA DO ESTOQUE (Bruno, 03-Nov-2026)
   Problema: o Estoque contava só peças. Cabo medido em metros (rastreio 'medido') ficava fora da tabela
   "O que temos · em que situação · em qual lugar" e do "Inventário RJ · N" sem aviso nenhum:
   Estoque RJ.pdf = 128 unidades, a tela mostrava 113 (as 15 que faltavam eram rolos de cabo).
   Conserto:
   1  Estoque: nova linha "Rolos de cabo" na tabela; "Total no lugar" e "Inventário X · N" passam a contar
      peças + rolos, e a ponte aparece escrita ("128 = 113 peças + 15 rolos"). Cada número de rolos abre
      #/rolos/<lugar>, já filtrado: um produto por linha, toque para ver cada rolo e os metros.
   2  Lista "Rolos de cabo" logo abaixo de "Todos os produtos no inventário".
   3  Dado: os rolos de Cabo CAT-6e cinza (300 mts) do inventário de 02/11 entraram como 1 metro (o arquivo dizia
      "1 cx", sem metragem). Correção: rolo que nasceu com 1 m → a metragem do nome do produto, com registro no
      histórico do rolo (só toca rolos da importação de 02/11 que começaram com 1 m). */
(function(){
'use strict';
if(window.__v141)return;window.__v141=true;
if(typeof S==='undefined'||!S.db)return;
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nBR=n=>(+n||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
const med=pid=>T_(()=>isMedido(pid),false);
const prod=pid=>T_(()=>get('produtos',pid),null)||{};

/* rolos no inventário (mesma regra das peças: não baixado, não está no cliente) */
function rolosDe(id){return (S.db.unidades||[]).filter(u=>u.estado!=='baixado'&&med(u.produto_id)&&T_(()=>bucketOf(u),'')!=='cliente'&&u.loc_id&&(id==null||T_(()=>L.path(u.loc_id).some(x=>x.id===id),false)))}
window.V141_rolos=rolosDe;

/* §3 correção de dado: CAT-6e cinza 300 mts do Estoque RJ importado com 1 m */
function corrigeMetros(){try{let n=0;
  (S.db.unidades||[]).forEach(u=>{if(!med(u.produto_id))return;if(!/02\/11\/2026/.test(u.origem||''))return;const p=prod(u.produto_id);const m=String(p.nome||'').match(/(\d{2,4})\s*(m|mts|metros)\b/i);if(!m)return;const real=+m[1];
    if(+u.metros_ini===1&&+u.metros<=1&&real>1){u.metros=real;u.metros_ini=real;(u.hist=u.hist||[]).push({em:T_(()=>today(),''),por:'v141',tipo:'ajuste',titulo:'Metragem corrigida: 1 m → '+real+' m (o PDF trazia "1 cx" sem metros; a metragem vem do nome do produto)'});n++}});
  if(n){S.db._v141_cat6={em:T_(()=>today(),''),corrigidos:((S.db._v141_cat6||{}).corrigidos||0)+n};T_(()=>log('unidades','v141','Rolos do Estoque RJ com metragem corrigida: '+n));T_(()=>save())}}catch(e){console.error('v141 metros',e)}}

/* §1 a tabela do Estoque */
if(typeof SCREENS==='object'&&typeof SCREENS.estoque==='function'&&!SCREENS.estoque.__v141){const _es=SCREENS.estoque;
 SCREENS.estoque=function(){let h=_es.apply(this,arguments);try{if(typeof h!=='string')return h;
  const iT=h.indexOf('<td class="sub">Total no lugar</td>');if(iT<0)return h;
  const trA=h.lastIndexOf('<tr',iT),trB=h.indexOf('</tr>',iT)+5;
  const cols=T_(()=>N2ext(),[]);if(!cols.length)return h;
  const st=cols.map(c=>T_(()=>nodeStats(c.id).total,0)),stAll=T_(()=>nodeStats(null).total,0);
  const ro=cols.map(c=>rolosDe(c.id).length);
  const roAll=rolosDe(null).length;
  const cell=(n,href)=>n?`<a class="chip warn" style="font-size:13px" href="${href}"><b>${nBR(n)}</b></a>`:'<span class="sub">—</span>';
  const linha=`<tr data-v141="rolos"><td><b>Rolos de cabo</b><div class="sub" style="font-size:11px">medidos em metros — cada rolo conta 1</div></td>${cols.map((c,i)=>`<td class="text-center">${cell(ro[i],'#/rolos/'+encodeURIComponent(c.id))}</td>`).join('')}<td class="text-center">${roAll?`<a href="#/rolos/todos"><b>${nBR(roAll)}</b></a>`:'<span class="sub">—</span>'}</td></tr>`;
  const tot=(p,r)=>`<b>${nBR(p+r)}</b>${r?`<div class="sub" style="font-size:10.5px">${nBR(p)} peças + ${nBR(r)} rolos</div>`:''}`;
  const total=`<tr style="background:rgba(127,127,127,.06)" data-v141="total"><td class="sub">Total no lugar</td>${cols.map((c,i)=>`<td class="text-center">${tot(st[i],ro[i])}</td>`).join('')}<td class="text-center">${tot(stAll,roAll)}</td></tr>`;
  h=h.slice(0,trA)+linha+total+h.slice(trB);
  /* cabeçalho "Inventário X · N" = peças + rolos */
  T_(()=>INVS(),[]).forEach(inv=>{const id=T_(()=>invNode(inv).id,null);if(!id)return;const p=T_(()=>nodeStats(id).total,0),r=rolosDe(id).length;
    h=h.replace(new RegExp('(<a href="#/lugar/'+inv+'">Inventário '+inv+' · )\\d+(</a>)'),`$1${nBR(p+r)}$2`)});
 }catch(e){console.error('v141 estoque',e)}return h};SCREENS.estoque.__v141=1}

/* §1 #/rolos/<lugar|todos>: um produto por linha, toque para ver os rolos */
function listaRolos(us,key){const by={};us.forEach(u=>{(by[u.produto_id]=by[u.produto_id]||[]).push(u)});
 const rows=Object.entries(by).map(([pid,list])=>({pid,p:prod(pid),list,m:list.reduce((a,u)=>a+(+u.metros||0),0)})).sort((a,b)=>String(a.p.nome||'').localeCompare(String(b.p.nome||'')));
 if(!rows.length)return '<div class="sub">Nenhum rolo de cabo aqui.</div>';
 const totM=rows.reduce((a,r)=>a+r.m,0);
 return `<div class="tblwrap"><table class="tbl no-filter" id="v141-${key}"><thead><tr><th>Cabo</th><th>Marca</th><th class="text-end">Rolos</th><th class="text-end">Metros</th></tr></thead><tbody>${rows.map((r,i)=>`<tr style="cursor:pointer" onclick="const d=document.getElementById('v141-${key}-${i}');d.style.display=d.style.display==='none'?'':'none'"><td><b>${E(r.p.nome||r.pid)}</b> <span class="sub">▸ ver rolos</span></td><td>${E(r.p.marca||'')}</td><td class="text-end"><b>${nBR(r.list.length)}</b></td><td class="text-end">${nBR(r.m)} m</td></tr><tr id="v141-${key}-${i}" style="display:none"><td colspan="4" style="background:rgba(127,127,127,.04)">${r.list.map(u=>`<div class="d-flex justify-content-between" style="font-size:12.5px"><span class="mono">${E(u.serie)}</span><span class="sub">${E(T_(()=>L.path(u.loc_id).map(x=>x.nome).join(' › '),u.local||''))}</span><span>${nBR(u.metros)} m</span></div>`).join('')}</td></tr>`).join('')}<tr style="font-weight:700"><td colspan="2">${nBR(rows.length)} cabos</td><td class="text-end">${nBR(us.length)}</td><td class="text-end">${nBR(totM)} m</td></tr></tbody></table></div>`}
window.V141_lista=listaRolos;
SCREENS.rolos=function(){const raw=decodeURIComponent(location.hash.replace(/^#\/?rolos\/?/,''));const todos=!raw||raw==='todos';const lug=todos?null:T_(()=>L.get(raw),null);
 const us=rolosDe(todos?null:raw);const nome=todos?'Todos os inventários':T_(()=>L.path(raw).map(x=>x.nome).join(' › '),lug?lug.nome:raw);
 return `<div class="sub mb-2" style="font-size:13px"><a href="#/estoque">Estoque</a> › ${E(nome)} › Rolos de cabo</div>`+T_(()=>head('Rolos de cabo · '+E(nome),`${nBR(us.length)} rolos. Cabo é medido em metros: cada rolo conta 1 na tabela do Estoque. Toque num cabo para ver cada rolo.`),'<h1 class="h1">Rolos de cabo</h1>')+`<div class="card p-3">${listaRolos(us,'pg')}</div><div class="sub mt-2" style="font-size:12px">Para usar metros de um rolo: <a href="#/cortarrolo">Cortar Rolo</a>.</div>`};
T_(()=>{SEC_OF.rolos='est';LABEL.rolos='Estoque · rolos de cabo';if(typeof OWNER==='object')OWNER.rolos='est'});

/* §2 lista de rolos abaixo de "Todos os produtos no inventário" */
T_(()=>{const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);try{const k=T_(()=>route().k,'');if(k!=='estoque')return r;const m=document.getElementById('main');if(!m||m.querySelector('#v141-est'))return r;const us=rolosDe(null);if(!us.length)return r;
  const d=document.createElement('div');d.className='card p-3 mt-3';d.id='v141-est-card';d.innerHTML=`<div class="sub mb-2" style="font-size:12px;letter-spacing:.06em">ROLOS DE CABO · MEDIDOS EM METROS · ${E(T_(()=>INVS().join(' + '),''))}</div>`+listaRolos(us,'est');m.appendChild(d)}catch(e){console.error('v141 lista',e)}return r}});

/* §1b Painel Geral e páginas de lugar: a mesma conta escrita (peças + rolos = total), rolos clicáveis já filtrados */
const ponte=(p,r,id,extra)=>`<div class="card p-2 px-3 mb-3" data-v141="ponte" style="display:block;font-size:13px;border-left:4px solid #fd7e14"><span style="display:inline"><b style="display:inline">${nBR(p)}</b> peças + <a style="display:inline" href="#/rolos/${encodeURIComponent(id==null?'todos':id)}"><b style="display:inline">${nBR(r)} rolos de cabo</b></a> = <b style="display:inline">${nBR(p+r)} unidades</b> <span class="sub" style="display:inline">· cabo é medido em metros; cada rolo conta 1</span></span>${extra||''}</div>`;
function nodeDoHash(){const parts=location.hash.replace(/^#\/?lugar\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);if(!parts.length)return null;
 const inv=T_(()=>invNode(parts[0]),null);if(!inv)return null;if(parts.length===1)return inv.id;const n=T_(()=>L.byPath.apply(L,[inv.nome].concat(parts.slice(1))),null);return n?n.id:null}
T_(()=>{const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);try{const k=T_(()=>route().k,'');const m=document.getElementById('main');if(!m||m.querySelector('[data-v141="ponte"]'))return r;
  if(k==='epainel'){const ro=rolosDe(null).length;if(!ro)return r;const p=T_(()=>nodeStats(null).total,0);
    const por=T_(()=>INVS(),[]).map(i=>{const id=invNode(i).id;return `Inventário ${i}: ${nBR(nodeStats(id).total)} + <a href="#/rolos/${encodeURIComponent(id)}">${nBR(rolosDe(id).length)}</a> = ${nBR(nodeStats(id).total+rolosDe(id).length)}`}).join(' · ');
    const d=document.createElement('div');d.innerHTML=ponte(p,ro,null)+'';const c=d.firstChild;c.insertAdjacentHTML('beforeend',`<div class="sub" style="display:block;font-size:12px">${por}</div>`);
    const h1=m.querySelector('h1,h4,h5');const anchor=h1?(h1.closest('.d-flex')||h1):null;if(anchor&&anchor.parentNode===m)anchor.after(c);else m.prepend(c)}
  else if(k==='lugar'){const id=nodeDoHash();if(!id)return r;const ro=rolosDe(id).length;if(!ro)return r;const p=T_(()=>nodeStats(id).total,0);
    const d=document.createElement('div');d.innerHTML=ponte(p,ro,id);const c=d.firstChild;const alvo=[...m.querySelectorAll('div,span')].find(x=>/unidade\(s\) aqui/.test(x.textContent)&&x.children.length===0);
    const card=alvo&&alvo.closest('.card');let top=alvo;while(top&&card&&top.parentElement!==card)top=top.parentElement;if(top&&card)top.after(c);else if(alvo)alvo.after(c);else m.prepend(c)}
 }catch(e){console.error('v141 ponte',e)}return r}});

function boot(){corrigeMetros();T_(()=>{const k=route().k;if(k==='estoque'||k==='rolos')renderMain()})}
boot();document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));setTimeout(boot,1500);
})();
