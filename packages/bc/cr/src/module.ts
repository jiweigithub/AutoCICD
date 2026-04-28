import { Module } from '@nestjs/common';
import { ReviewController } from './interface/controllers/review.controller.js';
import { StartReviewUseCase } from './application/use-cases/index.js';
import { ReviewSessionRepository, ReviewCheckRepository, ViolationRepository } from './infrastructure/persistence/repositories/index.js';

@Module({
  controllers: [ReviewController],
  providers: [
    StartReviewUseCase,
    { provide: 'IReviewSessionRepository', useClass: ReviewSessionRepository },
    { provide: 'IReviewCheckRepository', useClass: ReviewCheckRepository },
    { provide: 'IViolationRepository', useClass: ViolationRepository },
  ],
  exports: [StartReviewUseCase],
})
export class BCCodeReviewModule {}
