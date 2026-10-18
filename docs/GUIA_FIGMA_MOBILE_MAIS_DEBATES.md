# +Debates — guia de produto, UX e interface para prototipação mobile no Figma

**Versão:** 1.0 — 17/10/2026  
**Finalidade:** especificação executável de um protótipo navegável, com telas de participante e mediador.  
**Idioma:** português do Brasil. **Plataforma:** aplicativo mobile, retrato, com comportamento previsto para Android e iOS.

> **Natureza das decisões.** O propósito educativo, o uso de temas contextualizados e fontes, a justificativa da posição, as interações de concordância/dúvida, a mediação humana, a síntese revisada e a privacidade são premissas da análise anterior. Cores, tipografia, medidas, navegação, exemplos e microtextos abaixo são recomendações para tornar o protótipo executável; podem ser refinados em teste com usuários.

## 1. Visão e princípios

O +Debates ajuda estudantes e jovens a compreender uma questão pública, formular uma posição fundamentada e conversar com pessoas que pensam de modo diferente. Professores e mediadores organizam debates, selecionam contexto e fontes, zelam pelas regras e publicam uma síntese fiel dos argumentos, convergências e dúvidas.

**Promessa de experiência:** “Entenda o tema. Explique seu ponto de vista. Escute outras razões.”

| Princípio | Consequência para a interface |
| --- | --- |
| Contexto antes da reação | Pergunta, resumo, termos e fontes aparecem antes do primeiro campo de contribuição. Ler continua possível sem publicar. |
| Argumentos antes de popularidade | Cards destacam ideia e justificativa; contagens de apoio não ordenam sozinhas o feed nem definem a síntese. Sem placar vencedor. |
| Diálogo com cuidado | Respostas focam uma contribuição específica; o usuário pode pedir esclarecimento, concordar e reportar abuso. |
| Divergência legível | Posições têm texto e cor, mas a cor nunca é o único sinal. Rótulos não enquadram pessoas como adversários. |
| Transparência editorial | Fontes têm identificação e link; síntese tem autor, data, estado e indicação de revisão humana. |
| Segurança e privacidade | Convite, nome de exibição e visibilidade clara; perfis não expõem dados pessoais por padrão. |
| Mobile simples | Uma ação principal por tela, conteúdo em coluna única, textos curtos e áreas de toque confortáveis. |

### 1.1 Escopo do protótipo

**MVP demonstrado:** entrar por convite; escolher nome de exibição; entender tema e fontes; publicar posição com justificativa; ler e filtrar contribuições; responder; marcar concordância ou dúvida; denunciar; visualizar resultado da denúncia; acompanhar síntese; fluxo do mediador para criar, revisar, moderar e publicar síntese.

**Fora do fluxo principal:** votação eleitoral, pontuação competitiva, conversa privada, seguidores, feed público irrestrito, chat ao vivo, geração automática de veredictos, IA que publica síntese sem revisão humana e perfis sociais ricos. Se surgirem em telas exploratórias, marcar como “Futuro”, fora do protótipo MVP.

### 1.2 Papéis e permissões visíveis

| Papel | Pode fazer | Não pode fazer no protótipo |
| --- | --- | --- |
| Visitante com convite | Ver regras, configurar nome de exibição e acessar o debate após aceitar entrada. | Abrir debate privado pelo catálogo público. |
| Participante | Ler, publicar ou editar sua posição, responder, concordar, marcar dúvida, denunciar, consultar síntese. | Criar tema ou publicar síntese oficial. |
| Mediador | Criar e editar tema antes da abertura, adicionar fontes, acompanhar contribuições e denúncias, ocultar/restaurar conteúdo, redigir/publicar síntese. | Declarar “vencedor” ou automatizar sanções sem revisão. |

**Regra operacional proposta:** um participante pode ter uma posição principal por debate, editável com indicação de edição; pode escrever respostas em threads. A visibilidade da posição, suas respostas e do nome de exibição fica limitada ao espaço do convite. Esta proposta precisa ser validada antes da implementação técnica.

## 2. Arquitetura de informação

