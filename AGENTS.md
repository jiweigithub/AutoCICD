# ulw (UltraWork) — Agent Context

## Project Identity

ulw is an AI-driven full-process R&D platform that automates the software delivery lifecycle through multi-agent collaboration. The platform forms a closed-loop automation system: Architecture Design → Code Development → Smart Review → Automated Testing → One-Click Deployment.

## Tech Stack

- **Language**: TypeScript 5.7+ on Node.js 22+
- **Framework**: NestJS 10.x with tRPC 11.x for type-safe internal APIs
- **Monorepo**: pnpm 9.x workspaces
- **Database**: PostgreSQL 16+ with Drizzle ORM 0.40.x
- **Messaging**: NATS JetStream 2.10+
- **Cache**: Redis 7+
- **Storage**: MinIO (S3-compatible)
- **Testing**: Vitest 3.x, Playwright 1.50+, Pact 4.x
- **CI/CD**: GitHub Actions, Pulumi TypeScript, Kubernetes 1.32+, ArgoCD 2.14+
- **Observability**: OpenTelemetry, Prometheus, Grafana, ELK, Sentry

## Monorepo Layout

```
packages/shared/   — Domain types, events, DDD base classes, config
packages/bc/       — Bounded contexts (PM, AD, CG, CR, TA, DP)
packages/core/     — Orchestrator, Supervisor
packages/acl/      — Anti-corruption layers (OpenCode, OpenClaw, Git, CI/CD)
apps/api-gateway/  — NestJS API Gateway with REST + tRPC
agents/            — Agent identity templates (SOUL.md, AGENTS.md, TOOLS.md)
skills/            — OpenCode skill definitions
infrastructure/    — Pulumi IaC, Helm charts
.ulw/              — Platform configuration (review policies, pipeline, security)
```

## Coding Conventions

- **Strict TypeScript**: `strict: true`, no `any`, no `@ts-ignore`
- **DDD Tactical Patterns**: Every BC uses Entity, ValueObject, AggregateRoot from `@ulw/shared-domain`
- **TDD**: No production code without a failing test first
- **Conventional Commits**: `feat(bc-pm):`, `fix(core):`, `chore:`, `docs:`
- **No AI Slop**: No filler phrases, no em dashes, plain words, contractions
- **Error Handling**: Result<T, E> monad for domain operations, never throw for business logic

## Key Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages
pnpm typecheck        # TypeScript type checking across all packages
pnpm lint             # ESLint + Oxlint
pnpm format           # Prettier
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
```

## Architecture Reference

The complete design document: [docs/DESIGN.md](docs/DESIGN.md)
Chinese translation: [docs/DESIGN_zh.md](docs/DESIGN_zh.md)
