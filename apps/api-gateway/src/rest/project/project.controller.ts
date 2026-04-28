import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { CreateProjectSchema, type CreateProjectDto, UpdateProjectSchema, type UpdateProjectDto } from './dto/create-project.dto.js';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`ProjectController.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

@Controller('projects')
export class ProjectController {
  private readonly projects = new Map<string, Record<string, unknown>>();

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateProjectDto) {
    const parsed = CreateProjectSchema.parse(body);
    const id = `proj-${Date.now()}`;
    const project = { id, ...parsed, createdAt: new Date().toISOString() };
    this.projects.set(id, project);
    return project;
  }

  @Get()
  list() {
    throw new NotImplementedError('list');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const project = this.projects.get(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
    const parsed = UpdateProjectSchema.parse(body);
    const existing = this.projects.get(id);
    if (!existing) throw new NotFoundException(`Project ${id} not found`);
    const updated = { ...existing, ...parsed, updatedAt: new Date().toISOString() };
    this.projects.set(id, updated);
    return updated;
  }
}
