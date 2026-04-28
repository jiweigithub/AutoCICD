import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

import { OrchestrationModule } from '@ulw/orchestrator';
import { SupervisorModule } from '@ulw/supervisor';
import { BCProjectManagementModule } from '@ulw/bc-pm';
import { BCArchitectureDesignModule } from '@ulw/bc-ad';
import { BCCodeGenerationModule } from '@ulw/bc-cg';
import { BCCodeReviewModule } from '@ulw/bc-cr';
import { BCTestAutomationModule } from '@ulw/bc-ta';
import { BCDeploymentModule } from '@ulw/bc-dp';

import { TRPCModule } from './trpc/trpc.module.js';
import { HealthController } from './rest/health.controller.js';
import { ProjectController } from './rest/project/project.controller.js';
import { AuditController } from './rest/audit/audit.controller.js';
import { GitHubWebhookController } from './webhook/github.webhook.js';
import { GitLabWebhookController } from './webhook/gitlab.webhook.js';
import { JwtStrategy } from './auth/jwt.strategy.js';
import { AuthGuard } from './auth/auth.guard.js';
import { TracingMiddleware } from './middleware/tracing.middleware.js';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseWrapperInterceptor } from './common/interceptors/response-wrapper.interceptor.js';

@Module({
  imports: [
    TRPCModule,
    OrchestrationModule,
    SupervisorModule,
    BCProjectManagementModule,
    BCArchitectureDesignModule,
    BCCodeGenerationModule,
    BCCodeReviewModule,
    BCTestAutomationModule,
    BCDeploymentModule,
  ],
  controllers: [
    HealthController,
    ProjectController,
    AuditController,
    GitHubWebhookController,
    GitLabWebhookController,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TracingMiddleware, CorrelationIdMiddleware).forRoutes('*');
  }
}
