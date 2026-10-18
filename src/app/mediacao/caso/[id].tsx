import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { getPosition, getReplies, resolveReport, restoreReport } from '@/features/contributions/dialogue';
import { getReport, type Report } from '@/features/mediation/api';
import { supabase } from '@/shared/lib/supabase';
import { Banner, Body, Button, Card, Field, Heading, Kicker, Page } from '@/shared/ui/Primitives';

async function getTarget(report: Report) {
  const spaceId = report.debates?.space_id;
  if (!spaceId) throw new Error('Grupo do caso indisponível.');
  if (report.target_type === 'position') {
    const [position, replies] = await Promise.all([getPosition(report.target_id), getReplies(report.target_id, spaceId)]);
    return { text: position.rationale, parent: null as string | null, replies: replies.items };
  }
  if (!supabase) throw new Error('Configure o Supabase.');
  const { data, error } = await supabase.from('replies').select('body,position_id').eq('id', report.target_id).single();
  if (error || !data) throw new Error('Conteúdo indisponível.');
  const [position, replies] = await Promise.all([getPosition(data.position_id), getReplies(data.position_id, spaceId)]);
  return { text: data.body as string, parent: position.rationale, replies: replies.items };
}

export default function ReviewCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const report = useQuery({ queryKey: ['report', id], queryFn: () => getReport(id!), enabled: !!id });
  const target = useQuery({ queryKey: ['report-target', id], queryFn: () => getTarget(report.data!), enabled: !!report.data });
  const decision = useQuery({ queryKey: ['report-decision', id], queryFn: async () => {
    if (!supabase) throw new Error('Configure o Supabase.');
    const { data, error } = await supabase.from('moderation_actions').select('decision,reason,created_at').eq('report_id', id!).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error('Não foi possível carregar a decisão.');
    return data;
  }, enabled: report.data?.status !== 'pending' && !!report.data });
  const [reason, setReason] = useState(''); const [error, setError] = useState('');
  const resolve = useMutation({ mutationFn: (choice: 'keep' | 'hide') => resolveReport(id!, choice, reason, report.data!.version), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['pending-reports'] }); await queryClient.invalidateQueries({ queryKey: ['resolved-reports'] }); router.replace('/mediacao/fila'); }, onError: (cause: Error) => setError(cause.message) });
  const restore = useMutation({ mutationFn: () => restoreReport(id!, reason, report.data!.version), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['resolved-reports'] }); await queryClient.invalidateQueries({ queryKey: ['positions', report.data?.debate_id] }); router.replace('/mediacao/fila'); }, onError: (cause: Error) => setError(cause.message) });
  function decide(choice: 'keep' | 'hide') { if (!reason.trim()) { setError('Explique o motivo da decisão.'); return; } setError(''); Alert.alert('Confirmar decisão?', choice === 'hide' ? 'A contribuição ficará oculta para o grupo e o autor verá a justificativa.' : 'A contribuição continuará visível ao grupo.', [{ text: 'Cancelar' }, { text: 'Confirmar', onPress: () => resolve.mutate(choice) }]); }
  function confirmRestore() { if (!reason.trim()) { setError('Explique o motivo da restauração.'); return; } setError(''); Alert.alert('Restaurar contribuição?', 'O conteúdo voltará a ficar visível no grupo. A decisão anterior continuará registrada.', [{ text: 'Cancelar' }, { text: 'Restaurar', onPress: () => restore.mutate() }]); }
  return <Page title="Analisar denúncia" footer={report.data?.status === 'pending' ? <><Button label="Ocultar com justificativa" onPress={() => decide('hide')} busy={resolve.isPending} /><Button label="Manter contribuição" onPress={() => decide('keep')} busy={resolve.isPending} secondary /></> : report.data?.status === 'hidden' ? <Button label="Restaurar contribuição" onPress={confirmRestore} busy={restore.isPending} /> : undefined}>
    <Kicker>Caso em revisão</Kicker><Heading>Analise a contribuição{"\n"}e a conversa.</Heading>
    {report.isPending ? <Body>Carregando caso…</Body> : null}
    {report.isError ? <Banner tone="amber">{report.error.message}</Banner> : null}
    {report.data ? <><Card><Body>Conteúdo sinalizado</Body><Body lead>“{target.data?.text || (target.isPending ? 'Carregando…' : 'Indisponível')}”</Body><Body>Motivo: {report.data.reason}</Body>{report.data.details ? <Body>Observação recebida: {report.data.details}</Body> : null}</Card><Banner>Contexto: {report.data.debates?.question}</Banner>{target.data?.parent ? <Card><Kicker>Contribuição original</Kicker><Body>{target.data.parent}</Body></Card> : null}{target.data?.replies.length ? <><Kicker>Respostas da conversa</Kicker>{target.data.replies.map((reply) => <Card key={reply.id}><Body>{reply.displayName} · {reply.kind === 'question' ? 'Dúvida' : 'Resposta'}</Body><Body>{reply.body}</Body></Card>)}</> : null}<Body>Questione ideias com respeito. Evite desqualificar quem participa.</Body></> : null}
    {decision.data ? <Banner tone="green">Decisão registrada: {decision.data.decision === 'hide' ? 'Ocultar' : decision.data.decision === 'restore' ? 'Restaurar' : 'Manter'}. Motivo: {decision.data.reason}</Banner> : null}
    {report.data?.status === 'pending' || report.data?.status === 'hidden' ? <Field label={report.data?.status === 'hidden' ? 'Motivo para restaurar' : 'Justificativa da decisão'} value={reason} onChangeText={setReason} placeholder="Explique a regra e o motivo da decisão." multiline helper="A decisão será registrada para auditoria. Ao ocultar, o autor verá a explicação." error={error} /> : null}
  </Page>;
}
