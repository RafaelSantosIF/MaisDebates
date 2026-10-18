export function normalizeInviteToken(input: string): string | null {
  const value = input.trim();
  const token = value.replace(/^maisdebates:\/\/convite\//i, '').toLowerCase();
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
}
