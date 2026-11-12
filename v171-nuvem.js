/* v171 — A NUVEM DO CRM (Bruno, 09-Nov-2026)
   Problema: a base do protótipo vive dentro do navegador de cada pessoa (IndexedDB). Um contato que o Tito cadastra
   no computador dele nunca chega ao Mac do Bruno — não há banco de dados atrás do link.
   Esta camada liga o CRM (parceiros, contatos, interações, próximas ações, justificativas, decisões, configurações…)
   a um banco compartilhado no Supabase (Postgres), REGISTRO A REGISTRO:
     · cada gravação que passa pelo servidor do CRM (CRM_SERVER.api) é comparada antes/depois e o que mudou sobe
       para a tabela crm_registros (tabela, id, dados, apagado, atualizado_em, por);
     · ao abrir, a nuvem é lida e aplicada por cima da cópia local (nuvem ganha); o que só existe aqui e é trabalho de
       gente (contato, interação, ação, parceiro…) sobe para a nuvem — nada se perde;
     · mudanças de colegas chegam em tempo real (Supabase Realtime) e, como rede de segurança, por sondagem a cada 30 s;
       o painel do CRM é recarregado sem perder a tela (systaagReload) quando não há formulário aberto;
     · sem internet, as gravações ficam numa fila local (systaag_nuvem_fila, no IndexedDB via v169) e sobem ao voltar;
     · novos ids são únicos por tempo (ms × 1000 + aleatório), para dois computadores nunca criarem o mesmo id.
   A única coisa a configurar é NUVEM.url + NUVEM.key (chave anon pública do projeto). Sem elas, nada muda. */
(function(){'use strict';
if(window.__v171)return;window.__v171=true;
/* 12/11/2026: no Modo treino (Aprender fazendo) a nuvem fica DESLIGADA — o treino nunca lê a base real da nuvem nem envia nada para ela */
if(window.__TREINO){console.info('v171: modo treino — nuvem desligada');return}
var CFG=window.NUVEM_CONFIG||{url:'',key:''};
if(!CFG.url||!CFG.key){console.warn('v171: nuvem não configurada (NUVEM_CONFIG) — CRM continua só local');return}
if(typeof CRM_SERVER==='undefined'||!CRM_SERVER||typeof CRM_SERVER.api!=='function'){console.error('v171: CRM_SERVER ausente');return}

var TAB='crm_registros';
var T_CRM=['usuarios','responsaveis','depara','contatos','interacoes','tarefas','justificativas','decisoes','snapshots','config','listas','log','esteira'];
var T_GENTE={parceiros:1,contatos:1,interacoes:1,tarefas:1,justificativas:1,decisoes:1,esteira:1};   /* o que só existe local e é trabalho de gente sobe */
var TODAS=['parceiros'].concat(T_CRM);
var FILA_KEY='systaag_nuvem_fila', META_KEY='systaag_nuvem_meta';
var CLI=(function(){try{var k='systaag_nuvem_cli',v=localStorage.getItem(k);if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(k,v)}return v}catch(e){return 'x'+Date.now()}})();
var aplicando=false, online=true, ultimo=null, ultimoErro='', since=null;
var H={'apikey':CFG.key,'Authorization':'Bearer '+CFG.key,'Content-Type':'application/json'};

function quem(){try{return (window.S&&S.user)||localStorage.getItem('systaag_quem')||''}catch(e){return ''}}
function api(o){return JSON.parse(CRM_SERVER.api(JSON.stringify(o)))}
function meta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')}catch(e){return {}}}
function setMeta(m){try{localStorage.setItem(META_KEY,JSON.stringify(m))}catch(e){}}

/* ───── leitura local: uma foto de todas as tabelas sincronizadas (id → texto do registro) ───── */
function linhasParceiros(){try{var r=api({action:'loadAll'});return (r.tables&&r.tables.parceiros)||[]}catch(e){return []}}
function foto(){var F={};TODAS.forEach(function(t){F[t]=new Map()});
  linhasParceiros().forEach(function(r){F.parceiros.set(String(r.id),JSON.stringify(r))});
  var CT=window.CRM_T||{};T_CRM.forEach(function(t){(CT[t]||[]).forEach(function(r){if(r&&r.id!==undefined&&r.id!=='')F[t].set(String(r.id),JSON.stringify(r))})});
  return F}
function diff(a,b){var out=[];TODAS.forEach(function(t){b[t].forEach(function(v,id){if(a[t].get(id)!==v)out.push({tabela:t,id:id,dados:JSON.parse(v),apagado:false})});a[t].forEach(function(v,id){if(!b[t].has(id))out.push({tabela:t,id:id,dados:JSON.parse(v),apagado:true})})});return out}

/* ───── fila de saída (sobrevive a fechar a aba; v169 leva para o IndexedDB) ───── */
function fila(){try{return JSON.parse(localStorage.getItem(FILA_KEY)||'[]')}catch(e){return []}}
function setFila(f){try{localStorage.setItem(FILA_KEY,JSON.stringify(f))}catch(e){}}
function enfileira(regs){if(!regs.length)return;var f=fila(),agora=new Date().toISOString(),por=quem();regs.forEach(function(r){r.atualizado_em=agora;r.por=por;r.origem=CLI;var i=f.findIndex(function(x){return x.tabela===r.tabela&&x.id===r.id});if(i>=0)f[i]=r;else f.push(r)});setFila(f);enviar()}
var enviando=false;
function enviar(){if(enviando)return;var f=fila();if(!f.length){pinta();return}enviando=true;var lote=f.slice(0,200);
  fetch(CFG.url+'/rest/v1/'+TAB+'?on_conflict=tabela,id',{method:'POST',headers:Object.assign({'Prefer':'resolution=merge-duplicates,return=minimal'},H),body:JSON.stringify(lote)})
  .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(r.status+' '+t.slice(0,200))});var rest=fila().filter(function(x){return !lote.some(function(l){return l.tabela===x.tabela&&l.id===x.id&&l.atualizado_em===x.atualizado_em})});setFila(rest);online=true;ultimoErro='';ultimo=new Date();enviando=false;if(rest.length)enviar();else pinta()})
  .catch(function(e){enviando=false;online=false;ultimoErro=String(e.message||e);console.warn('v171 enviar',e);pinta();setTimeout(enviar,15000)})}

