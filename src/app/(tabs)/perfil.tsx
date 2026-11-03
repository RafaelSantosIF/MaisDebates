import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { renameMember, getMemberProfile } from '@/features/invitations/api';
import { rules } from '@/features/invitations/rules';
import { supabase } from '@/shared/lib/supabase';
import { Button, Field, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';
import { SkiaGlyph } from '@/shared/graphics/ConversationArt';

type Membership = { space_id: string; role: string; spaces: { title: string } | null };

async function getMemberships() {
  if (!supabase) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase.from('space_memberships').select('space_id,role,spaces(title)').eq('user_id', session.user.id).eq('status', 'active').limit(30);
  if (error) throw new Error('Não foi possível carregar seus grupos.');
  return data as unknown as Membership[];
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['member-profile'], queryFn: getMemberProfile });
  const memberships = useQuery({ queryKey: ['memberships'], queryFn: getMemberships });
  const [editedName, setEditedName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const name = editedName ?? profile.data?.display_name ?? '';
  const save = useMutation({
    mutationFn: () => renameMember(name.trim()),
    onSuccess: async () => {
      setError('');
      setEditedName(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['member-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['memberships'] }),
        queryClient.invalidateQueries({ queryKey: ['positions'] }),
        queryClient.invalidateQueries({ queryKey: ['author-name'] }),
      ]);
      Alert.alert('Nome atualizado', 'Ele será usado em todas as suas turmas.');
    },
    onError: (cause: Error) => setError(cause.message),
  });
  const isMediator = memberships.data?.some((item) => item.role === 'mediator') ?? false;

  return <Page title="+Debates">
    <View style={styles.identity}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(name.trim() || 'JO').slice(0, 2).toUpperCase()}</Text></View>
      <View style={styles.identityText}>
        <Text style={styles.displayName}>{name || 'Seu perfil'}</Text>
        <Text style={styles.caption}>{memberships.data?.length ? `${memberships.data.length} ${memberships.data.length === 1 ? 'turma' : 'turmas'} · perfil compartilhado` : 'Seu perfil no +Debates'}</Text>
      </View>
    </View>
    {profile.isPending ? <Text style={styles.helper}>Carregando perfil…</Text> : null}
    {profile.isError ? <Text accessibilityRole="alert" style={styles.error}>{profile.error.message}</Text> : null}
    <Field label="Nome de exibição" value={name} onChangeText={setEditedName} placeholder="Como quer aparecer?" error={error} />
    <Button label="Salvar nome" onPress={() => save.mutate()} busy={save.isPending} secondary />

    <Text style={styles.section}>Seu espaço, com clareza</Text>
    <View style={styles.privacy}><SkiaGlyph name="shield" size={22} color={colors.blue} /><Text style={styles.privacyText}>Suas contribuições são visíveis às pessoas convidadas para cada debate.</Text></View>
    <View style={styles.links}>
      <ProfileLink icon="lock" label="Privacidade" onPress={() => Alert.alert('Privacidade', 'Seu nome e suas contribuições ficam disponíveis aos membros das turmas em que você participa.')} />
      <ProfileLink icon="book" label="Combinados da conversa" onPress={() => Alert.alert('Combinados da conversa', rules.map((rule) => `${rule.title}: ${rule.body}`).join('\n\n'))} />
      <ProfileLink icon="shield" label="Área de mediação" onPress={() => router.push(isMediator ? '/mediacao' : '/mediacao/entrar')} />
      <ProfileLink icon="help" label="Ajuda" onPress={() => Alert.alert('Precisa de ajuda?', 'Procure a mediação responsável pela sua turma.')} last />
    </View>
  </Page>;
}

function ProfileLink({ icon, label, onPress, last = false }: { icon: 'lock' | 'book' | 'shield' | 'help'; label: string; onPress: () => void; last?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.link, last && styles.lastLink]}>
    <Text style={styles.linkLabel}>{label}</Text><SkiaGlyph name={icon} size={18} color="#526174" />
  </Pressable>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5ECFC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.blue, fontSize: 14, fontWeight: '700' },
  identityText: { flex: 1 }, displayName: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  caption: { color: colors.muted, fontSize: 11, marginTop: 3 }, helper: { color: colors.muted, fontSize: 12 },
  error: { color: colors.red, fontSize: 12 }, section: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 28, marginBottom: 10 },
  privacy: { backgroundColor: colors.pale, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, flex: 1 },
  links: { marginTop: 10, backgroundColor: colors.white },
  link: { minHeight: 43, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5EAF1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastLink: { borderBottomWidth: 0 }, linkLabel: { color: colors.muted, fontSize: 12 },
});
