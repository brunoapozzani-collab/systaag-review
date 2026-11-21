/* v195 — ABRIR JÁ (Bruno, 21/11/2026)
   Pedido: "um usuário novo esperou quase 3 minutos só para ver a tela de escolher o perfil — tem de abrir como o Google".
   Medido no Chrome dele (computador "novo", 21/11): 20 s até o sistema ficar pronto numa boa ligação — o tempo vai em
   baixar ~4,5 MB (código + foto da nuvem) e montar ~100 camadas. Num computador mais fraco / ligação fraca vira minutos.
   O que muda (sem mexer em nenhum dado nem em nenhuma tela):
     · a porta de entrada (loader.html) desenha o "Quem é você?" NA HORA (menos de 1 s), com a lista de pessoas guardada
       — a pessoa escolhe o nome enquanto o sistema baixa por trás, em vez de olhar para um "Abrindo o sistema…";
     · quem já escolheu antes vê "Abrindo o SYSTAAG · Olá, <nome>" com uma barra de progresso de verdade.
   Esta camada só faz duas coisas, no fim da abertura:
     1. guarda NESTE computador (localStorage "qv0:lista") a lista exata que o "Quem é você?" mostra — a próxima abertura
        desenha-a sem esperar o sistema; computador novo usa a lista publicada junto com o site (build.mjs);
     2. mantém o espelho "qv0:quem" (quem está neste computador) igual à escolha da v166 — inclusive em Trocar pessoa / Sair.
   QUEM0_CALC é a mesma regra da v166 (grupos, ordem da Gestão, cor da v194) — o build.mjs usa esta mesma função. */
