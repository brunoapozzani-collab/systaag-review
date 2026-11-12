/* v172 — A NUVEM DA BASE INTEIRA (Bruno, 09-Nov-2026) — fase 2 da v171
   A v171 pôs o CRM numa nuvem compartilhada. Esta camada faz o mesmo com a Base inteira (S.db): obras, propostas, clientes,
   produtos, unidades, negociações, atividades, atendimentos, pessoas, configurações… — REGISTRO A REGISTRO, para dois
   computadores poderem trabalhar ao mesmo tempo sem um apagar o trabalho do outro.
   Como funciona:
     · ponto único: toda gravação real da base (a chave systaag_erp1z, que a v169 leva ao IndexedDB) é comparada com a
       última foto; só os registros que mudaram sobem (tabela + id); registros removidos sobem como "apagado";
       objetos simples da base (params, listas, regras…) sobem como um registro só da tabela "_k";
     · a nuvem é a verdade: ao abrir, os registros da nuvem são aplicados por cima da cópia local; numa tabela que a nuvem
       já tem, o que só existe local é deixado de lado (cópias velhas de outros computadores não voltam a poluir a base);
     · a PRIMEIRA carga (nuvem vazia) só acontece a partir do computador do Bruno — a cópia dele é a base real;
     · mudanças de colegas chegam em tempo real (aviso do Supabase → busca do que mudou) e por sondagem a cada 30 s;
       a tela é redesenhada quando não há formulário aberto;
     · o treino (Aprender fazendo) grava em treino:systaag_* — nunca passa por aqui; sem internet, fila local, sobe ao voltar.
   Mesma tabela da v171 (crm_registros), com as tabelas da base prefixadas "base:". */
