/* v178 — A PROPOSTA DO PÓS-VENDA FALA COM O EDITOR (12-Nov-2026)
   Achado ao conferir o "Aprender fazendo" do Pós-venda: a proposta do Pós-venda nasce no editor do Comercial (Obras
   finalizadas › Orçamento), mas o cartão do Pós-venda guardava uma cópia tirada no momento da criação:
     · o cliente dizia "Sim" no editor e o Pós-venda continuava "EM ANÁLISE" — e sem aprovação não se agenda atendimento;
     · o editor somava R$ 1.637,00 e o cartão mostrava "CORTESIA · R$ 0".
   Duas respostas para a mesma proposta. Regra do Bruno: um lugar só é a verdade — a proposta é a do editor.
   Aqui, a cada desenho de tela, para toda proposta da linha Pós-venda:
     · aprovação = o estado da proposta (enviada → EM ANÁLISE; aprovada/vendida/em obra/concluída → APROVADO; perdida → RECUSADO).
       O "Aprovar"/"Recusar" do Pós-venda já gravam esse mesmo estado, então os dois lados ficam sempre iguais;
     · valor = o total do editor, quando a proposta tem itens no editor (as que vieram da planilha CONTROLE DE AT não têm
       itens e mantêm o valor da planilha — nada delas muda).
   Só lê e acerta o cadastro AT da própria proposta; nenhuma outra tabela é tocada. */
(function(){'use strict';
if(window.__v178pv)return;window.__v178pv=true;
if(typeof S==='undefined'||!S||!S.db){console.error('v178: S.db ausente');return}
var APROV=function(e){return e==='perdida'?'RECUSADO':['aprovada_cliente','vendida','em_obra','concluida'].indexOf(e)>=0?'APROVADO':'EM ANALISE'};
function totalEditor(p){try{if(typeof M==='undefined'||!M.total)return 0;var t=+M.total(p)||0;return t>0?Math.round(t*100):0}catch(e){return 0}}
function sync(){var mud=0;try{(S.db.propostas||[]).forEach(function(p){if(!p||p.linha!=='posvenda'||!p.at||p.origem)return;
  var ap=APROV(p.estado);if(p.at.approval_status!==ap){p.at.approval_status=ap;mud++}
  var v=totalEditor(p);if(v>0&&p.at.proposal_type!=='SERVICE_PLAN'&&p.at.proposal_value_cents!==v){p.at.proposal_value_cents=v;mud++}})}catch(e){console.error('v178 sync',e)}
  if(mud){try{if(window.S&&S.changed&&S.changed.add)S.changed.add('propostas')}catch(e){}}return mud}
window.V178PV={sync:sync,aprov:APROV};
var _r=window.render;if(typeof _r==='function'){window.render=function(){sync();return _r.apply(this,arguments)}}
sync();
})();
