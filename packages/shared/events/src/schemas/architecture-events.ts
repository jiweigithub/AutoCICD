import { z } from 'zod';
import { BaseEventFields } from './project-events.js';

export const ArchitectureProposedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ad.architecture.proposed'),
  designDocumentUrl: z.string().url(),
  proposedBy: z.string(),
  components: z.array(z.string()),
});

export const ArchitectureApprovedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ad.architecture.approved'),
  approvedBy: z.string(),
  approvedAt: z.date(),
  comments: z.string().optional(),
});

export const ArchitectureRejectedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ad.architecture.rejected'),
  rejectedBy: z.string(),
  reason: z.string(),
});

export const ContractPublishedSchema = z.object({
  ...BaseEventFields,
  eventType: z.literal('ad.contract.published'),
  contractId: z.string(),
  contractVersion: z.string(),
  spec: z.record(z.unknown()),
});

export type ArchitectureProposed = z.infer<typeof ArchitectureProposedSchema>;
export type ArchitectureApproved = z.infer<typeof ArchitectureApprovedSchema>;
export type ArchitectureRejected = z.infer<typeof ArchitectureRejectedSchema>;
export type ContractPublished = z.infer<typeof ContractPublishedSchema>;
