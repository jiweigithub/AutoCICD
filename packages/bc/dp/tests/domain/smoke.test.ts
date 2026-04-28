import { describe, it, expect } from 'vitest';
import {
  Release, PipelineStage, Rollback,
  DeploymentVersion,
  CreateReleaseUseCase, TriggerRollbackUseCase,
  BCDeploymentModule,
} from '../../src/index.js';

describe('BC-DP public API', () => {
  it('exports entities', () => {
    expect(Release).toBeDefined();
    expect(PipelineStage).toBeDefined();
    expect(Rollback).toBeDefined();
  });

  it('exports module', () => {
    expect(BCDeploymentModule).toBeDefined();
  });

  it('creates Release and transitions through lifecycle', () => {
    const r = new Release('r1', '2.0.0', 'staging');
    expect(r.status).toBe('pending');
    r.startDeploy();
    expect(r.status).toBe('deploying');
    r.markDeployed();
    expect(r.status).toBe('deployed');
  });

  it('compares DeploymentVersions', () => {
    const v1 = DeploymentVersion.parse('1.2.3');
    const v2 = DeploymentVersion.parse('1.3.0');
    expect(v2.isNewerThan(v1)).toBe(true);
    expect(() => DeploymentVersion.parse('bad')).toThrow();
  });
});
