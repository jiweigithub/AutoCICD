import { Module } from '@nestjs/common';
import { ArchitectureController } from './interface/controllers/architecture.controller.js';
import {
  CreateArchitectureSpecUseCase,
  CreateApiContractUseCase,
  ApproveArchitectureUseCase,
} from './application/use-cases/index.js';
import { ArchitectureSpecRepository, ApiContractRepository } from './infrastructure/persistence/repositories/index.js';

@Module({
  controllers: [ArchitectureController],
  providers: [
    CreateArchitectureSpecUseCase,
    CreateApiContractUseCase,
    ApproveArchitectureUseCase,
    { provide: 'IArchitectureSpecRepository', useClass: ArchitectureSpecRepository },
    { provide: 'IApiContractRepository', useClass: ApiContractRepository },
  ],
  exports: [CreateArchitectureSpecUseCase, ApproveArchitectureUseCase],
})
export class BCArchitectureDesignModule {}
