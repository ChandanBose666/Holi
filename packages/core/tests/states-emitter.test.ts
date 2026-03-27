import { describe, it, expect } from 'vitest';
import { emitStates } from '../src/states-emitter';

describe('emitStates', () => {
  it('emits :hover pseudo-class', () => {
    const css = emitStates('button', { hover: { background: '#818cf8' } });
    expect(css).toContain('.button:hover {');
    expect(css).toContain('background: #818cf8');
  });

  it('emits :focus pseudo-class', () => {
    const css = emitStates('button', { focus: { outline: '2px solid #6366f1' } });
    expect(css).toContain('.button:focus {');
    expect(css).toContain('outline: 2px solid #6366f1');
  });

  it('emits :disabled pseudo-class', () => {
    const css = emitStates('button', { disabled: { opacity: '0.5' } });
    expect(css).toContain('.button:disabled {');
  });

  it('emits ::before pseudo-element with double colon', () => {
    const css = emitStates('button', { before: { content: '""' } });
    expect(css).toContain('.button::before {');
    expect(css).not.toContain('.button:before {');
  });

  it('emits ::after pseudo-element with double colon', () => {
    const css = emitStates('button', { after: { display: 'block' } });
    expect(css).toContain('.button::after {');
  });

  it('emits ::placeholder pseudo-element with double colon', () => {
    const css = emitStates('input', { placeholder: { color: '#9ca3af' } });
    expect(css).toContain('.input::placeholder {');
  });

  it('applies prefix to selector', () => {
    const css = emitStates('button', { hover: { background: '#fff' } }, 'h');
    expect(css).toContain('.h-button:hover {');
  });

  it('returns empty string when states is empty', () => {
    expect(emitStates('button', {})).toBe('');
  });

  it('emits multiple state rules', () => {
    const css = emitStates('button', {
      hover:  { background: '#818cf8' },
      active: { transform: 'scale(0.98)' },
    });
    expect(css).toContain('.button:hover {');
    expect(css).toContain('.button:active {');
  });
});
