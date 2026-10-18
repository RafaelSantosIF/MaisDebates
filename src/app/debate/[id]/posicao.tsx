import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { clearDraft, freshKey, getMyPosition, loadDraft, positionSchema, savePosition, stances, storeDraft, type PositionDraft, type Stance } from '@/features/contributions/position';
import { getDebate } from '@/features/debates/api';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function PositionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const debate = useQuery({ queryKey: ['debate', id], queryFn: () => getDebate(id!), enabled: !!id });
  const current = useQuery({ queryKey: ['my-position', id], queryFn: () => getMyPosition(id!), enabled: !!id });
  const [draft, setDraft] = useState<PositionDraft>({ stance: 'em_parte', rationale: '', sourceNote: '', key: freshKey() });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id || current.isPending || loaded) return;
    void loadDraft(id).then((saved) => {
      if (saved) setDraft(saved);
      else if (current.data) setDraft({ stance: current.data.stance, rationale: current.data.rationale, sourceNote: current.data.source_note || '', key: freshKey() });
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [id, current.isPending, current.data, loaded]);
  useEffect(() => {
    if (!id || !loaded) return;
    const timeout = setTimeout(() => { void storeDraft(id, draft); }, 300);
    return () => clearTimeout(timeout);
  }, [id, draft, loaded]);
  const save = useMutation({ mutationFn: () => savePosition(id!, draft, current.data?.revision || 0), onSuccess: async () => {
    await clearDraft(id!);
    await queryClient.invalidateQueries({ queryKey: ['my-position', id] });
    await queryClient.invalidateQueries({ queryKey: ['positions', id] });
    router.replace({ pathname: '/debate/[id]/publicada', params: { id: id! } });
  }, onError: (cause: Error) => setError(cause.message) });
  function edit(patch: Partial<Pick<PositionDraft, 'stance' | 'rationale' | 'sourceNote'>>) { setDraft((old) => ({ ...old, ...patch, key: freshKey() })); setError(''); }
  function submit() {
    const parsed = positionSchema.safeParse(draft);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Confira sua posição.'); return; }
    if (debate.data?.status !== 'open') { setError('Este debate está encerrado. Seu rascunho continua salvo.'); return; }
    save.mutate();
  }
  if (debate.isPending || current.isPending || !loaded) return <Page title="Minha posição"><Body>Carregando posição…</Body></Page>;
  if (debate.isError || current.isError) return <Page title="Minha posição"><Banner tone="amber">Não foi possível carregar sua posição. Tente novamente.</Banner></Page>;
  return <Page title={current.data ? 'Revisar posição' : 'Minha posição'} footer={<Button label={current.data ? 'Salvar alterações' : 'Publicar posição'} onPress={submit} busy={save.isPending} disabled={debate.data.status !== 'open'} />}>
    <Kicker>Sua perspectiva importa</Kicker><Heading>O que você pensa{"\n"}sobre o tema?</Heading><Body>{debate.data.question}</Body>
    <Text style={styles.section}>Minha posição</Text>
    <View style={styles.choices}>{stances.map((choice) => <Pressable key={choice.value} accessibilityRole="radio" accessibilityState={{ checked: draft.stance === choice.value }} onPress={() => edit({ stance: choice.value as Stance })} style={[styles.choice, draft.stance === choice.value && styles.selected]}><Text style={[styles.choiceText, draft.stance === choice.value && styles.selectedText]}>{draft.stance === choice.value ? '✓ ' : ''}{choice.label}</Text></Pressable>)}</View>
    <Field label="Explique seu ponto de vista" value={draft.rationale} onChangeText={(value) => edit({ rationale: value })} placeholder="Que razões levaram você a essa posição?" multiline helper="Pode ser uma razão, um exemplo ou uma dúvida. Justificativa obrigatória." error={error} />
    <Field label="Quer citar uma fonte? (opcional)" value={draft.sourceNote} onChangeText={(value) => edit({ sourceNote: value })} placeholder="Título ou link do material" />
    <Banner>Você pode mudar de ideia. Sua posição poderá ser revisada enquanto o debate estiver aberto.</Banner>
  </Page>;
}

const styles = StyleSheet.create({
  section: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 16 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginVertical: 12 },
  choice: { width: '48%', minHeight: 48, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 11 },
  selected: { backgroundColor: colors.pale, borderColor: colors.blue, borderWidth: 2 }, choiceText: { color: colors.ink, fontSize: 12 }, selectedText: { color: colors.blue, fontWeight: '700' },
});
