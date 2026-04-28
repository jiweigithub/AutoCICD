import { Module } from '@nestjs/common';
import { GenerationController } from './interface/controllers/generation.controller.js';
import { StartGenerationUseCase, TransitionTDDUseCase } from './application/use-cases/index.js';
import { GenerationTaskRepository, GeneratedFileRepository, PullRequestRepository } from './infrastructure/persistence/repositories/index.js';

@Module({
  controllers: [GenerationController],
  providers: [
    StartGenerationUseCase,
    TransitionTDDUseCase,
    { provide: 'IGenerationTaskRepository', useClass: GenerationTaskRepository },
    { provide: 'IGeneratedFileRepository', useClass: GeneratedFileRepository },
    { provide: 'IPullRequestRepository', useClass: PullRequestRepository },
  ],
  exports: [StartGenerationUseCase, TransitionTDDUseCase],
})
export class BCCodeGenerationModule {}
