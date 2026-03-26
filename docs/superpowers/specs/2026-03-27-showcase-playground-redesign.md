# Showcase & Playground Redesign

**Date:** 2026-03-27
**Status:** Approved

---

## Problem Statement

Two pages need significant improvement:

1. **Showcase** — dark page background nearly hides token swatches (no contrast), iframe previews feel dull and disconnected, content overlaps visually. Does not give a developer confidence in the library.
2. **Playground** — three static panels with no guiding entry point, no way to understand what the tool produces across multiple files, and no interactivity between the preview and the config.

---

## Approach

**Hybrid: server shell + client islands.**

Page shells, token data, Shiki-highlighted CSS blocks, and all `compileFromObject` calls stay as server components. Only the parts that genuinely need interactivity become client components — sidebar navigation state, variant switcher pills, and the token editor. No JS is shipped for static content.

---

## Showcase Page

### Architecture

```
ShowcasePage (Server Component)
├── ShowcaseSidebar (Client Component — island 1)
│   └── Navigates via URL search param: ?section=colors|spacing|radius|typography|btn|card|…
├── ShowcaseTokenSection (Server Component)
│   ├── ColorSwatches
│   ├── SpacingSwatches
│   ├── RadiusSwatches
│   └── TypographyTokens
└── ShowcaseComponentSection (Server Component)
    └── ComponentDetailCard
        └── VariantSwitcher (Client Component — island 2)
```

### Layout

Two-column layout: fixed left sidebar (200px) + scrollable right content area.

**Sidebar (`ShowcaseSidebar` — client):**
- Header: "Design System"
- Section: **Tokens** — items: Colors `(N)`, Spacing `(N)`, Radius `(N)`, Typography `(N)`
- Section: **Components** — one item per component in `DEFAULT_CONFIG.components`, labelled `.name` with variant count badge e.g. `2v`
- Active item: indigo left border + `#6366f115` background
- Navigation: clicking an item sets `?section=<key>` URL param (using `router.replace`, no full page reload)
- On load: reads `searchParams.get('section')`, defaults to `colors`

**Content area (server-rendered per section):**

*Token sections (Colors / Spacing / Radius / Typography):*
- Section header: title + token count
- **Token cards on `#f8fafc` white background** — this directly fixes the contrast issue. Each card: coloured swatch (full width, 56px tall) + token name + resolved value below in monospace. Cards arranged in `auto-fill minmax(100px, 1fr)` grid.
- Spacing: visual bar showing proportional width
- Radius: box showing the actual border-radius value applied

*Component sections (.btn / .card / …):*
- Section header: `.componentName` + variant count
- **`ComponentDetailCard`** (server shell):
  - Top bar: component name + `VariantSwitcher` pills (client island)
  - **White preview area** (`#f8fafc`, min 100px tall) — actual HTML elements styled with the compiled CSS injected via a `<style>` tag. No iframe. The active variant controls which elements are shown.
  - **Token origin strip** — row of chips showing every token used: colour chip + `color.primary`, `spacing.sm · md`, `radius.md`
  - **Compiled CSS block** — Shiki-highlighted, server-rendered. Inline comments show the token name each value came from: `/* color.primary */`

### What this fixes

| Issue | Fix |
|-------|-----|
| Background hides content | Token swatches on `#f8fafc` white cards |
| Iframe previews feel wrong | Direct HTML elements with injected `<style>` |
| Dull and overlapping | Sidebar explorer structure + token origin strip gives context |

---

## Playground Page

### Architecture

```
PlaygroundPage (Server Component — shell only)
└── Suspense
    └── PlaygroundLayout (Client Component — all interactivity lives here)
        ├── PresetPills
        ├── ConfigEditor (Monaco, ssr:false)
        ├── OutputPanel
        │   └── FileTabs (btn.css / card.css / tokens.css / utilities.css)
        ├── PreviewPanel
        │   ├── ComponentPreviewCard × N (one per component in compiled output)
        │   │   └── VariantPills
        │   └── TokenEditorPopup (shown when a card is clicked)
        └── ActionBar (Download CSS, Copy all, Reset, Share)
```

### Header additions

**Preset pills** (row of pill buttons between logo and action buttons):
- Pills: `Minimal`, `Full`, `Dark theme`, `Brutalist`
- Each maps to a hardcoded config object defined in the client component
- Clicking loads that config string into Monaco and triggers recompile
- Active pill highlighted with indigo ring

**Action buttons** (right side):
- `⬇ Download CSS` — triggers browser download of the full compiled CSS as a `.css` file
- `📋 Copy all` — copies full CSS to clipboard
- `Reset` — clears Monaco back to the active preset's config
- `⇧ Share` — existing URL-encoding behaviour, unchanged

