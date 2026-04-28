import type { ArchitectureSpec } from '../entities/architecture-spec.js';
import type { ApiContract } from '../entities/api-contract.js';

export interface IArchitectureSpecRepository {
  findById(id: string): Promise<ArchitectureSpec | null>;
  findByStoryId(storyId: string): Promise<ArchitectureSpec | null>;
  save(spec: ArchitectureSpec): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IApiContractRepository {
  findById(id: string): Promise<ApiContract | null>;
  findBySpecId(specId: string): Promise<ApiContract[]>;
  save(contract: ApiContract): Promise<void>;
  delete(id: string): Promise<void>;
}