```text
Entrada por convite
  → Boas-vindas e regras → Nome de exibição → Debate

Participante
  → Debates (lista) → Detalhe do debate
       ├─ Contexto: pergunta, explicação, termos, fontes
       ├─ Conversa: contribuições, detalhe, respostas
       └─ Síntese: argumentos, convergências, divergências, dúvidas
  → Minha atividade: minhas posições e respostas
  → Perfil: nome, privacidade, regras e ajuda

Mediador
  → Área de mediação → Criar/editar debate → Prévia/publicação
                    → Fila de revisão → Decisão
                    → Editor de síntese → Prévia/publicação
```

**Navegação recomendada:** barra inferior com **Debates**, **Minha atividade** e **Perfil**. O detalhe do debate usa abas internas **Contexto**, **Conversa**, **Síntese**. O mediador vê acesso **Mediação** no topo da lista e não precisa trocar de conta. A barra inferior some apenas em formulários longos e fluxos de revisão, onde há voltar e ação de conclusão evidentes.

**Estados do debate:** `Rascunho` → `Aberto` → `Encerrado` → `Síntese publicada`. Um debate aberto ainda pode mostrar “Síntese em preparação”; um encerrado é somente leitura para contribuições. A síntese é um artefato editorial separado das opiniões individuais.

## 3. Fluxos e protótipo clicável

### F1 — Participação principal

1. Abrir link/código de convite. Mostrar nome do grupo/debate e quem poderá ver participações.
2. Ler regras breves e definir nome de exibição; confirmar entrada.
3. Chegar ao **Contexto**: pergunta delimitada, panorama neutro, termos e fontes identificadas.
4. Abrir **Conversa** para ler contribuições sem necessidade de publicar.
5. Tocar **Compartilhar minha posição**; selecionar `Favorável`, `Contrário`, `Em parte` ou `Ainda estou refletindo` e escrever justificativa.
6. Validar texto, confirmar publicação e mostrar card publicado com retorno claro.
7. Abrir outra contribuição; escolher **Responder**, **Concordo** ou **Tenho uma dúvida**. Para dúvida, abrir composer de resposta com sugestão de pergunta; não pressupor que dúvida seja discordância.
8. Consultar **Síntese**. Se ainda não publicada, ver estado com data/status; se publicada, ver argumentos, pontos de acordo, divergências e questões em aberto.

### F2 — Mediação

1. Entrar em **Mediação** → **Novo debate**.
2. Definir pergunta, breve contexto, glossário, ao menos uma fonte identificada, período e grupo convidado.
3. Ver prévia mobile; abrir debate e copiar/compartilhar convite conforme permissões do ambiente.
4. Abrir fila de denúncias; analisar contribuição e contexto da thread; decidir manter ou ocultar com motivo visível ao autor.
5. Encerrar debate; redigir síntese em campos separados; pré-visualizar atribuição, data e ressalva editorial; publicar.

### F3 — Denúncia e reparação

`Mais opções` no card → **Denunciar** → selecionar motivo (`Ataque pessoal`, `Discriminação`, `Informação pessoal`, `Spam/outro`) + comentário opcional → confirmar recebimento. O card continua disponível ou muda conforme decisão humana; a confirmação nunca promete remoção automática. Na visão do mediador, há contexto, motivo, ação **Manter** / **Ocultar**, justificativa e estado. O autor de conteúdo ocultado vê aviso com motivo e orientação de revisão; desenhar opção de contestação como estado de UX, sem prometer canal automatizado no MVP.

### 3.1 Mapa de links no Figma

| Origem e ação | Destino/efeito | Tipo de interação |
| --- | --- | --- |
| Convite → Continuar | Regras e identificação | Navigate to |
| Regras → Entrar no debate | Contexto do debate | Navigate to; validar nome |
| Contexto → Ver fontes | Lista/folha de fontes | Open overlay ou Navigate to |
| Contexto → Conversa | Aba Conversa | Change to variante ou Navigate to |
| Conversa → Compartilhar posição | Editor de posição | Navigate to |
| Editor → Publicar | Confirmação + minha contribuição | Navigate to; prototipar também erro |
| Card → Responder | Detalhe/thread com composer | Navigate to |
| Card → Concordo | Estado selecionado; desfazer ao tocar | Change to variante |
| Card → Tenho uma dúvida | Composer de pergunta ligado ao card | Navigate to |
| Card → Mais → Denunciar | Sheet de motivo → confirmação | Open overlay → Navigate to |
| Síntese em preparação | Estado vazio informativo | Change to variante |
| Mediação → Revisar denúncia | Caso → decisão → confirmação | Navigate to |
| Mediação → Publicar síntese | Prévia → confirmação → publicada | Navigate to |

