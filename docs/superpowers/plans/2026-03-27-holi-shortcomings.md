# Holi Shortcomings — Full Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 7 priorities + medium items: pseudo-class states, responsive breakpoints, CSS variables mode, TS config with jiti, config extends, DTCG import, compound variants, tree-shaking, error messages with location, arbitrary token depth, and Vite/PostCSS/webpack plugins.

**Architecture:** Option A resolver — resolver is mode-aware (`inline`/`variables`), emitter stays dumb about modes. New emitter features (states, responsive, themes, compound variants) are isolated functions called from `emitComponent`. Config loading (jiti for TS) lives in `@holi.dev/core`. Three new thin adapter packages wrap core.

**Tech Stack:** TypeScript 6, vitest, tsup, jiti v2 (TS config loader), npm workspaces

---

## File Map

**Modified:**
- `packages/shared/src/index.ts` — add `NestedTokenMap`, `ComponentConfig`, `HoliConfigFile`; expand `HoliConfig`
- `packages/schema/src/schema.ts` — add states, responsive, compoundVariants, utilities, themes, themeStrategy
- `packages/core/src/resolver.ts` — recursive flattenTokens, mode-aware resolveValue, location tracking
- `packages/core/src/emitter.ts` — hook new functions into emitComponent; add emitCompoundVariants; update emitComponents (tree-shaking, breakpoints) and emitUtilities (custom utilities); update emit()
- `packages/core/src/index.ts` — export defineConfig; update compile/compileAndWrite to use loadConfig
- `packages/cli/src/commands/build.ts` — use cwd-based compileAndWrite
- `packages/cli/src/commands/watch.ts` — watch all config file candidates
- `packages/cli/src/index.ts` — add `holi import` command

**Created:**
- `packages/core/src/errors.ts` — `HoliResolverError`
- `packages/core/src/did-you-mean.ts` — `levenshtein`, `findClosest`
- `packages/core/src/states-emitter.ts` — `emitStates`
- `packages/core/src/responsive-emitter.ts` — `emitResponsive`
- `packages/core/src/themes-emitter.ts` — `emitThemes`
- `packages/core/src/config-loader.ts` — `loadConfig`, `mergeExtends`, `deepMergeConfig`
- `packages/core/tests/states-emitter.test.ts`
- `packages/core/tests/responsive-emitter.test.ts`
- `packages/core/tests/themes-emitter.test.ts`
- `packages/cli/src/commands/import.ts` — DTCG converter + writer
- `packages/vite/package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`
- `packages/postcss/package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`
- `packages/webpack/package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`

---

## Task 1: Expand types in `@holi.dev/shared`

**Files:**
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Replace the contents of `packages/shared/src/index.ts`**

```ts
export type TokenMap = { [key: string]: string };
export type NestedTokenMap = { [key: string]: string | NestedTokenMap };

export interface ComponentConfig {
  base: TokenMap;
  variants?: { [variantName: string]: TokenMap };
  states?: {
    hover?:       TokenMap;
    focus?:       TokenMap;
    active?:      TokenMap;
    disabled?:    TokenMap;
    checked?:     TokenMap;
    invalid?:     TokenMap;
    placeholder?: TokenMap;
    before?:      TokenMap;
    after?:       TokenMap;
  };
  responsive?: { [breakpoint: string]: TokenMap };
  compoundVariants?: Array<{ when: Record<string, string>; css: TokenMap }>;
}

export interface HoliConfig {
  tokens: {
    color?:      NestedTokenMap;
    spacing?:    NestedTokenMap;
    typography?: NestedTokenMap;
    radius?:     NestedTokenMap;
    shadow?:     NestedTokenMap;
    z?:          NestedTokenMap;
    opacity?:    NestedTokenMap;
    transition?: NestedTokenMap;
    blur?:       NestedTokenMap;
    [key: string]: NestedTokenMap | undefined;
  };
  breakpoints?: TokenMap;
  components?: { [name: string]: ComponentConfig };
  utilities?: {
    [name: string]: { base: TokenMap; responsive?: { [bp: string]: TokenMap } };
  };
  animations?: {
    [name: string]: {
      keyframes: { [stop: string]: TokenMap };
      duration?:  string;
      easing?:    string;
      fillMode?:  string;
    };
  };
  output?: {
    outputDir?:     string;
    prefix?:        string;
    utilities?:     boolean;
    mode?:          'inline' | 'variables';
    include?:       string[];
    themeStrategy?: 'media' | 'class';
  };
  themes?: {
    [themeName: string]: { [category: string]: TokenMap };
  };
}

// HoliConfigFile is what the loader reads (includes extends).
// The loader strips extends, merges base configs, then passes HoliConfig to the pipeline.
export interface HoliConfigFile extends HoliConfig {
  extends?: string | string[];
}

export type ResolvedConfig = HoliConfig;
export type EmitResult = Record<string, string>;
```

- [ ] **Step 2: Build shared**

```bash
cd "E:/Holi Project" && npm run build -w packages/shared
```

Expected: no errors, `packages/shared/dist/index.d.ts` updated.

- [ ] **Step 3: Commit**

```bash
cd "E:/Holi Project" && git add packages/shared/src/index.ts && git commit -m "feat(shared): expand types — ComponentConfig, NestedTokenMap, HoliConfigFile, output.mode/include/themeStrategy, themes, utilities"
```

---

## Task 2: Expand JSON Schema in `@holi.dev/schema`

**Files:**
- Modify: `packages/schema/src/schema.ts`

- [ ] **Step 1: Replace `packages/schema/src/schema.ts`**

```ts
const nestedStringValues = {
  anyOf: [
    { type: 'object', additionalProperties: { type: 'string' } },
    {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'string' },
          { type: 'object', additionalProperties: { type: 'string' } },
        ],
      },
    },
  ],
} as const;

const tokenMapSchema = {
  type: 'object',
  additionalProperties: { type: 'string' },
} as const;

const componentSchema = {
  type: 'object',
  required: ['base'],
  additionalProperties: false,
  properties: {
    base:     tokenMapSchema,
    variants: { type: 'object', additionalProperties: tokenMapSchema },
    states: {
      type: 'object',
      additionalProperties: false,
      properties: {
        hover:       tokenMapSchema,
        focus:       tokenMapSchema,
        active:      tokenMapSchema,
        disabled:    tokenMapSchema,
        checked:     tokenMapSchema,
        invalid:     tokenMapSchema,
        placeholder: tokenMapSchema,
        before:      tokenMapSchema,
        after:       tokenMapSchema,
      },
    },
    responsive: { type: 'object', additionalProperties: tokenMapSchema },
    compoundVariants: {
      type: 'array',
      items: {
        type: 'object',
        required: ['when', 'css'],
        additionalProperties: false,
        properties: {
          when: { type: 'object', additionalProperties: { type: 'string' } },
          css:  tokenMapSchema,
        },
      },
    },
  },
} as const;

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['tokens'],
  additionalProperties: false,
  properties: {
    tokens: {
      type: 'object',
      additionalProperties: nestedStringValues,
    },
    breakpoints: tokenMapSchema,
    components: {
      type: 'object',
      additionalProperties: componentSchema,
    },
    utilities: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['base'],
        additionalProperties: false,
        properties: {
          base:       tokenMapSchema,
          responsive: { type: 'object', additionalProperties: tokenMapSchema },
        },
      },
    },
    animations: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['keyframes'],
        additionalProperties: false,
        properties: {
          keyframes: { type: 'object', additionalProperties: tokenMapSchema },
          duration:  { type: 'string' },
          easing:    { type: 'string' },
          fillMode:  { type: 'string' },
        },
      },
    },
    themes: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: tokenMapSchema,
      },
    },
    output: {
      type: 'object',
      additionalProperties: false,
      properties: {
        outputDir:     { type: 'string' },
        prefix:        { type: 'string' },
        utilities:     { type: 'boolean' },
        mode:          { type: 'string', enum: ['inline', 'variables'] },
        include:       { type: 'array', items: { type: 'string' } },
        themeStrategy: { type: 'string', enum: ['media', 'class'] },
      },
    },
  },
} as const;
```

