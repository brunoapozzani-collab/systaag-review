# Nova proposta dentro do SYSTAAG — registro (25/11/2026)

Pedido do Bruno (BRIEF de 25/11): trocar a tela de proposta pelo rascunho aprovado (claude.ai/artifact/DNf65pDSGqXM8aydKVTuuD),
sem perder dado, com todo número igual ao Excel. Ramo: `claude/wizardly-euler-gdpndc`. Não publicado (main é do Bruno).

## O que entrou
| Arquivo | O que faz |
|---|---|
| `v230-categorias.js` | Categoria de estoque (`categoria`) + Categoria comercial (`categoria_comercial`) + `conta_como` por ID. Base › Produtos › **Categorias (estoque e comercial)**: contagem que fecha (produtos = soma das categorias), filtro, edição produto a produto. Carga do arquivo **só pelo Bruno**: 1 Simular → 2 Salvar arquivo de desfazer → 3 Gravar em lotes de 150 (fila da nuvem vazia entre lotes) → conferência; Desfazer usa `_cat_antes`. |
| `v230-categorias-data.js` | O arquivo `categorias-por-produto.json` (2.128 produtos). Baixado só quando se clica Simular. |
| `v231-nova-proposta.js` | A tela nova: `#/np` e `#/np/<id>`, só o Bruno vê. Botão "✨ Abrir na tela nova (teste)" no editor de hoje e na lista de Propostas (só para o Bruno). |

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
