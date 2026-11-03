import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('preview'), token: z.string().regex(/^[0-9a-f]{64}$/) }),
  z.object({ action: z.literal('redeem'), token: z.string().regex(/^[0-9a-f]{64}$/), displayName: z.string().trim().min(2).max(60) }),
  z.object({ action: z.literal('issue'), spaceId: z.string().uuid(), debateId: z.string().uuid().nullable(), expiresAt: z.string().datetime(), open: z.boolean() }),
  z.object({ action: z.literal('rename'), displayName: z.string().trim().min(2).max(60) }),
]);

const messages: Record<string, string> = {
  INVITE_INVALID: 'Convite inválido. Confira o link recebido.',
  INVITE_EXPIRED: 'Este convite expirou. Peça um novo à mediação.',
  INVITE_USED: 'Este convite já foi utilizado.',
  INVITE_REVOKED: 'Este convite foi cancelado.',
  ALREADY_A_MEMBER: 'Você já participa deste grupo.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde alguns minutos.',
  VALIDATION_ERROR: 'Confira o nome de exibição e tente novamente.',
  NOT_AUTHENTICATED: 'Entre novamente para continuar.',
  NOT_A_MEDIATOR: 'Esta ação exige acesso de mediação.',
  NOT_A_MEMBER: 'Este grupo não está disponível para sua conta.',
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  if (request.method !== 'POST') return respond({ data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Método inválido.' }, requestId }, 405);
  if (Number(request.headers.get('content-length') || 0) > 2048) return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Solicitação muito longa.' }, requestId }, 400);
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: messages.NOT_AUTHENTICATED }, requestId }, 401);
  const projectUrl = Deno.env.get('SUPABASE_URL');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  const backendKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!projectUrl || !publicKey || !backendKey) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Serviço indisponível.' }, requestId }, 503);
  const authClient = createClient(projectUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.slice(7));
  if (authError || !user) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: messages.NOT_AUTHENTICATED }, requestId }, 401);
  let parsed: z.infer<typeof requestSchema>;
  try { parsed = requestSchema.parse(await request.json()); }
  catch { return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Confira os dados do convite.' }, requestId }, 400); }
  const db = createClient(projectUrl, backendKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = parsed.action === 'preview'
    ? await db.rpc('preview_invite', { p_token: parsed.token })
    : parsed.action === 'redeem'
      ? await db.rpc('redeem_invite', { p_actor: user.id, p_token: parsed.token, p_display_name: parsed.displayName })
      : parsed.action === 'rename'
        ? await db.rpc('update_member_profile', { p_actor: user.id, p_display_name: parsed.displayName })
        : await db.rpc('issue_invite', { p_actor: user.id, p_space_id: parsed.spaceId, p_debate_id: parsed.debateId, p_expires_at: parsed.expiresAt, p_open: parsed.open });
  if (error) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Não foi possível acessar o convite agora.' }, requestId }, 503);
  const result = data as Record<string, unknown>;
  const code = String(result.code);
  if (code !== 'OK') return respond({ data: null, error: { code, message: messages[code] || 'Não foi possível usar este convite.' }, requestId }, code === 'RATE_LIMITED' ? 429 : 400);
  return respond({ data: result, error: null, requestId });
});
