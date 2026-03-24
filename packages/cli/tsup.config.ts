import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  platform: 'node',
  dts: true,
  banner: { js: '#!/usr/bin/env node' },
});
