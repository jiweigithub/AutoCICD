import { z } from 'zod';

export const CreateArchitectureSpecDtoSchema = z.object({
  storyId: z.string().uuid(),
  contextMap: z.record(z.unknown()).default({}),
});

export type CreateArchitectureSpecDto = z.infer<typeof CreateArchitectureSpecDtoSchema>;
