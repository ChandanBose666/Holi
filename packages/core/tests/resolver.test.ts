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

  it('throws on unknown embedded ref in inline mode', () => {
    expect(() => resolveValue('spacing.sm unknown.ref', tokenMap, 'inline', 'test')).toThrow(
      'Unknown token "unknown.ref"',
    );
  });

  it('resolves chained refs inside a compound value', () => {
    const chainMap = { 'a.b': 'a.c', 'a.c': '#123' };
    expect(resolveValue('a.b a.c', chainMap, 'inline', 'test')).toBe('#123 #123');
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

describe('flattenTokens — deep nesting', () => {
  it('flattens three-level nesting to dot-separated keys', () => {
    const result = flattenTokens({
      semantic: { color: { interactive: { default: '#6366f1' } } } as any,
    });
    expect(result['semantic.color.interactive.default']).toBe('#6366f1');
  });
});

describe('resolveValue — mode: variables', () => {
  it('resolves a direct token ref to var()', () => {
    expect(resolveValue('color.primary', tokenMap, 'variables')).toBe('var(--color-primary)');
  });

  it('resolves embedded refs to var() in compound value', () => {
    expect(resolveValue('spacing.sm spacing.md', tokenMap, 'variables')).toBe(
      'var(--spacing-sm) var(--spacing-md)',
    );
  });

  it('emits var() for unknown refs in variables mode', () => {
    expect(resolveValue('spacing.sm unknown.ref', tokenMap, 'variables')).toBe(
      'var(--spacing-sm) var(--unknown-ref)',
    );
  });
});

describe('resolveValue — error messages', () => {
  it('throws with location context for unknown refs in inline mode', () => {
    expect(() =>
      resolveValue('color.priamry', tokenMap, 'inline', 'components.button.base'),
    ).toThrow('Unknown token "color.priamry" in components.button.base');
  });

  it('includes did-you-mean suggestion for close typo', () => {
    expect(() =>
      resolveValue('color.priamry', tokenMap, 'inline', 'components.button.base'),
    ).toThrow('Did you mean "color.primary"');
  });
});

describe('resolve — mode: variables', () => {
  it('resolves component token refs to var() in variables mode', () => {
    const config: HoliConfig = {
      tokens: { color: { primary: '#6366F1' } },
      components: { btn: { base: { background: 'color.primary' } } },
    };
    const resolved = resolve(config, 'variables');
    expect(resolved.components!['btn'].base['background']).toBe('var(--color-primary)');
  });

  it('inline mode still resolves to raw values', () => {
    const config: HoliConfig = {
      tokens: { color: { primary: '#6366F1' } },
      components: { btn: { base: { background: 'color.primary' } } },
    };
    const resolved = resolve(config, 'inline');
    expect(resolved.components!['btn'].base['background']).toBe('#6366F1');
  });
});
