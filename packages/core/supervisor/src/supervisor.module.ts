import { Module } from '@nestjs/common';
import { SupervisorService } from './supervisor.service.js';
import { SupervisorController } from './controller/supervisor.controller.js';
import { DAGExecutor } from './executor/dag-executor.js';
import { RetryManager } from './executor/retry-manager.js';
import { SessionManager } from './session/session-manager.js';
import { HeartbeatMonitor } from './session/heartbeat-monitor.js';
import { NATSPublisher } from './messaging/nats-publisher.js';
import { NATSConsumer } from './messaging/nats-consumer.js';

@Module({
  controllers: [SupervisorController],
  providers: [
    SupervisorService,
    DAGExecutor,
    RetryManager,
    SessionManager,
    HeartbeatMonitor,
    NATSPublisher,
    NATSConsumer,
  ],
  exports: [SupervisorService],
})
export class SupervisorModule {}
