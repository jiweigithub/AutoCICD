# ulw (UltraWork)

**SDD+TDD pipeline platform** — write a Markdown spec, get production-ready deployed code. No manual coding required.

```
Markdown Spec → Architecture Design → TDD Code Gen → Code Review → Automated Testing → One-Click Deploy
```

## How It Works

1. You write a `spec.md` (user stories, data models, API contracts, constraints) and commit it to Git
2. OpenClaw receives the webhook, parses the spec, and dispatches agents through 6 pipeline stages
3. OpenCode generates TypeScript code using strict TDD (RED → GREEN → REFACTOR)
4. 6 parallel review sub-agents audit the code for quality, security, architecture, style, dependencies, and contracts
5. Automated testing runs at 4 levels: unit, integration, contract, and E2E
6. After your approval, a canary deployment rolls out with automatic health checks and rollback

## Architecture

OpenClaw is the central gateway and orchestration engine. OpenCode is the TDD coding runtime. Pipeline state is session-based (OpenClaw + Redis). Artifacts are stored as JSON in MinIO.

See [DESIGN.md](docs/DESIGN.md) for the full architecture document.

## Quick Start

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages
pnpm typecheck            # TypeScript type checking
pnpm lint                 # ESLint + Oxlint
pnpm test                 # Run all tests
docker compose up -d      # Start local services (Redis, MinIO, Keycloak)
```

## Project Structure

```
packages/shared/       — DDD base classes, shared types, event schemas, config loader
packages/pipeline/     — Pipeline state types (PipelineRun, StageResult, PipelineStage)
packages/acl/          — Anti-corruption layer interfaces (OpenCode, OpenClaw, Git, CI/CD)
agents/                — Agent identities (7 pipeline stage agents + 6 review sub-agents)
skills/                — Reusable skill definitions (8 planned)
infrastructure/        — Pulumi IaC, Helm charts
.ulw/                  — Governance policies (review thresholds, deployment strategies, security rules)
docs/                  — Design documents, migration plans
openclaw.config.yml    — Single-file configuration for the entire platform
```

## Pipeline Stages

| Stage | Agent | What Happens |
|-------|-------|-------------|
| 1. Spec Parsing | `spec-parser` | Parses `spec.md` into Zod-validated structured JSON |
| 2. Architecture Design | `architect` | Designs DDD aggregates, API contracts, data models, file tree |
| 3. TDD Code Generation | `tdd-coder` | Generates TypeScript code via RED→GREEN→REFACTOR per file |
| 4. Code Review | `reviewer` + 6 sub-agents | Parallel review: static analysis, security, architecture, style, dependencies, contracts |
| 5. Automated Testing | `tester` | Unit → Integration → Contract → E2E tests with coverage gates |
| 6. One-Click Deploy | `deployer` | Canary deployment → health verification → progressive rollout |

## Design Documents

| Document | Description |
|----------|-------------|
| [DESIGN.md](docs/DESIGN.md) | Architecture — SDD+TDD pipeline platform |
| [DESIGN_zh.md](docs/DESIGN_zh.md) | Architecture (中文) |
| [MODULE_PLAN.md](docs/MODULE_PLAN.md) | Migration plan and TODO checklist |
| [MODULE_PLAN_zh.md](docs/MODULE_PLAN_zh.md) | Migration plan (中文) |

## Conventions

- **Strict TypeScript** — `strict: true`, no `any`, no `@ts-ignore`
- **TDD** — RED (failing test) → GREEN (minimal code) → REFACTOR (clean code)
- **DDD Tactical Patterns** — Entity, ValueObject, AggregateRoot, Result<T,E> monad
- **Conventional Commits** — `feat(scope):`, `fix(scope):`, `refactor(scope):`, `chore(scope):`