- [ ] **Step 2: Build schema**

```bash
cd "E:/Holi Project" && npm run build -w packages/schema
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "E:/Holi Project" && git add packages/schema/src/schema.ts && git commit -m "feat(schema): add states, responsive, compoundVariants, utilities, themes, output.mode/include/themeStrategy"
```

---

## Task 3: Add `HoliResolverError` + did-you-mean helper

**Files:**
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/src/did-you-mean.ts`
- Create: `packages/core/tests/did-you-mean.test.ts`

- [ ] **Step 1: Create `packages/core/src/errors.ts`**

```ts
export class HoliResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HoliResolverError';
  }
}
```

- [ ] **Step 2: Create `packages/core/src/did-you-mean.ts`**

```ts
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function findClosest(ref: string, candidates: string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(ref, c);
    if (d < bestDist && d <= 3) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
```

- [ ] **Step 3: Write failing tests**

Create `packages/core/tests/did-you-mean.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { levenshtein, findClosest } from '../src/did-you-mean';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('color.primary', 'color.primary')).toBe(0);
  });

  it('returns 1 for a single typo', () => {
    expect(levenshtein('color.priamry', 'color.primary')).toBe(2);
  });

  it('returns correct distance for unrelated strings', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
  });
});

describe('findClosest', () => {
  const candidates = ['color.primary', 'color.secondary', 'spacing.sm'];

  it('finds the closest match within 3 edits', () => {
    expect(findClosest('color.priamry', candidates)).toBe('color.primary');
  });

  it('returns null when no candidate is within 3 edits', () => {
    expect(findClosest('totally.different', candidates)).toBeNull();
  });

  it('returns null for empty candidates', () => {
    expect(findClosest('color.primary', [])).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/did-you-mean.test.ts
```

Expected: FAIL — `did-you-mean` not found.

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/did-you-mean.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/errors.ts packages/core/src/did-you-mean.ts packages/core/tests/did-you-mean.test.ts && git commit -m "feat(core): add HoliResolverError and did-you-mean helper"
```

---

## Task 4: Mode-aware resolver + deep token flattening + location errors

**Files:**
- Modify: `packages/core/src/resolver.ts`
- Modify: `packages/core/tests/resolver.test.ts`

- [ ] **Step 1: Add new tests to `packages/core/tests/resolver.test.ts`**

Add these describe blocks at the end of the existing file:

```ts
describe('flattenTokens — deep nesting', () => {
  it('flattens three-level nesting to dot-separated keys', () => {
    const result = flattenTokens({
      semantic: { color: { interactive: { default: '#6366f1' } } } as any,
    });
    expect(result['semantic.color.interactive.default']).toBe('#6366f1');
  });
});

describe('resolveValue — mode: variables', () => {
  it('resolves a direct token ref to var()', () => {
    expect(resolveValue('color.primary', tokenMap, 'variables')).toBe('var(--color-primary)');
  });

  it('resolves embedded refs to var() in compound value', () => {
    expect(resolveValue('spacing.sm spacing.md', tokenMap, 'variables')).toBe(
      'var(--spacing-sm) var(--spacing-md)',
    );
  });

  it('emits var() for unknown refs in variables mode', () => {
    expect(resolveValue('spacing.sm unknown.ref', tokenMap, 'variables')).toBe(
      'var(--spacing-sm) var(--unknown-ref)',
    );
  });
});

describe('resolveValue — error messages', () => {
  it('throws with location context for unknown refs in inline mode', () => {
    expect(() =>
      resolveValue('color.priamry', tokenMap, 'inline', 'components.button.base'),
    ).toThrow('Unknown token "color.priamry" in components.button.base');
  });

  it('includes did-you-mean suggestion for close typo', () => {
    expect(() =>
      resolveValue('color.priamry', tokenMap, 'inline', 'components.button.base'),
    ).toThrow('Did you mean "color.primary"');
  });
});

describe('resolve — mode: variables', () => {
  it('resolves component token refs to var() in variables mode', () => {
    const config: HoliConfig = {
      tokens: { color: { primary: '#6366F1' } },
      components: { btn: { base: { background: 'color.primary' } } },
    };
    const resolved = resolve(config, 'variables');
    expect(resolved.components!['btn'].base['background']).toBe('var(--color-primary)');
  });

  it('inline mode still resolves to raw values', () => {
    const config: HoliConfig = {
      tokens: { color: { primary: '#6366F1' } },
      components: { btn: { base: { background: 'color.primary' } } },
    };
    const resolved = resolve(config, 'inline');
    expect(resolved.components!['btn'].base['background']).toBe('#6366F1');
  });
});
```

Also update the existing partial-resolve test that will now throw:

```ts
// Replace this existing test:
// it('partially resolves embedded refs — unknown refs left verbatim', ...)
// With:
it('throws on unknown embedded ref in inline mode', () => {
  expect(() => resolveValue('spacing.sm unknown.ref', tokenMap, 'inline', 'test')).toThrow(
    'Unknown token "unknown.ref"',
  );
});
```

- [ ] **Step 2: Run to confirm new tests fail**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/resolver.test.ts
```

Expected: multiple failures on the new tests.

- [ ] **Step 3: Replace `packages/core/src/resolver.ts`**

```ts
import type { HoliConfig, ResolvedConfig } from '@holi.dev/shared';
import { HoliResolverError } from './errors';
import { findClosest } from './did-you-mean';

export { HoliResolverError };

export function flattenTokens(
  tokens: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (value === undefined || value === null) continue;
    const dotKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      map[dotKey] = value;
    } else if (typeof value === 'object') {
      Object.assign(map, flattenTokens(value as Record<string, unknown>, dotKey));
    }
  }
  return map;
}

export function resolveValue(
  value: string,
  tokenMap: Record<string, string>,
  mode: 'inline' | 'variables' = 'inline',
  location = '',
  depth = 0,
): string {
  if (depth > 10) {
    throw new HoliResolverError(`Circular token reference detected: "${value}"`);
  }

  // Direct reference: the whole value is a known token key
  if (tokenMap[value] !== undefined) {
    if (mode === 'variables') return `var(--${value.replace(/\./g, '-')})`;
    return resolveValue(tokenMap[value], tokenMap, mode, location, depth + 1);
  }

  // Embedded references within a compound value (e.g. "spacing.sm spacing.md")
  return value.replace(/([\w-]+\.)+[\w-]+/g, (ref) => {
    if (tokenMap[ref] !== undefined) {
      if (mode === 'variables') return `var(--${ref.replace(/\./g, '-')})`;
      return tokenMap[ref]!;
    }
    // Unknown reference
    if (mode === 'variables') return `var(--${ref.replace(/\./g, '-')})`;
    const hint = findClosest(ref, Object.keys(tokenMap));
    const suffix = hint ? `\n  → Did you mean "${hint}"?` : '';
    throw new HoliResolverError(`Unknown token "${ref}" in ${location}${suffix}`);
  });
}

function resolveObject(
  obj: unknown,
  tokenMap: Record<string, string>,
  mode: 'inline' | 'variables',
  location: string,
): unknown {
  if (typeof obj === 'string') return resolveValue(obj, tokenMap, mode, location);
  if (Array.isArray(obj))
    return obj.map((item, i) => resolveObject(item, tokenMap, mode, `${location}[${i}]`));
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveObject(
        val,
        tokenMap,
        mode,
        location ? `${location}.${key}` : key,
      );
    }
    return result;
  }
  return obj;
}

