import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getDebate, getSources } from '@/features/debates/api';
import { getPositions, stances } from '@/features/contributions/position';
import { getAuthorName, setAgreement } from '@/features/contributions/dialogue';
import { alternatePerspectives } from '@/features/contributions/conversation';
import { supabase } from '@/shared/lib/supabase';
import { getPublishedSummary } from '@/features/mediation/api';
import { deadlineCalendarDate } from '@/features/mediation/date';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function DebateScreen() {
  const { id, tab: routeTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const [tab, setTab] = useState<'contexto' | 'conversa' | 'sintese'>(routeTab === 'sintese' ? 'sintese' : 'contexto');
  const [filter, setFilter] = useState<'Recentes' | 'Perspectivas' | 'Minhas interações'>('Recentes');
  const debate = useQuery({ queryKey: ['debate', id], queryFn: () => getDebate(id!), enabled: !!id });
  const sources = useQuery({ queryKey: ['sources', id], queryFn: () => getSources(id!), enabled: !!id && (tab === 'contexto' || tab === 'sintese') });
  const positions = useInfiniteQuery({ queryKey: ['positions', id], queryFn: ({ pageParam }) => getPositions(id!, debate.data!.space_id, pageParam), initialPageParam: 0, getNextPageParam: (lastPage) => lastPage.nextPage, enabled: !!id && !!debate.data && tab === 'conversa' });
  const summary = useQuery({ queryKey: ['published-summary', id], queryFn: () => getPublishedSummary(id!), enabled: !!id && tab === 'sintese' });
  const reviewer = useQuery({ queryKey: ['summary-reviewer', summary.data?.reviewed_by, debate.data?.space_id], queryFn: () => getAuthorName(debate.data!.space_id, summary.data!.reviewed_by!), enabled: !!summary.data?.reviewed_by && !!debate.data });
  const mediator = useQuery({ queryKey: ['debate-mediator', debate.data?.created_by, debate.data?.space_id], queryFn: () => getAuthorName(debate.data!.space_id, debate.data!.created_by!), enabled: !!debate.data?.created_by });
  const currentUser = useQuery({ queryKey: ['current-user'], queryFn: async () => (await supabase?.auth.getUser())?.data.user?.id || null });
  if (debate.isPending) return <Page title="O debate"><Body>Carregando debate…</Body></Page>;
  if (debate.isError) return <Page title="O debate" footer={<Button label="Tentar novamente" onPress={() => void debate.refetch()} />}><Banner tone="amber">{debate.error.message}</Banner></Page>;
  const item = debate.data;
  const loadedPositions = positions.data?.pages.flatMap((page) => page.items) || [];
  const visiblePositions = filter === 'Perspectivas' ? alternatePerspectives(loadedPositions) : loadedPositions;
  return <Page title="O debate" footer={tab !== 'sintese' && item.status === 'open' ? <Button label="Compartilhar minha posição" onPress={() => router.push({ pathname: '/debate/[id]/posicao', params: { id: item.id } })} /> : undefined}>
    <View style={styles.tabs}>{(['contexto', 'conversa', 'sintese'] as const).map((choice) => <Pressable key={choice} accessibilityRole="tab" accessibilityState={{ selected: tab === choice }} onPress={() => setTab(choice)} style={[styles.tab, tab === choice && styles.tabSelected]}><Text style={[styles.tabText, tab === choice && styles.tabTextSelected]}>{choice === 'contexto' ? 'Contexto' : choice === 'conversa' ? 'Conversa' : 'Síntese'}</Text></Pressable>)}</View>
    {tab === 'contexto' ? <>
      <Text style={styles.tag}>{item.status === 'closed' ? 'Encerrado' : 'Em andamento'}</Text>
      <Kicker>{item.spaces?.title || 'Grupo convidado'}</Kicker>
      <Heading>{item.question}</Heading>
      <Body>{item.closes_at ? `Aberto até ${deadlineCalendarDate(item.closes_at).split('-').reverse().join('/')}` : 'Sem data de encerramento'} · Mediação: {mediator.data || 'responsável pelo grupo'}</Body>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Para começar a pensar</Text>
      <Body lead>{item.context}</Body>
      <Banner>Você pode ler o contexto e as fontes antes de publicar sua posição.</Banner>
      <Text style={styles.sectionTitle}>Contexto e evidências</Text>
      {sources.isPending ? <Body>Carregando fontes…</Body> : null}
      {sources.isError ? <Banner tone="amber">{sources.error.message}</Banner> : null}
      {sources.data?.slice(0, 1).map((source) => <Card key={source.id}><Text style={styles.sectionTitle}>{source.title}</Text><Body>{source.publisher} · {source.why_read}</Body></Card>)}
      <Button label="Ver fontes e termos →" onPress={() => router.push({ pathname: '/debate/[id]/fontes', params: { id: item.id } })} secondary />
      <Body>Debate restrito às pessoas convidadas.</Body>
    </> : null}
    {tab === 'conversa' ? <>
      <Kicker>Perspectivas em diálogo</Kicker><Heading>Uma questão.{"\n"}Muitas formas de olhar.</Heading>
      <View style={styles.filters}>{(['Recentes', 'Perspectivas', 'Minhas interações'] as const).map((choice) => <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: filter === choice }} onPress={() => setFilter(choice)} style={[styles.filter, filter === choice && styles.filterSelected]}><Text style={[styles.filterText, filter === choice && styles.filterTextSelected]}>{choice}</Text></Pressable>)}</View>
      {positions.isPending ? <Body>Carregando conversa…</Body> : null}
      {positions.isError ? <><Banner tone="amber">{positions.error.message}</Banner><Button label="Tentar novamente" onPress={() => void positions.refetch()} secondary /></> : null}
      {positions.data && loadedPositions.length === 0 ? <Card><Body>Esta conversa começa com a primeira posição justificada.</Body></Card> : null}
      {visiblePositions.filter((position) => filter !== 'Minhas interações' || position.author_user_id === currentUser.data || position.agreed).map((position) => <Card key={position.id}>
        <View style={styles.person}><View style={styles.avatar}><Text style={styles.avatarText}>{position.displayName.slice(0, 2).toUpperCase()}</Text></View><View><Text style={styles.personName}>{position.displayName}</Text><Text style={styles.small}>{position.edited_at ? 'Editado' : 'Contribuição'}</Text></View></View>
        <Text style={styles.stance}>{stances.find((s) => s.value === position.stance)?.label}</Text>
        <Text style={styles.rationale}>{position.rationale}</Text>
        {position.visibility === 'hidden' ? <Banner tone="amber">Esta contribuição foi ocultada pela mediação. {position.moderation_reason || ''}</Banner> : item.status === 'open' ? <View style={styles.reactions}>
          {position.author_user_id !== currentUser.data ? <AgreementButton positionId={position.id} initial={position.agreed} onError={(message) => Alert.alert('Não foi possível concordar', message)} /> : null}
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]/responder', params: { positionId: position.id, kind: 'question' } })}><Text style={styles.action}>Tenho uma dúvida</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]', params: { positionId: position.id } })}><Text style={styles.action}>Responder →</Text></Pressable>
        </View> : <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]', params: { positionId: position.id } })}><Text style={styles.action}>Ler respostas →</Text></Pressable>}
      </Card>)}
      {positions.hasNextPage ? <Button label="Carregar mais contribuições" onPress={() => void positions.fetchNextPage()} busy={positions.isFetchingNextPage} secondary /> : null}
    </> : null}
    {tab === 'sintese' ? summary.isPending ? <Body>Carregando síntese…</Body> : summary.isError ? <Banner tone="amber">{summary.error.message}</Banner> : summary.data ? <>
      <Kicker>Síntese revisada · versão {summary.data.revision}</Kicker><Heading>O que a conversa nos ajudou a entender?</Heading>
      <Body>Revisada por {reviewer.data || 'mediação do grupo'}.</Body>
      <SummaryBlock label="Panorama" text={summary.data.overview} />
      <SummaryBlock label="Argumentos apresentados" text={summary.data.arguments} />
      <SummaryBlock label="Pontos de encontro" text={summary.data.agreements_text} />
      <SummaryBlock label="Divergências" text={summary.data.divergences} />
      <SummaryBlock label="Perguntas em aberto" text={summary.data.open_questions} />
      {sources.data?.length ? <Card><Kicker>Fontes do debate</Kicker>{sources.data.map((source) => <Body key={source.id}>{source.title} · {source.publisher}</Body>)}</Card> : null}
      <Body>Publicada em {summary.data.published_at ? new Date(summary.data.published_at).toLocaleDateString('pt-BR') : 'data indisponível'}. Esta síntese não fala em nome de todas as pessoas.</Body>
    </> : <><Kicker>O diálogo ainda está acontecendo</Kicker><Heading>As ideias estão{"\n"}ganhando forma.</Heading><Body lead>A mediação reunirá argumentos, pontos de encontro e perguntas em aberto.</Body><Banner>A síntese será revisada por uma pessoa antes de ser publicada.</Banner></> : null}
    {item.status === 'closed' ? <Banner tone="amber">Este debate foi encerrado. Você pode consultar a conversa e a síntese.</Banner> : null}
  </Page>;
}

