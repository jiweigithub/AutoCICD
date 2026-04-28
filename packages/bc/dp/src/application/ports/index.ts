import { z } from 'zod';

export const CreateReleaseInputSchema = z.object({
  version: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
  artifactUrl: z.string().default(''),
});

export const TriggerRollbackInputSchema = z.object({
  releaseId: z.string().uuid(),
  reason: z.string().min(1),
  trigger: z.enum(['automatic', 'manual']).default('manual'),
});

export type CreateReleaseInput = z.infer<typeof CreateReleaseInputSchema>;
export type TriggerRollbackInput = z.infer<typeof TriggerRollbackInputSchema>;
