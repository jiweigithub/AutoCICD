import { describe, it, expect } from 'vitest';
import {
  TestSuite, TestCase, TestRun, TestType,
  CoverageThreshold,
  CreateTestSuiteUseCase,
  BCTestAutomationModule,
} from '../../src/index.js';

describe('BC-TA public API', () => {
  it('exports entities', () => {
    expect(TestSuite).toBeDefined();
    expect(TestCase).toBeDefined();
    expect(TestRun).toBeDefined();
  });

  it('exports enums', () => {
    expect(TestType.Unit).toBe('unit');
    expect(TestType.Contract).toBe('contract');
  });

  it('exports module', () => {
    expect(BCTestAutomationModule).toBeDefined();
  });

  it('creates TestSuite and transitions', () => {
    const s = new TestSuite('ts1', 'c1', TestType.Integration);
    expect(s.status).toBe('pending');
    s.start();
    expect(s.status).toBe('running');
  });

  it('validates CoverageThreshold', () => {
    const t = new CoverageThreshold(80, 70);
    expect(t.isSatisfied(85, 75)).toBe(true);
    expect(t.isSatisfied(70, 80)).toBe(false);
    expect(() => new CoverageThreshold(-5, 50)).toThrow();
  });
});
