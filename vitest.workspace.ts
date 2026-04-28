import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared/*',
  'packages/bc/*',
  'packages/core/*',
  'packages/acl/*',
  'apps/*',
]);
