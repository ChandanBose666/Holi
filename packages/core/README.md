# @holi.dev/core

Programmatic API for **holi** — zero-runtime CSS compiler. Use this in build scripts, plugins, or any environment where you need to compile a Holi config to CSS without the CLI.

## Install

```bash
npm install @holi.dev/core
```

## Node.js API

```ts
import { compile, compileAndWrite } from '@holi.dev/core';

// Compile and write to disk
await compileAndWrite('holi.config.json', 'public/holi.css');

// Compile and get the CSS string
const result = await compile('holi.config.json');
console.log(result.css);
```

## Browser / Edge API

A separate browser-safe entry is provided — no file system access, pass the config object directly:

```ts
import { compileFromObject } from '@holi.dev/core/browser';

const css = compileFromObject({
  output: 'holi.css',
  tokens: {
    color: { primary: '#6366f1' },
    spacing: { md: '1rem' },
  },
  components: {
    button: {
      base: 'padding: {spacing.md};',
      variants: { primary: 'background: {color.primary}; color: #fff;' },
    },
  },
  utilities: {},
  animations: {},
});
```

## TypeScript

All types are exported from `@holi.dev/core`:

```ts
import type { HoliConfig, ResolvedConfig, EmitResult } from '@holi.dev/core';
```

## Full documentation

See the [main repository](https://github.com/ChandanBose666/Holi) for the full config reference and CLI usage.
