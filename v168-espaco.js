/* v168 — ESPAÇO NO NAVEGADOR (Bruno, 08-Nov-2026)
   O erro "Não deu para abrir o modo treino: … exceeded the quota": o navegador dá ~10 MB ao localStorage e o SYSTAAG
   estava com 9,8 MB — a base real tem 2 MB; o resto eram as cópias de segurança da Zona de risco (3 × até 2,5 MB) e um
   backup antigo de 01/11 (systaag_*__bak20261101). Entrar no treino copia a base (mais 2 MB) → não cabia.
   O que muda:
   1. As cópias de segurança (systaag_snap_*) e os backups (*__bak*) saem do localStorage e passam a viver no IndexedDB
      ("arquivo" — centenas de MB, sem brigar com a base). Nada é apagado: a lista da Zona de risco continua mostrando
      todas, com Restaurar e Apagar. A mudança acontece sozinha ao abrir a página.
   2. Entrar no treino copia só o que o treino usa (base, CRM, zero, guia, quem) — nunca backups nem cópias — e, se mesmo
      assim não couber, desfaz a cópia pela metade e diz em português o que fazer, em vez do texto técnico vermelho.
   3. A Zona de risco mostra o espaço do navegador (X de 10 MB) para ninguém ser pego de surpresa de novo. */
