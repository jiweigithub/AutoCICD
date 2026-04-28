import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SupervisorModule } from './supervisor.module.js';

async function bootstrap() {
  const app = await NestFactory.create(SupervisorModule);
  await app.listen(3002);
  console.log('Supervisor listening on port 3002');
}

void bootstrap();
