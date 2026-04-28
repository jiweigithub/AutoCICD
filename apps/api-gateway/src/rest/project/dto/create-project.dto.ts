import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  repositoryUrl: z.string().url().optional(),
  teamId: z.string().optional(),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  repositoryUrl: z.string().url().optional(),
});

export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;
