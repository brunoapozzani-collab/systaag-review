/* =====================================================================================================
   v186 · REGRA DE SUBSTITUIÇÃO DE EQUIPAMENTO: O CLIENTE PAGA O PREÇO CONTRATADO (Bruno, 12/11/2026)
   Item da reunião de 06/11: "estruturar as regras de substituição de equipamentos". Regra do Bruno (12/11):
   quando um produto já vendido é trocado por outro (falta, descontinuado, especificação errada), o PREÇO DO CLIENTE NÃO
   MUDA — a diferença de custo fica na margem, e a linha original continua visível, marcada como substituída.
   O sistema já fazia isso por padrão (substituição operacional e Ret/Troc com política "mantido"); o que muda:
     · as outras duas políticas ("cliente recebe a diferença (crédito)" e "acordo específico") não podem mais ser escolhidas;
     · uma troca que já tinha crédito ou acordo antes desta regra continua como estava (histórico) e aparece marcada;
     · trocar de volta para "mantido" continua permitido (desfaz o crédito, como antes).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v186)return;window.__v186=true;
const MSG='Regra da TAAG (12/11/2026): na troca de um produto vendido o cliente paga o preço contratado — a diferença de custo fica na margem.';
function liga(){let ok=true;
  if(typeof A==='object'&&typeof A.retrocPolitica==='function'){if(!A.retrocPolitica.__v186){const f=A.retrocPolitica;
      A.retrocPolitica=function(pr,i,pol){if(pol!=='mantido')throw new RuleError(MSG);return f.apply(this,arguments)};A.retrocPolitica.__v186=true}}else ok=false;
  if(typeof SCREENS==='object'&&typeof SCREENS.remuneracao==='function'){if(!SCREENS.remuneracao.__v186){const g=SCREENS.remuneracao;
      SCREENS.remuneracao=function(){let h=g.apply(this,arguments);if(typeof h!=='string'||h.indexOf('A.retrocPolitica(')<0)return h;
        /* tira só as opções NÃO escolhidas; uma troca antiga com crédito/acordo continua mostrando o que tinha */
        h=h.replace(/<option value="(?:credito|acordo)" >[^<]*<\/option>/g,'');
        h=h.replace(/(<option value="(?:credito|acordo)" selected>)([^<]*)(<\/option>)/g,'$1$2 — escolhida antes da regra de 12/11$3');
        h=h.replace('<b>Ret/Troc — o que a obra entregou no lugar do contratado</b>','<b>Ret/Troc — o que a obra entregou no lugar do contratado</b> <span class="chip ok" style="font-size:10.5px" title="'+MSG+'">regra: cliente paga o contratado</span>');
        return h};
      SCREENS.remuneracao.__v186=true;Object.keys(g).forEach(k=>{try{SCREENS.remuneracao[k]=g[k]}catch(e){}})}}else ok=false;
  return ok}
if(!liga()){let n=0;const t=setInterval(()=>{if(liga()||++n>40)clearInterval(t)},250)}
})();
