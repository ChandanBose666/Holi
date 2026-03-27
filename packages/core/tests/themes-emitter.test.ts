import { describe, it, expect } from 'vitest';
import { emitThemes } from '../src/themes-emitter';

describe('emitThemes', () => {
  it('emits prefers-color-scheme media query for dark theme by default', () => {
    const css = emitThemes({ dark: { color: { primary: '#818cf8' } } });
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #818cf8');
  });

  it('emits class selector in class strategy', () => {
    const css = emitThemes({ dark: { color: { primary: '#818cf8' } } }, 'class');
    expect(css).toContain('.dark {');
    expect(css).toContain('--color-primary: #818cf8');
    expect(css).not.toContain('@media');
  });

  it('emits class selector for non-dark themes in media strategy', () => {
    const css = emitThemes({ brand: { color: { primary: '#e11d48' } } }, 'media');
    expect(css).toContain('.brand {');
    expect(css).toContain('--color-primary: #e11d48');
  });

  it('emits multiple token overrides', () => {
    const css = emitThemes({
      dark: { color: { primary: '#818cf8', surface: '#0f172a' } },
    });
    expect(css).toContain('--color-primary: #818cf8');
    expect(css).toContain('--color-surface: #0f172a');
  });

  it('returns empty string when themes is undefined', () => {
    expect(emitThemes(undefined)).toBe('');
  });
});
