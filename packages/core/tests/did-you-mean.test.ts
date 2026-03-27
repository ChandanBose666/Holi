import { describe, it, expect } from 'vitest';
import { levenshtein, findClosest } from '../src/did-you-mean';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('color.primary', 'color.primary')).toBe(0);
  });

  it('returns 1 for a single typo', () => {
    expect(levenshtein('color.priamry', 'color.primary')).toBe(2);
  });

  it('returns correct distance for unrelated strings', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
  });
});

describe('findClosest', () => {
  const candidates = ['color.primary', 'color.secondary', 'spacing.sm'];

  it('finds the closest match within 3 edits', () => {
    expect(findClosest('color.priamry', candidates)).toBe('color.primary');
  });

  it('returns null when no candidate is within 3 edits', () => {
    expect(findClosest('totally.different', candidates)).toBeNull();
  });

  it('returns null for empty candidates', () => {
    expect(findClosest('color.primary', [])).toBeNull();
  });
});
