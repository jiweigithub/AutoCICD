import { randomUUID } from 'node:crypto';
import { TestSuite } from '../../domain/entities/index.js';
import type { ITestSuiteRepository } from '../../domain/repositories/index.js';
import type { CreateTestSuiteInput } from '../ports/index.js';

export class CreateTestSuiteUseCase {
  constructor(private readonly suiteRepo: ITestSuiteRepository) {}

  async execute(input: CreateTestSuiteInput): Promise<TestSuite> {
    const suite = new TestSuite(randomUUID(), input.contractId, input.testType);
    await this.suiteRepo.save(suite);
    return suite;
  }
}
