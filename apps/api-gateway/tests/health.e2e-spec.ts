import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { HealthController } from '../src/rest/health.controller.js';

describe('HealthController', () => {
  it('should return health status', async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleFixture.get<HealthController>(HealthController);
    const result = controller.check();
    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('service', '@ulw/api-gateway');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
  });
});
