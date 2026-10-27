# +Debates

Aplicativo mobile de debates em grupos convidados. Implementado em Expo SDK 58, React Native, Expo Router, TypeScript e Supabase.

## Começar

Use Node 24 e Docker. Execute `npm ci`, `npx supabase start` e `npx supabase functions serve`. Copie `.env.example` para `.env.local` e informe a URL e a chave **pública** do Supabase local. Execute `npm start`. O procedimento completo para criar um grupo fictício, testar, implantar e recuperar dados está em [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md).

Verificações: `npx expo install --check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db` (Windows/Docker) e `npx expo export --platform android`.
