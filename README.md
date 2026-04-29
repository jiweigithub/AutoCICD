# ulw (UltraWork)

AI 驱动的全流程研发平台 — 架构设计 → 编码开发 → 智能审查 → 自动化测试 → 一键部署，形成闭环自动化。

## 技术栈

TypeScript 5.7+ · Node.js 22+ · NestJS 10.x · tRPC 11.x · pnpm 9.x · PostgreSQL 16+ (Drizzle ORM) · Redis 7+ · NATS JetStream · MinIO · Vitest 3.x · Playwright · Kubernetes 1.32+ · Pulumi · ArgoCD · OpenTelemetry

## 快速开始

```bash
pnpm install          # 安装依赖
pnpm build            # 构建所有包
pnpm typecheck        # 类型检查
pnpm lint             # ESLint + Oxlint
pnpm test             # 运行测试
docker compose up -d  # 启动本地开发环境 (PG, Redis, NATS, MinIO, Keycloak)
```

## 项目结构

```
packages/shared/   — 领域类型、事件、DDD 基类、配置
packages/bc/       — 6 个限界上下文 (PM, AD, CG, CR, TA, DP)
packages/core/     — 编排器、监督器
packages/acl/      — 防腐层 (OpenCode, OpenClaw, Git, CI/CD)
apps/api-gateway/  — NestJS API 网关 (REST + tRPC)
agents/            — 13 个智能体身份模板
skills/            — 6 个 OpenCode 技能定义
infrastructure/    — Pulumi IaC · Helm Charts
docs/              — 设计方案 (中/英) · 模块完成计划
```

## 设计文档

- [完整设计方案 (英文)](docs/DESIGN.md)
- [完整设计方案 (中文)](docs/DESIGN_zh.md)
- [模块完成计划](docs/MODULE_PLAN.md)

## 开发约定

- **严格 TypeScript**: `strict: true`, 禁用 `any` 和 `@ts-ignore`
- **DDD 战术模式**: 每个 BC 使用 Entity / ValueObject / AggregateRoot
- **TDD**: 无失败测试不写生产代码
- **Conventional Commits**: `feat(bc-pm):`, `fix(core):`, `docs:`
- **Result<T, E>**: 领域操作用 Either monad, 不抛异常