export function resolve(
  config: HoliConfig,
  mode: 'inline' | 'variables' = 'inline',
): ResolvedConfig {
  const tokenMap = flattenTokens(config.tokens as Record<string, unknown>);
  return resolveObject(config, tokenMap, mode, '') as ResolvedConfig;
}
```

- [ ] **Step 4: Run tests**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/resolver.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run the full test suite**

```bash
cd "E:/Holi Project" && npm test
```

Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/resolver.ts packages/core/tests/resolver.test.ts && git commit -m "feat(core/resolver): mode-aware resolution, deep token nesting, location error messages"
```

---

## Task 5: `emitStates`

**Files:**
- Create: `packages/core/src/states-emitter.ts`
- Create: `packages/core/tests/states-emitter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/states-emitter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emitStates } from '../src/states-emitter';

describe('emitStates', () => {
  it('emits :hover pseudo-class', () => {
    const css = emitStates('button', { hover: { background: '#818cf8' } });
    expect(css).toContain('.button:hover {');
    expect(css).toContain('background: #818cf8');
  });

  it('emits :focus pseudo-class', () => {
    const css = emitStates('button', { focus: { outline: '2px solid #6366f1' } });
    expect(css).toContain('.button:focus {');
    expect(css).toContain('outline: 2px solid #6366f1');
  });

  it('emits :disabled pseudo-class', () => {
    const css = emitStates('button', { disabled: { opacity: '0.5' } });
    expect(css).toContain('.button:disabled {');
  });

  it('emits ::before pseudo-element with double colon', () => {
    const css = emitStates('button', { before: { content: '""' } });
    expect(css).toContain('.button::before {');
    expect(css).not.toContain('.button:before {');
  });

  it('emits ::after pseudo-element with double colon', () => {
    const css = emitStates('button', { after: { display: 'block' } });
    expect(css).toContain('.button::after {');
  });

  it('emits ::placeholder pseudo-element with double colon', () => {
    const css = emitStates('input', { placeholder: { color: '#9ca3af' } });
    expect(css).toContain('.input::placeholder {');
  });

  it('applies prefix to selector', () => {
    const css = emitStates('button', { hover: { background: '#fff' } }, 'h');
    expect(css).toContain('.h-button:hover {');
  });

  it('returns empty string when states is empty', () => {
    expect(emitStates('button', {})).toBe('');
  });

  it('emits multiple state rules', () => {
    const css = emitStates('button', {
      hover:  { background: '#818cf8' },
      active: { transform: 'scale(0.98)' },
    });
    expect(css).toContain('.button:hover {');
    expect(css).toContain('.button:active {');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/states-emitter.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `packages/core/src/states-emitter.ts`**

```ts
import type { ComponentConfig } from '@holi.dev/shared';

const PSEUDO_ELEMENTS = new Set(['before', 'after', 'placeholder']);

function applyPrefix(className: string, prefix: string): string {
  if (!prefix) return className;
  return `.${prefix}-${className.slice(1)}`;
}

export function emitStates(
  name: string,
  states: NonNullable<ComponentConfig['states']>,
  prefix = '',
): string {
  const lines: string[] = [];
  for (const [state, rules] of Object.entries(states)) {
    if (!rules || Object.keys(rules).length === 0) continue;
    const pseudo = PSEUDO_ELEMENTS.has(state) ? `::${state}` : `:${state}`;
    const selector = `${applyPrefix(`.${name}`, prefix)}${pseudo}`;
    const decls = Object.entries(rules)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    lines.push(`${selector} {\n${decls}\n}`);
  }
  return lines.length ? lines.join('\n') + '\n' : '';
}
```

- [ ] **Step 4: Run tests**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/states-emitter.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/states-emitter.ts packages/core/tests/states-emitter.test.ts && git commit -m "feat(core): add emitStates for pseudo-class and pseudo-element support"
```

---

## Task 6: `emitResponsive`

**Files:**
- Create: `packages/core/src/responsive-emitter.ts`
- Create: `packages/core/tests/responsive-emitter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/responsive-emitter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emitResponsive } from '../src/responsive-emitter';

const breakpoints = { sm: '640px', md: '768px', lg: '1024px' };

describe('emitResponsive', () => {
  it('emits @media min-width block for a breakpoint', () => {
    const css = emitResponsive('container', { md: { 'max-width': '768px' } }, breakpoints);
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.container');
    expect(css).toContain('max-width: 768px');
  });

  it('emits multiple breakpoints in separate @media blocks', () => {
    const css = emitResponsive(
      'container',
      { md: { 'max-width': '768px' }, lg: { 'max-width': '1024px' } },
      breakpoints,
    );
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('@media (min-width: 1024px)');
  });

  it('applies prefix to selector', () => {
    const css = emitResponsive('container', { md: { width: '100%' } }, breakpoints, 'h');
    expect(css).toContain('.h-container');
  });

  it('skips unknown breakpoint names', () => {
    const css = emitResponsive('box', { xl: { padding: '2rem' } }, breakpoints);
    expect(css).toBe('');
  });

  it('returns empty string for empty responsive map', () => {
    expect(emitResponsive('box', {}, breakpoints)).toBe('');
  });

  it('emits multiple declarations inside the media block', () => {
    const css = emitResponsive(
      'container',
      { md: { 'max-width': '768px', 'margin': '0 auto' } },
      breakpoints,
    );
    expect(css).toContain('max-width: 768px');
    expect(css).toContain('margin: 0 auto');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/responsive-emitter.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `packages/core/src/responsive-emitter.ts`**

```ts
import type { TokenMap } from '@holi.dev/shared';

function applyPrefix(className: string, prefix: string): string {
  if (!prefix) return className;
  return `.${prefix}-${className.slice(1)}`;
}

export function emitResponsive(
  name: string,
  responsive: Record<string, TokenMap>,
  breakpoints: Record<string, string>,
  prefix = '',
): string {
  const blocks: string[] = [];
  for (const [bp, rules] of Object.entries(responsive)) {
    const minWidth = breakpoints[bp];
    if (!minWidth || Object.keys(rules).length === 0) continue;
    const selector = applyPrefix(`.${name}`, prefix);
    const decls = Object.entries(rules)
      .map(([k, v]) => `    ${k}: ${v};`)
      .join('\n');
    blocks.push(`@media (min-width: ${minWidth}) {\n  ${selector} {\n${decls}\n  }\n}`);
  }
  return blocks.length ? blocks.join('\n') + '\n' : '';
}
```

- [ ] **Step 4: Run tests**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/responsive-emitter.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/responsive-emitter.ts packages/core/tests/responsive-emitter.test.ts && git commit -m "feat(core): add emitResponsive for mobile-first breakpoint support"
```

---

## Task 7: `emitThemes`

