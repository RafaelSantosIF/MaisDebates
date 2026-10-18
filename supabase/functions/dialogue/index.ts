import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('reply'), positionId: z.string().uuid(), kind: z.enum(['reply','question']), body: z.string().trim().min(1).max(2000), idempotencyKey: z.string().min(16).max(100) }),
  z.object({ action: z.literal('agreement'), positionId: z.string().uuid(), agreed: z.boolean() }),
  z.object({ action: z.literal('report'), targetType: z.enum(['position','reply']), targetId: z.string().uuid(), reason: z.enum(['personal_attack','discrimination','personal_info','spam_other']), details: z.string().max(1000).nullable() }),
  z.object({ action: z.literal('resolve'), reportId: z.string().uuid(), decision: z.enum(['keep','hide']), reason: z.string().trim().min(1).max(1000), expectedVersion: z.number().int().positive() }),
  z.object({ action: z.literal('restore'), reportId: z.string().uuid(), reason: z.string().trim().min(1).max(1000), expectedVersion: z.number().int().positive() }),
]);
const messages: Record<string, string> = {
  NOT_A_MEMBER: 'Você não participa deste debate.',
  NOT_A_MEDIATOR: 'Esta decisão exige acesso de mediação.',
  DEBATE_CLOSED: 'Este debate está encerrado. Seu texto continua salvo.',
  TARGET_HIDDEN: 'Esta contribuição não está disponível.',
  VERSION_CONFLICT: 'Outra pessoa já revisou este caso. Atualize a fila.',
  VALIDATION_ERROR: 'Confira os campos e tente novamente.',
};
function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  if (request.method !== 'POST') return respond({ data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Método inválido.' }, requestId }, 405);
  if (Number(request.headers.get('content-length') || 0) > 7000) return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Solicitação muito longa.' }, requestId }, 400);
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Entre novamente.' }, requestId }, 401);
  const projectUrl = Deno.env.get('SUPABASE_URL');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  const backendKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!projectUrl || !publicKey || !backendKey) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Serviço indisponível.' }, requestId }, 503);
  const authClient = createClient(projectUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.slice(7));
  if (authError || !user) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Entre novamente.' }, requestId }, 401);
  let input: z.infer<typeof schema>;
  try { input = schema.parse(await request.json()); }
  catch { return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Confira os campos.' }, requestId }, 400); }
  const db = createClient(projectUrl, backendKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let call: { data: unknown; error: { message: string } | null };
  switch (input.action) {
    case 'reply': call = await db.rpc('create_reply', { p_actor: user.id, p_position_id: input.positionId, p_kind: input.kind, p_body: input.body, p_idempotency_key: input.idempotencyKey }); break;
    case 'agreement': call = await db.rpc('set_agreement', { p_actor: user.id, p_position_id: input.positionId, p_agree: input.agreed }); break;
    case 'report': call = await db.rpc('create_report', { p_actor: user.id, p_target_type: input.targetType, p_target_id: input.targetId, p_reason: input.reason, p_details: input.details }); break;
    case 'resolve': call = await db.rpc('resolve_report', { p_actor: user.id, p_report_id: input.reportId, p_decision: input.decision, p_reason: input.reason, p_expected_version: input.expectedVersion }); break;
    case 'restore': call = await db.rpc('restore_report', { p_actor: user.id, p_report_id: input.reportId, p_reason: input.reason, p_expected_version: input.expectedVersion }); break;
  }
  if (call.error) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Não foi possível concluir agora.' }, requestId }, 503);
  const result = call.data as Record<string, unknown>; const code = String(result.code);
  if (code !== 'OK') return respond({ data: null, error: { code, message: messages[code] || 'Não foi possível concluir.' }, requestId }, code === 'VERSION_CONFLICT' ? 409 : 400);
  return respond({ data: result, error: null, requestId });
});
