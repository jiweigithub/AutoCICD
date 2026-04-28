export interface ReviewPolicyService {
  evaluateSession(sessionId: string): Promise<'passed' | 'failed'>;
}
