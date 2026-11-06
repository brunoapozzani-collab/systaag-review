/* v162 · SÉRIES REPETIDAS no Inventário Focal (Bruno, 06/11/2026)
   Regra do Bruno: "se não têm o mesmo nº de série, obviamente não são a mesma peça". A planilha Inventario_Showroom_Taag_e_Focal
   tinha o mesmo nº de série em duas linhas (consignado de 12/2025 e à venda de 09/2026). Decisão: as duas continuam sendo
   unidades separadas. A linha mais antiga fica com o número; a mais nova recebe o número + "-B · série a confirmar"
   (honesto: não inventamos série — quem estiver com a caixa lê a etiqueta e corrige).
     · DIVA à venda (inflow 42801, série A1CTLA15000046) e (inflow 42800, série A1CUEA15000047) → "-B · série a confirmar"
     · 3000 IN WALL DUAL SUB SYSTEM à venda (inflow 41878) → cada parte "-B" + " · série a confirmar"
     · 3000 IN WALL DUAL SUB SYSTEM consignado (inflow 28195): a importação de 02/11 tinha descartado a série da planilha
       ("SUB 3KWD1221219/ SUB 3KWD1221220/ AMP 3KWA12221054E") e posto uma série gerada → volta a série da planilha
   A Grande Utopia EVO NÃO entra aqui: fica como o v161d decidiu (par contado uma vez, como nosso) — confirmado pelo Bruno 06/11.
   Roda uma vez por Base (S.db._v162.series), grava histórico em cada unidade e um registro no log. */
(function(){
'use strict';
const K='series';
const TAG=' · série a confirmar';
const marca=s=>String(s||'').split('/').map(p=>p.trim()+'-B').join('/')+TAG;
function roda(){try{
  if(typeof S==='undefined'||!S.db||!Array.isArray(S.db.unidades)||!S.db.unidades.length)return false;
  if(!S.db._v140inv)return false; /* inventário de 02/11 ainda não carregado nesta Base */
  const F=S.db._v162=S.db._v162||{};if(F[K])return true;
  const U=S.db.unidades;const hoje=new Date().toISOString().slice(0,10);
  const achar=(inflow,re)=>U.find(u=>String(u.inflow_id||'')===String(inflow)&&(!re||re.test(String(u.serie||''))));
  const log={quando:new Date().toISOString(),acoes:[]};
  const troca=(u,nova,motivo)=>{if(!u||u.serie===nova)return;const antes=u.serie;u.serie_antes_v162=antes;u.serie=nova;
    (u.hist=u.hist||[]).push({em:hoje,por:'v162',tipo:'ajuste',titulo:'Nº de série: '+motivo,de:antes,para:nova});
    log.acoes.push({un:u.id,inflow:u.inflow_id,de:antes,para:nova})};
  troca(achar(42801,/A1CTLA15000046/),marca('A1CTLA15000046'),'repetido com o DIVA consignado (inflow 28082) — marcado para conferir na etiqueta');
  troca(achar(42800,/A1CUEA15000047/),marca('A1CUEA15000047'),'repetido com o DIVA consignado (inflow 28082) — marcado para conferir na etiqueta');
  const sub=achar(41878,/3KWD1221219/);
  if(sub&&!/-B/.test(sub.serie))troca(sub,marca(sub.serie),'repetido com o 3000 IN WALL DUAL SUB consignado (inflow 28195) — marcado para conferir na etiqueta');
  const subC=achar(28195);
  if(subC&&!/3KWD1221219/.test(String(subC.serie||'')))troca(subC,'SUB3KWD1221219/SUB3KWD1221220/AMP3KWA12221054E','série da planilha restaurada (a importação de 02/11 tinha descartado)');
  F[K]=log;try{if(typeof window.log==='function')window.log('unidades','v162','Séries repetidas no Focal (DIVA ×2, 3000 In-Wall Dual Sub): '+log.acoes.length+' ajuste(s) — "-B · série a confirmar"')}catch(e){}
  try{save()}catch(e){}return true}catch(e){console.error('v162 séries',e);return true}}
let n=0;const iv=setInterval(()=>{if(roda()||++n>60)clearInterval(iv)},1000);
})();
