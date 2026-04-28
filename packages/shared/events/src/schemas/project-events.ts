import { z } from 'zod';

export const BaseEventFields = {
  eventId: z.string().uuid(),
  occurredAt: z.date(),
  aggregateId: z.string(),
};

export const StoryCreatedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('pm.story.created'),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  storyPoints: z.number().int().positive(),
  createdBy: z.string(),
});

export const StoryReadySchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('pm.story.ready'),
  title: z.string(),
  assignedTo: z.string().nullable(),
  acceptanceCriteria: z.array(z.string()),
});

export const SprintCommittedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('pm.sprint.committed'),
  sprintId: z.string(),
  storyIds: z.array(z.string()),
  committedAt: z.date(),
});

export type StoryCreated = z.infer<typeof StoryCreatedSchema>;
export type StoryReady = z.infer<typeof StoryReadySchema>;
export type SprintCommitted = z.infer<typeof SprintCommittedSchema>;
