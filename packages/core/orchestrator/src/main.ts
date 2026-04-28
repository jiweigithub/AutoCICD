import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { OrchestrationModule } from './orchestration.module.js';

async function bootstrap() {
  const app = await NestFactory.create(OrchestrationModule);
  await app.listen(3001);
  console.log('Orchestrator listening on port 3001');
}

void bootstrap();
