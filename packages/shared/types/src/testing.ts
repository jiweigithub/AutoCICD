export interface TestSuite {
  suiteId: string;
  name: string;
  description: string;
  testCases: TestCase[];
  metadata: Record<string, string>;
}

export interface TestCase {
  testId: string;
  suiteId: string;
  name: string;
  description: string;
  testType: TestType;
  tags: string[];
  enabled: boolean;
  timeoutMs: number;
}

export enum TestType {
  Unit = 'unit',
  Integration = 'integration',
  E2E = 'e2e',
  Contract = 'contract',
  Performance = 'performance',
  Smoke = 'smoke',
}

export interface TestResult {
  resultId: string;
  testId: string;
  status: TestResultStatus;
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
  errorMessage: string | null;
  logs: string[];
  artifacts: string[];
}

export enum TestResultStatus {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  TimedOut = 'timed-out',
}

export interface CoverageReport {
  reportId: string;
  suiteId: string;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  uncoveredLines: number;
  totalLines: number;
  generatedAt: Date;
}
