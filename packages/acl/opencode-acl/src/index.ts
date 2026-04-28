/**
 * ACL for OpenCode agent runtime.
 * Translates ulw TDD pipeline commands into OpenCode sessions.
 */

/**
 * Maps OpenCode tool invocations to TDD state machine transitions.
 */
export interface UlwCodeAdapter {
  /** Map an OpenCode tool event to the equivalent TDD state transition name. */
  mapToolToTransition(toolName: string): string;

  /** Validate that the tool is allowed in the current TDD phase. */
  validateToolInPhase(tool: string, phase: string): boolean;

  /** Get the set of tools permitted during RED (test-first) phase. */
  getRedPhaseTools(): ReadonlySet<string>;

  /** Get the set of tools permitted during GREEN (implementation) phase. */
  getGreenPhaseTools(): ReadonlySet<string>;

  /** Get the set of tools permitted during REFACTOR phase. */
  getRefactorPhaseTools(): ReadonlySet<string>;
}

/**
 * Manages OpenCode runtime sessions.
 */
export interface OpenCodeRuntime {
  /** Create a new agent session with the given context. */
  createSession(agentId: string, context: Record<string, unknown>): Promise<string>;

  /** Send a prompt to a running session. */
  prompt(sessionId: string, prompt: string): Promise<void>;

  /** Collect the final result from a completed session. */
  collectResult(sessionId: string): Promise<OpenCodeResult>;

  /** Abort a running session. */
  abortSession(sessionId: string): Promise<void>;
}

export interface OpenCodeResult {
  sessionId: string;
  status: 'completed' | 'failed' | 'aborted';
  output: string;
  artifacts: OpenCodeArtifact[];
}

export interface OpenCodeArtifact {
  path: string;
  type: 'file' | 'diff';
  content: string;
}

/**
 * Drives the TDD RED→GREEN→REFACTOR state machine.
 */
export interface TDDStateMachine {
  /** Advance the state machine by one transition. Returns the new state. */
  transition(event: TDDEvent): Promise<TDDState>;

  /** Get the current state (RED, GREEN, or REFACTOR). */
  getState(): TDDState;

  /** Assert that the current phase is valid given the completed work. */
  validatePhase(): Promise<boolean>;

  /** Reset the state machine to RED for a new cycle. */
  reset(): void;
}

export type TDDState = 'RED' | 'GREEN' | 'REFACTOR';

export interface TDDEvent {
  type: 'test_written' | 'test_passing' | 'impl_complete' | 'refactor_done' | 'reset';
  payload?: Record<string, unknown>;
}

/**
 * Manages isolated git worktrees for parallel agent sessions.
 */
export interface WorktreeProvider {
  /** Create a new worktree for the given session. */
  create(sessionId: string, baseBranch: string): Promise<WorktreeInfo>;

  /** Check out a branch in an existing worktree. */
  checkout(worktreePath: string, branch: string): Promise<void>;

  /** Remove a worktree and clean up its directory. */
  cleanup(worktreePath: string): Promise<void>;

  /** List all active worktrees. */
  listAll(): Promise<WorktreeInfo[]>;
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  sessionId: string;
  locked: boolean;
}

/**
 * Gate rules enforced by OpenCode ACL.
 */
export const GateRules = {
  /** No code writes allowed during RED phase — only test file creation. */
  NO_WRITE_WITHOUT_RED: 'NO_WRITE_WITHOUT_RED',

  /** Switching branches during an active TDD cycle is forbidden. */
  NO_BRANCH_SWITCH: 'NO_BRANCH_SWITCH',

  /** Every LLM invocation must be traced for observability. */
  NO_LLM_WITHOUT_TRACE: 'NO_LLM_WITHOUT_TRACE',
} as const;

export type GateRule = (typeof GateRules)[keyof typeof GateRules];