### Panel 1 — Config Editor

Monaco editor, unchanged except:
- Add `colorDecorators: true` to Monaco options — this is a built-in Monaco feature that automatically renders small colour swatches inline next to any hex/rgb/hsl value. Zero custom code needed.

### Panel 2 — CSS Output

Adds **file tabs** above the code block:
- One tab per key in the `compileFromObject` result: `btn.css`, `card.css`, `tokens.css`, `utilities.css`
- Active tab controls which file's content is displayed in the panel
- Tab state: `useState<string>` initialised to the first key

Compiled CSS in each tab includes inline token comments (e.g. `/* color.primary */`). These are added as a **post-processing step inside the `compile()` helper in `PlaygroundLayout`**, not inside `@holi.dev/core`. After `compileFromObject` returns a CSS string, the helper walks `configObj.tokens` and replaces each resolved value with `value /* tokenPath */` using a regex substitution. No changes to the core package.

### Panel 3 — Interactive Preview

Replaces the single iframe with a scrollable column of **per-component preview cards**.

**`ComponentPreviewCard`:**
- Header: component name (`.btn`) + variant pills
- **White preview area** (`#f8fafc`) — actual HTML elements with a `<style>` tag injecting the compiled CSS for this component. Click events work natively, no iframe messaging.
- Variant pills: `useState` tracks active variant. Clicking switches which element is rendered.
- Clicking anywhere on the card (or a dedicated "inspect" affordance) opens the `TokenEditorPopup` for that component.

**`TokenEditorPopup` (floating panel):**
- Appears inline below the preview card (not a modal — keeps context)
- Title: `.componentName tokens`  ✕ close button
- One row per token used by this component, derived from `extractTokenUsage(configObj, componentName)`
- **Colour tokens** → `<input type="color">` rendered as a coloured swatch button (native colour picker on click)
- **Spacing / radius tokens** → `<input type="range">` with min/max derived from reasonable defaults (spacing: 0–64px step 1, radius: 0–32px step 1), current value shown as `Npx` label
- On change: the new value is written back into the Monaco config string using a string replacement of the token value, triggering the existing `useEffect` recompile
- The preview card's white area reflects changes immediately because the `<style>` tag is derived from the compiled CSS state

### Token map from compile output

`compileFromObject` currently returns `{ [filename]: cssString }`. To power the token editor, a helper function `extractTokenUsage(configObj, componentName)` is added to `PlaygroundLayout`:
- Walks `configObj.tokens` and `configObj.components[name]` to find all token references used by that component
- Returns `Array<{ tokenPath: string, resolvedValue: string, type: 'color' | 'spacing' | 'radius' | 'other' }>`
- Pure function with no browser dependencies — runs on both server (for showcase token strip) and client (for playground token editor)

---

## File Changes Summary

### New files
- `apps/web/components/showcase/ShowcaseSidebar.tsx` — client island
- `apps/web/components/showcase/VariantSwitcher.tsx` — client island
- `apps/web/components/showcase/ComponentDetailCard.tsx` — server component
- `apps/web/components/showcase/TokenSection.tsx` — server component
- `apps/web/components/playground/ComponentPreviewCard.tsx` — client component
- `apps/web/components/playground/TokenEditorPopup.tsx` — client component
- `apps/web/lib/tokenUsage.ts` — `extractTokenUsage` helper (pure function, used by both server and client components)

### Modified files
- `apps/web/app/showcase/page.tsx` — restructure to use sidebar + content layout
- `apps/web/components/gallery/TokenGrid.tsx` — restyle onto white card backgrounds
- `apps/web/components/gallery/ComponentCard.tsx` — restyle, remove iframe, add token strip
- `apps/web/app/playground/page.tsx` — no change (just the Suspense wrapper)
- `apps/web/components/playground/PlaygroundLayout.tsx` — add preset pills (inline, not extracted), file tabs, download/copy, wire up new preview panel
- `apps/web/components/playground/ConfigEditor.tsx` — add `colorDecorators: true`
- `apps/web/components/playground/CSSOutput.tsx` — add file tab state
- `apps/web/app/globals.css` — add styles for new showcase layout + component card styles

### Deleted files
- `apps/web/components/gallery/ComponentCard.tsx` — replaced by `ComponentDetailCard.tsx` (showcase) and `ComponentPreviewCard.tsx` (playground)
- `apps/web/components/gallery/TokenGrid.tsx` — replaced by `TokenSection.tsx`; old file removed

---

## Out of Scope

- Authentication, user accounts, saved configs
- Animations preview section (existing behaviour unchanged)
- Mobile/responsive layout (desktop-first, same as current)
- Dark/light mode toggle on the showcase page
