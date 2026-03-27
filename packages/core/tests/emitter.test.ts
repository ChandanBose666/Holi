import { describe, it, expect } from 'vitest';
import {
  emitTokens,
  emitComponent,
  emitComponents,
  emitUtilities,
  emitAnimations,
  emit,
} from '../src/emitter';
import type { ResolvedConfig } from '@holi.dev/shared';

describe('emitTokens', () => {
  it('emits :root with CSS custom properties', () => {
    const css = emitTokens({ color: { primary: '#6366F1' }, spacing: { sm: '8px' } });
    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #6366F1');
    expect(css).toContain('--spacing-sm: 8px');
  });
});

describe('emitComponent', () => {
  it('emits base class', () => {
    const css = emitComponent('btn', { base: { display: 'flex', cursor: 'pointer' } });
    expect(css).toContain('.btn {');
    expect(css).toContain('display: flex');
    expect(css).toContain('cursor: pointer');
  });

  it('emits variant classes', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      variants: { primary: { background: '#6366F1', color: '#fff' } },
    });
    expect(css).toContain('.btn-primary {');
    expect(css).toContain('background: #6366F1');
  });

  it('applies prefix when provided', () => {
    const css = emitComponent('btn', { base: { display: 'flex' } }, 'h');
    expect(css).toContain('.h-btn {');
  });
});

describe('emitUtilities', () => {
  it('emits display utilities', () => {
    const css = emitUtilities({ spacing: {} }, {}, true);
    expect(css).toContain('.flex { display: flex; }');
    expect(css).toContain('.hidden { display: none; }');
  });

  it('emits spacing utilities from tokens.spacing', () => {
    const css = emitUtilities({ spacing: { sm: '8px', md: '16px' } }, {}, true);
    expect(css).toContain('.mx-sm { margin-left: 8px; margin-right: 8px; }');
    expect(css).toContain('.p-md { padding: 16px; }');
  });

  it('emits responsive breakpoint variants for display utilities only', () => {
    const css = emitUtilities({ spacing: { sm: '8px' } }, { md: '768px' }, true);
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.md\\:flex');
    expect(css).not.toContain('.md\\:mx-sm');
  });

  it('returns empty string when emitFlag is false', () => {
    expect(emitUtilities({ spacing: {} }, {}, false)).toBe('');
  });
});

describe('emitAnimations', () => {
  it('emits keyframes and helper class', () => {
    const css = emitAnimations({
      'fade-in': {
        keyframes: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        duration: '300ms',
        easing: 'ease-out',
      },
    });
    expect(css).toContain('@keyframes holi-fade-in');
    expect(css).toContain('.animate-fade-in');
    expect(css).toContain('animation-name: holi-fade-in');
    expect(css).toContain('animation-duration: 300ms');
    expect(css).toContain('animation-timing-function: ease-out');
  });

  it('emits animation-fill-mode when fillMode is set', () => {
    const css = emitAnimations({
      slide: {
        keyframes: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fillMode: 'forwards',
      },
    });
    expect(css).toContain('animation-fill-mode: forwards');
  });

  it('does not emit duration/easing/fillMode lines when not set', () => {
    const css = emitAnimations({
      minimal: { keyframes: { '0%': { opacity: '0' }, '100%': { opacity: '1' } } },
    });
    expect(css).not.toContain('animation-duration');
    expect(css).not.toContain('animation-timing-function');
    expect(css).not.toContain('animation-fill-mode');
  });

  it('returns empty string when animations is undefined', () => {
    expect(emitAnimations(undefined)).toBe('');
  });
});

describe('emit', () => {
  it('always includes tokens.css, utilities.css, animations.css keys', () => {
    const config: ResolvedConfig = { tokens: { color: { primary: '#fff' } } };
    const result = emit(config);
    expect(result).toHaveProperty('tokens.css');
    expect(result).toHaveProperty('utilities.css');
    expect(result).toHaveProperty('animations.css');
  });

  it('animations.css is empty string when no animations defined', () => {
    const config: ResolvedConfig = { tokens: {} };
    expect(emit(config)['animations.css']).toBe('');
  });

  it('produces one file per component', () => {
    const config: ResolvedConfig = {
      tokens: {},
      components: {
        btn: { base: { display: 'flex' } },
        card: { base: { padding: '16px' } },
      },
    };
    const result = emit(config);
    expect(result).toHaveProperty('btn.css');
    expect(result).toHaveProperty('card.css');
  });
});

describe('emitComponent — states', () => {
  it('emits hover state when states.hover defined', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      states: { hover: { background: '#818cf8' } },
    });
    expect(css).toContain('.btn:hover {');
    expect(css).toContain('background: #818cf8');
  });

  it('emits ::before pseudo-element', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      states: { before: { content: '""' } },
    });
    expect(css).toContain('.btn::before {');
  });
});

describe('emitComponent — responsive', () => {
  it('emits @media block when responsive defined', () => {
    const css = emitComponent(
      'container',
      { base: { width: '100%' }, responsive: { md: { 'max-width': '768px' } } },
      '',
      { md: '768px' },
    );
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.container');
    expect(css).toContain('max-width: 768px');
  });
});

describe('emitComponent — compoundVariants', () => {
  it('emits selector combining all when conditions', () => {
    const css = emitComponent('btn', {
      base: { display: 'flex' },
      variants: { lg: { 'font-size': '1.125rem' }, primary: { background: '#6366f1' } },
      compoundVariants: [
        { when: { size: 'lg', variant: 'primary' }, css: { 'font-weight': '700' } },
      ],
    });
    expect(css).toContain('.btn-lg.btn-primary {');
    expect(css).toContain('font-weight: 700');
  });
});

describe('emitComponents — tree-shaking', () => {
  it('only emits components listed in include', () => {
    const components = {
      btn: { base: { display: 'flex' } },
      card: { base: { padding: '16px' } },
    };
    const result = emitComponents(components, '', {}, ['btn']);
    expect(result).toHaveProperty('btn.css');
    expect(result).not.toHaveProperty('card.css');
  });

  it('emits all components when include is undefined', () => {
    const components = {
      btn: { base: { display: 'flex' } },
      card: { base: { padding: '16px' } },
    };
    const result = emitComponents(components, '', {}, undefined);
    expect(result).toHaveProperty('btn.css');
    expect(result).toHaveProperty('card.css');
  });
});

describe('emitUtilities — custom utilities', () => {
  it('emits custom utility base class', () => {
    const css = emitUtilities(
      { spacing: {} },
      { md: '768px' },
      true,
      '',
      { 'text-lg': { base: { 'font-size': '1.125rem' } } },
    );
    expect(css).toContain('.text-lg {');
    expect(css).toContain('font-size: 1.125rem');
  });

  it('emits responsive variant for custom utility', () => {
    const css = emitUtilities(
      { spacing: {} },
      { md: '768px' },
      true,
      '',
      { 'text-lg': { base: { 'font-size': '1rem' }, responsive: { md: { 'font-size': '1.125rem' } } } },
    );
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('.text-lg');
    expect(css).toContain('font-size: 1.125rem');
  });
});

describe('emit — themes.css', () => {
  it('includes themes.css key when themes defined', () => {
    const config: ResolvedConfig = {
      tokens: {},
      themes: { dark: { color: { primary: '#818cf8' } } },
    };
    const result = emit(config);
    expect(result).toHaveProperty('themes.css');
    expect(result['themes.css']).toContain('--color-primary: #818cf8');
  });

  it('themes.css is empty string when no themes', () => {
    const config: ResolvedConfig = { tokens: {} };
    expect(emit(config)['themes.css']).toBe('');
  });
});
