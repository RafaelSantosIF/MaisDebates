import { router } from 'expo-router';
import { Body, Button, Card, Heading, Kicker, Page } from '@/shared/ui/Primitives';

export default function ReportReceivedScreen() {
  return <Page title="Denúncia recebida" footer={<Button label="Voltar à conversa" onPress={() => router.back()} />}>
    <Kicker>Denúncia recebida</Kicker><Heading>Obrigado por ajudar{"\n"}a cuidar do diálogo.</Heading>
    <Body lead>A mediação vai analisar o conteúdo e o contexto antes de decidir.</Body>
    <Card><Body>O envio da denúncia não remove a contribuição automaticamente. Uma pessoa fará a revisão.</Body></Card>
  </Page>;
}
