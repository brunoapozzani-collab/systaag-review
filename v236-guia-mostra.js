/* =====================================================================================================
   v236 · APRENDER FAZENDO — “ME MOSTRE ONDE” NO PIPELINE E NO CAPÍTULO COMERCIAL (Bruno, 26/11/2026)
   O motor (v124-guia.js, bloco v236) agora abre a tela, prepara o que esconde o alvo e diz quando o passo já foi feito.
   Aqui ficam os dados de cada passo do capítulo Comercial:
   · Pipeline (3 passos, um clique cada): o texto diz o cartão (cliente) e o botão exatos; “Me mostre onde” limpa os filtros do
     quadro, abre o painel do negócio CEX quando o botão está nele e, se o passo já foi feito, diz em que coluna o cartão está agora
     (depois de “Montar proposta de Sistema” ele vai para “Proposta desenvolvida”). “← Voltar” no treino devolve o cartão à coluna
     “Desenvolver proposta”.
   · Passos na proposta: “ir” abre a proposta do CEX; “prepara” abre a etapa certa (ex.: Pagamento e NF) quando o botão está nela.
   · Passos de olhar (miscelânea, diárias, contagem): só contam com “Vi ✓”.
   Só dados do guia — nada é gravado na Base.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v236g)return;window.__v236g=true;
const CEX="((S.db.propostas||[]).find(x=>x.sigla==='CEX'&&x.estado!=='cancelada'&&!x.opcao_de)||{})";
const CEXB="((S.db.propostas||[]).find(x=>x.sigla==='CEX'&&x.opcao_de&&x.opcao_de==="+CEX+".id)||{})";
const CARTAO='Cliente Exemplo — Residência São Paulo';
const card={css:'main .card.rowlink[onclick^="S.deal="]',texto:CARTAO,frame:null};
const coluna="GUIA.colunaDe('"+CARTAO+"')";
const IR="'#/editor/'+"+CEX+".id";
const NA=k=>"(()=>{const p="+CEX+";if(p.id&&S.np&&S.np.passo&&S.np.passo[p.id]!=='"+k+"')NP.go(p.id,'"+k+"')})()";
const P={
 c1p19:{faca:'No Pipeline, coluna “Desenvolver proposta”: clique no cartão “'+CARTAO+'”.',
   prepara:"GUIA.limpaFiltros();if(S.deal&&S.deal!==(((S.db.negociacoes||[]).find(x=>x.codinome==='CEX'))||{}).id){S.deal=null;renderMain()}",
   feito:{tela:'#/pipeline',alvo:card,prepara:'GUIA.limpaFiltros()',diz:"'o painel do cartão “"+CARTAO+"” já está aberto à direita; o cartão está na coluna “'+("+coluna+"||'?')+'”'",voltou:'o painel do negócio foi fechado'}},
 c1p20:{faca:'No painel do cartão “'+CARTAO+'”, em “RT — quem recebe”, clique em “Confirmar” (ao lado de “Sugerido pela origem do negócio: PRADO ARQUITETURA”).',
   menu:'Comercial › Pipeline › cartão “'+CARTAO+'” › RT — quem recebe',prepara:"GUIA.abreNegocio('CEX')",
   feito:{tela:'#/pipeline',alvo:card,prepara:'GUIA.limpaFiltros()',diz:"'a PRADO ARQUITETURA já recebe 10% de RT neste negócio; o cartão está na coluna “'+("+coluna+"||'?')+'”'",voltou:'a RT voltou a “Sugerido”, sem confirmar'}},
 c1p21:{faca:'No mesmo painel do cartão “'+CARTAO+'”, clique em “Montar proposta de Sistema →”.',
   menu:'Comercial › Pipeline › cartão “'+CARTAO+'”',prepara:"GUIA.abreNegocio('CEX')",
   porque:'Cria a proposta e a obra do cliente CEX, já com a RT de 10% da PRADO. O cartão passa sozinho para a coluna “Proposta desenvolvida”.',
   feito:{tela:'#/pipeline',alvo:card,prepara:'GUIA.limpaFiltros()',diz:"'a proposta já foi montada e o cartão “"+CARTAO+"” passou para a coluna “'+("+coluna+"||'?')+'”'",voltou:'a proposta saiu e o cartão voltou para “Desenvolver proposta”'}},
 c1n03:{ver:true},c1p30:{ver:true},c1n06:{ver:true},
 c1p33:{prepara:NA('pag')},c1p34:{prepara:NA('pag')},c1p36:{prepara:NA('pag')},c1p38:{prepara:NA('pag')},c1p39:{prepara:NA('pag')},
 c1p24:{prepara:NA('cad')},
 c1n04:{prepara:NA('sis')},c1n05:{prepara:NA('sis')+";(()=>{const p="+CEX+";if(p.id&&S.np&&S.np.aberto&&!S.np.aberto['cont:'+p.id]){S.np.aberto['cont:'+p.id]=true;renderMain()}})()"},
 c1p26:{prepara:NA('sis')},c1p27:{prepara:NA('sis')},c1p28:{prepara:NA('sis')},c1p29:{prepara:NA('sis')},c1n02:{prepara:NA('sis')},c1p31:{prepara:NA('sis')},
};
function aplica(){const caps=window.GUIA_CAPS;if(!Array.isArray(caps))return false;const c=caps.find(x=>(x.passos||[]).some(p=>p.id==='c1p19'));if(!c)return false;if(c.__v236)return true;c.__v236=true;
  c.passos.forEach(p=>{const x=P[p.id];if(x){Object.keys(x).forEach(k=>{p[k]=x[k]});if(x.ver)p.pronto="GUIA.vi('"+p.id+"')"}
    /* passos dentro da proposta: “Me mostre onde” abre a proposta do CEX (a Opção B, nos passos dela) */
    if(p.tela==='#/editor'&&!p.ir)p.ir=/^c1n1[34]$/.test(p.id)?"'#/editor/'+"+CEXB+".id":IR});
  return true}
if(!aplica()){let n=0;const t=setInterval(()=>{if(aplica()||++n>50)clearInterval(t)},200)}
})();
