import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text } from 'react-native';
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
  return <Page title="+Debates" footer={<Button label="Continuar →" onPress={() => router.push({ pathname: '/boas-vindas/[token]', params: { token } })} />}>
    <ConversationArt />
    <Kicker>Você recebeu um convite</Kicker>
    <Heading>Uma boa conversa começa com você.</Heading>
    <Body lead>Participe do debate de <Text style={styles.bold}>{preview.data.space_title}</Text>{preview.data.mediator_name ? `, com mediação de ${preview.data.mediator_name}` : ''}.</Body>
    <Card><Text style={styles.tag}>Convite válido até {new Date(preview.data.expires_at).toLocaleDateString('pt-BR')}</Text><Text style={styles.question}>{preview.data.question || 'Conversa do grupo'}</Text></Card>
    <Banner>Seu nome de exibição e suas contribuições serão vistos apenas pelas pessoas deste grupo.</Banner>
  </Page>;
}

const styles = StyleSheet.create({ bold: { fontWeight: '700' }, tag: { alignSelf: 'flex-start', color: colors.green, backgroundColor: colors.greenPale, padding: 6, borderRadius: 6, fontSize: 11, fontWeight: '700' }, question: { color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '700', marginTop: 10 } });
