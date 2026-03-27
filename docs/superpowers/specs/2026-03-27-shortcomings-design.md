# Holi Shortcomings — Full Resolution Design

> Date: 2026-03-27
> Scope: All 7 priorities + medium items from shortcomings-to-conquer.md
> VS Code extension: deferred to a later phase

---

## Constraints

- **Backward compatible** — existing `holi.json` configs work without changes
- **Additive** — all new features are opt-in via new keys
- **Both config formats** — `holi.config.ts` and `holi.json` supported side-by-side
- **Option A resolver** — resolver is mode-aware; emitter stays dumb

---

## Section 1 — Type System (`@holi.dev/shared`)

### `HoliConfig` additions

```ts
export interface ComponentConfig {
  base: TokenMap;
  variants?: { [variantName: string]: TokenMap };

  // Priority 1 — pseudo-class / state support
  states?: {
    hover?:       TokenMap;
    focus?:       TokenMap;
    active?:      TokenMap;
    disabled?:    TokenMap;
    checked?:     TokenMap;
    invalid?:     TokenMap;
    placeholder?: TokenMap;  // ::placeholder
    before?:      TokenMap;  // ::before
    after?:       TokenMap;  // ::after
  };

  // Priority 2 — responsive breakpoints per component
  responsive?: { [breakpoint: string]: TokenMap };

  // Priority 7 — compound variants
  compoundVariants?: Array<{
    when: Record<string, string>;
    css:  TokenMap;
  }>;
}

export interface HoliConfig {
  tokens: {
    color?:      NestedTokenMap;  // now supports arbitrary depth
    spacing?:    NestedTokenMap;
    typography?: NestedTokenMap;
    radius?:     NestedTokenMap;
    shadow?:     NestedTokenMap;
    z?:          NestedTokenMap;  // z-index
    opacity?:    NestedTokenMap;
    transition?: NestedTokenMap;
    blur?:       NestedTokenMap;
    [key: string]: NestedTokenMap | undefined;
  };
  breakpoints?: TokenMap;

  components?: { [name: string]: ComponentConfig };

  // Priority 2 — responsive utilities
  utilities?: {
    [name: string]: {
      base:        TokenMap;
      responsive?: { [breakpoint: string]: TokenMap };
    };
  };

  animations?: { /* unchanged */ };

  // Priority 3 — CSS custom properties mode + themes
  output?: {
    outputDir?:      string;
    prefix?:         string;
    utilities?:      boolean;
    mode?:           'inline' | 'variables';  // default: 'inline'
    include?:        string[];                // tree-shaking: only emit listed components
    themeStrategy?:  'media' | 'class';       // default: 'media' (prefers-color-scheme)
  };

  themes?: {
    [themeName: string]: {
      [category: string]: TokenMap;
    };
  };
}

// HoliConfigFile is the raw input read by the loader (includes extends).
// The loader strips `extends`, merges base configs, and passes HoliConfig to the pipeline.
// The schema validates HoliConfig (no extends key).
export interface HoliConfigFile extends HoliConfig {
  extends?: string | string[];
}

// Supports arbitrary nesting: { semantic: { color: { primary: '#6366f1' } } }
export type NestedTokenMap = { [key: string]: string | NestedTokenMap };
export type TokenMap = { [key: string]: string };
```

---

## Section 2 — Schema (`@holi.dev/schema`)

The JSON Schema (`schema.ts`) is expanded to mirror the new type shape:

- `components[name]` gains `states`, `responsive`, `compoundVariants` properties
- `output` gains `mode` (enum: `"inline"`, `"variables"`) and `include` (array of strings)
- `themes` top-level key added
- `utilities` top-level key added
- Token category values allow nested objects (not just `additionalProperties: { type: 'string' }`)
- New standard token categories: `shadow`, `z`, `opacity`, `transition`, `blur`

---

## Section 3 — Resolver (`packages/core/src/resolver.ts`)

