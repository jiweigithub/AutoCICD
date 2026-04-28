import { z } from 'zod';
import { TDDState } from '../../domain/entities/index.js';

export const StartGenerationInputSchema = z.object({
  archSpecId: z.string().uuid(),
  worktreeRef: z.string().default(''),
});

export const TransitionTDDInputSchema = z.object({
  taskId: z.string().uuid(),
  toState: z.nativeEnum(TDDState),
});

export type StartGenerationInput = z.infer<typeof StartGenerationInputSchema>;
export type TransitionTDDInput = z.infer<typeof TransitionTDDInputSchema>;
