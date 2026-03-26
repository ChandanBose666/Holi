import type { ResolvedConfig, EmitResult } from '@holi.dev/shared';

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

export function emitComponent(
  name: string,
  component: { base: Record<string, string>; variants?: Record<string, Record<string, string>> },
  prefix = '',
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
  return css;
}

export function emitComponents(
  components: ResolvedConfig['components'],
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, component] of Object.entries(components ?? {})) {
    result[`${name}.css`] = emitComponent(name, component, prefix);
  }
  return result;
}

export function emitUtilities(
  tokens: ResolvedConfig['tokens'],
  breakpoints: ResolvedConfig['breakpoints'],
  emitFlag: boolean,
  prefix = '',
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

  // Responsive breakpoint variants (display utilities only)
  for (const [bp, minWidth] of Object.entries(breakpoints ?? {})) {
    lines.push(`\n@media (min-width: ${minWidth}) {`);
    for (const name of Object.keys(DISPLAY_UTILITIES)) {
      const cls = applyPrefix(`.${bp}\\:${name}`, prefix);
      lines.push(`  ${cls} { ${DISPLAY_UTILITIES[name]} }`);
    }
    lines.push('}');
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
  const prefix = config.output?.prefix ?? '';
  const utilitiesEnabled = config.output?.utilities ?? true;
  return {
    'tokens.css':     emitTokens(config.tokens),
    ...emitComponents(config.components ?? {}, prefix),
    'utilities.css':  emitUtilities(config.tokens, config.breakpoints ?? {}, utilitiesEnabled, prefix),
    'animations.css': emitAnimations(config.animations, prefix),
  };
}
