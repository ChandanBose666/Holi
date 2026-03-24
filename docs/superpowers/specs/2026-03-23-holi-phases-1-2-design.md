# Holi — Zero-Runtime CSS Compiler
## Design Spec: Phases 1 & 2 (Core Compiler + CLI)
**Date:** 2026-03-23
**Scope:** `packages/shared`, `packages/schema`, `packages/core`, `packages/cli`

---

## What We Are Building

Holi is a zero-runtime CSS compiler. Developers define design tokens, breakpoints, component variants, and animations in a single `holi.config.json` file. The compiler reads it, resolves all token references, and emits pure static CSS. No JavaScript ships to the browser.

Phases 1 and 2 deliver the minimum useful artifact: a working `npx holi build` command backed by a fully tested compiler engine.

---

## Decisions & Adjustments

| Topic | Decision |
|---|---|
| Package manager | npm workspaces (npm 7+, ships with Node 24) |
| Workspace config | `"workspaces": ["packages/*"]` in root `package.json` |
| Node version | 24.x (user confirmed installed) |
| Build tool | tsup throughout; `packages/core` gets dual-config (Node + browser) |
| Phase scope | Phases 1–2 only: `shared`, `schema`, `core`, `cli` |
| `DEFAULT_CONFIG` location | `packages/core/src/defaults.ts`, exported from core |

---

## Repository Layout

```
holi/
  packages/
    shared/          # HoliConfig, ResolvedConfig, EmitResult types — no runtime deps
    schema/          # JSON Schema object + validate() wrapper using ajv
    core/            # parser, resolver, emitter, compile(), compileAndWrite(), compileFromObject()
    cli/             # holi init / build / watch commands
  docs/
    superpowers/specs/
  package.json       # npm workspaces root
  tsconfig.json      # root composite tsconfig
  vitest.config.ts   # root vitest config (runs all packages/*/tests, excludes browser artifact test)
  .nvmrc             # "24"
  .node-version      # "24"
```

---

## Package Dependency Graph (build order)

```
shared      (types only — zero deps)
  └─> schema  (ajv + @holi/shared)
        └─> core  (ajv + @holi/schema + @holi/shared; dual Node/browser build)
              └─> cli  (commander + chokidar + ora + chalk + @holi/core)
```

---

## Section 1 — packages/shared

**Purpose:** Central type definitions. No runtime code. Imported by both `schema` and `core`.

**Exports:**
- `TokenMap` — `{ [key: string]: string }`
- `HoliConfig` — full typed config shape (tokens, breakpoints, components, animations, output)
- `ResolvedConfig` — intentional type alias of `HoliConfig` (`type ResolvedConfig = HoliConfig`). The distinction is semantic, not structural: `resolve()` is the runtime contract that guarantees all dot-notation references have been replaced with raw CSS values. Keeping them structurally identical allows emitter functions to accept both without casts.
- `EmitResult` — `Record<string, string>` (filename → CSS content)

**Build:** Types-only via `tsc --emitDeclarationOnly --outDir dist`. Output: `dist/index.d.ts`. No JS is emitted — `@holi/shared` has no runtime. No `"default"` or `"require"` condition is needed in the exports map.

**`package.json` for `@holi/shared`:**
```json
{
  "name": "@holi/shared",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts" }
  }
}
```

---

## Section 2 — packages/schema

**Purpose:** Owns the JSON Schema (Draft-07) for `holi.config.json` and exposes a `validate()` function.

**Exports:**
- `schema` — plain JS object (valid JSON Schema Draft-07)
- `validate(raw: unknown): asserts raw is HoliConfig` — thin wrapper around ajv; throws `HoliValidationError` listing all violations

