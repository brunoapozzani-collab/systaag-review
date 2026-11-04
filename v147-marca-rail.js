/* v147 (04/11/2026) — Marca "taag" + atalhos dos departamentos no Início
   1. Marca: o texto SYSTAAG do topo e o logo do Início viram o wordmark "taag" (taag-wordmark.png); o fundo animado (globo/escamas) fica como era.
   2. Atalhos: só no Início, uma régua fixa à direita com o resumo de cada departamento — clica, vai; o menu Início traz de volta.
   Bruno, 04/11/2026: "go and come back, easy and fast". */
(function(){'use strict';
try{
  var css=''+
  /* marca no topo */
  '.brand{letter-spacing:0;font-size:0}'+
  '.brand-img{height:16px;width:auto;display:block;filter:invert(1);opacity:.96}'+
  '.brand::after{font-size:16px;line-height:1;margin-left:8px}'+
  '.inicio-logo{width:clamp(220px,44vw,620px)}'+
  /* régua de atalhos */
  '#v147-rail{display:none;position:fixed;right:24px;bottom:198px;top:auto;width:184px;box-sizing:border-box;max-height:calc(100vh - 290px);overflow-y:auto;z-index:10000;flex-direction:column;gap:2px;padding:10px;border-radius:18px;'+
    'background:var(--card,rgba(255,255,255,.86));border:1px solid var(--bd,rgba(0,0,0,.08));box-shadow:0 10px 30px rgba(0,0,0,.08);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%)}'+
  'html[data-inicio] #v147-rail{display:flex}'+
  '#v147-rail .t{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mut,#6b7280);padding:4px 0 8px 12px}'+
  '#v147-rail a{display:grid;grid-template-columns:22px 1fr;align-items:center;column-gap:10px;width:100%;box-sizing:border-box;height:46px;padding:0 12px;border-radius:12px;color:var(--tx,#111);text-decoration:none;font:600 12.5px var(--font-sans,system-ui);white-space:nowrap;transition:background .12s,transform .12s}'+
  '#v147-rail a i{font-size:16px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:var(--dc)}'+'#v147-rail a span{display:block;line-height:1.15}'+
  '#v147-rail a:hover{background:var(--card-hover,#f1f5f9);transform:translateX(-2px)}'+
  '#v147-rail a small{display:block;font-weight:500;font-size:10.5px;color:var(--mut,#6b7280);line-height:1.1}'+
  
  /* o conteúdo do Início não fica por baixo da régua */
  '@media (min-width:1100px){html[data-inicio] #v130_root{padding-right:190px}}'+
  /* no celular a régua vira uma faixa embaixo, rolável */
  '@media (max-width:760px){#v147-rail{top:calc(var(--v130-top,60px) + 10px);bottom:auto;left:72px;right:10px;width:auto;max-height:none;flex-direction:row;overflow-x:auto;gap:2px;padding:6px;border-radius:14px}#v147-rail a{display:flex;width:auto;height:auto}'+
    '#v147-rail .t{display:none}#v147-rail a{padding:8px 10px;flex-direction:column;gap:3px;font-size:10.5px}#v147-rail a small{display:none}}';
  var st=document.createElement('style');st.id='v147-css';st.textContent=css;document.head.appendChild(st);

  var TABS=[
    ['#/crmgestao','bi-people','CRM','Painel de Gestão','#be185d'],
    ['#/gestao','bi-briefcase','Comercial','Gestão','#2a78d6'],
    ['#/copainel','bi-tools','Operação','Painel','#475569'],
    ['#/prjpainel','bi-pencil-square','Projetos','Painel','#b45309'],
    ['#/posvisao','bi-headset','Pós-venda','Visão geral','#ca8a04'],
    ['#/epainel','bi-box-seam','Estoque','Painel Geral','#008300'],
    ['#/fhoje','bi-wallet2','Financeiro','Hoje','#0f766e'],
    ['#/pchome','bi-people-fill','Pessoas','Visão','#7c3aed']
  ];
  function E(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function build(){
    if(document.getElementById('v147-rail'))return;
    var r=document.createElement('nav');r.id='v147-rail';r.setAttribute('aria-label','Resumo de cada departamento');
    r.innerHTML='<div class="t">Resumos</div>'+TABS.map(function(t){
      return '<a href="'+t[0]+'" style="--dc:'+t[4]+'" title="'+E(t[2])+' › '+E(t[3])+'"><i class="bi '+t[1]+'"></i><span>'+E(t[2])+'<small>'+E(t[3])+'</small></span></a>'}).join('')+
      '';
    document.body.appendChild(r);
  }
  if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
  /* se algum render recriar o body, garante a régua */
  window.addEventListener('hashchange',function(){setTimeout(build,0)});
}catch(e){console.error('v147 marca/rail',e)}
})();
