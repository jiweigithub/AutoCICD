import { z } from 'zod';

export const CreateArchitectureSpecInputSchema = z.object({
  storyId: z.string().uuid(),
  contextMap: z.record(z.unknown()).default({}),
});

export const CreateApiContractInputSchema = z.object({
  specId: z.string().uuid(),
  openApiSpec: z.string().min(1),
  version: z.string().default('1.0.0'),
});

export type CreateArchitectureSpecInput = z.infer<typeof CreateArchitectureSpecInputSchema>;
export type CreateApiContractInput = z.infer<typeof CreateApiContractInputSchema>;
