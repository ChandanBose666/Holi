import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  platform: 'node',
  dts: true,
  external: ['postcss', '@holi.dev/core'],
});
