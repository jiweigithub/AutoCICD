import { Controller, Post, Body } from '@nestjs/common';
import { StartReviewUseCase } from '../../application/use-cases/index.js';
import type { StartReviewDto } from '../dto/index.js';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly startReviewUseCase: StartReviewUseCase) {}

  @Post()
  async start(@Body() dto: StartReviewDto) {
    return this.startReviewUseCase.execute(dto);
  }
}
