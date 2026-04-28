import { randomUUID } from 'node:crypto';
import { ArchitectureSpec } from '../../domain/entities/architecture-spec.js';
import { ApiContract } from '../../domain/entities/api-contract.js';
import type { IArchitectureSpecRepository, IApiContractRepository } from '../../domain/repositories/index.js';
import type { CreateArchitectureSpecInput, CreateApiContractInput } from '../ports/index.js';

export class CreateArchitectureSpecUseCase {
  constructor(private readonly specRepo: IArchitectureSpecRepository) {}

  async execute(input: CreateArchitectureSpecInput): Promise<ArchitectureSpec> {
    const spec = new ArchitectureSpec(randomUUID(), input.storyId, input.contextMap);
    await this.specRepo.save(spec);
    return spec;
  }
}

export class CreateApiContractUseCase {
  constructor(private readonly contractRepo: IApiContractRepository) {}

  async execute(input: CreateApiContractInput): Promise<ApiContract> {
    const contract = new ApiContract(
      randomUUID(),
      input.specId,
      input.openApiSpec,
      input.version,
    );
    await this.contractRepo.save(contract);
    return contract;
  }
}

export class ApproveArchitectureUseCase {
  constructor(private readonly specRepo: IArchitectureSpecRepository) {}

  async execute(specId: string): Promise<ArchitectureSpec | null> {
    const spec = await this.specRepo.findById(specId);
    if (!spec) return null;
    spec.approve();
    await this.specRepo.save(spec);
    return spec;
  }
}
