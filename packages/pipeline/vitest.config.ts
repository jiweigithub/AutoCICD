import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
