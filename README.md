# holi

> Zero-runtime CSS compiler. One config file. Pure CSS output. No runtime. No dependencies.

[![CI](https://github.com/ChandanBose666/Holi/actions/workflows/ci.yml/badge.svg)](https://github.com/ChandanBose666/Holi/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/holi)](https://www.npmjs.com/package/holi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What is Holi?

Holi is a build-time CSS compiler. You define your design tokens, component variants, utilities, and animations in a single `holi.config.json` file. Holi reads it, resolves all token references, and emits pure static CSS — nothing ships to the browser.

## Quick Start

```bash
npx holi init        # scaffold holi.config.json in the current directory
npx holi build       # compile → holi.css
npx holi watch       # watch mode
```

## Config

```json
{
  "output": "holi.css",
  "tokens": {
    "color": {
      "primary": "#6366f1",
      "surface": "#ffffff"
    },
    "spacing": {
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "2rem"
    }
  },
  "components": {
    "button": {
      "base": "display: inline-flex; padding: {spacing.sm} {spacing.md};",
      "variants": {
        "primary": "background: {color.primary}; color: #fff;"
      }
    }
  }
}
```

## Packages

| Package | Description |
|---|---|
| [`holi`](packages/cli) | CLI — `npx holi build` |
| [`@holi/core`](packages/core) | Programmatic API — `compile()`, `compileFromObject()` |
| [`@holi/schema`](packages/schema) | JSON Schema + `validate()` |
| [`@holi/shared`](packages/shared) | TypeScript types |

## Programmatic API

```ts
import { compile } from '@holi/core';

await compile('holi.config.json', 'holi.css');
```

```ts
import { compileFromObject } from '@holi/core/browser';

const css = compileFromObject(config);
```

## Documentation

Visit [the docs site](https://github.com/ChandanBose666/Holi) for the full reference.

## License

MIT
