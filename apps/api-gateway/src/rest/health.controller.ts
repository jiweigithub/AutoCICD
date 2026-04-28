import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: '@ulw/api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
