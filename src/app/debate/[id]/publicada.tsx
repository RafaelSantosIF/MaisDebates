import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { getMyPosition, stances } from '@/features/contributions/position';
import { Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function PublishedPositionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const position = useQuery({ queryKey: ['my-position', id], queryFn: () => getMyPosition(id!), enabled: !!id });
  return <Page title="Minha contribuição" footer={<Button label="Ver a conversa →" onPress={() => router.replace({ pathname: '/debate/[id]', params: { id: id! } })} />}>
    <View style={styles.icon}><Text style={styles.check}>✓</Text></View>
    <Kicker>Contribuição enviada</Kicker><Heading>Sua posição já faz{"\n"}parte da conversa.</Heading>
    <Body lead>Agora, conheça outras razões e continue pensando junto.</Body>
    {position.data ? <Card><Text style={styles.stance}>{stances.find((s) => s.value === position.data?.stance)?.label}</Text><Text style={styles.rationale}>{position.data.rationale}</Text></Card> : null}
    <Body>Você pode revisá-la enquanto o debate estiver aberto.</Body>
  </Page>;
}

const styles = StyleSheet.create({ icon: { width: 70, height: 70, backgroundColor: '#E5F2EC', borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginTop: 54, marginBottom: 24 }, check: { color: colors.green, fontSize: 31 }, stance: { alignSelf: 'flex-start', backgroundColor: '#EAE7F7', padding: 6, borderRadius: 5, color: colors.ink, fontSize: 10 }, rationale: { color: colors.ink, fontSize: 14, lineHeight: 22, marginTop: 14 } });
