import { z } from 'zod';
import { BaseEventFields } from './project-events.js';

export const ReviewStartedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cr.review.started'),
  codeRef: z.string(),
  reviewerCount: z.number().int().positive(),
});

export const CheckCompletedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cr.check.completed'),
  checkType: z.string(),
  passed: z.boolean(),
  findingCount: z.number().int().min(0),
});

export const ReviewPassedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cr.review.passed'),
  totalFindings: z.number().int(),
  resolvedFindings: z.number().int(),
  reviewers: z.array(z.string()),
});

export const ReviewFailedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('cr.review.failed'),
  blockingFindings: z.number().int().positive(),
  reason: z.string(),
});

export type ReviewStarted = z.infer<typeof ReviewStartedSchema>;
export type CheckCompleted = z.infer<typeof CheckCompletedSchema>;
export type ReviewPassed = z.infer<typeof ReviewPassedSchema>;
export type ReviewFailed = z.infer<typeof ReviewFailedSchema>;
