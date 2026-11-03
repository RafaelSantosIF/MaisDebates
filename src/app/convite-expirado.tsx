import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Field, Heading, Page } from '@/shared/ui/Primitives';
import { ConversationArt, SkiaGlyph } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';
import { normalizeInviteToken } from '@/features/invitations/token';

export default function ExpiredInviteScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  function retry() {
    const token = normalizeInviteToken(code);
    if (!token) { setError('Insira um código de convite válido.'); return; }
    router.replace({ pathname: '/convite/[token]', params: { token } });
  }

  return (
    <Page title="Convite" footer={<Button label="Tentar outro convite" onPress={retry} large />}>
      <ConversationArt variant="expired" />
      <View style={styles.peopleMark}><SkiaGlyph name="people" size={34} color="#3478E8" /></View>
      <Heading large>{'Este convite\nexpirou.'}</Heading>
      <Body lead>Peça um novo convite à pessoa responsável pelo debate.</Body>
      <Field label="Tem outro código?" value={code} onChangeText={setCode} placeholder="Cole o código do convite" error={error} autoCapitalize="none" />
      <View style={styles.infoBox}>
        <View style={styles.shield}><SkiaGlyph name="shield" size={38} color="#214D99" /></View>
        <View style={styles.infoCopy}>
          <Text style={styles.bannerTitle}>O convite expira por segurança</Text>
          <Text style={styles.bannerBody}>Isso ajuda a manter o debate organizado e acessível apenas às pessoas autorizadas.</Text>
        </View>
      </View>
      <View style={styles.closingNote}>
        <SkiaGlyph name="people" size={48} color="#3478E8" />
        <Text style={styles.closingText}>Juntos, ideias viram melhores soluções.</Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  peopleMark: { marginBottom: 8 },
  infoBox: { backgroundColor: '#EAF2FF', borderRadius: 18, padding: 16, marginVertical: 14, flexDirection: 'row', gap: 14, alignItems: 'center' },
  shield: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDEBFF' },
  infoCopy: { flex: 1 },
  bannerTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '700', marginBottom: 4 },
  bannerBody: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  closingNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 6, marginBottom: 10 },
  closingText: { flex: 1, maxWidth: 188, color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '700', transform: [{ rotate: '-4deg' }] },
});
