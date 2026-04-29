---
name: pipeline-orchestrator
description: Orchestrate the 6-stage ulw SDD+TDD pipeline from spec parsing to deployment
triggers:
  - "run pipeline"
  - "orchestrate pipeline"
  - "full SDD pipeline"
  - "6-stage pipeline"
  - "execute pipeline"
  - "start pipeline"
  - "run SDD TDD"
  - "deploy pipeline"
---

# SDD+TDD Pipeline Orchestrator

## Purpose
Orchestrate the full 6-stage SDD+TDD pipeline: Spec Parsing, Architecture Design, TDD Code Gen, Code Review, Automated Testing, and Deployment. The orchestrator manages stage transitions, retry logic with exponential backoff, artifact persistence to MinIO, gate checks (including human approval for production), and failure escalation. Each stage is run in sequence because later stages depend on the outputs of earlier ones. The orchestrator tracks pipeline state in a durable store so it can resume after interruption.

## Workflow

### Stage 1: Spec Parsing
1. Read the source Markdown specification from the configured input path.
2. Dispatch the `spec-parser` skill (via `task(subagent_type="build", load_skills=["spec-parsing"], ...)`).
3. Wait for the parser to write `pipeline/{pipelineId}/stage-1/structured-spec.json`.
4. Validate the output file exists, is valid JSON, and passes a sanity check (specId is a UUID, userStories is non-empty).
5. Store the artifact in MinIO at `pipeline/{pipelineId}/stage-1/structured-spec.json`.
6. On failure: retry up to 3 times with exponential backoff (1s, 4s, 16s). After 3 consecutive failures, mark pipeline FAILED.

### Stage 2: Architecture Design
1. Read `structured-spec.json` from the Stage 1 output path.
2. Analyze the spec to identify domain aggregates, entities, value objects, and bounded contexts based on the user stories and data models.
3. Produce an architecture plan document covering DDD aggregate roots, API contracts (refined from spec), data model migrations, and module dependency graph.
4. Write the plan to `pipeline/{pipelineId}/stage-2/architecture-plan.json`.
5. Store the artifact in MinIO at the same path.
6. On failure: retry up to 3 times with exponential backoff. After 3 consecutive failures, mark pipeline FAILED.

### Stage 3: TDD Code Generation
1. Read the architecture plan from Stage 2.
2. Dispatch code generation to OpenCode via the ACP (Agent Communication Protocol) with the TDD skill loaded (`load_skills=["tdd"]`).
3. Enforce the RED->GREEN->REFACTOR cycle:
   - **RED**: Generate a failing test first. Verify the test produces a clear, specific failure.
   - **GREEN**: Write minimal production code to pass the test. Verify all tests pass.
   - **REFACTOR**: Improve code structure while keeping all tests green. Run lint and typecheck.
4. Collect all generated source files, test files, and the TDD cycle report.
5. Write outputs to `pipeline/{pipelineId}/stage-3/` (source code archive + TDD report).
6. Store artifacts in MinIO.
7. On failure: retry up to 3 times with exponential backoff. After 3 consecutive failures, mark pipeline FAILED.

### Stage 4: Code Review
1. Read all generated code from Stage 3 and the structured spec from Stage 1.
2. Dispatch the 6-agent parallel review pipeline via `task(load_skills=["code-review"], ...)`:
   - Code Reviewer: logic, style, anti-patterns
   - Security Auditor: SAST, secrets scanning, dependency vulnerabilities
   - Contract Validator: OpenAPI compliance against the API contracts in the spec
   - Context Miner: git history, related issues, previous review findings
   - Domain Expert: DDD correctness, aggregate boundary alignment
   - Performance Reviewer: query patterns, N+1 detection, caching opportunities
3. Aggregate findings from all agents. Deduplicate overlapping issues. Normalize severity levels.
4. Evaluate against the active ReviewPolicy. Any `blocker`-severity finding that violates a blocking policy gates the pipeline.
5. Write the review report to `pipeline/{pipelineId}/stage-4/review-report.json`.
6. If status is `fail`, surface the blocking findings and stop. Do not advance to Stage 5.
7. On dispatch failure: retry up to 3 times with exponential backoff.

### Stage 5: Automated Testing
1. Read the generated code from Stage 3.
2. Run the full test suite in this order:
   - **Unit tests**: `pnpm test -- --coverage` — enforce minimum 80% line coverage. If below threshold, fail.
   - **Integration tests**: `pnpm test:integration` — test against real PostgreSQL, Redis, NATS containers. All must pass.
   - **Contract tests**: Run Pact contract verification against the API contracts from Stage 1. All interactions must match.
