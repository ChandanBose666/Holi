# Holi — Documentation Site
## Design Spec: Phase 3 (Docs + Visual User Manual)
**Date:** 2026-03-24
**Scope:** `apps/docs` — a standalone Next.js documentation site

---

## Why This Phase Exists

A zero-runtime CSS compiler is only as useful as its documentation. Developers need to see
Holi in action — not just read about it. This phase delivers a production-quality docs site
that doubles as a live visual demo: every code example renders its own output, colors are
shown as swatches, spacing as visual rulers, utilities as live HTML, and animations play
in-browser.

Reference bar: Tailwind CSS docs, Bootstrap docs, Radix UI docs, shadcn/ui docs.

---

## Confirmed Design Decisions

| Decision | Choice |
|---|---|
| Color scheme | Light & Clean — white `#ffffff` bg, slate text `#1e293b`, muted `#64748b`, indigo `#6366F1` accent |
| Layout | Three-column — left page nav (240px) + main content + right in-page TOC (200px) |
| Landing hero | Visual-first: headline + animated token swatches; "Show code" toggle reveals the `holi.config.json` that produced them |
| Code highlighting | Shiki (via Fumadocs) |
| Dogfooding | Site styled with its own Holi-compiled CSS |
| Deployment | Static export → Vercel free tier |

**Hero pattern:** Visual output first, code on demand. Every demo page follows the same principle — rendered result shown immediately, config/CSS collapsible below.

---

## What We Are Building

A **Next.js App Router** documentation site at `apps/docs` in the monorepo.

Pages are authored in **MDX**. The site is powered by **Fumadocs** (lightweight, MDX-native
docs framework used by GeistDocs). The site uses **Holi's own compiled CSS** (dogfooding —
the docs site IS styled with Holi output). It deploys to a static export or Vercel.

### Site Structure

```
/                        → Landing page (hero, "what is Holi", quick-start snippet)
/docs                    → Docs root (sidebar nav)
  /docs/getting-started  → Installation + first build (5 min to working CSS)
  /docs/config           → Full holi.config.json reference
  /docs/tokens           → Token system + visual swatches
  /docs/components       → Component + variant system + live examples
  /docs/utilities        → All utility classes (table + live demo)
  /docs/animations       → Animation system + live animated examples
  /docs/cli              → CLI reference (init / build / watch)
  /docs/advanced         → Prefix, custom output dirs, breakpoints
/playground              → "Coming soon" placeholder page (a simple centred message + link back to docs; no editor in Phase 3)
```

---

## Technology Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js latest stable (15.x / App Router) | SSG support, MDX, ecosystem |
| Docs framework | Fumadocs (via `fumadocs-core` + `fumadocs-ui`) | MDX-native, fast, customisable |
| Styling | Holi-compiled CSS + Tailwind (for the doc chrome) | Dogfooding — site uses its own tool |
| Code highlighting | Shiki (via Fumadocs) | Best-in-class, matches VS Code themes |
| Deployment | `next export` → static / Vercel | Zero server cost |
| Package location | `apps/docs` in the monorepo | Shares `@holi/core` directly |

---

## Page Specifications

### Landing Page (`/`)

**Sections:**
1. **Hero** — tagline, one-liner description, "Get started" CTA, GitHub link
2. **What is Holi** — 3-column value props: Zero Runtime / One Config / Pure CSS
3. **Quick Start** — 4-step code block sequence:
   ```bash
   npm install -g holi
   holi init
   holi build
   # → holi-dist/ with your CSS
   ```
4. **Live Token Swatch Strip** — rendered color swatches from `DEFAULT_CONFIG.tokens.color` using real compiled CSS custom properties. Shows `--color-primary`, `--color-surface`, etc. as coloured boxes with hex labels.
5. **Testimonial / tag line area** — placeholder for future quotes
6. **Footer** — links to GitHub, npm, docs

### Getting Started (`/docs/getting-started`)

