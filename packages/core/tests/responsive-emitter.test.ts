import { describe, it, expect } from 'vitest';
import { emitResponsive } from '../src/responsive-emitter';

const breakpoints = { sm: '640px', md: '768px', lg: '1024px' };

describe('emitResponsive', () => {
  it('emits @media min-width block for a breakpoint', () => {
    const css = emitResponsive('container', { md: { 'max-width': '768px' } }, breakpoints);
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.container');
    expect(css).toContain('max-width: 768px');
  });

  it('emits multiple breakpoints in separate @media blocks', () => {
    const css = emitResponsive(
      'container',
      { md: { 'max-width': '768px' }, lg: { 'max-width': '1024px' } },
      breakpoints,
    );
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('@media (min-width: 1024px)');
  });

  it('applies prefix to selector', () => {
    const css = emitResponsive('container', { md: { width: '100%' } }, breakpoints, 'h');
    expect(css).toContain('.h-container');
  });

  it('skips unknown breakpoint names', () => {
    const css = emitResponsive('box', { xl: { padding: '2rem' } }, breakpoints);
    expect(css).toBe('');
  });

  it('returns empty string for empty responsive map', () => {
    expect(emitResponsive('box', {}, breakpoints)).toBe('');
  });

  it('emits multiple declarations inside the media block', () => {
    const css = emitResponsive(
      'container',
      { md: { 'max-width': '768px', 'margin': '0 auto' } },
      breakpoints,
    );
    expect(css).toContain('max-width: 768px');
    expect(css).toContain('margin: 0 auto');
  });
});
