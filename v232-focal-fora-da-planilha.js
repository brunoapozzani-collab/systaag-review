/* v232 — FOCAL: as 5 unidades que não estão na planilha saem (Bruno, 25/11/2026: "1. Yes")
   Depois da v230 o Focal ficou igual à aba Focal de Inventario_Showroom_Taag_e_Focal.xlsx, menos 5 unidades consignadas que a
   importação de 02/11 trouxe e a planilha de hoje não tem (Inflow ID 28158, 28203, 24805, 28148, 28029). O Bruno mandou tirar.
   Uma vez por Base, só depois da primeira leitura da nuvem. Só sai a unidade que continua como a importação a deixou: no Focal,
   consignada, livre, sem proposta, origem = a planilha. As unidades saem inteiras para S.db._v232.removidas (cópia completa);
   V232.desfazer() devolve. Contagem esperada no Focal: à venda 8 · consignado 335 → 330 · patrimônio 125
   (330 = 331 da planilha − o par Grande Utopia EVO, contado uma vez como nosso — decisão do Bruno de 06/11). */
(function(){
'use strict';
if(window.__v232)return;window.__v232=true;
if(window.__TREINO)return;
const IDS={u_0uign0:'28158',u_4b8nhp:'28203',u_88zi6g:'24805',u_fivcb5:'28148',u_ii81pp:'28029'};
const V232=window.V232={};
const quem=()=>{try{return (window.S&&S.user)||localStorage.getItem('systaag_quem')||''}catch(e){return ''}};
const redesenha=()=>{try{renderMain()}catch(e){}};
const pode=u=>IDS[u.id]&&String(u.inflow_id)===IDS[u.id]&&u.natureza==='consignado'&&u.estado==='livre'&&!u.proposta_id&&/Focal/.test(String(u.local||''))&&String(u.origem||'').indexOf('Inventário Showroom Taag e Focal')>=0;
V232.plano=function(){return (S.db.unidades||[]).filter(pode).map(u=>u.id)};
function aplica(){try{
  if(typeof S==='undefined'||!S.db||!Array.isArray(S.db.unidades)||!S.db.unidades.length)return;
  if(S.db._v232)return;
  if(!S.db._v230||S.db._v230.desfeito)return; /* só depois da v230 */
  if(window.NUVEM_CONFIG&&window.NUVEM_CONFIG.somenteLeitura)return;
  const fora=S.db.unidades.filter(pode);
  const ficou=Object.keys(IDS).filter(id=>!fora.some(u=>u.id===id));
  S.db.unidades=S.db.unidades.filter(u=>!fora.includes(u));
  S.db._v232={em:new Date().toISOString(),por:quem(),removidas:JSON.parse(JSON.stringify(fora)),nao_removidas:ficou};
  try{log('unidades','v232','Focal: '+fora.length+' unidade(s) consignada(s) que não estão na planilha foram retiradas (cópia guardada em _v232)')}catch(e){}
  try{save()}catch(e){console.error('v232 save',e)}
  console.info('v232: Focal —',fora.length,'unidades fora da planilha retiradas',ficou.length?('· não retiradas: '+ficou.join(', ')):'');
  redesenha()}catch(e){console.error('v232',e)}}
V232.desfazer=function(){const r=(S.db._v232&&S.db._v232.removidas)||[];let n=0;r.forEach(u=>{if(!S.db.unidades.some(x=>x.id===u.id)){S.db.unidades.push(u);n++}});
  S.db._v232={desfeito:new Date().toISOString(),por:quem()};try{save()}catch(e){}redesenha();return n};
if(!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url){setTimeout(aplica,4000)}
else if(window.__v172pronto)setTimeout(aplica,1500);
else window.addEventListener('v172-pronta',()=>setTimeout(aplica,1500),{once:true});
})();
