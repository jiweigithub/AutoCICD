import { z } from 'zod';
import { BaseEventFields } from './project-events.js';

export const TestRunStartedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ta.test.started'),
  suiteName: z.string(),
  totalCases: z.number().int().min(0),
  testType: z.string(),
});

export const TestCaseCompletedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ta.case.completed'),
  testId: z.string(),
  testName: z.string(),
  passed: z.boolean(),
  durationMs: z.number().int().min(0),
});

export const ContractBrokenSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ta.contract.broken'),
  contractName: z.string(),
  consumer: z.string(),
  provider: z.string(),
  mismatchDetails: z.string(),
});

export type TestRunStarted = z.infer<typeof TestRunStartedSchema>;
export type TestCaseCompleted = z.infer<typeof TestCaseCompletedSchema>;
export type ContractBroken = z.infer<typeof ContractBrokenSchema>;
