import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { parse } from './parser';
import { resolve } from './resolver';
import { emit } from './emitter';
import type { EmitResult } from '@holi.dev/shared';

export { parse, resolve, emit };
export { HoliValidationError } from './parser';
export { DEFAULT_CONFIG } from './defaults';
export { compileFromObject } from './compile-from-object';
export type { HoliConfig, ResolvedConfig, EmitResult, TokenMap } from '@holi.dev/shared';

export async function compile(configPath: string): Promise<EmitResult> {
  const raw      = JSON.parse(await readFile(configPath, 'utf-8'));
  const parsed   = parse(raw);
  const resolved = resolve(parsed);
  return emit(resolved);
}

export async function compileAndWrite(configPath: string): Promise<EmitResult> {
  const absPath = path.resolve(process.cwd(), configPath);
  const result  = await compile(absPath);
  const raw     = JSON.parse(await readFile(absPath, 'utf-8'));
  const outDir  = path.resolve(
    path.dirname(absPath),
    raw.output?.outputDir ?? 'holi-dist',
  );

  await mkdir(outDir, { recursive: true });
  for (const [filename, css] of Object.entries(result)) {
    if (css.trim()) {
      await writeFile(path.join(outDir, filename), css, 'utf-8');
    }
  }
  return result;
}
