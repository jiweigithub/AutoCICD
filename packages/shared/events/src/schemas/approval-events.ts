import { z } from 'zod';

const ApprovalFields = {
  eventId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  occurredAt: z.string().datetime(),
};

export const UserApprovalRequestedSchema = z.object({
  ...ApprovalFields,
  eventType: z.literal('pipeline.approval.requested'),
  stage: z.enum(['DEPLOYMENT']),
  approvers: z.array(z.string()),
  message: z.string(),
});

export const UserApprovalReceivedSchema = z.object({
  ...ApprovalFields,
  eventType: z.literal('pipeline.approval.received'),
  stage: z.enum(['DEPLOYMENT']),
  approvedBy: z.string(),
  approved: z.boolean(),
  comment: z.string().nullable(),
});

export type UserApprovalRequested = z.infer<typeof UserApprovalRequestedSchema>;
export type UserApprovalReceived = z.infer<typeof UserApprovalReceivedSchema>;
