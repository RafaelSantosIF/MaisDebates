import AsyncStorage from '@react-native-async-storage/async-storage';
import { freshKey } from '@/features/contributions/position';
import { supabase } from '@/shared/lib/supabase';
import { type SourceDraft, type TermDraft } from '@/features/mediation/api';

export type DebateDraft = { spaceId: string; question: string; context: string; closesAt: string; sources: SourceDraft[]; terms: TermDraft[]; key: string; createdId?: string; version?: number };
export const blankDebateDraft = (): DebateDraft => ({ spaceId: '', question: '', context: '', closesAt: '', sources: [], terms: [], key: freshKey() });
async function key() { const uid = (await supabase?.auth.getSession())?.data.session?.user.id || 'guest'; return `debate-draft:${uid}`; }
export async function loadDebateDraft(): Promise<DebateDraft> {
  const raw = await AsyncStorage.getItem(await key());
  if (!raw) return blankDebateDraft();
  try { const value = JSON.parse(raw) as DebateDraft; return value?.key && Array.isArray(value.sources) ? value : blankDebateDraft(); }
  catch { return blankDebateDraft(); }
}
export async function storeDebateDraft(draft: DebateDraft) { await AsyncStorage.setItem(await key(), JSON.stringify(draft)); }
export async function clearDebateDraft() { await AsyncStorage.removeItem(await key()); }

export type SummaryDraft = { overview: string; arguments: string; agreementsText: string; divergences: string; openQuestions: string; savedId?: string; savedRevision?: number };
export const blankSummaryDraft = (): SummaryDraft => ({ overview: '', arguments: '', agreementsText: '', divergences: '', openQuestions: '' });
async function summaryKey(debateId: string) { return `${await key()}:summary:${debateId}`; }
export async function loadSummaryDraft(debateId: string): Promise<SummaryDraft> {
  const raw = await AsyncStorage.getItem(await summaryKey(debateId));
  if (!raw) return blankSummaryDraft();
  try { const value = JSON.parse(raw) as SummaryDraft; return typeof value.overview === 'string' ? value : blankSummaryDraft(); }
  catch { return blankSummaryDraft(); }
}
export async function storeSummaryDraft(debateId: string, draft: SummaryDraft) { await AsyncStorage.setItem(await summaryKey(debateId), JSON.stringify(draft)); }
export async function clearSummaryDraft(debateId: string) { await AsyncStorage.removeItem(await summaryKey(debateId)); }
