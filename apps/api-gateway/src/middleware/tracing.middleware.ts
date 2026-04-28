import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const traceparent = req.headers['traceparent'] as string | undefined;
    if (traceparent) {
      req.headers['x-trace-id'] = traceparent.split('-')[1] ?? '';
    }
    next();
  }
}
