import type { HoliConfig, ResolvedConfig } from '@holi.dev/shared';

export function flattenTokens(tokens: HoliConfig['tokens']): Record<string, string> {
  const map: Record<string, string> = {};

  function flattenNestedMap(obj: Record<string, string | Record<string, any>>, prefix: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        map[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        flattenNestedMap(value, fullKey);
      }
    }
  }

  for (const [category, values] of Object.entries(tokens)) {
    if (!values) continue;
    flattenNestedMap(values, category);
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
