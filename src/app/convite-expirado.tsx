import { useState } from 'react';
import { router } from 'expo-router';
import { Body, Button, Field, Heading, Page } from '@/shared/ui/Primitives';
import { normalizeInviteToken } from '@/features/invitations/token';

export default function ExpiredInviteScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  function retry() {
    const token = normalizeInviteToken(code);
    if (!token) { setError('Insira um código de convite válido.'); return; }
    router.replace({ pathname: '/convite/[token]', params: { token } });
  }
  return <Page title="Convite" footer={<Button label="Tentar outro convite" onPress={retry} />}>
    <Heading>Este convite não está disponível.</Heading>
    <Body lead>Peça um novo convite à pessoa responsável pelo debate.</Body>
    <Field label="Tem outro código?" value={code} onChangeText={setCode} placeholder="Cole o código do convite" error={error} />
  </Page>;
}
