/* v179 — O "APRENDER FAZENDO" DO PÓS-VENDA E DO CRM ACOMPANHA O SISTEMA DE HOJE (Bruno, 12-Nov-2026)
   Conferência pedida pelo Bruno: "pós-venda — não sei se está explicando perfeitamente; e o CRM, com todas as mudanças".
   O que a conferência achou e o que muda no guia (só dados do guia, window.GUIA_CAPS — tudo acontece no Modo treino):
     · CRM — a v173 (10/11) ligou o arquiteto ao escritório dele, e o guia não mostrava: o capítulo "Contas" ganha a seção
       "Arquitetos do escritório" (4 passos): aba Arquitetos › Novo arquiteto deste escritório › a ficha mostra
       "Escritório: PRADO ARQUITETURA ›".
     · Pós-venda — o capítulo só ensinava a garantia (chamado › peça do estoque › fecha como Garantia). O caminho do dia a dia
       do departamento — serviço pago — não aparecia. Ganha a seção "Serviço pago" (20 passos), validada clicando no treino:
       Obras finalizadas › Orçamento › proposta no editor do Comercial (linha Pós-venda) › aceite do cliente › Propostas e
       planos (APROVADA, com o valor do editor) › Novo atendimento (só com proposta aprovada ou plano vigente) › Field Service
       (horários) › relatório › envio interno › Visão de andamento 6/6 › Resultado do Pós-venda.
   As fotos dos capítulos (treino-snaps) foram regravadas com estes passos feitos. */
