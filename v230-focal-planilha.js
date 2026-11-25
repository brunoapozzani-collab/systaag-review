/* v230 — FOCAL IGUAL À PLANILHA (Bruno, 23–25/11/2026: "make sure it is exactly like the excel sheet")
   O que estava errado: a importação de 02/11 (v140) gravou como "à venda · livre" 166 unidades do Inventário SP › Focal que a
   planilha Inventario_Showroom_Taag_e_Focal.xlsx (aba Focal) diz serem CONSIGNADO (117) ou PATRIMÔNIO (49); outras 44 estavam
   como consignado e são patrimônio, e 3 (MU-SO QB) estavam como consignado e são à venda. Resultado na tela: 171 "à venda" no
   Focal, quando a planilha tem 8.
   O que esta camada faz, UMA vez por Base, só depois da primeira leitura da nuvem:
     · para cada unidade do Focal vinda dessa planilha, acha a linha pelo Inflow ID e grava a NATUREZA da planilha;
     · o estado acompanha só onde a natureza obriga: patrimônio → estado "patrimonio"; quem deixou de ser patrimônio → "livre".
       Consignado continua com estado "livre" DE PROPÓSITO — é o que deixa a peça consignada da loja entrar numa venda da linha
       Focal (FX1.vendavelNaLoja); para as propostas TAAG ela já não conta como livre (naoVenda olha a natureza);
     · unidades em outro estado (separado, entregue, baixado…) não têm o estado tocado;
     · as 7 linhas com "Proposta vinculada" na planilha recebem a anotação (campo proposta_planilha + obs + histórico). Não vira
       reserva: a planilha não diz se a peça foi vendida, entregue ou só comprada naquele número — isso é do Bruno responder;
     · unidade do Focal cujo Inflow ID não está na planilha de hoje fica como está e entra na lista "fora_da_planilha".
   Desfazer: S.db._v230_undo.lista guarda o valor anterior de cada unidade mexida; V230.desfazer() devolve tudo.
   TAAG Showroom não entra: confere com a planilha (as 2 "a mais" em patrimônio são 2 linhas da planilha com a quantidade em branco). */
