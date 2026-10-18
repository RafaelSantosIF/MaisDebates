import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { ConversationArt } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';
import { normalizeInviteToken } from '@/features/invitations/token';
import { supabase } from '@/shared/lib/supabase';

export default function OpeningScreen() {
  const { novo } = useLocalSearchParams<{ novo?: string }>();
  const [checking, setChecking] = useState(!!supabase && novo !== '1');
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
  return <Page title="+Debates" footer={<Button label="Continuar →" onPress={continueWithCode} />}>
    <ConversationArt />
    <Kicker>Mais contexto. Novas perspectivas.</Kicker>
    <Heading>Um espaço para pensar junto.</Heading>
    <Body lead>Leia, compare fontes e converse com respeito em um grupo convidado.</Body>
    <Field label="Código do convite" value={code} onChangeText={setCode} placeholder="Cole o link ou o código recebido" error={error} />
    <Banner>Suas contribuições serão vistas apenas pelo grupo convidado. Você pode ler antes de publicar.</Banner>
    <Text style={styles.existing} onPress={() => router.push('/(tabs)/debates')}>Já participo de um grupo →</Text>
  </Page>;
}

const styles = StyleSheet.create({ existing: { color: colors.blue, fontWeight: '700', fontSize: 13, marginTop: 18, textAlign: 'center' } });
