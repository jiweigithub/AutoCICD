import { z } from 'zod';

export const BasePipelineFields = {
  eventId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  occurredAt: z.string().datetime(),
};

export const StageStartedEventSchema = z.object({
  ...BasePipelineFields,
  eventType: z.literal('pipeline.stage.started'),
  stage: z.enum([
    'SPEC_PARSING',
    'ARCHITECTURE_DESIGN',
    'TDD_CODE_GEN',
    'CODE_REVIEW',
    'AUTOMATED_TESTING',
    'DEPLOYMENT',
  ]),
  attempt: z.number().int().min(1),
});

export const StageCompletedEventSchema = z.object({
  ...BasePipelineFields,
  eventType: z.literal('pipeline.stage.completed'),
  stage: z.enum([
    'SPEC_PARSING',
    'ARCHITECTURE_DESIGN',
    'TDD_CODE_GEN',
    'CODE_REVIEW',
    'AUTOMATED_TESTING',
    'DEPLOYMENT',
  ]),
  attempt: z.number().int().min(1),
  artifactKeys: z.array(z.string()),
});

export type StageStartedEvent = z.infer<typeof StageStartedEventSchema>;
export type StageCompletedEvent = z.infer<typeof StageCompletedEventSchema>;
