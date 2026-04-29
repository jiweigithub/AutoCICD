# ulw (UltraWork) — SDD+TDD 流水线平台设计文档 v2

> 本文档为 [English Version](DESIGN_v2.md) 的中文译本。如有歧义，以英文版本为准。
> **版本**: v2.0
> **日期**: 2026-04-30
> **状态**: 草案
> **目标团队规模**: 50+ 开发者
> **目标部署环境**: Kubernetes 集群
> **核心语言**: TypeScript 5.7+
> **架构**: 以 OpenClaw 为中心的 SDD+TDD 流水线（取代 v1 DDD 微服务）

---

## 目录

1. [项目概览与愿景](#1-项目概览与愿景)
2. [架构概览](#2-架构概览)
3. [流水线阶段](#3-流水线阶段)
4. [组件角色](#4-组件角色)
5. [技术栈](#5-技术栈)
6. [智能体架构](#6-智能体架构)
7. [数据流](#7-数据流)
8. [基础设施与部署](#8-基础设施与部署)
9. [OpenClaw 配置](#9-openclaw-配置)
10. [与 v1 架构的对比](#10-与-v1-架构的对比)
11. [共享包（从 v1 保留）](#11-共享包从-v1-保留)
12. [安全与治理](#12-安全与治理)

---

## 1. 项目概览与愿景

### 1.1 愿景声明

**ulw (UltraWork)** 是一个 **SDD+TDD 流水线平台**。用户编写一份 Markdown 规格文档，提交到 Git 仓库，ulw 自动生成生产就绪、经过测试和部署的代码，无需手动编码。

该平台将软件交付生命周期从人工驱动的流程转变为智能体执行的流水线。人类的唯一职责是编写清晰、结构化的 Markdown 规格文档。所有下游工作——架构设计、TDD 代码生成、多智能体代码审查、自动化测试、一键部署——均由智能体系统完成。

### 1.2 v1 的变更

v1 架构（见 `docs/DESIGN.md`）将 ulw 建模为一个 DDD 微服务平台：6 个通过 NATS JetStream 通信的限界上下文（Bounded Context），由 NestJS 编排器编排，使用 Drizzle ORM 访问 PostgreSQL 数据库。该架构是为人类开发者构建传统微服务而设计的。

v2 更简洁。ulw 不再是一个微服务平台。它是一个**流水线平台**，OpenClaw 作为中央网关和编排引擎，OpenCode 作为 TDD 编码运行时。不再有限界上下文、NATS 消息总线、PostgreSQL 持久化和 NestJS API 网关。流水线状态基于会话，事件经过 Zod 校验，所有产物存储在 MinIO 中。

**保留的部分**：共享领域基类（`Entity`、`ValueObject`、`AggregateRoot`、`Result<T,E>`）保留在 `packages/shared/domain/` 中，供 OpenCode 生成的代码使用。测试基础设施（Vitest、Playwright、Pact）和部署工具（Pulumi、ArgoCD、Helm）保持不变。智能体身份模型（SOUL.md、AGENTS.md、TOOLS.md）保留并扩展。

### 1.3 核心流水线

```
Markdown 规格 → 架构设计 → TDD 代码生成 → 代码审查 → 自动化测试 → 一键部署
```

每个阶段都由 OpenClaw 分派的专用智能体执行。用户编写规格文档，OpenClaw 接收、解析并驱动整个流水线至完成。

### 1.4 核心价值主张

| 痛点 | ulw v2 解决方案 | 预期效果 |
|------------|----------------|-----------------|
| 根据规格手动编码 | OpenCode 通过 TDD（RED→GREEN→REFACTOR）从架构计划生成生产级 TypeScript 代码 | 合规功能无需手动编码 |
| 架构偏离 | 架构智能体在任何代码编写前生成契约优先的设计（DDD 聚合、API 契约、数据模型） | 架构在规格阶段即被强制执行 |
| 缓慢且不一致的代码审查 | 6 智能体审查流水线在 2-5 分钟内对每个生成的 PR 执行审查 | 审查延迟降低 90% |
| 繁重的测试负担 | AI 生成的测试套件（单元 + 集成 + 契约 + E2E）在代码生成后自动运行 | QA 工作量减少 80% |
| 复杂的部署仪式 | 5 门控 CI/CD 流水线，支持金丝雀部署和自动回滚，由 OpenClaw 触发 | 零接触生产部署 |
| 从规格到生产的摩擦 | OpenClaw 弥合鸿沟：webhook 触发流水线，智能体执行阶段，人类仅在门控处审批 | 周期缩短 70% |

### 1.5 目标用户

ulw v2 的主要用户是编写规格说明的开发者，而非编写代码的开发者。

| 角色 | 职责 | 主要交互 |
|---------|------|-------------------|
| **规格作者** | 功能定义者 | 编写包含验收标准、数据模型和 API 契约的 Markdown 规格文档；提交到 Git |
| **技术主管** | 架构审查者、门控审批者 | 审查 AI 生成的架构计划；批准部署门控 |
| **QA 工程师** | 测试策略负责人 | 审查 AI 生成的测试场景；定义契约测试策略 |
| **DevOps 工程师** | 流水线运维者 | 管理 Kubernetes 基础设施；监控智能体健康；处理事件响应 |

### 1.6 北极星指标

**端到端交付周期时间**：从规格提交到生产部署，目标是相较手动开发基线降低 70%。

### 1.7 设计原则

1. **规约驱动**：Markdown 规格是唯一真实来源。没有规格就不写代码。没有规格会悬而未决。
2. **智能体优先**：每个流水线阶段都可被智能体执行。人类是审查者和审批者，而非执行者。
3. **契约驱动**：所有组件间通信由机器可读的契约（OpenAPI、Protobuf、Zod 事件模式）管理。
4. **始终测试优先**：所有生成的代码遵循 TDD：RED（失败的测试）→ GREEN（最小通过代码）→ REFACTOR（整洁代码）。由 OpenCode 的 TDD 运行时在工具层面强制执行。
5. **基于会话的状态**：流水线状态在 OpenClaw 会话中追踪，而非关系数据库中。产物以 JSON 形式持久化到 MinIO。
6. **默认可观测**：每个智能体动作产生不可变的审计事件；每个流水线阶段发出指标。

### 1.8 平台定位

ulw v2 不是一个微服务平台。不是一个 API 网关。不是一个消息驱动的分布式系统。

ulw 是一个**流水线平台**。OpenClaw 是引擎。OpenCode 是编码助手。流水线阶段是工作流。用户提供规格，获得已部署的代码。

---

## 2. 架构概览

### 2.1 核心架构模式

v2 架构用**流水线中心模型**替代了分层微服务模型。OpenClaw 位于中心，接收 webhook 触发，通过阶段分派智能体，并在其会话系统中追踪流水线状态。

不再有 NestJS API 网关。不再有 NATS 消息总线。不再有 PostgreSQL 数据库用于流水线状态。一切通过 OpenClaw 流转。

```
                           ┌─────────────────────────────┐
                           │         GitHub 仓库           │
                           │   用户提交 spec.md             │
                           └──────────────┬──────────────┘
                                          │ webhook（PR/推送）
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OpenClaw 网关                                         │
│                                                                                    │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Webhook        │  │ 流水线           │  │ 智能体           │  │ 会话         │ │
│  │ 接收器         │→ │ 引擎            │→ │ 分派器           │→ │ 管理器       │ │
│  │ (GitHub,       │  │ (阶段调度、      │  │ (ACP 子会话      │  │ (状态         │ │
│  │  GitLab,       │  │  门控审批、      │  │  创建、          │  │  追踪、       │ │
│  │  手动 CLI)     │  │  重试逻辑)      │  │  技能映射)      │  │  产物         │ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘  │  存储)       │ │
│                                                                  └──────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌────────────┐  ┌────────────┐  ┌────────────┐
          │ 存储       │  │ 缓存       │  │ 认证       │
          │ (MinIO)    │  │ (Redis)    │  │ (Keycloak) │
          └────────────┘  └────────────┘  └────────────┘
                    │
                    │ ACP 子会话（每阶段）
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OpenCode 运行时                                        │
│                                                                                    │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ TDD 运行时     │  │ LSP 集成        │  │ Git 工作树       │  │ 测试运行器   │ │
│  │ (RED→GREEN→    │  │ (40+ 种语言      │  │ 隔离             │  │ (Vitest,     │ │
│  │  REFACTOR      │  │  服务器)        │  │ (并行智能体      │  │  Playwright, │ │
│  │  强制执行)     │  │                 │  │  安全)           │  │  Pact)       │ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 架构层级

v2 有三个层级，相比 v1 的五个层：

| 层 | v1 组件 | v2 组件 | 变更 |
|-------|-------------|-------------|--------|
| 外部接口 | Kong Ingress + NestJS API 网关 + REST + tRPC | OpenClaw 网关（webhook、CLI、API） | 合并到一个引擎 |
| 编排 | NestJS 编排器 + 监督器 + 工作流引擎 | OpenClaw 流水线引擎 + 会话管理器 | 消除了独立的编排服务 |
| 领域 | 6 个限界上下文（PM、AD、CG、CR、TA、DP） | 6 个流水线阶段（规格→架构→代码→审查→测试→部署） | 上下文变为阶段；无领域服务 |
| 智能体运行时 | 面向 OpenCode/OpenClaw 的 ACL 适配器 | OpenCode ACP 子会话 + OpenClaw 原生智能体分派 | 直接集成，无中间 ACL |
| 基础设施 | PostgreSQL、NATS、NestJS Pod、API 网关 Pod | OpenClaw Pod、OpenCode 任务 Pod、MinIO、Redis、Keycloak | 移除 5 个基础设施服务 |

### 2.3 组件交互模型

OpenClaw 接收一个触发器（webhook、CLI 或定时任务）。它创建一个流水线会话，然后按顺序通过 6 个阶段分派智能体。每个阶段智能体在需要代码生成或测试时通过 ACP（智能体通信协议）子会话与 OpenCode 通信。阶段结果以 JSON 产物形式存储在 MinIO 中。流水线会话追踪状态并决定是前进、重试还是失败。

```
触发器 → OpenClaw 创建会话 → 分派阶段-1 智能体 → 存储结果 → 分派阶段-2 → ... → 阶段-6 → 部署完成
```

阶段之间没有异步消息传递（没有 NATS）。阶段在单次流水线运行中是顺序执行的。并行性发生在阶段内部——例如，代码审查阶段并发分派 6 个子智能体。

### 2.4 v2 关键简化

1. **无 API 网关**：OpenClaw 直接处理 webhook、CLI 和 API。没有独立的 NestJS 应用和 tRPC 端点。
2. **无消息总线**：流水线状态基于会话。事件在 OpenClaw 会话内发出并以产物形式持久化。无需管理 NATS JetStream 流和消费者。
3. **无关系数据库**：流水线状态是临时会话 + MinIO JSON 产物。没有 PostgreSQL、Drizzle ORM 或针对流水线本身的模式迁移。生成的应用程序代码仍可使用数据库，但平台本身不需要。
4. **无微服务编排**：OpenClaw 直接分派智能体。没有通过事件通信的独立编排器/监督器服务。
5. **无限界上下文**：6 个限界上下文（PM、AD、CG、CR、TA、DP）变为 6 个流水线阶段。智能体专业化替代了领域建模。

---

## 3. 流水线阶段

该流水线有 6 个阶段。每个阶段有明确的目的、输入、处理模型、输出、负责智能体和一组工具。

### 3.1 阶段概览

| # | 阶段 | 智能体 | 输入 | 输出 | 耗时 |
|---|-------|-------|-------|--------|----------|
| 1 | 规格解析 | spec-parser | Markdown 规格文件 | 结构化规格（Zod 校验的 JSON） | < 10s |
| 2 | 架构设计 | architect | 结构化规格 | 架构计划（DDD 聚合、API 契约、数据模型、文件树） | 30–120s |
| 3 | TDD 代码生成 | tdd-coder | 架构计划 | Git 工作树中生成的 TypeScript 代码（每模块 RED→GREEN→REFACTOR） | 60–300s |
| 4 | 代码审查 | reviewer（编排 6 个子智能体） | 生成的代码 | 审查报告（按严重程度分类的发现项，通过/失败） | 120–300s |
| 5 | 自动化测试 | tester | 代码 + 审查报告 | 测试结果（单元、集成、契约、E2E） | 60–600s |
| 6 | 一键部署 | deployer | 前面阶段全部绿色 | 在目标环境部署的应用 | 60–300s |

### 3.2 阶段 1：规格解析

**目的**：将人类编写的 Markdown 规格转换为结构化、机器可读的格式，供下游智能体消费。

**输入**：
- 提交到目标 Git 仓库的 Markdown 规格文件（`spec.md`）
- 规格遵循定义的模板，包含以下章节：概览、用户故事、验收标准、数据模型、API 契约、约束条件

**处理过程**：
1. OpenClaw webhook 接收推送事件并定位变更文件中的 `spec.md`
2. spec-parser 智能体读取 Markdown 内容
3. 智能体使用模式匹配和 LLM 解析从每个章节提取结构化信息：
   - 用户故事 → 结构化的故事对象，包含角色、动作和验收标准
   - 数据模型 → 实体定义，包含字段、类型、约束和关系
   - API 契约 → 端点定义，包含 HTTP 方法、路径、请求/响应模式
   - 约束条件 → 非功能性需求（性能、安全、合规）
4. 提取的规格根据 Zod 模式（`StructuredSpec`）进行校验
5. 校验失败会报告给用户，并附上原始 Markdown 中的行号引用

**输出**：
- 存储在 MinIO 中 `pipeline/{pipelineId}/stage-1/` 目录下的 `structured-spec.json` 产物
- 包含以下内容的结构化规格对象：
  - `specId`：该规格的唯一标识符
  - `userStories[]`：解析后的用户故事及其验收标准
  - `dataModels[]`：实体和值对象定义
  - `apiContracts[]`：端点规格说明及请求/响应模式
  - `constraints[]`：非功能性需求
  - `sourceMetadata`：提交 SHA、文件路径、作者

**负责智能体**：`spec-parser`
**使用的工具**：Read（文件读取）、Markdown 解析、Zod 模式校验

### 3.3 阶段 2：架构设计

**目的**：将结构化规格转换为详细的架构计划，定义实现规格所需的 DDD 战术模式、API 契约、数据模型和模块结构。

**输入**：
- 来自阶段 1 的 `structured-spec.json`
- 现有代码库结构（如果是在扩展现有项目）
- 来自 `@ulw/shared-domain` 的共享领域基类（Entity、ValueObject、AggregateRoot、Result<T,E>）

**处理过程**：
1. architect 智能体加载结构化规格并分析需求
2. 它执行 DDD 战术设计：
   - **聚合识别**：根据事务边界和不变量将实体和值对象分组为聚合
   - **限界上下文映射**：如果需要多个上下文，定义上下文边界和集成模式
   - **领域事件设计**：识别用于聚合间通信的领域事件
3. 它设计 API 契约：
   - 为每个用户故事定义 REST 端点或 tRPC 过程
   - 使用 TypeScript 类型或 Zod 模式指定请求/响应模式
   - 记录错误响应和状态码
4. 它设计数据持久化模型：
   - 将聚合映射到数据库表或文档集合
   - 定义索引、约束和迁移策略
5. 它生成一个**文件树计划**：所有待生成文件的完整列表，按以下目录组织：
   - `src/domain/` — 聚合、实体、值对象、领域事件
   - `src/application/` — 用例、应用服务、DTO
   - `src/infrastructure/` — 仓库、外部服务适配器
   - `src/presentation/` — API 控制器或 tRPC 路由器
   - `test/unit/` — 单元测试（每个聚合/实体一个）
   - `test/integration/` — 集成测试（每个用例一个）
   - `test/contract/` — Pact 契约测试

**输出**：
- 存储在 MinIO 中 `pipeline/{pipelineId}/stage-2/` 目录下的 `architecture-plan.json` 产物
- 架构计划包含：
  - `aggregates[]`：聚合定义，包含根实体、子实体、值对象、不变量
  - `apiContracts[]`：带有 Zod 模式的详细 API 端点规格说明
  - `dataModels[]`：带有表/集合定义的持久化模型
  - `fileTree[]`：待生成文件的有序列表，包含模块路径和描述
  - `dependencyGraph`：模块间的导入/导出关系
  - `tddPlan`：每个文件的 TDD 计划，包含测试优先排序提示

**负责智能体**：`architect`
**使用的工具**：Read（现有代码库）、Write（计划产物）、LSP（代码库分析）、DDD 战术模式知识

### 3.4 阶段 3：TDD 代码生成

**目的**：生成生产就绪的 TypeScript 代码，遵循严格的 TDD 规程：RED（编写失败的测试）→ GREEN（编写最小通过代码）→ REFACTOR（清理代码），使用 OpenCode 作为编码运行时。

**输入**：
- 来自阶段 2 的 `architecture-plan.json`
- 来自 `@ulw/shared-domain` 的共享领域基类
- 项目配置（tsconfig、ESLint、Vitest 配置）

**处理过程**：
OpenClaw 分派 `tdd-coder` 智能体，该智能体创建到 OpenCode 的 ACP 子会话。OpenCode 强制执行每个文件的 TDD 循环：

1. **逐文件迭代**：智能体按架构计划中 `tddPlan` 指定的顺序处理文件。领域实体优先，然后是应用服务、基础设施、表示层。
2. **RED 阶段**（每个文件）：
   - OpenCode 首先编写测试文件（例如 `test/unit/user.test.ts`）
   - 执行测试。它必须失败。如果通过，测试无效，智能体重写它。
   - 捕获失败的测试输出作为证据
3. **GREEN 阶段**（每个文件）：
   - OpenCode 编写最小的生产代码以使测试通过
   - 执行测试套件。所有测试必须通过（新测试 + 现有测试）。
   - 如果测试失败，OpenCode 迭代实现
4. **REFACTOR 阶段**（每个文件）：
   - OpenCode 重构代码以消除重复、改进命名和应用模式
   - 重构后测试必须继续通过
   - Lint 检查必须通过（ESLint + Oxlint）
   - TypeScript 类型检查必须通过（`tsc --noEmit`）
5. **Git 提交**：每个文件成功后，智能体将测试 + 代码提交到 Git 工作树，附带 conventional commit 消息
6. **跨文件验证**：所有文件生成后，运行完整测试套件。集成测试必须通过。契约测试必须编译。

**输出**：
- 包含所有生成提交的分支的 Git 工作树
- 存储在 MinIO 中 `pipeline/{pipelineId}/stage-3/` 目录下的 `tdd-trace.json` 产物：
  - 每个文件的 RED→GREEN→REFACTOR 过渡记录
  - 测试通过/失败证据（测试输出捕获）
  - 每个阶段的计时数据
  - Lint 和类型检查通过证据
- 生成的代码本身（多个 TypeScript 文件）

**负责智能体**：`tdd-coder`
**使用的工具**：OpenCode（ACP 子会话）、Vitest（测试运行器）、LSP（类型检查、lint）、Git 工作树（隔离）、Write（代码生成）、Bash（测试执行）

**TDD 强制执行规则**：
1. 在对应的测试文件存在并执行（失败）之前，不得编写生产文件
2. 每个测试文件在生产文件编写前必须至少有一个断言
3. Lint 和类型检查必须在文件被视为完成前通过
4. 完整测试套件必须在阶段标记为完成前通过
5. 如果 OpenCode 尝试绕过 TDD（在测试之前编写代码），会话将被标记并重试

### 3.5 阶段 4：代码审查

**目的**：对生成的代码执行全面的、多维度的审查，在问题到达测试之前发现它们。审查并行运行 6 个子智能体，每个检查不同的质量维度。

**输入**：
- 来自阶段 3 的 Git 工作树分支
- 生成的代码（所有文件）
- 来自阶段 2 的架构计划（用于合规性检查）

**处理过程**：
OpenClaw 分派 `reviewer` 智能体，该智能体编排 6 个并行的子智能体：

1. **静态分析智能体**（`static-analyzer`）：
   - 运行 ESLint、Oxlint 和 TypeScript 编译器
   - 检查未使用的变量、不可达代码、类型问题
   - 生成 lint 和类型发现项

2. **安全审计智能体**（`security-auditor`）：
   - 扫描硬编码密钥、SQL 注入模式、XSS 漏洞
   - 检查依赖版本与 CVE 数据库的比对
   - 验证认证和授权模式

3. **架构合规智能体**（`architecture-checker`）：
   - 验证生成的代码与架构计划匹配
   - 检查聚合边界是否被尊重（无跨聚合的直接引用）
   - 验证 API 契约与设计的模式一致

4. **风格指南智能体**（`style-checker`）：
   - 强制执行项目编码约定（命名、文件结构、导入顺序）
   - 检查注释和文档标准
   - 验证 conventional commit 消息格式

5. **依赖检查智能体**（`dependency-checker`）：
   - 验证导入是否被允许（无循环依赖）
   - 检查 package.json 依赖是否被使用且版本正确
   - 确保模块间无意外耦合

6. **契约验证智能体**（`contract-validator`）：
   - 验证 Pact 消费者/提供者契约
   - 检查 OpenAPI 规范的一致性
   - 验证 Zod 模式定义与文档中的类型匹配

每个子智能体产生的发现项按严重程度分类：`critical`（严重）、`high`（高）、`medium`（中）、`low`（低）、`info`（信息）。

reviewer 智能体将所有发现项聚合到审查报告中。如果存在任何 `critical`（严重）发现项，流水线**失败**该阶段并向用户报告。如果只有 `high`（高）或以下的发现项，阶段**通过但有警告**。如果没有发现项，阶段**干净通过**。

**输出**：
- 存储在 MinIO 中 `pipeline/{pipelineId}/stage-4/` 目录下的 `review-report.json` 产物
- 审查报告包含：
  - `summary`：按严重程度汇总的发现项总数，通过/失败状态
  - `findings[]`：每个发现项及其文件路径、行号、列号、严重程度、检查类型、消息、建议
  - `subAgentReports[]`：每个子智能体的详细报告
  - `passCriteria`：严重/高阈值是否达到

**负责智能体**：`reviewer`（编排 6 个子智能体）
**使用的工具**：OpenCode（每个子智能体的 ACP 子会话）、LSP、ESLint、Oxlint、npm audit、Pact CLI

### 3.6 阶段 5：自动化测试

**目的**：在四个测试级别执行全面的测试套件：单元测试、集成测试、契约测试和端到端测试。每个测试必须在部署进行前通过。

**输入**：
- 来自阶段 3 的生成代码（阶段 4 的审查发现项已处理）
- 阶段 3 TDD 循环期间生成的测试文件
- 用于契约测试配置的架构计划

**处理过程**：
`tester` 智能体按定义顺序运行测试，如果较低级别的测试失败则停止：

1. **单元测试**（Vitest）：
   - 执行所有 `test/unit/**/*.test.ts` 文件
   - 验证领域逻辑、实体不变量、值对象行为
   - 领域代码必须达到 ≥ 80% 行覆盖率和 ≥ 90% 分支覆盖率
   - 结果按测试粒度捕获，包含通过/失败和耗时

2. **集成测试**（Vitest）：
   - 执行所有 `test/integration/**/*.test.ts` 文件
   - 验证用例、仓库实现、外部服务适配器
   - 根据需要为数据库、消息代理启动测试容器（Docker）
   - 应用/基础设施层必须达到 ≥ 70% 行覆盖率

3. **契约测试**（Pact）：
   - 针对生成的 Pact 文件运行消费者契约测试
   - 针对运行中的应用实例运行提供者验证
   - 验证消费者和提供者之间的 API 契约是否匹配
   - 如果任何契约被破坏（消费者期望的字段未被提供等），则失败

4. **端到端测试**（Playwright）：
   - 在测试环境中启动完整应用
   - 运行模拟验收标准中定义的用户旅程的 Playwright 脚本
   - 捕获失败时的截图用于调试
   - 端到端验证关键用户流程

**输出**：
- 存储在 MinIO 中 `pipeline/{pipelineId}/stage-5/` 目录下的 `test-results.json` 产物
- 测试结果包含：
  - `unit`：测试计数、通过/失败、覆盖率百分比、每个文件的结果
  - `integration`：测试计数、通过/失败、覆盖率百分比、每个用例的结果
  - `contract`：Pact 验证结果、被破坏的契约列表
  - `e2e`：Playwright 结果、失败截图、用户旅程通过/失败
  - `summary`：总体通过/失败、测试耗时、覆盖率摘要

**负责智能体**：`tester`
**使用的工具**：Vitest（单元 + 集成）、Playwright（E2E）、Pact（契约）、Docker（测试容器）、OpenCode（用于测试结果分析的 ACP）

### 3.7 阶段 6：一键部署

**目的**：使用渐进式发布策略将完全测试和审查通过的代码部署到生产环境。用户批准部署，然后系统处理其余工作。

**输入**：
- 来自阶段 5 的全绿测试结果
- 来自阶段 4 的全绿审查报告
- 来自阶段 3 的生成代码分支
- 基础设施配置（Helm chart、Pulumi stack）

**处理过程**：
1. **门控检查**：OpenClaw 验证所有先前阶段已通过。如果没有，部署被阻止。
2. **用户审批**：OpenClaw 通知用户（通过 GitHub PR 评论、Slack 或 CLI）流水线已准备好部署。用户必须批准。这是流水线中唯一的手动门控。
3. **金丝雀部署**：
   - deployer 智能体创建一个金丝雀发布（例如 5% 流量）
   - 监控健康指标：错误率、延迟、吞吐量
   - 检查金丝雀验证规则（在部署配置中定义）
4. **金丝雀验证期**（默认 10 分钟）：
   - 如果指标健康：进行全量发布
   - 如果指标恶化：自动触发回滚
5. **全量发布**：
   - 流量逐步切换到 100%（例如 25% → 50% → 100%）
   - ArgoCD 同步 Kubernetes 部署
   - 健康检查确认部署稳定
6. **部署后验证**：
   - 对生产环境运行冒烟测试
   - 在额外的观察期内监控金丝雀指标
7. **通知**：用户收到部署完成通知，附带仪表板链接

**输出**：
- 存储在 MinIO 中 `pipeline/{pipelineId}/stage-6/` 目录下的 `deployment-result.json` 产物
- 部署结果包含：
  - `environment`：目标环境（staging、production）
  - `version`：部署的版本标签
  - `canaryResult`：金丝雀指标、验证通过/失败
  - `rolloutStatus`：已部署百分比、全量发布耗时
  - `verificationResults`：冒烟测试通过/失败、部署后健康状态
  - `rollbackInfo`：如果没有回滚则为 null；如果有则包含回滚原因和时间

**负责智能体**：`deployer`
**使用的工具**：Pulumi（IaC）、Helm（chart 部署）、ArgoCD（GitOps 同步）、kubectl（集群交互）、Prometheus（指标）、OpenCode（用于部署脚本生成的 ACP）

### 3.8 流水线故障处理

当任何阶段失败时：
1. 流水线会话记录失败信息，包含阶段编号、错误详情和相关日志
2. OpenClaw 通知用户失败摘要和建议的修复措施
3. 用户可以修复问题（例如更新规格、批准手动代码更改）并从失败阶段触发**重试**
4. 重试从失败阶段恢复；先前阶段的输出被重用
5. 同一阶段连续失败 3 次后，流水线被标记为 `abandoned`（已废弃）并需要手动干预

---

## 4. 组件角色

本节定义 v2 架构中每个主要组件的职责、接口和交互。

### 4.1 OpenClaw 网关

OpenClaw 是 ulw 平台的**中央引擎**。它取代了 v1 中的 NestJS API 网关、编排器和监督器。

**核心职责**：

| 功能 | 描述 |
|----------|-------------|
| **Webhook 接收器** | 监听 GitHub/GitLab webhook（PR 打开、推送到主分支、规格文件变更）。认证和校验传入请求。路由到流水线引擎。 |
| **流水线引擎** | 管理 6 阶段流水线。按顺序分派阶段智能体。追踪阶段完成和门控决策。处理重试和失败。 |
| **智能体分派器** | 将流水线阶段映射到智能体身份。当阶段需要编码/测试时创建到 OpenCode 的 ACP 子会话。管理智能体并发限制。 |
| **会话管理器** | 在 OpenClaw 会话中追踪流水线状态。将阶段产物（JSON）持久化到 MinIO。发出流水线事件。提供流水线状态查询接口。 |
| **认证集成** | 与 Keycloak 集成进行用户认证和授权。确保只有授权用户可以批准部署门控。 |
| **通知** | 通过 Slack、GitHub PR 评论或电子邮件发送状态更新。在阶段完成、失败和部署就绪时通知。 |

**接口**：
- **入站**：GitHub webhook（HTTP POST）、CLI 命令（`ulw pipeline start`）、HTTP API（状态查询）
- **出站**：到 OpenCode 的 ACP 子会话、MinIO 产物写入、Redis 缓存、Keycloak 认证检查
- **配置**：`openclaw.config.yml`（见第 9 节）

### 4.2 OpenCode 运行时

OpenCode 是 **TDD 编码运行时**。它在隔离的 Git 工作树内执行实际的代码生成和测试工作。

**核心职责**：

| 功能 | 描述 |
|----------|-------------|
| **TDD 运行时** | 强制执行 RED→GREEN→REFACTOR 循环。验证测试先编写、测试在代码之前失败、测试在代码之后通过。记录 TDD 追踪证据。 |
| **LSP 集成** | 提供 40+ 种语言服务器协议集成，支持 TypeScript、JavaScript、JSON、YAML、Markdown 等。用于类型检查、诊断和代码生成期间的导航。 |
| **Git 工作树隔离** | 创建每个智能体的 Git 工作树以隔离并行智能体操作。每个智能体获得一个干净的工作目录。防止并发智能体之间的文件冲突。使用 conventional commit 消息提交生成的代码。 |
| **测试运行器** | 集成 Vitest、Playwright 和 Pact 执行测试。捕获测试结果和覆盖率数据。向 TDD 智能体反馈测试通过/失败状态。 |
| **代码生成** | 使用 LLM 能力生成 TypeScript 代码文件。读取架构计划，编写领域实体、应用服务、基础设施适配器和表示层代码。 |

**接口**：
- **入站**：来自 OpenClaw 的 ACP 子会话命令（创建工作树、写入文件、运行测试）
- **出站**：测试结果、LSP 诊断、提交 SHA、文件内容
- **隔离**：每个智能体会话拥有自己的工作树。智能体之间无共享可变状态。

### 4.3 流水线状态模型

流水线状态是一个轻量级 TypeScript 模型，定义在 `packages/pipeline/` 中。它**不是**一个 DDD 聚合——它是一个在 OpenClaw 会话中追踪并以 JSON 形式持久化到 MinIO 的普通数据结构。

**关键类型**（概念层面，非实现）：

```
PipelineStage 枚举：
  SPEC_PARSING | ARCHITECTURE_DESIGN | TDD_CODE_GEN | CODE_REVIEW | AUTOMATED_TESTING | DEPLOYMENT

PipelineRun：
  pipelineId：字符串（UUID）
  specRef：{ repo: 字符串, commitSHA: 字符串, filePath: 字符串 }
  status: PENDING | IN_PROGRESS | PASSED | FAILED | ABANDONED
  currentStage: PipelineStage
  stages: Map<PipelineStage, StageResult>
  startedAt: ISO8601
  completedAt: ISO8601 | null
  retryCount：数字
  triggeredBy：字符串（用户 ID 或 webhook 来源）

StageResult：
  stage: PipelineStage
  status: PENDING | IN_PROGRESS | PASSED | FAILED | SKIPPED
  startedAt: ISO8601
  completedAt: ISO8601 | null
  artifactKeys: 字符串数组（MinIO 对象键）
  findings: Finding 数组（用于审查阶段）
  errorMessage: 字符串 | null
  retryCount：数字
```

### 4.4 共享包（保留）

以下来自 v1 的共享包保留，供生成的代码和流水线使用：

| 包 | 目的 | 保留？ |
|---------|---------|-----------|
| `packages/shared/domain/` | DDD 基类：Entity、ValueObject、AggregateRoot、DomainEvent、Identifier、Result<T,E>、DomainError 变体 | **是** — 由生成的领域代码使用 |
| `packages/shared/types/` | 共享 TypeScript 类型和接口：AgentType、PipelineStage、Finding、ReviewSession、DomainEvent、聚合定义 | **已重构** — 为流水线模型简化；NATS 主题常量已移除 |
| `packages/shared/events/` | 流水线事件的 Zod 事件模式：StageStarted、StageCompleted、PipelineFailed、PipelineCompleted | **新增** — 用 Zod 校验的事件类型替代 NATS 主题枚举 |
| `packages/shared/config/` | 配置类型和加载器：openclaw.config、流水线默认值、智能体设置 | **已重构** — 现在加载 openclaw.config.yml |

**已移除**：
- `packages/bc/*` — 限界上下文（PM、AD、CG、CR、TA、DP）被流水线阶段替代
- `packages/core/*` — 编排器和监督器服务被 OpenClaw 替代
- `apps/api-gateway/` — NestJS API 网关被 OpenClaw 网关替代

### 4.5 ACL 接口

防腐层（ACL）接口定义了 ulw 与外部系统之间的契约。这些是纯 TypeScript 接口，不是 NestJS 可注入服务。

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
  commit(worktree: WorktreeHandle, message: string): Promise<string>; // 返回 SHA
  push(worktree: WorktreeHandle, branch: string): Promise<void>;
  createPR(worktree: WorktreeHandle, title: string, body: string): Promise<string>; // 返回 PR URL
  removeWorktree(worktree: WorktreeHandle): Promise<void>;
}

interface CICDAdapter {
  triggerPipeline(environment: string, version: string): Promise<void>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
  rollback(deploymentId: string): Promise<void>;
}

---

## 5. 技术栈

### 5.1 技术栈概览

v2 技术栈相较 v1 显著简化。多个 v1 技术被移除，因为架构不再需要它们。

### 5.2 保留的技术

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|------------|
| TypeScript | 5.7+ | 主要语言 | 类型安全、丰富的 LSP 支持、广泛的生态系统 |
| Node.js | 22+ | 运行时 | LTS、稳定的性能、原生 ESM 支持 |
| pnpm | 9.x | 包管理器 | 快速、磁盘高效、严格的依赖解析 |
| Zod | 3.23+ | 模式校验 | TypeScript 优先、可组合的模式、适合流水线事件校验 |
| Vitest | 3.x | 单元 + 集成测试 | 快速、原生 ESM、兼容 Vite 生态、快照测试 |
| Playwright | 1.50+ | 端到端测试 | 跨浏览器、可靠的自动等待、追踪查看器、截图捕获 |
| Pact | 4.x | 契约测试 | 消费者驱动的契约、提供者验证、CI/CD 集成 |
| Pulumi | 3.x | 基础设施即代码 | TypeScript 原生 IaC、无 YAML DSL、可复用组件模型 |
| Kubernetes | 1.32+ | 容器编排 | 行业标准、自动扩缩、自愈、声明式 |
| ArgoCD | 2.14+ | GitOps 部署 | 从 Git 自动同步、漂移检测、回滚支持 |
| Helm | 3.17+ | Kubernetes 打包 | 模板化、发布管理、钩子系统 |
| Docker | latest | 容器化 | 一致的环境、层缓存、广泛采用 |
| MinIO | latest | 对象存储（S3 兼容） | 轻量、自托管、S3 API 兼容、存储流水线产物 |
| Redis | 7+ | 缓存 + 临时状态 | 快速内存存储、适合会话缓存和速率限制 |
| Keycloak | latest | 认证 + 授权 | OpenID Connect、RBAC、用户联合、自托管 |
| OpenTelemetry | 1.9+ | 可观测性 | 供应商中立的追踪、指标、日志 |
| Prometheus | latest | 指标收集 | 拉取式、强大的查询语言、Kubernetes 原生 |
| Grafana | latest | 仪表板 + 告警 | 丰富的可视化、Prometheus 集成、告警管理 |
| ELK Stack | latest | 日志聚合 | Elasticsearch 用于搜索、Logstash 用于摄取、Kibana 用于可视化 |
| Sentry | latest | 错误追踪 | 实时错误监控、堆栈追踪、发布跟踪 |
| GitHub Actions | latest | 外部 CI/CD 触发 | 紧密的 GitHub 集成、webhook 原生、市场生态系统 |
| ESLint | 9.x | Linting | 可插拔、TypeScript 感知、自动修复能力 |
| Oxlint | 0.15+ | 快速 Linting | 比 ESLint 快 50-100 倍、作为首遍过滤器 |
| Prettier | 3.4+ | 代码格式化 | 固执己见、零配置、一致输出 |

### 5.3 移除的技术（从 v1）

| 技术 | v1 用途 | v2 移除原因 |
|-----------|-----------|-------------------|
| NestJS 10.x | API 网关 + 微服务框架 | 被 OpenClaw 网关替代。内部流水线操作不需要 HTTP 框架。 |
| tRPC 11.x | 微服务间类型安全的内部 API | 不存在微服务。智能体通信使用 ACP 子会话，而非 RPC 调用。 |
| PostgreSQL 16+ | 持久化流水线状态、领域事件、限界上下文数据 | 流水线状态基于会话（OpenClaw）+ JSON 产物（MinIO）。平台本身不需要关系数据库。 |
| Drizzle ORM 0.40.x | 数据库迁移和查询构建 | 无需查询数据库。随 PostgreSQL 一起移除。 |
| NATS JetStream 2.10+ | 限界上下文间的异步消息总线 | 无限界上下文。流水线阶段在会话内顺序执行。事件在 OpenClaw 会话内发出。不需要消息代理。 |
| Kong / NGINX Ingress | 外部 API 路由、速率限制、TLS 终止 | OpenClaw 网关直接处理 webhook 路由。TLS 终止在 Kubernetes 入口控制器级别处理。 |

### 5.4 新增技术

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|------------|
| OpenClaw | latest | 中央流水线引擎 + 智能体分派器 | 原生 webhook 处理、会话管理、到 OpenCode 的 ACP 子会话、流水线编排。取代 NestJS + NATS + tRPC。 |
| OpenCode | latest | TDD 编码运行时 | TDD 强制执行、LSP 集成、Git 工作树隔离、测试运行器集成。与 OpenClaw 直接 ACP 集成。 |
| openclaw.config.yml | — | 配置格式 | 单一 YAML 文件定义 webhook、技能、智能体、定时任务。简单、版本可控、人类可读。 |

### 5.5 开发工具

| 工具 | 版本 | 用途 |
|------|---------|---------|
| tsx | 4.19+ | TypeScript 执行（开发模式） |
| tsup | 8.3+ | TypeScript 打包（生产构建） |
| typescript-eslint | 8.x | TypeScript 感知的 ESLint 规则 |

---

## 6. 智能体架构

### 6.1 智能体设计理念

ulw v2 中的智能体是**流水线阶段执行器**，而非限界上下文守护者。每个智能体负责 SDD+TDD 流水线中的一个阶段。这取代了 v1 模型中每个限界上下文（PM、AD、CG、CR、TA、DP）有一个持续运行的守护智能体的方式。

在 v2 中，智能体是**无状态**且**临时的**。它们在流水线阶段启动时被实例化，阶段完成时被销毁。所有状态由 OpenClaw 会话管理，而非智能体本身。

### 6.2 智能体到阶段的映射

| 阶段 | 智能体名称 | 角色 | 子智能体 |
|-------|-----------|------|------------|
| 1. 规格解析 | `spec-parser` | 将 Markdown 规格解析为结构化 JSON | 无 |
| 2. 架构设计 | `architect` | 设计 DDD 聚合、API 契约、数据模型、文件树 | 无 |
| 3. TDD 代码生成 | `tdd-coder` | 通过 RED→GREEN→REFACTOR 生成 TypeScript 代码 | 无（顺序逐文件） |
| 4. 代码审查 | `reviewer` | 编排 6 维代码审查 | `static-analyzer`、`security-auditor`、`architecture-checker`、`style-checker`、`dependency-checker`、`contract-validator` |
| 5. 自动化测试 | `tester` | 执行单元、集成、契约、E2E 测试 | 无（顺序测试层级） |
| 6. 部署 | `deployer` | 金丝雀部署、验证、全量发布 | 无 |

### 6.3 智能体层次结构

```
                        ┌──────────────────────────┐
                        │    流水线编排器             │
                        │    (OpenClaw 网关)          │
                        └─────────────┬────────────┘
                                      │ 分派
          ┌───────────────┬───────────┼───────────┬───────────────┬───────────────┐
          ▼               ▼           ▼           ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐ ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  spec-   │   │  archi-  │  │  tdd-    │ │ reviewer │  │  tester  │  │ deployer │
    │  parser  │   │  tect    │  │  coder   │ │          │  │          │  │          │
    └──────────┘   └──────────┘  └──────────┘ └────┬─────┘  └──────────┘  └──────────┘
                                                   │ 编排
                     ┌───────────────┬───────────────┼───────────────┬───────────────┐
                     ▼               ▼               ▼               ▼               ▼               ▼
               ┌──────────┐  ┌──────────┐  ┌──────────────┐ ┌──────────┐  ┌──────────┐ ┌──────────────┐
               │ static-  │  │ security-│  │ architecture-│ │ style-   │  │dependency│ │  contract-   │
               │ analyzer │  │ auditor  │  │    checker   │ │ checker  │  │-checker  │ │  validator   │
               └──────────┘  └──────────┘  └──────────────┘ └──────────┘  └──────────┘ └──────────────┘
```

### 6.4 智能体身份模型

每个智能体由三个文件定义，遵循 v1 建立并在 v2 中保留的约定：

| 文件 | 用途 | 示例内容 |
|------|---------|----------------|
| `SOUL.md` | 智能体个性、原则和行为约束 | 定义智能体的角色（例如："你是一个严谨的代码审查者，绝不会批准带有安全漏洞的代码"）。包含道德准则和不可协商的规则。 |
| `AGENTS.md` | 智能体上下文、可用工具和流水线阶段指令 | 定义智能体对其流水线阶段的理解、输入/输出契约、工具访问列表和通信协议。 |
| `TOOLS.md` | 工具使用说明和安全约束 | 记录智能体可以使用哪些工具、如何调用它们以及安全边界（例如："审查期间绝不删除文件"）。 |

**智能体目录结构**（位于 `agents/` 下）：

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

### 6.5 智能体通信

智能体通过两种机制通信：

1. **流水线上下文**（由 OpenClaw 传递）：当阶段智能体被分派时，OpenClaw 提供流水线上下文，包含所有先前阶段的输出（作为 MinIO 产物引用）。智能体从 MinIO 读取所需内容。

2. **ACP 子会话**（用于 OpenCode）：当智能体需要生成或修改代码时，它创建到 OpenCode 的 ACP 子会话。子会话提供隔离的 Git 工作树和完整的 OpenCode 工具集（LSP、测试运行器、文件操作）。

**没有直接的智能体间通信**。智能体不相互发送消息。流水线是顺序的：阶段 N 仅在阶段 N-1 成功完成后启动。流水线上下文连接各阶段。

### 6.6 智能体调用模型

```
OpenClaw 接收触发器
    │
    ▼
OpenClaw 创建 PipelineSession
    │
    ▼
OpenClaw 分派阶段-1 智能体（spec-parser）
    │ 智能体读取 spec.md，生成 structured-spec.json → 存储到 MinIO
    │ 智能体向 OpenClaw 报告完成
    ▼
OpenClaw 验证阶段-1 输出
    │
    ▼
OpenClaw 分派阶段-2 智能体（architect）
    │ 智能体从 MinIO 读取 structured-spec.json
    │ 智能体生成 architecture-plan.json → 存储到 MinIO
    │ 智能体向 OpenClaw 报告完成
    ▼
OpenClaw 验证阶段-2 输出
    │
    ▼
OpenClaw 分派阶段-3 智能体（tdd-coder）
    │ 智能体创建到 OpenCode 的 ACP 子会话
    │ OpenCode 每个文件执行 TDD 循环 → 提交到 Git 工作树
    │ 智能体将 tdd-trace.json 存储到 MinIO
    │ 智能体向 OpenClaw 报告完成（附带分支引用）
    ▼
...（继续阶段 4-6）
```

### 6.7 技能目录

技能定义智能体可以加载的可复用能力。技能保留在 `skills/` 目录中：

```
skills/
  spec-parsing/          — Markdown 到结构化规格的解析
  architecture-design/   — 从规格设计 DDD 战术模式
  tdd/                   — RED→GREEN→REFACTOR 代码生成工作流
  code-review/           — 6 智能体审查编排
  contract-validation/   — Pact 契约测试工作流
  security-audit/        — 漏洞扫描和密钥检测
  test-generation/       — 自动化测试套件生成
  deployment/            — 金丝雀发布和验证
```

技能通过 OpenClaw 的技能加载机制由智能体调用。技能为特定能力提供逐步指令、工具配置和验证规则。

---

## 7. 数据流

### 7.1 端到端流程

从用户编写规格到部署生产代码的完整数据流：

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                        用户                                              │
│                                          │                                                │
│                          编写 spec.md  │                                                │
│                          提交到 Git     │                                                │
│                                         ▼                                                 │
│                              ┌──────────────────┐                                        │
│                              │   GitHub 仓库    │                                        │
│                              │  spec.md 提交    │                                        │
│                              └────────┬─────────┘                                        │
│                                       │ webhook（推送事件）                              │
└───────────────────────────────────────┼──────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    OpenClaw 网关                                           │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  1. Webhook 接收器校验负载，提取提交 SHA 和 spec.md 路径                              │  │
│  │  2. 流水线引擎创建 PipelineRun，设置状态 = IN_PROGRESS                                │  │
│  │  3. 智能体分派器启动 spec-parser 智能体                                                │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─────────────────────── 流水线阶段 ──────────────────────────────────────────────────┐  │
│  │                                                                                       │  │
│  │  阶段 1：规格解析                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ spec-parser 读取 spec.md → 解析章节 → 使用 Zod 校验 →                          │    │  │
│  │  │ 输出 structured-spec.json → 存储到 MinIO                                      │    │  │
│  │  │ 路径：pipeline/{pipelineId}/stage-1/structured-spec.json                       │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  阶段 2：架构设计                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ architect 从 MinIO 读取 structured-spec.json → 设计 DDD 聚合、                │    │  │
│  │  │ API 契约、数据模型、文件树 → 输出 architecture-plan.json                      │    │  │
│  │  │ 路径：pipeline/{pipelineId}/stage-2/architecture-plan.json                    │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  阶段 3：TDD 代码生成                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ tdd-coder 创建到 OpenCode 的 ACP 子会话                                       │    │  │
│  │  │                                                                               │    │  │
│  │  │  ┌─────────────────────── OpenCode ───────────────────────────────────────┐  │    │  │
│  │  │  │  Git 工作树：为此流水线运行隔离的分支                                   │  │    │  │
│  │  │  │                                                                         │  │    │  │
│  │  │  │  对于 architecture-plan.fileTree 中的每个文件：                         │  │    │  │
│  │  │  │    RED：   编写测试文件 → 运行 → 必须失败 → 捕获输出                    │  │    │  │
│  │  │  │    GREEN： 编写最小生产代码 → 运行测试 → 必须通过                       │  │    │  │
│  │  │  │    REFACTOR：清理代码 → 运行测试 → 必须通过 → lint + 类型检查           │  │    │  │
│  │  │  │    Git 提交，附带 conventional commit 消息                               │  │    │  │
│  │  │  │                                                                         │  │    │  │
│  │  │  │  输出：生成的 TypeScript 文件 + tdd-trace.json                          │  │    │  │
│  │  │  └────────────────────────────────────────────────────────────────────────┘  │    │  │
│  │  │                                                                               │    │  │
│  │  │  tdd-trace.json 存储位置：pipeline/{pipelineId}/stage-3/tdd-trace.json        │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  阶段 4：代码审查                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ reviewer 分派 6 个并行子智能体（每个有 ACP 子会话）：                          │    │  │
│  │  │                                                                               │    │  │
│  │  │  static-analyzer ──► Lint + 类型检查发现项                                    │    │  │
│  │  │  security-auditor ─► 密钥扫描 + CVE + 认证模式发现项                          │    │  │
│  │  │  architecture-checker ─► 计划合规性发现项                                     │    │  │
│  │  │  style-checker ──► 命名 + 约定发现项                                         │    │  │
│  │  │  dependency-checker ─► 导入 + 循环依赖发现项                                  │    │  │
│  │  │  contract-validator ─► Pact + OpenAPI 发现项                                  │    │  │
│  │  │                                                                               │    │  │
│  │  │  聚合为 review-report.json                                                    │    │  │
│  │  │  路径：pipeline/{pipelineId}/stage-4/review-report.json                        │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  阶段 5：自动化测试                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ tester 按顺序执行：                                                           │    │  │
│  │  │   1. 单元测试（Vitest）→ 必须全部通过 + 覆盖率 ≥ 80%                         │    │  │
│  │  │   2. 集成测试（Vitest）→ 必须全部通过 + 覆盖率 ≥ 70%                         │    │  │
│  │  │   3. 契约测试（Pact）→ 必须全部验证通过                                     │    │  │
│  │  │   4. 端到端测试（Playwright）→ 必须全部通过                                  │    │  │
│  │  │                                                                               │    │  │
│  │  │  输出 test-results.json                                                       │    │  │
│  │  │  路径：pipeline/{pipelineId}/stage-5/test-results.json                        │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                      │                                                │  │
│  │                                      ▼                                                │  │
│  │  阶段 6：一键部署                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ deployer 检查所有门控为绿色 → 请求用户审批 →                                  │    │  │
│  │  │ 审批通过后：金丝雀部署（5%）→ 监控（10 分钟）→ 全量发布 →                     │    │  │
│  │  │ 冒烟测试 → 通知用户                                                          │    │  │
│  │  │                                                                               │    │  │
│  │  │  输出 deployment-result.json                                                  │    │  │
│  │  │  路径：pipeline/{pipelineId}/stage-6/deployment-result.json                   │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  流水线完成                                                                           │  │
│  │  PipelineRun.status = PASSED                                                          │  │
│  │  通过 Slack / GitHub PR 评论 / 电子邮件通知用户                                        │  │
│  │  所有产物归档在 MinIO 中用于审计                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 流水线状态生命周期

```
                    ┌──────────┐
                    │ PENDING   │  ← 触发器接收后的初始状态
                    └─────┬────┘
                          │ OpenClaw 启动流水线
                          ▼
                    ┌──────────┐
                    │ IN_      │  ← 流水线正在执行阶段
                    │ PROGRESS │
                    └─────┬────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │  PASSED  │ │  FAILED  │ │  ABANDONED   │
        │ (所有     │ │ (阶段     │ │ (3 次重试     │
        │  阶段     │ │  失败)   │ │  已耗尽)     │
        │  绿色)    │ │          │ │              │
        └──────────┘ └────┬─────┘ └──────────────┘
                          │
                          │ 用户修复问题，
                          │ 触发重试
                          ▼
                    ┌──────────┐
                    │ IN_      │  ← 从失败阶段恢复
                    │ PROGRESS │
                    └──────────┘
```

### 7.3 事件流

流水线事件经过 Zod 校验并在 OpenClaw 会话内发出。它们以 JSON 形式持久化到 MinIO 用于审计追踪。

**事件类型**：

```
PipelineStarted：
  pipelineId：字符串
  specRef：{ repo: 字符串, commitSHA: 字符串, filePath: 字符串 }
  triggeredBy：字符串
  timestamp: ISO8601

StageStarted：
  pipelineId：字符串
  stage: PipelineStage（枚举）
  timestamp: ISO8601

StageCompleted：
  pipelineId：字符串
  stage: PipelineStage
  status: PASSED | FAILED
  artifactKeys：字符串数组（MinIO 路径）
  durationMs：数字
  timestamp: ISO8601

PipelineFailed：
  pipelineId：字符串
  failedStage: PipelineStage
  error: { message: 字符串, details: 对象 }
  retryCount：数字
  timestamp: ISO8601

PipelineCompleted：
  pipelineId：字符串
  totalDurationMs：数字
  stageDurations: Record<PipelineStage, 数字>
  deploymentUrl：字符串 | null
  timestamp: ISO8601

UserApprovalRequested：
  pipelineId：字符串
  stage: 'DEPLOYMENT'
  message：字符串
  timestamp: ISO8601

UserApprovalReceived：
  pipelineId：字符串
  approvedBy：字符串
  timestamp: ISO8601
```

**事件持久化**：事件写入 MinIO 的 `pipeline/{pipelineId}/events/{eventId}.json` 路径。可通过列出 `pipeline/{pipelineId}/events/` 下的对象来重建流水线的事件流。

### 7.4 产物存储策略

所有流水线产物存储在 MinIO 中，使用一致的命名方案：

```
pipeline/
  {pipelineId}/
    metadata.json                — PipelineRun 状态快照
    events/
      {timestamp}-{eventId}.json — 单个事件
    stage-1/
      structured-spec.json       — 阶段 1 输出
    stage-2/
      architecture-plan.json     — 阶段 2 输出
    stage-3/
      tdd-trace.json             — 阶段 3 TDD 证据
    stage-4/
      review-report.json         — 阶段 4 审查发现项
      static-analyzer.json       — 子智能体报告
      security-auditor.json      — 子智能体报告
      architecture-checker.json  — 子智能体报告
      style-checker.json         — 子智能体报告
      dependency-checker.json    — 子智能体报告
      contract-validator.json    — 子智能体报告
    stage-5/
      test-results.json          — 阶段 5 测试结果
      coverage/                  — 覆盖率报告（HTML、lcov）
      playwright-screenshots/    — E2E 失败截图
    stage-6/
      deployment-result.json     — 阶段 6 部署结果
```

### 7.5 会话 vs. 持久化

| 方面 | 存储位置 | 目的 |
|--------|-------------|---------|
| 流水线状态（当前） | OpenClaw 会话（内存 + Redis） | 快速状态转换、阶段分派决策 |
| 流水线状态（历史） | MinIO `metadata.json` + 事件流 | 审计追踪、调试、指标 |
| 阶段产物 | MinIO（JSON） | 下游阶段的输入、审查证据 |
| 生成的代码 | Git 工作树（阶段期间临时）→ 推送到 GitHub 分支 | 版本控制、PR 创建 |
| 用户通知 | Slack / GitHub / 电子邮件（外部） | 人类可读的状态更新 |

---

## 8. 基础设施与部署

### 8.1 Kubernetes 部署拓扑

v2 基础设施较 v1 显著简化。它由更少的长期运行服务组成，并引入了临时的 OpenCode 任务 Pod。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KUBERNETES 集群                                          │
│                                                                                    │
│  ┌─────────────────────────── 入口 ──────────────────────────────────────────┐  │
│  │  NGINX Ingress Controller — TLS 终止、webhook 路由、速率限制               │  │
│  └────────────────────────────────┬────────────────────────────────────────────┘  │
│                                   │                                                 │
│  ┌────────────────────────────────┼────────────────────────────────────────────┐  │
│  │                       命名空间: ulw-platform                                  │  │
│  │                                │                                               │  │
│  │  ┌─────────────────────────────┴──────────────────────────────────────────┐ │  │
│  │  │                         长期运行服务                                       │  │
│  │  │                                                                          │ │  │
│  │  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────┐ │ │  │
│  │  │  │  OpenClaw        │  │  Redis       │  │  MinIO   │  │  Keycloak   │ │ │  │
│  │  │  │  网关 Pod        │  │  Pod         │  │  Pod     │  │  Pod        │ │ │  │
│  │  │  │  (1 副本)        │  │  (1 副本)    │  │  (1 副本)│  │  (1 副本)   │ │ │  │
│  │  │  │  端口: 8080      │  │  端口: 6379  │  │  :9000   │  │  :8443      │ │ │  │
│  │  │  └──────────────────┘  └──────────────┘  └──────────┘  └─────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         临时任务 Pod                                       │  │
│  │  │                                                                          │ │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │  │
│  │  │  │  OpenCode Job    │  │  OpenCode Job    │  │  OpenCode Job         │ │ │  │
│  │  │  │  (tdd-coder)     │  │  (审查子智能体 x6)  │  │  (tester)             │ │ │  │
│  │  │  │                  │  │                  │  │                       │ │ │  │
│  │  │  │  创建：          │  │  创建：          │  │  创建：               │ │ │  │
│  │  │  │  - Git 工作树   │  │  - 每个智能体    │  │  - 测试容器          │ │ │  │
│  │  │  │  - 提交         │  │    的工作树      │  │  - 覆盖率报告         │ │ │  │
│  │  │  │                  │  │  - 审查报告      │  │                       │ │ │  │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌─────────────────────────── 可观测性 ────────────────────────────────────────────┐  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │  │
│  │  │Prometheus│  │ Grafana  │  │   ELK    │  │  Sentry  │  │ OpenTelemetry│      │  │
│  │  │  Pod     │  │  Pod     │  │  Stack   │  │  Pod     │  │  Collector   │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────┘      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Pod 生命周期

| Pod | 类型 | 生命周期 | 扩缩 |
|-----|------|-----------|---------|
| OpenClaw 网关 | Deployment | 始终运行 | 1 副本（有状态会话管理；水平扩展待定） |
| Redis | Deployment | 始终运行 | 1 副本（或 Sentinel 实现高可用） |
| MinIO | Deployment | 始终运行 | 1 副本（或分布式模式实现高可用） |
| Keycloak | Deployment | 始终运行 | 1 副本 |
| OpenCode Job（TDD） | Job | 临时（阶段 3 时创建） | 每流水线运行 1 个 |
| OpenCode Job（审查） | Job | 临时（阶段 4 时创建） | 每流水线运行 1 个（内部运行 6 个子智能体） |
| OpenCode Job（测试） | Job | 临时（阶段 5 时创建） | 每流水线运行 1 个 |
| Prometheus | Deployment | 始终运行 | 1 副本 |
| Grafana | Deployment | 始终运行 | 1 副本 |
| ELK Stack | StatefulSet | 始终运行 | 根据需要 |
| Sentry | Deployment | 始终运行 | 1 副本 |
| OpenTelemetry Collector | DaemonSet | 始终运行 | 每节点 1 个 |

### 8.3 基础设施即代码

v2 基础设施使用与 v1 相同的 IaC 工具（Pulumi + Helm），但堆栈更简化：

**Pulumi 堆栈**（TypeScript）：
- Kubernetes 集群配置（通过 Pulumi Kubernetes 提供者实现云无关）
- 命名空间创建：`ulw-platform`
- 长期运行服务：OpenClaw 网关、Redis、MinIO、Keycloak
- 可观测性堆栈：Prometheus、Grafana、ELK、Sentry、OpenTelemetry Collector
- OpenCode Pod 的任务模板
- Webhook 路由的入口规则

**Helm Charts**（位于 `infrastructure/helm/` 下）：
- `openclaw-gateway/` — OpenClaw 网关部署，挂载 `openclaw.config.yml` 的配置卷
- `redis/` — Redis 部署（或使用 Bitnami Redis chart 作为依赖）
- `minio/` — MinIO 部署（或使用 MinIO Operator chart）
- `keycloak/` — Keycloak 部署（或使用 Bitnami Keycloak chart）
- `opencode-job/` — 临时 OpenCode 任务 Pod 模板
- `observability/` — Prometheus、Grafana、ELK、Sentry 的总控 chart

### 8.4 Docker Compose（本地开发）

对于本地开发，简化的 `docker-compose.yml` 提供所需的最小服务集：

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

**注意**：v2 Docker Compose 不再包含 PostgreSQL 或 NATS。这些已被移除，因为流水线状态基于会话，智能体通信不使用消息总线。

### 8.5 CI/CD 集成（GitHub Actions）

GitHub Actions 工作流通过 OpenClaw webhook 触发流水线：

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

### 8.6 移除的 v1 基础设施

以下 v1 基础设施组件被移除：

| v1 组件 | 移除原因 |
|-------------|---------------|
| NestJS API 网关 Pod | 被 OpenClaw 网关替代 |
| 编排器 Pod | 编排现由 OpenClaw 流水线引擎处理 |
| 监督器 Pod | 状态管理现由 OpenClaw 会话管理器处理 |
| PostgreSQL Pod | 流水线状态不需要关系数据库 |
| NATS Pod | 不需要消息总线；阶段在会话内顺序执行 |
| NATS 流/消费者 | 服务间无需异步事件驱动通信 |

---

## 9. OpenClaw 配置

### 9.1 配置文件

所有 OpenClaw 行为通过单一 `openclaw.config.yml` 文件配置。这取代了 v1 中使用的多个配置文件（NestJS 配置模块、NATS 配置、tRPC 配置、每个 BC 的配置）。

### 9.2 完整配置参考

```yaml
# openclaw.config.yml — ulw 平台配置 v2

# ─── 服务器 ───────────────────────────────────────────────────────
server:
  host: "0.0.0.0"
  port: 8080
  tls:
    enabled: true
    certFile: "/etc/ssl/certs/ulw.crt"
    keyFile: "/etc/ssl/private/ulw.key"

# ─── Webhook ─────────────────────────────────────────────────────
webhooks:
  github:
    enabled: true
    path: "/webhook/github"
    secret: "${GITHUB_WEBHOOK_SECRET}"  # 从环境变量获取
    events:
      - push        # 推送时触发流水线
      - pull_request  # 触发以审查为中心的流水线
    filter:
      paths:
        - "specs/**/*.md"   # 仅规格文件变更时触发
      branches:
        - "main"
        - "feature/**"

  gitlab:
    enabled: false  # 需要时启用
    path: "/webhook/gitlab"
    secret: "${GITLAB_WEBHOOK_SECRET}"

  manual:
    enabled: true
    # CLI: ulw pipeline start --spec <路径>

# ─── 流水线 ─────────────────────────────────────────────────────
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
        sessionMode: "acp"          # 到 OpenCode 的 ACP 子会话
        worktreeBase: "main"        # Git 工作树的基础分支
        enforceTDD: true            # 必须遵循 RED→GREEN→REFACTOR

    - name: "code-review"
      agent: "reviewer"
      timeout: 360s
      retry:
        maxAttempts: 1
        backoff: fixed
      gate:
        requiresApproval: false
      subAgents:
        parallel: true              # 并行运行 6 个子智能体
        list:
          - static-analyzer
          - security-auditor
          - architecture-checker
          - style-checker
          - dependency-checker
          - contract-validator
      thresholds:
        maxCriticalFindings: 0      # 任何严重发现项则失败
        maxHighFindings: 5          # 超过 5 个高严重度发现项则警告

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
        maxAttempts: 0  # 部署不自动重试；手动审批门控
      gate:
        requiresApproval: true       # 用户必须在部署前批准
        approvers:
          - role: tech-lead
        timeout: 3600s              # 审批窗口：1 小时
      canary:
        percentage: 5               # 初始金丝雀流量百分比
        duration: 600s              # 验证期：10 分钟
        metrics:
          - name: error_rate
            threshold: 1.0           # 最大 1% 错误率
          - name: p95_latency_ms
            threshold: 500           # 最大 500ms p95 延迟
      rollout:
        strategy: "gradual"          # 渐进：25% → 50% → 100%
        stepDuration: 120s           # 每步 2 分钟

# ─── 智能体身份 ─────────────────────────────────────────────
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
      enabled: true                  # 此智能体通过 OpenCode ACP 运行
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

# ─── 技能 ───────────────────────────────────────────────────────
skills:
  spec-parsing:
    path: "skills/spec-parsing/"
    description: "将 Markdown 规格解析为 Zod 校验的结构化 JSON"

  architecture-design:
    path: "skills/architecture-design/"
    description: "从结构化规格设计 DDD 聚合、API 契约和数据模型"

  tdd:
    path: "skills/tdd/"
    description: "通过 OpenCode 执行 RED→GREEN→REFACTOR TDD 循环"

  code-review:
    path: "skills/code-review/"
    description: "编排 6 智能体并行代码审查流水线"

  contract-validation:
    path: "skills/contract-validation/"
    description: "验证 Pact 契约和 OpenAPI 规范"

  security-audit:
    path: "skills/security-audit/"
    description: "扫描密钥、CVE 和认证漏洞"

  test-generation:
    path: "skills/test-generation/"
    description: "生成并执行单元、集成、契约和 E2E 测试"

  deployment:
    path: "skills/deployment/"
    description: "执行金丝雀部署和渐进式发布"

# ─── 存储 ──────────────────────────────────────────────────────
storage:
  minio:
    endpoint: "minio.ulw-platform.svc.cluster.local:9000"
    accessKey: "${MINIO_ACCESS_KEY}"
    secretKey: "${MINIO_SECRET_KEY}"
    bucket: "ulw-pipelines"
    useSSL: false                 # 内部集群通信
    region: "us-east-1"

# ─── 缓存 ────────────────────────────────────────────────────────
cache:
  redis:
    host: "redis.ulw-platform.svc.cluster.local"
    port: 6379
    password: "${REDIS_PASSWORD}"
    db: 0
    ttl:
      session: 86400              # 24 小时
      agentState: 3600            # 1 小时

# ─── 认证 ─────────────────────────────────────────────────────────
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

# ─── 定时任务 ────────────────────────────────────────────────────
cron:
  - name: "nightly-security-scan"
    schedule: "0 3 * * *"         # 每天凌晨 3 点
    action: "security-audit"
    target: "all-active-repos"

  - name: "weekly-dependency-update"
    schedule: "0 4 * * 1"         # 每周一凌晨 4 点
    action: "dependency-check"
    target: "all-active-repos"

  - name: "pipeline-artifact-cleanup"
    schedule: "0 5 * * 0"         # 每周日凌晨 5 点
    action: "cleanup"
    retention:
      passed: 30d                 # 保留通过的流水线产物 30 天
      failed: 90d                 # 保留失败的流水线产物 90 天

# ─── 通知 ────────────────────────────────────────────────
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
    createPRComment: true         # 在 PR 上发布状态评论

  email:
    enabled: false
    smtp:
      host: "${SMTP_HOST}"
      port: 587

# ─── 可观测性 ────────────────────────────────────────────────
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

### 9.3 配置管理

- `openclaw.config.yml` 文件存储在仓库根目录
- 敏感值（密钥、密码、令牌）使用 `${ENV_VAR}` 替换，通过 Kubernetes Secrets 注入
- 配置变更受版本控制，触发 OpenClaw 网关 Pod 的滚动更新
- 环境特定的覆写可放置在 `openclaw.config.{env}.yml` 中（例如 `openclaw.config.staging.yml`）

---

## 10. 与 v1 架构的对比

### 10.1 概念转变

| 维度 | v1（DESIGN.md） | v2（DESIGN_v2.md） |
|-----------|---------------|-------------------|
| **架构风格** | 带 DDD 限界上下文的分层微服务 | 以阶段式智能体为中心的流水线 |
| **中央引擎** | NestJS 编排器 + NestJS 监督器 | OpenClaw 网关（流水线引擎 + 会话管理器） |
| **通信方式** | 限界上下文间的 NATS JetStream 异步消息 | OpenClaw 会话内的顺序流水线阶段；到 OpenCode 的 ACP 子会话 |
| **代码生成** | 代码生成限界上下文（bc-cg）生成代码 | OpenCode TDD 运行时强制执行 RED→GREEN→REFACTOR 循环 |
| **状态管理** | PostgreSQL（Drizzle ORM）存储流水线状态、领域事件、限界上下文数据 | OpenClaw 会话（内存 + Redis）+ MinIO JSON 产物 |
| **API 层** | 带 REST + tRPC 的 NestJS API 网关用于内部服务间调用 | OpenClaw 网关直接处理 webhook、CLI 和 HTTP API |
| **领域模型** | 6 个限界上下文（PM、AD、CG、CR、TA、DP）建模为 DDD 聚合 | 6 个流水线阶段（规格→架构→代码→审查→测试→部署） |
| **智能体模型** | 每个限界上下文有守护智能体（长期运行） | 阶段智能体（临时的，每流水线运行实例化一次） |
| **部署** | 8+ 个长期运行 Pod（API 网关、编排器、监督器、PostgreSQL、NATS、Redis、MinIO、Keycloak） | 4 个长期运行 Pod（OpenClaw、Redis、MinIO、Keycloak）+ 临时 OpenCode 任务 Pod |

### 10.2 架构图对比

**v1 架构**（简化版）：
```
外部 → Kong Ingress → NestJS API 网关（REST + tRPC）
                              ↓
                    NestJS 编排器 → NATS → 限界上下文（PM、AD、CG、CR、TA、DP）
                              ↓                      ↓
                    NestJS 监督器 ← NATS ← PostgreSQL（状态 + 事件）
```

**v2 架构**（简化版）：
```
外部 → OpenClaw 网关（webhook、CLI、HTTP）
                    ↓
           流水线引擎 → 阶段智能体 → OpenCode ACP（TDD 编码）
                    ↓
           MinIO（产物）+ Redis（缓存）
```

### 10.3 我们移除了什么以及为什么

| 移除的组件 | 原因 |
|-------------------|--------|
| NestJS（整个框架） | OpenClaw 处理所有网关、编排和分派逻辑。内部操作不需要 REST 框架。 |
| tRPC | 没有需要通信的微服务。智能体通信使用 ACP，而非 RPC。 |
| PostgreSQL + Drizzle ORM | 流水线状态基于会话且临时的。产物是 MinIO 中的 JSON。不需要关系查询。不需要模式迁移。 |
| NATS JetStream | 不需要异步消息传递。阶段是顺序的。事件在会话内发出，而非通过消息总线。 |
| 6 个限界上下文（packages/bc/*） | 被 6 个流水线阶段替代。智能体专业化替代了领域建模。 |
| 编排器 + 监督器（packages/core/*） | 被 OpenClaw 流水线引擎 + 会话管理器替代。 |
| API 网关（apps/api-gateway/） | 被 OpenClaw 网关 webhook 接收器 + HTTP API 替代。 |
| Kong Ingress | 被标准 NGINX Ingress Controller 替代（更简单；OpenClaw 处理路由逻辑）。 |

### 10.4 复杂度降低指标

| 指标 | v1 | v2 | 降低幅度 |
|--------|----|----|-----------|
| 长期运行服务（Pod） | 8+ | 4 | 50% |
| 数据库实例 | 1（PostgreSQL） | 0 | 100% |
| 消息总线实例 | 1（NATS） | 0 | 100% |
| 框架依赖 | NestJS + tRPC + Drizzle + NATS 客户端 | 仅 OpenClaw SDK | 75% |
| 配置文件 | ~15 个（每个 BC 的 .env、NATS 配置、DB 迁移等） | 1 个（openclaw.config.yml） | 93% |
| API 端点（内部） | 40+ 个（tRPC 过程） | 0 个（不需要内部 API） | 100% |
| 数据库表 | ~20 个（流水线状态、事件、BC 数据） | 0 个（基于会话） | 100% |
| 代码包 | 15+ 个（6 个 BC + 2 个核心 + 1 个应用 + 共享） | 4 个（流水线 + 3 个共享） | 73% |

### 10.5 保持不变的部分

以下是 v1 和 v2 之间不变的元素：

| 元素 | 详情 |
|---------|---------|
| TypeScript + Node.js | 相同的语言和运行时 |
| pnpm workspaces | 相同的单体仓库结构（简化的包集合） |
| DDD 基类（shared/domain） | Entity、ValueObject、AggregateRoot、Result<T,E> — 由生成的代码使用 |
| 测试栈 | Vitest 3.x、Playwright 1.50+、Pact 4.x |
| 部署栈 | Pulumi 3.x、Kubernetes 1.32+、ArgoCD 2.14+、Helm 3.17+ |
| 可观测性 | OpenTelemetry、Prometheus、Grafana、ELK、Sentry |
| 智能体身份模型 | SOUL.md、AGENTS.md、TOOLS.md — 保留并扩展 |
| 技能目录 | 技能保留；部分重新用于流水线阶段 |
| Conventional Commits | 相同的提交消息标准 |
| 严格 TypeScript + 无 any | 相同的编码标准 |
| TDD 纪律 | 相同的原则，但现在由 OpenCode 在工具层面强制执行 |

---

## 11. 共享包（从 v1 保留）

### 11.1 包映射

```
packages/
  shared/
    domain/        — 保留。供生成代码使用的 DDD 基类。
    types/         — 已重构。为流水线模型简化。
    events/        — 新增。流水线事件的 Zod 事件模式。
    config/        — 已重构。现在加载 openclaw.config.yml。
  pipeline/        — 新增。轻量级流水线状态类型（Stage、PipelineRun、StageResult）。
  acl/             — 保留。防腐层接口（OpenCode、OpenClaw、Git、CI/CD 适配器）。
```

### 11.2 `packages/shared/domain/` — 保留

DDD 基类保持不变。它们由 OpenCode 在阶段 3（TDD 代码生成）期间生成的代码使用。当 architect 智能体设计聚合时，它引用这些基类。当 TDD coder 生成代码时，它继承 `Entity`、`ValueObject` 和 `AggregateRoot`。

```
Entity<TId>           — 具有标识的领域实体基类
ValueObject            — 具有结构相等性的值对象基类
AggregateRoot<TId>    — 具有领域事件收集的聚合根基类
DomainEvent            — 领域事件接口
Identifier<T>          — 实体标识符的类型安全包装
Result<T, E>           — 领域操作的 Either monad（成功或类型化错误）
DomainError            — 领域特定错误的基类
  ValidationError
  NotFoundError
  UnauthorizedError
  ConflictError
  InvalidOperationError
PaginatedResult<T>     — 支持仓库查询的分页
```

### 11.3 `packages/shared/types/` — 已重构

共享类型包为流水线模型进行了简化：

**保留**：
- `AgentType` 枚举（为流水线智能体更新）
- `Finding`、`ReviewSession`、`ReviewStatus`、`CheckType`、`Severity` — 审查相关类型
- `DomainEvent`、`AggregateRoot`、`ValueObject`、`Entity` — 领域基类的接口定义

**移除**：
- NATS 主题常量（`EventSubjects`、`NATS_SUBJECT_PREFIX`、`MessageEnvelope`）
- 工作流相关类型（被流水线阶段类型替代）
- `AgentRole`、`AgentSession`、`AgentMessage` — 被 OpenClaw 会话模型替代
- `ApprovalGate`、`CanaryRule`、`PipelineStage`（旧的 CI/CD 流水线类型 — 被新流水线模型替代）

**新增**：
- `PipelineStage` 枚举（新的 6 阶段流水线）
- `PipelineRun`、`StageResult`（流水线追踪类型）
- `PipelineEvent` 联合类型（StageStarted、StageCompleted 等）

### 11.4 `packages/shared/events/` — 新增

用 Zod 校验的流水线事件替代 NATS 事件系统：

```
StageStartedEvent      — 阶段开始通知的 Zod 模式
StageCompletedEvent    — 阶段完成的 Zod 模式
PipelineFailedEvent    — 流水线失败的 Zod 模式
PipelineCompletedEvent — 流水线完成的 Zod 模式
UserApprovalRequested  — 部署门控的 Zod 模式
UserApprovalReceived   — 审批确认的 Zod 模式
```

这些模式在事件负载持久化到 MinIO 之前对其进行校验。它们充当流水线阶段和外部消费者（仪表板、通知系统）之间的契约。

### 11.5 `packages/pipeline/` — 新增

一个用于流水线特定类型的新轻量级包。这些是纯 TypeScript 类型，不是 DDD 类。没有业务逻辑。没有持久化层。

```
PipelineStage 枚举：
  SPEC_PARSING | ARCHITECTURE_DESIGN | TDD_CODE_GEN | CODE_REVIEW | AUTOMATED_TESTING | DEPLOYMENT

PipelineRun：
  pipelineId: UUID
  specRef：字符串（仓库 + 提交 + 文件路径）
  status: PipelineRunStatus
  currentStage: PipelineStage
  stages: Record<PipelineStage, StageResult>
  startedAt: ISO8601
  completedAt: ISO8601 | null
  retryCount：数字

StageResult：
  status: StageStatus
  startedAt: ISO8601
  completedAt: ISO8601 | null
  artifactKeys：字符串数组
  errorMessage：字符串 | null
```

### 11.6 `packages/acl/` — 保留，简化

ACL 接口保留但简化。它们是纯 TypeScript 接口（无 NestJS 装饰器或依赖注入）：

```
OpenCodeAdapter：
  createSession()
  writeFile()
  runCommand()
  getDiagnostics()
  closeSession()

OpenClawAdapter：
  dispatchAgent()
  notifyUser()
  getSessionState()

GitAdapter：
  createWorktree()
  commit()
  push()
  createPR()
  removeWorktree()

CICDAdapter：
  triggerPipeline()
  getDeploymentStatus()
  rollback()
```

---

## 12. 安全与治理

### 12.1 安全模型

| 层 | 机制 | 描述 |
|-------|-----------|-------------|
| **传输** | TLS 1.3 | 所有外部通信（webhook、CLI、HTTP API）通过 TLS 加密 |
| **认证** | Keycloak（OpenID Connect） | 用户通过 Keycloak 认证。服务账户使用客户端凭证。 |
| **授权** | Keycloak RBAC | 基于角色的访问：pipeline-admin、spec-author、gate-approver、viewer |
| **Webhook 验证** | HMAC-SHA256 | 通过密钥签名验证 GitHub/GitLab webhook |
| **密钥管理** | Kubernetes Secrets + 环境变量替换 | 配置文件中无密钥。所有敏感值在运行时注入。 |
| **代码生成隔离** | 每会话 Git 工作树 | 每个 OpenCode 会话在隔离的工作树中运行。无跨会话文件访问。 |
| **密钥检测** | 安全审计智能体（阶段 4） | 在审查通过前扫描生成的代码中的硬编码密钥、令牌和凭据 |
| **依赖扫描** | npm audit + CVE 数据库 | 检查生成的 package.json 依赖是否存在已知漏洞 |
| **网络隔离** | Kubernetes 网络策略 | 内部服务（Redis、MinIO、Keycloak）不对外暴露 |

### 12.2 审批门控

流水线恰好有一个手动审批门控：**阶段 6（部署）**。在部署进行之前：

1. 所有先前阶段必须已通过（绿色）
2. 审查报告必须有零个严重发现项
3. 所有测试必须通过且满足覆盖率阈值
4. OpenClaw 向指定的审批者（技术主管）发送审批请求
5. 审批者审查流水线产物（审查报告、测试结果、TDD 追踪）
6. 审批后，部署继续进行。如果在窗口内未获审批（默认：1 小时），流水线超时。

### 12.3 审计追踪

每个流水线动作产生审计追踪：

- **流水线事件**：作为 JSON 存储在 MinIO 的 `pipeline/{pipelineId}/events/` 路径
- **智能体动作**：通过 OpenTelemetry 跨度记录；可通过追踪 ID 追溯
- **TDD 证据**：`tdd-trace.json` 记录每个 RED→GREEN→REFACTOR 过渡及其测试输出
- **审查发现项**：完整的审查报告，包含每个文件、每行的发现项
- **部署决策**：金丝雀指标、审批决策、发布步骤

### 12.4 合规性

架构支持常见的合规要求：

| 要求 | 解决方式 |
|-------------|---------------|
| **职责分离** | 规格作者编写规格；技术主管批准部署；智能体执行。没有单一角色控制整个流水线。 |
| **变更可追溯性** | 每个代码变更关联到规格提交、流水线运行和 TDD 证据。从规格到生产的完整溯源。 |
| **可重现构建** | TDD 追踪记录代码生成的确切步骤。Git 提交从架构计划 + TDD 循环确定。 |
| **最小权限** | Keycloak RBAC 确保每个用户只有所需的权限。服务账户（OpenCode、OpenClaw）有作用域限制的访问。 |

### 12.5 治理策略（`.ulw/` 目录）

每个仓库中的 `.ulw/` 目录定义治理策略：

```
.ulw/
  pipeline.yml           — 每个仓库的流水线配置覆写
  review-policy.yml      — 审查阈值（按严重程度的最大发现项数）
  security-policy.yml    — 安全扫描规则和豁免
  deployment-policy.yml  — 部署门控规则和审批者列表
```

这些策略受版本控制，特定于每个仓库。当为该仓库触发流水线时，OpenClaw 网关加载这些策略。

---

## 附录 A：流水线阶段时序图

```
User        GitHub      OpenClaw     spec-parser   architect    tdd-coder     reviewer     tester      deployer    OpenCode
 │             │            │             │            │            │            │            │            │            │
 │ 提交        │            │             │            │            │            │            │            │            │
 │ spec.md ───►│            │             │            │            │            │            │            │            │
 │             │ webhook    │             │            │            │            │            │            │            │
 │             ├───────────►│             │            │            │            │            │            │            │
 │             │            │ 分派        │            │            │            │            │            │            │
 │             │            ├────────────►│            │            │            │            │            │            │
 │             │            │             │ 解析 spec  │            │            │            │            │            │
 │             │            │             │ 存储 JSON  │            │            │            │            │            │
 │             │            │◄────────────┤            │            │            │            │            │            │
 │             │            │ 分派        │            │            │            │            │            │            │
 │             │            ├─────────────┼───────────►│            │            │            │            │            │
 │             │            │             │            │ 设计       │            │            │            │            │
 │             │            │             │            │ 架构计划   │            │            │            │            │
 │             │            │◄────────────┼────────────┤            │            │            │            │            │
 │             │            │ 分派        │            │            │            │            │            │            │
 │             │            ├─────────────┼────────────┼───────────►│            │            │            │            │
 │             │            │             │            │            │ ACP 会话   │            │            │            │
 │             │            │             │            │            ├────────────┼───────────►│            │            │
 │             │            │             │            │            │            │            │ TDD 循环   │            │
 │             │            │             │            │            │            │            │◄──────────►│            │
 │             │            │             │            │            │◄───────────┼────────────┤            │            │
 │             │            │◄────────────┼────────────┼────────────┤            │            │            │            │
 │             │            │ 分派        │            │            │            │            │            │            │
 │             │            ├─────────────┼────────────┼────────────┼───────────►│            │            │            │
 │             │            │             │            │            │            │ 6 个子     │            │            │
 │             │            │             │            │            │            │ 智能体     │            │            │
 │             │            │             │            │            │            ├────────────┼───────────►│            │
 │             │            │             │            │            │            │◄───────────┼────────────┤            │
 │             │            │◄────────────┼────────────┼────────────┼────────────┤            │            │            │
 │             │            │ 分派        │            │            │            │            │            │            │
 │             │            ├─────────────┼────────────┼────────────┼────────────┼───────────►│            │            │
 │             │            │             │            │            │            │            │ 运行测试   │            │
 │             │            │             │            │            │            │            ├────────────┼───────────►│
 │             │            │◄────────────┼────────────┼────────────┼────────────┼────────────┤            │            │
 │             │            │ 审批        │            │            │            │            │            │            │
 │◄───────────┤            │◄───────────►│            │            │            │            │            │            │
 │ 批准 ────►│            ├─────────────┼────────────┼────────────┼────────────┼────────────┼───────────►│            │
 │            │            │             │            │            │            │            │            │ 部署       │
 │            │            │◄────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤            │
 │◄───────────┤            │             │            │            │            │            │            │            │
 │ 已部署！  │             │             │            │            │            │            │            │            │
```

---

## 附录 B：术语表

| 术语 | 定义 |
|------|-----------|
| **SDD** | 规约驱动开发。编写驱动整个流水线的 Markdown 规格。 |
| **TDD** | 测试驱动开发。RED→GREEN→REFACTOR 循环，在工具层面强制执行。 |
| **ACP** | 智能体通信协议。用于 OpenClaw 到 OpenCode 子会话的协议。 |
| **流水线阶段** | SDD+TDD 流水线中 6 个顺序步骤之一。 |
| **流水线运行** | 由规格提交触发的完整 6 阶段流水线的一次执行。 |
| **阶段智能体** | 负责执行一个流水线阶段的临时智能体。 |
| **子智能体** | 由阶段智能体产生以执行并行工作的智能体（例如审查子智能体）。 |
| **工作树** | Git 工作树：为智能体会话隔离的工作目录。 |
| **产物** | 由流水线阶段生成并存储在 MinIO 中的 JSON 文件。 |
| **门控** | 流水线中的手动审批点（目前仅位于阶段 6 部署）。 |
| **金丝雀** | 用于在全量发布前验证生产健康状态的小百分比部署。 |
| **OpenClaw 网关** | 处理 webhook、流水线编排和智能体分派的中央引擎。 |
| **OpenCode 运行时** | 具有 LSP 集成和测试执行的 TDD 编码环境。 |
| **MinIO** | S3 兼容的对象存储，用于流水线产物。 |
| **Zod** | TypeScript 优先的模式校验库，用于流水线事件和配置。 |

---

## 附录 C：从 v1 到 v2 的迁移路径

### C.1 v1 代码如何处理

| v1 组件 | 迁移操作 |
|-------------|-----------------|
| `packages/bc/*` | 归档。功能被流水线阶段替代。 |
| `packages/core/*` | 归档。编排移到 OpenClaw。 |
| `apps/api-gateway/` | 归档。被 OpenClaw 网关替代。 |
| `packages/shared/domain/` | 保留。由生成的代码使用。 |
| `packages/shared/types/` | 重构。移除 NATS 主题，为流水线模型简化。 |
| `packages/shared/events/` | 新建。用 Zod 事件模式替代 NATS 主题。 |
| `packages/acl/` | 简化。移除 NestJS 装饰器。保留为纯 TypeScript 接口。 |
| `agents/` | 重组。按流水线阶段重新组织（而非限界上下文）。 |
| `skills/` | 重新利用。映射到流水线阶段。 |
| `infrastructure/` | 简化。移除 PostgreSQL + NATS 资源。更新 Helm charts。 |

### C.2 分阶段方法

**阶段 1：设计定稿**（当前）
- 完成本设计文档
- 与利益相关者验证
- 确定 openclaw.config.yml 模式

**阶段 2：基础设施拆除**
- 从 docker-compose.yml 移除 PostgreSQL、NATS
- 更新 Pulumi 堆栈以移除 PostgreSQL 和 NATS 资源
- 更新 Helm charts

**阶段 3：包重组**
- 创建包含流水线状态类型的 `packages/pipeline/`
- 重构 `packages/shared/types/`
- 创建包含 Zod 模式的 `packages/shared/events/`
- 归档 `packages/bc/*` 和 `packages/core/*`

**阶段 4：智能体迁移**
- 按流水线阶段重组 `agents/` 目录
- 为流水线阶段角色重写智能体身份文件
- 将技能映射到新的智能体结构

**阶段 5：OpenClaw 集成**
- 部署 OpenClaw 网关
- 配置 webhook
- 为每个阶段连接智能体分派
- 使用示例规格测试端到端流水线

**阶段 6：验证与发布**
- 在现有项目上运行完整流水线
- 对照 v1 基线测量周期时间
- 迭代优化智能体质量和流水线性能

---

> **文档状态**：草案 v2.0 — 2026-04-30
> **后续步骤**：利益相关者审查、基础设施拆除规划、OpenClaw 集成冲刺。
```
