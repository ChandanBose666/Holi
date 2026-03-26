import { describe, it, expect } from 'vitest';
import { flattenTokens, resolveValue, resolve } from '../src/resolver';
import type { HoliConfig } from '@holi.dev/shared';

const tokenMap = {
  'color.primary': '#6366F1',
  'spacing.sm': '8px',
  'spacing.md': '16px',
};

describe('flattenTokens', () => {
  it('flattens nested token object into category.key map', () => {
    const result = flattenTokens({ color: { primary: '#fff' }, spacing: { sm: '8px' } });
    expect(result['color.primary']).toBe('#fff');
    expect(result['spacing.sm']).toBe('8px');
  });
});

describe('resolveValue', () => {
  it('resolves a direct token reference', () => {
    expect(resolveValue('color.primary', tokenMap)).toBe('#6366F1');
  });

  it('resolves embedded refs in a shorthand value', () => {
    expect(resolveValue('spacing.sm spacing.md', tokenMap)).toBe('8px 16px');
  });

  it('returns raw value unchanged when not a token ref', () => {
    expect(resolveValue('#fff', tokenMap)).toBe('#fff');
    expect(resolveValue('1px solid #000', tokenMap)).toBe('1px solid #000');
  });

  it('resolves chained references', () => {
    const chained = { 'a.b': 'a.c', 'a.c': '#123' };
    expect(resolveValue('a.b', chained)).toBe('#123');
  });

  it('throws on circular reference (depth > 10)', () => {
    const circular = { 'a.x': 'a.y', 'a.y': 'a.x' };
    expect(() => resolveValue('a.x', circular)).toThrow('Circular token reference detected');
  });

  it('partially resolves embedded refs — unknown refs left verbatim', () => {
    expect(resolveValue('spacing.sm unknown.ref', tokenMap)).toBe('8px unknown.ref');
  });
});

describe('resolve', () => {
  it('resolves all token refs in component base', () => {
    const config: HoliConfig = {
      tokens: { color: { primary: '#6366F1' } },
      components: {
        btn: { base: { background: 'color.primary' } },
      },
    };
    const resolved = resolve(config);
    expect(resolved.components!['btn'].base['background']).toBe('#6366F1');
  });

  it('does not mutate original config', () => {
    const config: HoliConfig = {
      tokens: { color: { primary: '#6366F1' } },
      components: { btn: { base: { background: 'color.primary' } } },
    };
    resolve(config);
    expect(config.components!['btn'].base['background']).toBe('color.primary');
  });
});
