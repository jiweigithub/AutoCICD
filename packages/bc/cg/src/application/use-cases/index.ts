import { randomUUID } from 'node:crypto';
import { GenerationTask } from '../../domain/entities/index.js';
import type { IGenerationTaskRepository } from '../../domain/repositories/index.js';
import type { StartGenerationInput, TransitionTDDInput } from '../ports/index.js';

export class StartGenerationUseCase {
  constructor(private readonly taskRepo: IGenerationTaskRepository) {}

  async execute(input: StartGenerationInput): Promise<GenerationTask> {
    const task = new GenerationTask(randomUUID(), input.archSpecId, input.worktreeRef);
    await this.taskRepo.save(task);
    return task;
  }
}

export class TransitionTDDUseCase {
  constructor(private readonly taskRepo: IGenerationTaskRepository) {}

  async execute(input: TransitionTDDInput): Promise<GenerationTask | null> {
    const task = await this.taskRepo.findById(input.taskId);
    if (!task) return null;
    task.transitionTDD(input.toState);
    await this.taskRepo.save(task);
    return task;
  }
}
