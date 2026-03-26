import type { HoliConfig } from '@holi.dev/shared';

export interface TokenUsage {
  tokenPath: string;
  resolvedValue: string;
  type: 'color' | 'spacing' | 'radius' | 'other';
}

/**
 * Walks a component's base + variant style maps and returns all token references
 * it uses, with their resolved values. Pure function — no browser dependencies.
 */
export function extractTokenUsage(config: HoliConfig, componentName: string): TokenUsage[] {
  const component = config.components?.[componentName];
  if (!component) return [];

  const tokenPaths = new Set<string>();

  const collectFromMap = (map: Record<string, string>) => {
    for (const value of Object.values(map)) {
      // Match patterns like "color.primary", "spacing.md", "radius.lg"
      const matches = value.match(/[a-z-]+\.[a-z-]+/g) ?? [];
      for (const match of matches) {
        const [cat] = match.split('.');
        if (config.tokens[cat]) tokenPaths.add(match);
      }
    }
  };

  collectFromMap(component.base);
  for (const variant of Object.values(component.variants ?? {})) {
    collectFromMap(variant);
  }

  const result: TokenUsage[] = [];
  for (const path of tokenPaths) {
    const [category, name] = path.split('.');
    const resolved = config.tokens[category]?.[name];
    if (!resolved) continue;
    const type: TokenUsage['type'] =
      category === 'color'   ? 'color'   :
      category === 'spacing' ? 'spacing' :
      category === 'radius'  ? 'radius'  : 'other';
    result.push({ tokenPath: path, resolvedValue: resolved, type });
  }

  return result;
}
