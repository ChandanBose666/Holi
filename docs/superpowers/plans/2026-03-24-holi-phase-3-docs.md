# Holi Phase 3 — Documentation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality Next.js documentation site at `apps/docs` that dogfoods Holi's own compiled CSS and renders every token, component, utility, and animation as a live visual demo.

**Architecture:** Next.js 16 App Router with Fumadocs (MDX-native docs framework) provides routing, sidebar, and TOC shell. Eight MDX pages author the content. Eight custom React Server Components render visual demos by calling `compileFromObject(DEFAULT_CONFIG)` from `@holi/core` at build time — no hardcoding. A prebuild script compiles `holi.docs.config.json` into `public/holi.css`, which the root layout imports so the site is styled with Holi's own output.

**Tech Stack:** Next.js 16, Fumadocs (fumadocs-core + fumadocs-ui + fumadocs-mdx), Tailwind CSS v4 (CSS-import approach), TypeScript, Shiki (via Fumadocs), `@holi/core` workspace package.

---

## Verified APIs (fetched from live docs 2026-03-24)

| Concern | Correct API |
|---|---|
| Next.js config file | `next.config.mjs` (fumadocs-mdx is ESM-only) |
| Source setup | `import { docs } from 'collections/server'` → `docs.toFumadocsSource()` |
| tsconfig alias | `"collections/*": [".source/*"]` |
| DocsLayout import | `fumadocs-ui/layouts/docs` |
| DocsLayout tree prop | `source.getPageTree()` |
| DocsPage etc. import | `fumadocs-ui/layouts/docs/page` |
| RootProvider import | `fumadocs-ui/provider` |
| Tailwind CSS | v4 — `@import 'tailwindcss'` in CSS file, no `tailwind.config.ts` |
| Fumadocs CSS | `@import 'fumadocs-ui/css/neutral.css'` + `@import 'fumadocs-ui/css/preset.css'` |

---

## File Map

```
apps/docs/
  package.json                          # @holi/docs, workspace deps, prebuild script
  next.config.mjs                       # MDX + Fumadocs (ESM)
  tsconfig.json                         # extends root, paths aliases
  source.config.ts                      # Fumadocs MDX collection definition
  holi.docs.config.json                 # Holi config for the docs site itself
  scripts/
    compile-docs-css.mjs                # prebuild: compile → public/holi.css
  public/
    holi.css                            # generated at build time (gitignored)
  app/
    source.ts                           # Fumadocs loader using toFumadocsSource()
    layout.tsx                          # root layout: RootProvider, imports holi.css
    globals.css                         # Tailwind v4 + Fumadocs CSS imports
    page.tsx                            # landing page: hero + swatches + quickstart
    docs/
      layout.tsx                        # DocsLayout with getPageTree()
      [[...slug]]/
        page.tsx                        # DocsPage MDX renderer
    playground/
      page.tsx                          # "coming soon" placeholder
  content/
    docs/
      meta.json                         # sidebar order
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
      Header.tsx
      Footer.tsx
    mdx-components.tsx                  # global MDX component registry
```

---

## Task 1: Expand Monorepo + Scaffold Next.js App

**Files:**
- Modify: `package.json` (root)
- Create: `apps/docs/package.json`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/next.config.mjs`
- Create: `apps/docs/source.config.ts`

- [ ] **Step 1: Add `apps/*` to root workspace**

Edit `E:\Holi Project\package.json` — change `"workspaces"`:

```json
"workspaces": ["packages/*", "apps/*"]
```

Also add `"build:docs"` to scripts:

```json
"build:docs": "npm run build -w packages/shared && npm run build -w packages/schema && npm run build -w packages/core && npm run build -w apps/docs"
```

- [ ] **Step 2: Create `apps/docs/package.json`**

```json
{
  "name": "@holi/docs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "prebuild": "node scripts/compile-docs-css.mjs",
    "build": "next build",
    "dev": "node scripts/compile-docs-css.mjs && next dev",
    "start": "next start"
  },
  "dependencies": {
    "@holi/core": "*",
    "fumadocs-core": "latest",
    "fumadocs-ui": "latest",
    "fumadocs-mdx": "latest",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/mdx": "^2.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

Note: No `tailwindcss` or `postcss` as devDependencies — Tailwind v4 is bundled inside `fumadocs-ui` and processed via CSS imports in Next.js 16 with Turbopack.

- [ ] **Step 3: Create `apps/docs/tsconfig.json`**

```json
{
  "compilerOptions": {
    "composite": false,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "collections/*": [".source/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The `"collections/*": [".source/*"]` alias is required by fumadocs-mdx — it maps the auto-generated `.source` folder so you can `import { docs } from 'collections/server'`.

- [ ] **Step 4: Create `apps/docs/next.config.mjs`**

Must be `.mjs` (fumadocs-mdx is ESM-only and will fail with `.ts` or `.js`).

```mjs
import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withMDX = createMDX();
export default withMDX(config);
```

- [ ] **Step 5: Create `apps/docs/source.config.ts`**

```ts
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig();
```

- [ ] **Step 6: Install dependencies**

```bash
cd "E:\Holi Project"
npm install -w apps/docs
```

Expected: packages installed, no errors.

- [ ] **Step 7: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/package.json apps/docs/tsconfig.json apps/docs/next.config.mjs apps/docs/source.config.ts package.json
git commit -m "feat(docs): scaffold apps/docs — Next.js 16 + Fumadocs + workspace setup"
```

---

## Task 2: Fumadocs Source Loader + Global CSS

**Files:**
- Create: `apps/docs/app/source.ts`
- Create: `apps/docs/app/globals.css`

- [ ] **Step 1: Create `apps/docs/app/source.ts`**

Note: `docs` is imported from `'collections/server'` (maps to `.source/server.ts` generated by fumadocs-mdx). Do NOT import from `'../source.config'`.

```ts
import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
```

The `.source/` folder is auto-generated when you run `next dev` or `next build`.

- [ ] **Step 2: Create `apps/docs/app/globals.css`**

Tailwind v4 uses CSS `@import` — no `tailwind.config.ts` or `postcss.config.mjs` required.

```css
@import 'tailwindcss';
@import 'fumadocs-ui/css/neutral.css';
@import 'fumadocs-ui/css/preset.css';

/* Site-level custom properties */
:root {
  --site-accent: #6366f1;
  --site-text: #1e293b;
  --site-muted: #64748b;
  --site-border: #e2e8f0;
  --site-surface: #f8fafc;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
}

