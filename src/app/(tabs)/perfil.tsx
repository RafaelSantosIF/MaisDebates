import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Text } from 'react-native';
import { supabase } from '@/shared/lib/supabase';
import { renameMember } from '@/features/invitations/api';
import { rules } from '@/features/invitations/rules';
import { Banner, Body, Button, Card, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';

type Membership = { space_id: string; display_name: string; role: string; spaces: { title: string } | null };

async function getMemberships() {
  if (!supabase) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase.from('space_memberships').select('space_id,display_name,role,spaces(title)').eq('user_id', session.user.id).limit(30);
  if (error) throw new Error('Não foi possível carregar o perfil.');
  return data as unknown as Membership[];
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const memberships = useQuery({ queryKey: ['memberships'], queryFn: getMemberships });
  async function leave() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) { Alert.alert('Não foi possível sair', 'Tente novamente.'); return; }
    queryClient.clear();
    router.replace('/');
  }
  return <Page title="Perfil e privacidade">
    <Kicker>Seu espaço</Kicker><Heading>Seu perfil no grupo.</Heading>
    {memberships.isPending ? <Body>Carregando perfil…</Body> : null}
    {memberships.isError ? <Banner tone="amber">{memberships.error.message}</Banner> : null}
    {memberships.data?.map((m) => <MembershipCard key={m.space_id} membership={m} />)}
    {memberships.data?.some((m) => m.role === 'mediator') ? <Button label="Abrir mediação" onPress={() => router.push('/mediacao')} secondary /> : <Button label="Entrar como mediador" onPress={() => router.push('/mediacao/entrar')} secondary />}
    <Banner>Seu nome de exibição é separado da conta técnica. O conteúdo é restrito aos membros do grupo.</Banner>
    <Card><Kicker>Combinados da conversa</Kicker>{rules.map((rule) => <Body key={rule.title}>{rule.title}: {rule.body}</Body>)}</Card>
    <Body>Se você usa uma sessão anônima, desinstalar o app ou perder este dispositivo pode impedir o acesso às suas contribuições.</Body>
    <Body>Precisa de ajuda com um convite ou uma contribuição? Procure a mediação responsável pelo seu grupo.</Body>
    <Button label="Entrar com outro convite" onPress={() => router.push({ pathname: '/', params: { novo: '1' } })} secondary />
    <Button label="Sair desta conta" onPress={() => Alert.alert('Sair da conta?', 'Se sua sessão é anônima, você pode perder o acesso às contribuições antigas neste dispositivo.', [{ text: 'Cancelar' }, { text: 'Sair', onPress: () => void leave() }])} secondary />
  </Page>;
}

function MembershipCard({ membership }: { membership: Membership }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(membership.display_name);
  const [error, setError] = useState('');
  const save = useMutation({ mutationFn: () => renameMember(membership.space_id, name.trim()), onSuccess: async () => {
    setEditing(false); setError('');
    await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
  }, onError: (cause: Error) => setError(cause.message) });
  return <Card>
    <Text style={{ fontSize: 18, fontWeight: '700' }}>{membership.display_name}</Text>
    <Body>{membership.role === 'mediator' ? 'Mediação' : 'Participante'} · {membership.spaces?.title}</Body>
    {editing ? <><Field label="Nome de exibição neste grupo" value={name} onChangeText={setName} error={error} /><Button label="Salvar nome" onPress={() => save.mutate()} busy={save.isPending} /></> : <Button label="Editar nome de exibição" onPress={() => setEditing(true)} secondary />}
  </Card>;
}