## 4. Inventário de telas

**Convenção:** P = participante, M = mediador, S = estado compartilhado. Os IDs devem ser os nomes dos frames no Figma. Elaborar um frame base por tela e variantes para os estados indicados; a matriz de estados na seção 5 completa a cobertura.

| ID | Tela | Conteúdo e hierarquia | Ação principal / saída |
| --- | --- | --- | --- |
| S01 | Splash/carga | Marca +Debates, frase curta, indicador discreto. | Resolução automática do convite/sessão. |
| S02 | Convite válido | Nome do debate/grupo, responsável, período, alcance de visibilidade, resumo da participação. | **Continuar**; link para regras. |
| S03 | Convite inválido/expirado | Motivo em linguagem simples, código parcial não exibido, orientação para novo convite. | **Tentar outro convite**. |
| P01 | Boas-vindas e regras | Três princípios, alcance do debate, privacidade resumida, nome de exibição. | **Entrar no debate**; validação de nome. |
| P02 | Debates | Saudação discreta, lista `Em andamento`/`Encerrados`, cards com pergunta, grupo, prazo e estado; acesso Mediação por papel. | Abrir debate; estado vazio. |
| P03 | Debate: Contexto | Pergunta dominante, status, prazo, resumo, termos, fontes, atribuição do mediador; abas internas. | **Compartilhar minha posição**; acesso livre à conversa. |
| P04 | Fontes e termos | Cards de fonte com título, autor/veículo, data quando disponível, breve relevância, URL; definições expansíveis. | Abrir fonte externa com indicação de saída. |
| P05 | Debate: Conversa | Cabeçalho compacto, chips de filtro, lista de cards de argumento, ação de posição ancorada. | Abrir contribuição; publicar posição. |
| P06 | Criar/editar posição | Pergunta persistente, opções textuais de posição, campo obrigatório de justificativa, ajuda para estruturar argumento, fonte opcional. | **Publicar posição** / **Salvar alterações**. |
| P07 | Publicação concluída | Feedback sem animação celebratória excessiva, trecho da posição e próximos passos. | **Ver minha contribuição**. |
| P08 | Contribuição e respostas | Card completo, contexto da posição, autor, data, justificativa, links citados, respostas e ações. | **Responder** / **Concordo** / **Tenho uma dúvida**. |
| P09 | Escrever resposta/dúvida | Citação curta da contribuição alvo, campo multiline, indicação do tipo, orientação de respeito. | **Publicar resposta**; cancelar com confirmação se houver texto. |
| P10 | Denunciar contribuição | Motivos com descrições, campo opcional, texto “Uma pessoa responsável revisará”. | **Enviar denúncia**. |
| P11 | Denúncia recebida | Confirmação, o que ocorre a seguir, retorno à conversa. | **Voltar à conversa**. |
| P12 | Síntese | Estado “Em preparação” ou documento com resumo, principais argumentos por perspectiva, consensos, divergências, dúvidas, fontes citadas, autoria/data. | Ler, expandir seções, voltar. |
| P13 | Minha atividade | Posições e respostas por debate; estado de edição/ocultação e link ao contexto. | Abrir/editar minha posição. |
| P14 | Perfil e privacidade | Nome de exibição, visibilidade, regras, ajuda, sair; dados mínimos. | Editar nome/ler privacidade. |
| M01 | Painel de mediação | Cards de debates por estado, fila de denúncias com quantidade, atalho para sínteses. | **Criar debate**, revisar casos. |
| M02 | Criar debate: pergunta | Pergunta única e delimitada, descrição curta, público/grupo, duração. | **Continuar: contexto**. |
| M03 | Criar debate: contexto/fontes | Panorama, glossário, lista de fontes com metadados e URL; validação de fonte. | **Ver prévia**. |
| M04 | Prévia e abertura | Prévia idêntica à tela P03, resumo de alcance e período, revisão dos campos. | **Abrir debate**; estado de confirmação. |
| M05 | Fila de moderação | Casos `Pendentes`/`Resolvidos`, motivo, data e trecho com privacidade preservada. | Abrir caso. |
| M06 | Análise de caso | Contribuição e thread contextual, motivo da denúncia, regras relevantes, decisões com explicação. | **Manter** / **Ocultar** + confirmar. |
| M07 | Editor de síntese | Campos separados para panorama, argumentos, consensos, divergências, questões em aberto e fontes; aviso editorial. | **Pré-visualizar**. |
| M08 | Prévia/publicação da síntese | Visual final P12, autor/revisor e data, confirmação de revisão humana. | **Publicar síntese**. |

