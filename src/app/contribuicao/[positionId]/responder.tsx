import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Text } from 'react-native';
import { clearReplyDraft, createReply, getPosition, loadReplyDraft, saveReplyDraft } from '@/features/contributions/dialogue';
import { freshKey } from '@/features/contributions/position';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function ReplyScreen() {
  const { positionId, kind: routeKind } = useLocalSearchParams<{ positionId: string; kind?: string }>();
  const queryClient = useQueryClient();
  const position = useQuery({ queryKey: ['position', positionId], queryFn: () => getPosition(positionId!), enabled: !!positionId });
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<'reply' | 'question'>(routeKind === 'question' ? 'question' : 'reply');
  const [key, setKey] = useState(freshKey());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!positionId) return; void loadReplyDraft(positionId).then((draft) => { setBody(draft.body); setKind(routeKind === 'question' ? 'question' : draft.kind); setKey(draft.key); setLoaded(true); }).catch(() => setLoaded(true)); }, [positionId, routeKind]);
  useEffect(() => { if (!loaded || !positionId) return; const timer = setTimeout(() => { void saveReplyDraft(positionId, { body, kind, key }); }, 300); return () => clearTimeout(timer); }, [body, kind, key, loaded, positionId]);
  const publish = useMutation({ mutationFn: () => createReply(positionId!, kind, body, key), onSuccess: async () => { await clearReplyDraft(positionId!); await queryClient.invalidateQueries({ queryKey: ['replies', positionId] }); router.replace({ pathname: '/contribuicao/[positionId]', params: { positionId: positionId! } }); }, onError: (cause: Error) => setError(cause.message) });
  function changeBody(value: string) { setBody(value); setKey(freshKey()); setError(''); }
  function cancel() {
    if (!body.trim()) { router.back(); return; }
    Alert.alert('Sair da resposta?', 'Seu texto não será publicado agora. O rascunho ficará salvo neste dispositivo.', [
      { text: 'Continuar escrevendo', style: 'cancel' },
      { text: 'Sair', onPress: () => { if (positionId) void saveReplyDraft(positionId, { body, kind, key }).finally(() => router.back()); else router.back(); } },
    ]);
  }
  return <Page title="Escrever resposta" onBack={cancel} footer={<Button label={kind === 'question' ? 'Publicar dúvida' : 'Publicar resposta'} onPress={() => publish.mutate()} busy={publish.isPending} />}>
    <Kicker>{kind === 'question' ? 'Uma dúvida abre caminhos' : 'Converse com uma ideia'}</Kicker>
    <Heading>{kind === 'question' ? 'O que você gostaria de entender?' : 'Qual é sua contribuição?'}</Heading>
    {position.data ? <Banner>“{position.data.rationale.slice(0, 140)}”</Banner> : null}
    <Field label={kind === 'question' ? 'Minha dúvida' : 'Minha resposta'} value={body} onChangeText={changeBody} placeholder="Escreva com respeito e explique sua ideia." multiline error={error} />
    <Text accessibilityRole="button" onPress={() => { setKind(kind === 'question' ? 'reply' : 'question'); setKey(freshKey()); }} style={{ color: colors.blue, fontWeight: '700', marginBottom: 20 }}>Escrever como {kind === 'question' ? 'resposta' : 'dúvida'}</Text>
    <Body>A pessoa que escreveu a posição e os membros do grupo poderão ler sua contribuição.</Body>
    <Button label="Cancelar" onPress={cancel} secondary />
  </Page>;
}
