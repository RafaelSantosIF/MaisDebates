import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Field, Heading, Page } from '@/shared/ui/Primitives';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { ConversationArt, SkiaGlyph } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';
import { normalizeInviteToken } from '@/features/invitations/token';
import { supabase } from '@/shared/lib/supabase';

const featureItems = [
  { icon: 'people', label: 'Converse\ncom outras\npessoas', color: '#3478E8', background: '#E7F0FF' },
  { icon: 'idea', label: 'Explore\ndiferentes\npontos de vista', color: '#168565', background: '#E2F7EF' },
  { icon: 'civic', label: 'Participe de\ndebates sobre\npolíticas públicas', color: '#D99A00', background: '#FFF2D0' },
] as const;

export default function OpeningScreen() {
  const { novo } = useLocalSearchParams<{ novo?: string }>();
  const [checking, setChecking] = useState(!!supabase && novo !== '1');
  const [phase, setPhase] = useState<'onboarding' | 'code'>('onboarding');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!checking || !supabase) return;
    let active = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('space_memberships').select('space_id').eq('user_id', session.user.id).eq('status', 'active').limit(1);
        if (active && data?.length) { router.replace('/(tabs)/debates'); return; }
      }
      if (active) setChecking(false);
    })().catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [checking]);

  function continueWithCode() {
    const token = normalizeInviteToken(code);
    if (!token) { setError('Cole um código de convite válido.'); return; }
    setError('');
    router.push({ pathname: '/convite/[token]', params: { token } });
  }

  if (checking) return <Page title="+Debates"><ConversationArt /><Heading>Um espaço para pensar junto.</Heading><Body>Preparando seu espaço…</Body></Page>;

  if (phase === 'code') return (
    <Page title="Convite" onBack={() => setPhase('onboarding')} footer={<View style={styles.footerActions}>
      <Button label="Continuar" onPress={continueWithCode} large />
      <Button label="Já tenho conta" onPress={() => router.push('/login')} secondary />
    </View>}>
      <ConversationArt variant="invite" />
      <View style={styles.sectionMark}><SkiaGlyph name="people" size={28} color="#3478E8" /></View>
      <Heading>Entre pelo seu convite.</Heading>
      <Body lead>Cole abaixo o código ou o link recebido da pessoa responsável pelo debate.</Body>
      <Field label="Código do convite" value={code} onChangeText={setCode} placeholder="Cole o código do convite" error={error} autoCapitalize="none" />
      <View style={styles.privacyBox}>
        <View style={styles.privacyGlyph}><SkiaGlyph name="shield" size={38} color="#214D99" /></View>
        <View style={styles.privacyCopy}><Text style={styles.privacyTitle}>O convite expira por segurança</Text><Text style={styles.privacyText}>Isso ajuda a manter o debate organizado e acessível apenas às pessoas autorizadas.</Text></View>
      </View>
    </Page>
  );

  return (
    <Page title="" footer={<Button label="Começar" onPress={() => setPhase('code')} large />}>
      <View style={styles.brandRow}>
        <View style={styles.brandCopy}><BrandLogo width={200} /><Text style={styles.brandTag}>Ideias que constroem um futuro melhor</Text></View>
      </View>
      <ConversationArt />
      <Heading large>Mais contexto.{'\n'}Novas perspectivas.</Heading>
      <Body lead>Um espaço para pensar junto, debater ideias e construir soluções para o que realmente importa.</Body>
      <View style={styles.features}>
        {featureItems.map((item, index) => <View key={item.icon} style={[styles.feature, index > 0 && styles.featureDivider]}>
          <View style={[styles.featureIcon, { backgroundColor: item.background }]}><SkiaGlyph name={item.icon} size={42} color={item.color} /></View>
          <Text style={styles.featureText}>{item.label}</Text>
        </View>)}
      </View>
      <View style={styles.pagination}><SkiaGlyph name="dot" size={11} color={colors.blue} /><SkiaGlyph name="dot" size={11} color="#D5E2F7" /><SkiaGlyph name="dot" size={11} color="#D5E2F7" /></View>
    </Page>
  );
}

const styles = StyleSheet.create({
  footerActions: { gap: 8 },
  brandRow: { alignItems: 'flex-start', marginTop: 4, minHeight: 76 },
  brandCopy: { flex: 1, maxWidth: '100%' },
  brandTag: { color: colors.muted, fontSize: 16, lineHeight: 22, marginTop: 3, marginLeft: 2 },
  features: { flexDirection: 'row', marginTop: 18, marginBottom: 8 },
  feature: { flex: 1, alignItems: 'center', paddingHorizontal: 7 },
  featureDivider: { borderLeftWidth: 1, borderColor: '#D7E3F8' },
  featureIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  featureText: { color: '#17396F', textAlign: 'center', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 4 },
  sectionMark: { marginBottom: 8 },
  privacyBox: { backgroundColor: '#EAF2FF', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 10 },
  privacyGlyph: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDEBFF' },
  privacyCopy: { flex: 1 }, privacyTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '700', marginBottom: 4 }, privacyText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
});
