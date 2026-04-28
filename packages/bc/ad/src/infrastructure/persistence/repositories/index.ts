import type { ArchitectureSpec } from '../../../domain/entities/architecture-spec.js';
import type { ApiContract } from '../../../domain/entities/api-contract.js';
import type { IArchitectureSpecRepository, IApiContractRepository } from '../../../domain/repositories/index.js';

export class ArchitectureSpecRepository implements IArchitectureSpecRepository {
  async findById(_id: string): Promise<ArchitectureSpec | null> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async findByStoryId(_storyId: string): Promise<ArchitectureSpec | null> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async save(_spec: ArchitectureSpec): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }
}

export class ApiContractRepository implements IApiContractRepository {
  async findById(_id: string): Promise<ApiContract | null> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async findBySpecId(_specId: string): Promise<ApiContract[]> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async save(_contract: ApiContract): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: connect to PostgreSQL');
  }
}
