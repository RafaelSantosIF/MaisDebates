import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { previewInvite } from '@/features/invitations/api';
import { Body, Button, Heading, Page } from '@/shared/ui/Primitives';
import { ConversationArt, SkiaGlyph } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const validToken = typeof token === 'string' && /^[0-9a-f]{64}$/.test(token);
  const preview = useQuery({ queryKey: ['invite-preview', token], queryFn: () => previewInvite(token!), enabled: validToken, retry: false });
  useEffect(() => { if (!validToken) router.replace('/convite-expirado'); }, [validToken]);

  if (!validToken) return null;
  if (preview.isPending) return <Page title="Convite"><Body>Conferindo convite…</Body></Page>;
  if (preview.isError) return <Page title="Convite" footer={<Button label="Tentar novamente" onPress={() => void preview.refetch()} />}>
    <ConversationArt variant="invite" />
    <Text style={styles.kicker}>NÃO FOI POSSÍVEL ENTRAR</Text>
    <Heading>Confira seu convite.</Heading>
    <Body lead>{preview.error.message}</Body>
    <Button label="Usar outro convite" onPress={() => router.replace('/convite-expirado')} secondary />
  </Page>;

  const expiresOn = new Date(preview.data.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return (
    <Page title="+Debates" footer={<Button label="Continuar" onPress={() => router.push({ pathname: '/boas-vindas/[token]', params: { token } })} large />}>
      <ConversationArt variant="invite" />
      <View style={styles.kickerRow}><SkiaGlyph name="people" size={24} color="#1764D8" /><Text style={styles.kicker}>VOCÊ RECEBEU UM CONVITE</Text></View>
      <Heading large>Uma boa conversa começa com você.</Heading>
      <Body lead>Participe do debate da <Text style={styles.bold}>{preview.data.space_title}</Text>{preview.data.mediator_name ? `, com mediação de ${preview.data.mediator_name}` : ''}.</Body>

      <View style={styles.card}>
        <View style={styles.datePill}><SkiaGlyph name="calendar" size={18} color="#07865D" /><Text style={styles.dateText}>Aberto até {expiresOn}</Text></View>
        <View style={styles.questionRow}>
          <View style={styles.subjectIcon}><SkiaGlyph name="leaf" size={48} color="#25A987" /></View>
          <Text style={styles.question}>{preview.data.question || 'Conversa do grupo'}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}><SkiaGlyph name="comments" size={20} /><Text style={styles.meta}>Comentários</Text></View>
          <View style={styles.metaItem}><SkiaGlyph name="people" size={20} /><Text style={styles.meta}>{preview.data.space_title}</Text></View>
          {preview.data.mediator_name ? <View style={styles.metaItem}><SkiaGlyph name="person" size={20} /><Text style={styles.meta}>Mediação: {preview.data.mediator_name}</Text></View> : null}
        </View>
      </View>

      <View style={styles.privacyBox}><SkiaGlyph name="shield" size={36} color="#1764D8" /><Text style={styles.privacyText}>Seu nome de exibição e suas contribuições serão vistos apenas pelas pessoas deste grupo.</Text></View>
      <View style={styles.features}>
        <View style={styles.feature}><View style={[styles.featureIcon, { backgroundColor: '#E7F0FF' }]}><SkiaGlyph name="people" size={38} color="#3478E8" /></View><Text style={styles.featureText}>Converse com outras pessoas</Text></View>
        <View style={[styles.feature, styles.featureDivider]}><View style={[styles.featureIcon, { backgroundColor: '#E2F7EF' }]}><SkiaGlyph name="idea" size={38} color="#168565" /></View><Text style={styles.featureText}>Explore diferentes pontos de vista</Text></View>
        <View style={[styles.feature, styles.featureDivider]}><View style={[styles.featureIcon, { backgroundColor: '#FFF2D0' }]}><SkiaGlyph name="civic" size={38} color="#D99A00" /></View><Text style={styles.featureText}>Participe de debates sobre políticas públicas</Text></View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  kicker: { color: '#1764D8', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  bold: { color: '#17396F', fontWeight: '700' },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#E1EAF8', borderRadius: 20, padding: 16, marginTop: 2, marginBottom: 12, shadowColor: '#4C72A8', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  datePill: { alignSelf: 'flex-start', backgroundColor: '#DFF5ED', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: '#07865D', fontSize: 12, fontWeight: '700' },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, marginBottom: 16 },
  subjectIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E8F5F4', alignItems: 'center', justifyContent: 'center' },
  question: { color: '#10264D', flex: 1, fontSize: 19, lineHeight: 26, fontWeight: '700' },
  metaRow: { borderTopWidth: 1, borderTopColor: '#E5ECF7', paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, meta: { color: '#526B98', fontSize: 11 },
  privacyBox: { backgroundColor: '#EAF2FF', borderRadius: 16, padding: 14, marginVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  privacyText: { color: '#526B98', flex: 1, fontSize: 12, lineHeight: 18 },
  features: { flexDirection: 'row', marginTop: 14, marginBottom: 4 }, feature: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  featureDivider: { borderLeftWidth: 1, borderColor: '#D7E3F8' },
  featureIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  featureText: { color: '#17396F', fontSize: 12, lineHeight: 17, textAlign: 'center', fontWeight: '600' },
});
