import type { Release, PipelineStage, Rollback } from '../../../domain/entities/index.js';
import type { IReleaseRepository, IPipelineStageRepository, IRollbackRepository } from '../../../domain/repositories/index.js';

export class ReleaseRepository implements IReleaseRepository {
  async findById(_id: string): Promise<Release | null> { throw new Error('Not implemented'); }
  async findAll(): Promise<Release[]> { throw new Error('Not implemented'); }
  async save(_release: Release): Promise<void> { throw new Error('Not implemented'); }
}
export class PipelineStageRepository implements IPipelineStageRepository {
  async findByReleaseId(_releaseId: string): Promise<PipelineStage[]> { throw new Error('Not implemented'); }
  async save(_stage: PipelineStage): Promise<void> { throw new Error('Not implemented'); }
}
export class RollbackRepository implements IRollbackRepository {
  async findByReleaseId(_releaseId: string): Promise<Rollback[]> { throw new Error('Not implemented'); }
  async save(_rollback: Rollback): Promise<void> { throw new Error('Not implemented'); }
}
