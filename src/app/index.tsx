import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { ConversationArt } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';
import { normalizeInviteToken } from '@/features/invitations/token';
import { supabase } from '@/shared/lib/supabase';

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
  if (checking) return <Page title="+Debates"><ConversationArt /><Kicker>Mais contexto. Novas perspectivas.</Kicker><Heading>Um espaço para pensar junto.</Heading><Body>Preparando seu espaço…</Body></Page>;
  if (phase === 'code') return <Page title="Convite" onBack={() => setPhase('onboarding')} footer={<Button label="Continuar  →" onPress={continueWithCode} />}>
    <ConversationArt />
    <View style={styles.peopleMark}><Text style={styles.peopleMarkText}>♙</Text></View>
    <Heading>Entre pelo seu convite.</Heading>
    <Body lead>Cole abaixo o código ou o link recebido da pessoa responsável pelo debate.</Body>
    <Field label="Código do convite" value={code} onChangeText={setCode} placeholder="Cole o código do convite" error={error} />
    <Banner tone="green">O convite expira por segurança. Isso ajuda a manter o debate organizado e acessível apenas às pessoas autorizadas.</Banner>
  </Page>;
  return <Page title="" footer={<Button label="Começar  →" onPress={() => setPhase('code')} />}>
    <View style={styles.brand}><Text style={styles.brandPlus}>+</Text><Text style={styles.brandName}>Debates</Text></View>
    <Text style={styles.brandTag}>Ideias que constroem um futuro melhor</Text>
    <ConversationArt />
    <Heading>Mais contexto.{"\n"}Novas perspectivas.</Heading>
    <Body lead>Um espaço para pensar junto, debater ideias e construir soluções para o que realmente importa.</Body>
    <View style={styles.features}>
      <View style={styles.feature}><View style={[styles.featureIcon, styles.blueIcon]}><Text style={styles.featureEmoji}>♟</Text></View><Text style={styles.featureText}>Converse com outras pessoas</Text></View>
      <View style={styles.feature}><View style={[styles.featureIcon, styles.greenIcon]}><Text style={styles.featureEmoji}>◉</Text></View><Text style={styles.featureText}>Explore diferentes pontos de vista</Text></View>
      <View style={styles.feature}><View style={[styles.featureIcon, styles.yellowIcon]}><Text style={styles.featureEmoji}>▣</Text></View><Text style={styles.featureText}>Participe de debates sobre políticas públicas</Text></View>
    </View>
  </Page>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  brandPlus: { color: colors.blue, fontSize: 42, lineHeight: 48, fontWeight: '800' },
  brandName: { color: colors.ink, fontSize: 40, lineHeight: 48, fontWeight: '800', letterSpacing: -1.5 },
  brandTag: { color: colors.muted, fontSize: 18, lineHeight: 24, marginTop: 2 },
  peopleMark: { marginBottom: 8 }, peopleMarkText: { color: colors.blue, fontSize: 28 },
  features: { flexDirection: 'row', marginTop: 8 },
  feature: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  featureIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  blueIcon: { backgroundColor: '#EAF2FF' }, greenIcon: { backgroundColor: '#E9F7F0' }, yellowIcon: { backgroundColor: '#FFF4D9' },
  featureEmoji: { color: colors.blue, fontSize: 29 },
  featureText: { color: colors.ink, textAlign: 'center', fontSize: 13, lineHeight: 18, fontWeight: '700' },
});
