import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
    exclude: ['packages/*/tests/**/*.browser.test.ts'],
  },
});
