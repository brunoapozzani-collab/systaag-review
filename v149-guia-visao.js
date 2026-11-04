/* v149 — o capítulo "Visão CEO" do Aprender fazendo acompanha o Início de hoje (04-Nov-2026)
   Os passos 2–8 apontavam para cartões da antiga tela Diretoria (#vd_k_resultado, #vd_k_receber, .vd .seg…) que não existem
   mais: a Visão executiva do Início (v149, 7 blocos) usa cartões .vx-tile que abrem gavetas (V130_open), títulos h4 e links de bloco (V130_go).
   Achado ao rodar o guia de ponta a ponta para gravar os capítulos prontos do Modo treino. */
(function(){
'use strict';
if(window.__v149guia)return;window.__v149guia=true;
function aplica(){const caps=window.GUIA_CAPS;if(!Array.isArray(caps))return false;const c=caps.find(x=>(x.passos||[]).some(p=>p.id==='c8p02'));if(!c||c.__v149)return false;c.__v149=true;
  const P=(id,faca,css,texto,pronto,porque)=>{const p=c.passos.find(x=>x.id===id);if(!p)return;p.tela='#/home';p.menu='Início › Visão executiva';p.faca=faca;p.alvo={css,texto,frame:null};p.pronto=pronto;if(porque)p.porque=porque};
  P('c8p02','Role até a seção “Comercial” e clique no cartão “Realizado”.',".vx-tile[onclick=\"V130_open('vendAno')\"]",'Realizado',"!!(window.V130&&V130.dr==='vendAno')",'Cada número da Visão executiva é uma porta: a gaveta mostra as propostas que formam o valor — a venda do CEX está lá.');
  P('c8p03','Feche a gaveta (×) e, em “Financeiro”, clique no cartão “Contas a receber · 30 dias”.',".vx-tile[onclick=\"V130_open('v149:lanc','receber|*')\"]",'Contas a receber',"!!(window.V130&&V130.dr==='v149:lanc'&&/receber/.test(String(V130.arg||'')))",'Os títulos que entram nos próximos 30 dias — o sinal e as parcelas do CEX, os mesmos de Financeiro › Hoje.');
  P('c8p04','Feche a gaveta e, em “Relacionamento”, clique em “Ações do CRM ›”.',"h4[onclick=\"V130_open('tar')\"]",'Ações do CRM',"!!(window.V130&&V130.dr==='tar')",'As próximas ações combinadas com os escritórios — a reunião com a Helena nasceu no CRM e aparece aqui.');
  P('c8p05','Feche a gaveta e, no alto de “Comercial”, clique no link “Comercial › Gestão ›”.',"a.vx-lk[onclick=\"V130_go('#/gestao')\"]",'Comercial › Gestão',"location.hash.indexOf('#/gestao')===0",'Do resumo para a tela completa: cada bloco do Início tem o seu “›”.');
  P('c8p06','Volte ao Início (a casinha) e, em “Financeiro”, clique no cartão “Caixa daqui a 30 dias”.',".vx-tile[onclick=\"V130_go('#/fluxo')\"]",'Caixa daqui a 30 dias',"location.hash.indexOf('#/fluxo')===0",'Caixa + a receber − a pagar: o número do cartão é a última linha do Fluxo de caixa.');
  const p7=c.passos.find(x=>x.id==='c8p07');if(p7){p7.faca='Abra Base de dados › Listas & regras › Regras & metas e, em “Metas anuais”, troque a meta de “Comercial TAAG · São Paulo (470)” para 3000000.';p7.digite=[{campo:'Comercial TAAG · São Paulo (470) — Meta (R$)',valor:'3000000'}];p7.alvo={css:"input[onchange^=\"V140_meta('taag_sp'\"]",texto:'',frame:null};p7.pronto="+S.db.metas.taag_sp===3000000";p7.porque='A meta vive na Base (uma fonte só); o Início lê daqui. Com 3 milhões o percentual da venda do CEX fica visível no bloco Meta do ano.'}
  const p8=c.passos.find(x=>x.id==='c8p08');if(p8){p8.faca='Volte ao Início e, em “Comercial”, veja a barra “TAAG · São Paulo”: meta, realizado no ano, % e o que falta.';p8.menu='Início › Visão executiva › Comercial';p8.alvo={css:".vx149-bar[onclick=\"V130_metaGo('taag','SP')\"]",texto:'São Paulo',frame:null};p8.pronto="location.hash==='#/home'&&+S.db.metas.taag_sp===3000000&&/Metas por linha|Meta 2026/.test(document.body.innerText)"}
  return true}
if(!aplica()){let n=0;const t=setInterval(()=>{if(aplica()||++n>40)clearInterval(t)},300)}
})();
