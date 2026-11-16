import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { supabase } from '@/shared/lib/supabase';
import { colors } from '@/shared/theme/tokens';

export default function SignupScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  async function signUp() {
    if (!supabase) { setError('Configure o Supabase para criar sua conta.'); return; }
    if (name.trim().length < 2 || name.trim().length > 60) {
      setError('Escolha um nome de exibição entre 2 e 60 caracteres.');
      return;
    }
    if (!email.trim()) { setError('Informe seu email.'); return; }
    if (password.length < 6) { setError('Sua senha precisa ter pelo menos 6 caracteres.'); return; }

    setBusy(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (signUpError) {
        const message = signUpError.message.toLowerCase();
        if (message.includes('already registered')) {
          setError('Este email já tem uma conta. Entre com seu email e senha.');
        } else if (message.includes('password')) {
          setError(`Não foi possível usar essa senha: ${signUpError.message}`);
        } else if (message.includes('fetch') || message.includes('network')) {
          setError('Não foi possível conectar ao Supabase. Confira sua conexão de rede.');
        } else {
          setError(`Não foi possível criar sua conta: ${signUpError.message}`);
        }
        return;
      }

      if (data.session) {
        if (typeof token === 'string' && /^[0-9a-f]{64}$/.test(token)) {
          router.replace({ pathname: '/boas-vindas/[token]', params: { token } });
        } else {
          router.replace('/(tabs)/debates');
        }
        return;
      }
      setRegistered(true);
    } catch (cause) {
      setError(cause instanceof Error ? `Não foi possível criar sua conta: ${cause.message}` : 'Não foi possível criar sua conta.');
    } finally {
      setBusy(false);
    }
  }

  function goToLogin() {
    router.replace({ pathname: '/login', params: typeof token === 'string' ? { token } : {} });
  }

  if (registered) {
    return <Page title="Criar conta" footer={<Button label="Ir para login" onPress={goToLogin} large />}>
      <Kicker>Quase lá</Kicker>
      <Heading>Confirme seu email.</Heading>
      <Body lead>Enviamos uma mensagem para {email.trim()}. Confirme seu endereço e entre para acessar sua conta.</Body>
      {error ? <Banner tone="amber">{error}</Banner> : null}
    </Page>;
  }

  return <Page title="Criar conta" footer={<Button label="Criar conta" onPress={() => void signUp()} busy={busy} large />}>
    <Kicker>Minha conta</Kicker>
    <Heading>Crie sua conta.</Heading>
    <Body lead>Você não precisa de convite para se cadastrar. Convites são usados para participar de grupos e debates.</Body>
    <Field label="Nome de exibição" value={name} onChangeText={setName} placeholder="Como quer aparecer?" />
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
    <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Pelo menos 6 caracteres" secureTextEntry autoCapitalize="none" />
    {error ? <Banner tone="amber">{error}</Banner> : null}
    <Pressable accessibilityRole="button" onPress={goToLogin} style={styles.loginLink}>
      <Text style={styles.loginLinkText}>Já tenho conta</Text>
    </Pressable>
  </Page>;
}

const styles = StyleSheet.create({
  loginLink: { alignSelf: 'center', padding: 12 },
  loginLinkText: { color: colors.blue, fontSize: 14, fontWeight: '700' },
});
