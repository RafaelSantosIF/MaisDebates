import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { normalizeInviteToken } from '../src/features/invitations/token.ts';
import { positionSchema } from '../src/features/contributions/schema.ts';
import { debateClosesAt } from '../src/features/mediation/date.ts';
import { alternatePerspectives } from '../src/features/contributions/conversation.ts';

const sampleToken = 'a'.repeat(64);

test('individual invite accepts only a full token or the app deep link', () => {
  assert.equal(normalizeInviteToken(sampleToken), sampleToken);
  assert.equal(normalizeInviteToken(`maisdebates://convite/${sampleToken}`), sampleToken);
  assert.equal(normalizeInviteToken(`MAISDEBATES://CONVITE/${sampleToken.toUpperCase()}`), sampleToken);
  assert.equal(normalizeInviteToken('not-an-invite'), null);
  assert.equal(normalizeInviteToken(`${sampleToken}?extra=1`), null);
});

test('a reflective stance still requires a written reason', () => {
  assert.equal(positionSchema.safeParse({ stance: 'refletindo', rationale: '   ', sourceNote: '' }).success, false);
  assert.equal(positionSchema.safeParse({ stance: 'refletindo', rationale: 'Ainda tenho dúvidas sobre o acesso de toda a turma.', sourceNote: '' }).success, true);
});

test('position text and citation stay within the server contract', () => {
  assert.equal(positionSchema.safeParse({ stance: 'favoravel', rationale: 'a'.repeat(3001), sourceNote: '' }).success, false);
  assert.equal(positionSchema.safeParse({ stance: 'favoravel', rationale: 'Uma razão.', sourceNote: 'a'.repeat(501) }).success, false);
});

test('debate deadline rejects malformed and elapsed dates before creating a draft', () => {
  assert.throws(() => debateClosesAt('2026-02-30'), /válida/);
  assert.throws(() => debateClosesAt('24/10/2026'), /AAAA-MM-DD/);
  assert.throws(() => debateClosesAt('2020-01-01'), /futura/);
  assert.equal(debateClosesAt(''), null);
  assert.match(debateClosesAt('2099-12-31')!, /^2100-01-01T02:59:59/);
});

test('perspective filter alternates positions without using agreement counts', () => {
  const positions = [
    { id: 1, stance: 'favoravel' as const, agreements: 100 },
    { id: 2, stance: 'favoravel' as const, agreements: 50 },
    { id: 3, stance: 'contrario' as const, agreements: 1 },
    { id: 4, stance: 'refletindo' as const, agreements: 0 },
  ];
  assert.deepEqual(alternatePerspectives(positions).map((item) => item.id), [1, 3, 4, 2]);
});