### Mode-aware resolution

```ts
export function resolve(
  config: HoliConfig,
  mode: 'inline' | 'variables' = 'inline',
): ResolvedConfig
```

- `mode === 'inline'` — current behaviour: token ref `{color.primary}` → `#6366f1`
- `mode === 'variables'` — token ref `{color.primary}` → `var(--color-primary)`

Raw string literals (e.g. hardcoded `#fff`, `16px`) are never substituted regardless of mode.

### Arbitrary token depth

`flattenTokens` walks nested objects recursively. Each level of nesting joins with `-`:

```
{ semantic: { color: { primary: '#6366f1' } } }
→ tokenMap['semantic.color.primary'] = '#6366f1'
→ CSS var: --semantic-color-primary
→ var(): var(--semantic-color-primary)
```

Token references use dot notation: `{semantic.color.primary}`.

### Error messages with location context

When a token reference cannot be resolved, the resolver throws with full context and a did-you-mean suggestion (Levenshtein distance):

```
Unknown token "color.priamry" in components.button.base
  → Did you mean "color.primary"?
```

The resolver tracks the current `location` string (e.g. `components.button.base`) and passes it into error construction.

---

## Section 4 — Emitter (`packages/core/src/emitter.ts`)

### New emit functions

All new functions are additive — `emitComponent` calls them in sequence.

#### `emitStates(name, states, prefix)`

Emits pseudo-class and pseudo-element rules:

```css
.button:hover   { background: var(--color-primaryHover); }
.button:focus   { outline: 2px solid var(--color-primary); }
.button::before { content: ''; }
/* also: :active, :disabled, :checked, :invalid, ::placeholder, ::after */
```

Variant states also emitted:
```css
.button--primary:hover { background: var(--color-primaryHover); }
```

#### `emitResponsive(name, responsive, breakpoints, prefix)`

Emits `@media (min-width: ...)` blocks. All queries use `min-width` (mobile-first).

```css
@media (min-width: 768px) { .container { max-width: 768px; margin: 0 auto; } }
@media (min-width: 1024px) { .container { max-width: 1024px; } }
```

#### `emitCompoundVariants(name, compoundVariants, prefix)`

Compound condition selector: applied when all `when` conditions match (class co-presence):

```css
/* when: { size: 'lg', variant: 'primary' } */
.button--lg.button--primary { font-weight: 700; letter-spacing: 0.05em; }
```

#### `emitThemes(themes, outputMode)`

- `prefers-color-scheme` mode (default):
  ```css
  @media (prefers-color-scheme: dark) { :root { --color-primary: #818cf8; } }
  ```
- Class-based mode (opt-in via `output.themeStrategy: 'class'`):
  ```css
  .dark { --color-primary: #818cf8; }
  ```

#### Tree-shaking via `output.include`

At the top of `emitComponents`, skip any component name not in `output.include` (when the array is defined). If `include` is absent or empty, emit all components.

### Emit result structure

`emit()` returns one CSS file per component (unchanged), plus:
- `tokens.css` — `:root {}` block
- `utilities.css` — spacing + display utilities + custom utilities with responsive variants
- `animations.css` — keyframes
- `themes.css` — theme overrides (only when `themes` is defined)

---

## Section 5 — TypeScript Config + CLI (`@holi.dev/cli`)

### Config file resolution order

The CLI probes in this order, first match wins:

1. `holi.config.ts`
2. `holi.config.js`
3. `holi.config.mjs`
4. `holi.json`

### TS loader

Uses `jiti` for zero-config TypeScript execution (same approach as Vite, Tailwind):

