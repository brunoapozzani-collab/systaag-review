/* v154 — ABRIR RÁPIDO, parte 2 (Bruno, 05-Nov-2026) — depois do v153 (95 s → 12 s no profiler), o que sobrava:
   1. A GRAVAÇÃO: cada save() comprime a base inteira (LZString, ~750 KB) na thread da tela — 2,4 s no profiler, a primeira
      vez 1,5 s depois de abrir (a tela congela justo quando a pessoa começa a clicar). Agora a compressão roda num Web Worker
      (a mesma lz-string 1.5.0 do index, byte a byte o mesmo resultado): a tela nunca espera; quando o worker termina, o
      resultado é gravado. Ao fechar/recarregar a aba (pagehide/beforeunload) a gravação volta a ser síncrona, como sempre foi,
      para nada se perder. Enquanto um worker trabalha, outra gravação pedida fica na fila e a última vence.
   2. ASM.parecidos / ASM.nz (instrumentos da Base): comparava cada parceiro com cada parceiro (1.500² pares, normalizando os
      nomes de novo em cada par) a cada desenho — memória de um tick, igual ao v153.
   3. Parceiros-do-negócio (index ~25247): byName varria todos os parceiros normalizando cada nome a cada chamada — agora um
      índice nome→parceiro por tick (corrigido no próprio index). */
(function(){
'use strict';
if(window.__v154)return;window.__v154=true;

/* ---------- 1. compressão fora da thread da tela ---------- */
const LZSRC="var LZString=function(){var r=String.fromCharCode,o=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\",n=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$\",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return\"\";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+\"===\";case 2:return n+\"==\";case 3:return n+\"=\"}},decompressFromBase64:function(r){return null==r?\"\":\"\"==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?\"\":i._compress(o,15,function(o){return r(o+32)})+\" \"},decompressFromUTF16:function(r){return null==r?\"\":\"\"==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(\"\"))},compressToEncodedURIComponent:function(r){return null==r?\"\":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?\"\":\"\"==r?null:(r=r.replace(/ /g,\"+\"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return\"\";var e,t,i,s={},u={},a=\"\",p=\"\",c=\"\",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(\"\"!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join(\"\")},decompress:function(r){return null==r?\"\":\"\"==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m=\"\",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return\"\"}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return\"\";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join(\"\")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();\"function\"==typeof define&&define.amd?define(function(){return LZString}):\"undefined\"!=typeof module&&null!=module?module.exports=LZString:\"undefined\"!=typeof angular&&null!=angular&&angular.module(\"LZString\",[]).factory(\"LZString\",function(){return LZString});";
let worker=null,ocupado=false,fila=null,ultimo=null;
const podeWorker=typeof Worker==='function'&&typeof Blob==='function'&&typeof URL!=='undefined'&&URL.createObjectURL;
function getWorker(){if(worker)return worker;
  const code=LZSRC+';self.onmessage=function(e){var d=e.data;try{self.postMessage({id:d.id,out:LZString.compressToUTF16(d.s)})}catch(x){self.postMessage({id:d.id,err:String(x)})}}';
  worker=new Worker(URL.createObjectURL(new Blob([code],{type:'application/javascript'})));
  worker.onmessage=function(e){const d=e.data;ocupado=false;
    if(d.err){console.error('v154 worker',d.err);setSync(d.id)}
    else{try{localStorage.setItem(d.id,d.out);ultimo=d.out}catch(x){console.error('v154 gravar',x);try{toast('Não foi possível gravar os dados neste navegador (espaço cheio).',true)}catch(_){}}}
    if(fila){const f=fila;fila=null;mandar(f.id,f.s)}};
  worker.onerror=function(e){console.error('v154 worker erro',e&&e.message);worker=null;ocupado=false};
  return worker}
function mandar(id,s){if(ocupado){fila={id,s};return}ocupado=true;getWorker().postMessage({id,s})}
function setSync(id){/* caminho de sempre, síncrono */try{localStorage.setItem(id,LZString.compressToUTF16(JSON.stringify(S.db)))}catch(e){console.error('v154 sync',e)}}
let saindo=false;
/* ao sair (ou a aba ficar oculta): se há um trabalho no worker ainda em curso, ele é descartado e a base ATUAL é gravada
   síncrona, como sempre foi — nada fica dependendo de um worker que a aba vai matar */
const KEY='systaag_erp1z';
function garanteSync(){if(!ocupado&&!fila)return;fila=null;ocupado=false;try{if(worker)worker.terminate()}catch(e){}worker=null;if(window.__v152_quieta)return;setSync(KEY)}
['pagehide','beforeunload'].forEach(ev=>window.addEventListener(ev,()=>{saindo=true;garanteSync()},{capture:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){saindo=true;garanteSync()}else saindo=false});
if(podeWorker&&window.LZString&&typeof LZString.compressToUTF16==='function'){
  /* a gravação da base (COP save) chama LZString.compressToUTF16(JSON.stringify(S.db)) e guarda o resultado em systaag_erp1z.
     Só esse caso (texto grande, chave da base, página aberta) vai para o worker; devolvemos o último comprimido conhecido para o
     setItem síncrono (nada muda no disco até o worker acabar) e o worker grava o novo. Qualquer outra chamada segue como sempre. */
  const real=LZString.compressToUTF16.bind(LZString);
  LZString.compressToUTF16=function(s){
    if(saindo||window.__v154_sync||typeof s!=='string'||s.length<200000)return real(s);
    /* 05/11 correção: só o JSON da própria base vai para o worker (que grava em KEY). Antes, qualquer texto grande
       comprimido durante um save (ex.: as tabelas do CRM) ia para o worker e era gravado na chave da base, e quem chamou
       recebia a base antiga — o CRM perdia as tabelas. Agora: o texto tem de começar exatamente como JSON.stringify(S.db). */
    let pref='';try{const k0=window.S&&S.db&&Object.keys(S.db)[0];pref=k0?JSON.stringify({[k0]:0}).slice(0,-2):''}catch(e){}
    if(!pref||s.slice(0,pref.length)!==pref)return real(s);
    const st=new Error().stack||'';if(!/\bsave\b|grava|flush/.test(st))return real(s);
    /* a base: quem chama é o save do COP (via v128 flush) */
    if(ultimo==null){try{ultimo=localStorage.getItem(KEY)}catch(e){}}
    mandar(KEY,s);
    return ultimo==null?real(s):ultimo};
}

/* ---------- 2. instrumentos da Base ---------- */
/* (instalado no index logo depois do bloco ASM, antes dos primeiros desenhos) */
})();
