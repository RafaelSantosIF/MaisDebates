import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text } from 'react-native';
import { supabase } from '@/shared/lib/supabase';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

type MyPosition = { id: string; debate_id: string; rationale: string; created_at: string; edited_at: string | null; visibility: 'visible' | 'hidden'; moderation_reason: string | null; debates: { question: string; status: string } | null };
type MyReply = { id: string; position_id: string; body: string; kind: string; created_at: string };
async function getActivity() {
  if (!supabase) throw new Error('Configure o Supabase.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { positions: [] as MyPosition[], replies: [] as MyReply[] };
  const [positions, replies] = await Promise.all([
    supabase.from('positions').select('id,debate_id,rationale,created_at,edited_at,visibility,moderation_reason,debates(question,status)').eq('author_user_id', session.user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('replies').select('id,position_id,body,kind,created_at').eq('author_user_id', session.user.id).order('created_at', { ascending: false }).limit(30),
  ]);
  if (positions.error || replies.error) throw new Error('Não foi possível carregar sua atividade.');
  return { positions: positions.data as unknown as MyPosition[], replies: replies.data as MyReply[] };
}

export default function ActivityScreen() {
  const activity = useQuery({ queryKey: ['my-activity'], queryFn: getActivity });
  return <Page title="Minha atividade">
    <Kicker>Seu percurso</Kicker><Heading>As ideias que você{"\n"}colocou em movimento.</Heading>
    <Body>Encontre suas posições e retome as conversas.</Body>
    {activity.isPending ? <Body>Carregando atividade…</Body> : null}
    {activity.isError ? <><Banner tone="amber">{activity.error.message}</Banner><Button label="Tentar novamente" onPress={() => void activity.refetch()} secondary /></> : null}
    {activity.data?.positions.length === 0 && activity.data.replies.length === 0 ? <Card><Body>Suas contribuições aparecerão aqui depois que você participar.</Body></Card> : null}
    {activity.data?.positions.map((position) => <Pressable key={position.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/debate/[id]/posicao', params: { id: position.debate_id } })}><Card><Text style={styles.tag}>{position.visibility === 'hidden' ? 'Oculta para o grupo' : position.edited_at ? 'Posição editada' : 'Minha posição'}</Text><Text style={styles.title}>{position.debates?.question}</Text><Body>{position.rationale}</Body>{position.visibility === 'hidden' ? <Banner tone="amber">A mediação ocultou esta contribuição. {position.moderation_reason || ''}</Banner> : null}<Text style={styles.link}>{position.debates?.status === 'open' ? 'Revisar posição' : 'Consultar posição'} →</Text></Card></Pressable>)}
    {activity.data?.replies.map((reply) => <Pressable key={reply.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]', params: { positionId: reply.position_id } })}><Card><Text style={styles.tag}>{reply.kind === 'question' ? 'Minha dúvida' : 'Minha resposta'}</Text><Body>{reply.body}</Body><Text style={styles.link}>Ver conversa →</Text></Card></Pressable>)}
  </Page>;
}
const styles = StyleSheet.create({ tag: { alignSelf: 'flex-start', backgroundColor: colors.pale, color: colors.blue, padding: 6, borderRadius: 6, fontSize: 10, fontWeight: '700' }, title: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 12 }, link: { color: colors.blue, fontSize: 12, fontWeight: '700' } });