(function(){'use strict';
if(window.__v172)return;window.__v172=true;
/* 12/11/2026: no Modo treino (Aprender fazendo) a nuvem fica DESLIGADA — o treino nunca lê a base real da nuvem nem envia nada para ela */
if(window.__TREINO){console.info('v172: modo treino — nuvem desligada');return}
var CFG=window.NUVEM_CONFIG||{url:'',key:''};
if(!CFG.url||!CFG.key){console.warn('v172: nuvem não configurada');return}
if(typeof S==='undefined'||!S||!S.db){console.error('v172: S.db ausente');return}

var TAB='crm_registros', PRE='base:', KEYDB='systaag_erp1z', SEMENTE_DE='bruno.pozzani';
var FILA_KEY='systaag_nuvem_base_fila', META_KEY='systaag_nuvem_base_meta';
var H={'apikey':CFG.key,'Authorization':'Bearer '+CFG.key,'Content-Type':'application/json'};
var CLI=(function(){try{var k='systaag_nuvem_cli',v=localStorage.getItem(k);if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(k,v)}return v}catch(e){return 'x'+Date.now()}})();
var aplicando=false, online=true, ultimo=null, ultimoErro='', pronto=false, desvio=0 /* relógio do servidor − relógio local, ms */;
function quem(){try{return (window.S&&S.user)||localStorage.getItem('systaag_quem')||''}catch(e){return ''}}
function meta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')}catch(e){return {}}}
function setMeta(m){try{localStorage.setItem(META_KEY,JSON.stringify(m))}catch(e){}}
function agoraServidor(){return new Date(Date.now()+desvio).toISOString()}

/* ───── a foto da base: tabela → (id → texto) ───── */
var ANT={};            /* última foto por tabela: {txt: JSON da tabela inteira, map: Map(id→json)} */
function comId(arr){return Array.isArray(arr)&&arr.length>0&&arr.every(function(x){return x&&typeof x==='object'&&x.id!==undefined&&x.id!==null&&x.id!==''})}
function mapa(k,v){var m=new Map();if(comId(v)){v.forEach(function(r){m.set(String(r.id),JSON.stringify(r))})}else if(v!==undefined){m.set(k,JSON.stringify({v:v}))}return m}
function tabelaDe(k,v){return comId(v)?k:'_k'}
/* compara a base atual com a última foto; devolve registros que mudaram; actualiza a foto */
function comparar(){var out=[];var db=S.db;var vistos={};
  Object.keys(db).forEach(function(k){var v=db[k];var txt;try{txt=JSON.stringify(v)}catch(e){return}if(txt===undefined)return;vistos[k]=1;
    var a=ANT[k];if(a&&a.txt===txt)return;
    var m=mapa(k,v),t=tabelaDe(k,v);
    if(a&&a.t!==t){/* a tabela mudou de forma (lista com ids ↔ objeto): tudo o que estava sobe como apagado e o novo como vivo */a.map.forEach(function(j,id){out.push({tabela:a.t==='_k'?'_k':a.t,id:id,dados:JSON.parse(j),apagado:true})});a=null}
    m.forEach(function(j,id){if(!a||a.map.get(id)!==j)out.push({tabela:t,id:id,dados:JSON.parse(j),apagado:false})});
    if(a)a.map.forEach(function(j,id){if(!m.has(id))out.push({tabela:t,id:id,dados:JSON.parse(j),apagado:true})});
    ANT[k]={txt:txt,map:m,t:t}});
  Object.keys(ANT).forEach(function(k){if(!vistos[k]){ANT[k].map.forEach(function(j,id){out.push({tabela:ANT[k].t,id:id,dados:JSON.parse(j),apagado:true})});delete ANT[k]}});
  return out}
function fotoInicial(){ANT={};Object.keys(S.db).forEach(function(k){var v=S.db[k];var txt;try{txt=JSON.stringify(v)}catch(e){return}if(txt===undefined)return;ANT[k]={txt:txt,map:mapa(k,v),t:tabelaDe(k,v)}})}
function tudoLocal(){var out=[];Object.keys(ANT).forEach(function(k){ANT[k].map.forEach(function(j,id){out.push({tabela:ANT[k].t,id:id,dados:JSON.parse(j),apagado:false})})});return out}

/* ───── fila de saída ───── */
var FILA=null,_tF=0;
function fila(){if(!FILA){try{FILA=JSON.parse(localStorage.getItem(FILA_KEY)||'[]')}catch(e){FILA=[]}}return FILA}
function persiste(){clearTimeout(_tF);_tF=0;try{localStorage.setItem(FILA_KEY,JSON.stringify(FILA||[]))}catch(e){console.error('v172 fila',e)}}
/* a fila vive em memória e é gravada no máximo de 1,5 em 1,5 s (a semente são milhares de registros; reenviar é inofensivo) */
function setFila(f){FILA=f;if(!_tF)_tF=setTimeout(persiste,1500)}
['pagehide','beforeunload'].forEach(function(ev){window.addEventListener(ev,function(){if(_tF)persiste()},{capture:true})});
var seq=0;
function enfileira(regs){if(!regs.length)return;var f=fila(),por=quem();regs.forEach(function(r){r.tabela=PRE+r.tabela;r.atualizado_em=agoraServidor();r.por=por;r.origem=CLI;r._s=++seq;var i=f.findIndex(function(x){return x.tabela===r.tabela&&x.id===r.id});if(i>=0)f[i]=r;else f.push(r)});setFila(f);enviar()}
var enviando=false;
function enviar(){if(enviando)return;var f=fila();if(!f.length){pinta();return}enviando=true;var lote=f.slice(0,150);var corpo=lote.map(function(r){var o={};Object.keys(r).forEach(function(k){if(k!=='_s')o[k]=r[k]});return o});
  fetch(CFG.url+'/rest/v1/'+TAB+'?on_conflict=tabela,id',{method:'POST',headers:Object.assign({'Prefer':'resolution=merge-duplicates,return=minimal'},H),body:JSON.stringify(corpo)})
  .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(r.status+' '+t.slice(0,200))});var ids={};lote.forEach(function(l){ids[l.tabela+'|'+l.id+'|'+l._s]=1});var rest=fila().filter(function(x){return !ids[x.tabela+'|'+x.id+'|'+x._s]});setFila(rest);online=true;ultimoErro='';ultimo=new Date();enviando=false;if(rest.length)enviar();else pinta()})
  .catch(function(e){enviando=false;online=false;ultimoErro=String(e.message||e);console.warn('v172 enviar',e);pinta();setTimeout(enviar,15000)})}

