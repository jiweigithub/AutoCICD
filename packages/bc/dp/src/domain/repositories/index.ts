import type { Release, PipelineStage, Rollback } from '../entities/index.js';

export interface IReleaseRepository {
  findById(id: string): Promise<Release | null>;
  findAll(): Promise<Release[]>;
  save(release: Release): Promise<void>;
}

export interface IPipelineStageRepository {
  findByReleaseId(releaseId: string): Promise<PipelineStage[]>;
  save(stage: PipelineStage): Promise<void>;
}

export interface IRollbackRepository {
  findByReleaseId(releaseId: string): Promise<Rollback[]>;
  save(rollback: Rollback): Promise<void>;
}
