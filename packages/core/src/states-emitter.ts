import type { ComponentConfig } from '@holi.dev/shared';
import { applyPrefix } from './utils';

const PSEUDO_ELEMENTS = new Set(['before', 'after', 'placeholder']);

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
