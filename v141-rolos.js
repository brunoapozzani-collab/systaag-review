/* v141.2 — ROLOS DE CABO SÃO PRODUTOS COMO OS OUTROS (Bruno, 03-Nov-2026)
   "they are all products inside the umbrella of livre inside RJ": o rolo de cabo entra na situação dele
   (Livre, Separado, Não à venda…) e no lugar dele, nas mesmas tabelas e na mesma lista de produtos.
   · index.html: nodeUnits (a fonte de todas as contagens por lugar) deixou de excluir rastreio 'medido'.
   · aqui: só a correção de dado — rolos do inventário de 02/11 que entraram com 1 m (o arquivo dizia "1 cx",
     sem metragem) passam a ter a metragem do nome do produto (ex.: Cabo CAT-6e cinza 300 mts → 300 m),
     com registro no histórico do rolo.
   A linha "Rolos de cabo", a lista separada e a página #/rolos da v141/v141.1 foram retiradas. */
(function(){
'use strict';
if(window.__v141)return;window.__v141=true;
if(typeof S==='undefined'||!S.db)return;
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const med=pid=>T_(()=>isMedido(pid),false);

/* v141.4 — os números da tabela do Estoque abrem o lugar certo, já filtrado.
   Antes: (1) a camada que transforma a linha inteira em link levava qualquer clique para o 1º link da linha
   (clicar no Livre de RJ abria São Paulo); (2) o caminho #/sit/… redirecionava e acabava no Início.
   Agora cada número vai direto para a página do lugar com a situação filtrada (S.lugarSit). */
if(typeof SCREENS==='object'&&typeof SCREENS.estoque==='function'&&!SCREENS.estoque.__v141d){const _es=SCREENS.estoque;
 SCREENS.estoque=function(){let h=_es.apply(this,arguments);try{if(typeof h!=='string')return h;
  const i=h.indexOf('O QUE TEMOS');if(i<0)return h;const j=h.indexOf('</table>',i);if(j<0)return h;let seg=h.slice(i,j);
  seg=seg.replace(/href="#\/sit\/([a-z_]+)\/([^"]+)"/g,(m,k,lid)=>{const id=decodeURIComponent(lid);const href=T_(()=>__lugarHref(L.path(id)),null);if(!href)return m;return `href="${href}" onclick="S.lugarSit={node:'${id}',k:'${k}'}"`});
  seg=seg.replace(/<tr(?![^>]*no-door)/g,'<tr class="no-door"').replace(/<tr class="no-door" class="/g,'<tr class="no-door ');
  h=h.slice(0,i)+seg+h.slice(j)}catch(e){console.error('v141 links',e)}return h};SCREENS.estoque.__v141d=1}
/* o filtro da página do lugar entende também as situações da tabela do Estoque (terceiro / empresa = a mesma conta da tabela) */
T_(()=>{if(typeof window.__fMatch==='function'&&!window.__fMatch.__v141){const _f=window.__fMatch;window.__fMatch=function(u,f){if(f==='terceiro'||f==='empresa'||f==='alocado'){const s=T_(()=>situacao(u),null);return s===f}return _f.apply(this,arguments)};window.__fMatch.__v141=1}});
function corrigeMetros(){try{let n=0;
  (S.db.unidades||[]).forEach(u=>{if(!med(u.produto_id))return;if(!/02\/11\/2026/.test(u.origem||''))return;const p=T_(()=>get('produtos',u.produto_id),null)||{};const m=String(p.nome||'').match(/(\d{2,4})\s*(m|mts|metros)\b/i);if(!m)return;const real=+m[1];
    if(+u.metros_ini===1&&+u.metros<=1&&real>1){u.metros=real;u.metros_ini=real;(u.hist=u.hist||[]).push({em:T_(()=>today(),''),por:'v141',tipo:'ajuste',titulo:'Metragem corrigida: 1 m → '+real+' m (o arquivo trazia "1 cx" sem metros; a metragem vem do nome do produto)'});n++}});
  if(n){S.db._v141_cat6={em:T_(()=>today(),''),corrigidos:((S.db._v141_cat6||{}).corrigidos||0)+n};T_(()=>log('unidades','v141','Rolos do inventário de 02/11 com metragem corrigida: '+n));T_(()=>save())}}catch(e){console.error('v141 metros',e)}}
corrigeMetros();document.addEventListener('DOMContentLoaded',()=>setTimeout(corrigeMetros,0));setTimeout(corrigeMetros,1500);
})();
