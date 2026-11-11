/* v175 — O "APRENDER FAZENDO" ACOMPANHA A v174 (Bruno, 11-Nov-2026)
   A v174 mudou duas áreas: Pessoas (Avaliação de desempenho no lugar de Metas e avaliação) e Financeiro (Ativos internos,
   Empréstimos e Contratos passaram a ser Financeiro › Patrimônio). O guia ensina as duas:
     · capítulo "Financeiro": ganha a seção "Patrimônio" no fim (7 passos) — comprar um ativo, emprestar, devolver;
     · capítulo novo, o último: "Pessoas — a avaliação de desempenho" (12 passos) — quem avalia quem, as 3 metas,
       o check-in, os 3 blocos da avaliação, fechar e a calibração.
   Só dados do guia (window.GUIA_CAPS). Tudo acontece no Modo treino (cofre treino:*): a base real nunca é tocada.
   A "foto" para pular direto para o capítulo novo é treino-snaps/cap11.json (o treino com os 12 capítulos anteriores feitos). */
(function(){'use strict';
if(window.__v175)return;window.__v175=true;
var DE="(AVD._de('Carla Mendes')||{})";
function aplica(){var caps=window.GUIA_CAPS;if(!Array.isArray(caps)||typeof window.AVD!=='object')return false;
  /* ───── Financeiro › Patrimônio ───── */
  var fin=caps.find(function(c){return (c.passos||[]).some(function(p){return p.id==='c5p13'})});
  if(fin&&!fin.__v175){fin.__v175=true;
    var ATV="((S.db.fac&&S.db.fac.ativos)||[]).find(function(a){return a.nome==='Escada de alumínio 7 degraus'})";
    var EMP="((S.db.fac&&S.db.fac.emprestimos)||[]).find(function(e){var a="+ATV+";return a&&e.ativo_id===a.id})";
    fin.passos.push(
     {id:'c5p14',secao:'Patrimônio',tela:'#/dre',menu:'Financeiro › Patrimônio',faca:'No menu do Financeiro, clique em “Patrimônio”.',digite:[],alvo:{css:"#subnav a[href='#/fcativos']",texto:'Patrimônio',frame:null},
      porque:'Ativos internos, Empréstimos e Contratos são patrimônio e dinheiro: saíram de Pessoas e vivem no Financeiro, numa entrada só.',pronto:"location.hash.indexOf('#/fcativos')===0||!!"+ATV},
     {id:'c5p15',secao:'Patrimônio',tela:'#/fcativos',menu:'Financeiro › Patrimônio › Ativos internos',faca:'Clique em “Novo ativo”.',digite:[],alvo:{css:"#main button[onclick='PCX.novoAtivo()']",texto:'Novo ativo',frame:null},
      porque:'Tudo que a empresa tem e não está à venda (ferramentas, móveis, equipamentos) entra aqui.',pronto:"!!document.querySelector(\"form[id^='copf']\")||!!"+ATV},
     {id:'c5p15b',secao:'Patrimônio',tela:'#/fcativos',menu:'Financeiro › Patrimônio › Ativos internos',faca:'Preencha e clique em “Salvar”.',digite:[{campo:'Nome',valor:'Escada de alumínio 7 degraus'},{campo:'Categoria',valor:'Ferramenta'},{campo:'Custo (R$)',valor:'480'}],alvo:{css:"form[id^='copf'] button[type=submit]",texto:'Salvar',frame:null},
      porque:'O ativo nasce com o custo de compra — é esse o valor do patrimônio da empresa.',pronto:"!!"+ATV},
     {id:'c5p16',secao:'Patrimônio',tela:'#/fcativos',menu:'Financeiro › Patrimônio › Empréstimos',faca:'No alto da tela, clique na aba “Empréstimos”.',digite:[],alvo:{css:"#main .avd-tabs a[href='#/fcemprest']",texto:'Empréstimos',frame:null},
      porque:'As três telas do Patrimônio ficam lado a lado: Ativos internos · Empréstimos · Contratos.',pronto:"location.hash.indexOf('#/fcemprest')===0||!!"+EMP},
     {id:'c5p17',secao:'Patrimônio',tela:'#/fcemprest',menu:'Financeiro › Patrimônio › Empréstimos',faca:'Clique em “Emprestar”.',digite:[],alvo:{css:"#main button[onclick='PCX.emprestar()']",texto:'Emprestar',frame:null},
      porque:'Quem pegou o quê, quando, e quando devolve.',pronto:"!!document.querySelector(\"form[id^='copf']\")||!!"+EMP},
     {id:'c5p17b',secao:'Patrimônio',tela:'#/fcemprest',menu:'Financeiro › Patrimônio › Empréstimos',faca:'Escolha a escada e quem pegou, e clique em “Salvar”.',digite:[{campo:'Ativo',valor:'Escada de alumínio 7 degraus'},{campo:'Quem pegou',valor:'Marcos'}],alvo:{css:"form[id^='copf'] button[type=submit]",texto:'Salvar',frame:null},
      porque:'Um empréstimo em aberto trava a saída do colaborador em Pessoas › Entrada e saída: ninguém sai devendo ferramenta.',pronto:"!!"+EMP},
     {id:'c5p18',secao:'Patrimônio',tela:'#/fcemprest',menu:'Financeiro › Patrimônio › Empréstimos',faca:'Na linha da escada, clique em “Devolveu”.',digite:[],alvo:{css:"#main button[onclick^='PCX.devolver']",texto:'Devolveu',frame:null},
      porque:'A devolução fecha o empréstimo com a data e quem recebeu — e o ativo volta a ficar livre para o próximo.',pronto:"(function(){var e="+EMP+";return !!(e&&e.devolvida)})()"});
    if(Array.isArray(fin.aprendeu))fin.aprendeu.push('Patrimônio (ativos, empréstimos, contratos) é do Financeiro — não de Pessoas.')}
  /* ───── Pessoas — a avaliação de desempenho ───── */
  if(!caps.some(function(c){return c.__v175pes})){
    var T='#/pcmetas',M='Pessoas › Avaliação de desempenho';
    caps.push({__v175pes:true,titulo:'Pessoas — a avaliação de desempenho',depto:'Pessoas & Cultura',
     objetivo:'Definir quem avalia quem, registrar as 3 metas da Carla, marcar o check-in, fazer a avaliação nos 3 blocos, fechar e ver a calibração — o ciclo de 4 meses inteiro.',
     passos:[
      {id:'cPp01',tela:T,menu:M,faca:'Abra Pessoas (barra da esquerda) e clique em “Avaliação de desempenho”.',digite:[],alvo:{css:"#subnav a[href='#/pcmetas']",texto:'Avaliação de desempenho',frame:null},
       porque:'O ano tem 3 ciclos (jan–abr, mai–ago, set–dez). Cada ciclo tem 3 momentos: registro de metas, check-in e avaliação.',pronto:"location.hash.indexOf('#/pcmetas')===0"},
      {id:'cPp02',tela:T,menu:M,faca:'Clique em “Quem avalia quem”.',digite:[],alvo:{css:"#main button[onclick='AVD.gestores()']",texto:'Quem avalia quem',frame:null},
       porque:'Antes de avaliar, o sistema precisa saber quem é o gestor de cada pessoa.',pronto:"!!(document.getElementById('avd-gest')||{}).open||"+DE+".gestor==='Rodolfo Liviero'"},
      {id:'cPp03',tela:T,menu:M+' › Quem avalia quem',faca:'Na área “Projetos”, abra o seletor “Gestor da área inteira…” e escolha Rodolfo Liviero.',digite:[],alvo:{css:".avd-ga[data-avd-area='Projetos'] select",texto:'',frame:null},
       porque:'O gestor fica gravado na ficha da pessoa, na Base — uma fonte só. Sem gestor, só Gestor e RH conseguem avaliar.',pronto:DE+".gestor==='Rodolfo Liviero'"},
      {id:'cPp04',tela:T,menu:M+' › Quem avalia quem',faca:'Clique em “Pronto”.',digite:[],alvo:{css:"#avd-gest .avd-sh-f button.btn-apple",texto:'Pronto',frame:null},
       porque:'Cada escolha já foi salva na hora. O aviso amarelo da tela mostra quantas pessoas ainda faltam.',pronto:"!(document.getElementById('avd-gest')||{}).open&&"+DE+".gestor==='Rodolfo Liviero'"},
      {id:'cPp05',tela:T,menu:M,faca:'Na linha da Carla Mendes, clique em “Registrar metas”.',digite:[],alvo:{css:"#main tr[data-avd='Carla Mendes'] button",texto:'',frame:null},
       porque:'As 4 bolinhas da linha são os momentos do ciclo: Metas, Check-in, Autoavaliação e Avaliação.',pronto:"AVD._aberta()==='Carla Mendes'||"+DE+".metas===true"},
      {id:'cPp06',tela:T,menu:M+' › Carla Mendes',faca:'Escreva as 3 metas, cada uma com indicador e prazo, e clique em “Registrar metas”. Exemplo: “Entregar 8 projetos executivos no prazo” · indicador “projetos entregues” · prazo: o último dia do ciclo.',digite:[],alvo:{css:"#avd-sheet button[onclick='AVD.regMetas()']",texto:'Registrar metas',frame:null},
       porque:'Meta vaga não entra: sem indicador e prazo o sistema recusa. É a reunião de 15 minutos do Mês 1.',pronto:DE+".metas===true"},
      {id:'cPp07',tela:T,menu:M+' › Carla Mendes',faca:'Em “Check-in”, clique em “Marcar check-in feito”.',digite:[],alvo:{css:"#avd-sheet button[onclick='AVD.checkin()']",texto:'Marcar check-in feito',frame:null},
       porque:'Mês 2 ou 3: uma conversa de 15 minutos para ver se a pessoa precisa de apoio. Não gera nota.',pronto:DE+".checkin===true"},
      {id:'cPp08',tela:T,menu:M+' › Carla Mendes',faca:'No bloco 1, “Entregas e metas”, dê o resultado de cada uma das 3 metas: Superou, Atingiu ou Abaixo.',digite:[],alvo:{css:"#avd-sheet .avd-bl header h3",texto:'Entregas e metas',frame:null},
       porque:'O “o quê”: os números e projetos combinados no início do ciclo, um toque por meta.',pronto:DE+".res===3"},
      {id:'cPp09',tela:T,menu:M+' › Carla Mendes',faca:'No bloco 2, “Comportamento e cultura”, marque os 4 critérios: Referência, Adequado ou Precisa desenvolver.',digite:[],alvo:{css:"#avd-sheet .avd-bl header h3",texto:'Comportamento e cultura',frame:null},
       porque:'O “como”: comunicação, proatividade, pontualidade e trabalho em equipe. Referência = exemplo para o time.',pronto:DE+".beh===4"},
      {id:'cPp10',tela:T,menu:M+' › Carla Mendes',faca:'No bloco 3, escreva as 3 novas metas (com indicador e prazo) e o PDI: uma habilidade e uma ação concreta. O rodapé diz o que ainda falta.',digite:[],alvo:{css:"#avd-sheet .avd-bl header h3",texto:'Próximo quadrimestre',frame:null},
       porque:'A avaliação já olha para a frente: as próximas 3 metas e um único ponto de desenvolvimento (curso, mentoria ou projeto).',pronto:DE+".res===3&&"+DE+".faltas===0"},
      {id:'cPp11',tela:T,menu:M+' › Carla Mendes',faca:'Clique em “Fechar avaliação”.',digite:[],alvo:{css:"#avd-close",texto:'Fechar avaliação',frame:null},
       porque:'Fechar grava o histórico da pessoa e já deixa as 3 novas metas no ciclo seguinte, para validar no Mês 1.',pronto:DE+".fechada===true"},
      {id:'cPp12',tela:T,menu:M+' › Calibração',faca:'Feche a folha (×) e clique na aba “Calibração”.',digite:[],alvo:{css:"#avd-sheet .avd-x, #main .avd-tabs button[onclick=\"AVD.tab('calib')\"]",texto:'',frame:null},
       porque:'No fim do ciclo, os gestores de cada área comparam as barras com o RH: barras muito diferentes = um está sendo mais rígido que o outro.',pronto:"AVD._tab()==='calib'&&!AVD._aberta()&&"+DE+".fechada===true"}
     ],
     aprendeu:['Meta sem indicador e prazo não entra.','O check-in é conversa: não gera nota.','Fechar a avaliação já registra as metas do ciclo seguinte.','A autoavaliação é da própria pessoa: ela entra com o nome dela e preenche os mesmos campos antes da reunião.','A calibração compara o rigor entre gestores, área por área.']})}
  return true}
if(!aplica()){var n=0,t=setInterval(function(){if(aplica()||++n>60)clearInterval(t)},300)}
})();
