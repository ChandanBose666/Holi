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
