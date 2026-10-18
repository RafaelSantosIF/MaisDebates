export function debateClosesAt(value: string): string | null {
  if (!value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Informe a data no formato AAAA-MM-DD.');
  const [year, month, day] = value.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) {
    throw new Error('Informe uma data de encerramento válida.');
  }
  const instant = new Date(`${value}T23:59:59-03:00`);
  if (instant.getTime() <= Date.now()) throw new Error('Escolha uma data de encerramento futura.');
  return instant.toISOString();
}

export function deadlineCalendarDate(value: string | null): string {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = (kind: string) => parts.find((item) => item.type === kind)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