**Files:**
- Create: `packages/core/src/themes-emitter.ts`
- Create: `packages/core/tests/themes-emitter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/themes-emitter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emitThemes } from '../src/themes-emitter';

describe('emitThemes', () => {
  it('emits prefers-color-scheme media query for dark theme by default', () => {
    const css = emitThemes({ dark: { color: { primary: '#818cf8' } } });
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #818cf8');
  });

  it('emits class selector in class strategy', () => {
    const css = emitThemes({ dark: { color: { primary: '#818cf8' } } }, 'class');
    expect(css).toContain('.dark {');
    expect(css).toContain('--color-primary: #818cf8');
    expect(css).not.toContain('@media');
  });

  it('emits class selector for non-dark themes in media strategy', () => {
    const css = emitThemes({ brand: { color: { primary: '#e11d48' } } }, 'media');
    expect(css).toContain('.brand {');
    expect(css).toContain('--color-primary: #e11d48');
  });

  it('emits multiple token overrides', () => {
    const css = emitThemes({
      dark: { color: { primary: '#818cf8', surface: '#0f172a' } },
    });
    expect(css).toContain('--color-primary: #818cf8');
    expect(css).toContain('--color-surface: #0f172a');
  });

  it('returns empty string when themes is undefined', () => {
    expect(emitThemes(undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/themes-emitter.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `packages/core/src/themes-emitter.ts`**

```ts
import type { HoliConfig } from '@holi.dev/shared';

export function emitThemes(
  themes: HoliConfig['themes'],
  strategy: 'media' | 'class' = 'media',
): string {
  if (!themes || Object.keys(themes).length === 0) return '';
  const blocks: string[] = [];

  for (const [name, overrides] of Object.entries(themes)) {
    const vars = Object.entries(overrides)
      .flatMap(([category, values]) =>
        Object.entries(values ?? {}).map(
          ([key, value]) => `  --${category}-${key}: ${value};`,
        ),
      )
      .join('\n');

    if (strategy === 'class') {
      blocks.push(`.${name} {\n${vars}\n}`);
    } else if (name === 'dark') {
      blocks.push(
        `@media (prefers-color-scheme: dark) {\n  :root {\n${vars
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')}\n  }\n}`,
      );
    } else {
      blocks.push(`.${name} {\n${vars}\n}`);
    }
  }

  return blocks.join('\n') + '\n';
}
```

- [ ] **Step 4: Run tests**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/themes-emitter.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/themes-emitter.ts packages/core/tests/themes-emitter.test.ts && git commit -m "feat(core): add emitThemes for dark mode and multi-brand theme support"
```

---

## Task 8: Update `emitter.ts` — wire new features + compound variants + tree-shaking + custom utilities

**Files:**
- Modify: `packages/core/src/emitter.ts`
- Modify: `packages/core/tests/emitter.test.ts`

- [ ] **Step 1: Add failing tests to `packages/core/tests/emitter.test.ts`**

Add these describe blocks at the end of the existing file:

```ts
describe('emitComponent — states', () => {
  it('emits hover state when states.hover defined', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      states: { hover: { background: '#818cf8' } },
    });
    expect(css).toContain('.btn:hover {');
    expect(css).toContain('background: #818cf8');
  });

  it('emits ::before pseudo-element', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      states: { before: { content: '""' } },
    });
    expect(css).toContain('.btn::before {');
  });
});

describe('emitComponent — responsive', () => {
  it('emits @media block when responsive defined', () => {
    const css = emitComponent(
      'container',
      { base: { width: '100%' }, responsive: { md: { 'max-width': '768px' } } },
      '',
      { md: '768px' },
    );
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.container');
    expect(css).toContain('max-width: 768px');
  });
});

describe('emitComponent — compoundVariants', () => {
  it('emits selector combining all when conditions', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      variants: { lg: { 'font-size': '1.125rem' }, primary: { background: '#6366f1' } },
      compoundVariants: [
        { when: { size: 'lg', variant: 'primary' }, css: { 'font-weight': '700' } },
      ],
    });
    expect(css).toContain('.btn-lg.btn-primary {');
    expect(css).toContain('font-weight: 700');
  });
});

describe('emitComponents — tree-shaking', () => {
  it('only emits components listed in include', () => {
    const components = {
      btn: { base: { display: 'flex' } },
      card: { base: { padding: '16px' } },
    };
    const result = emitComponents(components, '', {}, ['btn']);
    expect(result).toHaveProperty('btn.css');
    expect(result).not.toHaveProperty('card.css');
  });

  it('emits all components when include is undefined', () => {
    const components = {
      btn: { base: { display: 'flex' } },
      card: { base: { padding: '16px' } },
    };
    const result = emitComponents(components, '', {}, undefined);
    expect(result).toHaveProperty('btn.css');
    expect(result).toHaveProperty('card.css');
  });
});

describe('emitUtilities — custom utilities', () => {
  it('emits custom utility base class', () => {
    const css = emitUtilities(
      { spacing: {} },
      { md: '768px' },
      true,
      '',
      { 'text-lg': { base: { 'font-size': '1.125rem' } } },
    );
    expect(css).toContain('.text-lg {');
    expect(css).toContain('font-size: 1.125rem');
  });

  it('emits responsive variant for custom utility', () => {
    const css = emitUtilities(
      { spacing: {} },
      { md: '768px' },
      true,
      '',
      { 'text-lg': { base: { 'font-size': '1rem' }, responsive: { md: { 'font-size': '1.125rem' } } } },
    );
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.text-lg');
    expect(css).toContain('font-size: 1.125rem');
  });
});

describe('emit — themes.css', () => {
  it('includes themes.css key when themes defined', () => {
    const config: ResolvedConfig = {
      tokens: {},
      themes: { dark: { color: { primary: '#818cf8' } } },
    };
    const result = emit(config);
    expect(result).toHaveProperty('themes.css');
    expect(result['themes.css']).toContain('--color-primary: #818cf8');
  });

  it('themes.css is empty string when no themes', () => {
    const config: ResolvedConfig = { tokens: {} };
    expect(emit(config)['themes.css']).toBe('');
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/emitter.test.ts
```

Expected: new tests fail.

- [ ] **Step 3: Replace `packages/core/src/emitter.ts`**

