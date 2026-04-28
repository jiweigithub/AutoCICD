import type { AgentType } from '@ulw/shared-types';
import type { MicroSpecDAG, TaskDomain } from '../decomposer/types.js';

const domainAgentMap: Record<TaskDomain, AgentType> = {
  'project-management': 'product-manager' as AgentType,
  architecture: 'architecture-designer' as AgentType,
  'code-generation': 'code-generator' as AgentType,
  'code-review': 'code-reviewer' as AgentType,
  testing: 'test-automator' as AgentType,
  deployment: 'deployer' as AgentType,
};

export interface AgentRouter {
  resolveSteward(domain: TaskDomain): AgentType;
  resolveDomain(agentType: AgentType): TaskDomain | null;
}

export class DomainBasedAgentRouter implements AgentRouter {
  resolveSteward(domain: TaskDomain): AgentType {
    return domainAgentMap[domain] ?? ('orchestrator' as AgentType);
  }

  resolveDomain(agentType: AgentType): TaskDomain | null {
    for (const [domain, agent] of Object.entries(domainAgentMap)) {
      if (agent === agentType) return domain as TaskDomain;
    }
    return null;
  }

  routeToSteward(dag: MicroSpecDAG): Map<string, AgentType> {
    const assignments = new Map<string, AgentType>();
    for (const spec of dag.specs) {
      assignments.set(spec.specId, spec.assignedAgent);
    }
    return assignments;
  }
}