Sections:
- Prerequisites (Node 24+)
- Install (`npm install -g holi` / `npx holi`)
- `holi init` — explains what it writes
- Your first `holi.config.json` — annotated minimal example
- `holi build` — what it outputs, where files go
- Importing the CSS (`<link rel="stylesheet">` or JS import)
- Using a class: `<button class="btn btn-primary">Click me</button>` → rendered live

### Config Reference (`/docs/config`)

Full `holi.config.json` schema as a structured reference. Each top-level key (`tokens`,
`breakpoints`, `components`, `animations`, `output`) gets its own sub-section with:
- TypeScript type signature
- JSON example (syntax-highlighted)
- Description of every field
- Default values table

### Tokens (`/docs/tokens`)

Visual-first page:

**Color tokens:**
- Visual swatch grid: each color token rendered as a coloured square with its name and value
- The grid uses real CSS custom properties compiled from Holi itself

**Spacing tokens:**
- Visual ruler: each spacing token shown as a horizontal bar scaled to its pixel value
- Labels: `xs = 4px`, `sm = 8px`, etc.

**Typography tokens:**
- Live font previews at each size token
- Font-family shown in actual rendered text

**Radius tokens:**
- Boxes with the correct border-radius applied

**Shadow tokens:**
- Cards showing each shadow live

**How to reference tokens:**
```json
"padding": "spacing.sm spacing.md"
```
Explanation of dot-notation resolution with a before/after diagram:
```
spacing.sm spacing.md  →  8px 16px
```

### Components (`/docs/components`)

For each built-in component (btn, card):
- Live rendered HTML preview (styled with Holi-compiled CSS)
- The config JSON that produced it
- The compiled CSS output (collapsible)
- All variant demos side-by-side

**Custom component walkthrough:**
Step-by-step: define → build → use. Full annotated example.

### Utilities (`/docs/utilities`)

**Display utilities table:**

| Class | CSS | Live demo |
|---|---|---|
| `.flex` | `display: flex` | `<div class="flex">…</div>` → rendered |
| `.grid` | `display: grid` | rendered |
| … | | |

**Spacing utilities table:**
- Generated from `tokens.spacing` — shows every `.mx-*`, `.my-*`, `.p-*` etc. with a visual spacer demo

**Responsive breakpoints:**
- Explains `sm:flex`, `md:flex` etc. — the `{bp}\:{class}` notation
- Visual breakpoint diagram showing sm/md/lg/xl widths

### Animations (`/docs/animations`)

For each animation:
- `@keyframes` code block
- Helper class (`.animate-fade-in`)
- **Live animated demo box** — a box that plays the animation on hover or via a "Replay" button
- Config JSON that produced it
- Compiled CSS output

### CLI Reference (`/docs/cli`)

Three command cards:

**`holi init`**
```
Usage: holi init
```
- What it does, idempotency note, example output

**`holi build [-c path]`**
```
Usage: holi build [options]
Options:
  -c, --config <path>   Path to config file (default: holi.config.json)
```
- Output summary format explanation
- Error handling

**`holi watch [-c path]`**
```
Usage: holi watch [options]
```
- Debounce note, ignores unlink, keeps running

### Advanced (`/docs/advanced`)

- **Output prefix** — how `output.prefix: "h"` changes class names, before/after table
- **Custom output directory** — `output.outputDir`
- **Disabling utilities** — `output.utilities: false`
- **Multiple breakpoints** — custom breakpoint names
- **Circular token references** — error message + how to fix

---

## Visual Component Library (within the docs)

These are custom React components used in MDX pages:

| Component | Description |
|---|---|
| `<ColorSwatch color="primary" />` | Renders a coloured square with name and hex value |
| `<SpacingRuler size="md" />` | Renders a visual horizontal bar |
| `<LiveDemo>…html…</LiveDemo>` | Renders HTML in a sandboxed preview box |
| `<CompiledCSS>…css…</CompiledCSS>` | Syntax-highlighted compiled CSS output, collapsible |
| `<AnimationDemo name="fade-in" />` | Renders a box that plays the animation |
| `<UtilityTable />` | Auto-generates the utility class table by calling `compileFromObject(DEFAULT_CONFIG)` from `@holi/core` at build time in a Server Component, then iterating the result |
| `<ConfigExample>…json…</ConfigExample>` | Syntax-highlighted + annotated JSON |
| `<BeforeAfter before="…" after="…" />` | Shows token ref → resolved value |

