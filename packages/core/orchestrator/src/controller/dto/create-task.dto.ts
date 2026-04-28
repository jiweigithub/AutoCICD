import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  domain: z
    .enum(['project-management', 'architecture', 'code-generation', 'code-review', 'testing', 'deployment'])
    .optional(),
  context: z.record(z.unknown()).optional().default({}),
  parentTaskId: z.string().nullable().optional().default(null),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
