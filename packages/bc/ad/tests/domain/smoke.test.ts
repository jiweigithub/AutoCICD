import { describe, it, expect } from 'vitest';
import {
  ArchitectureSpec, ApiContract,
  SemVer,
  CreateArchitectureSpecUseCase, ApproveArchitectureUseCase,
  BCArchitectureDesignModule,
} from '../../src/index.js';

describe('BC-AD public API', () => {
  it('should export domain entities', () => {
    expect(ArchitectureSpec).toBeDefined();
    expect(ApiContract).toBeDefined();
  });

  it('should export value objects', () => {
    expect(SemVer).toBeDefined();
  });

  it('should export application use cases', () => {
    expect(CreateArchitectureSpecUseCase).toBeDefined();
    expect(ApproveArchitectureUseCase).toBeDefined();
  });

  it('should export NestJS module', () => {
    expect(BCArchitectureDesignModule).toBeDefined();
  });

  it('should create and transition ArchitectureSpec', () => {
    const spec = new ArchitectureSpec('a1', 's1', { services: ['api'] });
    expect(spec.status).toBe('draft');
    spec.propose();
    expect(spec.status).toBe('proposed');
    spec.approve();
    expect(spec.status).toBe('approved');
  });

  it('should parse and compare SemVer', () => {
    const v1 = SemVer.parse('2.1.0');
    const v2 = SemVer.parse('2.1.0');
    expect(v1.equals(v2)).toBe(true);
    expect(v1.toString()).toBe('2.1.0');
  });

  it('should guard against empty storyId', () => {
    expect(() => new ArchitectureSpec('a1', '')).toThrow('storyId');
  });
});
