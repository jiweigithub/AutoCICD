import { z } from 'zod';

export const PipelineLifecycleFields = {
  eventId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  occurredAt: z.string().datetime(),
};

export const PipelineStartedEventSchema = z.object({
  ...PipelineLifecycleFields,
  eventType: z.literal('pipeline.started'),
  specRef: z.object({
    repo: z.string(),
    commitSHA: z.string(),
    filePath: z.string(),
  }),
  triggeredBy: z.string(),
});

export const PipelineFailedEventSchema = z.object({
  ...PipelineLifecycleFields,
  eventType: z.literal('pipeline.failed'),
  failedStage: z.enum([
    'SPEC_PARSING',
    'ARCHITECTURE_DESIGN',
    'TDD_CODE_GEN',
    'CODE_REVIEW',
    'AUTOMATED_TESTING',
    'DEPLOYMENT',
  ]),
  error: z.string(),
});

export const PipelineCompletedEventSchema = z.object({
  ...PipelineLifecycleFields,
  eventType: z.literal('pipeline.completed'),
  totalDurationMs: z.number().int().positive(),
  stagesCompleted: z.number().int().min(1).max(6),
});

export type PipelineStartedEvent = z.infer<typeof PipelineStartedEventSchema>;
export type PipelineFailedEvent = z.infer<typeof PipelineFailedEventSchema>;
export type PipelineCompletedEvent = z.infer<typeof PipelineCompletedEventSchema>;
