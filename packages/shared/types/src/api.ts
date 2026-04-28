export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: PaginationMeta | null;
}

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  traceId: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WebhookPayload {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  signature: string;
  deliveredAt: Date;
  retryCount: number;
}
