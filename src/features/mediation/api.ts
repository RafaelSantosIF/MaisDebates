import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';
import { type Debate } from '@/features/debates/api';

export type MediatorSpace = { space_id: string; display_name: string; spaces: { title: string } | null };
export type Report = { id: string; debate_id: string; target_type: 'position' | 'reply'; target_id: string; reason: string; details: string | null; status: string; version: number; created_at: string; debates: { question: string; space_id: string } | null };
export type Summary = { id: string; debate_id: string; revision: number; overview: string; arguments: string; agreements_text: string; divergences: string; open_questions: string; status: 'draft' | 'published'; reviewed_by: string | null; published_at: string | null };
export type SourceDraft = { title: string; publisher: string; url: string; whyRead: string };
export type TermDraft = { term: string; definition: string };

async function requireClient() { if (!supabase) throw new Error('Configure o Supabase.'); return supabase; }

async function invoke<T>(functionName: 'mediation' | 'invite', body: Record<string, unknown>, schema: z.ZodType<T>): Promise<T> {
  const client = await requireClient();
  const { data, error } = await client.functions.invoke(functionName, { body });
  if (error) {
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      const payload = await context.json().catch(() => null) as { error?: { message?: string } } | null;
      if (payload?.error?.message) throw new Error(payload.error.message);
    }
    throw new Error('Não foi possível concluir agora. Tente novamente.');
  }
  return schema.parse(data?.data);
}

export async function getMediatorSpaces(): Promise<MediatorSpace[]> {
  const client = await requireClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session) return [];
  const { data, error } = await client.from('space_memberships').select('space_id,display_name,spaces(title)').eq('user_id', session.user.id).eq('role', 'mediator').eq('status', 'active').limit(30);
  if (error) throw new Error('Não foi possível carregar seus grupos de mediação.');
  return data as unknown as MediatorSpace[];
}
export async function getMediatedDebates(spaceIds: string[]): Promise<Debate[]> {
  if (!spaceIds.length) return [];
  const client = await requireClient();
  const { data, error } = await client.from('debates').select('id,space_id,question,context,status,closes_at,version,spaces(title)').in('space_id', spaceIds).order('created_at', { ascending: false }).limit(50);
  if (error) throw new Error('Não foi possível carregar os debates da mediação.');
  return data as unknown as Debate[];
}
async function getReports(statuses: string[]) {
  const client = await requireClient();
  const spaceIds = (await getMediatorSpaces()).map((space) => space.space_id);
  if (!spaceIds.length) return [];
  const { data: ownDebates, error: debateError } = await client.from('debates').select('id').in('space_id', spaceIds).limit(100);
  if (debateError) throw new Error('Não foi possível carregar a fila de revisão.');
  const debateIds = (ownDebates || []).map((debate) => debate.id);
  if (!debateIds.length) return [];
  const { data, error } = await client.from('reports').select('id,debate_id,target_type,target_id,reason,details,status,version,created_at,debates(question,space_id)').in('debate_id', debateIds).in('status', statuses).order('created_at', { ascending: statuses[0] === 'pending' }).limit(30);
  if (error) throw new Error('Não foi possível carregar a fila de revisão.');
  return data as unknown as Report[];
}
export const getPendingReports = () => getReports(['pending']);
export const getResolvedReports = () => getReports(['kept', 'hidden', 'restored']);
export async function getReport(id: string) {
  const client = await requireClient();
  const allowedSpaces = new Set((await getMediatorSpaces()).map((space) => space.space_id));
  if (!allowedSpaces.size) throw new Error('Este caso exige acesso de mediação.');
  const { data, error } = await client.from('reports').select('id,debate_id,target_type,target_id,reason,details,status,version,created_at,debates(question,space_id)').eq('id', id).single();
  if (error || !data) throw new Error('Caso indisponível para sua mediação.');
  const report = data as unknown as Report;
  if (!report.debates || !allowedSpaces.has(report.debates.space_id)) throw new Error('Caso indisponível para sua mediação.');
  return report;
}
export async function getLatestSummary(debateId: string): Promise<Summary | null> {
  const client = await requireClient();
  const { data, error } = await client.from('summaries').select('id,debate_id,revision,overview,arguments,agreements_text,divergences,open_questions,status,reviewed_by,published_at').eq('debate_id', debateId).order('revision', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Não foi possível carregar a síntese.');
  return data as Summary | null;
}
export async function getPublishedSummary(debateId: string): Promise<Summary | null> {
  const client = await requireClient();
  const { data, error } = await client.from('summaries').select('id,debate_id,revision,overview,arguments,agreements_text,divergences,open_questions,status,reviewed_by,published_at').eq('debate_id', debateId).eq('status', 'published').order('revision', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Não foi possível carregar a síntese.');
  return data as Summary | null;
}

const debateResponse = z.object({ id: z.string().uuid(), version: z.number().int() });
const versionResponse = z.object({ version: z.number().int() });
const summaryResponse = z.object({ id: z.string().uuid(), revision: z.number().int() });
const inviteResponse = z.object({ id: z.string().uuid(), token: z.string() });

export const createDebate = (input: { spaceId: string; question: string; context: string; closesAt: string | null; sources: SourceDraft[]; terms: TermDraft[]; idempotencyKey: string }) => invoke('mediation', { action: 'create', ...input }, debateResponse);
export const updateDebateDraft = (input: { debateId: string; expectedVersion: number; question: string; context: string; closesAt: string | null; sources: SourceDraft[]; terms: TermDraft[] }) => invoke('mediation', { action: 'updateDraft', ...input }, debateResponse);
export const openDebate = (debateId: string, expectedVersion: number) => invoke('mediation', { action: 'open', debateId, expectedVersion }, versionResponse);
export const closeDebate = (debateId: string, expectedVersion: number) => invoke('mediation', { action: 'close', debateId, expectedVersion }, versionResponse);
export const saveSummary = (input: { debateId: string; overview: string; arguments: string; agreementsText: string; divergences: string; openQuestions: string; expectedRevision: number }) => invoke('mediation', { action: 'saveSummary', ...input }, summaryResponse);
export const publishSummary = (summaryId: string, expectedRevision: number, reviewed: boolean) => invoke('mediation', { action: 'publishSummary', summaryId, expectedRevision, reviewed }, summaryResponse);
export const issueInvite = (spaceId: string, debateId: string | null, expiresAt: string, open: boolean) => invoke('invite', { action: 'issue', spaceId, debateId, expiresAt, open }, inviteResponse);
