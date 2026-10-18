import { useState } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listDebates, type Debate } from '@/features/debates/api';
import { getMediatorSpaces } from '@/features/mediation/api';
import { deadlineCalendarDate } from '@/features/mediation/date';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function DebatesScreen() {
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const debates = useQuery({ queryKey: ['debates'], queryFn: listDebates });
  const mediatorSpaces = useQuery({ queryKey: ['mediator-spaces'], queryFn: getMediatorSpaces });
  const visible = debates.data?.filter((item) => item.status === filter) || [];
  return <Page title="+Debates">
    <Kicker>Seus espaços de conversa</Kicker><Heading>Vamos ampliar{"\n"}a conversa?</Heading>
    <Body>Leia, escute e compartilhe no seu tempo.</Body>
    {mediatorSpaces.data?.length ? <Button label="Abrir mediação →" onPress={() => router.push('/mediacao')} secondary /> : null}
    <View style={styles.filters}>{(['open', 'closed'] as const).map((choice) => <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: filter === choice }} onPress={() => setFilter(choice)} style={[styles.chip, filter === choice && styles.chipSelected]}><Text style={[styles.chipText, filter === choice && styles.chipTextSelected]}>{choice === 'open' ? 'Em andamento' : 'Encerrados'}</Text></Pressable>)}</View>
    {debates.isPending ? <Body>Carregando debates…</Body> : null}
    {debates.isError ? <><Banner tone="amber">{debates.error.message}</Banner><Button label="Tentar novamente" onPress={() => void debates.refetch()} secondary /></> : null}
    {!debates.isPending && !debates.isError && visible.length === 0 ? <Card><Text style={styles.cardTitle}>Nenhum debate {filter === 'open' ? 'em andamento' : 'encerrado'} por aqui.</Text><Body>Entre com um convite individual para participar de um grupo.</Body></Card> : null}
    {visible.map((debate) => <DebateCard key={debate.id} debate={debate} />)}
    <Banner>Você pode ler os argumentos e refletir antes de publicar sua posição.</Banner>
    <Button label="Entrar com um convite" onPress={() => router.push({ pathname: '/', params: { novo: '1' } })} secondary />
  </Page>;
}

function DebateCard({ debate }: { debate: Debate }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir debate: ${debate.question}`} onPress={() => router.push({ pathname: '/debate/[id]', params: { id: debate.id } })}>
    <Card><View style={styles.cardTop}><Text style={[styles.tag, debate.status === 'closed' && styles.closedTag]}>{debate.status === 'closed' ? 'Encerrado' : 'Em andamento'}</Text><Text style={styles.small}>{debate.spaces?.title}</Text></View>
      <Text style={styles.question}>{debate.question}</Text>
      <View style={styles.cardBottom}><Text style={styles.small}>{debate.closes_at ? `Até ${deadlineCalendarDate(debate.closes_at).split('-').reverse().join('/')}` : 'Sem data de encerramento'}</Text><Text style={styles.link}>Abrir debate →</Text></View>
    </Card>
  </Pressable>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: 8, marginVertical: 12 }, chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 }, chipSelected: { backgroundColor: colors.pale, borderColor: '#A8BDDF' }, chipText: { color: colors.muted, fontSize: 11 }, chipTextSelected: { color: colors.blue, fontWeight: '700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, tag: { backgroundColor: colors.greenPale, color: colors.green, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, fontSize: 10, fontWeight: '700' }, closedTag: { backgroundColor: '#ECF0F5', color: colors.muted }, small: { color: colors.muted, fontSize: 11 }, question: { color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '700', marginVertical: 14 }, cardBottom: { borderTopWidth: 1, borderTopColor: '#EDF0F5', paddingTop: 13, flexDirection: 'row', justifyContent: 'space-between' }, link: { color: colors.blue, fontSize: 11, fontWeight: '700' }, cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
});
