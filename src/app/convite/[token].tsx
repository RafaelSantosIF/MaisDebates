import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { previewInvite } from '@/features/invitations/api';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { ConversationArt } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const validToken = typeof token === 'string' && /^[0-9a-f]{64}$/.test(token);
  const preview = useQuery({ queryKey: ['invite-preview', token], queryFn: () => previewInvite(token!), enabled: validToken, retry: false });
  useEffect(() => { if (!validToken) router.replace('/convite-expirado'); }, [validToken]);
  if (!validToken) return null;
  if (preview.isPending) return <Page title="Convite"><Body>Conferindo convite…</Body></Page>;
  if (preview.isError) return <Page title="Convite" footer={<Button label="Tentar novamente" onPress={() => void preview.refetch()} />}>
    <Kicker>Não foi possível entrar</Kicker><Heading>Confira seu convite.</Heading>
    <Body lead>{preview.error.message}</Body><Button label="Usar outro convite" onPress={() => router.replace('/convite-expirado')} secondary />
  </Page>;
  return <Page title="+Debates" footer={<Button label="Entrar no debate  →" onPress={() => router.push({ pathname: '/boas-vindas/[token]', params: { token } })} />}>
    <ConversationArt />
    <Kicker>Você recebeu um convite</Kicker>
    <Heading>Uma boa conversa começa com você.</Heading>
    <Body lead>Participe do debate de <Text style={styles.bold}>{preview.data.space_title}</Text>{preview.data.mediator_name ? `, com mediação de ${preview.data.mediator_name}` : ''}.</Body>
    <Card>
      <Text style={styles.tag}>● Aberto até {new Date(preview.data.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
      <View style={styles.questionRow}><View style={styles.subjectIcon}><Text style={styles.subjectIconText}>❧</Text></View><Text style={styles.question}>{preview.data.question || 'Conversa do grupo'}</Text></View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>♧ Turma de debate</Text>
        {preview.data.mediator_name ? <Text style={styles.meta}>♙ {preview.data.mediator_name}</Text> : null}
      </View>
    </Card>
    <Banner tone="blue"><Text style={styles.bannerTitle}>Seu nome e suas contribuições serão vistos apenas por este grupo.</Text></Banner>
  </Page>;
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  tag: { alignSelf: 'flex-start', color: colors.green, backgroundColor: colors.greenPale, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 16, fontSize: 11, fontWeight: '700' },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  subjectIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#E7F7F5', alignItems: 'center', justifyContent: 'center' }, subjectIconText: { color: '#16978B', fontSize: 28 },
  question: { color: colors.ink, flex: 1, fontSize: 18, lineHeight: 25, fontWeight: '700' },
  metaRow: { borderTopWidth: 1, borderTopColor: '#EEF1F5', marginTop: 16, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meta: { color: colors.muted, fontSize: 11 }, bannerTitle: { color: colors.blue, fontWeight: '700' },
});
