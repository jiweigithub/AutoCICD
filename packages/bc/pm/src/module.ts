import { Module } from '@nestjs/common';
import { ProjectController } from './interface/controllers/project.controller.js';
import { CreateProjectUseCase, CreateStoryUseCase, CommitSprintUseCase } from './application/use-cases/index.js';
import { ProjectRepository, SprintRepository, StoryRepository } from './infrastructure/persistence/repositories/index.js';

@Module({
  controllers: [ProjectController],
  providers: [
    CreateProjectUseCase,
    CreateStoryUseCase,
    CommitSprintUseCase,
    { provide: 'IProjectRepository', useClass: ProjectRepository },
    { provide: 'ISprintRepository', useClass: SprintRepository },
    { provide: 'IStoryRepository', useClass: StoryRepository },
  ],
  exports: [CreateProjectUseCase, CreateStoryUseCase, CommitSprintUseCase],
})
export class BCProjectManagementModule {}