/* Prose overrides for MDX content */
code:not(pre code) {
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  color: #6366f1;
}
```

- [ ] **Step 3: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/app/source.ts apps/docs/app/globals.css
git commit -m "feat(docs): Fumadocs source loader + Tailwind v4 globals"
```

---

## Task 3: Dogfooding — Holi Config + Prebuild Script

**Files:**
- Create: `apps/docs/holi.docs.config.json`
- Create: `apps/docs/scripts/compile-docs-css.mjs`

- [ ] **Step 1: Create `apps/docs/holi.docs.config.json`**

```json
{
  "tokens": {
    "color": {
      "primary":    "#6366F1",
      "primary-dk": "#4F46E5",
      "surface":    "#F8FAFC",
      "text":       "#1e293b",
      "muted":      "#64748b"
    },
    "spacing": {
      "xs": "4px",
      "sm": "8px",
      "md": "16px",
      "lg": "32px",
      "xl": "64px"
    },
    "typography": {
      "sans":        "\"Inter\", sans-serif",
      "size-sm":     "0.875rem",
      "size-base":   "1rem",
      "size-lg":     "1.25rem",
      "size-hero":   "3.5rem"
    },
    "radius": { "sm": "4px", "md": "8px", "lg": "16px" },
    "shadow": {
      "sm": "0 1px 3px rgba(0,0,0,0.08)",
      "md": "0 4px 16px rgba(0,0,0,0.12)"
    }
  },
  "output": { "outputDir": "public/holi-dist", "utilities": false }
}
```

- [ ] **Step 2: Create `apps/docs/scripts/compile-docs-css.mjs`**

```mjs
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root       = resolve(__dirname, '..');
const configPath = join(root, 'holi.docs.config.json');
const outPath    = join(root, 'public', 'holi.css');

// Resolve @holi/core from the monorepo — always use the built dist
const corePath = resolve(__dirname, '../../../packages/core/dist/index.js');
const { compile } = await import(corePath);

const result = await compile(configPath);
const css    = Object.values(result).filter(Boolean).join('\n\n');

await mkdir(join(root, 'public'), { recursive: true });
await writeFile(outPath, `/* Generated by Holi — do not edit */\n${css}`, 'utf-8');
console.log('[holi] compiled docs CSS → public/holi.css');
```

- [ ] **Step 3: Build core packages, then test the script**

```bash
cd "E:\Holi Project"
npm run build -w packages/shared && npm run build -w packages/schema && npm run build -w packages/core
node apps/docs/scripts/compile-docs-css.mjs
```

Expected: `[holi] compiled docs CSS → public/holi.css`

Check the file exists: `cat apps/docs/public/holi.css` — should contain `:root {` with CSS custom properties.

- [ ] **Step 4: Update `.gitignore`**

Edit `E:\Holi Project\.gitignore` — append:

```
apps/docs/public/holi.css
apps/docs/public/holi-dist/
apps/docs/.next/
apps/docs/.source/
```

- [ ] **Step 5: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/holi.docs.config.json apps/docs/scripts/compile-docs-css.mjs .gitignore
git commit -m "feat(docs): dogfooding — holi.docs.config.json + prebuild script"
```

---

## Task 4: Root Layout + Header + Footer

**Files:**
- Create: `apps/docs/app/layout.tsx`
- Create: `apps/docs/components/layout/Header.tsx`
- Create: `apps/docs/components/layout/Footer.tsx`

- [ ] **Step 1: Create `apps/docs/components/layout/Header.tsx`**

```tsx
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-fd-border bg-fd-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#6366f1]" />
          <span className="text-sm font-bold tracking-wide text-fd-foreground">holi</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-fd-muted-foreground">
          <Link href="/docs/getting-started" className="hover:text-fd-foreground transition-colors">
            Docs
          </Link>
          <Link href="/playground" className="hover:text-fd-foreground transition-colors">
            Playground
          </Link>
          <a
            href="https://github.com/ChandanBose666/Holi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-fd-border px-3 py-1.5 text-xs font-medium hover:bg-fd-accent transition-colors"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
