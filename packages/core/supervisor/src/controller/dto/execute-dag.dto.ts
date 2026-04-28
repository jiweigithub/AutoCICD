import { z } from 'zod';

export const ExecuteDAGSchema = z.object({
  dagId: z.string().min(1),
  specs: z
    .array(
      z.object({
        specId: z.string().min(1),
        assignedAgent: z.string().min(1),
        instructions: z.string().min(1),
        dependencies: z.array(z.string()),
      }),
    )
    .min(1),
});

export type ExecuteDAGDto = z.infer<typeof ExecuteDAGSchema>;

export const DAGProgressSchema = z.object({
  dagId: z.string().min(1),
});

export type DAGProgressDto = z.infer<typeof DAGProgressSchema>;
