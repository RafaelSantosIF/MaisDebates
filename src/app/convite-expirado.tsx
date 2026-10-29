import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Body, Button, Field, Heading, Page } from '@/shared/ui/Primitives';
import { ConversationArt } from '@/shared/graphics/ConversationArt';
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
  return <Page title="Convite" footer={<Button label="Tentar outro convite  →" onPress={retry} />}>
    <ConversationArt />
    <View style={styles.peopleMark}><Text style={styles.peopleMarkText}>♟</Text></View>
    <Heading>{"Este convite\nexpirou."}</Heading>
    <Body lead>Peça um novo convite à pessoa responsável pelo debate.</Body>
    <Field label="Tem outro código?" value={code} onChangeText={setCode} placeholder="Cole o código do convite" error={error} />
    <Banner tone="blue"><Text style={styles.bannerTitle}>O convite expira por segurança</Text>{"\n"}Isso ajuda a manter o debate organizado e acessível apenas às pessoas autorizadas.</Banner>
  </Page>;
}

const styles = StyleSheet.create({
  peopleMark: { marginBottom: 8 }, peopleMarkText: { color: colors.blue, fontSize: 34 },
  bannerTitle: { color: colors.ink, fontWeight: '700' },
});