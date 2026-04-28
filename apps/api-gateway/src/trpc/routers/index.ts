import { Module } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import { createOrchestratorRouter, OrchestratorService } from '@ulw/orchestrator';

const t = initTRPC.create();

export function createAppRouter(orchestratorService?: OrchestratorService) {
  const orchestratorRouter = orchestratorService
    ? createOrchestratorRouter(orchestratorService)
    : t.router({
        decompose: t.procedure
          .input((input: unknown) => input as { description: string; title?: string })
          .query(() => ({ success: false, dag: null, errors: ['OrchestratorService not available'], warnings: [] })),
        getPattern: t.procedure.input((input: unknown) => input as string).query(() => null),
        executeTask: t.procedure.input((input: unknown) => input as string).mutation(() => null),
      });

  return t.router({
    orchestrator: orchestratorRouter,
    health: t.procedure.query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