```

Note: `fd-border`, `fd-background`, `fd-foreground`, `fd-muted-foreground`, `fd-accent` are CSS variables provided by `fumadocs-ui/css/preset.css`.

- [ ] **Step 2: Create `apps/docs/components/layout/Footer.tsx`**

```tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-fd-border bg-fd-card py-8">
      <div className="mx-auto max-w-screen-xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-fd-muted-foreground">
        <p>
          Built with <span className="font-medium text-[#6366f1]">holi</span> — zero-runtime CSS.
        </p>
        <nav className="flex gap-4">
          <a
            href="https://github.com/ChandanBose666/Holi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fd-foreground transition-colors"
          >
            GitHub
          </a>
          <Link href="/docs/getting-started" className="hover:text-fd-foreground transition-colors">
            Docs
          </Link>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create `apps/docs/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:       { template: '%s | holi', default: 'holi — zero-runtime CSS' },
  description: 'One config file. Pure CSS output. No runtime. No dependencies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/holi.css" />
      </head>
      <body className={inter.className}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/app/layout.tsx apps/docs/components/layout/Header.tsx apps/docs/components/layout/Footer.tsx
git commit -m "feat(docs): root layout (RootProvider + holi.css) + Header + Footer"
```

---

## Task 5: Landing Page

**Files:**
- Create: `apps/docs/app/page.tsx`

- [ ] **Step 1: Create `apps/docs/app/page.tsx`**

```tsx
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const colorTokens = [
  { name: 'primary',    hex: '#6366F1' },
  { name: 'primary-dk', hex: '#4F46E5' },
  { name: 'surface',    hex: '#F8FAFC' },
  { name: 'text',       hex: '#1E293B' },
  { name: 'muted',      hex: '#64748B' },
];

const quickStartSteps = [
  'npm install -g holi',
  'holi init',
  'holi build',
  '# → holi-dist/ with your CSS',
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-screen-lg px-4 py-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-accent px-3 py-1 text-xs font-medium text-[#6366f1]">
            Zero runtime · Pure CSS output
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
            CSS generation,{' '}
            <span className="text-[#6366f1]">one config away</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-fd-muted-foreground">
            Define your design tokens, components, and animations in a single JSON file.
            Holi compiles them into pure, static CSS — no JavaScript runtime, no build plugins required.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className="rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5] transition-colors"
            >
              Get started →
            </Link>
            <a
              href="https://github.com/ChandanBose666/Holi"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium text-fd-muted-foreground hover:bg-fd-accent transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Live Token Swatch Strip */}
        <section className="border-y border-fd-border bg-fd-card py-12">
          <div className="mx-auto max-w-screen-lg px-4">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-fd-muted-foreground">
              Live token output — compiled from your config
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {colorTokens.map(({ name, hex }) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-14 rounded-xl shadow-sm ring-1 ring-black/5"
                    style={{ background: hex }}
                  />
                  <span className="text-xs font-medium text-fd-muted-foreground">{name}</span>
                  <span className="font-mono text-[10px] text-fd-muted-foreground/70">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="mx-auto max-w-screen-lg px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Holi?</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Zero Runtime',
                desc:  'Holi runs at build time and outputs plain .css files. No JavaScript executes in the browser.',
              },
              {
                title: 'One Config',
                desc:  'A single holi.config.json defines every token, component, animation, and breakpoint.',
              },
              {
                title: 'Pure CSS',
                desc:  'The output is standard CSS — works with any framework, any bundler, or just a <link> tag.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-fd-border bg-fd-card p-6">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#6366f1]" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm text-fd-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section className="bg-fd-card border-y border-fd-border py-20">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-8 text-center text-3xl font-bold">Up in 60 seconds</h2>
            <div className="rounded-xl bg-[#0f172a] p-6 font-mono text-sm">
              {quickStartSteps.map((code, i) => (
                <div key={i} className="flex items-start gap-3 py-1">
                  <span className="select-none text-slate-500">{String(i + 1).padStart(2, ' ')}</span>
                  <span className={code.startsWith('#') ? 'text-slate-500' : 'text-[#a5b4fc]'}>
                    {code}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/docs/getting-started" className="text-sm font-medium text-[#6366f1] hover:underline">
                Full installation guide →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify the dev server boots**

Run (from the monorepo root, after `@holi/core` is built):
```bash
cd "E:\Holi Project"
npm run dev -w apps/docs
```

Open `http://localhost:3000` — verify: hero renders, 5 colour swatches show, quick-start code block visible. Stop (Ctrl+C).

If you see a build error about `.source/server`, that's expected the first time — run `next build` first to generate `.source/`, or restart `next dev` once.

- [ ] **Step 3: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/app/page.tsx
git commit -m "feat(docs): landing page — hero, token swatches, value props, quick start"
```

---

## Task 6: Docs Layout + MDX Page Renderer + Sidebar Meta

**Files:**
- Create: `apps/docs/content/docs/meta.json`
- Create: `apps/docs/app/docs/layout.tsx`
- Create: `apps/docs/app/docs/[[...slug]]/page.tsx`
- Create: `apps/docs/app/playground/page.tsx`

- [ ] **Step 1: Create `apps/docs/content/docs/meta.json`**

```json
{
  "title": "Docs",
  "pages": [
    "getting-started",
    "config",
    "tokens",
    "components",
    "utilities",
    "animations",
    "cli",
    "advanced"
  ]
}
```

- [ ] **Step 2: Create `apps/docs/app/docs/layout.tsx`**

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/app/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{
        title: (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#6366f1]" />
            <span className="text-sm font-bold">holi</span>
          </div>
        ),
      }}
      githubUrl="https://github.com/ChandanBose666/Holi"
      sidebar={{ defaultOpenLevel: 1 }}
    >
      {children}
    </DocsLayout>
  );
}
```

