# ulw (UltraWork) — AI-Driven Full-Process R&D Platform Design Document

> **Version**: v1.0  
> **Date**: 2026-04-28  
> **Status**: Draft  
> **Target Team Scale**: 100+ developers  
> **Target Deployment**: Kubernetes Cluster  
> **Core Language**: TypeScript  

---

## Table of Contents

1. [Project Overview & Vision](#1-project-overview--vision)
2. [System Architecture Design](#2-system-architecture-design)
3. [DDD Domain Design](#3-ddd-domain-design)
4. [Multi-Agent Collaboration Architecture](#4-multi-agent-collaboration-architecture)
5. [TDD Testing Framework Design](#5-tdd-testing-framework-design)
6. [Automated Code Review Module](#6-automated-code-review-module)
7. [API Auto-Testing Module](#7-api-auto-testing-module)
8. [CI/CD Pipeline Design](#8-cicd-pipeline-design)
9. [Technology Stack](#9-technology-stack)
10. [Data Flow & Integration](#10-data-flow--integration)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Security & Governance](#12-security--governance)

---

## 1. Project Overview & Vision

### 1.1 Vision Statement

**ulw (UltraWork)** is an AI Agent-driven intelligent R&D lifecycle platform that forms a closed-loop automation system: **Architecture Design → Code Development → Smart Review → Automated Testing → One-Click Deployment**. By integrating the OpenCode development engine and OpenClaw review engine through a multi-agent collaboration architecture, ulw eliminates the manual bottlenecks that plague traditional software delivery.

### 1.2 Core Value Proposition

| Pain Point | ulw Solution | Expected Impact |
|------------|-------------|-----------------|
| Architecture implementation difficulty | DDD Bounded Contexts + Steward Agents enforce architectural boundaries at the agent level | 100% architecture compliance |
| Coding standard inconsistency | TDD state machine with file-write gating ensures test-first discipline; code review agents enforce style per BC | Unified code quality |
| Low manual code review efficiency | 6-agent review pipeline runs on every PR within 2-5 minutes | 90% reduction in review latency |
| Heavy API testing workload | OpenAPI spec → AI generates happy path + negative + auth variant tests automatically | 80% reduction in QA effort |
| Complex deployment processes | 5-Gate CI/CD pipeline with canary deployment and auto-rollback | Zero-touch production deploys |
| Long delivery cycles with unstable quality | Full AI-driven closed loop; human only at approval gates | 70% cycle time reduction |

### 1.3 Target User Personas

| Persona | Role | Primary Interaction |
|---------|------|-------------------|
| **Tech Lead** | Architecture owner, gate approver | Defines bounded contexts, reviews AI-generated architecture, approves PRs at Gate 5 |
| **Senior Developer** | Feature implementer | Writes micro-specs, triggers AI coding agents, validates generated code |
| **QA Engineer** | Test strategy owner | Reviews AI-generated test scenarios, defines contract testing policies, approves test suites |
| **DevOps Engineer** | Pipeline operator | Manages CI/CD infrastructure, monitors agent health, handles incident response |

### 1.4 North Star Metric

**End-to-end delivery cycle time** — from feature specification to production deployment, targeting 70% reduction from baseline.

### 1.5 Design Principles

1. **Agent-First**: Every development workflow is agent-executable; humans are reviewers and approvers, not doers
2. **Contract-Driven**: All inter-component communication is governed by machine-readable contracts (OpenAPI, Protobuf, event schemas)
3. **Test-First, Always**: No production code exists without a failing test that precedes it (enforced at tool level)
4. **Domain-Aligned**: Agent responsibilities map 1:1 to DDD Bounded Contexts; no cross-context agent ambiguity
5. **Observable by Default**: Every agent action produces immutable audit events; every pipeline stage emits metrics

---

## 2. System Architecture Design

### 2.1 Architecture Overview

ulw adopts a **layered microservices architecture** with a centralized orchestration engine coordinating specialized agent runtimes. The system runs on Kubernetes for horizontal scalability, fault tolerance, and infrastructure-as-code management.

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

### 2.2 Layer Responsibilities

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **External Interfaces** | GitHub/GitLab Webhooks, Slack, IDE Extensions, REST API | Inbound triggers and user interaction points |
| **API Gateway** | Kong Ingress | Authentication, rate limiting, request routing, TLS termination |
| **Orchestration Engine** | Orchestrator + Supervisor + Workflow Engine | Task decomposition, agent assignment, DAG execution, retry management |
| **Agent Runtime** | OpenCode Runtime | AI-driven code generation with TDD guardrails, git worktree isolation |
| | OpenClaw Runtime | Multi-agent code review pipeline, PR webhook processing |
| | Test Runtime | Test generation from OpenAPI specs, contract testing, test execution |
| | Deploy Runtime | Canary deployment, progressive rollout, auto-rollback |
| **Data & Knowledge** | PostgreSQL + Redis + NATS + MinIO | Domain persistence, caching, event streaming, artifact storage |
| **Observability** | OpenTelemetry + Prometheus + Grafana + ELK | Distributed tracing, metrics, dashboards, audit logging |

### 2.3 Communication Patterns

| Pattern | Technology | Use Case |
|---------|-----------|----------|
| **Synchronous RPC** | gRPC / REST (NestJS) | Orchestrator ↔ Supervisor, API Gateway → Orchestrator |
| **Async Messaging** | NATS JetStream | Agent ↔ Agent communication, domain events, workflow state transitions |
| **Event Streaming** | NATS Streaming | CI/CD pipeline events, deployment state changes, audit events |
| **File-Based** | Git Worktrees + MinIO | Agent code output, review artifacts, test reports |
| **Webhook** | HTTP Callbacks | GitHub/GitLab PR events triggering review pipeline |

### 2.4 Kubernetes Deployment Topology

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

### 2.5 Infrastructure-as-Code Strategy

All Kubernetes resources are defined via **Pulumi (TypeScript)**, enabling:
- Declarative infrastructure with full TypeScript type safety
- GitOps workflow: infrastructure changes go through PR → review → apply
- Multi-environment management (dev/staging/production) with stack-based configuration
- Secret management via HashiCorp Vault integration

---

## 3. DDD Domain Design

### 3.1 Domain Classification

ulw's domain model follows Eric Evans's strategic DDD patterns, classifying each subdomain by its strategic value to the platform. This classification drives investment priority, team allocation, and make-vs-buy decisions.

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

#### 3.1.1 Core Domains (Build In-House, Differentiate)

| Domain | Strategic Value | Why Core |
|--------|----------------|----------|
| **Code Generation** | Primary value driver — AI agents writing production-quality TypeScript | Unique TDD state machine, context-aware generation, worktree isolation — not replicable with off-the-shelf LLM tooling |
| **Code Review** | Quality gate for all code entering the system | Multi-agent review pipeline (Analyzer + Critic + Policy), contract-aware review, gated merges — ulw's trusted quality brand |

These two domains receive the highest investment: dedicated steward agents, custom model fine-tuning budgets, and priority in the agent scheduling queue.

#### 3.1.2 Supporting Domains (Build In-House, Standard Investment)

| Domain | Strategic Value | Why Supporting |
|--------|----------------|---------------|
| **Project Management** | Tracks delivery state, exposes progress to users | Necessary for workflow orchestration, but uses well-known patterns (story lifecycle, sprint boards) |
| **Architecture Design** | Captures system design intent as machine-readable specs | Bridges human architect intent to agent execution; domain logic is mapping rather than algorithmic |
| **Test Automation** | Ensures quality alongside code review | Test generation is valuable but follows established patterns (OpenAPI → tests, contract testing) |

These domains get dedicated steward agents but reuse generic infrastructure. They may integrate with external tools (Jira, Swagger UI).

#### 3.1.3 Generic Domains (Buy or Integrate)

| Domain | Strategy | Rationale |
|--------|----------|-----------|
| **Deployment** | Wraps Kubernetes APIs and ArgoCD via thin TypeScript layer | CI/CD is a well-solved problem. ulw's agent layer adds approval gates and rollback policies on top of existing tooling |

The deployment domain is handled via an anti-corruption layer wrapping ArgoCD / GitHub Actions APIs, keeping the agent model clean from vendor specifics.

### 3.2 Bounded Contexts

Six bounded contexts (BCs) map 1:1 to the domains above. Each BC owns its data, logic, and agent runtime. No cross-BC database access is permitted — all integration happens through events or API calls.

#### BC-1: Project Management (PM)

| Aspect | Definition |
|--------|-----------|
| **Responsibility** | Manages project lifecycle: story creation, sprint planning, backlog grooming, milestone tracking. Exposes the delivery dashboard and progress metrics |
| **Owned Data** | Stories, tasks, sprints, milestones, developer assignments, velocity metrics |
| **Key Trigger** | GitHub issue webhook / REST API story creation |
| **Output Event** | `StoryReady` (feeds into Architecture Design), `SprintCommitted` (triggers generation loop) |
| **Agent** | PM-Steward |

#### BC-2: Architecture Design (AD)

| Aspect | Definition |
|--------|-----------|
| **Responsibility** | Transforms user stories into architecture specifications: DDD context maps, aggregate designs, API contracts, data models. Outputs machine-readable specs for code generation |
| **Owned Data** | Architecture specs, context maps, API schemas (OpenAPI/Protobuf), data models, tech stack decisions |
| **Key Trigger** | `StoryReady` event from PM |
| **Output Event** | `ArchitectureApproved` (triggers Code Gen), `ContractPublished` (fed to Test Automation) |
| **Agent** | AD-Steward |

#### BC-3: Code Generation (CG)

| Aspect | Definition |
|--------|-----------|
| **Responsibility** | Generates production code from architecture specs using TDD state machine. Enforces test-first discipline: no file write without a preceding failing test |
| **Owned Data** | Generated source files, test files, generation traces, TDD state transitions |
| **Key Trigger** | `ArchitectureApproved` event |
| **Output Event** | `CodeReady` (PR created, triggers Code Review) |
| **Agent** | CG-Steward + Specialist: Code Reviewer, TDD Test Agent |
| **Isolation** | Git worktree per generation task — generated code is written to an isolated branch |

#### BC-4: Code Review (CR)

| Aspect | Definition |
|--------|-----------|
| **Responsibility** | Multi-agent automated code review: static analysis, style enforcement, security scan, architecture compliance check. Runs on every PR |
| **Owned Data** | Review reports, diff analysis, violation records, approval status |
| **Key Trigger** | `CodeReady` event / GitHub PR webhook |
| **Output Event** | `ReviewPassed` or `ReviewFailed` (feeds back to CG or forward to Test) |
| **Agent** | CR-Steward + Specialists: Security Auditor, Contract Validator |
| **Integration** | OpenClaw Runtime: Analyzer → Critic → Policy review pipeline |

#### BC-5: Test Automation (TA)

| Aspect | Definition |
|--------|-----------|
| **Responsibility** | Generates and executes test suites: unit tests from TDD, integration/API tests from OpenAPI specs, contract tests, E2E scenarios. Manages test environment provisioning |
| **Owned Data** | Test cases, test results, coverage reports, contract test suites, environment configs |
| **Key Trigger** | `ReviewPassed` event, `ContractPublished` from AD |
| **Output Event** | `TestPassed` or `TestFailed` (feeds to Deployment) |
| **Agent** | TA-Steward |

#### BC-6: Deployment (DP)

| Aspect | Definition |
|--------|-----------|
| **Responsibility** | Manages the CI/CD pipeline: build, containerize, canary deploy, monitor, rollback. Wraps Kubernetes and ArgoCD |
| **Owned Data** | Pipeline runs, deployment states, release versions, rollback history, canary metrics |
| **Key Trigger** | `TestPassed` event + human approval |
| **Output Event** | `Deployed` (version released to production), `DeployFailed` (rollback triggered) |
| **Agent** | DP-Steward + Specialist: Deploy Agent |

### 3.3 Context Map

The relationships between bounded contexts are defined using standard DDD context-map patterns. The ASCII diagram below shows all six BCs and their integration patterns.

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

**Relationship Descriptions:**

| Relationship | Type | BC Pair | Description |
|-------------|------|---------|-------------|
| PM ↔ AD | **Partnership** | Project Management ↔ Architecture Design | Co-equal peers. PM produces stories; AD consumes them and produces specs. They negotiate scope and technical feasibility as partners |
| AD → CG | **Customer-Supplier** | Architecture Design (upstream) supplies specs to Code Generation (downstream) | CG is the customer of AD. If AD specs are incomplete, CG rejects them. AD must satisfy CG's needs |
| CG → CR | **Customer-Supplier** | Code Generation (upstream) supplies PRs to Code Review (downstream) | CR reviews code generated by CG. Failed reviews bounce back to CG for fixes |
| CR ↔ TA | **Published Language** | Code Review ↔ Test Automation share OpenAPI contracts | Both consume the same contract specs from AD. Changes to contracts are coordinated through the shared OpenAPI schema |
| CR → DP | **Customer-Supplier** | Code Review (upstream) supplies approved code to Deployment (downstream) | DP only deploys code that has passed all review gates |
| TA → DP | **Customer-Supplier** | Test Automation (upstream) supplies test-passed signal to Deployment | DP requires both review + test pass for deployment |

**External Relationships (Anti-Corruption):**

| Relationship | Type | Description |
|-------------|------|-------------|
| OpenCode ↔ CG | **ACL** | ulw wraps OpenCode's agent SDK with a domain-specific TDD enforcement layer. OpenCode's concept of "agent tool call" is translated to ulw's "TDD state transition" |
| CG → Git | **ACL** | Code Generation writes to Git via an ACL that enforces branch policies, commit message conventions, and worktree isolation |
| OpenClaw ↔ CR | **ACL** | ulw wraps OpenClaw's ACP pipeline with domain-specific review policies. OpenClaw's "analyze" maps to ulw's "static analysis check" |
| CR → CI | **ACL** | Code Review triggers CI pipelines through a thin ACL that translates ulw review results to CI webhook payloads |

### 3.4 Per-BC Domain Model

Each bounded context defines its own domain model with entities, value objects, aggregates, domain events, and repository interfaces. The models are implemented in TypeScript with NestJS decorators for persistence mapping.

#### BC-1: Project Management Domain Model

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

#### BC-2: Architecture Design Domain Model

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

#### BC-3: Code Generation Domain Model

```
┌──────────────────────────────────────────────────────────────┐
│  CG Aggregate: GenerationTask                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Entity: GenerationTask { id, status, specId }       │    │
│  │  ├── VO: TDDState {                                     │    │
│  │  │   phase: RED|GREEN|REFACTOR|VERIFIED,               │    │
│  │  │   currentFile,                                      │    │
│  │  │   constraints[]                                     │    │
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

#### BC-4: Code Review Domain Model

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

#### BC-5: Test Automation Domain Model

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

#### BC-6: Deployment Domain Model

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

### 3.5 Ubiquitous Language Glossary

This glossary defines the shared vocabulary used across all ulw bounded contexts. Every term has a single, precise meaning. Agents use these terms consistently in prompts, events, and documentation.

| Term | Definition | Used In |
|------|-----------|---------|
| **Story** | A unit of work derived from a feature request. Contains title, description, acceptance criteria, and story points | PM, AD |
| **Architecture Spec** | A machine-readable document defining the DDD structure, API contracts, and data models for a story or feature | AD, CG |
| **Aggregate Design** | A DDD aggregate definition including the aggregate root, entities, value objects, and invariants | AD, CG |
| **Contract** | An API contract (OpenAPI 3.x) shared between provider and consumer services | AD, TA, CR |
| **TDD State** | The current phase of the test-first cycle: RED (test fails), GREEN (test passes), REFACTOR (clean code), VERIFIED (all checks pass) | CG |
| **Worktree** | An isolated Git worktree branch where a generation agent writes code without interfering with other agents | CG |
| **Review Session** | A complete code review lifecycle for a single PR, containing multiple checks and comments | CR |
| **Violation** | A specific rule breach found during code review, with file, line, severity, and rule reference | CR |
| **Check** | A single review dimension (style, security, architecture, contract) within a review session | CR |
| **Test Suite** | A collection of test cases targeting a specific scope (unit, integration, contract, E2E) | TA |
| **Contract Assertion** | A verification that a provider-consumer contract is satisfied by both sides | TA |
| **Release** | A versioned deployment unit with a complete pipeline run and approval history | DP |
| **Canary Rule** | A progressive traffic-shifting rule that defines step size, success criteria, and TTL for canary deployments | DP |
| **Approval Gate** | A human decision point in the deployment pipeline requiring explicit approval to proceed | DP |
| **Generation Trace** | The full provenance record of a code generation event: prompt, model, tokens consumed, duration, parent tasks | CG (audit) |
| **Agent Identity** | The SOUL.md + AGENTS.md + TOOLS.md triplet that defines an agent's purpose, capabilities, and constraints | All BCs |
| **Brain / Heart** | Architecture separation: Brain (Orchestrator, stateless, decisions) vs Heart (Supervisor, stateful, memory) | Orchestration |
| **Steward Agent** | An agent responsible for a single bounded context. One steward per BC | All BCs |
| **Specialist Agent** | A focused agent with a narrow skill (reviewer, tester, deployer) invoked by a steward | CG, CR, TA, DP |
| **Dream Team** | A temporary multi-agent swarm formed for complex tasks requiring cross-BC collaboration | All BCs |
| **ACP Sub-Session** | OpenClaw's Analyze-Critic-Policy pipeline: Analyzer finds issues, Critic prioritizes, Policy enforces rules | CR |

### 3.6 Anti-Corruption Layers

ULW integrates with four external systems — OpenCode, OpenClaw, Git, and CI/CD — each through a dedicated Anti-Corruption Layer (ACL). These ACLs prevent external domain concepts from leaking into the ulw domain model.

#### 3.6.1 OpenCode ACL

OpenCode provides the agent runtime (command execution, file operations, LLM calls) but frames everything as generic "agent tool calls." ulw's CG domain needs TDD-specific semantics.

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

**TypeScript implementation sketch:**

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

OpenClaw's review pipeline (ACP: Analyzer + Critic + Policy) produces raw review artifacts. Ulw needs these mapped to domain-level concepts: violations, checks, and review sessions.

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

**TypeScript implementation sketch:**

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

ulw's Code Generation BC writes code through an ACL that enforces strict branch isolation and commit conventions. Raw Git commands are never exposed to agents.

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

Deployment commands to Kubernetes/ArgoCD are wrapped in an ACL that adds approval-gate enforcement before any production mutation.

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

Every ACL is independently testable. Each has a mock implementation for unit tests and a production implementation wired through the NestJS dependency injection container. ACLs are the only points where external system concepts cross into the ulw domain.

## 4. Multi-Agent Collaboration Architecture

### 4.1 Agent Hierarchy

ulw organizes agents in a four-tier hierarchy that separates strategic decision-making (Brain) from operational execution and state management (Heart). This separation is the core architectural choice that enables the platform to scale to 100+ developers without cognitive overload on any single agent.

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

#### 4.1.1 Brain-Heart Separation Rationale

The Brain-Heart split is motivated by three constraints that emerged from the 100+ developer use case:

**1. Fail-fast vs. Recover-slow.** The Orchestrator (Brain) is stateless by design. If it crashes, a new pod picks up the next task immediately — no state to restore, no session to replay. The Supervisor (Heart) holds all session state in a Raft-consensus StatefulSet. If a Supervisor pod fails, Raft elects a new leader and state is preserved. This means transient errors in the decision layer are invisible to users, while the state layer survives pod failures.

**2. Cognitive load separation.** The Brain makes one decision at a time: "Given the current workflow state, what is the next task and which agent should do it?" The Heart tracks N concurrent sessions, their histories, retry counts, and outcomes. If the Brain held state, it would need to reload the full session context for every decision, increasing latency and token costs. Separating them keeps each agent's context window focused.

**3. Independent scaling dimensions.** The Brain scales on request volume (more workflows → more Orchestrator pods). The Heart scales on session count (more concurrent agents → more Supervisor pods). These are different metrics that peak at different times. The separation lets each tier autoscale independently.

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

### 4.2 Agent Identity Model

Every agent in ulw — from the Orchestrator down to a Specialist — carries a three-file identity definition stored in the agent's home directory. This model was inspired by OpenCode's skill system but extended to support hierarchical agent relationships and domain-specific constraints.

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

#### 4.2.1 SOUL.md — Agent Purpose and Character

Defines the agent's fundamental nature: its role, values, constraints, and ethical boundaries. Every agent decision traces back to its SOUL definition.

**Example: CG-Steward SOUL.md**

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

**Example: CR-Steward SOUL.md**

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

#### 4.2.2 AGENTS.md — Agent Relationships

Defines the agent's peers, its position in the hierarchy, and how to communicate with other agents. This is equivalent to a network topology map for the multi-agent system.

**Example: Orchestrator AGENTS.md**

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

**Example: CG-Steward AGENTS.md**

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

#### 4.2.3 TOOLS.md — Agent Capabilities

Lists the tools an agent can access. Each tool maps to a specific file-scoped permission or API endpoint. This is the authorization boundary for agent actions.

**Example: CG-Steward TOOLS.md**

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

### 4.3 Agent Types Catalog

#### 4.3.1 Tier 1: Orchestrator

| Property | Value |
|----------|-------|
| **Type** | Orchestrator (Brain) |
| **Instances** | 1 active (2 pod HA, active-passive) |
| **State** | Stateless |
| **Purpose** | Entry point for all developer-initiated workflows. Receives story/PR triggers, decomposes them into DAG workflows, and hands execution to the Supervisor |
| **Key Functions** | Workflow creation, task decomposition, agent assignment, DAG validation |
| **Communication** | gRPC (receives from API Gateway), NATS (publishes workflow events), gRPC (delegates to Supervisor) |
| **LLM Model** | GPT-4o (reasoning-heavy, one-shot decisions) |
| **Identity** | `SOUL.md`: strategic decision-maker, "what to do and who does it" / `AGENTS.md`: root node / `TOOLS.md`: workflow creation, agent lookup, DAG validation |

#### 4.3.2 Tier 2: Supervisor

| Property | Value |
|----------|-------|
| **Type** | Supervisor (Heart) |
| **Instances** | 3 (Raft consensus, StatefulSet) |
| **State** | Stateful (PostgreSQL + Redis) |
| **Purpose** | Manages all active sessions. Tracks workflow progress, agent status, retry queues, and session state. The "memory" of the system |
| **Key Functions** | Session persistence, retry management, heartbeat monitoring, dead-letter queue processing, status aggregation |
| **Communication** | gRPC (receives from Orchestrator), NATS (publishes task assignments to stewards, receives status events), PostgreSQL (session store), Redis (cache, locks) |
| **LLM Model** | GPT-4o-mini (aggregation, status classification — not a primary reasoning agent) |
| **Identity** | `SOUL.md`: reliable state keeper / `AGENTS.md`: middle layer, routes between Orchestrator and Stewards / `TOOLS.md`: session CRUD, agent status queries, retry scheduling |

#### 4.3.3 Tier 3: Steward Agents (One per BC)

**PM-Steward (Project Management)**

| Property | Value |
|----------|-------|
| **Domain** | Project Management |
| **Purpose** | Owns the story lifecycle. Creates stories from issue webhooks, manages sprint backlogs, tracks delivery progress |
| **Key Functions** | Story creation and refinement, sprint planning, velocity tracking, milestone management |
| **Specialists Used** | None (PM is self-contained) |
| **LLM Model** | GPT-4o-mini (structured data, classification tasks) |
| **Trigger Events** | GitHub issue webhook → `StoryCreated`, `SprintCommitted` → AD |

**AD-Steward (Architecture Design)**

| Property | Value |
|----------|-------|
| **Domain** | Architecture Design |
| **Purpose** | Transforms stories into machine-readable architecture specifications. Produces DDD context maps, aggregate designs, API contracts, and data models |
| **Key Functions** | DDD analysis, context map generation, API contract authoring, data model design, tech stack selection |
| **Specialists Used** | None (AD collaborates with human Tech Lead for approval) |
| **LLM Model** | GPT-4o (complex reasoning, requires deep architecture understanding) |
| **Trigger Events** | `StoryReady` from PM → `ArchitectureApproved` to CG, `ContractPublished` to TA |

**CG-Steward (Code Generation)**

| Property | Value |
|----------|-------|
| **Domain** | Code Generation (Core) |
| **Purpose** | Executes the TDD generation loop: given an architecture spec, generates tests → code → refactors in the RED-GREEN-REFACTOR cycle |
| **Key Functions** | TDD state machine management, worktree creation, code generation orchestration, PR creation |
| **Specialists Used** | Code Reviewer (Specialist), TDD Test Agent (Specialist) |
| **LLM Model** | Claude 4 (best-in-class code generation, long context for large specs) |
| **Trigger Events** | `ArchitectureApproved` from AD → `CodeReady` to CR |
| **Isolation** | Git worktree per generation task — fully isolated file system |

**CR-Steward (Code Review)**

| Property | Value |
|----------|-------|
| **Domain** | Code Review (Core) |
| **Purpose** | Orchestrates the multi-agent review pipeline. Runs style, security, architecture, and contract checks on every PR |
| **Key Functions** | PR diff analysis, review pipeline orchestration, violation aggregation, bounce/reject decisions |
| **Specialists Used** | Security Auditor (Specialist), Contract Validator (Specialist) |
| **LLM Model** | Claude 4 (nuanced code understanding, security pattern detection) |
| **Trigger Events** | `CodeReady` from CG / GitHub PR webhook → `ReviewPassed` / `ReviewFailed` to CG or DP |
| **Integration** | OpenClaw Runtime: runs ACP sub-session for each review dimension |

**TA-Steward (Test Automation)**

| Property | Value |
|----------|-------|
| **Domain** | Test Automation |
| **Purpose** | Generates and executes test suites: API tests from OpenAPI specs, contract tests, integration tests. Manages test environments |
| **Key Functions** | Test case generation from contracts, test execution orchestration, coverage aggregation, flaky test detection |
| **Specialists Used** | None (self-contained; may invoke contract validator) |
| **LLM Model** | GPT-4o (test generation requires good pattern recognition) |
| **Trigger Events** | `ReviewPassed` from CR → `TestPassed` / `TestFailed` to DP |

**DP-Steward (Deployment)**

| Property | Value |
|----------|-------|
| **Domain** | Deployment (Generic) |
| **Purpose** | Manages the CI/CD pipeline: build, containerize, canary deploy, monitor, rollback |
| **Key Functions** | Pipeline stage orchestration, canary rule evaluation, approval gate management, rollback trigger |
| **Specialists Used** | Deploy Agent (Specialist) |
| **LLM Model** | GPT-4o-mini (deployment logic is mostly deterministic; LLM used for canary analysis) |
| **Trigger Events** | `TestPassed` from TA + human approval → `Deployed` / `DeployFailed` |

#### 4.3.4 Tier 4: Specialist Agents

**Code Reviewer (Specialist)**

| Property | Value |
|----------|-------|
| **Parent** | CG-Steward |
| **Purpose** | Reviews generated code for correctness, style compliance, and best practices before it enters the formal CR pipeline |
| **Scope** | Single PR diff within CG worktree |
| **Autonomy** | Reports findings to CG-Steward. Cannot reject independently (bounce decision is stewards) |
| **LLM Model** | Claude 4 (detailed code analysis) |

**TDD Test Agent (Specialist)**

| Property | Value |
|----------|-------|
| **Parent** | CG-Steward |
| **Purpose** | Generates test files first (RED phase) before any production code is written. Ensures test coverage meets thresholds |
| **Scope** | Single generation task within CG worktree |
| **Autonomy** | Writes test files autonomously. Production code generation is gated on its test output |
| **LLM Model** | Claude 4 Haiku (fast, cheap test generation) |

**Security Auditor (Specialist)**

| Property | Value |
|----------|-------|
| **Parent** | CR-Steward |
| **Purpose** | Scans code for security vulnerabilities: hardcoded secrets, injection risks, unsafe deserialization, dependency vulnerabilities |
| **Scope** | PR diff + dependency manifest |
| **Autonomy** | Flags violations. Critical severity violations trigger automatic bounce |
| **LLM Model** | GPT-4o (security pattern recognition) |

**Contract Validator (Specialist)**

| Property | Value |
|----------|-------|
| **Parent** | CR-Steward / TA-Steward |
| **Purpose** | Validates that API implementations match their OpenAPI contracts. Ensures provider-consumer compatibility |
| **Scope** | PR diff + associated OpenAPI specs |
| **Autonomy** | Reports pass/fail. Contract breakage is always a reject |
| **LLM Model** | GPT-4o-mini (structured comparison, deterministic logic) |

**Deploy Agent (Specialist)**

| Property | Value |
|----------|-------|
| **Parent** | DP-Steward |
| **Purpose** | Executes deployment commands against Kubernetes/ArgoCD. Handles canary step progression and rollback |
| **Scope** | Single release pipeline |
| **Autonomy** | Executes commands but cannot bypass approval gates or skip canary steps |
| **LLM Model** | None (purely deterministic tool executor) |

### 4.4 Communication Protocols

ulw agents communicate through four distinct protocols, each suited to a different communication pattern. The choice of protocol depends on whether the communication is synchronous or async, point-to-point or broadcast, and whether delivery guarantees are required.

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

#### 4.4.1 OpenCode Teams P2P Inbox System

OpenCode Agent Teams provides a flat P2P messaging layer where each agent has a named inbox. Agents send messages to each other's inboxes without going through a central broker. ulw layers its hierarchical routing on top of this flat substrate.

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

**TypeScript message envelope:**

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

Within the Code Review BC, the CR-Steward interacts with the OpenClaw Runtime through session-based synchronous calls. Each review dimension (style, security, arch, contract) maps to an ACP sub-session.

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

#### 4.4.3 NATS Event Bus

All domain events (Section 3.4) are published to NATS JetStream. The event bus is the backbone of asynchronous communication between bounded contexts.

**NATS subject hierarchy:**

```
ulw.events.<source-bc>.<event-name>     — Standard domain events
ulw.command.<target-bc>.<command>        — Direct commands (Supervisor → Steward)
ulw.status.<agent-role>                  — Agent heartbeat and status
ulw.blackboard.<session-id>              — Dream Team shared state
ulw.audit.<event-type>                   — Immutable audit log
```

**Event flow example (full story-to-deployment):**

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

Each event carries the full correlation context so the Supervisor can reconstruct the workflow DAG at any point.

#### 4.4.4 Blackboard Shared State

For complex tasks requiring real-time collaboration (Dream Team mode), agents share state through a Redis-backed blackboard. The blackboard is a key-value store scoped to a single session.

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

### 4.5 Orchestration Patterns

ulw supports three orchestration patterns, each suited to different workflow shapes. The Orchestrator selects the pattern at workflow creation time based on a decision matrix.

#### 4.5.1 Pattern 1: Hub-and-Spoke (Default)

A single controller (the Supervisor) routes work to workers (Stewards) and collects results. Simple, predictable, and easy to monitor.

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

| When to use | Default for all linear workflows |
|-------------|----------------------------------|
| **Pros** | Simple to reason about, single point of monitoring, easy retry logic |
| **Cons** | Hub is a bottleneck, no agent-to-agent direct collaboration |
| **Example** | Single-story generation: AD → CG → CR → TA → DP (each step waits for the previous) |

#### 4.5.2 Pattern 2: DAG Workflow (Parallel)

The Supervisor builds a Directed Acyclic Graph of tasks and executes them in dependency order, parallelizing where possible.

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

| Feature | Detail |
|---------|--------|
| **When to use** | Multiple independent work items that can proceed in parallel |
| **Pros** | Faster than sequential for multi-story work, resource-efficient |
| **Cons** | Requires dependency resolution, harder to debug |
| **Example** | Sprint batch: 3 stories from AD approved simultaneously. CG generates them in parallel. CR reviews all at once |

#### 4.5.3 Pattern 3: Dream Team (Collaborative)

All relevant agents work together on a shared blackboard, communicating directly rather than through the Supervisor. Used for complex cross-BC issues that no single agent can resolve alone.

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

| Feature | Detail |
|---------|--------|
| **When to use** | Cross-BC issues, architecture disagreements, contract mismatch resolution |
| **Pros** | Fastest resolution for complex issues, agents self-organize |
| **Cons** | Harder to monitor, requires Supervisor timeout, higher LLM cost (all agents active) |
| **Example** | CR finds a contract violation between two services. AD, CG, and CR stewards form a Dream Team on the blackboard to redesign the contract, regenerate code, and re-validate |

#### 4.5.4 Decision Matrix

The Orchestrator selects the orchestration pattern based on these criteria at workflow creation time:

| Criteria | Hub-and-Spoke | DAG Workflow | Dream Team |
|----------|:---:|:---:|:---:|
| Number of BCs involved | 1-2 | 2-4 | 2-6 |
| Task dependencies | Sequential | Parallel branches | Interdependent |
| Cross-BC communication needed | None | None | Heavy |
| Error risk | Low | Medium | High |
| Time sensitivity | Normal | Fast | Needs resolution |
| LLM cost impact | Lowest | Medium | Highest |

**Selection logic:**

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

### 4.6 Agent Isolation Strategy

Agent isolation prevents interference between concurrent agent operations, contains failures to a single agent, and protects the integrity of the codebase. ulw uses three nested isolation layers.

#### 4.6.1 Layer 1: Git Worktrees (Code Generation)

Every CG-Steward generation task runs in an isolated Git worktree. A worktree is a separate working directory linked to the repository, sharing the Git object store but with its own working tree and index.

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

**Worktree lifecycle:**

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

#### 4.6.2 Layer 2: Per-Agent Sandbox (Runtime Isolation)

Each agent process runs in a container-level sandbox with scoped file system, network, and resource limits.

| Resource | CG-Steward | CR-Steward | TA-Steward | DP-Steward |
|----------|:----------:|:----------:|:----------:|:----------:|
| **Filesystem** | Worktree only | Repo read + MinIO | Repo read + MinIO | K8s API only |
| **Network** | NATS + Git | NATS + OpenClaw | NATS + Test env | NATS + K8s API |
| **Memory limit** | 4 GB | 2 GB | 4 GB | 1 GB |
| **CPU limit** | 2 cores | 1 core | 2 cores | 0.5 cores |
| **Max runtime** | 30 min | 10 min | 20 min | 15 min |
| **Internet** | Blocked | Blocked | Blocked | Blocked |
| **Write permission** | Worktree only | None | Test reports to MinIO | K8s API scoped |

Sandboxing is enforced at the Kubernetes pod level: each agent runs in its own pod with a SecurityContext that limits capabilities, and a NetworkPolicy that restricts egress.

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

#### 4.6.3 Layer 3: File-Scope Permissions (Fine-Grained Control)

Within the sandbox, agents have file-scope permissions enforced by a FUSE-like permission layer. This prevents a CG agent from accidentally modifying files outside its allowed paths.

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

### 4.7 Model Selection Strategy

Different agent types have different reasoning, latency, and cost requirements. ulw matches LLM models to agent roles using the strategy below.

#### 4.7.1 Model-to-Agent Mapping

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

#### 4.7.2 Cost Optimization Strategy

At 100+ developer scale, LLM costs are significant. ulw applies five optimization techniques:

**1. Model tiering.** High-cost models (Claude 4, GPT-4o) are reserved for agents that need them. PM-Steward and DP-Steward use GPT-4o-mini because their tasks are structured and low-complexity. This alone reduces total LLM cost by approximately 40% compared to using one model for all agents.

**2. Context window management.** The CG-Steward receives the full architecture spec (often 10k+ tokens) but caches repeated context (project conventions, coding standards) in a Redis-backed vector store. Only the diff of new information goes into each prompt.

**3. Speculative execution.** The TDD Test Agent (Claude 4 Haiku, $0.02/task) generates tests first. If the tests are rejected by the CG-Steward, the cheaper model absorbed the failed attempt rather than the expensive Claude 4.

**4. Batch review.** The CR-Steward batches review checks: style, security, architecture, and contract are analyzed in a single ACP session rather than four separate LLM calls. This reduces per-PR cost by sharing the diff context.

**5. Prompt compression.** All agent prompts strip unnecessary formatting, use concise instructions, and avoid chain-of-thought when deterministic logic suffices. Estimated 20-30% token savings versus verbose prompting.

#### 4.7.3 Estimated Monthly Cost (100-Developer Scale)

| Agent | Tasks/day | Cost/task | Daily cost | Monthly cost |
|-------|:---------:|:---------:|:----------:|:------------:|
| Orchestrator | 200 | $0.03 | $6.00 | $180 |
| Supervisor | 200 | $0.01 | $2.00 | $60 |
| AD-Steward | 40 | $0.08 | $3.20 | $96 |
| CG-Steward | 40 | $0.15 | $6.00 | $180 |
| CR-Steward | 80 | $0.10 | $8.00 | $240 |
| TA-Steward | 60 | $0.06 | $3.60 | $108 |
| PM-Steward | 100 | $0.01 | $1.00 | $30 |
| DP-Steward | 20 | $0.01 | $0.20 | $6 |
| Specialists | 120 | $0.03 avg | $3.60 | $108 |
| **Total** | | | **$33.60** | **$1,008** |

Estimated monthly LLM cost for a 100-developer team: **~$1,000-$1,500** (with buffer for retries and edge cases). This is roughly $10-15 per developer per month, well below the productivity gains from automated code generation and review.

#### 4.7.4 Failover and Fallback

If the primary model for an agent is unavailable or degraded:

| Primary | Fallback 1 | Fallback 2 |
|---------|-----------|------------|
| Claude 4 | GPT-4o | GPT-4o-mini (degraded quality, emergency only) |
| GPT-4o | Claude 4 | Claude 4 Haiku (degraded for complex tasks) |
| GPT-4o-mini | Claude 4 Haiku | — |
| Claude 4 Haiku | GPT-4o-mini | — |

Failover is handled by the Supervisor's model router, which monitors model health via the OpenCode runtime's model status endpoint and routes accordingly.

---

## 5. TDD Testing Framework Design

### 5.1 Test Pyramid Definition

ulw enforces a five-level test pyramid. Each level has a designated toolchain, coverage target, and execution context. The pyramid is not a suggestion: it is a gate. Code cannot promote between TDD phases without passing the relevant test level.

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

| Level | Scope | Tool | Execution Target | Coverage Gate |
|-------|-------|------|-----------------|---------------|
| **L0 Unit** | Single function/class, no I/O | Vitest (isolated `describe`/`it`) | Every `*.spec.ts` file | Branch >= 90% |
| **L1 Integration** | Module boundary, mocked external deps | Vitest + MSW (for HTTP mocking) | Per bounded context | Line >= 80% |
| **L2 Contract** | Inter-service API agreement | Pact (provider-driven contracts) + Supertest (HTTP assertions) | Per OpenAPI endpoint | 100% pact verification |
| **L3 Acceptance** | End-to-end user journey | Playwright (browser) + Supertest (API) | Per feature flag toggled scenario | 0 failed scenarios |
| **L4 Performance/Security** | Load, stress, vulnerability | k6 (performance), OWASP ZAP (security) | Weekly or pre-release | No regression >5% p95 latency |

**Key rules:**
- Every L0 test must be side-effect-free. No network, no filesystem, no clock dependency.
- L1 tests use Vitest's `vi.mock()` for module-level mocking. MSW handles outbound HTTP calls for the bounded context.
- L2 contracts are generated from OpenAPI specs by the Test Runtime. Pact verifications run against the provider's deployed staging instance.
- L3 tests use Playwright's `test` and `expect` with page object models. Each test maps to exactly one micro-spec (see 5.3).
- L4 tests are not required per-commit. They run on merge to staging and pre-release. Failure blocks the CI pipeline.

### 5.2 TDD State Machine

ulw's TDD flow is a deterministic state machine. Each micro-spec drives one traversal: RED → GREEN → REFACTOR → DONE. The state machine is the single source of truth for what an agent is allowed to do.

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

**State transition rules:**

1. **IDLE → RED**: A micro-spec is assigned from the backlog. A RED agent (test-only) is spawned with a context window containing only the micro-spec and the domain model. No implementation files are loaded.

2. **RED → GREEN**: The RED phase test must fail (compile or assertion failure). If the test passes unexpectedly, the state machine transitions to **RED_FAILURE** (an error state) and alerts the supervisor. The RED agent is never allowed to modify an existing passing test — the "never modify the test" rule is enforced at the tool level (see 5.4).

3. **GREEN → REFACTOR**: The implementation agent writes the minimum code to make the test pass. "Minimum" means no dead code, no speculative generalization, no comments. If the test suite passes, control transfers to the REFACTOR agent. If it fails, the GREEN agent retries up to 3 times before escalating.

4. **REFACTOR → DONE**: The REFACTOR agent cleans implementation code: renames variables, extracts helpers, removes duplication. It must NOT modify the test file. After each change, it re-runs the full L0 + L1 suite. If tests stay green, the state transitions to DONE. If any test fails, the REFACTOR agent reverts its last change and retries.

5. **DONE**: The micro-spec is archived. Coverage data is merged into the project's coverage map. The state machine returns to IDLE, ready for the next micro-spec.

**One test at a time constraint**: The state machine processes exactly one test per RED cycle. If a micro-spec implies multiple tests (e.g., multiple edge cases), each gets its own RED → GREEN → REFACTOR → DONE cycle. This prevents the "test avalanche" problem where agents write dozens of tests that all fail and overwhelm the implementation phase.

**Error states:**

| State | Trigger | Recovery |
|-------|---------|----------|
| `RED_FAILURE` | Test passes in RED | Escalate to supervisor; discard agent session |
| `GREEN_STALL` | 3 consecutive GREEN failures | Escalate to supervisor; lock micro-spec for human review |
| `REFACTOR_BREAK` | Test breaks during refactor | Revert last change; retry once; if still broken, escalate |
| `TIMEOUT` | Agent exceeds wall-clock limit | Kill agent; return to previous stable state |

### 5.3 Micro-Specs Pattern

A micro-spec is the atomic unit of work in ulw's TDD system. It codifies the principle: one behavior, one acceptance criterion, one test, one implementation. Micro-specs are written by the Tech Lead or Senior Developer and consumed by agents.

**Micro-spec template:**

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

**Traceability chain:**

```
DDD Domain Event (OrderSubmitted)
  └── Micro-Spec (spec-20260428-001)
        └── Test File (orders/cancel/cancel-pending-order.spec.ts)
              └── Implementation (orders/cancel/cancel-pending-order.ts)
                    └── Coverage Entry (coverage-map.json)
```

Each micro-spec maps to exactly one DDD domain event. The `domain-event` field in the spec header creates an immutable link between the behavioral requirement and the code that implements it. This traceability is enforced at the DONE phase: the coverage map records which domain events are covered by which tests, and the CI pipeline flags uncovered events.

**Given/When/Then and TypeScript:**

Tests generated from micro-specs follow a strict template:

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

Each `it()` block corresponds to exactly one acceptance criterion from the micro-spec. Boundary conditions get their own `it()` blocks. The `spec-id` in the `describe` string links back to the micro-spec for traceability.

### 5.4 Phase Isolation Strategy

Each TDD phase runs in its own subagent instance with an independent context window. The agents do not share memory, conversation history, or file handles. The only shared state is the git worktree on disk.

**Isolation architecture:**

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

**Context window isolation:**

| Phase | Context Loaded | Context Excluded |
|-------|---------------|------------------|
| RED | Micro-spec only, domain model interfaces, existing test patterns | All implementation files, production source, node_modules |
| GREEN | Micro-spec + test file, domain model implementation, type definitions | Other tests, unrelated modules, PR discussions |
| REFACTOR | Full implementation file, type definitions, test results (pass/fail only) | Micro-spec (to prevent test modification), RED reasoning |

**Hook-based gating:**

The isolation strategy relies on tool-level hooks. These are not conventions. They are enforced by the agent runtime.

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

The `never modify the test` rule is literal: any write attempt to a `*.spec.ts` or `*.test.ts` file outside the RED phase raises an immediate, non-silenceable `AgentGateError`. The agent cannot override, bypass, or ignore this hook. The supervisor logs the violation and terminates the agent session.

### 5.5 AI Agent Roles in TDD

Each TDD phase is staffed by a dedicated agent role with specific permissions, constraints, and success criteria.

| Role | Phase | Permissions | Constraints | Success Criterion |
|------|-------|-------------|-------------|-------------------|
| **RED Agent** | RED | Read: micro-spec, domain interfaces, test patterns. Write: `*.spec.ts`, `*.test.ts` only. Run: vitest (must see failure). | No implementation file access. No modification of existing passing tests. Must produce exactly 1 failing test per cycle. | One new test file written, `vitest run` exits non-zero. |
| **GREEN Agent** | GREEN | Read: micro-spec, test file, domain model. Write: `*.ts` (non-test). Run: vitest (must see pass). | No test file access (read or write). No speculative code. Maximum 3 retries. | `vitest run` exits 0. No uncovered lines in implementation. |
| **REFACTOR Agent** | REFACTOR | Read: full bounded context. Write: `*.ts` (non-test). Run: vitest (must stay green). | No test file access (read or write). No behavioral changes. Auto-revert on test failure. | `vitest run` exits 0 after refactor. Code quality score improves. |

**RED Agent prompt template (TypeScript-specific):**

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

**GREEN Agent prompt template:**

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

**REFACTOR Agent prompt template:**

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

Each agent session is stateless and ephemeral. When the phase completes, the agent context is discarded. There is no "memory" across phases. This prevents cross-phase contamination where an agent's reasoning about one phase leaks into another.

### 5.6 Quality Gate Thresholds

Before a TDD cycle transitions from DONE back to IDLE, the quality gate evaluates four metrics. All must pass.

| Metric | Threshold | Tool | Enforcement Point |
|--------|-----------|------|-------------------|
| **Line coverage** | >= 80% | `vitest --coverage` (via `@vitest/coverage-v8`) | DONE entry gate |
| **Branch coverage** | >= 90% | `vitest --coverage` (branch coverage report) | DONE entry gate |
| **Failing tests** | 0 | `vitest run --reporter=json` | All transitions (RED→GREEN, GREEN→REFACTOR, REFACTOR→DONE) |
| **Mutation score** | > 75% | Stryker Mutator (stryker run) | DONE entry gate (nightly for L0, per-PR for L1+) |

**Enforcement mechanism:**

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

If the quality gate fails, the micro-spec stays in DONE_PENDING state. The supervisor routes it back through the REFACTOR phase with the quality report. Test writing is never used to inflate coverage. The "one test at a time" rule prevents coverage gaming.

**Coverage merging:** Each micro-spec's coverage data is merged into a project-wide `coverage-map.json`:

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

The `uncoveredEvents` array is the primary feedback mechanism for the Tech Lead. It surfaces domain events that lack test coverage, driving new micro-spec creation.

### 5.7 TDD Hook Integration

Hooks are the enforcement layer of the TDD framework. They operate at three levels: tool invocation, git commit, and CI pipeline.

**PostToolUse hooks (agent runtime level):**

These hooks fire after every tool call by an agent. They are the innermost enforcement ring.

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

Key PostToolUse hooks:

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

**PreCommit hooks (git level):**

These hooks run on `git commit` within the agent's worktree. They enforce that the TDD cycle reached DONE before any code is committed.

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

**CI hooks (pipeline level):**

CI runs on every PR and every merge to main. It enforces coverage deltas and full contract verification.

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

**Hook hierarchy summary:**

| Hook Type | Location | Trigger | Action on Failure |
|-----------|----------|---------|-------------------|
| PostToolUse | Agent runtime (OpenCode) | Every agent tool call | Throw `AgentGateError`, terminate agent, log audit event |
| PreCommit | Git worktree `.git/hooks/pre-commit` | `git commit` | Reject commit, print reason, surface in agent logs |
| CI | GitHub Actions | PR open/sync, push to main | Block PR merge, annotate with coverage delta report |

The three-layer hook system ensures that no code enters the repository without going through the full TDD state machine. There is no bypass. Not for hotfixes, not for experiments, not for administrative overrides. If the hooks block you, the micro-spec is incomplete.

---

## 6. Automated Code Review Module

The Automated Code Review Module is the quality gate of the ulw platform. It replaces traditional human code review with a 6-agent parallel pipeline that runs on every pull request. The module is powered by **OpenClaw**, the review engine counterpart to OpenCode's development engine, deployed as a self-hosted Gateway on the same Kubernetes cluster.

### 6.1 OpenClaw Integration Architecture

OpenClaw integrates with the ulw platform through four distinct modes, each serving a different trigger scenario:

| Integration Mode | Trigger | Latency Target | Use Case |
|-----------------|---------|---------------|----------|
| **Webhook-Driven** | GitHub/GitLab PR webhook events | < 30s to start | Default mode for all code review requests |
| **Cron-Scheduled** | Internal scheduler via NATS cron triggers | N/A | Periodic whole-repository audit scans (nightly) |
| **ACP Sub-Sessions** | OpenCode ACP loop inline invocation | < 5s | Real-time review during AI code generation |
| **HTTP API** | REST endpoint exposed via Kong Ingress | < 1s response | Manual trigger from CI pipeline or CLI |

**Webhook-driven mode** is the primary integration path. When a developer opens or updates a pull request on GitHub, the platform's webhook receiver validates the payload signature, enriches it with repository context (bounded context mapping, review policy ID, branch protection rules), and enqueues a `ReviewJob` message on NATS JetStream. The OpenClaw Gateway consumer picks up the message and initiates the review pipeline.

**Cron-scheduled mode** runs a full repository scan on a configurable schedule (default: daily at 02:00 UTC). This catches issues that might have been merged outside the review pipeline (hotfixes, direct pushes bypassing branch protection) and generates a repository health report posted to a designated Slack channel.

**ACP sub-sessions** are unique to ulw's architecture. When an OpenCode development agent finishes writing code for a micro-spec, it can invoke OpenClaw inline before submitting the code to the file system. This creates a tight feedback loop that catches review issues at development time rather than PR time, reducing rework.

**HTTP API mode** exposes a RESTful interface at `POST /api/v1/reviews` for external tools to trigger reviews. This allows the existing CI pipeline (e.g., a GitHub Actions workflow step) to call into the review module without going through webhooks.

**Deployment Architecture**: OpenClaw runs as a self-hosted Gateway service on Kubernetes, deployed as a `Deployment` resource with horizontal autoscaling (HPA) based on queue depth. The Gateway is a lightweight HTTP server that maintains persistent connections to the agent pool and NATS JetStream for message consumption. It does not store state; all review state is held in PostgreSQL via the Supervisor component.

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
│                         │ Manager  │                              │
│                         └─────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Review Pipeline

The review pipeline consists of six specialized agents that run in a defined sequence. Each agent has a single responsibility, receives the full PR diff and relevant context, and produces structured findings.

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

#### Per-Agent Responsibilities

| Agent | Responsibility | Tools & Models | Output |
|-------|---------------|----------------|--------|
| **Analyzer** | Understands the PR scope: what files changed, which bounded contexts are touched, what dependencies are affected. Produces a PR summary used by all downstream agents. | OpenCode TypeScript SDK, AST-grep, diff parser | PR context map, affected modules list, dependency change report |
| **Code Quality** | Checks code style, formatting, naming conventions, complexity metrics, test coverage impacts. Enforces per-BC coding standards. | ESLint + Oxlint (via OpenClaw plugin), complex analysis (Cyclomatic Complexity, NPath) | Quality findings, lint violations, complexity warnings |
| **Security** | Scans for vulnerabilities, hardcoded secrets, injection risks, dependency vulnerabilities. Runs SAST and secret scanning. | Semgrep, Trivy, custom regex patterns, dependency audit | Security findings with CVSS scoring, severity classification |
| **Architecture** | Validates the change against DDD bounded context boundaries. Checks for unauthorized cross-context dependencies, layer violations, and architectural rule compliance. | Custom AST-grep rules per BC, module boundary analyzer, import graph validator | Architecture compliance findings, boundary violation reports |
| **Critic** | The AI reasoning agent. Analyzes the diff from a design and logic perspective: correctness, edge case handling, error handling completeness, race conditions. | LLM (GPT-4o / Claude) via OpenClaw LLM plugin, chain-of-thought prompting with PR context | Design-level findings, logic bugs, missing edge cases, improvement suggestions |
| **Policy** | Enforces the review policy for the bounded context. Validates that all mandatory checks passed, no critical findings are ignored, and approval criteria are met. | Policy engine (JSON/YAML rules engine), finding aggregator | Policy compliance verdict: PASS / FAIL / NEEDS_REVIEW |

Agent execution is sequential by default. The Analyzer always runs first because it produces context for everyone else. The remaining five agents can run in parallel once the Analyzer completes, but in practice the pipeline runs them sequentially to control rate limits on LLM API calls and keep the review deterministic for debugging.

### 6.3 Review Policy Framework

Each bounded context in the ulw platform defines its own review policy. Policies are written as YAML files stored in the repository under `.ulw/review-policies/<bounded-context-name>.yaml` and are version-controlled alongside the code.

#### Policy Schema

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

#### Severity Level Semantics

| Severity | Blocks Merge | SLA for Human Review | CI Status | Behavior |
|----------|-------------|---------------------|-----------|----------|
| **Critical** | Yes | 1 hour | FAILED | Pipeline stops immediately |
| **High** | Yes | 4 hours | FAILED | Pipeline completes but blocks merge |
| **Medium** | No | 24 hours | WARNING | Allowed with warning; Tech Lead must acknowledge |
| **Low** | No | 72 hours | PASSED | Advisory only |
| **Info** | No | N/A | PASSED | Informational only |

Policy files are loaded at pipeline runtime by the Policy Agent. Policies can reference shared rule libraries defined at the organization level (`.ulw/review-policies/_shared.yaml`) which all bounded contexts inherit. Context-specific rules override shared ones with higher specificity.

### 6.4 Review Execution Flow

The end-to-end review execution flow covers the journey from a developer opening a PR to the final verdict posted back to GitHub.

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

#### Key Design Decisions

**Per-file splitting for large diffs**: When a PR diff exceeds 400 lines, the pipeline splits the review into per-file batches. Each batch contains no more than 400 lines of diff. This keeps LLM context windows manageable and prevents attention decay in the Critic Agent. The Analyzer Agent still sees the full diff to produce a coherent PR summary; downstream agents operate on their assigned file batches.

**Parallel agent review**: Agents 2-5 (Code Quality, Security, Architecture, Critic) review different file batches in parallel. The Policy Agent is always last because it needs the complete set of findings to render a verdict. Parallelism is bounded by a configurable `maxConcurrency` setting (default: 4) to avoid overwhelming LLM API rate limits.

**CI status polling**: After posting PR comments, the module sets a pending CI check on the PR commit. The module then polls GitHub's combined status endpoint every 15 seconds until all required checks complete or a timeout (default: 30 minutes) is reached. The final CI status reflects the Policy Agent's verdict: FAILED for critical/high blocking issues, WARNING for medium, PASSED otherwise.

### 6.5 Findings Management

Every finding produced by the review pipeline follows a standardized schema for consistent processing, storage, and querying.

#### Finding Schema

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

#### Deduplication Strategy

Findings are deduplicated at two levels:

1. **Intra-review deduplication**: When parallel agents review overlapping files, they may produce duplicate findings. The aggregator computes a SHA-256 `fingerprint` from `(ruleId, file, lineStart, lineEnd, severity)` and collapses duplicates into a single finding, preserving the earliest agent as the source.

2. **Inter-review deduplication**: Findings from previous review runs are compared using the same fingerprint. If the same finding appears in the same file at the same location across consecutive PRs (indicating an unfixed issue), it is flagged as a "carried-over" finding and escalated in severity by one level. After three consecutive carry-overs, the finding is automatically promoted to a ticket in the human approval queue.

#### False Positive Tracking

Each finding includes a `status` field that starts as `open`. Developers can mark a finding as `false_positive` through a PR comment command (`/ulw-ignore <finding-id> <reason>`). The platform tracks false positive rates per agent and per rule:

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

Configuration in the policy file allows auto-downgrading rules with more than a 20% false positive rate: they are demoted one severity level until a human reviews and confirms the rule or fixes it. Per-BC `falsePositiveThresholds` can be set in the policy YAML.

#### Review Analytics Dashboard

The platform exposes a Grafana dashboard with the following panels:

| Panel | Metric | Source |
|-------|--------|--------|
| Review Volume | Reviews per hour, broken down by bounded context | PostgreSQL findings count |
| Pass/Fail Rate | Percentage of reviews passing policy vs. failing | PostgreSQL review verdicts |
| Mean Time to Review | Average wall-clock time from webhook to verdict | OpenTelemetry spans |
| Top Violations | Most common rule IDs by frequency | PostgreSQL ruleId aggregation |
| Agent Performance | Per-agent findings per review, false positive rate | PostgreSQL agent breakdown |
| Carried-Over Trend | Number of unfixed findings per week | PostgreSQL fingerprint matching |
| Human Review Queue | Open human review tickets by severity and SLA status | PostgreSQL + Slack integration |

### 6.6 Human Approval Integration

Not all findings can be resolved automatically. The platform defines a threshold system: findings at or above the configured severity level require human intervention before the PR can merge.

#### Threshold Configuration

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

#### Approval Workflow

When the Policy Agent determines human review is needed:

1. The pipeline posts a detailed review comment on the PR with all findings and a summary verdict: "This PR requires human review before merging."
2. The platform creates an approval ticket in the ulw dashboard, assigned to the Tech Lead of the affected bounded context(s).
3. A Slack notification is sent to the Tech Lead with a summary of the findings and a direct link to the approval page.
4. The GitHub CI status is set to "expected" state so the PR cannot be merged until the check passes.
5. A polling loop (every 60 seconds, timeout 48 hours) checks whether human approval has been granted.

The human approver (typically the Tech Lead for that bounded context) reviews the findings through the ulw dashboard:

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

#### Override and Dispute Mechanisms

Three types of human override are available:

| Override Type | Effect | Audit Trail |
|--------------|--------|-------------|
| **Acknowledge** | Confirms the finding is valid but accepts the risk. PR can proceed. | Logged with approver identity and timestamp; reported in monthly risk review |
| **Override Severity** | Changes the finding's severity (e.g., Critical to Medium). The finding remains visible but no longer blocks the PR. | Logged with override reason; severity delta tracked in analytics |
| **Dismiss (False Positive)** | Marks the finding as dismissed. The rule is added to a review queue for potential policy adjustment. | Logged with dismissal reason; triggers false positive analytics update |

Disputes follow a two-tier escalation path:
- **Tier 1 (Same BC)**: The developer who disagrees with a finding can comment `/ulw-dispute <finding-id> <reason>` on the PR. This re-routes the finding to a secondary LLM review (Critic Agent re-evaluates with the developer's counter-argument in context).
- **Tier 2 (Cross-BC)**: If Tier 1 does not resolve the dispute, the finding escalates to the Architecture Review Board (ARB), a group of senior Tech Leads from across bounded contexts. The ARB receives a weekly digest of escalated disputes and votes on them in a dedicated Slack workflow.

All human interactions produce immutable audit events stored in the ELK audit log for compliance and retrospective analysis.

---

## 7. API Auto-Testing Module

### 7.1 API Specification as Single Source of Truth

Every Bounded Context repository stores an **OpenAPI 3.1 specification** as its single source of truth for API behavior. The spec lives at `openapi.yaml` in the repository root and drives all downstream testing activity. No hand-written test plans. No stale Postman collections. The spec is the contract, and the spec is always right.

**Spec-first workflow:**

1. Developer (or AI agent) writes or updates `openapi.yaml` with full request/response schemas, validation rules, and security schemes
2. AI code generation agent reads the spec and produces server stubs, request/response types, and validation middleware
3. Generated code is validated against the spec at build time via Spectral linting and OpenAPI schema assertion
4. Any mismatch between code behavior and spec definition fails the build

**Schema enforcement rules:**

| Rule | Tool | Behavior |
|------|------|----------|
| Structural validity | `openapi-typescript` | Spec must parse to valid OpenAPI 3.1 AST |
| Style compliance | Spectral with custom ruleset | Naming conventions, operationId presence, response codes |
| Schema coverage | Custom assertion step | Every `$ref` resolves; every response has a schema |
| Breaking change detection | `openapi-diff` | PRs flagged if they introduce backward-incompatible changes |
| Code-spec alignment | AI agent validation | Generated server code matches spec paths and schemas |

**Breaking change policy:** Spec changes that break existing consumers in other BCs require a coordinated version bump. The Orchestrator automatically detects affected consumers from the context map (Section 3) and opens parallel PRs in downstream repositories.

### 7.2 AI-Driven Test Generation Pipeline

The test generation agent takes an OpenAPI spec as input and produces a complete test suite with no manual intervention. The pipeline runs as a directed acyclic graph of transformation steps.

**Pipeline flow:**

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

**Generation rules:**

| Input Feature | Generated Tests |
|---------------|-----------------|
| Path parameter `{id}` | Test with valid UUID, invalid UUID, missing param |
| Query parameter with `minimum`/`maximum` | Boundary tests at min, min-1, max, max+1 |
| Required body field | Missing field, null field, empty string, wrong type |
| Enum field | Each valid enum value + invalid value |
| `format: email` / `format: date-time` | Valid format, malformed format, XSS injection in string |
| Security scheme (Bearer) | No auth header, malformed token, valid token, expired token |
| `x-rate-limit` extension | Tests at limit-1, at limit, over limit |

### 7.3 Contract Testing Architecture

Contract testing ensures that service boundaries hold. ulw uses two complementary approaches.

**Consumer-driven contracts via Pact:**

Each BC publishes Pact contracts that define its expectations of downstream BCs. These contracts live alongside the consuming BC's tests and are verified by the providing BC's CI pipeline.

| Role | Action | Timing |
|------|--------|--------|
| Consumer BC | Writes Pact test during feature development | Before provider deploys |
| Consumer BC | Publishes contract to Pact Broker | On PR to consumer |
| Provider BC | Fetches pending contracts from Broker | Before provider deploys |
| Provider BC | Runs provider verification tests | In CI pipeline |
| Provider BC | Marks contract verified or breaks build | Gate 2 outcome |

**Inter-BC contract validation against context map:**

The context map (Section 3.4) defines which BCs interact. The Orchestrator cross-references each PR's changed endpoints against the context map and identifies:
- Which consumer BCs depend on the changed API
- Whether the change is backward compatible (via `openapi-diff`)
- Which contracts need re-verification

**Specmatic MCP as external guardrail:**

Specmatic runs as a Model Context Protocol (MCP) server integrated into the OpenCode agent runtime. It provides:

- **Contract generation from traffic**: Observes real API calls and generates OpenAPI specs from observed behavior, flagging spec-vs-reality gaps
- **Request/response validation**: Intercepts test traffic and validates it against the spec in real time
- **Contract comparison**: Compares the BC's published spec against what the running service actually returns

Specmatic is not a gating step. It runs as an advisory check that feeds into the test report dashboard (Section 7.7). If Specmatic detects a spec-reality gap, it escalates to the QA Engineer.

### 7.4 Test Scenario Catalog

Every endpoint in the OpenAPI spec generates a scenario matrix. The test generation agent produces scenarios across these categories:

| Category | What It Covers | Example |
|----------|---------------|---------|
| **Happy Path** | Valid request returns 2xx with correct response body | `POST /orders` with valid payload returns 201 + order object |
| **Edge Case** | Boundary values, empty collections, pagination limits | `GET /orders?page=1&size=0` returns validation error |
| **Error Response** | 4xx and 5xx codes defined in spec | Expired token returns 401 with `WWW-Authenticate` header |
| **Auth Scenarios** | All security scheme variants | No auth, bearer, API key, OAuth2 scope mismatch |
| **Rate Limiting** | `x-rate-limit` extension behavior | Request at limit returns 429 with `Retry-After` header |
| **Concurrency** | Race conditions and idempotency | Duplicate `POST` with idempotency key returns original 201 |
| **Data Validation** | Schema constraint violations | `maxLength` exceeded returns 422 with field-level errors |
| **State Transitions** | Workflow state machines in the API | `PATCH /orders/{id}/status` from `shipped` to `delivered` succeeds; from `delivered` to `cancelled` fails |

**Per-endpoint scenario matrix:**

The agent generates a markdown matrix in `tests/api/scenarios/<endpoint-path>.md` showing coverage:

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

### 7.5 Integration Test Environment

Tests that need more than a single BC run in ephemeral environments managed by Testcontainers and orchestrated by the pipeline.

**Environment types:**

| Environment | Provider | Lifespan | Use Case |
|-------------|----------|----------|----------|
| Unit + Contract | Testcontainers | Per-test-suite | Single BC with stub dependencies |
| Integration | Docker Compose | Per-PR | BC + real database + message broker |
| End-to-End | Kubernetes Job Namespace | Per-deploy | Multi-BC scenarios in isolated namespace |
| Performance | Dedicated k8s node pool | On-demand | Load tests, soak tests |

**Environment lifecycle management:**

1. **Provision**: Pipeline agent reads `docker-compose.yml` and `testcontainers-config.yml` from the BC repository
2. **Inject**: Environment variables for test configuration (DB URLs, queue names, mock endpoints)
3. **Execute**: Test suite runs against provisioned environment
4. **Collect**: Test results, coverage data, and logs pushed to MinIO
5. **Teardown**: Environment destroyed regardless of pass/fail status (configurable retention for failed tests)

**Mock service virtualization:**

External dependencies (third-party APIs, legacy systems) are virtualized via WireMock instances. The AI test generation agent produces WireMock stub mappings from OpenAPI specs of the external services:

- Stub responses derived from example values in the spec
- Delay simulation from `x-response-delay` extension
- Error injection from `x-error-scenarios` extension

### 7.6 Regression Test Selection

Full regression suites do not scale at 100+ developers across dozens of BCs. ulw uses change impact analysis to select only the tests that matter.

**Impact analysis flow:**

1. PR targets files in BC repository
2. Agent maps changed files to affected API endpoints (via import graph and route registration)
3. Agent cross-references changed endpoints against the context map to find downstream consumers
4. Agent selects test sets:
   - **Direct tests**: All scenarios for the changed endpoint
   - **Consumer contract tests**: Contracts from downstream BCs that consume the changed endpoint
   - **Integration tests**: Cross-BC scenarios that exercise the changed endpoint
   - **Dependency tests**: Tests for shared libraries that were modified

**Selection matrix:**

| Change Type | Tests Selected | Selection Basis |
|-------------|---------------|-----------------|
| OpenAPI spec change | All generated tests for changed paths + all consumer contracts | Spec is the source of truth; any change affects all consumers |
| Route handler logic | Direct endpoint tests + consumer contracts | Only changed handler's tests |
| Shared library (domain model) | All BCs that import the library | Dependency graph analysis |
| Database schema migration | Integration tests for all affected endpoints | Schema change affects persistence layer |
| Configuration only | No tests (config validation only) | No behavioral change |
| New endpoint | Full scenario matrix for the new endpoint | First-time test generation |

**Intelligent test prioritization:**

The test runtime orders selected tests by risk score:

```
risk_score = (consumer_count × 0.4) + (change_frequency × 0.3) + (historical_failure_rate × 0.3)
```

Tests with the highest risk score run first. If the high-risk tests pass, confidence in the remaining tests is high and the pipeline continues. If they fail, the pipeline fails fast and reports the failure context to the developer.

### 7.7 Test Reporting & Analytics

All test results flow into a centralized reporting pipeline that feeds the observability stack.

**Coverage per API endpoint:**

Each endpoint's coverage is tracked as a percentage of generated scenarios that pass:

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

**Contract compliance dashboard:**

A Grafana dashboard shows the health of every inter-BC contract:

| Metric | Source | Refresh |
|--------|--------|---------|
| Contracts pending verification | Pact Broker API | Per-pipeline-run |
| Contracts verified / broken | Pact verification results | Per-pipeline-run |
| Spec-reality gap count | Specmatic MCP | Per-deploy |
| Breaking change attempts | `openapi-diff` output | Per-PR |

**Flaky test detection:**

The test analytics agent tracks test outcomes across runs and flags flaky tests:

- A test is marked **flaky** if it passes and fails on the same commit across 3+ runs
- Flaky tests are quarantined to a separate `--flaky` suite and excluded from the main gate
- The QA Engineer gets a weekly report of quarantined tests with failure patterns

**Trend analysis:**

Per-endpoint and per-BC trend charts tracked over time:

- Pass rate trajectory (target: >99.5%)
- Test suite execution time (alert if >2x baseline)
- Scenario coverage growth rate
- Contract verification age (time since last verification per consumer-provider pair)

All metrics feed into Prometheus as custom metrics (`ulw_test_*`) and are queryable via Grafana.

---

## 8. CI/CD Pipeline Design

### 8.1 Pipeline Philosophy

ulw's CI/CD pipeline treats **AI agents as first-class pipeline steps**, not as external scripts bolted onto a traditional Jenkinsfile. Every step is either an agent producing an artifact or a human reviewing and approving. The pipeline is defined entirely in TypeScript (using Pulumi and a custom pipeline SDK) and runs on Kubernetes-native job runners.

**Core principles:**

1. **Agent produces, human approves**: Agents generate artifacts (code, tests, configs). Humans review at defined gates. No agent pushes to production without human sign-off.
2. **Pipeline-as-code in TypeScript**: Pipeline definitions are TypeScript modules with full type safety, testable in isolation, and versioned alongside the application code.
3. **DAG-based execution**: Stages run in a directed acyclic graph. Parallel where possible, sequential where dependencies exist.
4. **Idempotent by design**: Every pipeline run is deterministic. Re-running the same commit produces the same result. Side effects (deployments, state changes) are tracked and idempotent.
5. **Observable agents**: Every agent action in the pipeline logs decision rationale, confidence scores, and consumed context windows to the audit store.

**Pipeline DSL example:**

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

### 8.2 Five-Gate Quality Pipeline

Every PR that touches a BC repository passes through five quality gates. Gates 1-4 are fully automated. Gate 5 requires human sign-off.

**Pipeline overview:**

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

**Gate bypass rules:**

| Bypass Scenario | Gate | Approver | Justification Required |
|----------------|------|----------|----------------------|
| Documentation-only change | All 5 | Auto-bypass | Detected by path filter |
| Known-good dependency bump (patch) | Gate 4 | SRE Lead | Must include SCA report |
| Emergency hotfix (production outage) | Gate 5 | On-call Lead | Post-incident review required |
| AI-generated code from spec (deterministic) | Gate 1 (style only) | Tech Lead | Only style review skipped |

**Escalation paths:**

If a gate fails and the developer disagrees with the result:
1. Developer adds `@ulw:override-gate<N>` to the PR description with rationale
2. The Orchestrator routes the override request to the next-level approver (Tech Lead → Engineering Manager)
3. The override is logged in the audit trail with the approver's identity and justification
4. Override rate is tracked per approver; >5% override rate triggers a review of the gate's ruleset

### 8.3 Stage Definitions

**Gate 1: AI Review**

| Property | Value |
|----------|-------|
| Entry Criteria | PR opened against main branch; changed files pass path filter |
| Agents | OpenClaw Review Agent team (6 agents: style, arch, security, test, quality, Oracle) |
| Execution | Parallel execution across 6 agents; each produces a review report |
| Success Criteria | All agents return `pass` or `pass_with_minor`; no `fail` or `escalate` |
| Exit Signal | Review report artifact pushed to MinIO; webhook sent to Orchestrator |
| Failure Handling | Agent failures are retried once. Persistent failure: mark PR as `review-failed` with agent output attached |

```bash
# Equivalent CLI invocation (for reference):
openclaw review --pr=$PR_NUMBER --repo=$REPO --agents=style,arch,security,test,quality,oracle --output=minio://reviews/$PR_ID/
```

**Gate 2: Contract Validation**

| Property | Value |
|----------|-------|
| Entry Criteria | Gate 1 passed; Pact Broker has pending contracts for this BC |
| Agents | Pact verifier agent, openapi-diff agent, Specmatic MCP agent |
| Execution | Pact verification runs first. If it passes, openapi-diff runs. Specmatic runs in parallel as advisory |
| Success Criteria | Pending contracts marked verified; no breaking changes detected |
| Exit Signal | Contract verification report pushed to MinIO; Pact Broker status updated |
| Failure Handling | Contract break: block merge, notify downstream BC owners via Slack. False positive: use bypass rule |

```bash
# Equivalent:
pact-provider-verifier --broker-url=$PACT_BROKER --provider=$BC_NAME --publish-verification-results
openapi-diff --from=$BASE_SHA --to=$HEAD_SHA --spec=openapi.yaml --format=markdown
```

**Gate 3: Test Suite**

| Property | Value |
|----------|-------|
| Entry Criteria | Gate 2 passed; test containers image built |
| Agents | Test runner agent (Vitest), coverage collector agent |
| Execution | Regression-selected tests in order: unit → integration → contract → E2E |
| Success Criteria | All selected tests pass; line coverage >80%; branch coverage >70%; no flaky tests detected in this run |
| Exit Signal | Test report (JUnit XML) + coverage report (lcov) pushed to MinIO |
| Failure Handling | Failed test: pipeline stops, returns full test output with failure context (request, response, assertion). Developer gets Slack notification with direct link |

```bash
# Equivalent:
vitest run --config=vitest.pipeline.config.ts --reporter=junit --outputFile=reports/test-results.xml
vitest run --coverage --config=vitest.coverage.config.ts
```

**Gate 4: Security Scan**

| Property | Value |
|----------|-------|
| Entry Criteria | Gate 3 passed; compiled/built artifacts available |
| Agents | SCA agent, SAST agent, secret scanner agent, container scanner agent |
| Execution | Parallel: npm audit → Semgrep → truffleHog → Trivy (image); DAST runs optionally if API is deployable |
| Success Criteria | Zero critical or high severity vulnerabilities; no secrets detected; no exposed credentials |
| Exit Signal | Security report (SARIF format) pushed to MinIO; GitHub Security Tab updated |
| Failure Handling | Critical vuln: block merge, notify SRE team. Low/medium: non-blocking warning, create Jira ticket for fix |

```bash
# Equivalent:
semgrep --config=auto --sarif --output=reports/semgrep.sarif
trivy image --severity=CRITICAL,HIGH --format=sarif --output=reports/trivy.sarif $IMAGE_TAG
trufflehog filesystem --directory=. --json > reports/secrets.json
```

**Gate 5: Human Approval**

| Property | Value |
|----------|-------|
| Entry Criteria | Gates 1-4 all pass; aggregated report available in PR |
| Agents | None (human step) |
| Execution | PR review by Tech Lead or Senior Developer. Aggregated report shows per-gate summary with expandable details |
| Success Criteria | PR approved with at least one approving review |
| Exit Signal | GitHub PR merged to main; webhook triggers deployment pipeline |
| Failure Handling | Changes requested: developer iterates, pipeline re-runs from Gate 1 (or from Gate 3 if review was purely human judgment call) |

### 8.4 Deployment Strategies

ulw supports three deployment strategies selected per service type. The decision is encoded in the BC's `pipeline.yml`.

**Decision matrix:**

| Service Type | Strategy | Rationale |
|-------------|----------|-----------|
| Public API Gateway | Blue-Green | Zero-downtime, instant rollback via DNS swap |
| Internal gRPC service | Rolling Update | Lower resource overhead, graceful shutdown via health checks |
| User-facing web UI | Canary | Progressive exposure to real traffic, metrics-based promotion |
| Event consumer (worker) | Rolling Update | No user-facing impact, queue-based draining |
| Critical data service | Blue-Green | Maximum safety, requires DB migration coordination |

**Blue-Green deployment:**

1. Deploy new version (Green) alongside current (Blue)
2. Run smoke tests against Green
3. Gate 3 (test suite) re-runs against Green with production data volume
4. Switch load balancer from Blue to Green
5. Keep Blue running for 15 minutes (cooldown period)
6. If rollback triggered within cooldown: switch back to Blue
7. After cooldown: destroy Blue

**Canary deployment with progressive rollout:**

```
Stage 1: Deploy 1 pod (10% traffic) → Wait 2 minutes → Evaluate metrics
Stage 2: Scale to 25% traffic → Wait 3 minutes → Evaluate metrics
Stage 3: Scale to 50% traffic → Wait 3 minutes → Evaluate metrics
Stage 4: Scale to 100% → Wait 5 minutes → Mark deployment complete
```

Each evaluation checks:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate (HTTP 5xx) | >0.5% increase from baseline | Rollback to previous stage |
| Latency p95 | >200ms increase from baseline | Rollback to previous stage |
| CPU utilization | >80% average across pods | Hold at current stage, scale up |
| Memory utilization | >85% average across pods | Hold at current stage, scale up |
| Business metric variance | >5% drop in conversion (if applicable) | Rollback to previous stage |

**Rolling update:**

Standard Kubernetes rolling update with `maxSurge=1`, `maxUnavailable=0` for zero-downtime. Health check grace period set to 30 seconds.

### 8.5 Auto-Rollback Mechanism

When a canary or full deployment exhibits degraded behavior, the auto-rollback mechanism returns the service to the previous healthy version within 2 minutes.

**Rollback trigger flow:**

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

**Rollback SLA breakdown:**

| Phase | Target | Measured By |
|-------|--------|-------------|
| Alert detection | < 10 seconds | Prometheus AlertManager latency |
| Decision evaluation | < 5 seconds | Rollback trigger agent execution time |
| Kubernetes rollout undo | < 60 seconds | `kubectl rollout status` |
| Health validation | < 30 seconds | Health check endpoint poll |
| Notification | < 5 seconds | Slack/PagerDuty API call |
| **Total** | **< 110 seconds** | End-to-end from alert to healthy |

**Rollback safety rules:**

- Maximum 1 auto-rollback in 30 minutes per BC. If a second rollback is needed, the deployment is blocked and an SRE Lead must manually investigate.
- Rollback is not triggered during scheduled maintenance windows (read from the ulw calendar integration).
- Rollback preserves all audit logs and metric data from the failed deployment for post-mortem analysis.

### 8.6 Environment Promotion

Code flows through four environments on its path to production. Each environment has promotion criteria that must be met before the pipeline advances.

**Promotion flow:**

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

**Promotion criteria per environment:**

| Environment | Trigger | Gates Required | Tests Required | Approval |
|-------------|---------|---------------|----------------|----------|
| Dev | Merge to main | Gates 1-4 | Unit + contract | Auto (no human) |
| Staging | Manual via Slack button | Gates 1-5 (re-run) | Full suite + integration | Tech Lead |
| Canary | Staging green for 1 hour | Gates 3-4 (re-run) | Smoke + E2E | Auto |
| Production | Canary green for 15 min | None (already passed) | Smoke + metrics | Engineering Manager |

**Configuration management per environment:**

Environment-specific configuration is stored in Pulumi stack files alongside the pipeline definition:

```
pipeline/
├── Pulumi.dev.yaml
├── Pulumi.staging.yaml
├── Pulumi.canary.yaml
├── Pulumi.prod.yaml
└── index.ts          # Shared pipeline logic
```

Each stack file contains:
- Database connection strings (via Vault references, never plaintext)
- Feature flag overrides
- Resource limits and replica counts
- External service endpoints
- Log levels and observability settings

The promotion agent automatically merges the stack configuration when promoting, ensuring that the correct config is applied to each environment and that no environment-specific secrets leak into adjacent environments.

### 8.7 Pipeline Observability

Every pipeline stage emits structured metrics to Prometheus. All stage results, agent decisions, and timing data are queryable in Grafana.

**Per-stage metrics:**

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `ulw_pipeline_duration_seconds` | Histogram | `gate`, `stage`, `bc`, `status` | Execution time per gate/stage |
| `ulw_pipeline_pass_rate` | Gauge | `gate`, `bc` | Pass rate over rolling 7 days |
| `ulw_gate_failure_reason` | Counter | `gate`, `bc`, `reason` | Distribution of failure reasons per gate |
| `ulw_agent_duration_seconds` | Histogram | `agent`, `gate`, `bc` | Per-agent execution time |
| `ulw_agent_confidence` | Gauge | `agent`, `gate` | Agent confidence score for decisions |
| `ulw_test_execution_seconds` | Histogram | `bc`, `test_type` | Test suite execution time |
| `ulw_deploy_duration_seconds` | Histogram | `bc`, `strategy`, `env` | Deployment duration |
| `ulw_rollback_count` | Counter | `bc`, `env`, `reason` | Rollback event count |
| `ulw_promotion_lag_seconds` | Gauge | `bc`, `from_env`, `to_env` | Time between promotion readiness and actual promotion |

**DORA metrics dashboard:**

| DORA Metric | ulw Measurement | Data Source | Target |
|-------------|----------------|-------------|--------|
| Deployment Frequency | Deploys to production per week | `ulw_deploy_duration_seconds` count | Daily or more |
| Lead Time for Changes | Time from PR merge to production deploy | `ulw_promotion_lag_seconds` | < 1 hour |
| Change Failure Rate | % of deployments causing degraded service | `ulw_rollback_count` / total deploys | < 5% |
| Time to Restore Service | Time from alert to healthy rollback | Rollback SLA phases sum | < 30 minutes |

**Pipeline bottleneck analysis:**

The Observability Agent analyzes pipeline metrics weekly and generates a report identifying:

- **Slowest gates**: Gates where p95 duration exceeds target. Suggests parallelization or agent optimization.
- **Failure hotspots**: Endpoints or BCs with the highest per-gate failure rates. Recommends spec review or test refactoring.
- **Agent drift**: Agents whose confidence scores decline over time. Flags potential model degradation or context window issues.
- **Promotion bottlenecks**: BCs with long promotion lag. Identifies whether the bottleneck is human approval latency, test execution time, or infrastructure provisioning.

The bottleneck report is posted to the #platform-eng Slack channel every Monday. Gates that consistently exceed their duration target are flagged for the next sprint's platform backlog.

---

## 9. Technology Stack

This section documents the complete technology stack for the ulw platform, organized by layer. Each technology includes the rationale for its selection, not just its name.

### 9.1 Core Platform Stack

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **TypeScript** | 5.7+ | Primary programming language | Type safety at scale. With 100+ developers and 50+ bounded contexts, TypeScript's structural type system catches integration errors at compile time. The growing agent ecosystem (OpenCode, OpenClaw SDKs) is TypeScript-native. |
| **Node.js** | 22+ (LTS) | Runtime environment | Long-term support guarantees, stable V8 engine, native ESM support since Node 22. The async I/O model suits ulw's event-driven architecture with NATS and webhook processing. |
| **NestJS** | 10.x | Backend framework | Opinionated architecture with built-in support for modules (maps to bounded contexts), interceptors (for cross-cutting concerns like tracing), and GraphQL/REST controllers. Its dependency injection system makes testing individual agents feasible. |
| **pnpm** | 9.x | Package manager | Disk-efficient monorepo management with strict dependency isolation. pnpm's workspace protocol (`"@ulw/*": "workspace:*"`) prevents accidental cross-package version drift. 3x faster installs than npm in CI. |
| **tRPC** | 11.x | Type-safe internal API | Eliminates the API contract gap between frontend and backend, and between the Orchestrator and agent runtimes. Full end-to-end type safety means no manual API client generation. Used for all internal synchronous RPC between ulw components. |

**Why NestJS over alternatives**: NestJS provides the most mature module system for DDD-aligned backend architecture in the TypeScript ecosystem. Each bounded context maps to a NestJS module with its own controllers, services, and providers. Express (too unopinionated for 100+ devs) and Fastify (too minimal) lack the structural conventions that NestJS enforces. The `@nestjs/bull` and `@nestjs/microservices` packages integrate directly with NATS and Redis, reducing boilerplate.

**Why tRPC over gRPC**: For inter-service communication within the Kubernetes cluster, tRPC provides equivalent type safety to gRPC without the protobuf compilation step. Protobuf was evaluated but rejected because (a) every schema change requires a regeneration step that slows iteration, (b) the TypeScript agent SDK ecosystem does not have first-class protobuf support, and (c) for internal RPC at Kubernetes cluster scale (< 1000 req/s), tRPC's JSON serialization overhead is negligible. gRPC is still used at the API Gateway layer for external client integration where polyglot clients exist.

### 9.2 Agent Runtimes

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **OpenCode** | Latest (self-hosted) | AI code generation engine | Purpose-built for agentic code development with TDD enforcement, git worktree isolation, and multi-agent orchestration. The native TypeScript SDK allows direct integration with ulw's Orchestrator without a network boundary for synchronous operations. |
| **OpenClaw Gateway** | Latest (self-hosted) | AI code review engine | Designed as the review counterpart to OpenCode. Handles the 6-agent review pipeline, LLM interaction management, and webhook processing. Deployed as a self-hosted Gateway on Kubernetes for data sovereignty (source code never leaves the cluster for LLM inference). |
| **Vitest** | 3.x | Test runtime | Replaces Jest as the test runtime for all unit and integration tests. Native ESM support, TypeScript-first (no Babel transform needed), and watch-mode that is 10x faster than Jest for large monorepos. The `@vitest/runner` API allows programmatic test execution from the Test Runtime agent. |
| **Kubernetes Client** | `@kubernetes/client-node` 1.x | Deploy runtime | Official Kubernetes client for TypeScript. Used by the Deploy Runtime agent to manage deployments, services, canary rollouts, and rollbacks programmatically without shelling out to `kubectl`. |

**OpenCode deployment model**: The OpenCode runtime runs as a Kubernetes Job per development task. Each Job gets its own ephemeral PVC-backed workspace with a fresh git worktree, isolated Node.js process, and a dedicated LLM API connection. The Job lifecycle is managed by the Orchestrator: created on task assignment, monitored via health checks, and cleaned up 30 minutes after completion.

**OpenClaw deployment model**: OpenClaw runs as a long-lived Deployment (not a Job) because it maintains persistent connections to the NATS JetStream consumer and the agent pool. Horizontal Pod Autoscaling scales the number of Gateway replicas based on the NATS queue depth. Each Gateway replica manages a configurable number of concurrent review agents (default: 4 per replica).

**Test Runtime architecture**: The Test Runtime is a thin wrapper around Vitest's programmatic API. It receives a test specification (which test files to run, what environment to use, what coverage thresholds to enforce), executes the tests inside a sandboxed Node.js process, and returns structured results (pass/fail counts, coverage percentages, failure details). It does not generate tests itself (that is the TDD Module's responsibility); it only executes them.

### 9.3 Data Infrastructure

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **PostgreSQL** | 16+ | Primary database | Mature relational database with excellent TypeScript support via Drizzle ORM. PostgreSQL 16 brings performance improvements for parallel query execution and logical replication. Used for all domain state, agent state, review findings, and workflow history. |
| **Drizzle ORM** | 0.40.x | Database ORM | TypeScript-first ORM that generates full type definitions from schema declarations. Unlike Prisma, Drizzle does not require a code generation step (no `prisma generate`), which keeps the CI pipeline lean. Its SQL-like query syntax gives developers full control over query performance. Row-level security policies in PostgreSQL are compatible with Drizzle's raw query support. |
| **Redis** | 7+ | Caching + session store | In-memory data structure store used for three purposes: (a) caching frequently accessed data (policy files, bounded context mappings) with sub-millisecond latency, (b) storing OpenClaw review session state for the ACP sub-session integration mode, (c) distributed locking for agent job coordination. Redis 7 adds sharded pub/sub which improves NATS offload for ephemeral messages. |
| **NATS JetStream** | 2.10+ | Event streaming | Lightweight, high-throughput message broker designed for cloud-native environments. Chosen over Kafka because (a) NATS is 10x easier to operate on Kubernetes (single binary, no ZooKeeper dependency), (b) JetStream provides exactly-once delivery guarantees for review job queues, (c) the TypeScript NATS client (`nats.js`) is first-class and maintained by the NATS team. NATS handles all async communication: review job queues, workflow state transitions, domain events, and CI/CD pipeline events. |
| **MinIO** | Latest | Object storage | S3-compatible object storage for Kubernetes. Stores review artifacts (full PR snapshots, agent output logs, test reports, deployment manifests). Chosen over cloud-specific S3 because (a) it runs inside the cluster with no egress costs, (b) it provides an S3-compatible API so the same TypeScript SDK (`@aws-sdk/client-s3`) works for local and cloud deployments, (c) erasure coding provides data durability without replication overhead. |

**Data flow architecture**:

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

### 9.4 Testing & Quality

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **Vitest** | 3.x | Unit + integration test runner | As noted in 9.2, Vitest is the single test runner for all TypeScript code. Its compatibility with the Jest API means zero migration cost for existing Jest users, while providing better performance and ESM support. The `@vitest/coverage-istanbul` plugin provides Istanbul coverage reporting. |
| **Playwright** | 1.50+ | E2E + browser testing | Industry standard for browser automation. Used by the Test Runtime for end-to-end tests against deployed services and for visual regression testing of the ulw dashboard UI. The TypeScript-first API and trace viewer make debugging CI failures productive. |
| **Pact** | 4.x | Contract testing | Consumer-driven contract testing for HTTP and message-based integrations. Each bounded context publishes Pact contracts for its APIs, and downstream contexts verify against those contracts in CI. This prevents the "broken integration" scenario where a change in one BC silently breaks another. |
| **Supertest** | 7.x | HTTP assertion testing | Pairs with NestJS's `@nestjs/testing` for controller-level integration tests. Provides a fluent API for making HTTP assertions against NestJS application instances without spinning up a server. |
| **ESLint + Oxlint** | ESLint 9.x, Oxlint 0.15+ | Static analysis | ESLint remains the primary linter for TypeScript-specific rules (naming conventions, type safety). Oxlint (by the oxc project) runs alongside ESLint as a faster Rust-based linter for general code quality rules. Oxlint covers the rules that ESLint is slow at (import ordering, unused variables) while ESLint handles TypeScript-specific rules that Oxlint does not yet support. |
| **Semgrep** | 1.80+ | SAST (static analysis) | Pattern-based static analysis that understands code structure, not just text. Unlike ESLint (which operates on AST), Semgrep rules can express multi-file patterns and data flow across functions. Used by the Security Agent for custom security rules tailored to each bounded context. |
| **Trivy** | 0.60+ | Vulnerability scanning | Scans container images, dependency manifests, and IaC files for known vulnerabilities (CVEs). Integrated into the CI pipeline as a gate before container image promotion. Chosen over Snyk because it is open source, runs fully offline, and integrates with the existing GitHub container registry workflow. |
| **SonarQube** | 10.x | Quality metrics | Provides a historical view of code quality trends: technical debt ratio, code coverage, duplications, and maintainability index. Used by the Code Quality Agent as a data source for trend-based findings (e.g., "this PR increases the technical debt ratio by 2%"). Self-hosted on the same Kubernetes cluster for data privacy. |

### 9.5 CI/CD & Infrastructure

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **GitHub Actions** | N/A | CI/CD trigger | Already the CI provider for most repositories in the organization. ulw integrates with GitHub Actions by receiving workflow run events via webhook and posting CI status checks. Actions are the trigger layer only; the actual CI/CD logic runs inside ulw's Deploy Runtime on Kubernetes. |
| **Pulumi** | 3.x + TypeScript SDK | Infrastructure-as-Code | Declarative infrastructure management with TypeScript. Chosen over Terraform because (a) infrastructure is defined in the same language as the application, reducing context switching, (b) Pulumi's `StackReference` pattern allows dev/staging/production infrastructure composability, (c) the `@pulumi/kubernetes` package provides first-class Kubernetes resource management without YAML templating. |
| **Kubernetes** | 1.32+ | Container orchestration | The target deployment platform. Version 1.32 brings production-ready support for sidecar containers (useful for the OpenClaw Gateway's NATS consumer sidecar) and improved Job API reliability (critical for OpenCode task execution). |
| **Helm** | 3.17+ | Package management | Used to package ulw components into reusable charts. Each bounded context's microservice has its own Helm chart with environment-specific `values.yaml` overrides. The OpenClaw Gateway, PostgreSQL, Redis, NATS, and MinIO each have their own charts. |
| **ArgoCD** | 2.14+ | GitOps deployment | Pull-based deployment controller that synchronizes the Kubernetes cluster state with the Git repository. When a Helm chart change is merged to the `infrastructure` branch, ArgoCD detects the drift and applies the change. Chosen over Flux because of its mature Web UI, SSO integration with Keycloak, and the ApplicationSet controller for managing multi-environment deployments declaratively. |

**GitOps workflow**:

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

### 9.6 Observability

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **OpenTelemetry** | SDK 0.200+ (JS), Collector 0.110+ | Distributed tracing | Industry standard for observability instrumentation. Every agent action, every workflow step, every database query emits traces. The OpenTelemetry Collector runs as a DaemonSet on each Kubernetes node, receiving traces via OTLP and forwarding them to Tempo for storage. |
| **Prometheus** | 3.x | Metrics collection | De facto standard for Kubernetes metrics. Each ulw component exposes a `/metrics` endpoint with custom metrics (review duration, findings count per agent, queue depth, pipeline pass/fail rate). Prometheus Operator manages scrape configurations via ServiceMonitor CRDs. |
| **Grafana** | 11.x | Visualization | Unified dashboard platform for metrics and traces. The review analytics dashboard (described in Section 6.5) is built in Grafana. Alerting rules run in Grafana and route to Slack or PagerDuty based on severity. |
| **ELK Stack** (Elasticsearch, Logstash, Kibana) | 8.x | Audit logging + log aggregation | All platform audit events (human approvals, policy overrides, agent actions) are sent to Elasticsearch via Filebeat. Kibana dashboards provide compliance reporting and incident investigation. Chosen over Loki because the audit use case requires full-text search on structured JSON events and long retention periods (2 years for audit compliance). |
| **Sentry** | 2.x (SDK) | Error tracking | Application-level error monitoring for the NestJS backend and agent runtimes. Captures unhandled exceptions, performance bottlenecks, and transaction traces. Integrated with Slack for real-time error notifications. Chosen over Datadog APM because (a) Sentry is self-hostable on Kubernetes, (b) its per-transaction pricing is more predictable for the agent-heavy workload (100+ reviews per day), (c) the TypeScript SDK provides source map upload for debuggable error stacks. |

**Observability data flow**:

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

### 9.7 Security

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| **HashiCorp Vault** | 1.18+ | Secrets management | Centralized secrets storage with dynamic secret generation. Every Kubernetes Pod gets a Vault sidecar that injects secrets (database credentials, API keys, GitHub tokens) as environment variables or files. Vault's Kubernetes auth method allows pods to authenticate using their service account token, eliminating static credentials entirely. |
| **Keycloak** | 26.x | SSO / RBAC | Open-source identity and access management. Provides single sign-on for the ulw dashboard, ArgoCD, Grafana, and Kibana via OIDC. Role-based access control maps to bounded contexts: a developer in the IdentityAccess BC cannot trigger deployments for the Payment BC. Keycloak runs on the same Kubernetes cluster with a replicated PostgreSQL backend. |
| **mTLS** | Kubernetes NetworkPolicy + Istio | Service-to-service encryption | Mutual TLS between all ulw components. Istio's sidecar proxy handles mTLS transparently so application code does not need to manage certificates. All inter-service traffic is encrypted and authenticated at the transport layer, preventing unauthorized service impersonation. |
| **OPA / Gatekeeper** | OPA 1.x, Gatekeeper 3.18+ | Policy enforcement | Admission controller that validates all Kubernetes resources against organizational policies before they are created. Used to enforce: (a) all Deployments must have resource limits, (b) all containers must come from the internal registry, (c) no Privileged pods outside the `ulw-system` namespace, (d) all Ingress hosts must be in the allowed domain list. Policies are authored in Rego and stored in a Git repository. |

**Security architecture summary**:

| Layer | Mechanism | What It Protects |
|-------|-----------|-----------------|
| **Network** | mTLS (Istio) + NetworkPolicies | All inter-service communication |
| **Authentication** | Keycloak OIDC + Vault K8s auth | User login, pod identity, API access |
| **Authorization** | Keycloak RBAC + OPA policies | Per-BC access control, resource constraints |
| **Secrets** | HashiCorp Vault | Database creds, API keys, tokens |
| **Supply Chain** | Trivy scan + container signing | Image vulnerabilities, tampering |
| **Audit** | ELK + OpenTelemetry | Immutable action log for compliance |

### 9.8 Version Matrix

This table captures the exact versions and upgrade policy for every technology in the stack.

| Layer | Technology | Current Version | Minimum Version | Upgrade Policy |
|-------|-----------|----------------|-----------------|---------------|
| **Core Language** | TypeScript | 5.7 | 5.4 | Pin major; upgrade minor within 30 days of release |
| **Runtime** | Node.js | 22 LTS | 20 LTS | Follow LTS schedule; upgrade to new LTS within 90 days |
| **Backend Framework** | NestJS | 10.4 | 10.0 | Pin major; upgrade patch immediately |
| **Package Manager** | pnpm | 9.15 | 9.0 | Pin major; upgrade minor within 30 days |
| **Internal API** | tRPC | 11.6 | 11.0 | Pin major; upgrade minor within 14 days |
| **Database** | PostgreSQL | 16.4 | 16.0 | Follow PostgreSQL version policy; each major version tested for 60 days before production upgrade |
| **ORM** | Drizzle ORM | 0.40.0 | 0.38.0 | Pin minor; upgrade patch immediately |
| **Cache** | Redis | 7.4 | 7.0 | Follow Redis version policy; upgrade minor within 30 days |
| **Event Bus** | NATS JetStream | 2.10.24 | 2.10.0 | Pin minor; upgrade patch immediately |
| **Object Storage** | MinIO | RELEASE.2025-04 | RELEASE.2025-01 | Follow MinIO releases; upgrade monthly |
| **Test Runner** | Vitest | 3.1 | 3.0 | Pin major; upgrade minor within 14 days |
| **E2E Testing** | Playwright | 1.52 | 1.50 | Upgrade monthly (browser binaries auto-update) |
| **Contract Testing** | Pact | 4.8 | 4.5 | Pin major; upgrade minor within 30 days |
| **Static Analysis** | ESLint | 9.24 | 9.0 | Pin major; upgrade minor within 30 days |
| **Static Analysis** | Oxlint | 0.15 | 0.12 | Upgrade monthly (pre-release channel) |
| **SAST** | Semgrep | 1.82 | 1.80 | Upgrade weekly (rule updates are bundled) |
| **Vulnerability Scan** | Trivy | 0.61 | 0.58 | Upgrade weekly (CVE database updates) |
| **Quality Metrics** | SonarQube | 10.8 | 10.6 | Pin major; upgrade minor within 60 days |
| **CI Trigger** | GitHub Actions | N/A (hosted) | N/A | Immutable; pin action versions by SHA, not tag |
| **IaC** | Pulumi | 3.148 | 3.140 | Pin minor; upgrade patch within 7 days |
| **Orchestration** | Kubernetes | 1.32 | 1.30 | Follow upstream; upgrade minor within 60 days of release |
| **Package Manager** | Helm | 3.17 | 3.16 | Pin major; upgrade minor within 30 days |
| **GitOps** | ArgoCD | 2.14 | 2.12 | Pin major; upgrade minor within 30 days |
| **Tracing** | OpenTelemetry JS SDK | 0.200 | 0.190 | Upgrade monthly (pre-GA API may change) |
| **Metrics** | Prometheus | 3.2 | 3.0 | Pin major; upgrade minor within 30 days |
| **Visualization** | Grafana | 11.5 | 11.0 | Pin major; upgrade minor within 14 days |
| **Audit Logging** | Elasticsearch | 8.17 | 8.15 | Pin major; upgrade minor within 30 days |
| **Error Tracking** | Sentry | 2.22 (SDK) | 2.18 | Upgrade monthly |
| **Secrets** | HashiCorp Vault | 1.18 | 1.16 | Pin major; upgrade minor within 30 days |
| **SSO/RBAC** | Keycloak | 26.1 | 26.0 | Pin major; upgrade minor within 14 days |
| **Service Mesh** | Istio | 1.25 | 1.23 | Follow Istio release cadence; upgrade minor within 60 days |
| **Policy Engine** | OPA/Gatekeeper | 3.18 | 3.16 | Pin major; upgrade minor within 30 days |

#### Upgrade Policy Notes

- **Patch upgrades** (e.g., 1.0.0 to 1.0.1): Applied automatically by Renovate bot with auto-merge after CI passes. No human review required unless CI fails.
- **Minor upgrades** (e.g., 1.0 to 1.1): Applied by Renovate bot as separate PRs. Require review by the platform team and must be merged within the window specified in the table above.
- **Major upgrades** (e.g., 1.x to 2.x): Planned as engineering projects with migration guides, testing windows, and rollback plans. No automatic PRs. The platform team schedules major upgrades during planned maintenance windows.
- **Kubernetes version upgrades**: Follow the `n-2` support policy. The cluster must never be more than 2 minor versions behind the latest stable release. Upgrades are tested in dev and staging for 2 weeks before production.
- **Security patches**: Applied within 24 hours regardless of version. Renovate's `vulnerabilityAlerts` configuration triggers immediate PRs for any dependency with a known CVE at severity HIGH or above.

---

## 10. Data Flow & Integration

### 10.1 End-to-End Data Flow Scenarios

The following diagrams document the four primary data flows through the ulw platform. Each flow traces data from trigger through transformation, persistence, and handoff.

**10.1.1 Feature Development Flow**

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

Data transformations:
- User spec (YAML/JSON) -> normalized work items (structured rows)
- Work items -> agent prompt context (resolved dependencies)
- Agent output -> git commits (file diffs persisted to repo)
- Commit hash -> project status update (PostgreSQL)

Persistence points:
- Project record: PostgreSQL `projects` table
- Work items + DAG edges: PostgreSQL `work_items`, `workflow_edges` tables
- Agent session state: PostgreSQL `agent_sessions` table
- Code artifacts: MinIO `code-artifacts` bucket (snapshots per commit)

Handoff mechanisms:
- Orchestrator -> OpenCode: NATS `agent.task.execute` subject
- OpenCode -> Orchestrator: NATS `agent.task.completed` subject
- OpenCode -> Git: `git push` via SSH deploy key

**10.1.2 Code Review Flow**

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

Data transformations:
- GitHub webhook JSON -> normalized review job (PR metadata + diff refs)
- PR diff (git patch format) -> per-agent review input (parsed AST, dependency graph)
- Agent findings -> structured review results (severity, file, line, message)
- 6 agent results -> aggregated report (PASS/CONDITIONAL_PASS/FAIL)

Persistence points:
- Review job: PostgreSQL `review_jobs` table
- Per-agent findings: PostgreSQL `review_findings` table
- Review report: MinIO `review-reports` bucket (full markdown + JSON)
- PR status check: GitHub API (external)

Handoff mechanisms:
- GitHub -> OpenClaw: HTTP webhook POST `/webhook/github`
- OpenClaw -> Agent sub-tasks: NATS `review.agent.execute` subject
- Agent -> OpenClaw: NATS `review.agent.result` subject
- OpenClaw -> GitHub: REST API `POST /repos/{owner}/{repo}/statuses/{sha}`

**10.1.3 CI/CD Pipeline Flow**

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

Data transformations:
- Git push event -> pipeline execution plan (DAG of 5 gates)
- Gate output (test results, scan reports) -> gate pass/fail decision
- All gates passed -> deployment manifest (Helm values, image tag)
- Canary health metrics -> rollout percentage or rollback signal

Persistence points:
- Pipeline execution: PostgreSQL `pipeline_runs` table
- Gate results: PostgreSQL `gate_results` table
- Build artifacts: MinIO `build-artifacts` bucket
- Deployment history: PostgreSQL `deployments` table
- Pipeline events: NATS JetStream `pipeline.>` stream

Handoff mechanisms:
- GitHub -> Pipeline Engine: NATS `git.push.main` subject (from webhook proxy)
- Pipeline -> NATS: `pipeline.gate.{n}.{pass/fail}` subjects
- Pipeline -> ArgoCD: REST API `POST /api/v1/applications/{app}/sync`
- Pipeline -> Slack: NATS `notify.slack.{channel}` subject

**10.1.4 Inter-Agent Communication Flow**

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

Communication patterns:
- **Request-Reply** (NATS): Orchestrator publishes task, agent responds with result
- **Pub-Sub** (NATS): Pipeline events fan out to observers (Slack, Grafana, audit log)
- **Stream** (NATS JetStream): Domain events are persisted for replay and event sourcing
- **Side-Effect** (MinIO): Large artifacts are written to object store; messages carry URIs only

Message envelope:
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

### 10.2 Domain Event Catalog

Every bounded context emits domain events through NATS JetStream. Events are the backbone of asynchronous communication and audit.

**10.2.1 Event Schema Format**

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

**10.2.2 Event Catalog by Bounded Context**

| Context | Event Type | Schema Version | Payload Summary | Publisher | Consumers |
|---------|-----------|----------------|-----------------|-----------|-----------|
| Project | `project.created` | v1 | `{ projectId, name, ownerId, specUri, createdAt }` | Orchestrator | Supervisor, Audit |
| Project | `project.spec.defined` | v1 | `{ projectId, specVersion, boundedContexts[], dddDecisions[] }` | Orchestrator | OpenCode, Supervisor |
| Project | `project.spec.updated` | v1 | `{ projectId, specVersion, changes[] }` | Orchestrator | OpenCode, OpenClaw |
| Project | `project.archived` | v1 | `{ projectId, archivedBy, reason }` | Orchestrator | Audit, MinIO |
| Code | `code.generation.started` | v1 | `{ taskId, projectId, workItemId, agentId, timestamp }` | OpenCode | Orchestrator, Audit |
| Code | `code.generated` | v1 | `{ taskId, commitHash, filesChanged[], branchName, diffStats }` | OpenCode | Orchestrator, OpenClaw |
| Code | `code.generation.failed` | v1 | `{ taskId, errorCode, errorMessage, retryCount }` | OpenCode | Orchestrator, Supervisor |
| Review | `review.started` | v1 | `{ reviewId, prNumber, repoFullName, sha, agentIds[] }` | OpenClaw | Orchestrator, Audit |
| Review | `review.agent.completed` | v1 | `{ reviewId, agentType, findingCount, verdict }` | OpenClaw Agent | OpenClaw Aggregator |
| Review | `review.completed` | v1 | `{ reviewId, overallVerdict, findingCount, reportUri }` | OpenClaw | Orchestrator, GitHub |
| Review | `review.findings.exceeded` | v1 | `{ reviewId, threshold, actualCount, escalationLevel }` | OpenClaw | Supervisor, Slack |
| Testing | `tests.generation.started` | v1 | `{ testSuiteId, apiSpecUri, targetCount, coverageTarget }` | Test Runtime | Orchestrator |
| Testing | `tests.generated` | v1 | `{ testSuiteId, testCount, testFilePaths[], coverageEstimate }` | Test Runtime | Orchestrator, OpenCode |
| Testing | `tests.executed` | v1 | `{ testRunId, passed, failed, skipped, coverage, durationMs }` | Test Runtime | Pipeline Engine, Audit |
| Testing | `tests.passed` | v1 | `{ testRunId, coverage, threshold, durationMs }` | Test Runtime | Pipeline Engine |
| Testing | `tests.failed` | v1 | `{ testRunId, failures[]{ testName, message, stackTrace } }` | Test Runtime | Pipeline Engine, Slack |
| CI/CD | `pipeline.started` | v1 | `{ pipelineId, projectId, commitSha, branch, gates[] }` | Pipeline Engine | Orchestrator, Audit |
| CI/CD | `pipeline.gate.passed` | v1 | `{ pipelineId, gateName, gateNumber, durationMs, evidenceUri }` | Pipeline Engine | NATS Stream |
| CI/CD | `pipeline.gate.failed` | v1 | `{ pipelineId, gateName, gateNumber, failureReason, artifactsUri }` | Pipeline Engine | Slack, Supervisor |
| CI/CD | `deployment.triggered` | v1 | `{ deploymentId, environment, imageTag, rolloutStrategy, canaryPercent }` | Pipeline Engine | Deploy Runtime |
| CI/CD | `deployment.health.ok` | v1 | `{ deploymentId, environment, metrics{ errorRate, latency, cpu }, observationWindow }` | Deploy Runtime | Pipeline Engine |
| CI/CD | `deployment.rollback` | v1 | `{ deploymentId, environment, reason, previousVersion, autoRollback }` | Deploy Runtime | Pipeline Engine, Slack |
| CI/CD | `release.completed` | v1 | `{ releaseId, projectId, version, changelogUri, artifacts[]{ name, uri, checksum } }` | Pipeline Engine | Orchestrator, Audit, Slack |
| Security | `secret.detected` | v1 | `{ scanId, filePath, lineNumber, secretType, severity, recommendation }` | OpenClaw | Supervisor, Slack |
| Security | `policy.violation` | v1 | `{ violationId, policyName, resource, action, agentId, enforced }` | OPA Sidecar | Supervisor, Audit |
| Governance | `audit.trail.flushed` | v1 | `{ batchSize, fromTimestamp, toTimestamp, hashChainAnchor }` | Audit Service | Cold Storage |

**10.2.3 Event Versioning Strategy**

- **Schema evolution**: Backward-compatible additions only (new optional fields). Breaking changes create a new event type version: `project.created.v2`.
- **Version in type**: `{aggregate}.{action}.v{version}` -- e.g., `project.created.v1`.
- **Migration**: NATS JetStream consumers declare `max_version` in subscription. An event bridge transforms old-version events to current-version for consumers that require it.
- **Retirement**: Event versions older than 6 months are migrated via replay to current schema during maintenance windows.

---

### 10.3 Integration Protocol Specifications

**10.3.1 OpenClaw Webhook Payload Schema**

Received at `POST /webhook/github` and `POST /webhook/gitlab`.

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

Provider normalization rules:
- GitHub `pull_request` -> `pullRequest` (camelCase conversion)
- GitLab `merge_request` -> `pullRequest` (field mapping)
- GitLab system notes -> `issue_comment.created` with `type: "system"`

**10.3.2 OpenCode Serve API Contracts**

Base URL: `https://ulw.internal:8443/api/v1`

| Endpoint | Method | Auth | Request | Response | Purpose |
|----------|--------|------|---------|----------|---------|
| `/projects` | POST | JWT + RBAC | `{ name, specYaml, ownerId }` | `{ projectId, status, workItemCount }` | Create project |
| `/projects/{id}` | GET | JWT + RBAC | -- | `{ id, name, status, workItems[], createdAt }` | Get project state |
| `/projects/{id}/work-items` | POST | JWT + RBAC | `{ title, description, acceptanceCriteria, dependsOn[] }` | `{ workItemId, position }` | Add work item |
| `/projects/{id}/execute` | POST | JWT + RBAC | `{ workItemId, agentConfig{ model, temperature, maxTokens } }` | `{ taskId, agentPodName }` | Trigger agent execution |
| `/tasks/{id}` | GET | JWT + RBAC | -- | `{ taskId, status, agentLogs[], artifacts[] }` | Poll task status |
| `/tasks/{id}/cancel` | POST | JWT + RBAC | -- | `{ taskId, cancelledAt }` | Cancel running task |
| `/reviews/{reviewId}` | GET | JWT + RBAC | -- | `{ reviewId, verdict, findings[], reportUri }` | Get review result |
| `/reviews/{reviewId}/findings` | GET | JWT + RBAC | `?severity=error&file=src/*` | `{ findings[]{ file, line, message, severity, ruleId } }` | Filtered findings |
| `/pipelines/{pipelineId}` | GET | JWT + RBAC | -- | `{ pipelineId, status, gates[]{ name, status, duration }, deploymentId }` | Pipeline status |
| `/audit/events` | GET | JWT + Admin | `?from&to&types[]&aggregateId` | `{ events[]{ eventId, eventType, occurredAt, data } }` | Query audit trail |
| `/health` | GET | None | -- | `{ status, version, uptime, dependencies[]{ name, status, latencyMs } }` | Health check |

Response envelope:
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

**10.3.3 Git Webhook Event Mappings**

| Git Event | ulw Subscriber | Primary Action | NATS Subject |
|-----------|---------------|----------------|--------------|
| `push` (branch:main) | Pipeline Engine | Trigger CI/CD pipeline | `git.push.main` |
| `push` (branch:feature/*) | OpenCode | (Reserved for auto-sync) | `git.push.feature` |
| `pull_request.opened` | OpenClaw | Start review pipeline | `git.pr.opened` |
| `pull_request.synchronize` | OpenClaw | Re-run review pipeline | `git.pr.synchronize` |
| `pull_request.reopened` | OpenClaw | Re-run review pipeline | `git.pr.reopened` |
| `pull_request.closed` | OpenClaw | Archive review data | `git.pr.closed` |
| `pull_request.merged` | Pipeline Engine | Trigger post-merge pipeline | `git.pr.merged` |
| `issue_comment.created` | OpenClaw | Process `/ulw-retry` commands | `git.comment.created` |
| `push` (tag:v*) | Pipeline Engine | Trigger release pipeline | `git.tag.created` |

**10.3.4 NATS Subject Hierarchy**

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

Subject naming conventions:
- Dot-separated hierarchy with `ulw.` global prefix
- Wildcards: `ulw.pipeline.gate.*.passed` (single level), `ulw.pipeline.>` (multi-level)
- Subjects are created dynamically; no pre-registration required
- NATS JetStream streams mapped to second-level prefixes: `stream: ulw-agent`, `stream: ulw-pipeline`

**10.3.5 Message Envelope Format**

Every NATS message carries a standardized envelope for tracing and reliability.

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

### 10.4 Data Persistence Strategy

Each data type is mapped to the storage system that best matches its access patterns, consistency requirements, and lifecycle.

| Data Category | Storage System | Justification | Backup Strategy |
|--------------|---------------|---------------|----------------|
| **Domain Entities** (projects, work items, agents, deployments) | PostgreSQL | ACID compliance for transactional consistency; relational queries for cross-entity reports | WAL streaming to replica; daily pg_dump to MinIO cold storage |
| **Agent State** (session state machine, task progress, lock ownership) | PostgreSQL | Atomic state transitions with transactional guarantees; row-level locking prevents concurrent modification conflicts | Continuous WAL archiving |
| **Workflow DAGs** (pipeline definitions, task dependencies, execution order) | PostgreSQL | Graph traversal queries (recursive CTEs) for dependency resolution; transactional updates for DAG mutation | Included in domain entity backup |
| **Session Cache** (user sessions, auth tokens, OAuth state) | Redis (Cluster) | Sub-millisecond read latency; automatic key expiry with TTL; atomic operations for token rotation | Redis RDB snapshots every 5 minutes |
| **Rate Limiting** (API rate counters, burst windows) | Redis | INCR + EXPIRE atomicity for sliding window counters; minimal memory footprint per counter | Not backed up (ephemeral) |
| **Distributed Locks** (agent worktree locks, deployment mutexes) | Redis (Redlock) | TTL-based deadlock recovery; lock semantics via SET NX EX; multi-node consensus | Not backed up (ephemeral) |
| **Code Artifacts** (generated code snapshots, build outputs, releases) | MinIO | Scalable object storage; S3-compatible API; versioning for artifact lineage; lifecycle policies for tiering | Cross-region replication; versioning enabled |
| **Test Reports** (coverage XML, test logs, performance benchmarks) | MinIO | Structured + unstructured report blobs; direct HTTP access from CI tooling | Lifecycle to Glacier after 90 days |
| **Review Findings** (review reports, diff annotations, agent output) | MinIO | Large blob storage for review artifacts; presigned URLs for GitHub status API integration | Included in artifact backup |
| **Event Source Log** (domain events, state transitions, audit trail) | NATS JetStream | Ordered, replayable event streams; exactly-once delivery semantics; retention-based cleanup | JetStream consumer snapshots to MinIO cold storage |
| **Audit Log** (immutable agent action trail) | NATS JetStream + PostgreSQL | Stream for write-optimized ingestion; PostgreSQL for indexed query access; hash chain stored in PostgreSQL | Daily flush to MinIO cold storage with hash verification |
| **Configuration** (agent SKILL.md, OPA policies, pipeline definitions) | PostgreSQL + MinIO | Schema for versioned config; MinIO for large policy files | Included in domain entity backup |

**Storage sizing estimates** (at 100+ developer scale):

| Store | Estimated Volume | Growth Rate | Retention |
|-------|-----------------|-------------|-----------|
| PostgreSQL | 500 GB domain data + 200 GB audit | ~50 GB/month | Indefinite (hot) |
| Redis | 10 GB cache + 2 GB locks/sessions | ~2 GB/month | Ephemeral + TTL |
| MinIO | 5 TB artifacts + 1 TB reports | ~500 GB/month | 90 days hot -> cold |
| NATS JetStream | 200 GB event stream | ~100 GB/month | 30 days stream -> archival |

---

### 10.5 State Management

**10.5.1 Agent Session State Machine**

Each agent session transitions through a deterministic state machine stored in PostgreSQL.

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

Transition rules:
- `IDLE -> PLANNING`: Orchestrator assigns work item to agent
- `PLANNING -> EXECUTING`: Agent produces execution plan and acquires worktree lock
- `EXECUTING -> AWAITING_REVIEW`: Agent completes code output; TDD compliance check passes
- `AWAITING_REVIEW -> COMPLETED`: Human or auto-approval received
- `AWAITING_REVIEW -> FAILED`: Review identified critical issues requiring re-execution
- `Any -> CANCELLED`: User or supervisor cancels the task
- `Any -> TIMEOUT`: Session TTL exceeded without terminal state transition
- `FAILED -> PLANNING`: Retry count < max retries; exponential backoff applied

**10.5.2 Workflow DAG State**

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

State transition logic:
- `PENDING -> IN_PROGRESS`: All dependencies COMPLETED; node picked up by worker
- `PENDING -> BLOCKED`: Any dependency FAILED or SKIPPED; auto-advance if skip-on-fail policy
- `IN_PROGRESS -> COMPLETED`: Task finishes successfully
- `IN_PROGRESS -> FAILED`: Task error or timeout (retry triggered if attempts remain)
- `FAILED -> IN_PROGRESS`: Retry attempt started
- `Any -> SKIPPED`: Conditional gate evaluated false; upstream failure with skip policy

**10.5.3 TDD Phase State**

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

Enforcement via tool gating:
- **RED phase**: Only `.test.ts` file writes allowed; production file writes rejected
- **GREEN phase**: Test file reads allowed; production file writes allowed; writing to test file only if test was previously read
- **REFACTOR phase**: Both files readable; only production file writable; linter must pass
- **DONE**: Both files locked; only the commit tool can persist to git

---

### 10.6 Data Retention & Archival

**10.6.1 Retention Policies**

| Data Type | Hot Storage | Warm Storage | Cold Storage | Deletion | Rationale |
|-----------|-------------|--------------|--------------|----------|-----------|
| Project metadata | Indefinite | -- | -- | -- | Core business data |
| Work items / DAGs | Indefinite | -- | -- | -- | Audit and traceability |
| Agent sessions | 90 days | 1 year | 3 years | After 3 years | Debugging + compliance |
| Code artifacts | 90 days | 1 year | 3 years | After 3 years | Release traceability |
| Build artifacts | 30 days | 90 days | 1 year | After 1 year | Storage cost optimization |
| Test reports | 90 days | 1 year | 3 years | After 3 years | Regression analysis |
| Review findings | 90 days | 1 year | 3 years | After 3 years | Quality trend analysis |
| Domain events | 30 days (stream) | 1 year (archive) | 3 years | After 3 years | Event sourcing replay |
| Audit trail | 90 days (hot) | 1 year | 7 years | After 7 years | Regulatory compliance |
| Rate limiting counters | TTL-based (minutes) | -- | -- | Ephemeral | No persistence needed |
| Session cache | TTL-based (hours) | -- | -- | Ephemeral | Regenerated on login |

**10.6.2 Archival Process**

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

Archival mechanisms:
- **PostgreSQL -> Cold**: `pg_dump` with `--data-only --exclude-table=ephemeral*` -> compressed -> MinIO cold bucket with S3 Glacier Deep Archive lifecycle
- **NATS JetStream -> Cold**: Consumer replay to Parquet files via `nats-tail` -> partitioned by event type + date -> compressed -> cold storage
- **MinIO -> Cold**: S3 lifecycle policy transitions objects from standard to Glacier after 90 days; objects older than 1 year transition to Glacier Deep Archive
- **Audit data -> Cold**: Separate pipeline ensures audit logs are flushed to cold storage within 24 hours of reaching retention limit; hash chain anchor published to PostgreSQL for integrity verification

**10.6.3 GDPR Compliance for Audit Logs**

- **Right to erasure**: Audit logs containing personal data (user IDs, IP addresses) are anonymized after 90 days via a scheduled job that hashes the `userId` field with a secret salt and zeroes the `sourceIp` field.
- **Data export**: A `/audit/export` API returns all events related to a given `userId` within a date range, formatted as JSON Lines.
- **Retention limit enforcement**: Audit data is permanently deleted after 7 years. A cron job partitions deletion by month and executes `DELETE FROM audit_events WHERE occurred_at < NOW() - INTERVAL '7 years'` in batches of 10,000 rows.
- **Data minimization**: Audit events store only `userId` (not full name or email). PII is derived at query time from Keycloak token introspection.

---

## 11. Implementation Roadmap

### 11.1 Overview

The ulw platform is delivered in five phases over 24 weeks. Each phase produces a deployable, demonstrable increment. Phases are sequenced by dependency: foundation before execution, execution before automation, automation before hardening.

```
Phase 0 (4w)     Phase 1 (6w)       Phase 2 (6w)       Phase 3 (4w)      Phase 4 (4w)
Foundation   →   Core Agent Loop →  Review & Test  →  CI/CD Pipeline →  Hardening
                 └─ Dev Preview ──┘  └─ QA Preview ─┘  └─ Ops Preview ─┘  └── GA ──┘
```

**Team sizing assumption**: 8 engineers (4 backend, 2 full-stack, 2 DevOps). Parallelizable tasks are called out per phase.

### 11.2 Phase 0: Foundation (Weeks 1-4)

**Goal**: Establish the project skeleton, DDD stubs, agent identity templates, and OpenCode integration. All engineers can write code against the platform by the end of Phase 0.

| Week | Milestone | Deliverables | Owner |
|------|-----------|-------------|-------|
| 1 | Repository & DevOps Boot | Monorepo structure (pnpm workspace), ESLint + Prettier + Oxlint config, Vitest setup, Docker Compose for local dev, CI pipeline (lint + build + test on PR) | DevOps + Backend |
| 1-2 | DDD Domain Stubs | TypeScript package per bounded context with Drizzle schema, entity interfaces, value object classes, aggregate root base class, domain event base class, repository interfaces | Backend (x2 parallel) |
| 2-3 | Agent Identity Templates | SOUL.md / AGENTS.md / TOOLS.md templates for all agent types, Skill system bootstrapping (TDD, code-review, contract-validation skills as SKILL.md files), Agent configuration schema (Zod validation) | Backend + Full-stack |
| 3-4 | OpenCode Integration | OpenCode `serve` HTTP API client wrapper, Agent session lifecycle manager (create, prompt, poll, collect), OpenCode GitHub Action template, Agent worktree manager (git worktree create/remove per agent task) | Backend (x2 parallel) |
| 3-4 | OpenClaw Initial Setup | Self-hosted OpenClaw Gateway deployment on K8s, Webhook receiver configuration, Basic code-review skill (linter output only), GitHub PR webhook integration test | DevOps |
| 4 | Phase 0 Demo | End-to-end walkthrough: create BC stub → agent generates code via OpenCode → basic lint-based review via OpenClaw → result in PR comment | All |

**Phase 0 exit criteria**:
- [ ] Monorepo builds and tests pass on every PR
- [ ] All 6 bounded context packages have Drizzle schemas with migrations
- [ ] SOUL.md / AGENTS.md / TOOLS.md templates for all 11 agent types exist
- [ ] OpenCode serve integration can create sessions, send prompts, and collect results
- [ ] OpenClaw Gateway serves a basic code-review skill triggered by GitHub webhook
- [ ] Agent worktree manager creates and cleans up isolated git worktrees

### 11.3 Phase 1: Core Agent Loop (Weeks 5-10)

**Goal**: The Orchestrator, Supervisor, and Steward agents are operational. A feature spec entered by a developer results in AI-generated code with TDD guardrails enforced.

| Week | Milestone | Deliverables | Owner |
|------|-----------|-------------|-------|
| 5-6 | Orchestrator Engine | Intent parser (NLP → structured task spec), Task decomposer (feature → micro-spec DAG), Agent router (task → bounded context → steward assignment), Orchestrator HTTP API | Backend (x2) |
| 5-7 | Supervisor Engine | Workflow DAG executor (topological sort, parallel fan-out), State persistence (PostgreSQL), Retry manager (exponential backoff with jitter, max 3 retries), Heartbeat monitor (agent timeout detection) | Backend (x2) |
| 7-8 | Steward Agent Runtime | Base Steward Agent class with lifecycle hooks (onTaskReceived, onTaskComplete, onTaskFail), Per-BC agent instances (6 stewards), Agent-to-agent messaging via NATS, Blackboard state sharing via Redis | Backend (x3 parallel) |
| 8-9 | TDD State Machine | RED/GREEN/REFACTOR phase enforcement, File-write gating (hook-based), PostToolUse test runner (auto-run vitest after every file write), PreCommit gate (block if not in DONE phase) | Full-stack (x2) |
| 9-10 | Integration & Demo | Orchestrator receives feature request → decomposes into DAG → Supervisor dispatches to Steward → Steward runs TDD cycle → Code generated with passing tests | All |
| 10 | Phase 1 Demo | Feature: "Add user registration endpoint" → agent generates tests → agent generates code → all tests pass → code committed to branch | All |

**Phase 1 exit criteria**:
- [ ] Orchestrator decomposes a natural language feature request into 3+ micro-specs
- [ ] Supervisor executes a 5-node DAG with 2 parallel branches successfully
- [ ] Steward agents for all 6 BCs respond to task assignments via NATS
- [ ] TDD state machine enforces RED → GREEN → REFACTOR with file-write gating
- [ ] Generated code passes Vitest suite with ≥ 80% coverage
- [ ] Agent session audit trail logged to PostgreSQL

### 11.4 Phase 2: Review & Test Automation (Weeks 11-16)

**Goal**: OpenClaw 6-agent review pipeline is operational. API tests are auto-generated from OpenAPI specs. Contract testing validates inter-BC communication.

| Week | Milestone | Deliverables | Owner |
|------|-----------|-------------|-------|
| 11-12 | Code Review Pipeline | 6-agent pipeline (Analyzer → CodeQuality → Security → Architecture → Critic → Policy), Per-BC review policy YAML files, Findings aggregation with deduplication, PR comment renderer | Backend (x2) |
| 12-13 | Review Execution Automation | GitHub webhook → PR diff extraction → per-file splitting >400 lines → parallel agent dispatch → CI status polling → combined review report, Severity-based auto-approval (Info/Low auto-merge, Medium+ requires human) | Backend + DevOps |
| 13-14 | API Test Generation | OpenAPI 3.1 parser (generate happy-path, negative, auth scenarios), Request builder generator (TypeScript + Supertest), Test fixture factory generator, Integration test runner | Full-stack (x2 parallel) |
| 14-15 | Contract Testing | Pact consumer-driven contract test generation, Provider verification pipeline, Inter-BC contract validation against context map, Specmatic MCP integration for guardrail validation | Backend (x2) |
| 15-16 | Integration & Demo | End-to-end: PR opened → 6-agent review → findings posted → API tests auto-generated → contract tests run → all gates green | All |
| 16 | Phase 2 Demo | Full review + test pipeline on a real multi-BC feature PR | All |

**Phase 2 exit criteria**:
- [ ] 6-agent review pipeline runs on every PR in < 3 minutes
- [ ] False positive rate < 15% (measured over 50+ reviews)
- [ ] API test generation covers 100% of endpoints defined in OpenAPI spec (happy path)
- [ ] Contract tests pass for all upstream/downstream BC pairs defined in context map
- [ ] Review findings dashboard operational in Grafana

### 11.5 Phase 3: CI/CD Pipeline (Weeks 17-20)

**Goal**: The 5-Gate pipeline is fully operational. Deployments are canary-based with auto-rollback. The platform is running in a staging environment.

| Week | Milestone | Deliverables | Owner |
|------|-----------|-------------|-------|
| 17 | Pipeline Executor | Pipeline-as-code engine (TypeScript DSL → DAG), Git webhook → pipeline trigger, Per-gate job scheduling (Kubernetes Jobs), Gate result aggregation and reporting | Backend + DevOps |
| 17-18 | Five Gates Implementation | Gate 1 (AI Review): runs OpenClaw pipeline, Gate 2 (Contract): runs Pact + Specmatic, Gate 3 (Test Suite): runs Vitest + Playwright + k6, Gate 4 (Security): runs Semgrep + Trivy + Gitleaks + OWASP ZAP, Gate 5 (Human Approval): Slack notification + approval button | Devops (x2 parallel per gate pair) |
| 18-19 | Deployment Engine | Blue-Green deployment strategy, Canary deployment with progressive rollout (10%→25%→50%→100%), Auto-rollback on Prometheus alert, K8s client integration | DevOps (x2) |
| 19 | Observability Stack | OpenTelemetry instrumentation on all services, Prometheus metrics exporters (agent task duration, pipeline stage duration, review latency), Grafana dashboards (DORA metrics, review pipeline health, test coverage trends), ELK audit log pipeline | DevOps (x2) |
| 20 | Staging Environment | Full ulw platform deployed to staging K8s cluster, Integration test suite (end-to-end feature development flow), Performance baseline (target: < 5 min for full pipeline on PR) | All |
| 20 | Phase 3 Demo | Push feature branch → automated 5-gate pipeline runs → all gates green → canary deployed to staging → manual approval → fully deployed | All |

**Phase 3 exit criteria**:
- [ ] 5-gate pipeline completes in < 10 minutes for a typical PR (200-line diff)
- [ ] Canary deployment with auto-rollback tested (simulated failure triggers rollback in < 2 min)
- [ ] DORA metrics dashboard shows all four key metrics (deploy frequency, lead time, MTTR, change failure rate)
- [ ] Audit log ingestion rate > 10,000 events/sec with < 1s latency
- [ ] Staging environment passes 24-hour soak test with 0 critical incidents

### 11.6 Phase 4: Production Hardening (Weeks 21-24)

**Goal**: Production readiness. Security audit, performance optimization, chaos testing, and documentation. Platform is deployed to production for a pilot team.

| Week | Milestone | Deliverables | Owner |
|------|-----------|-------------|-------|
| 21 | Security Audit | Penetration testing (external firm or automated Burp Suite scan), Dependency audit (npm audit + Snyk), Secret scanning of all repositories (Gitleaks), RBAC penetration test (attempt escalation from Viewer → Admin), OPA policy review | DevOps + External |
| 21-22 | Performance Optimization | Profiling (clinic.js flamegraphs), Database query optimization (EXPLAIN ANALYZE on top 10 queries), Redis caching for hot agent sessions, NATS consumer group tuning, OpenCode worktree pool pre-warming | Backend (x2) |
| 22-23 | Chaos & Resilience | Chaos engineering (random pod kill during pipeline execution), Network partition simulation (NATS cluster split), Database failover test (PostgreSQL primary failure), Agent misbehavior injection (rogue file writes, excessive tool calls) — verify isolation | DevOps (x2) |
| 23 | Documentation | Operator guide (deployment, scaling, backup/restore), Developer guide (writing SOUL.md, creating skills, defining review policies), API reference (auto-generated from OpenAPI + tRPC), Runbook (incident response procedures per alert) | Full-stack (x2) |
| 23-24 | Pilot Deployment | Production K8s cluster provisioned via Pulumi, ulw platform deployed to production, Pilot team (8-10 devs) onboarded, Shadow mode: platform runs alongside existing workflow for 2 weeks | DevOps + Backend |
| 24 | GA Readiness | Pilot metrics review (compare delivery cycle time, defect rate, review latency against baseline), Performance against success criteria, Go/No-Go decision for full rollout | All |

**Phase 4 exit criteria**:
- [ ] Security audit: 0 critical, 0 high findings
- [ ] P95 pipeline time < 5 minutes (200-line PR)
- [ ] P95 agent task completion < 30 seconds
- [ ] Platform survives chaos tests with no data loss and < 5 min recovery
- [ ] Pilot team delivery cycle time reduced by ≥ 50% vs baseline
- [ ] Documentation complete for all 4 guides

### 11.7 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenCode/OpenClaw API breaking changes | Medium | High | Pin versions, integration test suite, upgrade window in Phase 4 |
| LLM provider outage | Low | High | Multi-model failover chain (Claude → GPT → local model), circuit breaker |
| Agent generates non-compiling code | High | Medium | TDD state machine enforcement, build gate in CI, auto-revert on failure |
| False positive review findings erode trust | Medium | High | Critic agent layer, deduplication, false-positive feedback loop, severity thresholds |
| Git worktree leakage (disk exhaustion) | Medium | Medium | TTL-based cleanup cron, disk usage alerts, worktree pool cap |
| 100-dev scale exceeds NATS/Redis capacity | Low | Medium | Load testing in Phase 3, horizontal scaling (NATS clustering, Redis cluster), capacity planning dashboard |

### 11.8 Success Metrics

| Metric | Current Baseline | Phase 1 Target | Phase 2 Target | GA Target |
|--------|-----------------|----------------|----------------|-----------|
| Feature delivery cycle time | 14 days (est.) | 10 days | 5 days | 4 days |
| Code review latency (median) | 8 hours (est.) | 2 hours | 30 min | 5 min |
| Test coverage (line) | ~60% (est.) | ≥ 80% | ≥ 85% | ≥ 85% |
| Production deployment frequency | 1/week | 2/week | Daily | On-demand |
| Change failure rate | ~15% (est.) | 10% | 5% | < 5% |
| Mean time to recovery | 4 hours (est.) | 1 hour | 15 min | < 10 min |
| False positive rate (review) | N/A | < 25% | < 15% | < 10% |

---

## 12. Security & Governance

### 12.1 Identity & Access Management

**12.1.1 Keycloak Integration**

Keycloak serves as the centralized identity provider for all ulw components. Every user, service, and agent authenticates through Keycloak.

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

**12.1.2 Authentication Flows**

| Flow | Protocol | Use Case |
|------|----------|----------|
| Authorization Code + PKCE | OAuth 2.0 | Web UI login (browser-based) |
| Device Authorization Grant | OAuth 2.0 | CLI / Headless environments |
| Client Credentials | OAuth 2.0 | Service-to-service (OpenCode->Orchestrator) |
| JWT Bearer | OIDC | Agent session token exchange |
| mTLS | TLS 1.3 | Service mesh (Envoy sidecar -> sidecar) |

**12.1.3 JWT Token Structure**

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

**12.1.4 Service-to-Service Authentication**

- **mTLS**: All inter-pod communication within the Kubernetes cluster uses mTLS via Envoy sidecar proxies. Certificate issued by Vault PKI with 24-hour TTL and auto-renewal.
- **Service account tokens**: Kubernetes projected service account tokens (bound to pods) are used by services to authenticate to Keycloak via the client credentials grant.
- **Agent tokens**: Each agent session receives a short-lived JWT (5-minute TTL) scoped to the specific task and project. Tokens are revoked when the session ends.

---

### 12.2 RBAC Model

Four roles govern access to ulw resources. Permissions are enforced at the API Gateway (Kong) and within the Orchestrator.

**12.2.1 Role Definitions**

| Role | Description | Default Assignment |
|------|-------------|-------------------|
| **Admin** | Full system access; user management, policy configuration, system settings, audit access | Platform team leads, SRE |
| **Tech Lead** | Project creation, spec definition, approval gates, agent configuration | Engineering managers, architects |
| **Senior Developer** | Feature development, triggering agents, viewing review results, deploying to staging | Senior IC engineers |
| **Viewer** | Read-only access; view projects, review reports, pipeline status | QA, product managers, external auditors |

**12.2.2 Permission Matrix**

| Resource | Action | Admin | Tech Lead | Senior Dev | Viewer |
|----------|--------|-------|-----------|------------|--------|
| **Projects** | Create | Y | Y | -- | -- |
| | Read | Y | Y | Y | Y |
| | Update | Y | Y | -- | -- |
| | Delete | Y | Y* | -- | -- |
| | Archive | Y | Y | -- | -- |
| **Work Items** | Create | Y | Y | Y | -- |
| | Read | Y | Y | Y | Y |
| | Update (own) | Y | Y | Y | -- |
| | Delete | Y | Y | -- | -- |
| **Agent Tasks** | Trigger | Y | Y | Y | -- |
| | Cancel (any) | Y | Y | -- | -- |
| | Cancel (own) | Y | Y | Y | -- |
| | Read status | Y | Y | Y | Y |
| **Code Review** | Trigger | Y | Y | Y* | -- |
| | Approve | Y | Y | -- | -- |
| | Read results | Y | Y | Y | Y |
| | Dismiss findings | Y | Y | Y* | -- |
| **Pipelines** | Trigger | Y | Y | Y* | -- |
| | Gate 5 Approve | Y | Y | -- | -- |
| | Deploy to staging | Y | Y | Y | -- |
| | Deploy to production | Y | Y | -- | -- |
| | Rollback | Y | Y | -- | -- |
| **Policies** | Create/Update | Y | -- | -- | -- |
| | Read | Y | Y | Y | -- |
| **Users & Roles** | Manage | Y | -- | -- | -- |
| **Audit Logs** | Read | Y | Y* | -- | -- |
| | Export | Y | -- | -- | -- |
| **Secrets** | Manage | Y | -- | -- | -- |
| | Read (scoped) | Y | Y | Y* | -- |
| **System Config** | Read | Y | Y | -- | -- |
| | Update | Y | -- | -- | -- |

*Marked permissions (Y*) have additional constraints:
- Tech Lead `Delete Project`: only within their team scope
- Senior Dev `Trigger Code Review`: only on their own PRs
- Senior Dev `Trigger Pipeline`: only on feature branches, not main
- Senior Dev `Dismiss Findings`: only error-level findings they authored or own code
- Admin/Tech Lead `Read Audit Logs`: only team-scoped for Tech Leads

**12.2.3 Agent Permissions**

Agents are treated as service accounts with role `agent`. They inherit permissions from their parent task's creator, scoped by:

- **OpenCode agents**: Read/write within assigned worktree only; no access to other projects or branches
- **OpenClaw agents**: Read scope of PR diff + project metadata; write access only to `review_findings` table and MinIO review bucket
- **Test agents**: Read API spec; write test files to worktree; execute test runner
- **Deploy agents**: Read deployment config; write deployment records; trigger Kubernetes API (via service account)

All agent actions are logged and traceable to the user who triggered them.

---

### 12.3 Agent Tool Permission Matrix

Each agent type has a defined set of permissible tools. Tools are gated at the agent runtime level, not just the AI model prompt.

**12.3.1 Per-Agent Tool Permissions**

| Tool | OpenCode (Dev) | OpenClaw (Review) | Test Runtime | Deploy Runtime | Security Constraint |
|------|---------------|-------------------|-------------|---------------|---------------------|
| `read_file` | Y (worktree only) | Y (PR diff only) | Y (worktree + spec) | Y (config only) | Path must match worktree prefix |
| `write_file` | Y (worktree only) | -- | Y (test files only) | -- | Blocked outside worktree |
| `edit_file` | Y (worktree only) | -- | Y (test files only) | -- | Blocked on existing code without TDD RED->GREEN flow |
| `execute_command` | Y (allowlisted) | Y (read-only cmds) | Y (test runner) | Y (kubectl) | Command allowlist enforced |
| `bash` | Y (limited) | -- | Y (test env only) | Y (k8s context) | Denylist: `rm -rf`, `sudo`, `chmod 777`, network probes |
| `web_search` | Y | Y | -- | -- | Rate limited: 10/min per agent |
| `glob` | Y (worktree only) | Y (PR scope) | Y (worktree only) | Y (config scope) | No traversal outside scope |
| `grep` | Y (worktree only) | Y (PR scope) | Y (worktree only) | Y (config scope) | No access to `.env`, `secrets/`, `credentials.*` |
| `git` | Y (commit + push) | Y (fetch + log) | -- | -- | No force push; no delete branch |
| `lsp_*` | Y | Y | -- | -- | Read-only operations |
| `npm/pip/go` | Y (install only) | -- | Y | -- | Package allowlist enforced |
| `kubectl` | -- | -- | -- | Y | Read-only in non-deploy mode |
| `vault` | -- | -- | -- | Y | Read-only; path-scoped |
| `slack_notify` | -- | -- | -- | Y | Channel allowlist |

**12.3.2 Command Allowlist and Denylist**

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

Allowlist violations are logged as `security.policy_violation` events and trigger an immediate agent suspension pending supervisor review.

---

### 12.4 Immutable Audit Trail

Every agent action is recorded with cryptographic provenance guarantees.

**12.4.1 Audit Event Schema**

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

**12.4.2 Hash Chain Integrity**

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

Integrity guarantees:
- **Tamper detection**: Modifying any event breaks the hash chain for all subsequent events. Verification computes the chain from the last trusted anchor.
- **Anchor publication**: Chain anchor hashes are written to PostgreSQL `audit_anchors` table every 1000 events or 1 hour (whichever comes first). Optionally anchored to Ethereum testnet for third-party verifiability.
- **Verification API**: `GET /audit/verify?from=anchor_1&to=anchor_2` recomputes the hash chain and returns `{ valid: boolean, brokenAt?: string }`.
- **Reconstruction**: If tampering is detected, the chain can be reconstructed from cold storage backups (daily snapshots).

**12.4.3 Audit Query API**

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

### 12.5 Secrets Management

**12.5.1 HashiCorp Vault Integration**

Vault is the single source of truth for all secrets in the ulw platform. No secrets are stored in environment variables, ConfigMaps, or agent prompts.

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

**12.5.2 Secret Types and Storage Paths**

| Secret Type | Vault Path | TTL | Rotation |
|------------|-----------|-----|----------|
| PostgreSQL credentials (app) | `kv/ulw/{env}/database/app` | 30 days | Auto-rotated via Vault DB engine |
| PostgreSQL credentials (migration) | `kv/ulw/{env}/database/migration` | Manual | Triggered via CI/CD pipeline |
| Redis password | `kv/ulw/{env}/redis/password` | 90 days | Auto-rotated via Vault static secret |
| MinIO access keys | `kv/ulw/{env}/minio/credentials` | 90 days | Auto-rotated |
| NATS auth token | `kv/ulw/{env}/nats/token` | 90 days | Auto-rotated |
| GitHub token (app) | `kv/ulw/{env}/github/token` | Manual | Triggered via Vault UI |
| GitHub webhook secret | `kv/ulw/{env}/github/webhook-secret` | Manual | Triggered via Vault UI |
| Slack bot token | `kv/ulw/{env}/slack/bot-token` | 90 days | Auto-rotated |
| OpenAPI key (LLM provider) | `kv/ulw/{env}/llm/api-key` | 7 days | Dynamic via Vault + provider API |
| mTLS CA cert + key | `pki/ulw/ca` | 1 year | Vault PKI with auto-renewal |
| Service certs (per pod) | `pki/ulw/issue/{service}` | 24 hours | Vault PKI sidecar |
| Agent session token | `kv/ulw/{env}/agent/{sessionId}` | Session TTL | Created per session, revoked on end |
| Vault admin token | `kv/ulw/{env}/vault/admin` | 1 hour (ephemeral) | Requires human approval via Keycloak |

**12.5.3 Zero Secrets in Prompts**

- **Enforced at agent runtime**: The agent's system prompt injects a `vault://` URI reference instead of a raw secret. The tool execution layer resolves the URI, fetches the secret from Vault, and passes it to the tool (not the model).
- **SKILL.md rules**: Agent skill files MUST use the syntax `{{vault "path" "field"}}` for secret references. A pre-flight validator scans all skill files at deployment time and rejects any file containing raw credential patterns (regex: `(password|secret|token|api_key|credential)\s*[:=]\s*['"][^'"]+['"]`).
- **Prompt injection protection**: If a prompt contains a literal secret pattern, the agent runtime strips it before the prompt reaches the LLM and logs a `security.secret_in_prompt` event.
- **No secrets in logs**: Vault sidecar intercepts credential output from tools and replaces values with `[REDACTED]` before they reach the audit log.

**12.5.4 Credential Scanning in Code Review**

The OpenClaw review pipeline includes a mandatory `secrets-scanning` agent that runs on every PR. It uses:
- **gitleaks**: Detects hardcoded credentials in diff
- **custom regex engine**: Project-specific patterns (internal API URLs, proprietary key formats)
- **entropy analysis**: Flags high-entropy strings that match credential patterns

Scan results are reported as review findings at `error` severity. PRs with detected secrets are blocked from merging until findings are resolved.

---

### 12.6 Policy-as-Code

All governance rules are expressed as code and enforced automatically. No manual compliance checks.

**12.6.1 OPA/Gatekeeper for Kubernetes Admission Control**

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

Gatekeeper enforces these policies at the Kubernetes API server level. Policy violations result in admission denial with a clear error message returned to the agent runtime.

**12.6.2 Deployment Approval Chain Policies**

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

**12.6.3 Agent Behavior Guardrails**

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

Policy violations trigger:
1. The offending action is blocked at the tool layer
2. A `security.policy_violation` domain event is published
3. The agent session is paused and supervisor is notified via Slack
4. If the same agent violates 3+ policies in a single session, the session is terminated

---

### 12.7 Data Residency & Compliance

**12.7.1 Data Classification Levels**

| Level | Definition | Examples | Storage Requirements | Access Requirements |
|-------|-----------|---------|---------------------|---------------------|
| **Public** | Non-sensitive, intended for external consumption | Marketing materials, public API docs | No restrictions | No auth required |
| **Internal** | General business data, not confidential | Project names, workflow status, team assignments | Encryption at rest (AES-256) | Any authenticated user |
| **Confidential** | Business-sensitive data | Source code, test reports, review findings, architecture specs | Encryption at rest + in transit; geo-fenced to primary region | Role-based: Senior Developer+ |
| **Restricted** | Highly sensitive, compliance-regulated | User PII, API keys, credentials, audit logs (raw), security scan results | Encryption at rest + in transit; geo-fenced; dedicated HSM key | Role-based: Admin + Tech Lead (scoped); all access logged |
| **Regulated** | Subject to legal/regulatory retention | Audit logs (long-term), compliance reports, legal holds | Encryption + WORM storage; 7-year retention; legal hold support | Admin only; access triggers alert |

**12.7.2 Geo-Fencing for Data Storage**

- **Primary region**: All data at Confidential and above must reside in the primary deployment region (e.g., `us-east-1`). Kubernetes pod topology spread constraints enforce this at the scheduling level.
- **Cross-region replication**: Only Public and Internal data may be replicated to secondary regions for DR purposes. Cross-region replication of Confidential data requires an approved exception with scope, duration, and audit trail.
- **Agent data locality**: Agent worktrees and execution environments are provisioned within the same region as the project data they operate on. The Orchestrator schedules agent pods with `nodeSelector` and `topologySpreadConstraints` matching the project's region label.
- **Data residency check**: A pre-flight validation runs before any cross-region data transfer. The check evaluates the data classification level of all objects in the transfer and blocks the transfer if any Confidential+ data is detected without an exception.

**12.7.3 Model Usage Logging**

Every LLM API call from any agent is logged for compliance and cost attribution:

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

Usage data feeds:
- **Cost dashboards** (Grafana): Per-team, per-project, per-user LLM spend
- **Anomaly detection**: Sudden cost spikes trigger alerts
- **Audit trail**: Full record for compliance verification
- **Capacity planning**: Token consumption trends for model provisioning

**12.7.4 SOC 2 / ISO 27001 Control Mapping**

| Control Domain | ulw Implementation | Standard Reference |
|---------------|-------------------|-------------------|
| Access Control | Keycloak + RBAC + mTLS; automated provisioning/deprovisioning via SCIM | SOC 2 CC6.1, ISO 27001 A.9 |
| Audit Logging | Immutable hash-chain audit trail; 7-year retention | SOC 2 CC3.1, ISO 27001 A.12.4 |
| Encryption at Rest | AES-256 for PostgreSQL, MinIO, Redis; Vault-managed keys | SOC 2 CC6.7, ISO 27001 A.10 |
| Encryption in Transit | mTLS for all inter-service; TLS 1.3 for external | SOC 2 CC6.7, ISO 27001 A.13 |
| Change Management | GitOps via Pulumi; all infra changes go through PR + review + approval | SOC 2 CC8.1, ISO 27001 A.12.1 |
| Logical Segmentation | Kubernetes namespaces + network policies; per-tenant data isolation | SOC 2 CC6.2, ISO 27001 A.11 |
| Risk Management | Policy-as-Code with OPA; automated compliance scanning | SOC 2 CC4.1, ISO 27001 A.6 |
| Incident Response | Automated agent isolation; rollback procedures; postmortem workflow | SOC 2 CC7.1, ISO 27001 A.16 |
| Data Retention | Automated lifecycle management; GDPR erasure/anonymization | SOC 2 CC6.4, ISO 27001 A.18 |
| Vendor Management | LLM provider risk assessment; model usage logging; data processing agreements | SOC 2 CC9.1, ISO 27001 A.15 |
| Availability | Multi-AZ deployment; canary + auto-rollback; RTO < 30 min, RPO < 5 min | SOC 2 A1.2, ISO 27001 A.17 |
| Software Development Lifecycle | TDD-enforced coding; automated review pipeline; security scanning in CI/CD | SOC 2 CC8.1, ISO 27001 A.14 |

---

### 12.8 Incident Response

**12.8.1 Agent Misbehavior Detection**

The Supervisor component continuously monitors agent behavior for signs of misbehavior:

| Detection Signal | Method | Alert Severity | Response |
|-----------------|--------|---------------|----------|
| Stuck in state loop | >3 retries on same transition within 5 minutes | Warning | Pause agent, notify Tech Lead |
| Excessive tool calls | >100 tool calls in 10 minutes without a commit | Warning | Rate-limit agent, log for review |
| Policy violation spike | >2 OPA violations in a single session | Critical | Terminate session, isolate agent pod |
| Unusual file access | Reading files outside assigned worktree | Critical | Terminate session, revoke credentials |
| Command denylist match | Attempted `rm -rf /` or similar destructive command | Critical | Terminate session, isolate pod, notify on-call |
| Prompt injection attempt | Secret pattern detected in agent output | Critical | Isolate agent, revoke all tokens, security review |
| Code quality collapse | Review findings >50 per 100 lines in generated code | Warning | Flag for human review, pause agent |
| API abuse | >1000 LLM API calls in 5 minutes (possible runaway) | Critical | Hard rate-limit agent, notify SRE |

**12.8.2 Automated Agent Isolation**

When a critical misbehavior is detected, the isolation procedure executes automatically:

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

**12.8.3 Rollback Procedures**

| Scenario | Rollback Action | RTO | Data Integrity |
|----------|----------------|-----|----------------|
| Bad deployment (canary) | `kubectl rollout undo deployment/{app}` + traffic shift back to previous version | < 2 minutes | No data loss (canary had no write traffic) |
| Bad deployment (full) | Full rollout undo + previous image restore + DB migration revert (if applicable) | < 10 minutes | Potential DB changes reverted via migration undo |
| Bad code commit (agent-generated) | `git revert <commit>` + re-run review pipeline on revert PR | < 5 minutes | Commit history preserved |
| Data corruption (PostgreSQL) | Point-in-time recovery from WAL archive | < 30 minutes | RPO = 5 minutes (WAL streaming) |
| Secret exposure | Rotate compromised secret in Vault + revoke all sessions using it + audit log review | < 5 minutes | Chain of events preserved for forensic analysis |
| Agent compromise | Full isolation (12.8.2) + worktree deletion + credential rotation + security scan of all affected repos | < 30 minutes | Quarantine snapshot preserved for forensics |

**12.8.4 Incident Postmortem Template**

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

The postmortem template is automatically populated with incident data from the audit trail. Human responders only need to fill in the analysis sections. Completed postmortems are stored in MinIO and indexed for trend analysis.

---
