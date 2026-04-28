import { Controller, Post, Body } from '@nestjs/common';
import { CreateReleaseUseCase, TriggerRollbackUseCase } from '../../application/use-cases/index.js';
import type { CreateReleaseDto, RollbackDto } from '../dto/index.js';

@Controller('deployments')
export class DeploymentController {
  constructor(
    private readonly createReleaseUseCase: CreateReleaseUseCase,
    private readonly triggerRollbackUseCase: TriggerRollbackUseCase,
  ) {}

  @Post('releases')
  async createRelease(@Body() dto: CreateReleaseDto) {
    return this.createReleaseUseCase.execute(dto);
  }

  @Post('rollback')
  async rollback(@Body() dto: RollbackDto) {
    return this.triggerRollbackUseCase.execute(dto);
  }
}
