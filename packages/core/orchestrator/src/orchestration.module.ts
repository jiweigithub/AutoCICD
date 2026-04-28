import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service.js';
import { OrchestratorController } from './controller/orchestrator.controller.js';
import { TaskDecomposer } from './decomposer/task-decomposer.js';
import { NaturalLanguageIntentParser } from './decomposer/intent-parser.js';
import { DomainBasedAgentRouter } from './router/agent-router.js';
import { PatternSelector } from './router/pattern-selector.js';

@Module({
  controllers: [OrchestratorController],
  providers: [
    OrchestratorService,
    TaskDecomposer,
    NaturalLanguageIntentParser,
    DomainBasedAgentRouter,
    PatternSelector,
  ],
  exports: [OrchestratorService],
})
export class OrchestrationModule {}
