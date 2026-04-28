import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { OrchestratorService } from '../orchestrator.service.js';

export function createOrchestratorRouter(orchestratorService: OrchestratorService) {
  const t = initTRPC.create();

  return t.router({
    decompose: t.procedure
      .input(
        z.object({
          description: z.string().min(1),
          title: z.string().optional(),
          domain: z.string().optional(),
        }),
      )
      .query(({ input }) => {
        return orchestratorService.decomposeTask({
          taskId: `trpc-task-${Date.now()}`,
          title: input.title ?? 'Untitled Task',
          description: input.description,
          domain: (input.domain as never) ?? ('code-generation' as never),
          priority: 'medium' as never,
          context: {},
          parentTaskId: null,
          createdAt: new Date(),
        });
      }),

    getPattern: t.procedure.input(z.string()).query(({ input }) => {
      return orchestratorService.getPattern(input);
    }),

    executeTask: t.procedure.input(z.string()).mutation(({ input }) => {
      return orchestratorService.routeToSupervisor(input);
    }),
  });
}

export type OrchestratorRouter = ReturnType<typeof createOrchestratorRouter>;
