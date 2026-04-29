# ulw (UltraWork) — v2 Migration Plan

> **Version**: v2.0
> **Date**: 2026-04-30
> **Status**: Planning Phase
> **Based on**: [DESIGN_v2.md](./DESIGN_v2.md), current v1 monorepo state
> **Migration**: DDD microservices → SDD+TDD pipeline
> **Net file delta**: delete ~210 files, keep ~100 files, create ~15 files
> **Est. effort**: 1 week (parallel execution, 2–3 engineers)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Gap Analysis](#2-gap-analysis)
3. [What to Delete](#3-what-to-delete)
4. [What to Keep](#4-what-to-keep)
5. [What to Create](#5-what-to-create)
6. [Phase-by-Phase Execution Plan](#6-phase-by-phase-execution-plan)
7. [Atomic Commit Strategy](#7-atomic-commit-strategy)
8. [TODO Checklist](#8-todo-checklist)
9. [Risk Register](#9-risk-register)

---

## 1. Executive Summary

### 1.1 Migration Overview

The v1 architecture (DESIGN.md) models ulw as a DDD microservice platform: 6 bounded contexts communicating via NATS JetStream, orchestrated by NestJS, backed by PostgreSQL with Drizzle ORM, and exposed through a NestJS API Gateway with REST + tRPC.

The v2 architecture (DESIGN_v2.md) replaces this with a **SDD+TDD pipeline platform**. OpenClaw is the central gateway and orchestration engine. OpenCode is the TDD coding runtime. Pipeline state is session-based (OpenClaw + Redis). Artifacts are JSON in MinIO. There are no bounded contexts, no NATS message bus, no PostgreSQL persistence, and no NestJS API gateway.

### 1.2 Migration Scope

| Category | v1 Files | v2 Files | Action |
|----------|----------|----------|--------|
| 6 Bounded Contexts (`packages/bc/*`) | 162 source files | 0 | **Delete** |
| Core Orchestrator + Supervisor (`packages/core/*`) | 40 source files | 0 | **Delete** |
| API Gateway (`apps/api-gateway/`) | 24 source files | 0 | **Delete** |
| Shared Domain (`packages/shared/domain/`) | 9 source files | 9 source files | **Keep** |
| Shared Types (`packages/shared/types/`) | 10 source files | 10 source files | **Refactor** (remove NATS subjects) |
| Shared Events (`packages/shared/events/`) | 10 source files | 10 source files | **Refactor** (replace NATS schemas with pipeline event Zod schemas) |
| Shared Config (`packages/shared/config/`) | 6 source files | 6 source files | **Refactor** (load openclaw.config.yml) |
| ACL Interfaces (`packages/acl/*/src/index.ts`) | 4 interface files | 4 interface files | **Refactor** (remove NestJS DI patterns) |
| Agents (`agents/`) | 39 files (13 agents × 3) | 21 files (7 agents × 3) | **Repurpose** (reorganize by pipeline stage) |
| Skills (`skills/`) | 6 SKILL.md files | 8 SKILL.md files | **Create 2 new** (spec-parser, pipeline-orchestrator) |
| Infrastructure (`infrastructure/`) | 15 files | Fewer (simplified) | **Refactor** (remove PG + NATS resources) |
| `.ulw/` governance | 8 files | 8 files | **Keep** |
| Pipeline package (`packages/pipeline/`) | 0 | 10 files | **Create** |
| `openclaw.config.yml` | 0 | 1 file | **Create** |

### 1.3 Net File Delta

```
Delete:  ~210 files (BCs + Core + API Gateway + node_modules orphans)
Keep:    ~100 files (shared + ACLs + agents + skills + infra + .ulw + root configs)
Create:   ~15 files (pipeline package + 2 skills + openclaw config)
```

### 1.4 Key Principles

1. **Delete first, then create** — remove v1 cruft before adding v2 code
2. **Keep main buildable** — each commit leaves the workspace in a type-checking state
3. **Parallelize deletes** — all 6 BC deletions are independent and can happen in parallel
4. **No data migration** — there is no PostgreSQL to migrate; no NATS streams to drain; no running services to sunset (the v1 codebase was a scaffold, not a running system)

---

## 2. Gap Analysis

### 2.1 Module Group Comparison: v1 → v2

| Module Group | v1 State (DESIGN.md) | v2 Target (DESIGN_v2.md) | Action |
|---|---|---|---|
| **Shared Domain** | 9 DDD base classes (Entity, ValueObject, AggregateRoot, Result<T,E>, errors, etc.) — complete | Same classes used by generated code | **Keep** unchanged |
| **Shared Types** | 10 type files including NATS subject constants, AgentType, Finding, ReviewSession, old pipeline types | Pipeline-focused types: PipelineStage enum, PipelineRun, StageResult; remove NATS subjects and AgentRole/AgentSession | **Refactor** — remove NATS, add pipeline types |
| **Shared Events** | 7 schema files for 22 NATS event types (per-BC domain events) + envelope + subject registry | 6 Zod-validated pipeline event schemas: StageStarted, StageCompleted, PipelineFailed, PipelineCompleted, UserApprovalRequested, UserApprovalReceived | **Rewrite** — replace all NATS schemas with pipeline schemas |
| **Shared Config** | ConfigLoader with JSON loading + 30 env var mappings + 8 Zod sub-schemas | ConfigLoader that reads openclaw.config.yml; simplified schemas | **Refactor** — rip out NestJS config, keep loader patterns |
| **BC-PM** | 30 files: Project/Sprint/Story entities, value objects, NestJS module, controllers, Drizzle schema, mock repos | Not needed — spec parsing stage replaces project management | **Delete** |
| **BC-AD** | 28 files: ArchitectureSpec, ApiContract, SemVer, NestJS module, controllers, Drizzle schema | Not needed — architecture design stage replaces this BC | **Delete** |
| **BC-CG** | 26 files: GenerationTask, GeneratedFile, PullRequest, FilePath, TDDState, NestJS module, Drizzle schema | Not needed — TDD code generation stage replaces this BC | **Delete** |
| **BC-CR** | 26 files: ReviewSession, ReviewCheck, Violation, SeverityThreshold, NestJS module, Drizzle schema | Not needed — code review stage (6 sub-agents) replaces this BC | **Delete** |
| **BC-TA** | 26 files: TestSuite, TestCase, TestRun, CoverageThreshold, NestJS module, Drizzle schema | Not needed — automated testing stage replaces this BC | **Delete** |
| **BC-DP** | 26 files: Release, PipelineStage, Rollback, DeploymentVersion, NestJS module, Drizzle schema | Not needed — deployment stage replaces this BC | **Delete** |
| **Core Orchestrator** | 18 files: TaskDecomposer, IntentParser, AgentRouter, tRPC router, NestJS module | Not needed — OpenClaw Pipeline Engine replaces orchestration | **Delete** |
| **Core Supervisor** | 22 files: DAGExecutor, SessionManager, HeartbeatMonitor, RetryManager, StateRepository, NATS pub/sub, NestJS module | Not needed — OpenClaw Session Manager + Redis replaces state management | **Delete** |
| **API Gateway** | 24 files: NestJS app, JWT auth, webhook receivers, REST controllers, tRPC module, middleware | Not needed — OpenClaw Gateway handles webhooks, CLI, HTTP API directly | **Delete** |
| **ACL Interfaces** | 4 interface files (OpenCode, OpenClaw, Git, CI/CD adapters) — pure TypeScript interfaces, 0% implementation | Same interfaces, simplified — remove NestJS Injectable decorators, keep pure TS | **Refactor** — strip DI, keep contracts |
| **Agents** | 39 files: 13 v1 agents (6 BC stewards + orchestrator + supervisor + code-reviewer + security-auditor + contract-validator + deploy-agent + tdd-test-agent) organized by v1 role | 21 files: 7 v2 agents (spec-parser, architect, tdd-coder, reviewer, tester, deployer) + reviewer's 6 sub-agents organized by pipeline stage | **Repurpose** — reorganize directory, rewrite identity files |
| **Skills** | 6 SKILL.md files: code-review, contract-validation, deployment, security-audit, tdd, test-generation | 8 SKILL.md files: add spec-parsing, architecture-design, pipeline-orchestrator; keep existing | **Keep 6 + Create 3** |
| **Infrastructure** | 15 files: Pulumi stacks, K8s resources (PostgreSQL, NATS, API Gateway, orchestrator pods) | Simplified: remove PG + NATS + BC pods; add OpenClaw + OpenCode job templates | **Refactor** — simplify K8s resources |
| **Pipeline Package** | Does not exist | Lightweight TypeScript package with pipeline state types (PipelineRun, StageResult, PipelineStage enum) | **Create** |
| **openclaw.config.yml** | Does not exist | Single YAML defining webhooks, skills, agents, pipeline stages, storage, cache, auth, cron, notifications, observability | **Create** |

### 2.2 Complexity Reduction Summary

| Metric | v1 | v2 | Delta |
|--------|----|----|-------|
| TypeScript source packages | 16 | 5 | −69% |
| Long-running services (Pods) | 8+ | 4 | −50% |
| Database instances | 1 (PostgreSQL) | 0 | −100% |
| Message bus instances | 1 (NATS JetStream) | 0 | −100% |
| Framework dependencies | NestJS + tRPC + Drizzle + NATS | OpenClaw SDK only | −75% |
| API endpoints (internal) | 40+ (tRPC procedures) | 0 | −100% |
| Configuration files | ~15 (.env, NATS, tRPC, per-BC) | 1 (openclaw.config.yml) | −93% |

---

## 3. What to Delete

### 3.1 Bounded Contexts — `packages/bc/*`

All 6 bounded contexts are replaced by pipeline stages. Their domain entities, NestJS modules, controllers, Drizzle schemas, mock repositories, and messaging stubs are no longer needed.

#### packages/bc/pm/ — Project Management (30 files)

```
packages/bc/pm/drizzle.config.ts
packages/bc/pm/package.json
packages/bc/pm/src/application/index.ts
packages/bc/pm/src/application/ports/index.ts
packages/bc/pm/src/application/use-cases/index.ts
packages/bc/pm/src/domain/entities/index.ts
packages/bc/pm/src/domain/entities/project.ts
packages/bc/pm/src/domain/entities/sprint.ts
packages/bc/pm/src/domain/entities/story.ts
packages/bc/pm/src/domain/events/index.ts
packages/bc/pm/src/domain/index.ts
packages/bc/pm/src/domain/repositories/index.ts
packages/bc/pm/src/domain/services/index.ts
packages/bc/pm/src/domain/value-objects/index.ts
packages/bc/pm/src/domain/value-objects/sprint-duration.ts
packages/bc/pm/src/index.ts
packages/bc/pm/src/infrastructure/index.ts
packages/bc/pm/src/infrastructure/messaging/index.ts
packages/bc/pm/src/infrastructure/persistence/index.ts
packages/bc/pm/src/infrastructure/persistence/repositories/index.ts
packages/bc/pm/src/infrastructure/persistence/schema.ts
packages/bc/pm/src/interface/controllers/index.ts
packages/bc/pm/src/interface/controllers/project.controller.ts
packages/bc/pm/src/interface/dto/index.ts
packages/bc/pm/src/interface/dto/project.dto.ts
packages/bc/pm/src/interface/index.ts
packages/bc/pm/src/module.ts
packages/bc/pm/tests/domain/smoke.test.ts
packages/bc/pm/tsconfig.json
packages/bc/pm/vitest.config.ts
```

#### packages/bc/ad/ — Architecture Design (28 files)

```
packages/bc/ad/drizzle.config.ts
packages/bc/ad/package.json
packages/bc/ad/src/application/index.ts
packages/bc/ad/src/application/ports/index.ts
packages/bc/ad/src/application/use-cases/index.ts
packages/bc/ad/src/domain/entities/api-contract.ts
packages/bc/ad/src/domain/entities/architecture-spec.ts
packages/bc/ad/src/domain/entities/index.ts
packages/bc/ad/src/domain/events/index.ts
packages/bc/ad/src/domain/index.ts
packages/bc/ad/src/domain/repositories/index.ts
packages/bc/ad/src/domain/services/index.ts
packages/bc/ad/src/domain/value-objects/index.ts
packages/bc/ad/src/domain/value-objects/semver.ts
packages/bc/ad/src/index.ts
packages/bc/ad/src/infrastructure/index.ts
packages/bc/ad/src/infrastructure/messaging/index.ts
packages/bc/ad/src/infrastructure/persistence/index.ts
packages/bc/ad/src/infrastructure/persistence/repositories/index.ts
packages/bc/ad/src/infrastructure/persistence/schema.ts
packages/bc/ad/src/interface/controllers/architecture.controller.ts
packages/bc/ad/src/interface/controllers/index.ts
packages/bc/ad/src/interface/dto/index.ts
packages/bc/ad/src/interface/index.ts
packages/bc/ad/src/module.ts
packages/bc/ad/tests/domain/smoke.test.ts
packages/bc/ad/tsconfig.json
packages/bc/ad/vitest.config.ts
```

#### packages/bc/cg/ — Code Generation (26 files)

```
packages/bc/cg/drizzle.config.ts
packages/bc/cg/package.json
packages/bc/cg/src/application/index.ts
packages/bc/cg/src/application/ports/index.ts
packages/bc/cg/src/application/use-cases/index.ts
packages/bc/cg/src/domain/entities/index.ts
packages/bc/cg/src/domain/events/index.ts
packages/bc/cg/src/domain/index.ts
packages/bc/cg/src/domain/repositories/index.ts
packages/bc/cg/src/domain/services/index.ts
packages/bc/cg/src/domain/value-objects/file-path.ts
packages/bc/cg/src/domain/value-objects/index.ts
packages/bc/cg/src/index.ts
packages/bc/cg/src/infrastructure/index.ts
packages/bc/cg/src/infrastructure/messaging/index.ts
packages/bc/cg/src/infrastructure/persistence/index.ts
packages/bc/cg/src/infrastructure/persistence/repositories/index.ts
packages/bc/cg/src/infrastructure/persistence/schema.ts
packages/bc/cg/src/interface/controllers/generation.controller.ts
packages/bc/cg/src/interface/controllers/index.ts
packages/bc/cg/src/interface/dto/index.ts
packages/bc/cg/src/interface/index.ts
packages/bc/cg/src/module.ts
packages/bc/cg/tests/domain/smoke.test.ts
packages/bc/cg/tsconfig.json
packages/bc/cg/vitest.config.ts
```

#### packages/bc/cr/ — Code Review (26 files)

```
packages/bc/cr/drizzle.config.ts
packages/bc/cr/package.json
packages/bc/cr/src/application/index.ts
packages/bc/cr/src/application/ports/index.ts
packages/bc/cr/src/application/use-cases/index.ts
packages/bc/cr/src/domain/entities/index.ts
packages/bc/cr/src/domain/events/index.ts
packages/bc/cr/src/domain/index.ts
packages/bc/cr/src/domain/repositories/index.ts
packages/bc/cr/src/domain/services/index.ts
packages/bc/cr/src/domain/value-objects/index.ts
packages/bc/cr/src/domain/value-objects/severity-threshold.ts
packages/bc/cr/src/index.ts
packages/bc/cr/src/infrastructure/index.ts
packages/bc/cr/src/infrastructure/messaging/index.ts
packages/bc/cr/src/infrastructure/persistence/index.ts
packages/bc/cr/src/infrastructure/persistence/repositories/index.ts
packages/bc/cr/src/infrastructure/persistence/schema.ts
packages/bc/cr/src/interface/controllers/index.ts
packages/bc/cr/src/interface/controllers/review.controller.ts
packages/bc/cr/src/interface/dto/index.ts
packages/bc/cr/src/interface/index.ts
packages/bc/cr/src/module.ts
packages/bc/cr/tests/domain/smoke.test.ts
packages/bc/cr/tsconfig.json
packages/bc/cr/vitest.config.ts
```

#### packages/bc/ta/ — Test Automation (26 files)

```
packages/bc/ta/drizzle.config.ts
packages/bc/ta/package.json
packages/bc/ta/src/application/index.ts
packages/bc/ta/src/application/ports/index.ts
packages/bc/ta/src/application/use-cases/index.ts
packages/bc/ta/src/domain/entities/index.ts
packages/bc/ta/src/domain/events/index.ts
packages/bc/ta/src/domain/index.ts
packages/bc/ta/src/domain/repositories/index.ts
packages/bc/ta/src/domain/services/index.ts
packages/bc/ta/src/domain/value-objects/coverage-threshold.ts
packages/bc/ta/src/domain/value-objects/index.ts
packages/bc/ta/src/index.ts
packages/bc/ta/src/infrastructure/index.ts
packages/bc/ta/src/infrastructure/messaging/index.ts
packages/bc/ta/src/infrastructure/persistence/index.ts
packages/bc/ta/src/infrastructure/persistence/repositories/index.ts
packages/bc/ta/src/infrastructure/persistence/schema.ts
packages/bc/ta/src/interface/controllers/index.ts
packages/bc/ta/src/interface/controllers/test.controller.ts
packages/bc/ta/src/interface/dto/index.ts
packages/bc/ta/src/interface/index.ts
packages/bc/ta/src/module.ts
packages/bc/ta/tests/domain/smoke.test.ts
packages/bc/ta/tsconfig.json
packages/bc/ta/vitest.config.ts
```

#### packages/bc/dp/ — Deployment (26 files)

```
packages/bc/dp/drizzle.config.ts
packages/bc/dp/package.json
packages/bc/dp/src/application/index.ts
packages/bc/dp/src/application/ports/index.ts
packages/bc/dp/src/application/use-cases/index.ts
packages/bc/dp/src/domain/entities/index.ts
packages/bc/dp/src/domain/events/index.ts
packages/bc/dp/src/domain/index.ts
packages/bc/dp/src/domain/repositories/index.ts
packages/bc/dp/src/domain/services/index.ts
packages/bc/dp/src/domain/value-objects/deployment-version.ts
packages/bc/dp/src/domain/value-objects/index.ts
packages/bc/dp/src/index.ts
packages/bc/dp/src/infrastructure/index.ts
packages/bc/dp/src/infrastructure/messaging/index.ts
packages/bc/dp/src/infrastructure/persistence/index.ts
packages/bc/dp/src/infrastructure/persistence/repositories/index.ts
packages/bc/dp/src/infrastructure/persistence/schema.ts
packages/bc/dp/src/interface/controllers/deployment.controller.ts
packages/bc/dp/src/interface/controllers/index.ts
packages/bc/dp/src/interface/dto/index.ts
packages/bc/dp/src/interface/index.ts
packages/bc/dp/src/module.ts
packages/bc/dp/tests/domain/smoke.test.ts
packages/bc/dp/tsconfig.json
packages/bc/dp/vitest.config.ts
```

**BC subtotal: 162 files**

---

### 3.2 Core Engine — `packages/core/*`

#### packages/core/orchestrator/ — Orchestrator (18 files)

```
packages/core/orchestrator/package.json
packages/core/orchestrator/src/controller/dto/create-task.dto.ts
packages/core/orchestrator/src/controller/orchestrator.controller.ts
packages/core/orchestrator/src/decomposer/index.ts
packages/core/orchestrator/src/decomposer/intent-parser.ts
packages/core/orchestrator/src/decomposer/task-decomposer.ts
packages/core/orchestrator/src/decomposer/types.ts
packages/core/orchestrator/src/index.ts
packages/core/orchestrator/src/main.ts
packages/core/orchestrator/src/orchestration.module.ts
packages/core/orchestrator/src/orchestrator.service.ts
packages/core/orchestrator/src/router/agent-router.ts
packages/core/orchestrator/src/router/index.ts
packages/core/orchestrator/src/router/pattern-selector.ts
packages/core/orchestrator/src/trpc/orchestrator.router.ts
packages/core/orchestrator/tests/smoke.test.ts
packages/core/orchestrator/tsconfig.json
packages/core/orchestrator/vitest.config.ts
```

#### packages/core/supervisor/ — Supervisor (22 files)

```
packages/core/supervisor/package.json
packages/core/supervisor/src/controller/dto/execute-dag.dto.ts
packages/core/supervisor/src/controller/supervisor.controller.ts
packages/core/supervisor/src/executor/dag-executor.ts
packages/core/supervisor/src/executor/index.ts
packages/core/supervisor/src/executor/retry-manager.ts
packages/core/supervisor/src/index.ts
packages/core/supervisor/src/main.ts
packages/core/supervisor/src/messaging/index.ts
packages/core/supervisor/src/messaging/nats-consumer.ts
packages/core/supervisor/src/messaging/nats-publisher.ts
packages/core/supervisor/src/session/heartbeat-monitor.ts
packages/core/supervisor/src/session/index.ts
packages/core/supervisor/src/session/session-manager.ts
packages/core/supervisor/src/state/index.ts
packages/core/supervisor/src/state/schema.ts
packages/core/supervisor/src/state/state-repository.ts
packages/core/supervisor/src/supervisor.module.ts
packages/core/supervisor/src/supervisor.service.ts
packages/core/supervisor/tests/smoke.test.ts
packages/core/supervisor/tsconfig.json
packages/core/supervisor/vitest.config.ts
```

**Core subtotal: 40 files**

---

### 3.3 API Gateway — `apps/api-gateway/` (24 files)

```
apps/api-gateway/nest-cli.json
apps/api-gateway/package.json
apps/api-gateway/src/app.module.ts
apps/api-gateway/src/auth/auth.guard.ts
apps/api-gateway/src/auth/index.ts
apps/api-gateway/src/auth/jwt.strategy.ts
apps/api-gateway/src/auth/roles.decorator.ts
apps/api-gateway/src/common/filters/http-exception.filter.ts
apps/api-gateway/src/common/interceptors/response-wrapper.interceptor.ts
apps/api-gateway/src/main.ts
apps/api-gateway/src/middleware/correlation-id.middleware.ts
apps/api-gateway/src/middleware/tracing.middleware.ts
apps/api-gateway/src/rest/audit/audit.controller.ts
apps/api-gateway/src/rest/audit/dto/audit-query.dto.ts
apps/api-gateway/src/rest/health.controller.ts
apps/api-gateway/src/rest/project/dto/create-project.dto.ts
apps/api-gateway/src/rest/project/project.controller.ts
apps/api-gateway/src/trpc/routers/index.ts
apps/api-gateway/src/trpc/trpc.module.ts
apps/api-gateway/src/webhook/github.webhook.ts
apps/api-gateway/src/webhook/gitlab.webhook.ts
apps/api-gateway/tests/health.e2e-spec.ts
apps/api-gateway/tsconfig.json
apps/api-gateway/vitest.config.ts
```

**API Gateway subtotal: 24 files**

---

### 3.4 pnpm-workspace.yaml — Remove Entries

In `/home/jiwei/workspace/AutoCICD/pnpm-workspace.yaml`, remove these lines:

```yaml
  - "packages/bc/*"          # ← delete: bounded contexts removed
  - "packages/core/*"        # ← delete: orchestrator + supervisor removed
  - "apps/*"                 # ← delete: API gateway removed
```

Keep only:
```yaml
packages:
  - "packages/shared/*"
  - "packages/acl/*"
  - "packages/pipeline/*"
```

Also remove from the `catalog:` section: NestJS dependencies, tRPC dependencies, Drizzle ORM dependencies, NATS client, PostgreSQL driver, Passport/JWT, and all NestJS-related packages. Keep vitest, eslint, prettier, oxlint, zod, typescript, tsup, tsx, and observability packages.

### 3.5 root package.json — Remove Scripts and Dependencies

Remove these scripts from `/home/jiwei/workspace/AutoCICD/package.json`:

```
"dev": "pnpm --filter @ulw/api-gateway dev"     ← remove (no gateway)
```

Remove v1 `devDependencies` that are no longer needed (NestJS-related, tRPC-related, Drizzle, NATS, Passport). Keep vitest, typescript, eslint, oxlint, prettier.

### 3.6 docker-compose.yml — Remove Services

Remove from `/home/jiwei/workspace/AutoCICD/docker-compose.yml`:
- PostgreSQL service
- NATS service

Keep: Redis, MinIO, Keycloak. Add: OpenClaw Gateway service.

---

**Total deletions: ~226 files + workspace config updates**

---

## 4. What to Keep

### 4.1 Shared Domain — `packages/shared/domain/src/` (9 source files)

DDD base classes used by generated code during Stage 3 (TDD Code Generation). When the architect agent designs aggregates, it references these base classes. When the TDD coder generates code, it extends them.

```
packages/shared/domain/src/aggregate-root.ts    — AggregateRoot<TId> base class
packages/shared/domain/src/domain-event.ts       — DomainEvent interface
packages/shared/domain/src/entity.ts             — Entity<TId> base class
packages/shared/domain/src/errors.ts             — DomainError + 5 subtypes
packages/shared/domain/src/identifier.ts         — Identifier<T> branded type
packages/shared/domain/src/index.ts              — barrel export
packages/shared/domain/src/pagination.ts         — PaginatedResult<T>
packages/shared/domain/src/result.ts             — Result<T, E> either monad
packages/shared/domain/src/value-object.ts       — ValueObject base class
```

Plus config files:
```
packages/shared/domain/package.json
packages/shared/domain/tsconfig.json
packages/shared/domain/vitest.config.ts
```

**Rationale**: These are the only v1 business logic files that survive into v2. OpenCode generates domain code that extends `Entity`, `AggregateRoot`, `ValueObject`, and uses `Result<T,E>` for error handling. The `DomainError` hierarchy is used by generated validation logic. These files have zero dependencies on NestJS, NATS, Drizzle, or PostgreSQL.

### 4.2 Shared Types — `packages/shared/types/src/` (10 source files)

```
packages/shared/types/src/agent.ts               — AgentType enum (updated for pipeline agents)
packages/shared/types/src/api.ts                 — API-related type aliases
packages/shared/types/src/deployment.ts          — Deployment status types
packages/shared/types/src/domain.ts              — Domain entity/aggregate interface definitions
packages/shared/types/src/events.ts              — NATS subjects → refactored to pipeline event types
packages/shared/types/src/index.ts               — barrel export
packages/shared/types/src/pipeline.ts            — old pipeline types → replaced with new PipelineStage/PipelineRun
packages/shared/types/src/review.ts              — Finding, ReviewSession, ReviewStatus, CheckType, Severity
packages/shared/types/src/testing.ts             — Test suite/case type aliases
packages/shared/types/src/workflow.ts            — old workflow types → replaced
```

Plus config files:
```
packages/shared/types/package.json
packages/shared/types/tsconfig.json
packages/shared/types/vitest.config.ts
```

**Rationale**: Types are the contract layer between the pipeline and generated code. The `Finding`, `ReviewSession`, and `Severity` types are still needed by the review stage. The `AgentType` enum is updated for the 7 pipeline agents. NATS subject constants are removed. Old pipeline/workflow types are replaced with the new `PipelineStage` enum, `PipelineRun`, and `StageResult` types.

### 4.3 Shared Events — `packages/shared/events/src/` (10 source files)

```
packages/shared/events/src/envelope.ts           — Message envelope (may be simplified)
packages/shared/events/src/index.ts              — barrel export
packages/shared/events/src/schemas/architecture-events.ts  — refactor to pipeline arch events
packages/shared/events/src/schemas/code-events.ts         — refactor to pipeline code events
packages/shared/events/src/schemas/deployment-events.ts   — refactor to pipeline deploy events
packages/shared/events/src/schemas/project-events.ts      — refactor to pipeline project/spec events
packages/shared/events/src/schemas/review-events.ts       — refactor to pipeline review events
packages/shared/events/src/schemas/security-events.ts     — keep security event schemas
packages/shared/events/src/schemas/testing-events.ts      — refactor to pipeline test events
packages/shared/events/src/subject-registry.ts  — NATS subject registry → removed
```

Plus config files:
```
packages/shared/events/package.json
packages/shared/events/tsconfig.json
packages/shared/events/vitest.config.ts
```

**Rationale**: The events package provides Zod-validated schemas for pipeline events. The v1 NATS subject-based event system is replaced with pipeline event Zod schemas (StageStarted, StageCompleted, PipelineFailed, PipelineCompleted, UserApprovalRequested, UserApprovalReceived). The security event schemas (SecretDetected, PolicyViolation) are retained for the security-auditor sub-agent in Stage 4.

### 4.4 Shared Config — `packages/shared/config/src/` (6 source files)

```
packages/shared/config/src/defaults.ts          — default configuration values
packages/shared/config/src/index.ts             — barrel export
packages/shared/config/src/loader.ts            — config file loader (updated for YAML)
packages/shared/config/src/schema.ts            — Zod config schemas (simplified for v2)
packages/shared/config/src/secrets.ts           — secret management (env var substitution)
packages/shared/config/src/validator.ts         — config validation
```

Plus config files:
```
packages/shared/config/package.json
packages/shared/config/tsconfig.json
packages/shared/config/vitest.config.ts
```

**Rationale**: The config package provides the loader infrastructure. In v2, it's updated to load `openclaw.config.yml` instead of the v1 multi-file NestJS config. The loader, secrets, and validator utilities are fundamentally the same pattern. The schema definitions are simplified to match the single openclaw.config.yml structure.

### 4.5 ACL Interfaces — `packages/acl/*/src/index.ts` (4 interface files)

```
packages/acl/cicd-acl/src/index.ts       — CICDAdapter interface (triggerPipeline, getDeploymentStatus, rollback)
packages/acl/git-acl/src/index.ts        — GitAdapter interface (createWorktree, commit, push, createPR, removeWorktree)
packages/acl/openclaw-acl/src/index.ts   — OpenClawAdapter interface (dispatchAgent, notifyUser, getSessionState)
packages/acl/opencode-acl/src/index.ts   — OpenCodeAdapter interface (createSession, writeFile, runCommand, getDiagnostics, closeSession)
```

Plus config files for each ACL:
```
packages/acl/cicd-acl/package.json
packages/acl/cicd-acl/tsconfig.json
packages/acl/cicd-acl/vitest.config.ts
packages/acl/git-acl/package.json
packages/acl/git-acl/tsconfig.json
packages/acl/git-acl/vitest.config.ts
packages/acl/openclaw-acl/package.json
packages/acl/openclaw-acl/tsconfig.json
packages/acl/openclaw-acl/vitest.config.ts
packages/acl/opencode-acl/package.json
packages/acl/opencode-acl/tsconfig.json
packages/acl/opencode-acl/vitest.config.ts
```

**Rationale**: The ACL interfaces define the adapter contracts between the ulw pipeline and external systems. These are pure TypeScript interfaces (no NestJS decorators). They are the boundary that allows the pipeline code to be testable (mock the adapters) and portable (swap implementations). In v2, the NestJS `@Injectable()` decorators are stripped from these files. The interfaces themselves remain valid as the contract between OpenClaw, OpenCode, Git, and CI/CD systems.

**Total ACL files kept: 4 source + 12 config = 16 files**

### 4.6 Agents — `agents/` (39 existing files → 21 repurposed files)

Existing v1 agents (kept for repurposing, content rewritten for pipeline stage roles):

```
agents/ad-steward/AGENTS.md         → repurpose as agents/architect/AGENTS.md
agents/ad-steward/SOUL.md           → repurpose as agents/architect/SOUL.md
agents/ad-steward/TOOLS.md          → repurpose as agents/architect/TOOLS.md
agents/cg-steward/AGENTS.md         → repurpose as agents/tdd-coder/AGENTS.md
agents/cg-steward/SOUL.md           → repurpose as agents/tdd-coder/SOUL.md
agents/cg-steward/TOOLS.md          → repurpose as agents/tdd-coder/TOOLS.md
agents/cr-steward/AGENTS.md         → repurpose as agents/reviewer/AGENTS.md
agents/cr-steward/SOUL.md           → repurpose as agents/reviewer/SOUL.md
agents/cr-steward/TOOLS.md          → repurpose as agents/reviewer/TOOLS.md
agents/ta-steward/AGENTS.md         → repurpose as agents/tester/AGENTS.md
agents/ta-steward/SOUL.md           → repurpose as agents/tester/SOUL.md
agents/ta-steward/TOOLS.md          → repurpose as agents/tester/TOOLS.md
agents/dp-steward/AGENTS.md         → repurpose as agents/deployer/AGENTS.md
agents/dp-steward/SOUL.md           → repurpose as agents/deployer/SOUL.md
agents/dp-steward/TOOLS.md          → repurpose as agents/deployer/TOOLS.md
agents/pm-steward/AGENTS.md         → repurpose as agents/spec-parser/AGENTS.md
agents/pm-steward/SOUL.md           → repurpose as agents/spec-parser/SOUL.md
agents/pm-steward/TOOLS.md          → repurpose as agents/spec-parser/TOOLS.md
```

Review sub-agents (kept as-is or repurposed):
```
agents/code-reviewer/               → repurpose as agents/reviewer/sub-agents/static-analyzer/
agents/security-auditor/            → repurpose as agents/reviewer/sub-agents/security-auditor/
agents/contract-validator/          → repurpose as agents/reviewer/sub-agents/contract-validator/
```

V1 agents to delete (replaced by OpenClaw native functionality):
```
agents/orchestrator/                → delete (replaced by OpenClaw Pipeline Engine)
agents/supervisor/                  → delete (replaced by OpenClaw Session Manager)
agents/deploy-agent/                → delete (merged into deployer)
agents/tdd-test-agent/              → delete (merged into tdd-coder + tester)
```

New v2 agents needed (no v1 predecessor — built from scratch):
```
agents/reviewer/sub-agents/architecture-checker/   — new
agents/reviewer/sub-agents/style-checker/          — new
agents/reviewer/sub-agents/dependency-checker/     — new
```

**Rationale**: The v2 agent model reduces 13 v1 agents to 7 pipeline stage agents + 6 review sub-agents. Steward agents (pm-steward, ad-steward, etc.) are repurposed for the equivalent pipeline stages. The orchestrator and supervisor agents are eliminated because OpenClaw handles those functions natively.

### 4.7 Skills — `skills/` (6 existing SKILL.md files, 3 new)

Existing skills kept as-is or repurposed:
```
skills/code-review/SKILL.md          — code review orchestration (still needed)
skills/contract-validation/SKILL.md  — Pact contract validation (still needed)
skills/deployment/SKILL.md           — canary deployment workflow (still needed)
skills/security-audit/SKILL.md       — vulnerability scanning (still needed)
skills/tdd/SKILL.md                  — RED→GREEN→REFACTOR workflow (still needed)
skills/test-generation/SKILL.md      — automated test suite generation (still needed)
```

New skills created (see Section 5):
```
skills/spec-parser/SKILL.md          — NEW: Markdown spec parsing
skills/pipeline-orchestrator/SKILL.md — NEW: pipeline orchestration skill
```

**Rationale**: Skills define reusable capabilities that agents load at runtime. The existing 6 skills remain relevant — the pipeline stages use the same underlying work patterns (TDD, code review, security audit, etc.). Two new skills are needed: spec-parsing (Stage 1) and pipeline-orchestrator (cross-stage coordination).

### 4.8 Infrastructure — `infrastructure/` (15 files, simplified)

```
infrastructure/Pulumi.yaml
infrastructure/Pulumi.dev.yaml
infrastructure/Pulumi.staging.yaml
infrastructure/Pulumi.prod.yaml
infrastructure/index.ts
infrastructure/package.json
infrastructure/tsconfig.json
infrastructure/packages/kubernetes/index.ts
infrastructure/packages/kubernetes/networking.ts
infrastructure/packages/kubernetes/storage.ts
infrastructure/packages/observability/index.ts
infrastructure/packages/cache/index.ts
infrastructure/packages/storage/index.ts
infrastructure/packages/database/index.ts         → refactor: remove PostgreSQL
infrastructure/packages/messaging/index.ts         → refactor: remove NATS
```

**Rationale**: The Pulumi IaC and Helm charts are simplified. PostgreSQL and NATS resources are removed. New resources are added: OpenClaw Gateway deployment, OpenCode job pod templates. The observability, cache (Redis), and storage (MinIO) sub-packages remain essentially unchanged.

### 4.9 `.ulw/` Governance (8 files)

```
.ulw/observability/grafana-dashboards/dora-metrics.json
.ulw/observability/grafana-dashboards/review-pipeline-health.json
.ulw/pipeline/deployment-strategies.yml
.ulw/pipeline/pipeline.yml
.ulw/review-policies/_shared.yaml
.ulw/review-policies/code-generation.yaml
.ulw/review-policies/deployment.yaml
.ulw/security/semgrep-rules/custom-rules.yaml
```

**Rationale**: All governance policies, review thresholds, deployment strategies, and security rules in `.ulw/` are version-controlled and remain valid for v2. The pipeline loads these per-repository policies when triggered.

### 4.10 Root Configuration Files

```
package.json                         — updated (remove NestJS/tRPC/Drizzle/NATS deps)
pnpm-workspace.yaml                  — updated (remove BC/core/apps entries)
tsconfig.base.json                   — kept (base TypeScript config unchanged)
eslint.config.mjs                    — kept (lint rules unchanged)
oxlintrc.json                        — kept (fast lint config unchanged)
.prettierrc                          — kept (formatting config unchanged)
vitest.workspace.ts                  — updated (remove BC/core/apps references)
AGENTS.md                            — kept (agent context definition)
README.md                            — updated (reflect v2 architecture)
docker-compose.yml                   — updated (remove PG + NATS, add OpenClaw)
pnpm-lock.yaml                       — regenerated after dependency changes
```

**Total files kept (approximate): ~100 source + config files**

---

## 5. What to Create

### 5.1 Pipeline Package — `packages/pipeline/` (10 files)

A lightweight TypeScript package providing the pipeline state model. These are plain type definitions and enums — no business logic, no DDD classes, no persistence layer.

```
packages/pipeline/src/state-model.ts         — PipelineStage enum, PipelineRun, StageResult, PipelineRunStatus, StageStatus types
packages/pipeline/src/stage-executor.ts       — stage dispatch logic: advanceStage(), retryStage(), failStage()
packages/pipeline/src/pipeline.ts             — pipeline orchestration entry: createPipelineRun(), getNextStage(), validateStageTransition()
packages/pipeline/package.json                — npm package metadata
packages/pipeline/tsconfig.json              — TypeScript config (extends tsconfig.base.json)
packages/pipeline/vitest.config.ts           — Vitest config with coverage
packages/pipeline/tests/state-model.test.ts   — unit tests for type guards, enum values, serialization
packages/pipeline/tests/stage-executor.test.ts — unit tests for stage dispatch, retry, failure logic
packages/pipeline/src/index.ts               — barrel export
packages/pipeline/README.md                  — package documentation (optional)
```

**Key Types** (from DESIGN_v2.md Section 4.3):

```typescript
// packages/pipeline/src/state-model.ts
export enum PipelineStage {
  SPEC_PARSING = 'SPEC_PARSING',
  ARCHITECTURE_DESIGN = 'ARCHITECTURE_DESIGN',
  TDD_CODE_GEN = 'TDD_CODE_GEN',
  CODE_REVIEW = 'CODE_REVIEW',
  AUTOMATED_TESTING = 'AUTOMATED_TESTING',
  DEPLOYMENT = 'DEPLOYMENT',
}

export type PipelineRunStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ABANDONED';

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED';

export interface PipelineRun {
  pipelineId: string;                     // UUID
  specRef: { repo: string; commitSHA: string; filePath: string };
  status: PipelineRunStatus;
  currentStage: PipelineStage;
  stages: Record<PipelineStage, StageResult>;
  startedAt: string;                      // ISO8601
  completedAt: string | null;
  retryCount: number;
  triggeredBy: string;
}

export interface StageResult {
  stage: PipelineStage;
  status: StageStatus;
  startedAt: string;
  completedAt: string | null;
  artifactKeys: string[];                // MinIO object keys
  findings?: Finding[];                   // only for CODE_REVIEW stage
  errorMessage: string | null;
  retryCount: number;
}
```

**Rationale**: The pipeline package is the only new TypeScript code needed. It defines the types that OpenClaw, agents, and dashboard consumers use to track pipeline state. This is a plain type package with no runtime dependencies beyond TypeScript.

### 5.2 Skills — `skills/spec-parser/SKILL.md` and `skills/pipeline-orchestrator/SKILL.md`

#### skills/spec-parser/SKILL.md

A skill that defines how to parse Markdown specification documents into Zod-validated structured JSON. This is used by the spec-parser agent in Stage 1.

**Content outline**:
- Purpose: Parse Markdown spec documents into StructuredSpec JSON
- Input format: Markdown with sections (Overview, User Stories, Acceptance Criteria, Data Models, API Contracts, Constraints)
- Output format: Zod-validated `structured-spec.json`
- Validation rules: required sections, field constraints, relationship validation
- Error reporting: line references back to original Markdown
- Tool bindings: Read (file reading), Write (JSON output), Bash (validation)

#### skills/pipeline-orchestrator/SKILL.md

A skill that defines how OpenClaw orchestrates the 6-stage pipeline. This is the cross-stage coordination logic that OpenClaw loads at startup.

**Content outline**:
- Purpose: Orchestrate the 6-stage SDD+TDD pipeline
- Stage dispatch: sequential execution, stage input/output contracts
- Failure handling: retries, backoff, abandon after 3 failures
- Gate management: deployment approval gate logic
- Artifact management: MinIO storage paths, artifact naming conventions
- Tool bindings: Read, Bash, agent dispatch configuration

### 5.3 OpenClaw Configuration — `openclaw.config.yml`

A single YAML configuration file at the repository root. This replaces ~15 v1 configuration files.

See DESIGN_v2.md Section 9.2 for the complete reference. Key sections:

- `server:` — host, port, TLS config
- `webhooks:` — GitHub, GitLab, manual CLI triggers
- `pipeline:` — 6 stage definitions with timeouts, retry configs, gate rules, coverage thresholds
- `agents:` — 7 agent identities with skill bindings and tool allowlists
- `skills:` — 8 skill paths with descriptions
- `storage:` — MinIO connection config
- `cache:` — Redis connection config
- `auth:` — Keycloak connection config + RBAC role definitions
- `cron:` — 3 scheduled jobs (nightly security scan, weekly dependency update, artifact cleanup)
- `notifications:` — Slack, GitHub, email notification config
- `observability:` — OpenTelemetry, Prometheus, logging config

### 5.4 Agent Identity Files — New v2 Agents (21 files)

New agent identities for the 7 pipeline stage agents + 6 review sub-agents, organized under `agents/`:

```
agents/spec-parser/SOUL.md
agents/spec-parser/AGENTS.md
agents/spec-parser/TOOLS.md
agents/architect/SOUL.md
agents/architect/AGENTS.md
agents/architect/TOOLS.md
agents/tdd-coder/SOUL.md
agents/tdd-coder/AGENTS.md
agents/tdd-coder/TOOLS.md
agents/reviewer/SOUL.md
agents/reviewer/AGENTS.md
agents/reviewer/TOOLS.md
agents/reviewer/sub-agents/architecture-checker/SOUL.md
agents/reviewer/sub-agents/architecture-checker/AGENTS.md
agents/reviewer/sub-agents/architecture-checker/TOOLS.md
agents/reviewer/sub-agents/style-checker/SOUL.md
agents/reviewer/sub-agents/style-checker/AGENTS.md
agents/reviewer/sub-agents/style-checker/TOOLS.md
agents/reviewer/sub-agents/dependency-checker/SOUL.md
agents/reviewer/sub-agents/dependency-checker/AGENTS.md
agents/reviewer/sub-agents/dependency-checker/TOOLS.md
agents/tester/SOUL.md
agents/tester/AGENTS.md
agents/tester/TOOLS.md
agents/deployer/SOUL.md
agents/deployer/AGENTS.md
agents/deployer/TOOLS.md
```

**Total new files created: ~15 source files + ~21 agent identity files = ~36 files**
(Agent identity files are counted as "repurpose from v1" for 4 agents with v1 predecessors, and "create new" for 3 agents without predecessors.)

---

## 6. Phase-by-Phase Execution Plan

### Phase 0: Create New — Pipeline Package + Skills + Config (Risk-Free)

**Goal**: Add new v2 files without touching any existing code. This phase is zero-risk because it only creates files — nothing is deleted or modified.

**Duration**: 2–3 hours

**Tasks**:
1. Create `packages/pipeline/` directory with all 10 files
2. Create `skills/spec-parser/SKILL.md`
3. Create `skills/pipeline-orchestrator/SKILL.md`
4. Create `openclaw.config.yml` from DESIGN_v2.md Section 9.2 template

**Verification**:
```bash
pnpm --filter @ulw/pipeline typecheck   # pipeline types must compile
pnpm --filter @ulw/pipeline test        # pipeline tests must pass
ls -la packages/pipeline/src/           # verify all 5 source files exist
ls -la packages/pipeline/tests/         # verify all 2 test files exist
ls -la skills/spec-parser/SKILL.md      # verify skill file exists
ls -la skills/pipeline-orchestrator/SKILL.md  # verify skill file exists
ls -la openclaw.config.yml              # verify config file exists
```

### Phase 1: Refactor Shared Packages

**Goal**: Update shared packages for the pipeline model without breaking the monorepo build.

**Duration**: 3–4 hours

**Tasks**:

1. **Refactor `packages/shared/types/src/`**:
   - Remove NATS subject constants from `events.ts`
   - Remove `AgentRole`, `AgentSession`, `AgentMessage` from `agent.ts` (replaced by OpenClaw session model)
   - Remove `ApprovalGate`, `CanaryRule`, and old `PipelineStage` from `pipeline.ts`
   - Add new `PipelineStage` enum (6 stages) to `pipeline.ts`
   - Add `PipelineRun`, `StageResult`, `StageStatus`, `PipelineRunStatus` type exports
   - Add `PipelineEvent` union type
   - Update barrel exports in `index.ts`

2. **Rewrite `packages/shared/events/src/schemas/`**:
   - Replace all 7 NATS event schema files with 6 pipeline event schemas:
     - `pipeline-events.ts`: StageStartedEvent, StageCompletedEvent
     - `pipeline-lifecycle.ts`: PipelineStartedEvent, PipelineFailedEvent, PipelineCompletedEvent
     - `approval-events.ts`: UserApprovalRequested, UserApprovalReceived
   - Remove `subject-registry.ts` (no longer needed)
   - Update `envelope.ts` for pipeline event format
   - Update barrel exports in `index.ts`

3. **Refactor `packages/shared/config/src/`**:
   - Update `loader.ts` to load `openclaw.config.yml` (YAML)
   - Simplify `schema.ts` for single-file config (remove multi-source merge logic)
   - Update `defaults.ts` for v2 default values
   - Keep `secrets.ts` and `validator.ts` as-is

4. **Update `pnpm-workspace.yaml`**:
   - Remove `packages/bc/*`, `packages/core/*`, `apps/*` entries
   - Add `packages/pipeline/*` entry
   - Remove NestJS, tRPC, Drizzle, NATS, Passport from `catalog:`

5. **Update `vitest.workspace.ts`**:
   - Remove BC, core, and app workspace references
   - Keep shared and acl workspace references
   - Add pipeline workspace reference

6. **Update root `package.json`**:
   - Remove `"dev": "pnpm --filter @ulw/api-gateway dev"` script
   - Remove v1 `devDependencies` (NestJS, tRPC, etc.)

**Verification**:
```bash
pnpm typecheck     # must pass — no BC/core/app references remain
pnpm lint          # must pass
pnpm test          # existing shared tests must still pass
cat pnpm-workspace.yaml | grep "packages/bc"   # must return empty
cat pnpm-workspace.yaml | grep "packages/pipeline"  # must return the entry
```

### Phase 2: Delete Old Packages — BCs, Core, API Gateway

**Goal**: Remove all v1-specific packages. This is the largest phase by file count but mechanically simple (pure deletion).

**Duration**: 1–2 hours

**Tasks**:
1. Delete entire `packages/bc/` directory (all 6 bounded contexts: pm, ad, cg, cr, ta, dp)
2. Delete entire `packages/core/` directory (orchestrator + supervisor)
3. Delete entire `apps/` directory (api-gateway)
4. Clean up empty parent directories if needed

**Verification**:
```bash
ls packages/bc/   # must return "No such file or directory"
ls packages/core/ # must return "No such file or directory"
ls apps/          # must return "No such file or directory"
pnpm typecheck    # must pass (no broken imports)
pnpm build        # must pass (only shared + pipeline + acl packages build)
```

### Phase 3: Refine ACLs — Remove NestJS Patterns

**Goal**: Strip NestJS dependency injection patterns from ACL interface files. ACLs become pure TypeScript interfaces with no framework dependencies.

**Duration**: 1 hour

**Tasks**:
1. Review each `packages/acl/*/src/index.ts` for `@Injectable()` decorators — remove them
2. Review each `packages/acl/*/src/index.ts` for `@nestjs/common` imports — remove them
3. Verify all interface signatures match DESIGN_v2.md Section 4.5
4. Update package.json for each ACL to remove `@nestjs/common` dependency

**Verification**:
```bash
grep -r "@Injectable" packages/acl/   # must return no matches
grep -r "@nestjs" packages/acl/       # must return no matches in source files
pnpm typecheck                         # must pass
```

### Phase 4: Repurpose Agents — Restructure by Pipeline Stage

**Goal**: Restructure the `agents/` directory from v1 BC-based organization to v2 pipeline stage-based organization.

**Duration**: 4–6 hours

**Tasks**:
1. Create new directories: `agents/spec-parser/`, `agents/architect/`, `agents/tdd-coder/`, `agents/reviewer/`, `agents/reviewer/sub-agents/`, `agents/tester/`, `agents/deployer/`
2. Repurpose v1 steward agents:
   - `agents/pm-steward/*` → rewrite as `agents/spec-parser/*`
   - `agents/ad-steward/*` → rewrite as `agents/architect/*`
   - `agents/cg-steward/*` → rewrite as `agents/tdd-coder/*`
   - `agents/cr-steward/*` → rewrite as `agents/reviewer/*`
   - `agents/ta-steward/*` → rewrite as `agents/tester/*`
   - `agents/dp-steward/*` → rewrite as `agents/deployer/*`
3. Repurpose review sub-agents:
   - `agents/code-reviewer/*` → rewrite as `agents/reviewer/sub-agents/static-analyzer/*`
   - `agents/security-auditor/*` → rewrite as `agents/reviewer/sub-agents/security-auditor/*`
   - `agents/contract-validator/*` → rewrite as `agents/reviewer/sub-agents/contract-validator/*`
4. Create new review sub-agents from scratch:
   - `agents/reviewer/sub-agents/architecture-checker/*`
   - `agents/reviewer/sub-agents/style-checker/*`
   - `agents/reviewer/sub-agents/dependency-checker/*`
5. Delete obsolete v1 agents:
   - `agents/orchestrator/`
   - `agents/supervisor/`
   - `agents/deploy-agent/` (merged into deployer)
   - `agents/tdd-test-agent/` (merged into tdd-coder + tester)
6. Update SOUL.md, AGENTS.md, TOOLS.md for each v2 agent with pipeline stage context

**Verification**:
```bash
find agents/ -type f -name "*.md" | sort     # verify 33 files (11 agents × 3)
find agents/ -type d | sort                   # verify directory structure matches DESIGN_v2.md Section 6.6
ls agents/orchestrator/ 2>/dev/null           # must return empty (deleted)
ls agents/supervisor/ 2>/dev/null             # must return empty (deleted)
```

---

## 7. Atomic Commit Strategy

Follow **Conventional Commits** with scope prefixes. Commits ordered to keep main buildable at each step.

### Commit Sequence

```
# Phase 0: Create new (no risk — additive only)
feat(pipeline): add pipeline state model package
feat(pipeline): add stage executor with dispatch and retry logic
test(pipeline): add unit tests for PipelineStage enum and PipelineRun types
test(pipeline): add unit tests for stage executor dispatch and retry
feat(skills): add spec-parser skill for Stage 1 spec parsing
feat(skills): add pipeline-orchestrator skill for cross-stage coordination
chore: add OpenClaw configuration (openclaw.config.yml)
chore(workspace): add pipeline package to pnpm-workspace.yaml

# Phase 1: Refactor shared packages
refactor(shared-events): replace NATS event schemas with pipeline event Zod schemas
refactor(shared-events): remove subject-registry (NATS-specific)
refactor(shared-types): remove NATS subject constants and AgentRole/AgentSession types
refactor(shared-types): add PipelineStage enum and PipelineRun/StageResult types
refactor(shared-config): update config loader for openclaw.config.yml
chore(workspace): remove NestJS/tRPC/Drizzle/NATS from pnpm catalog
chore(workspace): update vitest.workspace.ts for v2 package set

# Phase 2: Delete old packages (one commit per BC)
chore(bc-pm): remove Project Management bounded context (30 files)
chore(bc-ad): remove Architecture Design bounded context (28 files)
chore(bc-cg): remove Code Generation bounded context (26 files)
chore(bc-cr): remove Code Review bounded context (26 files)
chore(bc-ta): remove Test Automation bounded context (26 files)
chore(bc-dp): remove Deployment bounded context (26 files)
chore(core): remove Orchestrator and Supervisor packages (40 files)
chore(app): remove API Gateway application (24 files)
chore(workspace): update pnpm-workspace.yaml — remove BC/core/apps entries

# Phase 3: Refine ACLs
refactor(acl): remove NestJS decorators and imports from ACL interface files
refactor(acl): update ACL interfaces for OpenClaw-native invocation

# Phase 4: Repurpose agents
refactor(agents): repurpose pm-steward → spec-parser for Stage 1
refactor(agents): repurpose ad-steward → architect for Stage 2
refactor(agents): repurpose cg-steward → tdd-coder for Stage 3
refactor(agents): repurpose cr-steward → reviewer for Stage 4
refactor(agents): repurpose ta-steward → tester for Stage 5
refactor(agents): repurpose dp-steward → deployer for Stage 6
refactor(agents): repurpose code-reviewer → static-analyzer sub-agent
refactor(agents): repurpose security-auditor → security-auditor sub-agent
refactor(agents): repurpose contract-validator → contract-validator sub-agent
feat(agents): create architecture-checker sub-agent for review
feat(agents): create style-checker sub-agent for review
feat(agents): create dependency-checker sub-agent for review
chore(agents): remove orchestrator and supervisor agent identities

# Phase 5: Infrastructure cleanup
refactor(infra): remove PostgreSQL and NATS from Pulumi stacks
refactor(infra): add OpenClaw Gateway deployment resource
refactor(infra): add OpenCode job pod template
refactor(docker): remove PostgreSQL and NATS from docker-compose.yml
feat(docker): add OpenClaw Gateway to docker-compose.yml
```

### Branch Strategy

```
main
  └── feat/v2-migration
       ├── Phase 0 commits (pipeline + skills + config)  ← merge first
       ├── Phase 1 commits (shared refactor)              ← merge second
       ├── Phase 2 commits (delete BCs + core + app)     ← merge third
       ├── Phase 3 commits (ACL refine)                   ← merge fourth
       ├── Phase 4 commits (agent repurpose)              ← merge fifth
       └── Phase 5 commits (infra cleanup)                ← merge last
```

Each phase is a PR. Merge phases sequentially — never merge Phase 2 before Phase 1.

---

## 8. TODO Checklist

Items organized by phase. Format: `- [ ] [priority][effort] <file-path> — <description>`

### Phase 0: Create New (P0)

- [ ] [P0][S] Create `packages/pipeline/package.json` — npm package metadata with `@ulw/pipeline` name
- [ ] [P0][S] Create `packages/pipeline/tsconfig.json` — extends tsconfig.base.json
- [ ] [P0][S] Create `packages/pipeline/vitest.config.ts` — Vitest config with coverage provider
- [ ] [P0][M] Create `packages/pipeline/src/state-model.ts` — PipelineStage enum, PipelineRun, StageResult types
- [ ] [P0][M] Create `packages/pipeline/src/stage-executor.ts` — stage advance/retry/fail dispatch functions
- [ ] [P0][S] Create `packages/pipeline/src/pipeline.ts` — createPipelineRun(), getNextStage(), validateStageTransition()
- [ ] [P0][S] Create `packages/pipeline/src/index.ts` — barrel export of all public types
- [ ] [P0][S] Create `packages/pipeline/tests/state-model.test.ts` — test PipelineStage enum values and type guards
- [ ] [P0][S] Create `packages/pipeline/tests/stage-executor.test.ts` — test stage dispatch and retry logic
- [ ] [P0][M] Create `skills/spec-parser/SKILL.md` — Markdown spec parsing skill with Zod validation
- [ ] [P0][M] Create `skills/pipeline-orchestrator/SKILL.md` — pipeline orchestration skill with stage dispatch
- [ ] [P0][M] Create `openclaw.config.yml` — full configuration from DESIGN_v2.md Section 9.2 template
- [ ] [P0][XS] Run `pnpm --filter @ulw/pipeline typecheck` — verify pipeline types compile
- [ ] [P0][XS] Run `pnpm --filter @ulw/pipeline test` — verify pipeline tests pass

### Phase 1: Refactor Shared (P0)

- [ ] [P0][S] Update `packages/shared/types/src/events.ts` — remove NATS subject constants, add pipeline event type aliases
- [ ] [P0][S] Update `packages/shared/types/src/pipeline.ts` — replace old pipeline types with PipelineStage enum, PipelineRun, StageResult
- [ ] [P0][S] Update `packages/shared/types/src/agent.ts` — update AgentType enum for 7 v2 pipeline agents
- [ ] [P0][S] Update `packages/shared/types/src/index.ts` — update barrel exports for v2 types
- [ ] [P0][S] Remove `packages/shared/types/src/workflow.ts` — old workflow types not needed in v2
- [ ] [P0][M] Rewrite `packages/shared/events/src/schemas/project-events.ts` → `pipeline-events.ts` — StageStartedEvent + StageCompletedEvent
- [ ] [P0][M] Rewrite `packages/shared/events/src/schemas/architecture-events.ts` → `pipeline-lifecycle.ts` — PipelineStartedEvent + PipelineFailedEvent + PipelineCompletedEvent
- [ ] [P0][S] Rewrite `packages/shared/events/src/schemas/code-events.ts` → `approval-events.ts` — UserApprovalRequested + UserApprovalReceived
- [ ] [P0][S] Keep `packages/shared/events/src/schemas/security-events.ts` — SecretDetected and PolicyViolation still used by security-auditor
- [ ] [P0][S] Remove `packages/shared/events/src/schemas/review-events.ts` — review events now part of pipeline lifecycle
- [ ] [P0][S] Remove `packages/shared/events/src/schemas/testing-events.ts` — test events now part of pipeline lifecycle
- [ ] [P0][S] Remove `packages/shared/events/src/schemas/deployment-events.ts` — deployment events now part of pipeline lifecycle
- [ ] [P0][S] Remove `packages/shared/events/src/subject-registry.ts` — no NATS subjects in v2
- [ ] [P0][S] Update `packages/shared/events/src/index.ts` — barrel exports for new event schemas
- [ ] [P0][S] Update `packages/shared/config/src/loader.ts` — add YAML loading for openclaw.config.yml
- [ ] [P0][S] Update `packages/shared/config/src/schema.ts` — simplify for single-file config, remove multi-source merge
- [ ] [P0][XS] Update `packages/shared/config/src/defaults.ts` — add v2 pipeline default values
- [ ] [P0][XS] Update `pnpm-workspace.yaml` — remove `packages/bc/*`, `packages/core/*`, `apps/*`; add `packages/pipeline/*`
- [ ] [P0][XS] Update `pnpm-workspace.yaml` catalog — remove NestJS, tRPC, Drizzle, NATS, Passport dependencies
- [ ] [P0][XS] Update `vitest.workspace.ts` — remove BC/core/app workspace references, keep shared/acl/pipeline
- [ ] [P0][XS] Update root `package.json` — remove `"dev"` script, remove v1 devDependencies
- [ ] [P0][XS] Run `pnpm typecheck` — must pass with no BC/core/app imports
- [ ] [P0][XS] Run `pnpm lint` — must pass
- [ ] [P0][XS] Run `pnpm test` — existing shared tests must still pass

### Phase 2: Delete Old (P0)

- [ ] [P0][M] Delete `packages/bc/pm/` — 30 files (Project Management BC)
- [ ] [P0][M] Delete `packages/bc/ad/` — 28 files (Architecture Design BC)
- [ ] [P0][M] Delete `packages/bc/cg/` — 26 files (Code Generation BC)
- [ ] [P0][M] Delete `packages/bc/cr/` — 26 files (Code Review BC)
- [ ] [P0][M] Delete `packages/bc/ta/` — 26 files (Test Automation BC)
- [ ] [P0][M] Delete `packages/bc/dp/` — 26 files (Deployment BC)
- [ ] [P0][M] Delete `packages/core/orchestrator/` — 18 files (Orchestrator service)
- [ ] [P0][M] Delete `packages/core/supervisor/` — 22 files (Supervisor service)
- [ ] [P0][M] Delete `apps/api-gateway/` — 24 files (NestJS API Gateway)
- [ ] [P0][XS] Run `rm -rf packages/bc packages/core apps` (if parent dirs are empty after deletion)
- [ ] [P0][XS] Run `pnpm install` — regenerate pnpm-lock.yaml after package removals
- [ ] [P0][XS] Run `pnpm typecheck` — must pass with no broken imports
- [ ] [P0][XS] Run `pnpm build` — must pass with only shared + pipeline + acl packages

### Phase 3: Refine ACLs (P1)

- [ ] [P1][S] Update `packages/acl/opencode-acl/src/index.ts` — remove NestJS decorators, keep pure TypeScript interface
- [ ] [P1][S] Update `packages/acl/openclaw-acl/src/index.ts` — remove NestJS decorators, keep pure TypeScript interface
- [ ] [P1][S] Update `packages/acl/git-acl/src/index.ts` — remove NestJS decorators, keep pure TypeScript interface
- [ ] [P1][S] Update `packages/acl/cicd-acl/src/index.ts` — remove NestJS decorators, keep pure TypeScript interface
- [ ] [P1][S] Update each ACL `package.json` — remove `@nestjs/common` dependency
- [ ] [P1][XS] Run `grep -r "@Injectable" packages/acl/` — must return no matches
- [ ] [P1][XS] Run `grep -r "@nestjs" packages/acl/` — must return no matches in source
- [ ] [P1][XS] Run `pnpm typecheck` — ACL packages must compile without NestJS

### Phase 4: Repurpose Agents (P1)

- [ ] [P1][M] Create `agents/spec-parser/` — SOUL.md, AGENTS.md, TOOLS.md from pm-steward repurpose
- [ ] [P1][M] Create `agents/architect/` — SOUL.md, AGENTS.md, TOOLS.md from ad-steward repurpose
- [ ] [P1][M] Create `agents/tdd-coder/` — SOUL.md, AGENTS.md, TOOLS.md from cg-steward repurpose
- [ ] [P1][M] Create `agents/reviewer/` — SOUL.md, AGENTS.md, TOOLS.md from cr-steward repurpose
- [ ] [P1][M] Create `agents/tester/` — SOUL.md, AGENTS.md, TOOLS.md from ta-steward repurpose
- [ ] [P1][M] Create `agents/deployer/` — SOUL.md, AGENTS.md, TOOLS.md from dp-steward repurpose
- [ ] [P1][M] Repurpose `agents/code-reviewer/` → `agents/reviewer/sub-agents/static-analyzer/`
- [ ] [P1][M] Repurpose `agents/security-auditor/` → `agents/reviewer/sub-agents/security-auditor/`
- [ ] [P1][M] Repurpose `agents/contract-validator/` → `agents/reviewer/sub-agents/contract-validator/`
- [ ] [P1][M] Create `agents/reviewer/sub-agents/architecture-checker/` — new agent (no v1 predecessor)
- [ ] [P1][M] Create `agents/reviewer/sub-agents/style-checker/` — new agent (no v1 predecessor)
- [ ] [P1][M] Create `agents/reviewer/sub-agents/dependency-checker/` — new agent (no v1 predecessor)
- [ ] [P1][S] Delete `agents/orchestrator/`, `agents/supervisor/`, `agents/deploy-agent/`, `agents/tdd-test-agent/`
- [ ] [P1][XS] Run `find agents/ -type f -name "*.md" | wc -l` — must return 33 (11 agents × 3 files)
- [ ] [P1][XS] Run `find agents/ -type d | sort` — verify directory structure matches DESIGN_v2.md Section 6.6

### Phase 5: Infrastructure Cleanup (P2)

- [ ] [P2][S] Update `infrastructure/packages/database/index.ts` — remove PostgreSQL resource definitions
- [ ] [P2][S] Update `infrastructure/packages/messaging/index.ts` — remove NATS resource definitions
- [ ] [P2][M] Add `infrastructure/packages/openclaw/index.ts` — OpenClaw Gateway deployment resource
- [ ] [P2][M] Add `infrastructure/packages/opencode/index.ts` — OpenCode job pod template resource
- [ ] [P2][S] Update `infrastructure/packages/kubernetes/index.ts` — remove BC pod references, add OpenClaw refs
- [ ] [P2][S] Update `docker-compose.yml` — remove PostgreSQL and NATS services
- [ ] [P2][S] Update `docker-compose.yml` — add OpenClaw Gateway service
- [ ] [P2][XS] Run `docker compose config` — verify docker-compose.yml is valid
- [ ] [P2][XS] Run `pnpm typecheck` in infrastructure — verify Pulumi code compiles

---

## 9. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| **Shared domain changes break generated code** | Low | High | Keep `packages/shared/domain/` entirely unchanged in v2. The DDD base classes have zero dependencies on v1 infrastructure. Generated code extending them will not be affected by other package deletions. **If any changes are needed, defer to post-migration.** |
| **ACL interfaces are needed before they're rewritten** | Low | Medium | The ACLs are currently interface-only (0% implementation). They are contracts, not running code. The v2 pipeline does not need them at migration time — OpenClaw natively dispatches agents. ACLs can be refined as documentation first, implemented later. |
| **Agent identity file rewrites take longer than estimated** | Medium | Medium | 11 agents × 3 files each = 33 identity documents. The SOUL.md and TOOLS.md files follow a template pattern. Use the existing v1 files as templates, replacing BC-specific context with pipeline stage context. The structural change (rename + reorganize) is fast; the content rewrites are the bottleneck. Allocate 2 extra hours for content quality. |
| **TypeScript build fails after deleting 226 files** | Low | Low | Phase 2 deletions happen in one commit per BC. Each commit removes a self-contained package with its own imports. Other packages do not import BC internals — only `@ulw/shared-*` types which are preserved. The API Gateway is the only consumer of BC modules, and it is being deleted. **Risk reduced because no cross-package imports exist between BCs and remaining code.** |
| **pnpm-workspace.yaml catalog removal breaks transitive deps** | Medium | Low | After removing NestJS/tRPC/Drizzle/NATS from the catalog, run `pnpm install` to regenerate the lockfile. If any remaining package (shared config, ACLs) has a residual dependency on a removed package, pnpm will flag it. Fix by removing the dependency from the specific package.json. |
| **openclaw.config.yml schema mismatch with runtime** | Medium | Medium | The config file is based on DESIGN_v2.md Section 9.2 which was authored for the v2 architecture. If the OpenClaw runtime expects a different schema, the config will need adjustments. The single-file config approach has fewer schema surface area than 15+ v1 config files — easier to validate and fix. |
| **Migration is reversible at any commit** | N/A | N/A | Every commit in the sequence leaves the workspace buildable. If Phase 2 deletion causes unexpected issues, revert to the Phase 1 commit. Each bounded context deletion is a separate commit — roll back only the problematic one. **Recommended: push each phase's commits to a branch before merging to main.** |
| **Agent restructuring breaks OpenClaw agent discovery** | Low | Medium | OpenClaw discovers agents by directory convention (`agents/<name>/SOUL.md`). As long as SOUL.md files exist at the expected paths, discovery works. The v2 agent names (spec-parser, architect, tdd-coder, etc.) must match the `identityPath` values in `openclaw.config.yml`. Verify the mapping before merging Phase 4. |
| **Docker Compose no longer starts API Gateway** | Low | Low | The `pnpm dev` script pointed to `@ulw/api-gateway`. After deletion, local development workflow changes. In v2, `docker compose up` starts OpenClaw Gateway, Redis, MinIO, and Keycloak. The pipeline UI/API is at `localhost:8080` (OpenClaw) instead of `localhost:3000` (NestJS). Update README.md with new local development commands. |
| **Vitest workspace references stale packages** | Medium | Low | `vitest.workspace.ts` currently lists all 16 packages. After deleting BC + core + app, 10 packages remain. If vitest is run before updating the workspace config, it will fail with missing workspace errors. This is caught by running `pnpm test` as a verification step. Fix is updating `vitest.workspace.ts` in Phase 1 before Phase 2 deletes. |
| **Residual NestJS patterns in remaining tests** | Low | Low | Some shared package tests or acl test configs may reference `@nestjs/testing` or use NestJS test utilities. These will break after dependency removal. Grep for `@nestjs` in all remaining packages before finalizing Phase 1. |

---

## Appendix A: pnpm-workspace.yaml — Detailed Catalog Changes

### Before (v1)

```yaml
packages:
  - "packages/shared/*"
  - "packages/bc/*"          # ← DELETE
  - "packages/core/*"        # ← DELETE
  - "packages/acl/*"
  - "apps/*"                 # ← DELETE

catalog:
  # Runtime
  typescript: ^5.7.0
  "@types/node": ^22.0.0
  zod: ^3.23.0

  # NestJS                     ← DELETE all 4 lines
  "@nestjs/common": ^10.4.0
  "@nestjs/core": ^10.4.0
  "@nestjs/platform-express": ^10.4.0
  "@nestjs/testing": ^10.4.0
  "@nestjs/trpc": ^0.4.0

  # tRPC                       ← DELETE all 3 lines
  "@trpc/server": ^11.0.0
  "@trpc/client": ^11.0.0

  # Database                   ← DELETE all 3 lines
  drizzle-orm: ^0.40.0
  drizzle-kit: ^0.28.0
  postgres: ^3.4.0

  # Messaging & Caching
  nats: ^2.28.0               ← DELETE (keep ioredis)
  ioredis: ^5.4.0

  # Auth                       ← DELETE all 3 lines
  passport: ^0.7.0
  passport-jwt: ^4.0.1
  "@nestjs/jwt": ^10.2.0

  # Object Storage             ← KEEP
  "@aws-sdk/client-s3": ^3.600.0

  # Observability              ← KEEP all
  "@opentelemetry/api": ^1.9.0
  "@opentelemetry/sdk-node": ^0.53.0

  # Kubernetes                 ← KEEP
  "@kubernetes/client-node": ^1.0.0

  # Testing                    ← KEEP all
  vitest: ^3.0.0
  "@vitest/coverage-v8": ^3.0.0
  "@playwright/test": ^1.50.0
  "@pact-foundation/pact": ^13.0.0

  # Linting                    ← KEEP all
  eslint: ^9.0.0
  prettier: ^3.4.0
  oxlint: ^0.15.0
  typescript-eslint: ^8.0.0
  eslint-plugin-import: ^2.31.0
  eslint-plugin-unicorn: ^56.0.0

  # Build                      ← KEEP all
  tsup: ^8.3.0
  tsx: ^4.19.0
```

### After (v2)

```yaml
packages:
  - "packages/shared/*"
  - "packages/acl/*"
  - "packages/pipeline/*"    # ← NEW

catalog:
  # Runtime
  typescript: ^5.7.0
  "@types/node": ^22.0.0
  zod: ^3.23.0

  # Messaging & Caching
  ioredis: ^5.4.0

  # Object Storage
  "@aws-sdk/client-s3": ^3.600.0

  # Observability
  "@opentelemetry/api": ^1.9.0
  "@opentelemetry/sdk-node": ^0.53.0

  # Kubernetes
  "@kubernetes/client-node": ^1.0.0

  # Testing
  vitest: ^3.0.0
  "@vitest/coverage-v8": ^3.0.0
  "@playwright/test": ^1.50.0
  "@pact-foundation/pact": ^13.0.0

  # Linting
  eslint: ^9.0.0
  prettier: ^3.4.0
  oxlint: ^0.15.0
  typescript-eslint: ^8.0.0
  eslint-plugin-import: ^2.31.0
  eslint-plugin-unicorn: ^56.0.0

  # Build
  tsup: ^8.3.0
  tsx: ^4.19.0
```

**Removed catalog entries**: NestJS (5), tRPC (3), Drizzle/PostgreSQL (3), NATS (1), Passport/JWT (3) = 15 dependencies removed. Total catalog lines reduced from 66 to 44.

---

## Appendix B: docker-compose.yml — Migration Detail

### Before (v1 — 6 services)

```yaml
services:
  postgres:           # ← DELETE
    image: postgres:16-alpine
    ...
  redis:              # ← KEEP
    image: redis:7-alpine
    ...
  nats:               # ← DELETE
    image: nats:2.10-alpine
    ...
  minio:              # ← KEEP
    image: minio/minio:latest
    ...
  keycloak:           # ← KEEP
    image: quay.io/keycloak/keycloak:latest
    ...
  api-gateway:        # ← DELETE
    image: api-gateway:latest
    ...
```

### After (v2 — 4 services)

```yaml
services:
  openclaw:           # ← NEW
    image: openclaw-gateway:latest
    ports:
      - "8080:8080"
    volumes:
      - ./openclaw.config.yml:/etc/openclaw/config.yml
    depends_on:
      - redis
      - minio
      - keycloak

  redis:              # ← UNCHANGED
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:              # ← UNCHANGED
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

  keycloak:           # ← UNCHANGED
    image: quay.io/keycloak/keycloak:latest
    ports:
      - "8443:8443"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: changeme
    command: start-dev

volumes:
  minio-data:
```

**Removed services**: PostgreSQL (port 5432), NATS (port 4222), API Gateway (port 3000).
**Added service**: OpenClaw Gateway (port 8080).

---

## Appendix C: Post-Migration Verification Checklist

After completing all 5 phases, perform these end-to-end verifications:

### C.1 Monorepo Health

```bash
# Verify directory structure
ls packages/shared/domain/     # must exist (DDD base classes)
ls packages/shared/types/      # must exist (shared types)
ls packages/shared/events/     # must exist (Zod event schemas)
ls packages/shared/config/     # must exist (config loader)
ls packages/acl/               # must exist (4 ACL interface packages)
ls packages/pipeline/          # must exist (new pipeline state types)
ls agents/spec-parser/         # must exist (7 pipeline agents)
ls agents/architect/           # must exist
ls agents/tdd-coder/           # must exist
ls agents/reviewer/            # must exist
ls agents/tester/              # must exist
ls agents/deployer/            # must exist
ls agents/reviewer/sub-agents/ # must exist (6 sub-agents)
ls skills/                     # must have 8 SKILL.md files
ls infrastructure/             # must have simplified Pulumi stack
ls openclaw.config.yml         # must exist
ls .ulw/                       # must exist (governance policies)

# Verify deleted directories are gone
ls packages/bc/   2>/dev/null && echo "FAIL: bc/ exists" || echo "PASS: bc/ removed"
ls packages/core/ 2>/dev/null && echo "FAIL: core/ exists" || echo "PASS: core/ removed"
ls apps/          2>/dev/null && echo "FAIL: apps/ exists" || echo "PASS: apps/ removed"

# Verify no broken imports in remaining code
! grep -r "from '@ulw/bc-" packages/ --include="*.ts" || echo "FAIL: BC imports found"
! grep -r "from '@ulw/orchestrator'" packages/ --include="*.ts" || echo "FAIL: orchestrator imports found"
! grep -r "from '@ulw/supervisor'" packages/ --include="*.ts" || echo "FAIL: supervisor imports found"
! grep -r "@nestjs" packages/acl/ --include="*.ts" || echo "FAIL: NestJS in ACLs"
```

### C.2 Build Verification

```bash
pnpm install        # regenerate lockfile
pnpm typecheck      # TypeScript must pass
pnpm lint           # ESLint + Oxlint must pass
pnpm build          # all remaining packages must compile
pnpm test           # all remaining tests must pass
pnpm format:check   # code formatting must be consistent
```

### C.3 V2-Specific Verification

```bash
# Pipeline package is importable
node -e "require('@ulw/pipeline')" 2>/dev/null || echo "Cannot resolve @ulw/pipeline (expected if not built)"

# Agent structure matches openclaw.config.yml
grep "identityPath" openclaw.config.yml | while read line; do
  dir=$(echo "$line" | grep -o '"agents/[^"]*"' | tr -d '"')
  [ -d "$dir" ] && echo "PASS: $dir" || echo "FAIL: $dir missing"
done

# Skill paths are valid
grep "path:" openclaw.config.yml | grep skills/ | while read line; do
  path=$(echo "$line" | grep -o '"skills/[^"]*"' | tr -d '"')
  [ -f "${path}/SKILL.md" ] && echo "PASS: ${path}/SKILL.md" || echo "FAIL: ${path}/SKILL.md missing"
done

# All 6 pipeline stages defined in configuration
grep -A1 "name:" openclaw.config.yml | grep -E "spec-parsing|architecture-design|tdd-code-generation|code-review|automated-testing|one-click-deployment" | wc -l
# Expected output: 6
```

### C.4 File Count Verification

```bash
# Total source files after migration (approximate)
find packages/ -name "*.ts" -not -path "*/dist/*" -not -path "*/node_modules/*" | wc -l
# Expected: ~40-50 (down from ~293 in v1)

# Agent identity files
find agents/ -name "*.md" | wc -l
# Expected: 33 (11 agents × 3 files each)

# Skill files
find skills/ -name "SKILL.md" | wc -l
# Expected: 8

# Infrastructure files
find infrastructure/ -name "*.ts" -not -path "*/node_modules/*" | wc -l
# Expected: ~10 (down from 15, PG + NATS removed)
```

---

> **Document Status**: Planning v2.0 — 2026-04-30
> **Next Steps**: Stakeholder review → Phase 0 execution (pipeline package creation) → Phase 1 (shared refactor) → Phase 2 (deletion) → Phase 3 (ACL) → Phase 4 (agents) → Phase 5 (infra)
> **Based on**: DESIGN_v2.md (2035 lines), current v1 monorepo state (verified via `find packages/ apps/ -type f`)
