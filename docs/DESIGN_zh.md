# ulw (UltraWork) — AI 驱动的全流程研发平台设计文档

> **本文档为 [English Version](DESIGN.md) 的中文译本。如有歧义，以英文版本为准。**
> **版本**: v1.0  
> **日期**: 2026-04-28  
> **状态**: 草案  
> **目标团队规模**: 100+ 开发者  
> **目标部署环境**: Kubernetes 集群  
> **核心语言**: TypeScript  

---

## 目录

1. [项目概述与愿景](#1-项目概述与愿景)
2. [系统架构设计](#2-系统架构设计)
3. [DDD 领域设计](#3-ddd-领域设计)
4. [多智能体协作架构](#4-多智能体协作架构)
5. [TDD 测试框架设计](#5-tdd-测试框架设计)
6. [自动化代码审查模块](#6-自动化代码审查模块)
7. [API 自动测试模块](#7-api-自动测试模块)
8. [CI/CD 流水线设计](#8-cicd-流水线设计)
9. [技术栈](#9-技术栈)
10. [数据流与集成](#10-数据流与集成)
11. [实施路线图](#11-实施路线图)
12. [安全与治理](#12-安全与治理)

---

## 1. 项目概述与愿景

### 1.1 愿景声明

**ulw (UltraWork)** 是一个由 AI 智能体驱动的智能化研发生命周期平台，形成闭环自动化系统：**架构设计 → 代码开发 → 智能审查 → 自动化测试 → 一键部署**。通过多智能体协作架构集成 OpenCode 开发引擎和 OpenClaw 审查引擎，ulw 消除了困扰传统软件交付的手动瓶颈。

### 1.2 核心价值主张

| 痛点 | ulw 解决方案 | 预期效果 |
|------------|-------------|-----------------|
| 架构实现困难 | DDD 限界上下文 + 管家智能体在智能体层面强制架构边界 | 100% 架构合规 |
| 编码标准不一致 | TDD 状态机配合文件写入门控确保测试优先纪律；代码审查智能体按 BC 执行风格规范 | 统一代码质量 |
| 人工代码审查效率低 | 6 智能体审查流水线在 2-5 分钟内处理每个 PR | 审查延迟降低 90% |
| API 测试工作量大 | OpenAPI 规范 → AI 自动生成快乐路径 + 负面 + 认证变体测试 | QA 工作量减少 80% |
| 部署流程复杂 | 5 门控 CI/CD 流水线，支持金丝雀部署和自动回滚 | 生产部署零触碰 |
| 交付周期长且质量不稳定 | 全 AI 驱动闭环；仅在审批门控处需要人工参与 | 周期时间缩短 70% |

### 1.3 目标用户画像

| 角色 | 职责 | 主要交互 |
|---------|------|-------------------|
| **技术负责人** | 架构所有者，门控审批人 | 定义限界上下文，审查 AI 生成的架构，在门控 5 审批 PR |
| **高级开发者** | 功能实现者 | 编写微规格，触发 AI 编码智能体，验证生成的代码 |
| **QA 工程师** | 测试策略负责人 | 审查 AI 生成的测试场景，定义契约测试策略，审批测试套件 |
| **DevOps 工程师** | 流水线运营者 | 管理 CI/CD 基础设施，监控智能体健康，处理事件响应 |

### 1.4 北极星指标

**端到端交付周期时间** — 从功能规格到生产部署，目标相比基线缩短 70%。

### 1.5 设计原则

1. **智能体优先**：每个开发工作流都由智能体可执行；人类是审查者和审批者，而非执行者
2. **契约驱动**：所有组件间通信由机器可读的契约管理（OpenAPI、Protobuf、事件模式）
3. **测试优先，始终如此**：没有失败测试先行，就不存在生产代码（在工具层面强制执行）
4. **领域对齐**：智能体职责与 DDD 限界上下文一一对应；不存在跨上下文智能体歧义
5. **默认可观测**：每个智能体动作产生不可变的审计事件；每个流水线阶段发出指标

---

## 2. 系统架构设计

### 2.1 架构概述

ulw 采用**分层微服务架构**，由集中式编排引擎协调专门的智能体运行时。系统运行在 Kubernetes 上，以实现水平可扩展性、容错性和基础设施即代码管理。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INTERFACES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ GitHub   │  │ GitLab   │  │  Slack   │  │  VS Code │  │  REST    │  │
│  │ Webhooks │  │ Webhooks │  │ Notify   │  │ Extension│  │  API     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └──────────────┴─────────────┴─────────────┴─────────────┘        │
│                                    │                                     │
├────────────────────────────────────┼────────────────────────────────────┤
│                          API GATEWAY LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │     Kong / NGINX Ingress — Auth, Rate Limiting, Routing, TLS      │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │                                        │
├─────────────────────────────────┼───────────────────────────────────────┤
│                      ORCHESTRATION ENGINE                               │
│  ┌──────────────────────────────┴───────────────────────────────────┐   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   │
│  │  │  Orchestrator   │→ │   Supervisor     │→ │  Workflow      │  │   │
│  │  │  (Brain)        │  │   (Heart)        │  │  Engine        │  │   │
│  │  │  Stateless      │  │   Stateful       │  │  (DAG Executor)│  │   │
│  │  └─────────────────┘  └──────────────────┘  └────────────────┘  │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │                                        │
├─────────────────────────────────┼───────────────────────────────────────┤
│                        AGENT RUNTIME LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  OpenCode    │  │  OpenClaw    │  │  Test        │  │  Deploy    │  │
│  │  Runtime     │  │  Runtime     │  │  Runtime     │  │  Runtime   │  │
│  │  (Dev)       │  │  (Review)    │  │  (QA)        │  │  (CI/CD)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                │          │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────┴──────┐  │
│  │ Agent Teams  │  │ Webhook +    │  │ Test Gen +   │  │ Canary +   │  │
│  │ + Worktrees  │  │ ACP Pipeline │  │ Contract Mgr │  │ Rollback   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                         DATA & KNOWLEDGE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ PostgreSQL   │  │ Redis        │  │ NATS         │  │ MinIO      │  │
│  │ (Domain +    │  │ (Cache +     │  │ (Event Bus + │  │ (Artifact  │  │
│  │  Agent State)│  │  Sessions)   │  │  Streaming)  │  │  Store)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                      OBSERVABILITY LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ OpenTelemetry│  │ Prometheus   │  │ Grafana      │  │ ELK Stack  │  │
│  │ (Tracing)   │  │ (Metrics)    │  │ (Dashboards) │  │ (Audit Log)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 各层职责

| 层 | 组件 | 职责 |
|-------|-----------|---------------|
| **外部接口** | GitHub/GitLab Webhooks、Slack、IDE 扩展、REST API | 入站触发器和用户交互点 |
| **API 网关** | Kong Ingress | 身份认证、速率限制、请求路由、TLS 终止 |
| **编排引擎** | 编排器 + 监督器 + 工作流引擎 | 任务分解、智能体分配、DAG 执行、重试管理 |
| **智能体运行时** | OpenCode 运行时 | AI 驱动的代码生成，带 TDD 护栏和 Git 工作树隔离 |
| | OpenClaw 运行时 | 多智能体代码审查流水线，PR Webhook 处理 |
| | 测试运行时 | 从 OpenAPI 规范生成测试、契约测试、测试执行 |
| | 部署运行时 | 金丝雀部署、渐进式发布、自动回滚 |
| **数据与知识** | PostgreSQL + Redis + NATS + MinIO | 领域持久化、缓存、事件流式传输、工件存储 |
| **可观测性** | OpenTelemetry + Prometheus + Grafana + ELK | 分布式追踪、指标、仪表盘、审计日志 |

### 2.3 通信模式

| 模式 | 技术 | 使用场景 |
|---------|-----------|----------|
| **同步 RPC** | gRPC / REST (NestJS) | 编排器 ↔ 监督器，API 网关 → 编排器 |
| **异步消息** | NATS JetStream | 智能体 ↔ 智能体通信、领域事件、工作流状态转换 |
| **事件流** | NATS Streaming | CI/CD 流水线事件、部署状态变更、审计事件 |
| **基于文件** | Git 工作树 + MinIO | 智能体代码输出、审查工件、测试报告 |
| **Webhook** | HTTP 回调 | GitHub/GitLab PR 事件触发审查流水线 |

### 2.4 Kubernetes 部署拓扑

```
┌──────────────────────────────────────────────────────────────┐
│                    ulw Namespace                             │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │ Orchestrator Pod    │  │ Supervisor Pod      │            │
│  │ (Deployment x2)     │  │ (StatefulSet x3)    │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                              │
│  ┌─────────────────────────────────────────────┐             │
│  │ Agent Runtime Pool (Job per task)           │             │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │             │
│  │  │OpenCode  │  │OpenClaw  │  │Test      │   │             │
│  │  │Job       │  │Job       │  │Job       │   │             │
│  │  └──────────┘  └──────────┘  └──────────┘   │             │
│  │     ... up to N concurrent agent jobs       │             │
│  └─────────────────────────────────────────────┘             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │PostgreSQL│  │Redis     │  │NATS      │  │MinIO     │    │
│  │(HA)      │  │(Cluster) │  │(Cluster) │  │(HA)      │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │ Observability Stack                      │               │
│  │  OTel Collector → Tempo + Prometheus +   │               │
│  │  Grafana + Elasticsearch                 │               │
│  └──────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

### 2.5 基础设施即代码策略

所有 Kubernetes 资源均通过 **Pulumi (TypeScript)** 定义，实现：
- 声明式基础设施，具备完整的 TypeScript 类型安全
- GitOps 工作流：基础设施变更经过 PR → 审查 → 应用流程
- 基于栈配置的多环境管理（开发/预发布/生产）
- 通过 HashiCorp Vault 集成进行密钥管理

---

## 3. DDD 领域设计

### 3.1 领域分类

ulw 的领域模型遵循 Eric Evans 的战略 DDD 模式，根据每个子域对平台的战略价值进行分类。这种分类驱动投资优先级、团队分配和自建与采购决策。

```
                     ┌─────────────────────────────────────────────┐
                     │            DOMAIN STRATEGY MAP              │
                     ├──────────────┬──────────────┬───────────────┤
                     │    CORE      │  SUPPORTING  │   GENERIC     │
                     │ (Competitive │ (Essential   │ (Commodity,   │
                     │  Advantage)  │  but Not     │  Buy Not      │
                     │              │  Unique)     │  Build)       │
                     ├──────────────┼──────────────┼───────────────┤
                     │ Code Gen     │ Project Mgmt │ Deployment    │
                     │ Code Review  │ Arch Design  │               │
                     │              │ Test Auto    │               │
                     └──────────────┴──────────────┴───────────────┘
```

#### 3.1.1 核心领域（自建，差异化）

| 领域 | 战略价值 | 为何是核心 |
|--------|----------------|----------|
| **代码生成** | 主要价值驱动力 — AI 智能体编写生产级 TypeScript 代码 | 独特的 TDD 状态机、上下文感知生成、工作树隔离 — 现成的 LLM 工具无法复制 |
| **代码审查** | 所有进入系统的代码的质量门控 | 多智能体审查流水线（分析器 + 评论家 + 策略）、契约感知审查、门控合并 — ulw 值得信赖的质量品牌 |

这两个领域获得最高的投资：专门的管家智能体、定制模型微调预算以及智能体调度队列中的优先级。

#### 3.1.2 支撑领域（自建，标准投资）

| 领域 | 战略价值 | 为何是支撑 |
|--------|----------------|---------------|
| **项目管理** | 跟踪交付状态，向用户展示进度 | 工作流编排所必需，但使用成熟的模式（故事生命周期、冲刺看板） |
| **架构设计** | 将系统设计意图捕获为机器可读的规格 | 连接人类架构师意图与智能体执行；领域逻辑是映射而非算法 |
| **测试自动化** | 与代码审查一起确保质量 | 测试生成有价值但遵循既定模式（OpenAPI → 测试、契约测试） |

这些领域获得专门的管家智能体，但重用通用基础设施。它们可能集成外部工具（Jira、Swagger UI）。

#### 3.1.3 通用领域（采购或集成）

| 领域 | 策略 | 理由 |
|--------|----------|-----------|
| **部署** | 通过薄 TypeScript 层封装 Kubernetes API 和 ArgoCD | CI/CD 是一个已充分解决的问题。ulw 的智能体层在现有工具之上增加审批门控和回滚策略 |

部署领域通过防腐层处理，封装 ArgoCD/GitHub Actions API，使智能体模型免受供应商特定细节的影响。

### 3.2 限界上下文

六个限界上下文（BC）与上述领域一一对应。每个 BC 拥有自己的数据、逻辑和智能体运行时。不允许跨 BC 数据库访问 — 所有集成通过事件或 API 调用进行。

#### BC-1: 项目管理 (PM)

| 方面 | 定义 |
|--------|-----------|
| **职责** | 管理项目生命周期：故事创建、冲刺规划、待办事项梳理、里程碑跟踪。展示交付仪表盘和进度指标 |
| **拥有的数据** | 故事、任务、冲刺、里程碑、开发者分配、速度指标 |
| **关键触发器** | GitHub 问题 webhook / REST API 故事创建 |
| **输出事件** | `StoryReady`（输入架构设计）、`SprintCommitted`（触发生成循环） |
| **智能体** | PM-Steward |

#### BC-2: 架构设计 (AD)

| 方面 | 定义 |
|--------|-----------|
| **职责** | 将用户故事转换为架构规格：DDD 上下文映射、聚合设计、API 契约、数据模型。输出供代码生成使用的机器可读规格 |
| **拥有的数据** | 架构规格、上下文映射、API 模式（OpenAPI/Protobuf）、数据模型、技术栈决策 |
| **关键触发器** | 来自 PM 的 `StoryReady` 事件 |
| **输出事件** | `ArchitectureApproved`（触发代码生成）、`ContractPublished`（输入测试自动化） |
| **智能体** | AD-Steward |

#### BC-3: 代码生成 (CG)

| 方面 | 定义 |
|--------|-----------|
| **职责** | 使用 TDD 状态机从架构规格生成生产代码。强制测试优先纪律：没有预先存在的失败测试就不允许文件写入 |
| **拥有的数据** | 生成的源文件、测试文件、生成追踪、TDD 状态转换 |
| **关键触发器** | `ArchitectureApproved` 事件 |
| **输出事件** | `CodeReady`（创建 PR，触发代码审查） |
| **智能体** | CG-Steward + 专家：代码审查员、TDD 测试智能体 |
| **隔离** | 每个生成任务的 Git 工作树 — 生成的代码写入隔离的分支 |

#### BC-4: 代码审查 (CR)

| 方面 | 定义 |
|--------|-----------|
| **职责** | 多智能体自动化代码审查：静态分析、风格执行、安全扫描、架构合规性检查。在每个 PR 上运行 |
| **拥有的数据** | 审查报告、差异分析、违规记录、审批状态 |
| **关键触发器** | `CodeReady` 事件 / GitHub PR webhook |
| **输出事件** | `ReviewPassed` 或 `ReviewFailed`（反馈回 CG 或转发到测试） |
| **智能体** | CR-Steward + 专家：安全审计员、契约验证员 |
| **集成** | OpenClaw 运行时：分析器 → 评论家 → 策略审查流水线 |

#### BC-5: 测试自动化 (TA)

| 方面 | 定义 |
|--------|-----------|
| **职责** | 生成并执行测试套件：来自 TDD 的单元测试、来自 OpenAPI 规范的集成/API 测试、契约测试、E2E 场景。管理测试环境配置 |
| **拥有的数据** | 测试用例、测试结果、覆盖率报告、契约测试套件、环境配置 |
| **关键触发器** | `ReviewPassed` 事件、来自 AD 的 `ContractPublished` |
| **输出事件** | `TestPassed` 或 `TestFailed`（输入到部署） |
| **智能体** | TA-Steward |

#### BC-6: 部署 (DP)

| 方面 | 定义 |
|--------|-----------|
| **职责** | 管理 CI/CD 流水线：构建、容器化、金丝雀部署、监控、回滚。封装 Kubernetes 和 ArgoCD |
| **拥有的数据** | 流水线运行、部署状态、发布版本、回滚历史、金丝雀指标 |
| **关键触发器** | `TestPassed` 事件 + 人工审批 |
| **输出事件** | `Deployed`（版本发布到生产）、`DeployFailed`（触发回滚） |
| **智能体** | DP-Steward + 专家：部署智能体 |

### 3.3 上下文映射

限界上下文之间的关系使用标准 DDD 上下文映射模式定义。下面的 ASCII 图展示了所有六个 BC 及其集成模式。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ULW CONTEXT MAP (v1.0)                           │
│                                                                         │
│  ┌──────────────┐       O───────────────O       ┌──────────────┐       │
│  │  Project     │───────│   Partnership   │──────│ Architecture │       │
│  │  Management  │       O───────────────O       │   Design     │       │
│  └──────┬───────┘                               └──────┬───────┘       │
│         │                                               │               │
│         │                               ┌───────────────┴───────┐       │
│         │                               │   Customer-Supplier   │       │
│         │                               │   AD → CG (Supplier)  │       │
│         │                               └───────────────┬───────┘       │
│         │                                               │               │
│         │       ┌───────────────────────────────┐       │               │
│         └───────│       Code Generation         │◄──────┘               │
│                 │           (Core)              │                       │
│                 └──────────┬──────────┬─────────┘                       │
│                            │          │                                  │
│              ┌─────────────┘          └─────────────┐                    │
│              │                                      │                    │
│              ▼                                      ▼                    │
│  ┌───────────────────┐                  ┌───────────────────┐           │
│  │   Code Review     │   ACL(S)         │  Test Automation  │           │
│  │     (Core)        │◄────────────────►│  (Supporting)     │           │
│  │                   │   Published      │                   │           │
│  │  OpenClaw         │   Language       │  OpenAPI Specs    │           │
│  │  Analyzer→Critic  │   (OpenAPI)      │  as shared lang   │           │
│  │  →Policy Pipeline │                  │                   │           │
│  └──────────┬────────┘                  └──────────┬────────┘           │
│             │                                      │                    │
│             │              ┌──────────────┐        │                    │
│             └──────────────│ Deployment   │◄───────┘                    │
│                            │  (Generic)   │                            │
│                            └──────────────┘                            │
│                                                                         │
│  LEGEND:                                                                │
│  ───────  Partnership (peers, shared goals)                             │
│  ──────►  Customer-Supplier (upstream feeds downstream)                 │
│  ◄──────► ACL / Published Language (shared contract, independent impl)  │
│                                                                         │
│  EXTERNAL CONTEXT MAP:                                                   │
│                                                                         │
│  ┌──────────────┐  ACL  ┌──────────────┐  ACL  ┌──────────────┐       │
│  │  OpenCode    │◄──────│  ulw CG      │──────►│  Git         │       │
│  │  (Agent SDK) │       │  (Core)      │       │  (Storage)   │       │
│  └──────────────┘       └──────────────┘       └──────────────┘       │
│                                                                         │
│  ┌──────────────┐  ACL  ┌──────────────┐  ACL  ┌──────────────┐       │
│  │  OpenClaw    │◄──────│  ulw CR      │──────►│  CI System   │       │
│  │  (Review SDK)│       │  (Core)      │       │  (ArgoCD)    │       │
│  └──────────────┘       └──────────────┘       └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

**关系描述：**

| 关系 | 类型 | BC 对 | 描述 |
|-------------|------|---------|-------------|
| PM ↔ AD | **伙伴关系** | 项目管理 ↔ 架构设计 | 同级对等。PM 产生故事；AD 消费故事并产生规格。它们作为伙伴协商范围和技朮可行性 |
| AD → CG | **客户-供应商** | 架构设计（上游）向代码生成（下游）提供规格 | CG 是 AD 的客户。如果 AD 规格不完整，CG 将拒绝它们。AD 必须满足 CG 的需求 |
| CG → CR | **客户-供应商** | 代码生成（上游）向代码审查（下游）提供 PR | CR 审查 CG 生成的代码。失败的审查退回给 CG 修复 |
| CR ↔ TA | **发布语言** | 代码审查 ↔ 测试自动化共享 OpenAPI 契约 | 两者都消费来自 AD 的相同契约规格。契约变更通过共享的 OpenAPI 模式协调 |
| CR → DP | **客户-供应商** | 代码审查（上游）向部署（下游）提供已批准的代码 | DP 只部署已通过所有审查门控的代码 |
| TA → DP | **客户-供应商** | 测试自动化（上游）向部署提供测试通过信号 | DP 需要审查 + 测试都通过才能部署 |

**外部关系（防腐层）：**

| 关系 | 类型 | 描述 |
|-------------|------|-------------|
| OpenCode ↔ CG | **ACL** | ulw 使用特定领域的 TDD 强制层封装 OpenCode 的智能体 SDK。OpenCode 的"智能体工具调用"概念被转换为 ulw 的"TDD 状态转换" |
| CG → Git | **ACL** | 代码生成通过一个强制分支策略、提交消息约定和工作树隔离的 ACL 写入 Git |
| OpenClaw ↔ CR | **ACL** | ulw 使用特定领域的审查策略封装 OpenClaw 的 ACP 流水线。OpenClaw 的"分析"映射到 ulw 的"静态分析检查" |
| CR → CI | **ACL** | 代码审查通过一个将 ulw 审查结果转换为 CI webhook 负载的薄 ACL 触发 CI 流水线 |

### 3.4 各 BC 领域模型

每个限界上下文定义自己的领域模型，包含实体、值对象、聚合、领域事件和仓库接口。这些模型使用 TypeScript 结合 NestJS 装饰器实现，用于持久化映射。

#### BC-1: 项目管理领域模型

```
┌──────────────────────────────────────────────────────────────┐
│  PM Aggregate: Project                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: Project { id, name, vision, createdAt }     │    │
│  │  ├── Entity: Sprint { id, number, goal, start, end } │    │
│  │  │   └── Entity: Story { id, title, desc, status }   │    │
│  │  │       ├── VO: StoryPoints { value: 1|2|3|5|8|13 } │    │
│  │  │       ├── VO: Priority { enum: critical|high|... } │    │
│  │  │       └── VO: AcceptanceCriteria { text, checks }  │    │
│  │  └── VO: Velocity { sprintPoints, avg, trend }        │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Domain Events:                                              │
│  • StoryCreated { storyId, projectId, title }                │
│  • StoryReady { storyId, acceptanceCriteria, spec }          │
│  • SprintCommitted { sprintId, storyIds, velocity }          │
│  • SprintCompleted { sprintId, delivered, velocity }         │
│                                                              │
│  Repository: IProjectRepository (PostgreSQL)                 │
│  Aggregate Root: Project                                     │
└──────────────────────────────────────────────────────────────┘
```

#### BC-2: 架构设计领域模型

```
┌──────────────────────────────────────────────────────────────┐
│  AD Aggregate: ArchitectureSpec                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: ArchitectureSpec { id, version, status }    │    │
│  │  ├── VO: ContextMap { contexts[], relationships[] }  │    │
│  │  ├── Entity: AggregateDesign { name, root, ... }     │    │
│  │  │   ├── VO: DomainEvent { name, payload, producer } │    │
│  │  │   └── VO: Repository { type, methods }            │    │
│  │  ├── Entity: ApiContract { path, method, schema }    │    │
│  │  │   └── VO: OpenApiSpec { paths, components, ... }  │    │
│  │  ├── VO: DataModel { entities, relations, indexes }  │    │
│  │  └── VO: TechStack { language, framework, libs }     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Domain Events:                                              │
│  • ArchitectureProposed { specId, storyIds, contexts }       │
│  • ArchitectureApproved { specId, apiContracts[] }           │
│  • ContractPublished { contractId, openApiSpec }             │
│  • ArchitectureRejected { specId, reason, feedback }         │
│                                                              │
│  Repository: IArchitectureSpecRepository (PostgreSQL)        │
│  Aggregate Root: ArchitectureSpec                            │
└──────────────────────────────────────────────────────────────┘
```

#### BC-3: 代码生成领域模型

```
┌──────────────────────────────────────────────────────────────┐
│  CG Aggregate: GenerationTask                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: GenerationTask { id, status, specId }       │    │
│  │  ├── VO: TDDState {                                     │
│  │  │   phase: RED|GREEN|REFACTOR|VERIFIED,               │
│  │  │   currentFile,                                      │
│  │  │   constraints[]                                     │
│  │  │}                                                     │    │
│  │  ├── Entity: GeneratedFile { path, content, type }     │    │
│  │  │   └── VO: FileType { enum: test|source|config }     │    │
│  │  ├── VO: WorktreeRef { branch, path, commitHash }      │    │
│  │  └── VO: GenerationTrace {                              │    │
│  │       prompt, model, tokens, duration, parentTask       │    │
│  │  }                                                      │    │
│  ├── Entity: PullRequest { id, url, status, checks }       │    │
│  │   └── VO: PRCheck { name, status, detailUrl }           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Domain Events:                                              │
│  • GenerationStarted { taskId, specId, worktree }            │
│  • TDDTransition { taskId, from, to, file }                  │
│  • CodeGenerated { taskId, files[], worktree }               │
│  • CodeReady { taskId, prUrl, branch }                       │
│  • GenerationFailed { taskId, phase, error }                 │
│                                                              │
│  Repository: IGenerationTaskRepository (PostgreSQL)          │
│  Aggregate Root: GenerationTask                              │
└──────────────────────────────────────────────────────────────┘
```

#### BC-4: 代码审查领域模型

```
┌──────────────────────────────────────────────────────────────┐
│  CR Aggregate: ReviewSession                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: ReviewSession { id, prUrl, status, result } │    │
│  │  ├── Entity: ReviewCheck { name, status, details }   │    │
│  │  │   ├── VO: CheckType {                              │    │
│  │  │   │   enum: style|security|arch|contract|license   │    │
│  │  │   │}                                                │    │
│  │  │   └── VO: Violation { file, line, rule, severity } │    │
│  │  ├── VO: DiffAnalysis { files, additions, ... }       │    │
│  │  ├── Entity: ReviewComment { file, line, body, ... }  │    │
│  │  └── VO: ReviewSummary { passed, failed, score }      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Domain Events:                                              │
│  • ReviewStarted { sessionId, prUrl, commitSha }             │
│  • CheckCompleted { sessionId, check, passed, violations[] } │
│  • ReviewPassed { sessionId, summary, contractsOk }          │
│  • ReviewFailed { sessionId, criticalViolations[] }          │
│  • ReviewBounced { sessionId, targetBc, reason }             │
│                                                              │
│  Repository: IReviewSessionRepository (PostgreSQL)           │
│  Aggregate Root: ReviewSession                               │
└──────────────────────────────────────────────────────────────┘
```

#### BC-5: 测试自动化领域模型

```
┌──────────────────────────────────────────────────────────────┐
│  TA Aggregate: TestSuite                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: TestSuite { id, name, source, status }      │    │
│  │  ├── Entity: TestCase { path, name, type, status }   │    │
│  │  │   ├── VO: TestType {                                │    │
│  │  │   │   enum: unit|integration|contract|e2e|api      │    │
│  │  │   │}                                                │    │
│  │  │   ├── VO: TestResult { passed, output, coverage }  │    │
│  │  │   └── VO: ContractAssertion {                        │    │
│  │  │        provider, consumer, spec, status              │    │
│  │  │   }                                                  │    │
│  │  ├── Entity: EnvironmentConfig {                        │    │
│  │  │   name, vars, secrets, dependencies                  │    │
│  │  │  }                                                   │    │
│  │  └── VO: CoverageReport {                               │    │
│  │       lines, branches, functions, thresholdMet          │    │
│  │  }                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Domain Events:                                              │
│  • TestRunStarted { suiteId, env, commitSha }                │
│  • TestCaseCompleted { suiteId, testCase, result }           │
│  • TestPassed { suiteId, coverage, allGreen }                │
│  • TestFailed { suiteId, failures[], flakyDetected }         │
│  • ContractBroken { contractId, provider, consumer, diff }   │
│                                                              │
│  Repository: ITestSuiteRepository (PostgreSQL)               │
│  Aggregate Root: TestSuite                                   │
└──────────────────────────────────────────────────────────────┘
```

#### BC-6: 部署领域模型

```
┌──────────────────────────────────────────────────────────────┐
│  DP Aggregate: Release                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: Release { id, version, status, artifacts }  │    │
│  │  ├── VO: Version { major, minor, patch, build }      │    │
│  │  ├── Entity: PipelineStage { name, status, time }    │    │
│  │  │   └── VO: StageType {                               │    │
│  │  │       enum: build|image|canary|rollout|verify      │    │
│  │  │   }                                                 │    │
│  │  ├── Entity: CanaryRule {                             │    │
│  │  │   step, trafficPercent, successCriteria, ttl       │    │
│  │  │  }                                                  │    │
│  │  ├── VO: ApprovalGate {                                │    │
│  │  │   gate, approvedBy, approvedAt, type               │    │
│  │  │  }                                                  │    │
│  │  └── VO: RollbackPlan {                               │    │
│  │       targetVersion, autoTrigger, manualSteps         │    │
│  │  }                                                     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Domain Events:                                              │
│  • ReleaseCreated { releaseId, version, artifacts }          │
│  • StageCompleted { releaseId, stage, result }               │
│  • ApprovalRequired { releaseId, gate, approvers[] }         │
│  • Deployed { releaseId, version, environment }              │
│  • RollbackTriggered { releaseId, from, to, reason }         │
│  • DeployFailed { releaseId, stage, error, rollback }        │
│                                                              │
│  Repository: IReleaseRepository (PostgreSQL)                 │
│  Aggregate Root: Release                                     │
└──────────────────────────────────────────────────────────────┘
```

### 3.5 通用语言词汇表

本词汇表定义了所有 ulw 限界上下文中使用的共享词汇。每个术语具有单一精确的含义。智能体在提示、事件和文档中一致地使用这些术语。

| 术语 | 定义 | 使用于 |
|------|-----------|---------|
| **Story** | 从功能请求派生的工作单元。包含标题、描述、验收标准和故事点 | PM, AD |
| **Architecture Spec** | 定义故事或功能的 DDD 结构、API 契约和数据模型的机器可读文档 | AD, CG |
| **Aggregate Design** | DDD 聚合定义，包括聚合根、实体、值对象和不变量 | AD, CG |
| **Contract** | 在提供者和消费者服务之间共享的 API 契约（OpenAPI 3.x） | AD, TA, CR |
| **TDD State** | 测试优先周期的当前阶段：RED（测试失败）、GREEN（测试通过）、REFACTOR（清理代码）、VERIFIED（所有检查通过） | CG |
| **Worktree** | 隔离的 Git 工作树分支，生成智能体在此写入代码而不干扰其他智能体 | CG |
| **Review Session** | 单个 PR 的完整代码审查生命周期，包含多个检查和评论 | CR |
| **Violation** | 代码审查中发现的特定规则违反，包含文件、行号、严重级别和规则引用 | CR |
| **Check** | 审查会话中的单个审查维度（风格、安全、架构、契约） | CR |
| **Test Suite** | 针对特定范围（单元、集成、契约、E2E）的测试用例集合 | TA |
| **Contract Assertion** | 验证提供者-消费者契约是否被双方满足的检查 | TA |
| **Release** | 带版本号的部署单元，包含完整的流水线运行和审批历史 | DP |
| **Canary Rule** | 渐进式流量转移规则，定义金丝雀部署的步长、成功标准和 TTL | DP |
| **Approval Gate** | 部署流水线中的人工决策点，需要明确的审批才能继续 | DP |
| **Generation Trace** | 代码生成事件的完整来源记录：提示、模型、消耗的令牌、持续时间、父任务 | CG (audit) |
| **Agent Identity** | 定义智能体目的、能力和约束的 SOUL.md + AGENTS.md + TOOLS.md 三元组 | All BCs |
| **Brain / Heart** | 架构分离：大脑（编排器，无状态，决策）vs 心脏（监督器，有状态，记忆） | Orchestration |
| **Steward Agent** | 负责单个限界上下文的智能体。每个 BC 一个管家 | All BCs |
| **Specialist Agent** | 具有狭窄技能（审查员、测试员、部署员）的专注智能体，由管家调用 | CG, CR, TA, DP |
| **Dream Team** | 为需要跨 BC 协作的复杂任务形成的临时多智能体团队 | All BCs |
| **ACP Sub-Session** | OpenClaw 的分析-评论-策略流水线：分析器发现问题，评论家排优先级，策略执行规则 | CR |

### 3.6 防腐层

ULW 与四个外部系统集成 — OpenCode、OpenClaw、Git 和 CI/CD — 每个都通过专门的防腐层（ACL）进行。这些 ACL 防止外部领域概念泄漏到 ulw 领域模型中。

#### 3.6.1 OpenCode ACL

OpenCode 提供智能体运行时（命令执行、文件操作、LLM 调用），但将所有内容框架化为通用的"智能体工具调用"。ulw 的 CG 领域需要 TDD 特定的语义。

```
┌─────────────────────────────────────────────────────────────────────┐
│  OpenCode ACL — UlwCodeAdapter                                       │
│                                                                      │
│  External (OpenCode)             Internal (ulw CG)                   │
│  ┌─────────────────────┐         ┌──────────────────────────┐        │
│  │ agent.tool_call()   │ ──────► │ tddMachine.transition()   │        │
│  │   type: 'write'     │  ACL    │   phase: RED→GREEN        │        │
│  │   file: 'foo.ts'    │  maps   │   file: 'foo.ts'          │        │
│  │   content: '...'    │         │   test: 'foo.test.ts'     │        │
│  └─────────────────────┘         └──────────────────────────┘        │
│                                                                      │
│  Mappings:                                                            │
│  • OpenCode "agent spawn" → ulw "TDD session start"                  │
│  • OpenCode "file write" → ulw "TDD state transition"                │
│  • OpenCode "shell command" → ulw "test execution"                   │
│  • OpenCode "read file" → ulw "context gathering"                    │
│                                                                      │
│  Guard Rules (enforced by ACL):                                      │
│  1. No file write unless TDD state is RED and a test file exists     │
│  2. No branch switch unless generation task owns the worktree        │
│  3. No LLM call without a valid generation trace context             │
└─────────────────────────────────────────────────────────────────────┘
```

**TypeScript 实现草图：**

```typescript
// packages/acl/opencode/src/ulw-code-adapter.ts
export class UlwCodeAdapter {
  constructor(
    private openCodeRuntime: OpenCodeRuntime,
    private tddMachine: TDDStateMachine,
    private auditLogger: AuditLogger,
  ) {}

  async handleGenerationTask(task: GenerationTask): Promise<GenerationResult> {
    const worktree = await this.worktreeManager.create(task.id);

    // Phase 1: RED — generate failing test first
    const testFile = await this.openCodeRuntime.generate({
      prompt: buildTestPrompt(task.spec),
      worktree: worktree.path,
      constraints: { tddPhase: 'RED' },
    });
    this.tddMachine.transition(task.id, 'RED', testFile);
    await this.auditLogger.log('tdd.transition', { task: task.id, phase: 'RED' });

    // Phase 2: GREEN — generate code to pass the test
    // ...enforced by ACL guard: write blocked if no RED-phase test exists

    return { files, traces };
  }
}
```

#### 3.6.2 OpenClaw ACL

OpenClaw 的审查流水线（ACP：分析器 + 评论家 + 策略）生成原始的审查工件。Ulw 需要将这些映射到领域级别的概念：违规、检查和审查会话。

```
┌─────────────────────────────────────────────────────────────────────┐
│  OpenClaw ACL — UlwReviewAdapter                                     │
│                                                                      │
│  External (OpenClaw)              Internal (ulw CR)                  │
│  ┌──────────────────────┐         ┌─────────────────────────┐       │
│  │ ACP Sub-Session      │ ──────► │ ReviewSession            │       │
│  │  ├─ AnalyzerResult   │  ACL    │  ├─ Check: style        │       │
│  │  ├─ CriticResult     │  maps   │  ├─ Check: security     │       │
│  │  └─ PolicyResult     │         │  ├─ Check: arch         │       │
│  └──────────────────────┘         │  └─ Violations[]        │       │
│                                    └─────────────────────────┘       │
│                                                                      │
│  Mappings:                                                            │
│  • OpenClaw AnalyzerResult → ulw ReviewCheck with violations         │
│  • OpenClaw CriticResult → ulw ReviewSummary with priority           │
│  • OpenClaw PolicyResult → ulw Check.status (pass/fail/bounce)      │
│  • OpenClaw review scope → ulw DiffAnalysis                          │
│                                                                      │
│  Guard Rules:                                                         │
│  1. All ACP phases must complete before review result is accepted    │
│  2. Critical violations trigger automatic bounce (PR returned to CG) │
│  3. Policy override requires human Tech Lead approval                │
└─────────────────────────────────────────────────────────────────────┘
```

**TypeScript 实现草图：**

```typescript
// packages/acl/openclaw/src/ulw-review-adapter.ts
export class UlwReviewAdapter {
  constructor(private openClawRuntime: OpenClawRuntime) {}

  async runReview(diff: DiffAnalysis, contracts: ApiContract[]): Promise<ReviewResult> {
    const session = this.openClawRuntime.createACPSession({
      diff,
      rules: this.loadReviewPolicies(),
      contracts,
    });

    // ACP pipeline runs asynchronously with status callbacks
    const [analyzerResult, criticResult, policyResult] = await Promise.all([
      session.analyze(),
      session.critic(),
      session.policy(),
    ]);

    return this.toReviewDomain(analyzerResult, criticResult, policyResult);
  }

  private toReviewDomain(
    analyzer: AnalyzerResult,
    critic: CriticResult,
    policy: PolicyResult,
  ): ReviewResult {
    return {
      checks: analyzer.checks.map(c => ({
        name: c.checkType,
        status: this.mapCheckStatus(c, policy),
        violations: c.violations.map(v => ({
          file: v.location.file,
          line: v.location.line,
          rule: v.ruleId,
          severity: v.severity,
        })),
      })),
      summary: {
        passed: policy.approved,
        score: critic.priorityScore,
        ...(policy.bounceReason && { bounced: true, reason: policy.bounceReason }),
      },
    };
  }
}
```

#### 3.6.3 Git ACL

ulw 的代码生成 BC 通过一个强制严格分支隔离和提交约定的 ACL 写入代码。原始 Git 命令从不暴露给智能体。

```typescript
// packages/acl/git/src/ulw-git-adapter.ts
export class UlwGitAdapter {
  constructor(private gitClient: SimpleGit) {}

  async createWorktree(taskId: string, baseBranch: string): Promise<WorktreeRef> {
    const branch = `ulw/gen/${taskId}/${Date.now()}`;
    await this.gitClient.fetch();
    await this.gitClient.worktree(`/tmp/ulw/${taskId}`, branch, { baseBranch });
    return { branch, path: `/tmp/ulw/${taskId}` };
  }

  async createPullRequest(worktree: WorktreeRef, spec: ArchitectureSpec): Promise<PRResult> {
    await this.gitClient.cwd(worktree.path).add('.');
    await this.gitClient.commit(`feat(${spec.boundedContext}): ${spec.title}\n\nSpec: ${spec.id}\n`);
    await this.gitClient.push('origin', worktree.branch);
    const pr = await this.gitClient.pr.create({ base: 'main', head: worktree.branch });
    return { url: pr.url, id: pr.id };
  }
}
```

#### 3.6.4 CI/CD ACL

对 Kubernetes/ArgoCD 的部署命令被封装在一个 ACL 中，该 ACL 在任何生产变更之前增加审批门控强制执行。

```typescript
// packages/acl/cicd/src/ulw-cicd-adapter.ts
export class UlwCicdAdapter {
  constructor(
    private k8sClient: K8sClient,
    private argoClient: ArgoClient,
  ) {}

  async deploy(release: Release): Promise<DeployResult> {
    await this.verifyApprovalGates(release);
    const imageTag = `ulw/${release.project}:${release.version}`;
    await this.k8sClient.setImage('deployment', release.service, imageTag);
    const canaryResult = await this.argoClient.rollout({
      strategy: 'canary',
      steps: release.canaryRules.map(r => ({
        weight: r.trafficPercent,
        pause: { duration: r.ttl },
      })),
    });
    return { status: canaryResult.status, url: canaryResult.url };
  }
}
```

每个 ACL 都可以独立测试。每个都有用于单元测试的 mock 实现和通过 NestJS 依赖注入容器连接的生产实现。ACL 是外部系统概念进入 ulw 领域的唯一入口点。

## 4. 多智能体协作架构

### 4.1 智能体层级

ulw 以四层层级组织智能体，将战略性决策制定（大脑）与操作性执行和状态管理（心脏）分离开来。这种分离是使平台能够扩展到 100+ 开发者而不会让任何单个智能体认知超载的核心架构选择。

```
                      ┌─────────────────────────────────────┐
                      │        AGENT HIERARCHY (v1.0)       │
                      │                                     │
                      │  TIER 1: ORCHESTRATOR (Brain)        │
                      │  ┌───────────────────────────────┐   │
                      │  │  Stateless · Strategic Only    │   │
                      │  │  "What to do, in what order"   │   │
                      │  │  No memory of past sessions    │   │
                      │  │  Scaled horizontally (x2 pods) │   │
                      │  └──────────────┬────────────────┘   │
                      │                 │                     │
                      │  TIER 2: SUPERVISOR (Heart)          │
                      │  ┌───────────────────────────────┐   │
                      │  │  Stateful · Tactical Memory    │   │
                      │  │  "Who did what, what failed"   │   │
                      │  │  StatefulSet (x3 pods, Raft)  │   │
                      │  │  Session store, retry queues   │   │
                      │  └──────────────┬────────────────┘   │
                      │                 │                     │
                      │  TIER 3: STEWARDS (per BC)           │
                      │  ┌──────┬──────┬──────┬──────┬──...  │
                      │  │ PM   │ AD   │ CG   │ CR   │ TA DP │
                      │  │Stew. │Stew. │Stew. │Stew. │Stew.  │
                      │  └──────┴──────┴──────┴──────┴──────┘│
                      │          │         │                  │
                      │  TIER 4: SPECIALISTS                  │
                      │  ┌──────────┐ ┌──────────┐ ┌──────┐  │
                      │  │  Code    │ │ Security │ │Deploy│  │
                      │  │  Review  │ │ Auditor  │ │Agent │  │
                      │  └──────────┘ └──────────┘ └──────┘  │
                      │  ┌──────────┐ ┌──────────┐           │
                      │  │ TDD Test │ │ Contract │           │
                      │  │  Agent   │ │ Validator│           │
                      │  └──────────┘ └──────────┘           │
                      └─────────────────────────────────────┘
```

#### 4.1.1 大脑-心脏分离原理

大脑-心脏的分离由三个从 100+ 开发者用例中产生的约束驱动：

**1. 快速失败 vs. 慢速恢复。** 编排器（大脑）设计为无状态。如果它崩溃，新的 Pod 立即接手下一个任务 — 无需恢复状态，无需重放会话。监督器（心脏）在 Raft 共识 StatefulSet 中持有所有会话状态。如果监督器 Pod 失败，Raft 选举新的领导者并保留状态。这意味着决策层中的瞬时错误对用户不可见，而状态层可以在 Pod 故障中存活。

**2. 认知负载分离。** 大脑一次做一个决策："给定当前工作流状态，下一个任务是什么，应该由哪个智能体来做？" 心脏追踪 N 个并发会话、它们的历史、重试次数和结果。如果大脑持有状态，它需要为每个决策重新加载完整的会话上下文，这会增加延迟和令牌成本。将它们分开使每个智能体的上下文窗口保持专注。

**3. 独立扩缩维度。** 大脑按请求量扩缩（更多工作流 → 更多编排器 Pod）。心脏按会话数扩缩（更多并发智能体 → 更多监督器 Pod）。这些是不同的指标，在不同时间达到峰值。分离让每一层独立自动扩缩。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Brain-Heart Comparison                                                  │
│                                                                          │
│  Aspect              Orchestrator (Brain)    Supervisor (Heart)          │
│  ─────────────────────────────────────────────────────────────────────   │
│  State               Stateless               Stateful (Raft cluster)    │
│  Persistence         None                    PostgreSQL + Redis          │
│  Scaling             Horizontal (Deployment)  StatefulSet (x3 min)      │
│  Failure Impact      Drops current decision   Preserves all sessions    │
│  Context Window      Single task               All active sessions      │
│  Decision Scope      "What next?"             "What happened?"          │
│  Communication       gRPC to Supervisor       NATS pub/sub to agents    │
│  Model Cost          Low (small prompts)      Medium (aggregation)      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 智能体身份模型

ulw 中的每个智能体 — 从编排器到专家 — 都携带一个三文件身份定义，存储在智能体的主目录中。此模型受 OpenCode 的技能系统启发，但扩展为支持层级智能体关系和领域特定约束。

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT IDENTITY STRUCTURE                                           │
│                                                                      │
│  /agents/<agent-name>/                                               │
│  ├── SOUL.md      — Who the agent is (purpose, personality, ethics) │
│  ├── AGENTS.md    — Who the agent works with (peers, hierarchy)     │
│  └── TOOLS.md     — What the agent can do (tools, permissions)      │
│                                                                      │
│  Each file is a structured prompt fragment loaded into the agent's   │
│  system prompt at instantiation time. Together they form the         │
│  agent's complete identity context.                                  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.1 SOUL.md — 智能体目的与性格

定义智能体的基本性质：其角色、价值观、约束和伦理边界。每个智能体决策都可以追溯到其 SOUL 定义。

**示例：CG-Steward SOUL.md**

```markdown
# CG-Steward SOUL

## Identity
I am the Code Generation Steward. I own the Code Generation bounded context.
My purpose is to translate approved architecture specifications into
production-quality TypeScript code following TDD discipline.

## Core Values
1. **Test-first, always.** I never write production code before a failing test exists.
2. **Architecture fidelity.** Every file I generate must match the ArchitectureSpec
   I was given — no scope creep, no extra abstractions.
3. **Traceability.** Every generation event is logged with full provenance
   (prompt, model, tokens, parent task).

## Constraints
- I operate within the CG worktree sandbox. I never modify files outside it.
- I cannot approve my own output. All generated code must pass Code Review.
- I cannot deploy. Deployment is the DP-Steward's responsibility.

## Ethics
- I do not generate code that bypasses security review.
- I do not commit secrets, credentials, or test data to code.
- If a specification is ambiguous, I stop and ask the AD-Steward for clarification
  rather than guessing.
```

**示例：CR-Steward SOUL.md**

```markdown
# CR-Steward SOUL

## Identity
I am the Code Review Steward. I own the Code Review bounded context.
My purpose is to ensure every line of code entering the system meets
ulw's quality, security, and architecture compliance standards.

## Core Values
1. **Fair but firm.** I apply the same rules to every PR regardless of author.
2. **Explain every violation.** Each flagged issue includes a rule reference,
   a rationale, and a suggested fix.
3. **Bounce, don't merge broken code.** If critical violations exist,
   I return the PR to the CG-Steward with clear remediation steps.

## Constraints
- I review code. I do not write code.
- I cannot override Policy decisions without a Tech Lead's explicit approval.
- I never approve my own review.

## Ethics
- I do not slow down reviews with trivial style nitpicks.
- Security violations always take priority over style violations.
- I respect the developer's time: my reviews are actionable, not academic.
```

#### 4.2.2 AGENTS.md — 智能体关系

定义智能体的同级、其在层级中的位置以及如何与其他智能体通信。这相当于多智能体系统的网络拓扑图。

**示例：编排器 AGENTS.md**

```markdown
# Orchestrator AGENTS

## My Hierarchy
- I report to: No one (I am the root agent)
- I delegate to: Supervisor (Heart)

## My Peers
- None (there is only one Orchestrator instance)

## Agent Registry
| Name         | Role                | Inbox              | Protocol      |
|--------------|---------------------|--------------------|---------------|
| Supervisor   | Execution Heart     | inbox:supervisor   | gRPC + NATS   |
| PM-Steward   | Project Management  | inbox:pm-steward   | NATS          |
| AD-Steward   | Architecture Design | inbox:ad-steward   | NATS          |
| CG-Steward   | Code Generation     | inbox:cg-steward   | NATS          |
| CR-Steward   | Code Review         | inbox:cr-steward   | NATS          |
| TA-Steward   | Test Automation     | inbox:ta-steward   | NATS          |
| DP-Steward   | Deployment          | inbox:dp-steward   | NATS          |

## Communication Rules
- I speak only to the Supervisor. I never address stewards or specialists directly.
- All task delegation goes through the Supervisor's gRPC endpoint.
- Status updates arrive via Supervisor-published NATS events.
```

**示例：CG-Steward AGENTS.md**

```markdown
# CG-Steward AGENTS

## My Hierarchy
- I report to: Supervisor (via NATS events)
- I delegate to: Code Reviewer (Specialist), TDD Test Agent (Specialist)

## My Peers (other Stewards)
| Name         | Relationship      | Inbox              | Protocol      |
|--------------|-------------------|--------------------|---------------|
| AD-Steward   | Upstream supplier | inbox:ad-steward   | NATS          |
| CR-Steward   | Downstream review | inbox:cr-steward   | NATS          |

## My Specialists
| Name             | Skill             | Inbox                | Protocol      |
|------------------|-------------------|----------------------|---------------|
| Code Reviewer    | PR review         | inbox:cg-reviewer    | NATS (local)  |
| TDD Test Agent   | Test generation   | inbox:cg-tdd-agent   | NATS (local)  |

## Communication Rules
- I request spec clarifications from AD-Steward via NATS request/reply.
- I submit PRs to CR-Steward via NATS event `CodeReady`.
- I invoke specialists within my own sandbox — they are not addressable by other stewards.
```

#### 4.2.3 TOOLS.md — 智能体能力

列出智能体可以访问的工具。每个工具映射到特定的文件范围权限或 API 端点。这是智能体操作的授权边界。

**示例：CG-Steward TOOLS.md**

```markdown
# CG-Steward TOOLS

## File System (within worktree sandbox only)
| Tool                 | Permission | Scope                  |
|----------------------|------------|------------------------|
| read_file            | allowed    | worktree/**/*.ts       |
| write_file           | allowed    | worktree/src/**/*.ts   |
| write_test_file      | required   | worktree/tests/**/*.ts |
| delete_file          | denied     | —                      |
| read_worktree_config | allowed    | worktree/ulw.json      |

## TDD State Machine
| Tool               | Permission | Description                        |
|--------------------|------------|------------------------------------|
| transition_state   | allowed    | RED→GREEN, GREEN→REFACTOR, etc.   |
| get_current_state  | allowed    | Returns phase + active file        |
| get_test_results   | allowed    | Runs test suite, returns status    |

## Communication
| Tool             | Permission | Destination            |
|------------------|------------|------------------------|
| send_event       | allowed    | NATS (ulw.events.*)   |
| request_clarify  | allowed    | inbox:ad-steward      |
| submit_for_review| allowed    | inbox:cr-steward      |

## Prohibited
- write_file outside worktree
- execute arbitrary shell commands
- access network resources outside ulw cluster
- read or modify other agents' worktrees

## Rate Limits
- Max 50 file writes per generation task
- Max 10 TDD transitions per minute
```

### 4.3 智能体类型目录

#### 4.3.1 第一层：编排器

| 属性 | 值 |
|----------|-------|
| **类型** | 编排器（大脑） |
| **实例数** | 1 个活跃（2 Pod HA，主备模式） |
| **状态** | 无状态 |
| **目的** | 所有开发者发起的工作流的入口点。接收故事/PR 触发器，将它们分解为 DAG 工作流，并将执行交给监督器 |
| **关键功能** | 工作流创建、任务分解、智能体分配、DAG 验证 |
| **通信** | gRPC（从 API 网关接收）、NATS（发布工作流事件）、gRPC（委派给监督器） |
| **LLM 模型** | GPT-4o（推理密集，一次性决策） |
| **身份** | `SOUL.md`：战略性决策制定者，"做什么和谁来做" / `AGENTS.md`：根节点 / `TOOLS.md`：工作流创建、智能体查找、DAG 验证 |

#### 4.3.2 第二层：监督器

| 属性 | 值 |
|----------|-------|
| **类型** | 监督器（心脏） |
| **实例数** | 3（Raft 共识，StatefulSet） |
| **状态** | 有状态（PostgreSQL + Redis） |
| **目的** | 管理所有活跃会话。跟踪工作流进度、智能体状态、重试队列和会话状态。系统的"记忆" |
| **关键功能** | 会话持久化、重试管理、心跳监控、死信队列处理、状态聚合 |
| **通信** | gRPC（从编排器接收）、NATS（向管家发布任务分配、接收状态事件）、PostgreSQL（会话存储）、Redis（缓存、锁） |
| **LLM 模型** | GPT-4o-mini（聚合、状态分类 — 非主要推理智能体） |
| **身份** | `SOUL.md`：可靠的状态守护者 / `AGENTS.md`：中间层，在编排器和管家之间路由 / `TOOLS.md`：会话 CRUD、智能体状态查询、重试调度 |

#### 4.3.3 第三层：管家智能体（每个 BC 一个）

**PM-Steward（项目管理）**

| 属性 | 值 |
|----------|-------|
| **领域** | 项目管理 |
| **目的** | 拥有故事生命周期。从问题 webhook 创建故事，管理冲刺待办事项，跟踪交付进度 |
| **关键功能** | 故事创建和完善、冲刺规划、速度跟踪、里程碑管理 |
| **使用的专家** | 无（PM 是自包含的） |
| **LLM 模型** | GPT-4o-mini（结构化数据、分类任务） |
| **触发事件** | GitHub 问题 webhook → `StoryCreated`，`SprintCommitted` → AD |

**AD-Steward（架构设计）**

| 属性 | 值 |
|----------|-------|
| **领域** | 架构设计 |
| **目的** | 将故事转换为机器可读的架构规格。生成 DDD 上下文映射、聚合设计、API 契约和数据模型 |
| **关键功能** | DDD 分析、上下文映射生成、API 契约编写、数据模型设计、技术栈选择 |
| **使用的专家** | 无（AD 与人类技术负责人协作以获取审批） |
| **LLM 模型** | GPT-4o（复杂推理，需要深层架构理解） |
| **触发事件** | 来自 PM 的 `StoryReady` → 向 CG 发送 `ArchitectureApproved`，向 TA 发送 `ContractPublished` |

**CG-Steward（代码生成）**

| 属性 | 值 |
|----------|-------|
| **领域** | 代码生成（核心） |
| **目的** | 执行 TDD 生成循环：给定架构规格，在 RED-GREEN-REFACTOR 周期中生成测试 → 代码 → 重构 |
| **关键功能** | TDD 状态机管理、工作树创建、代码生成编排、PR 创建 |
| **使用的专家** | 代码审查员（专家）、TDD 测试智能体（专家） |
| **LLM 模型** | Claude 4（同类最佳的代码生成，大规格的长上下文） |
| **触发事件** | 来自 AD 的 `ArchitectureApproved` → 向 CR 发送 `CodeReady` |
| **隔离** | 每个生成任务的 Git 工作树 — 完全隔离的文件系统 |

**CR-Steward（代码审查）**

| 属性 | 值 |
|----------|-------|
| **领域** | 代码审查（核心） |
| **目的** | 编排多智能体审查流水线。在每个 PR 上运行风格、安全、架构和契约检查 |
| **关键功能** | PR 差异分析、审查流水线编排、违规聚合、退回/拒绝决策 |
| **使用的专家** | 安全审计员（专家）、契约验证员（专家） |
| **LLM 模型** | Claude 4（细腻的代码理解、安全模式检测） |
| **触发事件** | 来自 CG 的 `CodeReady` / GitHub PR webhook → 向 CG 或 DP 发送 `ReviewPassed` / `ReviewFailed` |
| **集成** | OpenClaw 运行时：为每个审查维度运行 ACP 子会话 |

**TA-Steward（测试自动化）**

| 属性 | 值 |
|----------|-------|
| **领域** | 测试自动化 |
| **目的** | 生成并执行测试套件：来自 OpenAPI 规范的 API 测试、契约测试、集成测试。管理测试环境 |
| **关键功能** | 从契约生成测试用例、测试执行编排、覆盖率聚合、不稳定测试检测 |
| **使用的专家** | 无（自包含；可能调用契约验证器） |
| **LLM 模型** | GPT-4o（测试生成需要良好的模式识别） |
| **触发事件** | 来自 CR 的 `ReviewPassed` → 向 DP 发送 `TestPassed` / `TestFailed` |

**DP-Steward（部署）**

| 属性 | 值 |
|----------|-------|
| **领域** | 部署（通用） |
| **目的** | 管理 CI/CD 流水线：构建、容器化、金丝雀部署、监控、回滚 |
| **关键功能** | 流水线阶段编排、金丝雀规则评估、审批门控管理、回滚触发 |
| **使用的专家** | 部署智能体（专家） |
| **LLM 模型** | GPT-4o-mini（部署逻辑主要是确定性的；LLM 用于金丝雀分析） |
| **触发事件** | 来自 TA 的 `TestPassed` + 人工审批 → `Deployed` / `DeployFailed` |

#### 4.3.4 第四层：专家智能体

**代码审查员（专家）**

| 属性 | 值 |
|----------|-------|
| **父级** | CG-Steward |
| **目的** | 审查生成的代码的正确性、风格合规性和最佳实践，然后才进入正式的 CR 流水线 |
| **范围** | CG 工作树内的单个 PR 差异 |
| **自主权** | 向 CG-Steward 报告发现。不能独立拒绝（退回决定权在管家） |
| **LLM 模型** | Claude 4（详细的代码分析） |

**TDD 测试智能体（专家）**

| 属性 | 值 |
|----------|-------|
| **父级** | CG-Steward |
| **目的** | 在任何生产代码编写之前先生成测试文件（RED 阶段）。确保测试覆盖率满足阈值 |
| **范围** | CG 工作树内的单个生成任务 |
| **自主权** | 自主编写测试文件。生产代码生成以其测试输出为门控 |
| **LLM 模型** | Claude 4 Haiku（快速、便宜的测试生成） |

**安全审计员（专家）**

| 属性 | 值 |
|----------|-------|
| **父级** | CR-Steward |
| **目的** | 扫描代码中的安全漏洞：硬编码的密钥、注入风险、不安全的反序列化、依赖漏洞 |
| **范围** | PR 差异 + 依赖清单 |
| **自主权** | 标记违规。严重级别的违规触发自动退回 |
| **LLM 模型** | GPT-4o（安全模式识别） |

**契约验证员（专家）**

| 属性 | 值 |
|----------|-------|
| **父级** | CR-Steward / TA-Steward |
| **目的** | 验证 API 实现是否与其 OpenAPI 契约匹配。确保提供者-消费者兼容性 |
| **范围** | PR 差异 + 相关的 OpenAPI 规格 |
| **自主权** | 报告通过/失败。契约破坏始终是拒绝原因 |
| **LLM 模型** | GPT-4o-mini（结构化比较，确定性逻辑） |

**部署智能体（专家）**

| 属性 | 值 |
|----------|-------|
| **父级** | DP-Steward |
| **目的** | 执行针对 Kubernetes/ArgoCD 的部署命令。处理金丝雀步骤推进和回滚 |
| **范围** | 单个发布流水线 |
| **自主权** | 执行命令但不能绕过审批门控或跳过金丝雀步骤 |
| **LLM 模型** | 无（纯确定性工具执行器） |

### 4.4 通信协议

ulw 智能体通过四种不同的协议进行通信，每种协议适用于不同的通信模式。协议的选择取决于通信是同步还是异步、点对点还是广播、以及是否需要交付保证。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMUNICATION PROTOCOL MATRIX                                          │
│                                                                          │
│  Protocol           Type      Guarantee     Use Case                     │
│  ─────────────────────────────────────────────────────────────────────   │
│  OpenCode Teams     Async     At-least-once  Agent-to-agent messaging    │
│  P2P Inbox                    (retry queue)  (steward ↔ steward)         │
│                                                                          │
│  OpenClaw           Sync      At-most-once   Review pipeline steps       │
│  sessions_send      (blocking)               (Analyzer→Critic→Policy)    │
│  /spawn                                                                  │
│                                                                          │
│  NATS Event Bus     Async     Exactly-once   Domain events, workflow     │
│  (JetStream)                  (durable sub)  state transitions            │
│                                                                          │
│  Blackboard         Async     Best-effort    Shared state for Dream      │
│  (Redis + NATS KV)  (polling)                Team collaboration           │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.1 OpenCode Teams P2P 收件箱系统

OpenCode Agent Teams 提供一个扁平的 P2P 消息层，其中每个智能体都有一个命名的收件箱。智能体之间直接发送消息到彼此的收件箱，无需经过中央代理。ulw 在此扁平基础之上叠加其层级路由。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OpenCode Teams P2P Inbox Architecture                                  │
│                                                                          │
│  Each agent in ulw registers a named inbox when it starts:               │
│                                                                          │
│    inbox:cg-steward     → CG-Steward listens here                        │
│    inbox:cr-steward     → CR-Steward listens here                        │
│    inbox:supervisor     → Supervisor listens here                        │
│    inbox:cg-reviewer    → Code Reviewer listens here                     │
│                                                                          │
│  Message Flow (example: CG → CR):                                       │
│                                                                          │
│   CG-Steward                            CR-Steward                       │
│   ┌──────────────┐                     ┌──────────────┐                  │
│   │ Sends to:    │ ──────────────────► │ Receives from:│                 │
│   │ inbox:cr-    │   NATS JetStream    │ inbox:cg-     │                 │
│   │ steward      │   (ulw.events.cg.   │ steward       │                 │
│   │              │    code_ready)      │              │                  │
│   │ Subject:     │                     │ Validates     │                  │
│   │ ulw.events.  │                     │ and starts    │                  │
│   │ cg.code_ready│                     │ review        │                  │
│   └──────────────┘                     └──────────────┘                  │
│                                                                          │
│  Inbox naming convention:                                                │
│    inbox:<agent-role>  — used by agents on the same NATS cluster        │
│    inbox:<bc>-<role>   — used by specialists within a steward's domain  │
│                                                                          │
│  Delivery guarantees:                                                    │
│    - Messages are published to NATS JetStream with at-least-once delivery│
│    - Dead-letter queue after 3 retries (handled by Supervisor)          │
│    - Idempotency key in every message header                            │
└─────────────────────────────────────────────────────────────────────────┘
```

**TypeScript 消息信封：**

```typescript
// packages/shared/src/agent-message.ts
export interface AgentMessage<T = unknown> {
  id: string;                    // UUID, idempotency key
  source: string;                // e.g. "cg-steward"
  target: string;                // e.g. "cr-steward" (inbox name)
  subject: string;               // e.g. "ulw.events.cg.code_ready"
  timestamp: string;             // ISO 8601
  correlationId: string;         // workflow trace ID
  payload: T;
  retryCount: number;
  ttl: number;                   // seconds before dead-letter
}
```

#### 4.4.2 OpenClaw sessions_send / spawn

在代码审查 BC 中，CR-Steward 通过基于会话的同步调用与 OpenClaw 运行时交互。每个审查维度（风格、安全、架构、契约）映射到一个 ACP 子会话。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OpenClaw Review Session Protocol                                       │
│                                                                          │
│  CR-Steward                              OpenClaw Runtime               │
│  ┌────────────────────┐                  ┌────────────────────────┐     │
│  │ 1. session =        │ ──spawn()──────► │ Creates ACP Session    │     │
│  │    spawnACSession() │                  │ with Analyzer, Critic, │     │
│  │                     │                  │ Policy agents          │     │
│  │ 2. result =         │                  │                        │     │
│  │    session.analyze( │ ──send()───────► │ Runs Analyzer agent    │     │
│  │      diff, rules)   │◄─ result ────────│ Returns violations     │     │
│  │                     │                  │                        │     │
│  │ 3. result =         │                  │                        │     │
│  │    session.critic(  │ ──send()───────► │ Runs Critic agent      │     │
│  │      violations)    │◄─ result ────────│ Prioritizes findings   │     │
│  │                     │                  │                        │     │
│  │ 4. result =         │                  │                        │     │
│  │    session.policy(  │ ──send()───────► │ Runs Policy agent      │     │
│  │      prioritized)   │◄─ result ────────│ Approves/rejects/bounce│     │
│  │                     │                  │                        │     │
│  │ 5. session.close()  │ ──send()───────► │ Cleans up session      │     │
│  └────────────────────┘                  └────────────────────────┘     │
│                                                                          │
│  The CR-Steward runs 4 parallel ACP sessions (one per check type):      │
│    - Style ACP:     lint rules, formatting, naming conventions          │
│    - Security ACP:  vulnerability scanning, secret detection            │
│    - Architecture ACP:  DDD compliance, BC boundary enforcement        │
│    - Contract ACP:  OpenAPI contract compliance                        │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.3 NATS 事件总线

所有领域事件（第 3.4 节）都发布到 NATS JetStream。事件总线是限界上下文之间异步通信的骨干。

**NATS 主题层级：**

```
ulw.events.<source-bc>.<event-name>     — Standard domain events
ulw.command.<target-bc>.<command>        — Direct commands (Supervisor → Steward)
ulw.status.<agent-role>                  — Agent heartbeat and status
ulw.blackboard.<session-id>              — Dream Team shared state
ulw.audit.<event-type>                   — Immutable audit log
```

**事件流示例（完整的故事到部署）：**

```
PM                   AD                  CG                  CR                  TA                  DP
│                    │                   │                   │                   │                   │
│ StoryReady ───────►│                   │                   │                   │                   │
│  ulw.events.pm     │                   │                   │                   │                   │
│  .story_ready      │                   │                   │                   │                   │
│                    │ ArchApproved ─────►│                   │                   │                   │
│                    │  ulw.events.ad     │                   │                   │                   │
│                    │  .arch_approved    │                   │                   │                   │
│                    │                    │ CodeReady ────────►│                   │                   │
│                    │                    │  ulw.events.cg     │                   │                   │
│                    │                    │  .code_ready       │                   │                   │
│                    │                    │                    │ ReviewPassed ────►│                   │
│                    │                    │                    │  ulw.events.cr     │                   │
│                    │                    │                    │  .review_passed    │                   │
│                    │                    │                    │                    │ TestPassed ──────►│
│                    │                    │                    │                    │  ulw.events.ta    │
│                    │                    │                    │                    │  .test_passed     │
│                    │                    │                    │                    │                   │ Deployed
│                    │                    │                    │                    │                   │  ulw.events.dp
│                    │                    │                    │                    │                   │  .deployed
```

每个事件携带完整的关联上下文，以便监督器可以在任何时间点重建工作流 DAG。

#### 4.4.4 黑板共享状态

对于需要实时协作的复杂任务（梦之队模式），智能体通过 Redis 支持的黑板共享状态。黑板是一个范围限定在单个会话的键值存储。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Blackboard Architecture (per Dream Team session)                       │
│                                                                          │
│  blackboard:<session-id>:status         → "in_progress" | "failed"     │
│  blackboard:<session-id>:artifacts      → JSON array of outputs         │
│  blackboard:<session-id>:decisions      → JSON array of agent decisions │
│  blackboard:<session-id>:<agent-role>   → Per-agent scratch space       │
│                                                                          │
│  Example: Dream Team resolving a complex cross-BC issue:                │
│                                                                          │
│  CG-Steward posts:                                                       │
│    blackboard:sess_123:cg-steward = {                                    │
│      issue: "Contract mismatch in UserService.createUser",               │
│      proposed_fix: "Add optional field to request schema"                │
│    }                                                                     │
│                                                                          │
│  AD-Steward reads, responds:                                             │
│    blackboard:sess_123:ad-steward = {                                    │
│      assessment: "Breaking change — mark as v2, deprecate v1",          │
│      updated_spec: { ... }                                               │
│    }                                                                     │
│                                                                          │
│  CR-Steward validates:                                                   │
│    blackboard:sess_123:cr-steward = {                                    │
│      contract_check: "v2 compliant, no regressions"                     │
│    }                                                                     │
│                                                                          │
│  All agents watch for updates via NATS KV watch on the blackboard key.   │
│  The Supervisor monitors blackboard health and escalates stalled         │
│  sessions.                                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 编排模式

ulw 支持三种编排模式，每种适用于不同的工作流形态。编排器根据决策矩阵在工作流创建时选择模式。

#### 4.5.1 模式 1：中心辐射（默认）

单个控制器（监督器）将工作路由到工作者（管家）并收集结果。简单、可预测且易于监控。

```
                     ┌──────────────────┐
                     │   Supervisor      │
                     │   (Hub)          │
                     └──┬───┬───┬───┬───┘
                        │   │   │   │
                  ┌─────┘   │   │   └─────┐
                  ▼         ▼   ▼         ▼
               ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
               │CG    │ │CR    │ │TA    │ │DP    │
               │Stew. │ │Stew. │ │Stew. │ │Stew. │
               └──────┘ └──────┘ └──────┘ └──────┘
```

| 何时使用 | 所有线性工作流的默认模式 |
|-------------|----------------------------------|
| **优点** | 易于推理、单一监控点、简单的重试逻辑 |
| **缺点** | 中心是瓶颈，没有智能体之间直接协作 |
| **示例** | 单故事生成：AD → CG → CR → TA → DP（每个步骤等待前一个完成） |

#### 4.5.2 模式 2：DAG 工作流（并行）

监督器构建任务的有向无环图，并按照依赖顺序执行，在可能的情况下并行化。

```
        ┌──────────────────┐
        │   Start          │
        └────────┬─────────┘
                 │
          ┌──────┴──────┐
          ▼              ▼
    ┌──────────┐  ┌──────────┐
    │ CG:      │  │ TA:      │
    │ Story A  │  │ Gen Tests│
    └─────┬────┘  │ for API  │
          │       │ Changes  │
          │       └─────┬────┘
          │              │
          └──────┬───────┘
                 ▼
          ┌──────────┐
          │ CR:      │
          │ Review A │
          │ + Tests  │
          └─────┬────┘
                 ▼
          ┌──────────┐
          │ DP:      │
          │ Deploy   │
          └──────────┘
```

| 功能 | 详情 |
|---------|--------|
| **何时使用** | 多个可以并行进行独立工作项 |
| **优点** | 对于多故事工作比顺序执行更快，资源高效 |
| **缺点** | 需要依赖解析，更难调试 |
| **示例** | 冲刺批次：来自 AD 的三个故事同时获批。CG 并行生成它们。CR 一次性全部审查 |

#### 4.5.3 模式 3：梦之队（协作）

所有相关智能体在共享黑板上一起工作，直接通信而非通过监督器。用于单个智能体无法单独解决的复杂跨 BC 问题。

```
                     ┌──────────────────┐
                     │   Supervisor      │
                     │  (Observer only)  │
                     └──────────────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
      ▼                      ▼                      ▼
 ┌──────────┐         ┌──────────┐          ┌──────────┐
 │CG-Steward│◄───────►│AD-Steward│◄────────►│CR-Steward│
 │          │         │          │          │          │
 │  Direct  │◄───────►│  Direct  │◄────────►│  Direct  │
 │  NATS    │         │  NATS    │          │  NATS    │
 └──────────┘         └──────────┘          └──────────┘
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             │
                      ┌──────┴──────┐
                      │  Blackboard  │
                      │  (Redis)    │
                      └─────────────┘
```

| 功能 | 详情 |
|---------|--------|
| **何时使用** | 跨 BC 问题、架构分歧、契约不匹配解决 |
| **优点** | 复杂问题的最快解决，智能体自组织 |
| **缺点** | 更难监控，需要监督器超时，LLM 成本更高（所有智能体活跃） |
| **示例** | CR 发现两个服务之间的契约违规。AD、CG 和 CR 管家在黑板上组成梦之队，重新设计契约、重新生成代码并重新验证 |

#### 4.5.4 决策矩阵

编排器根据以下标准在工作流创建时选择编排模式：

| 标准 | 中心辐射 | DAG 工作流 | 梦之队 |
|----------|:---:|:---:|:---:|
| 涉及的 BC 数量 | 1-2 | 2-4 | 2-6 |
| 任务依赖 | 顺序 | 并行分支 | 相互依赖 |
| 需要的跨 BC 通信 | 无 | 无 | 大量 |
| 错误风险 | 低 | 中 | 高 |
| 时间敏感性 | 正常 | 快速 | 需要解决 |
| LLM 成本影响 | 最低 | 中 | 最高 |

**选择逻辑：**

```typescript
function selectPattern(workflow: Workflow): OrchestrationPattern {
  if (workflow.bcs.length > 2 && workflow.hasCrossBcIssue) {
    return 'dream-team';
  }
  if (workflow.canParallelize) {
    return 'dag';
  }
  return 'hub-and-spoke';
}
```

### 4.6 智能体隔离策略

智能体隔离防止并发智能体操作之间的干扰，将故障限制在单个智能体，并保护代码库的完整性。ulw 使用三层嵌套隔离。

#### 4.6.1 第一层：Git 工作树（代码生成）

每个 CG-Steward 生成任务在隔离的 Git 工作树中运行。工作树是一个链接到仓库的独立工作目录，共享 Git 对象存储但拥有自己的工作树和索引。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Git Worktree Isolation                                                  │
│                                                                          │
│  Repository: /repos/ulw-platform (bare)                                  │
│                                                                          │
│  Worktree: /tmp/ulw/gen-task-001/                                       │
│  ├── src/                        # Generated source code                │
│  ├── tests/                      # Generated test files                 │
│  ├── ulw.json                    # Task metadata (spec ref, TDD state)   │
│  └── .git                        # Git refs point to shared objects     │
│                                                                          │
│  Worktree: /tmp/ulw/gen-task-002/  (completely independent)             │
│  ├── src/                        # No file overlap with task-001        │
│  ├── tests/                                                                  │
│  ├── ulw.json                                                           │
│  └── .git                                                                │
│                                                                          │
│  Isolation guarantees:                                                   │
│  - Agent A cannot see Agent B's files (different filesystem paths)      │
│  - Agent A cannot interfere with Agent B's branch (different refs)      │
│  - Worktree is created on task start, deleted on task completion        │
│  - Max 10 concurrent worktrees per repository (configurable)            │
└─────────────────────────────────────────────────────────────────────────┘
```

**工作树生命周期：**

```typescript
// packages/orchestration/src/worktree-manager.ts
export class WorktreeManager {
  async acquire(repo: string, taskId: string): Promise<WorktreeLease> {
    const branch = `ulw/gen/${taskId}`;
    // Create worktree from base branch
    await this.git.worktree(`/tmp/ulw/${taskId}`, branch, { base: 'main' });
    // Register lease (with TTL)
    await this.redis.set(`worktree:${taskId}`, branch, { ttl: 3600 });
    return { path: `/tmp/ulw/${taskId}`, branch, taskId };
  }

  async release(taskId: string): Promise<void> {
    const branch = await this.redis.get(`worktree:${taskId}`);
    if (branch) {
      await this.git.worktreeRemove(`/tmp/ulw/${taskId}`);
      await this.git.branchDelete(branch);
      await this.redis.del(`worktree:${taskId}`);
    }
  }
}
```

#### 4.6.2 第二层：每智能体沙箱（运行时隔离）

每个智能体进程运行在容器级沙箱中，具有限定范围的文件系统、网络和资源限制。

| 资源 | CG-Steward | CR-Steward | TA-Steward | DP-Steward |
|----------|:----------:|:----------:|:----------:|:----------:|
| **文件系统** | 仅工作树 | 仓库只读 + MinIO | 仓库只读 + MinIO | 仅 K8s API |
| **网络** | NATS + Git | NATS + OpenClaw | NATS + 测试环境 | NATS + K8s API |
| **内存限制** | 4 GB | 2 GB | 4 GB | 1 GB |
| **CPU 限制** | 2 核 | 1 核 | 2 核 | 0.5 核 |
| **最大运行时间** | 30 分钟 | 10 分钟 | 20 分钟 | 15 分钟 |
| **互联网** | 阻止 | 阻止 | 阻止 | 阻止 |
| **写入权限** | 仅工作树 | 无 | 测试报告到 MinIO | 限定的 K8s API |

沙箱在 Kubernetes Pod 级别强制执行：每个智能体在自己的 Pod 中运行，具有限制能力的 SecurityContext 和限制出口流量的 NetworkPolicy。

```yaml
# k8s/agent-sandbox.yaml (example for CG-Steward)
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    capabilities:
      drop: ["ALL"]
  containers:
  - name: cg-steward
    resources:
      limits:
        memory: "4Gi"
        cpu: "2"
    volumeMounts:
    - name: worktree
      mountPath: /tmp/ulw
  volumes:
  - name: worktree
    emptyDir: {}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cg-steward-network
spec:
  egress:
  - to:                    # NATS only
    - podSelector:
        matchLabels:
          app: nats
  - to:                    # Git only (internal GitLab SSH)
    - podSelector:
        matchLabels:
          app: gitlab
```

#### 4.6.3 第三层：文件范围权限（细粒度控制）

在沙箱内部，智能体具有由类似 FUSE 的权限层强制执行的文件范围权限。这防止 CG 智能体意外修改其允许路径之外的文件。

```typescript
// packages/sandbox/src/file-permissions.ts
export class FilePermissionEnforcer {
  private rules: PermissionRule[] = [
    // CG-Steward: can write to worktree/src and worktree/tests only
    { agent: 'cg-steward', pattern: '/tmp/ulw/*/src/**/*.ts', allow: ['read', 'write'] },
    { agent: 'cg-steward', pattern: '/tmp/ulw/*/tests/**/*.ts', allow: ['read', 'write'] },
    { agent: 'cg-steward', pattern: '/tmp/ulw/*/ulw.json', allow: ['read', 'write'] },
    { agent: 'cg-steward', pattern: '**/*', allow: ['read'] },  // read-only elsewhere

    // CR-Steward: read-only access to PR diff
    { agent: 'cr-steward', pattern: '**/*', allow: ['read'] },
    { agent: 'cr-steward', pattern: '**/*', allow: ['write'] }, // only to review reports
  ];

  enforce(agent: string, operation: 'read' | 'write', filePath: string): void {
    const matched = this.rules.filter(
      r => r.agent === agent && minimatch(filePath, r.pattern)
    );
    if (!matched.some(r => r.allow.includes(operation))) {
      throw new PermissionDeniedError(agent, operation, filePath);
    }
  }
}
```

### 4.7 模型选择策略

不同的智能体类型有不同的推理、延迟和成本要求。ulw 使用以下策略将 LLM 模型匹配到智能体角色。

#### 4.7.1 模型到智能体映射

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MODEL ASSIGNMENT MATRIX                                                 │
│                                                                          │
│  Agent               Model             Cost/task  Why this model         │
│  ─────────────────────────────────────────────────────────────────────   │
│  Orchestrator        GPT-4o            $0.03      Complex reasoning,     │
│                                                                          │
│  Supervisor          GPT-4o-mini       $0.01      Mostly structural,     │
│                                          │        light LLM use          │
│  ───────────────────────────────────────┼────────────────────────────    │
│  AD-Steward          GPT-4o            $0.08      Nuanced architecture   │
│                                          │        decisions              │
│  CG-Steward          Claude 4          $0.15      Best code generation,  │
│                                          │        large context          │
│  CR-Steward          Claude 4          $0.10      Deep code analysis     │
│  TA-Steward          GPT-4o            $0.06      Pattern-based test gen │
│  PM-Steward          GPT-4o-mini       $0.01      Structured data only   │
│  DP-Steward          GPT-4o-mini       $0.01      Mostly deterministic   │
│  ───────────────────────────────────────┼────────────────────────────    │
│  Code Reviewer       Claude 4          $0.05      Detailed diff review   │
│  TDD Test Agent      Claude 4 Haiku    $0.02      Fast, cheap, good for  │
│                                          │        test generation        │
│  Security Auditor    GPT-4o            $0.04      Security pattern rec   │
│  Contract Validator  GPT-4o-mini       $0.01      Structured comparison  │
│  Deploy Agent        None              $0.00      Pure tool execution    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.7.2 成本优化策略

在 100+ 开发者规模下，LLM 成本是显著的。ulw 应用五种优化技术：

**1. 模型分层。** 高成本模型（Claude 4、GPT-4o）保留给需要它们的智能体。PM-Steward 和 DP-Steward 使用 GPT-4o-mini，因为它们的任务是结构化的且低复杂性。单这一项就将总 LLM 成本降低了约 40%（相比于所有智能体使用一个模型）。

**2. 上下文窗口管理。** CG-Steward 接收完整的架构规格（通常 10k+ 令牌），但在 Redis 支持的向量存储中缓存重复上下文（项目约定、编码标准）。只有新信息的差异进入每个提示。

**3. 投机执行。** TDD 测试智能体（Claude 4 Haiku，$0.02/任务）先生成测试。如果测试被 CG-Steward 拒绝，较便宜的模型承受了失败的尝试，而不是昂贵的 Claude 4。

**4. 批量审查。** CR-Steward 批量处理审查检查：风格、安全、架构和契约在单个 ACP 会话中分析，而不是四次单独的 LLM 调用。这通过共享差异上下文降低了每个 PR 的成本。

**5. 提示压缩。** 所有智能体提示去除不必要的格式，使用简洁的指令，并在确定性逻辑足够时避免思维链。估计节省 20-30% 的令牌（相比于冗长的提示）。

#### 4.7.3 预估月成本（100 开发者规模）

| 智能体 | 任务/天 | 成本/任务 | 日成本 | 月成本 |
|-------|:---------:|:---------:|:----------:|:------------:|
| 编排器 | 200 | $0.03 | $6.00 | $180 |
| 监督器 | 200 | $0.01 | $2.00 | $60 |
| AD-Steward | 40 | $0.08 | $3.20 | $96 |
| CG-Steward | 40 | $0.15 | $6.00 | $180 |
| CR-Steward | 80 | $0.10 | $8.00 | $240 |
| TA-Steward | 60 | $0.06 | $3.60 | $108 |
| PM-Steward | 100 | $0.01 | $1.00 | $30 |
| DP-Steward | 20 | $0.01 | $0.20 | $6 |
| 专家 | 120 | $0.03 平均 | $3.60 | $108 |
| **总计** | | | **$33.60** | **$1,008** |

100 开发者团队的预估月 LLM 成本：**约 $1,000-$1,500**（含重试和边缘情况的缓冲）。这大约是每位开发者每月 $10-15，远低于自动化代码生成和审查带来的生产力提升。

#### 4.7.4 故障切换和回退

如果智能体的主要模型不可用或性能下降：

| 主要 | 回退 1 | 回退 2 |
|---------|-----------|------------|
| Claude 4 | GPT-4o | GPT-4o-mini（质量下降，仅限紧急情况） |
| GPT-4o | Claude 4 | Claude 4 Haiku（复杂任务质量下降） |
| GPT-4o-mini | Claude 4 Haiku | — |
| Claude 4 Haiku | GPT-4o-mini | — |

故障切换由监督器的模型路由器处理，它通过 OpenCode 运行时的模型状态端点监控模型健康并相应路由。

---

## 5. TDD 测试框架设计

### 5.1 测试金字塔定义

ulw 强制实施五层测试金字塔。每一层有指定的工具链、覆盖率目标和执行上下文。这个金字塔不是建议：它是一个门控。代码不能在不通过相关测试级别的情况下在 TDD 阶段之间推进。

```
                     ┌───────────────────────┐
                     │     L4 Performance/   │
                     │     Security          │  < 1% of suite
                     │   (k6, OWASP ZAP)     │  No % threshold
                     ├───────────────────────┤
                     │     L3 Acceptance     │  5-10% of suite
                     │  (Playwright, Pact)   │  100% scenario pass
                     ├───────────────────────┤
                     │     L2 Contract       │  10-15% of suite
                     │   (Pact, Supertest)   │  100% pact verification
                     ├───────────────────────┤
                     │     L1 Integration    │  20-30% of suite
                     │   (Vitest + MSW)      │  >80% line coverage
                     ├───────────────────────┤
                     │     L0 Unit           │  60-70% of suite
                     │   (Vitest)            │  >90% branch coverage
                     └───────────────────────┘
```

| 级别 | 范围 | 工具 | 执行目标 | 覆盖率门控 |
|-------|-------|------|-----------------|---------------|
| **L0 单元** | 单个函数/类，无 I/O | Vitest（隔离的 `describe`/`it`） | 每个 `*.spec.ts` 文件 | 分支 >= 90% |
| **L1 集成** | 模块边界，模拟的外部依赖 | Vitest + MSW（用于 HTTP 模拟） | 每个限界上下文 | 行 >= 80% |
| **L2 契约** | 服务间 API 协议 | Pact（提供者驱动契约）+ Supertest（HTTP 断言） | 每个 OpenAPI 端点 | 100% pact 验证 |
| **L3 验收** | 端到端用户旅程 | Playwright（浏览器）+ Supertest（API） | 每个特性标志切换的场景 | 0 个失败场景 |
| **L4 性能/安全** | 负载、压力、漏洞 | k6（性能）、OWASP ZAP（安全） | 每周或发布前 | P95 延迟无 >5% 回归 |

**关键规则：**
- 每个 L0 测试必须无副作用。无网络、无文件系统、无时钟依赖。
- L1 测试使用 Vitest 的 `vi.mock()` 进行模块级模拟。MSW 处理限界上下文的出站 HTTP 调用。
- L2 契约由测试运行时从 OpenAPI 规范生成。Pact 验证针对提供者的已部署预发布实例运行。
- L3 测试使用 Playwright 的 `test` 和 `expect` 配合页面对象模型。每个测试精确映射到一个微规格（见 5.3）。
- L4 测试不是每次提交必需的。它们在合并到预发布和发布前运行。失败会阻塞 CI 流水线。

### 5.2 TDD 状态机

ulw 的 TDD 流程是一个确定性的状态机。每个微规格驱动一次遍历：RED → GREEN → REFACTOR → DONE。状态机是智能体允许做什么的单一真相来源。

```
                    ┌──────────┐
                    │   IDLE   │
                    └────┬─────┘
                         │ new micro-spec assigned
                         ▼
                 ╔═══════════════╗
                 ║   RED PHASE   ║  <── test-only agent
                 ╠═══════════════╣
                 ║ Write 1 test, ║
                 ║ run → FAIL    ║
                 ╚═══════╤═══════╝
                         │ test fails (expected)
                         ▼
                 ╔═══════════════╗
                 ║  GREEN PHASE  ║  <── implementation agent
                 ╠═══════════════╣
                 ║ Write minimum ║
                 ║ code to pass  ║
                 ╚═══════╤═══════╝
                         │ test passes
                         ▼
                 ╔═══════════════╗
                 ║ REFACTOR PHASE║  <── cleanup agent
                 ╠═══════════════╣
                 ║ Clean code,   ║
                 ║ tests stay    ║
                 ║ green         ║
                 ╚═══════╤═══════╝
                         │ tests still green
                         ▼
                 ╔═══════════════╗
                 ║     DONE      ║
                 ╠═══════════════╣
                 ║ Archive spec, ║
                 ║ update        ║
                 ║ coverage map  ║
                 ╚═══════════════╝
```

**状态转换规则：**

1. **IDLE → RED**：从待办事项列表中分配一个微规格。一个 RED 智能体（仅测试）被生成，其上下文窗口仅包含微规格和领域模型。不加载任何实现文件。

2. **RED → GREEN**：RED 阶段测试必须失败（编译或断言失败）。如果测试意外通过，状态机转换为 **RED_FAILURE**（错误状态）并通知监督器。RED 智能体绝不允许修改现有的通过测试 — "绝不修改测试"规则在工具层面强制执行（见 5.4）。

3. **GREEN → REFACTOR**：实现智能体编写使测试通过的最少代码。"最少"意味着无死代码、无推测性泛化、无注释。如果测试套件通过，控制权移交给 REFACTOR 智能体。如果失败，GREEN 智能体重试最多 3 次然后升级。

4. **REFACTOR → DONE**：REFACTOR 智能体清理实现代码：重命名变量、提取辅助函数、消除重复。它绝不能修改测试文件。每次更改后，它重新运行完整的 L0 + L1 套件。如果测试保持绿色，状态转换为 DONE。如果任何测试失败，REFACTOR 智能体回滚其最后的更改并重试。

5. **DONE**：微规格被归档。覆盖率数据合并到项目的覆盖率映射中。状态机返回 IDLE，准备下一个微规格。

**一次一个测试约束**：状态机在每个 RED 周期中精确处理一个测试。如果一个微规格暗示多个测试（例如，多个边界情况），每个测试获得自己的 RED → GREEN → REFACTOR → DONE 周期。这防止了"测试雪崩"问题，即智能体编写数十个测试全部失败并压垮实现阶段。

**错误状态：**

| 状态 | 触发条件 | 恢复 |
|-------|---------|----------|
| `RED_FAILURE` | 测试在 RED 阶段通过 | 升级到监督器；丢弃智能体会话 |
| `GREEN_STALL` | 3 次连续 GREEN 失败 | 升级到监督器；锁定微规格供人工审查 |
| `REFACTOR_BREAK` | 测试在重构期间失败 | 回滚上次更改；重试一次；如果仍然损坏，升级 |
| `TIMEOUT` | 智能体超过挂钟时间限制 | 杀死智能体；返回之前的稳定状态 |

### 5.3 微规格模式

微规格是 ulw TDD 系统中的原子工作单元。它体现了以下原则：一个行为、一个验收标准、一个测试、一个实现。微规格由技术负责人或高级开发者编写，由智能体消费。

**微规格模板：**

```typescript
// spec-id: spec-20260428-001
// domain: OrderManagement
// domain-event: OrderSubmitted
// risk: medium

/**
 * MICRO-SPEC: Cancel a pending order
 *
 * As a customer
 * I want to cancel my order while it is still pending
 * So that I can change my mind before fulfillment begins
 *
 * Acceptance Criteria:
 *   Given a pending order owned by the requesting customer
 *    When the customer sends a cancel request
 *    Then the order status changes to "cancelled"
 *     And a OrderCancelled domain event is emitted
 *     And the order's items are returned to available inventory
 *
 * Boundary Conditions:
 *   - Rejects cancel for orders in "shipped" or "delivered" status
 *   - Rejects cancel from non-owner user (403)
 *   - Idempotent: cancelling an already-cancelled order returns 200 OK
 *
 * Dependencies:
 *   - OrderRepository (in-memory for L0)
 *   - InventoryService (mocked for L1)
 *
 * Tags: @core @order-flow @L0
 */
```

**可追溯性链：**

```
DDD Domain Event (OrderSubmitted)
  └── Micro-Spec (spec-20260428-001)
        └── Test File (orders/cancel/cancel-pending-order.spec.ts)
              └── Implementation (orders/cancel/cancel-pending-order.ts)
                    └── Coverage Entry (coverage-map.json)
```

每个微规格精确映射到一个 DDD 领域事件。规格头部的 `domain-event` 字段在行为需求和实现它的代码之间创建了不可变的链接。此可追溯性在 DONE 阶段强制执行：覆盖率映射记录哪些领域事件被哪些测试覆盖，CI 流水线标记未覆盖的事件。

**Given/When/Then 与 TypeScript：**

从微规格生成的测试遵循严格的模板：

```typescript
import { describe, it, expect } from 'vitest';
import { cancelOrder } from './cancel-pending-order';
import { OrderStatus } from '../domain/order-status';

describe('Cancel pending order [spec-20260428-001]', () => {
  it('changes order status to cancelled when order is pending', () => {
    // Given
    const order = createPendingOrder({ ownerId: 'user-1' });

    // When
    const result = cancelOrder({ orderId: order.id, userId: 'user-1' });

    // Then
    expect(result.status).toBe(OrderStatus.Cancelled);
  });

  it('returns OrderCancelled domain event', () => {
    const order = createPendingOrder({ ownerId: 'user-1' });

    const result = cancelOrder({ orderId: order.id, userId: 'user-1' });

    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'OrderCancelled' })
    );
  });

  it("rejects cancel for shipped orders", () => {
    const order = createShippedOrder({ ownerId: 'user-1' });

    const act = () => cancelOrder({ orderId: order.id, userId: 'user-1' });

    expect(act).toThrow('Cannot cancel order in status: shipped');
  });

  // ... boundary conditions follow the same pattern
});
```

每个 `it()` 块对应微规格中的精确一个验收标准。边界条件获得自己的 `it()` 块。`describe` 字符串中的 `spec-id` 链接回微规格以进行追溯。

### 5.4 阶段隔离策略

每个 TDD 阶段在其自己的子智能体实例中运行，具有独立的上下文窗口。智能体之间不共享内存、对话历史或文件句柄。唯一的共享状态是磁盘上的 git 工作树。

**隔离架构：**

```
┌─────────────────────────────────────────────┐
│              Supervisor Agent                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ RED      │  │ GREEN    │  │ REFACTOR   │ │
│  │ Agent    │  │ Agent    │  │ Agent      │ │
│  │ Instance │  │ Instance │  │ Instance   │ │
│  │ (fresh)  │  │ (fresh)  │  │ (fresh)    │ │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │              │              │         │
│       └──────────────┴──────────────┘         │
│                        │                       │
│              ┌─────────┴─────────┐             │
│              │  Git Worktree     │             │
│              │  (isolated copy)  │             │
│              └───────────────────┘             │
└─────────────────────────────────────────────┘
```

**上下文窗口隔离：**

| 阶段 | 加载的上下文 | 排除的上下文 |
|-------|---------------|------------------|
| RED | 仅微规格、领域模型接口、现有测试模式 | 所有实现文件、生产源代码、node_modules |
| GREEN | 微规格 + 测试文件、领域模型实现、类型定义 | 其他测试、不相关的模块、PR 讨论 |
| REFACTOR | 完整实现文件、类型定义、测试结果（仅通过/失败） | 微规格（以防止测试修改）、RED 推理 |

**基于钩子的门控：**

隔离策略依赖于工具级别的钩子。这些不是约定。它们由智能体运行时强制执行。

```
RED_PHASE_HOOKS:
  - on_file_write:
      rule: "REJECT if file path matches src/**/*.ts (excluding *.spec.ts, *.test.ts)"
      action: "throw AgentGateError('RED: Cannot write implementation files')"
  - on_file_read:
      rule: "REDACT if file path matches src/**/*.ts (excluding *.spec.ts, *.test.ts)"
      action: "return empty buffer with annotation: [REDACTED: implementation hidden]"

GREEN_PHASE_HOOKS:
  - on_file_write:
      rule: "ALLOW *.ts, REJECT *.spec.ts, *.test.ts"
      action: "throw AgentGateError('GREEN: Cannot modify tests')"
  - on_test_run:
      rule: "MUST execute before declaring phase complete"
      action: "gate blocks transition until vitest run returns 0 exit code"

REFACTOR_PHASE_HOOKS:
  - on_file_write:
      rule: "ALLOW *.ts, REJECT *.spec.ts, *.test.ts"
      action: "throw AgentGateError('REFACTOR: Cannot modify tests')"
  - on_test_run:
      rule: "MUST execute after every file write"
      action: "auto-revert on test failure; max 1 revert per edit"
```

"绝不修改测试"规则是字面意义上的：在 RED 阶段之外对 `*.spec.ts` 或 `*.test.ts` 文件的任何写入尝试都会引发立即可的、不可屏蔽的 `AgentGateError`。智能体不能覆盖、绕过或忽略此钩子。监督器记录违规并终止智能体会话。

### 5.5 TDD 中的 AI 智能体角色

每个 TDD 阶段由专门的智能体角色负责，具有特定的权限、约束和成功标准。

| 角色 | 阶段 | 权限 | 约束 | 成功标准 |
|------|-------|-------------|-------------|-------------------|
| **RED 智能体** | RED | 读取：微规格、领域接口、测试模式。写入：仅 `*.spec.ts`、`*.test.ts`。运行：vitest（必须看到失败） | 无实现文件访问。不修改现有的通过测试。每个周期必须生成正好 1 个失败测试 | 一个新的测试文件被写入，`vitest run` 退出非零 |
| **GREEN 智能体** | GREEN | 读取：微规格、测试文件、领域模型。写入：`*.ts`（非测试）。运行：vitest（必须看到通过） | 无测试文件访问（读取或写入）。无推测性代码。最多 3 次重试 | `vitest run` 退出 0。实现中没有未覆盖的行 |
| **REFACTOR 智能体** | REFACTOR | 读取：完整限界上下文。写入：`*.ts`（非测试）。运行：vitest（必须保持绿色） | 无测试文件访问（读取或写入）。无行为更改。测试失败时自动回滚 | `vitest run` 在重构后退出 0。代码质量得分提高 |

**RED 智能体提示模板（TypeScript 专用）：**

```
You are the RED Agent. Your job is to write exactly one failing test.

Rules:
- You may ONLY write to files matching *.spec.ts or *.test.ts.
- You may ONLY read the micro-spec and domain interface files.
- You MUST NOT read or write any implementation files.
- The test MUST fail when run with `npx vitest run --reporter=verbose`.
- Use Vitest's `describe`, `it`, `expect` API.
- Import domain types from their barrel export (e.g., `@domain/orders`).
- Do not test implementation details. Test observable behavior.
- Do not mock what you do not own. Use MSW for HTTP, vitest.mock for modules.

Your micro-spec:
{spec_content}

Write the test file now.
```

**GREEN 智能体提示模板：**

```
You are the GREEN Agent. Your job is to write the minimum implementation.

Rules:
- You may ONLY write to *.ts files (non-test).
- You MUST NOT read or modify *.spec.ts or *.test.ts files.
- The test file already exists. You cannot see its contents.
- Your code must make the test pass when run with `npx vitest run`.
- Write the minimum code. Do not add features the test does not require.
- Do not add comments, logging, or dead code.
- Use TypeScript strict mode. No `any`. No `@ts-ignore`.

The domain interfaces are:
{interface_content}

Write the implementation now.
```

**REFACTOR 智能体提示模板：**

```
You are the REFACTOR Agent. Your job is to clean the implementation.

Rules:
- You may ONLY write to *.ts files (non-test).
- You MUST NOT read or modify *.spec.ts or *.test.ts files.
- After every file write, vitest runs automatically.
- If vitest fails, your change is reverted. You get one retry.
- Improve: naming, duplication removal, extraction, type narrowing.
- Do NOT change: behavior, public API signatures, module exports.
- Prefer: early returns over nested if, readonly over mutable, union types over enums.

Refactor the implementation file.
```

每个智能体会话是无状态和短暂的。阶段完成后，智能体上下文被丢弃。阶段之间没有"记忆"。这防止了跨阶段污染，即一个智能体对某个阶段的推理泄漏到另一个阶段。

### 5.6 质量门控阈值

在 TDD 循环从 DONE 转换回 IDLE 之前，质量门控评估四个指标。所有必须通过。

| 指标 | 阈值 | 工具 | 执行点 |
|--------|-----------|------|-------------------|
| **行覆盖率** | >= 80% | `vitest --coverage`（通过 `@vitest/coverage-v8`） | DONE 入口门控 |
| **分支覆盖率** | >= 90% | `vitest --coverage`（分支覆盖率报告） | DONE 入口门控 |
| **失败测试** | 0 | `vitest run --reporter=json` | 所有转换（RED→GREEN、GREEN→REFACTOR、REFACTOR→DONE） |
| **变异得分** | > 75% | Stryker Mutator（stryker run） | DONE 入口门控（L0 夜间运行，L1+ 每次 PR） |

**执行机制：**

```typescript
// QualityGate evaluator (runs as a PostToolUse hook at DONE entry)
interface CoverageReport {
  totalLines: number;
  coveredLines: number;
  lineCoverage: number;       // 0-100
  branchCoverage: number;     // 0-100
}

interface MutationReport {
  mutantsTested: number;
  mutantsKilled: number;
  mutationScore: number;      // 0-100
}

interface QualityGateResult {
  passed: boolean;
  failures: Array<{
    gate: 'line-coverage' | 'branch-coverage' | 'failing-tests' | 'mutation-score';
    actual: number;
    threshold: number;
  }>;
}

function evaluateQualityGate(
  coverage: CoverageReport,
  mutation: MutationReport
): QualityGateResult {
  const failures: QualityGateResult['failures'] = [];

  if (coverage.lineCoverage < 80) {
    failures.push({
      gate: 'line-coverage',
      actual: coverage.lineCoverage,
      threshold: 80,
    });
  }

  if (coverage.branchCoverage < 90) {
    failures.push({
      gate: 'branch-coverage',
      actual: coverage.branchCoverage,
      threshold: 90,
    });
  }

  if (mutation.mutationScore <= 75) {
    failures.push({
      gate: 'mutation-score',
      actual: mutation.mutationScore,
      threshold: 75,
    });
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
```

如果质量门控失败，微规格保持在 DONE_PENDING 状态。监督器将其与质量报告一起路由回 REFACTOR 阶段。从不使用测试编写来夸大覆盖率。"一次一个测试"规则防止覆盖率的游戏行为。

**覆盖率合并：** 每个微规格的覆盖率数据合并到项目范围的 `coverage-map.json` 中：

```typescript
// coverage-map.json structure
{
  "version": "1.0",
  "specs": {
    "spec-20260428-001": {
      "files": ["src/orders/cancel/cancel-pending-order.ts"],
      "lineCoverage": 92.3,
      "branchCoverage": 95.0,
      "mutationsKilled": 7,
      "mutationsTotal": 9,
      "timestamp": "2026-04-28T10:30:00Z"
    }
  },
  "uncoveredEvents": [
    "OrderRefunded",  // No micro-spec covers this domain event
    "InventoryReservationFailed"
  ]
}
```

`uncoveredEvents` 数组是技术负责人的主要反馈机制。它揭示了缺乏测试覆盖的领域事件，推动新的微规格创建。

### 5.7 TDD 钩子集成

钩子是 TDD 框架的执行层。它们在三个级别运作：工具调用、git 提交和 CI 流水线。

**PostToolUse 钩子（智能体运行时级别）：**

这些钩子在智能体的每个工具调用后触发。它们是最内层的执行环。

```
┌─────────────────────────────────────────┐
│           Agent Tool Call                │
│  (file_write, file_read, bash_run)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        Phase Gate Checker               │
│  ┌───────────────────────────────────┐  │
│  │ Is this write allowed in current  │  │
│  │ phase? (see 5.4 hook tables)      │  │
│  └────────────┬──────────────────────┘  │
│               │                         │
│        ┌──────┴──────┐                  │
│        │  ALLOWED?    │                  │
│        └──┬───┬───────┘                  │
│       YES │   │ NO                      │
│           ▼   ▼                         │
│      ┌────────┐  ┌──────────────────┐   │
│      │Execute │  │Throw             │   │
│      │Tool    │  │AgentGateError    │   │
│      └───┬────┘  │+ log to audit    │   │
│          │       │+ terminate agent │   │
│          │       └──────────────────┘   │
│          ▼                              │
│  ┌──────────────────────────────┐       │
│  │ Auto-test trigger:           │       │
│  │ if file_write to *.ts:       │       │
│  │   spawn `npx vitest run`     │       │
│  │   if fail AND phase==GREEN:  │       │
│  │     auto-revert file         │       │
│  │   if fail AND phase==RED:    │       │
│  │     expected, continue       │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
```

关键 PostToolUse 钩子：

```typescript
// Pseudocode for the hook system
const hooks = {
  'file_write': {
    handler: async (ctx: HookContext) => {
      // Phase-based access control
      const phase = await ctx.getCurrentPhase();
      const filePath = ctx.getArg('filePath');

      if (phase === 'RED' && !isTestFile(filePath) && isSourceFile(filePath)) {
        throw new AgentGateError(
          `RED phase: cannot write ${filePath}. Only *.spec.ts and *.test.ts are allowed.`
        );
      }

      if ((phase === 'GREEN' || phase === 'REFACTOR') && isTestFile(filePath)) {
        throw new AgentGateError(
          `${phase} phase: cannot modify test files. Only implementation files are writable.`
        );
      }

      // Auto-trigger test run after implementation writes
      if ((phase === 'GREEN' || phase === 'REFACTOR') && isSourceFile(filePath)) {
        const result = await runVitest();
        if (result.exitCode !== 0 && phase === 'GREEN') {
          await revertFile(filePath);
          throw new AgentGateError(
            'GREEN phase: implementation caused test failure. File reverted.'
          );
        }
        if (result.exitCode !== 0 && phase === 'REFACTOR') {
          await revertFile(filePath);
          // REFACTOR gets one retry, then fails
          const retryCount = await ctx.getRetryCount();
          if (retryCount >= 1) {
            throw new AgentGateError(
              'REFACTOR phase: test failure after retry. Escalating.'
            );
          }
        }
      }
    },
  },
};
```

**PreCommit 钩子（git 级别）：**

这些钩子在智能体工作树内的 `git commit` 时运行。它们确保在代码提交之前 TDD 循环已达到 DONE 状态。

```bash
#!/bin/bash
# .git/hooks/pre-commit — installed in every agent worktree

# Check for DONE marker
if [ ! -f ".tdd-state" ]; then
  echo "ERROR: No .tdd-state file found. TDD cycle must reach DONE before commit."
  exit 1
fi

STATE=$(cat .tdd-state)
if [ "$STATE" != "DONE" ]; then
  echo "ERROR: TDD state is '$STATE', not 'DONE'. Complete the TDD cycle first."
  exit 1
fi

# Run full L0 + L1 suite
npx vitest run --reporter=json 2>/dev/null | jq -e '.numFailedTests == 0' > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Tests must pass before commit."
  exit 1
fi

# Run quality gate
npx stryker run --mutation-score-min=75 2>/dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Mutation score below 75%. Commit blocked."
  exit 1
fi

exit 0
```

**CI 钩子（流水线级别）：**

CI 在每个 PR 和每次合并到主分支时运行。它强制覆盖率的增量和完整的契约验证。

```yaml
# .github/workflows/tdd-quality-gates.yml
name: TDD Quality Gates
on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: [main]

jobs:
  coverage-delta:
    runs-on: ubicloud-standard-4
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci

      # Compare coverage against base branch
      - name: Compute coverage delta
        run: |
          BASE_COVERAGE=$(git show origin/main:coverage-map.json | jq '.specs[].lineCoverage' | jq -s add/length)
          npx vitest run --coverage --reporter=json
          HEAD_COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          DELTA=$(echo "$HEAD_COVERAGE - $BASE_COVERAGE" | bc)
          if (( $(echo "$DELTA < -2.0" | bc -l) )); then
            echo "ERROR: Coverage decreased by ${DELTA}% (threshold: -2%)"
            exit 1
          fi

  contract-verify:
    runs-on: ubicloud-standard-4
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Verify Pact contracts
        run: npx pact-verifier --provider-base-url=https://staging.api.ulw.dev

  # If any gate fails, the PR is blocked and annotated with the failure
```

**钩子层级总结：**

| 钩子类型 | 位置 | 触发条件 | 失败时的操作 |
|-----------|----------|---------|-------------------|
| PostToolUse | 智能体运行时（OpenCode） | 每个智能体工具调用 | 抛出 `AgentGateError`，终止智能体，记录审计事件 |
| PreCommit | Git 工作树 `.git/hooks/pre-commit` | `git commit` | 拒绝提交，打印原因，显示在智能体日志中 |
| CI | GitHub Actions | PR 打开/同步，推送到主分支 | 阻塞 PR 合并，附上覆盖率增量报告注释 |

三层钩子系统确保没有代码能够在不经过完整 TDD 状态机的情况下进入仓库。没有绕过。不适用于热修复、实验或管理覆盖。如果钩子阻止了你，说明微规格不完整。

---

## 6. 自动化代码审查模块

自动化代码审查模块是 ulw 平台的质量门控。它用 6 智能体并行流水线替代传统的人工代码审查，在每个拉取请求上运行。该模块由 **OpenClaw** 驱动，它是 OpenCode 开发引擎对应的审查引擎，作为自托管网关部署在同一个 Kubernetes 集群上。

### 6.1 OpenClaw 集成架构

OpenClaw 通过四种不同的模式与 ulw 平台集成，每种服务于不同的触发场景：

| 集成模式 | 触发器 | 延迟目标 | 使用场景 |
|-----------------|---------|---------------|----------|
| **Webhook 驱动** | GitHub/GitLab PR webhook 事件 | < 30s 启动 | 所有代码审查请求的默认模式 |
| **定时调度** | 通过 NATS cron 触发器的内部调度器 | N/A | 周期性全仓库审计扫描（夜间） |
| **ACP 子会话** | OpenCode ACP 循环内联调用 | < 5s | AI 代码生成期间的实时审查 |
| **HTTP API** | 通过 Kong Ingress 暴露的 REST 端点 | < 1s 响应 | 从 CI 流水线或 CLI 手动触发 |

**Webhook 驱动模式**是主要的集成路径。当开发者在 GitHub 上打开或更新拉取请求时，平台的 webhook 接收器验证负载签名，使用仓库上下文（限界上下文映射、审查策略 ID、分支保护规则）丰富它，并在 NATS JetStream 上入队一个 `ReviewJob` 消息。OpenClaw Gateway 消费者接收消息并启动审查流水线。

**定时调度模式**按可配置的计划（默认：UTC 时间 02:00 每日）运行完整的仓库扫描。这捕获可能已在审查流水线之外合并的问题（热修复、绕过分支保护的直接推送），并生成发布到指定 Slack 频道的仓库健康报告。

**ACP 子会话**是 ulw 架构独有的。当 OpenCode 开发智能体完成微规格的代码编写时，它可以在将代码提交到文件系统之前内联调用 OpenClaw。这创建了一个紧密的反馈循环，在开发时而非 PR 时捕获审查问题，减少返工。

**HTTP API 模式**在 `POST /api/v1/reviews` 暴露一个 RESTful 接口，供外部工具触发审查。这允许现有的 CI 流水线（例如，GitHub Actions 工作流步骤）无需通过 webhook 即可调用审查模块。

**部署架构**：OpenClaw 作为自托管的 Gateway 服务在 Kubernetes 上运行，部署为 `Deployment` 资源，具有基于队列深度的水平自动扩缩（HPA）。Gateway 是一个轻量级 HTTP 服务器，维护与智能体池和 NATS JetStream 的持久连接以消费消息。它不存储状态；所有审查状态都通过监督器组件保存在 PostgreSQL 中。

```
┌──────────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway (K8s Deployment)              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Webhook     │  │ Cron        │  │ REST API    │              │
│  │ Consumer    │  │ Scheduler   │  │ Server      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                              │                                    │
│                         ┌────▼────┐                              │
│                         │  NATS   │                              │
│                         │ JetStream│                             │
│                         │ Queue   │                              │
│                         └────┬────┘                              │
│                              │                                    │
│                         ┌────▼────┐                              │
│                         │  Agent   │                              │
│                         │  Pool    │                              │
│                         │  Manager │                              │
│                         └─────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 审查流水线

审查流水线由六个专门的智能体组成，按定义的顺序运行。每个智能体有单一职责，接收完整的 PR 差异和相关上下文，并生成结构化的发现。

```
                                     ┌──────────┐
                                     │   PR     │
                                     │  Event   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │ Analyzer │
                                     │  Agent   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │  Code    │
                                     │ Quality  │
                                     │  Agent   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │ Security │
                                     │  Agent   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │Architect │
                                     │  Agent   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │  Critic  │
                                     │  Agent   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │  Policy  │
                                     │  Agent   │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │ Findings │
                                     │Aggregator│
                                     └──────────┘
```

#### 各智能体职责

| 智能体 | 职责 | 工具与模型 | 输出 |
|-------|---------------|----------------|--------|
| **分析器** | 理解 PR 范围：哪些文件变更，触及哪些限界上下文，哪些依赖受影响。生成供所有下游智能体使用的 PR 摘要 | OpenCode TypeScript SDK、AST-grep、差异解析器 | PR 上下文映射、受影响的模块列表、依赖变更报告 |
| **代码质量** | 检查代码风格、格式、命名约定、复杂度指标、测试覆盖率影响。强制各 BC 的编码标准 | ESLint + Oxlint（通过 OpenClaw 插件）、复杂度分析（圈复杂度、NPath） | 质量发现、lint 违规、复杂度警告 |
| **安全** | 扫描漏洞、硬编码密钥、注入风险、依赖漏洞。运行 SAST 和密钥扫描 | Semgrep、Trivy、自定义正则模式、依赖审计 | 带 CVSS 评分、严重级别分类的安全发现 |
| **架构** | 验证变更是否符合 DDD 限界上下文边界。检查未授权的跨上下文依赖、层违规和架构规则合规性 | 每个 BC 的自定义 AST-grep 规则、模块边界分析器、导入图验证器 | 架构合规发现、边界违规报告 |
| **评论家** | AI 推理智能体。从设计和逻辑角度分析差异：正确性、边缘情况处理、错误处理完整性、竞态条件 | LLM（GPT-4o / Claude）通过 OpenClaw LLM 插件、带 PR 上下文的思维链提示 | 设计级别的发现、逻辑错误、缺失的边缘情况、改进建议 |
| **策略** | 执行限界上下文的审查策略。验证所有强制检查已通过、没有关键发现被忽略、批准标准已满足 | 策略引擎（JSON/YAML 规则引擎）、发现聚合器 | 策略合规裁决：通过 / 失败 / 需要审查 |

默认情况下，智能体执行为顺序的。分析器总是先运行，因为它为其他所有人产生上下文。分析器完成后，其余五个智能体可以并行运行，但在实践中，流水线顺序运行它们以控制 LLM API 调用的速率限制，并使审查对于调试具有确定性。

### 6.3 审查策略框架

ulw 平台中的每个限界上下文定义自己的审查策略。策略编写为 YAML 文件，存储在仓库的 `.ulw/review-policies/<bounded-context-name>.yaml` 下，并与代码一起进行版本控制。

#### 策略模式

```yaml
# .ulw/review-policies/identity-service.yaml
name: identity-service
version: "1.2"
bounded_context: IdentityAccess

severity_levels:
  critical:
    label: "Critical"
    blocking: true          # Blocks merge
    response_time: "1 hour" # SLA for human review
    color: "#FF0000"
  high:
    label: "High"
    blocking: true          # Blocks merge
    response_time: "4 hours"
    color: "#FF6600"
  medium:
    label: "Medium"
    blocking: false         # Warning only
    response_time: "24 hours"
    color: "#FFCC00"
  low:
    label: "Low"
    blocking: false
    response_time: "72 hours"
    color: "#3399FF"
  info:
    label: "Info"
    blocking: false
    response_time: "none"
    color: "#999999"

rules:
  - id: "TS-001"
    category: "type_safety"
    severity: "critical"
    description: "Any usage of `any` type in TypeScript is forbidden"
    pattern: ": any"
    action: "block"
    remediation: "Replace `any` with `unknown` or a proper type definition"

  - id: "TS-002"
    category: "type_safety"
    severity: "high"
    description: "Function return types must be explicitly annotated"
    pattern: "function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{"
    action: "warn"
    remediation: "Add explicit return type annotation to the function"

  - id: "TS-003"
    category: "error_handling"
    severity: "critical"
    description: "All async functions must have proper error handling"
    pattern: "async\\s+function\\w*\\s*\\([^)]*\\)\\s*\\{(?![^}]*catch)"
    action: "block"
    remediation: "Wrap async function body in try-catch or use proper error boundary"

  - id: "TS-004"
    category: "testing"
    severity: "high"
    description: "New business logic files must have corresponding test files"
    pattern: null
    action: "check_test_coverage"
    remediation: "Create unit tests for all new business logic functions"

  - id: "TS-005"
    category: "dependency"
    severity: "medium"
    description: "No new production dependencies without Tech Lead approval"
    pattern: null
    action: "flag_for_approval"
    remediation: "Add dependency to the approved list or get Tech Lead sign-off"

  - id: "BC-001"
    category: "architecture"
    severity: "critical"
    description: "No cross-bounded-context imports outside allowed dependency graph"
    pattern: null
    action: "check_import_rules"
    remediation: "Refactor to use the anti-corruption layer or domain events"
```

#### 严重级别语义

| 严重级别 | 阻塞合并 | 人工审查 SLA | CI 状态 | 行为 |
|----------|-------------|---------------------|-----------|----------|
| **Critical** | 是 | 1 小时 | 失败 | 流水线立即停止 |
| **High** | 是 | 4 小时 | 失败 | 流水线完成但阻塞合并 |
| **Medium** | 否 | 24 小时 | 警告 | 允许但带警告；技术负责人必须确认 |
| **Low** | 否 | 72 小时 | 通过 | 仅为建议 |
| **Info** | 否 | N/A | 通过 | 仅为信息 |

策略文件在流水线运行时由策略智能体加载。策略可以引用在组织级别定义的共享规则库（`.ulw/review-policies/_shared.yaml`），所有限界上下文继承这些规则。上下文特定的规则以更高的优先级覆盖共享规则。

### 6.4 审查执行流程

端到端的审查执行流程涵盖了从开发者打开 PR 到最终裁决发布回 GitHub 的整个过程。

```
Developer opens PR
       │
       ▼
GitHub webhook fires ──────► ulw Webhook Receiver
       │                         │
       │                    ┌────▼────┐
       │                    │ Validate│
       │                    │ Payload │
       │                    │ + Auth  │
       │                    └────┬────┘
       │                         │
       │                    ┌────▼────┐
       │                    │ Enqueue │
       │                    │ ReviewJob│
       │                    │ (NATS)  │
       │                    └────┬────┘
       │                         │
       │                    ┌────▼────┐
       │                    │ Fetch   │
       │                    │ PR Diff │
       │                    │ (GitHub │
       │                    │  API)   │
       │                    └────┬────┘
       │                         │
       │                    ┌────▼────┐
       │                    │ Split   │
       │                    │ Diff    │
       │                    │ (if >400│
       │                    │  lines) │
       │                    └────┬────┘
       │                         │
       │              ┌──────────┼──────────┐
       │              │          │          │
       │         ┌────▼────┐ ┌──▼───┐ ┌───▼───┐
       │         │ Agent 1 │ │Agent2│ │Agent N│  (parallel)
       │         │ (File 1)│ │(File2)│ │(FileN)│
       │         └────┬────┘ └──┬───┘ └───┬───┘
       │              │          │          │
       │              └──────────┼──────────┘
       │                         │
       │                    ┌────▼────┐
       │                    │Aggregate│
       │                    │ Findings│
       │                    │ + Dedup │
       │                    └────┬────┘
       │                         │
       │                    ┌────▼────┐
       │                    │ Apply   │
       │                    │ Policy  │
       │                    │ Filter  │
       │                    └────┬────┘
       │                         │
       │                    ┌────▼────┐
       │          ┌─────────│ Verdict │─────────┐
       │          │         └─────────┘         │
       │          │                             │
       │    ╔══════╧══════╗           ╔════════╧═══════╗
       │    ║ PASS / WARN ║           ║ NEEDS_REVIEW   ║
       │    ╚══════╤══════╝           ╚════════╤═══════╝
       │          │                             │
       │          │                 ┌───────────┼───────────┐
       │          │                 │           │           │
       │          │           ┌─────▼──┐  ┌────▼───┐ ┌────▼────┐
       │          │           │Notify  │  │Create  │ │Wait for │
       │          │           │Slack   │  │Human   │ │Approval │
       │          │           │Channel │  │Review  │ │(Polling)│
       │          │           │        │  │Ticket  │ │         │
       │          │           └────────┘  └────────┘ └────┬────┘
       │          │                                       │
       │          └───────────────┬───────────────────────┘
       │                          │
       │                    ┌─────▼─────┐
       │                    │ Post PR   │
       │                    │ Comment + │
       │                    │ CI Status │
       │                    └───────────┘
```

#### 关键设计决策

**大差异的按文件拆分**：当 PR 差异超过 400 行时，流水线将审查拆分为按文件批处理。每个批次包含不超过 400 行的差异。这使 LLM 上下文窗口保持可管理，并防止评论家智能体中的注意力衰减。分析器智能体仍然看到完整差异以生成连贯的 PR 摘要；下游智能体在其分配的文件批次上操作。

**并行智能体审查**：智能体 2-5（代码质量、安全、架构、评论家）并行审查不同的文件批次。策略智能体始终是最后一个，因为它需要完整的发现集来做出裁决。并行性受可配置的 `maxConcurrency` 设置限制（默认：4），以避免压垮 LLM API 速率限制。

**CI 状态轮询**：发布 PR 评论后，模块在 PR 提交上设置一个待定的 CI 检查。然后模块每 15 秒轮询 GitHub 的组合状态端点，直到所有必需检查完成或达到超时（默认：30 分钟）。最终的 CI 状态反映策略智能体的裁决：Critical/High 阻塞问题为失败，Medium 为警告，其他情况为通过。

### 6.5 发现管理

审查流水线产生的每个发现都遵循标准化的模式，以实现一致的处理、存储和查询。

#### 发现模式

```typescript
interface Finding {
  id: string;                          // UUID v7, sortable by time
  reviewId: string;                    // Links to parent review run
  agent: "analyzer" | "code_quality" | "security" | "architecture" | "critic" | "policy";
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;                    // From policy: "type_safety", "error_handling", etc.
  ruleId: string | null;              // Policy rule ID if applicable, e.g., "TS-001"
  file: string;                        // File path relative to repo root
  lineStart: number;                   // 1-indexed start line
  lineEnd: number;                     // 1-indexed end line
  description: string;                 // Human-readable description of the issue
  suggestion: string;                  // Concrete suggestion for fixing the issue
  codeSnippet: string;                 // The offending code context (3 lines before/after)
  llmExplanation: string | null;       // Critic Agent's reasoning (only for critic findings)
  metadata: Record<string, unknown>;   // Agent-specific metadata (e.g., CVSS score for security)
  fingerprint: string;                 // Hash for deduplication across review runs
  createdAt: string;                   // ISO 8601 timestamp
}
```

#### 去重策略

发现在两个级别去重：

1. **审查内去重**：当并行智能体审查重叠的文件时，它们可能产生重复的发现。聚合器计算从 `(ruleId, file, lineStart, lineEnd, severity)` 派生的 SHA-256 `fingerprint`，并将重复项折叠为单个发现，保留最早的智能体作为来源。

2. **审查间去重**：使用相同的指纹比较来自先前审查运行的发现。如果相同的发现在连续 PR 中的相同文件相同位置出现（指示未修复的问题），则将其标记为"结转"发现，并升级一个严重级别。经过三次连续的结转后，该发现自动提升为人工审批队列中的工单。

#### 误报跟踪

每个发现包含一个 `status` 字段，初始为 `open`。开发者可以通过 PR 评论命令（`/ulw-ignore <finding-id> <reason>`）将发现标记为 `false_positive`。平台跟踪每个智能体和每个规则的误报率：

```sql
-- Analytics query: false positive rate by agent
SELECT
  agent,
  COUNT(*) AS total_findings,
  SUM(CASE WHEN status = 'false_positive' THEN 1 ELSE 0 END) AS false_positives,
  ROUND(
    SUM(CASE WHEN status = 'false_positive' THEN 1 ELSE 0 END)::numeric / COUNT(*),
    4
  ) AS fp_rate
FROM findings
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY agent
ORDER BY fp_rate DESC;
```

策略文件中的配置允许自动降级误报率超过 20% 的规则：它们被降级一个严重级别，直到人工审查并确认规则或修复它。每个 BC 的 `falsePositiveThresholds` 可以在策略 YAML 中设置。

#### 审查分析仪表盘

平台暴露一个 Grafana 仪表盘，包含以下面板：

| 面板 | 指标 | 来源 |
|-------|--------|--------|
| 审查数量 | 每小时的审查次数，按限界上下文细分 | PostgreSQL findings 计数 |
| 通过/失败率 | 通过策略 vs 失败的审查百分比 | PostgreSQL review 裁决 |
| 平均审查时间 | 从 webhook 到裁决的平均挂钟时间 | OpenTelemetry spans |
| 最常见违规 | 按频率排列的最常见规则 ID | PostgreSQL ruleId 聚合 |
| 智能体表现 | 每个智能体每次审查的发现数、误报率 | PostgreSQL 智能体细分 |
| 结转趋势 | 每周未修复的发现数 | PostgreSQL fingerprint 匹配 |
| 人工审查队列 | 按严重级别和 SLA 状态的未处理人工审查工单 | PostgreSQL + Slack 集成 |

### 6.6 人工审批集成

并非所有发现都可以自动解决。平台定义了一个阈值系统：达到或超过配置严重级别的发现需要人工干预才能合并 PR。

#### 阈值配置

```yaml
# .ulw/review-policies/identity-service.yaml (human_approval section)
human_approval:
  enabled: true
  auto_approve_threshold: "medium"     # Findings at "medium" and below are auto-approved
  require_human_for: ["critical", "high"]
  require_human_categories:
    - "architecture"                   # All architecture findings need human review
    - "security"                       # All security findings need human review
  exempt_paths:
    - "tests/**"                       # Test file findings don't need human approval
    - "*.test.ts"
    - "*.spec.ts"
  exempt_authors:                      # Trusted authors can bypass human review
    - "ai-agent[bot]"                  # AI agent commits are pre-approved (audit logged)
```

#### 审批工作流

当策略智能体确定需要人工审查时：

1. 流水线在 PR 上发布详细的审查评论，包含所有发现和总结裁决："此 PR 在合并前需要人工审查。"
2. 平台在 ulw 仪表盘中创建一个审批工单，分配给受影响的限界上下文的技术负责人。
3. 向技术负责人发送 Slack 通知，包含发现摘要和直接链接到审批页面。
4. GitHub CI 状态设置为"预期"状态，因此 PR 在检查通过之前无法合并。
5. 轮询循环（每 60 秒，超时 48 小时）检查人工审批是否已授予。

人工审批者（通常是该限界上下文的技术负责人）通过 ulw 仪表盘审查发现：

```
┌─────────────────────────────────────────────────────┐
│  ulw Review Dashboard  │  PR #1423  │  identity     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ╔══════════════════════════════════════════════════╗
│  ║  Summary: 5 findings (2 critical, 1 high,       ║
│  ║  1 medium, 1 info)                              ║
│  ╚══════════════════════════════════════════════════╝
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Finding #1: TS-001 - Usage of `any` type        ││
│  │ File: src/auth/login.ts:42                       ││
│  │ Severity: Critical  │  Agent: Code Quality      ││
│  │                                                   ││
│  │ [Acknowledge] [Override to Medium] [Dismiss]    ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ Finding #2: BC-001 - Cross-BC import violation  ││
│  │ File: src/auth/userService.ts:15                ││
│  │ Severity: Critical  │  Agent: Architecture      ││
│  │                                                   ││
│  │ [Acknowledge] [Override to Medium] [Dismiss]    ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  [Approve All Acknowledged]  [Request Changes]      │
└─────────────────────────────────────────────────────┘
```

#### 覆盖和争议机制

三种类型的人工覆盖可用：

| 覆盖类型 | 效果 | 审计追踪 |
|--------------|--------|-------------|
| **确认** | 确认发现有效但接受风险。PR 可以继续。 | 记录审批者身份和时间戳；在月度风险审查中报告 |
| **覆盖严重级别** | 更改发现的严重级别（例如，Critical 降为 Medium）。发现仍然可见但不再阻塞 PR。 | 记录覆盖原因；在分析中跟踪严重级别变化 |
| **驳回（误报）** | 将发现标记为已驳回。该规则被添加到审查队列以进行潜在策略调整。 | 记录驳回原因；触发误报分析更新 |

争议遵循两层升级路径：
- **第一层（相同 BC）**：不同意发现结果的开发者可以在 PR 上评论 `/ulw-dispute <finding-id> <reason>`。这将发现重新路由到二次 LLM 审查（评论家智能体在上下文中使用开发者的反驳重新评估）。
- **第二层（跨 BC）**：如果第一层不能解决争议，发现升级到架构审查委员会（ARB），由来自各限界上下文的高级技术负责人组成。ARB 每周收到升级争议的摘要，并在专门的 Slack 工作流中投票。

所有人机交互产生不可变的审计事件，存储在 ELK 审计日志中，用于合规和回溯分析。

---

## 7. API 自动测试模块

### 7.1 API 规范作为单一真相来源

每个限界上下文仓库存储一个 **OpenAPI 3.1 规范**作为其 API 行为的单一真相来源。该规范位于仓库根目录的 `openapi.yaml`，驱动所有下游测试活动。没有手写的测试计划。没有过时的 Postman 集合。规范就是契约，并且规范始终是正确的。

**规范优先工作流：**

1. 开发者（或 AI 智能体）编写或更新 `openapi.yaml`，包含完整的请求/响应模式、验证规则和安全方案
2. AI 代码生成智能体读取规范并生成服务器桩代码、请求/响应类型和验证中间件
3. 生成的代码在构建时通过 Spectral linting 和 OpenAPI 模式断言对照规范进行验证
4. 代码行为与规范定义之间的任何不匹配都会导致构建失败

**模式执行规则：**

| 规则 | 工具 | 行为 |
|------|------|----------|
| 结构有效性 | `openapi-typescript` | 规范必须解析为有效的 OpenAPI 3.1 AST |
| 风格合规性 | Spectral 与自定义规则集 | 命名约定、operationId 存在、响应码 |
| 模式覆盖率 | 自定义断言步骤 | 每个 `$ref` 可解析；每个响应都有模式 |
| 破坏性变更检测 | `openapi-diff` | 如果引入向后不兼容的变更，标记 PR |
| 代码-规范对齐 | AI 智能体验证 | 生成的服务器代码匹配规范路径和模式 |

**破坏性变更策略：** 破坏其他 BC 中现有消费者的规范变更需要协调的版本升级。编排器从上下文映射（第 3 节）自动检测受影响的消费者，并在下游仓库中打开并行的 PR。

### 7.2 AI 驱动的测试生成流水线

测试生成智能体接收 OpenAPI 规范作为输入，并生成完整的测试套件，无需人工干预。流水线以转换步骤的有向无环图运行。

**流水线流程：**

```
OpenAPI 3.1 Spec (openapi.yaml)
        │
        ▼
┌────────────────────────────────┐
│  Schema Parser Agent           │
│  Extracts: paths, methods,     │
│  schemas, params, security     │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Base Request Builder Gen      │
│  One builder per endpoint      │
│  Populated with valid defaults │
│  from schema examples          │
└──────────────┬─────────────────┘
               │
        ┌──────┴──────┐
        ▼              ▼
┌──────────────┐ ┌──────────────────┐
│ Positive      │ │ Schema-Aware     │
│ Test Gen     │ │ Negative Test Gen │
│ Per happy    │ │ Per required      │
│ path         │ │ field: null,      │
│              │ │ wrong type,       │
│              │ │ out of range      │
└──────────────┘ └──────────────────┘
        │              │
        ▼              ▼
┌────────────────────────────────┐
│  Auth Variant Gen              │
│  × no auth                     │
│  × invalid token               │
│  × expired token               │
│  × wrong scope                 │
│  × role-based access tests     │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Fixture & State Manager       │
│  Reusable test data,           │
│  database seed scripts,        │
│  mock service responses        │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Vitest Test Suite Output      │
│  tests/api/<endpoint>.ts       │
│  Ready to execute              │
└────────────────────────────────┘
```

**生成规则：**

| 输入特性 | 生成的测试 |
|---------------|-----------------|
| 路径参数 `{id}` | 测试有效 UUID、无效 UUID、缺失参数 |
| 带有 `minimum`/`maximum` 的查询参数 | 边界测试：最小值、min-1、最大值、max+1 |
| 必需的请求体字段 | 缺失字段、null 字段、空字符串、错误类型 |
| 枚举字段 | 每个有效枚举值 + 无效值 |
| `format: email` / `format: date-time` | 有效格式、畸形格式、字符串中的 XSS 注入 |
| 安全方案（Bearer） | 无认证头、畸形令牌、有效令牌、过期令牌 |
| `x-rate-limit` 扩展 | 测试在 limit-1、limit、超过 limit |

### 7.3 契约测试架构

契约测试确保服务边界得以保持。ulw 使用两种互补的方法。

**通过 Pact 的消费者驱动契约：**

每个 BC 发布定义其对下游 BC 期望的 Pact 契约。这些契约与消费 BC 的测试并存，并由提供 BC 的 CI 流水线验证。

| 角色 | 操作 | 时机 |
|------|--------|--------|
| 消费者 BC | 在功能开发期间编写 Pact 测试 | 在提供者部署之前 |
| 消费者 BC | 将契约发布到 Pact Broker | 在 PR 到消费者时 |
| 提供者 BC | 从 Broker 获取待定契约 | 在提供者部署之前 |
| 提供者 BC | 运行提供者验证测试 | 在 CI 流水线中 |
| 提供者 BC | 标记契约已验证或中断构建 | 门控 2 结果 |

**基于上下文映射的 BC 间契约验证：**

上下文映射（第 3.4 节）定义了哪些 BC 交互。编排器交叉引用每个 PR 的变更端点与上下文映射，并识别：
- 哪些消费者 BC 依赖于已变更的 API
- 变更是否向后兼容（通过 `openapi-diff`）
- 哪些契约需要重新验证

**Specmatic MCP 作为外部护栏：**

Specmatic 作为模型上下文协议（MCP）服务器运行，集成到 OpenCode 智能体运行时。它提供：

- **从流量生成契约**：观察真实的 API 调用并从观察到的行为生成 OpenAPI 规范，标记规范与现实之间的差距
- **请求/响应验证**：拦截测试流量并实时对照规范验证
- **契约比较**：比较 BC 发布的规范与运行服务实际返回的结果

Specmatic 不是一个门控步骤。它作为咨询性检查运行，输入到测试报告仪表盘（第 7.7 节）。如果 Specmatic 检测到规范-现实差距，它会升级到 QA 工程师。

### 7.4 测试场景目录

OpenAPI 规范中的每个端点生成一个场景矩阵。测试生成智能体跨以下类别生成场景：

| 类别 | 覆盖内容 | 示例 |
|----------|---------------|---------|
| **快乐路径** | 有效请求返回 2xx，响应体正确 | `POST /orders` 带有效负载返回 201 + order 对象 |
| **边缘情况** | 边界值、空集合、分页限制 | `GET /orders?page=1&size=0` 返回验证错误 |
| **错误响应** | 规范中定义的 4xx 和 5xx 状态码 | 过期令牌返回 401，带 `WWW-Authenticate` 头 |
| **认证场景** | 所有安全方案变体 | 无认证、Bearer、API Key、OAuth2 范围不匹配 |
| **速率限制** | `x-rate-limit` 扩展行为 | 达到限制的请求返回 429，带 `Retry-After` 头 |
| **并发** | 竞态条件和幂等性 | 带幂等键的重复 `POST` 返回原始 201 |
| **数据验证** | 模式约束违规 | 超出 `maxLength` 返回 422，带字段级错误 |
| **状态转换** | API 中的工作流状态机 | `PATCH /orders/{id}/status` 从 `shipped` 到 `delivered` 成功；从 `delivered` 到 `cancelled` 失败 |

**每个端点的场景矩阵：**

智能体在 `tests/api/scenarios/<endpoint-path>.md` 中生成一个 markdown 矩阵，显示覆盖率：

```
# GET /orders/{id}
| Scenario | Status | Auth | Params | Expected |
|----------|--------|------|--------|----------|
| Happy path: existing order | 200 | Bearer (admin) | valid UUID | Order object |
| Not found: non-existent ID | 404 | Bearer (admin) | non-existent UUID | Error message |
| Invalid ID format | 422 | Bearer (admin) | "not-a-uuid" | Validation error |
| No auth token | 401 | none | valid UUID | Auth error |
| Expired token | 401 | expired Bearer | valid UUID | Auth error |
| Rate limited | 429 | Bearer (admin) | valid UUID | Retry-After header |
```

### 7.5 集成测试环境

需要超过单个 BC 的测试运行在由 Testcontainers 提供、由流水线编排的临时环境中。

**环境类型：**

| 环境 | 提供者 | 生命周期 | 使用场景 |
|-------------|----------|----------|----------|
| 单元 + 契约 | Testcontainers | 每个测试套件 | 单 BC 带桩依赖 |
| 集成 | Docker Compose | 每个 PR | BC + 真实数据库 + 消息代理 |
| 端到端 | Kubernetes Job 命名空间 | 每次部署 | 隔离命名空间中的多 BC 场景 |
| 性能 | 专用 k8s 节点池 | 按需 | 负载测试、浸泡测试 |

**环境生命周期管理：**

1. **配置**：流水线智能体从 BC 仓库读取 `docker-compose.yml` 和 `testcontainers-config.yml`
2. **注入**：测试配置的环境变量（数据库 URL、队列名称、模拟端点）
3. **执行**：测试套件针对配置的环境运行
4. **收集**：测试结果、覆盖率数据和日志推送到 MinIO
5. **销毁**：无论通过/失败状态如何（对失败测试可配置保留），环境被销毁

**模拟服务虚拟化：**

外部依赖（第三方 API、遗留系统）通过 WireMock 实例进行虚拟化。AI 测试生成智能体从外部服务的 OpenAPI 规范生成 WireMock 桩映射：

- 从规范中的示例值派生的桩响应
- 从 `x-response-delay` 扩展模拟延迟
- 从 `x-error-scenarios` 扩展注入错误

### 7.6 回归测试选择

在 100+ 开发者跨越数十个 BC 的情况下，完整的回归套件不可扩展。ulw 使用变更影响分析仅选择重要的测试。

**影响分析流程：**

1. PR 指向 BC 仓库中的文件
2. 智能体将变更的文件映射到受影响的 API 端点（通过导入图和路由注册）
3. 智能体交叉引用变更的端点与上下文映射，找到下游消费者
4. 智能体选择测试集：
   - **直接测试**：变更端点的所有场景
   - **消费者契约测试**：来自消费变更端点的下游 BC 的契约
   - **集成测试**：执行变更端点的跨 BC 场景
   - **依赖测试**：被修改的共享库的测试

**选择矩阵：**

| 变更类型 | 选择的测试 | 选择依据 |
|-------------|---------------|-----------------|
| OpenAPI 规范变更 | 变更路径的所有生成测试 + 所有消费者契约 | 规范是真相来源；任何变更影响所有消费者 |
| 路由处理逻辑 | 直接端点测试 + 消费者契约 | 仅变更处理程序的测试 |
| 共享库（领域模型） | 导入该库的所有 BC | 依赖图分析 |
| 数据库模式迁移 | 受影响所有端点的集成测试 | 模式变更影响持久化层 |
| 仅配置 | 无测试（仅配置验证） | 无行为变更 |
| 新端点 | 新端点的完整场景矩阵 | 首次测试生成 |

**智能测试优先级排序：**

测试运行时按风险分数排序所选测试：

```
risk_score = (consumer_count × 0.4) + (change_frequency × 0.3) + (historical_failure_rate × 0.3)
```

风险分数最高的测试首先运行。如果高风险测试通过，剩余测试的信心很高，流水线继续。如果它们失败，流水线快速失败并将失败上下文报告给开发者。

### 7.7 测试报告与分析

所有测试结果流入一个集中的报告流水线，输入到可观测性栈。

**每个 API 端点的覆盖率：**

每个端点的覆盖率追踪为通过的生成场景的百分比：

```
Endpoint: GET /orders/{id}
  Scenarios: 8 / 8 passing (100%)
  - Happy path           ✅
  - Not found           ✅
  - Invalid ID          ✅
  - No auth             ✅
  - Expired token       ✅
  - Wrong scope         ✅
  - Rate limited        ✅
  - Concurrency         ✅
```

**契约合规仪表盘：**

一个 Grafana 仪表盘显示每个 BC 间契约的健康状况：

| 指标 | 来源 | 刷新 |
|--------|--------|---------|
| 待验证的契约 | Pact Broker API | 每次流水线运行 |
| 已验证/已破坏的契约 | Pact 验证结果 | 每次流水线运行 |
| 规范-现实差距计数 | Specmatic MCP | 每次部署 |
| 破坏性变更尝试 | `openapi-diff` 输出 | 每个 PR |

**不稳定测试检测：**

测试分析智能体跨运行跟踪测试结果并标记不稳定的测试：

- 如果在同一提交上 3 次以上的运行中通过和失败交替，测试被标记为**不稳定**
- 不稳定测试被隔离到单独的 `--flaky` 套件，并排除在主门控之外
- QA 工程师每周收到隔离测试的报告，包含失败模式

**趋势分析：**

每个端点和每个 BC 的趋势图表随时间跟踪：

- 通过率轨迹（目标：>99.5%）
- 测试套件执行时间（如果 >2x 基线则告警）
- 场景覆盖率增长率
- 契约验证年龄（每个消费者-提供者对自上次验证以来的时间）

所有指标以自定义指标（`ulw_test_*`）馈送到 Prometheus，并可通过 Grafana 查询。

---

## 8. CI/CD 流水线设计

### 8.1 流水线理念

ulw 的 CI/CD 流水线将 **AI 智能体视为一等流水线步骤**，而非附加到传统 Jenkinsfile 上的外部脚本。每个步骤要么是生成工件的智能体，要么是审查和审批的人工。流水线完全用 TypeScript 定义（使用 Pulumi 和自定义流水线 SDK），并在 Kubernetes 原生任务运行器上执行。

**核心原则：**

1. **智能体生成，人工审批**：智能体生成工件（代码、测试、配置）。人类在定义的门控处审查。没有智能体在无人签署的情况下推送到生产环境。
2. **TypeScript 流水线即代码**：流水线定义是 TypeScript 模块，具有完整的类型安全，可隔离测试，并与应用程序代码一起进行版本控制。
3. **基于 DAG 的执行**：阶段在有向无环图中运行。可能时并行，存在依赖时顺序。
4. **设计上的幂等性**：每个流水线运行具有确定性。重新运行相同的提交产生相同的结果。副作用（部署、状态更改）被跟踪且幂等。
5. **可观测的智能体**：流水线中的每个智能体动作将其决策理由、置信分数和消耗的上下文窗口记录到审计存储。

**流水线 DSL 示例：**

```typescript
// pipeline/orders-bc.ts
import { Pipeline, Gate, Stage } from '@ulw/pipeline-sdk';

const pipeline = new Pipeline('orders-bc', {
  repo: 'github.com/ulw/orders-bc',
  trigger: { on: ['push', 'pull_request'], paths: ['src/**', 'openapi.yaml'] },
});

pipeline.addGate(new Gate('ai-review', {
  agents: ['openclaw-review', 'openclaw-arch', 'openclaw-security'],
  runStrategy: 'parallel',
  requiredApprovals: 2,
  timeoutMs: 300_000,
}));

pipeline.addGate(new Gate('contract-validation', {
  agents: ['pact-verifier', 'openapi-diff'],
  runStrategy: 'sequential',
  requiredApprovals: 1,
  dependsOn: ['ai-review'],
}));
```

### 8.2 五门控质量流水线

每个触及 BC 仓库的 PR 都经过五个质量门控。门控 1-4 完全自动化。门控 5 需要人工签署。

**流水线概述：**

```
┌──────────────────────────────────────────────────────────────────┐
│                    FIVE-GATE QUALITY PIPELINE                     │
│                                                                   │
│  PR Created / Commit Pushed                                       │
│         │                                                         │
│         ▼                                                         │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  GATE 1: AI Review (2-5 min)                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │ Style    │ │ Arch     │ │ Security │ │ Test         │  │   │
│  │  │ Review   │ │ Review   │ │ Review   │ │ Coverage     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  Result: Pass / Fix-required / Escalate                    │   │
│  └───────────────────────────┬────────────────────────────────┘   │
│                              │ pass                                │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  GATE 2: Contract Validation (1-3 min)                     │   │
│  │  Pact provider verification + openapi-diff breaking        │   │
│  │  change detection + inter-BC impact analysis               │   │
│  │  Result: Pass / Contract-break / Breaking-change           │   │
│  └───────────────────────────┬────────────────────────────────┘   │
│                              │ pass                                │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  GATE 3: Test Suite (5-15 min)                             │   │
│  │  Unit tests → Integration tests → Contract tests →        │   │
│  │  Regression selection (Section 7.6)                       │   │
│  │  Result: Pass / Test-failure                               │   │
│  └───────────────────────────┬────────────────────────────────┘   │
│                              │ pass                                │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  GATE 4: Security Scan (3-8 min)                           │   │
│  │  SCA (npm audit) → SAST (Semgrep) → Secret scan →         │   │
│  │  Container image scan (Trivy) → DAST (optional)           │   │
│  │  Result: Pass / Vulnerability-found                        │   │
│  └───────────────────────────┬────────────────────────────────┘   │
│                              │ pass                                │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  GATE 5: Human Approval                                    │   │
│  │  Tech Lead or Senior Dev reviews aggregated report from    │   │
│  │  Gates 1-4. One-click approve or request changes.          │   │
│  │  SLA: 4-hour target response time                          │   │
│  │  Result: Approved / Changes-requested                      │   │
│  └───────────────────────────┬────────────────────────────────┘   │
│                              │ approved                            │
│                              ▼                                     │
│                      MERGE TO MAIN BRANCH                          │
│                              │                                     │
│                              ▼                                     │
│               DEPLOYMENT PIPELINE (Section 8.4-8.6)                │
└──────────────────────────────────────────────────────────────────┘
```

**门控绕过规则：**

| 绕过场景 | 门控 | 审批人 | 需要理由说明 |
|----------------|------|----------|----------------------|
| 仅文档变更 | 全部 5 个 | 自动绕过 | 由路径过滤器检测 |
| 已知良好的依赖升级（补丁） | 门控 4 | SRE 负责人 | 必须包含 SCA 报告 |
| 紧急热修复（生产故障） | 门控 5 | 值班负责人 | 需要事后审查 |
| 来自规范的 AI 生成代码（确定性） | 门控 1（仅风格） | 技术负责人 | 仅跳过风格审查 |

**升级路径：**

如果门控失败且开发者不同意结果：
1. 开发者在 PR 描述中添加 `@ulw:override-gate<N>` 并附上理由
2. 编排器将覆盖请求路由到下一级审批人（技术负责人 → 工程经理）
3. 覆盖记录在审计追踪中，包含审批人身份和理由
4. 每个审批人的覆盖率被跟踪；>5% 的覆盖率触发对该门控规则集的审查

### 8.3 阶段定义

**门控 1：AI 审查**

| 属性 | 值 |
|----------|-------|
| 进入条件 | 针对主分支打开的 PR；变更的文件通过路径过滤器 |
| 智能体 | OpenClaw 审查智能体团队（6 个智能体：风格、架构、安全、测试、质量、Oracle） |
| 执行 | 6 个智能体并行执行；每个产生一份审查报告 |
| 成功标准 | 所有智能体返回 `pass` 或 `pass_with_minor`；无 `fail` 或 `escalate` |
| 退出信号 | 审查报告工件推送到 MinIO；webhook 发送到编排器 |
| 失败处理 | 智能体失败重试一次。持续失败：将 PR 标记为 `review-failed`，附上智能体输出 |

```bash
# Equivalent CLI invocation (for reference):
openclaw review --pr=$PR_NUMBER --repo=$REPO --agents=style,arch,security,test,quality,oracle --output=minio://reviews/$PR_ID/
```

**门控 2：契约验证**

| 属性 | 值 |
|----------|-------|
| 进入条件 | 门控 1 通过；Pact Broker 有此 BC 的待定契约 |
| 智能体 | Pact 验证智能体、openapi-diff 智能体、Specmatic MCP 智能体 |
| 执行 | Pact 验证先运行。如果通过，再运行 openapi-diff。Specmatic 作为咨询并行运行 |
| 成功标准 | 待定契约标记为已验证；未检测到破坏性变更 |
| 退出信号 | 契约验证报告推送到 MinIO；Pact Broker 状态更新 |
| 失败处理 | 契约破坏：阻塞合并，通过 Slack 通知下游 BC 所有者。误报：使用绕过规则 |

```bash
# Equivalent:
pact-provider-verifier --broker-url=$PACT_BROKER --provider=$BC_NAME --publish-verification-results
openapi-diff --from=$BASE_SHA --to=$HEAD_SHA --spec=openapi.yaml --format=markdown
```

**门控 3：测试套件**

| 属性 | 值 |
|----------|-------|
| 进入条件 | 门控 2 通过；测试容器镜像已构建 |
| 智能体 | 测试运行智能体（Vitest）、覆盖率收集智能体 |
| 执行 | 回归选择的测试按顺序：单元 → 集成 → 契约 → E2E |
| 成功标准 | 所有选择的测试通过；行覆盖率 >80%；分支覆盖率 >70%；此次运行未检测到不稳定测试 |
| 退出信号 | 测试报告（JUnit XML）+ 覆盖率报告（lcov）推送到 MinIO |
| 失败处理 | 测试失败：流水线停止，返回完整的测试输出，包含失败上下文（请求、响应、断言）。开发者收到带直接链接的 Slack 通知 |

```bash
# Equivalent:
vitest run --config=vitest.pipeline.config.ts --reporter=junit --outputFile=reports/test-results.xml
vitest run --coverage --config=vitest.coverage.config.ts
```

**门控 4：安全扫描**

| 属性 | 值 |
|----------|-------|
| 进入条件 | 门控 3 通过；编译/构建的工件可用 |
| 智能体 | SCA 智能体、SAST 智能体、密钥扫描智能体、容器扫描智能体 |
| 执行 | 并行：npm audit → Semgrep → truffleHog → Trivy（镜像）；如果 API 可部署，DAST 可选运行 |
| 成功标准 | 零个 Critical 或 High 严重级别漏洞；未检测到密钥；未暴露凭证 |
| 退出信号 | 安全报告（SARIF 格式）推送到 MinIO；GitHub 安全选项卡更新 |
| 失败处理 | Critical 漏洞：阻塞合并，通知 SRE 团队。Low/Medium：非阻塞警告，创建 Jira 工单修复 |

```bash
# Equivalent:
semgrep --config=auto --sarif --output=reports/semgrep.sarif
trivy image --severity=CRITICAL,HIGH --format=sarif --output=reports/trivy.sarif $IMAGE_TAG
trufflehog filesystem --directory=. --json > reports/secrets.json
```

**门控 5：人工审批**

| 属性 | 值 |
|----------|-------|
| 进入条件 | 门控 1-4 全部通过；聚合报告在 PR 中可用 |
| 智能体 | 无（人工步骤） |
| 执行 | 由技术负责人或高级开发者审查 PR。聚合报告显示每个门控的摘要，带可展开的详情 |
| 成功标准 | PR 获得至少一个批准性审查 |
| 退出信号 | GitHub PR 合并到主分支；webhook 触发部署流水线 |
| 失败处理 | 请求变更：开发者迭代，流水线从门控 1 重新运行（或如果审查完全是人为判断则从门控 3 重新运行） |

### 8.4 部署策略

ulw 支持三种部署策略，按服务类型选择。决策编码在 BC 的 `pipeline.yml` 中。

**决策矩阵：**

| 服务类型 | 策略 | 理由 |
|-------------|----------|-----------|
| 公共 API 网关 | 蓝绿部署 | 零停机，通过 DNS 切换即时回滚 |
| 内部 gRPC 服务 | 滚动更新 | 较低的资源开销，通过健康检查优雅关闭 |
| 面向用户的 Web UI | 金丝雀部署 | 逐步暴露于真实流量，基于指标的升级 |
| 事件消费者（工作者） | 滚动更新 | 无面向用户的影响，基于队列的排空 |
| 关键数据服务 | 蓝绿部署 | 最大安全性，需要数据库迁移协调 |

**蓝绿部署：**

1. 新版本（绿色）部署在现有版本（蓝色）旁边
2. 对绿色运行冒烟测试
3. 门控 3（测试套件）使用生产数据量对绿色重新运行
4. 负载均衡器从蓝色切换到绿色
5. 保持蓝色运行 15 分钟（冷却期）
6. 如果在冷却期内触发回滚：切换回蓝色
7. 冷却期后：销毁蓝色

**金丝雀部署与渐进式发布：**

```
Stage 1: Deploy 1 pod (10% traffic) → Wait 2 minutes → Evaluate metrics
Stage 2: Scale to 25% traffic → Wait 3 minutes → Evaluate metrics
Stage 3: Scale to 50% traffic → Wait 3 minutes → Evaluate metrics
Stage 4: Scale to 100% → Wait 5 minutes → Mark deployment complete
```

每次评估检查：

| 指标 | 阈值 | 操作 |
|--------|-----------|--------|
| 错误率（HTTP 5xx） | 比基线增加 >0.5% | 回滚到上一阶段 |
| 延迟 p95 | 比基线增加 >200ms | 回滚到上一阶段 |
| CPU 利用率 | Pod 平均 >80% | 保持当前阶段，扩容 |
| 内存利用率 | Pod 平均 >85% | 保持当前阶段，扩容 |
| 业务指标变化 | 转化率下降 >5%（如适用） | 回滚到上一阶段 |

**滚动更新：**

标准 Kubernetes 滚动更新，`maxSurge=1`、`maxUnavailable=0` 实现零停机。健康检查宽限期设为 30 秒。

### 8.5 自动回滚机制

当金丝雀或完整部署表现出降级行为时，自动回滚机制在 2 分钟内将服务恢复到之前的健康版本。

**回滚触发流程：**

```
Prometheus Alert (any of):
  - error_rate:5m > baseline + 0.5%
  - latency_p95:5m > baseline + 200ms
  - cpu_avg:5m > 85%
  - memory_avg:5m > 90%
  - custom_business_metric:5m > 5% drop
         │
         ▼
┌────────────────────────────────┐
│  Rollback Trigger Evaluator    │
│  Confirms alert is NOT         │
│  a known false positive        │
│  (maintenance window,          │
│  known traffic spike)          │
└──────────────┬─────────────────┘
               │ confirmed
               ▼
┌────────────────────────────────┐
│  Rollback Executor Agent       │
│  1. Records current            │
│     deployment as failed       │
│  2. Reverts to previous        │
│     revision (kubectl          │
│     rollout undo)              │
│  3. Validates health and       │
│     smoke tests                │
│  4. Notifies on-call via       │
│     Slack/PagerDuty            │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Rollback SLA Clock            │
│  Target: < 2 minutes from      │
│  alert to healthy rollback     │
│  Tracks: detection +           │
│  decision + execution +        │
│  validation + notification     │
└────────────────────────────────┘
```

**回滚 SLA 分解：**

| 阶段 | 目标 | 度量方式 |
|-------|--------|-------------|
| 告警检测 | < 10 秒 | Prometheus AlertManager 延迟 |
| 决策评估 | < 5 秒 | 回滚触发智能体执行时间 |
| Kubernetes rollout undo | < 60 秒 | `kubectl rollout status` |
| 健康验证 | < 30 秒 | 健康检查端点轮询 |
| 通知 | < 5 秒 | Slack/PagerDuty API 调用 |
| **总计** | **< 110 秒** | 从告警到健康的端到端时间 |

**回滚安全规则：**

- 每个 BC 每 30 分钟最多 1 次自动回滚。如果需要第二次回滚，部署被阻塞，需要 SRE 负责人手动调查。
- 在计划维护窗口期间不触发回滚（从 ulw 日历集成读取）。
- 回滚保留来自失败部署的所有审计日志和指标数据，用于事后分析。

### 8.6 环境提升

代码在通往生产环境的路径上流经四个环境。每个环境都有必须满足的提升标准，流水线才能前进。

**提升流程：**

```
main branch
    │
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Dev         │───►│  Staging     │───►│  Canary      │───►│  Production  │
│              │    │              │    │              │    │              │
│ Auto-deploy  │    │ Manual       │    │ Auto-promote │    │ Manual       │
│ on merge     │    │ promote      │    │ on metrics   │    │ promote      │
│              │    │ (via Slack   │    │ pass         │    │ (via Slack   │
│              │    │  button)     │    │              │    │  approval)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │                    │
      │ 5-Gate passes      │ Staging tests      │ Canary metrics     │ Prod smoke
      │ (Gates 1-5)        │ pass               │ pass               │ tests pass
      ▼                    ▼                    ▼                    ▼
   Deploy              Deploy              Promote to           Live
                                                   100% traffic
```

**每个环境的提升标准：**

| 环境 | 触发条件 | 所需门控 | 所需测试 | 审批 |
|-------------|---------|---------------|----------------|----------|
| 开发 | 合并到主分支 | 门控 1-4 | 单元 + 契约 | 自动（无人） |
| 预发布 | 通过 Slack 按钮手动 | 门控 1-5（重新运行） | 完整套件 + 集成 | 技术负责人 |
| 金丝雀 | 预发布绿色 1 小时 | 门控 3-4（重新运行） | 冒烟 + E2E | 自动 |
| 生产 | 金丝雀绿色 15 分钟 | 无（已通过） | 冒烟 + 指标 | 工程经理 |

**每个环境的配置管理：**

环境特定的配置存储在流水线定义旁边的 Pulumi 栈文件中：

```
pipeline/
├── Pulumi.dev.yaml
├── Pulumi.staging.yaml
├── Pulumi.canary.yaml
├── Pulumi.prod.yaml
└── index.ts          # Shared pipeline logic
```

每个栈文件包含：
- 数据库连接字符串（通过 Vault 引用，从不明文）
- 特性标志覆盖
- 资源限制和副本数量
- 外部服务端点
- 日志级别和可观测性设置

提升智能体在提升时自动合并栈配置，确保正确的配置应用到每个环境，且没有环境特定的密钥泄漏到相邻环境中。

### 8.7 流水线可观测性

每个流水线阶段向 Prometheus 发出结构化指标。所有阶段结果、智能体决策和计时数据可在 Grafana 中查询。

**每个阶段的指标：**

| 指标 | 类型 | 标签 | 描述 |
|--------|------|--------|-------------|
| `ulw_pipeline_duration_seconds` | 直方图 | `gate`、`stage`、`bc`、`status` | 每个门控/阶段的执行时间 |
| `ulw_pipeline_pass_rate` | 计量器 | `gate`、`bc` | 滚动 7 天通过率 |
| `ulw_gate_failure_reason` | 计数器 | `gate`、`bc`、`reason` | 每个门控失败原因的分布 |
| `ulw_agent_duration_seconds` | 直方图 | `agent`、`gate`、`bc` | 每个智能体的执行时间 |
| `ulw_agent_confidence` | 计量器 | `agent`、`gate` | 智能体决策置信分数 |
| `ulw_test_execution_seconds` | 直方图 | `bc`、`test_type` | 测试套件执行时间 |
| `ulw_deploy_duration_seconds` | 直方图 | `bc`、`strategy`、`env` | 部署持续时间 |
| `ulw_rollback_count` | 计数器 | `bc`、`env`、`reason` | 回滚事件计数 |
| `ulw_promotion_lag_seconds` | 计量器 | `bc`、`from_env`、`to_env` | 提升就绪和实际提升之间的时间 |

**DORA 指标仪表盘：**

| DORA 指标 | ulw 度量方式 | 数据来源 | 目标 |
|-------------|----------------|-------------|--------|
| 部署频率 | 每周部署到生产的次数 | `ulw_deploy_duration_seconds` 计数 | 每日或更频繁 |
| 变更前置时间 | 从 PR 合并到生产部署的时间 | `ulw_promotion_lag_seconds` | < 1 小时 |
| 变更失败率 | 导致服务降级的部署百分比 | `ulw_rollback_count` / 总部署数 | < 5% |
| 服务恢复时间 | 从告警到健康回滚的时间 | 回滚 SLA 阶段总和 | < 30 分钟 |

**流水线瓶颈分析：**

可观测性智能体每周分析流水线指标并生成报告，识别：

- **最慢的门控**：p95 持续时间超过目标的门控。建议并行化或智能体优化。
- **失败热点**：每个门控失败率最高的端点或 BC。建议规范审查或测试重构。
- **智能体漂移**：置信分数随时间下降的智能体。标记潜在模型退化或上下文窗口问题。
- **提升瓶颈**：提升延迟长的 BC。识别瓶颈是人工审批延迟、测试执行时间还是基础设施配置。

瓶颈报告每周发布到 #platform-eng Slack 频道。持续超过其持续时间目标的门控被标记到下一个冲刺的平台待办事项中。

---

## 9. 技术栈

本节按层记录 ulw 平台的完整技术栈。每项技术包括选择理由，而不仅仅是名称。

### 9.1 核心平台栈

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **TypeScript** | 5.7+ | 主要编程语言 | 大规模类型安全。在 100+ 开发者和 50+ 限界上下文中，TypeScript 的结构化类型系统在编译时捕获集成错误。不断增长的智能体生态系统（OpenCode、OpenClaw SDK）是 TypeScript 原生的。 |
| **Node.js** | 22+ (LTS) | 运行时环境 | 长期支持保证，稳定的 V8 引擎，自 Node 22 起的原生 ESM 支持。异步 I/O 模型适合 ulw 的事件驱动架构，配合 NATS 和 webhook 处理。 |
| **NestJS** | 10.x | 后端框架 | 有主见的架构，内置支持模块（映射到限界上下文）、拦截器（用于横切关注点如追踪）和 GraphQL/REST 控制器。其依赖注入系统使测试单个智能体变得可行。 |
| **pnpm** | 9.x | 包管理器 | 磁盘高效的单仓管理，具有严格的依赖隔离。pnpm 的工作空间协议（`"@ulw/*": "workspace:*"`）防止意外的跨包版本漂移。在 CI 中比 npm 快 3 倍。 |
| **tRPC** | 11.x | 类型安全的内部 API | 消除了前后端之间以及编排器与智能体运行时之间的 API 契约鸿沟。完整的端到端类型安全意味着无需手动 API 客户端生成。用于 ulw 组件之间的所有内部同步 RPC。 |

**为什么选择 NestJS 而非其他方案**：NestJS 在 TypeScript 生态系统中提供了最成熟的模块系统，用于 DDD 对齐的后端架构。每个限界上下文映射到一个 NestJS 模块，具有自己的控制器、服务和提供者。Express（对于 100+ 开发者来说太无主见）和 Fastify（太简约）缺乏 NestJS 强制执行的架构约定。`@nestjs/bull` 和 `@nestjs/microservices` 包直接集成 NATS 和 Redis，减少了样板代码。

**为什么选择 tRPC 而非 gRPC**：对于 Kubernetes 集群内的服务间通信，tRPC 提供了与 gRPC 相同的类型安全，无需 protobuf 编译步骤。评估了 Protobuf 但被拒绝，因为 (a) 每个模式更改都需要重新生成步骤，减慢了迭代速度，(b) TypeScript 智能体 SDK 生态系统没有一等 protobuf 支持，(c) 对于 Kubernetes 集群规模（< 1000 req/s）的内部 RPC，tRPC 的 JSON 序列化开销可以忽略不计。gRPC 仍在 API 网关层用于存在多语言客户端的外部客户端集成。

### 9.2 智能体运行时

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **OpenCode** | 最新（自托管） | AI 代码生成引擎 | 专为智能体代码开发构建，具有 TDD 强制、Git 工作树隔离和多智能体编排。原生 TypeScript SDK 允许直接与 ulw 的编排器集成，无需网络边界即可进行同步操作。 |
| **OpenClaw Gateway** | 最新（自托管） | AI 代码审查引擎 | 设计为 OpenCode 的审查对应物。处理 6 智能体审查流水线、LLM 交互管理和 webhook 处理。作为自托管 Gateway 部署在 Kubernetes 上，实现数据主权（源代码从不离开集群进行 LLM 推理）。 |
| **Vitest** | 3.x | 测试运行时 | 替代 Jest 作为所有单元和集成测试的测试运行时。原生 ESM 支持，TypeScript 优先（无需 Babel 转换），对于大型单仓，监视模式比 Jest 快 10 倍。`@vitest/runner` API 允许从测试运行时智能体进行编程式测试执行。 |
| **Kubernetes Client** | `@kubernetes/client-node` 1.x | 部署运行时 | TypeScript 的官方 Kubernetes 客户端。由部署运行时智能体用于编程式管理部署、服务、金丝雀发布和回滚，无需 shell 调用 `kubectl`。 |

**OpenCode 部署模型**：OpenCode 运行时作为每个开发任务的 Kubernetes Job 运行。每个 Job 获得自己的临时 PVC 支持的工作空间，带有新的 git 工作树、隔离的 Node.js 进程和专用的 LLM API 连接。Job 生命周期由编排器管理：在任务分配时创建，通过健康检查监控，完成后 30 分钟清理。

**OpenClaw 部署模型**：OpenClaw 作为长期运行的 Deployment（而非 Job）运行，因为它维护与 NATS JetStream 消费者和智能体池的持久连接。水平 Pod 自动扩缩根据 NATS 队列深度扩展 Gateway 副本数量。每个 Gateway 副本管理可配置数量的并发审查智能体（默认：每个副本 4 个）。

**测试运行时架构**：测试运行时是 Vitest 编程式 API 的薄包装。它接收测试规格（要运行的测试文件、使用的环境、要执行的覆盖率阈值），在沙盒化的 Node.js 进程中执行测试，并返回结构化结果（通过/失败计数、覆盖率百分比、失败详情）。它本身不生成测试（这是 TDD 模块的职责）；它只执行它们。

### 9.3 数据基础设施

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **PostgreSQL** | 16+ | 主数据库 | 成熟的关系型数据库，通过 Drizzle ORM 具有出色的 TypeScript 支持。PostgreSQL 16 为并行查询执行和逻辑复制带来了性能改进。用于所有领域状态、智能体状态、审查发现和工作流历史。 |
| **Drizzle ORM** | 0.40.x | 数据库 ORM | TypeScript 优先的 ORM，从模式声明生成完整的类型定义。与 Prisma 不同，Drizzle 不需要代码生成步骤（无 `prisma generate`），使 CI 流水线保持精简。其类似 SQL 的查询语法让开发者完全控制查询性能。PostgreSQL 中的行级安全策略与 Drizzle 的原始查询支持兼容。 |
| **Redis** | 7+ | 缓存 + 会话存储 | 内存中数据结构存储，用于三个目的：(a) 缓存频繁访问的数据（策略文件、限界上下文映射），亚毫秒延迟，(b) 存储 OpenClaw 审查会话状态，用于 ACP 子会话集成模式，(c) 智能体作业协调的分布式锁。Redis 7 新增了分片发布/订阅功能，改善了临时消息的 NATS 卸载。 |
| **NATS JetStream** | 2.10+ | 事件流 | 轻量级、高吞吐量的消息代理，专为云原生环境设计。选择它而非 Kafka 因为 (a) NATS 在 Kubernetes 上操作简单 10 倍（单二进制，无 ZooKeeper 依赖），(b) JetStream 为审查作业队列提供精确一次交付保证，(c) TypeScript NATS 客户端（`nats.js`）是一等公民并由 NATS 团队维护。NATS 处理所有异步通信：审查作业队列、工作流状态转换、领域事件和 CI/CD 流水线事件。 |
| **MinIO** | 最新 | 对象存储 | 与 S3 兼容的 Kubernetes 对象存储。存储审查工件（完整的 PR 快照、智能体输出日志、测试报告、部署清单）。选择它而非特定云的 S3 因为 (a) 它在集群内运行，无需出口费用，(b) 它提供 S3 兼容 API，因此相同的 TypeScript SDK（`@aws-sdk/client-s3`）适用于本地和云部署，(c) 纠删码提供数据持久性而无需复制开销。 |

**数据流架构**：

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│PostgreSQL│     │  Redis   │     │  NATS    │     │  MinIO   │
│          │     │          │     │JetStream │     │          │
├──────────┤     ├──────────┤     ├──────────┤     ├──────────┤
│ Domain   │     │ Cache:   │     │ Review   │     │ Artifact │
│ State    │     │ Policy   │     │ Jobs     │     │ Store:   │
│ Findings │     │ Configs  │     │ Workflow │     │ PR Diffs │
│ Workflow │     │ BC Maps  │     │ Events   │     │ Reports  │
│ History  │     │          │     │ CI/CD    │     │ Logs     │
│ Users    │     │ Session: │     │ Events   │     │          │
│ Policies │     │ ACP      │     │          │     │          │
│          │     │ Sessions │     │ Audit    │     │          │
│          │     │          │     │ Events   │     │          │
│          │     │ Lock:    │     │          │     │          │
│          │     │ Job Coord│     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 9.4 测试与质量

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **Vitest** | 3.x | 单元 + 集成测试运行器 | 如 9.2 所述，Vitest 是所有 TypeScript 代码的单一测试运行器。它与 Jest API 的兼容性意味着现有 Jest 用户的零迁移成本，同时提供更好的性能和 ESM 支持。`@vitest/coverage-istanbul` 插件提供 Istanbul 覆盖率报告。 |
| **Playwright** | 1.50+ | E2E + 浏览器测试 | 浏览器自动化的行业标准。由测试运行时用于对已部署服务的端到端测试以及 ulw 仪表盘 UI 的视觉回归测试。TypeScript 优先的 API 和跟踪查看器使调试 CI 失败高效。 |
| **Pact** | 4.x | 契约测试 | HTTP 和基于消息的集成的消费者驱动契约测试。每个限界上下文为其 API 发布 Pact 契约，下游上下文在 CI 中对照这些契约进行验证。这防止了一个 BC 中的变更静默破坏另一个 BC 的"集成破坏"场景。 |
| **Supertest** | 7.x | HTTP 断言测试 | 与 NestJS 的 `@nestjs/testing` 配合，用于控制器级别的集成测试。提供流畅的 API，用于针对 NestJS 应用程序实例进行 HTTP 断言，无需启动服务器。 |
| **ESLint + Oxlint** | ESLint 9.x, Oxlint 0.15+ | 静态分析 | ESLint 仍然是 TypeScript 特定规则（命名约定、类型安全）的主要链接器。Oxlint（由 oxc 项目开发）作为更快的基于 Rust 的链接器与 ESLint 并行运行，用于通用代码质量规则。Oxlint 涵盖 ESLint 处理较慢的规则（导入排序、未使用变量），而 ESLint 处理 Oxlint 尚未支持的 TypeScript 特定规则。 |
| **Semgrep** | 1.80+ | SAST（静态分析） | 基于模式的静态分析，理解代码结构而不仅仅是文本。与 ESLint（在 AST 上操作）不同，Semgrep 规则可以表达多文件模式和跨函数的数据流。由安全智能体用于针对每个限界上下文定制的自定义安全规则。 |
| **Trivy** | 0.60+ | 漏洞扫描 | 扫描容器镜像、依赖清单和 IaC 文件以查找已知漏洞（CVE）。集成到 CI 流水线中作为容器镜像升级前的门控。选择它而非 Snyk 因为它是开源的、完全离线运行，并与现有 GitHub 容器注册表工作流集成。 |
| **SonarQube** | 10.x | 质量指标 | 提供代码质量趋势的历史视图：技术债务比率、代码覆盖率、重复和可维护性指数。由代码质量智能体用作基于趋势的发现的数据源（例如，"此 PR 将技术债务比率增加了 2%"）。在同一 Kubernetes 集群上自托管以保护数据隐私。 |

### 9.5 CI/CD 与基础设施

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **GitHub Actions** | N/A | CI/CD 触发器 | 已经是组织中大多数仓库的 CI 提供者。ulw 通过 webhook 接收工作流运行事件并发布 CI 状态检查与 GitHub Actions 集成。Actions 仅是触发层；实际的 CI/CD 逻辑在 ulw 的部署运行时中在 Kubernetes 上执行。 |
| **Pulumi** | 3.x + TypeScript SDK | 基础设施即代码 | 声明式基础设施管理，使用 TypeScript。选择它而非 Terraform 因为 (a) 基础设施使用与应用程序相同的语言定义，减少了上下文切换，(b) Pulumi 的 `StackReference` 模式允许开发/预发布/生产基础设施的可组合性，(c) `@pulumi/kubernetes` 包提供了一等 Kubernetes 资源管理，无需 YAML 模板。 |
| **Kubernetes** | 1.32+ | 容器编排 | 目标部署平台。版本 1.32 带来了对边车容器（对 OpenClaw Gateway 的 NATS 消费者边车有用）和生产就绪状态 Improved Job API 可靠性的支持（对 OpenCode 任务执行至关重要）。 |
| **Helm** | 3.17+ | 包管理 | 用于将 ulw 组件打包为可重用图表。每个限界上下文的微服务都有自己的 Helm 图表，带有环境特定的 `values.yaml` 覆盖。OpenClaw Gateway、PostgreSQL、Redis、NATS 和 MinIO 各有自己的图表。 |
| **ArgoCD** | 2.14+ | GitOps 部署 | 基于拉的部署控制器，将 Kubernetes 集群状态与 Git 仓库同步。当 Helm 图表变更合并到 `infrastructure` 分支时，ArgoCD 检测漂移并应用变更。选择它而非 Flux 因为其成熟的 Web UI、与 Keycloak 的 SSO 集成以及用于声明式管理多环境部署的 ApplicationSet 控制器。 |

**GitOps 工作流**：

```
Developer merges Helm chart change to GitHub branch: infrastructure
       │
       ▼
ArgoCD detects drift from Git, compares with cluster state
       │
       ├── No drift → No action
       │
       └── Drift detected → Sync (auto or manual depending on environment)
              │
              ├── dev: auto-sync, immediate
              ├── staging: auto-sync, after CI tests pass
              └── production: manual sync, requires Tech Lead approval
```

### 9.6 可观测性

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **OpenTelemetry** | SDK 0.200+ (JS), Collector 0.110+ | 分布式追踪 | 可观测性仪表化的行业标准。每个智能体动作、每个工作流步骤、每个数据库查询都发出追踪。OpenTelemetry Collector 作为 DaemonSet 在每个 Kubernetes 节点上运行，通过 OTLP 接收追踪并转发到 Tempo 进行存储。 |
| **Prometheus** | 3.x | 指标收集 | Kubernetes 指标的事实标准。每个 ulw 组件暴露一个 `/metrics` 端点，带有自定义指标（审查持续时间、每个智能体的发现数、队列深度、流水线通过/失败率）。Prometheus Operator 通过 ServiceMonitor CRD 管理抓取配置。 |
| **Grafana** | 11.x | 可视化 | 指标和追踪的统一仪表盘平台。审查分析仪表盘（第 6.5 节描述）构建在 Grafana 中。告警规则在 Grafana 中运行，根据严重级别路由到 Slack 或 PagerDuty。 |
| **ELK Stack** (Elasticsearch, Logstash, Kibana) | 8.x | 审计日志 + 日志聚合 | 所有平台审计事件（人工审批、策略覆盖、智能体动作）通过 Filebeat 发送到 Elasticsearch。Kibana 仪表盘提供合规报告和事件调查。选择它而非 Loki 因为审计用例需要对结构化 JSON 事件进行全文搜索和长期保留（审计合规为 2 年）。 |
| **Sentry** | 2.x (SDK) | 错误追踪 | NestJS 后端和智能体运行时的应用级错误监控。捕获未处理的异常、性能瓶颈和事务追踪。与 Slack 集成以进行实时错误通知。选择它而非 Datadog APM 因为 (a) Sentry 可在 Kubernetes 上自托管，(b) 其按事务计价的定价对于智能体重负载（每天 100+ 次审查）更可预测，(c) TypeScript SDK 提供源映射上传以支持可调试的错误堆栈。 |

**可观测性数据流**：

```
Agent / Service
       │
       ├── OpenTelemetry SDK ──OTLP──► OpenTelemetry Collector
       │                                         │
       │                              ┌──────────┼──────────┐
       │                              │          │          │
       │                         ┌────▼────┐ ┌──▼───┐ ┌───▼────┐
       │                         │  Tempo  │ │Prom  │ │Elastic │
       │                         │(Traces) │ │etheus│ │search  │
       │                         └─────────┘ └──────┘ └────────┘
       │                              │          │
       │                         ┌────▼──────────▼────┐
       │                         │      Grafana       │
       │                         │  Dashboards +      │
       │                         │  Alerts            │
       │                         └────────────────────┘
       │
       ├── Sentry SDK ────► Sentry (error tracking)
       │
       └── Filebeat ──────► Elasticsearch (audit logs)
```

### 9.7 安全

| 技术 | 版本 | 用途 | 选择理由 |
|-----------|---------|---------|-------------------|
| **HashiCorp Vault** | 1.18+ | 密钥管理 | 集中式密钥存储，支持动态密钥生成。每个 Kubernetes Pod 获得一个 Vault 边车，以环境变量或文件形式注入密钥（数据库凭证、API 密钥、GitHub 令牌）。Vault 的 Kubernetes 认证方法允许 Pod 使用其服务账户令牌进行身份验证，完全消除了静态凭证。 |
| **Keycloak** | 26.x | SSO / RBAC | 开源身份和访问管理。通过 OIDC 为 ulw 仪表盘、ArgoCD、Grafana 和 Kibana 提供单点登录。基于角色的访问控制映射到限界上下文：IdentityAccess BC 中的开发者不能触发 Payment BC 的部署。Keycloak 在同一个 Kubernetes 集群上运行，带有复制的 PostgreSQL 后端。 |
| **mTLS** | Kubernetes NetworkPolicy + Istio | 服务到服务加密 | 所有 ulw 组件之间的双向 TLS。Istio 的边车代理透明地处理 mTLS，因此应用程序代码不需要管理证书。所有服务间流量在传输层加密和认证，防止未授权的服务冒充。 |
| **OPA / Gatekeeper** | OPA 1.x, Gatekeeper 3.18+ | 策略执行 | 准入控制器，在创建之前根据组织策略验证所有 Kubernetes 资源。用于强制：(a) 所有 Deployment 必须具有资源限制，(b) 所有容器必须来自内部仓库，(c) 没有特权 Pod 在 `ulw-system` 命名空间之外，(d) 所有 Ingress 主机必须在允许的域名列表中。策略用 Rego 编写并存储在 Git 仓库中。 |

**安全架构总结**：

| 层 | 机制 | 保护内容 |
|-------|-----------|-----------------|
| **网络** | mTLS (Istio) + NetworkPolicies | 所有服务间通信 |
| **认证** | Keycloak OIDC + Vault K8s auth | 用户登录、Pod 身份、API 访问 |
| **授权** | Keycloak RBAC + OPA 策略 | 每 BC 访问控制、资源约束 |
| **密钥** | HashiCorp Vault | 数据库凭据、API 密钥、令牌 |
| **供应链** | Trivy 扫描 + 容器签名 | 镜像漏洞、篡改 |
| **审计** | ELK + OpenTelemetry | 不可变操作日志用于合规 |

### 9.8 版本矩阵

此表捕获了栈中每项技术的确切版本和升级策略。

| 层 | 技术 | 当前版本 | 最低版本 | 升级策略 |
|-------|-----------|----------------|-----------------|---------------|
| **核心语言** | TypeScript | 5.7 | 5.4 | 锁定主版本；次版本在发布后 30 天内升级 |
| **运行时** | Node.js | 22 LTS | 20 LTS | 遵循 LTS 时间表；在 90 天内升级到新的 LTS |
| **后端框架** | NestJS | 10.4 | 10.0 | 锁定主版本；补丁立即升级 |
| **包管理器** | pnpm | 9.15 | 9.0 | 锁定主版本；次版本在 30 天内升级 |
| **内部 API** | tRPC | 11.6 | 11.0 | 锁定主版本；次版本在 14 天内升级 |
| **数据库** | PostgreSQL | 16.4 | 16.0 | 遵循 PostgreSQL 版本策略；每个主版本在生产升级前测试 60 天 |
| **ORM** | Drizzle ORM | 0.40.0 | 0.38.0 | 锁定次版本；补丁立即升级 |
| **缓存** | Redis | 7.4 | 7.0 | 遵循 Redis 版本策略；次版本在 30 天内升级 |
| **事件总线** | NATS JetStream | 2.10.24 | 2.10.0 | 锁定次版本；补丁立即升级 |
| **对象存储** | MinIO | RELEASE.2025-04 | RELEASE.2025-01 | 遵循 MinIO 发布；每月升级 |
| **测试运行器** | Vitest | 3.1 | 3.0 | 锁定主版本；次版本在 14 天内升级 |
| **E2E 测试** | Playwright | 1.52 | 1.50 | 每月升级（浏览器二进制自动更新） |
| **契约测试** | Pact | 4.8 | 4.5 | 锁定主版本；次版本在 30 天内升级 |
| **静态分析** | ESLint | 9.24 | 9.0 | 锁定主版本；次版本在 30 天内升级 |
| **静态分析** | Oxlint | 0.15 | 0.12 | 每月升级（预发布通道） |
| **SAST** | Semgrep | 1.82 | 1.80 | 每周升级（规则更新捆绑） |
| **漏洞扫描** | Trivy | 0.61 | 0.58 | 每周升级（CVE 数据库更新） |
| **质量指标** | SonarQube | 10.8 | 10.6 | 锁定主版本；次版本在 60 天内升级 |
| **CI 触发器** | GitHub Actions | N/A (托管) | N/A | 不可变；按 SHA 而非标签锁定操作版本 |
| **IaC** | Pulumi | 3.148 | 3.140 | 锁定次版本；补丁在 7 天内升级 |
| **编排** | Kubernetes | 1.32 | 1.30 | 遵循上游；发布后 60 天内升级次版本 |
| **包管理器** | Helm | 3.17 | 3.16 | 锁定主版本；次版本在 30 天内升级 |
| **GitOps** | ArgoCD | 2.14 | 2.12 | 锁定主版本；次版本在 30 天内升级 |
| **追踪** | OpenTelemetry JS SDK | 0.200 | 0.190 | 每月升级（GA 前 API 可能变化） |
| **指标** | Prometheus | 3.2 | 3.0 | 锁定主版本；次版本在 30 天内升级 |
| **可视化** | Grafana | 11.5 | 11.0 | 锁定主版本；次版本在 14 天内升级 |
| **审计日志** | Elasticsearch | 8.17 | 8.15 | 锁定主版本；次版本在 30 天内升级 |
| **错误追踪** | Sentry | 2.22 (SDK) | 2.18 | 每月升级 |
| **密钥** | HashiCorp Vault | 1.18 | 1.16 | 锁定主版本；次版本在 30 天内升级 |
| **SSO/RBAC** | Keycloak | 26.1 | 26.0 | 锁定主版本；次版本在 14 天内升级 |
| **服务网格** | Istio | 1.25 | 1.23 | 遵循 Istio 发布节奏；次版本在 60 天内升级 |
| **策略引擎** | OPA/Gatekeeper | 3.18 | 3.16 | 锁定主版本；次版本在 30 天内升级 |

#### 升级策略说明

- **补丁升级**（例如，1.0.0 到 1.0.1）：由 Renovate 机器人自动应用，CI 通过后自动合并。除非 CI 失败，否则不需要人工审查。
- **次版本升级**（例如，1.0 到 1.1）：由 Renovate 机器人作为单独的 PR 应用。需要平台团队审查，并必须在上表指定的窗口内合并。
- **主版本升级**（例如，1.x 到 2.x）：规划为工程项目，附带迁移指南、测试窗口和回滚计划。无自动 PR。平台团队在计划维护窗口期间安排主版本升级。
- **Kubernetes 版本升级**：遵循 `n-2` 支持策略。集群绝不能落后于最新稳定版本超过 2 个次版本。升级在开发和生产前在预发布环境中测试 2 周。
- **安全补丁**：无论版本如何，24 小时内应用。Renovate 的 `vulnerabilityAlerts` 配置为任何具有已知 CVE 且严重级别为 HIGH 或以上的依赖项触发即时 PR。

---

## 10. 数据流与集成

### 10.1 端到端数据流场景

以下图表记录了通过 ulw 平台的四个主要数据流。每个流跟踪数据从触发到转换、持久化和交接的过程。

**10.1.1 功能开发流程**

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │     │ Orchestrator │     │  PostgreSQL   │     │  OpenCode    │
│  (CLI)   │     │              │     │               │     │  Agent Pod   │
└────┬─────┘     └──────┬───────┘     └──────┬────────┘     └──────┬───────┘
     │                  │                    │                     │
     │  POST /project   │                    │                     │
     │  {name, spec}    │                    │                     │
     │─────────────────>│                    │                     │
     │                  │  INSERT project    │                     │
     │                  │  (PENDING)         │                     │
     │                  │───────────────────>│                     │
     │                  │                    │                     │
     │                  │  DECOMPOSE spec    │                     │
     │                  │  into work items   │                     │
     │                  │                    │                     │
     │                  │  INSERT work_items │                     │
     │                  │───────────────────>│                     │
     │                  │                    │                     │
     │                  │  SPAWN agent job   │                     │
     │                  │  (worktree scope)  │─────────────────────>│
     │  {project_id}    │                    │                     │
     │<─────────────────│                    │                     │
     │                  │                    │    PULL work_items  │
     │                  │                    │<────────────────────│
     │                  │                    │                     │
     │                  │                    │    PUSH git commit  │
     │                  │    UPDATE state    │    (worktree->repo)  │
     │                  │<───────────────────│─────────────────────│
     │                  │                    │                     │
     │                  │  UPDATE status     │                     │
     │                  │  (COMPLETED)       │                     │
     │                  │───────────────────>│                     │
     │                  │                    │                     │
     │  GET /status     │                    │                     │
     │  {status: done}  │                    │                     │
     │<─────────────────│                    │                     │
```

数据转换：
- 用户规格 (YAML/JSON) -> 规范化的工作项（结构化行）
- 工作项 -> 智能体提示上下文（已解析的依赖）
- 智能体输出 -> git 提交（持久化到仓库的文件差异）
- 提交哈希 -> 项目状态更新 (PostgreSQL)

持久化点：
- 项目记录：PostgreSQL `projects` 表
- 工作项 + DAG 边：PostgreSQL `work_items`、`workflow_edges` 表
- 智能体会话状态：PostgreSQL `agent_sessions` 表
- 代码工件：MinIO `code-artifacts` 存储桶（每次提交的快照）

交接机制：
- 编排器 -> OpenCode：NATS `agent.task.execute` 主题
- OpenCode -> 编排器：NATS `agent.task.completed` 主题
- OpenCode -> Git：通过 SSH 部署密钥 `git push`

**10.1.2 代码审查流程**

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  GitHub  │     │  OpenClaw    │     │  PostgreSQL   │     │  Supervisor  │
│  Webhook │     │  Ingress     │     │               │     │              │
└────┬─────┘     └──────┬───────┘     └──────┬────────┘     └──────┬───────┘
     │                  │                    │                     │
     │  PR opened/sync  │                    │                     │
     │─────────────────>│                    │                     │
     │                  │  VALIDATE payload  │                     │
     │                  │  (HMAC signature)  │                     │
     │                  │                    │                     │
     │                  │  INSERT review_job │                     │
     │                  │───────────────────>│                     │
     │                  │                    │                     │
     │                  │  FETCH PR diff     │                     │
     │                  │  (git fetch)       │                     │
     │                  │                    │                     │
     │                  │  SPAWN 6 agents    │                     │
     │                  │──────────────────────────────────────────>│
     │                  │                    │                     │
     │                  │                    │    AGENT PIPELINE   │
     │                  │                    │    Style Checker    │
     │                  │                    │    Security Scan    │
     │                  │                    │    Architecture     │
     │                  │    STORE each      │    TDD Compliance   │
     │                  │    finding         │    Performance      │
     │                  │<───────────────────│    Best Practices   │
     │                  │────────────────────│─────────────────────│
     │                  │                    │                     │
     │                  │  AGGREGATE report  │                     │
     │                  │  (PASS/COND/FAIL)  │                     │
     │                  │                    │                     │
     │                  │  POST status       │                     │
     │                  │  to GitHub         │                     │
     │<─────────────────│                    │                     │
     │                  │                    │                     │
     │                  │  UPDATE review_job │                     │
     │                  │───────────────────>│                     │
```

数据转换：
- GitHub webhook JSON -> 规范化的审查作业（PR 元数据 + 差异引用）
- PR 差异（git 补丁格式）-> 每智能体审查输入（解析的 AST、依赖图）
- 智能体发现 -> 结构化审查结果（严重级别、文件、行、消息）
- 6 个智能体结果 -> 聚合报告（通过/有条件通过/失败）

持久化点：
- 审查作业：PostgreSQL `review_jobs` 表
- 每智能体发现：PostgreSQL `review_findings` 表
- 审查报告：MinIO `review-reports` 存储桶（完整 markdown + JSON）
- PR 状态检查：GitHub API（外部）

交接机制：
- GitHub -> OpenClaw：HTTP webhook POST `/webhook/github`
- OpenClaw -> 智能体子任务：NATS `review.agent.execute` 主题
- 智能体 -> OpenClaw：NATS `review.agent.result` 主题
- OpenClaw -> GitHub：REST API `POST /repos/{owner}/{repo}/statuses/{sha}`

**10.1.3 CI/CD 流水线流程**

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  GitHub  │     │  Pipeline    │     │  NATS         │     │  Kubernetes  │
│  (Merge) │     │  Engine      │     │  JetStream    │     │  (ArgoCD)    │
└────┬─────┘     └──────┬───────┘     └──────┬────────┘     └──────┬───────┘
     │                  │                    │                     │
     │  push main       │                    │                     │
     │─────────────────>│                    │                     │
     │                  │                    │                     │
     │                  │  PUBLISH           │                     │
     │                  │  pipeline.started   │                     │
     │                  │───────────────────>│                     │
     │                  │                    │                     │
     │  ┌───────────────┴───────────────────┐│                     │
     │  │ GATE 1: Unit Tests               ││                     │
     │  │ GATE 2: Integration Tests        ││                     │
     │  │ GATE 3: API Contract Tests       ││                     │
     │  │ GATE 4: Security Scan            ││                     │
     │  │ GATE 5: Manual Approval          ││                     │
     │  └───────────────┬───────────────────┘│                     │
     │                  │                    │                     │
     │                  │  ON ALL PASS       │                     │
     │                  │  PUBLISH           │                     │
     │                  │  pipeline.approved  │                     │
     │                  │───────────────────>│                     │
     │                  │                    │                     │
     │                  │  DEPLOY canary     │                     │
     │                  │  (10% traffic)     │─────────────────────>│
     │                  │                    │                     │
     │                  │                    │  WATCH health       │
     │                  │                    │<────────────────────│
     │                  │                    │                     │
     │                  │  ROLLOUT 100%      │                     │
     │                  │  (or auto-rollback)│                     │
     │                  │───────────────────>│─────────────────────>│
     │                  │                    │                     │
     │                  │  PUBLISH           │                     │
     │                  │  pipeline.completed │                     │
     │                  │───────────────────>│                     │
```

数据转换：
- Git 推送事件 -> 流水线执行计划（5 个门控的 DAG）
- 门控输出（测试结果、扫描报告）-> 门控通过/失败决策
- 所有门控通过 -> 部署清单（Helm 值、镜像标签）
- 金丝雀健康指标 -> 发布百分比或回滚信号

持久化点：
- 流水线执行：PostgreSQL `pipeline_runs` 表
- 门控结果：PostgreSQL `gate_results` 表
- 构建工件：MinIO `build-artifacts` 存储桶
- 部署历史：PostgreSQL `deployments` 表
- 流水线事件：NATS JetStream `pipeline.>` 流

交接机制：
- GitHub -> 流水线引擎：NATS `git.push.main` 主题（来自 webhook 代理）
- 流水线 -> NATS：`pipeline.gate.{n}.{pass/fail}` 主题
- 流水线 -> ArgoCD：REST API `POST /api/v1/applications/{app}/sync`
- 流水线 -> Slack：NATS `notify.slack.{channel}` 主题

**10.1.4 智能体间通信流程**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NATS JetStream                                │
│                                                                      │
│  ┌──────────┐   agent.task.result    ┌──────────┐                   │
│  │ OpenCode │────────────────────────>│ Orchest  │                   │
│  │ Agent A  │  {task_id, status,     │ -rator   │                   │
│  └──────────┘   artifacts, metrics}  └────┬─────┘                   │
│                                            │                         │
│  ┌──────────┐   agent.task.execute         │                         │
│  │ OpenClaw │<─────────────────────────────┘                         │
│  │ Agent B  │  {task_id, target,          │                         │
│  └──────────┘   scope, constraints}        │                         │
│                                            │                         │
│  ┌──────────┐   review.findings            │                         │
│  │ Test     │<─────────────────────────────┘                         │
│  │ Agent    │  {review_id, rule,          │                         │
│  └──────────┘   severity, location}        │                         │
│                                            │                         │
│  ┌──────────┐   deploy.task.execute        │                         │
│  │ Deploy   │<─────────────────────────────┘                         │
│  │ Agent    │  {env, manifest,            │                         │
│  └──────────┘   rollout_strategy}          │                         │
│                                            │                         │
│  DATA PERSISTENCE                          │                         │
│  PostgreSQL <--- State snapshots ----------┘                         │
│  MinIO     <--- Artifact references --------┘                         │
│  Redis     <--- Lock + session ------------┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

通信模式：
- **请求-回复** (NATS)：编排器发布任务，智能体回复结果
- **发布-订阅** (NATS)：流水线事件广播到观察者（Slack、Grafana、审计日志）
- **流** (NATS JetStream)：领域事件被持久化以用于重放和事件溯源
- **副作用** (MinIO)：大型工件写入对象存储；消息仅携带 URI

消息信封：
```typescript
interface AgentMessage {
  correlationId: string;       // UUID v7, traces entire workflow
  taskId: string;              // UUID v7
  agentType: "opencode" | "openclaw" | "test" | "deploy";
  sessionId: string;           // Agent session UUID
  messageType: string;         // e.g. "agent.task.execute"
  payload: unknown;            // type-specific payload
  timestamp: string;           // ISO 8601
  ttl: number;                 // Time-to-live in seconds
  sourceAgentId: string;       // Originating agent
  targetAgentId: string;       // Destination agent (or "*" for broadcast)
}
```

---

### 10.2 领域事件目录

每个限界上下文通过 NATS JetStream 发出领域事件。事件是异步通信和审计的骨干。

**10.2.1 事件模式格式**

```typescript
interface DomainEvent<T = unknown> {
  eventId: string;             // UUID v7
  eventType: string;           // e.g. "project.created"
  eventVersion: number;        // Semantic version of schema
  aggregateType: string;       // e.g. "Project", "Review", "Pipeline"
  aggregateId: string;         // UUID of the aggregate root
  correlationId: string;       // Traces across aggregate boundaries
  causationId: string;         // ID of the command/event that caused this
  occurredAt: string;          // ISO 8601
  data: T;                     // Type-specific payload
  metadata: {
    agentId?: string;
    userId?: string;
    sessionId?: string;
    sourceIp?: string;
  };
}
```

**10.2.2 按限界上下文的事件目录**

| 上下文 | 事件类型 | 模式版本 | 负载摘要 | 发布者 | 消费者 |
|---------|-----------|----------------|-----------------|-----------|-----------|
| Project | `project.created` | v1 | `{ projectId, name, ownerId, specUri, createdAt }` | 编排器 | 监督器、审计 |
| Project | `project.spec.defined` | v1 | `{ projectId, specVersion, boundedContexts[], dddDecisions[] }` | 编排器 | OpenCode、监督器 |
| Project | `project.spec.updated` | v1 | `{ projectId, specVersion, changes[] }` | 编排器 | OpenCode、OpenClaw |
| Project | `project.archived` | v1 | `{ projectId, archivedBy, reason }` | 编排器 | 审计、MinIO |
| Code | `code.generation.started` | v1 | `{ taskId, projectId, workItemId, agentId, timestamp }` | OpenCode | 编排器、审计 |
| Code | `code.generated` | v1 | `{ taskId, commitHash, filesChanged[], branchName, diffStats }` | OpenCode | 编排器、OpenClaw |
| Code | `code.generation.failed` | v1 | `{ taskId, errorCode, errorMessage, retryCount }` | OpenCode | 编排器、监督器 |
| Review | `review.started` | v1 | `{ reviewId, prNumber, repoFullName, sha, agentIds[] }` | OpenClaw | 编排器、审计 |
| Review | `review.agent.completed` | v1 | `{ reviewId, agentType, findingCount, verdict }` | OpenClaw Agent | OpenClaw 聚合器 |
| Review | `review.completed` | v1 | `{ reviewId, overallVerdict, findingCount, reportUri }` | OpenClaw | 编排器、GitHub |
| Review | `review.findings.exceeded` | v1 | `{ reviewId, threshold, actualCount, escalationLevel }` | OpenClaw | 监督器、Slack |
| Testing | `tests.generation.started` | v1 | `{ testSuiteId, apiSpecUri, targetCount, coverageTarget }` | 测试运行时 | 编排器 |
| Testing | `tests.generated` | v1 | `{ testSuiteId, testCount, testFilePaths[], coverageEstimate }` | 测试运行时 | 编排器、OpenCode |
| Testing | `tests.executed` | v1 | `{ testRunId, passed, failed, skipped, coverage, durationMs }` | 测试运行时 | 流水线引擎、审计 |
| Testing | `tests.passed` | v1 | `{ testRunId, coverage, threshold, durationMs }` | 测试运行时 | 流水线引擎 |
| Testing | `tests.failed` | v1 | `{ testRunId, failures[]{ testName, message, stackTrace } }` | 测试运行时 | 流水线引擎、Slack |
| CI/CD | `pipeline.started` | v1 | `{ pipelineId, projectId, commitSha, branch, gates[] }` | 流水线引擎 | 编排器、审计 |
| CI/CD | `pipeline.gate.passed` | v1 | `{ pipelineId, gateName, gateNumber, durationMs, evidenceUri }` | 流水线引擎 | NATS 流 |
| CI/CD | `pipeline.gate.failed` | v1 | `{ pipelineId, gateName, gateNumber, failureReason, artifactsUri }` | 流水线引擎 | Slack、监督器 |
| CI/CD | `deployment.triggered` | v1 | `{ deploymentId, environment, imageTag, rolloutStrategy, canaryPercent }` | 流水线引擎 | 部署运行时 |
| CI/CD | `deployment.health.ok` | v1 | `{ deploymentId, environment, metrics{ errorRate, latency, cpu }, observationWindow }` | 部署运行时 | 流水线引擎 |
| CI/CD | `deployment.rollback` | v1 | `{ deploymentId, environment, reason, previousVersion, autoRollback }` | 部署运行时 | 流水线引擎、Slack |
| CI/CD | `release.completed` | v1 | `{ releaseId, projectId, version, changelogUri, artifacts[]{ name, uri, checksum } }` | 流水线引擎 | 编排器、审计、Slack |
| Security | `secret.detected` | v1 | `{ scanId, filePath, lineNumber, secretType, severity, recommendation }` | OpenClaw | 监督器、Slack |
| Security | `policy.violation` | v1 | `{ violationId, policyName, resource, action, agentId, enforced }` | OPA 边车 | 监督器、审计 |
| Governance | `audit.trail.flushed` | v1 | `{ batchSize, fromTimestamp, toTimestamp, hashChainAnchor }` | 审计服务 | 冷存储 |

**10.2.3 事件版本策略**

- **模式演进**：仅向后兼容的添加（新的可选字段）。破坏性变更创建新的事件类型版本：`project.created.v2`。
- **类型中的版本**：`{aggregate}.{action}.v{version}` -- 例如，`project.created.v1`。
- **迁移**：NATS JetStream 消费者在订阅中声明 `max_version`。一个事件桥接器将旧版本事件转换为当前版本，供需要它的消费者使用。
- **退役**：超过 6 个月的事件版本在维护窗口期间通过重放迁移到当前模式。

---

### 10.3 集成协议规范

**10.3.1 OpenClaw Webhook 负载模式**

在 `POST /webhook/github` 和 `POST /webhook/gitlab` 接收。

```typescript
interface OpenClawWebhookPayload {
  provider: "github" | "gitlab";
  eventType: "pull_request.opened" | "pull_request.synchronize" | "pull_request.reopened"
    | "push" | "issue_comment.created";
  signature: string;           // HMAC-SHA256 of body with shared secret

  // Standardized PR fields (normalized from provider formats)
  pullRequest: {
    number: number;
    title: string;
    description: string;
    headSha: string;
    baseSha: string;
    headRef: string;
    baseRef: string;
    repoFullName: string;
    repoCloneUrl: string;
    author: { login: string; id: string; type: "user" | "bot" };
    createdAt: string;
    updatedAt: string;
    labels: string[];
    changedFiles: number;
    additions: number;
    deletions: number;
  };

  // Provider-specific raw payload for forward compatibility
  raw: Record<string, unknown>;
}
```

提供者规范化规则：
- GitHub `pull_request` -> `pullRequest`（驼峰式转换）
- GitLab `merge_request` -> `pullRequest`（字段映射）
- GitLab 系统备注 -> `issue_comment.created` 带 `type: "system"`

**10.3.2 OpenCode Serve API 契约**

基础 URL：`https://ulw.internal:8443/api/v1`

| 端点 | 方法 | 认证 | 请求 | 响应 | 用途 |
|----------|--------|------|---------|----------|---------|
| `/projects` | POST | JWT + RBAC | `{ name, specYaml, ownerId }` | `{ projectId, status, workItemCount }` | 创建项目 |
| `/projects/{id}` | GET | JWT + RBAC | -- | `{ id, name, status, workItems[], createdAt }` | 获取项目状态 |
| `/projects/{id}/work-items` | POST | JWT + RBAC | `{ title, description, acceptanceCriteria, dependsOn[] }` | `{ workItemId, position }` | 添加工作项 |
| `/projects/{id}/execute` | POST | JWT + RBAC | `{ workItemId, agentConfig{ model, temperature, maxTokens } }` | `{ taskId, agentPodName }` | 触发智能体执行 |
| `/tasks/{id}` | GET | JWT + RBAC | -- | `{ taskId, status, agentLogs[], artifacts[] }` | 轮询任务状态 |
| `/tasks/{id}/cancel` | POST | JWT + RBAC | -- | `{ taskId, cancelledAt }` | 取消运行中的任务 |
| `/reviews/{reviewId}` | GET | JWT + RBAC | -- | `{ reviewId, verdict, findings[], reportUri }` | 获取审查结果 |
| `/reviews/{reviewId}/findings` | GET | JWT + RBAC | `?severity=error&file=src/*` | `{ findings[]{ file, line, message, severity, ruleId } }` | 过滤发现 |
| `/pipelines/{pipelineId}` | GET | JWT + RBAC | -- | `{ pipelineId, status, gates[]{ name, status, duration }, deploymentId }` | 流水线状态 |
| `/audit/events` | GET | JWT + Admin | `?from&to&types[]&aggregateId` | `{ events[]{ eventId, eventType, occurredAt, data } }` | 查询审计追踪 |
| `/health` | GET | 无 | -- | `{ status, version, uptime, dependencies[]{ name, status, latencyMs } }` | 健康检查 |

响应信封：
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;              // e.g. "RATE_LIMITED", "NOT_FOUND", "UNAUTHORIZED"
    message: string;
    details?: unknown;
    requestId: string;         // Correlation ID for debugging
  };
  meta: {
    timestamp: string;
    apiVersion: string;
    pagination?: {
      cursor: string;
      limit: number;
      hasMore: boolean;
    };
  };
}
```

**10.3.3 Git Webhook 事件映射**

| Git 事件 | ulw 订阅者 | 主要操作 | NATS 主题 |
|-----------|---------------|----------------|--------------|
| `push` (branch:main) | 流水线引擎 | 触发 CI/CD 流水线 | `git.push.main` |
| `push` (branch:feature/*) | OpenCode | (保留用于自动同步) | `git.push.feature` |
| `pull_request.opened` | OpenClaw | 启动审查流水线 | `git.pr.opened` |
| `pull_request.synchronize` | OpenClaw | 重新运行审查流水线 | `git.pr.synchronize` |
| `pull_request.reopened` | OpenClaw | 重新运行审查流水线 | `git.pr.reopened` |
| `pull_request.closed` | OpenClaw | 归档审查数据 | `git.pr.closed` |
| `pull_request.merged` | 流水线引擎 | 触发合并后流水线 | `git.pr.merged` |
| `issue_comment.created` | OpenClaw | 处理 `/ulw-retry` 命令 | `git.comment.created` |
| `push` (tag:v*) | 流水线引擎 | 触发发布流水线 | `git.tag.created` |

**10.3.4 NATS 主题层级**

```
ulw.>                               # Root prefix for all ulw subjects
│
├── git.                            # Git webhook events
│   ├── push.{branch}               # Branch push events
│   ├── pr.{action}                 # PR events (opened, synchronize, closed, merged)
│   ├── tag.{action}                # Tag events (created, deleted)
│   └── comment.{action}            # Comment events (created, edited)
│
├── agent.                          # Agent task flow
│   ├── task.execute                # Orchestrator->Agent: execute task
│   ├── task.result                 # Agent->Orchestrator: task result
│   ├── task.cancel                 # Orchestrator->Agent: cancel task
│   ├── task.progress               # Agent->Orchestrator: progress update (heartbeat)
│   └── session.{state}             # Session state changes (started, ended, error)
│
├── review.                         # Code review pipeline
│   ├── agent.execute               # OpenClaw->Agent: run review
│   ├── agent.result                # Agent->OpenClaw: review findings
│   └── status                      # Review pipeline status updates
│
├── pipeline.                       # CI/CD pipeline
│   ├── started                     # Pipeline started
│   ├── gate.{n}.{status}           # Gate n result (passed, failed, skipped)
│   ├── approved                    # Manual approval granted
│   ├── rejected                    # Manual approval rejected
│   ├── deploy.{action}             # Deployment actions (started, health, rollback)
│   └── completed                   # Pipeline completed
│
├── domain.                         # Domain events (project, code, test)
│   ├── project.{action}            # Project lifecycle events
│   ├── code.{action}               # Code generation events
│   └── test.{action}               # Test lifecycle events
│
├── audit.                          # Audit events
│   ├── action.{type}               # Agent actions
│   └── trail.flush                 # Audit trail flushed to cold storage
│
└── notify.                         # Notification events
    ├── slack.{channel}             # Slack notifications
    └── alert.{severity}            # Alert events (warning, critical)
```

主题命名约定：
- 点分隔的层级结构，带有 `ulw.` 全局前缀
- 通配符：`ulw.pipeline.gate.*.passed`（单级）、`ulw.pipeline.>`（多级）
- 主题动态创建；无需预注册
- NATS JetStream 流映射到第二级前缀：`stream: ulw-agent`、`stream: ulw-pipeline`

**10.3.5 消息信封格式**

每条 NATS 消息携带标准化的信封，用于追踪和可靠性。

```typescript
interface MessageEnvelope<T = unknown> {
  // Routing
  subject: string;
  replyTo?: string;              // For request-reply patterns

  // Tracing
  correlationId: string;
  causationId: string;           // ID of the message that caused this one
  traceId: string;               // OpenTelemetry trace ID

  // Identity
  sourceService: string;         // e.g. "orchestrator", "opencode-agent"
  sourceHostname: string;        // Pod name for debugging
  agentId?: string;              // Agent ID if source is an agent

  // Content
  contentType: string;           // "application/json" | "application/x-protobuf"
  payload: T;                    // Type-specific payload
  payloadSizeBytes: number;      // Pre-serialized size for monitoring

  // Delivery
  deliveryMode: "at-least-once" | "at-most-once" | "exactly-once";
  ttl: number;                   // Seconds until message expires
  maxRetries: number;            // 0 = no retry
  retryCount: number;            // Current retry attempt

  // Security
  signature: string;             // HMAC-SHA256 of headers + payload
  signingKeyId: string;          // Key identifier for verification

  // Metadata
  timestamp: string;             // ISO 8601
  schemaVersion: string;         // Envelope schema version (not payload)
}
```

---

### 10.4 数据持久化策略

每种数据类型映射到最适合其访问模式、一致性要求和生命周期的存储系统。

| 数据类别 | 存储系统 | 理由 | 备份策略 |
|--------------|---------------|---------------|----------------|
| **领域实体**（项目、工作项、智能体、部署） | PostgreSQL | 事务一致性的 ACID 合规；用于跨实体报告的关系查询 | WAL 流到副本；每日 pg_dump 到 MinIO 冷存储 |
| **智能体状态**（会话状态机、任务进度、锁所有权） | PostgreSQL | 具有事务保证的原子状态转换；行级锁防止并发修改冲突 | 持续 WAL 归档 |
| **工作流 DAG**（流水线定义、任务依赖、执行顺序） | PostgreSQL | 用于依赖解析的图遍历查询（递归 CTE）；用于 DAG 变更的事务更新 | 包含在领域实体备份中 |
| **会话缓存**（用户会话、认证令牌、OAuth 状态） | Redis (Cluster) | 亚毫秒级读取延迟；带 TTL 的自动密钥过期；用于令牌轮换的原子操作 | 每 5 分钟 Redis RDB 快照 |
| **速率限制**（API 速率计数器、突发窗口） | Redis | 滑动窗口计数器的 INCR + EXPIRE 原子性；每个计数器的最小内存占用 | 不备份（临时） |
| **分布式锁**（智能体工作树锁、部署互斥体） | Redis (Redlock) | 基于 TTL 的死锁恢复；通过 SET NX EX 实现锁语义；多节点共识 | 不备份（临时） |
| **代码工件**（生成的代码快照、构建输出、发布） | MinIO | 可扩展的对象存储；S3 兼容 API；用于工件沿袭的版本控制；用于分层存储的生命周期策略 | 跨区域复制；启用版本控制 |
| **测试报告**（覆盖率 XML、测试日志、性能基准） | MinIO | 结构化 + 非结构化报告 blob；从 CI 工具直接 HTTP 访问 | 90 天后生命周期到 Glacier |
| **审查发现**（审查报告、差异注释、智能体输出） | MinIO | 审查工件的大型 blob 存储；用于 GitHub 状态 API 集成的预签名 URL | 包含在工件备份中 |
| **事件源日志**（领域事件、状态转换、审计追踪） | NATS JetStream | 有序、可重放的事件流；精确一次交付语义；基于保留的清理 | JetStream 消费者快照到 MinIO 冷存储 |
| **审计日志**（不可变的智能体操作追踪） | NATS JetStream + PostgreSQL | 用于写优化摄入的流；用于索引查询访问的 PostgreSQL；哈希链存储在 PostgreSQL 中 | 每日刷新到 MinIO 冷存储，带哈希验证 |
| **配置**（智能体 SKILL.md、OPA 策略、流水线定义） | PostgreSQL + MinIO | 用于版本化配置的模式；用于大型策略文件的 MinIO | 包含在领域实体备份中 |

**存储容量估算**（100+ 开发者规模）：

| 存储 | 预估容量 | 增长率 | 保留期 |
|-------|-----------------|-------------|-----------|
| PostgreSQL | 500 GB 领域数据 + 200 GB 审计 | ~50 GB/月 | 无限（热） |
| Redis | 10 GB 缓存 + 2 GB 锁/会话 | ~2 GB/月 | 临时 + TTL |
| MinIO | 5 TB 工件 + 1 TB 报告 | ~500 GB/月 | 90 天热 -> 冷 |
| NATS JetStream | 200 GB 事件流 | ~100 GB/月 | 30 天流 -> 归档 |

---

### 10.5 状态管理

**10.5.1 智能体会话状态机**

每个智能体会话通过存储在 PostgreSQL 中的确定性状态机进行转换。

```
                     ┌──────────────────────────────────────────┐
                     │              Session Lifecycle            │
                     │                                          │
                     │         ┌──────────┐                     │
                     │         │  IDLE    │                     │
                     │         └────┬─────┘                     │
                     │              │ task assigned              │
                     │              v                           │
                     │         ┌──────────┐                     │
                     │         │ PLANNING │                     │
                     │         └────┬─────┘                     │
                     │              │ plan ready                 │
                     │              v                           │
                     │         ┌──────────┐                     │
                     │         │EXECUTING │────────────────────┐ │
                     │         └────┬─────┘                    │ │
                     │              │ code/review done         │ │
                     │              v                          │ │
                     │         ┌──────────────┐                │ │
                     │         │ AWAITING_    │                │ │
                     │         │ REVIEW       │                │ │
                     │         └──────┬───────┘                │ │
                     │            ┌───┴───┐                    │ │
                     │            v       v                    │ │
                     │     ┌──────────┐ ┌──────────┐           │ │
                     │     │COMPLETED │ │ FAILED   │<──────────┘ │
                     │     └──────────┘ └──────────┘             │
                     │                                          │
                     │  Recovery paths:                         │
                     │  FAILED -> PLANNING (retry with backoff)  │
                     │  TIMEOUT -> FAILED (auto-detect)          │
                     │  CANCELLED <- any state                   │
                     └──────────────────────────────────────────┘
```

```typescript
enum AgentSessionState {
  IDLE = "IDLE",
  PLANNING = "PLANNING",
  EXECUTING = "EXECUTING",
  AWAITING_REVIEW = "AWAITING_REVIEW",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  TIMEOUT = "TIMEOUT",
}

interface AgentSession {
  sessionId: string;
  agentType: string;
  projectId: string;
  taskId: string;
  currentState: AgentSessionState;
  stateHistory: { state: AgentSessionState; enteredAt: string; reason?: string }[];
  retryCount: number;
  maxRetries: number;
  lockedBy: string | null;       // Redis lock key for concurrency control
  expiresAt: string;             // Session TTL
}
```

转换规则：
- `IDLE -> PLANNING`：编排器将工作项分配给智能体
- `PLANNING -> EXECUTING`：智能体生成执行计划并获取工作树锁
- `EXECUTING -> AWAITING_REVIEW`：智能体完成代码输出；TDD 合规检查通过
- `AWAITING_REVIEW -> COMPLETED`：收到人工或自动审批
- `AWAITING_REVIEW -> FAILED`：审查发现需要重新执行的关键问题
- `Any -> CANCELLED`：用户或监督器取消任务
- `Any -> TIMEOUT`：会话 TTL 超时，未达到终止状态转换
- `FAILED -> PLANNING`：重试次数 < 最大重试次数；应用指数退避

**10.5.2 工作流 DAG 状态**

```typescript
enum WorkflowNodeState {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
}

interface WorkflowNode {
  nodeId: string;
  workflowId: string;
  taskType: string;              // "code_gen" | "review" | "test" | "deploy"
  state: WorkflowNodeState;
  dependsOn: string[];           // Parent node IDs
  blockingDependencies: string[]; // Dependencies that must complete first
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  timeoutMs: number;
  startedAt?: string;
  completedAt?: string;
  result?: {
    status: "pass" | "fail";
    outputUri: string;           // Link to MinIO artifact
    summary: string;
  };
}
```

状态转换逻辑：
- `PENDING -> IN_PROGRESS`：所有依赖项 COMPLETED；节点被工作者拾取
- `PENDING -> BLOCKED`：任何依赖 FAILED 或 SKIPPED；如果存在跳过失败策略则自动推进
- `IN_PROGRESS -> COMPLETED`：任务成功完成
- `IN_PROGRESS -> FAILED`：任务错误或超时（如果尝试次数剩余则触发重试）
- `FAILED -> IN_PROGRESS`：重试尝试开始
- `Any -> SKIPPED`：条件门控评估为假；上游失败且具有跳过策略

**10.5.3 TDD 阶段状态**

```typescript
enum TDDPhase {
  INIT = "INIT",
  RED = "RED",                   // Write failing test
  GREEN = "GREEN",               // Write code to pass test
  REFACTOR = "REFACTOR",         // Clean up code
  DONE = "DONE",                 // Phase complete
}

interface TDDCycle {
  cycleId: string;
  projectId: string;
  workItemId: string;
  currentPhase: TDDPhase;
  phaseHistory: { phase: TDDPhase; enteredAt: string; durationMs: number }[];
  testResults: {
    lastRunAt: string;
    passed: number;
    failed: number;
    coverage: number;
  };
  iterations: number;            // RED->GREEN->REFACTOR cycles before DONE
  maxIterations: number;         // Hard limit to prevent infinite loops
  files: {
    testFile: string;            // Written in RED phase
    sourceFile: string;          // Written in GREEN phase
    refactoredFile: string;      // Result of REFACTOR phase
  };
}
```

通过工具门控强制执行：
- **RED 阶段**：只允许 `.test.ts` 文件写入；拒绝生产文件写入
- **GREEN 阶段**：允许测试文件读取；允许生产文件写入；仅当测试先前被读取时才能写入测试文件
- **REFACTOR 阶段**：两个文件都可读；仅生产文件可写；linter 必须通过
- **DONE**：两个文件都锁定；只有提交工具可以持久化到 git

---

### 10.6 数据保留与归档

**10.6.1 保留策略**

| 数据类型 | 热存储 | 温存储 | 冷存储 | 删除 | 理由 |
|-----------|-------------|--------------|--------------|----------|-----------|
| 项目元数据 | 无限期 | -- | -- | -- | 核心业务数据 |
| 工作项 / DAG | 无限期 | -- | -- | -- | 审计和可追溯性 |
| 智能体会话 | 90 天 | 1 年 | 3 年 | 3 年后 | 调试 + 合规 |
| 代码工件 | 90 天 | 1 年 | 3 年 | 3 年后 | 发布可追溯性 |
| 构建工件 | 30 天 | 90 天 | 1 年 | 1 年后 | 存储成本优化 |
| 测试报告 | 90 天 | 1 年 | 3 年 | 3 年后 | 回归分析 |
| 审查发现 | 90 天 | 1 年 | 3 年 | 3 年后 | 质量趋势分析 |
| 领域事件 | 30 天（流） | 1 年（归档） | 3 年 | 3 年后 | 事件溯源重放 |
| 审计追踪 | 90 天（热） | 1 年 | 7 年 | 7 年后 | 法规合规 |
| 速率限制计数器 | 基于 TTL（分钟） | -- | -- | 临时 | 无需持久化 |
| 会话缓存 | 基于 TTL（小时） | -- | -- | 临时 | 登录时重新生成 |

**10.6.2 归档过程**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │  NATS        │    │  MinIO       │    │  Cold Store  │
│  (Hot)       │    │  JetStream   │    │  (Warm)      │    │  S3 Glacier  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       │  Daily cron:      │                   │                   │
       │  Export tables    │                   │                   │
       │  older than 90d   │                   │                   │
       │──────────────────────────────────────────────────────────>│
       │                   │                   │                   │
       │                   │  Daily snap:      │                   │
       │                   │  Consumer replay  │                   │
       │                   │  -> Parquet export │                   │
       │                   │──────────────────────────────────────>│
       │                   │                   │                   │
       │                   │                   │  Lifecycle rule:  │
       │                   │                   │  objects > 90d    │
       │                   │                   │  -> Glacier       │
       │                   │                   │──────────────────>│
```

归档机制：
- **PostgreSQL -> 冷**：`pg_dump` 带 `--data-only --exclude-table=ephemeral*` -> 压缩 -> MinIO 冷存储桶，带 S3 Glacier Deep Archive 生命周期
- **NATS JetStream -> 冷**：通过 `nats-tail` 将消费者重放到 Parquet 文件 -> 按事件类型 + 日期分区 -> 压缩 -> 冷存储
- **MinIO -> 冷**：S3 生命周期策略在 90 天后将对象从标准转换为 Glacier；超过 1 年的对象转换为 Glacier Deep Archive
- **审计数据 -> 冷**：单独的流水线确保审计日志在达到保留限制后 24 小时内刷新到冷存储；哈希链锚点发布到 PostgreSQL 以进行完整性验证

**10.6.3 审计日志的 GDPR 合规性**

- **删除权**：包含个人数据（用户 ID、IP 地址）的审计日志在 90 天后通过一个计划作业进行匿名化处理，该作业使用密钥盐对 `userId` 字段进行哈希处理并将 `sourceIp` 字段置零。
- **数据导出**：`/audit/export` API 返回在日期范围内与给定 `userId` 相关的所有事件，格式为 JSON Lines。
- **保留限制强制**：审计数据在 7 年后永久删除。一个 cron 作业按月分区删除，并以 10,000 行为一批执行 `DELETE FROM audit_events WHERE occurred_at < NOW() - INTERVAL '7 years'`。
- **数据最小化**：审计事件仅存储 `userId`（非全名或电子邮件）。PII 在查询时从 Keycloak 令牌自省派生。

---

## 11. 实施路线图

### 11.1 概述

ulw 平台在 24 周内按五个阶段交付。每个阶段产生一个可部署、可演示的增量。阶段按依赖关系排序：先基础后执行，先执行后自动化，先自动化后加固。

```
Phase 0 (4w)     Phase 1 (6w)       Phase 2 (6w)       Phase 3 (4w)      Phase 4 (4w)
Foundation   →   Core Agent Loop →  Review & Test  →  CI/CD Pipeline →  Hardening
                  └─ Dev Preview ──┘  └─ QA Preview ─┘  └─ Ops Preview ─┘  └── GA ──┘
```

**团队规模假设**：8 名工程师（4 名后端、2 名全栈、2 名 DevOps）。每阶段标记了可并行化的任务。

### 11.2 阶段 0：基础（第 1-4 周）

**目标**：建立项目骨架、DDD 桩代码、智能体身份模板和 OpenCode 集成。到阶段 0 结束时，所有工程师都可以针对平台编写代码。

| 周 | 里程碑 | 交付物 | 负责人 |
|------|-----------|-------------|-------|
| 1 | 仓库与 DevOps 启动 | 单仓结构（pnpm 工作空间）、ESLint + Prettier + Oxlint 配置、Vitest 设置、本地开发的 Docker Compose、CI 流水线（PR 上的 lint + build + test） | DevOps + 后端 |
| 1-2 | DDD 领域桩代码 | 每个限界上下文的 TypeScript 包，带 Drizzle 模式、实体接口、值对象类、聚合根基类、领域事件基类、仓库接口 | 后端（x2 并行） |
| 2-3 | 智能体身份模板 | 所有智能体类型的 SOUL.md / AGENTS.md / TOOLS.md 模板、技能系统引导（TDD、代码审查、契约验证技能作为 SKILL.md 文件）、智能体配置模式（Zod 验证） | 后端 + 全栈 |
| 3-4 | OpenCode 集成 | OpenCode `serve` HTTP API 客户端包装器、智能体会话生命周期管理器（创建、提示、轮询、收集）、OpenCode GitHub Action 模板、智能体工作树管理器（每个智能体任务的 git 工作树创建/移除） | 后端（x2 并行） |
| 3-4 | OpenClaw 初始设置 | 在 K8s 上自托管 OpenClaw Gateway 部署、Webhook 接收器配置、基本代码审查技能（仅 linter 输出）、GitHub PR webhook 集成测试 | DevOps |
| 4 | 阶段 0 演示 | 端到端演示：创建 BC 桩代码 → 智能体通过 OpenCode 生成代码 → 通过 OpenClaw 基本 lint 审查 → 结果在 PR 评论中 | 所有人 |

**阶段 0 退出标准**：
- [ ] 单仓在每个 PR 上构建和测试通过
- [ ] 所有 6 个限界上下文包具有带迁移的 Drizzle 模式
- [ ] 所有 11 种智能体类型的 SOUL.md / AGENTS.md / TOOLS.md 模板存在
- [ ] OpenCode serve 集成可以创建会话、发送提示和收集结果
- [ ] OpenClaw Gateway 提供由 GitHub webhook 触发的基本代码审查技能
- [ ] 智能体工作树管理器创建和清理隔离的 git 工作树

### 11.3 阶段 1：核心智能体循环（第 5-10 周）

**目标**：编排器、监督器和管家智能体可运行。开发者输入的功能规格导致 AI 生成的代码，并带有 TDD 护栏强制。

| 周 | 里程碑 | 交付物 | 负责人 |
|------|-----------|-------------|-------|
| 5-6 | 编排器引擎 | 意图解析器（NLP → 结构化任务规格）、任务分解器（功能 → 微规格 DAG）、智能体路由器（任务 → 限界上下文 → 管家分配）、编排器 HTTP API | 后端（x2） |
| 5-7 | 监督器引擎 | 工作流 DAG 执行器（拓扑排序、并行扇出）、状态持久化（PostgreSQL）、重试管理器（指数退避带抖动，最多 3 次重试）、心跳监控（智能体超时检测） | 后端（x2） |
| 7-8 | 管家智能体运行时 | 带生命周期钩子（onTaskReceived、onTaskComplete、onTaskFail）的管家智能体基类、每个 BC 的智能体实例（6 个管家）、通过 NATS 的智能体间消息、通过 Redis 的黑板状态共享 | 后端（x3 并行） |
| 8-9 | TDD 状态机 | RED/GREEN/REFACTOR 阶段强制、文件写入门控（基于钩子）、PostToolUse 测试运行器（每次文件写入后自动运行 vitest）、PreCommit 门控（如果不在 DONE 阶段则阻塞） | 全栈（x2） |
| 9-10 | 集成与演示 | 编排器接收功能请求 → 分解为 DAG → 监督器分派到管家 → 管家运行 TDD 循环 → 生成代码且测试通过 | 所有人 |
| 10 | 阶段 1 演示 | 功能："添加用户注册端点" → 智能体生成测试 → 智能体生成代码 → 所有测试通过 → 代码提交到分支 | 所有人 |

**阶段 1 退出标准**：
- [ ] 编排器将自然语言功能请求分解为 3+ 个微规格
- [ ] 监督器成功执行具有 2 个并行分支的 5 节点 DAG
- [ ] 所有 6 个 BC 的管家智能体通过 NATS 响应任务分配
- [ ] TDD 状态机使用文件写入门控强制执行 RED → GREEN → REFACTOR
- [ ] 生成的代码通过 Vitest 套件，覆盖率 ≥ 80%
- [ ] 智能体会话审计追踪记录到 PostgreSQL

### 11.4 阶段 2：审查与测试自动化（第 11-16 周）

**目标**：OpenClaw 6 智能体审查流水线可运行。API 测试从 OpenAPI 规范自动生成。契约测试验证 BC 间通信。

| 周 | 里程碑 | 交付物 | 负责人 |
|------|-----------|-------------|-------|
| 11-12 | 代码审查流水线 | 6 智能体流水线（分析器 → 代码质量 → 安全 → 架构 → 评论家 → 策略）、每个 BC 的审查策略 YAML 文件、带去重的发现聚合、PR 评论渲染器 | 后端（x2） |
| 12-13 | 审查执行自动化 | GitHub webhook → PR 差异提取 → 超过 400 行的按文件拆分 → 并行智能体分派 → CI 状态轮询 → 组合审查报告、基于严重级别的自动审批（Info/Low 自动合并，Medium+ 需要人工） | 后端 + DevOps |
| 13-14 | API 测试生成 | OpenAPI 3.1 解析器（生成快乐路径、负面、认证场景）、请求构建器生成器（TypeScript + Supertest）、测试夹具工厂生成器、集成测试运行器 | 全栈（x2 并行） |
| 14-15 | 契约测试 | Pact 消费者驱动契约测试生成、提供者验证流水线、针对上下文映射的 BC 间契约验证、用于护栏验证的 Specmatic MCP 集成 | 后端（x2） |
| 15-16 | 集成与演示 | 端到端：PR 打开 → 6 智能体审查 → 发现发布 → API 测试自动生成 → 契约测试运行 → 所有门控绿色 | 所有人 |
| 16 | 阶段 2 演示 | 在真实的多 BC 功能 PR 上的完整审查 + 测试流水线 | 所有人 |

**阶段 2 退出标准**：
- [ ] 6 智能体审查流水线在每个 PR 上 < 3 分钟内运行
- [ ] 误报率 < 15%（在 50+ 次审查上测量）
- [ ] API 测试生成覆盖 OpenAPI 规范中定义的 100% 端点（快乐路径）
- [ ] 契约测试对上下文映射中定义的所有上游/下游 BC 对通过
- [ ] 审查发现仪表盘在 Grafana 中可操作

### 11.5 阶段 3：CI/CD 流水线（第 17-20 周）

**目标**：5 门控流水线完全可运行。部署基于金丝雀并带自动回滚。平台在预发布环境中运行。

| 周 | 里程碑 | 交付物 | 负责人 |
|------|-----------|-------------|-------|
| 17 | 流水线执行器 | 流水线即代码引擎（TypeScript DSL → DAG）、Git webhook → 流水线触发、每个门控的作业调度（Kubernetes Jobs）、门控结果聚合和报告 | 后端 + DevOps |
| 17-18 | 五个门控实现 | 门控 1（AI 审查）：运行 OpenClaw 流水线、门控 2（契约）：运行 Pact + Specmatic、门控 3（测试套件）：运行 Vitest + Playwright + k6、门控 4（安全）：运行 Semgrep + Trivy + Gitleaks + OWASP ZAP、门控 5（人工审批）：Slack 通知 + 审批按钮 | DevOps（x2 每门控对并行） |
| 18-19 | 部署引擎 | 蓝绿部署策略、金丝雀部署与渐进式发布（10%→25%→50%→100%）、Prometheus 告警自动回滚、K8s 客户端集成 | DevOps（x2） |
| 19 | 可观测性栈 | 所有服务上的 OpenTelemetry 仪表化、Prometheus 指标导出器（智能体任务持续时间、流水线阶段持续时间、审查延迟）、Grafana 仪表盘（DORA 指标、审查流水线健康、测试覆盖率趋势）、ELK 审计日志流水线 | DevOps（x2） |
| 20 | 预发布环境 | 完整 ulw 平台部署到预发布 K8s 集群、集成测试套件（端到端功能开发流程）、性能基线（目标：PR 的完整流水线 < 5 分钟） | 所有人 |
| 20 | 阶段 3 演示 | 推送功能分支 → 自动化 5 门控流水线运行 → 所有门控绿色 → 金丝雀部署到预发布 → 人工审批 → 完全部署 | 所有人 |

**阶段 3 退出标准**：
- [ ] 5 门控流水线在典型 PR（200 行差异）上 < 10 分钟内完成
- [ ] 金丝雀部署带自动回滚测试（模拟失败在 < 2 分钟内触发回滚）
- [ ] DORA 指标仪表盘显示所有四个关键指标（部署频率、前置时间、MTTR、变更失败率）
- [ ] 审计日志摄入率 > 10,000 事件/秒，延迟 < 1s
- [ ] 预发布环境通过 24 小时浸泡测试，0 个关键事件

### 11.6 阶段 4：生产加固（第 21-24 周）

**目标**：生产就绪。安全审计、性能优化、混沌测试和文档。平台为试点团队部署到生产环境。

| 周 | 里程碑 | 交付物 | 负责人 |
|------|-----------|-------------|-------|
| 21 | 安全审计 | 渗透测试（外部公司或自动化 Burp Suite 扫描）、依赖审计（npm audit + Snyk）、所有仓库的密钥扫描（Gitleaks）、RBAC 渗透测试（尝试从 Viewer 升级到 Admin）、OPA 策略审查 | DevOps + 外部 |
| 21-22 | 性能优化 | 性能分析（clinic.js 火焰图）、数据库查询优化（前 10 个查询的 EXPLAIN ANALYZE）、热智能体会话的 Redis 缓存、NATS 消费者组调优、OpenCode 工作树池预热 | 后端（x2） |
| 22-23 | 混沌与韧性 | 混沌工程（流水线执行期间随机杀死 Pod）、网络分区模拟（NATS 集群分裂）、数据库故障切换测试（PostgreSQL 主节点故障）、智能体异常行为注入（恶意文件写入、过量工具调用）— 验证隔离 | DevOps（x2） |
| 23 | 文档 | 运维指南（部署、扩缩、备份/恢复）、开发者指南（编写 SOUL.md、创建技能、定义审查策略）、API 参考（从 OpenAPI + tRPC 自动生成）、运行手册（每个告警的事件响应流程） | 全栈（x2） |
| 23-24 | 试点部署 | 通过 Pulumi 配置的生产 K8s 集群、ulw 平台部署到生产环境、试点团队（8-10 名开发者）入职、影子模式：平台与现有工作流并行运行 2 周 | DevOps + 后端 |
| 24 | GA 就绪 | 试点指标审查（对照基线比较交付周期时间、缺陷率、审查延迟）、对照成功标准的性能、全面推出的通过/不通过决策 | 所有人 |

**阶段 4 退出标准**：
- [ ] 安全审计：0 个 Critical、0 个 High 发现
- [ ] P95 流水线时间 < 5 分钟（200 行 PR）
- [ ] P95 智能体任务完成 < 30 秒
- [ ] 平台在混沌测试中无数据丢失且恢复时间 < 5 分钟
- [ ] 试点团队交付周期时间较基线减少 ≥ 50%
- [ ] 所有 4 份指南的文档完整

### 11.7 风险登记册

| 风险 | 概率 | 影响 | 缓解措施 |
|------|-----------|--------|------------|
| OpenCode/OpenClaw API 破坏性变更 | 中 | 高 | 锁定版本、集成测试套件、阶段 4 中的升级窗口 |
| LLM 提供者故障 | 低 | 高 | 多模型故障切换链（Claude → GPT → 本地模型）、断路器 |
| 智能体生成不可编译的代码 | 高 | 中 | TDD 状态机强制、CI 中的构建门控、失败时自动回滚 |
| 审查发现误报侵蚀信任 | 中 | 高 | 评论家智能体层、去重、误报反馈循环、严重级别阈值 |
| Git 工作树泄漏（磁盘耗尽） | 中 | 中 | 基于 TTL 的清理 cron、磁盘使用告警、工作树池上限 |
| 100 开发者规模超过 NATS/Redis 容量 | 低 | 中 | 阶段 3 中的负载测试、水平扩展（NATS 集群、Redis 集群）、容量规划仪表盘 |

### 11.8 成功指标

| 指标 | 当前基线 | 阶段 1 目标 | 阶段 2 目标 | GA 目标 |
|--------|-----------------|----------------|----------------|-----------|
| 功能交付周期时间 | 14 天（估计） | 10 天 | 5 天 | 4 天 |
| 代码审查延迟（中位数） | 8 小时（估计） | 2 小时 | 30 分钟 | 5 分钟 |
| 测试覆盖率（行） | ~60%（估计） | ≥ 80% | ≥ 85% | ≥ 85% |
| 生产部署频率 | 1/周 | 2/周 | 每日 | 按需 |
| 变更失败率 | ~15%（估计） | 10% | 5% | < 5% |
| 平均恢复时间 | 4 小时（估计） | 1 小时 | 15 分钟 | < 10 分钟 |
| 误报率（审查） | N/A | < 25% | < 15% | < 10% |

---

## 12. 安全与治理

### 12.1 身份与访问管理

**12.1.1 Keycloak 集成**

Keycloak 作为所有 ulw 组件的集中式身份提供者。每个用户、服务和智能体都通过 Keycloak 进行身份验证。

```
┌────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser   │     │  Kong        │     │  Keycloak    │
│  / CLI     │     │  API Gateway │     │  (IAM)       │
└─────┬──────┘     └──────┬───────┘     └──────┬───────┘
      │                   │                    │
      │  GET /api/v1/*    │                    │
      │  (no token)       │                    │
      │──────────────────>│                    │
      │                   │  302 /auth/login   │
      │<──────────────────│                    │
      │                   │                    │
      │  GET /auth/login  │                    │
      │────────────────────────────────────────>│
      │                   │                    │
      │  Auth Code +      │                    │
      │  Redirect URI     │                    │
      │<────────────────────────────────────────│
      │                   │                    │
      │  POST /token      │                    │
      │  {code, verifier} │                    │
      │────────────────────────────────────────>│
      │                   │                    │
      │  {access_token,   │                    │
      │   refresh_token,  │                    │
      │   id_token}       │                    │
      │<────────────────────────────────────────│
      │                   │                    │
      │  GET /api/v1/*    │                    │
      │  Authorization:   │                    │
      │  Bearer {token}   │                    │
      │──────────────────>│                    │
      │                   │  Introspect token  │
      │                   │───────────────────>│
      │                   │  {active, roles,   │
      │                   │   groups, clientId}│
      │                   │<───────────────────│
      │                   │                    │
      │  Response         │                    │
      │<──────────────────│                    │
```

**12.1.2 认证流程**

| 流程 | 协议 | 使用场景 |
|------|----------|----------|
| Authorization Code + PKCE | OAuth 2.0 | Web UI 登录（基于浏览器） |
| 设备授权授权 | OAuth 2.0 | CLI / 无头环境 |
| 客户端凭证 | OAuth 2.0 | 服务到服务（OpenCode->编排器） |
| JWT Bearer | OIDC | 智能体会话令牌交换 |
| mTLS | TLS 1.3 | 服务网格（Envoy 边车 -> 边车） |

**12.1.3 JWT 令牌结构**

```typescript
interface UlwJwtClaims {
  sub: string;                   // User ID (UUID)
  iss: "https://keycloak.ulw.internal/auth/realms/ulw";
  aud: ["ulw-api", "ulw-agents"];
  exp: number;                   // Token expiry (15 min for access, 24h for refresh)
  iat: number;
  realm_roles: string[];         // e.g. ["ulw-admin", "ulw-tech-lead"]
  client_roles: Record<string, string[]>;  // Per-client fine-grained roles
  groups: string[];              // e.g. ["/platform-team", "/security-team"]
  agent_id?: string;             // Present only for agent tokens
  session_id: string;            // For session revocation
}
```

**12.1.4 服务到服务认证**

- **mTLS**：Kubernetes 集群内的所有 Pod 间通信使用通过 Envoy 边车代理的 mTLS。证书由 Vault PKI 颁发，TTL 为 24 小时，自动续期。
- **服务账户令牌**：Kubernetes 投射的服务账户令牌（绑定到 Pod）由服务用于通过客户端凭证授权向 Keycloak 进行身份验证。
- **智能体令牌**：每个智能体会话接收一个短生命周期的 JWT（5 分钟 TTL），范围限定到特定任务和项目。令牌在会话结束时撤销。

---

### 12.2 RBAC 模型

四个角色管理对 ulw 资源的访问。权限在 API 网关（Kong）和编排器内部强制执行。

**12.2.1 角色定义**

| 角色 | 描述 | 默认分配 |
|------|-------------|-------------------|
| **Admin** | 完全系统访问；用户管理、策略配置、系统设置、审计访问 | 平台团队负责人、SRE |
| **Tech Lead** | 项目创建、规格定义、审批门控、智能体配置 | 工程经理、架构师 |
| **Senior Developer** | 功能开发、触发智能体、查看审查结果、部署到预发布 | 高级 IC 工程师 |
| **Viewer** | 只读访问；查看项目、审查报告、流水线状态 | QA、产品经理、外部审计员 |

**12.2.2 权限矩阵**

| 资源 | 操作 | Admin | Tech Lead | Senior Dev | Viewer |
|----------|--------|-------|-----------|------------|--------|
| **项目** | 创建 | Y | Y | -- | -- |
| | 读取 | Y | Y | Y | Y |
| | 更新 | Y | Y | -- | -- |
| | 删除 | Y | Y* | -- | -- |
| | 归档 | Y | Y | -- | -- |
| **工作项** | 创建 | Y | Y | Y | -- |
| | 读取 | Y | Y | Y | Y |
| | 更新（自己的） | Y | Y | Y | -- |
| | 删除 | Y | Y | -- | -- |
| **智能体任务** | 触发 | Y | Y | Y | -- |
| | 取消（任意） | Y | Y | -- | -- |
| | 取消（自己的） | Y | Y | Y | -- |
| | 读取状态 | Y | Y | Y | Y |
| **代码审查** | 触发 | Y | Y | Y* | -- |
| | 审批 | Y | Y | -- | -- |
| | 读取结果 | Y | Y | Y | Y |
| | 驳回发现 | Y | Y | Y* | -- |
| **流水线** | 触发 | Y | Y | Y* | -- |
| | 门控 5 审批 | Y | Y | -- | -- |
| | 部署到预发布 | Y | Y | Y | -- |
| | 部署到生产 | Y | Y | -- | -- |
| | 回滚 | Y | Y | -- | -- |
| **策略** | 创建/更新 | Y | -- | -- | -- |
| | 读取 | Y | Y | Y | -- |
| **用户与角色** | 管理 | Y | -- | -- | -- |
| **审计日志** | 读取 | Y | Y* | -- | -- |
| | 导出 | Y | -- | -- | -- |
| **密钥** | 管理 | Y | -- | -- | -- |
| | 读取（限定范围） | Y | Y | Y* | -- |
| **系统配置** | 读取 | Y | Y | -- | -- |
| | 更新 | Y | -- | -- | -- |

*标记的权限（Y*）有额外约束：
- Tech Lead `删除项目`：仅限其团队范围内
- Senior Dev `触发代码审查`：仅限自己的 PR
- Senior Dev `触发流水线`：仅限功能分支，不是主分支
- Senior Dev `驳回发现`：仅限他们编写或拥有的代码的错误级别发现
- Admin/Tech Lead `读取审计日志`：对于 Tech Lead 仅限团队范围

**12.2.3 智能体权限**

智能体被视为角色为 `agent` 的服务账户。它们从其父任务创建者继承权限，范围限定为：

- **OpenCode 智能体**：仅在分配的工作树内读/写；无权访问其他项目或分支
- **OpenClaw 智能体**：读取 PR 差异 + 项目元数据的范围；仅对 `review_findings` 表和 MinIO 审查存储桶具有写权限
- **测试智能体**：读取 API 规范；将测试文件写入工作树；执行测试运行器
- **部署智能体**：读取部署配置；写入部署记录；触发 Kubernetes API（通过服务账户）

所有智能体动作都被记录并可追溯到触发它们的用户。

---

### 12.3 智能体工具权限矩阵

每种智能体类型具有一组定义的可允许工具。工具在智能体运行时级别进行门控，而不仅仅是 AI 模型提示。

**12.3.1 每智能体工具权限**

| 工具 | OpenCode (Dev) | OpenClaw (Review) | 测试运行时 | 部署运行时 | 安全约束 |
|------|---------------|-------------------|-------------|---------------|---------------------|
| `read_file` | Y（仅工作树） | Y（仅 PR 差异） | Y（工作树 + 规范） | Y（仅配置） | 路径必须匹配工作树前缀 |
| `write_file` | Y（仅工作树） | -- | Y（仅测试文件） | -- | 在工作树外被阻止 |
| `edit_file` | Y（仅工作树） | -- | Y（仅测试文件） | -- | 在没有 TDD RED->GREEN 流程的情况下对现有代码被阻止 |
| `execute_command` | Y（允许列表） | Y（只读命令） | Y（测试运行器） | Y（kubectl） | 命令允许列表强制执行 |
| `bash` | Y（有限制） | -- | Y（仅测试环境） | Y（k8s 上下文） | 拒绝列表：`rm -rf`、`sudo`、`chmod 777`、网络探测 |
| `web_search` | Y | Y | -- | -- | 频率限制：每个智能体 10/分钟 |
| `glob` | Y（仅工作树） | Y（PR 范围） | Y（仅工作树） | Y（配置范围） | 不得遍历范围外 |
| `grep` | Y（仅工作树） | Y（PR 范围） | Y（仅工作树） | Y（配置范围） | 不能访问 `.env`、`secrets/`、`credentials.*` |
| `git` | Y（commit + push） | Y（fetch + log） | -- | -- | 无强制推送；无删除分支 |
| `lsp_*` | Y | Y | -- | -- | 只读操作 |
| `npm/pip/go` | Y（仅安装） | -- | Y | -- | 包允许列表强制执行 |
| `kubectl` | -- | -- | -- | Y | 非部署模式下只读 |
| `vault` | -- | -- | -- | Y | 只读；路径限定 |
| `slack_notify` | -- | -- | -- | Y | 频道允许列表 |

**12.3.2 命令允许列表和拒绝列表**

```typescript
const COMMAND_ALLOWLIST = {
  "opencode": [
    "npm test", "npm run build", "npx tsc --noEmit",
    "npx eslint", "npx prettier --check",
    "git status", "git diff", "git log", "git add", "git commit", "git push",
  ],
  "openclaw": [
    "git fetch", "git log", "git diff", "git show",
    "npx eslint --format json", "npx tsc --noEmit",
    "npx audits", "npx semgrep",
  ],
  "test": [
    "npm test", "npx jest", "npx mocha", "npx vitest",
    "npx playwright test", "npx k6 run",
    "npx newman run",
  ],
  "deploy": [
    "kubectl get", "kubectl describe", "kubectl logs",
    "kubectl apply --dry-run=client",
    "helm lint", "helm template", "helm upgrade --install",
    "vault read", "vault kv get",
  ],
};

const COMMAND_DENYLIST = [
  "rm", "rmdir", "sudo", "su", "chown", "chmod 777", "chmod +s",
  "dd", "mkfs", "fdisk", "mount", "umount",
  "iptables", "ufw", "nmap", "tcpdump", "nc",
  "curl external", "wget external",  // Blocked with network destination validation
  "ssh", "scp", "rsync", "expect",
  "eval", "source", "exec", "nohup",
  "docker run", "docker exec", "docker build",
  "kubectl exec", "kubectl run", "kubectl delete",
];
```

允许列表违规记录为 `security.policy_violation` 事件，并触发即时智能体暂停，等待监督器审查。

---

### 12.4 不可变审计追踪

每个智能体动作都以加密来源保证记录。

**12.4.1 审计事件模式**

```typescript
interface AuditEvent {
  // Core identifiers
  eventId: string;              // UUID v7, globally unique
  sequence: number;             // Monotonically increasing within chain

  // Who
  agentId: string;              // ID of the agent performing the action
  agentType: string;            // "opencode" | "openclaw" | "test" | "deploy"
  userId: string;               // User who triggered the session (or null for system)
  sessionId: string;            // Agent session UUID

  // What
  taskId: string;               // Parent task
  tool: string;                 // Tool name: "read_file", "write_file", "execute_command"
  action: string;               // Human-readable description
  inputHash: string;            // SHA-256 of tool input parameters
  outputHash: string;           // SHA-256 of tool output

  // When
  timestamp: string;            // ISO 8601 with microsecond precision

  // Integrity (blockchain-style hash chain)
  previousEventHash: string;    // SHA-256 of previous audit event JSON
  eventHash: string;            // SHA-256 of this event (excluding hash fields)
  chainAnchorId: string;        // ID of the current chain anchor

  // Context
  projectId: string;
  workItemId?: string;
  filePath?: string;            // Subject file if applicable
  command?: string;             // Full command if execute_command
  exitCode?: number;            // Command exit code

  // Provenance
  sourceIp: string;             // Agent pod IP
  kubernetesPod: string;        // Pod name
  environment: string;          // "dev" | "staging" | "production"
}
```

**12.4.2 哈希链完整性**

```
anchor_1                              anchor_2
   │                                     │
   ├── event_1                           ├── event_4
   │   previousHash: "0000..."           │   previousHash: hash(event_3)
   │   eventHash: H(event_1)             │   eventHash: H(event_4)
   │                                     │
   ├── event_2                           ├── event_5
   │   previousHash: hash(event_1)       │   previousHash: hash(event_4)
   │   eventHash: H(event_2)             │   eventHash: H(event_5)
   │                                     │
   ├── event_3                           ├── event_6
   │   previousHash: hash(event_2)       │   previousHash: hash(event_5)
   │   eventHash: H(event_3)             │   eventHash: H(event_6)
   │                                     │
   └────────────────────────             └────────────────────────
        Anchor hash published to                Anchor hash published to
        PostgreSQL audit_anchors                PostgreSQL audit_anchors
        table + Ethereum testnet                table + Ethereum testnet
        (optional)                              (optional)
```

完整性保证：
- **篡改检测**：修改任何事件会破坏所有后续事件的哈希链。验证从最后一个可信锚点计算链。
- **锚点发布**：每 1000 个事件或 1 小时（以先到者为准）将链锚点哈希写入 PostgreSQL `audit_anchors` 表。可选地锚定到 Ethereum 测试网以实现第三方可验证性。
- **验证 API**：`GET /audit/verify?from=anchor_1&to=anchor_2` 重新计算哈希链并返回 `{ valid: boolean, brokenAt?: string }`。
- **重建**：如果检测到篡改，可以从冷存储备份（每日快照）重建链。

**12.4.3 审计查询 API**

```typescript
// GET /api/v1/audit/events
interface AuditQueryParams {
  from?: string;                 // ISO 8601 start
  to?: string;                   // ISO 8601 end
  agentId?: string;
  userId?: string;
  sessionId?: string;
  taskId?: string;
  tool?: string;
  projectId?: string;
  action?: string;               // Full-text search on action description
  cursor?: string;               // Pagination cursor
  limit?: number;                // Default 100, max 1000
}

interface AuditQueryResponse {
  events: AuditEvent[];
  pagination: { cursor: string; hasMore: boolean };
  chainStatus: {
    verified: boolean;           // Hash chain validation for returned range
    fromAnchor: string;
    toAnchor: string;
  };
}
```

---

### 12.5 密钥管理

**12.5.1 HashiCorp Vault 集成**

Vault 是 ulw 平台中所有密钥的单一真相来源。没有密钥存储在环境变量、ConfigMap 或智能体提示中。

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Agent Pod   │     │  Vault       │     │  Target      │
│              │     │  Sidecar     │     │  Service     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │  Pod starts        │                     │
       │────────────────────>│                     │
       │                    │                     │
       │  Vault Kubernetes  │                     │
       │  Auth (JWT token   │                     │
       │  from projected    │                     │
       │  service account)  │                     │
       │<───────────────────│                     │
       │                    │                     │
       │  Request secret    │                     │
       │  (path-scoped)     │                     │
       │────────────────────>│                     │
       │                    │                     │
       │  Dynamic credential│                     │
       │  (e.g. DB password │                     │
       │   with TTL)        │                     │
       │<───────────────────│                     │
       │                    │                     │
       │─────────────────────────────────────────>│
       │                    │    Use credential    │
       │<─────────────────────────────────────────│
       │                    │                     │
       │  Lease renewal     │                     │
       │  (heartbeat)       │────────────────────>│
       │                    │                     │
       │  Pod terminates    │                     │
       │────────────────────>│                     │
       │                    │  Lease revoked      │
       │                    │────────────────────>│
```

**12.5.2 密钥类型和存储路径**

| 密钥类型 | Vault 路径 | TTL | 轮换 |
|------------|-----------|-----|----------|
| PostgreSQL 凭证（应用） | `kv/ulw/{env}/database/app` | 30 天 | 通过 Vault DB 引擎自动轮换 |
| PostgreSQL 凭证（迁移） | `kv/ulw/{env}/database/migration` | 手动 | 通过 CI/CD 流水线触发 |
| Redis 密码 | `kv/ulw/{env}/redis/password` | 90 天 | 通过 Vault 静态密钥自动轮换 |
| MinIO 访问密钥 | `kv/ulw/{env}/minio/credentials` | 90 天 | 自动轮换 |
| NATS 认证令牌 | `kv/ulw/{env}/nats/token` | 90 天 | 自动轮换 |
| GitHub 令牌（应用） | `kv/ulw/{env}/github/token` | 手动 | 通过 Vault UI 触发 |
| GitHub webhook 密钥 | `kv/ulw/{env}/github/webhook-secret` | 手动 | 通过 Vault UI 触发 |
| Slack 机器人令牌 | `kv/ulw/{env}/slack/bot-token` | 90 天 | 自动轮换 |
| OpenAPI 密钥（LLM 提供者） | `kv/ulw/{env}/llm/api-key` | 7 天 | 通过 Vault + 提供者 API 动态生成 |
| mTLS CA 证书 + 密钥 | `pki/ulw/ca` | 1 年 | Vault PKI 带自动续期 |
| 服务证书（每 Pod） | `pki/ulw/issue/{service}` | 24 小时 | Vault PKI 边车 |
| 智能体会话令牌 | `kv/ulw/{env}/agent/{sessionId}` | 会话 TTL | 每会话创建，结束时撤销 |
| Vault 管理令牌 | `kv/ulw/{env}/vault/admin` | 1 小时（临时） | 需要通过 Keycloak 的人工审批 |

**12.5.3 提示中零密钥**

- **在智能体运行时强制执行**：智能体的系统提示注入 `vault://` URI 引用而非原始密钥。工具执行层解析 URI，从 Vault 获取密钥，并将其传递给工具（而非模型）。
- **SKILL.md 规则**：智能体技能文件必须使用语法 `{{vault "path" "field"}}` 作为密钥引用。一个预检验证器在部署时扫描所有技能文件，并拒绝任何包含原始凭证模式（regex: `(password|secret|token|api_key|credential)\s*[:=]\s*['"][^'"]+['"]`）的文件。
- **提示注入保护**：如果提示包含字面密钥模式，智能体运行时在提示到达 LLM 之前将其剥离，并记录 `security.secret_in_prompt` 事件。
- **日志中无密钥**：Vault 边车拦截来自工具的凭证输出，并在其到达审计日志之前将值替换为 `[REDACTED]`。

**12.5.4 代码审查中的凭证扫描**

OpenClaw 审查流水线包括一个强制的 `secrets-scanning` 智能体，在每个 PR 上运行。它使用：
- **gitleaks**：检测差异中的硬编码凭证
- **自定义正则引擎**：项目特定模式（内部 API URL、专有密钥格式）
- **熵分析**：标记匹配凭证模式的高熵字符串

扫描结果以 `error` 严重级别的审查发现进行报告。检测到密钥的 PR 被阻止合并，直到发现被解决。

---

### 12.6 策略即代码

所有治理规则表达为代码并自动执行。无手动合规检查。

**12.6.1 用于 Kubernetes 准入控制的 OPA/Gatekeeper**

```rego
# Example OPA rule: Agent pods must run as non-root
package ulw.kubernetes.admission

violation[{"msg": msg}] {
  input.request.kind.kind == "Pod"
  input.request.object.metadata.labels["ulw.io/component"] == "agent"
  not input.request.object.spec.securityContext.runAsNonRoot == true
  msg := "Agent pods must set runAsNonRoot: true"
}

# Example OPA rule: Agents cannot mount host paths
violation[{"msg": msg}] {
  input.request.kind.kind == "Pod"
  input.request.object.metadata.labels["ulw.io/component"] == "agent"
  volume := input.request.object.spec.volumes[_]
  volume.hostPath
  msg := sprintf("Agent pods cannot mount hostPath volumes: %v", [volume.name])
}

# Example OPA rule: Only allowlisted container images
violation[{"msg": msg}] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  not startswith(container.image, "ulw.registry.internal/")
  msg := sprintf("Container image must be from internal registry: %v", [container.image])
}
```

Gatekeeper 在 Kubernetes API 服务器级别强制执行这些策略。策略违规导致准入拒绝，并带有返回智能体运行时的清晰错误消息。

**12.6.2 部署审批链策略**

```rego
# Deployment gate rules
package ulw.pipeline.approval

# Gate 5 (production) requires Tech Lead or Admin approval
default approve_production := false

approve_production {
  input.gate == 5
  input.environment == "production"
  input.approver_role == "tech-lead"
  input.pipeline.gates[4].result == "pass"  # All previous gates passed
  input.pipeline.security_scan.result == "pass"
}

approve_production {
  input.gate == 5
  input.environment == "production"
  input.approver_role == "admin"
}

# Staging deployment requires at least Gate 3 pass
approve_staging {
  input.environment == "staging"
  input.gate >= 3
  input.pipeline.gates[2].result == "pass"  # Integration tests passed
}

# Canary health check: must remain above threshold for observation period
canary_healthy {
  input.deployment.strategy == "canary"
  input.metrics.error_rate < 0.01
  input.metrics.latency_p99 < 2000  # milliseconds
  input.metrics.observation_duration_minutes >= 10
}
```

**12.6.3 智能体行为护栏**

```rego
package ulw.agent.guardrails

# Agent must not delete files outside its worktree
violation[{"msg": msg}] {
  input.tool == "bash"
  input.command == "rm"
  not startswith(input.working_dir, "/workspace/agent")
  msg := "rm command restricted to agent worktree"
}

# Agent must not access secrets through grep
violation[{"msg": msg}] {
  input.tool == "grep"
  contains(input.pattern, "password")
  msg := "grep for password patterns blocked"
}

# Agent must complete TDD cycle before committing
violation[{"msg": msg}] {
  input.tool == "git"
  input.command == "commit"
  input.tdd_phase != "DONE"
  msg := "Cannot commit before completing TDD cycle (DONE phase required)"
}

# Agent must not write production code without preceding test
violation[{"msg": msg}] {
  input.tool == "write_file"
  not endswith(input.filepath, ".test.ts")
  input.tdd_phase != "GREEN"
  input.tdd_phase != "REFACTOR"
  msg := "Cannot write non-test files outside GREEN/REFACTOR phase"
}

# Rate limiting per agent type
violation[{"msg": msg}] {
  input.tool == "web_search"
  input.agent_type == "opencode"
  input.rate_count > 10
  input.rate_window_minutes == 1
  msg := "OpenCode agents limited to 10 web searches per minute"
}
```

策略违规触发：
1. 违规操作在工具层被阻止
2. 发布 `security.policy_violation` 领域事件
3. 智能体会话被暂停，通过 Slack 通知监督器
4. 如果同一智能体在单个会话中违反 3+ 策略，会话被终止

---

### 12.7 数据驻留与合规

**12.7.1 数据分类级别**

| 级别 | 定义 | 示例 | 存储要求 | 访问要求 |
|-------|-----------|---------|---------------------|---------------------|
| **公开** | 非敏感，供外部消费 | 营销材料、公共 API 文档 | 无限制 | 无需认证 |
| **内部** | 通用业务数据，非机密 | 项目名称、工作流状态、团队分配 | 静态加密（AES-256） | 任何已认证用户 |
| **机密** | 业务敏感数据 | 源代码、测试报告、审查发现、架构规范 | 静态 + 传输中加密；限定在主区域 | 基于角色：高级开发者+ |
| **受限** | 高度敏感，合规监管 | 用户 PII、API 密钥、凭证、审计日志（原始）、安全扫描结果 | 静态 + 传输中加密；区域限定；专用 HSM 密钥 | 基于角色：Admin + Tech Lead（限定范围）；所有访问记录 |
| **监管** | 受法律/法规保留约束 | 审计日志（长期）、合规报告、法律保留 | 加密 + WORM 存储；7 年保留；法律保留支持 | 仅 Admin；访问触发告警 |

**12.7.2 数据存储地理围栏**

- **主区域**：所有机密及以上级别的数据必须驻留在主部署区域（例如，`us-east-1`）。Kubernetes Pod 拓扑分布约束在调度级别强制执行此要求。
- **跨区域复制**：仅公开和内部数据可以为灾难恢复目的复制到次要区域。机密数据的跨区域复制需要批准的例外，包含范围、持续时间和审计追踪。
- **智能体数据局部性**：智能体工作树和执行环境在与项目数据相同的区域内配置。编排器使用与项目区域标签匹配的 `nodeSelector` 和 `topologySpreadConstraints` 调度智能体 Pod。
- **数据驻留检查**：在任何跨区域数据传输之前运行预检验证。该检查评估传输中所有对象的数据分类级别，如果检测到任何机密+数据且无例外，则阻止传输。

**12.7.3 模型使用日志记录**

每个来自任何智能体的 LLM API 调用都记录用于合规和成本归属：

```typescript
interface ModelUsageRecord {
  usageId: string;
  agentId: string;
  sessionId: string;
  taskId: string;
  userId: string;                // User who triggered the session
  model: string;                 // e.g. "claude-opus-4", "deepseek-v4"
  provider: string;              // e.g. "anthropic", "deepseek"
  inputTokens: number;
  outputTokens: number;
  costUsd: number;               // Computed from token counts + model rate
  startTime: string;
  endTime: string;
  durationMs: number;
  promptHash: string;            // SHA-256 of the prompt (for deduplication analysis)
  toolCalls: number;
  violations: string[];          // Policy violations during this call
}
```

使用数据馈送：
- **成本仪表盘** (Grafana)：按团队、按项目、按用户的 LLM 支出
- **异常检测**：突然的成本峰值触发告警
- **审计追踪**：合规验证的完整记录
- **容量规划**：用于模型配置的令牌消费趋势

**12.7.4 SOC 2 / ISO 27001 控制映射**

| 控制领域 | ulw 实现 | 标准参考 |
|---------------|-------------------|-------------------|
| 访问控制 | Keycloak + RBAC + mTLS；通过 SCIM 自动化配置/取消配置 | SOC 2 CC6.1, ISO 27001 A.9 |
| 审计日志 | 不可变哈希链审计追踪；7 年保留 | SOC 2 CC3.1, ISO 27001 A.12.4 |
| 静态加密 | PostgreSQL、MinIO、Redis 的 AES-256；Vault 管理的密钥 | SOC 2 CC6.7, ISO 27001 A.10 |
| 传输中加密 | 所有服务间使用 mTLS；外部使用 TLS 1.3 | SOC 2 CC6.7, ISO 27001 A.13 |
| 变更管理 | 通过 Pulumi 的 GitOps；所有基础设施变更经过 PR + 审查 + 审批 | SOC 2 CC8.1, ISO 27001 A.12.1 |
| 逻辑隔离 | Kubernetes 命名空间 + 网络策略；每租户数据隔离 | SOC 2 CC6.2, ISO 27001 A.11 |
| 风险管理 | 使用 OPA 的策略即代码；自动化合规扫描 | SOC 2 CC4.1, ISO 27001 A.6 |
| 事件响应 | 自动化智能体隔离；回滚流程；事后分析工作流 | SOC 2 CC7.1, ISO 27001 A.16 |
| 数据保留 | 自动化生命周期管理；GDPR 擦除/匿名化 | SOC 2 CC6.4, ISO 27001 A.18 |
| 供应商管理 | LLM 提供者风险评估；模型使用日志记录；数据处理协议 | SOC 2 CC9.1, ISO 27001 A.15 |
| 可用性 | 多 AZ 部署；金丝雀 + 自动回滚；RTO < 30 分钟，RPO < 5 分钟 | SOC 2 A1.2, ISO 27001 A.17 |
| 软件开发生命周期 | TDD 强制编码；自动化审查流水线；CI/CD 中的安全扫描 | SOC 2 CC8.1, ISO 27001 A.14 |

---

### 12.8 事件响应

**12.8.1 智能体异常行为检测**

监督器组件持续监控智能体行为以发现异常迹象：

| 检测信号 | 方法 | 告警严重级别 | 响应 |
|-----------------|--------|---------------|----------|
| 卡在状态循环中 | 5 分钟内相同转换 >3 次重试 | 警告 | 暂停智能体，通知技术负责人 |
| 过量工具调用 | 10 分钟内 >100 次工具调用且无提交 | 警告 | 限制智能体速率，记录以进行审查 |
| 策略违规激增 | 单个会话中 >2 次 OPA 违规 | 严重 | 终止会话，隔离智能体 Pod |
| 异常文件访问 | 读取分配工作树外的文件 | 严重 | 终止会话，撤销凭证 |
| 命令拒绝列表匹配 | 尝试 `rm -rf /` 或类似破坏性命令 | 严重 | 终止会话，隔离 Pod，通知值班人员 |
| 提示注入尝试 | 在智能体输出中检测到密钥模式 | 严重 | 隔离智能体，撤销所有令牌，安全审查 |
| 代码质量崩溃 | 生成的代码中每 100 行审查发现 >50 个 | 警告 | 标记为人工审查，暂停智能体 |
| API 滥用 | 5 分钟内 >1000 次 LLM API 调用（可能失控） | 严重 | 硬限制智能体速率，通知 SRE |

**12.8.2 自动化智能体隔离**

当检测到严重异常行为时，隔离程序自动执行：

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Supervisor  │     │  Kubernetes  │     │  Vault       │     │  Slack       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │                     │
       │  DETECT violation  │                     │                     │
       │                    │                     │                     │
       │  1. Scale pod to 0 │                     │                     │
       │────────────────────>│                     │                     │
       │                    │  Deployment scaled   │                     │
       │<───────────────────│                     │                     │
       │                    │                     │                     │
       │  2. Revoke tokens  │                     │                     │
       │─────────────────────────────────────────>│                     │
       │                    │                     │  Leases revoked     │
       │<─────────────────────────────────────────│                     │
       │                    │                     │                     │
       │  3. Notify on-call │                     │                     │
       │────────────────────────────────────────────────────────────────>│
       │                    │                     │                     │
       │  4. Tag worktree   │                     │                     │
       │     as QUARANTINED │                     │                     │
       │                    │                     │                     │
       │  5. Log incident   │                     │                     │
       │     record         │                     │                     │
```

**12.8.3 回滚流程**

| 场景 | 回滚操作 | RTO | 数据完整性 |
|----------|----------------|-----|----------------|
| 错误部署（金丝雀） | `kubectl rollout undo deployment/{app}` + 流量切换回先前版本 | < 2 分钟 | 无数据丢失（金丝雀无写入流量） |
| 错误部署（完全） | 完全 rollout undo + 先前镜像恢复 + 数据库迁移回退（如适用） | < 10 分钟 | 潜在的数据库更改通过迁移回退还原 |
| 错误代码提交（智能体生成） | `git revert <commit>` + 在回退 PR 上重新运行审查流水线 | < 5 分钟 | 提交历史保留 |
| 数据损坏（PostgreSQL） | 从 WAL 归档进行时间点恢复 | < 30 分钟 | RPO = 5 分钟（WAL 流） |
| 密钥暴露 | 在 Vault 中轮换受损密钥 + 撤销所有使用它的会话 + 审计日志审查 | < 5 分钟 | 事件链为取证分析保留 |
| 智能体受损 | 完全隔离（12.8.2）+ 工作树删除 + 凭证轮换 + 所有受影响仓库的安全扫描 | < 30 分钟 | 隔离快照为取证保留 |

**12.8.4 事件事后分析模板**

```markdown
# Incident Postmortem

## Metadata
- **Incident ID**: INC-{YYYY}-{NNNN}
- **Severity**: SEV1 / SEV2 / SEV3
- **Date**: YYYY-MM-DD
- **Duration**: {start} -> {end} ({duration})
- **Detected by**: {automated alert / user report / audit review}
- **Response type**: automated / semi-automated / manual

## Summary
{One-paragraph description of what happened and impact}

## Timeline
| Time (UTC) | Event | Actor |
|------------|-------|-------|
| HH:MM:SS | {event description} | {system / human} |
| HH:MM:SS | {detection} | {monitoring} |
| HH:MM:SS | {response action} | {automated / on-call} |
| HH:MM:SS | {resolution} | {automated / on-call} |

## Root Cause
{Technical root cause analysis}

## Impact
- **Users affected**: {count}
- **Deployments affected**: {environments}
- **Data loss**: {yes/no, extent}
- **Downtime**: {duration}
- **Cost impact**: ${amount} (LLM overage, compute, etc.)

## Detection Gaps
{What should have caught this earlier?}

## Action Items
| # | Action | Owner | Severity | Due Date | Status |
|---|--------|-------|----------|----------|--------|
| 1 | {action description} | {team} | P0/P1/P2 | YYYY-MM-DD | {open/closed} |

## Prevention
{Systemic changes to prevent recurrence}

## Lessons Learned
{What went well? What went wrong? What to improve?}

## Related Incidents
{References to related incidents for trend analysis}
```

事后分析模板自动填充来自审计追踪的事件数据。人类响应者只需要填写分析部分。完成的事后分析存储在 MinIO 中并建立索引以进行趋势分析。

---
