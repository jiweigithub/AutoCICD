import type { Project } from '../../../domain/entities/project.js';
import type { Sprint } from '../../../domain/entities/sprint.js';
import type { Story } from '../../../domain/entities/story.js';
import type { IProjectRepository, ISprintRepository, IStoryRepository } from '../../../domain/repositories/index.js';

export class ProjectRepository implements IProjectRepository {
  async findById(_id: string): Promise<Project | null> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async findAll(): Promise<Project[]> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async save(_project: Project): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }
}

export class SprintRepository implements ISprintRepository {
  async findById(_id: string): Promise<Sprint | null> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async findByProjectId(_projectId: string): Promise<Sprint[]> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async save(_sprint: Sprint): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }
}

export class StoryRepository implements IStoryRepository {
  async findById(_id: string): Promise<Story | null> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async findBySprintId(_sprintId: string): Promise<Story[]> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async save(_story: Story): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }
}