/* ───── gancho de saída: a gravação real da base ───── */
(function(){var sp=Storage.prototype,set0=sp.setItem;
  sp.setItem=function(k,v){var r=set0.apply(this,arguments);try{if(this===window.localStorage&&String(k)===KEYDB&&pronto){var d=comparar();if(!aplicando&&d.length)enfileira(d)}}catch(e){console.error('v172 comparar',e)}return r}})();

/* ───── entrada ───── */
function lerNuvem(desde){var out=[],off=0,lim=1000;function pg(){var q=CFG.url+'/rest/v1/'+TAB+'?select=*&tabela=like.'+encodeURIComponent(PRE+'*')+'&order=atualizado_em.asc,tabela.asc,id.asc&offset='+off+'&limit='+lim+(desde?'&atualizado_em=gte.'+encodeURIComponent(desde):'');
  return fetch(q,{headers:H}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(r.status+' '+t.slice(0,200))});var dh=r.headers.get('date');if(dh){var ms=Date.parse(dh);if(ms)desvio=ms-Date.now()}return r.json()}).then(function(j){out=out.concat(j);if(j.length===lim){off+=lim;return pg()}return out})}return pg()}
function aplicar(regs,primeira){if(!regs.length)return 0;var db=S.db,n=0;var tabelasNuvem={};
  regs.forEach(function(r){var t=r.tabela.slice(PRE.length),id=String(r.id),d=r.dados;
    if(t==='_k'){if(r.apagado){if(id in db){delete db[id];n++}}else{var nv=d&&d.v;var txt=JSON.stringify(nv);if(JSON.stringify(db[id])!==txt){db[id]=nv;n++}}return}
    tabelasNuvem[t]=tabelasNuvem[t]||{};tabelasNuvem[t][id]=1;
    var arr=db[t];if(!Array.isArray(arr)){if(r.apagado)return;arr=db[t]=[]}
    var i=-1;for(var q=0;q<arr.length;q++){if(arr[q]&&String(arr[q].id)===id){i=q;break}}
    if(r.apagado){if(i>=0){arr.splice(i,1);n++}}else{var j=JSON.stringify(d);if(i>=0){if(JSON.stringify(arr[i])!==j){arr[i]=d;n++}}else{arr.push(d);n++}}});
  if(primeira){/* nuvem é a verdade: numa tabela que a nuvem tem, o que só existe aqui sai */Object.keys(tabelasNuvem).forEach(function(t){var arr=db[t];if(!Array.isArray(arr))return;var antes=arr.length;db[t]=arr.filter(function(x){return x&&tabelasNuvem[t][String(x.id)]});n+=antes-db[t].length})}
  return n}
var _tR=0;
function redesenha(){clearTimeout(_tR);_tR=setTimeout(function(){try{var aberto=document.querySelector('.modal.show,.modal[style*="display: block"],dialog[open],#qv');if(aberto){_tR=setTimeout(redesenha,4000);return}if(typeof window.render==='function')window.render();var f=document.getElementById('crmFrame');if(f&&f.contentWindow&&f.contentWindow.systaagReload&&f.contentWindow.systaagReady&&f.contentWindow.systaagReady())f.contentWindow.systaagReload()}catch(e){console.error('v172 redesenha',e)}},900)}
var sincronizando=null;
function sincroniza(primeira){if(sincronizando)return sincronizando;var m=meta();var desde=primeira?null:m.desde;if(desde){var d=new Date(Date.parse(desde)-5000);desde=isNaN(d)?null:d.toISOString()}
  sincronizando=lerNuvem(desde).then(function(regs){online=true;ultimoErro='';
    var ult=regs.length?regs[regs.length-1].atualizado_em:null;
    var alheios=regs.filter(function(r){return primeira||r.origem!==CLI});
    var n=0;
    if(primeira&&!regs.length){
      if(quem()===SEMENTE_DE){var tudo=tudoLocal();console.info('v172: nuvem vazia — semeando a Base com '+tudo.length+' registros a partir deste computador ('+SEMENTE_DE+')');enfileira(tudo);m.semeou=new Date().toISOString()}
      else{console.info('v172: nuvem vazia e este não é o computador do Bruno — a Base fica local até a primeira carga');aguardando=true}}
    else if(alheios.length){aplicando=true;try{n=aplicar(alheios,primeira)}finally{aplicando=false}
      if(n){try{if(window.save&&window.save.agora){window.save();window.save.agora()}else if(window.save)window.save()}catch(e){console.error('v172 save',e)}fotoInicial();redesenha()}}
    if(primeira)fotoInicial();
    if(ult)m.desde=ult;setMeta(m);ultimo=new Date();pinta();enviar();return n})
  .catch(function(e){online=false;ultimoErro=String(e.message||e);console.warn('v172 sincronizar',e);pinta()}).then(function(x){sincronizando=null;return x});
  return sincronizando}
