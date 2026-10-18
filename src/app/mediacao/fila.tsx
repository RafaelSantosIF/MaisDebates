import { useState } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getPendingReports, getResolvedReports } from '@/features/mediation/api';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

const labels: Record<string, string> = { personal_attack: 'Possível ataque pessoal', discrimination: 'Possível discriminação', personal_info: 'Informação pessoal', spam_other: 'Spam ou outro motivo' };
export default function ReviewQueueScreen() {
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');
  const reports = useQuery({ queryKey: filter === 'pending' ? ['pending-reports'] : ['resolved-reports'], queryFn: filter === 'pending' ? getPendingReports : getResolvedReports });
  return <Page title="Fila de revisão"><Kicker>Cuidado com o diálogo</Kicker><Heading>Olhe o contexto.{"\n"}Decida com cuidado.</Heading>
    <View style={styles.filters}>{(['pending', 'resolved'] as const).map((choice) => <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: choice === filter }} onPress={() => setFilter(choice)} style={[styles.filter, choice === filter && styles.filterSelected]}><Text style={styles.filterText}>{choice === 'pending' ? 'Pendentes' : 'Resolvidos'}</Text></Pressable>)}</View>
    {reports.isPending ? <Body>Carregando fila…</Body> : null}
    {reports.isError ? <><Banner tone="amber">{reports.error.message}</Banner><Button label="Tentar novamente" onPress={() => void reports.refetch()} secondary /></> : null}
    {reports.data?.length === 0 ? <Card><Body>{filter === 'pending' ? 'Nenhum caso pendente agora.' : 'Nenhum caso resolvido ainda.'}</Body></Card> : null}
    {reports.data?.map((report) => <Pressable key={report.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/mediacao/caso/[id]', params: { id: report.id } })}><Card><Text style={styles.tag}>{report.status === 'pending' ? 'Pendente' : report.status === 'hidden' ? 'Ocultado' : report.status === 'restored' ? 'Restaurado' : 'Mantido'}</Text><Text style={styles.title}>{labels[report.reason] || 'Contribuição sinalizada'}</Text><Body>{report.debates?.question}</Body><Body>Recebida em {new Date(report.created_at).toLocaleDateString('pt-BR')}</Body><Text style={styles.link}>{report.status === 'pending' ? 'Analisar' : 'Ver decisão'} →</Text></Card></Pressable>)}
    <Banner>A identidade de quem denunciou não é exibida no caso.</Banner>
  </Page>;
}
const styles = StyleSheet.create({ filters: { flexDirection: 'row', gap: 8, marginBottom: 12 }, filter: { padding: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.white }, filterSelected: { backgroundColor: colors.pale, borderColor: colors.blue }, filterText: { color: colors.blue, fontSize: 12, fontWeight: '700' }, tag: { alignSelf: 'flex-start', backgroundColor: '#FFF0D9', color: colors.amber, fontSize: 10, fontWeight: '700', padding: 6, borderRadius: 6, marginBottom: 12 }, title: { color: colors.ink, fontSize: 16, fontWeight: '700' }, link: { color: colors.blue, fontSize: 12, fontWeight: '700' } });
