/* v128 · "Começar do zero" e "Entrar como" gravam na hora, antes de recarregar (30/10/2026) */
(function(){'use strict';
  if(typeof MG!=='undefined'&&MG&&typeof MG.zerar==='function'){const z=MG.zerar;
    MG.zerar=function(c){if(!c)return z.apply(MG,arguments);window.__gravarJa=true;try{if(window.save&&window.save.agora)window.save.agora()}catch(e){}return z.apply(MG,arguments)}}
})();
