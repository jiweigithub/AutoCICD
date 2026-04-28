import { describe, it, expect } from 'vitest';
import {
  ReviewSession, ReviewCheck, Violation,
  Severity, CheckType,
  SeverityThreshold,
  StartReviewUseCase,
  BCCodeReviewModule,
} from '../../src/index.js';

describe('BC-CR public API', () => {
  it('exports domain entities', () => {
    expect(ReviewSession).toBeDefined();
    expect(ReviewCheck).toBeDefined();
    expect(Violation).toBeDefined();
  });

  it('exports enums', () => {
    expect(Severity.Critical).toBe('critical');
    expect(CheckType.Security).toBe('security');
  });

  it('exports module', () => {
    expect(BCCodeReviewModule).toBeDefined();
  });

  it('creates ReviewSession with findings', () => {
    const session = new ReviewSession('r1', 'pr1');
    session.start();
    expect(session.status).toBe('in-progress');
    session.addFinding({ findingId: 'f1', file: 'src/bug.ts', line: 42, severity: Severity.High, checkType: CheckType.Security, message: 'SQL injection risk' });
    expect(session.findings).toHaveLength(1);
  });

  it('evaluates SeverityThreshold', () => {
    const t = new SeverityThreshold(Severity.High);
    expect(t.isViolated(Severity.Critical)).toBe(true);
    expect(t.isViolated(Severity.Medium)).toBe(false);
  });
});