- [ ] **Step 3: Create `apps/docs/app/docs/[[...slug]]/page.tsx`**

```tsx
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/layouts/docs/page';
import { source } from '@/app/source';
import { getMDXComponents } from '@/components/mdx-components';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return {
    title:       page.data.title,
    description: page.data.description,
  };
}
```

- [ ] **Step 4: Create `apps/docs/app/playground/page.tsx`**

```tsx
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function PlaygroundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fd-background">
      <Header />
      <main className="flex flex-1 items-center justify-center text-center px-4">
        <div>
          <p className="mb-2 text-4xl font-bold text-fd-foreground">Playground</p>
          <p className="mb-6 text-fd-muted-foreground">Coming soon — an interactive Holi config editor.</p>
          <Link href="/docs/getting-started" className="text-sm font-medium text-[#6366f1] hover:underline">
            ← Back to docs
          </Link>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/content/docs/meta.json apps/docs/app/docs/layout.tsx "apps/docs/app/docs/[[...slug]]/page.tsx" apps/docs/app/playground/page.tsx
git commit -m "feat(docs): docs layout (DocsLayout + getPageTree) + MDX renderer + playground"
```

---

## Task 7: Visual UI Components

**Files:**
- Create: `apps/docs/components/ui/ColorSwatch.tsx`
- Create: `apps/docs/components/ui/SpacingRuler.tsx`
- Create: `apps/docs/components/ui/LiveDemo.tsx`
- Create: `apps/docs/components/ui/CompiledCSS.tsx`
- Create: `apps/docs/components/ui/AnimationDemo.tsx`
- Create: `apps/docs/components/ui/UtilityTable.tsx`
- Create: `apps/docs/components/ui/ConfigExample.tsx`
- Create: `apps/docs/components/ui/BeforeAfter.tsx`
- Create: `apps/docs/components/mdx-components.tsx`

- [ ] **Step 1: Create `apps/docs/components/ui/ColorSwatch.tsx`**

Server Component — imports DEFAULT_CONFIG at build time.

```tsx
import { DEFAULT_CONFIG } from '@holi/core';

interface ColorSwatchProps {
  name: string;
  hex:  string;
}

export function ColorSwatch({ name, hex }: ColorSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-16 w-16 rounded-xl shadow-sm ring-1 ring-black/5"
        style={{ background: hex }}
        title={hex}
      />
      <span className="text-xs font-semibold text-fd-foreground">{name}</span>
      <span className="font-mono text-[10px] text-fd-muted-foreground">{hex}</span>
    </div>
  );
}

export function ColorSwatchGrid() {
  const colors = DEFAULT_CONFIG.tokens?.color ?? {};
  return (
    <div className="my-6 flex flex-wrap gap-6">
      {Object.entries(colors).map(([name, hex]) => (
        <ColorSwatch key={name} name={name} hex={String(hex)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/docs/components/ui/SpacingRuler.tsx`**

```tsx
import { DEFAULT_CONFIG } from '@holi/core';

interface SpacingRulerProps {
  name:  string;
  value: string;
}

export function SpacingRuler({ name, value }: SpacingRulerProps) {
  const px      = parseInt(value, 10);
  const maxPx   = 64;
  const widthPct = Math.min((px / maxPx) * 100, 100);

  return (
    <div className="flex items-center gap-4 py-1">
      <span className="w-6 shrink-0 text-right font-mono text-xs text-fd-muted-foreground">{name}</span>
      <div
        className="h-4 rounded bg-[#6366f1]/60"
        style={{ width: `${widthPct}%`, minWidth: '4px', maxWidth: '100%' }}
      />
      <span className="shrink-0 font-mono text-xs text-fd-muted-foreground">{value}</span>
    </div>
  );
}

export function SpacingRulerGrid() {
  const spacing = DEFAULT_CONFIG.tokens?.spacing ?? {};
  return (
    <div className="my-6 w-full max-w-md space-y-1">
      {Object.entries(spacing).map(([name, value]) => (
        <SpacingRuler key={name} name={name} value={String(value)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/docs/components/ui/LiveDemo.tsx`**

Client component — renders raw HTML in a sandboxed preview box.

```tsx
'use client';

interface LiveDemoProps {
  html:    string;
  height?: number;
  label?:  string;
}

export function LiveDemo({ html, height = 80, label }: LiveDemoProps) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border">
      {label && (
        <div className="border-b border-fd-border bg-fd-card px-4 py-1.5 text-xs font-medium text-fd-muted-foreground">
          {label}
        </div>
      )}
      <div className="bg-fd-background p-4">
        <div
          style={{ minHeight: height }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `apps/docs/components/ui/CompiledCSS.tsx`**

Client component — collapsible compiled CSS block.

```tsx
'use client';

