/**
 * ACL for Git / GitHub operations.
 * Translates ulw pipeline needs into git commands and PR management.
 */

/**
 * Translates ulw workflow events into git operations.
 */
export interface UlwGitAdapter {
  /** Create a pull request from the current branch to target. */
  createPR(input: PRInput): Promise<PRInfo>;

  /** Get the unified diff for a branch or commit range. */
  getDiff(from: string, to: string): Promise<string>;

  /** Get the working tree status. */
  getStatus(path?: string): Promise<GitStatus>;

  /** Fetch and rebase onto the target branch. */
  syncWithBase(targetBranch: string): Promise<void>;
}

export interface PRInput {
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
  reviewers?: string[];
  labels?: string[];
}

export interface PRInfo {
  number: number;
  url: string;
  state: 'open' | 'closed' | 'merged';
  headBranch: string;
  baseBranch: string;
  checksPassing: boolean;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  changed: string[];
  staged: string[];
  untracked: string[];
  clean: boolean;
}

/**
 * Manages isolated git worktrees for parallel agent operation.
 */
export interface WorktreeManager {
  /** Create a new worktree on the given base branch. */
  createWorktree(branch: string, base: string): Promise<WorktreeStatus>;

  /** Lock a worktree to prevent concurrent writes. */
  lockWorktree(path: string): Promise<void>;

  /** Unlock a worktree. */
  unlockWorktree(path: string): Promise<void>;

  /** Prune stale worktrees older than maxAgeMs. */
  pruneWorktrees(maxAgeMs: number): Promise<string[]>;

  /** List all active worktrees. */
  listActive(): Promise<WorktreeStatus[]>;
}

export interface WorktreeStatus {
  path: string;
  branch: string;
  base: string;
  locked: boolean;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * GitHub / GitLab / Bitbucket PR operations.
 */
export interface PRClient {
  /** Create a new pull request. */
  create(input: PRInput): Promise<PRInfo>;

  /** Update an existing PR (title, body, reviewers, labels). */
  update(prNumber: number, update: Partial<PRInput>): Promise<PRInfo>;

  /** Merge a PR with the given strategy. */
  merge(prNumber: number, strategy: MergeStrategy): Promise<MergeResult>;

  /** Get the current status of all CI checks on a PR. */
  getChecks(prNumber: number): Promise<CheckResult[]>;
}

export type MergeStrategy = 'merge' | 'squash' | 'rebase';

export interface MergeResult {
  merged: boolean;
  sha?: string;
  error?: string;
}

export interface CheckResult {
  name: string;
  status: 'pending' | 'passing' | 'failing';
  url?: string;
  details?: string;
}
