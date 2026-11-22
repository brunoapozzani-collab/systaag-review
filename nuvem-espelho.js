/* rapido3 — O ESPELHO DA NUVEM: abrir rápido (Bruno, 18-Nov-2026)
   Problema medido em 17/11: a cada abertura, em todo computador, a v171 (CRM) e a v172 (Base) baixavam a nuvem INTEIRA
   de novo (≈14.000 registros, ≈20 MB, 15 pedidos em fila) — 35 s numa boa ligação, minutos numa ligação fraca.
   O que este arquivo faz — sem mudar NADA do que a v171/v172 fazem com os registros:
     · guarda neste computador (IndexedDB "systaag_espelho") uma cópia fiel da tabela da nuvem, registro a registro;
     · a cada abertura pede à nuvem só o que mudou desde a última vez (com 60 s de folga) e junta na cópia;
     · CONFERE: o número de registros da cópia tem de ser igual ao da nuvem. Se não for, tenta de novo e, se continuar
       diferente, refaz a cópia inteira. Se ainda assim não bater, sai do caminho: a v171/v172 leem a nuvem como sempre;
     · computador novo (sem cópia): parte de uma foto da nuvem tirada na publicação (um arquivo só, comprimido) + o que
       mudou desde a foto; sem foto, lê a nuvem inteira (por chave, sem pular registro mesmo com gente gravando);
     · entrega a cópia à v171 e à v172 respondendo, no lugar da rede, exatamente aos pedidos da primeira leitura
       completa de cada uma (mesmos registros, mesma ordem). Tudo o mais (gravações, sondagem de 30 s, tempo real)
       vai direto à nuvem, como antes. Nunca entrega uma lista vazia (lista vazia = "nuvem vazia" = semear).
   Carregado pela porta de entrada (loader.html), antes do sistema — começa a trabalhar enquanto o sistema ainda baixa.
   Nenhum arquivo do sistema foi alterado por esta camada. */