(function(){
'use strict';
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()};
/* usuarios / pessoas = as listas da Base (S.db.usuarios, S.db.pessoas) → [{g:grupo, its:[{l:login,n:nome,c:cor,i:iniciais}]}] */
function QUEM0_CALC(usuarios,pessoas){
  usuarios=usuarios||[];pessoas=pessoas||[];
  var P={};pessoas.forEach(function(p){if(p&&p.id)P[p.id]=p});
  var GRUPOS=[['Gestão',['diretoria','ti']],['Comercial',['comercial','prevendas','marketing']],['Estoque e compras',['estoque']],['Financeiro e administração',['financeiro','admin']],['Operação',['chefetec','obras','gestao']],['Técnicos',['tecnico']],['Projetos',['projetos']],['Pós-venda',['posvenda']],['Outros',[]]];
  var FAM=[['Gestão','#475569',/diretoria|desenvolvimento|tecnologia|gestao|gerencia/],['Comercial','#0071e3',/comercial|pre vendas|marketing/],['Estoque','#16a34a',/estoque|compras/],['Financeiro','#d97706',/financeir|rh|pessoas|cultura|facilities|administra/],['Operação','#7c3aed',/obras|operac|programac|tecnic/],['Projetos','#0891b2',/projet|acustica/],['Pós-venda','#dc2626',/pos venda/],['Focal','#be185d',/focal/]];
  var PERFIL_FAM={diretoria:'Gestão',ti:'Gestão',gestao:'Gestão',comercial:'Comercial',prevendas:'Comercial',marketing:'Comercial',estoque:'Estoque',financeiro:'Financeiro',admin:'Financeiro',chefetec:'Operação',obras:'Operação',tecnico:'Operação',projetos:'Projetos',posvenda:'Pós-venda'};
  var CORES=['#0071e3','#be185d','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626','#475569'];
  var familiaCor=function(p){var d=norm(p.dep||p.departamento||'');var f=null;for(var i=0;i<FAM.length;i++)if(FAM[i][2].test(d)){f=FAM[i];break}
    if(!f){var u=usuarios.find(function(x){return x.pessoa_id===p.id});var k=u&&PERFIL_FAM[u.perfil];if(k)f=FAM.find(function(x){return x[0]===k})}return f?f[1]:'#6e6e73'};
  var cor=function(u){var p=P[u.pessoa_id];if(p)return p.cor||familiaCor(p);var h=0,l=String(u.login);for(var i=0;i<l.length;i++)h=(h*31+l.charCodeAt(i))&0xffff;return CORES[h%CORES.length]};
  var nomeCurto=function(u){return u.nome||((P[u.pessoa_id]||{}).nome)||u.login};
  var ini=function(n){return String(n||'?').split(' ').filter(Boolean).map(function(x){return x[0]}).join('').slice(0,2).toUpperCase()};
  var ORDEM_GESTAO=function(u){var n=norm(nomeCurto(u)+' '+u.login);return /\bcesar\b/.test(n)?0:/\brodolfo\b/.test(n)?1:/\bbruno\b/.test(n)?2:9};
  var L=usuarios.filter(function(u){return u&&u.login&&u.ativo!==false}),usados={};
  return GRUPOS.map(function(g){var its=L.filter(function(u){if(usados[u.login])return false;var ok=g[1].length?g[1].indexOf(u.perfil)>=0:true;if(ok)usados[u.login]=1;return ok})
    .sort(function(a,b){if(g[0]==='Gestão'){var oa=ORDEM_GESTAO(a),ob=ORDEM_GESTAO(b);if(oa!==ob)return oa-ob}return nomeCurto(a).localeCompare(nomeCurto(b),'pt-BR')});
    return {g:g[0],its:its.map(function(u){var n=nomeCurto(u);return {l:u.login,n:n,c:cor(u),i:ini(n)}})}}).filter(function(g){return g.its.length});
}
window.QUEM0_CALC=QUEM0_CALC;
if(typeof S==='undefined'||!S.db)return;

var LS=window.localStorage,KEY='systaag_quem';
function guardaLista(){try{var l=QUEM0_CALC(S.db.usuarios,S.db.pessoas);if(l.length)LS.setItem('qv0:lista',JSON.stringify({quando:Date.now(),lista:l}))}catch(e){console.warn('v195 lista',e)}}
function espelho(){try{var q=LS.getItem(KEY);if(q)LS.setItem('qv0:quem',q);else LS.removeItem('qv0:quem')}catch(e){}}
/* Trocar pessoa / Sair / escolher: o espelho acompanha a v166 */
try{if(window.QUEM){var _e=QUEM.entrar,_s=QUEM.sair;
  QUEM.entrar=function(){var r=_e.apply(this,arguments);espelho();return r};
  QUEM.sair=function(){var r=_s.apply(this,arguments);espelho();return r}}}catch(e){}
espelho();
/* ───── v196 (21/11/2026): a FOTO DO INÍCIO ─────
   Pedido do Bruno: "Início usável em ~2 s" em TODA abertura. O sistema leva ~6–8 s a montar-se (mais de 200 camadas);
   enquanto isso, a tela de abertura (v195-tela.js) mostra a última foto do Início deste computador — guardada aqui,
   já com os números da nuvem, só quando o Início está à vista e sem janela aberta. A foto é da pessoa que está neste
   computador; outra pessoa (ou foto com mais de 14 dias) → não aparece. Vive em systaag_v195_tela (a base local). */
var H=document.documentElement;
function fotoInicio(){try{
  if(window.__TREINO||document.hidden)return;
  var k='';try{k=route().k}catch(e){}if(k&&k!=='home')return;
  if(document.getElementById('abrindo-sistema')||document.querySelector('.modal.show,dialog[open],#qv'))return;
  var quem=LS.getItem(KEY);if(!quem)return;
  var b=document.body.cloneNode(true);
  var vivos=[].slice.call(document.body.querySelectorAll('canvas')),copias=[].slice.call(b.querySelectorAll('canvas'));
  copias.forEach(function(c,i){var v=vivos[i];try{var r=v.getBoundingClientRect();if(!r.width||!r.height){c.remove();return}var cs=getComputedStyle(v),im=document.createElement('img');
    im.src=v.toDataURL('image/webp',0.82);['position','top','left','right','bottom','width','height','opacity','zIndex','transform','pointerEvents','display','maxWidth'].forEach(function(p){im.style[p]=cs[p]});im.className=c.className;c.replaceWith(im)}catch(e){c.remove()}});
  [].forEach.call(b.querySelectorAll('script,noscript,iframe,template,#abrindo-sistema,#boot127,#nuvemChip,.toast,.modal:not(.show)'),function(e){e.remove()});
  var css=[].slice.call(document.querySelectorAll('style')).map(function(s){return s.textContent}).join('\n')
    .replace(/(?<![\w.#-])(?::root|html)(?![\w-])/g,':host').replace(/:host((?:\[[^\]]*\]|\.[\w-]+)+)/g,':host($1)').replace(/(?<![\w.#-])body(?![\w-])/g,'.sb');
  var links=[].slice.call(document.querySelectorAll('link[rel=stylesheet]')).map(function(l){return l.href}).filter(Boolean);
  var attrs=[].slice.call(H.attributes).filter(function(a){return /^data-|^class$/.test(a.name)}).map(function(a){return [a.name,a.value]});
  var html=b.innerHTML;if(html.length+css.length>3e6)return;
  LS.setItem('systaag_v195_tela',JSON.stringify({quem:quem,quando:Date.now(),html:html,css:css,links:links,attrs:attrs}));
}catch(e){console.warn('v196 foto do Início',e)}}
var fotoDepois=function(ms){setTimeout(function(){(window.requestIdleCallback||function(f){setTimeout(f,0)})(fotoInicio,{timeout:4000})},ms)};
window.addEventListener('v172-pronta',function(){fotoDepois(4000)});if(window.__v172pronto)fotoDepois(4000);
window.addEventListener('hashchange',function(){var k='';try{k=route().k}catch(e){}if(!k||k==='home')fotoDepois(2500)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&window.__v172pronto)fotoInicio()});
setInterval(function(){if(window.__v172pronto)fotoInicio()},300000);

/* a lista só é guardada DEPOIS da primeira leitura da nuvem (v172-pronta): antes disso S.db ainda é a semente embutida
   (medido 21/11: 74 nomes antigos em vez dos 36 reais) — guardar cedo faria a próxima abertura mostrar a lista errada */
var depoisDaNuvem=function(){setTimeout(function(){guardaLista();espelho()},500)};
if(window.__v172pronto)depoisDaNuvem();else window.addEventListener('v172-pronta',depoisDaNuvem);
setInterval(function(){if(window.__v172pronto)guardaLista()},300000);
})();
