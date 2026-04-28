import { z } from 'zod';
import { CreateProjectInputSchema } from '../../application/ports/index.js';

export const CreateProjectDtoSchema = CreateProjectInputSchema.extend({
  name: z.string().min(1).max(255),
});

export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

export const ProjectResponseDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['active', 'archived', 'completed']),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProjectResponseDto = z.infer<typeof ProjectResponseDtoSchema>;
