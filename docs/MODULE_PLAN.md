# ulw (UltraWork) — Module Completion Plan

> **Version**: v1.0
> **Date**: 2026-04-29
> **Status**: Planning Phase
> **Based on**: DESIGN.md v1.0, current monorepo state (293 TS source files, 21 commits, 16 packages)
> **Strategy**: BCs with mock ACLs first → validate domain logic → upgrade to real ACLs

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Atomic Commit Strategy](#atomic-commit-strategy)
3. [A. Shared Foundation](#a-shared-foundation)
4. [B. Bounded Contexts](#b-bounded-contexts)
5. [C. Core Engine](#c-core-engine)
6. [D. API Gateway](#d-api-gateway)
7. [E. ACL Implementations](#e-acl-implementations)
8. [F. Infrastructure & CI/CD](#f-infrastructure--cicd)
9. [G. Integration & End-to-End Flow](#g-integration--end-to-end-flow)
10. [H. Testing & Quality Gates](#h-testing--quality-gates)
11. [Dependency Graph & Execution Order](#dependency-graph--execution-order)
12. [Risk Register](#risk-register)

---

## Executive Summary

The ulw monorepo skeleton is initialized with all 16 packages scaffolded, all domain interfaces defined, CI/CD pipelines active, and infrastructure IaC in place. The critical gap is **implementation code**: use cases, ACL adapters, DAG execution, NATS messaging, controllers, and tests are overwhelmingly stubs or not yet written.

**Total effort estimate**: ~34 person-weeks (8-9 weeks x 4 developers) to reach MVP.

**Key findings from codebase exploration**:
- Domain entities and value objects are **complete and production-quality** across all 6 BCs
- Shared packages (types, domain, events, config) are **~95% complete** but have **zero tests**
- **All 30 repository implementations** across 6 BCs throw `Error('Not implemented')`
- **Zero Drizzle migrations** have been generated for any BC
- **8 of 22 NATS event subjects** have no corresponding event interface in any BC
- TA BC has a bug: `TestPassedEvent` and `TestFailedEvent` share the same NATS subject
- All 4 ACL packages are **pure interface definitions** (0% implementation)
- Orchestrator DAG decomposition is real; Supervisor DAG execution is a stub

### Completion by Module Group

| Module Group | Current | Target | Est. Effort | Priority |
|---|---|---|---|---|
| A. Shared Foundation | 95% | 100% | S (1w) | P0 |
| B. Bounded Contexts | 25% | 100% | L (8w) | P1 |
| C. Core Engine | 60% | 100% | L (6w) | P0 |
| D. API Gateway | 80% | 100% | M (3w) | P1 |
| E. ACL Implementations | 0% | 100% | L (6w) | P0 |
| F. Infrastructure & CI/CD | 90% | 100% | S (1w) | P2 |
| G. Integration & E2E | 0% | 100% | M (3w) | P1 |
| H. Testing & Quality Gates | 2% | 100% | L (6w) | P0 |

---

## Atomic Commit Strategy

Follow **Conventional Commits** with BC scope prefixes. TDD enforced: every production commit must have a preceding commit with a failing test.

```
feat(bc-pm): implement StoryCreated event publishing in use cases
test(bc-pm): add failing test for StoryCreated event on createStory
fix(shared): deduplicate topologicalSort between decomposer and executor
refactor(bc-cr): migrate severity from varchar to pgEnum
chore(bc-ad): generate initial Drizzle migrations
```

**Commit granularity**: One use-case method, one repository method, or one controller endpoint per commit. No mega-commits.

**Branch strategy**: Feature branch per module (`feat/bc-pm-usecases`, `feat/acl-opencode`, `feat/core-dag-executor`). Squash merge to main.

---

## A. Shared Foundation

### A.1 `@ulw/shared-types`

**Current State** (90%): All domain type definitions, enums, and interfaces complete. NATS subject constants defined in `events.ts`. 0 tests. Subject string duplication with `@ulw/shared-events`.

**Completion Criteria**: Single source of truth for NATS subjects. 100% type-level constraint validation tested.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| A1.1 | Deduplicate NATS subjects — have `types/src/events.ts` re-export from `@ulw/shared-events` subject-registry | `packages/shared/types/src/events.ts` | XS | P0 |
| A1.2 | Add `version: number` to `DomainEvent` interface in types (align with DESIGN.md) | `packages/shared/types/src/domain.ts` | XS | P1 |
| A1.3 | Add missing exports: `Entity`, `ValueObject`, `AggregateRoot` type aliases are thin — verify complete | `packages/shared/types/src/domain.ts` | XS | P2 |

**Dependencies**: None

---

### A.2 `@ulw/shared-domain`

**Current State** (95%): Entity, ValueObject, AggregateRoot, Result<T,E> monad, DomainEvent, 5 domain error types all implemented. Pagination is thin type alias. **0 tests**. `DomainEvent` abstract class lacks `version` field that the interface declares.

**Completion Criteria**: All DDD base classes unit-tested. Result monad comprehensively tested. Pagination has helper functions.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| A2.1 | Write unit tests for `Result<T,E>` — ok/err/isOk/isErr/map/flatMap/match/unwrap/unwrapOr/unwrapOrElse | `packages/shared/domain/src/result.test.ts` | S | P0 |
| A2.2 | Write unit tests for `ValueObject` — equality, hashCode, getEqualityComponents | `packages/shared/domain/src/value-object.test.ts` | S | P0 |
| A2.3 | Write unit tests for `Entity` — identity equality, domain event collection | `packages/shared/domain/src/entity.test.ts` | S | P0 |
| A2.4 | Write unit tests for `AggregateRoot` — pullEvents() transactional semantics, clearEvents | `packages/shared/domain/src/aggregate-root.test.ts` | S | P0 |
| A2.5 | Write unit tests for 5 domain error types — ValidationError, NotFoundError, UnauthorizedError, ConflictError, InvalidOperationError | `packages/shared/domain/src/errors.test.ts` | XS | P0 |
| A2.6 | Write unit tests for `Identifier<T>` — branded type, equality | `packages/shared/domain/src/identifier.test.ts` | XS | P0 |
| A2.7 | Add pagination helper: `toPaginatedResult<T>(items, total, meta)` | `packages/shared/domain/src/pagination.ts` | XS | P2 |
| A2.8 | Add `version` property to `DomainEvent` abstract class (matches `types/domain.ts` interface) | `packages/shared/domain/src/domain-event.ts` | XS | P1 |

**Dependencies**: A1.2 (version field in type interface)

**Estimated Total**: S (1.5 days)

---

### A.3 `@ulw/shared-events`

**Current State** (100% schema scope): All 22 event Zod schemas defined across 7 schema files. Envelope factory implemented. Subject registry defined (duplicated from types). **0 tests**. `BaseEventFields` missing `version` field.

**Completion Criteria**: All 22 schemas validated with round-trip tests. `version` field added. Subject registry is single source of truth.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| A3.1 | Write Zod validation tests for project-events (StoryCreated, StoryReady, SprintCommitted) | `packages/shared/events/src/schemas/project-events.test.ts` | S | P0 |
| A3.2 | Write Zod validation tests for architecture-events (ArchitectureProposed, ArchitectureApproved, ArchitectureRejected, ContractPublished) | `packages/shared/events/src/schemas/architecture-events.test.ts` | S | P0 |
| A3.3 | Write Zod validation tests for code-events (GenerationStarted, TDDTransition, CodeReady, GenerationFailed) | `packages/shared/events/src/schemas/code-events.test.ts` | S | P0 |
| A3.4 | Write Zod validation tests for review-events (ReviewStarted, CheckCompleted, ReviewPassed, ReviewFailed) | `packages/shared/events/src/schemas/review-events.test.ts` | S | P0 |
| A3.5 | Write Zod validation tests for testing-events (TestRunStarted, TestCaseCompleted, ContractBroken) | `packages/shared/events/src/schemas/testing-events.test.ts` | S | P0 |
| A3.6 | Write Zod validation tests for deployment-events (ReleaseCreated, StageCompleted, Deployed, RollbackTriggered) | `packages/shared/events/src/schemas/deployment-events.test.ts` | S | P0 |
| A3.7 | Write Zod validation tests for security-events (SecretDetected, PolicyViolation) | `packages/shared/events/src/schemas/security-events.test.ts` | XS | P0 |
| A3.8 | Write tests for `createEnvelope()` and `MessageEnvelopeSchema` | `packages/shared/events/src/envelope.test.ts` | S | P0 |
| A3.9 | Add `version` field to `BaseEventFields` Zod schema (align with A1.2, A2.8) | `packages/shared/events/src/schemas/project-events.ts` (and all 7 schemas) | S | P1 |
| A3.10 | Ensure `types/src/events.ts` imports subjects from events package (resolve dedup with A1.1) | `packages/shared/types/src/events.ts` | XS | P0 |

**Dependencies**: A1.1, A2.8

**Estimated Total**: M (2.5 days)

---

### A.4 `@ulw/shared-config`

**Current State** (95%): ConfigLoader with JSON file loading (YAML stub), 30 env var mappings, deep merge. 8 Zod sub-schemas. `VaultClient` interface with `NoopVaultClient`. **0 tests**.

**Completion Criteria**: All config sub-schemas validated. YAML loading implemented. Secrets fields have schema defaults.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| A4.1 | Write unit tests for `ConfigLoader` — env var mapping (30 vars), JSON file loading, deep merge | `packages/shared/config/src/loader.test.ts` | M | P0 |
| A4.2 | Write unit tests for `validateConfig()` — all 8 sub-schemas, edge cases, missing required fields | `packages/shared/config/src/validator.test.ts` | M | P0 |
| A4.3 | Implement YAML config file loading (add `yaml` package dependency, implement `loadYamlConfigFile`) | `packages/shared/config/src/loader.ts` | S | P1 |
| A4.4 | Add `.default()` fallbacks for Minio `accessKey`/`secretKey` and Keycloak `clientId`/`clientSecret` in Zod schemas | `packages/shared/config/src/schema.ts` | XS | P1 |
| A4.5 | Write tests for `defaults.ts` — verify devDefaults matches AppConfigSchema | `packages/shared/config/src/defaults.test.ts` | XS | P1 |

**Dependencies**: None

**Estimated Total**: M (2 days)

---

## B. Bounded Contexts

*All 6 BCs share the identical 4-layer DDD structure. Per-BC findings below. Strategy: implement BCs with in-memory mock repositories first to validate domain logic, then upgrade to real persistence and NATS in Phase 3.*

### Cross-BC Structural Issues (Fix First)

| # | Issue | Affected BCs | Fix | Effort | Prio |
|---|-------|-------------|-----|--------|------|
| B0.1 | **8 of 22 NATS subjects missing event interfaces**: ArchitectureProposed, GenerationStarted, GenerationFailed, ReviewStarted, CheckCompleted, TestRunStarted, ReleaseCreated, StageCompleted — no BC defines event classes for these | AD, CG, CR, TA, DP | Add event interface class per subject in each BC's `domain/events/` | M | P0 |
| B0.2 | **TA bug**: `TestPassedEvent` and `TestFailedEvent` both use `EventSubjects.Testing.CaseCompleted` — should be distinct subjects or different event types | TA | Give TestPassed and TestFailed distinct NATS subjects, or add a `result` discriminator field | XS | P0 |
| B0.3 | **Version naming inconsistency**: PM uses `version`, DP uses `version_label` in Drizzle schema | PM, DP | Standardize on `version` across all BCs | XS | P2 |
| B0.4 | **CR uses pgEnum**, other 5 BCs use plain `varchar` for enum-like columns | CR, all others | Upgrade all BCs to use `pgEnum` (follows CR pattern) | S | P2 |
| B0.5 | **Zero Drizzle migrations**: `drizzle-kit generate` never run for any BC | All 6 BCs | Generate initial migration per BC | S | P0 |
| B0.6 | **All 30 repository implementations** throw `Error('Not implemented')` | All 6 BCs | Implement with Drizzle ORM queries (each repo = separate task below) | L | P0 |
| B0.7 | **All 6 NATS event publisher implementations** throw `Error('Not implemented')` | All 6 BCs | Wire to real NATS connection (after C2.1 C2.2) | M | P0 |

---

### B.1 BC-PM (Project Management)

**Current State** (~45%):
- **Domain**: Project, Sprint, Story entities with state machines and guard clauses ✓
- **Value Objects**: SprintDuration ✓
- **Drizzle Schema**: projects, sprints, stories tables (varchar enums) ✓
- **Use Cases**: CreateProject, CreateStory, CommitSprint — structurally complete, no event publishing
- **Repositories**: 3 repo classes exist, all throw `Not implemented` ✗
- **Messaging**: NATS publisher class exists, throws `Not implemented` ✗
- **Controllers**: `POST /projects` works. `GET /projects/:id` returns `{message: 'Not implemented'}`. No StoryController, no SprintController ✗
- **Tests**: 8 smoke tests, entity-only ✓
- **Migrations**: None ✗
- **Missing events**: StoryCreated, StoryReady, SprintCommitted — interfaces exist but not published

**Completion Criteria**: CRUD for all 3 entities. Story/Sprint lifecycle with event publishing. All repositories wired to DB.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| B1.1 | Generate initial Drizzle migration | `packages/bc/pm/drizzle/` (auto-generated) | XS | P0 |
| B1.2 | Implement `ProjectRepository` — save, findById, findAll, delete | `packages/bc/pm/src/infrastructure/persistence/repositories/project.repository.ts` | M | P0 |
| B1.3 | Implement `SprintRepository` — save, findById, findByProjectId, delete | `packages/bc/pm/src/infrastructure/persistence/repositories/sprint.repository.ts` | M | P0 |
| B1.4 | Implement `StoryRepository` — save, findById, findBySprintId, delete | `packages/bc/pm/src/infrastructure/persistence/repositories/story.repository.ts` | M | P0 |
| B1.5 | Add event publishing to `CreateProjectUseCase`, `CreateStoryUseCase`, `CommitSprintUseCase` (StoryCreated, StoryReady, SprintCommitted) | `packages/bc/pm/src/application/use-cases/index.ts` | M | P0 |
| B1.6 | Implement `GetProjectUseCase`, `UpdateProjectUseCase`, `DeleteProjectUseCase`, `ListProjectsUseCase` | `packages/bc/pm/src/application/use-cases/index.ts` | M | P1 |
| B1.7 | Implement `GetStoryUseCase`, `UpdateStoryUseCase`, `DeleteStoryUseCase` | same file | S | P1 |
| B1.8 | Implement `GetSprintUseCase`, `ListSprintsUseCase` | same file | S | P1 |
| B1.9 | Implement `StoryController` — GET/POST/PATCH/DELETE /stories | `packages/bc/pm/src/interface/controllers/story.controller.ts` | S | P1 |
| B1.10 | Implement `SprintController` — GET/POST/PATCH /sprints | `packages/bc/pm/src/interface/controllers/sprint.controller.ts` | S | P1 |
| B1.11 | Complete `ProjectController` — implement GET /:id, GET /, PATCH /:id, DELETE /:id | `packages/bc/pm/src/interface/controllers/project.controller.ts` | S | P1 |
| B1.12 | Add Zod DTOs for story/sprint CRUD | `packages/bc/pm/src/interface/dto/story.dto.ts`, `sprint.dto.ts` | S | P1 |
| B1.13 | Write unit tests for all use cases (mock repos) | `packages/bc/pm/tests/application/use-cases.test.ts` | M | P0 |
| B1.14 | Write integration tests for repository (test containers, real DB) | `packages/bc/pm/tests/infrastructure/repositories.test.ts` | M | P1 |

**Dependencies**: B0.5 (migration), B0.6 (repo pattern), A2.4 (domain events), A3.1 (event schemas)

**Estimated Total**: L (5 days)

---

### B.2 BC-AD (Architecture Design)

**Current State** (~20%):
- **Domain**: ArchitectureSpec (lifecycle: proposed/approved/rejected), ApiContract (published/deprecated) ✓
- **Value Objects**: SemVer (parse, compare, bump) ✓
- **Drizzle Schema**: architecture_specs (jsonb context), api_contracts ✓
- **Use Cases**: CreateArchitectureSpec, CreateApiContract, ApproveArchitecture — structurally complete, no events. Missing RejectArchitecture ✗
- **Repositories**: 2 repo classes, throw `Not implemented` ✗
- **Controllers**: `POST /architecture/spec`, `POST /architecture/approve/:id`. No contract endpoints ✗
- **Missing event**: ArchitectureProposed (no interface class exists anywhere) — per B0.1

**Completion Criteria**: Full ArchitectureSpec lifecycle. Contract CRUD with OpenAPI spec storage. Events published.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| B2.1 | Generate initial Drizzle migration | `packages/bc/ad/drizzle/` | XS | P0 |
| B2.2 | Add `ArchitectureProposedEvent` interface class (gap from B0.1) | `packages/bc/ad/src/domain/events/index.ts` | XS | P0 |
| B2.3 | Implement `ArchitectureSpecRepository` — save, findById, findAll, findByStatus | `packages/bc/ad/src/infrastructure/persistence/repositories/` | M | P0 |
| B2.4 | Implement `ApiContractRepository` — save, findById, findBySpecId | same dir | M | P0 |
| B2.5 | Add event publishing to use cases (ArchitectureProposed, ArchitectureApproved, ArchitectureRejected, ContractPublished) | `packages/bc/ad/src/application/use-cases/index.ts` | M | P0 |
| B2.6 | Implement `RejectArchitectureUseCase` — transition to rejected with reason | same file | S | P1 |
| B2.7 | Implement `GetArchitectureSpecUseCase`, `ListArchitectureSpecsUseCase` | same file | S | P1 |
| B2.8 | Implement `GetApiContractUseCase`, `UpdateApiContractUseCase`, `DeleteApiContractUseCase` | same file | S | P1 |
| B2.9 | Implement full `ArchitectureController` — GET/POST/PATCH/DELETE /architecture/specs, POST /architecture/reject/:id | `packages/bc/ad/src/interface/controllers/architecture.controller.ts` | M | P1 |
| B2.10 | Implement `ContractController` — GET/POST /contracts | `packages/bc/ad/src/interface/controllers/contract.controller.ts` (new) | S | P1 |
| B2.11 | Write unit tests for all use cases | `packages/bc/ad/tests/application/use-cases.test.ts` | M | P0 |
| B2.12 | Write integration tests for repository | `packages/bc/ad/tests/infrastructure/repositories.test.ts` | M | P1 |

**Dependencies**: B1.5 (StoryReady events trigger AD), B0.1 (add ArchitectureProposed)

**Estimated Total**: M (3.5 days)

---

### B.3 BC-CG (Code Generation)

**Current State** (~15%):
- **Domain**: GenerationTask (TDDState enum), GeneratedFile, PullRequest entities ✓
- **Value Objects**: FilePath (traversal guard) ✓
- **Drizzle Schema**: generation_tasks, generated_files, pull_requests ✓
- **Use Cases**: StartGeneration, TransitionTDD — structurally complete, no events. Missing GeneratedFile and PR use cases ✗
- **Repositories**: 3 repo classes, throw `Not implemented` ✗
- **Missing events**: GenerationStarted, GenerationFailed (no interface classes — B0.1). TDDTransition event has interface but no NATS publisher.

**Completion Criteria**: Full TDD state machine. File write guardrails. PR creation. Event publishing for all 4 CG events.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| B3.1 | Generate initial Drizzle migration | `packages/bc/cg/drizzle/` | XS | P0 |
| B3.2 | Add `GenerationStartedEvent` and `GenerationFailedEvent` interface classes (gap from B0.1) | `packages/bc/cg/src/domain/events/index.ts` | XS | P0 |
| B3.3 | Implement `GenerationTaskRepository` — save, findById, findAll, updateStatus | `packages/bc/cg/src/infrastructure/persistence/repositories/` | M | P0 |
| B3.4 | Implement `GeneratedFileRepository` — save, findByTaskId, findById | same dir | M | P0 |
| B3.5 | Implement `PullRequestRepository` — save, findByTaskId, updateStatus | same dir | M | P0 |
| B3.6 | Add event publishing to `StartGenerationUseCase` (GenerationStarted) | `packages/bc/cg/src/application/use-cases/index.ts` | S | P0 |
| B3.7 | Add event publishing to `TransitionTDDUseCase` (TDDTransition, CodeReady on GREEN→VERIFIED, GenerationFailed on error) | same file | M | P0 |
| B3.8 | Implement `RecordGeneratedFileUseCase` — validate TDD phase, persist GeneratedFile | same file | M | P1 |
| B3.9 | Implement `CreatePullRequestUseCase` — collect files, create PR, publish CodeReady | same file | M | P1 |
| B3.10 | Implement `GetGenerationTaskUseCase`, `ListTasksUseCase` | same file | S | P1 |
| B3.11 | Implement `GenerationController` — GET/POST /generation, POST /generation/:id/files, POST /generation/:id/transition, POST /generation/:id/pr | `packages/bc/cg/src/interface/controllers/generation.controller.ts` | M | P1 |
| B3.12 | Write unit tests for TDD state machine and use cases | `packages/bc/cg/tests/application/` | M | P0 |
| B3.13 | Write integration tests for repositories | `packages/bc/cg/tests/infrastructure/` | M | P1 |

**Dependencies**: B2.5 (ArchitectureApproved events), B0.1 (add missing event interfaces)

**Estimated Total**: L (5 days)

---

### B.4 BC-CR (Code Review)

**Current State** (~12%):
- **Domain**: ReviewSession, ReviewCheck (CheckType enum), Violation (Severity enum) ✓
- **Value Objects**: SeverityThreshold (orderable comparisons) ✓
- **Drizzle Schema**: review_sessions, review_checks, violations — **only BC using pgEnum** for severity and check_type — most advanced schema ✓
- **Use Cases**: Only `StartReviewUseCase` — 1 use case. Missing entire review pipeline orchestration ✗
- **Repositories**: 3 repo classes, throw `Not implemented` ✗
- **Missing events**: ReviewStarted, CheckCompleted (no interface classes — B0.1)

**Completion Criteria**: Full review pipeline. Violation recording. Pass/fail/bounce decisions. All 4 review events published.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| B4.1 | Generate initial Drizzle migration (pgEnum-based) | `packages/bc/cr/drizzle/` | XS | P0 |
| B4.2 | Add `ReviewStartedEvent` and `CheckCompletedEvent` interface classes (gap from B0.1) | `packages/bc/cr/src/domain/events/index.ts` | XS | P0 |
| B4.3 | Implement `ReviewSessionRepository` — save, findById, findAll, updateResult | `packages/bc/cr/src/infrastructure/persistence/repositories/` | M | P0 |
| B4.4 | Implement `ReviewCheckRepository` — save, findBySessionId, findById | same dir | M | P0 |
| B4.5 | Implement `ViolationRepository` — save, findByCheckId, findBySessionId | same dir | M | P0 |
| B4.6 | Implement `RecordCheckResultUseCase` — create/complete check, record violations | `packages/bc/cr/src/application/use-cases/` | M | P1 |
| B4.7 | Implement `EvaluateReviewUseCase` — aggregate checks, apply severity thresholds, determine pass/fail/bounce | same file | M | P1 |
| B4.8 | Implement `AddViolationUseCase` — record violation against a check | same file | S | P1 |
| B4.9 | Add event publishing to `StartReviewUseCase` (ReviewStarted), `RecordCheckResultUseCase` (CheckCompleted), `EvaluateReviewUseCase` (ReviewPassed/ReviewFailed) | same files | M | P0 |
| B4.10 | Implement `GetReviewSessionUseCase`, `ListReviewsUseCase`, `GetViolationUseCase` | same file | S | P1 |
| B4.11 | Implement `ReviewController` — GET/POST /reviews, POST /reviews/:id/checks, POST /reviews/:id/evaluate | `packages/bc/cr/src/interface/controllers/review.controller.ts` | M | P1 |
| B4.12 | Write unit tests for use cases | `packages/bc/cr/tests/application/` | M | P0 |
| B4.13 | Write integration tests for repositories | `packages/bc/cr/tests/infrastructure/` | M | P1 |

**Dependencies**: B3.8 (CodeReady events), B0.1 (add missing event interfaces)

**Estimated Total**: M (4 days)

---

### B.5 BC-TA (Test Automation)

**Current State** (~12%):
- **Domain**: TestSuite, TestCase (6 test types), TestRun entities ✓
- **Value Objects**: CoverageThreshold ✓
- **Drizzle Schema**: test_suites, test_cases, test_runs ✓
- **Use Cases**: Only `CreateTestSuiteUseCase` — 1 use case. Missing execution, coverage, contract testing ✗
- **Bug (B0.2)**: TestPassedEvent and TestFailedEvent share NATS subject `EventSubjects.Testing.CaseCompleted`
- **Missing events**: TestRunStarted (no interface class — B0.1)

**Completion Criteria**: Test suite CRUD. Test execution with coverage collection. Contract test verification. Events published.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| B5.1 | Generate initial Drizzle migration | `packages/bc/ta/drizzle/` | XS | P0 |
| B5.2 | Add `TestRunStartedEvent` interface class (gap from B0.1) | `packages/bc/ta/src/domain/events/index.ts` | XS | P0 |
| B5.3 | Fix B0.2 — give TestPassedEvent and TestFailedEvent distinct NATS subjects | `packages/bc/ta/src/domain/events/index.ts`, `packages/shared/types/src/events.ts` | XS | P0 |
| B5.4 | Implement `TestSuiteRepository` — save, findById, findAll, delete | `packages/bc/ta/src/infrastructure/persistence/repositories/` | M | P0 |
| B5.5 | Implement `TestCaseRepository` — save, findBySuiteId, findById, delete | same dir | M | P0 |
| B5.6 | Implement `TestRunRepository` — save, findBySuiteId, findById, updateResult | same dir | M | P0 |
| B5.7 | Implement `AddTestCaseUseCase` — create test case in suite | `packages/bc/ta/src/application/use-cases/` | S | P1 |
| B5.8 | Implement `ExecuteTestRunUseCase` — create run, execute cases, collect results, check coverage | same file | M | P1 |
| B5.9 | Implement `RecordTestCaseResultUseCase` — update individual case result | same file | S | P1 |
| B5.10 | Implement `EvaluateCoverageUseCase` — check coverage against threshold, publish TestPassed/TestFailed | same file | M | P1 |
| B5.11 | Implement `GetTestSuiteUseCase`, `ListTestSuitesUseCase`, `GetTestRunUseCase` | same file | S | P1 |
| B5.12 | Add event publishing to use cases (TestRunStarted, TestCaseCompleted, TestPassed/TestFailed, ContractBroken) | same files | M | P0 |
| B5.13 | Implement `TestController` — GET/POST /tests/suites, POST /tests/suites/:id/cases, POST /tests/run, GET /tests/runs/:id | `packages/bc/ta/src/interface/controllers/test.controller.ts` | M | P1 |
| B5.14 | Write unit tests for use cases | `packages/bc/ta/tests/application/` | M | P0 |
| B5.15 | Write integration tests for repositories | `packages/bc/ta/tests/infrastructure/` | M | P1 |

**Dependencies**: B4.7 (ReviewPassed events), B2.4 (ContractPublished events), B0.1, B0.2

**Estimated Total**: L (5 days)

---

### B.6 BC-DP (Deployment)

**Current State** (~18%):
- **Domain**: Release, PipelineStage (StageType), Rollback entities ✓
- **Value Objects**: DeploymentVersion (parse, compare, bump) ✓
- **Drizzle Schema**: releases, pipeline_stages, rollbacks ✓
- **Use Cases**: CreateRelease, TriggerRollback — 2 use cases. Missing pipeline stage orchestration ✗
- **Repositories**: 3 repo classes, throw `Not implemented` ✗
- **Missing events**: ReleaseCreated, StageCompleted (no interface classes — B0.1)

**Completion Criteria**: Pipeline stage progression. Canary deployment orchestration. Auto-rollback. All 4 DP events published.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| B6.1 | Generate initial Drizzle migration | `packages/bc/dp/drizzle/` | XS | P0 |
| B6.2 | Add `ReleaseCreatedEvent` and `StageCompletedEvent` interface classes (gap from B0.1) | `packages/bc/dp/src/domain/events/index.ts` | XS | P0 |
| B6.3 | Implement `ReleaseRepository` — save, findById, findAll, updateStatus | `packages/bc/dp/src/infrastructure/persistence/repositories/` | M | P0 |
| B6.4 | Implement `PipelineStageRepository` — save, findByReleaseId, findById, updateStatus | same dir | M | P0 |
| B6.5 | Implement `RollbackRepository` — save, findByReleaseId, findById | same dir | M | P0 |
| B6.6 | Implement `StartPipelineStageUseCase` — begin a stage, record start time | `packages/bc/dp/src/application/use-cases/` | M | P1 |
| B6.7 | Implement `CompletePipelineStageUseCase` — mark stage done, advance to next stage, publish StageCompleted | same file | M | P1 |
| B6.8 | Implement `FailPipelineStageUseCase` — mark stage failed, trigger rollback if auto | same file | M | P1 |
| B6.9 | Implement `ExecuteCanaryStageUseCase` — progressive traffic shifting, metrics check, success/fail decision | same file | L | P1 |
| B6.10 | Implement `RequestApprovalUseCase` — create approval gate, wait for human | same file | M | P1 |
| B6.11 | Add event publishing to use cases (ReleaseCreated, StageCompleted, Deployed, RollbackTriggered) | same files | M | P0 |
| B6.12 | Implement `GetReleaseUseCase`, `ListReleasesUseCase`, `GetPipelineStatusUseCase` | same file | S | P1 |
| B6.13 | Implement `DeploymentController` — GET/POST /deployments/releases, POST /deployments/releases/:id/stages/:stageId/start, POST /deployments/releases/:id/rollback | `packages/bc/dp/src/interface/controllers/deployment.controller.ts` | M | P1 |
| B6.14 | Write unit tests for use cases | `packages/bc/dp/tests/application/` | M | P0 |
| B6.15 | Write integration tests for repositories | `packages/bc/dp/tests/infrastructure/` | M | P1 |

**Dependencies**: B5.10 (TestPassed events), B4.7 (ReviewPassed events), B0.1 (add missing event interfaces)

**Estimated Total**: L (6 days)

---

## C. Core Engine

### C.1 Orchestrator (`@ulw/orchestrator`)

**Current State** (~85%): TaskDecomposer with DAG decomposition, topological sort, 7 domain patterns. IntentParser (keyword-based). AgentRouter (domain-to-agent mapping). REST controller (3 endpoints). tRPC router (3 procedures). Missing: NATS integration, task persistence.

**Completion Criteria**: Orchestrator publishes DAGs to NATS. Decomposition results persisted. Event publishing on task lifecycle.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| C1.1 | Implement `routeToSupervisor()` — publish decomposed DAG to NATS `ulw.orchestrator.dag.dispatched` subject (currently throws NotImplementedError) | `packages/core/orchestrator/src/orchestrator.service.ts` | M | P0 |
| C1.2 | Create `TaskRepository` — persist DecompositionResult to database | `packages/core/orchestrator/src/repository/task.repository.ts` (new) | M | P1 |
| C1.3 | Add NATS client to orchestrator module — publish events on task decomposition + status changes | `packages/core/orchestrator/src/messaging/` (new) | M | P1 |
| C1.4 | Add `getTask` and `listTasks` endpoints to controller (currently only create + get-by-id) | `packages/core/orchestrator/src/controller/orchestrator.controller.ts` | S | P1 |
| C1.5 | Write unit tests for orchestrator service, decomposer, intent parser, agent router | `packages/core/orchestrator/tests/` | M | P0 |
| C1.6 | Deduplicate `topologicalSort()` — extract to shared utility (duplicated in supervisor DAGExecutor) | `packages/shared/domain/src/dag-utils.ts` | XS | P2 |

**Dependencies**: C2.1 (supervisor NATS consumer), A4 (config for NATS)

**Estimated Total**: M (3 days)

---

### C.2 Supervisor (`@ulw/supervisor`)

**Current State** (~60%): StateRepository (full Drizzle CRUD for 3 tables). RetryManager (exponential backoff with jitter, DLQ). HeartbeatMonitor (agent liveness). SessionManager (in-memory CRUD, persist/restore stubs). DAGExecutor (resolveDependencies + topologicalSort work; executeDAG + executeParallel are stubs). NATS publisher/consumer — all stubs.

**Completion Criteria**: DAG executor dispatches specs to agents. NATS integrated for agent communication. Persistence wired (sessions, exec states, DAG progress to DB).

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| C2.1 | Implement `NATSPublisher.publish()` — real NATS connection, publish to JetStream | `packages/core/supervisor/src/messaging/nats-publisher.ts` | M | P0 |
| C2.2 | Implement `NATSConsumer.subscribeToStatusEvents()` — subscribe to agent heartbeats and task result subjects | `packages/core/supervisor/src/messaging/nats-consumer.ts` | M | P0 |
| C2.3 | Implement `DAGExecutor.executeDAG()` — iterate executionOrder, check deps, dispatch specs via NATS, collect results, update spec statuses | `packages/core/supervisor/src/executor/dag-executor.ts` | L | P0 |
| C2.4 | Implement `DAGExecutor.executeParallel()` — parallel dispatch for same-wave specs (no deps between them) | `packages/core/supervisor/src/executor/dag-executor.ts` | M | P1 |
| C2.5 | Wire `StateRepository` into `SessionManager.persistSession()` + `restoreSession()` | `packages/core/supervisor/src/session/session-manager.ts` | M | P1 |
| C2.6 | Wire `StateRepository` into `DAGExecutor` — persist execution states and progress after each spec | `packages/core/supervisor/src/executor/dag-executor.ts` | M | P1 |
| C2.7 | Wire `SupervisorService.executeDAG()` — connect NATS + DAGExecutor + HeartbeatMonitor + RetryManager | `packages/core/supervisor/src/supervisor.service.ts` | M | P0 |
| C2.8 | Generate initial Drizzle migration for supervisor state tables | `packages/core/supervisor/drizzle/` | XS | P0 |
| C2.9 | Write unit tests for DAG executor, retry manager, heartbeat monitor, session manager | `packages/core/supervisor/tests/` | M | P0 |
| C2.10 | Write integration tests for StateRepository | `packages/core/supervisor/tests/infrastructure/` | M | P1 |

**Dependencies**: C1.1 (orchestrator publishes DAGs), A4 (config for NATS)

**Estimated Total**: L (5 days)

---

## D. API Gateway

### D.1 `@ulw/api-gateway`

**Current State** (~80%): NestJS bootstrap with CORS, middleware, guards ✓. JWT auth (guard + strategy + roles decorator) ✓. Webhook receivers (GitHub HMAC, GitLab token) ✓. tRPC module with graceful fallback ✓. Response wrapper interceptor, exception filter ✓. Missing: BC REST controllers for AD/CG/CR/TA/DP, `AuditController.getEvents()` stub, `ProjectController.list()` stub.

**Completion Criteria**: REST endpoints for all 6 BCs. tRPC routers for Supervisor. Audit event aggregation.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| D1.1 | Implement `ProjectController.list()` — query BC-PM module (currently throws NotImplementedError) | `apps/api-gateway/src/rest/project/project.controller.ts` | S | P1 |
| D1.2 | Implement `AuditController.getEvents()` — query audit events from NATS stream or DB | `apps/api-gateway/src/rest/audit/audit.controller.ts` | M | P1 |
| D1.3 | Add REST controllers for BC-AD: `ArchitectureController` (forward to BC-AD module) | `apps/api-gateway/src/rest/architecture/architecture.controller.ts` (new) | M | P1 |
| D1.4 | Add REST controllers for BC-CG: `GenerationController` | `apps/api-gateway/src/rest/generation/generation.controller.ts` (new) | M | P1 |
| D1.5 | Add REST controllers for BC-CR: `ReviewController` | `apps/api-gateway/src/rest/review/review.controller.ts` (new) | M | P1 |
| D1.6 | Add REST controllers for BC-TA: `TestController` | `apps/api-gateway/src/rest/testing/test.controller.ts` (new) | M | P1 |
| D1.7 | Add REST controllers for BC-DP: `DeploymentController` | `apps/api-gateway/src/rest/deployment/deployment.controller.ts` (new) | M | P1 |
| D1.8 | Add tRPC router for Supervisor (DAG execute, progress, results) | `apps/api-gateway/src/trpc/routers/supervisor.router.ts` (new) | S | P1 |
| D1.9 | Add AuthGuard role checking using `@Roles()` decorator (currently only validates token, not roles) | `apps/api-gateway/src/auth/auth.guard.ts` | S | P1 |
| D1.10 | Add rate limiting (nestjs/throttler or Redis-based) for public endpoints | `apps/api-gateway/src/throttle/` (new) | S | P2 |
| D1.11 | Write e2e tests for health endpoint, all REST endpoints, auth flow | `apps/api-gateway/tests/` | M | P0 |
| D1.12 | Write integration tests for webhook verification (GitHub HMAC, GitLab token) | `apps/api-gateway/tests/webhook/` | S | P1 |

**Dependencies**: B.1-B.6 (BC modules must work), C.2 (supervisor must work for tRPC)

**Estimated Total**: M (4 days)

---

## E. ACL Implementations

*All 4 ACL packages are currently **interface-only** (0% implementation). Strategy per user directive: implement BCs with mock ACLs first, then upgrade to real ACLs in Phase 3.*

### E.1 OpenCode ACL

**Current State**: 5 interfaces (UlwCodeAdapter, OpenCodeRuntime, TDDStateMachine, WorktreeProvider, types). Const `GateRules`. Zero implementation.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| E1.1 | Implement `TDDStateMachine` class — RED→GREEN→REFACTOR→VERIFIED transition table, phase validation, tool allowlists per phase | `packages/acl/opencode-acl/src/tdd-state-machine.ts` (new) | L | P0 |
| E1.2 | Implement `OpenCodeRuntimeService` — session creation via OpenCode SDK, prompt dispatch, result collection, abort | `packages/acl/opencode-acl/src/opencode-runtime.ts` (new) | L | P0 |
| E1.3 | Implement `CodeAdapter` — map OpenCode tool events to TDD transitions, validate tool-in-phase | `packages/acl/opencode-acl/src/code-adapter.ts` (new) | M | P1 |
| E1.4 | Implement `WorktreeService` — git worktree create/checkout/cleanup/list (wrap shell `git worktree`) | `packages/acl/opencode-acl/src/worktree-service.ts` (new) | M | P1 |
| E1.5 | Write unit tests for TDD state machine transitions (RED→GREEN, GREEN→REFACTOR, REFACTOR→GREEN bounce, etc.) | `packages/acl/opencode-acl/src/tdd-state-machine.test.ts` | M | P0 |
| E1.6 | Write integration tests for worktree lifecycle | `packages/acl/opencode-acl/src/worktree-service.test.ts` | M | P0 |
| E1.7 | Update `packages/acl/opencode-acl/src/index.ts` barrel — add real exports (currently only exports interfaces) | same file | XS | P1 |

**Dependencies**: None (self-contained, wraps shell git commands + OpenCode SDK)

**Estimated Total**: L (4.5 days)

---

### E.2 Git ACL

**Current State**: 4 interfaces (UlwGitAdapter, WorktreeManager, PRClient, types). Zero implementation.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| E2.1 | Implement `GitHubPRClient` — create PR, update PR, merge PR, get checks via GitHub REST API | `packages/acl/git-acl/src/github-pr-client.ts` (new) | M | P0 |
| E2.2 | Implement `GitLabPRClient` — MR operations via GitLab REST API (post-MVP, P2) | `packages/acl/git-acl/src/gitlab-pr-client.ts` (new) | M | P2 |
| E2.3 | Implement `GitAdapter` — diff, status, syncWithBase, createPR (wraps shell `git` + PR client) | `packages/acl/git-acl/src/git-adapter.ts` (new) | M | P1 |
| E2.4 | Implement `WorktreeService` — create/lock/unlock/prune/list git worktrees (wrap shell `git worktree`) | `packages/acl/git-acl/src/worktree-service.ts` (new) | M | P0 |
| E2.5 | Write unit tests (mocked git shell output, mocked GitHub API) | `packages/acl/git-acl/src/*.test.ts` | M | P0 |
| E2.6 | Update barrel exports in `src/index.ts` | same file | XS | P1 |

**Dependencies**: None (wraps shell `git` + GitHub/GitLab APIs)

**Estimated Total**: M (3 days)

---

### E.3 OpenClaw ACL

**Current State**: 6 interfaces (UlwReviewAdapter, OpenClawRuntime, ACP types). Zero implementation.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| E3.1 | Implement `OpenClawRuntimeService` — session management for review pipeline, multi-agent dispatch (Analyzer, Critic, Policy) | `packages/acl/openclaw-acl/src/openclaw-runtime.ts` (new) | M | P0 |
| E3.2 | Implement `ReviewAdapter` — map ulw review check types to OpenClaw ACP stages (style→style_analyzer, security→security_audit, etc.) | `packages/acl/openclaw-acl/src/review-adapter.ts` (new) | M | P1 |
| E3.3 | Implement ACP pipeline orchestrator — sequential Analyzer → Critic → Policy execution with result aggregation | `packages/acl/openclaw-acl/src/acp-pipeline.ts` (new) | M | P1 |
| E3.4 | Write unit tests | `packages/acl/openclaw-acl/src/*.test.ts` | M | P0 |
| E3.5 | Update barrel exports in `src/index.ts` | same file | XS | P1 |

**Dependencies**: None (wraps OpenClaw SDK)

**Estimated Total**: M (2.5 days)

---

### E.4 CI/CD ACL

**Current State**: 6 interfaces (UlwCicdAdapter, K8sClient, ArgoClient, ApprovalGate, types). Zero implementation.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| E4.1 | Implement `K8sClientService` — deployment CRUD via `@kubernetes/client-node` | `packages/acl/cicd-acl/src/k8s-client.ts` (new) | L | P0 |
| E4.2 | Implement `ArgoClientService` — application sync, status query, rollback via ArgoCD REST API | `packages/acl/cicd-acl/src/argo-client.ts` (new) | M | P1 |
| E4.3 | Implement `CicdAdapter` — translate ulw deploy events (ReleaseCreated, StageCompleted) into K8s/ArgoCD operations | `packages/acl/cicd-acl/src/cicd-adapter.ts` (new) | M | P1 |
| E4.4 | Implement `ApprovalGateService` — create/poll/approve/deny approval requests | `packages/acl/cicd-acl/src/approval-gate.ts` (new) | M | P1 |
| E4.5 | Write unit tests (mocked K8s/ArgoCD APIs) | `packages/acl/cicd-acl/src/*.test.ts` | M | P0 |
| E4.6 | Update barrel exports in `src/index.ts` | same file | XS | P1 |

**Dependencies**: None (wraps K8s client library + ArgoCD API)

**Estimated Total**: M (4 days)

---

## F. Infrastructure & CI/CD

### F.1 Pulumi IaC

**Current State** (~95%): Full K8s resource definitions for all components (8 source files, 6 sub-packages). Real Pulumi code, not stubs.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| F1.1 | Add Vault integration for secret management (replace placeholder secrets in ConfigMap/Secret) | `infrastructure/packages/kubernetes/networking.ts` | S | P2 |
| F1.2 | Add HPA (Horizontal Pod Autoscaler) definitions for orchestrator and supervisor | `infrastructure/packages/kubernetes/index.ts` | S | P2 |
| F1.3 | Add PDB (Pod Disruption Budget) for stateful components (PostgreSQL, Redis, NATS) | `infrastructure/packages/` | XS | P2 |

**Dependencies**: None

**Estimated Total**: S (0.5 day)

---

### F.2 Helm Charts

**Current State** (~100%): 18 files, fully structured chart with dev/staging/prod values overrides. No gaps identified.

---

### F.3 GitHub Actions

**Current State** (~100%): 5 workflow files fully implemented (CI, review pipeline, staging/prod deploy, nightly security).

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| F3.1 | Wire E2E test job — currently references `@ulw/e2e` package that does not exist yet (create after H2.1) | `.github/workflows/ci.yml` | M | P2 |
| F3.2 | Add contract test stage to review pipeline (after H3.1-H3.2) | `.github/workflows/review-pipeline.yml` | S | P2 |

**Dependencies**: H2 (Playwright E2E suite), H3 (Pact contract tests)

**Estimated Total**: S (0.5 day)

---

### F.4 Docker Compose

**Current State** (~100%): Local dev environment with 6 services (PostgreSQL, Redis, NATS, MinIO, Keycloak, API Gateway). No gaps identified.

---

## G. Integration & End-to-End Flow

### G.1 Cross-BC Event Flow Tests

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| G1.1 | Write integration test: full pipeline — PM StoryReady → AD ArchitectureApproved → CG CodeReady → CR ReviewPassed → TA TestPassed → DP Deployed | `tests/integration/end-to-end-flow.test.ts` (new) | L | P1 |
| G1.2 | Write integration test: review bounce — CR ReviewFailed → CG starts new cycle | `tests/integration/review-bounce.test.ts` (new) | M | P1 |
| G1.3 | Write integration test: canary rollback — DP canary stage fails → auto-rollback triggers | `tests/integration/canary-rollback.test.ts` (new) | M | P1 |
| G1.4 | Write integration test: webhook triggers — GitHub PR webhook → CR StartReview | `tests/integration/webhook-to-review.test.ts` (new) | M | P1 |

**Dependencies**: B.1-B.6 (all BCs working), C.1-C.2 (core working)

**Estimated Total**: L (4 days)

---

### G.2 NATS Event Bus Verification

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| G2.1 | Verify NATS JetStream stream creation for all 22 event subjects (currently only defines subjects, no stream config) | `docker/nats/nats.conf` | S | P1 |
| G2.2 | Verify consumer groups per BC — each BC subscribes to relevant upstream events (PM→AD, AD→CG, CG→CR, CR↔TA, TA→DP) | `packages/bc/*/src/infrastructure/messaging/` | M | P0 |
| G2.3 | Implement dead-letter queue processing for failed events (extend RetryManager) | `packages/core/supervisor/src/executor/retry-manager.ts` | M | P1 |
| G2.4 | Write integration test: event ordering test — verify events arrive in correct sequence across BCs | `tests/integration/event-ordering.test.ts` | M | P1 |

**Dependencies**: C2.1, C2.2 (NATS publisher/consumer working)

**Estimated Total**: M (2.5 days)

---

### G.3 Observability Wiring

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| G3.1 | Wire OpenTelemetry auto-instrumentation into API Gateway | `apps/api-gateway/src/main.ts` | S | P1 |
| G3.2 | Wire OpenTelemetry tracing into Supervisor service | `packages/core/supervisor/src/main.ts` | S | P1 |
| G3.3 | Wire Prometheus metrics for all BC services (request counts, latency, event counts) | `packages/bc/*/src/module.ts` | M | P1 |
| G3.4 | Verify Grafana dashboards match actual metric names (DORA metrics, review pipeline health) | `.ulw/observability/grafana-dashboards/` | S | P2 |

**Dependencies**: C.2 (supervisor metrics), D.1 (gateway metrics)

**Estimated Total**: S (1.5 days)

---

## H. Testing & Quality Gates

### H.1 Unit Test Coverage Push

**Current State**: 9 smoke tests only (8 BC + 1 e2e). Zero coverage config in any vitest.config.ts. Zero shared package tests.

**Completion Criteria**: 80%+ line coverage across `packages/shared/`, `packages/core/`, `packages/bc/`, `packages/acl/`.

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| H1.1 | Achieve 80% coverage on `@ulw/shared-types` (type-level validation tests) | `packages/shared/types/src/*.test.ts` | S | P0 |
| H1.2 | Achieve 80% coverage on `@ulw/shared-domain` (Result monad, Entity, VOs, errors) | `packages/shared/domain/src/*.test.ts` | M | P0 |
| H1.3 | Achieve 80% coverage on `@ulw/shared-events` (all 22 event schemas + envelope) | `packages/shared/events/src/**/*.test.ts` | M | P0 |
| H1.4 | Achieve 80% coverage on `@ulw/shared-config` (loader, validator, defaults) | `packages/shared/config/src/*.test.ts` | M | P0 |
| H1.5 | Achieve 80% coverage on `@ulw/orchestrator` (decomposer, intent parser, agent router) | `packages/core/orchestrator/tests/` | M | P0 |
| H1.6 | Achieve 80% coverage on `@ulw/supervisor` (DAG executor, retry, heartbeat, session) | `packages/core/supervisor/tests/` | M | P0 |
| H1.7 | Achieve 80% coverage on each BC package (6 x domain entities + use cases) | `packages/bc/*/tests/` | L | P0 |
| H1.8 | Achieve 80% coverage on each ACL package (4 x implementation tests) | `packages/acl/*/src/*.test.ts` | M | P0 |
| H1.9 | Configure Vitest coverage (`coverage` config + `@vitest/coverage-v8` provider) in all vitest.config.ts files | `packages/*/vitest.config.ts`, `apps/*/vitest.config.ts` | S | P0 |
| H1.10 | Add `pnpm test:coverage` script to root `package.json` | `package.json` | XS | P1 |

**Dependencies**: Individual module tasks above. Many test hours already counted in sections A-E.

**Estimated Total (net new beyond sections above)**: M (3 days)

---

### H.2 E2E Testing (Playwright)

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| H2.1 | Create `@ulw/e2e` package with Playwright config (Chromium, headed/headless, base URL) | `packages/e2e/` (new package) | M | P1 |
| H2.2 | Write e2e test: full pipeline flow through UI/API — create project → architecture → code gen → review → test → deploy | `packages/e2e/tests/full-pipeline.spec.ts` | M | P1 |
| H2.3 | Write e2e test: GitHub webhook → triggers review pipeline → results appear | `packages/e2e/tests/github-webhook.spec.ts` | M | P1 |
| H2.4 | Write e2e test: canary deployment with rollback (visual verification of traffic shifting) | `packages/e2e/tests/canary-rollback.spec.ts` | M | P2 |

**Dependencies**: G.1 (integration tests must pass first)

**Estimated Total**: M (2.5 days)

---

### H.3 Contract Testing (Pact)

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| H3.1 | Write Pact consumer test for BC-CG → BC-CR contract (CodeReady event shape) | `packages/bc/cg/tests/contract/cg-cr.pact.spec.ts` (new) | M | P2 |
| H3.2 | Write Pact consumer test for BC-TA → BC-DP contract (TestPassed event shape) | `packages/bc/ta/tests/contract/ta-dp.pact.spec.ts` (new) | M | P2 |
| H3.3 | Write Pact consumer test for BC-AD → BC-CG contract (ArchitectureApproved shape) | `packages/bc/ad/tests/contract/ad-cg.pact.spec.ts` (new) | M | P2 |
| H3.4 | Add Pact broker CI stage to `review-pipeline.yml` | `.github/workflows/review-pipeline.yml` | S | P2 |

**Dependencies**: F.3 (CI workflow), G.1 (event flow tests)

**Estimated Total**: M (2 days)

---

### H.4 Quality Gates (Pre-Commit & CI)

| # | Task | File(s) | Effort | Prio |
|---|---|---|---|---|
| H4.1 | Add pre-commit hooks (husky + lint-staged): eslint, oxlint, prettier on staged files | Root `package.json`, `.husky/pre-commit`, `.lintstagedrc.json` | S | P1 |
| H4.2 | Add commitlint for Conventional Commits enforcement | `commitlint.config.js`, `.husky/commit-msg` | S | P1 |
| H4.3 | Add typecheck gate to pre-commit hooks (fast, per-package `tsc --noEmit`) | `.husky/pre-commit` | S | P1 |
| H4.4 | Add bundle size monitoring for API Gateway (if web UI is added later) | CI workflow | S | P2 |

**Dependencies**: None

**Estimated Total**: S (1 day)

---

## Dependency Graph & Execution Order

```
Phase 0: Foundation (Week 1)
  ├── A1-A3: Shared types/domain/events tests
  ├── A4: Shared config tests + YAML loading
  ├── B0.1-B0.5: Fix cross-BC structural issues (missing NATS subjects, TA bug, migrations)
  └── H4: Pre-commit hooks + commitlint

Phase 1: Core Engine Enablement (Week 2-3)
  ├── C2.1-C2.2: NATS publisher + consumer implementation
  ├── C2.3-C2.4: DAG executor (executeDAG, executeParallel)
  ├── C2.5-C2.7: Wire persistence + session + supervisor service
  ├── C1.1: routeToSupervisor() → NATS dispatch
  └── C1.2-C1.5: Task persistence + tests
  ═══ BLOCKS BC INTEGRATION ═══

Phase 2: BC Implementation — Bottom-Up (Week 3-5)
  ├── B1: PM repositories → use cases → controllers (StoryReady feeds AD)
  ├── B2: AD repositories → use cases → controllers (ArchitectureApproved feeds CG)
  ├── B3: CG repositories → use cases → controllers (CodeReady feeds CR)
  ├── B4: CR repositories → use cases → controllers (ReviewPassed feeds TA/DP)
  ├── B5: TA repositories → use cases → controllers (TestPassed feeds DP)
  └── B6: DP repositories → use cases → controllers (final BC)
  Note: BCs use in-memory mock repos initially, real DB in Phase 4

Phase 3: ACL Implementation (Week 5-6)
  ├── E2.1-E2.5: Git ACL (PR client + worktree service)
  ├── E1.1-E1.6: OpenCode ACL (TDD state machine + runtime + worktree)
  ├── E3.1-E3.4: OpenClaw ACL (ACP pipeline)
  └── E4.1-E4.5: CI/CD ACL (K8s + ArgoCD + approval gates)

Phase 4: Integration & Real Backends (Week 6-7)
  ├── G2: NATS event bus verification + consumer groups
  ├── Upgrade BC repos from mock → real DB (Drizzle queries)
  ├── Upgrade BC publishers from mock → real NATS
  ├── G1: Cross-BC event flow integration tests
  ├── D1: API Gateway completion (all BC controllers, tRPC supervisor)
  └── G3: Observability wiring (OTel + Prometheus)

Phase 5: Testing & Polish (Week 7-8)
  ├── H1: Coverage push to 80%+ across all packages
  ├── H2: Playwright e2e tests
  ├── H3: Pact contract tests
  └── F1-F3: Infrastructure polish (Vault, HPA, PDB)
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenCode SDK API changes during implementation | Medium | High | Version-pin SDK. ACL interfaces already abstract SDK — upgrade adapter, not BCs |
| NATS JetStream configuration complexity | Medium | Medium | Start with simple pub/sub; add JetStream persistence after core flow works |
| DAG executor gets stalled agents | High | Medium | HeartbeatMonitor already implements dead-agent detection; RetryManager handles retries with DLQ |
| Test flakiness in integration tests | Medium | Medium | Use TestContainers for PostgreSQL/NATS/Redis in CI; deterministic test data seeding |
| Cross-BC event ordering issues | Low | High | Design idempotent event handlers. Use NATS ordered consumer for sequential BC flows |
| Keycloak version compatibility | Low | Low | Pin to 26.0; realm export committed; dev Docker Compose includes local Keycloak |
| 8 missing NATS event interfaces cause runtime gaps | High | High | Addressed in B0.1 — fix cross-BC structural issues in Phase 0 before any BC work |
| All 30 repo stubs block integration testing | High | High | Mock repo pattern in Phase 2; upgrade to real DB in Phase 4. Mock repos sufficient for domain logic validation |
| Scope creep from "AI integration" expectations | Medium | Medium | LLM-based decomposer deferred to P2 (post-MVP). Rule-based decomposer validates architecture |

---

## Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| 0 — Foundation | 1 week | Shared tests, cross-BC fixes, pre-commit hooks |
| 1 — Core Engine | 2 weeks | NATS, DAG executor, supervisor complete |
| 2 — BC Implementation | 2 weeks | All 6 BCs functional (mock repos) |
| 3 — ACL Implementation | 1 week | All 4 ACL implementations |
| 4 — Integration | 1 week | Real DB/NATS, E2E flows, observability, gateway |
| 5 — Testing & Polish | 1 week | 80% coverage, e2e tests, contract tests |
| **Total** | **8 weeks** | **MVP: closed-loop Architecture→Code→Review→Test→Deploy** |

**Team sizing**: 4 developers. Parallel work possible on Phase 2 (one dev per BC, 6 BCs → staggered).

**Definition of MVP Done**: A StoryCreated event in PM triggers the full pipeline: AD generates architecture spec → CG generates code with TDD guardrails → CR reviews and passes → TA runs tests and passes → DP deploys to canary → human approves → production. All events flow via NATS. All states persisted in PostgreSQL.

---

## TODO List

*Legend: [P0]=Blocking, [P1]=Core, [P2]=Enhancement, [XS]=&lt;0.5d, [S]=0.5-1d, [M]=1-3d, [L]=4-6d, [XL]=7+d*

### Phase 0 — Foundation (Week 1) ⬜

#### 0.1 Cross-BC Structural Fixes (Must Complete First)
- [ ] B0.1 [P0][M] 补充 8 个缺失的 NATS 事件接口类 — `packages/bc/{ad,cg,cr,ta,dp}/src/domain/events/index.ts`
  - [ ] AD: `ArchitectureProposedEvent`
  - [ ] CG: `GenerationStartedEvent`, `GenerationFailedEvent`
  - [ ] CR: `ReviewStartedEvent`, `CheckCompletedEvent`
  - [ ] TA: `TestRunStartedEvent`
  - [ ] DP: `ReleaseCreatedEvent`, `StageCompletedEvent`
- [ ] B0.2 [P0][XS] 修复 TA bug: `TestPassedEvent` / `TestFailedEvent` 使用不同 NATS 主题 — `packages/bc/ta/src/domain/events/index.ts`, `packages/shared/types/src/events.ts`
- [ ] B0.5 [P0][S] 为全部 6 个 BC 生成 Drizzle 初始迁移文件 — `packages/bc/{pm,ad,cg,cr,ta,dp}/drizzle/`
- [ ] A1.1 [P0][XS] 去重 NATS 主题常量 — `packages/shared/types/src/events.ts` → 从 `@ulw/shared-events` 重新导出

#### 0.2 Shared Domain Tests
- [ ] A2.1 [P0][S] `Result<T,E>` 单元测试 (ok/err/isOk/isErr/map/flatMap/match/unwrap) — `packages/shared/domain/src/result.test.ts`
- [ ] A2.2 [P0][S] `ValueObject` 单元测试 (equality, hashCode) — `packages/shared/domain/src/value-object.test.ts`
- [ ] A2.3 [P0][S] `Entity` 单元测试 (identity equality, domain event collection) — `packages/shared/domain/src/entity.test.ts`
- [ ] A2.4 [P0][S] `AggregateRoot` 单元测试 (pullEvents transactional semantics) — `packages/shared/domain/src/aggregate-root.test.ts`
- [ ] A2.5 [P0][XS] 5 个 DomainError 类型单元测试 — `packages/shared/domain/src/errors.test.ts`
- [ ] A2.6 [P0][XS] `Identifier<T>` 单元测试 — `packages/shared/domain/src/identifier.test.ts`

#### 0.3 Shared Events Tests
- [ ] A3.1 [P0][S] PM 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/project-events.test.ts`
- [ ] A3.2 [P0][S] AD 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/architecture-events.test.ts`
- [ ] A3.3 [P0][S] CG 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/code-events.test.ts`
- [ ] A3.4 [P0][S] CR 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/review-events.test.ts`
- [ ] A3.5 [P0][S] TA 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/testing-events.test.ts`
- [ ] A3.6 [P0][S] DP 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/deployment-events.test.ts`
- [ ] A3.7 [P0][XS] Security 事件 Zod schema 验证测试 — `packages/shared/events/src/schemas/security-events.test.ts`
- [ ] A3.8 [P0][S] `MessageEnvelopeSchema` + `createEnvelope()` 测试 — `packages/shared/events/src/envelope.test.ts`

#### 0.4 Shared Config Tests
- [ ] A4.1 [P0][M] `ConfigLoader` 单元测试 (env var mapping, JSON 加载, deep merge) — `packages/shared/config/src/loader.test.ts`
- [ ] A4.2 [P0][M] `validateConfig()` 单元测试 (8 个子 schema, 边界情况) — `packages/shared/config/src/validator.test.ts`

#### 0.5 Quality Gates
- [ ] H4.1 [P1][S] 添加 pre-commit hooks (husky + lint-staged: eslint, oxlint, prettier) — `.husky/pre-commit`, `.lintstagedrc.json`
- [ ] H4.2 [P1][S] 添加 commitlint (Conventional Commits 强制) — `commitlint.config.js`
- [ ] H1.9 [P0][S] 为所有包配置 Vitest coverage — `packages/*/vitest.config.ts`, `apps/*/vitest.config.ts`

---

### Phase 1 — Core Engine Enablement (Week 2-3) ⬜

#### 1.1 NATS Integration
- [ ] C2.1 [P0][M] 实现 `NATSPublisher.publish()` — 真实 NATS 连接, 发布到 JetStream — `packages/core/supervisor/src/messaging/nats-publisher.ts`
- [ ] C2.2 [P0][M] 实现 `NATSConsumer.subscribeToStatusEvents()` — 订阅 agent heartbeat 和 task result 主题 — `packages/core/supervisor/src/messaging/nats-consumer.ts`

#### 1.2 DAG Executor
- [ ] C2.3 [P0][L] 实现 `DAGExecutor.executeDAG()` — 遍历 executionOrder, 检查依赖, 通过 NATS 分发 spec, 收集结果 — `packages/core/supervisor/src/executor/dag-executor.ts`
- [ ] C2.4 [P1][M] 实现 `DAGExecutor.executeParallel()` — 同 wave 内 spec 并行分发 — 同上
- [ ] C2.7 [P0][M] 连接 `SupervisorService.executeDAG()` — NATS + DAGExecutor + HeartbeatMonitor + RetryManager — `packages/core/supervisor/src/supervisor.service.ts`
- [ ] C2.8 [P0][XS] 为 supervisor state tables 生成 Drizzle 迁移 — `packages/core/supervisor/drizzle/`

#### 1.3 Orchestrator ↔ Supervisor
- [ ] C1.1 [P0][M] 实现 `routeToSupervisor()` — 将分解后的 DAG 发布到 NATS `ulw.orchestrator.dag.dispatched` — `packages/core/orchestrator/src/orchestrator.service.ts`

#### 1.4 Core Tests
- [ ] C1.5 [P0][M] Orchestrator 单元测试 (service, decomposer, intent parser, agent router) — `packages/core/orchestrator/tests/`
- [ ] C2.9 [P0][M] Supervisor 单元测试 (DAG executor, retry manager, heartbeat monitor, session manager) — `packages/core/supervisor/tests/`

---

### Phase 2 — BC Implementation: Bottom-Up (Week 3-5) ⬜

#### 2.1 BC-PM — Project Management (Day 1-3)
- [ ] B1.1 [P0][XS] 生成 Drizzle 迁移 — `packages/bc/pm/drizzle/`
- [ ] B1.2 [P0][M] 实现 `ProjectRepository` — `packages/bc/pm/src/infrastructure/persistence/repositories/project.repository.ts`
- [ ] B1.3 [P0][M] 实现 `SprintRepository` — `packages/bc/pm/src/infrastructure/persistence/repositories/sprint.repository.ts`
- [ ] B1.4 [P0][M] 实现 `StoryRepository` — `packages/bc/pm/src/infrastructure/persistence/repositories/story.repository.ts`
- [ ] B1.5 [P0][M] 在 use cases 中添加事件发布 (StoryCreated, StoryReady, SprintCommitted) — `packages/bc/pm/src/application/use-cases/index.ts`
- [ ] B1.13 [P0][M] Use cases 单元测试 (mock repos) — `packages/bc/pm/tests/application/use-cases.test.ts`
- [ ] B1.6 [P1][M] 实现 GetProj/UpdateProj/DeleteProj/ListProj use cases — 同上
- [ ] B1.11 [P1][S] 完成 `ProjectController` CRUD — `packages/bc/pm/src/interface/controllers/project.controller.ts`

#### 2.2 BC-AD — Architecture Design (Day 3-5)
- [ ] B2.1 [P0][XS] 生成 Drizzle 迁移 — `packages/bc/ad/drizzle/`
- [ ] B2.2 [P0][XS] 添加 `ArchitectureProposedEvent` 接口类 — `packages/bc/ad/src/domain/events/index.ts`
- [ ] B2.3 [P0][M] 实现 `ArchitectureSpecRepository` — `packages/bc/ad/src/infrastructure/persistence/repositories/`
- [ ] B2.4 [P0][M] 实现 `ApiContractRepository` — 同上
- [ ] B2.5 [P0][M] 在 use cases 中添加事件发布 (ArchitectureProposed/Approved/Rejected, ContractPublished) — `packages/bc/ad/src/application/use-cases/index.ts`
- [ ] B2.11 [P0][M] Use cases 单元测试 — `packages/bc/ad/tests/application/use-cases.test.ts`
- [ ] B2.9 [P1][M] 完成 `ArchitectureController` — `packages/bc/ad/src/interface/controllers/architecture.controller.ts`

#### 2.3 BC-CG — Code Generation (Day 5-8)
- [ ] B3.1 [P0][XS] 生成 Drizzle 迁移 — `packages/bc/cg/drizzle/`
- [ ] B3.2 [P0][XS] 添加 `GenerationStartedEvent` / `GenerationFailedEvent` 接口类 — `packages/bc/cg/src/domain/events/index.ts`
- [ ] B3.3 [P0][M] 实现 `GenerationTaskRepository` — `packages/bc/cg/src/infrastructure/persistence/repositories/`
- [ ] B3.4 [P0][M] 实现 `GeneratedFileRepository` — 同上
- [ ] B3.5 [P0][M] 实现 `PullRequestRepository` — 同上
- [ ] B3.6 [P0][S] 在 `StartGenerationUseCase` 中添加事件发布 (GenerationStarted) — `packages/bc/cg/src/application/use-cases/index.ts`
- [ ] B3.7 [P0][M] 在 `TransitionTDDUseCase` 中添加事件发布 (TDDTransition, CodeReady, GenerationFailed) — 同上
- [ ] B3.12 [P0][M] TDD 状态机 + use cases 单元测试 — `packages/bc/cg/tests/application/`

#### 2.4 BC-CR — Code Review (Day 8-10)
- [ ] B4.1 [P0][XS] 生成 Drizzle 迁移 (pgEnum-based) — `packages/bc/cr/drizzle/`
- [ ] B4.2 [P0][XS] 添加 `ReviewStartedEvent` / `CheckCompletedEvent` 接口类 — `packages/bc/cr/src/domain/events/index.ts`
- [ ] B4.3 [P0][M] 实现 `ReviewSessionRepository` — `packages/bc/cr/src/infrastructure/persistence/repositories/`
- [ ] B4.4 [P0][M] 实现 `ReviewCheckRepository` — 同上
- [ ] B4.5 [P0][M] 实现 `ViolationRepository` — 同上
- [ ] B4.9 [P0][M] 在 use cases 中添加事件发布 (ReviewStarted, CheckCompleted, ReviewPassed/ReviewFailed) — `packages/bc/cr/src/application/use-cases/index.ts`
- [ ] B4.12 [P0][M] Use cases 单元测试 — `packages/bc/cr/tests/application/`

#### 2.5 BC-TA — Test Automation (Day 10-12)
- [ ] B5.1 [P0][XS] 生成 Drizzle 迁移 — `packages/bc/ta/drizzle/`
- [ ] B5.2 [P0][XS] 添加 `TestRunStartedEvent` 接口类 — `packages/bc/ta/src/domain/events/index.ts`
- [ ] B5.3 [P0][XS] 修复 B0.2 — `TestPassedEvent` / `TestFailedEvent` 区分 NATS 主题
- [ ] B5.4 [P0][M] 实现 `TestSuiteRepository` — `packages/bc/ta/src/infrastructure/persistence/repositories/`
- [ ] B5.5 [P0][M] 实现 `TestCaseRepository` — 同上
- [ ] B5.6 [P0][M] 实现 `TestRunRepository` — 同上
- [ ] B5.12 [P0][M] 在 use cases 中添加事件发布 (TestRunStarted, TestCaseCompleted, TestPassed/TestFailed, ContractBroken) — `packages/bc/ta/src/application/use-cases/index.ts`
- [ ] B5.14 [P0][M] Use cases 单元测试 — `packages/bc/ta/tests/application/`

#### 2.6 BC-DP — Deployment (Day 12-15)
- [ ] B6.1 [P0][XS] 生成 Drizzle 迁移 — `packages/bc/dp/drizzle/`
- [ ] B6.2 [P0][XS] 添加 `ReleaseCreatedEvent` / `StageCompletedEvent` 接口类 — `packages/bc/dp/src/domain/events/index.ts`
- [ ] B6.3 [P0][M] 实现 `ReleaseRepository` — `packages/bc/dp/src/infrastructure/persistence/repositories/`
- [ ] B6.4 [P0][M] 实现 `PipelineStageRepository` — 同上
- [ ] B6.5 [P0][M] 实现 `RollbackRepository` — 同上
- [ ] B6.11 [P0][M] 在 use cases 中添加事件发布 (ReleaseCreated, StageCompleted, Deployed, RollbackTriggered) — `packages/bc/dp/src/application/use-cases/index.ts`
- [ ] B6.14 [P0][M] Use cases 单元测试 — `packages/bc/dp/tests/application/`

---

### Phase 3 — ACL Implementation (Week 5-7) ⬜

#### 3.1 OpenCode ACL
- [ ] E1.1 [P0][L] 实现 `TDDStateMachine` — RED→GREEN→REFACTOR 状态转换表 — `packages/acl/opencode-acl/src/tdd-state-machine.ts`
- [ ] E1.2 [P0][L] 实现 `OpenCodeRuntimeService` — session 创建, prompt 分发, result 收集 — `packages/acl/opencode-acl/src/opencode-runtime.ts`
- [ ] E1.5 [P0][M] TDD 状态机单元测试 — `packages/acl/opencode-acl/src/tdd-state-machine.test.ts`
- [ ] E1.6 [P0][M] Worktree 生命周期集成测试 — `packages/acl/opencode-acl/src/worktree-service.test.ts`
- [ ] E1.3 [P1][M] 实现 `CodeAdapter` — OpenCode tool events → TDD transitions 映射 — `packages/acl/opencode-acl/src/code-adapter.ts`
- [ ] E1.4 [P1][M] 实现 `WorktreeService` — git worktree create/checkout/cleanup — `packages/acl/opencode-acl/src/worktree-service.ts`

#### 3.2 Git ACL
- [ ] E2.1 [P0][M] 实现 `GitHubPRClient` — create PR, update, merge, get checks — `packages/acl/git-acl/src/github-pr-client.ts`
- [ ] E2.4 [P0][M] 实现 `WorktreeService` — create/lock/unlock/prune/list — `packages/acl/git-acl/src/worktree-service.ts`
- [ ] E2.5 [P0][M] 单元测试 (mocked git shell 输出, mocked GitHub API) — `packages/acl/git-acl/src/*.test.ts`
- [ ] E2.3 [P1][M] 实现 `GitAdapter` — diff, status, sync, createPR — `packages/acl/git-acl/src/git-adapter.ts`

#### 3.3 OpenClaw ACL
- [ ] E3.1 [P0][M] 实现 `OpenClawRuntimeService` — 评审 pipeline 的 session management — `packages/acl/openclaw-acl/src/openclaw-runtime.ts`
- [ ] E3.4 [P0][M] 单元测试 — `packages/acl/openclaw-acl/src/*.test.ts`
- [ ] E3.2 [P1][M] 实现 `ReviewAdapter` — ulw review check types → OpenClaw ACP stages 映射 — `packages/acl/openclaw-acl/src/review-adapter.ts`

#### 3.4 CI/CD ACL
- [ ] E4.1 [P0][L] 实现 `K8sClientService` — deployment CRUD via `@kubernetes/client-node` — `packages/acl/cicd-acl/src/k8s-client.ts`
- [ ] E4.5 [P0][M] 单元测试 (mocked K8s/ArgoCD APIs) — `packages/acl/cicd-acl/src/*.test.ts`
- [ ] E4.2 [P1][M] 实现 `ArgoClientService` — application sync/status/rollback — `packages/acl/cicd-acl/src/argo-client.ts`
- [ ] E4.4 [P1][M] 实现 `ApprovalGateService` — create/poll/approve/deny — `packages/acl/cicd-acl/src/approval-gate.ts`

---

### Phase 4 — Integration & End-to-End Flow (Week 7) ⬜

#### 4.1 NATS Event Bus Verification
- [ ] G2.2 [P0][M] 验证每个 BC 的消费者组 — 订阅上游事件 (PM→AD, AD→CG, CG→CR, CR↔TA, TA→DP) — `packages/bc/*/src/infrastructure/messaging/`
- [ ] B0.7 [P0][M] 所有 6 个 NATS 事件发布者接入真实连接 (替换 `Not implemented` stubs) — `packages/bc/*/src/infrastructure/messaging/`

#### 4.2 API Gateway
- [ ] D1.1 [P1][S] 实现 `ProjectController.list()` — `apps/api-gateway/src/rest/project/project.controller.ts`
- [ ] D1.11 [P0][M] E2E 测试 (health endpoint, REST endpoints, auth flow) — `apps/api-gateway/tests/`

#### 4.3 Cross-BC Integration Tests
- [ ] G1.1 [P1][L] 全流水线集成测试: PM StoryReady → AD ArchitectureApproved → CG CodeReady → CR ReviewPassed → TA TestPassed → DP Deployed — `tests/integration/end-to-end-flow.test.ts`
- [ ] G1.2 [P1][M] Review bounce 测试: CR ReviewFailed → CG 开始新循环 — `tests/integration/review-bounce.test.ts`
- [ ] G1.3 [P1][M] Canary rollback 测试: DP canary 阶段失败 → 自动回滚 — `tests/integration/canary-rollback.test.ts`

---

### Phase 5 — Testing & Quality Gates (Week 8) ⬜

#### 5.1 Coverage Push (80% Target)
- [ ] Run `pnpm test:coverage` across all packages, verify ≥80% line coverage on:
  - [ ] `@ulw/shared-types` (H1.1)
  - [ ] `@ulw/shared-domain` (H1.2)
  - [ ] `@ulw/shared-events` (H1.3)
  - [ ] `@ulw/shared-config` (H1.4)
  - [ ] `@ulw/orchestrator` (H1.5)
  - [ ] `@ulw/supervisor` (H1.6)
  - [ ] `@ulw/bc-pm` (H1.7)
  - [ ] `@ulw/bc-ad` (H1.7)
  - [ ] `@ulw/bc-cg` (H1.7)
  - [ ] `@ulw/bc-cr` (H1.7)
  - [ ] `@ulw/bc-ta` (H1.7)
  - [ ] `@ulw/bc-dp` (H1.7)
  - [ ] `@ulw/acl-*` × 4 packages (H1.8)

#### 5.2 CI/CD Pipeline Finalization
- [ ] F3.1 [P2][M] 接入 E2E 测试 job 到 CI workflow — `.github/workflows/ci.yml`
- [ ] F3.2 [P2][S] 接入 contract test stage 到 review pipeline — `.github/workflows/review-pipeline.yml`

---

### Progress Tracking

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| 0 — Foundation | 24 | 0 | ⬜ Not Started |
| 1 — Core Engine | 7 | 0 | ⬜ Not Started |
| 2 — BC Implementation | 42 | 0 | ⬜ Not Started |
| 3 — ACL Implementation | 14 | 0 | ⬜ Not Started |
| 4 — Integration | 6 | 0 | ⬜ Not Started |
| 5 — Testing & Polish | 16 | 0 | ⬜ Not Started |
| **Total** | **109** | **0** | — |
