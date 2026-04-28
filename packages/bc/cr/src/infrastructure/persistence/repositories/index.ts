import type { ReviewSession, ReviewCheck, Violation } from '../../../domain/entities/index.js';
import type { IReviewSessionRepository, IReviewCheckRepository, IViolationRepository } from '../../../domain/repositories/index.js';

export class ReviewSessionRepository implements IReviewSessionRepository {
  async findById(_id: string): Promise<ReviewSession | null> { throw new Error('Not implemented'); }
  async save(_session: ReviewSession): Promise<void> { throw new Error('Not implemented'); }
}
export class ReviewCheckRepository implements IReviewCheckRepository {
  async findBySessionId(_sessionId: string): Promise<ReviewCheck[]> { throw new Error('Not implemented'); }
  async save(_check: ReviewCheck): Promise<void> { throw new Error('Not implemented'); }
}
export class ViolationRepository implements IViolationRepository {
  async findByCheckId(_checkId: string): Promise<Violation[]> { throw new Error('Not implemented'); }
  async save(_violation: Violation): Promise<void> { throw new Error('Not implemented'); }
}
