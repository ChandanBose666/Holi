# Shortcomings to Conquer

> Senior dev honest review — these are the gaps between "interesting project" and "best in market".
> Tackle in priority order. Numbers 1–3 are the difference between a toy and a tool.

---

## Priority 1 — Pseudo-class / state support
**Why it blocks adoption:** A button without `:hover` isn't a button. No interactive states = can't build real UIs.

Add a `states` key to component definitions:

```json
"button": {
  "base": "display: inline-flex; padding: {spacing.sm} {spacing.md};",
  "variants": { "primary": "background: {color.primary}; color: #fff;" },
  "states": {
    "hover":    "background: {color.primaryHover};",
    "focus":    "outline: 2px solid {color.primary}; outline-offset: 2px;",
    "active":   "transform: scale(0.98);",
    "disabled": "opacity: 0.5; cursor: not-allowed;"
  }
}
```

Emits: `.button:hover { ... }` `.button:focus { ... }` `.button--primary:hover { ... }` etc.
Also needs: `::before`, `::after`, `:placeholder`, `:checked`, `:invalid`.

---

## Priority 2 — Responsive breakpoints
**Why it blocks adoption:** Every real UI needs different styles at different screen sizes. No breakpoints = Holi is decoration-only.

Add a `breakpoints` key and `responsive` per component/utility:

```json
"breakpoints": {
  "sm": "640px",
  "md": "768px",
  "lg": "1024px",
  "xl": "1280px"
},
"components": {
  "container": {
    "base": "width: 100%; padding: {spacing.md};",
    "responsive": {
      "md": "max-width: 768px; margin: 0 auto;",
      "lg": "max-width: 1024px;"
    }
  }
},
"utilities": {
  "text-lg": {
    "base": "font-size: {font.base};",
    "responsive": { "md": "font-size: {font.lg};" }
  }
}
```

Emits: `@media (min-width: 768px) { .container { max-width: 768px; } }`

---

## Priority 3 — CSS custom properties output mode (dark mode / theming)
**Why it blocks adoption:** Inlining token values at compile time means zero runtime theming. No dark mode without recompiling. Unacceptable for any modern app.

Add `output.mode` to config:

```json
"output": {
  "file": "holi.css",
  "mode": "variables"
}
```

- `"inline"` (current default) — resolves all tokens to raw values at compile time
- `"variables"` — emits `:root { --color-primary: #6366f1; }` and uses `var(--color-primary)` in all rules

Also needs theme support:

```json
"themes": {
  "dark": {
    "color": { "primary": "#818cf8", "surface": "#0f172a" }
  }
}
```

Emits: `@media (prefers-color-scheme: dark) { :root { --color-primary: #818cf8; } }`
Or via class: `.dark { --color-primary: #818cf8; }`

---

## Priority 4 — TypeScript config (`holi.config.ts`)
**Why it matters:** Tailwind, Vite, and every serious build tool use TypeScript configs. JSON has no comments, no autocomplete, no type safety. Writing a large design system in raw JSON is painful.

```ts
// holi.config.ts
import { defineConfig } from '@holi.dev/core';

export default defineConfig({
  output: { file: 'holi.css', mode: 'variables' },
  tokens: {
    color: { primary: '#6366f1' }, // ← comments work
  },
  extends: './tokens/base.holi.ts', // ← config composition
});
```

Requires: update CLI to detect `.ts` config, use jiti or tsx to execute it.

---

## Priority 5 — Vite / PostCSS / webpack plugin
**Why it matters:** Real projects have a build pipeline. A separate watch process is friction. I want:

```ts
// vite.config.ts
import { holiPlugin } from '@holi.dev/vite';

export default { plugins: [holiPlugin()] };
```

Also needed:
- `@holi.dev/vite` — Vite plugin with HMR
- `@holi.dev/postcss` — PostCSS plugin for pipeline integration
- `@holi.dev/webpack` — webpack loader

---

## Priority 6 — Class prefix / namespace support
**Why it matters:** `.button` and `.card` collide with existing CSS in any brownfield project.

```json
"output": { "file": "holi.css", "prefix": "h-" }
```

Emits: `.h-button`, `.h-button--primary`, `.h-card` etc.

---

## Priority 7 — Compound variants
**Why it matters:** Real components need styles that apply only when multiple variants combine. CVA and Stitches both support this.

```json
"button": {
  "variants": {
    "size": { "sm": "...", "lg": "..." },
    "variant": { "primary": "...", "ghost": "..." }
  },
  "compoundVariants": [
    { "when": { "size": "lg", "variant": "primary" }, "css": "font-weight: 700; letter-spacing: 0.05em;" }
  ]
}
```

---

## Also needed (medium priority)

**Config splitting / extends**
Large design systems don't fit in one file. Need `extends` and multi-file support.
```ts
export default defineConfig({ extends: ['./tokens/primitives', './tokens/semantic'] });
```

**Error messages with location context**
Current: `Unknown token reference "color.priamry"`
Needed: `Unknown token "color.priamry" in components.button.base — did you mean "color.primary"?`

**Token depth beyond two levels**
`{color.primary}` works. `{semantic.color.interactive.default}` doesn't. Needs arbitrary depth.

**W3C Design Tokens (DTCG) format import**
The W3C spec is the standard export from Figma, Tokens Studio, Style Dictionary.
```bash
holi import --from figma-tokens.json --format dtcg
```

**Missing standard token categories**
Schema doesn't cover: `shadow`, `z-index`, `opacity`, `transition`, `blur`. Add to schema + emitter.

**Tree-shaking / selective output**
```json
"output": { "include": ["button", "card"] }
```
Only emit the components you use. Critical for performance-conscious teams.

**VS Code extension**
- Token reference autocomplete (`{col` → shows all color tokens)
- Hover preview (`{color.primary}` → shows `#6366f1` swatch)
- Inline validation of token references

---

## The strategic point to keep in mind

Holi's real differentiator vs Tailwind is **semantic class names** (`.button--primary`) over **utility classes** (`.bg-indigo-600`). That's a real opinion with a real audience — design system teams, agencies managing multiple brands, teams that care about readable HTML.

Own that positioning. Fix priorities 1–3 and Holi becomes a serious tool. Fix all of the above and it has a genuine case for best-in-class.
