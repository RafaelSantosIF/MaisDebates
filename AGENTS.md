# Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: `https://docs.expo.dev/router/introduction.md`

## +Debates · instruções para agentes

- Leia `docs/PLANO_SOFTWARE_MVP_MAIS_DEBATES.md` e o guia visual `[guia](https://mais-debates-prototipo-mobile.clean-box-0623.chatgpt.site)` antes de alterar fluxo ou arquitetura.
- Desenvolva em TypeScript estrito, Expo e React Native; instale módulos nativos com `npx expo install`.
- Use Skia para gráficos decorativos, com alternativa estática. Texto e controles precisam ser nativos e acessíveis.
- Toda operação de banco requer migration; toda tabela exposta requer grants, RLS e testes com dois grupos.
- A fonte da autorização é `auth.uid()` + membership no servidor. Nunca confie em papel ou autor vindos do cliente.
- Nunca inclua `service_role`, secret, JWT ou token de convite em código público, logs ou testes versionados.
- Faça uma fatia vertical por tarefa: UI + contrato + banco + erro + teste útil. Preserve rascunho em falhas.
- Use nomes de rotas, estados e componentes alinhados ao guia; documente desvios.
- Antes de concluir: typecheck, lint, testes relevantes e validação em Android real/emulador quando houver mudança nativa ou UX crítica.
- Não publique build, abra grupo real nem cole dados de participantes sem autorização do responsável pelo produto.
