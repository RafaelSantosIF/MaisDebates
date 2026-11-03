import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';
import { draftStorageKey, freshKey, type Position } from '@/features/contributions/position';

export type Reply = { id: string; debate_id: string; position_id: string; author_user_id: string; kind: 'reply' | 'question'; body: string; visibility: 'visible' | 'hidden'; moderation_reason: string | null; created_at: string; displayName: string };
export type ReportReason = 'personal_attack' | 'discrimination' | 'personal_info' | 'spam_other';

async function invoke(body: Record<string, unknown>) {
  if (!supabase) throw new Error('Configure o Supabase.');
  const { data, error } = await supabase.functions.invoke('dialogue', { body });
  if (error) {
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      const payload = await context.json().catch(() => null) as { error?: { message?: string } } | null;
      if (payload?.error?.message) throw new Error(payload.error.message);
    }
    throw new Error('Não foi possível concluir agora. Tente novamente.');
  }
  return data?.data as Record<string, unknown>;
}

export async function getPosition(id: string): Promise<Position> {
  if (!supabase) throw new Error('Configure o Supabase.');
  const { data, error } = await supabase.from('positions').select('id,debate_id,author_user_id,stance,rationale,source_note,revision,edited_at,visibility,created_at,moderation_reason').eq('id', id).single();
  if (error || !data) throw new Error('Esta contribuição não está disponível.');
  return data as Position;
}
export async function getAuthorName(_spaceId: string, userId: string) {
  if (!supabase) throw new Error('Configure o Supabase.');
  const { data, error } = await supabase.from('member_profiles').select('display_name').eq('user_id', userId).single();
  if (error || !data) return 'Participante';
  return data.display_name as string;
}
export async function getReplies(positionId: string, _spaceId: string, page = 0): Promise<{ items: Reply[]; nextPage: number | null }> {
  if (!supabase) throw new Error('Configure o Supabase.');
  const pageSize = 30;
  const replies = await supabase.from('replies').select('id,debate_id,position_id,author_user_id,kind,body,visibility,moderation_reason,created_at').eq('position_id', positionId).order('created_at').order('id').range(page * pageSize, (page + 1) * pageSize);
  if (replies.error) throw new Error('Não foi possível carregar as respostas.');
  const batch = replies.data as Omit<Reply,'displayName'>[];
  const authorIds = [...new Set(batch.map((reply) => reply.author_user_id))];
  const members = authorIds.length ? await supabase.from('member_profiles').select('user_id,display_name').in('user_id', authorIds) : { data: [], error: null };
  if (members.error) throw new Error('Não foi possível carregar os nomes.');
  const names = new Map((members.data || []).map((m) => [m.user_id as string, m.display_name as string]));
  return { items: batch.slice(0, pageSize).map((r) => ({ ...r, displayName: names.get(r.author_user_id) || 'Participante' })), nextPage: batch.length > pageSize ? page + 1 : null };
}
export async function createReply(positionId: string, kind: 'reply' | 'question', body: string, key: string) {
  if (!body.trim()) throw new Error('Escreva sua contribuição antes de publicar.');
  const result = await invoke({ action: 'reply', positionId, kind, body: body.trim(), idempotencyKey: key });
  return z.object({ id: z.string().uuid() }).parse(result);
}
export async function setAgreement(positionId: string, agreed: boolean) {
  const result = await invoke({ action: 'agreement', positionId, agreed });
  return z.object({ agreed: z.boolean() }).parse(result);
}
export async function createReport(targetType: 'position' | 'reply', targetId: string, reason: ReportReason, details: string) {
  const result = await invoke({ action: 'report', targetType, targetId, reason, details: details.trim() || null });
  return z.object({ id: z.string().uuid() }).parse(result);
}
export async function resolveReport(reportId: string, decision: 'keep' | 'hide', reason: string, expectedVersion: number) {
  const result = await invoke({ action: 'resolve', reportId, decision, reason, expectedVersion });
  return z.object({ status: z.enum(['kept','hidden']) }).parse(result);
}
export async function restoreReport(reportId: string, reason: string, expectedVersion: number) {
  const result = await invoke({ action: 'restore', reportId, reason, expectedVersion });
  return z.object({ status: z.literal('restored') }).parse(result);
}
export async function loadReplyDraft(positionId: string) {
  const raw = await AsyncStorage.getItem(`${await draftStorageKey(positionId)}:reply`);
  if (!raw) return { body: '', kind: 'reply' as const, key: freshKey() };
  try { return z.object({ body: z.string(), kind: z.enum(['reply','question']), key: z.string() }).parse(JSON.parse(raw)); }
  catch { return { body: '', kind: 'reply' as const, key: freshKey() }; }
}
export async function saveReplyDraft(positionId: string, draft: { body: string; kind: 'reply' | 'question'; key: string }) {
  await AsyncStorage.setItem(`${await draftStorageKey(positionId)}:reply`, JSON.stringify(draft));
}
export async function clearReplyDraft(positionId: string) { await AsyncStorage.removeItem(`${await draftStorageKey(positionId)}:reply`); }
