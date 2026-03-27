import type { HoliConfig, ResolvedConfig } from '@holi.dev/shared';
import { HoliResolverError } from './errors';
import { findClosest } from './did-you-mean';

export { HoliResolverError };

export function flattenTokens(
  tokens: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (value === undefined || value === null) continue;
    const dotKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      map[dotKey] = value;
    } else if (typeof value === 'object') {
      Object.assign(map, flattenTokens(value as Record<string, unknown>, dotKey));
    }
  }
  return map;
}

export function resolveValue(
  value: string,
  tokenMap: Record<string, string>,
  mode: 'inline' | 'variables' = 'inline',
  location = '',
  depth = 0,
): string {
  if (depth > 10) {
    throw new HoliResolverError(`Circular token reference detected: "${value}"`);
  }

  // Direct reference: the whole value is a known token key
  if (tokenMap[value] !== undefined) {
    if (mode === 'variables') return `var(--${value.replace(/\./g, '-')})`;
    return resolveValue(tokenMap[value], tokenMap, mode, location, depth + 1);
  }

  // Embedded references within a compound value (e.g. "spacing.sm spacing.md")
  return value.replace(/([\w-]+\.)+[\w-]+/g, (ref) => {
    if (tokenMap[ref] !== undefined) {
      if (mode === 'variables') return `var(--${ref.replace(/\./g, '-')})`;
      return tokenMap[ref]!;
    }
    // Unknown reference
    if (mode === 'variables') return `var(--${ref.replace(/\./g, '-')})`;
    const hint = findClosest(ref, Object.keys(tokenMap));
    const suffix = hint ? `\n  → Did you mean "${hint}"?` : '';
    throw new HoliResolverError(`Unknown token "${ref}" in ${location}${suffix}`);
  });
}

function resolveObject(
  obj: unknown,
  tokenMap: Record<string, string>,
  mode: 'inline' | 'variables',
  location: string,
): unknown {
  if (typeof obj === 'string') return resolveValue(obj, tokenMap, mode, location);
  if (Array.isArray(obj))
    return obj.map((item, i) => resolveObject(item, tokenMap, mode, `${location}[${i}]`));
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveObject(
        val,
        tokenMap,
        mode,
        location ? `${location}.${key}` : key,
      );
    }
    return result;
  }
  return obj;
}

export function resolve(
  config: HoliConfig,
  mode: 'inline' | 'variables' = 'inline',
): ResolvedConfig {
  const tokenMap = flattenTokens(config.tokens as Record<string, unknown>);
  return resolveObject(config, tokenMap, mode, '') as ResolvedConfig;
}