```ts
import type { ResolvedConfig, EmitResult, ComponentConfig, TokenMap } from '@holi.dev/shared';
import { emitStates } from './states-emitter';
import { emitResponsive } from './responsive-emitter';
import { emitThemes } from './themes-emitter';

const DISPLAY_UTILITIES: Record<string, string> = {
  flex:           'display: flex;',
  grid:           'display: grid;',
  block:          'display: block;',
  inline:         'display: inline;',
  'inline-flex':  'display: inline-flex;',
  'inline-block': 'display: inline-block;',
  hidden:         'display: none;',
};

function applyPrefix(className: string, prefix: string): string {
  if (!prefix) return className;
  return `.${prefix}-${className.slice(1)}`;
}

export function emitTokens(tokens: ResolvedConfig['tokens']): string {
  const vars = Object.entries(tokens)
    .flatMap(([category, values]) =>
      Object.entries(values ?? {}).map(
        ([key, value]) => `  --${category}-${key}: ${value};`,
      ),
    )
    .join('\n');
  return `:root {\n${vars}\n}\n`;
}

function emitCompoundVariants(
  name: string,
  compoundVariants: NonNullable<ComponentConfig['compoundVariants']>,
  prefix = '',
): string {
  const lines: string[] = [];
  for (const { when, css } of compoundVariants) {
    const selector = Object.values(when)
      .map((val) => applyPrefix(`.${name}-${val}`, prefix))
      .join('');
    const decls = Object.entries(css)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    lines.push(`${selector} {\n${decls}\n}`);
  }
  return lines.length ? lines.join('\n') + '\n' : '';
}

export function emitComponent(
  name: string,
  component: ComponentConfig,
  prefix = '',
  breakpoints: Record<string, string> = {},
): string {
  const cls = applyPrefix(`.${name}`, prefix);
  const baseRules = Object.entries(component.base)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');
  let css = `${cls} {\n${baseRules}\n}\n`;

  for (const [variantName, variantRules] of Object.entries(component.variants ?? {})) {
    const varCls = applyPrefix(`.${name}-${variantName}`, prefix);
    const rules = Object.entries(variantRules)
      .map(([prop, val]) => `  ${prop}: ${val};`)
      .join('\n');
    css += `\n${varCls} {\n${rules}\n}\n`;
  }

  if (component.states && Object.keys(component.states).length > 0) {
    css += emitStates(name, component.states, prefix);
  }

  if (component.responsive && Object.keys(component.responsive).length > 0) {
    css += emitResponsive(name, component.responsive, breakpoints, prefix);
  }

  if (component.compoundVariants && component.compoundVariants.length > 0) {
    css += emitCompoundVariants(name, component.compoundVariants, prefix);
  }

  return css;
}

export function emitComponents(
  components: ResolvedConfig['components'],
  prefix = '',
  breakpoints: Record<string, string> = {},
  include?: string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, component] of Object.entries(components ?? {})) {
    if (include && include.length > 0 && !include.includes(name)) continue;
    result[`${name}.css`] = emitComponent(name, component, prefix, breakpoints);
  }
  return result;
}

export function emitUtilities(
  tokens: ResolvedConfig['tokens'],
  breakpoints: ResolvedConfig['breakpoints'],
  emitFlag: boolean,
  prefix = '',
  customUtilities?: ResolvedConfig['utilities'],
): string {
  if (!emitFlag) return '';
  const lines: string[] = [];

  // Spacing utilities
  for (const [key, value] of Object.entries(tokens.spacing ?? {})) {
    const p = (cls: string) => applyPrefix(cls, prefix);
    lines.push(`${p(`.mx-${key}`)} { margin-left: ${value}; margin-right: ${value}; }`);
    lines.push(`${p(`.my-${key}`)} { margin-top: ${value}; margin-bottom: ${value}; }`);
    lines.push(`${p(`.mt-${key}`)} { margin-top: ${value}; }`);
    lines.push(`${p(`.mb-${key}`)} { margin-bottom: ${value}; }`);
    lines.push(`${p(`.ml-${key}`)} { margin-left: ${value}; }`);
    lines.push(`${p(`.mr-${key}`)} { margin-right: ${value}; }`);
    lines.push(`${p(`.p-${key}`)} { padding: ${value}; }`);
    lines.push(`${p(`.px-${key}`)} { padding-left: ${value}; padding-right: ${value}; }`);
    lines.push(`${p(`.py-${key}`)} { padding-top: ${value}; padding-bottom: ${value}; }`);
  }

  // Display utilities
  for (const [name, declaration] of Object.entries(DISPLAY_UTILITIES)) {
    lines.push(`${applyPrefix(`.${name}`, prefix)} { ${declaration} }`);
  }

  // Responsive breakpoint variants (display utilities)
  for (const [bp, minWidth] of Object.entries(breakpoints ?? {})) {
    lines.push(`\n@media (min-width: ${minWidth}) {`);
    for (const name of Object.keys(DISPLAY_UTILITIES)) {
      const cls = applyPrefix(`.${bp}\\:${name}`, prefix);
      lines.push(`  ${cls} { ${DISPLAY_UTILITIES[name]} }`);
    }
    lines.push('}');
  }

  // Custom utilities
  for (const [name, util] of Object.entries(customUtilities ?? {})) {
    const cls = applyPrefix(`.${name}`, prefix);
    const decls = Object.entries(util.base)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    lines.push(`${cls} {\n${decls}\n}`);
    for (const [bp, rules] of Object.entries(util.responsive ?? {})) {
      const minWidth = (breakpoints ?? {})[bp];
      if (!minWidth) continue;
      const rDecls = Object.entries(rules)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      lines.push(`@media (min-width: ${minWidth}) {\n${cls} {\n${rDecls}\n}\n}`);
    }
  }

  return lines.join('\n') + '\n';
}

export function emitAnimations(
  animations: ResolvedConfig['animations'],
  prefix = '',
): string {
  if (!animations) return '';
  const lines: string[] = [];
  for (const [name, anim] of Object.entries(animations)) {
    lines.push(`@keyframes holi-${name} {`);
    for (const [stop, props] of Object.entries(anim.keyframes)) {
      const rules = Object.entries(props).map(([p, v]) => `    ${p}: ${v};`).join('\n');
      lines.push(`  ${stop} {\n${rules}\n  }`);
    }
    lines.push('}');

    const helperCls = applyPrefix(`.animate-${name}`, prefix);
    lines.push(`${helperCls} {`);
    lines.push(`  animation-name: holi-${name};`);
    if (anim.duration)  lines.push(`  animation-duration: ${anim.duration};`);
    if (anim.easing)    lines.push(`  animation-timing-function: ${anim.easing};`);
    if (anim.fillMode)  lines.push(`  animation-fill-mode: ${anim.fillMode};`);
    lines.push('}');
  }
  return lines.join('\n') + '\n';
}

export function emit(config: ResolvedConfig): EmitResult {
  const prefix         = config.output?.prefix ?? '';
  const utilitiesFlag  = config.output?.utilities ?? true;
  const breakpoints    = config.breakpoints ?? {};
  const include        = config.output?.include;
  const themeStrategy  = config.output?.themeStrategy ?? 'media';

  return {
    'tokens.css':     emitTokens(config.tokens),
    ...emitComponents(config.components ?? {}, prefix, breakpoints, include),
    'utilities.css':  emitUtilities(config.tokens, breakpoints, utilitiesFlag, prefix, config.utilities),
    'animations.css': emitAnimations(config.animations, prefix),
    'themes.css':     emitThemes(config.themes, themeStrategy),
  };
}
```

- [ ] **Step 4: Run emitter tests**

```bash
cd "E:/Holi Project" && npx vitest run packages/core/tests/emitter.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd "E:/Holi Project" && npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/emitter.ts packages/core/tests/emitter.test.ts && git commit -m "feat(core/emitter): states, responsive, compound variants, tree-shaking, custom utilities, themes"
```

---

## Task 9: `defineConfig` + `loadConfig` (jiti) + update `compile`/`compileAndWrite`

**Files:**
- Create: `packages/core/src/config-loader.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`

- [ ] **Step 1: Add jiti to core dependencies**

```bash
cd "E:/Holi Project" && npm install jiti@^2.4.2 --workspace=@holi.dev/core
```

Expected: jiti added to `packages/core/package.json` dependencies.

- [ ] **Step 2: Create `packages/core/src/config-loader.ts`**

```ts
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import type { HoliConfig, HoliConfigFile } from '@holi.dev/shared';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

function deepMerge<T extends Record<string, unknown>>(base: T, override: T): T {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseVal = result[key];
    if (
      value !== null && typeof value === 'object' && !Array.isArray(value) &&
      baseVal !== null && typeof baseVal === 'object' && !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, value as Record<string, unknown>) as T[typeof key];
    } else {
      result[key] = value as T[typeof key];
    }
  }
  return result;
}

function deepMergeConfig(base: HoliConfig, override: HoliConfig): HoliConfig {
  return {
    tokens:      deepMerge(base.tokens     as Record<string, unknown>, override.tokens     as Record<string, unknown>) as HoliConfig['tokens'],
    components:  deepMerge(base.components  ?? {}, override.components  ?? {}),
    animations:  deepMerge(base.animations  ?? {}, override.animations  ?? {}),
    themes:      deepMerge(base.themes      ?? {}, override.themes      ?? {}),
    utilities:   deepMerge(base.utilities   ?? {}, override.utilities   ?? {}),
    breakpoints: { ...(base.breakpoints ?? {}), ...(override.breakpoints ?? {}) },
    output:      { ...(base.output ?? {}),      ...(override.output ?? {}) },
  };
}

async function mergeExtends(file: HoliConfigFile, cwd: string): Promise<HoliConfig> {
  const { extends: ext, ...config } = file;
  if (!ext) return config as HoliConfig;
  const paths = Array.isArray(ext) ? ext : [ext];
  let base: HoliConfig = { tokens: {} };
  for (const p of paths) {
    const resolvedCwd = path.dirname(path.resolve(cwd, p));
    const resolved = await loadConfig(resolvedCwd);
    base = deepMergeConfig(base, resolved);
  }
  return deepMergeConfig(base, config as HoliConfig);
}

export async function loadConfig(cwd: string): Promise<HoliConfig> {
  for (const filename of CONFIG_CANDIDATES) {
    const filePath = path.resolve(cwd, filename);
    if (!existsSync(filePath)) continue;

    if (filename.endsWith('.json')) {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as HoliConfigFile;
      return mergeExtends(raw, cwd);
    }

    // TypeScript / JS — use jiti for execution
    const { createJiti } = await import('jiti');
    const j = createJiti(filePath);
    const mod = (await j.import(filePath)) as { default?: unknown } | unknown;
    const raw = ((mod as { default?: unknown }).default ?? mod) as HoliConfigFile;
    return mergeExtends(raw, cwd);
  }
  throw new Error(
    `No Holi config found in ${cwd}.\nCreate holi.config.ts or holi.json to get started.`,
  );
}

export function resolveCwd(pathOrCwd: string): string {
  const abs = path.resolve(process.cwd(), pathOrCwd);
  return path.extname(abs) ? path.dirname(abs) : abs;
}
```

- [ ] **Step 3: Update `packages/core/src/index.ts`**

```ts
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { parse } from './parser';
import { resolve } from './resolver';
import { emit } from './emitter';
import { loadConfig, resolveCwd } from './config-loader';
import type { EmitResult, HoliConfig } from '@holi.dev/shared';

export { parse, resolve, emit };
export { HoliValidationError } from './parser';
export { HoliResolverError } from './errors';
export { DEFAULT_CONFIG } from './defaults';
export { compileFromObject } from './compile-from-object';
export { loadConfig } from './config-loader';
export type { HoliConfig, HoliConfigFile, ResolvedConfig, EmitResult, TokenMap, ComponentConfig } from '@holi.dev/shared';

export function defineConfig(config: HoliConfig): HoliConfig {
  return config;
}

export async function compile(pathOrCwd: string): Promise<EmitResult> {
  const cwd    = resolveCwd(pathOrCwd);
  const config = await loadConfig(cwd);
  const mode   = config.output?.mode ?? 'inline';
  return emit(resolve(config, mode));
}

export async function compileAndWrite(pathOrCwd: string): Promise<EmitResult> {
  const cwd    = resolveCwd(pathOrCwd);
  const config = await loadConfig(cwd);
  const mode   = config.output?.mode ?? 'inline';
  const result = emit(resolve(config, mode));
  const outDir = path.resolve(cwd, config.output?.outputDir ?? 'holi-dist');
  await mkdir(outDir, { recursive: true });
  for (const [filename, css] of Object.entries(result)) {
    if (css.trim()) await writeFile(path.join(outDir, filename), css, 'utf-8');
  }
  return result;
}
```

- [ ] **Step 4: Run tests**

```bash
cd "E:/Holi Project" && npm test
```

Expected: all tests PASS. The integration tests still pass because `resolveCwd` detects the `.json` extension and uses the directory, and `loadConfig` finds `holi.config.json` in the probe list.

- [ ] **Step 5: Build core**

```bash
cd "E:/Holi Project" && npm run build -w packages/core
```

Expected: builds successfully.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/core/src/config-loader.ts packages/core/src/index.ts packages/core/package.json package-lock.json && git commit -m "feat(core): add loadConfig (jiti + TS config), defineConfig, config extends/deep-merge"
```

---

## Task 10: Update CLI — build, watch, and add `holi import`

**Files:**
- Modify: `packages/cli/src/commands/build.ts`
- Modify: `packages/cli/src/commands/watch.ts`
- Modify: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/import.ts`

- [ ] **Step 1: Replace `packages/cli/src/commands/build.ts`**

```ts
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { compileAndWrite } from '@holi.dev/core';

export async function build(configPathOrCwd: string): Promise<void> {
  const cwd     = path.resolve(process.cwd(), configPathOrCwd);
  const spinner = ora(`Compiling...`).start();
  const start   = Date.now();

  try {
    const result = await compileAndWrite(cwd);
    spinner.succeed(chalk.green(`Compiled in ${Date.now() - start}ms`));
    for (const [filename, css] of Object.entries(result)) {
      if (css.trim()) {
        const kb = (Buffer.byteLength(css, 'utf-8') / 1024).toFixed(1);
        console.log(chalk.gray(`  ${filename.padEnd(20)} ${kb} kB`));
      }
    }
  } catch (e: unknown) {
    spinner.fail(chalk.red('Compilation failed'));
    console.error(chalk.red((e as Error).message));
    process.exit(1);
  }
}
```

- [ ] **Step 2: Replace `packages/cli/src/commands/watch.ts`**

```ts
import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { compileAndWrite } from '@holi.dev/core';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

export function watch(configPathOrCwd: string): void {
  const cwd = path.resolve(process.cwd(), configPathOrCwd);
  const watchPaths = CONFIG_CANDIDATES.map((f) => path.resolve(cwd, f));

  console.log(chalk.cyan(`Watching for config changes in ${cwd}...`));

  const watcher = chokidar.watch(watchPaths, { ignoreInitial: false, persistent: true });
  let debounce: ReturnType<typeof setTimeout>;

  const rebuild = () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const start = Date.now();
      try {
        await compileAndWrite(cwd);
        console.log(chalk.green(`✓ Rebuilt in ${Date.now() - start}ms`));
      } catch (e: unknown) {
        console.error(chalk.red(`✗ ${(e as Error).message}`));
      }
    }, 50);
  };

  watcher.on('add', rebuild);
  watcher.on('change', rebuild);
  watcher.on('error', (err) => console.error(chalk.red('Watcher error:', err)));
}
```

- [ ] **Step 3: Create `packages/cli/src/commands/import.ts`**

```ts
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

type DTCGValue = { $type?: string; $value?: unknown; [key: string]: unknown };
type DTCGGroup = { [key: string]: DTCGValue | DTCGGroup };

function convertDTCGGroup(group: DTCGGroup): Record<string, string | Record<string, string>> {
  const result: Record<string, string | Record<string, string>> = {};
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    const v = value as DTCGValue;
    if ('$value' in v) {
      result[key] = String(v.$value);
    } else {
      const nested = convertDTCGGroup(v as DTCGGroup);
      // Only include if non-empty
      if (Object.keys(nested).length > 0) result[key] = nested as Record<string, string>;
    }
  }
  return result;
}

export function importDTCG(opts: { from: string; format: string }): void {
  if (opts.format !== 'dtcg') {
    console.error(chalk.red(`Unsupported format "${opts.format}". Only "dtcg" is supported.`));
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), opts.from);
  if (!existsSync(inputPath)) {
    console.error(chalk.red(`File not found: ${inputPath}`));
    process.exit(1);
  }

  const dtcg = JSON.parse(readFileSync(inputPath, 'utf-8')) as DTCGGroup;
  const tokens = convertDTCGGroup(dtcg);

  const outputPath = path.resolve(process.cwd(), 'holi.config.ts');
  const content = `import { defineConfig } from '@holi.dev/core';\n\nexport default defineConfig({\n  tokens: ${JSON.stringify(tokens, null, 4)},\n});\n`;

  writeFileSync(outputPath, content, 'utf-8');
  console.log(chalk.green(`✓ Imported to ${outputPath}`));
}
```

- [ ] **Step 4: Replace `packages/cli/src/index.ts`**

```ts
import { Command } from 'commander';
import { init }        from './commands/init';
import { build }       from './commands/build';
import { watch }       from './commands/watch';
import { importDTCG }  from './commands/import';

const program = new Command('holi').version('0.2.0');

program
  .command('init')
  .description('Scaffold holi.config.ts in the current directory')
  .action(() => init(process.cwd()));

program
  .command('build')
  .description('Compile Holi config and write CSS output')
  .option('-c, --config <path>', 'path to config file or directory', '.')
  .action((opts: { config: string }) => build(opts.config));

program
  .command('watch')
  .description('Watch config and rebuild on every change')
  .option('-c, --config <path>', 'path to config file or directory', '.')
  .action((opts: { config: string }) => watch(opts.config));

program
  .command('import')
  .description('Import a design token file and write holi.config.ts')
  .requiredOption('--from <path>', 'input file path')
  .option('--format <format>', 'token format (dtcg)', 'dtcg')
  .action((opts: { from: string; format: string }) => importDTCG(opts));

program.parse();
```

- [ ] **Step 5: Build CLI**

```bash
cd "E:/Holi Project" && npm run build -w packages/cli
```

Expected: builds successfully.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/cli/src/commands/build.ts packages/cli/src/commands/watch.ts packages/cli/src/commands/import.ts packages/cli/src/index.ts && git commit -m "feat(cli): use cwd-based loadConfig, watch all config candidates, add holi import (DTCG)"
```

---

## Task 11: `@holi.dev/vite` plugin

**Files:**
- Create: `packages/vite/package.json`
- Create: `packages/vite/tsconfig.json`
- Create: `packages/vite/tsup.config.ts`
- Create: `packages/vite/src/index.ts`

- [ ] **Step 1: Create `packages/vite/package.json`**

```json
{
  "name": "@holi.dev/vite",
  "version": "0.1.0",
  "description": "Vite plugin for Holi CSS compiler with HMR support",
  "keywords": ["holi", "vite", "css", "design-tokens", "plugin"],
  "license": "MIT",
  "author": "Chandan Bose",
  "repository": { "type": "git", "url": "https://github.com/ChandanBose666/Holi.git" },
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "import":  "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": { "build": "tsup" },
  "engines": { "node": ">=18.0.0" },
  "dependencies": { "@holi.dev/core": "*" },
  "peerDependencies": { "vite": ">=4.0.0" },
  "devDependencies": { "typescript": "*", "tsup": "*", "vite": "^6.0.0" }
}
```

- [ ] **Step 2: Create `packages/vite/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/vite/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  platform: 'node',
  dts: true,
  external: ['vite'],
});
```

- [ ] **Step 4: Create `packages/vite/src/index.ts`**

```ts
import type { Plugin } from 'vite';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { loadConfig, compileFromObject, resolve, emit } from '@holi.dev/core';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

async function runCompile(cwd: string): Promise<{ outDir: string }> {
  const config  = await loadConfig(cwd);
  const mode    = config.output?.mode ?? 'inline';
  const result  = emit(resolve(config, mode));
  const outDir  = path.resolve(cwd, config.output?.outputDir ?? 'holi-dist');
  await mkdir(outDir, { recursive: true });
  for (const [filename, css] of Object.entries(result)) {
    if (css.trim()) await writeFile(path.join(outDir, filename), css, 'utf-8');
  }
  return { outDir };
}

export function holiPlugin(): Plugin {
  const cwd = process.cwd();

  return {
    name: 'vite-plugin-holi',

    async buildStart() {
      await runCompile(cwd);
    },

    configureServer(server) {
      const watchPaths = CONFIG_CANDIDATES.map((f) => path.resolve(cwd, f));
      server.watcher.add(watchPaths);
      server.watcher.on('change', async (file) => {
        if (watchPaths.includes(file)) {
          await runCompile(cwd);
          server.hot.send({ type: 'full-reload' });
        }
      });
    },
  };
}
```

- [ ] **Step 5: Build the plugin**

```bash
cd "E:/Holi Project" && npm install && npm run build -w packages/vite
```

Expected: `packages/vite/dist/` created with `index.js`, `index.mjs`, `index.d.ts`.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/vite/ package-lock.json && git commit -m "feat: add @holi.dev/vite plugin with HMR support"
```

---

## Task 12: `@holi.dev/postcss` plugin

**Files:**
- Create: `packages/postcss/package.json`
- Create: `packages/postcss/tsconfig.json`
- Create: `packages/postcss/tsup.config.ts`
- Create: `packages/postcss/src/index.ts`

- [ ] **Step 1: Create `packages/postcss/package.json`**

```json
{
  "name": "@holi.dev/postcss",
  "version": "0.1.0",
  "description": "PostCSS plugin for Holi CSS compiler",
  "keywords": ["holi", "postcss", "css", "design-tokens", "plugin"],
  "license": "MIT",
  "author": "Chandan Bose",
  "repository": { "type": "git", "url": "https://github.com/ChandanBose666/Holi.git" },
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "import":  "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": { "build": "tsup" },
  "engines": { "node": ">=18.0.0" },
  "dependencies": { "@holi.dev/core": "*" },
  "peerDependencies": { "postcss": ">=8.0.0" },
  "devDependencies": { "typescript": "*", "tsup": "*", "postcss": "^8.0.0" }
}
```

- [ ] **Step 2: Create `packages/postcss/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "declaration": true },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/postcss/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  platform: 'node',
  dts: true,
  external: ['postcss'],
});
```

- [ ] **Step 4: Create `packages/postcss/src/index.ts`**

```ts
import type { PluginCreator } from 'postcss';
import postcss from 'postcss';
import { loadConfig, resolve, emit } from '@holi.dev/core';

const holiPostcss: PluginCreator<void> = () => ({
  postcssPlugin: 'postcss-holi',

  async Once(root) {
    const cwd    = process.cwd();
    const config = await loadConfig(cwd);
    const mode   = config.output?.mode ?? 'inline';
    const result = emit(resolve(config, mode));

    const combined = Object.values(result)
      .filter((css) => css.trim())
      .join('\n');

    const parsed = postcss.parse(combined);
    parsed.each((node) => root.prepend(node.clone()));
  },
});

holiPostcss.postcss = true;

export default holiPostcss;
export { holiPostcss };
```

- [ ] **Step 5: Build**

```bash
cd "E:/Holi Project" && npm install && npm run build -w packages/postcss
```

Expected: `packages/postcss/dist/` created.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/postcss/ package-lock.json && git commit -m "feat: add @holi.dev/postcss plugin"
```

---

## Task 13: `@holi.dev/webpack` plugin

**Files:**
- Create: `packages/webpack/package.json`
- Create: `packages/webpack/tsconfig.json`
- Create: `packages/webpack/tsup.config.ts`
- Create: `packages/webpack/src/index.ts`

- [ ] **Step 1: Create `packages/webpack/package.json`**

```json
{
  "name": "@holi.dev/webpack",
  "version": "0.1.0",
  "description": "Webpack plugin for Holi CSS compiler",
  "keywords": ["holi", "webpack", "css", "design-tokens", "plugin"],
  "license": "MIT",
  "author": "Chandan Bose",
  "repository": { "type": "git", "url": "https://github.com/ChandanBose666/Holi.git" },
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "import":  "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": { "build": "tsup" },
  "engines": { "node": ">=18.0.0" },
  "dependencies": { "@holi.dev/core": "*" },
  "peerDependencies": { "webpack": ">=5.0.0" },
  "devDependencies": { "typescript": "*", "tsup": "*", "webpack": "^5.0.0" }
}
```

- [ ] **Step 2: Create `packages/webpack/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "declaration": true },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/webpack/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  platform: 'node',
  dts: true,
  external: ['webpack'],
});
```

- [ ] **Step 4: Create `packages/webpack/src/index.ts`**

```ts
import type { Compiler } from 'webpack';
import path from 'path';
import { loadConfig, resolve, emit } from '@holi.dev/core';

