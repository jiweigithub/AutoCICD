import { Controller, Get, Query } from '@nestjs/common';
import { AuditQuerySchema, type AuditQueryDto } from './dto/audit-query.dto.js';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`AuditController.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

@Controller('audit')
export class AuditController {
  @Get('events')
  getEvents(@Query() query: AuditQueryDto) {
    const parsed = AuditQuerySchema.parse(query);
    void parsed;
    throw new NotImplementedError('getEvents');
  }
}
