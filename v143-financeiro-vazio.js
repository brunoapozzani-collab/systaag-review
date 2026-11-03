/* v143 · SÓ O QUE É REAL NO DINHEIRO (Bruno, 03/11/2026)
   "Tira o dinheiro fictício. Vou subir as informações certas do Financeiro de verdade; por enquanto o ERP mostra só o
   Comercial (metas e vendas)." O Início mostrava um Resultado por linha e um caixa montados com lançamentos de
   demonstração (as propostas 13401 HRA, F-0219 CNG e o Pós-venda de exemplo, saldos bancários de exemplo, despesas fixas
   de exemplo). Aqui o Financeiro fica vazio até a carga real:
   · lançamentos, NFs, extrato, dívidas, despesas, fechamentos e o razão do FinCore (fin.*) saem
   · saldos das contas e do caixa = 0 (as contas continuam cadastradas, só sem saldo inventado)
   · imobilizado, financiamentos, contratos e o orçamento de despesas fixas de exemplo = 0 (as categorias ficam)
   · propostas de demonstração nunca contam como venda confirmada no Financeiro
   Uma cópia da base de antes fica na Base › Mapa de entidades › Zona de risco (restaurável). */
(function(){
'use strict';
if(window.__v143)return;window.__v143=true;
if(typeof S==='undefined'||!S.db)return;
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const ARR=['lancamentos','nfhist','nfsaida','nf_import','despesas','desp_import','fechamentos','dividas','extrato','nf_v50','rt_v50','aportes_mov'];
function limpar(db){if(db._v143fin||db.af113_zero)return 0;let n=0;
  T_(()=>{if(window.V139&&typeof V139.guardar==='function')V139.guardar('antes de tirar o dinheiro de demonstração (v143)')});
  ARR.forEach(k=>{if(Array.isArray(db[k])&&db[k].length){n+=db[k].length;db[k]=[]}});
  T_(()=>{const F=db.fin;if(F){['lancamentos','conferencias','dividas','fc_falhas'].forEach(k=>{if(Array.isArray(F[k])&&F[k].length){n+=F[k].length;F[k]=[]}});if(Array.isArray(F.plano)&&F.plano.length){n+=F.plano.length;F.plano=[]}F.fechados={}}});
  T_(()=>{(db.contas||[]).forEach(c=>{if(+c.saldo||+c.saldoInicial){c.saldo=0;c.saldoInicial=0;n++}});if(db.caixa&&typeof db.caixa==='object'){try{db.caixa.saldo=0}catch(e){}db.caixa.inicial=0}db.aportes=0});
  T_(()=>{const pf=db.params&&db.params.fin;if(pf){if(pf.imobilizado&&typeof pf.imobilizado==='object')Object.keys(pf.imobilizado).forEach(k=>{pf.imobilizado[k]=0});pf.financiamentos=0}});
  /* orçamento de despesas fixas de exemplo (aluguel, energia, softwares…): as categorias ficam, o valor vai a 0 até a carga real */
  T_(()=>{((db.cad&&db.cad.fixos)||[]).forEach(f=>{if(+f.orcado){f.orcado=0;n++}});T_(()=>{const fx=PF().fixos;if(fx&&typeof fx==='object')Object.keys(fx).forEach(k=>{if(+fx[k]){fx[k]=0;n++}})});const pf=db.params&&db.params.fixos;if(pf&&typeof pf==='object')Object.keys(pf).forEach(k=>{if(k!=='Folha'&&+pf[k]){pf[k]=0;n++}})});
  T_(()=>{const FA=db.fac;if(FA&&Array.isArray(FA.contratos)&&FA.contratos.length){n+=FA.contratos.length;FA.contratos=[]}});
  /* propostas de demonstração: a marca de "confirmada pelo Financeiro" sai junto com o dinheiro delas */
  (db.propostas||[]).forEach(p=>{if(p.demo&&p.fin&&p.fin.confirmada){p.fin=Object.assign({},p.fin,{confirmada:false,demo:true});n++}});
  db._v143fin={quando:T_(()=>today(),new Date().toISOString().slice(0,10)),removidos:n};
  T_(()=>log('lancamentos','v143','Financeiro de demonstração retirado ('+n+' registros) — aguardando a carga do Financeiro real'));
  T_(()=>save());return n}
function portas(){
  T_(()=>{if(typeof FN==='object'&&typeof FN.vendidas==='function'&&!FN.vendidas.__v143){const f=FN.vendidas;FN.vendidas=function(){return f.apply(this,arguments).filter(p=>!(p&&p.demo))};FN.vendidas.__v143=1}});
  T_(()=>{if(typeof F==='object'&&F&&typeof F.vendidas==='function'&&!F.vendidas.__v143){const f=F.vendidas;F.vendidas=function(){return f.apply(this,arguments).filter(p=>!(p&&p.demo))};F.vendidas.__v143=1}})}
function boot(){try{limpar(S.db);portas()}catch(e){console.error('v143',e)}}
boot();
try{const _rm=window.renderMain;window.renderMain=function(){try{if(!S.db._v143fin&&!S.db.af113_zero)boot();portas()}catch(e){}return _rm.apply(this,arguments)}}catch(e){}
try{if(typeof renderMain==='function')renderMain()}catch(e){}
})();
