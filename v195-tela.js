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

/* ───── 1. a foto da tela pedida (v206: uma foto por endereço; clicar num atalho troca para a foto dessa tela) ───── */
/* ───── v219 (22/11/2026): A CÓPIA COMPORTA-SE COMO A TELA REAL ("como a Amazon") ─────
   a) CÓPIA EXATA: cada cópia leva a impressão digital da base de quando foi tirada. Se a base deste computador ainda é a mesma
      (e o dia é o mesmo), a cópia É a tela que o sistema vai desenhar — aparece limpa, sem barra nem aviso de "atualizando".
   b) CLIQUE GUARDADO: clicar num número/botão da cópia marca o que foi clicado e, assim que o sistema real assume (≈1 s),
      o mesmo clique é dado no mesmo elemento da tela real (conferido por posição e por texto). Nada que apague é repetido.
   c) a rolagem do conteúdo passa da cópia para a tela real. */
function fpBase(){try{var z=LS.getItem('systaag_erp1z')||'',c=LS.getItem('systaag_crm_t')||'',h=2166136261;var mix=function(x){var n=x.length,p=Math.max(1,Math.floor(n/4000));for(var i=0;i<n;i+=p){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}h^=n;h=Math.imul(h,16777619)};mix(z);mix(c);var d=new Date();return (h>>>0)+'|'+z.length+'|'+c.length+'|'+d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()}catch(e){return ''}}
var PK='systaag_v195_t:',cssG=null,quem=null,host=null,sh=null,pill=null,foto=null,exata=false,repete=null;
function caminho(alvo){/* do elemento com id mais próximo até o alvo: índices dos filhos */var p=[],e=alvo;while(e&&e.nodeType===1&&!e.id){var pai=e.parentNode;if(!pai||!pai.children)return null;p.unshift([].indexOf.call(pai.children,e));e=pai}return (e&&e.id&&e.nodeType===1)?{id:e.id,p:p}:null}
function achaReal(c){try{var e=document.getElementById(c.id);for(var i=0;e&&i<c.p.length;i++)e=e.children[c.p[i]];return e||null}catch(x){return null}}
var saiu=false,tSaiu=0,capa=null,seg=false,tSeg=0;
function daClique(ms){/* v219b: o clique guardado é dado no mesmo elemento da tela real (conferido por posição e por texto) */
  if(!repete||Date.now()-repete.quando>8000){repete=null;return}var r=repete;repete=null;setTimeout(function(){try{var a=achaReal(r.c);
    var perigo=function(x){for(var k=0;x&&k<6;k++,x=x.parentNode){if(x.getAttribute&&/excluir|apagar|remover|deletar|askConfirm|zerar|lixeira/i.test((x.getAttribute('onclick')||'')+' '+(x.getAttribute('title')||'')))return true}return false};
    if(a&&a.tagName===r.tag&&texto(a)===r.txt&&!perigo(a)){window.__v219clique={ok:true,txt:r.txt.slice(0,40)};a.click()}else window.__v219clique={ok:false,motivo:!a?'não achou':a.tagName!==r.tag?'outro elemento':texto(a)!==r.txt?'texto mudou':'ação que apaga'}}catch(x){}},ms||0)}