function SummaryBlock({ label, text }: { label: string; text: string }) { return <Card><Kicker>{label}</Kicker><Body>{text}</Body></Card>; }

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, marginHorizontal: -20, marginTop: -20, marginBottom: 22, backgroundColor: colors.white },
  tab: { flex: 1, padding: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabSelected: { borderBottomColor: colors.blue },
  tabText: { color: colors.muted, fontSize: 12 }, tabTextSelected: { color: colors.blue, fontWeight: '700' },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.greenPale, color: colors.green, borderRadius: 6, fontSize: 10, fontWeight: '700', padding: 6, marginBottom: 16 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 22 }, sectionTitle: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '700', marginBottom: 10 },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 12, flexWrap: 'wrap' }, filter: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: 20, padding: 9 }, filterSelected: { borderColor: '#A8BDDF', backgroundColor: colors.pale }, filterText: { color: colors.muted, fontSize: 11 }, filterTextSelected: { color: colors.blue, fontWeight: '700' },
  person: { flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 14 }, avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E4EAFB', justifyContent: 'center', alignItems: 'center' }, avatarText: { color: colors.blue, fontSize: 12, fontWeight: '700' }, personName: { color: colors.ink, fontSize: 12, fontWeight: '700' }, stance: { alignSelf: 'flex-start', backgroundColor: '#EAE7F7', borderRadius: 5, color: colors.ink, padding: 6, fontSize: 10 }, rationale: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 12 },
  small: { color: colors.muted, fontSize: 10 },
  reactions: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderTopColor: '#EDF0F5', paddingTop: 12, marginTop: 14, flexWrap: 'wrap' }, action: { color: colors.muted, fontSize: 11 },
});

function AgreementButton({ positionId, initial, onError }: { positionId: string; initial: boolean; onError: (message: string) => void }) {
  const [agreed, setAgreed] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (busy) return;
    const next = !agreed;
    setAgreed(next); setBusy(true);
    try { await setAgreement(positionId, next); }
    catch (cause) { setAgreed(!next); onError(cause instanceof Error ? cause.message : 'Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: agreed, busy }} onPress={() => void toggle()}><Text style={[styles.action, agreed && { color: colors.blue, fontWeight: '700' }]}>{agreed ? '✓ Concordo' : '♡ Concordo'}</Text></Pressable>;
}
