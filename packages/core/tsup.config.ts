import { defineConfig } from 'tsup';

export default defineConfig([
  // Node build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'node',
    dts: true,
  },
  // Browser build — outExtension forces .js so package.json exports can reference it simply
  {
    entry: { 'index.browser': 'src/browser.ts' },
    format: ['esm'],
    platform: 'browser',
    noExternal: ['ajv', '@holi/schema'],
    dts: true,
    outExtension: () => ({ js: '.js' }),
  },
]);
