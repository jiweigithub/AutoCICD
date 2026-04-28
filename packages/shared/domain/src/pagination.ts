import type { PaginationMeta } from '@ulw/shared-types';

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};
