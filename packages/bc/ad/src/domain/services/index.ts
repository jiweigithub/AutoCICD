export interface ArchitectureValidationService {
  validateContextMap(contextMap: Record<string, unknown>): Promise<string[]>;
  checkDecisionConflicts(decisions: { id: string; title: string }[]): Promise<string[]>;
}
