import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const source = z.object({ title: z.string().trim().min(2).max(200), publisher: z.string().trim().min(2).max(120), url: z.string().url().startsWith('https://').max(2000), whyRead: z.string().trim().min(2).max(1000) });
const term = z.object({ term: z.string().trim().min(2).max(100), definition: z.string().trim().min(2).max(1000) });
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), spaceId: z.string().uuid(), question: z.string().max(300), context: z.string().max(12000), closesAt: z.string().datetime().nullable(), sources: z.array(source).max(20), terms: z.array(term).max(30), idempotencyKey: z.string().min(16).max(100) }),
  z.object({ action: z.literal('updateDraft'), debateId: z.string().uuid(), expectedVersion: z.number().int().positive(), question: z.string().max(300), context: z.string().max(12000), closesAt: z.string().datetime().nullable(), sources: z.array(source).max(20), terms: z.array(term).max(30) }),
  z.object({ action: z.literal('open'), debateId: z.string().uuid(), expectedVersion: z.number().int().positive() }),
  z.object({ action: z.literal('close'), debateId: z.string().uuid(), expectedVersion: z.number().int().positive() }),
  z.object({ action: z.literal('saveSummary'), debateId: z.string().uuid(), overview: z.string().max(5000), arguments: z.string().max(5000), agreementsText: z.string().max(5000), divergences: z.string().max(5000), openQuestions: z.string().max(5000), expectedRevision: z.number().int().nonnegative() }),
  z.object({ action: z.literal('publishSummary'), summaryId: z.string().uuid(), expectedRevision: z.number().int().positive(), reviewed: z.boolean() }),
]);
const messages: Record<string, string> = {
  NOT_A_MEMBER: 'Você não participa deste grupo.', NOT_A_MEDIATOR: 'Esta ação exige acesso de mediação.',
  DEBATE_NOT_CLOSED: 'Encerre o debate antes de preparar a síntese.',
  VERSION_CONFLICT: 'Este conteúdo mudou em outro lugar. Atualize antes de continuar.',
  VALIDATION_ERROR: 'Confira os campos obrigatórios, a fonte e o prazo.',
};
function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  if (request.method !== 'POST') return respond({ data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Método inválido.' }, requestId }, 405);
  if (Number(request.headers.get('content-length') || 0) > 30000) return respond({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Solicitação muito longa.' }, requestId }, 400);
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond({ data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Entre novamente.' }, requestId }, 401);
  const projectUrl = Deno.env.get('SUPABASE_URL'); const publicKey = Deno.env.get('SUPABASE_ANON_KEY'); const backendKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
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
    case 'create': call = await db.rpc('create_debate', { p_actor: user.id, p_space_id: input.spaceId, p_question: input.question, p_context: input.context, p_closes_at: input.closesAt, p_sources: input.sources, p_terms: input.terms, p_idempotency_key: input.idempotencyKey }); break;
    case 'updateDraft': call = await db.rpc('update_debate_draft', { p_actor: user.id, p_debate_id: input.debateId, p_expected_version: input.expectedVersion, p_question: input.question, p_context: input.context, p_closes_at: input.closesAt, p_sources: input.sources, p_terms: input.terms }); break;
    case 'open': call = await db.rpc('open_debate', { p_actor: user.id, p_debate_id: input.debateId, p_expected_version: input.expectedVersion }); break;
    case 'close': call = await db.rpc('close_debate', { p_actor: user.id, p_debate_id: input.debateId, p_expected_version: input.expectedVersion }); break;
    case 'saveSummary': call = await db.rpc('save_summary', { p_actor: user.id, p_debate_id: input.debateId, p_overview: input.overview, p_arguments: input.arguments, p_agreements_text: input.agreementsText, p_divergences: input.divergences, p_open_questions: input.openQuestions, p_expected_revision: input.expectedRevision }); break;
    case 'publishSummary': call = await db.rpc('publish_summary', { p_actor: user.id, p_summary_id: input.summaryId, p_expected_revision: input.expectedRevision, p_reviewed: input.reviewed }); break;
  }
  if (call.error) return respond({ data: null, error: { code: 'UNAVAILABLE', message: 'Não foi possível concluir agora.' }, requestId }, 503);
  const result = call.data as Record<string, unknown>; const code = String(result.code);
  if (code !== 'OK') return respond({ data: null, error: { code, message: messages[code] || 'Não foi possível concluir.' }, requestId }, code === 'VERSION_CONFLICT' ? 409 : 400);
  return respond({ data: result, error: null, requestId });
});
