import { Controller, Post, Body } from '@nestjs/common';
import { CreateTestSuiteUseCase } from '../../application/use-cases/index.js';
import type { CreateTestSuiteDto } from '../dto/index.js';

@Controller('tests')
export class TestController {
  constructor(private readonly createTestSuiteUseCase: CreateTestSuiteUseCase) {}

  @Post('suites')
  async create(@Body() dto: CreateTestSuiteDto) {
    return this.createTestSuiteUseCase.execute(dto);
  }
}
