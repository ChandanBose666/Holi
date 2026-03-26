# Holi Phase 5 — holi.dev Marketing & Visual Docs Site

**Goal:** A visual, interactive showcase site (like CSS-Tricks / MDN) that makes developers want to use Holi. Separate from the Fumadocs reference site — this is about feel, not just reference.

**Architecture:** New `apps/web` Next.js 16 app. Uses `@holi.dev/core/browser` (already published) for client-side compilation — no API needed. Playground works entirely in the browser.

---

## File Map

```
apps/web/
  package.json                        # @holi/web, Next.js 16, monaco, shiki
  next.config.mjs
  tsconfig.json
  app/
    layout.tsx                        # root layout, Geist font, dark mode
    page.tsx                          # landing page
    playground/
      page.tsx                        # full interactive playground
    showcase/
      page.tsx                        # component gallery + animations
  components/
    landing/
      Hero.tsx                        # headline + mini live playground
      Features.tsx                    # 3-col: zero runtime / tokens / any framework
      CodeSplit.tsx                   # config left | CSS right | HTML tab
      Integrations.tsx                # Next.js / Vite / Astro / SvelteKit snippets
      ShowcaseStrip.tsx               # scrolling rendered component strip
    playground/
      ConfigEditor.tsx                # Monaco editor (left panel)
      CSSOutput.tsx                   # shiki-highlighted CSS (right panel)
      Preview.tsx                     # srcdoc iframe (rendered output)
      PlaygroundLayout.tsx            # 3-panel shell
    gallery/
      TokenGrid.tsx                   # color swatches, spacing scale, radius, font
      ComponentCard.tsx               # rendered component + variant tabs + code
      AnimationCard.tsx               # live animation loop + keyframe code
    ui/
      CopyButton.tsx                  # one-click copy for config / CSS snippets
      TabGroup.tsx                    # reusable tabs
```

---

## Landing Page Structure

```
┌─────────────────────────────────────────────────────┐
│  Hero                                               │
│  "One config. Pure CSS. No runtime."                │
│  Mini playground: 5-line config → instant CSS       │
│  CTA: "Try the full playground →"                   │
├─────────────────────────────────────────────────────┤
│  Features (3 cards)                                 │
│  Zero runtime | Token references | Any framework    │
├─────────────────────────────────────────────────────┤
│  Showcase strip (rendered: button, card, badge…)    │
├─────────────────────────────────────────────────────┤
│  Code split                                         │
│  holi.config.json  |  output CSS  |  HTML usage    │
├─────────────────────────────────────────────────────┤
│  Framework integrations                             │
│  Next.js / Vite / Astro / SvelteKit copy snippets  │
├─────────────────────────────────────────────────────┤
│  Footer — npm install, GitHub, docs link            │
└─────────────────────────────────────────────────────┘
```

---

## Task 1: Scaffold `apps/web`

- [ ] Add `apps/web` to root workspace (`"workspaces": ["packages/*", "apps/*"]` already done)
- [ ] Create `apps/web/package.json` — deps: next, react, react-dom, @monaco-editor/react, shiki, @holi.dev/core
- [ ] Create `apps/web/next.config.mjs`
- [ ] Create `apps/web/tsconfig.json`
- [ ] Create root layout with Geist font, dark mode default, global CSS
- [ ] Commit

---

## Task 2: Landing Page

- [ ] `Hero.tsx` — headline, sub, mini 3-panel (config → CSS → preview using compileFromObject)
- [ ] `Features.tsx` — icon + title + description cards
- [ ] `CodeSplit.tsx` — tabbed example: config / output / HTML
- [ ] `Integrations.tsx` — Next.js prebuild, Vite, Astro, SvelteKit snippets with copy button
- [ ] `ShowcaseStrip.tsx` — horizontal scroll of rendered holi-styled components
- [ ] Wire `app/page.tsx`
- [ ] Commit

---

## Task 3: Full Playground Page

- [ ] `ConfigEditor.tsx` — Monaco editor, JSON mode, default = DEFAULT_CONFIG, onChange triggers compile
- [ ] `CSSOutput.tsx` — shiki highlighted CSS, copy button, error state
- [ ] `Preview.tsx` — srcdoc iframe: injects compiled CSS + sample HTML, re-renders on compile
- [ ] `PlaygroundLayout.tsx` — 3-panel resizable layout (editor | css | preview)
- [ ] Wire `app/playground/page.tsx`
- [ ] Share state via URL (base64 encode config in query param for shareable links)
- [ ] Commit

---

## Task 4: Showcase Page

- [ ] `TokenGrid.tsx` — reads DEFAULT_CONFIG, renders color swatches, spacing scale, radius, fonts
- [ ] `ComponentCard.tsx` — rendered component, variant switcher tabs, config + CSS code panels
- [ ] `AnimationCard.tsx` — live looping animation preview + keyframe code
- [ ] Wire `app/showcase/page.tsx`
- [ ] Commit

---

## Task 5: Deploy to Vercel

- [ ] Add `apps/web` to `vercel.json` (or create separate Vercel project)
- [ ] Set up custom domain (holi.dev or web.holi.dev)
- [ ] Add `build:web` script to root package.json
- [ ] Commit + push → auto-deploy

---

## Key Technical Notes

- **Client-side compilation** — import `compileFromObject` from `@holi.dev/core/browser` in a Client Component. No API route needed. Compile runs in the browser on every config change.
- **Monaco editor** — use `@monaco-editor/react`, lazy-load with `next/dynamic` to avoid SSR issues.
- **iframe preview** — use `srcdoc` attribute with injected `<style>` tag from compiled CSS + sample HTML. No external requests.
- **Shareable playground** — `btoa(JSON.stringify(config))` → URL param `?c=...`. On load, `atob(param)` → parse → compile.
- **Dark mode** — default dark, use `className="dark"` on `<html>`. Zinc/slate palette with one indigo accent.
- **No Fumadocs** — this site is pure Next.js App Router. Fumadocs stays in `apps/docs`.
