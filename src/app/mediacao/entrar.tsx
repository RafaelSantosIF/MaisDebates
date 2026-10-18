import { useState } from 'react';
import { router } from 'expo-router';
import { Banner, Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { supabase } from '@/shared/lib/supabase';

export default function MediatorSignInScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function signIn() {
    if (!supabase) { setError('Configure o Supabase para entrar.'); return; }
    setBusy(true); setError('');
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { setError('Não foi possível entrar. Confira suas credenciais.'); return; }
    router.replace('/mediacao');
  }
  return <Page title="Acesso de mediação" footer={<Button label="Entrar na mediação" onPress={() => void signIn()} busy={busy} />}>
    <Kicker>Mediação</Kicker><Heading>Cuide da conversa.</Heading>
    <Body>Entre com a conta de mediação vinculada ao grupo.</Body>
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
    <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry autoCapitalize="none" />
    {error ? <Banner tone="amber">{error}</Banner> : null}
  </Page>;
}
