import { z } from 'zod';

export const MessageMetadataSchema = z.object({
  correlationId: z.string(),
  causationId: z.string().nullable(),
  source: z.string(),
  traceId: z.string(),
  userId: z.string().nullable(),
  tenantId: z.string().nullable(),
});

export const MessageEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    envelopeId: z.string().uuid(),
    subject: z.string(),
    eventType: z.string(),
    data: dataSchema,
    metadata: MessageMetadataSchema,
    timestamp: z.string().datetime(),
  });

export function createEnvelope<T>(
  data: T,
  subject: string,
  metadata: z.infer<typeof MessageMetadataSchema>,
): { envelopeId: string; subject: string; eventType: string; data: T; metadata: z.infer<typeof MessageMetadataSchema>; timestamp: string } {
  return {
    envelopeId: crypto.randomUUID(),
    subject,
    eventType: subject,
    data,
    metadata,
    timestamp: new Date().toISOString(),
  };
}
