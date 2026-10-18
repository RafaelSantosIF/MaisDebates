import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { loadDebateDraft, storeDebateDraft, type DebateDraft } from '@/features/mediation/draft';
import { type SourceDraft } from '@/features/mediation/api';
import { Banner, Body, Button, Card, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

const emptySource: SourceDraft = { title: '', publisher: '', url: '', whyRead: '' };
export default function CreateContextScreen() {
  const [draft, setDraft] = useState<DebateDraft | null>(null);
  const [source, setSource] = useState(emptySource);
  const [term, setTerm] = useState(''); const [definition, setDefinition] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { void loadDebateDraft().then(setDraft); }, []);
  useEffect(() => { if (!draft) return; const timer = setTimeout(() => { void storeDebateDraft(draft); }, 300); return () => clearTimeout(timer); }, [draft]);
  function addSource() {
    if (!draft) return;
    if (!source.title.trim() || !source.publisher.trim() || !/^https:\/\/\S+$/.test(source.url) || !source.whyRead.trim()) { setError('Informe título, origem, URL HTTPS e motivo para ler.'); return; }
    setDraft({ ...draft, sources: [...draft.sources, source] }); setSource(emptySource); setError('');
  }
  function addTerm() {
    if (!draft || !term.trim() || !definition.trim()) { setError('Informe o termo e sua definição.'); return; }
    setDraft({ ...draft, terms: [...draft.terms, { term: term.trim(), definition: definition.trim() }] }); setTerm(''); setDefinition(''); setError('');
  }
  async function next() {
    if (!draft) return;
    if (!draft.context.trim()) { setError('Adicione o contexto do tema.'); return; }
    if (!draft.sources.length) { setError('Adicione ao menos uma fonte identificada.'); return; }
    await storeDebateDraft(draft); router.push('/mediacao/criar/previa');
  }
  return <Page title="Criar debate" footer={<Button label="Ver prévia →" onPress={() => void next()} />}>
    <Kicker>2 de 3 · Contexto</Kicker><Heading>Dê um bom ponto{"\n"}de partida.</Heading>
    <Field label="Panorama do tema" value={draft?.context || ''} onChangeText={(value) => setDraft((old) => old && ({ ...old, context: value }))} multiline />
    <Text style={styles.section}>Fontes para comparar</Text>
    {draft?.sources.map((item, index) => <Card key={`${item.url}-${index}`}><Text style={styles.title}>{item.title}</Text><Body>{item.publisher} · {item.whyRead}</Body></Card>)}
    <Field label="Título da fonte" value={source.title} onChangeText={(value) => setSource({ ...source, title: value })} />
    <Field label="Origem ou publicação" value={source.publisher} onChangeText={(value) => setSource({ ...source, publisher: value })} />
    <Field label="URL HTTPS" value={source.url} onChangeText={(value) => setSource({ ...source, url: value })} placeholder="https://" keyboardType="url" autoCapitalize="none" />
    <Field label="Por que ler?" value={source.whyRead} onChangeText={(value) => setSource({ ...source, whyRead: value })} />
    <Button label="＋ Adicionar fonte" onPress={addSource} secondary />
    <Text style={styles.section}>Termos do debate (opcional)</Text>
    {draft?.terms.map((item, index) => <Card key={`${item.term}-${index}`}><Text style={styles.title}>{item.term}</Text><Body>{item.definition}</Body></Card>)}
    <Field label="Termo" value={term} onChangeText={setTerm} />
    <Field label="Definição" value={definition} onChangeText={setDefinition} multiline />
    <Button label="＋ Adicionar termo" onPress={addTerm} secondary />
    {error ? <Banner tone="amber">{error}</Banner> : null}
  </Page>;
}
const styles = StyleSheet.create({ section: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 24 }, title: { color: colors.ink, fontSize: 14, fontWeight: '700' } });
