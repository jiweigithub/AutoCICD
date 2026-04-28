import { z } from 'zod';
import { BaseEventFields } from './project-events.js';

export const SecretDetectedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('security.secret.detected'),
  filePath: z.string(),
  line: z.number().int().positive(),
  ruleId: z.string(),
  masked: z.boolean(),
});

export const PolicyViolationSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('security.policy.violation'),
  policyName: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string(),
  remediation: z.string(),
});

export type SecretDetected = z.infer<typeof SecretDetectedSchema>;
export type PolicyViolation = z.infer<typeof PolicyViolationSchema>;