var aguardando=false;

/* ───── tempo real = aviso; a busca do que mudou é sempre pela sondagem (gte desde) ───── */
var _tN=0;
function aviso(){clearTimeout(_tN);_tN=setTimeout(function(){sincroniza(false)},700)}
function tempoReal(){function liga(){try{var c=window.supabase.createClient(CFG.url,CFG.key);c.channel('base_registros').on('postgres_changes',{event:'*',schema:'public',table:TAB},function(p){var r=p.new;if(!r||!r.tabela||r.tabela.indexOf(PRE)!==0)return;if(r.origem===CLI)return;aviso()}).subscribe(function(st){window.__v172rt=st})}catch(e){console.warn('v172 realtime',e)}}
  if(window.supabase)return liga();var tent=0;var t=setInterval(function(){if(window.supabase){clearInterval(t);liga()}else if(++tent>40)clearInterval(t)},500)}

/* ───── a etiqueta (partilhada com a v171: a mesma pastilha mostra os dois) ───── */
var CHIP=null;
function pinta(){try{if(!CHIP){CHIP=document.createElement('div');CHIP.id='nuvemBaseChip';CHIP.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:60;font:600 11.5px/1.2 system-ui,-apple-system,sans-serif;padding:6px 11px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.10);cursor:default;user-select:none;opacity:.92';document.body.appendChild(CHIP)}
  var f=fila().length,h=ultimo?ultimo.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—';
  if(aguardando){CHIP.style.background='#fff4e5';CHIP.style.color='#8a4b00';CHIP.textContent='☁ Base: aguardando a primeira carga (computador do Bruno)';CHIP.title=''}
  else if(!online){CHIP.style.background='#fff4e5';CHIP.style.color='#8a4b00';CHIP.textContent='☁ Base sem ligação à nuvem — gravando aqui'+(f?' · '+f+' pendente'+(f>1?'s':''):'');CHIP.title=ultimoErro}
  else if(f){CHIP.style.background='#e8f1ff';CHIP.style.color='#0b4fa3';CHIP.textContent='☁ Base: enviando '+f.toLocaleString('pt-BR')+' registro'+(f>1?'s':'')+'…';CHIP.title=''}
  else{CHIP.style.background='#e6f6ec';CHIP.style.color='#116633';CHIP.textContent='☁ Base compartilhada · todos veem o mesmo · '+h;CHIP.title='Supabase · tempo real: '+(window.__v172rt||'—')}}catch(e){}}
setInterval(pinta,5000);window.addEventListener('online',function(){enviar();sincroniza(false)});

/* ───── arranque: depois de a página abrir (todas as camadas já correram) ───── */
window.NUVEM_BASE={sincronizar:function(){return sincroniza(false)},fila:fila,estado:function(){return {online:online,ultimo:ultimo,fila:fila().length,desde:meta().desde,cli:CLI,erro:ultimoErro,aguardando:aguardando,rt:window.__v172rt}},foto:function(){var n=0;Object.keys(ANT).forEach(function(k){n+=ANT[k].map.size});return n}};
function arranca(){fotoInicial();sincroniza(true).then(function(){pronto=true;window.__v172pronto=true;try{window.dispatchEvent(new Event('v172-pronta'))}catch(e){}/* 12/11/2026 (v180): aviso de que a primeira leitura da nuvem acabou — cargas únicas esperam por ele */ /* só depois da primeira leitura da nuvem é que as gravações locais passam a subir */tempoReal();setInterval(function(){sincroniza(false)},30000)})}
if(document.readyState==='complete')setTimeout(arranca,1500);else window.addEventListener('load',function(){setTimeout(arranca,1500)});
})();