### 4.1 Composição detalhada dos cards essenciais

**Card de debate:** status textual no topo; pergunta em até três linhas; grupo e data abaixo; linha de progresso neutra como “Aberto até 24 out”; seta/ação `Abrir`. Não exibir “percentual de vitória”.

**Card de contribuição:** nome de exibição, tempo/data, chip textual de posição, trecho da tese em destaque, justificativa com truncamento controlado, fonte citada se houver, linha de ações `Concordo`, `Tenho uma dúvida`, `Responder` e menu `Mais`. Concordâncias podem mostrar contagem discreta; a lista não deve alegar que mais concordâncias significam argumento melhor. Estados `Editado`, `Oculto para revisão`, `Do mediador` são badges textuais.

**Card de fonte:** título, origem, data somente se conhecida, nota do mediador “Por que ler”, indicador externo. Nenhuma fonte inventada no arquivo entregue; usar dados de exemplo explicitamente rotulados como fictícios até a curadoria real.

**Síntese:** cabeçalho com status `Revisada por [nome do mediador]` e data; resumo de 2–4 linhas; seções separadas `Argumentos apresentados`, `Pontos de encontro`, `Divergências`, `Perguntas em aberto`; links das fontes e nota “Esta síntese organiza contribuições e não representa a posição de todas as pessoas.” Não reduzir posições a uma contagem ou consenso forçado.

## 5. Estados, validações e conteúdo de exemplo

| Elemento | Variantes obrigatórias no Figma | Comportamento/mensagem |
| --- | --- | --- |
| Convite | válido, inválido, expirado, carregando | “Este convite expirou. Peça um novo ao responsável pelo debate.” |
| Lista de debates | preenchida, vazia, carregando, erro | “Seus debates aparecerão aqui quando você receber um convite.” `Tentar novamente` em erro. |
| Debate | aberto, encerrado, síntese pendente, síntese publicada | CTA de escrita indisponível ao encerrar; leitura preservada. |
| Campo de justificativa | vazio, foco, preenchido, erro, enviando | “Explique por que você pensa assim.” Validar texto não vazio e limite definido em produto. Não usar contagem arbitrária como requisito final. |
| Posição | não publicada, publicada, editada, envio falhou | Edição sinalizada; falha mantém rascunho e oferece `Tentar novamente`. |
| Ação Concordo | padrão, selecionada, indisponível | Toque alterna estado; feedback textual além da cor. |
| Resposta | editor vazio, rascunho, erro, publicada, ocultada | Preservar texto ao falhar; citar alvo claramente. |
| Denúncia | sem seleção, motivo selecionado, enviando, recebida | Confirmar recebimento, sem afirmar punição automática. |
| Síntese | ainda indisponível, em preparação, publicada, atualizada | Mostrar autoria, data e indicação de atualização. |
| Moderação | fila vazia, pendente, resolvida, decisão em confirmação | Exigir motivo para ocultação; evitar ação acidental. |
| Fonte externa | normal, indisponível | “Não foi possível abrir a fonte. Tente novamente.” |

**Dados fictícios para protótipo:** debate “O uso de celulares em sala de aula deve ser permitido durante atividades orientadas?”; grupo “Turma de exemplo”; quatro posições com justificativas substantivas, inclusive `Em parte` e `Ainda estou refletindo`. Usar nomes de exibição como “Ana L.”, “Rafa” e “Jo”; evitar fotos reais. Fontes de demonstração: `Fonte de exemplo A — substituir por material verificado` e `Fonte de exemplo B — substituir por material verificado`. A síntese deve refletir os argumentos criados nos cards, incluindo uma dúvida ainda aberta. Datas exemplificativas e links externos fictícios devem ser marcados no Figma como conteúdo de demonstração.

**Exemplo de microtexto da ação principal:** `Compartilhar minha posição`; ajuda: `Qual é sua opinião? Explique o motivo e, se puder, cite o que leu.`; confirmação: `Sua posição foi publicada. Você pode revisá-la enquanto o debate estiver aberto.`

## 6. Guia visual

### 6.1 Direção de arte

