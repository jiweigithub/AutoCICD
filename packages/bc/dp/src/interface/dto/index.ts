import { z } from 'zod';

export const CreateReleaseDtoSchema = z.object({
  version: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
  artifactUrl: z.string().default(''),
});

export const RollbackDtoSchema = z.object({
  releaseId: z.string().uuid(),
  reason: z.string().min(1),
  trigger: z.enum(['automatic', 'manual']).default('manual'),
});

export type CreateReleaseDto = z.infer<typeof CreateReleaseDtoSchema>;
export type RollbackDto = z.infer<typeof RollbackDtoSchema>;
