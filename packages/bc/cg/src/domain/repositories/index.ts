import type { GenerationTask, GeneratedFile, PullRequest } from '../entities/index.js';

export interface IGenerationTaskRepository {
  findById(id: string): Promise<GenerationTask | null>;
  save(task: GenerationTask): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IGeneratedFileRepository {
  findByTaskId(taskId: string): Promise<GeneratedFile[]>;
  save(file: GeneratedFile): Promise<void>;
}

export interface IPullRequestRepository {
  findByTaskId(taskId: string): Promise<PullRequest | null>;
  save(pr: PullRequest): Promise<void>;
}
