import type { GenerationTask, GeneratedFile, PullRequest } from '../../../domain/entities/index.js';
import type { IGenerationTaskRepository, IGeneratedFileRepository, IPullRequestRepository } from '../../../domain/repositories/index.js';

export class GenerationTaskRepository implements IGenerationTaskRepository {
  async findById(_id: string): Promise<GenerationTask | null> { throw new Error('Not implemented'); }
  async save(_task: GenerationTask): Promise<void> { throw new Error('Not implemented'); }
  async delete(_id: string): Promise<void> { throw new Error('Not implemented'); }
}

export class GeneratedFileRepository implements IGeneratedFileRepository {
  async findByTaskId(_taskId: string): Promise<GeneratedFile[]> { throw new Error('Not implemented'); }
  async save(_file: GeneratedFile): Promise<void> { throw new Error('Not implemented'); }
}

export class PullRequestRepository implements IPullRequestRepository {
  async findByTaskId(_taskId: string): Promise<PullRequest | null> { throw new Error('Not implemented'); }
  async save(_pr: PullRequest): Promise<void> { throw new Error('Not implemented'); }
}
