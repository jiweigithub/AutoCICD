import { Module } from '@nestjs/common';
import { TestController } from './interface/controllers/test.controller.js';
import { CreateTestSuiteUseCase } from './application/use-cases/index.js';
import { TestSuiteRepository, TestCaseRepository, TestRunRepository } from './infrastructure/persistence/repositories/index.js';

@Module({
  controllers: [TestController],
  providers: [
    CreateTestSuiteUseCase,
    { provide: 'ITestSuiteRepository', useClass: TestSuiteRepository },
    { provide: 'ITestCaseRepository', useClass: TestCaseRepository },
    { provide: 'ITestRunRepository', useClass: TestRunRepository },
  ],
  exports: [CreateTestSuiteUseCase],
})
export class BCTestAutomationModule {}
