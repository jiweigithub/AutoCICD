import type { TestSuite, TestCase, TestRun } from '../entities/index.js';

export interface ITestSuiteRepository {
  findById(id: string): Promise<TestSuite | null>;
  save(suite: TestSuite): Promise<void>;
}

export interface ITestCaseRepository {
  findBySuiteId(suiteId: string): Promise<TestCase[]>;
  save(testCase: TestCase): Promise<void>;
}

export interface ITestRunRepository {
  findBySuiteId(suiteId: string): Promise<TestRun[]>;
  save(run: TestRun): Promise<void>;
}
