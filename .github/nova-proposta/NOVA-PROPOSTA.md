# Nova proposta dentro do SYSTAAG — registro (25/11/2026)

Pedido do Bruno (BRIEF de 25/11): trocar a tela de proposta pelo rascunho aprovado (claude.ai/artifact/DNf65pDSGqXM8aydKVTuuD),
sem perder dado, com todo número igual ao Excel. Ramo: `claude/wizardly-euler-gdpndc`, rebaseado sobre o main `9d756d6` (v232). Não publicado (main é do Bruno).
Numeração: as camadas desta entrega são **v233** (categorias) e **v234** (tela nova) — o número v230 já era da camada Focal de outra sessão.

## O que entrou
| Arquivo | O que faz |
|---|---|
| `v233-categorias.js` (`V233CAT`) | Categoria de estoque (`categoria`) + Categoria comercial (`categoria_comercial`) + `conta_como` por ID. Base › Produtos › **Categorias (estoque e comercial)**: contagem que fecha (produtos = soma das categorias), filtro, edição produto a produto. Carga do arquivo **só pelo Bruno**: 1 Simular → 2 Salvar arquivo de desfazer → 3 Gravar em lotes de 150 (fila da nuvem vazia entre lotes) → conferência; Desfazer usa `_cat_antes`. |
| `v233-categorias-data.js` | O arquivo `categorias-por-produto.json` (2.128 produtos). Baixado só quando se clica Simular. |
| `v234-nova-proposta.js` (`NP`) | A tela nova: `#/np` e `#/np/<id>`, só o Bruno vê. Botão "✨ Abrir na tela nova (teste)" no editor de hoje e na lista de Propostas (só para o Bruno). |

## Como a tela nova garante os mesmos números
- Nenhum motor novo: todo número vem de `M.resumo/M.equip/M.serv/M.dias/calcXlHtml` (o mesmo do editor de hoje).
- Nenhuma escrita nova: tudo passa pelas ações `A.*` de hoje. Ações novas (mesmo formato de `A.addBloco + A.addLinha`):
  `A.npUsarKit` (kit da Base por ID de produto, preço/custo do catálogo), `A.npTrocarLinha` (troca de uma linha antes da venda),
  `A.npOpcao` (opção B/C… = cópia com `opcao_de`), `A.npSetCad` (cadastro compartilhado entre opções), `A.npIniciarFech`.
- Distância do projeto (regra 2 do BRIEF): o motor de hoje já copia o Excel (linhas de automação/rede/CAV dividem o Projeto por
  0,65) → calculadora 36,68 (D2) / 34,37 (E2:H2), 84 de 84 linhas iguais. A tabela do rascunho não é usada.
- Diárias: hoje a sugestão por sistema é zero (camada s65); vale o digitado (`servicos_adj`). A Contagem da obra aparece como
  sugestão por fase, com a diferença para o digitado — não grava nada.
- Vendida: linhas travadas; "trocar (preço mantido)" = `rtSubstDialog` (cliente paga o contratado, custo novo vai para a margem,
  linha original riscada com "atendido com…"); item a mais = Ret/Troc; plantas e arquivos funcionam.
- Pagamento e NF = `paneFechamento` de hoje; Arquivos = `__gerarPPT`, `exportProposta`, `paneDocs`; Modo cliente = `paneCliente`.

## Provas (25/11/2026)
- Base real (lida do Supabase em cópia local só leitura, `__bloqueados` = 0): **1.374 de 1.374 propostas iguais** (motor e total
  mostrado), todo passo de todo tipo abre, **0 escritas** ao abrir → `paridade-base-real-25-11-2026.xlsx`.
- Base local embutida: 1.382 de 1.382 → `paridade-base-local-25-11-2026.xlsx`.
- Abrir na tela nova muda na memória um subconjunto do que o editor de hoje muda ao abrir (só `comp`/`revisoes_vendidas`, que o
  próprio motor cria). Corrigido: o Plantas criava 598 diagramas vazios; agora só ao subir arquivo.
- Simulação das categorias na Base real: 2.128 do arquivo = 2.128 na Base, 0 nomes diferentes, 2.079 a gravar, **0 totais de
  proposta mudam**, 468 produtos mudam de etapa (Estoque/Operação), 49 ficam de fora (Acústica 46, Serviços 3: não existem em
  Base › Categorias) → `categorias-simulacao-base-real-25-11-2026.xlsx`.
- Fluxo completo testado (local): criar → kit 5.1 da Base (9/9 linhas, R$ 48.476 = equipamentos) → qtd, misc da linha, diárias
  digitadas → troca → produto avulso → total igual nas duas telas → opção B → cadastro compartilhado → comparação A×B.
