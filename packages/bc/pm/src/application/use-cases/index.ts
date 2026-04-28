import { randomUUID } from 'node:crypto';
import { Project } from '../../domain/entities/project.js';
import { Story } from '../../domain/entities/story.js';
import type { IProjectRepository, IStoryRepository } from '../../domain/repositories/index.js';
import type { CreateProjectInput, CreateStoryInput, CommitSprintInput } from '../ports/index.js';
import type { Sprint } from '../../domain/entities/sprint.js';

export class CreateProjectUseCase {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const project = new Project(
      randomUUID(),
      input.name,
      input.description,
    );
    await this.projectRepo.save(project);
    return project;
  }
}

export class CreateStoryUseCase {
  constructor(private readonly storyRepo: IStoryRepository) {}

  async execute(input: CreateStoryInput): Promise<Story> {
    const story = new Story(
      randomUUID(),
      input.sprintId,
      input.title,
      input.points,
      input.priority,
      input.acceptanceCriteria,
    );
    await this.storyRepo.save(story);
    return story;
  }
}

export class CommitSprintUseCase {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly storyRepo: IStoryRepository,
  ) {}

  async execute(input: CommitSprintInput): Promise<Sprint | null> {
    const project = await this.projectRepo.findById(input.sprintId);
    if (!project) return null;
    const sprint = project.sprints.find((s) => s.id === input.sprintId);
    if (!sprint) return null;
    sprint.commit();
    await this.projectRepo.save(project);
    return sprint;
  }
}
