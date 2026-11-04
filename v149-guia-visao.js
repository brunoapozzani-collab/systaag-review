/* v149 — o capítulo "Visão CEO" do Aprender fazendo acompanha o Início de hoje (04-Nov-2026)
   Os passos 2–6 apontavam para cartões da antiga tela Diretoria (#vd_k_resultado, #vd_k_receber, .vd .seg…) que não existem
   mais: a Visão executiva do Início usa cartões .vx-tile que abrem gavetas (V130_open) e links de seção (V130_go).
   Achado ao rodar o guia de ponta a ponta para gravar os capítulos prontos do Modo treino. */
(function(){
'use strict';
if(window.__v149guia)return;window.__v149guia=true;
function aplica(){const caps=window.GUIA_CAPS;if(!Array.isArray(caps))return false;const c=caps.find(x=>(x.passos||[]).some(p=>p.id==='c8p02'));if(!c||c.__v149)return false;c.__v149=true;
  const P=(id,faca,css,texto,pronto,porque)=>{const p=c.passos.find(x=>x.id===id);if(!p)return;p.tela='#/home';p.menu='Início › Visão executiva';p.faca=faca;p.alvo={css,texto,frame:null};p.pronto=pronto;if(porque)p.porque=porque};
  P('c8p02','Role até “Fluxo de caixa” e clique no cartão “Entra em 13 semanas”.',".vx-tile[onclick=\"V130_open('flx30','ent13')\"]",'Entra em 13 semanas',"!!(window.V130&&V130.dr==='flx30'&&V130.arg==='ent13')",'Cada número da Visão executiva é uma porta: a gaveta mostra os títulos que formam o valor — a parcela do CEX está lá.');
  P('c8p03','Feche a gaveta (×) e clique no cartão “Sai em 13 semanas”.',".vx-tile[onclick=\"V130_open('flx30','sai13')\"]",'Sai em 13 semanas',"!!(window.V130&&V130.dr==='flx30'&&V130.arg==='sai13')",'O que a empresa vai pagar nas próximas 13 semanas: folha, fornecedores (a NF da FOCAL está aqui), fixos.');
  P('c8p04','Feche a gaveta e, no alto de “Fluxo de caixa”, clique no link “DRE ›”.',"a.vx-lk[onclick=\"V130_go('#/dre')\"]",'DRE',"location.hash.indexOf('#/dre')===0",'Do resumo para a tela completa: cada seção do Início tem o seu “›”.');
  P('c8p05','Volte ao Início (a casinha) e, na seção “Estoque”, clique em “Estoque ›”.',"a.vx-lk[onclick=\"V130_go('#/epainel')\"]",'Estoque',"location.hash.indexOf('#/epainel')===0",'O painel do Estoque com os mesmos números que a diretoria vê no Início — uma fonte só.');
  P('c8p06','Volte ao Início e, em “Fluxo de caixa”, clique em “Fluxo de caixa ›”.',"a.vx-lk[onclick=\"V130_go('#/fluxo')\"]",'Fluxo de caixa',"location.hash.indexOf('#/fluxo')===0",'As 13 semanas, semana a semana: entradas, saídas e o saldo.');
  const p7=c.passos.find(x=>x.id==='c8p07');if(p7){p7.faca='Abra Base de dados › Listas & regras › Regras & metas e, em “Metas anuais”, troque a meta de “Comercial TAAG · São Paulo (470)” para 3000000.';p7.digite=[{campo:'Comercial TAAG · São Paulo (470) — Meta (R$)',valor:'3000000'}];p7.alvo={css:"input[onchange^=\"V140_meta('taag_sp'\"]",texto:'',frame:null};p7.pronto="+S.db.metas.taag_sp===3000000";p7.porque='A meta vive na Base (uma fonte só); o Início lê daqui. Com 3 milhões o percentual da venda do CEX fica visível no bloco Meta do ano.'}
  const p8=c.passos.find(x=>x.id==='c8p08');if(p8){p8.pronto="location.hash==='#/home'&&+S.db.metas.taag_sp===3000000&&document.body.innerText.includes('Meta do ano')"}
  return true}
if(!aplica()){let n=0;const t=setInterval(()=>{if(aplica()||++n>40)clearInterval(t)},300)}
})();
