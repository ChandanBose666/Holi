// Run via: npm run test:browser (after npm run build -w packages/core)
import { describe, it, expect } from 'vitest';
import { compileFromObject } from '../dist/index.browser.js';

describe('browser entry (compileFromObject)', () => {
  it('compiles a minimal config and returns EmitResult', () => {
    const result = compileFromObject({ tokens: { color: { primary: '#fff' } } });
    expect(result).toHaveProperty('tokens.css');
    expect(result['tokens.css']).toContain('--color-primary: #fff');
  });

  it('resolves token references in browser build', () => {
    const result = compileFromObject({
      tokens: { color: { primary: '#6366F1' } },
      components: { btn: { base: { background: 'color.primary' } } },
    });
    expect(result['btn.css']).toContain('background: #6366F1');
  });
});