/* ───── gancho de saída: toda ação de escrita do CRM é comparada antes/depois ───── */
var LEITURA={ping:1,whoami:1,loadAll:1,seed:1,gatilhoSemanal:1};
var api0=CRM_SERVER.api;
CRM_SERVER.api=function(payload){var req=null;try{req=JSON.parse(payload||'{}')}catch(e){}
  if(!req||LEITURA[req.action]||aplicando)return api0.apply(this,arguments);
  /* ids novos únicos no mundo (dois computadores nunca criam o mesmo) */
  try{var novoId=function(row){if(row)row.id=Date.now()*1000+Math.floor(Math.random()*1000)};/* sempre: o CRM pré-calcula max+1, que colide entre computadores */
    if(req.action==='insert')novoId(req.row);if(req.action==='batch')(req.ops||[]).forEach(function(o){if(o.op!=='update')novoId(o.row)});payload=JSON.stringify(req)}catch(e){}
  var antes=foto();var r=api0.call(this,payload);
  try{var d=diff(antes,foto());if(d.length)enfileira(d)}catch(e){console.error('v171 diff',e)}/* compara sempre: mesmo quando o servidor devolve erro, o que mudou na memória tem de subir */
  return r};

/* ───── entrada: aplicar registros da nuvem por cima da cópia local ───── */
function aplicar(regs){if(!regs.length)return 0;aplicando=true;var n=0;var ops=[];var CT=window.CRM_T||(window.CRM_T={});
  try{regs.forEach(function(r){var t=r.tabela,id=String(r.id),d=r.dados||{};if(TODAS.indexOf(t)<0)return;
    if(t==='parceiros'){if(r.apagado){try{api({action:'deleteRow',table:'parceiros',id:+id})}catch(e){}}else{d.id=+id;ops.push({table:'parceiros',op:'update',row:d})}n++;return}
    var arr=CT[t]||(CT[t]=[]);var i=arr.findIndex(function(x){return String(x.id)===id});
    if(r.apagado){if(i>=0){arr.splice(i,1);n++}}else{d.id=isNaN(+id)?id:+id;if(i>=0){if(JSON.stringify(arr[i])!==JSON.stringify(d)){arr[i]=d;n++}}else{arr.push(d);n++}}});
    if(ops.length){try{api({action:'batch',ops:ops})}catch(e){console.error('v171 parceiros',e)}}
    if(n){try{window.CRM_persistT&&CRM_persistT()}catch(e){}}
  }finally{aplicando=false}
  if(n)recarregaPainel();return n}
var _tRel=0;
function recarregaPainel(){clearTimeout(_tRel);_tRel=setTimeout(function(){try{var f=document.getElementById('crmFrame');var w=f&&f.contentWindow;if(!w||!w.systaagReload||!w.systaagReady||!w.systaagReady())return;
  var aberto=w.document.querySelector('.modal,.modal-bg,[role=dialog]');if(aberto&&aberto.offsetParent){_tRel=setTimeout(recarregaPainel,3000);return}
  w.systaagReload()}catch(e){}try{if(typeof renderNav==='function')renderNav()}catch(e){}},800)}

function lerNuvem(desde){var out=[],off=0,lim=1000;function pg(){var q=CFG.url+'/rest/v1/'+TAB+'?select=*&tabela=not.like.base:*&order=atualizado_em.asc,tabela.asc,id.asc&offset='+off+'&limit='+lim+(desde?'&atualizado_em=gte.'+encodeURIComponent(new Date(Date.parse(desde)-5000).toISOString()):'');
  return fetch(q,{headers:H}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(r.status+' '+t.slice(0,200))});return r.json()}).then(function(j){out=out.concat(j);if(j.length===lim){off+=lim;return pg()}return out})}return pg()}

