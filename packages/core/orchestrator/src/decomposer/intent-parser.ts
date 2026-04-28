import type { TaskSpec, TaskDomain, TaskPriority } from './types.js';

export interface IntentParser {
  /**
   * Parse a natural language input into a structured TaskSpec.
   * Returns null if the input cannot be parsed.
   */
  parse(input: string): TaskSpec | null;
}

export class NaturalLanguageIntentParser implements IntentParser {
  private readonly domainKeywords: Record<string, TaskDomain> = {
    feature: 'project-management' as TaskDomain,
    story: 'project-management' as TaskDomain,
    sprint: 'project-management' as TaskDomain,
    architecture: 'architecture' as TaskDomain,
    design: 'architecture' as TaskDomain,
    api: 'architecture' as TaskDomain,
    code: 'code-generation' as TaskDomain,
    implement: 'code-generation' as TaskDomain,
    generate: 'code-generation' as TaskDomain,
    review: 'code-review' as TaskDomain,
    'quality check': 'code-review' as TaskDomain,
    test: 'testing' as TaskDomain,
    verification: 'testing' as TaskDomain,
    deploy: 'deployment' as TaskDomain,
    release: 'deployment' as TaskDomain,
    rollout: 'deployment' as TaskDomain,
  };

  parse(input: string): TaskSpec | null {
    if (!input || input.trim().length === 0) {
      return null;
    }

    const domain = this.inferDomain(input.toLowerCase());
    const priority = this.inferPriority(input.toLowerCase());

    return {
      taskId: this.generateTaskId(),
      title: this.extractTitle(input),
      description: input.trim(),
      domain,
      priority,
      context: { rawInput: input, parsedAt: new Date().toISOString() },
      parentTaskId: null,
      createdAt: new Date(),
    };
  }

  private inferDomain(input: string): TaskDomain {
    for (const [keyword, domain] of Object.entries(this.domainKeywords)) {
      if (input.includes(keyword)) {
        return domain;
      }
    }
    return 'code-generation' as TaskDomain;
  }

  private inferPriority(input: string): TaskPriority {
    if (/\b(urgent|critical|asap|immediately)\b/.test(input)) {
      return 'critical' as TaskPriority;
    }
    if (/\b(high|important|priority)\b/.test(input)) {
      return 'high' as TaskPriority;
    }
    if (/\b(low|minor|whenever|someday)\b/.test(input)) {
      return 'low' as TaskPriority;
    }
    return 'medium' as TaskPriority;
  }

  private extractTitle(input: string): string {
    const firstLine = input.split('\n')[0] ?? input;
    const trimmed = firstLine.replace(/^(create|implement|build|add|fix|deploy|test|review)\s+/i, '');
    return trimmed.length > 100 ? `${trimmed.slice(0, 97)}...` : trimmed;
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
