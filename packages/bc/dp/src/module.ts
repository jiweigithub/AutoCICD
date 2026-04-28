import { Module } from '@nestjs/common';
import { DeploymentController } from './interface/controllers/deployment.controller.js';
import { CreateReleaseUseCase, TriggerRollbackUseCase } from './application/use-cases/index.js';
import { ReleaseRepository, PipelineStageRepository, RollbackRepository } from './infrastructure/persistence/repositories/index.js';

@Module({
  controllers: [DeploymentController],
  providers: [
    CreateReleaseUseCase,
    TriggerRollbackUseCase,
    { provide: 'IReleaseRepository', useClass: ReleaseRepository },
    { provide: 'IPipelineStageRepository', useClass: PipelineStageRepository },
    { provide: 'IRollbackRepository', useClass: RollbackRepository },
  ],
  exports: [CreateReleaseUseCase, TriggerRollbackUseCase],
})
export class BCDeploymentModule {}
