import { Controller, Post, Req, Headers, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { Request } from 'express';

@Controller('webhook')
export class GitHubWebhookController {
  @Post('github')
  @HttpCode(HttpStatus.OK)
  handle(
    @Req() req: Request,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    const secret = process.env['GITHUB_WEBHOOK_SECRET'];
    if (!secret) {
      throw new BadRequestException('GitHub webhook secret is not configured');
    }
    if (!signature) {
      throw new BadRequestException('Missing x-hub-signature-256 header');
    }

    const payload = JSON.stringify(req.body);
    const hmac = createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    if (
      signature.length !== digest.length ||
      !signature.split('').every((c, i) => c === (digest[i] ?? ''))
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return {
      received: true,
      event: req.headers['x-github-event'] ?? 'unknown',
      action: (req.body as Record<string, unknown>)?.action ?? 'unknown',
    };
  }
}
