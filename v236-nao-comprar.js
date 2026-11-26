/* v236 — "FORNECIDO PELO CLIENTE" / "NÃO COMPRAR" NÃO ENTRA NO QUE FALTA COMPRAR (Bruno, 26/11/2026)
   A linha continua na proposta (a lista do que foi vendido fica completa), com a etiqueta, mas a quantidade dela
   sai da demanda do Estoque: não aparece em "a comprar", nem em cotações, nem no valor "itens vendidos ainda sem compra".
   Antes, o status só mudava a etiqueta da linha — a conta continuava pedindo a compra.
   Ponto único: Q.demanda (a mesma fonte de Q.compute / Q.porProposta / Início). Nada é gravado na Base por esta camada. */
(function(){'use strict';
  if(window.__v236)return;window.__v236=true;
  var FORA=/^(fornecido pelo cliente|n[aã]o comprar)$/i;
  function T(f,d){try{return f()}catch(e){return d}}
  var V=window.V236={
    fora:function(l){return !!(l&&FORA.test(String(l.status_manual||'').trim()))},
    /* quantidade, na proposta pr, do produto pid que NÃO é para comprar */
    qtdFora:function(pr,pid){var p=T(function(){return get('propostas',pr)},null);if(!p)return 0;var q=0;
      T(function(){blocosDe(p).forEach(function(b){(b.itens||[]).forEach(function(l){if((l.substituto||l.produto_id)===pid&&V.fora(l))q+=(+l.qtd||0)})})},0);return q}
  };
  if(typeof Q==='object'&&Q&&typeof Q.demanda==='function'&&!Q.demanda.__v236){
    var f=Q.demanda;
    Q.demanda=function(){var r=f.apply(Q,arguments);if(!Array.isArray(r))return r;var out=[];
      r.forEach(function(d){var x=V.qtdFora(d.pr,d.pid);if(!x){out.push(d);return}var q=(+d.qtd||0)-x;if(q>0)out.push(Object.assign({},d,{qtd:q}))});
      return out};
    Q.demanda.__v236=1;
  }
})();
