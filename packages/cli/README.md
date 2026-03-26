# @holi.dev/cli

CLI for **holi** — zero-runtime CSS compiler. Define design tokens, components, utilities, and animations in a single JSON config. Holi resolves all references and emits pure static CSS.

## Usage

```bash
# No install needed
npx @holi.dev/cli init     # scaffold holi.config.json
npx @holi.dev/cli build    # compile → holi.css
npx @holi.dev/cli watch    # watch mode
```

Or install globally for the short `holi` command:

```bash
npm install -g @holi.dev/cli
holi build
```

## Example

**`holi.config.json`**

```json
{
  "output": "holi.css",
  "tokens": {
    "color": { "primary": "#6366f1", "surface": "#fff" },
    "spacing": { "sm": "0.5rem", "md": "1rem" }
  },
  "components": {
    "button": {
      "base": "display: inline-flex; padding: {spacing.sm} {spacing.md};",
      "variants": {
        "primary": "background: {color.primary}; color: #fff;"
      }
    }
  },
  "utilities": {
    "text-primary": "color: {color.primary};"
  },
  "animations": {
    "fade-in": {
      "keyframes": "from { opacity: 0; } to { opacity: 1; }",
      "duration": "200ms",
      "easing": "ease-out"
    }
  }
}
```

**Output `holi.css`**

```css
:root { --color-primary: #6366f1; --spacing-md: 1rem; }
.button { display: inline-flex; padding: 0.5rem 1rem; }
.button--primary { background: #6366f1; color: #fff; }
.text-primary { color: #6366f1; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fade-in 200ms ease-out; }
```

## CLI Reference

```
holi init              Create holi.config.json in the current directory
holi build             Compile config → CSS
holi build -c <path>   Custom config file path
holi build -o <path>   Custom output file path
holi watch             Watch and rebuild on change
```

## Full documentation

See the [main repository](https://github.com/ChandanBose666/Holi) for the complete config reference, framework integration guides, and programmatic API.
