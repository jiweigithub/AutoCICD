# ulw (UltraWork) — v2 迁移计划

> **版本**: v2.0
> **日期**: 2026-04-30
> **状态**: 规划阶段
> **基于**: [DESIGN_v2.md](./DESIGN_v2.md)，当前 v1 单体仓库状态
> **迁移方向**: DDD 微服务 → SDD+TDD 流水线
> **净文件变化**: 删除约 210 个文件，保留约 100 个文件，新建约 15 个文件
> **预计工作量**: 1 周（并行执行，2–3 名工程师）

> 本文档为 [English Version](MODULE_PLAN_v2.md) 的中文译本。如有歧义，以英文版本为准。

---

## 目录

1. [执行摘要](#1-执行摘要)
2. [差距分析](#2-差距分析)
3. [需删除的内容](#3-需删除的内容)
4. [需保留的内容](#4-需保留的内容)
5. [需新建的内容](#5-需新建的内容)
6. [分阶段执行计划](#6-分阶段执行计划)
7. [原子提交策略](#7-原子提交策略)
8. [TODO 检查清单](#8-todo-检查清单)
9. [风险登记册](#9-风险登记册)

---

## 1. 执行摘要

### 1.1 迁移概述

v1 架构（DESIGN.md）将 ulw 设计为 DDD 微服务平台：6 个限界上下文通过 NATS JetStream 通信，由 NestJS 编排，使用 PostgreSQL + Drizzle ORM 作为后端，并通过基于 REST + tRPC 的 NestJS API 网关对外暴露。

v2 架构（DESIGN_v2.md）将其替换为 **SDD+TDD 流水线平台**。OpenClaw 是中央网关和编排引擎。OpenCode 是 TDD 编码运行时。流水线状态基于会话（OpenClaw + Redis）。产物以 JSON 格式存储在 MinIO 中。不再有限界上下文、NATS 消息总线、PostgreSQL 持久化和 NestJS API 网关。

### 1.2 迁移范围

| 类别 | v1 文件数 | v2 文件数 | 操作 |
|----------|----------|----------|--------|
| 6 个限界上下文（`packages/bc/*`） | 162 个源文件 | 0 | **删除** |
| 核心编排器与监督器（`packages/core/*`） | 40 个源文件 | 0 | **删除** |
| API 网关（`apps/api-gateway/`） | 24 个源文件 | 0 | **删除** |
| 共享领域（`packages/shared/domain/`） | 9 个源文件 | 9 个源文件 | **保留** |
| 共享类型（`packages/shared/types/`） | 10 个源文件 | 10 个源文件 | **重构**（移除 NATS subjects） |
| 共享事件（`packages/shared/events/`） | 10 个源文件 | 10 个源文件 | **重构**（将 NATS 模式替换为流水线事件 Zod 模式） |
| 共享配置（`packages/shared/config/`） | 6 个源文件 | 6 个源文件 | **重构**（加载 openclaw.config.yml） |
| ACL 接口（`packages/acl/*/src/index.ts`） | 4 个接口文件 | 4 个接口文件 | **重构**（移除 NestJS DI 模式） |
| 智能体（`agents/`） | 39 个文件（13 个智能体 × 3） | 21 个文件（7 个智能体 × 3） | **改造**（按流水线阶段重新组织） |
| 技能（`skills/`） | 6 个 SKILL.md 文件 | 8 个 SKILL.md 文件 | **新建 2 个**（规范解析器，流水线编排器） |
| 基础设施（`infrastructure/`） | 15 个文件 | 更少（简化后） | **重构**（移除 PG + NATS 资源） |
| `.ulw/` 治理 | 8 个文件 | 8 个文件 | **保留** |
| 流水线包（`packages/pipeline/`） | 0 | 10 个文件 | **新建** |
| `openclaw.config.yml` | 0 | 1 个文件 | **新建** |

### 1.3 净文件变化

```
删除:  约 210 个文件（BC + Core + API Gateway + node_modules 残留）
保留:  约 100 个文件（shared + ACL + agents + skills + infra + .ulw + 根配置）
新建:   约 15 个文件（pipeline 包 + 2 个技能 + openclaw 配置）
```

### 1.4 关键原则

1. **先删除，后新建** — 在添加 v2 代码前先移除 v1 冗余
2. **保持主干可构建** — 每次提交都让工作空间处于类型检查通过的状态
3. **并行删除** — 全部 6 个 BC 的删除相互独立，可以并行执行
4. **无需数据迁移** — 没有需要迁移的 PostgreSQL，没有需要排空的 NATS 流，没有需要下线的运行中服务（v1 代码库只是一个脚手架，不是运行中的系统）

---

## 2. 差距分析

### 2.1 模块分组对比：v1 → v2

| 模块分组 | v1 状态（DESIGN.md） | v2 目标（DESIGN_v2.md） | 操作 |
|---|---|---|---|
| **共享领域** | 9 个 DDD 基类（Entity, ValueObject, AggregateRoot, Result<T,E>, errors 等）— 完成 | 生成的代码使用相同的类 | **保持**不变 |
| **共享类型** | 10 个类型文件，包括 NATS subject 常量、AgentType、Finding、ReviewSession、旧流水线类型 | 聚焦流水线的类型：PipelineStage 枚举、PipelineRun、StageResult；移除 NATS subjects 和 AgentRole/AgentSession | **重构** — 移除 NATS，添加流水线类型 |
| **共享事件** | 22 个 NATS 事件类型的 7 个模式文件（按 BC 划分的领域事件）+ 信封 + subject 注册表 | 6 个 Zod 验证的流水线事件模式：StageStarted、StageCompleted、PipelineFailed、PipelineCompleted、UserApprovalRequested、UserApprovalReceived | **重写** — 将所有 NATS 模式替换为流水线模式 |
| **共享配置** | 使用 JSON 加载的 ConfigLoader + 30 个环境变量映射 + 8 个 Zod 子模式 | 读取 openclaw.config.yml 的 ConfigLoader；简化模式 | **重构** — 移除 NestJS 配置，保留加载器模式 |
| **BC-PM** | 30 个文件：Project/Sprint/Story 实体、值对象、NestJS 模块、控制器、Drizzle 模式、模拟仓库 | 不需要了 — 规范解析阶段取代项目管理 | **删除** |
| **BC-AD** | 28 个文件：ArchitectureSpec、ApiContract、SemVer、NestJS 模块、控制器、Drizzle 模式 | 不需要了 — 架构设计阶段取代此 BC | **删除** |
| **BC-CG** | 26 个文件：GenerationTask、GeneratedFile、PullRequest、FilePath、TDDState、NestJS 模块、Drizzle 模式 | 不需要了 — TDD 代码生成阶段取代此 BC | **删除** |
| **BC-CR** | 26 个文件：ReviewSession、ReviewCheck、Violation、SeverityThreshold、NestJS 模块、Drizzle 模式 | 不需要了 — 代码审查阶段（6 个子智能体）取代此 BC | **删除** |
| **BC-TA** | 26 个文件：TestSuite、TestCase、TestRun、CoverageThreshold、NestJS 模块、Drizzle 模式 | 不需要了 — 自动化测试阶段取代此 BC | **删除** |
| **BC-DP** | 26 个文件：Release、PipelineStage、Rollback、DeploymentVersion、NestJS 模块、Drizzle 模式 | 不需要了 — 部署阶段取代此 BC | **删除** |
| **核心编排器** | 18 个文件：TaskDecomposer、IntentParser、AgentRouter、tRPC 路由、NestJS 模块 | 不需要了 — OpenClaw 流水线引擎取代编排 | **删除** |
| **核心监督器** | 22 个文件：DAGExecutor、SessionManager、HeartbeatMonitor、RetryManager、StateRepository、NATS 发布/订阅、NestJS 模块 | 不需要了 — OpenClaw 会话管理器 + Redis 取代状态管理 | **删除** |
| **API 网关** | 24 个文件：NestJS 应用、JWT 认证、webhook 接收器、REST 控制器、tRPC 模块、中间件 | 不需要了 — OpenClaw 网关直接处理 webhook、CLI、HTTP API | **删除** |
| **ACL 接口** | 4 个接口文件（OpenCode、OpenClaw、Git、CI/CD 适配器）— 纯 TypeScript 接口，0% 实现 | 相同接口，更简化 — 移除 NestJS Injectable 装饰器，保留纯 TS | **重构** — 剥离 DI，保留契约 |
| **智能体** | 39 个文件：13 个 v1 智能体（6 个 BC 管家 + 编排器 + 监督器 + 代码审查员 + 安全审计员 + 合约验证器 + 部署智能体 + tdd 测试智能体），按 v1 角色组织 | 21 个文件：7 个 v2 智能体（规范解析器、架构师、tdd 编码员、审查员、测试员、部署员）+ 审查员的 6 个子智能体，按流水线阶段组织 | **改造** — 重新组织目录，重写身份文件 |
| **技能** | 6 个 SKILL.md 文件：代码审查、合约验证、部署、安全审计、tdd、测试生成 | 8 个 SKILL.md 文件：新增规范解析、架构设计、流水线编排；保留现有的 | **保留 6 个 + 新建 3 个** |
| **基础设施** | 15 个文件：Pulumi 栈、K8s 资源（PostgreSQL、NATS、API 网关、编排器 Pod） | 简化：移除 PG + NATS + BC Pod；添加 OpenClaw + OpenCode 作业模板 | **重构** — 简化 K8s 资源 |
| **流水线包** | 不存在 | 轻量级 TypeScript 包，包含流水线状态类型（PipelineRun、StageResult、PipelineStage 枚举） | **新建** |
| **openclaw.config.yml** | 不存在 | 单个 YAML 文件，定义 webhook、技能、智能体、流水线阶段、存储、缓存、认证、定时任务、通知、可观测性 | **新建** |

### 2.2 复杂度降低总结

| 指标 | v1 | v2 | 变化 |
|--------|----|----|-------|
| TypeScript 源包 | 16 | 5 | −69% |
| 长期运行服务（Pod） | 8+ | 4 | −50% |
| 数据库实例 | 1（PostgreSQL） | 0 | −100% |
| 消息总线实例 | 1（NATS JetStream） | 0 | −100% |
| 框架依赖 | NestJS + tRPC + Drizzle + NATS | 仅 OpenClaw SDK | −75% |
| API 端点（内部） | 40+（tRPC 过程） | 0 | −100% |
| 配置文件 | 约 15 个（.env、NATS、tRPC、按 BC 划分） | 1 个（openclaw.config.yml） | −93% |

---

## 3. 需删除的内容

### 3.1 限界上下文 — `packages/bc/*`

全部 6 个限界上下文被流水线阶段取代。它们的领域实体、NestJS 模块、控制器、Drizzle 模式、模拟仓库和消息存根不再需要。

#### packages/bc/pm/ — 项目管理（30 个文件）

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

#### packages/bc/ad/ — 架构设计（28 个文件）

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

#### packages/bc/cg/ — 代码生成（26 个文件）

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

#### packages/bc/cr/ — 代码审查（26 个文件）

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

#### packages/bc/ta/ — 自动化测试（26 个文件）

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

#### packages/bc/dp/ — 部署（26 个文件）

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

**BC 小计：162 个文件**

---

### 3.2 核心引擎 — `packages/core/*`

#### packages/core/orchestrator/ — 编排器（18 个文件）

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

#### packages/core/supervisor/ — 监督器（22 个文件）

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

**Core 小计：40 个文件**

---

### 3.3 API 网关 — `apps/api-gateway/`（24 个文件）

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

**API 网关小计：24 个文件**

---

### 3.4 pnpm-workspace.yaml — 移除条目

在 `/home/jiwei/workspace/AutoCICD/pnpm-workspace.yaml` 中，移除以下行：

```yaml
  - "packages/bc/*"          # ← 删除：限界上下文已移除
  - "packages/core/*"        # ← 删除：编排器 + 监督器已移除
  - "apps/*"                 # ← 删除：API 网关已移除
```

仅保留：
```yaml
packages:
  - "packages/shared/*"
  - "packages/acl/*"
  - "packages/pipeline/*"
```

同时从 `catalog:` 部分移除：NestJS 依赖、tRPC 依赖、Drizzle ORM 依赖、NATS 客户端、PostgreSQL 驱动、Passport/JWT，以及所有 NestJS 相关包。保留 vitest、eslint、prettier、oxlint、zod、typescript、tsup、tsx 和可观测性包。

### 3.5 根目录 package.json — 移除脚本和依赖

从 `/home/jiwei/workspace/AutoCICD/package.json` 中移除以下脚本：

```
"dev": "pnpm --filter @ulw/api-gateway dev"     ← 移除（无网关）
```

移除不再需要的 v1 `devDependencies`（NestJS 相关、tRPC 相关、Drizzle、NATS、Passport）。保留 vitest、typescript、eslint、oxlint、prettier。

### 3.6 docker-compose.yml — 移除服务

从 `/home/jiwei/workspace/AutoCICD/docker-compose.yml` 中移除：
- PostgreSQL 服务
- NATS 服务

保留：Redis、MinIO、Keycloak。新增：OpenClaw 网关服务。

---

**总计删除：约 226 个文件 + 工作空间配置更新**

---

## 4. 需保留的内容

### 4.1 共享领域 — `packages/shared/domain/src/`（9 个源文件）

阶段 3（TDD 代码生成）中生成的代码使用的 DDD 基类。架构师智能体设计聚合时引用这些基类。TDD 编码员生成代码时扩展它们。

```
packages/shared/domain/src/aggregate-root.ts    — AggregateRoot<TId> 基类
packages/shared/domain/src/domain-event.ts       — DomainEvent 接口
packages/shared/domain/src/entity.ts             — Entity<TId> 基类
packages/shared/domain/src/errors.ts             — DomainError + 5 个子类型
packages/shared/domain/src/identifier.ts         — Identifier<T> 标记类型
packages/shared/domain/src/index.ts              — 桶导出
packages/shared/domain/src/pagination.ts         — PaginatedResult<T>
packages/shared/domain/src/result.ts             — Result<T, E> Either 单子
packages/shared/domain/src/value-object.ts       — ValueObject 基类
```

外加配置文件：
```
packages/shared/domain/package.json
packages/shared/domain/tsconfig.json
packages/shared/domain/vitest.config.ts
```

**理由**：这些是唯一能存活到 v2 的 v1 业务逻辑文件。OpenCode 生成的领域代码扩展了 `Entity`、`AggregateRoot`、`ValueObject`，并使用 `Result<T,E>` 进行错误处理。`DomainError` 层次结构被生成的验证逻辑使用。这些文件对 NestJS、NATS、Drizzle 或 PostgreSQL 零依赖。

### 4.2 共享类型 — `packages/shared/types/src/`（10 个源文件）

```
packages/shared/types/src/agent.ts               — AgentType 枚举（为流水线智能体更新）
packages/shared/types/src/api.ts                 — API 相关类型别名
packages/shared/types/src/deployment.ts          — 部署状态类型
packages/shared/types/src/domain.ts              — 领域实体/聚合接口定义
packages/shared/types/src/events.ts              — NATS subjects → 重构为流水线事件类型
packages/shared/types/src/index.ts               — 桶导出
packages/shared/types/src/pipeline.ts            — 旧流水线类型 → 替换为新的 PipelineStage/PipelineRun
packages/shared/types/src/review.ts              — Finding、ReviewSession、ReviewStatus、CheckType、Severity
packages/shared/types/src/testing.ts             — 测试套件/用例类型别名
packages/shared/types/src/workflow.ts            — 旧工作流类型 → 替换
```

外加配置文件：
```
packages/shared/types/package.json
packages/shared/types/tsconfig.json
packages/shared/types/vitest.config.ts
```

**理由**：类型是流水线和生成代码之间的契约层。审查阶段仍然需要 `Finding`、`ReviewSession` 和 `Severity` 类型。`AgentType` 枚举已更新以适配 7 个流水线智能体。NATS subject 常量被移除。旧流水线/工作流类型被新的 `PipelineStage` 枚举、`PipelineRun` 和 `StageResult` 类型替换。

### 4.3 共享事件 — `packages/shared/events/src/`（10 个源文件）

```
packages/shared/events/src/envelope.ts           — 消息信封（可能简化）
packages/shared/events/src/index.ts              — 桶导出
packages/shared/events/src/schemas/architecture-events.ts  — 重构为流水线架构事件
packages/shared/events/src/schemas/code-events.ts         — 重构为流水线代码事件
packages/shared/events/src/schemas/deployment-events.ts   — 重构为流水线部署事件
packages/shared/events/src/schemas/project-events.ts      — 重构为流水线项目/规范事件
packages/shared/events/src/schemas/review-events.ts       — 重构为流水线审查事件
packages/shared/events/src/schemas/security-events.ts     — 保留安全事件模式
packages/shared/events/src/schemas/testing-events.ts      — 重构为流水线测试事件
packages/shared/events/src/subject-registry.ts  — NATS subject 注册表 → 移除
```

外加配置文件：
```
packages/shared/events/package.json
packages/shared/events/tsconfig.json
packages/shared/events/vitest.config.ts
```

**理由**：事件包提供 Zod 验证的流水线事件模式。v1 基于 NATS subject 的事件系统被流水线事件 Zod 模式（StageStarted、StageCompleted、PipelineFailed、PipelineCompleted、UserApprovalRequested、UserApprovalReceived）取代。安全事件模式（SecretDetected、PolicyViolation）保留供阶段 4 的安全审计子智能体使用。

### 4.4 共享配置 — `packages/shared/config/src/`（6 个源文件）

```
packages/shared/config/src/defaults.ts          — 默认配置值
packages/shared/config/src/index.ts             — 桶导出
packages/shared/config/src/loader.ts            — 配置文件加载器（为 YAML 更新）
packages/shared/config/src/schema.ts            — Zod 配置模式（为 v2 简化）
packages/shared/config/src/secrets.ts           — 秘密管理（环境变量替换）
packages/shared/config/src/validator.ts         — 配置验证
```

外加配置文件：
```
packages/shared/config/package.json
packages/shared/config/tsconfig.json
packages/shared/config/vitest.config.ts
```

**理由**：配置包提供加载器基础设施。在 v2 中，它被更新为加载 `openclaw.config.yml`，而非 v1 的多文件 NestJS 配置。加载器、秘密管理和验证工具本质上使用了相同的模式。模式定义被简化以匹配单一 openclaw.config.yml 结构。

### 4.5 ACL 接口 — `packages/acl/*/src/index.ts`（4 个接口文件）

```
packages/acl/cicd-acl/src/index.ts       — CICDAdapter 接口（triggerPipeline、getDeploymentStatus、rollback）
packages/acl/git-acl/src/index.ts        — GitAdapter 接口（createWorktree、commit、push、createPR、removeWorktree）
packages/acl/openclaw-acl/src/index.ts   — OpenClawAdapter 接口（dispatchAgent、notifyUser、getSessionState）
packages/acl/opencode-acl/src/index.ts   — OpenCodeAdapter 接口（createSession、writeFile、runCommand、getDiagnostics、closeSession）
```

外加每个 ACL 的配置文件：
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

**理由**：ACL 接口定义了 ulw 流水线与外部系统之间的适配器契约。这些是纯 TypeScript 接口（没有 NestJS 装饰器）。它们是让流水线代码可测试（模拟适配器）和可移植（交换实现）的边界。在 v2 中，这些文件中的 NestJS `@Injectable()` 装饰器被移除。接口本身作为 OpenClaw、OpenCode、Git 和 CI/CD 系统之间的契约仍然有效。

**保留的 ACL 文件总数：4 个源文件 + 12 个配置文件 = 16 个文件**

### 4.6 智能体 — `agents/`（39 个现有文件 → 21 个改造文件）

保留待改造的现有 v1 智能体（内容为流水线阶段角色重写）：

```
agents/ad-steward/AGENTS.md         → 改造为 agents/architect/AGENTS.md
agents/ad-steward/SOUL.md           → 改造为 agents/architect/SOUL.md
agents/ad-steward/TOOLS.md          → 改造为 agents/architect/TOOLS.md
agents/cg-steward/AGENTS.md         → 改造为 agents/tdd-coder/AGENTS.md
agents/cg-steward/SOUL.md           → 改造为 agents/tdd-coder/SOUL.md
agents/cg-steward/TOOLS.md          → 改造为 agents/tdd-coder/TOOLS.md
agents/cr-steward/AGENTS.md         → 改造为 agents/reviewer/AGENTS.md
agents/cr-steward/SOUL.md           → 改造为 agents/reviewer/SOUL.md
agents/cr-steward/TOOLS.md          → 改造为 agents/reviewer/TOOLS.md
agents/ta-steward/AGENTS.md         → 改造为 agents/tester/AGENTS.md
agents/ta-steward/SOUL.md           → 改造为 agents/tester/SOUL.md
agents/ta-steward/TOOLS.md          → 改造为 agents/tester/TOOLS.md
agents/dp-steward/AGENTS.md         → 改造为 agents/deployer/AGENTS.md
agents/dp-steward/SOUL.md           → 改造为 agents/deployer/SOUL.md
agents/dp-steward/TOOLS.md          → 改造为 agents/deployer/TOOLS.md
agents/pm-steward/AGENTS.md         → 改造为 agents/spec-parser/AGENTS.md
agents/pm-steward/SOUL.md           → 改造为 agents/spec-parser/SOUL.md
agents/pm-steward/TOOLS.md          → 改造为 agents/spec-parser/TOOLS.md
```

审查子智能体（保持原样或改造）：
```
agents/code-reviewer/               → 改造为 agents/reviewer/sub-agents/static-analyzer/
agents/security-auditor/            → 改造为 agents/reviewer/sub-agents/security-auditor/
agents/contract-validator/          → 改造为 agents/reviewer/sub-agents/contract-validator/
```

需删除的 v1 智能体（被 OpenClaw 原生功能取代）：
```
agents/orchestrator/                → 删除（被 OpenClaw 流水线引擎取代）
agents/supervisor/                  → 删除（被 OpenClaw 会话管理器取代）
agents/deploy-agent/                → 删除（合并到 deployer）
agents/tdd-test-agent/              → 删除（合并到 tdd-coder + tester）
```

需要的新 v2 智能体（无 v1 前身 — 从头构建）：
```
agents/reviewer/sub-agents/architecture-checker/   — 新建
agents/reviewer/sub-agents/style-checker/          — 新建
agents/reviewer/sub-agents/dependency-checker/     — 新建
```

**理由**：v2 智能体模型将 13 个 v1 智能体缩减为 7 个流水线阶段智能体 + 6 个审查子智能体。管家智能体（pm-steward、ad-steward 等）被改造为对应的流水线阶段。编排器和监督器智能体被淘汰，因为 OpenClaw 原生处理这些功能。

### 4.7 技能 — `skills/`（6 个现有 SKILL.md 文件，3 个新增）

保留原样或改造的现有技能：
```
skills/code-review/SKILL.md          — 代码审查编排（仍然需要）
skills/contract-validation/SKILL.md  — Pact 合约验证（仍然需要）
skills/deployment/SKILL.md           — 金丝雀部署工作流（仍然需要）
skills/security-audit/SKILL.md       — 漏洞扫描（仍然需要）
skills/tdd/SKILL.md                  — RED→GREEN→REFACTOR 工作流（仍然需要）
skills/test-generation/SKILL.md      — 自动化测试套件生成（仍然需要）
```

新建技能（参见第 5 节）：
```
skills/spec-parser/SKILL.md          — 新建：Markdown 规范解析
skills/pipeline-orchestrator/SKILL.md — 新建：流水线编排技能
```

**理由**：技能定义了智能体在运行时加载的可复用能力。现有的 6 个技能仍然相关 — 流水线阶段使用相同的基础工作模式（TDD、代码审查、安全审计等）。需要两个新技能：规范解析（阶段 1）和流水线编排（跨阶段协调）。

### 4.8 基础设施 — `infrastructure/`（15 个文件，简化后）

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
infrastructure/packages/database/index.ts         → 重构：移除 PostgreSQL
infrastructure/packages/messaging/index.ts         → 重构：移除 NATS
```

**理由**：Pulumi IaC 和 Helm Chart 被简化。移除了 PostgreSQL 和 NATS 资源。新增资源：OpenClaw 网关部署、OpenCode 作业 Pod 模板。可观测性、缓存（Redis）和存储（MinIO）子包基本保持不变。

### 4.9 `.ulw/` 治理（8 个文件）

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

**理由**：`.ulw/` 中的所有治理策略、审查阈值、部署策略和安全规则都受版本控制，并且在 v2 中仍然有效。流水线在触发时加载这些按仓库划分的策略。

### 4.10 根目录配置文件

```
package.json                         — 更新（移除 NestJS/tRPC/Drizzle/NATS 依赖）
pnpm-workspace.yaml                  — 更新（移除 BC/core/apps 条目）
tsconfig.base.json                   — 保留（基础 TypeScript 配置不变）
eslint.config.mjs                    — 保留（lint 规则不变）
oxlintrc.json                        — 保留（快速 lint 配置不变）
.prettierrc                          — 保留（格式化配置不变）
vitest.workspace.ts                  — 更新（移除 BC/core/apps 引用）
AGENTS.md                            — 保留（智能体上下文定义）
README.md                            — 更新（反映 v2 架构）
docker-compose.yml                   — 更新（移除 PG + NATS，添加 OpenClaw）
pnpm-lock.yaml                       — 依赖变更后重新生成
```

**保留的文件总数（约）：约 100 个源文件 + 配置文件**

---

## 5. 需新建的内容

### 5.1 流水线包 — `packages/pipeline/`（10 个文件）

一个轻量级的 TypeScript 包，提供流水线状态模型。这些是纯类型定义和枚举 — 没有业务逻辑，没有 DDD 类，没有持久化层。

```
packages/pipeline/src/state-model.ts         — PipelineStage 枚举、PipelineRun、StageResult、PipelineRunStatus、StageStatus 类型
packages/pipeline/src/stage-executor.ts       — 阶段分发逻辑：advanceStage()、retryStage()、failStage()
packages/pipeline/src/pipeline.ts             — 流水线编排入口：createPipelineRun()、getNextStage()、validateStageTransition()
packages/pipeline/package.json                — npm 包元数据
packages/pipeline/tsconfig.json              — TypeScript 配置（继承 tsconfig.base.json）
packages/pipeline/vitest.config.ts           — 带覆盖率的 Vitest 配置
packages/pipeline/tests/state-model.test.ts   — 类型守卫、枚举值、序列化的单元测试
packages/pipeline/tests/stage-executor.test.ts — 阶段分发、重试、失败逻辑的单元测试
packages/pipeline/src/index.ts               — 桶导出
packages/pipeline/README.md                  — 包文档（可选）
```

**关键类型**（来自 DESIGN_v2.md 第 4.3 节）：

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
  artifactKeys: string[];                // MinIO 对象键
  findings?: Finding[];                   // 仅用于 CODE_REVIEW 阶段
  errorMessage: string | null;
  retryCount: number;
}
```

**理由**：流水线包是唯一需要的新 TypeScript 代码。它定义了 OpenClaw、智能体和仪表盘消费者用来跟踪流水线状态的类型。这是一个纯类型包，除 TypeScript 外无运行时依赖。

### 5.2 技能 — `skills/spec-parser/SKILL.md` 和 `skills/pipeline-orchestrator/SKILL.md`

#### skills/spec-parser/SKILL.md

一个定义如何将 Markdown 规范文档解析为 Zod 验证的结构化 JSON 的技能。由阶段 1 的规范解析器智能体使用。

**内容大纲**：
- 目的：将 Markdown 规范文档解析为 StructuredSpec JSON
- 输入格式：带章节的 Markdown（概述、用户故事、验收条件、数据模型、API 合约、约束）
- 输出格式：Zod 验证的 `structured-spec.json`
- 验证规则：必需章节、字段约束、关系验证
- 错误报告：指向原始 Markdown 的行引用
- 工具绑定：Read（文件读取）、Write（JSON 输出）、Bash（验证）

#### skills/pipeline-orchestrator/SKILL.md

一个定义 OpenClaw 如何编排 6 阶段流水线的技能。这是 OpenClaw 在启动时加载的跨阶段协调逻辑。

**内容大纲**：
- 目的：编排 6 阶段 SDD+TDD 流水线
- 阶段分发：顺序执行、阶段输入/输出契约
- 失败处理：重试、退避、3 次失败后放弃
- 门控管理：部署审批门控逻辑
- 产物管理：MinIO 存储路径、产物命名约定
- 工具绑定：Read、Bash、智能体分发配置

### 5.3 OpenClaw 配置 — `openclaw.config.yml`

仓库根目录下的单个 YAML 配置文件。取代约 15 个 v1 配置文件。

完整参考见 DESIGN_v2.md 第 9.2 节。关键部分：

- `server:` — 主机、端口、TLS 配置
- `webhooks:` — GitHub、GitLab、手动 CLI 触发
- `pipeline:` — 6 个阶段定义，含超时、重试配置、门控规则、覆盖率阈值
- `agents:` — 7 个智能体身份，含技能绑定和工具许可名单
- `skills:` — 8 个技能路径，含描述
- `storage:` — MinIO 连接配置
- `cache:` — Redis 连接配置
- `auth:` — Keycloak 连接配置 + RBAC 角色定义
- `cron:` — 3 个定时任务（夜间安全扫描、每周依赖更新、产物清理）
- `notifications:` — Slack、GitHub、邮件通知配置
- `observability:` — OpenTelemetry、Prometheus、日志配置

### 5.4 智能体身份文件 — 新 v2 智能体（21 个文件）

7 个流水线阶段智能体 + 6 个审查子智能体的新智能体身份，组织在 `agents/` 下：

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

**新建文件总数：约 15 个源文件 + 约 21 个智能体身份文件 = 约 36 个文件**
（其中 4 个有 v1 前身的智能体的身份文件算作"从 v1 改造"，3 个无前身的智能体算作"新建"。）

---

## 6. 分阶段执行计划

### 阶段 0：新建 — 流水线包 + 技能 + 配置（零风险）

**目标**：在不接触任何现有代码的情况下添加新的 v2 文件。本阶段零风险，因为只创建文件 — 不删除也不修改任何内容。

**持续时间**：2–3 小时

**任务**：
1. 创建 `packages/pipeline/` 目录及其全部 10 个文件
2. 创建 `skills/spec-parser/SKILL.md`
3. 创建 `skills/pipeline-orchestrator/SKILL.md`
4. 从 DESIGN_v2.md 第 9.2 节模板创建 `openclaw.config.yml`

**验证**：
```bash
pnpm --filter @ulw/pipeline typecheck   # 流水线类型必须编译通过
pnpm --filter @ulw/pipeline test        # 流水线测试必须通过
ls -la packages/pipeline/src/           # 验证全部 5 个源文件存在
ls -la packages/pipeline/tests/         # 验证全部 2 个测试文件存在
ls -la skills/spec-parser/SKILL.md      # 验证技能文件存在
ls -la skills/pipeline-orchestrator/SKILL.md  # 验证技能文件存在
ls -la openclaw.config.yml              # 验证配置文件存在
```

### 阶段 1：重构共享包

**目标**：在不破坏单体仓库构建的情况下，为流水线模型更新共享包。

**持续时间**：3–4 小时

**任务**：

1. **重构 `packages/shared/types/src/`**：
   - 从 `events.ts` 移除 NATS subject 常量
   - 从 `agent.ts` 移除 `AgentRole`、`AgentSession`、`AgentMessage`（由 OpenClaw 会话模型取代）
   - 从 `pipeline.ts` 移除 `ApprovalGate`、`CanaryRule` 和旧的 `PipelineStage`
   - 在 `pipeline.ts` 中添加新的 `PipelineStage` 枚举（6 个阶段）
   - 添加 `PipelineRun`、`StageResult`、`StageStatus`、`PipelineRunStatus` 类型导出
   - 添加 `PipelineEvent` 联合类型
   - 更新 `index.ts` 的桶导出

2. **重写 `packages/shared/events/src/schemas/`**：
   - 将所有 7 个 NATS 事件模式文件替换为 6 个流水线事件模式：
     - `pipeline-events.ts`：StageStartedEvent、StageCompletedEvent
     - `pipeline-lifecycle.ts`：PipelineStartedEvent、PipelineFailedEvent、PipelineCompletedEvent
     - `approval-events.ts`：UserApprovalRequested、UserApprovalReceived
   - 移除 `subject-registry.ts`（不再需要）
   - 更新 `envelope.ts` 以适配流水线事件格式
   - 更新 `index.ts` 的桶导出

3. **重构 `packages/shared/config/src/`**：
   - 更新 `loader.ts` 以加载 `openclaw.config.yml`（YAML）
   - 简化 `schema.ts` 以适配单文件配置（移除多源合并逻辑）
   - 更新 `defaults.ts` 为 v2 默认值
   - `secrets.ts` 和 `validator.ts` 保持不变

4. **更新 `pnpm-workspace.yaml`**：
   - 移除 `packages/bc/*`、`packages/core/*`、`apps/*` 条目
   - 添加 `packages/pipeline/*` 条目
   - 从 `catalog:` 中移除 NestJS、tRPC、Drizzle、NATS、Passport

5. **更新 `vitest.workspace.ts`**：
   - 移除 BC、core 和 app 的工作空间引用
   - 保留 shared 和 acl 的工作空间引用
   - 添加 pipeline 的工作空间引用

6. **更新根目录 `package.json`**：
   - 移除 `"dev": "pnpm --filter @ulw/api-gateway dev"` 脚本
   - 移除 v1 `devDependencies`（NestJS、tRPC 等）

**验证**：
```bash
pnpm typecheck     # 必须通过 — 不应存在 BC/core/app 的引用
pnpm lint          # 必须通过
pnpm test          # 现有的共享测试必须仍然通过
cat pnpm-workspace.yaml | grep "packages/bc"   # 必须返回空
cat pnpm-workspace.yaml | grep "packages/pipeline"  # 必须返回条目
```

### 阶段 2：删除旧包 — BC、Core、API 网关

**目标**：移除所有 v1 专用包。本阶段按文件数计规模最大，但机械上最简单（纯删除）。

**持续时间**：1–2 小时

**任务**：
1. 删除整个 `packages/bc/` 目录（全部 6 个限界上下文：pm、ad、cg、cr、ta、dp）
2. 删除整个 `packages/core/` 目录（编排器 + 监督器）
3. 删除整个 `apps/` 目录（api-gateway）
4. 如有需要，清理空的父目录

**验证**：
```bash
ls packages/bc/   # 必须返回 "No such file or directory"
ls packages/core/ # 必须返回 "No such file or directory"
ls apps/          # 必须返回 "No such file or directory"
pnpm typecheck    # 必须通过（无损坏的导入）
pnpm build        # 必须通过（仅共享 + 流水线 + ACL 包构建）
```

### 阶段 3：精炼 ACL — 移除 NestJS 模式

**目标**：从 ACL 接口文件中剥离 NestJS 依赖注入模式。ACL 变为纯 TypeScript 接口，无框架依赖。

**持续时间**：1 小时

**任务**：
1. 检查每个 `packages/acl/*/src/index.ts` 中的 `@Injectable()` 装饰器 — 移除它们
2. 检查每个 `packages/acl/*/src/index.ts` 中的 `@nestjs/common` 导入 — 移除它们
3. 验证所有接口签名与 DESIGN_v2.md 第 4.5 节一致
4. 更新每个 ACL 的 package.json，移除 `@nestjs/common` 依赖

**验证**：
```bash
grep -r "@Injectable" packages/acl/   # 必须无匹配
grep -r "@nestjs" packages/acl/       # 源文件中必须无匹配
pnpm typecheck                         # 必须通过
```

### 阶段 4：改造智能体 — 按流水线阶段重组

**目标**：将 `agents/` 目录从基于 v1 BC 的组织结构重组为基于 v2 流水线阶段的结构。

**持续时间**：4–6 小时

**任务**：
1. 创建新目录：`agents/spec-parser/`、`agents/architect/`、`agents/tdd-coder/`、`agents/reviewer/`、`agents/reviewer/sub-agents/`、`agents/tester/`、`agents/deployer/`
2. 改造 v1 管家智能体：
   - `agents/pm-steward/*` → 重写为 `agents/spec-parser/*`
   - `agents/ad-steward/*` → 重写为 `agents/architect/*`
   - `agents/cg-steward/*` → 重写为 `agents/tdd-coder/*`
   - `agents/cr-steward/*` → 重写为 `agents/reviewer/*`
   - `agents/ta-steward/*` → 重写为 `agents/tester/*`
   - `agents/dp-steward/*` → 重写为 `agents/deployer/*`
3. 改造审查子智能体：
   - `agents/code-reviewer/*` → 重写为 `agents/reviewer/sub-agents/static-analyzer/*`
   - `agents/security-auditor/*` → 重写为 `agents/reviewer/sub-agents/security-auditor/*`
   - `agents/contract-validator/*` → 重写为 `agents/reviewer/sub-agents/contract-validator/*`
4. 从头创建新的审查子智能体：
   - `agents/reviewer/sub-agents/architecture-checker/*`
   - `agents/reviewer/sub-agents/style-checker/*`
   - `agents/reviewer/sub-agents/dependency-checker/*`
5. 删除过时的 v1 智能体：
   - `agents/orchestrator/`
   - `agents/supervisor/`
   - `agents/deploy-agent/`（合并到 deployer）
   - `agents/tdd-test-agent/`（合并到 tdd-coder + tester）
6. 为每个 v2 智能体更新 SOUL.md、AGENTS.md、TOOLS.md，加入流水线阶段上下文

**验证**：
```bash
find agents/ -type f -name "*.md" | sort     # 验证 33 个文件（11 个智能体 × 3）
find agents/ -type d | sort                   # 验证目录结构与 DESIGN_v2.md 第 6.6 节一致
ls agents/orchestrator/ 2>/dev/null           # 必须返回空（已删除）
ls agents/supervisor/ 2>/dev/null             # 必须返回空（已删除）
```

---

## 7. 原子提交策略

遵循 **Conventional Commits**，使用范围前缀。提交顺序确保主干在每一步都可构建。

### 提交序列

```
# 阶段 0：新建（零风险 — 仅添加）
feat(pipeline): add pipeline state model package
feat(pipeline): add stage executor with dispatch and retry logic
test(pipeline): add unit tests for PipelineStage enum and PipelineRun types
test(pipeline): add unit tests for stage executor dispatch and retry
feat(skills): add spec-parser skill for Stage 1 spec parsing
feat(skills): add pipeline-orchestrator skill for cross-stage coordination
chore: add OpenClaw configuration (openclaw.config.yml)
chore(workspace): add pipeline package to pnpm-workspace.yaml

# 阶段 1：重构共享包
refactor(shared-events): replace NATS event schemas with pipeline event Zod schemas
refactor(shared-events): remove subject-registry (NATS-specific)
refactor(shared-types): remove NATS subject constants and AgentRole/AgentSession types
refactor(shared-types): add PipelineStage enum and PipelineRun/StageResult types
refactor(shared-config): update config loader for openclaw.config.yml
chore(workspace): remove NestJS/tRPC/Drizzle/NATS from pnpm catalog
chore(workspace): update vitest.workspace.ts for v2 package set

# 阶段 2：删除旧包（每个 BC 一个提交）
chore(bc-pm): remove Project Management bounded context (30 files)
chore(bc-ad): remove Architecture Design bounded context (28 files)
chore(bc-cg): remove Code Generation bounded context (26 files)
chore(bc-cr): remove Code Review bounded context (26 files)
chore(bc-ta): remove Test Automation bounded context (26 files)
chore(bc-dp): remove Deployment bounded context (26 files)
chore(core): remove Orchestrator and Supervisor packages (40 files)
chore(app): remove API Gateway application (24 files)
chore(workspace): update pnpm-workspace.yaml — remove BC/core/apps entries

# 阶段 3：精炼 ACL
refactor(acl): remove NestJS decorators and imports from ACL interface files
refactor(acl): update ACL interfaces for OpenClaw-native invocation

# 阶段 4：改造智能体
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

# 阶段 5：基础设施清理
refactor(infra): remove PostgreSQL and NATS from Pulumi stacks
refactor(infra): add OpenClaw Gateway deployment resource
refactor(infra): add OpenCode job pod template
refactor(docker): remove PostgreSQL and NATS from docker-compose.yml
feat(docker): add OpenClaw Gateway to docker-compose.yml
```

### 分支策略

```
main
  └── feat/v2-migration
       ├── 阶段 0 提交（pipeline + skills + config）  ← 首先合并
       ├── 阶段 1 提交（shared 重构）                   ← 其次合并
       ├── 阶段 2 提交（删除 BC + core + app）         ← 第三合并
       ├── 阶段 3 提交（ACL 精炼）                     ← 第四合并
       ├── 阶段 4 提交（智能体改造）                    ← 第五合并
       └── 阶段 5 提交（基础设施清理）                  ← 最后合并
```

每个阶段是一个 PR。按顺序合并阶段 — 切勿在阶段 1 之前合并阶段 2。

---

## 8. TODO 检查清单

条目按阶段组织。格式：`- [ ] [优先级][工作量] <文件路径> — <描述>`

### 阶段 0：新建（P0）

- [x] [P0][S] 创建 `packages/pipeline/package.json` — npm 包元数据，包名为 `@ulw/pipeline`
- [x] [P0][S] 创建 `packages/pipeline/tsconfig.json` — 继承 tsconfig.base.json
- [x] [P0][S] 创建 `packages/pipeline/vitest.config.ts` — 带覆盖率提供者的 Vitest 配置
- [x] [P0][M] 创建 `packages/pipeline/src/state-model.ts` — PipelineStage 枚举、PipelineRun、StageResult 类型
- [x] [P0][M] 创建 `packages/pipeline/src/stage-executor.ts` — 阶段推进/重试/失败分发函数
- [x] [P0][S] 创建 `packages/pipeline/src/pipeline.ts` — createPipelineRun()、getNextStage()、validateStageTransition()
- [x] [P0][S] 创建 `packages/pipeline/src/index.ts` — 所有公开类型的桶导出
- [x] [P0][S] 创建 `packages/pipeline/tests/state-model.test.ts` — 测试 PipelineStage 枚举值和类型守卫
- [x] [P0][S] 创建 `packages/pipeline/tests/stage-executor.test.ts` — 测试阶段分发和重试逻辑
- [x] [P0][M] 创建 `skills/spec-parser/SKILL.md` — 带 Zod 验证的 Markdown 规范解析技能
- [x] [P0][M] 创建 `skills/pipeline-orchestrator/SKILL.md` — 带阶段分发的流水线编排技能
- [x] [P0][M] 创建 `openclaw.config.yml` — 基于 DESIGN_v2.md 第 9.2 节模板的完整配置
- [x] [P0][XS] 运行 `pnpm --filter @ulw/pipeline typecheck` — 验证流水线类型编译通过
- [x] [P0][XS] 运行 `pnpm --filter @ulw/pipeline test` — 验证流水线测试通过

### 阶段 1：重构共享（P0）

- [ ] [P0][S] 更新 `packages/shared/types/src/events.ts` — 移除 NATS subject 常量，添加流水线事件类型别名
- [ ] [P0][S] 更新 `packages/shared/types/src/pipeline.ts` — 用 PipelineStage 枚举、PipelineRun、StageResult 替换旧流水线类型
- [ ] [P0][S] 更新 `packages/shared/types/src/agent.ts` — 将 AgentType 枚举更新为 7 个 v2 流水线智能体
- [ ] [P0][S] 更新 `packages/shared/types/src/index.ts` — 更新 v2 类型的桶导出
- [ ] [P0][S] 移除 `packages/shared/types/src/workflow.ts` — v2 中不需要旧工作流类型
- [ ] [P0][M] 重写 `packages/shared/events/src/schemas/project-events.ts` → `pipeline-events.ts` — StageStartedEvent + StageCompletedEvent
- [ ] [P0][M] 重写 `packages/shared/events/src/schemas/architecture-events.ts` → `pipeline-lifecycle.ts` — PipelineStartedEvent + PipelineFailedEvent + PipelineCompletedEvent
- [ ] [P0][S] 重写 `packages/shared/events/src/schemas/code-events.ts` → `approval-events.ts` — UserApprovalRequested + UserApprovalReceived
- [ ] [P0][S] 保留 `packages/shared/events/src/schemas/security-events.ts` — SecretDetected 和 PolicyViolation 仍被 security-auditor 使用
- [ ] [P0][S] 移除 `packages/shared/events/src/schemas/review-events.ts` — 审查事件现在属于流水线生命周期的一部分
- [ ] [P0][S] 移除 `packages/shared/events/src/schemas/testing-events.ts` — 测试事件现在属于流水线生命周期的一部分
- [ ] [P0][S] 移除 `packages/shared/events/src/schemas/deployment-events.ts` — 部署事件现在属于流水线生命周期的一部分
- [ ] [P0][S] 移除 `packages/shared/events/src/subject-registry.ts` — v2 中没有 NATS subjects
- [ ] [P0][S] 更新 `packages/shared/events/src/index.ts` — 新事件模式的桶导出
- [ ] [P0][S] 更新 `packages/shared/config/src/loader.ts` — 为 openclaw.config.yml 添加 YAML 加载
- [ ] [P0][S] 更新 `packages/shared/config/src/schema.ts` — 简化为单文件配置，移除多源合并
- [ ] [P0][XS] 更新 `packages/shared/config/src/defaults.ts` — 添加 v2 流水线默认值
- [ ] [P0][XS] 更新 `pnpm-workspace.yaml` — 移除 `packages/bc/*`、`packages/core/*`、`apps/*`；添加 `packages/pipeline/*`
- [ ] [P0][XS] 更新 `pnpm-workspace.yaml` catalog — 移除 NestJS、tRPC、Drizzle、NATS、Passport 依赖
- [ ] [P0][XS] 更新 `vitest.workspace.ts` — 移除 BC/core/app 工作空间引用，保留 shared/acl/pipeline
- [ ] [P0][XS] 更新根目录 `package.json` — 移除 `"dev"` 脚本，移除 v1 devDependencies
- [ ] [P0][XS] 运行 `pnpm typecheck` — 必须通过，无 BC/core/app 导入
- [ ] [P0][XS] 运行 `pnpm lint` — 必须通过
- [ ] [P0][XS] 运行 `pnpm test` — 现有共享测试必须仍然通过

### 阶段 2：删除旧代码（P0）

- [ ] [P0][M] 删除 `packages/bc/pm/` — 30 个文件（项目管理 BC）
- [ ] [P0][M] 删除 `packages/bc/ad/` — 28 个文件（架构设计 BC）
- [ ] [P0][M] 删除 `packages/bc/cg/` — 26 个文件（代码生成 BC）
- [ ] [P0][M] 删除 `packages/bc/cr/` — 26 个文件（代码审查 BC）
- [ ] [P0][M] 删除 `packages/bc/ta/` — 26 个文件（测试自动化 BC）
- [ ] [P0][M] 删除 `packages/bc/dp/` — 26 个文件（部署 BC）
- [ ] [P0][M] 删除 `packages/core/orchestrator/` — 18 个文件（编排器服务）
- [ ] [P0][M] 删除 `packages/core/supervisor/` — 22 个文件（监督器服务）
- [ ] [P0][M] 删除 `apps/api-gateway/` — 24 个文件（NestJS API 网关）
- [ ] [P0][XS] 运行 `rm -rf packages/bc packages/core apps`（如果删除后父目录为空）
- [ ] [P0][XS] 运行 `pnpm install` — 在删除包后重新生成 pnpm-lock.yaml
- [ ] [P0][XS] 运行 `pnpm typecheck` — 必须通过，无损坏的导入
- [ ] [P0][XS] 运行 `pnpm build` — 必须通过，仅共享 + 流水线 + ACL 包

### 阶段 3：精炼 ACL（P1）

- [ ] [P1][S] 更新 `packages/acl/opencode-acl/src/index.ts` — 移除 NestJS 装饰器，保留纯 TypeScript 接口
- [ ] [P1][S] 更新 `packages/acl/openclaw-acl/src/index.ts` — 移除 NestJS 装饰器，保留纯 TypeScript 接口
- [ ] [P1][S] 更新 `packages/acl/git-acl/src/index.ts` — 移除 NestJS 装饰器，保留纯 TypeScript 接口
- [ ] [P1][S] 更新 `packages/acl/cicd-acl/src/index.ts` — 移除 NestJS 装饰器，保留纯 TypeScript 接口
- [ ] [P1][S] 更新每个 ACL 的 `package.json` — 移除 `@nestjs/common` 依赖
- [ ] [P1][XS] 运行 `grep -r "@Injectable" packages/acl/` — 必须无匹配
- [ ] [P1][XS] 运行 `grep -r "@nestjs" packages/acl/` — 源文件中必须无匹配
- [ ] [P1][XS] 运行 `pnpm typecheck` — ACL 包必须在无 NestJS 的情况下编译通过

### 阶段 4：改造智能体（P1）

- [ ] [P1][M] 创建 `agents/spec-parser/` — 从 pm-steward 改造的 SOUL.md、AGENTS.md、TOOLS.md
- [ ] [P1][M] 创建 `agents/architect/` — 从 ad-steward 改造的 SOUL.md、AGENTS.md、TOOLS.md
- [ ] [P1][M] 创建 `agents/tdd-coder/` — 从 cg-steward 改造的 SOUL.md、AGENTS.md、TOOLS.md
- [ ] [P1][M] 创建 `agents/reviewer/` — 从 cr-steward 改造的 SOUL.md、AGENTS.md、TOOLS.md
- [ ] [P1][M] 创建 `agents/tester/` — 从 ta-steward 改造的 SOUL.md、AGENTS.md、TOOLS.md
- [ ] [P1][M] 创建 `agents/deployer/` — 从 dp-steward 改造的 SOUL.md、AGENTS.md、TOOLS.md
- [ ] [P1][M] 改造 `agents/code-reviewer/` → `agents/reviewer/sub-agents/static-analyzer/`
- [ ] [P1][M] 改造 `agents/security-auditor/` → `agents/reviewer/sub-agents/security-auditor/`
- [ ] [P1][M] 改造 `agents/contract-validator/` → `agents/reviewer/sub-agents/contract-validator/`
- [ ] [P1][M] 创建 `agents/reviewer/sub-agents/architecture-checker/` — 新智能体（无 v1 前身）
- [ ] [P1][M] 创建 `agents/reviewer/sub-agents/style-checker/` — 新智能体（无 v1 前身）
- [ ] [P1][M] 创建 `agents/reviewer/sub-agents/dependency-checker/` — 新智能体（无 v1 前身）
- [ ] [P1][S] 删除 `agents/orchestrator/`、`agents/supervisor/`、`agents/deploy-agent/`、`agents/tdd-test-agent/`
- [ ] [P1][XS] 运行 `find agents/ -type f -name "*.md" | wc -l` — 必须返回 33（11 个智能体 × 3 个文件）
- [ ] [P1][XS] 运行 `find agents/ -type d | sort` — 验证目录结构与 DESIGN_v2.md 第 6.6 节一致

### 阶段 5：基础设施清理（P2）

- [ ] [P2][S] 更新 `infrastructure/packages/database/index.ts` — 移除 PostgreSQL 资源定义
- [ ] [P2][S] 更新 `infrastructure/packages/messaging/index.ts` — 移除 NATS 资源定义
- [ ] [P2][M] 添加 `infrastructure/packages/openclaw/index.ts` — OpenClaw 网关部署资源
- [ ] [P2][M] 添加 `infrastructure/packages/opencode/index.ts` — OpenCode 作业 Pod 模板资源
- [ ] [P2][S] 更新 `infrastructure/packages/kubernetes/index.ts` — 移除 BC Pod 引用，添加 OpenClaw 引用
- [ ] [P2][S] 更新 `docker-compose.yml` — 移除 PostgreSQL 和 NATS 服务
- [ ] [P2][S] 更新 `docker-compose.yml` — 添加 OpenClaw 网关服务
- [ ] [P2][XS] 运行 `docker compose config` — 验证 docker-compose.yml 有效
- [ ] [P2][XS] 在 infrastructure 中运行 `pnpm typecheck` — 验证 Pulumi 代码编译通过

---

## 9. 风险登记册

| 风险 | 概率 | 影响 | 缓解措施 |
|------|-----------|--------|------------|
| **共享领域的变更破坏生成的代码** | 低 | 高 | 在 v2 中完全保持 `packages/shared/domain/` 不变。DDD 基类对 v1 基础设施零依赖。扩展它们的生成代码不会受其他包删除的影响。**如确需变更，推迟到迁移后处理。** |
| **ACL 接口在重写前就被需要** | 低 | 中 | ACL 目前仅为接口（0% 实现）。它们是契约，而非运行中的代码。v2 流水线在迁移时不需要它们 — OpenClaw 原生分发智能体。ACL 可以先作为文档精炼，之后再实现。 |
| **智能体身份文件重写耗时超出预期** | 中 | 中 | 11 个智能体 × 每个 3 个文件 = 33 个身份文档。SOUL.md 和 TOOLS.md 文件遵循模板模式。使用现有的 v1 文件作为模板，将 BC 专用的上下文替换为流水线阶段上下文。结构变更（重命名 + 重组）很快；内容重写是瓶颈。预留 2 小时额外时间用于内容质量把控。 |
| **删除 226 个文件后 TypeScript 构建失败** | 低 | 低 | 阶段 2 删除按每个 BC 一个提交进行。每个提交删除一个自包含的包及其自身的导入。其他包不导入 BC 内部 — 只导入被保留的 `@ulw/shared-*` 类型。API 网关是 BC 模块的唯一消费者，而它正在被删除。**风险降低，因为 BC 与剩余代码之间不存在跨包导入。** |
| **pnpm-workspace.yaml catalog 移除破坏传递依赖** | 中 | 低 | 从 catalog 中移除 NestJS/tRPC/Drizzle/NATS 后，运行 `pnpm install` 重新生成锁文件。如果有任何剩余包（共享配置、ACL）对已移除的包存在残留依赖，pnpm 将标记出来。通过从特定 package.json 中移除该依赖来修复。 |
| **openclaw.config.yml 模式与运行时不匹配** | 中 | 中 | 配置文件基于为 v2 架构编写的 DESIGN_v2.md 第 9.2 节。如果 OpenClaw 运行时期望不同的模式，配置文件将需要调整。单文件配置方式的模式表面积比 15+ 个 v1 配置文件更小 — 更容易验证和修复。 |
| **迁移可以在任何提交处回退** | 不适用 | 不适用 | 序列中的每个提交都使工作空间保持可构建。如果阶段 2 删除导致意外问题，回退到阶段 1 提交。每个限界上下文的删除是单独的提交 — 只回滚有问题的那个。**建议：在合并到 main 之前，将每个阶段的提交推送到一个分支。** |
| **智能体重组破坏 OpenClaw 智能体发现** | 低 | 中 | OpenClaw 通过目录约定（`agents/<名称>/SOUL.md`）发现智能体。只要 SOUL.md 文件存在于预期路径，发现就能正常工作。v2 智能体名称（spec-parser、architect、tdd-coder 等）必须与 `openclaw.config.yml` 中的 `identityPath` 值匹配。在合并阶段 4 之前验证映射关系。 |
| **Docker Compose 不再启动 API 网关** | 低 | 低 | `pnpm dev` 脚本指向 `@ulw/api-gateway`。删除后，本地开发工作流发生变化。在 v2 中，`docker compose up` 启动 OpenClaw 网关、Redis、MinIO 和 Keycloak。流水线 UI/API 位于 `localhost:8080`（OpenClaw），而非 `localhost:3000`（NestJS）。用新的本地开发命令更新 README.md。 |
| **Vitest 工作空间引用过时的包** | 中 | 低 | `vitest.workspace.ts` 当前列出所有 16 个包。删除 BC + core + app 后，还剩 10 个包。如果在更新工作空间配置前运行 vitest，它将因找不到工作空间而失败。这可以通过在阶段 1 中阶段 2 删除之前更新 `vitest.workspace.ts` 来捕获。修复方法是更新 `vitest.workspace.ts`。 |
| **剩余测试中存在残留的 NestJS 模式** | 低 | 低 | 某些共享包测试或 acl 测试配置可能引用 `@nestjs/testing` 或使用 NestJS 测试工具。这些将在依赖移除后中断。在最终确定阶段 1 之前，在所有剩余包中 grep 搜索 `@nestjs`。 |

---

## 附录 A：pnpm-workspace.yaml — 详细 Catalog 变更

### Before（v1）

```yaml
packages:
  - "packages/shared/*"
  - "packages/bc/*"          # ← 删除
  - "packages/core/*"        # ← 删除
  - "packages/acl/*"
  - "apps/*"                 # ← 删除

catalog:
  # Runtime
  typescript: ^5.7.0
  "@types/node": ^22.0.0
  zod: ^3.23.0

  # NestJS                     ← 删除全部 5 行
  "@nestjs/common": ^10.4.0
  "@nestjs/core": ^10.4.0
  "@nestjs/platform-express": ^10.4.0
  "@nestjs/testing": ^10.4.0
  "@nestjs/trpc": ^0.4.0

  # tRPC                       ← 删除全部 3 行
  "@trpc/server": ^11.0.0
  "@trpc/client": ^11.0.0

  # Database                   ← 删除全部 3 行
  drizzle-orm: ^0.40.0
  drizzle-kit: ^0.28.0
  postgres: ^3.4.0

  # Messaging & Caching
  nats: ^2.28.0               ← 删除（保留 ioredis）
  ioredis: ^5.4.0

  # Auth                       ← 删除全部 3 行
  passport: ^0.7.0
  passport-jwt: ^4.0.1
  "@nestjs/jwt": ^10.2.0

  # Object Storage             ← 保留
  "@aws-sdk/client-s3": ^3.600.0

  # Observability              ← 全部保留
  "@opentelemetry/api": ^1.9.0
  "@opentelemetry/sdk-node": ^0.53.0

  # Kubernetes                 ← 保留
  "@kubernetes/client-node": ^1.0.0

  # Testing                    ← 全部保留
  vitest: ^3.0.0
  "@vitest/coverage-v8": ^3.0.0
  "@playwright/test": ^1.50.0
  "@pact-foundation/pact": ^13.0.0

  # Linting                    ← 全部保留
  eslint: ^9.0.0
  prettier: ^3.4.0
  oxlint: ^0.15.0
  typescript-eslint: ^8.0.0
  eslint-plugin-import: ^2.31.0
  eslint-plugin-unicorn: ^56.0.0

  # Build                      ← 全部保留
  tsup: ^8.3.0
  tsx: ^4.19.0
```

### After（v2）

```yaml
packages:
  - "packages/shared/*"
  - "packages/acl/*"
  - "packages/pipeline/*"    # ← 新增

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

**移除的 catalog 条目**：NestJS（5）、tRPC（3）、Drizzle/PostgreSQL（3）、NATS（1）、Passport/JWT（3）= 共移除 15 个依赖。Catalog 总行数从 66 行减少到 44 行。

---

## 附录 B：docker-compose.yml — 迁移详情

### Before（v1 — 6 个服务）

```yaml
services:
  postgres:           # ← 删除
    image: postgres:16-alpine
    ...
  redis:              # ← 保留
    image: redis:7-alpine
    ...
  nats:               # ← 删除
    image: nats:2.10-alpine
    ...
  minio:              # ← 保留
    image: minio/minio:latest
    ...
  keycloak:           # ← 保留
    image: quay.io/keycloak/keycloak:latest
    ...
  api-gateway:        # ← 删除
    image: api-gateway:latest
    ...
```

### After（v2 — 4 个服务）

```yaml
services:
  openclaw:           # ← 新增
    image: openclaw-gateway:latest
    ports:
      - "8080:8080"
    volumes:
      - ./openclaw.config.yml:/etc/openclaw/config.yml
    depends_on:
      - redis
      - minio
      - keycloak

  redis:              # ← 不变
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:              # ← 不变
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

  keycloak:           # ← 不变
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

**移除的服务**：PostgreSQL（端口 5432）、NATS（端口 4222）、API 网关（端口 3000）。
**新增的服务**：OpenClaw 网关（端口 8080）。

---

## 附录 C：迁移后验证清单

完成全部 5 个阶段后，执行以下端到端验证：

### C.1 单体仓库健康

```bash
# 验证目录结构
ls packages/shared/domain/     # 必须存在（DDD 基类）
ls packages/shared/types/      # 必须存在（共享类型）
ls packages/shared/events/     # 必须存在（Zod 事件模式）
ls packages/shared/config/     # 必须存在（配置加载器）
ls packages/acl/               # 必须存在（4 个 ACL 接口包）
ls packages/pipeline/          # 必须存在（新流水线状态类型）
ls agents/spec-parser/         # 必须存在（7 个流水线智能体）
ls agents/architect/           # 必须存在
ls agents/tdd-coder/           # 必须存在
ls agents/reviewer/            # 必须存在
ls agents/tester/              # 必须存在
ls agents/deployer/            # 必须存在
ls agents/reviewer/sub-agents/ # 必须存在（6 个子智能体）
ls skills/                     # 必须有 8 个 SKILL.md 文件
ls infrastructure/             # 必须有简化的 Pulumi 栈
ls openclaw.config.yml         # 必须存在
ls .ulw/                       # 必须存在（治理策略）

# 验证已删除的目录不复存在
ls packages/bc/   2>/dev/null && echo "FAIL: bc/ 存在" || echo "PASS: bc/ 已移除"
ls packages/core/ 2>/dev/null && echo "FAIL: core/ 存在" || echo "PASS: core/ 已移除"
ls apps/          2>/dev/null && echo "FAIL: apps/ 存在" || echo "PASS: apps/ 已移除"

# 验证剩余代码中无损坏的导入
! grep -r "from '@ulw/bc-" packages/ --include="*.ts" || echo "FAIL: 发现 BC 导入"
! grep -r "from '@ulw/orchestrator'" packages/ --include="*.ts" || echo "FAIL: 发现 orchestrator 导入"
! grep -r "from '@ulw/supervisor'" packages/ --include="*.ts" || echo "FAIL: 发现 supervisor 导入"
! grep -r "@nestjs" packages/acl/ --include="*.ts" || echo "FAIL: ACL 中存在 NestJS"
```

### C.2 构建验证

```bash
pnpm install        # 重新生成锁文件
pnpm typecheck      # TypeScript 必须通过
pnpm lint           # ESLint + Oxlint 必须通过
pnpm build          # 所有剩余包必须编译通过
pnpm test           # 所有剩余测试必须通过
pnpm format:check   # 代码格式必须一致
```

### C.3 V2 专用验证

```bash
# 流水线包可导入
node -e "require('@ulw/pipeline')" 2>/dev/null || echo "无法解析 @ulw/pipeline（如未构建，属预期行为）"

# 智能体结构与 openclaw.config.yml 匹配
grep "identityPath" openclaw.config.yml | while read line; do
  dir=$(echo "$line" | grep -o '"agents/[^"]*"' | tr -d '"')
  [ -d "$dir" ] && echo "PASS: $dir" || echo "FAIL: $dir 缺失"
done

# 技能路径有效
grep "path:" openclaw.config.yml | grep skills/ | while read line; do
  path=$(echo "$line" | grep -o '"skills/[^"]*"' | tr -d '"')
  [ -f "${path}/SKILL.md" ] && echo "PASS: ${path}/SKILL.md" || echo "FAIL: ${path}/SKILL.md 缺失"
done

# 配置中定义了全部 6 个流水线阶段
grep -A1 "name:" openclaw.config.yml | grep -E "spec-parsing|architecture-design|tdd-code-generation|code-review|automated-testing|one-click-deployment" | wc -l
# 预期输出：6
```

### C.4 文件数验证

```bash
# 迁移后的源文件总数（约）
find packages/ -name "*.ts" -not -path "*/dist/*" -not -path "*/node_modules/*" | wc -l
# 预期：约 40-50（从 v1 的 293 下降）

# 智能体身份文件
find agents/ -name "*.md" | wc -l
# 预期：33（11 个智能体 × 每个 3 个文件）

# 技能文件
find skills/ -name "SKILL.md" | wc -l
# 预期：8

# 基础设施文件
find infrastructure/ -name "*.ts" -not -path "*/node_modules/*" | wc -l
# 预期：约 10（从 15 下降，PG + NATS 已移除）
```

---

> **文档状态**：规划 v2.0 — 2026-04-30
> **后续步骤**：利益相关者评审 → 阶段 0 执行（流水线包创建）→ 阶段 1（共享重构）→ 阶段 2（删除）→ 阶段 3（ACL）→ 阶段 4（智能体）→ 阶段 5（基础设施）
> **基于**：DESIGN_v2.md（2035 行），当前 v1 单体仓库状态（已通过 `find packages/ apps/ -type f` 验证）
