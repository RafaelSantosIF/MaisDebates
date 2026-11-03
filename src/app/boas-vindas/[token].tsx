import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { redeemInvite } from '@/features/invitations/api';
import { rules } from '@/features/invitations/rules';
import { Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { SkiaGlyph } from '@/shared/graphics/ConversationArt';
import { colors } from '@/shared/theme/tokens';

export default function WelcomeScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const redeem = useMutation({ mutationFn: () => redeemInvite(token!, name.trim()), onSuccess: async () => { await queryClient.invalidateQueries(); router.replace('/(tabs)/debates'); }, onError: (cause: Error) => setError(cause.message) });
  function submit() {
    if (name.trim().length < 2) { setError('Escolha um nome de exibição com pelo menos 2 caracteres.'); return; }
    if (!accepted) { setError('Leia e aceite os combinados para entrar.'); return; }
    setError(''); redeem.mutate();
  }

  return <Page title="Boas-vindas" footer={<Button label="Entrar no debate" onPress={submit} busy={redeem.isPending} large />}>
    <Kicker>Antes de começar</Kicker>
    <Heading>Ideias diferentes.{'\n'}Respeito em comum.</Heading>
    {rules.map((rule) => <View key={rule.title} style={styles.rule}>
      <View style={styles.ruleIcon}><SkiaGlyph name={rule.title === 'Leia antes de opinar' ? 'comments' : rule.title === 'Explique suas razões' ? 'idea' : 'shield'} size={24} color="#3478E8" /></View>
      <View style={styles.ruleContent}><Text style={styles.ruleTitle}>{rule.title}</Text><Body>{rule.body}</Body></View>
    </View>)}
    <Field label="Como você quer aparecer?" value={name} onChangeText={setName} placeholder="Seu nome de exibição" helper="Use um nome curto. Não precisamos do seu nome completo." />
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={() => setAccepted(!accepted)} style={styles.checkline}>
      <View style={[styles.checkbox, accepted && styles.checked]}>{accepted ? <SkiaGlyph name="check" size={16} color={colors.white} /> : null}</View>
      <Text style={styles.checkText}>Li os combinados. Entendo que minhas contribuições serão vistas pelo grupo convidado.</Text>
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </Page>;
}

const styles = StyleSheet.create({
  rule: { flexDirection: 'row', gap: 12, marginVertical: 10 }, ruleIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, ruleContent: { flex: 1 },
  ruleTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  checkline: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginVertical: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: colors.blue, marginTop: 2, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.blue },
  checkText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 18 }, error: { color: colors.red, fontSize: 12, marginTop: 8 },
});
