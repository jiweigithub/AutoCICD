import { z } from 'zod';
import { BaseEventFields } from './project-events.js';

export const ReleaseCreatedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('dp.release.created'),
  version: z.string(),
  artifactUrl: z.string().url(),
  checksum: z.string(),
});

export const StageCompletedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('dp.stage.completed'),
  stageName: z.string(),
  environment: z.string(),
  durationMs: z.number().int().min(0),
});

export const DeployedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('dp.deployed'),
  environment: z.string(),
  deployedBy: z.string(),
  healthCheckPassed: z.boolean(),
});

export const RollbackTriggeredSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('dp.rollback.triggered'),
  reason: z.string(),
  targetVersion: z.string(),
  autoTriggered: z.boolean(),
});

export type ReleaseCreated = z.infer<typeof ReleaseCreatedSchema>;
export type StageCompleted = z.infer<typeof StageCompletedSchema>;
export type Deployed = z.infer<typeof DeployedSchema>;
export type RollbackTriggered = z.infer<typeof RollbackTriggeredSchema>;
