# +Debates · implementação do MVP

## Executar localmente

Use Node 24, Docker e, para validar Android, Android Studio com emulador ou um aparelho com depuração USB. O repositório usa Expo SDK 58 e `expo-router`. Não copie credenciais de serviço para o aplicativo.

1. `npm ci`
2. `npx supabase start` (Auth anônimo está habilitado em `supabase/config.toml`).
3. Copie `.env.example` para `.env.local`. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave pública mostradas por `npx supabase status`. Em aparelho físico, use o IP da máquina no lugar de `127.0.0.1` e mantenha o aparelho na mesma rede.
4. `npx supabase functions serve` inicia as quatro funções locais. As funções usam as variáveis do ambiente Supabase no servidor.
5. `npm start` e abra o app no Android. Para teste no navegador: `npm run web`.

As migrations criam tabelas, constraints, índices, grants, policies RLS e operações transacionais. O cliente usa apenas a chave pública, lê dados sob RLS e escreve via Edge Functions com JWT verificado. A função SQL recebe o UID obtido pelo servidor, verifica membership e estado do debate. Rascunhos de posição, resposta, debate e síntese ficam no dispositivo e sobrevivem a falhas de rede. Não use `supabase/seed.sql` para dados pessoais.

A conversa carrega contribuições em páginas de 20 e respostas em páginas de 30, com ação para carregar mais. O filtro de perspectivas reorganiza os itens carregados; use **Carregar mais contribuições** para ampliar o conjunto visível.

## Preparar um grupo de teste

Crie uma conta de mediador no Supabase Auth (email/senha) e copie o UUID dela. Em um projeto **local ou de staging**, execute no SQL Editor com UUID e nome de grupo fictícios:

```sql
with new_space as (
  insert into public.spaces(title, created_by)
  values ('Turma de exemplo', '<UUID_DA_CONTA_MEDIADORA>'::uuid)
  returning id
)
insert into public.space_memberships(space_id, user_id, role, display_name)
select id, '<UUID_DA_CONTA_MEDIADORA>'::uuid, 'mediator', 'Mediação de exemplo'
from new_space;
```

Entre em **Perfil → Entrar como mediador**, crie um debate, abra e emita convites individuais no painel. Cada convite expira e é de uso único. O link compartilhado contém o token, portanto envie apenas ao destinatário previsto. A criação de contas de mediador e grupos deve continuar sob controle do operador do Supabase; o app não permite promover participantes.

## Verificação

```text
npx expo install --check
npm run typecheck
npm run lint
npm test
npm run test:db       # Windows + Docker
bash scripts/test-db.sh  # Linux/macOS + Docker
npx expo export --platform web
npx expo export --platform android
```

## Deploy e recuperação

Use um projeto Supabase de staging antes do projeto piloto. Aplique migrations com `npx supabase db push`, depois implante as quatro Edge Functions (`npx supabase functions deploy invite`, `position`, `dialogue`, `mediation`). Configure Auth anônimo, limites de abuso e domínio de redirecionamento no projeto remoto. A URL e chave pública do projeto entram no ambiente de build; credenciais privilegiadas pertencem somente às funções do Supabase. O identificador Android em `app.json` é provisório até definição de propriedade do produto. `eas.json` prepara perfis de desenvolvimento, APK interno e produção; gerar ou distribuir uma build requer autorização do responsável pelo produto.

Antes de migrations em projeto com dados, exporte o banco para armazenamento cifrado e controle o acesso ao arquivo. Registre a versão aplicada e ensaie restauração em um projeto separado com dados fictícios. Restaurar inclui Auth, tabelas públicas e configurações do projeto; migrations sozinhas não recuperam conteúdo produzido. Decida retenção, exclusão, responsável por denúncias e política de privacidade antes de convidar participantes reais.
