import { randomUUID } from 'node:crypto';
import { ReviewSession } from '../../domain/entities/index.js';
import type { IReviewSessionRepository } from '../../domain/repositories/index.js';
import type { StartReviewInput } from '../ports/index.js';

export class StartReviewUseCase {
  constructor(private readonly sessionRepo: IReviewSessionRepository) {}

  async execute(input: StartReviewInput): Promise<ReviewSession> {
    const session = new ReviewSession(randomUUID(), input.prId);
    session.start();
    await this.sessionRepo.save(session);
    return session;
  }
}
