import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { compileAndWrite } from '../src/index';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'holi-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('compileAndWrite integration', () => {
  it('produces tokens.css with correct :root block', async () => {
    const config = {
      tokens: { color: { primary: '#6366F1' } },
      output: { outputDir: path.join(tmpDir, 'dist') },
    };
    await writeFile(path.join(tmpDir, 'holi.config.json'), JSON.stringify(config));
    await compileAndWrite(path.join(tmpDir, 'holi.config.json'));
    const css = await readFile(path.join(tmpDir, 'dist', 'tokens.css'), 'utf-8');
    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #6366F1');
  });

  it('produces component CSS with resolved token values', async () => {
    const config = {
      tokens: { color: { primary: '#6366F1' }, spacing: { sm: '8px', md: '16px' } },
      components: {
        btn: {
          base: { display: 'flex', padding: 'spacing.sm spacing.md' },
          variants: { primary: { background: 'color.primary', color: '#fff' } },
        },
      },
      output: { outputDir: path.join(tmpDir, 'dist') },
    };
    await writeFile(path.join(tmpDir, 'holi.config.json'), JSON.stringify(config));
    await compileAndWrite(path.join(tmpDir, 'holi.config.json'));
    const css = await readFile(path.join(tmpDir, 'dist', 'btn.css'), 'utf-8');
    expect(css).toContain('.btn {');
    expect(css).toContain('padding: 8px 16px');
    expect(css).toContain('.btn-primary {');
    expect(css).toContain('background: #6366F1');
  });

  it('does not write empty CSS files', async () => {
    const config = {
      tokens: { color: { primary: '#fff' } },
      output: { outputDir: path.join(tmpDir, 'dist'), utilities: false },
    };
    await writeFile(path.join(tmpDir, 'holi.config.json'), JSON.stringify(config));
    await compileAndWrite(path.join(tmpDir, 'holi.config.json'));
    await expect(
      readFile(path.join(tmpDir, 'dist', 'utilities.css'), 'utf-8'),
    ).rejects.toThrow();
  });
});
