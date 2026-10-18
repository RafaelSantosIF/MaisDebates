import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Linking, Text } from 'react-native';
import { getSources, getTerms } from '@/features/debates/api';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function SourcesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sources = useQuery({ queryKey: ['sources', id], queryFn: () => getSources(id!), enabled: !!id });
  const terms = useQuery({ queryKey: ['terms', id], queryFn: () => getTerms(id!), enabled: !!id });
  return <Page title="Fontes e termos" footer={<Button label="Voltar ao contexto" onPress={() => router.back()} secondary />}>
    <Kicker>Leia e compare</Kicker><Heading>Boas ideias precisam{"\n"}de contexto.</Heading>
    <Body>Materiais selecionados pela mediação para apoiar a conversa.</Body>
    {sources.isPending || terms.isPending ? <Body>Carregando materiais…</Body> : null}
    {sources.isError || terms.isError ? <Banner tone="amber">Não foi possível carregar os materiais. Tente novamente.</Banner> : null}
    {sources.data?.map((source) => <Card key={source.id}>
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{source.title}</Text>
      <Body>{source.publisher} · {source.why_read}</Body>
      <Text accessibilityRole="link" onPress={() => void Linking.openURL(source.url)} style={{ color: colors.blue, fontSize: 12, fontWeight: '700' }}>Abrir fonte externa ↗</Text>
    </Card>)}
    <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 20 }}>Termos do debate</Text>
    {terms.data?.map((term) => <Card key={term.id}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{term.term}</Text><Body>{term.definition}</Body></Card>)}
  </Page>;
}
