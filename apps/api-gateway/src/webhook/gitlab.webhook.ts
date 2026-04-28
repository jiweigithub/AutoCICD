import { Controller, Post, Req, Headers, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

const GITLAB_EVENT_HEADER = 'x-gitlab-event';
const GITLAB_TOKEN_HEADER = 'x-gitlab-token';

@Controller('webhook')
export class GitLabWebhookController {
  @Post('gitlab')
  @HttpCode(HttpStatus.OK)
  handle(
    @Req() req: Request,
    @Headers(GITLAB_TOKEN_HEADER) token: string,
    @Headers(GITLAB_EVENT_HEADER) event: string,
  ) {
    const secretToken = process.env['GITLAB_WEBHOOK_TOKEN'];
    if (!secretToken) {
      throw new BadRequestException('GitLab webhook token is not configured');
    }
    if (!token || token !== secretToken) {
      throw new BadRequestException('Invalid webhook token');
    }

    const body = req.body as Record<string, unknown>;
    const project = body['project'] as Record<string, unknown> | undefined;
    const normalized = {
      received: true,
      event: event ?? 'unknown',
      objectKind: body['object_kind'] ?? 'unknown',
      projectId: body['project_id'] ?? project?.['id'] ?? null,
    };

    return normalized;
  }
}