(function(){'use strict';
if(window.NUVEM_ESPELHO)return;
var T0=(window.performance&&performance.now)?performance.now():0;
var E=window.NUVEM_ESPELHO={versao:"rapido3",estado:'desligado',via:'',passos:[],erro:'',servidos:{base:0,crm:0}};
function passo(t,x){try{E.passos.push({t:Math.round(performance.now()-T0),o:t,x:x===undefined?'':x})}catch(e){}}
var CFG=window.NUVEM_CONFIG||{};
if(!CFG.url||!CFG.key||!window.indexedDB||!window.fetch||!window.Response||!window.Promise||!window.Map){passo('desligado: sem configuração ou sem suporte');E.pronto=Promise.resolve(null);return}

var TAB='crm_registros',BASE=CFG.url+'/rest/v1/'+TAB,PRE='base:',ORDEM='atualizado_em.asc,tabela.asc,id.asc';
var H={'apikey':CFG.key,'Authorization':'Bearer '+CFG.key};
var LIM=1000,MARGEM=60000,MAXPAG=400,DBN='systaag_espelho',SEP='\u0001',SEMANA=7*864e5;
var fetch0=window.fetch.bind(window);
function chave(r){return r.tabela+SEP+r.id}
function ms(r){var v=Date.parse(r.atualizado_em);if(!(v>0))throw new Error('registro sem data: '+r.tabela+'/'+r.id);return v}

/* ───── IndexedDB do espelho (separado da base: a porta de entrada não o carrega para a memória) ───── */
var db=null;
function abre(){return new Promise(function(ok,ko){var r=indexedDB.open(DBN,1);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('reg'))d.createObjectStore('reg');if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta')};r.onsuccess=function(){db=r.result;db.onversionchange=function(){try{db.close()}catch(e){}};ok(db)};r.onerror=function(){ko(r.error||new Error('IndexedDB'))};r.onblocked=function(){ko(new Error('IndexedDB bloqueado'))}})}
function pede(rq){return new Promise(function(ok,ko){rq.onsuccess=function(){ok(rq.result)};rq.onerror=function(){ko(rq.error)}})}
function leMeta(){return pede(db.transaction('meta').objectStore('meta').get('m'))}
function leTudoLocal(){return pede(db.transaction('reg').objectStore('reg').getAll())}
/* grava numa transação só (ou tudo, ou nada): os registros que mudaram + a ficha (n = contagem real do que ficou guardado) */
var lida=null;   /* a ficha como esta aba a leu/gravou por último — para saber se outra aba gravou no meio */
function grava(sujos,limpar,ate,ord,verificado){return new Promise(function(ok,ko){var t=db.transaction(['reg','meta'],'readwrite'),sr=t.objectStore('reg'),sm=t.objectStore('meta'),nova=null;
  if(limpar)sr.clear();sujos.forEach(function(v,k){sr.put(v,k)});
  var g=sm.get('m');g.onsuccess=function(){var ant=g.result;var c=sr.count();c.onsuccess=function(){
    /* se outra aba gravou no meio, fica o ponto de retomada mais antigo dos dois (reler um pouco a mais nunca perde nada) */
    var outra=!limpar&&ant&&ant.completo&&ant.quando!==lida;
    nova={completo:true,n:c.result,ate:(outra&&ant.ate<ate)?ant.ate:ate,ord:Math.max(ord,(!limpar&&ant&&ant.ord)||0),verificado:verificado||(ant&&ant.verificado)||0,quando:new Date().toISOString()+'#'+Math.random().toString(36).slice(2,8)};
    sm.put(nova,'m')}};
  t.oncomplete=function(){if(nova)lida=nova.quando;ok()};t.onerror=function(){ko(t.error)};t.onabort=function(){ko(t.error||new Error('abort'))}})}

/* ───── leitura da nuvem POR CHAVE (não por posição): quem grava no meio da leitura nunca faz pular um registro ───── */
function asp(v){return '"'+String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"'}
function pagina(cur,desde){var u=BASE+'?select=*&order='+ORDEM+'&limit='+LIM;
  if(cur){var T=asp(cur.atualizado_em),X=asp(cur.tabela),Y=asp(cur.id);u+='&or='+encodeURIComponent('(atualizado_em.gt.'+T+',and(atualizado_em.eq.'+T+',tabela.gt.'+X+'),and(atualizado_em.eq.'+T+',tabela.eq.'+X+',id.gt.'+Y+'))')}
  else if(desde)u+='&atualizado_em=gte.'+encodeURIComponent(desde);
  return fetch0(u,{headers:H}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error('nuvem '+r.status+' '+t.slice(0,160))});relogio(r);return r.json()}).then(function(j){if(!Array.isArray(j))throw new Error('resposta inesperada da nuvem');return j})}
function leNuvem(desde){var out=[],n=0;function pg(cur){return pagina(cur,desde).then(function(j){for(var i=0;i<j.length;i++)out.push(j[i]);if(j.length<LIM)return out;if(++n>MAXPAG)throw new Error('leitura longa demais');return pg(j[j.length-1])})}return pg(null)}
function conta(){return fetch0(BASE+'?select=id&limit=1',{headers:Object.assign({'Prefer':'count=exact'},H)}).then(function(r){if(!r.ok&&r.status!==206)return r.text().then(function(t){throw new Error('contagem '+r.status+' '+t.slice(0,160))});relogio(r);var m=/\/(\d+)\s*$/.exec(r.headers.get('content-range')||'');if(!m)throw new Error('contagem: sem total');return +m[1]})}
function relogio(r){try{var d=r.headers.get('date'),v=d&&Date.parse(d);if(v)E.desvio=v-Date.now()}catch(e){}}

/* ───── a cópia em memória ───── */
var mapa=new Map(),ord=0,sujos=new Map(),ate=0;
function junta(r){if(!r||r.tabela===undefined||r.id===undefined||r.id===null)throw new Error('registro sem chave');var k=chave(r),t=ms(r),cur=mapa.get(k);if(t>ate)ate=t;
  if(cur&&cur.r.atualizado_em===r.atualizado_em&&JSON.stringify(cur.r)===JSON.stringify(r))return 0;
  var v={o:++ord,r:r};mapa.set(k,v);sujos.set(k,v);return 1}
function desdeISO(t){return new Date(t-MARGEM).toISOString()}
function oQueMudou(desde,jaPedida){return (jaPedida?jaPedida.catch(function(){return leNuvem(desde)}):leNuvem(desde)).then(function(regs){var n=0;regs.forEach(function(r){n+=junta(r)});passo('o que mudou desde '+desde,regs.length+' lidos · '+n+' novos/alterados');return n})}
function inteira(){var ini=Date.now()+(E.desvio||0);mapa=new Map();sujos=new Map();ord=0;ate=0;E.limpar=true;
  return leNuvem(null).then(function(regs){regs.forEach(junta);passo('nuvem inteira',regs.length);return conta()}).then(function(n){if(n===mapa.size)return n;
    /* alguém gravou durante a leitura: busca o que mudou desde o começo dela e confere outra vez */
    return oQueMudou(desdeISO(ini)).then(conta)})}
function foto(){var F=window.__FOTO;if(!F||!F.url)return Promise.resolve(false);
  return fetch0(F.url).then(function(r){if(!r.ok)throw new Error('foto '+r.status);return r.json()}).then(function(j){if(!j||!Array.isArray(j.regs)||!j.regs.length)throw new Error('foto vazia');
    mapa=new Map();sujos=new Map();ord=0;ate=0;E.limpar=true;j.regs.forEach(junta);passo('foto da publicação',j.regs.length);return true})
  .catch(function(e){passo('foto indisponível',String(e&&e.message||e));mapa=new Map();sujos=new Map();ord=0;ate=0;return false})}

function ordena(){var a=Array.from(mapa.values());a.forEach(function(v){v.t=ms(v.r)});a.sort(function(x,y){return (x.t-y.t)||(x.o-y.o)});var base=[],crm=[];
  a.forEach(function(v){(String(v.r.tabela).indexOf(PRE)===0?base:crm).push(v.r)});return {base:base,crm:crm}}

function prepara(){E.estado='preparando';E.limpar=false;var metaAnt=null;
  return espera().then(abre).then(leMeta).then(function(m){metaAnt=m;lida=m?m.quando:null;if(!m||!m.completo)return [];return leTudoLocal()}).then(function(vals){
    var temCopia=false;
    if(metaAnt&&metaAnt.completo&&vals.length&&vals.length===metaAnt.n){vals.forEach(function(v){mapa.set(chave(v.r),v);var t=ms(v.r);if(t>ate)ate=t});ord=metaAnt.ord||vals.length;
      /* o ponto de retomada é o da ficha (o mais antigo que alguma aba gravou), nunca mais novo que os registros guardados */
      if(metaAnt.ate>0&&metaAnt.ate<ate)ate=metaAnt.ate;temCopia=true;E.via='cópia deste computador';passo('cópia local',vals.length)}
    else if(metaAnt)passo('cópia local descartada (incompleta)',vals.length+' ≠ '+(metaAnt&&metaAnt.n));
    return temCopia?true:foto().then(function(ok){if(ok)E.via='foto da publicação';return ok})})
  .then(function(tem){
    if(!tem){E.via='nuvem inteira';return inteira()}
    var desde=desdeISO(ate);var usaCedo=!!(cedo&&cedo.t<=ate);ateUsado=ate;if(usaCedo)passo('pedido adiantado aproveitado',desdeISO(cedo.t));
    return oQueMudou(desde,usaCedo?cedo.p:null).then(conta).then(function(n){if(n===mapa.size)return n;passo('contagem não bateu',mapa.size+' aqui · '+n+' na nuvem — relendo');
      return oQueMudou(desde).then(conta).then(function(n2){if(n2===mapa.size)return n2;passo('contagem não bateu de novo',mapa.size+' aqui · '+n2+' na nuvem — refazendo a cópia inteira');E.via='nuvem inteira (cópia refeita)';return inteira()})})})
  .then(function(n){
    if(n!==mapa.size)throw new Error('a cópia ('+mapa.size+') não bate com a nuvem ('+n+')');
    E.n=n;var d=ordena();E.total={base:d.base.length,crm:d.crm.length};E.estado='pronto';passo('pronto',n+' registros = nuvem · '+E.via);
    try{if(ateUsado>0)localStorage.setItem(KATE,String(ateUsado));else localStorage.removeItem(KATE)}catch(e){}
    /* guarda sem segurar a abertura; se a gravação falhar, a cópia anterior continua inteira (transação) */
    var s=sujos,l=E.limpar;sujos=new Map();
    E.guardado=(s.size||l||!metaAnt)?grava(s,l,ate,ord,l?Date.now():0).then(function(){passo('cópia guardada',s.size+' registros');return true},function(e){passo('cópia NÃO guardada',String(e&&e.message||e));console.warn('rapido3 espelho: não deu para guardar a cópia',e);return false}):Promise.resolve(true);
    agendaConferencia(metaAnt);
    return d})
  .catch(function(e){E.estado='falhou';E.erro=String(e&&e.message||e);passo('falhou — a v171/v172 leem a nuvem como sempre',E.erro);console.warn('rapido3 espelho: fora do caminho —',e);return null})}

/* ───── conferência completa (toda a população): a cópia contra a nuvem, registro a registro ─────
   Corre sozinha uma vez por semana, 2 min depois de abrir, sem travar nada; se achar diferença, refaz a cópia
   (a próxima abertura já usa a certa). Também é o instrumento de auditoria: NUVEM_ESPELHO.conferir(). */
function conferir(){return abre().then(leTudoLocal).then(function(vals){var loc=new Map();vals.forEach(function(v){loc.set(chave(v.r),v.r)});
  return leNuvem(null).then(function(regs){var falta=0,sobra=0,difere=0,nuv=new Map();regs.forEach(function(r){nuv.set(chave(r),r)});
    nuv.forEach(function(r,k){var l=loc.get(k);if(!l)falta++;else if(JSON.stringify(l)!==JSON.stringify(r))difere++});loc.forEach(function(r,k){if(!nuv.has(k))sobra++});
    var res={nuvem:nuv.size,copia:loc.size,falta:falta,sobra:sobra,difere:difere,igual:!falta&&!sobra&&!difere,quando:new Date().toISOString()};E.conferencia=res;
    if(res.igual)return leMeta().then(function(m){if(!m)return null;lida=m.quando;return grava(new Map(),false,m.ate,m.ord||0,Date.now())}).then(function(){return res});
    /* diferença: se for só o que colegas gravaram desde a abertura, a próxima abertura resolve; em todo caso a cópia é refeita agora */
    console.warn('rapido3 espelho: conferência achou diferença — cópia refeita',res);var m2=new Map(),o=0,a=0;regs.forEach(function(r){m2.set(chave(r),{o:++o,r:r});var t=ms(r);if(t>a)a=t});
    return grava(m2,true,a,o,Date.now()).then(function(){return res})})})}
E.conferir=conferir;
function agendaConferencia(m){try{var ult=(m&&m.verificado)||0;if(E.limpar||!m)return;if(Date.now()-ult<SEMANA)return;
  setTimeout(function(){var f=function(){conferir().then(function(r){passo('conferência semanal',JSON.stringify(r))},function(e){passo('conferência semanal falhou',String(e&&e.message||e))})};
    if(document.visibilityState==='visible')f();else document.addEventListener('visibilitychange',function v(){if(document.visibilityState==='visible'){document.removeEventListener('visibilitychange',v);f()}})},120000)}catch(e){}}

/* ───── a entrega: responde no lugar da rede à PRIMEIRA leitura completa da v171 (CRM) e da v172 (Base) ───── */
var fim={base:false,crm:false};
function grupo(u,init){try{if(typeof u!=='string'||u.indexOf(BASE+'?')!==0)return null;if(init&&init.method&&String(init.method).toUpperCase()!=='GET')return null;
  var p=new URL(u).searchParams;if(p.get('select')!=='*'||p.get('order')!==ORDEM||p.has('atualizado_em')||p.has('or')||!p.has('offset')||!p.has('limit'))return null;
  var n=0;p.forEach(function(){n++});if(n!==5)return null;
  var t=p.get('tabela');return t==='like.'+PRE+'*'?'base':t==='not.like.'+PRE+'*'?'crm':null}catch(e){return null}}
window.fetch=function(input,init){var g=grupo(input,init);
  if(!g||fim[g]||!E.pronto)return fetch0.apply(window,arguments);
  var args=arguments;
  return E.pronto.then(function(d){var arr=d&&d[g];
    if(!arr||!arr.length||fim[g]){fim[g]=true;return fetch0.apply(window,args)}   /* sem cópia boa (ou lista vazia): rede, como sempre */
    var p=new URL(input).searchParams,off=+p.get('offset'),lim=+p.get('limit');
    if(!(off>=0)||!(lim>0)){fim[g]=true;return fetch0.apply(window,args)}
    var parte=arr.slice(off,off+lim);var corpo=JSON.stringify(parte);
    E.servidos[g]+=parte.length;
    if(parte.length<lim){fim[g]=true;d[g]=null;passo('entregue à '+(g==='base'?'v172 (Base)':'v171 (CRM)'),E.servidos[g]+' registros')}
    var h={'content-type':'application/json; charset=utf-8'};if(typeof E.desvio==='number')h.date=new Date(Date.now()+E.desvio).toUTCString();
    return new Response(corpo,{status:200,headers:h})})};

/* ───── v223 (22/11/2026): A BASE DESTE COMPUTADOR É LIDA PRIMEIRO ─────
   Medido no Mac do Bruno: a cópia local da nuvem (18 mil registros, ~20 MB) era lida do IndexedDB no mesmo instante em que a
   porta de entrada lia a base (3 MB) — a base ficava ~100 ms na fila atrás dela, em toda abertura. A cópia da nuvem só é
   usada depois de o sistema estar pronto. Agora:
     · num computador que já abriu antes, a leitura da cópia local espera o sinal "sistema pronto" (window.__espelhoVai, dado
       pelo sistema depois do primeiro desenho; pela porta de entrada na hora se não há base guardada ou ninguém escolhido;
       ou 5 s, o que vier primeiro);
     · o pedido "o que mudou na nuvem" sai JÁ, com o ponto de retomada da abertura anterior (qv0:espAte). Só é aproveitado
       se esse ponto for igual ou mais antigo que o da cópia lida (ler um pouco a mais nunca perde nada); senão, o pedido é
       feito de novo como sempre. A conferência da contagem continua igual. */
var KATE='qv0:espAte',ateUsado=0,cedo=null,jaAbriu=false;
try{jaAbriu=!!localStorage.getItem('qv0:geracao')}catch(e){}
try{var a0=+localStorage.getItem(KATE);if(jaAbriu&&a0>0){cedo={t:a0,p:leNuvem(desdeISO(a0))};cedo.p.catch(function(){})}}catch(e){cedo=null}
function espera(){return new Promise(function(ok){var f=false,vai=function(){if(f)return;f=true;passo('início da leitura da cópia local');ok()};window.__espelhoVai=vai;if(!jaAbriu)return vai();setTimeout(vai,5000)})}

E.pronto=prepara();
})();