These components call `compileFromObject()` from `@holi/core` at build time (in Server Components)
so the demos always reflect the actual compiler output — no hardcoding.

---

## Dogfooding: Site Styled with Holi

**Prerequisite:** `compileAndWrite(configPath)` is already exported from `@holi/core` (built in Phase 1).

The docs site's own CSS is partially compiled by Holi. A `holi.docs.config.json` at the
`apps/docs` root defines the design tokens used by the site itself. During `next build`,
a prebuild script (`scripts/compile-docs-css.mjs`) imports `compileAndWrite` from `@holi/core`
and runs it against `holi.docs.config.json`, writing CSS to `apps/docs/public/holi.css`.
That file is imported in the root layout.

This means: **the docs site is a living proof that Holi works**.

---

## Navigation Structure (Sidebar)

```
Getting Started
  ├── Installation
  ├── Your First Config
  └── Using the Output

Config Reference
  ├── tokens
  ├── breakpoints
  ├── components
  ├── animations
  └── output

Tokens
  ├── Colors
  ├── Spacing
  ├── Typography
  ├── Radius
  └── Shadows

Components
  ├── Defining Components
  ├── Variants
  └── Prefix

Utilities
  ├── Display
  ├── Spacing
  └── Responsive

Animations
  ├── Keyframes
  └── Helper Classes

CLI
  ├── holi init
  ├── holi build
  └── holi watch

Advanced
  ├── Output Prefix
  ├── Custom Output Dir
  ├── Disabling Utilities
  ├── Multiple Breakpoints
  └── Circular Token References
```

---

## File Map

```
apps/docs/
  package.json                    # name: @holi/docs, private: true
  next.config.ts                  # MDX + static export config
  holi.docs.config.json           # Holi config for the docs site itself
  public/
    holi.css                      # compiled at build time from holi.docs.config.json
  app/
    layout.tsx                    # root layout: imports holi.css, sets fonts
    page.tsx                      # landing page
    docs/
      layout.tsx                  # docs shell: sidebar + content area
      [[...slug]]/
        page.tsx                  # MDX page renderer
  content/
    docs/
      getting-started.mdx
      config.mdx
      tokens.mdx
      components.mdx
      utilities.mdx
      animations.mdx
      cli.mdx
      advanced.mdx
  components/
    ui/
      ColorSwatch.tsx
      SpacingRuler.tsx
      LiveDemo.tsx
      CompiledCSS.tsx
      AnimationDemo.tsx
      UtilityTable.tsx
      ConfigExample.tsx
      BeforeAfter.tsx
    layout/
      Sidebar.tsx
      Header.tsx
      Footer.tsx
```

---

## Monorepo Integration

Add `apps/docs` to the workspace root:

```json
"workspaces": ["packages/*", "apps/*"]
```

The prebuild step in `apps/docs/package.json`:
```json
"scripts": {
  "prebuild": "node scripts/compile-docs-css.mjs",
  "build": "next build",
  "dev": "npm run prebuild && next dev"
}
```

`scripts/compile-docs-css.mjs` calls `compileAndWrite()` from `@holi/core`.

---

## Success Criteria

- [ ] `npm run dev -w apps/docs` starts the docs site at `localhost:3000`
- [ ] Landing page shows colour swatches rendered from real Holi token output
- [ ] Getting Started page walks through init → build → use end-to-end
- [ ] Config reference covers every field with type + example
- [ ] Token page shows visual swatches, spacing rulers, type scale
- [ ] Component page renders `.btn` and `.btn-primary` live in the browser
- [ ] Utilities page shows every display + spacing class in a table with live demos
- [ ] Animations page shows animated boxes with a Replay button
- [ ] CLI page documents all three commands with usage examples
- [ ] `public/holi.css` is compiled from `holi.docs.config.json` at build time
- [ ] `next build` produces a static export with no errors
- [ ] Deployed to Vercel (optional for Phase 3, required for Phase 6)