(function(){'use strict';
if(window.__v179)return;window.__v179=true;
var FR="((document.getElementById('crmFrame')||{}).contentDocument||document.implementation.createHTMLDocument(''))";
var FW="((document.getElementById('crmFrame')||{}).contentWindow||{})";
var PRADO="((S.db.parceiros||[]).find(function(x){return x.nome==='PRADO ARQUITETURA'&&!x.inativo})||{})";
var RAF="(S.db.parceiros||[]).find(function(x){return /RAFAEL LIMA/i.test(x.nome||'')&&!x.inativo})";
var PVP="(S.db.propostas||[]).find(function(p){return p.linha==='posvenda'&&/Revis[aã]o do [aá]udio da sala/i.test(p.nome||'')})";
var AT="(function(){var p="+PVP+";return p?(S.db.at_atendimentos||[]).find(function(c){return c.proposal_id===p.id}):null})()";
var FS="(function(){var c="+AT+";return c?((S.db.at_fsr||{})[c.id]||{}):{}})()";
var REL="(function(){var c="+AT+";return c?(S.db.at_relatorios||[]).find(function(r){return r.card_id===c.id}):null})()";
var vis="function(s){var e=document.querySelector(s);return !!(e&&e.offsetParent)}";

function aplica(){var caps=window.GUIA_CAPS;if(!Array.isArray(caps))return false;
  /* ───── CRM › Contas: Arquitetos do escritório (depois do contato Helena) ───── */
  var contas=caps.find(function(c){return (c.passos||[]).some(function(p){return p.id==='c1p05'})});
  if(contas&&!contas.__v179){contas.__v179=true;
    var i=contas.passos.findIndex(function(p){return p.id==='c1p09'});/* depois do Financeiro: com o Rafael na lista de Indicadores antes da hora, “cadastro” apontaria para a linha errada */
    var M='Relacionamento (CRM) › Parceiros › PRADO ARQUITETURA';
    contas.passos.splice(i+1,0,
     {id:'c1p05a',secao:'Arquitetos do escritório',tela:'#/crmparceiros',menu:M,faca:'Volte a Relacionamento (CRM) › Parceiros, abra a ficha do PRADO ARQUITETURA e clique na aba “Arquitetos (0)”.',digite:[],
      alvo:{css:"button[onclick=\"VIEW.params.tab='arq';render()\"]",texto:'Arquitetos',frame:'crmFrame'},
      porque:'Um escritório pode ter vários arquitetos, e cada arquiteto é um parceiro com ficha própria (histórico, ações, RT). A aba Arquitetos mostra quem pertence a este escritório.',
      pronto:"!!"+FR+".querySelector('button[onclick^=\"openParceiro(null,{escritorio_id\"]')||!!"+RAF},
     {id:'c1p05b',secao:'Arquitetos do escritório',tela:'#/crmparceiros',menu:M+' › Arquitetos',faca:'Clique em “Novo arquiteto deste escritório”.',digite:[],
      alvo:{css:"button[onclick^=\"openParceiro(null,{escritorio_id\"]",texto:'Novo arquiteto deste escritório',frame:'crmFrame'},
      porque:'A ficha abre com “Escritório a que pertence: PRADO ARQUITETURA” já preenchido e o tipo Arquiteto — o vínculo nasce certo, por registro, nunca por nome digitado.',
      pronto:"!!"+FR+".getElementById('f_esc')||!!"+RAF},
     {id:'c1p05c',secao:'Arquitetos do escritório',tela:'#/crmparceiros',menu:M+' › Arquitetos › Novo arquiteto',faca:'Preencha a ficha do arquiteto (o nome vai no primeiro campo) e clique em “Salvar”.',
      digite:[{campo:'Nome do escritório',valor:'Arq. Rafael Lima'},{campo:'Tipo',valor:'ARQUITETO (já vem)'},{campo:'Escritório a que pertence',valor:'PRADO ARQUITETURA (já vem)'},{campo:'Responsável pelo relacionamento',valor:'MARIANA COSTA'},{campo:'Responsável comercial',valor:'MARIANA COSTA'},{campo:'Cidade',valor:'São Paulo'},{campo:'Estado',valor:'SP'},{campo:'Status do relacionamento',valor:'A contatar'},{campo:'RT (%)',valor:'10'},{campo:'Exclusivo com a TAAG?',valor:'Não'}],
      alvo:{css:"button.btn.primary[onclick^=\"salvarParceiro(\"]",texto:'Salvar',frame:'crmFrame'},
      porque:'O Rafael fica ligado ao PRADO pelo registro do escritório. Se ele um dia indicar um cliente sozinho, a RT e o histórico são dele; a lista de Parceiros mostra “Escritório: PRADO ARQUITETURA” sob o nome dele.',
      pronto:"(function(){var r="+RAF+";return !!r&&+r.escritorio_crm_id===+"+PRADO+".crm_id})()"},
     {id:'c1p05d',secao:'Arquitetos do escritório',tela:'#/crmparceiros',menu:'Relacionamento (CRM) › Parceiros › ARQ. RAFAEL LIMA',faca:'Abra a ficha do ARQ. RAFAEL LIMA e, no alto, clique em “Escritório: PRADO ARQUITETURA ›”.',digite:[],
      alvo:{css:"a.v173-a",texto:'PRADO ARQUITETURA',frame:'crmFrame'},
      porque:'O caminho funciona nos dois sentidos: do arquiteto para o escritório (este link) e do escritório para os arquitetos (a aba “Arquitetos (1)”).',
      pronto:"!!"+RAF+"&&[].slice.call("+FR+".querySelectorAll('button[onclick*=\"tab=\\'arq\\'\"]')).some(function(b){return /Arquitetos \\(1\\)/.test(b.textContent)})"}
    );
    contas.objetivo='Criar a conta do arquiteto parceiro (com a RT e como ela é paga), ligar um arquiteto ao escritório dele e criar a conta do cliente, antes de qualquer proposta.';
    contas.aprendeu=(contas.aprendeu||[]).concat(['Arquiteto e escritório são parceiros diferentes, ligados por registro: a ficha do arquiteto aponta para o escritório e o escritório lista os seus arquitetos.']);
  }

  /* ───── Pós-venda: Serviço pago (depois da garantia) ───── */
  var pos=caps.find(function(c){return (c.passos||[]).some(function(p){return p.id==='c6p08'})});
  if(pos&&!pos.__v179){pos.__v179=true;var S1='Serviço pago',PV='Pós-venda';
    pos.titulo='Pós-venda — garantia e serviço pago';
    pos.objetivo='Os dois caminhos do cliente depois da entrega. Garantia: chamado, peça do estoque e fecha como Garantia — o custo cai na obra e não nasce receita. Serviço pago: Orçamento na obra finalizada, proposta no editor do Comercial, aceite do cliente, atendimento, Field Service, relatório e o resultado do Pós-venda.';
    pos.passos.forEach(function(p){if(!p.secao)p.secao='Garantia'});
    pos.passos.push(
     {id:'c6p09',secao:S1,tela:'#/posobras',menu:PV+' › Operação › Obras finalizadas',faca:'No menu do Pós-venda, clique em “Obras finalizadas”.',digite:[],
      alvo:{css:"#subnav a[href=\"#/posobras\"]",texto:'Obras finalizadas',frame:null},
      porque:'Toda obra que a Operação entregou aparece aqui, com três portas: Pendência (volta para a Operação), Garantia (abre um chamado) e Orçamento (um serviço pago).',
      pronto:"location.hash==='#/posobras'||!!"+PVP},
     {id:'c6p10',secao:S1,tela:'#/posobras',menu:PV+' › Obras finalizadas',faca:'Na Obra 1001, clique em “Orçamento”.',digite:[],
      alvo:{css:"#main button[onclick*=\"'orcamento')\"]",texto:'Orçamento',frame:null},
      porque:'O cliente pediu uma revisão do áudio da sala e a troca do amplificador: isso não é garantia, é um serviço que ele paga.',
      pronto:"!!document.querySelector('form[id^=\"copf\"] [data-k=\"nome\"]')||!!"+PVP},
     {id:'c6p11',secao:S1,tela:'#/posobras',menu:PV+' › Obras finalizadas › Orçamento',faca:'Escreva o que o cliente pediu e clique em “Abrir no editor”.',
      digite:[{campo:'O que o cliente pediu',valor:'Revisão do áudio da sala e troca do amplificador'},{campo:'Grupo da solicitação',valor:'OBRAS (já vem)'}],
      alvo:{css:"form[id^=\"copf\"] button[type=\"submit\"]",texto:'Abrir no editor',frame:null},
      porque:'Cliente e obra já vêm da obra finalizada. A proposta do Pós-venda é a MESMA proposta do Comercial (linha Pós-venda): uma tabela só, um editor só.',
      pronto:"!!"+PVP},
     {id:'c6p12',secao:S1,tela:'#/editor',menu:'Comercial › Editor da proposta (linha Pós-venda)',faca:'No quadro azul “bloco”, digite Sala de estar e clique em “Criar”.',digite:[{campo:'Bloco',valor:'Sala de estar'}],
      alvo:{css:"button[onclick*=\"A.addBloco(\"]",texto:'Criar',frame:null},
      porque:'O editor é o mesmo que você usou no capítulo do Comercial: equipamentos e serviços por ambiente.',
      pronto:"(function(){var p="+PVP+";return !!p&&blocosDe(p).some(function(b){return b.nome==='Sala de estar'})})()"},
     {id:'c6p13',secao:S1,tela:'#/editor',menu:'Comercial › Editor da proposta (linha Pós-venda)',faca:'No bloco Sala de estar, clique na aba “Serviços”.',digite:[],
      alvo:{css:"button[onclick*=\"_tab='sv'\"]",texto:'Serviços',frame:null},
      porque:'Serviço de assistência é cobrado em diárias de mão de obra.',
      pronto:"(function(){var p="+PVP+";return !!p&&((blocosDe(p)[0]||{})._tab==='sv'||M.total(p)>0)})()"},
     {id:'c6p14',secao:S1,tela:'#/editor',menu:'Comercial › Editor da proposta (linha Pós-venda)',faca:'Em “Programação (diárias)”, digite 1 e saia do campo.',digite:[{campo:'Programação (diárias)',valor:'1'}],
      alvo:{css:"input[onchange*=\"A.setDias(\"][onchange*=\"'programacao'\"]",texto:'Programação',frame:null},
      porque:'O editor calcula o preço da diária com as margens da empresa: R$ 1.637,00 no TOTAL FINAL. Este é o valor que o Pós-venda vai ver — ninguém redigita.',
      pronto:"(function(){var p="+PVP+";return !!p&&M.total(p)>0})()"},
     {id:'c6p15',secao:S1,tela:'#/editor',menu:'Comercial › Editor da proposta › O cliente aceitou?',faca:'Quando o cliente aceitar, clique em “Sim (sinal + assinatura)”.',digite:[],
      alvo:{css:"button[onclick*=\"A.clienteAprovou(\"]",texto:'Sim (sinal + assinatura)',frame:null},
      porque:'O aceite no editor APROVA a proposta no Pós-venda (é a mesma proposta). Sem aprovação nenhum atendimento pode ser agendado.',
      pronto:"(function(){var p="+PVP+";return !!p&&['aprovada_cliente','vendida','em_obra','concluida'].indexOf(p.estado)>=0})()"},
     {id:'c6p16',secao:S1,tela:'#/pospropostas',menu:PV+' › Operação › Propostas e planos',faca:'No menu da esquerda, clique em “Pós-venda” e depois em “Propostas e planos”.',digite:[],
      alvo:{css:"#subnav a[href=\"#/pospropostas\"]",texto:'Propostas e planos',frame:null},
      porque:'Aqui ficam as propostas AT e os Planos de Serviço. A sua aparece APROVADO, com os R$ 1.637,00 do editor.',
      pronto:"location.hash.indexOf('#/pospropostas')===0||!!"+AT},
     {id:'c6p17',secao:S1,tela:'#/pospropostas',menu:PV+' › Propostas e planos',faca:'Clique no nome da proposta “Revisão do áudio da sala e troca do amplificador”.',digite:[],
      alvo:{css:"#main a[href^=\"#/pospropostas/\"]",texto:'Revisão do áudio',frame:null},
      porque:'A ficha mostra a composição (receita, custos, resultado), a garantia que ainda vale para a obra e os atendimentos da proposta.',
      pronto:"(function(){var p="+PVP+";return !!p&&(location.hash==='#/pospropostas/'+p.id||!!"+AT+")})()"},
     {id:'c6p18',secao:S1,tela:'#/pospropostas',menu:PV+' › Propostas e planos › a proposta',faca:'Clique em “Novo atendimento”.',digite:[],
      alvo:{css:"#main button[onclick^=\"COP.pos.novoAtend(\"]",texto:'Novo atendimento',frame:null},
      porque:'Regra da reunião de validação: nenhum atendimento técnico sem proposta APROVADA ou Plano de Serviço vigente. Por isso só elas aparecem na lista do formulário.',
      pronto:"!!document.querySelector('form[id^=\"copf\"] [data-k=\"services\"]')||!!"+AT},
     {id:'c6p19',secao:S1,tela:'#/pospropostas',menu:PV+' › Propostas e planos › Novo atendimento',faca:'Marque o técnico Marcos, escolha a cobrança, descreva o serviço e clique em “Criar atendimento”.',
      digite:[{campo:'Marcos',valor:'marcado'},{campo:'Cobrança',valor:'Cobrável'},{campo:'Serviços a serem executados',valor:'Revisar o áudio da sala e trocar o amplificador'}],
      alvo:{css:"form[id^=\"copf\"] button[type=\"submit\"]",texto:'Criar atendimento',frame:null},
      porque:'O atendimento entra na agenda do Marcos (Field Service e Cronograma semanal) e abre o chamado (OS) sozinho — o pedido do cliente fica num lugar só.',
      pronto:"(function(){var c="+AT+";return !!c&&(c.technicians||[]).indexOf('Marcos')>=0})()"},
     {id:'c6p20',secao:S1,tela:'#/posfield',menu:PV+' › Operação › Field Service',faca:'No menu do Pós-venda, clique em “Field Service” e clique no cartão “Revisão do áudio da sala…”.',digite:[],
      alvo:{css:"#main .card[onclick^=\"COP.pos.osModal(\"]",texto:'Revisão do áudio',frame:null},
      porque:'Field Service é a tela do técnico: agenda, endereço com rota, check-in, execução e conclusão.',
      pronto:"("+vis+")('button[onclick*=\"COP.pos.horarios(\"]')||!!"+FS+".checkout_at"},
     {id:'c6p21',secao:S1,tela:'#/posfield',menu:PV+' › Field Service › a ordem',faca:'Clique em “Ajustar horários”.',digite:[],
      alvo:{css:"button[onclick*=\"COP.pos.horarios(\"]",texto:'Ajustar horários',frame:null},
      porque:'Na rua, quem faz o check-in e o check-out é o próprio técnico, no celular (botões “Fazer check-in” e “Concluir atendimento”). Como gestor, você registra os horários por aqui.',
      pronto:"!!document.querySelector('form[id^=\"copf\"] [data-k=\"ci\"]')||!!"+FS+".checkout_at"},
     {id:'c6p22',secao:S1,tela:'#/posfield',menu:PV+' › Field Service › Ajustar horários',faca:'Ponha o check-in hoje às 09:00 e o check-out hoje às 12:00 e clique em “Salvar”.',
      digite:[{campo:'Check-in',valor:'hoje, 09:00'},{campo:'Check-out',valor:'hoje, 12:00'}],
      alvo:{css:"form[id^=\"copf\"] button[type=\"submit\"]",texto:'Salvar',frame:null},
      porque:'Com check-in e check-out a ordem fica CONCLUÍDA: as 3 horas viram custo técnico (horas × custo/hora do Marcos) e o relatório é liberado.',
      pronto:FS+".status==='CONCLUIDO'"},
     {id:'c6p23',secao:S1,tela:'#/posfield',menu:PV+' › Field Service',faca:'Clique de novo no cartão “Revisão do áudio da sala…”.',digite:[],
      alvo:{css:"#main .card[onclick^=\"COP.pos.osModal(\"]",texto:'Revisão do áudio',frame:null},
      porque:'A ordem concluída agora oferece o relatório técnico.',
      pronto:"("+vis+")('button[onclick*=\"COP.pos.novoRel(\"]')||!!"+REL},
     {id:'c6p24',secao:S1,tela:'#/posfield',menu:PV+' › Field Service › a ordem',faca:'Clique em “Criar relatório”.',digite:[],
      alvo:{css:"button[onclick*=\"COP.pos.novoRel(\"]",texto:'Criar relatório',frame:null},
      porque:'O relatório já nasce com cliente, endereço, equipe e os horários da ordem.',
      pronto:"!!document.querySelector('form[id^=\"copf\"] [data-k=\"services_performed\"]')||!!"+REL},
     {id:'c6p25',secao:S1,tela:'#/posfield',menu:PV+' › Field Service › Criar relatório',faca:'Em “Serviços realizados”, descreva o que foi feito e clique em “Salvar relatório”.',
      digite:[{campo:'Serviços realizados',valor:'Áudio da sala revisado; amplificador trocado e testado com o cliente'}],
      alvo:{css:"form[id^=\"copf\"] button[type=\"submit\"]",texto:'Salvar relatório',frame:null},
      porque:'É o documento que o cliente e a TAAG recebem do serviço. Ele fica em Pós-venda › Relatórios de O.S.',
      pronto:"!!"+REL},
     {id:'c6p26',secao:S1,tela:'#/posrelos',menu:PV+' › Relatórios de O.S. › o relatório',faca:'No relatório, clique em “Enviar à TAAG (interno)”.',digite:[],
      alvo:{css:"#main button[onclick^=\"COP.pos.enviarInterno(\"]",texto:'Enviar à TAAG (interno)',frame:null},
      porque:'O envio interno fecha o ciclo do atendimento: sem ele, a proposta fica parada em “Relatórios sem envio”.',
      pronto:"!!("+REL+"||{}).sent_at"},
     {id:'c6p27',secao:S1,tela:'#/posandamento',menu:PV+' › Operação › Visão de andamento',faca:'No menu do Pós-venda, clique em “Visão de andamento”.',digite:[],
      alvo:{css:"#subnav a[href=\"#/posandamento\"]",texto:'Visão de andamento',frame:null},
      porque:'As 6 bolinhas mostram onde cada proposta está — aprovada, agendado, check-in, check-out, relatório, enviado. A sua está em 6/6, Concluído; os 4 quadros do alto dizem o que está parado e em qual etapa.',
      pronto:"location.hash==='#/posandamento'"},
     {id:'c6p28',secao:S1,tela:'#/posresultado',menu:PV+' › Gestão › Resultado do Pós-venda',faca:'No menu do Pós-venda, clique em “Resultado do Pós-venda” e veja a Receita do mês.',digite:[],
      alvo:{css:"#subnav a[href=\"#/posresultado\"]",texto:'Resultado do Pós-venda',frame:null},
      porque:'A venda aprovada entra como receita do Pós-venda (R$ 1.637,00) e as 3 horas do Marcos como custo técnico: o resultado do departamento sai das próprias propostas, sem planilha à parte.',
      pronto:"location.hash==='#/posresultado'"}
    );
    pos.aprendeu=['Garantia: a OS herda cliente, obra, proposta e as séries instaladas, e fecha sem receita — o custo cai na obra original.',
      'Serviço pago: a proposta nasce da obra finalizada, no editor do Comercial (linha Pós-venda); o aceite do cliente no editor aprova a proposta no Pós-venda.',
      'Nenhum atendimento sem proposta aprovada ou Plano de Serviço vigente.',
      'Atendimento → Field Service (check-in e check-out) → relatório → envio: a Visão de andamento mostra as 6 etapas.',
      'A receita do serviço e o custo das horas do técnico formam o Resultado do Pós-venda.'];
  }
  return !!(contas&&pos)}
if(!aplica()){var n=0,t=setInterval(function(){if(aplica()||++n>60)clearInterval(t)},300)}
})();
