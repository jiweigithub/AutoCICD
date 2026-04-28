import { Module, Global } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import { createAppRouter } from './routers/index.js';
import { OrchestratorService } from '@ulw/orchestrator';

const t = initTRPC.create();

@Global()
@Module({
  providers: [
    {
      provide: 'TRPC_ROUTER',
      useFactory: (orchestratorService?: OrchestratorService) => {
        return createAppRouter(orchestratorService);
      },
      inject: [{ token: OrchestratorService, optional: true }],
    },
    {
      provide: 'TRPC_CONTEXT',
      useFactory: () => t,
    },
  ],
  exports: ['TRPC_ROUTER', 'TRPC_CONTEXT'],
})
export class TRPCModule {}
