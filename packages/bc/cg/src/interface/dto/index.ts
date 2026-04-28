import { z } from 'zod';

export const StartGenerationDtoSchema = z.object({
  archSpecId: z.string().uuid(),
  worktreeRef: z.string().default(''),
});

export type StartGenerationDto = z.infer<typeof StartGenerationDtoSchema>;
