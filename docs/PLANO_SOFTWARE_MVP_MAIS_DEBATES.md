# +Debates — planejamento de software para Codex

**Versão:** 1.0 · 17 de outubro de 2026  
**Alvo:** MVP mobile em React Native, Expo e React Native Skia  
**Fonte de produto:** `GUIA_FIGMA_MOBILE_MAIS_DEBATES.md` e [protótipo visual](https://mais-debates-prototipo-mobile.clean-box-0623.chatgpt.site).  
**Natureza deste documento:** plano de implementação. Decisões marcadas como **proposta** devem ser validadas pelo responsável pelo produto antes da operação com usuários reais.

## 1. Ideia e objetivo

O +Debates é um aplicativo educativo para discutir questões públicas em grupos convidados. Estudantes e jovens leem uma pergunta delimitada, contexto, termos e fontes; registram uma posição com justificativa; conhecem outras razões; respondem com respeito; e consultam uma síntese revisada por um mediador. Professores ou mediadores criam debates, selecionam fontes, acompanham denúncias e publicam sínteses que preservam argumentos, pontos de encontro, divergências e questões abertas.

**Problema:** discussões digitais frequentemente incentivam reações rápidas, sem contexto nem explicação. **Resultado esperado:** uma pessoa consegue entender uma questão, formular uma razão e dialogar sem precisar disputar um placar de popularidade.

### Regras que moldam o software

1. Conteúdo é restrito ao grupo convidado. A interface informa o alcance da visibilidade antes da primeira contribuição.
2. A leitura de contexto, fontes, conversa e síntese é possível sem publicação.
3. Publicar uma posição exige perspectiva textual e justificativa não vazia. `Ainda estou refletindo` admite uma dúvida explicada.
4. Uma posição principal por participante e debate, editável durante a fase aberta; respostas são registros separados.
5. `Concordo` é reversível. `Tenho uma dúvida` abre uma resposta do tipo pergunta ligada à contribuição original.
6. Apoios não definem resultado nem são o único critério de ordenação. Não existe vencedor.
7. Denúncias recebem revisão humana. Ocultar exige motivo; a identidade de quem denunciou não é revelada ao autor.
8. A síntese precisa de publicação explícita por mediador, com autor, revisão, data e versões. Ela não fala em nome de todas as pessoas.
9. Um debate encerrado mantém leitura, mas bloqueia novas posições, edições e respostas.
10. O aplicativo coleta o mínimo de dados pessoais; nome de exibição é separado da identidade técnica da conta.

## 2. Escopo e entregáveis do MVP

**Fluxos completos:** convite → identificação e regras → contexto → conversa → posição → resposta/dúvida/concordância → denúncia → mediação → encerramento → síntese. O app inclui lista de debates, minha atividade e perfil. As telas seguem os identificadores S01–S03, P01–P14 e M01–M08 do guia visual.

**Entrega de engenharia:** código versionado, app Android instalável para piloto, build iOS de desenvolvimento/simulador quando houver ambiente, Supabase com migrations e políticas RLS, funções de escrita, testes de autorização, documentação de deploy/recuperação e exemplos de dados fictícios. O protótipo visual é referência de aparência e microtexto; seu `localStorage` e seus botões demonstrativos não são backend de produção.

**Fora do MVP:** chat privado, perfis públicos, feed aberto, anexos de usuários, ranking, gamificação, pontuação, IA publicando sínteses, fact-check automático, moderação automática punitiva, notificações push, conteúdo offline com sincronização de escrita, dashboards analíticos e painel web separado. Adicionar apenas por decisão posterior.

## 3. Stack recomendada e justificativa

| Camada | Escolha para o MVP | Responsabilidade / motivo |
| --- | --- | --- |
| App | React Native + Expo + TypeScript estrito | Base única Android/iOS, iteração rápida e builds gerenciados. Fixar versões no lockfile; instalar módulos nativos com `npx expo install`. |
| Navegação | Expo Router | Rotas por arquivos, deep link de convite, pilhas e abas. Usar APIs estáveis da versão de Expo escolhida. |
| UI | React Native `View`, `Text`, `Pressable`, `TextInput`, `FlatList`, `StyleSheet`; `react-native-safe-area-context`; ícones consistentes | Texto e controles continuam nativos e acessíveis. Tokens do guia visual; evitar dependência grande de UI kit no MVP. |
| Gráficos | `@shopify/react-native-skia` | Ilustrações abstratas de entrada, pequenos elementos decorativos e transições discretas. Nunca desenhar o texto de argumentos, botões ou inputs em Canvas. O pacote é listado na documentação do Expo e instalado com `expo install`. |
| Estado remoto | TanStack Query | Cache, paginação, refetch ao voltar ao app, invalidação após mutação; tratar rede instável. |
| Formulários e schemas | React Hook Form + Zod | Validação de interface e contratos reutilizáveis; o servidor valida tudo de novo. |
| Estado local | Context/reducer pequeno ou Zustand, apenas para sessão visual, filtros e rascunhos | Não duplicar a fonte de verdade do servidor. |
| Sessão local | `expo-secure-store` com adaptador para o cliente Supabase; armazenamento de rascunho não sensível conforme necessidade | Sessão persistente em armazenamento apropriado ao dispositivo; não guardar chave de serviço. |
| Banco + Auth | Supabase Postgres + Supabase Auth | Relações fortes, constraints, migrations SQL e controle por linha (RLS). |
| Backend | Supabase Edge Functions (TypeScript/Deno) + funções SQL transacionais restritas | Ações privilegiadas e regras de negócio; evita um servidor Node sempre ligado para o piloto. |
| Arquivos | Links externos de fontes, metadados no Postgres | Sem upload no primeiro MVP. Storage só se o produto vier a hospedar arquivos próprios. |
| Observabilidade | Logs estruturados das funções, métricas do Supabase e falhas locais com dados mínimos | Diagnóstico de erros, volume e abuso sem registrar o texto privado dos debates nos logs. |
| Build/distribuição | EAS Build e EAS Update, canais `preview`/`production` | APK para piloto Android, builds assinados e atualizações de JS/assets compatíveis com o runtime nativo. |
| Controle de versão/CI | GitHub + Actions para typecheck, lint, testes e migrations em ambiente de teste | Gatilhos em PR; deploy do banco e do app por etapas controladas. |

**Decisão de infraestrutura:** Supabase é o serviço de banco, autenticação e servidor do MVP. O cliente pode consultar dados autorizados diretamente via API do Supabase sob RLS; escritas e transições de estado passam por Edge Functions e operações SQL transacionais. Não criar simultaneamente uma API Express/NestJS, um ORM com esquema paralelo e um segundo banco. A documentação oficial do Supabase destaca a combinação Auth + RLS; a separação entre a chave pública do cliente e credenciais privilegiadas do backend é indispensável. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Edge Functions](https://supabase.com/docs/guides/functions).

**Compatibilidade:** escolher uma versão estável do Expo SDK ao iniciar o repositório, executar `npx expo install --check` e manter dependências compatíveis; não copiar números de versão deste plano como pinagem futura. Expo documenta [Expo Router](https://docs.expo.dev/router/introduction/) e [Skia](https://docs.expo.dev/versions/latest/sdk/skia/). A documentação do TanStack Query descreve integrações com [AppState e conectividade no React Native](https://tanstack.com/query/latest/docs/framework/react/react-native).

### 3.1 Por que Skia entra no projeto

Usar Skia para o motivo gráfico de dois balões de conversa na entrada, fundos geométricos leves de estados vazios e uma transição breve de publicação. O componente recebe `width`/`height` responsivos e respeita preferência por movimento reduzido; há alternativa estática. A navegação, os cards, chips, texto e formulários são componentes React Native comuns. Medir desempenho em um Android intermediário antes de manter animações. Se Skia aumentar o custo de build sem benefício visual claro, deixar os gráficos em uma camada isolada para substituição sem mexer nos fluxos.

## 4. Banco, servidor e orçamento do piloto

### 4.1 Plano gratuito recomendado

Na consulta de **17/10/2026**, a página oficial do [Supabase Free](https://supabase.com/pricing) informava 500 MB de banco, 50 mil usuários ativos mensais, 1 GB de armazenamento, 5 GB de egress, limite de dois projetos ativos e pausa de projeto gratuito após uma semana sem atividade. A documentação de [Edge Functions](https://supabase.com/docs/guides/functions/pricing) informava 500 mil invocações gratuitas. As cotas mudam: conferir novamente antes de abrir o piloto. O plano é adequado para poucos grupos com textos curtos, desde que a pausa por inatividade seja aceitável para testes e haja plano de exportação/recuperação. Não interpretar a cota de usuários como garantia de desempenho ou disponibilidade.

O [Expo Free](https://docs.expo.dev/billing/plans/) oferece quantidade mensal limitada de builds de baixa prioridade e EAS Update gratuito dentro das cotas. Planejar builds só após uma fatia funcional ou alteração nativa; conferir a quota da conta antes de cada rodada de piloto. Mudanças em código nativo/versão de runtime exigem novo binário; mudanças JS/assets compatíveis podem usar EAS Update. [Atualizações Expo](https://docs.expo.dev/eas-update/introduction/).

| Cenário | Banco/API | Distribuição | Desembolso obrigatório do serviço para piloto |
| --- | --- | --- | --- |
| Piloto fechado Android por APK | Supabase Free | EAS Free, distribuição interna | Pode começar sem mensalidade de infraestrutura, dentro das quotas. |
| Publicar na Google Play | Supabase Free ou pago conforme uso | Build AAB + Play Console | Conta Play Console: taxa única de US$ 25 (conferir valor local). |
| Publicar na App Store/TestFlight | Supabase Free ou pago conforme uso | Build iOS + conta Apple | Apple Developer Program: US$ 99 por ano, salvo elegibilidade a isenção. |

Fontes: [EAS internal distribution](https://docs.expo.dev/build/internal-distribution/), [taxa Google Play](https://support.google.com/googleplay/android-developer/answer/6112435?hl=pt-BR), [Apple Developer Brasil](https://developer.apple.com/br/help/account/membership/program-enrollment/). O piloto Android instalado por APK é o caminho mais econômico para testar com convite. A distribuição iOS real depende de assinatura/provisionamento Apple; não prometer TestFlight gratuito.

**Limites operacionais:** projeto gratuito do Supabase pode pausar e o [plano Free não fornece download de backup pelo painel](https://supabase.com/docs/guides/deployment/going-into-prod). Manter migrations no Git e um procedimento testado de exportação SQL fora do dispositivo do usuário, com armazenamento seguro e acesso mínimo. Não publicar dados de turmas sem decidir retenção e recuperação. Quando houver uso contínuo com expectativa de disponibilidade, avaliar upgrade do banco antes de prometer serviço permanente.

**Alternativas avaliadas:** Firebase Auth/Firestore (Spark) é viável, mas a estrutura de grupo, pertença, posição única e moderação se encaixa naturalmente em Postgres com constraints e transações. Cloudflare Workers + D1 também tem nível gratuito, mas exigiria montar autenticação, autorização e governança do banco por conta própria; o [plano gratuito do Workers](https://developers.cloudflare.com/workers/platform/limits/) e os [limites do D1](https://developers.cloudflare.com/d1/platform/pricing/) devem ser conferidos se a estratégia mudar. Não implantar a alternativa em paralelo neste MVP.

## 5. Identidade, convite e autorização

**Proposta para piloto restrito:** participantes entram com convite individual de uso único e [Supabase Auth anônimo](https://supabase.com/docs/guides/auth/auth-anonymous); o app cria/preserva a sessão no dispositivo e vincula o `auth.uid()` a uma participação em um espaço. Mediadores usam conta permanente (email e senha ou outro método configurado), com autenticação reforçada. O usuário anônimo do Auth tem identidade técnica e papel `authenticated` no banco; ele **não** equivale ao papel SQL `anon` e não recebe acesso a grupos sem vínculo explícito. Esse modelo evita pedir email do estudante no primeiro piloto.

**Consequência:** remover o app ou perder a sessão anônima pode tornar a contribuição inacessível ao participante. Exibir essa limitação aos testadores; antes do lançamento amplo, oferecer vínculo de conta/recuperação com política de identidade definida. O compartilhamento de convite individual permite que quem recebe primeiro o link o resgate: emitir código de curta validade, com uso único, distribuir por canal controlado e permitir invalidação pelo mediador. Não usar convite de grupo ilimitado como única barreira de acesso.

**Resgate:** link `maisdebates://convite/<token>` ou universal link configurado; a tela mostra metadados mínimos não sensíveis. A função `redeem-invite` recebe token, verifica JWT da sessão, calcula hash do token no servidor, confere expiração/uso/revogação e cria associação de forma atômica. Banco armazena apenas hash, nunca o token puro. Resposta distingue convite expirado/usado/inválido sem expor dados de outra turma. Ações e limites de tentativas são registrados sem texto de debate. A documentação do Supabase recomenda proteção contra abuso em login anônimo, inclusive CAPTCHA/Turnstile; definir um caminho de desafio compatível com mobile ou substituir o método de entrada antes de abrir acesso amplo.

**Autorização invariável:** papel de mediador vem de `space_memberships.role`, não de flag enviada pelo cliente, nome de exibição ou `user_metadata`. Toda leitura verifica a pertença ao `space_id` correspondente; toda escrita verifica autor, papel, estado do debate e conteúdo. Um JWT válido sem membership não vê debates privados. Nunca colocar `service_role`/`secret key` em `EXPO_PUBLIC_*`, no bundle, em screenshot ou em logs; a chave pública do Supabase só é segura em conjunto com grants e RLS corretos.

## 6. Modelo relacional proposto

Campos de todas as tabelas: `id uuid` (salvo chaves compostas), `created_at timestamptz`; usar `updated_at` onde houver edição. `author_user_id` referencia `auth.users` por UUID. Migrations SQL versionadas são fonte da verdade. `CHECK`, `UNIQUE`, FKs e índices complementam a validação da API.

| Tabela | Campos essenciais | Restrições e acesso |
| --- | --- | --- |
| `spaces` | `id`, `title`, `created_by`, `status` | Sala/grupo privado; leitura só por membro ativo. |
| `space_memberships` | `space_id`, `user_id`, `role(participant/mediator)`, `display_name`, `status`, `joined_at` | `UNIQUE(space_id,user_id)`; nome exibido dentro do espaço. Papéis só alterados por fluxo administrativo. |
| `invitations` | `space_id`, `debate_id?`, `token_hash`, `expires_at`, `max_uses=1`, `uses`, `revoked_at`, `created_by` | Hash único; leitura apenas do mediador; consumo atômico; token puro nunca persistido. |
| `debates` | `space_id`, `question`, `context`, `status(draft/open/closed)`, `opens_at`, `closes_at`, `created_by`, `version` | Só mediador abre/encerra; pergunta/contexto obrigatórios; ao menos uma fonte antes de abrir. |
| `debate_terms` | `debate_id`, `term`, `definition`, `sort_order` | Glossário contextual. |
| `debate_sources` | `debate_id`, `title`, `publisher`, `url`, `published_at?`, `why_read`, `sort_order` | URL validada (`https`), metadados mínimos; sem uploads no MVP. |
| `positions` | `debate_id`, `author_user_id`, `stance`, `rationale`, `source_url?`, `revision`, `edited_at?`, `visibility` | `UNIQUE(debate_id,author_user_id)`; justificativa não vazia; edição só pelo autor enquanto aberto. `visibility=hidden` sob moderação. |
| `replies` | `debate_id`, `position_id`, `author_user_id`, `kind(reply/question)`, `body`, `visibility` | Primeiro MVP com uma camada de respostas por posição; `debate_id` deve coincidir com a posição. |
| `agreements` | `position_id`, `user_id` | `UNIQUE(position_id,user_id)`; toggle idempotente; não decide destaque editorial. |
| `reports` | `debate_id`, `reporter_user_id`, `target_type(position/reply)`, `target_id`, `reason`, `details?`, `status`, `resolved_at?` | Alvo e grupo consistentes; leitor comum só enxerga sua própria confirmação/status limitado; mediador vê a fila. |
| `moderation_actions` | `report_id`, `moderator_user_id`, `decision(keep/hide/restore)`, `reason`, `created_at` | Log imutável de decisões. Ocultar requer motivo; autor vê motivo seguro para exibição. |
| `summaries` | `debate_id`, `revision`, `overview`, `arguments`, `agreements_text`, `divergences`, `open_questions`, `status(draft/published)`, `reviewed_by`, `published_at` | Rascunho só mediador; publicação requer campos e revisão humana; preservar revisões. |
| `write_requests` | `actor_user_id`, `operation`, `idempotency_key`, `result_ref`, `created_at` | `UNIQUE(actor_user_id,operation,idempotency_key)` para evitar duplicação em retry. Expurgo periódico. |

Índices iniciais: `debates(space_id,status,closes_at)`, `positions(debate_id,created_at,id)`, `replies(position_id,created_at,id)`, `reports(debate_id,status,created_at)`, `summaries(debate_id,status,revision desc)`, `invitations(token_hash)`. Paginar por cursor estável `(created_at,id)`; não carregar toda a conversa. Usar relógio do servidor em regras de prazo. Triggers ou funções transacionais asseguram status e versão. Contribuição ocultada não aparece a outros participantes, mas autor e mediador veem estado e razão conforme autorização.

### 6.1 Matriz mínima de RLS

| Recurso | Participante membro | Autor | Mediador membro | Visitante sem membership |
| --- | --- | --- | --- | --- |
| Espaço, debate, termos, fontes | Leitura | Igual | Leitura/edição conforme estado | Nenhuma leitura de conteúdo privado |
| Posição e resposta visíveis | Leitura no grupo | Edição própria enquanto aberto | Leitura, ação de moderação | Nenhum acesso |
| Conteúdo oculto | Não lê conteúdo de terceiros | Lê o próprio com estado | Lê com contexto | Nenhum acesso |
| Denúncia | Pode enviar; acompanha confirmação própria | Igual | Lê fila e decide | Nenhum acesso |
| Convites e identidade do denunciante | Não lê | Não lê | Apenas necessários ao trabalho | Nenhum acesso |
| Síntese rascunho/publicada | Só publicada | Igual | Lê/edita rascunho, publica | Nenhum acesso |

Criar teste automatizado para cada `SELECT/INSERT/UPDATE/DELETE` permitida e negada com pelo menos dois grupos, dois participantes e um mediador. Atenção às views: quando usadas, configurar para respeitar a RLS do invocador. Revogar privilégios não necessários, além das policies. [Guia oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 7. Contratos de servidor e estados

**Leituras:** consultas tipadas do cliente Supabase a `my_spaces`, `debates`, `sources`, `terms`, `visible_positions`/tabelas protegidas e `published_summaries`; limitar colunas, ordenar e paginar. `get_debate_context` pode consolidar cabeçalho/contexto/fontes numa única leitura se o custo de rede justificar. Evitar view que contorne RLS.

**Escritas:** Edge Functions recebem `Authorization: Bearer <access_token>`, validam o usuário no servidor, corpo com Zod, membership, estado e permissões; chamam função SQL transacional restrita. Ações propostas:

| Operação | Entrada | Resultado / regras |
| --- | --- | --- |
| `redeem-invite` | token, nome de exibição | membership criada ou erro determinístico; uso único e atômico. |
| `create-debate` | pergunta, contexto, período, termos, fontes | rascunho; mediador do espaço. |
| `open-debate` | debate ID, versão | exige pergunta/contexto/fonte e prazo válidos; evita abrir duas vezes. |
| `upsert-position` | debate ID, posição, justificativa, fonte opcional, idempotency key | uma posição/autor/debate; editar incrementa revision; aberto. |
| `create-reply` | posição ID, tipo, texto, idempotency key | alvo no mesmo grupo; aberto; texto não vazio. |
| `toggle-agreement` | posição ID, estado desejado (`true/false`) | operação idempotente, resposta com estado atual. |
| `create-report` | alvo, motivo, detalhe opcional | confirmação; sem remoção imediata; limite por autor/alvo. |
| `resolve-report` | denúncia ID, manter/ocultar, razão, versão | só mediador; ação auditada; notificação/estado do autor. |
| `close-debate` | debate ID, versão | bloqueia escrita; não apaga conteúdo. |
| `save-summary` / `publish-summary` | campos e revisão | só mediador; publicação valida estado encerrado e campos essenciais; revision preservada. |

Formato comum: `{ data, error: { code, message, details? }, requestId }`; códigos previsíveis como `INVITE_EXPIRED`, `NOT_A_MEMBER`, `DEBATE_CLOSED`, `VALIDATION_ERROR`, `VERSION_CONFLICT` e `RATE_LIMITED`. Mensagens pt-BR no app; detalhes internos não enviados ao cliente. Conflitos de edição usam `version`/`revision` para evitar sobrescrever mudanças de outro mediador. Todo endpoint sensível tem limite de tamanho, paginação onde cabível, limitação de frequência e idempotência. O backend não aceita IDs de autor ou papel enviados pelo cliente como fonte de autoridade.

### 7.1 Estados de domínio

```text
Debate: draft → open → closed
                         ↳ summary draft → published → revised
Relato: pending → kept | hidden → restored (se decisão posterior)
Convite: active → redeemed | expired | revoked
```

Ao criar debate, o mediador pode salvar rascunho incompleto; somente `open-debate` exige fonte identificada. `published` refere-se à síntese, não altera `debates.status=closed`. Transições ocorrem no servidor com timestamp do banco. Uma atualização de síntese após publicação cria revisão adicional com data e autor.

## 8. Aplicativo: arquitetura e experiência

```text
src/
  app/                 # rotas Expo Router: entrada, tabs, debate, mediação
  features/
    invitations/       # UI, hooks, schemas e serviços por domínio
    debates/
    contributions/
    reports/
    moderation/
    summaries/
  shared/
    ui/                # botão, card, chip, banner, input, skeleton
    theme/             # cores, tipografia, espaçamento, raios
    graphics/          # componentes Skia isolados + fallback estático
    lib/               # supabase client, query client, error mapping
    types/             # tipos gerados e contratos
supabase/
  migrations/          # DDL, constraints, grants, RLS, RPC
  functions/           # servidor e testes de contrato
  seed.sql             # dados fictícios, nunca dados reais
docs/                 # decisões, deploy, recuperação, privacidade
```

**Navegação:** rota de convite e regras; abas `Debates`, `Minha atividade`, `Perfil`; detalhe com `Contexto`, `Conversa`, `Síntese`; rotas de formulário em stack; área `Mediação` apenas para membro com papel. Deep link validado mesmo após instalação/sessão; rota não libera conteúdo antes do resgate. As 25 telas do guia podem compartilhar componentes e estados; não duplicar lógica para cada frame.

**Tokens visuais:** azul `#244C92`, texto `#172334`, base `#F7F9FC`, borda `#D9E0E9`, raio de card 12–14, espaçamento 4/8/12/16/24/32. Cores de perspectiva têm peso semelhante e sempre vêm com texto. Respeitar safe area, teclado, fonte ampliada, toque confortável e leitor de tela. Acessibilidade é critério de aceite, não uma etapa cosmética.

**Gerência de estado:** TanStack Query possui chaves por espaço/debate; filtro de conversa é estado local; rascunhos são persistidos somente quando necessário. Ao voltar do background, atualizar dados remotos e sessão. Mostrar `loading/empty/error/retry` em cada leitura. Após publicar, invalidar query da conversa/minha atividade e confirmar o dado gravado; em falha, manter o texto editado. Para `Concordo`, atualização otimista reversível com rollback. Para denúncia e publicação de síntese, esperar confirmação real do servidor antes de mostrar sucesso.

**Desempenho:** `FlatList`/`FlashList` se volumes justificarem, chave estável, páginas pequenas e expansão de texto; fontes carregadas de modo controlado; gráficos Skia fora das listas longas. Tempo e memória devem ser medidos em aparelho físico intermediário, não apenas simulador.

## 9. Casos de uso e critérios de aceite

| ID | Ator e caso | Fluxo principal | Falha/alternativa testável |
| --- | --- | --- | --- |
| UC01 | Participante resgata convite | Abre link, lê alcance, aceita regras, escolhe nome, entra no grupo | Token expirado/usado/inválido mostra saída; pessoa sem membership não acessa URL direta. |
| UC02 | Participante lê tema | Abre pergunta, contexto, glossário e fontes sem publicar | Fonte externa indisponível não bloqueia leitura do debate. |
| UC03 | Participante publica posição | Escolhe uma perspectiva, explica, publica, vê card próprio | Justificativa vazia rejeitada no app e servidor; retry não duplica. |
| UC04 | Participante revisa posição | Abre sua atividade, edita, salva, vê `Editado` | Debate encerrado ou versão conflitante preserva texto e orienta. |
| UC05 | Participante dialoga | Lê outro argumento, concorda/reverte, pergunta ou responde | Resposta a alvo de outro grupo falha; não há escrita após encerramento. |
| UC06 | Participante denuncia | Escolhe motivo, envia, vê recebimento | Sem remoção instantânea; ninguém descobre autor da denúncia fora da mediação. |
| UC07 | Mediador cria debate | Rascunha, adiciona contexto/termos/fonte, pré-visualiza e abre | Abertura sem pergunta, contexto ou fonte falha. |
| UC08 | Mediador analisa denúncia | Lê alvo/contexto, mantém ou oculta com razão, ação auditada | Participante e mediador de outro grupo não executam decisão. |
| UC09 | Mediador encerra/publica síntese | Encerra, redige campos, revisa, publica com autoria/data | Publicação sem revisão/campos obrigatórios falha; revisão posterior gera nova versão. |
| UC10 | Participante consulta síntese | Abre se publicada, lê perspectivas, encontros, divergências e dúvidas | Antes da publicação vê estado em preparação; nunca lê rascunho. |

## 10. Segurança, privacidade e operação

- **Dados:** guardar apenas UID técnico, nome de exibição por grupo, conteúdos e registros necessários à moderação. Definir antes do piloto prazo de retenção, procedimento de exclusão e quem pode exportar. Se houver menores de idade, validar condições de participação e tratamento de dados com responsável jurídico/institucional antes da coleta real.
- **URLs e texto:** validar `https://` de fontes, usar componentes de texto do React Native (sem HTML arbitrário), bloquear URLs maliciosas e limitar tamanho. Não renderizar conteúdo HTML remoto dentro do app no MVP.
- **Permissões:** RLS e grants em toda tabela exposta; SQL RPC privilegiada não executável pelo cliente; teste de acesso cruzado por grupo. Não confiar só em esconder botão.
- **Segredos:** publicar apenas URL e publishable key no app; segredo da função em ambiente Supabase. Ambientes `local`, `staging`, `pilot` com projetos separados se a quota permitir; se o Free limitar a dois, usar `local` via Supabase CLI e um projeto piloto remoto.
- **Abuso:** convites individuais, expiração/revogação, limites de frequência por UID e operação, validação, proteção do Auth anônimo. Moderador e infraestrutura com MFA onde disponível.
- **Logs:** `requestId`, operação, duração e código de erro; não registrar token de convite, JWT, nome de estudante, conteúdo do argumento ou detalhe da denúncia. Limitar acesso e retenção.
- **Disponibilidade:** erro amigável e retry quando projeto estiver indisponível; monitorar consumo, pausa por inatividade e uso do banco. Definir responsável por restaurar acesso e responder a denúncias.
- **Recuperação:** migrations reexecutáveis em ambiente novo, exportação periódica cifrada, teste de restauração com dados fictícios e registro de versão. `seed.sql` nunca contém dados reais.
- **Conformidade:** apresentar política de privacidade/termos e fluxo de solicitação de remoção antes do piloto real; conferir requisitos específicos do público e das lojas com orientação especializada. Esta seção é requisito de planejamento, não parecer jurídico.

## 11. Qualidade e automação

**Testes prioritários:**

1. Unidade para validações e máquina de estados: convite, prazo, posição única, justificativa, relatório, síntese e transições.
2. Integração do banco/RLS com dois grupos: participante A não lê B; mediador A não modera B; sem membership não lê; ocultação e rascunho não vazam; convite não é reutilizável.
3. Contrato das Edge Functions: JWT ausente/inválido, rate limit, idempotência, conflito de revisão, erros previsíveis e transação atômica.
4. Componentes/fluxos com Jest + React Native Testing Library: leitor entende visibilidade, campo inválido, preservação de rascunho, estados `loading/error`, conversa, moderação. [Guia Expo](https://docs.expo.dev/develop/unit-testing/).
5. Uma rodada E2E em Android físico ou emulador para F1, F2, F3. Testar teclado, botão voltar, deep link, interrupção de rede, fonte ampliada e movimento reduzido. E2E pode usar Maestro quando a equipe tiver ambiente estável.

**CI em PR:** `npm ci` → typecheck → lint → testes de unidade/fluxo → testes SQL/RLS em Supabase local → build de bundle/verificação Expo quando apropriado. Não consumir quota de EAS Build em cada commit. Migrations aplicadas primeiro em staging; produção/piloto exige confirmação da compatibilidade do app e plano de reversão. Usar lockfile único e secrets do CI.

**Métricas de produto sem ranking de pessoas:** convites resgatados, leitura de contexto, posição com justificativa publicada, respostas/dúvidas, denúncias pendentes e tempo até decisão, sínteses publicadas. Agregar por debate/grupo quando necessário; não criar perfilagem individual para engajamento.

## 12. Plano de execução em fatias verticais

| Fase | Entrega concreta | Gate de conclusão |
| --- | --- | --- |
| 0 · Preparação | Repositório Expo TS, tema, Router, Skia isolado, Supabase CLI local, decisões pendentes registradas | Android inicia; navegação e tema carregam; `expo install --check` sem conflitos. |
| 1 · Núcleo seguro | Migrations, RLS, Auth, convite individual, membership e telas S02/P01/P02 | Resgate único, dois grupos isolados em testes; sem acesso por URL direta. |
| 2 · Debate e posições | Contexto/fontes, listagem paginada, publicação/edição de posição, estados de erro | UC02–UC04 em dispositivo; constraints e retry sem duplicação. |
| 3 · Diálogo e cuidado | Respostas/dúvidas, concordância, denúncia, fila e decisão auditada | UC05–UC08; teste adversarial de RLS e motivo de ocultação. |
| 4 · Fechamento | Encerrar, editor/prévia/publicação/revisão de síntese, minha atividade e perfil | UC09–UC10; rascunho não vaza e escrita encerrada é bloqueada. |
| 5 · Piloto | Acessibilidade, testes E2E, monitoramento, exportação/restauração, APK EAS interno, documentos de operação | Fluxos F1–F3 completos em aparelho real e mediador treinado. |

As fases são sequenciais por dependência, não datas prometidas. Ao final de cada fase, entregar UI, contrato, migrations, policies e teste de aceitação daquela fatia. Não deixar toda autorização ou integração de servidor para o fim.

## 13. Skills e instruções necessárias para um agente Codex

**Competências a aplicar:** React Native/Expo e roteamento; TypeScript e validação; layout acessível; Skia para gráficos; Postgres com constraints, índices, transações e RLS; Supabase Auth/Edge Functions; modelagem de ameaças para convites e moderação; testes mobile e SQL; EAS Build/Update; observabilidade e operação. Não presumir uma “skill” instalada apenas pelo nome: se o ambiente Codex disponibilizar skills específicas, ler seus `SKILL.md` antes de aplicá-las. Documentação oficial citada neste arquivo é a referência para APIs mutáveis.

**Contrato de trabalho sugerido para `AGENTS.md` do repositório:**

```md
# +Debates · instruções para agentes
- Leia `docs/PLANO_SOFTWARE_MVP_MAIS_DEBATES.md` e o guia visual antes de alterar fluxo ou arquitetura.
- Desenvolva em TypeScript estrito, Expo e React Native; instale módulos nativos com `npx expo install`.
- Use Skia para gráficos decorativos, com alternativa estática. Texto e controles precisam ser nativos e acessíveis.
- Toda operação de banco requer migration; toda tabela exposta requer grants, RLS e testes com dois grupos.
- A fonte da autorização é `auth.uid()` + membership no servidor. Nunca confie em papel ou autor vindos do cliente.
- Nunca inclua `service_role`, secret, JWT ou token de convite em código público, logs ou testes versionados.
- Faça uma fatia vertical por tarefa: UI + contrato + banco + erro + teste útil. Preserve rascunho em falhas.
- Use nomes de rotas, estados e componentes alinhados ao guia; documente desvios.
- Antes de concluir: typecheck, lint, testes relevantes e validação em Android real/emulador quando houver mudança nativa ou UX crítica.
- Não publique build, abra grupo real nem cole dados de participantes sem autorização do responsável pelo produto.
```

**Ordem dos prompts para Codex:**

1. “Crie o projeto Expo TypeScript com Router, tokens visuais, componentes base, Skia decorativo e rotas S/P/M. Mostre a árvore, instale versões compatíveis e rode typecheck.”
2. “Crie migrations SQL para o modelo de dados, RLS/grants, seeds fictícios e testes de isolamento entre dois grupos. Não implemente telas de conteúdo real sem passar esses testes.”
3. “Implemente convite individual, Auth e sessão, Edge Function de resgate atômico, telas de convite/regras e testes de expiração/reuso.”
4. “Implemente leitura de debate e fontes, posição justificada e edição; inclua falha de rede, idempotência e integração de UI/servidor.”
5. “Implemente respostas, dúvidas, concordâncias, denúncia e fila de moderação com auditoria; teste limites de papel e ocultação.”
6. “Implemente encerramento e síntese revisada/versionada; teste rascunho privado, publicação e bloqueio de escrita.”
7. “Finalize E2E, acessibilidade, operação, exportação/restauração e perfil EAS preview Android. Gere APK do piloto quando as credenciais e ambiente estiverem configurados.”

Cada prompt deve pedir ao agente: alterações realizadas, arquivos principais, testes executados, riscos restantes e a próxima dependência. O plano permite mais de um agente especializado, mas uma pessoa/agente integrador deve manter os contratos e migrations consistentes.

## 14. Comandos de partida e configuração

Os comandos abaixo são **roteiro**, não execução realizada. Verificar versões/compatibilidade no momento da criação.

```bash
npx create-expo-app@latest mais-debates
cd mais-debates
npx expo install @shopify/react-native-skia expo-secure-store react-native-safe-area-context expo-linking
npx expo install @supabase/supabase-js react-native-url-polyfill
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install -D supabase typescript
npx expo install --check
npx supabase init
npx supabase start
```

`supabase start` exige Docker ou runtime de contêiner compatível no computador. Caso não esteja disponível, trabalhar inicialmente com um projeto remoto de desenvolvimento e aplicar migrations via CLI, sem misturar seus dados aos do piloto.

Confirmar a instalação/configuração do Expo Router do template antes de adicioná-lo manualmente. A inicialização do cliente Supabase em React Native segue [o guia oficial](https://supabase.com/docs/guides/auth/quickstarts/react-native) com adaptador de armazenamento de sessão adequado; a proteção de token e o comportamento de refresh devem ser testados no dispositivo. Usar `.env.example` com apenas `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; secrets ficam em Supabase/CI. Para deploy, preparar `eas.json` com perfis `development`, `preview` (Android APK, distribuição interna) e `production` (loja), sem dados reais nos builds de teste.

## 15. Decisões a fechar antes de abrir um piloto real

1. Idade e perfil do público, autorização institucional e política de nome/identidade.
2. Recuperação de conta após perda do dispositivo; anonimato técnico serve apenas ao piloto controlado?
3. Quem emite, entrega, revoga e substitui convites individuais; duração dos links.
4. Limites de texto, edição e quantidade de respostas; fonte citada pelo participante é URL livre ou seleção de fontes curadas?
5. Prazo de retenção, exclusão, exportação, backup e responsável pela moderação.
6. Critério detalhado do filtro `Perspectivas` sem transformar apoio em ranking.
7. Quais plataformas entram no primeiro piloto: Android APK ou Android+iOS com conta Apple.

**Definição de pronto do MVP:** um mediador abre um debate com contexto e fonte, convida uma pessoa, ela lê e participa com justificativa, dialoga, denuncia conteúdo inadequado, o mediador decide com registro, encerra e publica síntese; outra pessoa sem vínculo ao grupo não consegue ler nem alterar esses dados. O ciclo funciona em um build mobile instalado, com falhas de rede recuperáveis e testes de autorização passando.

## Fontes técnicas consultadas em 17/10/2026

- [Expo Router](https://docs.expo.dev/router/introduction/), [Skia no Expo](https://docs.expo.dev/versions/latest/sdk/skia/), [EAS Free](https://docs.expo.dev/billing/plans/), [EAS distribuição interna](https://docs.expo.dev/build/internal-distribution/) e [EAS Update](https://docs.expo.dev/eas-update/introduction/).
- [Supabase pricing](https://supabase.com/pricing), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Auth anônimo](https://supabase.com/docs/guides/auth/auth-anonymous), [Edge Functions pricing](https://supabase.com/docs/guides/functions/pricing), [checklist de produção](https://supabase.com/docs/guides/deployment/going-into-prod) e [Auth React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native).
- [Google Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=pt-BR), [Apple Developer Program](https://developer.apple.com/br/help/account/membership/program-enrollment/) e [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native).