- Erros `uma-obra TypeError … 'nome'` no console já existem no main (não são desta mudança).

## O que falta (ordem do BRIEF)
1. Publicar (merge deste ramo no main) e conferir no link real com o Chrome do Bruno.
2. Bruno: criar "Acústica" e "Serviços" em Base › Categorias (com etapa) → Base › Produtos › Categorias → Simular → Salvar
   desfazer → Gravar → conferir 2.128 = soma.
3. Uso real pelo Bruno; depois trocar o padrão (Nova proposta e o editor abrem a tela nova), tela antiga escondida 2 semanas,
   remover e atualizar "Aprender fazendo".
4. Em aberto (não decidido aqui): duração das etapas P/G (×0,7/×1,4 do rascunho não foi usada — vale o calendário de hoje);
   "conta como" guardado como referência — trocar a receita de um produto muda diárias e totais, fica para a Base.

## Reconferência depois do rebase (25/11/2026, main 9d756d6)
Base real, cópia local só leitura: 1.374 de 1.374 propostas com o mesmo total (motor e tela), 0 diferenças; 277 vendidas/em obra
abrem; todo passo abre; 0 escritas ao abrir; o único registro que muda na memória ao abrir (rascunho 344034: `fechamento`) muda igual
no editor de hoje. Excel: pr_xl R$ 316.880 nas duas telas, editor de hoje 6 ✓ 0 ✗, calculadora 36,68 / 34,37, 84 de 84 linhas.
Outra pessoa (Renata): Início, Propostas, editor, Base › Produtos, Pipeline, Estoque, Gestão, Obras iguais ao main.
Nada foi gravado na Base compartilhada; a carga das categorias não foi feita.

