import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
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
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) {
        const message = result.error.message.toLowerCase();
        if (message.includes('email not confirmed')) {
          setError('Confirme o email da conta no Supabase Auth antes de entrar.');
        } else if (message.includes('invalid login credentials')) {
          setError('Email ou senha incorretos. Confira também se a conta pertence a este projeto Supabase.');
        } else if (message.includes('invalid api key')) {
          setError('A chave pública do Supabase está inválida. Confira a configuração do aplicativo.');
        } else if (message.includes('fetch') || message.includes('network')) {
          setError('Não foi possível conectar ao Supabase. Confira a URL do projeto e sua conexão de rede.');
        } else {
          setError(`Não foi possível entrar: ${result.error.message}`);
        }
        return;
      }

      if (typeof token === 'string' && /^[0-9a-f]{64}$/.test(token)) {
        router.replace({ pathname: '/boas-vindas/[token]', params: { token } });
        return;
      }
      router.replace('/(tabs)/debates');
    } finally {
      setBusy(false);
    }
  }

  return <Page title="Login" footer={<Button label="Entrar" onPress={() => void signIn()} busy={busy} large />}>
    <Kicker>Minha conta</Kicker>
    <Heading>Bem-vindo de volta.</Heading>
    <Body lead>Entre com seu email e senha para continuar.</Body>
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
    <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry autoCapitalize="none" />
    {error ? <Banner tone="amber">{error}</Banner> : null}
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/cadastro', params: typeof token === 'string' ? { token } : {} })}
      style={styles.createAccount}
    >
      <Text style={styles.createAccountText}>Criar conta</Text>
    </Pressable>
  </Page>;
}

const styles = StyleSheet.create({
  createAccount: { alignSelf: 'center', padding: 12 },
  createAccountText: { color: '#1764D8', fontSize: 14, fontWeight: '700' },
});