Visual editorial, contemporâneo e acolhedor. Priorizar clareza de leitura sobre estética de rede social. Marca **+Debates** em wordmark simples; o sinal `+` simboliza adicionar contexto e perspectivas, sem uso de balões de fala agressivos ou ícones de disputa. Ilustrações geométricas discretas só em boas-vindas e estados vazios. Cards limpos, bordas suaves, poucos planos de sombra. Sem gradientes chamativos em conteúdo argumentativo.

### 6.2 Tokens sugeridos

Os valores são pontos de partida de design. Conferir contraste em texto e controles no Figma antes de finalizar.

| Token | Valor | Uso |
| --- | --- | --- |
| `color/ink/900` | `#172334` | Texto principal, títulos. |
| `color/ink/600` | `#526174` | Texto secundário. |
| `color/brand/700` | `#244C92` | Ações principais e links. |
| `color/brand/100` | `#E9F0FC` | Destaques leves, seleção. |
| `color/surface/base` | `#F7F9FC` | Fundo da tela. |
| `color/surface/card` | `#FFFFFF` | Cards e sheets. |
| `color/border` | `#D9E0E9` | Divisores e campos. |
| `color/positive` | `#176A54` | Sucesso e status, nunca posição ideológica. |
| `color/attention` | `#9A5B13` | Atenção, revisão pendente. |
| `color/error` | `#B42332` | Erros e ações destrutivas. |
| `stance/favoravel` | `#DCEBF9` | Fundo de chip com rótulo. |
| `stance/contrario` | `#F7E8DF` | Fundo de chip com rótulo. |
| `stance/em-parte` | `#EAE7F7` | Fundo de chip com rótulo. |
| `stance/refletindo` | `#E8EFEA` | Fundo de chip com rótulo. |

As cores das posições devem ter intensidade visual equivalente. O significado é carregado pelo texto; não usar verde para “certo” ou vermelho para “errado”.

**Tipografia:** família `Inter` (substituição por fonte equivalente se indisponível). Escala: Display 28/34 semibold; H1 24/30 semibold; H2 20/26 semibold; H3 17/24 semibold; corpo 16/24 regular; apoio 14/20; legenda 12/16 apenas em metadados não essenciais. Peso 600 para hierarquia e 400 para leitura; evitar blocos de texto centralizados.

**Espaçamento:** base 4 px; escala 4, 8, 12, 16, 24, 32, 40. Margens laterais 20 px na largura base; gap 12 px entre elementos de card, 16–24 px entre seções. Raio de 12 px para cards, 10 px para campos, 999 px para chips. Borda 1 px. Sombra apenas em superfícies elevadas ou CTA fixo: discreta e uniforme.

**Ícones:** traço consistente de 2 px e área de toque mínima proposta de 44 × 44 px. Sempre combinar ícone com rótulo em ações sensíveis. `Mais` usa menu claro, `Denunciar` nunca fica próximo de `Concordo` sem separação visual. Evitar emoji como ícone permanente.

### 6.3 Layout e responsividade

Frame mestre **390 × 844 px** para mobile retrato; também validar largura estreita **360 px** e larga **430 px**. Usar Auto Layout vertical, largura `Fill container`, altura conforme conteúdo e rolagem. Topo respeita área segura; barra inferior respeita gesto do sistema. Conteúdo não pode ficar escondido por teclado nem CTA fixo. Áreas roláveis têm padding inferior suficiente para o último bloco. Cards de fontes e argumentos aceitam expansão sem altura fixa. Preparar componentes que se ajustem a texto longo e escala de fonte maior.

**Estrutura comum:** status bar mock → app bar (título/back e ação de contexto) → conteúdo rolável → CTA fixo quando houver ação principal → navegação inferior apenas nas áreas principais. O sistema operacional do frame de apresentação pode ser neutro, com versões Android/iOS se necessário; evitar misturar elementos dos dois no mesmo frame.

### 6.4 Acessibilidade e tom

- Verificar contraste visual de todos os pares de cor reais, inclusive chips, estados desabilitados e links; se falhar, ajustar cor antes de exportar.
- Não depender de cor, animação ou gesto oculto para transmitir estado. Seleção de posição inclui rótulo e marca visual.
- Alvos tocáveis com área confortável e distância entre ações. Inputs com label persistente, instrução e erro no próprio campo.
- Suportar fonte ampliada e leitura de conteúdo em ordem lógica. Ao prototipar modal/sheet, indicar foco inicial e saída explícita.
- Linguagem em segunda pessoa, respeitosa e objetiva: “Explique o motivo”, “Peça esclarecimento”, “Sua denúncia foi recebida”. Evitar “vença o debate”, “ataque o argumento” e “sua opinião está errada”.
- Para participantes jovens, minimizar nomes completos e fotos; não incluir dados escolares identificáveis no conteúdo demonstrativo.

