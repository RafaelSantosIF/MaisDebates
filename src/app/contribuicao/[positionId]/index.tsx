import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getAuthorName, getPosition, getReplies, setAgreement } from '@/features/contributions/dialogue';
import { stances } from '@/features/contributions/position';
import { getDebate } from '@/features/debates/api';
import { supabase } from '@/shared/lib/supabase';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function ContributionScreen() {
  const { positionId } = useLocalSearchParams<{ positionId: string }>();
  const queryClient = useQueryClient();
  const [agreementOverride, setAgreementOverride] = useState<boolean | null>(null);
  const position = useQuery({ queryKey: ['position', positionId], queryFn: () => getPosition(positionId!), enabled: !!positionId });
  const debate = useQuery({ queryKey: ['debate', position.data?.debate_id], queryFn: () => getDebate(position.data!.debate_id), enabled: !!position.data });
  const replies = useInfiniteQuery({ queryKey: ['replies', positionId], queryFn: ({ pageParam }) => getReplies(positionId!, debate.data!.space_id, pageParam), initialPageParam: 0, getNextPageParam: (lastPage) => lastPage.nextPage, enabled: !!debate.data });
  const author = useQuery({ queryKey: ['author-name', debate.data?.space_id, position.data?.author_user_id], queryFn: () => getAuthorName(debate.data!.space_id, position.data!.author_user_id), enabled: !!debate.data && !!position.data });
  const currentUser = useQuery({ queryKey: ['current-user'], queryFn: async () => (await supabase?.auth.getUser())?.data.user?.id || null });
  const agreement = useQuery({ queryKey: ['agreement', positionId], queryFn: async () => {
    if (!supabase) throw new Error('Configure o Supabase.');
    const { data, error } = await supabase.from('agreements').select('position_id').eq('position_id', positionId!).maybeSingle();
    if (error) throw new Error('Não foi possível conferir sua concordância.');
    return !!data;
  }, enabled: !!positionId });
  const agree = useMutation({ mutationFn: (next: boolean) => setAgreement(positionId!, next), onMutate: (next) => setAgreementOverride(next), onError: (cause: Error, next) => { setAgreementOverride(!next); Alert.alert('Não foi possível concordar', cause.message); }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['positions', debate.data?.id] }); await queryClient.invalidateQueries({ queryKey: ['agreement', positionId] }); setAgreementOverride(null); } });
  if (position.isPending || debate.isPending) return <Page title="Um ponto de vista"><Body>Carregando contribuição…</Body></Page>;
  if (position.isError || debate.isError) return <Page title="Um ponto de vista"><Banner tone="amber">Esta contribuição não está disponível.</Banner></Page>;
  const loadedReplies = replies.data?.pages.flatMap((page) => page.items) || [];
  return <Page title="Um ponto de vista" footer={debate.data.status === 'open' && position.data.visibility === 'visible' ? <Button label="Responder →" onPress={() => router.push({ pathname: '/contribuicao/[positionId]/responder', params: { positionId } })} /> : undefined}>
    <Kicker>Contribuição · {debate.data.spaces?.title}</Kicker>
    <Card><Text style={styles.person}>{author.data || 'Participante'}</Text><Text style={styles.stance}>{stances.find((item) => item.value === position.data.stance)?.label}</Text><Text style={styles.rationale}>{position.data.rationale}</Text>
      {position.data.visibility === 'hidden' ? <Banner tone="amber">Ocultado pela mediação. {position.data.moderation_reason || ''}</Banner> : null}
    </Card>
    {debate.data.status === 'open' && position.data.visibility === 'visible' && position.data.author_user_id !== currentUser.data ? <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: agreementOverride ?? agreement.data ?? false, busy: agree.isPending, disabled: agreement.isPending }} onPress={() => { if (!agreement.isPending && !agree.isPending) agree.mutate(!(agreementOverride ?? agreement.data ?? false)); }}><Text style={styles.actionText}>{(agreementOverride ?? agreement.data ?? false) ? '✓ Concordo' : '♡ Concordo'}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]/responder', params: { positionId, kind: 'question' } })}><Text style={styles.actionText}>Tenho uma dúvida</Text></Pressable>
    </View> : null}
    {position.data.visibility === 'visible' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]/denunciar', params: { positionId } })}><Text style={styles.report}>Denunciar contribuição</Text></Pressable> : null}
    <Heading>Continuar o diálogo</Heading>
    {replies.isPending ? <Body>Carregando respostas…</Body> : null}
    {replies.isError ? <Banner tone="amber">{replies.error.message}</Banner> : null}
    {replies.data && loadedReplies.length === 0 ? <Body>Esta contribuição ainda não tem respostas.</Body> : null}
    {loadedReplies.map((reply) => <Card key={reply.id}><View style={styles.replyTop}><Text style={styles.person}>{reply.displayName}</Text><Text style={styles.replyKind}>{reply.kind === 'question' ? 'Dúvida' : 'Resposta'}</Text></View><Body>{reply.body}</Body>{reply.visibility === 'hidden' ? <Banner tone="amber">Ocultado pela mediação. {reply.moderation_reason || ''}</Banner> : <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/contribuicao/[positionId]/denunciar', params: { positionId, replyId: reply.id } })}><Text style={styles.report}>Denunciar resposta</Text></Pressable>}</Card>)}
    {replies.hasNextPage ? <Button label="Carregar mais respostas" onPress={() => void replies.fetchNextPage()} busy={replies.isFetchingNextPage} secondary /> : null}
  </Page>;
}

const styles = StyleSheet.create({ person: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 10 }, stance: { alignSelf: 'flex-start', backgroundColor: '#EAE7F7', padding: 6, borderRadius: 5, color: colors.ink, fontSize: 10 }, rationale: { color: colors.ink, fontSize: 16, lineHeight: 23, marginTop: 14 }, report: { color: colors.blue, fontSize: 12, fontWeight: '700', marginVertical: 10 }, actions: { flexDirection: 'row', gap: 20, marginVertical: 10 }, actionText: { color: colors.blue, fontSize: 13, fontWeight: '700' }, replyTop: { flexDirection: 'row', justifyContent: 'space-between' }, replyKind: { color: colors.blue, fontSize: 10 } });