(function(){
'use strict';
if(window.__v168)return;window.__v168=true;
var RAW=window.__TREINO_RAW,ON=!!window.__TREINO,P='treino:',F='systaag_treino_on';
if(!RAW){console.error('v168: shim do modo treino não carregou');return}
var E=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function tst(m,bad){try{toast(m,bad)}catch(e){console.log(m)}}
var MB=function(ch){return (ch*2/1048576)};                        /* localStorage conta em UTF-16: 2 bytes por caractere */
var fmt=function(x){return x.toFixed(x<10?2:1).replace('.',',')+' MB'};
var ARQ=/^(treino:)?systaag_snap_\d+$|__bak\d*$/;                   /* o que vai para o arquivo */
var SNAP='systaag_snap_';

/* ───── IndexedDB: o "arquivo" ───── */
var DB=null;
function abre(){return new Promise(function(ok,ko){if(DB)return ok(DB);if(!window.indexedDB)return ko(new Error('sem IndexedDB'));
  var r=indexedDB.open('systaag_arquivo',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};
  r.onsuccess=function(){DB=r.result;ok(DB)};r.onerror=function(){ko(r.error||new Error('IndexedDB'))}})}
function put(k,v){return abre().then(function(db){return new Promise(function(ok,ko){var t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=function(){ok()};t.onerror=function(){ko(t.error)}})})}
function get(k){return abre().then(function(db){return new Promise(function(ok,ko){var r=db.transaction('kv').objectStore('kv').get(k);r.onsuccess=function(){ok(r.result)};r.onerror=function(){ko(r.error)}})})}
function del(k){return abre().then(function(db){return new Promise(function(ok,ko){var t=db.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=function(){ok()};t.onerror=function(){ko(t.error)}})})}
function chaves(){return abre().then(function(db){return new Promise(function(ok,ko){var r=db.transaction('kv').objectStore('kv').getAllKeys();r.onsuccess=function(){ok(r.result||[])};r.onerror=function(){ko(r.error)}})})}

/* ───── 1. mudança: localStorage → arquivo (uma chave de cada vez; só apaga do localStorage depois de gravada) ───── */
var LISTA=[];                                                         /* [{k,ts,label,n,mb}] — o que há no arquivo, para a Zona de risco */
function meta(k,v){var o={k:k,ts:0,label:'',n:'',mb:MB(String(v==null?'':v).length)};
  var m=k.match(/systaag_snap_(\d+)$/);if(m){o.ts=+m[1];try{var j=JSON.parse(v);o.label=j.label||'';o.n=j.n||''}catch(e){}}
  else{var b=k.match(/^(treino:)?(systaag_[a-z0-9]+)__bak(\d{4})(\d{2})(\d{2})$/);if(b){o.ts=new Date(+b[3],+b[4]-1,+b[5]).getTime();o.label='backup antigo de '+b[2].replace('systaag_','')+' ('+b[5]+'/'+b[4]+'/'+b[3]+')';o.n='só esta chave'}}
  return o}
function migra(){var ks=RAW.keys().filter(function(k){return ARQ.test(k)});if(!ks.length)return Promise.resolve(0);
  var n=0;return ks.reduce(function(p,k){return p.then(function(){var v=RAW.get(k);if(v==null)return;return put(k,v).then(function(){RAW.rm(k);n++})})},Promise.resolve()).then(function(){if(n)console.log('v168: '+n+' cópia(s) de segurança movida(s) do localStorage para o arquivo');return n})}
function carrega(){return chaves().then(function(ks){return Promise.all(ks.map(function(k){return get(k).then(function(v){return meta(k,v)})}))}).then(function(l){LISTA=l.sort(function(a,b){return b.ts-a.ts});return LISTA}).catch(function(e){console.error('v168 carrega',e);return LISTA})}
var pronto=migra().catch(function(e){console.error('v168 migra',e)}).then(carrega).then(function(){atualiza()});

/* ───── espaço ───── */
function uso(){var t=0;RAW.keys().forEach(function(k){var v=RAW.get(k);if(v!=null)t+=v.length});return MB(t)}
var LIMITE=10;

/* ───── 2. entrar no treino: cópia leve, com desfazer ───── */
var LEVA=/^systaag_(erp1z?|zero|crm_t|quem|fin_perfil|fin_role|acu_sess)$/;  /* só o que o treino precisa; o guia começa limpo (v148) */
function copiaLeve(){
  RAW.keys().forEach(function(k){if(k.indexOf(P)===0)RAW.rm(k)});
  var feitos=[];
  try{RAW.keys().forEach(function(k){if(!LEVA.test(k))return;var v=RAW.get(k);if(v!=null){RAW.set(P+k,v);feitos.push(P+k)}})}
  catch(e){feitos.forEach(function(k){try{RAW.rm(k)}catch(x){}});                 /* desfaz a metade que coube */
    var u=uso();throw new Error('O navegador está sem espaço para abrir o treino ('+fmt(u)+' de '+LIMITE+' MB usados; o treino precisa de mais '+fmt(MB((RAW.get('systaag_erp1z')||'').length))+'). Abra Base › Mapa de entidades › Zona de risco e apague uma cópia de segurança, ou feche e abra a página de novo (as cópias vão para o arquivo sozinhas).')}
  RAW.rm(P+'systaag_guia124');RAW.set(P+'systaag_treino_fresh','1')}
/* o v148 chama copiaRealParaTreino por dentro (closure); a troca é feita nas portas de entrada: V148.entrar / recomecar / _zeroCom */
function trocaV148(){try{var V=window.V148;if(!V||V.__v168)return;V.__v168=1;var AUTO='systaag_treino_guia';
  function salvaAgora(){try{if(window.save&&window.save.agora)window.save.agora();else if(typeof save==='function')save()}catch(e){}}
  function abreGuia(){try{if(window.GUIA&&GUIA.iniciar)GUIA.iniciar(0)}catch(e){}}
  V.entrar=function(comGuia){if(ON){if(comGuia)abreGuia();return}salvaAgora();
    try{copiaLeve();if(comGuia)RAW.set(P+AUTO,'1');RAW.set(F,'1')}catch(e){tst(e.message,true);return}location.reload()};
  V.recomecar=function(){if(!ON){V.entrar(false);return}
    V._pergunta('Recomeçar o treino?','Apaga tudo o que você fez no treino e abre o cofre de novo, vazio (catálogo, listas e locais da base real). A base real não muda.','Sim, recomeçar',function(){
      V._congela();try{RAW.set(F,'0');copiaLeve();RAW.set(P+AUTO,'1');RAW.set(F,'1')}catch(e){tst(e.message,true);return}location.reload()})};
  V._zeroCom=function(cap){V._congela();try{RAW.set(F,'0');copiaLeve();RAW.set(P+AUTO,'1');RAW.set(P+'systaag_treino_cap',String(cap||0));RAW.set(F,'1')}catch(e){tst(e.message,true);return}location.reload()};
  /* o "Aprender fazendo" (GUIA.iniciar enganchado pelo v148) chama entrar() por closure — reengancha para chamar o novo */
  if(window.GUIA&&GUIA.iniciar&&GUIA.iniciar.__v148&&!GUIA.iniciar.__v168){var _ini=GUIA.iniciar;
    var ini=function(i){if(ON||(i||0)>0)return _ini.apply(this,arguments);
      V._pergunta('Aprender fazendo acontece no Modo treino','Você vai praticar numa cópia vazia do sistema (catálogo, listas e locais ficam). <b>A base real não muda.</b> Quando terminar, clique em <b>Sair do treino</b> na faixa laranja e tudo volta como estava.','Entrar no modo treino',function(){V.entrar(true)})};
    ini.__v148=true;ini.__v168=true;GUIA.iniciar=ini}
}catch(e){console.error('v168 trocaV148',e)}}

/* ───── 1b. Zona de risco: a lista vem do arquivo; guardar continua síncrono (sobrevive ao reload) e migra na próxima abertura ───── */
function trocaV139(){try{var V=window.V139;if(!V||V.__v168)return;V.__v168=1;
  var podem=function(p){try{return typeof can==='function'&&!!can(p)}catch(e){return false}};
  var KEYS=['systaag_erp1z','systaag_erp1','systaag_crm_t','systaag_zero','systaag_guia124'];
  var dBR=function(ts){var d=new Date(ts);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
  var _guardar=V.guardar;
  V.guardar=function(label){var ok=_guardar.apply(this,arguments);
    if(!ok){/* não coube: tira do localStorage o que já está no arquivo e tenta uma vez mais */
      RAW.keys().forEach(function(k){if(ARQ.test(k)&&LISTA.some(function(s){return s.k===k}))RAW.rm(k)});ok=_guardar.apply(this,arguments)}
    if(!ok)tst('Não deu para guardar a cópia de segurança: o navegador está sem espaço ('+fmt(uso())+' de '+LIMITE+' MB). Apague uma cópia na Zona de risco e tente de novo.',true);
    return ok};
  V.restaurar=function(k){if(!podem('zerar'))return;
    var local=null;try{local=RAW.get(k)}catch(e){}
    (local!=null?Promise.resolve(local):get(k)).then(function(v){var j=null;try{j=JSON.parse(v)}catch(e){}
      if(!j){tst('Cópia não encontrada.',true);return}
      var ts=/systaag_snap_(\d+)$/.test(k)?+k.match(/systaag_snap_(\d+)$/)[1]:(LISTA.filter(function(s){return s.k===k})[0]||{}).ts||Date.now();
      if(!/systaag_snap_/.test(k)){/* backup antigo de uma chave só: vira o formato das cópias */var kk=k.replace(/^treino:/,'').replace(/__bak\d+$/,'');var o={};o[kk]=v;j=o}
      dialogo('Restaurar a base','Volta a base inteira para como estava em <b>'+E(dBR(ts))+'</b> ('+E(j.n||'')+'). O que foi feito depois dessa data se perde — por isso uma cópia de agora também fica guardada.','RESTAURAR',function(){
        V.guardar('antes de restaurar');try{KEYS.forEach(function(x){if(j[x]!=null)localStorage.removeItem(x)});KEYS.forEach(function(x){if(j[x]!=null)localStorage.setItem(x,j[x])})}catch(e){tst('Não deu para restaurar: '+e.message,true);return}
        try{if(window.V148&&V148._congela)V148._congela()}catch(e){}location.reload()})})};
  V.apagarSnap=function(k){if(!podem('zerar'))return;if(!confirm('Apagar esta cópia de segurança?'))return;
    try{RAW.rm(k)}catch(e){}del(k).catch(function(){}).then(function(){LISTA=LISTA.filter(function(s){return s.k!==k});try{renderMain()}catch(e){}setTimeout(atualiza,80)})};
}catch(e){console.error('v168 trocaV139',e)}}
function dialogo(titulo,texto,palavra,go){var old=document.getElementById('v139-dlg');if(old)old.remove();
  var d=document.createElement('div');d.id='v139-dlg';d.dataset.palavra=palavra;d.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
  d.innerHTML='<div class="card p-4" style="max-width:520px;width:100%;border-top:4px solid #d03b3b"><h5 class="mb-2"><i class="bi bi-exclamation-triangle-fill me-2" style="color:#d03b3b"></i>'+E(titulo)+'</h5><div class="sub mb-3" style="font-size:13px">'+texto+'</div>'+
    '<label class="sub d-block mb-1" style="font-size:12px">Para confirmar, digite <b>'+E(palavra)+'</b></label><input type="text" class="form-control mb-2" autocomplete="off" oninput="V139.check()" placeholder="'+E(palavra)+'">'+
    '<label class="d-flex gap-2 align-items-start mb-3" style="font-size:12.5px"><input type="checkbox" class="form-check-input mt-1" onchange="V139.check()"> Entendi: isto muda a base de todos os departamentos. Uma cópia de agora fica guardada na Zona de risco.</label>'+
    '<div class="d-flex gap-2 justify-content-end"><button class="btn-soft" onclick="document.getElementById(\'v139-dlg\').remove()">Cancelar</button><button id="v139-zero-ok" class="btn-apple" disabled style="background:#d03b3b">Confirmar</button></div></div>';
  d.querySelector('#v139-zero-ok').onclick=function(){d.remove();go()};document.body.appendChild(d);setTimeout(function(){d.querySelector('input[type=text]').focus()},50)}

/* a tabela "CÓPIAS GUARDADAS" da Zona de risco passa a listar o arquivo (+ o que ainda estiver no localStorage), e ganha o espaço */
function atualiza(){try{var z=document.getElementById('v139-risco');if(!z)return;var ok=(function(){try{return typeof can==='function'&&!!can('zerar')}catch(e){return false}})();
  var locais=RAW.keys().filter(function(k){return ARQ.test(k)}).map(function(k){return meta(k,RAW.get(k))});
  var todas=LISTA.concat(locais.filter(function(l){return !LISTA.some(function(s){return s.k===l.k})}));
  var minhas=todas.filter(function(s){return ON?s.k.indexOf(P)===0:s.k.indexOf(P)!==0}).sort(function(a,b){return b.ts-a.ts});
  var dBR=function(ts){var d=new Date(ts);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
  var u=uso(),pct=Math.min(100,Math.round(u/LIMITE*100)),cor=pct>85?'#d03b3b':pct>65?'#ff7a00':'#1a9c5b';
  var html='<div class="mt-2" id="v168-copias"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em">CÓPIAS GUARDADAS · '+minhas.length+' <span style="letter-spacing:0;text-transform:none">(no arquivo do navegador — não ocupam o espaço da base)</span></div>'+
    (minhas.length?'<table class="tbl no-filter"><tbody>'+minhas.map(function(s){return '<tr><td>'+E(dBR(s.ts))+'</td><td>'+E(s.label)+'</td><td class="sub">'+E(s.n)+' · '+fmt(s.mb)+'</td><td class="text-end">'+(ok?'<button class="btn-soft" onclick="V139.restaurar(\''+E(s.k)+'\')"><i class="bi bi-arrow-return-left me-1"></i>Restaurar esta base</button> <button class="btn-soft" title="Apagar cópia" onclick="V139.apagarSnap(\''+E(s.k)+'\')"><i class="bi bi-x"></i></button>':'')+'</td></tr>'}).join('')+'</tbody></table>':'<div class="sub" style="font-size:11px">Nenhuma cópia guardada ainda — a primeira é feita automaticamente antes de zerar ou resetar.</div>')+
    '<div class="mt-3"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em">ESPAÇO DO NAVEGADOR</div><div class="d-flex align-items-center gap-2"><div style="flex:1;height:8px;border-radius:999px;background:rgba(0,0,0,.08);overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+cor+'"></div></div><span class="sub" style="font-size:12px;white-space:nowrap"><b>'+fmt(u)+'</b> de '+LIMITE+' MB</span></div><div class="sub mt-1" style="font-size:11px">Base real '+fmt(MB((RAW.get('systaag_erp1z')||'').length))+(RAW.get(P+'systaag_erp1z')!=null?' · treino '+fmt(MB((RAW.get(P+'systaag_erp1z')||'').length)):'')+'. O treino precisa de espaço para uma cópia da base.</div></div></div>';
  var velho=document.getElementById('v168-copias');
  if(velho){velho.outerHTML=html;return}
  /* tira a lista antiga do v139 (lê só o localStorage) e põe a nova no lugar */
  var nos=Array.prototype.slice.call(z.children);var alvo=null;
  nos.forEach(function(n){if(n.textContent&&/CÓPIAS GUARDADAS|Nenhuma cópia guardada/.test(n.textContent)&&!n.id)alvo=n});
  if(alvo)alvo.outerHTML=html;else z.insertAdjacentHTML('beforeend',html)}catch(e){console.error('v168 atualiza',e)}}

function varre(){trocaV148();trocaV139();if(location.hash==='#/dbmapa'&&document.getElementById('v139-risco')&&!document.getElementById('v168-copias'))atualiza()}
setInterval(varre,600);varre();
window.V168={uso:uso,lista:function(){return LISTA},migra:function(){return migra().then(carrega).then(atualiza)},pronto:pronto};
})();
