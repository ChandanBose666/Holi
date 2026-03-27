import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { parse } from './parser';
import { resolve } from './resolver';
import { emit } from './emitter';
import { loadConfig, resolveCwd } from './config-loader';
import type { EmitResult, HoliConfig } from '@holi.dev/shared';

export { parse, resolve, emit };
export { HoliValidationError } from './parser';
export { HoliResolverError } from './errors';
export { DEFAULT_CONFIG } from './defaults';
export { compileFromObject } from './compile-from-object';
export { loadConfig } from './config-loader';
export type { HoliConfig, HoliConfigFile, ResolvedConfig, EmitResult, TokenMap, ComponentConfig } from '@holi.dev/shared';

export function defineConfig(config: HoliConfig): HoliConfig {
  return config;
}

export async function compile(pathOrCwd: string): Promise<EmitResult> {
  const cwd    = resolveCwd(pathOrCwd);
  const config = await loadConfig(cwd);
  const mode   = config.output?.mode ?? 'inline';
  return emit(resolve(config, mode));
}

export async function compileAndWrite(pathOrCwd: string): Promise<EmitResult> {
  const cwd    = resolveCwd(pathOrCwd);
  const config = await loadConfig(cwd);
  const mode   = config.output?.mode ?? 'inline';
  const result = emit(resolve(config, mode));
  const outDir = path.resolve(cwd, config.output?.outputDir ?? 'holi-dist');
  await mkdir(outDir, { recursive: true });
  for (const [filename, css] of Object.entries(result)) {
    if (css.trim()) await writeFile(path.join(outDir, filename), css, 'utf-8');
  }
  return result;
}
