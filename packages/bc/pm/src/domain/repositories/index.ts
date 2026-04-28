import type { Project } from '../entities/project.js';
import type { Sprint } from '../entities/sprint.js';
import type { Story } from '../entities/story.js';

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ISprintRepository {
  findById(id: string): Promise<Sprint | null>;
  findByProjectId(projectId: string): Promise<Sprint[]>;
  save(sprint: Sprint): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IStoryRepository {
  findById(id: string): Promise<Story | null>;
  findBySprintId(sprintId: string): Promise<Story[]>;
  save(story: Story): Promise<void>;
  delete(id: string): Promise<void>;
}
