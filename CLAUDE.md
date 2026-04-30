# ulw (UltraWork) — Claude Code Context

## Project Identity

ulw is an **SDD+TDD pipeline platform** that automates the software delivery lifecycle through agent-executed pipeline stages. A user writes a Markdown specification, commits it to Git, and ulw produces production-ready, tested, and deployed code — no manual coding required.

**Architecture**: OpenClaw-centric pipeline platform (v2). OpenClaw is the central gateway and orchestration engine. OpenCode is the TDD coding runtime. Pipeline state is session-based (OpenClaw + Redis). Artifacts are JSON in MinIO.

**Migration**: Migrated from v1 (DDD microservices) to v2 (SDD+TDD pipeline). All 6 phases complete.

## 6-Stage Pipeline

```
Markdown Spec → Architecture Design → TDD Code Gen → Code Review → Automated Testing → One-Click Deploy
```

| # | Stage | Agent | Input → Output |
|---|-------|-------|-----------------|
| 1 | Spec Parsing | `spec-parser` | spec.md → structured-spec.json |
| 2 | Architecture Design | `architect` | structured-spec.json → architecture-plan.json |
| 3 | TDD Code Generation | `tdd-coder` | architecture-plan.json → generated TypeScript (RED→GREEN→REFACTOR) |
| 4 | Code Review | `reviewer` (6 sub-agents) | generated code → review-report.json |
| 5 | Automated Testing | `tester` | code + review → test-results.json (unit/integration/contract/E2E) |
| 6 | One-Click Deploy | `deployer` | all-green stages → deployed application (canary → full rollout) |

## Tech Stack

- **Language**: TypeScript 5.7+ on Node.js 22+
- **Monorepo**: pnpm 9.x workspaces
- **Gateways/Runtime**: OpenClaw (central engine), OpenCode (TDD coding runtime)
- **Cache**: Redis 7+
- **Storage**: MinIO (S3-compatible, pipeline artifacts)
- **Auth**: Keycloak (OpenID Connect + RBAC)
- **Schema Validation**: Zod 3.23+
- **Testing**: Vitest 3.x, Playwright 1.50+, Pact 4.x
- **CI/CD**: GitHub Actions, Pulumi TypeScript, Kubernetes 1.32+, ArgoCD 2.14+, Helm 3.17+
- **Observability**: OpenTelemetry, Prometheus, Grafana, ELK, Sentry
- **Linting**: ESLint 9.x + Oxlint 0.15+
- **Build**: tsup 8.3+, tsx 4.19+

**Removed from v1**: NestJS, tRPC, PostgreSQL, Drizzle ORM, NATS JetStream, Passport/JWT

## Monorepo Layout

```
packages/
  shared/
    domain/       — DDD base classes (Entity, ValueObject, AggregateRoot, Result<T,E>) — retained from v1
    types/        — Shared TypeScript types (PipelineStage, Finding, ReviewSession) — to be refactored
    events/       — Zod-validated pipeline event schemas — to be refactored
    config/       — Config loader for openclaw.config.yml — to be refactored
  pipeline/       — Pipeline state types (PipelineRun, StageResult, PipelineStage enum) — NEW
  acl/            — Anti-corruption layer interfaces (OpenCode, OpenClaw, Git, CI/CD adapters)
  bc/             — 6 bounded contexts — TO BE DELETED in Phase 2
  core/           — Orchestrator + Supervisor — TO BE DELETED in Phase 2
apps/api-gateway/ — NestJS API Gateway — TO BE DELETED in Phase 2
agents/           — Agent identity templates (SOUL.md, AGENTS.md, TOOLS.md) — to be repurposed
skills/           — Skill definitions (8 total planned, 6 existing + 2 new)
infrastructure/   — Pulumi IaC, Helm charts — to be simplified
.ulw/             — Governance policies (pipeline, review, security, deployment)
openclaw.config.yml — Single YAML config for OpenClaw (webhooks, agents, skills, pipeline, storage, auth, cron, notifications)
docs/             — Design documents, migration plan
```

## Coding Conventions

- **Strict TypeScript**: `strict: true`, no `any`, no `@ts-ignore`, `noUncheckedIndexedAccess: true`
- **DDD Tactical Patterns**: Generated code uses Entity, ValueObject, AggregateRoot from `@ulw/shared-domain`
- **TDD**: RED (failing test) → GREEN (minimal code) → REFACTOR (clean code). Enforced at tool level by OpenCode.
- **Result<T, E> monad**: Domain operations return `Result<T, E>`, never throw for business logic
- **Conventional Commits**: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `test(scope):`, `chore(scope):`, `docs:`
- **No AI slop**: No filler phrases, no em dashes, plain words, contractions preferred
- **Delete first, then create**: v2 migration deleted ~210 v1 files before adding new code
- **Keep main buildable**: Each commit leaves the workspace in a type-checking state

## Key Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm typecheck            # TypeScript type checking across all packages
pnpm lint                 # ESLint + Oxlint
pnpm format               # Prettier (write)
pnpm format:check         # Prettier (check only)
pnpm test                 # Run all tests
pnpm test:watch           # Watch mode
pnpm --filter @ulw/pipeline typecheck  # Typecheck pipeline package only
pnpm --filter @ulw/pipeline test       # Run pipeline package tests
docker compose up -d      # Start local dev environment
```

## v2 Migration — Complete

The project was migrated from v1 (DDD microservices) to v2 (SDD+TDD pipeline). Tracked in `docs/MODULE_PLAN.md`.

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Create pipeline package + skills + openclaw config | **DONE** |
| 1 | Refactor shared packages (types, events, config) | **DONE** |
| 2 | Delete old packages (BCs, core, API gateway) | **DONE** |
| 3 | Refine ACLs (remove NestJS patterns) | **DONE** |
| 4 | Repurpose agents (restructure by pipeline stage) | **DONE** |
| 5 | Infrastructure cleanup (remove PG + NATS) | **DONE** |

All 6 phases complete. The repository is now v2-only.

## Design Documents

- [DESIGN.md](docs/DESIGN.md) — v2 architecture (SDD+TDD pipeline platform)
- [DESIGN_zh.md](docs/DESIGN_zh.md) — v2 architecture (Chinese)
- [MODULE_PLAN.md](docs/MODULE_PLAN.md) — v2 migration plan with TODO checklist