const PLUGIN_NAME = 'HoliWebpackPlugin';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

export class HoliWebpackPlugin {
  apply(compiler: Compiler): void {
    const cwd = compiler.context ?? process.cwd();

    // Add config files to webpack's watched dependencies
    compiler.hooks.afterEnvironment.tap(PLUGIN_NAME, () => {
      for (const f of CONFIG_CANDIDATES) {
        compiler.watchFileSystem?.watcher?.watch?.(path.resolve(cwd, f), Date.now());
      }
    });

    compiler.hooks.thisCompilation.tapAsync(PLUGIN_NAME, async (compilation, callback) => {
      try {
        const config = await loadConfig(cwd);
        const mode   = config.output?.mode ?? 'inline';
        const result = emit(resolve(config, mode));

        for (const [filename, css] of Object.entries(result)) {
          if (css.trim()) {
            const source = new compiler.webpack.sources.RawSource(css);
            compilation.emitAsset(filename, source);
          }
        }
        callback();
      } catch (err) {
        callback(err as Error);
      }
    });
  }
}
```

- [ ] **Step 5: Build**

```bash
cd "E:/Holi Project" && npm install && npm run build -w packages/webpack
```

Expected: `packages/webpack/dist/` created.

- [ ] **Step 6: Commit**

```bash
cd "E:/Holi Project" && git add packages/webpack/ package-lock.json && git commit -m "feat: add @holi.dev/webpack plugin"
```

---

## Task 14: Update root build script + run full test suite

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Update root `package.json` build script to include new packages**

In `package.json` at the root, update the `"build"` script:

```json
"build": "npm run build -w packages/shared && npm run build -w packages/schema && npm run build -w packages/core && npm run build -w packages/cli && npm run build -w packages/vite && npm run build -w packages/postcss && npm run build -w packages/webpack"
```

- [ ] **Step 2: Run full build**

```bash
cd "E:/Holi Project" && npm run build
```

Expected: all 7 packages build successfully with no errors.

- [ ] **Step 3: Run full test suite**

```bash
cd "E:/Holi Project" && npm test
```

Expected: all tests PASS. Look for output like `X tests passed`.

- [ ] **Step 4: Smoke-test the CLI with a TS config**

Create a temporary test directory and run the CLI:

```bash
mkdir "E:/Holi Project/tmp-smoke" && cat > "E:/Holi Project/tmp-smoke/holi.config.ts" << 'EOF'
import { defineConfig } from '@holi.dev/core';
export default defineConfig({
  output: { mode: 'variables', outputDir: 'dist' },
  tokens: { color: { primary: '#6366f1', surface: '#0f172a' } },
  components: {
    button: {
      base: { display: 'inline-flex', padding: '8px 16px', background: 'color.primary' },
      variants: { ghost: { background: 'transparent', border: '1px solid color.primary' } },
      states: { hover: { opacity: '0.9' }, focus: { outline: '2px solid color.primary' } },
      responsive: { md: { padding: '10px 20px' } },
    },
  },
  breakpoints: { md: '768px' },
  themes: { dark: { color: { primary: '#818cf8', surface: '#1e1b4b' } } },
});
EOF
cd "E:/Holi Project" && node packages/cli/bin/holi.js build -c tmp-smoke
```

Expected: compiles successfully, `tmp-smoke/dist/` contains `tokens.css`, `button.css`, `utilities.css`, `themes.css`.

Verify `button.css` contains `var(--color-primary)` (not `#6366f1`) and `:hover`, `:focus`, and `@media` blocks.

