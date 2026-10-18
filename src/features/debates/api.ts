import { supabase } from '@/shared/lib/supabase';

export type Debate = { id: string; space_id: string; question: string; context: string; status: 'draft' | 'open' | 'closed'; closes_at: string | null; version?: number; created_by?: string; spaces: { title: string } | null };
export type Source = { id: string; title: string; publisher: string; url: string; why_read: string };
export type Term = { id: string; term: string; definition: string };

async function clientWithSession() {
  if (!supabase) throw new Error('Configure a conexão com o Supabase.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error('Não foi possível recuperar a sessão.');
  return session ? supabase : null;
}

export async function listDebates(): Promise<Debate[]> {
  const client = await clientWithSession();
  if (!client) return [];
  const { data, error } = await client.from('debates').select('id,space_id,question,context,status,closes_at,spaces(title)').in('status', ['open', 'closed']).order('created_at', { ascending: false }).limit(30);
  if (error) throw new Error('Não foi possível carregar os debates.');
  return data as unknown as Debate[];
}

export async function getDebate(id: string): Promise<Debate> {
  const client = await clientWithSession();
  if (!client) throw new Error('Entre com convite para ver este debate.');
  const { data, error } = await client.from('debates').select('id,space_id,question,context,status,closes_at,created_by,version,spaces(title)').eq('id', id).single();
  if (error || !data) throw new Error('Debate indisponível ou sem acesso.');
  return data as unknown as Debate;
}

export async function getSources(id: string): Promise<Source[]> {
  const client = await clientWithSession();
  if (!client) throw new Error('Entre com convite para ver as fontes.');
  const { data, error } = await client.from('debate_sources').select('id,title,publisher,url,why_read').eq('debate_id', id).order('sort_order').limit(50);
  if (error) throw new Error('Não foi possível carregar as fontes.');
  return data as Source[];
}

export async function getTerms(id: string): Promise<Term[]> {
  const client = await clientWithSession();
  if (!client) throw new Error('Entre com convite para ver os termos.');
  const { data, error } = await client.from('debate_terms').select('id,term,definition').eq('debate_id', id).order('sort_order').limit(50);
  if (error) throw new Error('Não foi possível carregar os termos.');
  return data as Term[];
}
