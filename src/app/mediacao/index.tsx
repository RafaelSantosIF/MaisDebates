import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { closeDebate, getMediatedDebates, getMediatorSpaces, getPendingReports, issueInvite } from '@/features/mediation/api';
import { type Debate } from '@/features/debates/api';
import { getDebate, getSources, getTerms } from '@/features/debates/api';
import { storeDebateDraft } from '@/features/mediation/draft';
import { deadlineCalendarDate } from '@/features/mediation/date';
import { freshKey } from '@/features/contributions/position';
import { Banner, Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';
import { colors } from '@/shared/theme/tokens';

export default function MediationScreen() {
  const spaces = useQuery({ queryKey: ['mediator-spaces'], queryFn: getMediatorSpaces });
  const spaceIds = spaces.data?.map((item) => item.space_id) || [];
  const debates = useQuery({ queryKey: ['mediator-debates', spaceIds], queryFn: () => getMediatedDebates(spaceIds), enabled: !!spaces.data });
  const reports = useQuery({ queryKey: ['pending-reports'], queryFn: getPendingReports, enabled: !!spaces.data?.length });
  return <Page title="Mediação">
    <Kicker>{spaces.data?.[0]?.display_name ? `Mediação · ${spaces.data[0].display_name}` : 'Mediação'}</Kicker><Heading>Prepare o contexto.{"\n"}Cuide da conversa.</Heading>
    <Body>Acompanhe seus debates e apoie o diálogo.</Body>
    {spaces.isPending ? <Body>Conferindo acesso de mediação…</Body> : null}
    {spaces.isError ? <Banner tone="amber">{spaces.error.message}</Banner> : null}
    {spaces.data?.length === 0 ? <Card><Body>Esta conta não tem acesso de mediação a um grupo.</Body><Button label="Entrar com outra conta" onPress={() => router.push('/mediacao/entrar')} secondary /></Card> : null}
    {!!spaces.data?.length ? <>
      <View style={styles.stats}><View style={styles.statCard}><Text style={styles.number}>{debates.data?.filter((d) => d.status === 'open').length || 0}</Text><Text style={styles.statLabel}>Debates ativos</Text></View><View style={styles.statCard}><Text style={styles.number}>{reports.data?.length || 0}</Text><Text style={styles.statLabel}>Revisões pendentes</Text></View></View>
      <Button label="＋ Criar debate" onPress={() => router.push('/mediacao/criar/pergunta')} />
      {spaces.data.map((space) => <InviteButton key={space.space_id} spaceId={space.space_id} spaceName={space.spaces?.title || 'grupo'} />)}
      <Text style={styles.section}>Precisa de atenção</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/mediacao/fila')}><Card><Text style={styles.cardTitle}>{reports.data?.length ? `${reports.data.length} contribuição sinalizada` : 'Nenhuma denúncia pendente'}</Text><Body>Analise o contexto e registre uma decisão.</Body></Card></Pressable>
      <Text style={styles.section}>Meus debates</Text>
      {debates.isPending ? <Body>Carregando debates…</Body> : null}
      {debates.isError ? <Banner tone="amber">{debates.error.message}</Banner> : null}
      {debates.data?.map((debate) => <MediatedDebateCard key={debate.id} debate={debate} />)}
    </> : null}
  </Page>;
}

function MediatedDebateCard({ debate }: { debate: Debate }) {
  const queryClient = useQueryClient();
  const resume = useMutation({ mutationFn: async () => {
    const [current, sources, terms] = await Promise.all([getDebate(debate.id), getSources(debate.id), getTerms(debate.id)]);
    if (current.status !== 'draft') throw new Error('Este debate já foi aberto.');
    await storeDebateDraft({ spaceId: current.space_id, question: current.question, context: current.context, closesAt: deadlineCalendarDate(current.closes_at), sources: sources.map((item) => ({ title: item.title, publisher: item.publisher, url: item.url, whyRead: item.why_read })), terms: terms.map((item) => ({ term: item.term, definition: item.definition })), key: freshKey(), createdId: current.id, version: current.version });
  }, onSuccess: () => router.push('/mediacao/criar/pergunta'), onError: (cause: Error) => Alert.alert('Não foi possível retomar', cause.message) });
  const close = useMutation({ mutationFn: () => closeDebate(debate.id, debate.version!), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['mediator-debates'] }); await queryClient.invalidateQueries({ queryKey: ['debate', debate.id] }); Alert.alert('Debate encerrado', 'A leitura continua disponível. Novas posições e respostas foram bloqueadas.'); }, onError: (error: Error) => Alert.alert('Não foi possível encerrar', error.message) });
  return <Card>
    <Text style={styles.cardTitle}>{debate.question || 'Rascunho sem pergunta'}</Text>
    <Body>{debate.spaces?.title} · {debate.status === 'draft' ? 'Rascunho' : debate.status === 'closed' ? 'Encerrado' : 'Em andamento'}</Body>
    {debate.status !== 'draft' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/debate/[id]', params: { id: debate.id } })}><Text style={styles.link}>Ver conversa →</Text></Pressable> : null}
    {debate.status === 'draft' ? <Pressable accessibilityRole="button" onPress={() => resume.mutate()}><Text style={styles.link}>{resume.isPending ? 'Abrindo rascunho…' : 'Editar rascunho →'}</Text></Pressable> : null}
    {debate.status === 'open' ? <><InviteButton spaceId={debate.space_id} debateId={debate.id} spaceName={debate.spaces?.title || 'grupo'} compact /><Pressable accessibilityRole="button" onPress={() => Alert.alert('Encerrar debate?', 'Novas posições e respostas serão bloqueadas.', [{ text: 'Cancelar' }, { text: 'Encerrar', onPress: () => close.mutate() }])}><Text style={styles.link}>Encerrar debate →</Text></Pressable></> : null}
    {debate.status === 'closed' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/mediacao/debate/[id]/sintese', params: { id: debate.id } })}><Text style={styles.link}>Preparar síntese →</Text></Pressable> : null}
  </Card>;
}

function InviteButton({ spaceId, debateId = null, spaceName, compact = false }: { spaceId: string; debateId?: string | null; spaceName: string; compact?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [inviteMode, setInviteMode] = useState<'single' | 'open' | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const issue = useMutation({
    mutationFn: ({ open, days }: { open: boolean; days: number }) => issueInvite(spaceId, debateId, new Date(Date.now() + days * 86400000).toISOString(), open),
    onSuccess: (result) => { setToken(result.token); setError(''); },
    onError: (cause: Error) => setError(cause.message),
  });
  const inviteLink = token ? `maisdebates://convite/${token}` : '';
  async function shareInvite() {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      return;
    }
    await Share.share({ message: `Convite para ${spaceName} no +Debates: ${inviteLink}` });
  }
  function dismiss() {
    setVisible(false);
    setInviteMode(null);
    setToken(null);
    setError('');
    setCopied(false);
  }
  return <>
    <Pressable accessibilityRole="button" disabled={issue.isPending} style={[!compact && styles.inviteAction, issue.isPending && { opacity: 0.6 }]} onPress={() => { setVisible(true); setError(''); }}>
      <Text style={[styles.link, compact && styles.inviteLink]}>{issue.isPending ? 'Criando código…' : compact ? 'Criar código de convite →' : `＋ Criar convite · ${spaceName}`}</Text>
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{token ? 'Código criado' : 'Criar código de convite'}</Text>
          <Text style={styles.modalDescription}>{token ? `Convite para ${spaceName}. Compartilhe este link com as pessoas convidadas.` : 'Escolha quem poderá entrar e por quanto tempo o convite ficará válido.'}</Text>
          {!token ? <>
            <Text style={styles.modalLabel}>USO DO CONVITE</Text>
            <View style={styles.choiceRow}>
              <ChoiceButton selected={inviteMode === 'single'} title="Uso único" description="Uma pessoa" onPress={() => setInviteMode('single')} />
              <ChoiceButton selected={inviteMode === 'open'} title="Aberto" description="Várias pessoas" onPress={() => setInviteMode('open')} />
            </View>
            <Text style={styles.modalLabel}>EXPIRA EM</Text>
            <View style={styles.durationRow}>
              {[1, 7, 30].map((days) => <Pressable key={days} accessibilityRole="button" disabled={!inviteMode || issue.isPending} onPress={() => { setError(''); issue.mutate({ open: inviteMode === 'open', days }); }} style={[styles.durationButton, !inviteMode && styles.disabledChoice]}>
                <Text style={styles.durationText}>{days === 1 ? '24 horas' : `${days} dias`}</Text>
              </Pressable>)}
            </View>
            {issue.isPending ? <Text style={styles.modalHint}>Gerando um código seguro…</Text> : null}
          </> : <>
            <View style={styles.generatedLink}><Text selectable style={styles.generatedLinkText}>{inviteLink}</Text></View>
            <Pressable accessibilityRole="button" onPress={() => void shareInvite()} style={styles.shareButton}><Text style={styles.shareButtonText}>{copied ? 'Link copiado' : Platform.OS === 'web' ? 'Copiar link' : 'Compartilhar link'}</Text></Pressable>
          </>}
          {error ? <Text accessibilityRole="alert" style={styles.modalError}>{error}</Text> : null}
          <Pressable accessibilityRole="button" onPress={dismiss} style={styles.cancelButton}><Text style={styles.cancelText}>{token ? 'Fechar' : 'Cancelar'}</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

function ChoiceButton({ selected, title, description, onPress }: { selected: boolean; title: string; description: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.modeChoice, selected && styles.selectedChoice]}>
    <Text style={styles.modeTitle}>{title}</Text><Text style={styles.modeDescription}>{description}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12 }, statCard: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E1E6EE', borderRadius: 14, padding: 14, marginVertical: 12 }, number: { color: colors.ink, fontSize: 26, fontWeight: '600' }, statLabel: { color: colors.muted, fontSize: 11 }, section: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8 }, cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' }, link: { color: colors.blue, fontSize: 12, fontWeight: '700', marginTop: 12 }, inviteLink: { marginTop: 10 }, inviteAction: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#C8D5E8', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 28, 48, 0.42)', justifyContent: 'center', padding: 22 }, modalCard: { width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: colors.white, borderRadius: 18, padding: 20 }, modalTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' }, modalDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 }, modalLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 }, choiceRow: { flexDirection: 'row', gap: 10 }, modeChoice: { flex: 1, minHeight: 64, borderWidth: 1, borderColor: '#D9E0E9', borderRadius: 10, padding: 10, justifyContent: 'center' }, selectedChoice: { borderColor: colors.blue, backgroundColor: colors.pale }, modeTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, modeDescription: { color: colors.muted, fontSize: 10, marginTop: 3 }, durationRow: { flexDirection: 'row', gap: 8 }, durationButton: { flex: 1, minHeight: 42, borderRadius: 9, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, disabledChoice: { backgroundColor: '#DCE2EB' }, durationText: { color: colors.white, fontSize: 11, fontWeight: '700' }, modalHint: { color: colors.muted, fontSize: 11, marginTop: 12, textAlign: 'center' }, generatedLink: { backgroundColor: colors.pale, padding: 12, borderRadius: 10, marginTop: 16 }, generatedLinkText: { color: colors.blue, fontSize: 12 }, shareButton: { minHeight: 44, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, shareButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' }, modalError: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 12 }, cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 6 }, cancelText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
