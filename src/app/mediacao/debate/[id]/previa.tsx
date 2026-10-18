import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getLatestSummary, publishSummary, saveSummary } from '@/features/mediation/api';
import { clearSummaryDraft, loadSummaryDraft, storeSummaryDraft, type SummaryDraft } from '@/features/mediation/draft';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function SummaryPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const latest = useQuery({ queryKey: ['latest-summary', id], queryFn: () => getLatestSummary(id!), enabled: !!id });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SummaryDraft | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (id) void loadSummaryDraft(id).then(setDraft); }, [id]);
  const publish = useMutation({ mutationFn: async () => {
    if (!id || !draft) throw new Error('Rascunho indisponível.');
    if (!reviewed) throw new Error('Conclua a revisão antes de publicar.');
    const fields = [draft.overview, draft.arguments, draft.agreementsText, draft.divergences, draft.openQuestions];
    if (fields.some((value) => !value.trim())) throw new Error('Preencha todas as partes da síntese.');
    const saved = draft.savedId && draft.savedRevision ? { id: draft.savedId, revision: draft.savedRevision } : await saveSummary({ debateId: id, overview: draft.overview, arguments: draft.arguments, agreementsText: draft.agreementsText, divergences: draft.divergences, openQuestions: draft.openQuestions, expectedRevision: latest.data?.revision || 0 });
    if (!draft.savedId) { const next = { ...draft, savedId: saved.id, savedRevision: saved.revision }; setDraft(next); await storeSummaryDraft(id, next); }
    await publishSummary(saved.id, saved.revision, reviewed);
  }, onSuccess: async () => { await clearSummaryDraft(id!); await queryClient.invalidateQueries({ queryKey: ['published-summary', id] }); router.replace({ pathname: '/debate/[id]', params: { id: id!, tab: 'sintese' } }); }, onError: (cause: Error) => setError(cause.message) });
  return <Page title="Prévia da síntese" footer={<Button label="Publicar síntese" onPress={() => publish.mutate()} busy={publish.isPending} />}>
    <Kicker>Prévia da síntese</Kicker><Heading>O que a conversa nos ajudou a entender?</Heading>
    {draft ? <>{[
      ['Panorama', draft.overview], ['Argumentos apresentados', draft.arguments], ['Pontos de encontro', draft.agreementsText], ['Divergências', draft.divergences], ['Perguntas em aberto', draft.openQuestions],
    ].map(([label, value]) => <Card key={label}><Kicker>{label}</Kicker><Body>{value || 'Ainda não escrito.'}</Body></Card>)}</> : <Body>Carregando prévia…</Body>}
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: reviewed }} onPress={() => setReviewed(!reviewed)} style={styles.checkline}><View style={[styles.checkbox, reviewed && styles.checked]}>{reviewed ? <Text style={styles.tick}>✓</Text> : null}</View><Text style={styles.checkText}>Revisei os argumentos e preservei divergências e perguntas em aberto.</Text></Pressable>
    {error ? <Banner tone="amber">{error} Seu rascunho continua salvo.</Banner> : null}
  </Page>;
}
const styles = StyleSheet.create({ checkline: { flexDirection: 'row', gap: 9, marginVertical: 16 }, checkbox: { width: 18, height: 18, borderColor: colors.blue, borderWidth: 1, borderRadius: 3 }, checked: { backgroundColor: colors.blue }, tick: { color: colors.white, fontSize: 13, textAlign: 'center' }, checkText: { color: colors.muted, fontSize: 11, lineHeight: 18, flex: 1 } });