**Schema covers:**
- `tokens` (required) — nested `{ [category: string]: { [key: string]: string } }`
- `breakpoints` — `{ [name: string]: string }`. Values must be CSS string values (e.g. `"768px"`). The JSON Schema `additionalProperties` for breakpoints is `{ "type": "string" }` — numeric values are not accepted.
- `components` — `{ [name]: { base: TokenMap, variants?: { [name]: TokenMap } } }`
- `animations` — `{ [name]: { keyframes: { [stop: string]: TokenMap }, duration?: string, easing?: string, fillMode?: string } }`
- `output` — object with:
  - `outputDir?: string` — default `"holi-dist"` (relative to the config file's directory)
  - `prefix?: string` — default `""`. When non-empty, prepended to every emitted CSS class name: prefix `"h"` turns `.btn` → `.h-btn`, `.mx-sm` → `.h-mx-sm`, `.animate-fade-in` → `.h-animate-fade-in`, `.md\:flex` → `.h-md\:flex`. Does **not** affect CSS custom property names or `@keyframes` names.
  - `utilities?: boolean` — default `true`. When `false`, `utilities.css` is not written and `emitUtilities()` returns `""`.

**ajv browser compatibility:** ajv v8+ is browser-safe (no Node-specific APIs). The core browser tsup build inlines both `@holi/schema` and `ajv` via `noExternal`. esbuild (used by tsup) follows symlinks, so workspace-symlinked packages are bundled correctly.

---

## Section 3 — packages/core

**Purpose:** The compiler engine. Three pure pipeline stages plus orchestration functions.

### Pipeline

```
parse(raw)  →  resolve(config)  →  emit(resolved)  →  EmitResult
```

**Stage A — Parser (`parser.ts`)**
- Accepts `unknown`, calls `@holi/schema`'s `validate()`, returns typed `HoliConfig`. Does not clone the input — the raw object is returned as-is after validation. `resolve()` is responsible for deep-cloning before mutation.
- Throws `HoliValidationError` on schema violations (all errors, not just first).

**Stage B — Resolver (`resolver.ts`)**
- `flattenTokens()` — builds `Record<string, string>`: `"category.key" → cssValue`
- `resolveValue(value, tokenMap, depth)` algorithm:
  1. **First**, if `depth > 10`, throw `"Circular token reference detected: \"{value}\""`. This check is performed before any recursion.
  2. If `value` is a direct key in `tokenMap` (exact match), return `resolveValue(tokenMap[value], tokenMap, depth + 1)` recursively.
  3. Otherwise, scan `value` for embedded token references using the regex `/[\w-]+\.[\w-]+/g`. For each match, if it exists as a key in `tokenMap`, replace it with `tokenMap[match]`. Unrecognised matches are left verbatim. Return the substituted string.
- `resolve()` — deep-clones config via `JSON.parse(JSON.stringify(config))`, then walks all string values through `resolveValue()`.

**Stage C — Emitter (`emitter.ts`)**

**`EmitResult` key convention:** All sections are always present as keys in `EmitResult`. Optional sections that have no content (e.g. `animations` when not defined in config) produce `""` (empty string). `compileAndWrite()` skips writing files whose CSS value is `""` after trimming.

`emitTokens(tokens)` → `tokens.css`
```css
:root {
  --color-primary: #6366F1;
  --spacing-sm: 8px;
}
```
Custom property name: `--{category}-{key}` verbatim. No casing transform. Never prefixed.

`emitComponent(name, component)` → e.g. `btn.css`
```css
.btn {
  display: inline-flex;
  padding: 8px 16px;
}

.btn-primary {
  background: #6366F1;
  color: #fff;
}
```
- Component base class: `.{name}` (verbatim from config key)
- Variant class: `.{name}-{variantName}` (both verbatim, joined with `-`)
- No casing normalization. Developers must use kebab-case config keys.
- CSS property names inside base/variant maps are used verbatim as CSS properties. Values are resolved raw CSS strings.

`emitComponents(components)` → one file per component (`btn.css`, `card.css`, etc.)

`emitUtilities(tokens, breakpoints, emitFlag)` → `utilities.css`

When `emitFlag === false`, returns `""` immediately.

Emitted display utility classes (exhaustive list):
| Class | CSS |
|---|---|
| `.flex` | `display: flex;` |
| `.grid` | `display: grid;` |
| `.block` | `display: block;` |
| `.inline` | `display: inline;` |
| `.inline-flex` | `display: inline-flex;` |
| `.inline-block` | `display: inline-block;` |
| `.hidden` | `display: none;` |

Responsive breakpoint variants: for each breakpoint `bp`, each display utility is re-emitted inside `@media (min-width: {bpValue})` with class name `{bp}\:{utilityName}`. **Spacing utilities do not receive responsive variants in Phase 1.**

Emitted spacing utility classes (one set per key in `tokens.spacing`):
| Class | CSS |
|---|---|
| `.mx-{key}` | `margin-left: {value}; margin-right: {value};` |
| `.my-{key}` | `margin-top: {value}; margin-bottom: {value};` |
| `.mt-{key}` | `margin-top: {value};` |
| `.mb-{key}` | `margin-bottom: {value};` |
| `.ml-{key}` | `margin-left: {value};` |
| `.mr-{key}` | `margin-right: {value};` |
| `.p-{key}` | `padding: {value};` |
| `.px-{key}` | `padding-left: {value}; padding-right: {value};` |
| `.py-{key}` | `padding-top: {value}; padding-bottom: {value};` |

Values emitted as resolved CSS strings (e.g. `8px`), not `var()` references.

`emitAnimations(animations)` → `animations.css`
```css
@keyframes holi-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.animate-fade-in {
  animation-name: holi-fade-in;
  animation-duration: 300ms;        /* emitted only if duration is set */
  animation-timing-function: ease-out; /* emitted only if easing is set */
  animation-fill-mode: forwards;    /* emitted only if fillMode is set */
}
```
`fillMode` maps to the `animation-fill-mode` CSS property. Each of `duration`, `easing`, and `fillMode` is only emitted in the helper class when the field is present in the config. The `@keyframes` name (`holi-{name}`) is never prefixed. The `.animate-{name}` class is prefixed when `output.prefix` is set.

`emit(resolved)` — assembles `EmitResult` (all keys always present, absent sections → `""`):
```
{
  'tokens.css':     emitTokens(...),
  'btn.css':        emitComponent('btn', ...),   // one entry per component
  'card.css':       emitComponent('card', ...),
  'utilities.css':  emitUtilities(...),
  'animations.css': emitAnimations(...),
}
```

**Orchestration (`index.ts`)**
- `compile(configPath: string)` — reads file → parse → resolve → emit → returns `EmitResult`
- `compileAndWrite(configPath: string)` — resolves `configPath` against `process.cwd()` if relative, then: compile + `mkdir -p outputDir` + write each file whose trimmed CSS is non-empty. `outputDir` defaults to `"holi-dist"` resolved relative to the directory containing `configPath`.
- `compileFromObject(raw: unknown)` — browser-safe; no `fs`/`path`; parse → resolve → emit

**Default config (`defaults.ts`)** — `DEFAULT_CONFIG` sample values (authoritative):
```json
{
  "tokens": {
    "color": {
      "primary": "#6366F1",
      "primary-dk": "#4F46E5",
      "surface": "#F8FAFC",
      "text": "#1E293B",
      "muted": "#64748B"
    },
    "spacing": { "xs": "4px", "sm": "8px", "md": "16px", "lg": "32px", "xl": "64px" },
    "typography": {
      "sans": "\"Inter\", sans-serif",
      "size-sm": "0.875rem",
      "size-base": "1rem",
      "size-lg": "1.25rem"
    },
    "radius": { "sm": "4px", "md": "8px", "lg": "16px" },
    "shadow": { "sm": "0 1px 3px rgba(0,0,0,0.1)" }
  },
  "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px" },
  "components": {
    "btn": {
      "base": {
        "display": "inline-flex",
        "padding": "spacing.sm spacing.md",
        "font-family": "typography.sans",
        "border-radius": "radius.md",
        "cursor": "pointer"
      },
      "variants": {
        "primary": { "background": "color.primary", "color": "#fff" },
        "ghost": { "background": "transparent", "border": "1px solid color.primary", "color": "color.primary" }
      }
    },
    "card": {
      "base": {
        "background": "color.surface",
        "border-radius": "radius.lg",
        "padding": "spacing.lg",
        "box-shadow": "shadow.sm"
      }
    }
  },
  "animations": {
    "fade-in": {
      "keyframes": { "0%": { "opacity": "0" }, "100%": { "opacity": "1" } },
      "duration": "300ms",
      "easing": "ease-out"
    }
  },
  "output": { "outputDir": "holi-dist", "utilities": true }
}
```

**Dual tsup build config (`tsup.config.ts`):**
```ts
export default [
  // Node build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    platform: 'node',
    dts: true,
  },
  // Browser build — entry key becomes the output filename
  // entry key 'index.browser' → dist/index.browser.js + dist/index.browser.d.ts
  {
    entry: { 'index.browser': 'src/browser.ts' },
    format: ['esm'],
    platform: 'browser',
    noExternal: ['ajv', '@holi/schema'],
    dts: true,
    // No outExtension override — tsup uses the entry key as filename
  },
]
```

`src/browser.ts` re-exports only `compileFromObject`, `parse`, `resolve`, `emit`.

**`package.json` exports for `@holi/core`:**
```json
{
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "browser": { "import": "./dist/index.browser.js", "types": "./dist/index.browser.d.ts" },
      "node":    { "import": "./dist/index.js", "require": "./dist/index.cjs" }
    }
  }
}
```

### Tests (`packages/core/tests/`)

Unit tests discovered by root vitest config (`npm test`):
- `parser.test.ts` — valid config passes, invalid throws `HoliValidationError`
- `resolver.test.ts` — direct refs, shorthand multi-refs, raw values pass through, circular ref throws
- `emitter.test.ts` — `:root` block, component base + variants, utility classes, animation keyframes + helper class, empty sections produce `""`

Integration test (also discovered by root vitest):
- `compile.integration.test.ts` — writes real files to `os.tmpdir()`, asserts file contents

Browser entry test — **excluded from default `npm test`**, run via a separate `npm run test:browser` script after build:
```ts
// packages/core/tests/browser-entry.test.ts
// Run via: npm run test:browser (after npm run build -w packages/core)
import { compileFromObject } from '../dist/index.browser.js';
```
Root `vitest.config.ts` excludes `**/*.browser.test.*` from its default include pattern. A separate script `"test:browser": "vitest run --include **/browser-entry.test.ts"` is added to root `package.json`.

---

## Section 4 — packages/cli

**Published package name:** `holi`

**`package.json` for `holi` (key fields):**
```json
{
  "name": "holi",
  "bin": { "holi": "./dist/index.js" },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "import":  "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "engines": { "node": ">=24.0.0" }
}
```

### Commands

**`holi init`**
- Checks for existing `holi.config.json`. If present: prints `"holi.config.json already exists. Nothing was changed."` and exits 0. Idempotent by design — running init twice is safe.
- Writes `DEFAULT_CONFIG` as pretty-printed JSON.
- Prints: `✓ Created holi.config.json` + `  Edit it, then run: holi build`

**`holi build [-c path]`**
- ora spinner while `compileAndWrite()` runs
- On success: prints compile time, then a two-column summary: filename left-padded to 20 chars, size in kB right-aligned. All output in chalk green.
- On error: spinner fail + chalk red error message + `process.exit(1)`

**`holi watch [-c path]`**
- chokidar watches config file, `ignoreInitial: false` (compiles once on startup)
- Responds to `change` and `add` events only. `unlink` is ignored.
- 50ms debounce on all rebuild-triggering events (including the initial `add`)
- Prints rebuild time on success, chalk red error on failure — never exits, keeps watching

**`tsup.config.ts` for CLI:**
```ts
export default {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  platform: 'node',
  dts: true,
  banner: { js: '#!/usr/bin/env node' },
}
```
The `banner` injects the shebang as the first line of the output file, which is required for `bin` entries to be directly executable via `npx holi` or a globally installed `holi` command.

**Dependencies:** `commander`, `chokidar`, `ora`, `chalk`, `@holi/core`

---

## CSS Output Contract

### Token → CSS custom property

| Config key | CSS property |
|---|---|
| `color.primary` | `--color-primary` |
| `spacing.sm` | `--spacing-sm` |
| `typography.size-base` | `--typography-size-base` |

Names: `--{category}-{key}` verbatim. Never prefixed.

### Class naming

| Type | Pattern | Example | With prefix `h` |
|---|---|---|---|
| Component base | `.{name}` | `.btn` | `.h-btn` |
| Component variant | `.{name}-{variant}` | `.btn-primary` | `.h-btn-primary` |
| Spacing utility | `.{prop}-{tokenKey}` | `.mx-sm`, `.p-md` | `.h-mx-sm` |
| Display utility | `.{display}` | `.flex`, `.hidden` | `.h-flex` |
| Responsive (display only) | `.{bp}\:{utility}` | `.md\:flex` | `.h-md\:flex` |
| Animation helper | `.animate-{name}` | `.animate-fade-in` | `.h-animate-fade-in` |

Component/variant names and token keys: used verbatim from config. Developers must use kebab-case.

### Default values

| Field | Default |
|---|---|
| `output.outputDir` | `"holi-dist"` (relative to config file's directory) |
| `output.prefix` | `""` (no prefix) |
| `output.utilities` | `true` |

---

## Out of Scope (Phases 3–6)

- Vite plugin, Webpack plugin
- VS Code extension
- Holi Studio (React playground)
- CDN default.css build
- npm publishing

---

## Success Criteria

- [ ] `npm run build -w packages/shared` produces `dist/index.d.ts` with no TypeScript errors
- [ ] `npm run build -w packages/schema` produces `dist/index.js` and `dist/index.d.ts`
- [ ] `npm install` at monorepo root resolves all workspace deps cleanly
- [ ] `npm run build -w packages/core` produces `dist/index.js`, `dist/index.cjs`, `dist/index.browser.js`, `dist/index.d.ts`, `dist/index.browser.d.ts`
- [ ] `npm test` (unit + integration, excludes browser entry test) — all pass
- [ ] `npm run test:browser` (after build) — `compileFromObject({ tokens: { color: { primary: '#fff' } } })` returns `EmitResult` with `tokens.css` containing `--color-primary: #fff`
- [ ] `npm run build -w packages/cli` produces `dist/index.js`
- [ ] `node packages/cli/dist/index.js init` in a temp dir creates `holi.config.json`
- [ ] `node packages/cli/dist/index.js build` compiles that config and writes files to `holi-dist/`
- [ ] `holi-dist/tokens.css` contains `:root { --color-primary: #6366F1; ... }`
- [ ] `holi-dist/btn.css` contains `.btn { ... }` and `.btn-primary { background: #6366F1; color: #fff; }` with resolved token values (no dot-notation refs)
- [ ] `holi-dist/utilities.css` contains `.flex { display: flex; }` and `@media (min-width: 768px) { .md\:flex { display: flex; } }`
- [ ] `holi-dist/animations.css` contains `@keyframes holi-fade-in { ... }` and `.animate-fade-in { animation-name: holi-fade-in; ... }`
