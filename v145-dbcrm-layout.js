/* v145 · Base › Relacionamento (CRM): a página volta a ter o layout da Base (Bruno, 03/11/2026)
   A auditoria de layout achou três causas, todas por causa das "Ferramentas do CRM" (a tela de configurações do CRM
   embutida no fim da página, num iframe):
   1. ao embutir o iframe, o CRM liga o modo tela-cheia (body.crm-full), feito para as telas do próprio CRM: o menu
      lateral da Base some e o conteúdo perde a margem — por isso a página parecia "outra aplicação";
   2. dentro do iframe o menu do CRM é escondido, mas a grade continua com a coluna dele (232px): o conteúdo cai nessa
      coluna estreita — o De/Para aparecia espremido e com os botões "Vincular / criar" cortados;
   Aqui: na Base o modo tela-cheia não liga e o conteúdo do iframe usa a largura toda. */
(function(){
'use strict';
if(window.__v145)return;window.__v145=true;
const naBase=()=>/^#\/dbcrm(\/|$)/.test(location.hash||'');
function semTelaCheia(){if(naBase()&&document.body.classList.contains('crm-full'))document.body.classList.remove('crm-full')}
try{new MutationObserver(semTelaCheia).observe(document.body,{attributes:true,attributeFilter:['class']})}catch(e){}
window.addEventListener('hashchange',semTelaCheia);
function dentro(){try{const f=document.getElementById('crmFrame');const d=f&&f.contentDocument;if(!d||!d.head||!d.body)return null;
    if(d.body.classList.contains('v136-embed')&&!d.getElementById('v145-css')){const s=d.createElement('style');s.id='v145-css';
      s.textContent='body.v136-embed main{grid-column:1/-1!important;width:100%!important;max-width:none!important}';d.head.appendChild(s)}
    return {f,d}}catch(e){return null}}
(function loop(){if(naBase()){semTelaCheia();dentro()}setTimeout(loop,500)})();
semTelaCheia();
try{const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);semTelaCheia();setTimeout(semTelaCheia,0);setTimeout(()=>{semTelaCheia();dentro()},300);return r}}catch(e){}
})();
