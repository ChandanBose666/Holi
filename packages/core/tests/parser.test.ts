import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';
import { HoliValidationError } from '@holi.dev/schema';

describe('parser', () => {
  it('accepts a valid minimal config', () => {
    const result = parse({ tokens: { color: { primary: '#fff' } } });
    expect(result.tokens.color?.primary).toBe('#fff');
  });

  it('throws HoliValidationError when tokens is missing', () => {
    expect(() => parse({})).toThrow(HoliValidationError);
  });

  it('throws HoliValidationError when tokens is not an object', () => {
    expect(() => parse({ tokens: 'invalid' })).toThrow(HoliValidationError);
  });

  it('error message lists all violations', () => {
    try {
      parse({});
    } catch (e) {
      expect((e as Error).message).toContain('tokens');
    }
  });

  it('returns the same reference (no clone)', () => {
    const raw = { tokens: { color: { primary: '#fff' } } };
    const result = parse(raw);
    expect(result).toBe(raw);
  });
});
