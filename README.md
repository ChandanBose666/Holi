# holi

**Zero-runtime CSS compiler.** Define your design system once in a JSON config — tokens, components, utilities, animations. Holi resolves all references and emits a single, pure CSS file. Nothing ships to the browser at runtime.

[![CI](https://github.com/ChandanBose666/Holi/actions/workflows/ci.yml/badge.svg)](https://github.com/ChandanBose666/Holi/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@holi.dev/cli)](https://www.npmjs.com/package/@holi.dev/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Why Holi?

Most CSS-in-JS libraries ship a runtime that parses styles in the browser. Holi doesn't. It's a **build step** — like a compiler for your design system.

| | Holi | CSS-in-JS | CSS Modules | Raw CSS |
|---|---|---|---|---|
| Zero runtime | ✅ | ❌ | ✅ | ✅ |
| Token references | ✅ | ✅ | ❌ | ❌ (manual) |
| Component variants | ✅ | ✅ | ❌ | ❌ |
| Single config file | ✅ | ❌ | ❌ | ❌ |
| Works with any framework | ✅ | Partial | ✅ | ✅ |

---

## Quick Start

```bash
# Scaffold a config in the current directory
npx @holi.dev/cli init

# Compile to CSS
npx @holi.dev/cli build

# Watch mode (rebuilds on save)
npx @holi.dev/cli watch
```

Or install globally:

```bash
npm install -g @holi.dev/cli
holi init
holi build
```

---

## The Config File

Everything lives in `holi.config.json`. Here is a complete example:

```json
{
  "output": "holi.css",
  "tokens": {
    "color": {
      "primary":    "#6366f1",
      "secondary":  "#ec4899",
      "surface":    "#ffffff",
      "background": "#f8fafc",
      "text":       "#0f172a",
      "muted":      "#64748b"
    },
    "spacing": {
      "xs": "0.25rem",
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem",
      "xl": "2rem"
    },
    "radius": {
      "sm": "4px",
      "md": "8px",
      "lg": "16px",
      "full": "9999px"
    },
    "font": {
      "sans": "Inter, system-ui, sans-serif",
      "mono": "JetBrains Mono, monospace",
      "sm":   "0.875rem",
      "base": "1rem",
      "lg":   "1.125rem"
    }
  },
  "components": {
    "button": {
      "base": "display: inline-flex; align-items: center; border: none; cursor: pointer; font-family: {font.sans}; font-size: {font.sm}; border-radius: {radius.md}; padding: {spacing.sm} {spacing.md};",
      "variants": {
        "primary":   "background: {color.primary}; color: #fff;",
        "secondary": "background: {color.secondary}; color: #fff;",
        "ghost":     "background: transparent; color: {color.primary};"
      }
    },
    "card": {
      "base": "background: {color.surface}; border-radius: {radius.lg}; padding: {spacing.lg};",
      "variants": {
        "bordered": "border: 1px solid {color.muted};"
      }
    }
  },
  "utilities": {
    "text-primary": "color: {color.primary};",
    "text-muted":   "color: {color.muted};",
    "mt-md":        "margin-top: {spacing.md};",
    "p-lg":         "padding: {spacing.lg};"
  },
  "animations": {
    "fade-in": {
      "keyframes": "from { opacity: 0; } to { opacity: 1; }",
      "duration":  "200ms",
      "easing":    "ease-out"
    },
    "slide-up": {
      "keyframes": "from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; }",
      "duration":  "300ms",
      "easing":    "ease-out"
    }
  }
}
```

---

## What Holi Emits

Running `holi build` on the config above produces `holi.css`:

```css
/* tokens */
:root {
  --color-primary: #6366f1;
  --color-surface: #ffffff;
  --spacing-md: 1rem;
  /* ... */
}

/* components */
.button { display: inline-flex; border-radius: 8px; padding: 0.5rem 1rem; }
.button--primary { background: #6366f1; color: #fff; }
.button--secondary { background: #ec4899; color: #fff; }
.button--ghost { background: transparent; color: #6366f1; }

.card { background: #ffffff; border-radius: 16px; padding: 1.5rem; }
.card--bordered { border: 1px solid #64748b; }

/* utilities */
.text-primary { color: #6366f1; }
.mt-md { margin-top: 1rem; }

/* animations */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fade-in 200ms ease-out; }
```

Import it once in your HTML or framework layout:

```html
<link rel="stylesheet" href="/holi.css" />
```

Use the classes anywhere:

```html
<button class="button button--primary">Save</button>
<div class="card card--bordered">
  <p class="text-muted">Hello world</p>
</div>
```

---

## Token References

Use `{token.path}` syntax anywhere in component base styles, variants, utilities, or animation properties. Holi resolves all references at compile time — no variables remain in the output unless you enable CSS custom properties mode.

```json
"base": "padding: {spacing.sm} {spacing.md}; font-family: {font.sans};"
```

Nested tokens work too:

```json
"tokens": {
  "brand": {
    "accent": "#6366f1",
    "hover":  "#4f46e5"
  }
}
```

Reference as `{brand.accent}` or `{brand.hover}`.

---

## Framework Integration

Holi is framework-agnostic. Run `holi build` as part of your existing build step.

**Next.js** — add to `package.json` scripts:

```json
"scripts": {
  "prebuild": "holi build",
  "build": "next build"
}
```

**Vite** — use the `prebuild` script or add a plugin:

```json
"scripts": {
  "build": "holi build && vite build"
}
```

**Astro, SvelteKit, Nuxt** — same pattern. Run `holi build` before your framework build.

---

## CLI Reference

```
holi init              Scaffold holi.config.json in the current directory
holi build             Compile config → CSS (default: holi.config.json → holi.css)
holi build -c path     Use a custom config file
holi build -o path     Write output to a custom path
holi watch             Watch mode — rebuilds on config change
```

---

## Programmatic API

Install the core package directly for use in build tools, scripts, or frameworks:

```bash
npm install @holi.dev/core
```

```ts
import { compile, compileAndWrite } from '@holi.dev/core';

// Compile config file → write CSS file
await compileAndWrite('holi.config.json', 'public/holi.css');

// Compile config file → return CSS string
const result = await compile('holi.config.json');
console.log(result.css);
```

**Browser / edge environments** — use the browser entry (no file system):

```ts
import { compileFromObject } from '@holi.dev/core/browser';

const css = compileFromObject({
  output: 'holi.css',
  tokens: { color: { primary: '#6366f1' } },
  components: {},
  utilities: {},
  animations: {},
});
```

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`@holi.dev/cli`](packages/cli) | [![npm](https://img.shields.io/npm/v/@holi.dev/cli)](https://npmjs.com/package/@holi.dev/cli) | CLI — `holi init / build / watch` |
| [`@holi.dev/core`](packages/core) | [![npm](https://img.shields.io/npm/v/@holi.dev/core)](https://npmjs.com/package/@holi.dev/core) | Programmatic API — `compile()`, `compileFromObject()` |
| [`@holi.dev/schema`](packages/schema) | [![npm](https://img.shields.io/npm/v/@holi.dev/schema)](https://npmjs.com/package/@holi.dev/schema) | JSON Schema + `validate()` |
| [`@holi.dev/shared`](packages/shared) | [![npm](https://img.shields.io/npm/v/@holi.dev/shared)](https://npmjs.com/package/@holi.dev/shared) | TypeScript types |

---

## Contributing

```bash
git clone https://github.com/ChandanBose666/Holi.git
cd Holi
npm install

# Build all packages (in dependency order)
npm run build -w packages/shared
npm run build -w packages/schema
npm run build -w packages/core
npm run build -w packages/cli

# Run tests
npm test

# Start the docs site
npm run dev -w apps/docs
```

Tests use [Vitest](https://vitest.dev). All 4 packages build with [tsup](https://tsup.egoist.dev).

---

## License

MIT © [Chandan Bose](https://github.com/ChandanBose666)