```ts
// packages/cli/src/config-loader.ts
export async function loadConfig(cwd: string): Promise<HoliConfig> {
  for (const candidate of ['holi.config.ts', 'holi.config.js', 'holi.config.mjs']) {
    const p = resolve(cwd, candidate);
    if (existsSync(p)) {
      const mod = jiti(cwd)(p);
      const raw = mergeExtends(mod.default ?? mod, cwd);
      return raw as HoliConfig;
    }
  }
  // fallback
  const jsonPath = resolve(cwd, 'holi.json');
  return JSON.parse(readFileSync(jsonPath, 'utf8')) as HoliConfig;
}
```

### `defineConfig` helper

Exported from `@holi.dev/core` — typed pass-through, zero runtime cost:

```ts
export function defineConfig(config: HoliConfig): HoliConfig {
  return config;
}
```

### Config splitting / extends

`defineConfig` accepts an optional `extends` key. The loader strips it before passing to the pipeline and deep-merges the resolved base configs:

- `tokens`, `components`, `animations`, `themes` — deep merged
- `output`, `breakpoints` — shallow merged (child wins)

```ts
export default defineConfig({
  extends: ['./tokens/primitives', './tokens/semantic'],
  output: { mode: 'variables' },
});
```

### W3C DTCG import CLI command

New subcommand `holi import`:

```bash
holi import --from figma-tokens.json --format dtcg
```

Reads the W3C Design Tokens Community Group JSON format (standard Figma/Tokens Studio export), converts to `HoliConfig` shape, writes `holi.config.ts`. Isolated from the compilation pipeline — no effect on build or watch.

---

## Section 6 — Build Plugins

Three new packages under `packages/`. Each is a thin adapter calling `loadConfig()` + `compileFromObject()` — no compilation logic lives in the plugins.

### `@holi.dev/vite` (`packages/vite/`)

```ts
import { holiPlugin } from '@holi.dev/vite';
export default { plugins: [holiPlugin()] };
```

- Startup: loads config, compiles, writes CSS to `outputDir`
- Watch: hooks `handleHotUpdate` — recompiles on config file change, triggers Vite HMR CSS reload
- Virtual module `virtual:holi` — imports all emitted CSS in one statement
- Uses Vite's `configureServer` + `handleHotUpdate` plugin hooks

### `@holi.dev/postcss` (`packages/postcss/`)

```js
module.exports = { plugins: [require('@holi.dev/postcss')()] };
```

- Standard PostCSS plugin with a `Once` handler
- Loads config, compiles, injects all emitted CSS as prepended nodes in the processed file
- Works with webpack, Parcel, Rollup, or any PostCSS-consuming pipeline
- No watch mode needed — PostCSS re-runs on each bundler rebuild

### `@holi.dev/webpack` (`packages/webpack/`)

```js
const { HoliWebpackPlugin } = require('@holi.dev/webpack');
module.exports = { plugins: [new HoliWebpackPlugin()] };
```

- Hooks `compiler.hooks.thisCompilation` — runs `compileFromObject`, emits each CSS file as a webpack asset via `compilation.emitAsset()`
- Adds `holi.config.ts` / `holi.json` to webpack's watched file dependency list for automatic rebuild on change

---

## Deferred

- VS Code extension (token autocomplete, hover preview, inline validation) — later phase

---

## Affected files summary

| Package | Files changed / created |
|---|---|
| `@holi.dev/shared` | `src/index.ts` — adds `HoliConfigFile`, `ComponentConfig`, `NestedTokenMap`, updates `HoliConfig` |
| `@holi.dev/schema` | `src/schema.ts` |
| `@holi.dev/core` | `src/resolver.ts`, `src/emitter.ts`, `src/index.ts` (defineConfig) |
| `@holi.dev/cli` | `src/config-loader.ts` (new), `src/commands/build.ts`, `src/commands/watch.ts`, `src/index.ts` |
| `@holi.dev/vite` | new package |
| `@holi.dev/postcss` | new package |
| `@holi.dev/webpack` | new package |
| Tests | `packages/core/tests/emitter.test.ts`, `resolver.test.ts`, new integration tests |
