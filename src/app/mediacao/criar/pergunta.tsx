import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createDebate, getMediatorSpaces, updateDebateDraft } from '@/features/mediation/api';
import { clearDebateDraft, loadDebateDraft, storeDebateDraft, type DebateDraft } from '@/features/mediation/draft';
import { debateClosesAt } from '@/features/mediation/date';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function CreateQuestionScreen() {
  const queryClient = useQueryClient();
  const spaces = useQuery({ queryKey: ['mediator-spaces'], queryFn: getMediatorSpaces });
  const [draft, setDraft] = useState<DebateDraft | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void loadDebateDraft().then(setDraft); }, []);
  useEffect(() => { if (!draft) return; const timer = setTimeout(() => { void storeDebateDraft(draft); }, 300); return () => clearTimeout(timer); }, [draft]);
  const save = useMutation({ mutationFn: async () => {
    if (!draft?.spaceId) throw new Error('Escolha o grupo convidado.');
    const fields = { question: draft.question, context: draft.context, closesAt: debateClosesAt(draft.closesAt), sources: draft.sources, terms: draft.terms };
    const result = draft.createdId && draft.version
      ? await updateDebateDraft({ debateId: draft.createdId, expectedVersion: draft.version, ...fields })
      : await createDebate({ spaceId: draft.spaceId, idempotencyKey: draft.key, ...fields });
    await storeDebateDraft({ ...draft, createdId: result.id, version: result.version });
  }, onSuccess: async () => { await clearDebateDraft(); await queryClient.invalidateQueries({ queryKey: ['mediator-debates'] }); router.replace('/mediacao'); }, onError: (cause: Error) => setError(cause.message) });
  async function next() {
    if (!draft) return;
    if (!draft.spaceId) { setError('Escolha o grupo convidado.'); return; }
    if (!draft.question.trim()) { setError('Escreva a pergunta do debate.'); return; }
    try { debateClosesAt(draft.closesAt); } catch (cause) { setError((cause as Error).message); return; }
    await storeDebateDraft(draft);
    router.push('/mediacao/criar/contexto');
  }
  return <Page title="Criar debate" footer={<Button label="Continuar: contexto →" onPress={() => void next()} />}>
    <Kicker>1 de 3 · A pergunta</Kicker><Heading>Qual conversa{"\n"}você quer abrir?</Heading>
    <Field label="Pergunta do debate" value={draft?.question || ''} onChangeText={(value) => setDraft((old) => old && ({ ...old, question: value }))} multiline helper="Uma questão delimitada, que permita razões e perspectivas diferentes." />
    <Text style={styles.label}>Grupo convidado</Text>
    {spaces.isPending ? <Body>Carregando grupos…</Body> : null}
    {spaces.data?.map((space) => <Pressable key={space.space_id} accessibilityRole="radio" accessibilityState={{ checked: draft?.spaceId === space.space_id }} onPress={() => setDraft((old) => old && ({ ...old, spaceId: space.space_id }))} style={[styles.group, draft?.spaceId === space.space_id && styles.groupSelected]}><Text style={styles.groupText}>{space.spaces?.title}</Text></Pressable>)}
    <Field label="Encerramento (AAAA-MM-DD)" value={draft?.closesAt || ''} onChangeText={(value) => setDraft((old) => old && ({ ...old, closesAt: value }))} placeholder="2026-10-24" />
    <Button label="Salvar rascunho" onPress={() => save.mutate()} busy={save.isPending} secondary />
    <Banner>Somente as pessoas convidadas terão acesso ao debate.</Banner>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </Page>;
}
const styles = StyleSheet.create({ label: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 12 }, group: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 8 }, groupSelected: { borderColor: colors.blue, backgroundColor: colors.pale }, groupText: { color: colors.ink, fontSize: 14 }, error: { color: colors.red, fontSize: 12, marginTop: 10 } });