## 25/11/2026 (noite) — regras do Bruno para os 49 que ficavam de fora (v233c)
- Produção conferida: `main` d460617 (merge do PR #5) no ar no Vercel, serve v233/v234; numa cópia do mesmo código com a Base
  real, a tela nova abre para o Bruno e mostra "só o Bruno vê" para a Renata (sem botão no editor).
- **Acústica**: a carga cria a etapa de obra "Acústica" (grupo próprio) e a categoria de estoque "Acústica" apontando para ela;
  `__faseDaSub` devolve "acústica" para esse grupo → Operação mostra o grupo Acústica na proposta. Data de necessidade: etapa
  Acústica da obra; em obra antiga, a etapa onde a acústica já era feita (caixas acústicas, depois equipamentos) — 7 de 7 linhas
  acústicas vendidas ficam com a mesma data.
- **Serviços**: a carga cria a categoria "Serviços" marcada `servico:true`, sem etapa; produto de categoria de serviço fica sem
  etapa (`__faseDe` → "serviço (sem etapa)") e fora da demanda de estoque (`Q.demanda`). Os 11 serviços (diárias, visita, programação).
- **Ajuste ao arquivo**: p_7mcp7c (HD SkyHawk, 2 unidades no estoque) estava como Serviços no arquivo — fica com a categoria de
  estoque de hoje (Outros) e comercial Câmeras.
- Nada disso age antes da carga (a etapa e as categorias só nascem no Gravar do Bruno). Desfazer apaga os 3 registros criados.
- Simulação na Base real: 2.128 a gravar, 0 de fora, 525 mudam de etapa, 0 totais mudam, demanda de estoque 949 → 949.
- Ensaio da gravação numa cópia local (trava de só leitura + rede bloqueada para escrita): 2.128 gravados, conferência 2.128/2.128,
  0 totais mudam; Desfazer devolve os 2.128 e tira a etapa e as 2 categorias. 0 pedidos de escrita chegaram à rede.

## 25/11/2026 (noite, 2) — o cliente só vê o nome genérico (v235)
- Regra do Bruno: tudo o que o cliente vê (modo cliente no editor de hoje e na tela nova, o link do cliente e o PDF — a mesma vista,
  impressa — e a apresentação .pptx) mostra só o nome genérico e a quantidade; nunca marca nem modelo; fotos ficam; telas internas
  com o nome real.
- `nomeCliente(produto)`: nome genérico → tipo (`tipo_generico`, gravado pela carga de categorias) → categoria comercial →
  "Equipamento". Rede de segurança: nome genérico que contém a marca/modelo do próprio produto não é usado.
- Nome do ambiente na vista do cliente: sistema montado de kit mostra o ambiente digitado ou o grupo do kit (nunca o nome do kit);
  marcas do catálogo e modelos da proposta saem do nome. O que está gravado na proposta não muda.
- Corrigido junto: a vista do cliente quebrava em 1.259 propostas sem `versoes` (já era assim).
- Carga de categorias agora grava também `tipo_generico` (coluna "tipo" do arquivo, sem marca; "(pelo padrão da marca)"/"(sem
  regra)" ficam vazios → categoria comercial). HD SkyHawk: estoque Rede, comercial Câmeras.
- Prova (Base real, só leitura): 1.374 propostas × 4 saídas, marca e modelo de cada produto procurados: 0 vazamentos hoje e depois
  da carga; 31 exceções com nome (modelo que é palavra genérica, nome do cliente/obra da loja Focal, 1 rascunho sem número) →
  `cliente-nome-generico-base-real-25-11-2026.xlsx`. Telas internas e totais iguais ao main.
- A lista ".csv" da tela nova passou a se chamar "Lista interna" (tem marca e modelo).

## 25/11/2026 (noite, 3) — vista do cliente: sem "0×" e com ponte no rodapé (v235b)
- Carga de categorias gravada pelo Bruno na Base real às 17:07 (2.128/2.128).
- Linha com quantidade 0 não aparece ao cliente (49 "Miscelânea — linha do Excel sem produto": o valor continua em Equipamentos).
  4 linhas de cabo/bobina com valor e quantidade 0 (a metragem não veio do Excel; só a linha do arquivo ficou) aparecem como
  "metragem conforme projeto" e estão na lista para conferir.
- Rodapé: Equipamentos + Serviços + Desconto/Acréscimo (ajuste) + Atendimento de pós-venda / Valor fechado da venda = Total, com o
  resto do arredondamento na maior parte; o .pptx mostra a mesma ponte e o mesmo total (agora lê as linhas da proposta, sem as ocultas).
- Base real: 1.374 propostas, 0 linhas "0×", 0 rodapés que não fecham, total da vista = total de hoje em 1.374,
  .pptx = vista, 0 vazamentos de marca/modelo → `cliente-rodape-e-linhas-base-real-25-11-2026.xlsx`.

## 26/11/2026 — a troca: a tela nova é o editor de proposta, para todos (v234b)
- `#/editor/<id>` mostra a tela nova para todo mundo que já podia abrir proposta (mesma rota → mesmas permissões, mesma Lixeira,
  mesmos links de Início, Pipeline, Gestão, busca, Operação, Pré-vendas, Obras). `#/np/<id>` vira `#/editor/<id>` antes da
  checagem de acesso. `#/nova`: o quadro da tela nova (tipos) por cima do formulário de criação de sempre; ao criar, abre a tela nova.
- Sem rótulos de teste nem botões "Abrir na tela nova".
- O editor antigo continua no código, sem caminho na interface: `window.__editorClassico(id)`. Volta para todos (rollback):
  `NP.voltarClassico()` (ou `window.__npLegado=true`). Uma marca só (`__npLegado`) decide; não há troca de funções.
- O que a tela nova não refaz entra pelo próprio código antigo, sem o cabeçalho antigo:
  · topo de todo passo: cartões "Fluxo" e "Status interno" (enviar para proposta, pré-vendas, validar, nova versão, cliente
    aceitou/recusou, VENDIDO, cancelar, histórico de aprovação, PowerPoint, Consolidado/PDF);
  · passo "Mais": Detalhes (informações gerais, composição projeto/cabeamento/sistema, ambientes com receitas, ocultar e fase,
    duplicar, trocar produto em toda a proposta, Ret/Troc, conferências, garantia, especificação técnica, comissão…), Documentos
    (consolidado, link do cliente, versões, briefing, contrato, Excel interno, PDF sem preço, PowerPoint), Raio-X e Fechamento
    (só Gestão/Diretoria/TI/Financeiro — v182), Modo cliente.
- Permissões como no editor antigo (v182): fora de Gestão/Diretoria/TI/Financeiro, Valores mostra a margem simples (sem custos,
  impostos, RT, bonificação), Pagamento e NF fica com a Gestão e o Financeiro, Raio-X e Fechamento não aparecem.
- Nativo novo: endereço da obra e consultores no Cadastro; "Novo ambiente … Criar" em Sistemas; diárias também no pós-venda.
- "Aprender fazendo": 21 passos do capítulo Comercial e 3 do Pós-venda reescritos para a tela nova (alvos e "pronto" conferidos).

## 26/11/2026 (tarde) — "Aprender fazendo", capítulo Comercial, só na tela nova
- Capítulo "Comercial — da proposta à venda confirmada": 26 → 43 passos. Passos novos (c1n01–c1n17): duas categorias (Base ›
  Produtos › Categorias e o filtro por Categoria comercial), miscelânea por linha, Contagem da obra (só sugere; o digitado vale —
  o total continua R$ 100.000), Valores e margem, Plantas, Modo cliente (só nome genérico, sem marca/modelo), apresentação .pptx,
  Opção B com kit da Base e comparação A×B, proposta vendida (linhas travadas, trocar com preço mantido, Ret/Troc).
- Capítulo "Contas", passo c1p02: o parceiro ganha "Tipo de parceria" (Indica a TAAG e outros = 10%) no lugar do "RT (%)"
  digitado — sem isso (regra v187) a proposta não podia ser enviada e o capítulo Comercial não fechava.
- treino-snaps/cap3.json (início do capítulo Comercial pelo atalho "Capítulos"): catálogo de hoje (2.128 produtos com as duas
  categorias, nome genérico e tipo; categorias Acústica e Serviços) e PRADO ARQUITETURA com o tipo de parceria.
- Tela nova: a busca de produto acha por palavras ("300 icw6" acha "300-ICW6").
- Prova: o capítulo inteiro percorrido no modo treino pela tela (preencher/clicar), 43 de 43 passos com o "pronto" verdadeiro e o
  alvo visível; fim igual ao de antes (proposta 1 vendida, R$ 100.000, 10 + 5 caixas, 3 títulos a receber); 0 escritas na rede.

## 26/11/2026 — Aprender fazendo: “Me mostre onde” sempre cai em algo visível (v236)

Pedido do Bruno: no Pipeline do capítulo Comercial, ao clicar em “Me mostre onde”, o cartão do cliente já tinha sumido.

**Por que sumia (reproduzido no modo treino):**
- “Montar proposta de Sistema →” leva o negócio CEX para a coluna “Proposta desenvolvida” e abre a proposta; o guia ainda ficava ~1 s no
  passo anterior e, nesse intervalo ou depois de “← Voltar”, procurava um botão do painel do negócio, que já estava fechado;
- em outra tela, o botão só dizia “Primeiro vá para a tela…” (não abria nada);
- filtro do quadro (busca, frente, consultor) podia esconder o cartão;
- passos que olham a tela (“clique em Valores e margem”, “Plantas”, “Pagamento e NF”) deixavam de contar se a pessoa seguisse antes do
  guia — o guia empacava;
- “← Voltar” não devolvia nada: o cartão continuava na coluna seguinte.

**Regra de agora (motor do guia, todos os capítulos — v124-guia.js, bloco v236):**
- “Me mostre onde” abre a tela do passo (telas de registro, ex. `#/cotacao/<id>`, pelo último registro aberto ou pelo link que as abre),
  limpa o filtro do Pipeline, abre o painel do negócio quando o botão está nele, rola o quadro (inclusive para o lado) e o painel até o alvo,
  confere de novo até o alvo ficar parado na tela e o contorna; alvo mais alto que a tela → contorno no título dele;
- passo que é “abrir a tela” não é feito pelo guia: contorna o caminho no menu;
- passo já feito: “Este passo já está feito ✓” + onde ficou (coluna do cartão, o nome gravado, ou o botão que abre);
- passo que depende de outro ainda não feito: leva até o que falta;
- um passo conta assim que foi feito, mesmo que a pessoa já tenha seguido (o guia não empaca);
- “← Voltar” no MODO TREINO devolve o treino ao estado do começo daquele passo (fotos em memória, só no treino; a nuvem está desligada no
  treino); fora do treino nada é desfeito — o passo aparece como “já feito” e “Seguir →” continua;
- passos de olhar (miscelânea, diárias, contagem) só contam com “Vi ✓”.

**Passos do Pipeline (v236-guia-mostra.js):** um clique por passo; o texto diz o cartão “Cliente Exemplo — Residência São Paulo” e o botão.

**Prova (modo treino, localhost só leitura, escritas ao Supabase abortadas = 0):**
- capítulo Comercial inteiro, “Me mostre onde” antes de cada passo (43 passos + Voltar em 2 passos do Pipeline + filtro escondendo +
  outra tela + clique no “Feito!”): passos em que não apontou nada = 0; venda confirmada, R$ 100.000, 3 parcelas a receber;
- todos os capítulos, no começo (nada feito) e no fim (tudo feito, como depois de Voltar): antes 183 de 454 sem alvo visível; agora 0 de 454 (cada passo, com o capítulo no começo e no fim).
