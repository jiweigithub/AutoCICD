export interface TestExecutorService {
  executeSuite(suiteId: string): Promise<string>;
  collectCoverage(runId: string): Promise<{ line: number; branch: number }>;
}
