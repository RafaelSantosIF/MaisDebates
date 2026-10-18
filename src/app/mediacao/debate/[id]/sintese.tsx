import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getDebate } from '@/features/debates/api';
import { getLatestSummary } from '@/features/mediation/api';
import { blankSummaryDraft, loadSummaryDraft, storeSummaryDraft, type SummaryDraft } from '@/features/mediation/draft';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';

export default function SummaryEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debate = useQuery({ queryKey: ['debate', id], queryFn: () => getDebate(id!), enabled: !!id });
  const latest = useQuery({ queryKey: ['latest-summary', id], queryFn: () => getLatestSummary(id!), enabled: !!id });
  const [draft, setDraft] = useState<SummaryDraft>(blankSummaryDraft());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (!id || latest.isPending || loaded) return; void loadSummaryDraft(id).then((saved) => {
    if (saved.overview || saved.arguments || saved.savedId) setDraft(saved);
    else if (latest.data) setDraft({ overview: latest.data.overview, arguments: latest.data.arguments, agreementsText: latest.data.agreements_text, divergences: latest.data.divergences, openQuestions: latest.data.open_questions });
    setLoaded(true);
  }).catch(() => setLoaded(true)); }, [id, latest.isPending, latest.data, loaded]);
  useEffect(() => { if (!id || !loaded) return; const timer = setTimeout(() => { void storeSummaryDraft(id, draft); }, 300); return () => clearTimeout(timer); }, [id, draft, loaded]);
  function edit(field: keyof SummaryDraft, value: string) { setDraft((old) => ({ ...old, [field]: value, savedId: undefined, savedRevision: undefined })); }
  async function preview() { if (!id) return; await storeSummaryDraft(id, draft); router.push({ pathname: '/mediacao/debate/[id]/previa', params: { id } }); }
  if (debate.isPending || latest.isPending || !loaded) return <Page title="Preparar síntese"><Body>Carregando editor…</Body></Page>;
  if (debate.isError || latest.isError) return <Page title="Preparar síntese"><Banner tone="amber">Não foi possível abrir o editor.</Banner></Page>;
  return <Page title="Preparar síntese" footer={<Button label="Pré-visualizar síntese →" onPress={() => void preview()} disabled={debate.data.status !== 'closed'} />}>
    <Kicker>Organizar sem encerrar o pensamento</Kicker><Heading>O que a conversa{"\n"}nos ajudou a entender?</Heading>
    {debate.data.status !== 'closed' ? <Banner tone="amber">Encerre o debate antes de publicar uma síntese.</Banner> : null}
    <Field label="Panorama" value={draft.overview} onChangeText={(value) => edit('overview', value)} multiline />
    <Field label="Argumentos apresentados" value={draft.arguments} onChangeText={(value) => edit('arguments', value)} multiline />
    <Field label="Pontos de encontro" value={draft.agreementsText} onChangeText={(value) => edit('agreementsText', value)} multiline />
    <Field label="Divergências" value={draft.divergences} onChangeText={(value) => edit('divergences', value)} multiline />
    <Field label="Perguntas em aberto" value={draft.openQuestions} onChangeText={(value) => edit('openQuestions', value)} multiline />
    <Banner>A síntese deve reconhecer divergências e não falar em nome de todas as pessoas.</Banner>
  </Page>;
}
