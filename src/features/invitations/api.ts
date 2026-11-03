import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';

const previewSchema = z.object({ code: z.literal('OK'), space_title: z.string(), question: z.string().nullish(), expires_at: z.string(), mediator_name: z.string().nullish() });
const redeemedSchema = z.object({ code: z.literal('OK'), space_id: z.string().uuid(), debate_id: z.string().uuid().nullish() });
const renamedSchema = z.object({ code: z.literal('OK'), display_name: z.string() });
const profileSchema = z.object({ user_id: z.string().uuid(), display_name: z.string() });

async function readyClient() {
  if (!supabase) throw new Error('Configure o Supabase para entrar com convite.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error('Não foi possível iniciar a sessão. Tente novamente.');
  }
  return supabase;
}

async function invoke<T>(body: Record<string, string>, schema: z.ZodType<T>): Promise<T> {
  const client = await readyClient();
  const { data, error } = await client.functions.invoke('invite', { body });
  if (error) {
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      try {
        const payload = await context.json() as { error?: { message?: string } };
        if (payload.error?.message) throw new Error(payload.error.message);
      } catch (cause) { if (cause instanceof Error && cause.message !== 'Unexpected end of JSON input') throw cause; }
    }
    throw new Error('Não foi possível consultar o convite. Verifique sua conexão.');
  }
  return schema.parse(data?.data);
}

export const previewInvite = (token: string) => invoke({ action: 'preview', token }, previewSchema);
export const redeemInvite = (token: string, displayName: string) => invoke({ action: 'redeem', token, displayName }, redeemedSchema);
export async function getMemberProfile() {
  const client = await readyClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session) return null;
  const { data, error } = await client.from('member_profiles').select('user_id,display_name').eq('user_id', session.user.id).maybeSingle();
  if (error) throw new Error('Não foi possível carregar seu perfil.');
  return data ? profileSchema.parse(data) : null;
}
export const renameMember = (displayName: string) => invoke({ action: 'rename', displayName }, renamedSchema);