function texto(e){return String(e&&e.textContent||'').replace(/\s+/g,' ').trim().slice(0,160)}
function hashDe(h){return (!h||h==='#'||h==='#/')?'#/home':h}
function leFoto(h){try{var f=JSON.parse(LS.getItem(PK+h)||'null');if(f&&f.html&&f.quem&&f.quem===quem&&Date.now()-f.quando<14*864e5)return f}catch(e){}return null}
function poe(f,hf){try{window.__fotoMostrada={h:hf||hashDe(location.hash),html:f.html,quando:f.quando}}catch(e){}/* escreve a foto na sombra (nenhuma camada do sistema a enxerga) */
  (f.attrs||[]).forEach(function(a){try{if(a[0]==='class')String(a[1]).split(/\s+/).filter(Boolean).forEach(function(c){host.classList.add(c)});else host.setAttribute(a[0],a[1])}catch(e){}});
  sh.innerHTML=(cssG.links||[]).map(function(h){return '<link rel="stylesheet" href="'+String(h).replace(/"/g,'&quot;')+'">'}).join('')+
    '<style>:host{display:block;position:absolute;inset:0;overflow:hidden;background:#f5f5f7}.sb{margin:0;min-height:100%}</style><style>'+cssG.css+'</style>'+
    '<div class="sb">'+f.html+'</div>';
  try{if(f.titulo)document.title=f.titulo}catch(e){}}
try{if(!window.__TREINO&&el.attachShadow){quem=LS.getItem('systaag_quem');cssG=JSON.parse(LS.getItem('systaag_v195_css')||'null');if(quem&&cssG&&cssG.css)foto=leFoto(hashDe(location.hash))}}catch(e){foto=null}
var irPara=null;
if(foto){
  try{
    host=document.createElement('div');host.className='v196h';sh=host.attachShadow({mode:'open'});poe(foto);
    /* um clique num atalho: o endereço muda já (o sistema real abre nessa tela) e, se houver foto dela, aparece na hora */
    host.addEventListener('pointerdown',function(){seg=true;tSeg=performance.now()},true);host.addEventListener('pointercancel',function(){seg=false},true);
    host.addEventListener('click',function(ev){setTimeout(function(){seg=false},0);
      /* v219d: clique feito DEPOIS de a tela real aparecer (a hora do clique é a do dedo, não a da entrega) vale para o que a pessoa vê agora: a tela real */
      if(saiu&&ev.timeStamp>tSaiu){ev.preventDefault();ev.stopPropagation();try{if(capa)capa.style.pointerEvents='none';var real=document.elementFromPoint(ev.clientX,ev.clientY);if(real)real.click()}catch(x){}return}
      var p=ev.composedPath?ev.composedPath():[],alvo=null;for(var i=0;i<p.length&&!alvo;i++){var a=p[i];if(a&&a.getAttribute){var m=/#\/[\w\-\/.:%]*/.exec((a.getAttribute('href')||'')+' '+(a.getAttribute('onclick')||''));if(m)alvo=hashDe(m[0])}}
      ev.preventDefault();ev.stopPropagation();var t=pill&&pill.querySelector('span');try{(window.__v219log=window.__v219log||[]).push({t:Math.round(performance.now()),rota:alvo,alvo:p[0]&&p[0].tagName,pronto:!!window.__tRender})}catch(x){}
      if(!alvo){var el0=p[0]&&p[0].nodeType===1?p[0]:(p[0]&&p[0].parentNode),c=el0?caminho(el0):null;
        if(c){repete={c:c,tag:el0.tagName,txt:texto(el0),quando:Date.now()};try{el0.style.transition='opacity .15s';el0.style.opacity='.55'}catch(x){}}
        if(saiu){daClique(0);return}
        if(!pill){pill=document.createElement('div');pill.className='v196p';pill.innerHTML='<span></span><i><b></b></i>';el.appendChild(pill);t=pill.querySelector('span')}
        if(t)t.textContent=c?'Abrindo…':'Um instante — o sistema está quase pronto…';return}
      irPara=alvo;try{if(hashDe(location.hash)!==alvo)location.hash=alvo}catch(e){}
      if(saiu)return;var f2=leFoto(alvo);if(f2){poe(f2,alvo);if(t)t.textContent='Atualizando os números…'}else if(t)t.textContent='Abrindo essa tela…'},true);
    el.style.background='transparent';
    [].slice.call(el.children).forEach(function(c){if(c!==st&&c!==barraTopo)c.style.display='none'});
    el.appendChild(host);
    try{exata=!!(foto.fp&&foto.fp===fpBase())}catch(e){exata=false}window.__v219exata=exata;
    if(exata){barraTopo.style.display='none'}
    else{pill=document.createElement('div');pill.className='v196p';pill.innerHTML='<span>Atualizando os números…</span><i><b></b></i>';el.appendChild(pill)}
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
  /* v219c: a rolagem do conteúdo passa para a tela real */
  try{if(sh){var mc=sh.getElementById('main'),mr=document.getElementById('main');if(mc&&mr&&mc.scrollTop)mr.scrollTop=mc.scrollTop}}catch(x){}
  e.style.transition='opacity '+(exata?'.08s':'.25s')+' ease';e.style.opacity='0';saiu=true;tSaiu=performance.now();capa=e;/* v219d: a cópia, já invisível, ainda recebe os cliques por 0,35 s — um clique feito enquanto o sistema montava chega agora e é resolvido pela posição que a pessoa VIU (a tela real ainda está a assentar) *//* não sai no meio de um clique (entre apertar e soltar): esse clique se perderia */var tira=function(){if(seg&&performance.now()-tSeg<2000){setTimeout(tira,80);return}try{e.remove()}catch(x){}};setTimeout(tira,350);
  try{if(repete&&!irPara&&porTempo!==true)daClique(60)}catch(x){}
  if(irPara&&hashDe(location.hash)!==irPara)setTimeout(function(){location.hash=irPara},30)}
window.__abrindoSome=some;
try{new MutationObserver(function(){if(H.classList.contains('pronto127'))some()}).observe(H,{attributes:true,attributeFilter:['class']})}catch(x){window.addEventListener('load',function(){setTimeout(some,400)})}
setTimeout(function(){some(true)},30000);
})();