import { useState } from 'react';

interface CompiledCSSProps {
  css:    string;
  label?: string;
}

export function CompiledCSS({ css, label = 'Compiled CSS output' }: CompiledCSSProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between bg-fd-card px-4 py-2.5 text-xs font-medium text-fd-muted-foreground hover:bg-fd-accent transition-colors"
      >
        <span>{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <pre className="overflow-x-auto bg-[#0f172a] p-4 text-xs text-slate-300">
          <code>{css}</code>
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `apps/docs/components/ui/AnimationDemo.tsx`**

Client component — plays animation with Replay button.

```tsx
'use client';

import { useState, useCallback } from 'react';

interface AnimationDemoProps {
  name:     string;
  cssClass: string;
  label?:   string;
}

export function AnimationDemo({ name, cssClass, label }: AnimationDemoProps) {
  const [key, setKey] = useState(0);
  const replay        = useCallback(() => setKey(k => k + 1), []);

  return (
    <div className="my-4 flex items-center gap-6 rounded-xl border border-fd-border bg-fd-card p-6">
      <div
        key={key}
        className={`h-16 w-16 shrink-0 rounded-lg bg-[#6366f1] ${cssClass}`}
        style={{ animationFillMode: 'both' }}
        title={name}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fd-foreground truncate">{label ?? `.animate-${name}`}</p>
        <p className="text-xs text-fd-muted-foreground">Click Replay to see the animation</p>
      </div>
      <button
        type="button"
        onClick={replay}
        className="shrink-0 rounded-lg border border-[#6366f1]/30 bg-fd-background px-3 py-1.5 text-xs font-medium text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
      >
        Replay
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create `apps/docs/components/ui/UtilityTable.tsx`**

Server Component — generates the table at build time from real compiler output.

```tsx
import { compileFromObject, DEFAULT_CONFIG } from '@holi/core';

interface UtilityRow {
  cls: string;
  css: string;
}

function extractUtilities(compiled: Record<string, string>): UtilityRow[] {
  const src  = compiled['utilities.css'] ?? '';
  const rows: UtilityRow[] = [];

  const ruleRe = /\.([\w-]+)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(src)) !== null) {
    const cls          = m[1];
    const declarations = m[2]
      .split(';')
      .map(d => d.trim())
      .filter(Boolean)
      .join('; ');
    rows.push({ cls: `.${cls}`, css: declarations });
  }

  return rows.slice(0, 40);
}

export function UtilityTable() {
  const compiled = compileFromObject(DEFAULT_CONFIG);
  const rows     = extractUtilities(compiled);

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-fd-border bg-fd-card text-left">
            <th className="px-3 py-2 font-semibold text-fd-foreground">Class</th>
            <th className="px-3 py-2 font-semibold text-fd-foreground">CSS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ cls, css }) => (
            <tr key={cls} className="border-b border-fd-border hover:bg-fd-accent transition-colors">
              <td className="px-3 py-2 font-mono text-xs text-[#6366f1]">{cls}</td>
              <td className="px-3 py-2 font-mono text-xs text-fd-muted-foreground">{css}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 7: Create `apps/docs/components/ui/ConfigExample.tsx`**

```tsx
interface ConfigExampleProps {
  json:   string;
  label?: string;
}

export function ConfigExample({ json, label }: ConfigExampleProps) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border">
      {label && (
        <div className="border-b border-fd-border bg-fd-card px-4 py-1.5 text-xs font-medium text-fd-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto bg-[#0f172a] p-4 text-xs text-slate-300">
        <code>{json}</code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 8: Create `apps/docs/components/ui/BeforeAfter.tsx`**

```tsx
interface BeforeAfterProps {
  before: string;
  after:  string;
  label?: string;
}

export function BeforeAfter({ before, after, label }: BeforeAfterProps) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border bg-fd-card p-4">
      {label && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded border border-fd-border bg-fd-background px-2.5 py-1.5 font-mono text-xs text-[#6366f1]">
          {before}
        </code>
        <svg className="h-4 w-4 shrink-0 text-fd-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <code className="rounded border border-fd-border bg-fd-background px-2.5 py-1.5 font-mono text-xs text-emerald-600">
          {after}
        </code>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create `apps/docs/components/mdx-components.tsx`**

```tsx
import defaultComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ColorSwatch, ColorSwatchGrid } from './ui/ColorSwatch';
import { SpacingRuler, SpacingRulerGrid } from './ui/SpacingRuler';
import { LiveDemo }       from './ui/LiveDemo';
import { CompiledCSS }    from './ui/CompiledCSS';
import { AnimationDemo }  from './ui/AnimationDemo';
import { UtilityTable }   from './ui/UtilityTable';
import { ConfigExample }  from './ui/ConfigExample';
import { BeforeAfter }    from './ui/BeforeAfter';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ColorSwatch,
    ColorSwatchGrid,
    SpacingRuler,
    SpacingRulerGrid,
    LiveDemo,
    CompiledCSS,
    AnimationDemo,
    UtilityTable,
    ConfigExample,
    BeforeAfter,
    ...components,
  };
}
```

- [ ] **Step 10: Commit**

```bash
cd "E:\Holi Project"
git add apps/docs/components/
git commit -m "feat(docs): visual UI components — ColorSwatch, SpacingRuler, LiveDemo, CompiledCSS, AnimationDemo, UtilityTable, ConfigExample, BeforeAfter + MDX registry"
```

---

## Task 8: MDX Content Pages

**Files:**
- Create: `apps/docs/content/docs/getting-started.mdx`
- Create: `apps/docs/content/docs/config.mdx`
- Create: `apps/docs/content/docs/tokens.mdx`
- Create: `apps/docs/content/docs/components.mdx`
- Create: `apps/docs/content/docs/utilities.mdx`
- Create: `apps/docs/content/docs/animations.mdx`
- Create: `apps/docs/content/docs/cli.mdx`
- Create: `apps/docs/content/docs/advanced.mdx`

All MDX files use frontmatter `title` + `description`. Custom components are provided globally via `getMDXComponents()` — no per-file imports needed.

- [ ] **Step 1: Create `apps/docs/content/docs/getting-started.mdx`**

````mdx
---
title: Getting Started
description: Install Holi and compile your first CSS in under 5 minutes.
---

## Prerequisites

Node.js **24 or later** is required.

```bash
node --version  # must be >= 24.0.0
```

## Install

```bash
npm install -g holi
# or without installing:
npx holi
```

## Init

Run `holi init` in your project root. Creates `holi.config.json` with sensible defaults. **Idempotent** — safe to run again.

```bash
holi init
# Creates holi.config.json
```

## Your first config

<ConfigExample
  label="holi.config.json (generated by holi init)"
  json={`{
  "tokens": {
    "color": { "primary": "#6366F1" },
    "spacing": { "sm": "8px", "md": "16px" }
  },
  "components": {
    "btn": {
      "base": { "padding": "spacing.sm spacing.md", "border-radius": "4px" },
      "variants": { "primary": { "background": "color.primary", "color": "#fff" } }
    }
  },
  "output": { "outputDir": "holi-dist" }
}`}
/>

Token references use dot-notation: `color.primary` resolves to `#6366F1` at compile time.

## Build

```bash
holi build
# Compiled holi-dist/tokens.css
# Compiled holi-dist/components.css
# Compiled holi-dist/utilities.css
```

## Import the CSS

```html
<link rel="stylesheet" href="holi-dist/tokens.css" />
<link rel="stylesheet" href="holi-dist/components.css" />
```

## Use a class

<LiveDemo
  label="Live demo"
  html={`<button style="display:inline-flex;padding:8px 16px;background:#6366F1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:sans-serif;">btn btn-primary</button>`}
/>
````

- [ ] **Step 2: Create `apps/docs/content/docs/config.mdx`**

````mdx
---
title: Config Reference
description: Complete holi.config.json schema — every field with types, examples, and defaults.
---

Holi is configured through a single `holi.config.json` file. Every field is optional.

## Top-level shape

```ts
interface HoliConfig {
  tokens?:      TokensConfig;
  breakpoints?: Record<string, string>;
  components?:  Record<string, ComponentConfig>;
  animations?:  Record<string, AnimationConfig>;
  output?:      OutputConfig;
}
```

## `tokens`

```ts
interface TokensConfig {
  color?:      Record<string, string>;
  spacing?:    Record<string, string>;
  typography?: Record<string, string>;
  radius?:     Record<string, string>;
  shadow?:     Record<string, string>;
}
```

<ConfigExample json={`{
  "tokens": {
    "color":      { "primary": "#6366F1", "surface": "#F8FAFC" },
    "spacing":    { "sm": "8px", "md": "16px" },
    "typography": { "sans": "\\"Inter\\", sans-serif", "size-base": "1rem" },
    "radius":     { "md": "8px" },
    "shadow":     { "sm": "0 1px 3px rgba(0,0,0,0.1)" }
  }
}`} />

| Field | Type | Default |
|-------|------|---------|
| `color` | `Record<string, string>` | `{ primary, primary-dk, surface, text, muted }` |
| `spacing` | `Record<string, string>` | `{ xs, sm, md, lg, xl }` |
| `typography` | `Record<string, string>` | `{ sans, size-sm, size-base, size-lg }` |
| `radius` | `Record<string, string>` | `{ sm, md, lg }` |
| `shadow` | `Record<string, string>` | `{ sm }` |

## `breakpoints`

```ts
breakpoints?: Record<string, string>
// Default: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" }
```

## `components`

```ts
interface ComponentConfig {
  base:      Record<string, string>;
  variants?: Record<string, Record<string, string>>;
}
```

## `animations`

```ts
interface AnimationConfig {
  keyframes: Record<string, Record<string, string>>;
  duration?: string;
  easing?:   string;
}
```

## `output`

```ts
interface OutputConfig {
  outputDir?: string;   // default: "holi-dist"
  prefix?:    string;   // class prefix, e.g. "h" → .h-btn
  utilities?: boolean;  // default: true
}
```
````

- [ ] **Step 3: Create `apps/docs/content/docs/tokens.mdx`**

````mdx
---
title: Tokens
description: Visual reference for every design token — colors, spacing, typography, radius, and shadows.
---

Tokens are the foundation of your design system. Define them once in `holi.config.json`; reference them with dot-notation anywhere.

## Colors

<ColorSwatchGrid />

Each token becomes a CSS custom property at compile time: `--color-primary`, `--color-surface`, etc.

## Spacing

<SpacingRulerGrid />

## Typography

| Token | Value |
|-------|-------|
| `sans` | `"Inter", sans-serif` |
| `size-sm` | `0.875rem` |
| `size-base` | `1rem` |
| `size-lg` | `1.25rem` |

## Radius

| Token | Value | Preview |
|-------|-------|---------|
| `sm` | `4px` | <div style={{display:'inline-block',width:40,height:40,background:'#6366F1',borderRadius:4}}/> |
| `md` | `8px` | <div style={{display:'inline-block',width:40,height:40,background:'#6366F1',borderRadius:8}}/> |
| `lg` | `16px` | <div style={{display:'inline-block',width:40,height:40,background:'#6366F1',borderRadius:16}}/> |

## Shadows

| Token | Preview |
|-------|---------|
| `sm` | <div style={{display:'inline-block',width:60,height:40,background:'white',borderRadius:8,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}/> |

## Referencing tokens

Use dot-notation inside any string value. Holi resolves references at compile time.

<BeforeAfter before="padding: spacing.sm spacing.md" after="padding: 8px 16px" label="Token resolution" />
<BeforeAfter before="background: color.primary" after="background: #6366F1" label="Token resolution" />
````

- [ ] **Step 4: Create `apps/docs/content/docs/components.mdx`**

````mdx
---
title: Components
description: Define reusable CSS component classes with base styles and named variants.
---

## Built-in: `btn`

<LiveDemo
  label="btn variants"
  html={`<div style="display:flex;gap:8px;flex-wrap:wrap;font-family:sans-serif;">
    <button style="display:inline-flex;padding:8px 16px;background:#6366F1;color:#fff;border:none;border-radius:8px;cursor:pointer;">btn-primary</button>
    <button style="display:inline-flex;padding:8px 16px;background:transparent;border:1px solid #6366F1;color:#6366F1;border-radius:8px;cursor:pointer;">btn-ghost</button>
  </div>`}
/>

<ConfigExample label="Config that produced it" json={`{
  "components": {
    "btn": {
      "base": {
        "display": "inline-flex",
        "padding": "spacing.sm spacing.md",
        "border-radius": "radius.md",
        "cursor": "pointer"
      },
      "variants": {
        "primary": { "background": "color.primary", "color": "#fff" },
        "ghost": {
          "background": "transparent",
          "border": "1px solid color.primary",
          "color": "color.primary"
        }
      }
    }
  }
}`} />

## Built-in: `card`

<LiveDemo
  label="card"
  html={`<div style="padding:32px;background:#F8FAFC;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);font-family:sans-serif;max-width:300px;">A card component styled with Holi tokens.</div>`}
/>

## Custom component walkthrough

**Step 1** — Define in `holi.config.json`:

<ConfigExample json={`{
  "components": {
    "badge": {
      "base": {
        "display": "inline-flex",
        "padding": "spacing.xs spacing.sm",
        "border-radius": "radius.sm",
        "font-size": "typography.size-sm"
      },
      "variants": {
        "info": { "background": "color.primary", "color": "#fff" }
      }
    }
  }
}`} />

**Step 2** — Build: `holi build`

**Step 3** — Use in HTML:

```html
<span class="badge badge-info">New</span>
```

<LiveDemo
  label="Result"
  html={`<span style="display:inline-flex;padding:4px 8px;border-radius:4px;font-size:0.875rem;background:#6366F1;color:#fff;font-family:sans-serif;">New</span>`}
/>
````

- [ ] **Step 5: Create `apps/docs/content/docs/utilities.mdx`**

````mdx
---
title: Utilities
description: Auto-generated utility classes for display, spacing, and responsive layouts.
---

Holi auto-generates utility classes from your spacing tokens. Every spacing value produces a full set of `m-*`, `p-*`, `mx-*`, `my-*`, etc. classes.

## All utility classes

Generated at build time from `compileFromObject(DEFAULT_CONFIG)` — always reflects your real config.

<UtilityTable />

## Responsive variants

```html
<!-- flex on mobile, grid on medium+ screens -->
<div class="flex md:grid">...</div>
```

| Prefix | Breakpoint |
|--------|-----------|
| `sm:` | `@media (min-width: 640px)` |
| `md:` | `@media (min-width: 768px)` |
| `lg:` | `@media (min-width: 1024px)` |
| `xl:` | `@media (min-width: 1280px)` |

## Disabling utilities

```json
{ "output": { "utilities": false } }
```
````

- [ ] **Step 6: Create `apps/docs/content/docs/animations.mdx`**

````mdx
---
title: Animations
description: Define @keyframes animations in your config and use them as helper classes.
---

## Built-in: `fade-in`

<AnimationDemo name="fade-in" cssClass="animate-fade-in" />

<ConfigExample label="Config" json={`{
  "animations": {
    "fade-in": {
      "keyframes": {
        "0%": { "opacity": "0" },
        "100%": { "opacity": "1" }
      },
      "duration": "300ms",
      "easing": "ease-out"
    }
  }
}`} />

<CompiledCSS css={`@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 300ms ease-out;
}`} />

## Adding a custom animation

<ConfigExample json={`{
  "animations": {
    "slide-up": {
      "keyframes": {
        "0%": { "transform": "translateY(12px)", "opacity": "0" },
        "100%": { "transform": "translateY(0)", "opacity": "1" }
      },
      "duration": "400ms",
      "easing": "ease-out"
    }
  }
}`} />

After running `holi build`:

```html
<div class="animate-slide-up">Hello</div>
```
````

- [ ] **Step 7: Create `apps/docs/content/docs/cli.mdx`**

````mdx
---
title: CLI Reference
description: All three Holi CLI commands — init, build, and watch.
---

## `holi init`

```
Usage: holi init
```

Creates `holi.config.json` in the current directory with default tokens, a `btn` component, and a `fade-in` animation. **Idempotent** — will not overwrite an existing file.

---

## `holi build`

```
Usage: holi build [options]

Options:
  -c, --config <path>   Path to config file (default: holi.config.json)
```

Reads your config, compiles all tokens / components / utilities / animations, and writes CSS to the output directory.

```bash
holi build
#  Compiling...
#  Compiled tokens.css
#  Compiled components.css
#  Compiled utilities.css
#  Compiled animations.css
```

**Custom config path:**

```bash
holi build -c path/to/custom.config.json
```

---

## `holi watch`

```
Usage: holi watch [options]

Options:
  -c, --config <path>   Path to config file (default: holi.config.json)
```

Watches `holi.config.json` for changes and re-runs build automatically. Uses a 50ms debounce. Press `Ctrl+C` to stop.

```bash
holi watch
# Watching holi.config.json...
# [change detected] Re-compiling...
#  Done.
```
````

- [ ] **Step 8: Create `apps/docs/content/docs/advanced.mdx`**

````mdx
---
title: Advanced
description: Output prefix, custom dirs, disabling utilities, multiple breakpoints, and circular token references.
---

## Output prefix

Namespace all generated class names to avoid collisions.

<ConfigExample json={`{ "output": { "prefix": "h" } }`} />

| Without prefix | With `prefix: "h"` |
|---------------|---------------------|
| `.btn` | `.h-btn` |
| `.btn-primary` | `.h-btn-primary` |
| `.flex` | `.h-flex` |

## Custom output directory

```json
{ "output": { "outputDir": "dist/css" } }
```

## Disabling utilities

```json
{ "output": { "utilities": false } }
```

## Multiple breakpoints

<ConfigExample json={`{
  "breakpoints": {
    "xs": "480px",
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  }
}`} />

## Circular token references

If a token references itself or creates a cycle, Holi throws:

```
HoliValidationError: Circular token reference detected (depth > 10): color.a
```

<BeforeAfter
  label="Fix: break the cycle"
  before="color.a → color.b → color.a"
  after='color.a: "#6366F1"'
/>
````

- [ ] **Step 9: Commit all MDX pages**

```bash
cd "E:\Holi Project"
git add apps/docs/content/
git commit -m "feat(docs): all 8 MDX content pages — getting-started through advanced"
```

---

## Task 9: Integration Check + Vercel Config

**Files:**
- Create: `apps/docs/vercel.json`

- [ ] **Step 1: Create `apps/docs/vercel.json`**

```json
{
  "buildCommand": "cd ../.. && npm run build:docs",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm install"
}
```

- [ ] **Step 2: Run full integration check**

```bash
cd "E:\Holi Project"
npm run dev -w apps/docs
```

Open `http://localhost:3000` and verify:

- [ ] Landing page loads — hero, 5 colour swatches, quick-start code block
- [ ] `http://localhost:3000/docs/getting-started` — sidebar shows all 8 pages, LiveDemo renders a button
- [ ] `http://localhost:3000/docs/tokens` — ColorSwatchGrid shows 5 swatches, SpacingRulerGrid shows rulers
- [ ] `http://localhost:3000/docs/utilities` — UtilityTable renders rows from real compiled output
- [ ] `http://localhost:3000/docs/animations` — AnimationDemo shows the Replay button
- [ ] `http://localhost:3000/docs/components` — LiveDemo renders the btn variants
- [ ] `http://localhost:3000/playground` — "Coming soon" message
- [ ] Right-side TOC appears on each docs page

Stop the server (Ctrl+C).

- [ ] **Step 3: Run `next build` — verify zero errors**

```bash
cd "E:\Holi Project/apps/docs"
npm run build
```

Expected: build completes with no TypeScript or compilation errors.

- [ ] **Step 4: Final commit + push**

```bash
cd "E:\Holi Project"
git add apps/docs/vercel.json
git commit -m "feat(docs): Vercel config — Phase 3 complete"
git push origin main
```

---

## Checklist (from spec)

- [ ] `npm run dev -w apps/docs` starts at `localhost:3000`
- [ ] Landing page shows colour swatches from real Holi token output
- [ ] Getting Started page walks through init → build → use
- [ ] Config reference covers every field with type + example
- [ ] Token page shows visual swatches, spacing rulers, type scale
- [ ] Component page renders `.btn` and `.btn-primary` live in the browser
- [ ] Utilities page shows display + spacing classes in a table with live demos
- [ ] Animations page shows animated boxes with a Replay button
- [ ] CLI page documents all three commands with usage examples
- [ ] `public/holi.css` is compiled from `holi.docs.config.json` at build time
- [ ] `next build` produces a build with no errors
