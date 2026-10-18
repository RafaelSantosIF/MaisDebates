import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const schema = z.object({
  debateId: z.string().uuid(),
  stance: z.enum(['favoravel','contrario','em_parte','refletindo']),
  rationale: z.string().trim().min(1).max(3000),
  sourceNote: z.string().max(500).nullable(),
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(16).max(100),
});
const messages: Record<string, string> = {
  VALIDATION_ERROR: 'Explique seu ponto de vista antes de publicar.',
  NOT_A_MEMBER: 'Você não participa deste debate.',
  DEBATE_CLOSED: 'Este debate já foi encerrado. Seu texto continua salvo neste dispositivo.',
  VERSION_CONFLICT: 'Sua posição mudou em outro lugar. Revise antes de salvar novamente.',
};
function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  if (request.method !== 'POST') return respond({ data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Método inválido.' }, requestId }, 405);
  if (Number(request.headers.get('content-length') || 0) > 7000) return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Texto muito longo.' }, requestId }, 400);
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Entre novamente.' }, requestId }, 401);
  const projectUrl = Deno.env.get('SUPABASE_URL');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  const backendKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!projectUrl || !publicKey || !backendKey) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Serviço indisponível.' }, requestId }, 503);
  const authClient = createClient(projectUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.slice(7));
  if (authError || !user) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Entre novamente.' }, requestId }, 401);
  let parsed: z.infer<typeof schema>;
  try { parsed = schema.parse(await request.json()); }
  catch { return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Confira os campos da posição.' }, requestId }, 400); }
  const db = createClient(projectUrl, backendKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('save_position', {
    p_actor: user.id, p_debate_id: parsed.debateId, p_stance: parsed.stance,
    p_rationale: parsed.rationale, p_source_note: parsed.sourceNote,
    p_expected_revision: parsed.expectedRevision, p_idempotency_key: parsed.idempotencyKey,
  });
  if (error) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Não foi possível salvar agora.' }, requestId }, 503);
  const result = data as Record<string, unknown>; const code = String(result.code);
  if (code !== 'OK') return respond({ data: null, error: { code, message: messages[code] || 'Não foi possível salvar.' }, requestId }, code === 'VERSION_CONFLICT' ? 409 : 400);
  return respond({ data: result, error: null, requestId });
});