(function(){
'use strict';
if(window.__v230)return;window.__v230=true;
if(window.__TREINO)return;
const D=window.V230_FOCAL;if(!D||!D.nat)return;
const NAT={v:'venda',c:'consignado',p:'patrimonio'};
const NOME={venda:'à venda',consignado:'consignado',patrimonio:'patrimônio'};
const ORIGEM='Inventário Showroom Taag e Focal';
const V230=window.V230={};
const doFocal=u=>u&&String(u.origem||'').indexOf(ORIGEM)>=0&&/Focal/.test(String(u.local||''))&&!/TAAG Showroom/.test(String(u.local||''));
const quem=()=>{try{return (window.S&&S.user)||localStorage.getItem('systaag_quem')||''}catch(e){return ''}};
const redesenha=()=>{try{renderMain()}catch(e){}};

/* a conta, sem gravar nada: o que mudaria */
V230.plano=function(){
  const U=(S.db.unidades||[]).filter(doFocal);const muda=[],fora=[],semInflow=[];const vistos={};
  U.forEach(u=>{const k=String(u.inflow_id==null?'':u.inflow_id);if(!k){semInflow.push(u.id);return}
    const n=NAT[D.nat[k]];if(!n){fora.push({id:u.id,inflow:k,serie:u.serie,natureza:u.natureza});return}
    vistos[k]=1;
    let est=u.estado;
    if(n==='patrimonio'){if(est==='livre'||est==='consignado')est='patrimonio'}
    else if(est==='patrimonio'||est==='consignado')est='livre';
    const v=D.vinculo[k]||null;const jaVinc=v&&u.proposta_planilha===v[0];
    if(u.natureza!==n||u.estado!==est||(v&&!jaVinc))muda.push({u,n,est,v:jaVinc?null:v})});
  const faltam=Object.keys(D.nat).filter(k=>!vistos[k]);
  return {unidades:U.length,muda,fora,semInflow,faltam}};

V230.contagem=function(){const c={venda:0,consignado:0,patrimonio:0};(S.db.unidades||[]).filter(doFocal).forEach(u=>{if(u.estado==='baixado')return;c[u.natureza]=(c[u.natureza]||0)+1});return c};

function aplica(){try{
  if(typeof S==='undefined'||!S.db||!Array.isArray(S.db.unidades)||!S.db.unidades.length)return;
  if(S.db._v230)return;                 /* já feito nesta Base (o registro vem da nuvem para todos os computadores) */
  if(!S.db._v140inv)return;             /* inventário de 02/11 ainda não está nesta Base */
  if(window.NUVEM_CONFIG&&window.NUVEM_CONFIG.somenteLeitura)return; /* cópia de teste: não grava */
  const antes=V230.contagem();const P=V230.plano();
  if(P.unidades<400){console.warn('v230: só '+P.unidades+' unidades do Focal nesta Base — não mexo (esperava ~468)');return}
  const hoje=new Date().toISOString().slice(0,10);const undo=[];
  P.muda.forEach(({u,n,est,v})=>{
    const a={id:u.id,natureza:u.natureza,estado:u.estado};if('dono' in u)a.dono=u.dono;if(v){a.obs=u.obs===undefined?null:u.obs}
    undo.push(a);
    const de=NOME[u.natureza]||u.natureza;
    if(u.natureza!==n||u.estado!==est){
      (u.hist=u.hist||[]).push({em:hoje,por:'v230',tipo:'ajuste',titulo:'Natureza conforme a planilha do Focal: '+de+' → '+NOME[n],de:de+' · '+u.estado,para:NOME[n]+' · '+est});
      u.natureza=n;u.estado=est;
      if(n==='consignado'){if(!u.dono)u.dono=u.fornecedor||'Focal (consignado)'}else if('dono' in u)delete u.dono}
    if(v){u.proposta_planilha=v[0];if(v[1])u.cliente_planilha=v[1];
      const nota='Planilha: vinculada à proposta '+v[0]+(v[1]?' · '+v[1]:'');
      if(String(u.obs||'').indexOf(nota)<0)u.obs=(u.obs?u.obs+' · ':'')+nota;
      (u.hist=u.hist||[]).push({em:hoje,por:'v230',tipo:'ajuste',titulo:nota})}});
  const depois=V230.contagem();
  S.db._v230_undo={em:new Date().toISOString(),lista:undo}; /* objeto (não lista com ids) para subir à nuvem como UM registro */
  S.db._v230={em:new Date().toISOString(),por:quem(),fonte:D.fonte,planilha:D.total,unidades:P.unidades,mexidas:undo.length,antes,depois,
    fora_da_planilha:P.fora,sem_inflow:P.semInflow,linhas_sem_unidade:P.faltam};
  try{log('unidades','v230','Focal igual à planilha: '+undo.length+' unidade(s) com a natureza corrigida — à venda '+antes.venda+' → '+depois.venda+', consignado '+antes.consignado+' → '+depois.consignado+', patrimônio '+antes.patrimonio+' → '+depois.patrimonio)}catch(e){}
  try{save()}catch(e){console.error('v230 save',e)}
  console.info('v230: Focal igual à planilha —',undo.length,'unidades',antes,'→',depois);
  redesenha()}catch(e){console.error('v230',e)}}

V230.desfazer=function(){const m={};((S.db._v230_undo&&S.db._v230_undo.lista)||[]).forEach(a=>m[a.id]=a);let n=0;
  (S.db.unidades||[]).forEach(u=>{const a=m[u.id];if(!a)return;u.natureza=a.natureza;u.estado=a.estado;
    if('dono' in a)u.dono=a.dono;else delete u.dono;
    if('obs' in a){if(a.obs===null)delete u.obs;else u.obs=a.obs;delete u.proposta_planilha;delete u.cliente_planilha}
    u.hist=(u.hist||[]).filter(h=>h.por!=='v230');n++});
  S.db._v230={desfeito:new Date().toISOString(),por:quem()};delete S.db._v230_undo;try{save()}catch(e){}redesenha();return n};

/* sem nuvem (arquivo aberto sozinho) aplica na hora; com nuvem, só depois da primeira leitura dela — senão a cópia da nuvem
   passaria por cima da correção e a marca local impediria de refazer */
if(!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url){setTimeout(aplica,2500)}
else if(window.__v172pronto)setTimeout(aplica,600);
else window.addEventListener('v172-pronta',()=>setTimeout(aplica,600),{once:true});
})();
