import type { ResolvedConfig, EmitResult, ComponentConfig } from '@holi.dev/shared';
import { emitStates } from './states-emitter';
import { emitResponsive } from './responsive-emitter';
import { emitThemes } from './themes-emitter';
import { applyPrefix } from './utils';

const DISPLAY_UTILITIES: Record<string, string> = {
  flex:           'display: flex;',
  grid:           'display: grid;',
  block:          'display: block;',
  inline:         'display: inline;',
  'inline-flex':  'display: inline-flex;',
  'inline-block': 'display: inline-block;',
  hidden:         'display: none;',
};

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
  const prefix        = config.output?.prefix ?? '';
  const utilitiesFlag = config.output?.utilities ?? true;
  const breakpoints   = config.breakpoints ?? {};
  const include       = config.output?.include;
  const themeStrategy = config.output?.themeStrategy ?? 'media';

  return {
    'tokens.css':     emitTokens(config.tokens),
    ...emitComponents(config.components ?? {}, prefix, breakpoints, include),
    'utilities.css':  emitUtilities(config.tokens, breakpoints, utilitiesFlag, prefix, config.utilities),
    'animations.css': emitAnimations(config.animations, prefix),
    'themes.css':     emitThemes(config.themes, themeStrategy),
  };
}
