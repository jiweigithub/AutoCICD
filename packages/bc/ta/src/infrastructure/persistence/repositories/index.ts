import type { TestSuite, TestCase, TestRun } from '../../../domain/entities/index.js';
import type { ITestSuiteRepository, ITestCaseRepository, ITestRunRepository } from '../../../domain/repositories/index.js';

export class TestSuiteRepository implements ITestSuiteRepository {
  async findById(_id: string): Promise<TestSuite | null> { throw new Error('Not implemented'); }
  async save(_suite: TestSuite): Promise<void> { throw new Error('Not implemented'); }
}
export class TestCaseRepository implements ITestCaseRepository {
  async findBySuiteId(_suiteId: string): Promise<TestCase[]> { throw new Error('Not implemented'); }
  async save(_testCase: TestCase): Promise<void> { throw new Error('Not implemented'); }
}
export class TestRunRepository implements ITestRunRepository {
  async findBySuiteId(_suiteId: string): Promise<TestRun[]> { throw new Error('Not implemented'); }
  async save(_run: TestRun): Promise<void> { throw new Error('Not implemented'); }
}
