import { Injectable } from '@nestjs/common';
import type { MessageEnvelope, MessageMetadata } from '@ulw/shared-types';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`NATSPublisher.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

@Injectable()
export class NATSPublisher {
  async publish<T = unknown>(subject: string, data: T, metadata: MessageMetadata): Promise<void> {
    void subject;
    void data;
    void metadata;
    throw new NotImplementedError('publish');
  }

  async publishTaskAssignment(
    agentType: string,
    specId: string,
    dagId: string,
  ): Promise<void> {
    void agentType;
    void specId;
    void dagId;
    throw new NotImplementedError('publishTaskAssignment');
  }

  async publishDAGStatus(
    dagId: string,
    status: string,
  ): Promise<void> {
    void dagId;
    void status;
    throw new NotImplementedError('publishDAGStatus');
  }

  buildEnvelope<T>(subject: string, data: T, metadata: MessageMetadata): MessageEnvelope<T> {
    return {
      envelopeId: `env-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      subject,
      eventType: subject.split('.').slice(-1)[0] ?? 'unknown',
      data,
      metadata,
      timestamp: new Date(),
    };
  }
}
