import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';
import { positionSchema } from '@/features/contributions/schema';
export { positionSchema } from '@/features/contributions/schema';

export const stances = [
  { value: 'favoravel', label: 'Favorável' },
  { value: 'contrario', label: 'Contrário' },
  { value: 'em_parte', label: 'Em parte' },
  { value: 'refletindo', label: 'Ainda estou refletindo' },
] as const;
export type Stance = typeof stances[number]['value'];
export type Position = { id: string; debate_id: string; author_user_id: string; stance: Stance; rationale: string; source_note: string | null; revision: number; edited_at: string | null; visibility: 'visible' | 'hidden'; moderation_reason?: string | null; created_at: string };
export type PositionDraft = { stance: Stance; rationale: string; sourceNote: string; key: string };

export function freshKey() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
export async function draftStorageKey(debateId: string) {
  const userId = (await supabase?.auth.getSession())?.data.session?.user.id || 'guest';
  return `position-draft:${userId}:${debateId}`;
}
export async function loadDraft(debateId: string): Promise<PositionDraft | null> {
  const raw = await AsyncStorage.getItem(await draftStorageKey(debateId));
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as PositionDraft;
    if (positionSchema.safeParse(candidate).success && candidate.key) return candidate;
    if (candidate.rationale !== undefined && candidate.stance) return candidate;
  } catch { /* Corrupted local draft is ignored. */ }
  return null;
}
export async function storeDraft(debateId: string, draft: PositionDraft) { await AsyncStorage.setItem(await draftStorageKey(debateId), JSON.stringify(draft)); }
export async function clearDraft(debateId: string) { await AsyncStorage.removeItem(await draftStorageKey(debateId)); }

export async function getMyPosition(debateId: string): Promise<Position | null> {
  if (!supabase) throw new Error('Configure o Supabase.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Entre com convite para participar.');
  const { data, error } = await supabase.from('positions').select('id,debate_id,author_user_id,stance,rationale,source_note,revision,edited_at,visibility,created_at').eq('debate_id', debateId).eq('author_user_id', session.user.id).maybeSingle();
  if (error) throw new Error('Não foi possível carregar sua posição.');
  return data as Position | null;
}

export async function getPositions(debateId: string, spaceId: string, page = 0) {
  if (!supabase) throw new Error('Configure o Supabase.');
  const pageSize = 20;
  const positionResult = await supabase.from('positions').select('id,debate_id,author_user_id,stance,rationale,source_note,revision,edited_at,visibility,moderation_reason,created_at').eq('debate_id', debateId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * pageSize, (page + 1) * pageSize);
  if (positionResult.error) throw new Error('Não foi possível carregar a conversa.');
  const batch = positionResult.data as Position[];
  const positions = batch.slice(0, pageSize);
  const authorIds = [...new Set(positions.map((position) => position.author_user_id))];
  const memberResult = authorIds.length ? await supabase.from('space_memberships').select('user_id,display_name').eq('space_id', spaceId).in('user_id', authorIds) : { data: [], error: null };
  if (memberResult.error) throw new Error('Não foi possível carregar os nomes.');
  const names = new Map((memberResult.data || []).map((member) => [member.user_id as string, member.display_name as string]));
  const agreementResult = positions.length ? await supabase.from('agreements').select('position_id').in('position_id', positions.map((p) => p.id)) : { data: [], error: null };
  if (agreementResult.error) throw new Error('Não foi possível carregar suas concordâncias.');
  const agreed = new Set((agreementResult.data || []).map((item) => item.position_id));
  return { items: positions.map((position) => ({ ...position, displayName: names.get(position.author_user_id) || 'Participante', agreed: agreed.has(position.id) })), nextPage: batch.length > pageSize ? page + 1 : null };
}

const saveResponse = z.object({ code: z.literal('OK'), id: z.string().uuid(), revision: z.number().int() });
export async function savePosition(debateId: string, draft: PositionDraft, expectedRevision: number) {
  if (!supabase) throw new Error('Configure o Supabase.');
  const input = positionSchema.parse(draft);
  const { data, error } = await supabase.functions.invoke('position', { body: { debateId, stance: input.stance, rationale: input.rationale, sourceNote: input.sourceNote || null, expectedRevision, idempotencyKey: draft.key } });
  if (error) {
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      const payload = await context.json().catch(() => null) as { error?: { message?: string } } | null;
      if (payload?.error?.message) throw new Error(payload.error.message);
    }
    throw new Error('Não foi possível salvar agora. Seu texto continua neste dispositivo.');
  }
  return saveResponse.parse(data?.data);
}
