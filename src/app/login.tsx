import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { supabase } from '@/shared/lib/supabase';

export default function LoginScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn() {
    if (!supabase) { setError('Configure o Supabase para entrar.'); return; }
    if (!email.trim() || !password) { setError('Informe seu email e sua senha.'); return; }

    setBusy(true);
    setError('');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { setError('Não foi possível entrar. Confira suas credenciais.'); return; }

    if (typeof token === 'string' && /^[0-9a-f]{64}$/.test(token)) {
      router.replace({ pathname: '/boas-vindas/[token]', params: { token } });
      return;
    }
    router.replace('/(tabs)/debates');
  }

  return <Page title="Login" footer={<Button label="Entrar" onPress={() => void signIn()} busy={busy} large />}>
    <Kicker>Minha conta</Kicker>
    <Heading>Bem-vindo de volta.</Heading>
    <Body lead>Entre com seu email e senha para continuar.</Body>
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
    <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry autoCapitalize="none" />
    {error ? <Banner tone="amber">{error}</Banner> : null}
  </Page>;
}
