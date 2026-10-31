/* v127 · uma tela só ao abrir (30/10/2026)
   Bruno: ao clicar em "Começar do zero" a página recarregava e mostrava primeiro uma tela antiga (o Início original, com
   "Resetar dados" e contadores de exemplo) e só depois a tela de verdade — parecia que o sistema "se montava de novo".
   O arquivo é carregado em camadas; agora uma tela de abertura cobre tudo até a última camada terminar, e só então o
   sistema aparece — já no estado final. */
(function(){'use strict';let feito=false;
  const ok=()=>{if(feito)return;feito=true;document.documentElement.classList.add('pronto127')};
  if(document.readyState==='complete')setTimeout(ok,300);else window.addEventListener('load',()=>setTimeout(ok,300));
  /* uma imagem lenta não pode prender a tela de abertura: no máximo 4 s depois de o código terminar */
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ok,4000));else setTimeout(ok,4000);
})();
