import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.e2e-spec.ts', 'tests/*.e2e-spec.ts'],
  },
});