3. Collect test results, coverage reports, and any failure details.
4. Write the test report to `pipeline/{pipelineId}/stage-5/test-report.json`.
5. Store all reports and coverage artifacts in MinIO.
6. If any test suite fails, stop and do not advance. On infrastructure failure (container crash, network timeout), retry up to 3 times with exponential backoff.

### Stage 6: Deployment
1. Verify that all previous stages passed (gates are green).
2. **Human approval gate**: Display a pipeline summary to the user with:
   - Pipeline ID and duration so far
   - Stage statuses and artifact links for all 5 previous stages
   - Test coverage summary
   - Review finding count (critical, warning, info)
   - Deployment target environment and version
   - A prompt: `"Approve deployment to {environment}? Type 'yes' to proceed, 'no' to abort, or wait 30 minutes for auto-skip."`
3. Wait for approval. Timeout: 30 minutes. On timeout, mark stage SKIPPED and finish.
4. On approval, execute canary deployment:
   - Deploy to 10% of traffic. Monitor error rate, latency p99, and CPU/memory for 2 minutes.
   - If metrics healthy, promote to 25%. Monitor for 2 minutes.
   - If metrics healthy, promote to 50%. Monitor for 2 minutes.
   - If metrics healthy, promote to 100%. Monitor for 5 minutes stabilization.
   - At any step, if a metric exceeds its threshold, auto-rollback to the previous stable revision immediately.
5. Write the deployment report to `pipeline/{pipelineId}/stage-6/deployment-report.json`.
6. Store artifact in MinIO.

## Failure Handling
- Any stage failure triggers a retry with exponential backoff: 1 second, 4 seconds, 16 seconds (first, second, third retry).
- Three consecutive failures of the same stage marks the entire pipeline as FAILED. No further retries are attempted.
- A FAILED pipeline writes a terminal report to `pipeline/{pipelineId}/failure-report.json` with the failing stage, retry history, and last error message.
- The orchestrator does not skip failed stages. Each stage must pass before the next begins.
- Infrastructure failures (MinIO unreachable, agent timeout) count toward the retry budget. Non-retryable errors (schema validation failure, missing spec sections) fail immediately without retries.

## Gate Management
- Stage 6 (Deployment) requires human approval. No other stage requires approval.
- The approval prompt is shown with a full pipeline summary. The user may approve, reject, or let it time out.
- Approval timeout: 30 minutes. On timeout, the deployment stage is marked SKIPPED. The pipeline is not considered fully complete but prior stage outputs remain available.
- Rejected deployments are marked ABORTED. The pipeline ends in ABORTED state.
- The human approval decision is logged with a timestamp and, if available, a reason comment.

## Artifact Management
- All stage outputs are stored in MinIO at the path `pipeline/{pipelineId}/stage-{n}/`.
- Each artifact includes metadata: stage number, pipeline ID, timestamp, file hash (SHA-256), and originating tool version.
- Artifacts are immutable once written. Stage reruns overwrite with new artifact versions; the old version is retained with a timestamp suffix for audit trails.

## Tools
- **Read**: Read spec documents, architecture plans, code files, and review reports
- **Write**: Write pipeline state files, stage transition logs, and terminal reports
- **Bash**: Run test suites (`pnpm test`, `pnpm test:integration`), validation scripts, and deployment commands
- **task (ACP)**: Dispatch subagents for spec parsing, code generation, and code review with appropriate skill loads
- **LSP Diagnostics**: Verify generated code has no type errors before advancing from Stage 3

## Output
A pipeline summary report:
```json
{
  "pipelineId": "string (UUID)",
  "status": "running | completed | failed | aborted | skipped",
  "stages": {
    "stage-1": { "status": "passed | failed | skipped", "artifactPath": "string", "durationMs": 0, "retries": 0 },
    "stage-2": { "status": "passed | failed | skipped", "artifactPath": "string", "durationMs": 0, "retries": 0 },
    "stage-3": { "status": "passed | failed | skipped", "artifactPath": "string", "durationMs": 0, "retries": 0 },
    "stage-4": { "status": "passed | failed | skipped", "artifactPath": "string", "durationMs": 0, "retries": 0 },
    "stage-5": { "status": "passed | failed | skipped", "artifactPath": "string", "durationMs": 0, "retries": 0 },
    "stage-6": { "status": "passed | failed | skipped", "artifactPath": "string", "durationMs": 0, "retries": 0 }
  },
  "totalDurationMs": 0,
  "failureReason": "string | null",
  "deploymentResult": "deployed | rolled_back | not_attempted | skipped",
  "approvalId": "string | null",
  "approvalDecision": "approved | rejected | timed_out | null"
}
```
