import type { HoliConfig, ResolvedConfig } from '@holi/shared';

export function flattenTokens(tokens: HoliConfig['tokens']): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [category, values] of Object.entries(tokens)) {
    if (!values) continue;
    for (const [key, value] of Object.entries(values)) {
      map[`${category}.${key}`] = value;
    }
  }
  return map;
}

export function resolveValue(
  value: string,
  tokenMap: Record<string, string>,
  depth = 0,
): string {
  if (depth > 10) {
    throw new Error(`Circular token reference detected: "${value}"`);
  }
  if (tokenMap[value] !== undefined) {
    return resolveValue(tokenMap[value], tokenMap, depth + 1);
  }
  return value.replace(/[\w-]+\.[\w-]+/g, (ref) => tokenMap[ref] ?? ref);
}

export function resolve(config: HoliConfig): ResolvedConfig {
  const tokenMap = flattenTokens(config.tokens);
  return JSON.parse(
    JSON.stringify(config, (_key, val) => {
      if (typeof val === 'string') return resolveValue(val, tokenMap);
      return val;
    }),
  ) as ResolvedConfig;
}
