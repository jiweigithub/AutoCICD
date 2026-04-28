import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreateProjectUseCase } from '../../application/use-cases/index.js';
import type { CreateProjectDto } from '../dto/project.dto.js';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProjectDto) {
    return this.createProjectUseCase.execute(dto);
  }

  @Get(':id')
  async findOne(@Param('id') _id: string) {
    return { message: 'Not implemented' };
  }
}
