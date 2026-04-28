import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const responseBody = exception instanceof HttpException
      ? {
          ...(exception.getResponse() as Record<string, unknown>),
          timestamp: new Date().toISOString(),
        }
      : {
          statusCode: status,
          message,
          timestamp: new Date().toISOString(),
        };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`HTTP ${status}: ${message}`, exception.stack);
    }

    response.status(status).json(responseBody);
  }
}
