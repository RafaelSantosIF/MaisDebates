import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { closeDebate, getMediatedDebates, getMediatorSpaces, getPendingReports, issueInvite } from '@/features/mediation/api';
import { type Debate } from '@/features/debates/api';
import { getDebate, getSources, getTerms } from '@/features/debates/api';
import { storeDebateDraft } from '@/features/mediation/draft';
import { deadlineCalendarDate } from '@/features/mediation/date';
import { freshKey } from '@/features/contributions/position';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function MediationScreen() {
  const spaces = useQuery({ queryKey: ['mediator-spaces'], queryFn: getMediatorSpaces });
  const spaceIds = spaces.data?.map((item) => item.space_id) || [];
  const debates = useQuery({ queryKey: ['mediator-debates', spaceIds], queryFn: () => getMediatedDebates(spaceIds), enabled: !!spaces.data });
  const reports = useQuery({ queryKey: ['pending-reports'], queryFn: getPendingReports, enabled: !!spaces.data?.length });
  return <Page title="Mediação">
    <Kicker>Mediação</Kicker><Heading>Prepare o contexto.{"\n"}Cuide da conversa.</Heading>
    <Body>Acompanhe seus debates e apoie o diálogo.</Body>
    {spaces.isPending ? <Body>Conferindo acesso de mediação…</Body> : null}
    {spaces.isError ? <Banner tone="amber">{spaces.error.message}</Banner> : null}
    {spaces.data?.length === 0 ? <Card><Body>Esta conta não tem acesso de mediação a um grupo.</Body><Button label="Entrar com outra conta" onPress={() => router.push('/mediacao/entrar')} secondary /></Card> : null}
    {!!spaces.data?.length ? <>
      <View style={styles.stats}><Card><Text style={styles.number}>{debates.data?.filter((d) => d.status === 'open').length || 0}</Text><Text style={styles.statLabel}>Debates ativos</Text></Card><Card><Text style={styles.number}>{reports.data?.length || 0}</Text><Text style={styles.statLabel}>Revisões pendentes</Text></Card></View>
      <Button label="＋ Criar debate" onPress={() => router.push('/mediacao/criar/pergunta')} />
      <Text style={styles.section}>Precisa de atenção</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/mediacao/fila')}><Card><Text style={styles.cardTitle}>{reports.data?.length ? `${reports.data.length} contribuição sinalizada` : 'Nenhuma denúncia pendente'}</Text><Body>Analise o contexto e registre uma decisão.</Body></Card></Pressable>
      <Text style={styles.section}>Meus debates</Text>
      {debates.isPending ? <Body>Carregando debates…</Body> : null}
      {debates.isError ? <Banner tone="amber">{debates.error.message}</Banner> : null}
      {debates.data?.map((debate) => <MediatedDebateCard key={debate.id} debate={debate} />)}
    </> : null}
  </Page>;
}

function MediatedDebateCard({ debate }: { debate: Debate }) {
  const queryClient = useQueryClient();
  const resume = useMutation({ mutationFn: async () => {
    const [current, sources, terms] = await Promise.all([getDebate(debate.id), getSources(debate.id), getTerms(debate.id)]);
    if (current.status !== 'draft') throw new Error('Este debate já foi aberto.');
    await storeDebateDraft({ spaceId: current.space_id, question: current.question, context: current.context, closesAt: deadlineCalendarDate(current.closes_at), sources: sources.map((item) => ({ title: item.title, publisher: item.publisher, url: item.url, whyRead: item.why_read })), terms: terms.map((item) => ({ term: item.term, definition: item.definition })), key: freshKey(), createdId: current.id, version: current.version });
  }, onSuccess: () => router.push('/mediacao/criar/pergunta'), onError: (cause: Error) => Alert.alert('Não foi possível retomar', cause.message) });
  const close = useMutation({ mutationFn: () => closeDebate(debate.id, debate.version!), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['mediator-debates'] }); await queryClient.invalidateQueries({ queryKey: ['debate', debate.id] }); Alert.alert('Debate encerrado', 'A leitura continua disponível. Novas posições e respostas foram bloqueadas.'); }, onError: (error: Error) => Alert.alert('Não foi possível encerrar', error.message) });
  const issue = useMutation({ mutationFn: () => issueInvite(debate.space_id, debate.id, new Date(Date.now() + 7 * 86400000).toISOString()), onSuccess: async (result) => { await Share.share({ message: `Convite individual para o +Debates: maisdebates://convite/${result.token}` }); }, onError: (error: Error) => Alert.alert('Não foi possível criar convite', error.message) });
  return <Card>
    <Text style={styles.cardTitle}>{debate.question || 'Rascunho sem pergunta'}</Text>
    <Body>{debate.spaces?.title} · {debate.status === 'draft' ? 'Rascunho' : debate.status === 'closed' ? 'Encerrado' : 'Em andamento'}</Body>
    {debate.status !== 'draft' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/debate/[id]', params: { id: debate.id } })}><Text style={styles.link}>Ver conversa →</Text></Pressable> : null}
    {debate.status === 'draft' ? <Pressable accessibilityRole="button" onPress={() => resume.mutate()}><Text style={styles.link}>{resume.isPending ? 'Abrindo rascunho…' : 'Editar rascunho →'}</Text></Pressable> : null}
    {debate.status === 'open' ? <><Pressable accessibilityRole="button" onPress={() => issue.mutate()}><Text style={styles.link}>{issue.isPending ? 'Criando convite…' : 'Compartilhar convite individual →'}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => Alert.alert('Encerrar debate?', 'Novas posições e respostas serão bloqueadas.', [{ text: 'Cancelar' }, { text: 'Encerrar', onPress: () => close.mutate() }])}><Text style={styles.link}>Encerrar debate →</Text></Pressable></> : null}
    {debate.status === 'closed' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/mediacao/debate/[id]/sintese', params: { id: debate.id } })}><Text style={styles.link}>Preparar síntese →</Text></Pressable> : null}
  </Card>;
}

const styles = StyleSheet.create({ stats: { flexDirection: 'row', gap: 12 }, number: { color: colors.ink, fontSize: 26, fontWeight: '600' }, statLabel: { color: colors.muted, fontSize: 11 }, section: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8 }, cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' }, link: { color: colors.blue, fontSize: 12, fontWeight: '700', marginTop: 12 } });
