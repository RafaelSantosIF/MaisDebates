import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDebate, getMediatorSpaces, openDebate, updateDebateDraft } from '@/features/mediation/api';
import { clearDebateDraft, loadDebateDraft, storeDebateDraft, type DebateDraft } from '@/features/mediation/draft';
import { debateClosesAt } from '@/features/mediation/date';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';

export default function CreatePreviewScreen() {
  const [draft, setDraft] = useState<DebateDraft | null>(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const spaces = useQuery({ queryKey: ['mediator-spaces'], queryFn: getMediatorSpaces });
  useEffect(() => { void loadDebateDraft().then(setDraft); }, []);
  const publish = useMutation({ mutationFn: async () => {
    if (!draft) throw new Error('Rascunho indisponível.');
    const closesAt = debateClosesAt(draft.closesAt);
    const created = draft.createdId && draft.version
      ? await updateDebateDraft({ debateId: draft.createdId, expectedVersion: draft.version, question: draft.question, context: draft.context, closesAt, sources: draft.sources, terms: draft.terms })
      : await createDebate({ spaceId: draft.spaceId, question: draft.question, context: draft.context, closesAt, sources: draft.sources, terms: draft.terms, idempotencyKey: draft.key });
    const saved = { ...draft, createdId: created.id, version: created.version }; setDraft(saved); await storeDebateDraft(saved);
    await openDebate(created.id, created.version);
    return created.id;
  }, onSuccess: async () => { await clearDebateDraft(); await queryClient.invalidateQueries({ queryKey: ['mediator-debates'] }); router.replace('/mediacao'); }, onError: (cause: Error) => setError(cause.message) });
  return <Page title="Prévia do debate" footer={<Button label="Abrir debate" onPress={() => publish.mutate()} busy={publish.isPending} />}>
    <Kicker>3 de 3 · Revisão</Kicker><Heading>Pronto para{"\n"}abrir a conversa?</Heading>
    <Kicker>{spaces.data?.find((space) => space.space_id === draft?.spaceId)?.spaces?.title || 'Grupo convidado'}</Kicker>
    <Heading>{draft?.question || 'Pergunta do debate'}</Heading>
    <Body lead>{draft?.context || 'Contexto ainda não escrito.'}</Body>
    <Banner>Você pode ler o contexto e as fontes antes de publicar sua posição.</Banner>
    <Kicker>Contexto e evidências</Kicker>
    {draft?.sources.map((source) => <Card key={source.url}><Heading>{source.title}</Heading><Body>{source.publisher} · {source.whyRead}</Body></Card>)}
    {draft?.terms.length ? <><Kicker>Termos para compreender</Kicker>{draft.terms.map((term) => <Card key={term.term}><Heading>{term.term}</Heading><Body>{term.definition}</Body></Card>)}</> : null}
    <Banner>Visibilidade restrita ao grupo convidado. Contexto e fontes serão apresentados antes da escrita.</Banner>
    <Body>Ao abrir o debate, você poderá compartilhar convites individuais com o grupo.</Body>
    <Button label="Revisar os campos" onPress={() => router.push('/mediacao/criar/pergunta')} secondary />
    {error ? <Banner tone="amber">{error} O rascunho continua neste dispositivo.</Banner> : null}
  </Page>;
}
