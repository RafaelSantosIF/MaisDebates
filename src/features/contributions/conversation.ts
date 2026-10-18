import type { Stance } from './schema.ts';

const perspectiveOrder: Stance[] = ['favoravel', 'contrario', 'em_parte', 'refletindo'];

export function alternatePerspectives<T extends { stance: Stance }>(positions: T[]): T[] {
  const buckets = perspectiveOrder.map((stance) => positions.filter((position) => position.stance === stance));
  const ordered: T[] = [];
  for (let index = 0; ordered.length < positions.length; index++) {
    for (const bucket of buckets) {
      if (bucket[index]) ordered.push(bucket[index]);
    }
  }
  return ordered;
}
