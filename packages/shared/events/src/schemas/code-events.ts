import { z } from 'zod';
import { BaseEventFields } from './project-events.js';

export const GenerationStartedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cg.generation.started'),
  storyId: z.string(),
  targetLanguage: z.string(),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
});

export const TDDTransitionSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cg.tdd.transition'),
  phase: z.enum(['red', 'green', 'refactor']),
  testCount: z.number().int().min(0),
});

export const CodeReadySchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cg.code.ready'),
  filesGenerated: z.number().int().positive(),
  totalLines: z.number().int().positive(),
  coveragePercent: z.number().min(0).max(100),
});

export const GenerationFailedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cg.generation.failed'),
  reason: z.string(),
  retryable: z.boolean(),
  attemptNumber: z.number().int().positive(),
});

export type GenerationStarted = z.infer<typeof GenerationStartedSchema>;
export type TDDTransition = z.infer<typeof TDDTransitionSchema>;
export type CodeReady = z.infer<typeof CodeReadySchema>;
export type GenerationFailed = z.infer<typeof GenerationFailedSchema>;
