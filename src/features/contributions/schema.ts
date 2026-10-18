import { z } from 'zod';

export const positionSchema = z.object({
  stance: z.enum(['favoravel','contrario','em_parte','refletindo']),
  rationale: z.string().trim().min(1, 'Explique seu ponto de vista antes de publicar.').max(3000),
  sourceNote: z.string().max(500),
});
export type Stance = z.infer<typeof positionSchema>['stance'];
