# +Debates

Aplicativo mobile de debates em grupos convidados. Implementado em Expo SDK 58, React Native, Expo Router, TypeScript e Supabase, seguindo o [plano de software](docs/PLANO_SOFTWARE_MVP_MAIS_DEBATES.md), o [guia visual](docs/GUIA_FIGMA_MOBILE_MAIS_DEBATES.md) e o [protótipo público](https://mais-debates-prototipo-mobile.clean-box-0623.chatgpt.site).

## Começar

Use Node 24 e Docker. Execute `npm ci`, `npx supabase start` e `npx supabase functions serve`. Copie `.env.example` para `.env.local` e informe a URL e a chave **pública** do Supabase local. Execute `npm start`. O procedimento completo para criar um grupo fictício, testar, implantar e recuperar dados está em [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md).

Verificações: `npx expo install --check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db` (Windows/Docker) e `npx expo export --platform android`.

O app não contém chave privilegiada nem dados reais. Crie contas de mediação e grupos somente em ambiente controlado. Uma build de piloto e o uso com participantes reais exigem decisões operacionais descritas na documentação.