## 7. Biblioteca de componentes no Figma

Criar uma página `02 · Foundations` e outra `03 · Components`. Publicar estilos locais de cor e texto, variáveis para cores/spacing quando conveniente, e componentes com propriedades claras.

| Componente | Propriedades / variantes mínimas |
| --- | --- |
| `Button` | `type=primary/secondary/tertiary/destructive`, `state=default/pressed/disabled/loading`, `icon=yes/no`, largura fluida. |
| `IconButton` | back, mais, fechar, compartilhar; focus/pressed/disabled; label acessível em documentação. |
| `TextField` | single/multiline; default/focus/error/disabled; label, ajuda, contador se o limite for definido. |
| `Chip` | posição, filtro e status como famílias distintas; selected/unselected/disabled. |
| `DebateCard` | aberto/encerrado/síntese publicada; título com comprimento variável. |
| `ContributionCard` | meu/de outra pessoa/editado/oculto; texto curto/longo; fonte presente/ausente; ações com estados. |
| `SourceCard` | normal/indisponível; metadados opcionais e ação externa. |
| `SummarySection` | collapsed/expanded; tipo argumentos/consenso/divergência/dúvida. |
| `BottomNav` | três destinos, um ativo; indicador e rótulos. |
| `Tabs` | contexto/conversa/síntese; ativo e contagem opcional sem dar peso competitivo. |
| `Banner` | info/sucesso/atenção/erro; título opcional e ação de recuperação. |
| `Dialog` e `BottomSheet` | confirmação, denúncia, regra, erro; foco e fechamento identificados. |
| `EmptyState` e `Skeleton` | lista, síntese, fila de mediação, carregamento. |

**Convenção de nomes:** `Component/Variant/State` em inglês técnico ou português consistente, por exemplo `ContributionCard/Other/Default`; nomes visíveis ao usuário permanecem em pt-BR. Não desanexar instâncias nas telas finais. Textos e contagens são propriedades editáveis. Documentar uso correto e erro comum ao lado de cada componente.

## 8. Organização exata do arquivo Figma

| Página | Conteúdo |
| --- | --- |
| `00 · Capa e mapa` | Capa, objetivo, legenda de papéis/estados, fluxos F1–F3. |
| `01 · Wireframes` | Todas as telas em baixa fidelidade, já com links básicos. |
| `02 · Foundations` | Cores, estilos de texto, espaçamento, grid, ícones e exemplos de contraste. |
| `03 · Components` | Biblioteca de componentes e variantes, com notas de uso. |
| `04 · Participante` | Frames P01–P14 e S01–S03, agrupados por fluxo, incluindo estados críticos. |
| `05 · Mediação` | Frames M01–M08, estados de confirmação/erro e regras editoriais. |
| `06 · Protótipo` | Cópias de apresentação conectadas, ponto inicial e três cenários de teste. |
| `07 · Handoff` | Mapa de decisões, conteúdo fictício a substituir, pendências e critérios de aceitação. |

**Nome de frame:** `P03 · Contexto · Aberto`, `P06 · Posição · Erro`, `M06 · Caso · Pendente`. Organizar da esquerda para a direita na ordem de navegação, com ramificações abaixo. Usar seções por F1, F2 e F3. Incluir comentários laterais curtos em frames complexos: gatilho, estado, regra e destino. Marcar o frame `S02 · Convite válido` como início do protótipo F1, `M01` para F2 e `P08` para F3.

**Interações:** Smart Animate apenas quando a continuidade espacial ajuda (troca de aba, expansão); transição imediata ou Dissolve curto para navegação. Prototipar teclado com variante visual, erro de formulário, loading, sucesso e retorno. `Back` preserva rascunho ou apresenta diálogo de descarte. Sem gestos de swipe como única forma de chegar a uma ação.

## 9. Regras de negócio e decisões para o agente