function sincroniza(primeira){return lerNuvem(primeira?null:since).then(function(regs){online=true;ultimoErro='';
  if(regs.length)since=regs[regs.length-1].atualizado_em;
  var meus=regs.filter(function(r){return r.origem!==CLI||primeira});
  var n=aplicar(meus);
  if(primeira){var m=meta();
    if(!regs.length){/* nuvem vazia: esta cópia local é a semente */var F=foto(),tudo=[];TODAS.forEach(function(t){F[t].forEach(function(v,id){tudo.push({tabela:t,id:id,dados:JSON.parse(v),apagado:false})})});console.info('v171: nuvem vazia — semeando com '+tudo.length+' registros locais');enfileira(tudo)}
    else{/* o que só existe aqui e é trabalho de gente sobe (nunca se perde) */var ids={};regs.forEach(function(r){ids[r.tabela+'|'+r.id]=1});var F2=foto(),sobe=[];TODAS.forEach(function(t){if(!T_GENTE[t])return;F2[t].forEach(function(v,id){if(!ids[t+'|'+id])sobe.push({tabela:t,id:id,dados:JSON.parse(v),apagado:false})})});if(sobe.length){console.info('v171: '+sobe.length+' registro(s) só locais sobem para a nuvem');enfileira(sobe)}}
    m.primeira=m.primeira||new Date().toISOString();setMeta(m)}
  ultimo=new Date();pinta();enviar();return n}).catch(function(e){online=false;ultimoErro=String(e.message||e);console.warn('v171 sincronizar',e);pinta()})}

/* ───── tempo real (supabase-js, se carregar) + sondagem de segurança ───── */
function tempoReal(){try{var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';s.onload=function(){try{var c=window.supabase.createClient(CFG.url,CFG.key);c.channel('crm_registros').on('postgres_changes',{event:'*',schema:'public',table:TAB},function(p){var r=p.new;if(!r||!r.tabela)return;if(r.origem===CLI)return;aplicar([r]);since=since&&since>r.atualizado_em?since:r.atualizado_em;ultimo=new Date();pinta()}).subscribe(function(st){window.__v171rt=st})}catch(e){console.warn('v171 realtime',e)}};s.onerror=function(){console.warn('v171: supabase-js não carregou — só sondagem')};document.head.appendChild(s)}catch(e){}}

/* ───── a etiqueta: o estado da nuvem, visível sobre o CRM ───── */
var CHIP=null;
function pinta(){try{var host=document.getElementById('crmHost');if(!host){if(CHIP)CHIP.style.display='none';return}
  if(!CHIP){CHIP=document.createElement('div');CHIP.id='nuvemChip';CHIP.style.cssText='position:fixed;right:190px;bottom:18px;z-index:60;font:600 12px/1.2 system-ui,-apple-system,sans-serif;padding:8px 12px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.12);cursor:default;user-select:none';document.body.appendChild(CHIP)}
  CHIP.style.display='';var f=fila().length,h=ultimo?ultimo.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—';
  if(!online){CHIP.style.background='#fff4e5';CHIP.style.color='#8a4b00';CHIP.textContent='☁ Sem ligação à nuvem — gravando aqui, envia ao voltar'+(f?' ('+f+' pendente'+(f>1?'s':'')+')':'');CHIP.title=ultimoErro}
  else if(f){CHIP.style.background='#e8f1ff';CHIP.style.color='#0b4fa3';CHIP.textContent='☁ Enviando '+f+' registro'+(f>1?'s':'')+'…';CHIP.title=''}
  else{CHIP.style.background='#e6f6ec';CHIP.style.color='#116633';CHIP.textContent='☁ Nuvem · todos veem o mesmo · '+h;CHIP.title='Supabase · '+CFG.url.replace(/^https?:\/\//,'')+(window.__v171rt?' · tempo real: '+window.__v171rt:'')}}catch(e){}}
setInterval(pinta,5000);window.addEventListener('hashchange',function(){setTimeout(pinta,50)});
window.addEventListener('online',function(){enviar();sincroniza(false)});

/* ───── arranque ───── */
window.NUVEM={sincronizar:function(){return sincroniza(false)},fila:fila,estado:function(){return {online:online,ultimo:ultimo,fila:fila().length,since:since,cli:CLI,erro:ultimoErro}}};
sincroniza(true).then(function(){window.__v171pronto=true;try{window.dispatchEvent(new Event('v171-pronta'))}catch(e){}/* 12/11/2026 (v181): aviso de que a primeira leitura da nuvem do CRM acabou */tempoReal();setInterval(function(){sincroniza(false)},30000)});
})();
