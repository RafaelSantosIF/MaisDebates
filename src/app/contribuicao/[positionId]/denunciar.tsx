import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createReport, type ReportReason } from '@/features/contributions/dialogue';
import { Body, Button, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'personal_attack', label: 'Ataque pessoal' }, { value: 'discrimination', label: 'Discriminação' },
  { value: 'personal_info', label: 'Informação pessoal' }, { value: 'spam_other', label: 'Spam ou outro motivo' },
];

export default function ReportScreen() {
  const { positionId, replyId } = useLocalSearchParams<{ positionId: string; replyId?: string }>();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const report = useMutation({ mutationFn: () => createReport(replyId ? 'reply' : 'position', replyId || positionId!, reason!, details), onSuccess: () => router.replace('/denuncia-recebida'), onError: (cause: Error) => setError(cause.message) });
  function submit() { if (!reason) { setError('Escolha um motivo.'); return; } setError(''); report.mutate(); }
  return <Page title="Denunciar" footer={<Button label="Enviar denúncia" onPress={submit} busy={report.isPending} />}>
    <Kicker>Cuidado com o espaço</Kicker><Heading>O que precisa{"\n"}de atenção?</Heading>
    <Body>Uma pessoa responsável revisará sua denúncia junto com o contexto da conversa.</Body>
    {reasons.map((item) => <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ checked: reason === item.value }} onPress={() => setReason(item.value)} style={styles.row}><View style={[styles.circle, reason === item.value && styles.selected]} /><Text style={styles.label}>{item.label}</Text></Pressable>)}
    <Field label="Quer acrescentar algum detalhe? (opcional)" value={details} onChangeText={setDetails} placeholder="Explique o que chamou sua atenção." multiline error={error} />
    <Body>Sua identidade não será exibida à pessoa autora da contribuição.</Body>
  </Page>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 11, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5EAF1' }, circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.blue }, selected: { backgroundColor: colors.blue, borderWidth: 4, borderColor: colors.pale }, label: { color: colors.ink, fontSize: 13 } });