1. Um debate só pode ser aberto no protótipo do mediador com pergunta delimitada, contexto e ao menos uma fonte identificada. Fonte requer título/origem/link; data, se disponível.
2. Publicação de posição exige uma escolha textual e uma justificativa não vazia. `Ainda estou refletindo` admite pergunta/razão da dúvida no campo de justificativa; não vira voto neutro sem explicação.
3. Ler contexto, conversa e síntese não exige publicar. O convite delimita acesso; a tela de entrada deve explicar quem vê o conteúdo.
4. O usuário pode revisar sua posição durante o período aberto; sinalizar que foi editada. Ao encerrar, impedir novas posições e respostas, mantendo leitura.
5. Respostas devem apontar a contribuição alvo. `Concordo` é reversível; `Tenho uma dúvida` conduz a uma pergunta contextualizada.
6. Denúncia abre revisão humana. Tela de confirmação não afirma que o conteúdo foi removido nem informa identidade de quem denunciou.
7. Mediador decide sobre denúncia com contexto e motivo. Ocultação exige justificativa; o autor vê o estado e uma explicação.
8. Síntese é publicada pelo mediador após revisão, com autoria e data. Organiza argumentos, consensos reais, divergências e questões em aberto; nunca atribui concordância universal.
9. Contagem de concordâncias é sinal de interação, não resultado oficial nem único critério de destaque. No protótipo, filtros `Recentes`, `Perspectivas` e `Minhas interações` são suficientes; `Perspectivas` distribui exemplos de posições sem declarar popularidade.
10. Não expor email, telefone, escola específica, identificação do denunciante ou links de convite completos em telas compartilháveis. Conteúdo fictício deve ser sinalizado na documentação de handoff.

**Decisões a validar com o responsável pelo produto antes de desenvolvimento:** necessidade de login além do convite; política de identidade para turmas menores; duração e limites de texto; revisão prévia de publicações; possibilidade de contestação; critérios de ordenação detalhados; política de guarda/exclusão de dados; uso por menores; acesso a fontes externas; disponibilidade offline. O protótipo pode ilustrar o fluxo proposto sem transformar essas hipóteses em regras jurídicas ou técnicas definitivas.

## 10. Critérios de conclusão do protótipo

O trabalho no Figma está pronto para revisão quando:

- Todos os frames S01–S03, P01–P14 e M01–M08 existem em alta fidelidade, com estados da seção 5 representados por variantes ou frames.
- O protótipo permite percorrer F1, F2 e F3 do começo ao fim, inclusive um erro recuperável e volta sem perda inesperada de texto.
- Componentes, cores e tipografia são reutilizados; não há conteúdo cortado em 360, 390 e 430 px, incluindo texto ampliado e teclado demonstrado.
- A leitura de pergunta, contexto, fontes e alcance de visibilidade antecede a escrita; a justificativa obrigatória e a ausência de placar de vencedor são verificáveis na interface.
- Denúncia mostra revisão humana, mediação registra decisão, e síntese aparece com revisão, autor/data e distinção entre argumentos, acordos, divergências e dúvidas.
- Todos os botões, abas, menus, sheets e retornos do cenário principal têm destino funcional; estados vazios e de erro têm instruções e saída.
- Uma rodada de teste com participantes e mediadores verifica: entender a pergunta e a visibilidade; encontrar fontes; publicar uma justificativa; responder a outra perspectiva; denunciar; localizar a síntese; revisar um caso e publicar a síntese. Registrar obstáculos e corrigir os problemas de compreensão que impeçam a tarefa.

### 10.1 Roteiro mínimo de teste moderado

**Participante:** “Você recebeu um convite. Descubra quem verá sua participação; leia o tema; publique uma posição explicando seu motivo; faça uma pergunta sobre outra posição; encontre a síntese.” Observar caminhos, hesitações, compreensão de `Concordo` versus `Tenho uma dúvida` e se a pessoa entende que a síntese não é votação.

**Mediador:** “Crie um debate com contexto e fonte; examine uma denúncia; registre sua decisão; publique uma síntese que inclua uma divergência e uma questão em aberto.” Observar campos ausentes, entendimento do alcance do convite e risco de publicar sem revisão.

**Entrega esperada:** link do arquivo Figma, links diretos dos três fluxos, biblioteca de componentes, lista de pendências e registro das decisões alteradas após teste. O agente deve trabalhar primeiro em wireframes e validar a arquitetura, depois aplicar o sistema visual e conectar a navegação.
