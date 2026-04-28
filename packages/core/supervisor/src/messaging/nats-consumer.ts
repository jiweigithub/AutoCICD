import { Injectable } from '@nestjs/common';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`NATSConsumer.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

export interface StatusEventPayload {
  specId: string;
  dagId: string;
  sessionId: string;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

@Injectable()
export class NATSConsumer {
  async subscribeToStatusEvents(
    dagId: string,
    handler: (payload: StatusEventPayload) => Promise<void>,
  ): Promise<void> {
    void dagId;
    void handler;
    throw new NotImplementedError('subscribeToStatusEvents');
  }

  async subscribeToHeartbeats(
    handler: (sessionId: string) => void,
  ): Promise<void> {
    void handler;
    throw new NotImplementedError('subscribeToHeartbeats');
  }

  async unsubscribeAll(): Promise<void> {
    throw new NotImplementedError('unsubscribeAll');
  }
}
