/**
 * ACL for OpenClaw review platform.
 * Translates ulw automated code review policies into OpenClaw review sessions.
 */

/**
 * Maps ACP (Automated Code Review Pipeline) results into structured review sessions.
 */
export interface UlwReviewAdapter {
  /** Map ACP findings to a review session payload. */
  mapACPToReviewSession(acpData: ACPResult): ReviewSessionInput;

  /** Convert review policy violations into actionable findings. */
  policyViolationsToFindings(violations: PolicyViolation[]): Finding[];

  /** Generate a summary report from review findings. */
  generateReport(sessionId: string, findings: Finding[]): ReviewReport;
}

/**
 * Manages OpenClaw review runtime sessions.
 */
export interface OpenClawRuntime {
  /** Create a new review session against a PR or commit range. */
  createSession(target: ReviewTarget): Promise<ACPSession>;

  /** Execute a review run with the given policies. */
  runReview(sessionId: string, policies: ReviewPolicy[]): Promise<void>;

  /** Collect findings from a completed review. */
  getFindings(sessionId: string): Promise<Finding[]>;

  /** Cancel an in-progress review. */
  cancelReview(sessionId: string): Promise<void>;
}

/** A review session tracked by OpenClaw. */
export interface ACPSession {
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  target: ReviewTarget;
  results: Finding[];
}

export interface ReviewTarget {
  prNumber?: number;
  commitRange?: { from: string; to: string };
  repoUrl: string;
  baseBranch: string;
}

export interface ReviewSessionInput {
  target: ReviewTarget;
  policies: string[];
  options: { autoMerge: boolean; failOnBlocking: boolean };
}

export interface ReviewReport {
  sessionId: string;
  summary: string;
  totalFindings: number;
  blockingFindings: number;
  findings: Finding[];
}

export interface Finding {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'blocker';
  category: string;
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface PolicyViolation {
  policyId: string;
  findingId: string;
  reason: string;
}

/**
 * Evaluates code against a named policy.
 */
export interface ReviewPolicy {
  /** Display name of the policy. */
  name: string;

  /** Evaluate the given diff/patch against this policy. */
  evaluate(diff: DiffContent): Promise<PolicyResult>;

  /** Map a raw finding to a severity level. */
  getSeverity(finding: Finding): 'info' | 'warning' | 'error' | 'blocker';

  /** Return true if a violation at this severity should block the PR. */
  isBlocking(severity: string): boolean;
}

export interface DiffContent {
  file: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  startLine: number;
  context: string;
  addedLines: string[];
  removedLines: string[];
}

export interface PolicyResult {
  policyName: string;
  passed: boolean;
  findings: Finding[];
}

export interface ACPResult {
  pipelineId: string;
  status: 'passed' | 'failed' | 'partial';
  policies: PolicyResult[];
  durationMs: number;
}
