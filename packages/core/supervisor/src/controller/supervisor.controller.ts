import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { SupervisorService } from '../supervisor.service.js';
import { ExecuteDAGSchema, type ExecuteDAGDto, type DAGProgressDto } from './dto/execute-dag.dto.js';

@Controller('supervisor')
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Post('dag/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  executeDAG(@Body() body: ExecuteDAGDto) {
    const parsed = ExecuteDAGSchema.parse(body);
    return this.supervisorService.executeDAG({
      dagId: parsed.dagId,
      specs: parsed.specs,
    });
  }

  @Get('dag/:dagId/progress')
  getDAGProgress(@Param('dagId') dagId: string) {
    const progress = this.supervisorService.trackProgress(dagId);
    if (!progress) {
      throw new NotFoundException(`DAG ${dagId} not found`);
    }
    return progress;
  }

  @Get('dag/:dagId/results')
  aggregateResults(@Param('dagId') dagId: string) {
    return this.supervisorService.aggregateResults(dagId);
  }
}
