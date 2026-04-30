# ulw (UltraWork) — SDD+TDD Pipeline Platform Design Document v2

> **Version**: v2.0
> **Date**: 2026-04-29
> **Status**: Draft
> **Target Team Scale**: 50+ developers
> **Target Deployment**: Kubernetes Cluster
> **Core Language**: TypeScript 5.7+
> **Architecture**: OpenClaw-centric SDD+TDD Pipeline (replaces v1 DDD microservices)

---

## Table of Contents

1. [Project Overview & Vision](#1-project-overview--vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Pipeline Stages](#3-pipeline-stages)
4. [Component Roles](#4-component-roles)
5. [Technology Stack](#5-technology-stack)
6. [Agent Architecture](#6-agent-architecture)
7. [Data Flow](#7-data-flow)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [OpenClaw Configuration](#9-openclaw-configuration)
10. [Contrast with v1 Architecture](#10-contrast-with-v1-architecture)
11. [Shared Packages (Retained from v1)](#11-shared-packages-retained-from-v1)
12. [Security & Governance](#12-security--governance)

---

## 1. Project Overview & Vision

### 1.1 Vision Statement

**ulw (UltraWork)** is an **SDD+TDD pipeline platform**. A user writes a Markdown specification document, commits it to a Git repository, and ulw produces production-ready, tested, and deployed code automatically—no manual coding required.

The platform transforms the software delivery lifecycle from a human-driven process into an agent-executed pipeline. The only human responsibility is writing clear, structured specifications in Markdown. Everything downstream—architecture design, TDD code generation, multi-agent code review, automated testing, and one-click deployment—is handled by the agent system.

### 1.2 What Changed from v1

The v1 architecture (documented in `docs/DESIGN.md`) modeled ulw as a DDD microservice platform: 6 bounded contexts communicating via NATS JetStream, orchestrated by a NestJS orchestrator, and backed by PostgreSQL with Drizzle ORM. That architecture was designed for human developers building traditional microservices.

v2 is simpler. ulw is no longer a microservice platform. It is a **pipeline platform** where OpenClaw serves as the central gateway and orchestration engine, and OpenCode acts as the TDD coding runtime. There are no bounded contexts, no NATS message bus, no PostgreSQL persistence, and no NestJS API gateway. Pipeline state is session-based, events are Zod-validated, and all artifacts are stored in MinIO.

**What stays**: The shared domain base classes (`Entity`, `ValueObject`, `AggregateRoot`, `Result<T,E>`) remain in `packages/shared/domain/` for use by the code that OpenCode generates. The testing infrastructure (Vitest, Playwright, Pact) and deployment tooling (Pulumi, ArgoCD, Helm) are unchanged. The agent identity model (SOUL.md, AGENTS.md, TOOLS.md) is preserved and extended.

### 1.3 Core Pipeline

```
Markdown Spec → Architecture Design → TDD Code Gen → Code Review → Automated Testing → One-Click Deploy
```

Every stage is executed by a specialized agent dispatched by OpenClaw. The user writes a spec document. OpenClaw picks it up, parses it, and drives the entire pipeline to completion.

### 1.4 Core Value Proposition

| Pain Point | ulw v2 Solution | Expected Impact |
|------------|----------------|-----------------|
| Manual coding from specs | OpenCode generates production TypeScript code via TDD (RED→GREEN→REFACTOR) from architecture plans | Zero manual coding for spec-compliant features |
| Architecture drift | Architecture agent produces contract-first design (DDD aggregates, API contracts, data models) before any code is written | Architecture enforced at spec stage |
| Slow, inconsistent code reviews | 6-agent review pipeline runs on every generated PR in 2–5 minutes | 90% reduction in review latency |
| Heavy testing burden | AI-generated test suites (unit + integration + contract + E2E) run automatically after code generation | 80% reduction in QA effort |
| Complex deployment rituals | 5-gate CI/CD pipeline with canary deployment and automatic rollback triggered by OpenClaw | Zero-touch production deploys |
| Spec-to-prod friction | OpenClaw bridges the gap: webhook triggers pipeline, agents execute stages, human only approves at gates | 70% cycle time reduction |

### 1.5 Target Users

The primary user of ulw v2 is a developer who writes specifications, not code.

| Persona | Role | Primary Interaction |
|---------|------|-------------------|
| **Spec Author** | Feature definer | Writes Markdown spec documents with acceptance criteria, data models, and API contracts; commits to Git |
| **Tech Lead** | Architecture reviewer, gate approver | Reviews AI-generated architecture plans; approves deployment gates |
| **QA Engineer** | Test strategy owner | Reviews AI-generated test scenarios; defines contract testing policies |
| **DevOps Engineer** | Pipeline operator | Manages Kubernetes infrastructure; monitors agent health; handles incident response |

### 1.6 North Star Metric

**End-to-end delivery cycle time**: from spec commit to production deployment, targeting 70% reduction from manual development baselines.

### 1.7 Design Principles

1. **Spec-Driven**: The Markdown spec is the single source of truth. No code is written without a spec. No spec is left unimplemented.
2. **Agent-First**: Every pipeline stage is agent-executable. Humans are reviewers and approvers, not doers.
3. **Contract-Driven**: All inter-component communication is governed by machine-readable contracts (OpenAPI, Protobuf, Zod event schemas).
4. **Test-First, Always**: All generated code follows TDD: RED (failing test) → GREEN (minimal passing code) → REFACTOR (clean code). Enforced at tool level by OpenCode's TDD runtime.
5. **Session-Based State**: Pipeline state is tracked in OpenClaw sessions, not in a relational database. Artifacts are persisted as JSON in MinIO.
6. **Observable by Default**: Every agent action produces immutable audit events; every pipeline stage emits metrics.

### 1.8 Platform Identity

ulw v2 is not a microservice platform. It is not an API gateway. It is not a message-driven distributed system.

ulw is a **pipeline platform**. OpenClaw is the engine. OpenCode is the coding assistant. The pipeline stages are the workflow. The user provides a spec and gets deployed code.

---

## 2. Architecture Overview

### 2.1 Central Architecture Pattern

The v2 architecture replaces the layered microservices model with a **pipeline-centric model**. OpenClaw sits at the center, receiving webhook triggers, dispatching agents through stages, and tracking pipeline state in its session system.

There is no NestJS API Gateway. There is no NATS message bus. There is no PostgreSQL database for pipeline state. Everything flows through OpenClaw.

```
                           ┌─────────────────────────────┐
                           │         GitHub Repo           │
                           │   User commits spec.md        │
                           └──────────────┬──────────────┘
                                          │ webhook (PR/push)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw Gateway                                      │
│                                                                                    │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Webhook        │  │ Pipeline        │  │ Agent            │  │ Session      │ │
│  │ Receiver       │→ │ Engine          │→ │ Dispatcher       │→ │ Manager      │ │
│  │ (GitHub,       │  │ (Stage dispatch,│  │ (ACP sub-session │  │ (State       │ │
│  │  GitLab,       │  │  gate approval, │  │  creation,       │  │  tracking,   │ │
│  │  manual CLI)   │  │  retry logic)   │  │  skill mapping)  │  │  artifact    │ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘  │  storage)    │ │
│                                                                  └──────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌────────────┐  ┌────────────┐  ┌────────────┐
          │ Storage    │  │ Cache      │  │ Auth       │
          │ (MinIO)    │  │ (Redis)    │  │ (Keycloak) │
          └────────────┘  └────────────┘  └────────────┘
                    │
                    │ ACP sub-sessions (per-stage)
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OpenCode Runtime                                       │
│                                                                                    │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ TDD Runtime    │  │ LSP Integration │  │ Git Worktree     │  │ Test Runner  │ │
│  │ (RED→GREEN→    │  │ (40+ language   │  │ Isolation        │  │ (Vitest,     │ │
│  │  REFACTOR      │  │  servers)       │  │ (parallel agent  │  │  Playwright, │ │
│  │  enforcement)  │  │                 │  │  safety)         │  │  Pact)       │ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Layers

There are three layers in v2, down from five in v1:

| Layer | v1 Component | v2 Component | Change |
|-------|-------------|-------------|--------|
| External Interfaces | Kong Ingress + NestJS API Gateway + REST + tRPC | OpenClaw Gateway (webhooks, CLI, API) | Consolidated into one engine |
| Orchestration | NestJS Orchestrator + Supervisor + Workflow Engine | OpenClaw Pipeline Engine + Session Manager | Eliminates separate orchestration services |
| Domain | 6 bounded contexts (PM, AD, CG, CR, TA, DP) | 6 pipeline stages (spec→architecture→code→review→test→deploy) | Contexts become stages; no domain services |
| Agent Runtime | ACL adapters to OpenCode/OpenClaw | OpenCode ACP sub-sessions + OpenClaw native agent dispatch | Direct integration, no intermediary ACL |
| Infrastructure | PostgreSQL, NATS, NestJS pods, API Gateway pod | OpenClaw pod, OpenCode job pods, MinIO, Redis, Keycloak | Removes 5 infrastructure services |

### 2.3 Component Interaction Model

OpenClaw receives a trigger (webhook, CLI, or scheduled cron). It creates a pipeline session, then dispatches agents sequentially through 6 stages. Each stage agent communicates with OpenCode via ACP (Agent Communication Protocol) sub-sessions when code generation or testing is needed. Stage results are stored as JSON artifacts in MinIO. The pipeline session tracks state and decides whether to advance, retry, or fail.

```
trigger → OpenClaw creates session → dispatches stage-1 agent → result stored → dispatches stage-2 → ... → stage-6 → deployment complete
```

There is no asynchronous message passing between stages (no NATS). Stages are sequential within a pipeline run. Parallelism happens within a stage—e.g., the code review stage dispatches 6 sub-agents concurrently.

### 2.4 Key v2 Simplifications

1. **No API Gateway**: OpenClaw handles webhooks, CLI, and API directly. No separate NestJS app with tRPC endpoints.
2. **No Message Bus**: Pipeline state is session-based. Events are emitted within OpenClaw sessions and persisted as artifacts. No NATS JetStream streams or consumers to manage.
3. **No Relational Database**: Pipeline state is ephemeral sessions + MinIO JSON artifacts. No PostgreSQL, no Drizzle ORM, no schema migrations for the pipeline itself. Generated application code may still use databases, but the platform does not.
4. **No Microservice Orchestration**: OpenClaw dispatches agents directly. No separate orchestrator/supervisor services communicating via events.
5. **No Bounded Contexts**: The 6 bounded contexts (PM, AD, CG, CR, TA, DP) become 6 pipeline stages. Agent specialization replaces domain modeling.

---

## 3. Pipeline Stages

The pipeline has 6 stages. Each stage has a well-defined purpose, input, processing model, output, responsible agent, and set of tools.

### 3.1 Stage Overview

| # | Stage | Agent | Input | Output | Duration |
|---|-------|-------|-------|--------|----------|
| 1 | Spec Parsing | spec-parser | Markdown spec file | Structured Spec (Zod-validated JSON) | < 10s |
| 2 | Architecture Design | architect | Structured Spec | Architecture Plan (DDD aggregates, API contracts, data models, file tree) | 30–120s |
| 3 | TDD Code Generation | tdd-coder | Architecture Plan | Generated TypeScript code in Git worktree (RED→GREEN→REFACTOR per module) | 60–300s |
| 4 | Code Review | reviewer (orchestrates 6 sub-agents) | Generated code | Review Report (findings by severity, pass/fail) | 120–300s |
| 5 | Automated Testing | tester | Code + Review Report | Test Results (unit, integration, contract, E2E) | 60–600s |
| 6 | One-Click Deployment | deployer | All green from previous stages | Deployed application in target environment | 60–300s |

### 3.2 Stage 1: Spec Parsing

**Purpose**: Transform a human-written Markdown specification into a structured, machine-readable format that downstream agents can consume.

**Input**:
- A Markdown specification file (`spec.md`) committed to the target Git repository
- The spec follows a defined template with sections for: Overview, User Stories, Acceptance Criteria, Data Models, API Contracts, Constraints

**Processing**:
1. OpenClaw webhook receives the push event and locates `spec.md` in the changed files
2. The spec-parser agent reads the Markdown content
3. The agent extracts structured information from each section using pattern matching and LLM parsing:
   - User stories → structured story objects with actors, actions, and acceptance criteria
   - Data models → entity definitions with fields, types, constraints, and relationships
   - API contracts → endpoint definitions with HTTP methods, paths, request/response schemas
   - Constraints → non-functional requirements (performance, security, compliance)
4. The extracted spec is validated against a Zod schema (`StructuredSpec`)
5. Validation failures are reported back to the user with line references in the original Markdown

**Output**:
- A `structured-spec.json` artifact stored in MinIO under `pipeline/{pipelineId}/stage-1/`
- A structured spec object containing:
  - `specId`: unique identifier for this spec
  - `userStories[]`: parsed user stories with acceptance criteria
  - `dataModels[]`: entity and value object definitions
  - `apiContracts[]`: endpoint specifications with request/response schemas
  - `constraints[]`: non-functional requirements
  - `sourceMetadata`: commit SHA, file path, author

**Responsible Agent**: `spec-parser`
**Tools Used**: Read (file reading), Markdown parsing, Zod schema validation

### 3.3 Stage 2: Architecture Design

**Purpose**: Transform the structured specification into a detailed architecture plan that defines the DDD tactical patterns, API contracts, data models, and module structure needed to implement the spec.

**Input**:
- `structured-spec.json` from Stage 1
- Existing codebase structure (if extending an existing project)
- Shared domain base classes from `@ulw/shared-domain` (Entity, ValueObject, AggregateRoot, Result<T,E>)

**Processing**:
1. The architect agent loads the structured spec and analyzes the requirements
2. It performs DDD tactical design:
   - **Aggregate identification**: Groups entities and value objects into aggregates based on transactional boundaries and invariants
   - **Bounded context mapping**: If multiple contexts are needed, defines context boundaries and integration patterns
   - **Domain event design**: Identifies domain events for inter-aggregate communication
3. It designs API contracts:
   - Defines REST endpoints or tRPC procedures for each user story
   - Specifies request/response schemas using TypeScript types or Zod schemas
   - Documents error responses and status codes
4. It designs the data persistence model:
   - Maps aggregates to database tables or document collections
   - Defines indexes, constraints, and migration strategy
5. It produces a **file tree plan**: a complete listing of all files to be generated, organized by:
   - `src/domain/` — aggregates, entities, value objects, domain events
   - `src/application/` — use cases, application services, DTOs
   - `src/infrastructure/` — repositories, external service adapters
   - `src/presentation/` — API controllers or tRPC routers
   - `test/unit/` — unit tests (one per aggregate/entity)
   - `test/integration/` — integration tests (one per use case)
   - `test/contract/` — Pact contract tests

**Output**:
- `architecture-plan.json` artifact stored in MinIO under `pipeline/{pipelineId}/stage-2/`
- Architecture plan containing:
  - `aggregates[]`: aggregate definitions with root entities, child entities, value objects, invariants
  - `apiContracts[]`: detailed API endpoint specifications with Zod schemas
  - `dataModels[]`: persistence models with table/collection definitions
  - `fileTree[]`: ordered list of files to generate with module path and description
  - `dependencyGraph`: import/export relationships between modules
  - `tddPlan`: per-file TDD plan with test-first ordering hints

**Responsible Agent**: `architect`
**Tools Used**: Read (existing codebase), Write (plan artifact), LSP (codebase analysis), DDD tactical pattern knowledge

### 3.4 Stage 3: TDD Code Generation

**Purpose**: Generate production-ready TypeScript code following strict TDD discipline: RED (write failing test) → GREEN (write minimal passing code) → REFACTOR (clean up), using OpenCode as the coding runtime.

**Input**:
- `architecture-plan.json` from Stage 2
- Shared domain base classes from `@ulw/shared-domain`
- Project configuration (tsconfig, ESLint, Vitest config)

**Processing**:
OpenClaw dispatches the `tdd-coder` agent which creates an ACP sub-session to OpenCode. OpenCode enforces the TDD cycle per file:

1. **File-by-file iteration**: The agent processes files in the order specified by the `tddPlan` in the architecture plan. Domain entities come first, then application services, then infrastructure, then presentation.
2. **RED phase** (per file):
   - OpenCode writes the test file first (e.g., `test/unit/user.test.ts`)
   - The test is executed. It must fail. If it passes, the test is invalid and the agent rewrites it.
   - The failing test output is captured as evidence
3. **GREEN phase** (per file):
   - OpenCode writes the minimal production code to make the test pass
   - The test suite is executed. All tests must pass (new + existing).
   - If tests fail, OpenCode iterates on the implementation
4. **REFACTOR phase** (per file):
   - OpenCode refactors the code to eliminate duplication, improve naming, and apply patterns
   - Tests must continue to pass after refactoring
   - Lint checks must pass (ESLint + Oxlint)
   - TypeScript type checking must pass (`tsc --noEmit`)
5. **Git commit**: After each successful file, the agent commits the test + code to the Git worktree with a conventional commit message
6. **Cross-file verification**: After all files are generated, the full test suite runs. Integration tests must pass. Contract tests must compile.

**Output**:
- Git worktree with a branch containing all generated commits
- `tdd-trace.json` artifact stored in MinIO under `pipeline/{pipelineId}/stage-3/`:
  - Per-file records of RED→GREEN→REFACTOR transitions
  - Test pass/fail evidence (test output captures)
  - Timing data per phase
  - Lint and type-check pass evidence
- The generated code itself (multiple TypeScript files)

**Responsible Agent**: `tdd-coder`
**Tools Used**: OpenCode (ACP sub-session), Vitest (test runner), LSP (type checking, linting), Git worktree (isolation), Write (code generation), Bash (test execution)

**TDD Enforcement Rules**:
1. No production file may be written before its corresponding test file exists and has been executed (failing)
2. Every test file must have at least one assertion before a production file is written
3. Lint and type-check must pass before a file is considered complete
4. Full test suite must pass before the stage is marked complete
5. If OpenCode attempts to bypass TDD (write code before test), the session is flagged and retried

### 3.5 Stage 4: Code Review

**Purpose**: Perform a comprehensive, multi-dimensional review of the generated code to identify issues before they reach testing. The review runs 6 sub-agents in parallel, each checking a different quality dimension.

**Input**:
- Git worktree branch from Stage 3
- Generated code (all files)
- Architecture plan from Stage 2 (for compliance checking)

**Processing**:
OpenClaw dispatches the `reviewer` agent, which orchestrates 6 parallel sub-agents:

1. **Static Analysis Agent** (`static-analyzer`):
   - Runs ESLint, Oxlint, and TypeScript compiler
   - Checks for unused variables, unreachable code, type issues
   - Produces lint and type findings

2. **Security Auditor Agent** (`security-auditor`):
   - Scans for hardcoded secrets, SQL injection patterns, XSS vulnerabilities
   - Checks dependency versions against CVE databases
   - Validates authentication and authorization patterns

3. **Architecture Compliance Agent** (`architecture-checker`):
   - Verifies generated code matches the architecture plan
   - Checks aggregate boundaries are respected (no cross-aggregate direct references)
   - Validates API contracts match the designed schemas

4. **Style Guide Agent** (`style-checker`):
   - Enforces project coding conventions (naming, file structure, import order)
   - Checks commenting and documentation standards
   - Validates conventional commit message format

5. **Dependency Checker Agent** (`dependency-checker`):
   - Validates imports are allowed (no circular dependencies)
   - Checks package.json dependencies are used and correctly versioned
   - Ensures no accidental coupling between modules

6. **Contract Validator Agent** (`contract-validator`):
   - Validates Pact consumer/provider contracts
   - Checks OpenAPI spec consistency
   - Validates Zod schema definitions match documented types

Each sub-agent produces findings categorized by severity: `critical`, `high`, `medium`, `low`, `info`.

The reviewer agent aggregates all findings into a review report. If any `critical` findings exist, the pipeline **fails** the stage and reports back to the user. If only `high` or below findings exist, the stage **passes with warnings**. If no findings exist, the stage **passes clean**.

**Output**:
- `review-report.json` artifact stored in MinIO under `pipeline/{pipelineId}/stage-4/`
- Review report containing:
  - `summary`: total findings by severity, pass/fail status
  - `findings[]`: individual findings with file path, line, column, severity, check type, message, suggestion
  - `subAgentReports[]`: per-sub-agent detailed reports
  - `passCriteria`: whether critical/high thresholds were met

**Responsible Agent**: `reviewer` (orchestrating 6 sub-agents)
**Tools Used**: OpenCode (ACP sub-sessions for each sub-agent), LSP, ESLint, Oxlint, npm audit, Pact CLI

### 3.6 Stage 5: Automated Testing

**Purpose**: Execute a comprehensive test suite across four testing levels: unit, integration, contract, and end-to-end. Every test must pass before deployment can proceed.

**Input**:
- Generated code from Stage 3 (with Stage 4 review findings addressed)
- Test files generated during Stage 3 TDD cycle
- Architecture plan for contract test configuration

**Processing**:
The `tester` agent runs tests in a defined order, stopping if a lower-level test fails:

1. **Unit Tests** (Vitest):
   - Executes all `test/unit/**/*.test.ts` files
   - Verifies domain logic, entity invariants, value object behavior
   - Must achieve ≥ 80% line coverage, ≥ 90% branch coverage on domain code
   - Results captured per-test with pass/fail and duration

2. **Integration Tests** (Vitest):
   - Executes all `test/integration/**/*.test.ts` files
   - Verifies use cases, repository implementations, external service adapters
   - Test containers (Docker) spin up for databases, message brokers as needed
   - Must achieve ≥ 70% line coverage on application/infrastructure layers

3. **Contract Tests** (Pact):
   - Runs consumer contract tests against generated Pact files
   - Runs provider verification against running application instance
   - Validates API contracts match between consumer and provider
   - Fails if any contract is broken (consumer expects field not provided, etc.)

4. **End-to-End Tests** (Playwright):
   - Spins up the full application in a test environment
   - Runs Playwright scripts that simulate user journeys defined in acceptance criteria
   - Captures screenshots of failures for debugging
   - Validates critical user flows end-to-end

**Output**:
- `test-results.json` artifact stored in MinIO under `pipeline/{pipelineId}/stage-5/`
- Test results containing:
  - `unit`: test count, pass/fail, coverage percentages, per-file results
  - `integration`: test count, pass/fail, coverage percentages, per-use-case results
  - `contract`: Pact verification results, broken contracts list
  - `e2e`: Playwright results, screenshots of failures, user journey pass/fail
  - `summary`: overall pass/fail, test duration, coverage summary

**Responsible Agent**: `tester`
**Tools Used**: Vitest (unit + integration), Playwright (E2E), Pact (contract), Docker (test containers), OpenCode (ACP for test result analysis)

### 3.7 Stage 6: One-Click Deployment

**Purpose**: Deploy the fully tested and reviewed code to production using a progressive rollout strategy. The user approves the deployment, then the system handles the rest.

**Input**:
- All-green test results from Stage 5
- All-green review report from Stage 4
- Generated code branch from Stage 3
- Infrastructure configuration (Helm chart, Pulumi stack)

**Processing**:
1. **Gate Check**: OpenClaw verifies all previous stages passed. If not, deployment is blocked.
2. **User Approval**: OpenClaw notifies the user (via GitHub PR comment, Slack, or CLI) that the pipeline is ready for deployment. The user must approve. This is the only manual gate in the pipeline.
3. **Canary Deployment**:
   - The deployer agent creates a canary release (e.g., 5% traffic)
   - Health metrics are monitored: error rate, latency, throughput
   - Canary validation rules are checked (defined in deployment config)
4. **Canary Validation Period** (default: 10 minutes):
   - If metrics are healthy: proceed to full rollout
   - If metrics degrade: automatic rollback triggered
5. **Full Rollout**:
   - Traffic is gradually shifted to 100% (e.g., 25% → 50% → 100%)
   - ArgoCD syncs the Kubernetes deployment
   - Health checks confirm the deployment is stable
6. **Post-Deployment Verification**:
   - Smoke tests run against production
   - Canary metrics are monitored for an additional observation period
7. **Notification**: User is notified of deployment completion with links to dashboards

**Output**:
- `deployment-result.json` artifact stored in MinIO under `pipeline/{pipelineId}/stage-6/`
- Deployment result containing:
  - `environment`: target environment (staging, production)
  - `version`: deployed version tag
  - `canaryResult`: canary metrics, validation pass/fail
  - `rolloutStatus`: percentage deployed, time to full rollout
  - `verificationResults`: smoke test pass/fail, post-deploy health
  - `rollbackInfo`: null if no rollback; rollback reason and time if triggered

**Responsible Agent**: `deployer`
**Tools Used**: Pulumi (IaC), Helm (chart deployment), ArgoCD (GitOps sync), kubectl (cluster interaction), Prometheus (metrics), OpenCode (ACP for deployment script generation)

### 3.8 Pipeline Failure Handling

When any stage fails:
1. The pipeline session records the failure with the stage number, error details, and relevant logs
2. OpenClaw notifies the user with a summary of the failure and suggested remediation
3. The user can fix the issue (e.g., update the spec, approve a manual code change) and trigger a **retry** from the failed stage
4. Retries resume from the failed stage; previous stage outputs are reused
5. After 3 sequential failures at the same stage, the pipeline is marked as `abandoned` and requires manual intervention

---

## 4. Component Roles

This section defines each major component in the v2 architecture: its responsibilities, interfaces, and interactions.

### 4.1 OpenClaw Gateway

OpenClaw is the **central engine** of the ulw platform. It replaces the NestJS API Gateway, Orchestrator, and Supervisor from v1.

**Core Responsibilities**:

| Function | Description |
|----------|-------------|
| **Webhook Receiver** | Listens for GitHub/GitLab webhooks (PR opened, push to main, spec file changed). Authenticates and validates incoming requests. Routes to pipeline engine. |
| **Pipeline Engine** | Manages the 6-stage pipeline. Dispatches stage agents in sequence. Tracks stage completion and gate decisions. Handles retries and failures. |
| **Agent Dispatcher** | Maps pipeline stages to agent identities. Creates ACP sub-sessions to OpenCode when stages require coding/testing. Manages agent concurrency limits. |
| **Session Manager** | Tracks pipeline state in OpenClaw sessions. Persists stage artifacts (JSON) to MinIO. Emits pipeline events. Provides query interface for pipeline status. |
| **Auth Integration** | Integrates with Keycloak for user authentication and authorization. Enforces that only authorized users can approve deployment gates. |
| **Notification** | Sends status updates via Slack, GitHub PR comments, or email. Notifies on stage completion, failure, and deployment readiness. |

**Interface**:
- **Inbound**: GitHub webhooks (HTTP POST), CLI commands (`ulw pipeline start`), HTTP API (status queries)
- **Outbound**: ACP sub-sessions to OpenCode, MinIO artifact writes, Redis caching, Keycloak auth checks
- **Configuration**: `openclaw.config.yml` (see Section 9)

### 4.2 OpenCode Runtime

OpenCode is the **TDD coding runtime**. It executes the actual code generation and testing work within isolated Git worktrees.

**Core Responsibilities**:

| Function | Description |
|----------|-------------|
| **TDD Runtime** | Enforces the RED→GREEN→REFACTOR cycle. Validates that tests are written first, tests fail before code, and tests pass after code. Records TDD trace evidence. |
| **LSP Integration** | Provides 40+ language server protocol integrations for TypeScript, JavaScript, JSON, YAML, Markdown, and more. Used for type checking, diagnostics, and code navigation during generation. |
| **Git Worktree Isolation** | Creates per-agent Git worktrees to isolate parallel agent operations. Each agent gets a clean working directory. Prevents file conflicts between concurrent agents. Commits generated code with conventional commit messages. |
| **Test Runner** | Integrates with Vitest, Playwright, and Pact for test execution. Captures test results and coverage data. Provides feedback to the TDD agent on test pass/fail status. |
| **Code Generation** | Generates TypeScript code files using LLM capabilities. Reads architecture plans, writes domain entities, application services, infrastructure adapters, and presentation code. |

**Interface**:
- **Inbound**: ACP sub-session commands from OpenClaw (create worktree, write files, run tests)
- **Outbound**: Test results, LSP diagnostics, commit SHAs, file contents
- **Isolation**: Each agent session gets its own worktree. No shared mutable state between agents.

### 4.3 Pipeline State Model

The pipeline state is a lightweight TypeScript model defined in `packages/pipeline/`. It is **not** a DDD aggregate—it is a plain data structure tracked in OpenClaw sessions and persisted as JSON in MinIO.

**Key Types** (conceptual, not implementation):

```
PipelineStage enum:
  SPEC_PARSING | ARCHITECTURE_DESIGN | TDD_CODE_GEN | CODE_REVIEW | AUTOMATED_TESTING | DEPLOYMENT

PipelineRun:
  pipelineId: string (UUID)
  specRef: { repo: string, commitSHA: string, filePath: string }
  status: PENDING | IN_PROGRESS | PASSED | FAILED | ABANDONED
  currentStage: PipelineStage
  stages: Map<PipelineStage, StageResult>
  startedAt: ISO8601
  completedAt: ISO8601 | null
  retryCount: number
  triggeredBy: string (user ID or webhook source)

StageResult:
  stage: PipelineStage
  status: PENDING | IN_PROGRESS | PASSED | FAILED | SKIPPED
  startedAt: ISO8601
  completedAt: ISO8601 | null
  artifactKeys: string[] (MinIO object keys)
  findings: Finding[] (for review stage)
  errorMessage: string | null
  retryCount: number
```

### 4.4 Shared Packages (Retained)

The following shared packages from v1 are retained for use by generated code and the pipeline:

| Package | Purpose | Retained? |
|---------|---------|-----------|
| `packages/shared/domain/` | DDD base classes: Entity, ValueObject, AggregateRoot, DomainEvent, Identifier, Result<T,E>, DomainError variants | **Yes** — used by generated domain code |
| `packages/shared/types/` | Shared TypeScript types and interfaces: AgentType, PipelineStage, Finding, ReviewSession, DomainEvent, aggregate definitions | **Refactored** — simplified for pipeline model; NATS topic constants removed |
| `packages/shared/events/` | Zod event schemas for pipeline events: StageStarted, StageCompleted, PipelineFailed, PipelineCompleted | **New** — replaces NATS subject enums with Zod-validated event types |
| `packages/shared/config/` | Configuration types and loaders: openclaw.config, pipeline defaults, agent settings | **Refactored** — now loads openclaw.config.yml |

**Removed**:
- `packages/bc/*` — bounded contexts (PM, AD, CG, CR, TA, DP) are replaced by pipeline stages
- `packages/core/*` — orchestrator and supervisor services are replaced by OpenClaw
- `apps/api-gateway/` — NestJS API Gateway is replaced by OpenClaw Gateway

### 4.5 ACL Interfaces

The Anti-Corruption Layer (ACL) interfaces define the contracts between ulw and external systems. These are pure TypeScript interfaces, not NestJS injectable services.

```
interface OpenCodeAdapter {
  createSession(spec: OpenCodeSessionSpec): Promise<SessionHandle>;
  writeFile(session: SessionHandle, path: string, content: string): Promise<void>;
  runCommand(session: SessionHandle, command: string): Promise<CommandResult>;
  getDiagnostics(session: SessionHandle): Promise<LSPDiagnostic[]>;
  closeSession(session: SessionHandle): Promise<void>;
}

interface OpenClawAdapter {
  dispatchAgent(agent: AgentIdentity, context: PipelineContext): Promise<AgentResult>;
  notifyUser(userId: string, message: Notification): Promise<void>;
  getSessionState(pipelineId: string): Promise<PipelineRun>;
}

interface GitAdapter {
  createWorktree(baseBranch: string): Promise<WorktreeHandle>;
  commit(worktree: WorktreeHandle, message: string): Promise<string>; // returns SHA
  push(worktree: WorktreeHandle, branch: string): Promise<void>;
  createPR(worktree: WorktreeHandle, title: string, body: string): Promise<string>; // returns PR URL
  removeWorktree(worktree: WorktreeHandle): Promise<void>;
}

interface CICDAdapter {
  triggerPipeline(environment: string, version: string): Promise<void>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
  rollback(deploymentId: string): Promise<void>;
}
```

---

## 5. Technology Stack

### 5.1 Stack Overview

The v2 technology stack is significantly simpler than v1. Several v1 technologies are removed because the architecture no longer needs them.

### 5.2 Retained Technologies

| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| TypeScript | 5.7+ | Primary language | Type safety, rich LSP support, broad ecosystem |
| Node.js | 22+ | Runtime | LTS, stable performance, native ESM support |
| pnpm | 9.x | Package manager | Fast, disk-efficient, strict dependency resolution |
| Zod | 3.23+ | Schema validation | TypeScript-first, composable schemas, ideal for pipeline event validation |
| Vitest | 3.x | Unit + integration testing | Fast, native ESM, compatible with Vite ecosystem, snapshot testing |
| Playwright | 1.50+ | End-to-end testing | Cross-browser, reliable auto-wait, trace viewer, screenshot capture |
| Pact | 4.x | Contract testing | Consumer-driven contracts, provider verification, CI/CD integration |
| Pulumi | 3.x | Infrastructure as Code | TypeScript-native IaC, no YAML DSL, reusable component model |
| Kubernetes | 1.32+ | Container orchestration | Industry standard, auto-scaling, self-healing, declarative |
| ArgoCD | 2.14+ | GitOps deployment | Automated sync from Git, drift detection, rollback support |
| Helm | 3.17+ | Kubernetes packaging | Templating, release management, hook system |
| Docker | latest | Containerization | Consistent environments, layer caching, broad adoption |
| MinIO | latest | Object storage (S3-compatible) | Lightweight, self-hosted, S3 API compatible, stores pipeline artifacts |
| Redis | 7+ | Cache + ephemeral state | Fast in-memory store, suitable for session caching and rate limiting |
| Keycloak | latest | Authentication + authorization | OpenID Connect, RBAC, user federation, self-hosted |
| OpenTelemetry | 1.9+ | Observability | Vendor-neutral tracing, metrics, logging |
| Prometheus | latest | Metrics collection | Pull-based, powerful query language, Kubernetes-native |
| Grafana | latest | Dashboards + alerting | Rich visualizations, Prometheus integration, alert management |
| ELK Stack | latest | Log aggregation | Elasticsearch for search, Logstash for ingestion, Kibana for visualization |
| Sentry | latest | Error tracking | Real-time error monitoring, stack traces, release tracking |
| GitHub Actions | latest | External CI/CD trigger | Tight GitHub integration, webhook-native, marketplace ecosystem |
| ESLint | 9.x | Linting | Pluggable, TypeScript-aware, auto-fix capabilities |
| Oxlint | 0.15+ | Fast linting | 50-100x faster than ESLint, used as first-pass filter |
| Prettier | 3.4+ | Code formatting | Opinionated, zero-config, consistent output |

### 5.3 Removed Technologies (from v1)

| Technology | v1 Purpose | Why Removed in v2 |
|-----------|-----------|-------------------|
| NestJS 10.x | API Gateway + microservice framework | Replaced by OpenClaw Gateway. No HTTP framework needed for internal pipeline operations. |
| tRPC 11.x | Type-safe internal API between microservices | No microservices exist. Agent communication uses ACP sub-sessions, not RPC calls. |
| PostgreSQL 16+ | Persistent pipeline state, domain events, bounded context data | Pipeline state is session-based (OpenClaw) + JSON artifacts (MinIO). No relational database needed for the platform itself. |
| Drizzle ORM 0.40.x | Database migrations and query building | No database to query. Removed with PostgreSQL. |
| NATS JetStream 2.10+ | Asynchronous message bus between bounded contexts | No bounded contexts. Pipeline stages are sequential within a session. Events are emitted within OpenClaw sessions. No message broker needed. |
| Kong / NGINX Ingress | External API routing, rate limiting, TLS termination | OpenClaw Gateway handles webhook routing directly. TLS termination handled at the Kubernetes ingress controller level. |

### 5.4 New Technologies

| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| OpenClaw | latest | Central pipeline engine + agent dispatcher | Native webhook handling, session management, ACP sub-sessions to OpenCode, pipeline orchestration. Replaces NestJS + NATS + tRPC. |
| OpenCode | latest | TDD coding runtime | TDD enforcement, LSP integration, Git worktree isolation, test runner integration. Direct ACP integration with OpenClaw. |
| openclaw.config.yml | — | Configuration format | Single YAML file defines webhooks, skills, agents, cron jobs. Simple, version-controlled, human-readable. |

### 5.5 Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| tsx | 4.19+ | TypeScript execution (dev mode) |
| tsup | 8.3+ | TypeScript bundling (production builds) |
| typescript-eslint | 8.x | TypeScript-aware ESLint rules |

---

## 6. Agent Architecture

### 6.1 Agent Design Philosophy

Agents in ulw v2 are **pipeline stage executors**, not bounded context stewards. Each agent is responsible for a single stage in the SDD+TDD pipeline. This replaces the v1 model where each bounded context (PM, AD, CG, CR, TA, DP) had a steward agent that operated continuously.

In v2, agents are **stateless** and **ephemeral**. They are instantiated when a pipeline stage starts and destroyed when the stage completes. All state is managed by the OpenClaw session, not the agent itself.

### 6.2 Agent-to-Stage Mapping

| Stage | Agent Name | Role | Sub-Agents |
|-------|-----------|------|------------|
| 1. Spec Parsing | `spec-parser` | Parse Markdown spec into structured JSON | None |
| 2. Architecture Design | `architect` | Design DDD aggregates, API contracts, data models, file tree | None |
| 3. TDD Code Generation | `tdd-coder` | Generate TypeScript code via RED→GREEN→REFACTOR | None (sequential file-by-file) |
| 4. Code Review | `reviewer` | Orchestrate 6-dimensional code review | `static-analyzer`, `security-auditor`, `architecture-checker`, `style-checker`, `dependency-checker`, `contract-validator` |
| 5. Automated Testing | `tester` | Execute unit, integration, contract, E2E tests | None (sequential test layers) |
| 6. Deployment | `deployer` | Canary deploy, validate, full rollout | None |

### 6.3 Agent Hierarchy

```
                        ┌──────────────────────────┐
                        │    Pipeline Orchestrator   │
                        │    (OpenClaw Gateway)      │
                        └─────────────┬────────────┘
                                      │ dispatches
          ┌───────────────┬───────────┼───────────┬───────────────┬───────────────┐
          ▼               ▼           ▼           ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐ ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  spec-   │   │  archi-  │  │  tdd-    │ │ reviewer │  │  tester  │  │ deployer │
    │  parser  │   │  tect    │  │  coder   │ │          │  │          │  │          │
    └──────────┘   └──────────┘  └──────────┘ └────┬─────┘  └──────────┘  └──────────┘
                                                   │ orchestrates
                     ┌───────────────┬───────────────┼───────────────┬───────────────┐
                     ▼               ▼               ▼               ▼               ▼               ▼
               ┌──────────┐  ┌──────────┐  ┌──────────────┐ ┌──────────┐  ┌──────────┐ ┌──────────────┐
               │ static-  │  │ security-│  │ architecture-│ │ style-   │  │dependency│ │  contract-   │
               │ analyzer │  │ auditor  │  │    checker   │ │ checker  │  │-checker  │ │  validator   │
               └──────────┘  └──────────┘  └──────────────┘ └──────────┘  └──────────┘ └──────────────┘
```

### 6.4 Agent Identity Model

Each agent is defined by three files, following the convention established in v1 and preserved in v2:

| File | Purpose | Example Content |
|------|---------|----------------|
| `SOUL.md` | Agent personality, principles, and behavioral constraints | Defines the agent's persona (e.g., "You are a meticulous code reviewer who never approves code with security vulnerabilities"). Includes ethical guidelines and non-negotiable rules. |
| `AGENTS.md` | Agent context, available tools, and pipeline stage instructions | Defines the agent's understanding of its pipeline stage, input/output contracts, tool access list, and communication protocols. |
| `TOOLS.md` | Tool usage instructions and safety constraints | Documents which tools the agent can use, how to invoke them, and safety boundaries (e.g., "NEVER delete files during review"). |

**Agent Directory Structure** (under `agents/`):

```
agents/
  spec-parser/
    SOUL.md
    AGENTS.md
    TOOLS.md
  architect/
    SOUL.md
    AGENTS.md
    TOOLS.md
  tdd-coder/
    SOUL.md
    AGENTS.md
    TOOLS.md
  reviewer/
    SOUL.md
    AGENTS.md
    TOOLS.md
    sub-agents/
      static-analyzer/
        SOUL.md
        AGENTS.md
        TOOLS.md
      security-auditor/
        SOUL.md
        AGENTS.md
        TOOLS.md
      architecture-checker/
        SOUL.md
        AGENTS.md
        TOOLS.md
      style-checker/
        SOUL.md
        AGENTS.md
        TOOLS.md
      dependency-checker/
        SOUL.md
        AGENTS.md
        TOOLS.md
      contract-validator/
        SOUL.md
        AGENTS.md
        TOOLS.md
  tester/
    SOUL.md
    AGENTS.md
    TOOLS.md
  deployer/
    SOUL.md
    AGENTS.md
    TOOLS.md
```

### 6.5 Agent Communication

Agents communicate through two mechanisms:

1. **Pipeline Context** (passed by OpenClaw): When a stage agent is dispatched, OpenClaw provides the pipeline context, which includes the outputs of all previous stages (as MinIO artifact references). The agent reads what it needs from MinIO.

2. **ACP Sub-Sessions** (for OpenCode): When an agent needs to generate or modify code, it creates an ACP sub-session to OpenCode. The sub-session provides an isolated Git worktree and access to the full OpenCode tool set (LSP, test runner, file operations).

There is **no direct agent-to-agent communication**. Agents do not send messages to each other. The pipeline is sequential: stage N only starts after stage N-1 completes successfully. The pipeline context bridges stages.

### 6.6 Agent Invocation Model

```
OpenClaw receives trigger
    │
    ▼
OpenClaw creates PipelineSession
    │
    ▼
OpenClaw dispatches stage-1 agent (spec-parser)
    │ Agent reads spec.md, produces structured-spec.json → stores in MinIO
    │ Agent reports completion to OpenClaw
    ▼
OpenClaw validates stage-1 output
    │
    ▼
OpenClaw dispatches stage-2 agent (architect)
    │ Agent reads structured-spec.json from MinIO
    │ Agent produces architecture-plan.json → stores in MinIO
    │ Agent reports completion to OpenClaw
    ▼
OpenClaw validates stage-2 output
    │
    ▼
OpenClaw dispatches stage-3 agent (tdd-coder)
    │ Agent creates ACP sub-session to OpenCode
    │ OpenCode performs TDD cycle per file → commits to Git worktree
    │ Agent stores tdd-trace.json in MinIO
    │ Agent reports completion (with branch ref) to OpenClaw
    ▼
... (continues through stages 4-6)
```

### 6.7 Skills Directory

Skills define reusable capabilities that agents can load. Skills remain in the `skills/` directory:

```
skills/
  spec-parsing/          — Markdown to structured spec parsing
  architecture-design/   — DDD tactical pattern design from specs
  tdd/                   — RED→GREEN→REFACTOR code generation workflow
  code-review/           — 6-agent review orchestration
  contract-validation/   — Pact contract testing workflow
  security-audit/        — Vulnerability scanning and secret detection
  test-generation/       — Automated test suite generation
  deployment/            — Canary rollout and verification
```

Skills are invoked by agents via OpenClaw's skill loading mechanism. A skill provides step-by-step instructions, tool configurations, and validation rules for a specific capability.

---

## 7. Data Flow

### 7.1 End-to-End Flow

The complete data flow from user writing a spec to deployed production code:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                         USER                                              │
│                                          │                                                │
│                          Writes spec.md │                                                │
│                          Commits to Git │                                                │
│                                         ▼                                                 │
│                              ┌──────────────────┐                                        │
│                              │   GitHub Repo    │                                        │
│                              │  spec.md commit  │                                        │
│                              └────────┬─────────┘                                        │
│                                       │ webhook (push event)                             │
└───────────────────────────────────────┼──────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    OpenClaw Gateway                                         │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Webhook Receiver validates payload, extracts commit SHA and spec.md path          │  │
│  │  2. Pipeline Engine creates PipelineRun, sets status=IN_PROGRESS                      │  │
│  │  3. Agent Dispatcher launches spec-parser agent                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─────────────────────── PIPELINE STAGES ──────────────────────────────────────────────┐  │
│  │                                                                                       │  │
│  │  STAGE 1: SPEC PARSING                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ spec-parser reads spec.md → parses sections → validates with Zod →            │    │  │
│  │  │ outputs structured-spec.json → stores in MinIO                               │    │  │
│  │  │ path: pipeline/{pipelineId}/stage-1/structured-spec.json                      │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  STAGE 2: ARCHITECTURE DESIGN                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ architect reads structured-spec.json from MinIO → designs DDD aggregates,    │    │  │
│  │  │ API contracts, data models, file tree → outputs architecture-plan.json       │    │  │
│  │  │ path: pipeline/{pipelineId}/stage-2/architecture-plan.json                    │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  STAGE 3: TDD CODE GENERATION                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ tdd-coder creates ACP sub-session to OpenCode                                │    │  │
│  │  │                                                                               │    │  │
│  │  │  ┌─────────────────────── OpenCode ───────────────────────────────────────┐  │    │  │
│  │  │  │  Git worktree: isolated branch for this pipeline run                   │  │    │  │
│  │  │  │                                                                         │  │    │  │
│  │  │  │  FOR EACH file in architecture-plan.fileTree:                          │  │    │  │
│  │  │  │    RED:   Write test file → run → must FAIL → capture output           │  │    │  │
│  │  │  │    GREEN: Write minimal production code → run tests → must PASS        │  │    │  │
│  │  │  │    REFACTOR: Clean code → run tests → must PASS → lint + typecheck     │  │    │  │
│  │  │  │    Git commit with conventional commit message                         │  │    │  │
│  │  │  │                                                                         │  │    │  │
│  │  │  │  Output: Generated TypeScript files + tdd-trace.json                   │  │    │  │
│  │  │  └────────────────────────────────────────────────────────────────────────┘  │    │  │
│  │  │                                                                               │    │  │
│  │  │  tdd-trace.json stored: pipeline/{pipelineId}/stage-3/tdd-trace.json         │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  STAGE 4: CODE REVIEW                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ reviewer dispatches 6 parallel sub-agents (each with ACP sub-session):       │    │  │
│  │  │                                                                               │    │  │
│  │  │  static-analyzer ──► Lint + type check findings                              │    │  │
│  │  │  security-auditor ─► Secret scan + CVE + auth pattern findings               │    │  │
│  │  │  architecture-checker ─► Plan compliance findings                            │    │  │
│  │  │  style-checker ──► Naming + convention findings                              │    │  │
│  │  │  dependency-checker ─► Import + circular dep findings                         │    │  │
│  │  │  contract-validator ─► Pact + OpenAPI findings                               │    │  │
│  │  │                                                                               │    │  │
│  │  │  Aggregated into review-report.json                                          │    │  │
│  │  │  path: pipeline/{pipelineId}/stage-4/review-report.json                       │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  STAGE 5: AUTOMATED TESTING                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ tester executes in order:                                                     │    │  │
│  │  │   1. Unit tests (Vitest) → must all pass + coverage ≥ 80%                    │    │  │
│  │  │   2. Integration tests (Vitest) → must all pass + coverage ≥ 70%             │    │  │
│  │  │   3. Contract tests (Pact) → must all verify                                 │    │  │
│  │  │   4. End-to-end tests (Playwright) → must all pass                           │    │  │
│  │  │                                                                               │    │  │
│  │  │  Outputs test-results.json                                                   │    │  │
│  │  │  path: pipeline/{pipelineId}/stage-5/test-results.json                        │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  STAGE 6: ONE-CLICK DEPLOYMENT                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ deployer checks all gates green → requests user approval →                   │    │  │
│  │  │ upon approval: canary deploy (5%) → monitor (10 min) → full rollout →       │    │  │
│  │  │ smoke test → notify user                                                     │    │  │
│  │  │                                                                               │    │  │
│  │  │  Outputs deployment-result.json                                              │    │  │
│  │  │  path: pipeline/{pipelineId}/stage-6/deployment-result.json                   │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  PIPELINE COMPLETION                                                                  │  │
│  │  PipelineRun.status = PASSED                                                          │  │
│  │  User notified via Slack / GitHub PR comment / email                                  │  │
│  │  All artifacts archived in MinIO for audit                                            │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Pipeline State Lifecycle

```
                    ┌──────────┐
                    │ PENDING   │  ← Initial state after trigger received
                    └─────┬────┘
                          │ OpenClaw starts pipeline
                          ▼
                    ┌──────────┐
                    │ IN_      │  ← Pipeline is executing stages
                    │ PROGRESS │
                    └─────┬────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │  PASSED  │ │  FAILED  │ │  ABANDONED   │
        │ (all     │ │ (stage   │ │ (3 retries   │
        │  stages  │ │  failed) │ │  exhausted)  │
        │  green)  │ │          │ │              │
        └──────────┘ └────┬─────┘ └──────────────┘
                          │
                          │ User fixes issue,
                          │ triggers retry
                          ▼
                    ┌──────────┐
                    │ IN_      │  ← Resumes from failed stage
                    │ PROGRESS │
                    └──────────┘
```

### 7.3 Event Flow

Pipeline events are Zod-validated and emitted within the OpenClaw session. They are persisted as JSON in MinIO for audit trails.

**Event Types**:

```
PipelineStarted:
  pipelineId: string
  specRef: { repo: string, commitSHA: string, filePath: string }
  triggeredBy: string
  timestamp: ISO8601

StageStarted:
  pipelineId: string
  stage: PipelineStage (enum)
  timestamp: ISO8601

StageCompleted:
  pipelineId: string
  stage: PipelineStage
  status: PASSED | FAILED
  artifactKeys: string[] (MinIO paths)
  durationMs: number
  timestamp: ISO8601

PipelineFailed:
  pipelineId: string
  failedStage: PipelineStage
  error: { message: string, details: object }
  retryCount: number
  timestamp: ISO8601

PipelineCompleted:
  pipelineId: string
  totalDurationMs: number
  stageDurations: Record<PipelineStage, number>
  deploymentUrl: string | null
  timestamp: ISO8601

UserApprovalRequested:
  pipelineId: string
  stage: 'DEPLOYMENT'
  message: string
  timestamp: ISO8601

UserApprovalReceived:
  pipelineId: string
  approvedBy: string
  timestamp: ISO8601
```

**Event Persistence**: Events are written to MinIO at `pipeline/{pipelineId}/events/{eventId}.json`. The event stream for a pipeline can be reconstructed by listing objects at `pipeline/{pipelineId}/events/`.

### 7.4 Artifact Storage Strategy

All pipeline artifacts are stored in MinIO with a consistent naming scheme:

```
pipeline/
  {pipelineId}/
    metadata.json                — PipelineRun state snapshot
    events/
      {timestamp}-{eventId}.json — Individual events
    stage-1/
      structured-spec.json       — Stage 1 output
    stage-2/
      architecture-plan.json     — Stage 2 output
    stage-3/
      tdd-trace.json             — Stage 3 TDD evidence
    stage-4/
      review-report.json         — Stage 4 review findings
      static-analyzer.json       — Sub-agent report
      security-auditor.json      — Sub-agent report
      architecture-checker.json  — Sub-agent report
      style-checker.json         — Sub-agent report
      dependency-checker.json    — Sub-agent report
      contract-validator.json    — Sub-agent report
    stage-5/
      test-results.json          — Stage 5 test results
      coverage/                  — Coverage reports (HTML, lcov)
      playwright-screenshots/    — E2E failure screenshots
    stage-6/
      deployment-result.json     — Stage 6 deployment result
```

### 7.5 Session vs. Persistence

| Aspect | Where Stored | Purpose |
|--------|-------------|---------|
| Pipeline state (current) | OpenClaw session (in-memory + Redis) | Fast state transitions, stage dispatch decisions |
| Pipeline state (historical) | MinIO `metadata.json` + event stream | Audit trail, debugging, metrics |
| Stage artifacts | MinIO (JSON) | Input for downstream stages, review evidence |
| Generated code | Git worktree (ephemeral during stage) → pushed to GitHub branch | Version control, PR creation |
| User notifications | Slack / GitHub / Email (external) | Human-readable status updates |

---

## 8. Infrastructure & Deployment

### 8.1 Kubernetes Deployment Topology

The v2 infrastructure is significantly simpler than v1. It consists of fewer long-running services and introduces ephemeral OpenCode job pods.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KUBERNETES CLUSTER                                       │
│                                                                                    │
│  ┌─────────────────────────── INGRESS ────────────────────────────────────────┐  │
│  │  NGINX Ingress Controller — TLS termination, webhook routing, rate limiting │  │
│  └────────────────────────────────┬────────────────────────────────────────────┘  │
│                                   │                                                 │
│  ┌────────────────────────────────┼────────────────────────────────────────────┐  │
│  │                       NAMESPACE: ulw-platform                                 │  │
│  │                                │                                               │  │
│  │  ┌─────────────────────────────┴──────────────────────────────────────────┐ │  │
│  │  │                         LONG-RUNNING SERVICES                            │ │  │
│  │  │                                                                          │ │  │
│  │  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────┐ │ │  │
│  │  │  │  OpenClaw        │  │  Redis       │  │  MinIO   │  │  Keycloak   │ │ │  │
│  │  │  │  Gateway Pod     │  │  Pod         │  │  Pod     │  │  Pod        │ │ │  │
│  │  │  │  (1 replica)     │  │  (1 replica) │  │  (1 rep) │  │  (1 rep)    │ │ │  │
│  │  │  │  Port: 8080      │  │  Port: 6379  │  │  :9000   │  │  :8443      │ │ │  │
│  │  │  └──────────────────┘  └──────────────┘  └──────────┘  └─────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         EPHEMERAL JOB PODS                                 │ │  │
│  │  │                                                                          │ │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │  │
│  │  │  │  OpenCode Job    │  │  OpenCode Job    │  │  OpenCode Job         │ │ │  │
│  │  │  │  (tdd-coder)     │  │  (review sub-    │  │  (tester)             │ │ │  │
│  │  │  │                  │  │   agents x6)     │  │                       │ │ │  │
│  │  │  │  Creates:        │  │  Creates:        │  │  Creates:             │ │ │  │
│  │  │  │  - Git worktree  │  │  - Per-agent     │  │  - Test containers    │ │ │  │
│  │  │  │  - Commits       │  │    worktrees     │  │  - Coverage reports   │ │ │  │
│  │  │  │                  │  │  - Review reports│  │                       │ │ │  │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌─────────────────────────── OBSERVABILITY ──────────────────────────────────────┐   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │   │
│  │  │Prometheus│  │ Grafana  │  │   ELK    │  │  Sentry  │  │ OpenTelemetry│    │   │
│  │  │  Pod     │  │  Pod     │  │  Stack   │  │  Pod     │  │  Collector   │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Pod Lifecycle

| Pod | Type | Lifecycle | Scaling |
|-----|------|-----------|---------|
| OpenClaw Gateway | Deployment | Always running | 1 replica (stateful session management; horizontal scaling TBD) |
| Redis | Deployment | Always running | 1 replica (or Sentinel for HA) |
| MinIO | Deployment | Always running | 1 replica (or distributed mode for HA) |
| Keycloak | Deployment | Always running | 1 replica |
| OpenCode Job (TDD) | Job | Ephemeral (created per stage 3) | 1 per pipeline run |
| OpenCode Job (Review) | Job | Ephemeral (created per stage 4) | 1 per pipeline run (runs 6 sub-agents within) |
| OpenCode Job (Test) | Job | Ephemeral (created per stage 5) | 1 per pipeline run |
| Prometheus | Deployment | Always running | 1 replica |
| Grafana | Deployment | Always running | 1 replica |
| ELK Stack | StatefulSet | Always running | As needed |
| Sentry | Deployment | Always running | 1 replica |
| OpenTelemetry Collector | DaemonSet | Always running | 1 per node |

### 8.3 Infrastructure as Code

The v2 infrastructure uses the same IaC tools as v1 (Pulumi + Helm), with a simplified stack:

**Pulumi Stack** (TypeScript):
- Kubernetes cluster provisioning (cloud-agnostic via Pulumi Kubernetes provider)
- Namespace creation: `ulw-platform`
- Long-running services: OpenClaw Gateway, Redis, MinIO, Keycloak
- Observability stack: Prometheus, Grafana, ELK, Sentry, OpenTelemetry Collector
- Job templates for OpenCode pods
- Ingress rules for webhook routing

**Helm Charts** (under `infrastructure/helm/`):
- `openclaw-gateway/` — OpenClaw Gateway deployment with config volume mount for `openclaw.config.yml`
- `redis/` — Redis deployment (or uses Bitnami Redis chart as dependency)
- `minio/` — MinIO deployment (or uses MinIO Operator chart)
- `keycloak/` — Keycloak deployment (or uses Bitnami Keycloak chart)
- `opencode-job/` — Template for ephemeral OpenCode job pods
- `observability/` — Umbrella chart for Prometheus, Grafana, ELK, Sentry

### 8.4 Docker Compose (Local Development)

For local development, a simplified `docker-compose.yml` provides the minimal services needed:

```yaml
services:
  openclaw:
    image: openclaw-gateway:latest
    ports:
      - "8080:8080"
    volumes:
      - ./openclaw.config.yml:/etc/openclaw/config.yml
    depends_on:
      - redis
      - minio
      - keycloak

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data
    environment:
      MINIO_ROOT_USER: ulw-admin
      MINIO_ROOT_PASSWORD: changeme

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    ports:
      - "8443:8443"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: changeme
    command: start-dev
```

**Note**: The v2 Docker Compose no longer includes PostgreSQL or NATS. These were removed because pipeline state is session-based and agent communication does not use a message bus.

### 8.5 CI/CD Integration (GitHub Actions)

The GitHub Actions workflow triggers the pipeline via OpenClaw webhook:

```yaml
# .github/workflows/ulw-pipeline.yml
name: ulw Pipeline Trigger

on:
  push:
    paths:
      - 'specs/**/*.md'
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'specs/**/*.md'

jobs:
  trigger-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Notify OpenClaw
        run: |
          curl -X POST https://ulw.example.com/webhook/github \
            -H "Content-Type: application/json" \
            -H "X-Hub-Signature-256: ${{ github.event.signature }}" \
            -d '{"event": "${{ github.event_name }}", "repo": "${{ github.repository }}", "sha": "${{ github.sha }}"}'
```

### 8.6 Removed v1 Infrastructure

The following v1 infrastructure components are removed:

| v1 Component | Reason Removed |
|-------------|---------------|
| NestJS API Gateway Pod | Replaced by OpenClaw Gateway |
| Orchestrator Pod | Orchestration is now handled by OpenClaw Pipeline Engine |
| Supervisor Pod | State management is now handled by OpenClaw Session Manager |
| PostgreSQL Pod | No relational database needed for pipeline state |
| NATS Pod | No message bus needed; stages are sequential within session |
| NATS Streams/Consumers | No async event-driven communication between services |

---

## 9. OpenClaw Configuration

### 9.1 Configuration File

All OpenClaw behavior is configured through a single `openclaw.config.yml` file. This replaces the multiple configuration files used in v1 (NestJS config modules, NATS config, tRPC config, per-BC config).

### 9.2 Complete Configuration Reference

```yaml
# openclaw.config.yml — ulw Platform Configuration v2

# ─── Server ───────────────────────────────────────────────────────
server:
  host: "0.0.0.0"
  port: 8080
  tls:
    enabled: true
    certFile: "/etc/ssl/certs/ulw.crt"
    keyFile: "/etc/ssl/private/ulw.key"

# ─── Webhooks ─────────────────────────────────────────────────────
webhooks:
  github:
    enabled: true
    path: "/webhook/github"
    secret: "${GITHUB_WEBHOOK_SECRET}"  # from environment
    events:
      - push        # triggers pipeline on push
      - pull_request  # triggers review-focused pipeline
    filter:
      paths:
        - "specs/**/*.md"   # only trigger for spec file changes
      branches:
        - "main"
        - "feature/**"

  gitlab:
    enabled: false  # disabled until needed
    path: "/webhook/gitlab"
    secret: "${GITLAB_WEBHOOK_SECRET}"

  manual:
    enabled: true
    # CLI: ulw pipeline start --spec <path>

# ─── Pipeline ─────────────────────────────────────────────────────
pipeline:
  stages:
    - name: "spec-parsing"
      agent: "spec-parser"
      timeout: 60s
      retry:
        maxAttempts: 2
        backoff: exponential
      gate:
        requiresApproval: false

    - name: "architecture-design"
      agent: "architect"
      timeout: 180s
      retry:
        maxAttempts: 2
        backoff: exponential
      gate:
        requiresApproval: false

    - name: "tdd-code-generation"
      agent: "tdd-coder"
      timeout: 600s
      retry:
        maxAttempts: 1
        backoff: fixed
      gate:
        requiresApproval: false
      opencode:
        sessionMode: "acp"          # ACP sub-session to OpenCode
        worktreeBase: "main"        # base branch for Git worktree
        enforceTDD: true            # must follow RED→GREEN→REFACTOR

    - name: "code-review"
      agent: "reviewer"
      timeout: 360s
      retry:
        maxAttempts: 1
        backoff: fixed
      gate:
        requiresApproval: false
      subAgents:
        parallel: true              # run 6 sub-agents concurrently
        list:
          - static-analyzer
          - security-auditor
          - architecture-checker
          - style-checker
          - dependency-checker
          - contract-validator
      thresholds:
        maxCriticalFindings: 0      # fail if any critical
        maxHighFindings: 5          # warn if more than 5 high

    - name: "automated-testing"
      agent: "tester"
      timeout: 1200s
      retry:
        maxAttempts: 1
        backoff: fixed
      gate:
        requiresApproval: false
      coverage:
        unit:
          lines: 80
          branches: 90
        integration:
          lines: 70
          branches: 70

    - name: "one-click-deployment"
      agent: "deployer"
      timeout: 600s
      retry:
        maxAttempts: 0  # no auto-retry for deployment; manual approval gate
      gate:
        requiresApproval: true       # user must approve before deploy
        approvers:
          - role: tech-lead
        timeout: 3600s              # approval window: 1 hour
      canary:
        percentage: 5               # initial canary traffic %
        duration: 600s              # validation period: 10 minutes
        metrics:
          - name: error_rate
            threshold: 1.0           # max 1% error rate
          - name: p95_latency_ms
            threshold: 500           # max 500ms p95 latency
      rollout:
        strategy: "gradual"          # gradual: 25% → 50% → 100%
        stepDuration: 120s           # 2 minutes per step

# ─── Agent Identities ─────────────────────────────────────────────
agents:
  spec-parser:
    identityPath: "agents/spec-parser/"
    skills:
      - spec-parsing
    tools:
      - Read
      - Write
      - Bash

  architect:
    identityPath: "agents/architect/"
    skills:
      - architecture-design
      - tdd
    tools:
      - Read
      - Write
      - LSP

  tdd-coder:
    identityPath: "agents/tdd-coder/"
    skills:
      - tdd
    tools:
      - Read
      - Write
      - Bash
      - LSP
      - GitWorktree
    opencode:
      enabled: true                  # this agent runs via OpenCode ACP
      lspServers:
        - typescript
        - json
        - yaml
        - markdown

  reviewer:
    identityPath: "agents/reviewer/"
    skills:
      - code-review
    tools:
      - Read
      - LSP
    subAgents:
      static-analyzer:
        identityPath: "agents/reviewer/sub-agents/static-analyzer/"
        skills: [code-review]
        tools: [Read, Bash, LSP]
      security-auditor:
        identityPath: "agents/reviewer/sub-agents/security-auditor/"
        skills: [security-audit]
        tools: [Read, Bash]
      architecture-checker:
        identityPath: "agents/reviewer/sub-agents/architecture-checker/"
        skills: [code-review]
        tools: [Read, LSP]
      style-checker:
        identityPath: "agents/reviewer/sub-agents/style-checker/"
        skills: [code-review]
        tools: [Read, LSP]
      dependency-checker:
        identityPath: "agents/reviewer/sub-agents/dependency-checker/"
        skills: [code-review]
        tools: [Read, Bash]
      contract-validator:
        identityPath: "agents/reviewer/sub-agents/contract-validator/"
        skills: [contract-validation]
        tools: [Read, Bash]

  tester:
    identityPath: "agents/tester/"
    skills:
      - test-generation
    tools:
      - Read
      - Bash
      - Write
    opencode:
      enabled: true
      testRunners:
        - vitest
        - playwright
        - pact

  deployer:
    identityPath: "agents/deployer/"
    skills:
      - deployment
    tools:
      - Read
      - Bash
      - Write

# ─── Skills ───────────────────────────────────────────────────────
skills:
  spec-parsing:
    path: "skills/spec-parsing/"
    description: "Parse Markdown specs into Zod-validated structured JSON"

  architecture-design:
    path: "skills/architecture-design/"
    description: "Design DDD aggregates, API contracts, and data models from structured specs"

  tdd:
    path: "skills/tdd/"
    description: "Execute RED→GREEN→REFACTOR TDD cycle via OpenCode"

  code-review:
    path: "skills/code-review/"
    description: "Orchestrate 6-agent parallel code review pipeline"

  contract-validation:
    path: "skills/contract-validation/"
    description: "Validate Pact contracts and OpenAPI specs"

  security-audit:
    path: "skills/security-audit/"
    description: "Scan for secrets, CVEs, and auth vulnerabilities"

  test-generation:
    path: "skills/test-generation/"
    description: "Generate and execute unit, integration, contract, and E2E tests"

  deployment:
    path: "skills/deployment/"
    description: "Execute canary deployment and progressive rollout"

# ─── Storage ──────────────────────────────────────────────────────
storage:
  minio:
    endpoint: "minio.ulw-platform.svc.cluster.local:9000"
    accessKey: "${MINIO_ACCESS_KEY}"
    secretKey: "${MINIO_SECRET_KEY}"
    bucket: "ulw-pipelines"
    useSSL: false                 # internal cluster communication
    region: "us-east-1"

# ─── Cache ────────────────────────────────────────────────────────
cache:
  redis:
    host: "redis.ulw-platform.svc.cluster.local"
    port: 6379
    password: "${REDIS_PASSWORD}"
    db: 0
    ttl:
      session: 86400              # 24 hours
      agentState: 3600            # 1 hour

# ─── Auth ─────────────────────────────────────────────────────────
auth:
  keycloak:
    url: "https://keycloak.ulw-platform.svc.cluster.local:8443"
    realm: "ulw"
    clientId: "ulw-gateway"
    clientSecret: "${KEYCLOAK_CLIENT_SECRET}"
  roles:
    pipeline-admin: ["manage:pipeline", "view:pipeline"]
    spec-author: ["create:spec", "view:pipeline"]
    gate-approver: ["approve:gate", "view:pipeline"]
    viewer: ["view:pipeline"]

# ─── Cron Jobs ────────────────────────────────────────────────────
cron:
  - name: "nightly-security-scan"
    schedule: "0 3 * * *"         # 3 AM daily
    action: "security-audit"
    target: "all-active-repos"

  - name: "weekly-dependency-update"
    schedule: "0 4 * * 1"         # 4 AM every Monday
    action: "dependency-check"
    target: "all-active-repos"

  - name: "pipeline-artifact-cleanup"
    schedule: "0 5 * * 0"         # 5 AM every Sunday
    action: "cleanup"
    retention:
      passed: 30d                 # keep passed pipeline artifacts for 30 days
      failed: 90d                 # keep failed pipeline artifacts for 90 days

# ─── Notifications ────────────────────────────────────────────────
notifications:
  slack:
    enabled: true
    webhookUrl: "${SLACK_WEBHOOK_URL}"
    channel: "#ulw-pipeline"
    events:
      - pipeline.started
      - pipeline.completed
      - pipeline.failed
      - stage.needsApproval

  github:
    enabled: true
    events:
      - pipeline.completed
      - pipeline.failed
      - stage.needsApproval
    createPRComment: true         # post status as PR comment

  email:
    enabled: false
    smtp:
      host: "${SMTP_HOST}"
      port: 587

# ─── Observability ────────────────────────────────────────────────
observability:
  tracing:
    exporter: "otlp"
    endpoint: "otel-collector.ulw-platform.svc.cluster.local:4317"
  metrics:
    exporter: "prometheus"
    port: 9090
  logging:
    level: "info"
    format: "json"
    output: "stdout"
```

### 9.3 Configuration Management

- The `openclaw.config.yml` file is stored in the repository root
- Sensitive values (secrets, passwords, tokens) use `${ENV_VAR}` substitution and are injected via Kubernetes Secrets
- Configuration changes are version-controlled and trigger a rolling update of the OpenClaw Gateway pod
- Environment-specific overrides can be placed in `openclaw.config.{env}.yml` (e.g., `openclaw.config.staging.yml`)

---

## 10. Contrast with v1 Architecture

### 10.1 Conceptual Shift

| Dimension | v1 (DESIGN.md) | v2 (DESIGN_v2.md) |
|-----------|---------------|-------------------|
| **Architectural Style** | Layered microservices with DDD bounded contexts | Pipeline-centric with stage-based agents |
| **Central Engine** | NestJS Orchestrator + NestJS Supervisor | OpenClaw Gateway (Pipeline Engine + Session Manager) |
| **Communication** | NATS JetStream async messaging between bounded contexts | Sequential pipeline stages within OpenClaw sessions; ACP sub-sessions to OpenCode |
| **Code Generation** | Code Generator bounded context (bc-cg) producing code | OpenCode TDD Runtime enforcing RED→GREEN→REFACTOR cycle |
| **State Management** | PostgreSQL (Drizzle ORM) for pipeline state, domain events, bounded context data | OpenClaw sessions (in-memory + Redis) + MinIO JSON artifacts |
| **API Layer** | NestJS API Gateway with REST + tRPC for internal service-to-service calls | OpenClaw Gateway handles webhooks, CLI, and HTTP API directly |
| **Domain Model** | 6 bounded contexts (PM, AD, CG, CR, TA, DP) modeled as DDD aggregates | 6 pipeline stages (spec→architecture→code→review→test→deploy) |
| **Agent Model** | Steward agents per bounded context (long-lived) | Stage agents (ephemeral, instantiated per pipeline run) |
| **Deployment** | 8+ long-running Pods (API Gateway, Orchestrator, Supervisor, PostgreSQL, NATS, Redis, MinIO, Keycloak) | 4 long-running Pods (OpenClaw, Redis, MinIO, Keycloak) + ephemeral OpenCode Job Pods |

### 10.2 Architectural Diagram Comparison

**v1 Architecture** (simplified):
```
External → Kong Ingress → NestJS API Gateway (REST + tRPC)
                              ↓
                    NestJS Orchestrator → NATS → Bounded Contexts (PM, AD, CG, CR, TA, DP)
                              ↓                      ↓
                    NestJS Supervisor ← NATS ← PostgreSQL (state + events)
```

**v2 Architecture** (simplified):
```
External → OpenClaw Gateway (webhook, CLI, HTTP)
                    ↓
           Pipeline Engine → Stage Agents → OpenCode ACP (TDD Coding)
                    ↓
           MinIO (artifacts) + Redis (cache)
```

### 10.3 What We Removed and Why

| Removed Component | Reason |
|-------------------|--------|
| NestJS (entire framework) | OpenClaw handles all gateway, orchestration, and dispatch logic. No REST framework needed for internal operations. |
| tRPC | No microservices to communicate between. Agent communication uses ACP, not RPC. |
| PostgreSQL + Drizzle ORM | Pipeline state is session-based and ephemeral. Artifacts are JSON in MinIO. No relational queries needed. No schema migrations. |
| NATS JetStream | No async messaging needed. Stages are sequential. Events are emitted within sessions, not via a message bus. |
| 6 Bounded Contexts (packages/bc/*) | Replaced by 6 pipeline stages. Agent specialization replaces domain modeling. |
| Orchestrator + Supervisor (packages/core/*) | Replaced by OpenClaw Pipeline Engine + Session Manager. |
| API Gateway (apps/api-gateway/) | Replaced by OpenClaw Gateway webhook receiver + HTTP API. |
| Kong Ingress | Replaced by standard NGINX Ingress Controller (simpler; OpenClaw handles routing logic). |

### 10.4 Complexity Reduction Metrics

| Metric | v1 | v2 | Reduction |
|--------|----|----|-----------|
| Long-running services (Pods) | 8+ | 4 | 50% |
| Database instances | 1 (PostgreSQL) | 0 | 100% |
| Message bus instances | 1 (NATS) | 0 | 100% |
| Framework dependencies | NestJS + tRPC + Drizzle + NATS client | OpenClaw SDK only | 75% |
| Config files | ~15 (per-BC .env, NATS config, DB migrations, etc.) | 1 (openclaw.config.yml) | 93% |
| API endpoints (internal) | 40+ (tRPC procedures) | 0 (no internal API needed) | 100% |
| Database tables | ~20 (pipeline state, events, BC data) | 0 (session-based) | 100% |
| Code packages | 15+ (6 BCs + 2 core + 1 app + shared) | 4 (pipeline + 3 shared) | 73% |

### 10.5 What Stays the Same

These elements are unchanged between v1 and v2:

| Element | Details |
|---------|---------|
| TypeScript + Node.js | Same language and runtime |
| pnpm workspaces | Same monorepo structure (simplified package set) |
| DDD base classes (shared/domain) | Entity, ValueObject, AggregateRoot, Result<T,E> — used by generated code |
| Testing stack | Vitest 3.x, Playwright 1.50+, Pact 4.x |
| Deployment stack | Pulumi 3.x, Kubernetes 1.32+, ArgoCD 2.14+, Helm 3.17+ |
| Observability | OpenTelemetry, Prometheus, Grafana, ELK, Sentry |
| Agent identity model | SOUL.md, AGENTS.md, TOOLS.md — preserved and extended |
| Skills directory | Skills are preserved; some are repurposed for pipeline stages |
| Conventional Commits | Same commit message standard |
| Strict TypeScript + no any | Same coding standards |
| TDD discipline | Same principle, but now enforced at the tool level by OpenCode |

---

## 11. Shared Packages (Retained from v1)

### 11.1 Package Map

```
packages/
  shared/
    domain/        — RETAINED. DDD base classes for generated code.
    types/         — REFACTORED. Simplified for pipeline model.
    events/        — NEW. Zod event schemas for pipeline events.
    config/        — REFACTORED. Now loads openclaw.config.yml.
  pipeline/        — NEW. Lightweight pipeline state types (Stage, PipelineRun, StageResult).
  acl/             — RETAINED. Anti-corruption layer interfaces (OpenCode, OpenClaw, Git, CI/CD adapters).
```

### 11.2 `packages/shared/domain/` — Retained

The DDD base classes remain unchanged. They are used by the code that OpenCode generates during Stage 3 (TDD Code Generation). When the architect agent designs aggregates, it references these base classes. When the TDD coder generates code, it extends `Entity`, `ValueObject`, and `AggregateRoot`.

```
Entity<TId>           — Base class for domain entities with identity
ValueObject            — Base class for value objects with structural equality
AggregateRoot<TId>    — Base class for aggregate roots with domain event collection
DomainEvent            — Interface for domain events
Identifier<T>          — Type-safe wrapper for entity identifiers
Result<T, E>           — Either monad for domain operations (success or typed error)
DomainError            — Base class for domain-specific errors
  ValidationError
  NotFoundError
  UnauthorizedError
  ConflictError
  InvalidOperationError
PaginatedResult<T>     — Pagination support for repository queries
```

### 11.3 `packages/shared/types/` — Refactored

The shared types package is simplified for the pipeline model:

**Retained**:
- `AgentType` enum (updated for pipeline agents)
- `Finding`, `ReviewSession`, `ReviewStatus`, `CheckType`, `Severity` — review-related types
- `DomainEvent`, `AggregateRoot`, `ValueObject`, `Entity` — interface definitions of domain base classes

**Removed**:
- NATS subject constants (`EventSubjects`, `NATS_SUBJECT_PREFIX`, `MessageEnvelope`)
- Workflow-related types (replaced by pipeline stage types)
- `AgentRole`, `AgentSession`, `AgentMessage` — replaced by OpenClaw session model
- `ApprovalGate`, `CanaryRule`, `PipelineStage` (old CI/CD pipeline types — replaced by new pipeline model)

**Added**:
- `PipelineStage` enum (new 6-stage pipeline)
- `PipelineRun`, `StageResult` (pipeline tracking types)
- `PipelineEvent` union type (StageStarted, StageCompleted, etc.)

### 11.4 `packages/shared/events/` — New

Replaces the NATS event system with Zod-validated pipeline events:

```
StageStartedEvent      — Zod schema for stage start notification
StageCompletedEvent    — Zod schema for stage completion
PipelineFailedEvent    — Zod schema for pipeline failure
PipelineCompletedEvent — Zod schema for pipeline completion
UserApprovalRequested  — Zod schema for deployment gate
UserApprovalReceived   — Zod schema for approval confirmation
```

These schemas validate event payloads before they are persisted to MinIO. They serve as the contract between pipeline stages and external consumers (dashboards, notification systems).

### 11.5 `packages/pipeline/` — New

A new lightweight package for pipeline-specific types. These are plain TypeScript types, not DDD classes. No business logic. No persistence layer.

```
PipelineStage enum:
  SPEC_PARSING | ARCHITECTURE_DESIGN | TDD_CODE_GEN | CODE_REVIEW | AUTOMATED_TESTING | DEPLOYMENT

PipelineRun:
  pipelineId: UUID
  specRef: string (repo + commit + file path)
  status: PipelineRunStatus
  currentStage: PipelineStage
  stages: Record<PipelineStage, StageResult>
  startedAt: ISO8601
  completedAt: ISO8601 | null
  retryCount: number

StageResult:
  status: StageStatus
  startedAt: ISO8601
  completedAt: ISO8601 | null
  artifactKeys: string[]
  errorMessage: string | null
```

### 11.6 `packages/acl/` — Retained, Simplified

The ACL interfaces remain but are simplified. They are pure TypeScript interfaces (no NestJS decorators or dependency injection):

```
OpenCodeAdapter:
  createSession()
  writeFile()
  runCommand()
  getDiagnostics()
  closeSession()

OpenClawAdapter:
  dispatchAgent()
  notifyUser()
  getSessionState()

GitAdapter:
  createWorktree()
  commit()
  push()
  createPR()
  removeWorktree()

CICDAdapter:
  triggerPipeline()
  getDeploymentStatus()
  rollback()
```

---

## 12. Security & Governance

### 12.1 Security Model

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Transport** | TLS 1.3 | All external communication (webhooks, CLI, HTTP API) encrypted via TLS |
| **Authentication** | Keycloak (OpenID Connect) | Users authenticate via Keycloak. Service accounts use client credentials. |
| **Authorization** | Keycloak RBAC | Role-based access: pipeline-admin, spec-author, gate-approver, viewer |
| **Webhook Verification** | HMAC-SHA256 | GitHub/GitLab webhooks verified via secret signature |
| **Secrets Management** | Kubernetes Secrets + env substitution | No secrets in config files. All sensitive values injected at runtime. |
| **Code Generation Isolation** | Git worktree per session | Each OpenCode session operates in an isolated worktree. No cross-session file access. |
| **Secret Detection** | Security auditor agent (Stage 4) | Scans generated code for hardcoded secrets, tokens, and keys before review passes |
| **Dependency Scanning** | npm audit + CVE database | Checks generated package.json dependencies for known vulnerabilities |
| **Network Isolation** | Kubernetes Network Policies | Internal services (Redis, MinIO, Keycloak) not exposed externally |

### 12.2 Approval Gates

The pipeline has exactly one manual approval gate: **Stage 6 (Deployment)**. Before deployment proceeds:

1. All previous stages must have passed (green)
2. The review report must have zero critical findings
3. All tests must have passed with coverage thresholds met
4. OpenClaw sends an approval request to designated approvers (tech leads)
5. The approver reviews the pipeline artifacts (review report, test results, TDD trace)
6. Upon approval, deployment proceeds. If no approval within the window (default: 1 hour), the pipeline times out.

### 12.3 Audit Trail

Every pipeline action produces an audit trail:

- **Pipeline events**: Stored as JSON in MinIO at `pipeline/{pipelineId}/events/`
- **Agent actions**: Logged with OpenTelemetry spans; traceable via trace ID
- **TDD evidence**: `tdd-trace.json` records every RED→GREEN→REFACTOR transition with test outputs
- **Review findings**: Complete review report with per-file, per-line findings
- **Deployment decisions**: Canary metrics, approval decisions, rollout steps

### 12.4 Compliance

The architecture supports common compliance requirements:

| Requirement | How Addressed |
|-------------|---------------|
| **Separation of duties** | Spec authors write specs; tech leads approve deployments; agents execute. No single persona controls the full pipeline. |
| **Change traceability** | Every code change is linked to a spec commit, a pipeline run, and TDD evidence. Full provenance from spec to production. |
| **Reproducible builds** | TDD trace records exact steps for code generation. Git commits are deterministic from architecture plan + TDD cycle. |
| **Least privilege** | Keycloak RBAC ensures each user has only the permissions needed. Service accounts (OpenCode, OpenClaw) have scoped access. |

### 12.5 Governance Policies (`.ulw/` directory)

The `.ulw/` directory in each repository defines governance policies:

```
.ulw/
  pipeline.yml           — Per-repo pipeline configuration overrides
  review-policy.yml      — Review thresholds (max findings by severity)
  security-policy.yml    — Security scanning rules and exemptions
  deployment-policy.yml  — Deployment gate rules and approver lists
```

These policies are version-controlled and specific to each repository. The OpenClaw Gateway loads them when a pipeline is triggered for that repository.

---

## Appendix A: Pipeline Stage Sequence Diagram

```
User        GitHub      OpenClaw     spec-parser   architect    tdd-coder     reviewer     tester      deployer    OpenCode
 │             │            │             │            │            │            │            │            │            │
 │ commit      │            │             │            │            │            │            │            │            │
 │ spec.md ───►│            │             │            │            │            │            │            │            │
 │             │ webhook    │             │            │            │            │            │            │            │
 │             ├───────────►│             │            │            │            │            │            │            │
 │             │            │ dispatch    │            │            │            │            │            │            │
 │             │            ├────────────►│            │            │            │            │            │            │
 │             │            │             │ parse spec │            │            │            │            │            │
 │             │            │             │ store JSON │            │            │            │            │            │
 │             │            │◄────────────┤            │            │            │            │            │            │
 │             │            │ dispatch    │            │            │            │            │            │            │
 │             │            ├─────────────┼───────────►│            │            │            │            │            │
 │             │            │             │            │ design     │            │            │            │            │
 │             │            │             │            │ arch plan  │            │            │            │            │
 │             │            │◄────────────┼────────────┤            │            │            │            │            │
 │             │            │ dispatch    │            │            │            │            │            │            │
 │             │            ├─────────────┼────────────┼───────────►│            │            │            │            │
 │             │            │             │            │            │ ACP session│            │            │            │
 │             │            │             │            │            ├────────────┼───────────►│            │            │
 │             │            │             │            │            │            │            │            │ TDD cycle  │
 │             │            │             │            │            │            │            │            │◄──────────►│
 │             │            │             │            │            │◄───────────┼────────────┤            │            │
 │             │            │◄────────────┼────────────┼────────────┤            │            │            │            │
 │             │            │ dispatch    │            │            │            │            │            │            │
 │             │            ├─────────────┼────────────┼────────────┼───────────►│            │            │            │
 │             │            │             │            │            │            │ 6 subs     │            │            │
 │             │            │             │            │            │            ├────────────┼───────────►│            │
 │             │            │             │            │            │            │◄───────────┼────────────┤            │
 │             │            │◄────────────┼────────────┼────────────┼────────────┤            │            │            │
 │             │            │ dispatch    │            │            │            │            │            │            │
 │             │            ├─────────────┼────────────┼────────────┼────────────┼───────────►│            │            │
 │             │            │             │            │            │            │            │ run tests  │            │
 │             │            │             │            │            │            │            ├────────────┼───────────►│
 │             │            │◄────────────┼────────────┼────────────┼────────────┼────────────┤            │            │
 │             │            │ approval    │            │            │            │            │            │            │
 │◄───────────┤            │◄───────────►│            │            │            │            │            │            │
 │ approve ──►│            ├─────────────┼────────────┼────────────┼────────────┼────────────┼───────────►│            │
 │            │            │             │            │            │            │            │            │ deploy     │
 │            │            │◄────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤            │
 │◄───────────┤            │             │            │            │            │            │            │            │
 │ deployed! │             │             │            │            │            │            │            │            │
```

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **SDD** | Specification-Driven Development. Writing Markdown specs that drive the entire pipeline. |
| **TDD** | Test-Driven Development. RED→GREEN→REFACTOR cycle enforced at tool level. |
| **ACP** | Agent Communication Protocol. The protocol used for OpenClaw-to-OpenCode sub-sessions. |
| **Pipeline Stage** | One of 6 sequential steps in the SDD+TDD pipeline. |
| **Pipeline Run** | A single execution of the full 6-stage pipeline triggered by a spec commit. |
| **Stage Agent** | An ephemeral agent responsible for executing one pipeline stage. |
| **Sub-Agent** | An agent spawned by a stage agent to perform parallel work (e.g., review sub-agents). |
| **Worktree** | A Git worktree: an isolated working directory for an agent session. |
| **Artifact** | A JSON file produced by a pipeline stage and stored in MinIO. |
| **Gate** | A manual approval point in the pipeline (currently only at Stage 6 deployment). |
| **Canary** | A small-percentage deployment used to validate production health before full rollout. |
| **OpenClaw Gateway** | The central engine handling webhooks, pipeline orchestration, and agent dispatch. |
| **OpenCode Runtime** | The TDD coding environment with LSP integration and test execution. |
| **MinIO** | S3-compatible object storage used for pipeline artifacts. |
| **Zod** | TypeScript-first schema validation library used for pipeline events and configuration. |

---

## Appendix C: Migration Path from v1 to v2

### C.1 What to Do with v1 Code

| v1 Component | Migration Action |
|-------------|-----------------|
| `packages/bc/*` | Archive. Functionality replaced by pipeline stages. |
| `packages/core/*` | Archive. Orchestration moved to OpenClaw. |
| `apps/api-gateway/` | Archive. Replaced by OpenClaw Gateway. |
| `packages/shared/domain/` | Keep. Used by generated code. |
| `packages/shared/types/` | Refactor. Remove NATS subjects, simplify for pipeline model. |
| `packages/shared/events/` | Create new. Replace NATS subjects with Zod event schemas. |
| `packages/acl/` | Simplify. Remove NestJS decorators. Keep as pure TypeScript interfaces. |
| `agents/` | Restructure. Reorganize by pipeline stage (not bounded context). |
| `skills/` | Repurpose. Map to pipeline stages. |
| `infrastructure/` | Simplify. Remove PostgreSQL + NATS resources. Update Helm charts. |

### C.2 Phased Approach

**Phase 1: Design finalization** (current)
- Complete this design document
- Validate with stakeholders
- Finalize openclaw.config.yml schema

**Phase 2: Infrastructure teardown** 
- Remove PostgreSQL, NATS from docker-compose.yml
- Update Pulumi stacks to remove PostgreSQL and NATS resources
- Update Helm charts

**Phase 3: Package restructuring**
- Create `packages/pipeline/` with pipeline state types
- Refactor `packages/shared/types/` 
- Create `packages/shared/events/` with Zod schemas
- Archive `packages/bc/*` and `packages/core/*`

**Phase 4: Agent migration**
- Restructure `agents/` directory by pipeline stage
- Rewrite agent identity files for pipeline stage roles
- Map skills to new agent structure

**Phase 5: OpenClaw integration**
- Deploy OpenClaw Gateway
- Configure webhooks
- Wire up agent dispatch for each stage
- Test end-to-end pipeline with a sample spec

**Phase 6: Validation & rollout**
- Run full pipeline on existing projects
- Measure cycle time against v1 baseline
- Iterate on agent quality and pipeline performance

---

> **Document Status**: Draft v2.0 — 2026-04-29
> **Next Steps**: Stakeholder review, infrastructure teardown planning, OpenClaw integration spike.
