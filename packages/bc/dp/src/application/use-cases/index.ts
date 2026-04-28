import { randomUUID } from 'node:crypto';
import { Release, Rollback } from '../../domain/entities/index.js';
import type { IReleaseRepository, IRollbackRepository } from '../../domain/repositories/index.js';
import type { CreateReleaseInput, TriggerRollbackInput } from '../ports/index.js';

export class CreateReleaseUseCase {
  constructor(private readonly releaseRepo: IReleaseRepository) {}

  async execute(input: CreateReleaseInput): Promise<Release> {
    const release = new Release(randomUUID(), input.version, input.environment, input.artifactUrl);
    await this.releaseRepo.save(release);
    return release;
  }
}

export class TriggerRollbackUseCase {
  constructor(
    private readonly releaseRepo: IReleaseRepository,
    private readonly rollbackRepo: IRollbackRepository,
  ) {}

  async execute(input: TriggerRollbackInput): Promise<Rollback | null> {
    const release = await this.releaseRepo.findById(input.releaseId);
    if (!release) return null;
    const rollback = new Rollback(randomUUID(), input.releaseId, input.reason, input.trigger);
    await this.rollbackRepo.save(rollback);
    release.markRolledBack();
    await this.releaseRepo.save(release);
    return rollback;
  }
}
