import { Project } from '../../domain/entities/project.js';
import type { IProjectRepository } from '../../domain/repositories/index.js';
import { z } from 'zod';

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().default(''),
});

export const CreateStoryInputSchema = z.object({
  sprintId: z.string().uuid(),
  title: z.string().min(1).max(255),
  points: z.number().int().min(0).default(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  acceptanceCriteria: z.string().default(''),
});

export const CommitSprintInputSchema = z.object({
  sprintId: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type CreateStoryInput = z.infer<typeof CreateStoryInputSchema>;
export type CommitSprintInput = z.infer<typeof CommitSprintInputSchema>;
