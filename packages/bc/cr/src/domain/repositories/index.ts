import type { ReviewSession, ReviewCheck, Violation } from '../entities/index.js';

export interface IReviewSessionRepository {
  findById(id: string): Promise<ReviewSession | null>;
  save(session: ReviewSession): Promise<void>;
}

export interface IReviewCheckRepository {
  findBySessionId(sessionId: string): Promise<ReviewCheck[]>;
  save(check: ReviewCheck): Promise<void>;
}

export interface IViolationRepository {
  findByCheckId(checkId: string): Promise<Violation[]>;
  save(violation: Violation): Promise<void>;
}
