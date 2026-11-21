/* v196 — A TELA DE ABERTURA (Bruno, 21/11/2026): "Início usável em ~2 s" + "uma barra dizendo quanto falta".
   Esta é a tela que cobre o sistema enquanto ele se monta (o build.mjs põe-na logo depois do <body> do app.html).
   1. FOTO DO INÍCIO: se este computador já abriu o sistema antes (com a mesma pessoa), mostra NA HORA a última foto do
      Início (guardada pela v195 quando o sistema estava pronto) — os números da última vez, com "Atualizando…" por cima.
      A foto vive dentro de uma "sombra" (shadow DOM): nenhuma camada do sistema a enxerga nem escreve nela.
      Um clique num atalho da foto é guardado e cumprido assim que o sistema real aparece.
   2. BARRA COM TEMPO: anda pelo tempo que este computador costuma levar (mediana das últimas aberturas, guardada em
      qv0:tempos) — corre no compositor do navegador, por isso continua a andar mesmo com o sistema ocupado a montar-se.
   3. Sai sozinha quando o sistema se dá por pronto (marca pronto127 da v127), ou em 30 s no máximo. */
(function(){
var H=document.documentElement,el=document.getElementById('abrindo-sistema');if(!el)return;
var LS=window.localStorage;
function mediana(a){a=a.slice().sort(function(x,y){return x-y});return a.length?a[Math.floor(a.length/2)]:0}
var tempos=[];try{tempos=JSON.parse(LS.getItem('qv0:tempos')||'[]')}catch(e){}
var E=Math.max(2500,mediana(tempos)||12000);                     /* quanto este computador costuma levar (ms) */
var ja=Math.round((window.performance&&performance.now())||0);    /* a barra continua de onde a porta de entrada a deixou */
var css='#abrindo-sistema .v196b{position:fixed;left:0;top:0;height:3px;width:100%;background:#0071e3;transform-origin:0 50%;transform:scaleX(0);'+
  'animation:v196b '+E+'ms cubic-bezier(.2,.65,.35,1) -'+ja+'ms forwards;z-index:3;box-shadow:0 0 8px rgba(0,113,227,.5)}'+
  '@keyframes v196b{from{transform:scaleX(.02)}to{transform:scaleX(.96)}}'+
  '#abrindo-sistema .v196p{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:3;display:flex;align-items:center;gap:10px;padding:9px 16px;border-radius:999px;'+
  'background:rgba(29,29,31,.86);color:#fff;font:600 13px/1.2 -apple-system,BlinkMacSystemFont,"Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)}'+
  '#abrindo-sistema .v196p i{display:block;width:90px;height:4px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden}'+
  '#abrindo-sistema .v196p i b{display:block;height:100%;width:100%;background:#fff;transform-origin:0 50%;transform:scaleX(0);animation:v196b '+E+'ms cubic-bezier(.2,.65,.35,1) -'+ja+'ms forwards}'+
  '#abrindo-sistema .v196h{position:absolute;inset:0;overflow:hidden}';
var st=document.createElement('style');st.textContent=css;el.appendChild(st);
var seg=Math.max(1,Math.round((E-ja)/1000));
var barraTopo=document.createElement('div');barraTopo.className='v196b';el.appendChild(barraTopo);

/* ───── 1. a foto do Início ───── */
var foto=null,rota=(location.hash||'').replace(/^#\/?/,'').split('/')[0];
try{if(!window.__TREINO&&(!rota||rota==='home')){var f=JSON.parse(LS.getItem('systaag_v195_tela')||'null');var quem=LS.getItem('systaag_quem');
  if(f&&f.html&&f.quem&&f.quem===quem&&Date.now()-f.quando<14*864e5)foto=f}}catch(e){foto=null}
var irPara=null;
if(foto&&el.attachShadow){
  try{
    var host=document.createElement('div');host.className='v196h';
    (foto.attrs||[]).forEach(function(a){try{if(a[0]==='class')String(a[1]).split(/\s+/).filter(Boolean).forEach(function(c){host.classList.add(c)});else host.setAttribute(a[0],a[1])}catch(e){}});
    var sh=host.attachShadow({mode:'open'});
    sh.innerHTML=(foto.links||[]).map(function(h){return '<link rel="stylesheet" href="'+String(h).replace(/"/g,'&quot;')+'">'}).join('')+
      '<style>:host{display:block;position:absolute;inset:0;overflow:hidden;background:#f5f5f7}.sb{margin:0;min-height:100%}</style><style>'+foto.css+'</style>'+
      '<div class="sb">'+foto.html+'</div>';
    /* os atalhos da foto: o clique fica guardado e é cumprido quando o sistema real aparecer */
    host.addEventListener('click',function(ev){var p=ev.composedPath?ev.composedPath():[];for(var i=0;i<p.length;i++){var a=p[i];if(a&&a.getAttribute){var h=a.getAttribute('href')||'';var m=/#\/[\w\-\/]+/.exec(h+' '+(a.getAttribute('onclick')||''));if(m){irPara=m[0];break}}}
      ev.preventDefault();ev.stopPropagation();var t=el.querySelector('.v196p span');if(t)t.textContent=irPara?'Abrindo essa tela…':'Um instante — atualizando…'},true);
    el.style.background='transparent';
    /* tira o desenho "taag · Abrindo o sistema…" e põe a foto */
    [].slice.call(el.children).forEach(function(c){if(c!==st&&c!==barraTopo)c.style.display='none'});
    el.appendChild(host);
    var pill=document.createElement('div');pill.className='v196p';pill.innerHTML='<span>Atualizando os números…</span><i><b></b></i>';el.appendChild(pill);
    window.__v196foto=true;
  }catch(e){foto=null}
}
if(!foto){/* sem foto: a tela "taag" de sempre, agora com a barra que anda pelo tempo esperado e quanto falta */
  var s=el.querySelector('div[style*="opacity:.6"]');if(s)s.textContent='Quase pronto — cerca de '+seg+' s';
  var b=el.querySelector('i');if(b){b.style.cssText='display:block;height:100%;width:100%;background:#1f2430;border-radius:999px;transform-origin:0 50%;transform:scaleX(0);animation:v196b '+E+'ms cubic-bezier(.2,.65,.35,1) -'+ja+'ms forwards'}}

/* ───── 3. sai quando o sistema está pronto ───── */
function some(porTempo){if(!el)return;var e=el;el=null;
  /* guarda quanto levou (só aberturas normais: sem escolher nome na porta de entrada e sem o limite de 30 s) */
  try{if(porTempo!==true&&!(window.__V195&&window.__V195.escolhido&&window.__V195.escolhido())){var t=Math.round(performance.now());tempos.push(t);LS.setItem('qv0:tempos',JSON.stringify(tempos.slice(-5)))}}catch(x){}
  e.style.transition='opacity .25s ease';e.style.opacity='0';e.style.pointerEvents='none';setTimeout(function(){try{e.remove()}catch(x){}},280);
  if(irPara&&location.hash!==irPara)setTimeout(function(){location.hash=irPara},30)}
window.__abrindoSome=some;
try{new MutationObserver(function(){if(H.classList.contains('pronto127'))some()}).observe(H,{attributes:true,attributeFilter:['class']})}catch(x){window.addEventListener('load',function(){setTimeout(some,400)})}
setTimeout(function(){some(true)},30000);
})();
