import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { OrchestratorService } from '../orchestrator.service.js';
import { CreateTaskSchema, type CreateTaskDto } from './dto/create-task.dto.js';

@Controller('tasks')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() body: CreateTaskDto) {
    const parsed = CreateTaskSchema.parse(body);
    return this.orchestratorService.decomposeTask({
      taskId: `task-${Date.now()}`,
      title: parsed.title,
      description: parsed.description,
      domain: parsed.domain ? (parsed.domain as never) : ('code-generation' as never),
      priority: (parsed.priority as never) || ('medium' as never),
      context: parsed.context ?? {},
      parentTaskId: parsed.parentTaskId ?? null,
      createdAt: new Date(),
    });
  }

  @Get(':id')
  getTask(@Param('id') id: string) {
    const task = this.orchestratorService.getPattern(id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  executeTask(@Param('id') id: string) {
    const result = this.orchestratorService.routeToSupervisor(id);
    if (!result) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return result;
  }
}