- [ ] **Step 5: Clean up smoke test directory**

```bash
rm -rf "E:/Holi Project/tmp-smoke"
```

- [ ] **Step 6: Final commit**

```bash
cd "E:/Holi Project" && git add package.json && git commit -m "build: include vite, postcss, webpack packages in root build script"
```

---

## Self-Review Checklist

- [x] **Priority 1 — pseudo-class/state support**: Task 5 (`emitStates`) + Task 8 (wired into `emitComponent`)
- [x] **Priority 2 — responsive breakpoints**: Task 6 (`emitResponsive`) + Task 8 (wired into `emitComponent` + `emitUtilities`)
- [x] **Priority 3 — CSS custom properties / dark mode**: Task 4 (resolver mode), Task 7 (`emitThemes`), Task 8 (emit() includes themes.css)
- [x] **Priority 4 — TypeScript config**: Task 9 (`loadConfig` with jiti, `defineConfig`)
- [x] **Priority 5 — Vite/PostCSS/webpack plugins**: Tasks 11–13
- [x] **Priority 6 — Class prefix**: Already existed, preserved in all new emitter functions
- [x] **Priority 7 — Compound variants**: Task 8 (`emitCompoundVariants` in `emitter.ts`)
- [x] **Config splitting / extends**: Task 9 (`mergeExtends`, `deepMergeConfig`)
- [x] **Error messages with location context**: Task 4 (resolver throws with `location` + did-you-mean)
- [x] **Token depth beyond two levels**: Task 4 (recursive `flattenTokens`)
- [x] **W3C DTCG format import**: Task 10 (`holi import --from file.json --format dtcg`)
- [x] **Missing standard token categories**: Task 1 (shadow, z, opacity, transition, blur in types + schema)
- [x] **Tree-shaking / selective output**: Task 8 (`output.include` filter in `emitComponents`)
- [x] **`compileFromObject` mode-awareness**: Task 9 — `compile`/`compileAndWrite` pass mode from config; note: `compileFromObject` (used directly) should also read mode. Fix: in `packages/core/src/compile-from-object.ts`, update to:

```ts
import { parse } from './parser';
import { resolve } from './resolver';
import { emit } from './emitter';
import type { EmitResult } from '@holi.dev/shared';

export function compileFromObject(raw: unknown): EmitResult {
  const parsed = parse(raw);
  const mode   = parsed.output?.mode ?? 'inline';
  return emit(resolve(parsed, mode));
}
```

Add this fix to **Task 8 Step 3** — update `compile-from-object.ts` at the same time as `emitter.ts`.
