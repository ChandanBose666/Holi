import path from 'path';
import { existsSync, readFileSync } from 'fs';
import type { HoliConfig, HoliConfigFile } from '@holi.dev/shared';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

function deepMerge<T extends Record<string, unknown>>(base: T, override: T): T {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseVal = result[key];
    if (
      value !== null && typeof value === 'object' && !Array.isArray(value) &&
      baseVal !== null && typeof baseVal === 'object' && !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

function deepMergeConfig(base: HoliConfig, override: HoliConfig): HoliConfig {
  return {
    tokens:      deepMerge(base.tokens     as Record<string, unknown>, override.tokens     as Record<string, unknown>) as HoliConfig['tokens'],
    components:  deepMerge(base.components  ?? {}, override.components  ?? {}),
    animations:  deepMerge(base.animations  ?? {}, override.animations  ?? {}),
    themes:      deepMerge(base.themes      ?? {}, override.themes      ?? {}),
    utilities:   deepMerge(base.utilities   ?? {}, override.utilities   ?? {}),
    breakpoints: { ...(base.breakpoints ?? {}), ...(override.breakpoints ?? {}) },
    output:      { ...(base.output ?? {}),      ...(override.output ?? {}) },
  };
}

async function mergeExtends(file: HoliConfigFile, cwd: string): Promise<HoliConfig> {
  const { extends: ext, ...config } = file;
  if (!ext) return config as HoliConfig;
  const paths = Array.isArray(ext) ? ext : [ext];
  let base: HoliConfig = { tokens: {} };
  for (const p of paths) {
    const resolvedCwd = path.dirname(path.resolve(cwd, p));
    const resolved = await loadConfig(resolvedCwd);
    base = deepMergeConfig(base, resolved);
  }
  return deepMergeConfig(base, config as HoliConfig);
}

export async function loadConfig(cwd: string): Promise<HoliConfig> {
  for (const filename of CONFIG_CANDIDATES) {
    const filePath = path.resolve(cwd, filename);
    if (!existsSync(filePath)) continue;

    if (filename.endsWith('.json')) {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as HoliConfigFile;
      return mergeExtends(raw, cwd);
    }

    // TypeScript / JS — use jiti for execution
    const { createJiti } = await import('jiti');
    const j = createJiti(filePath);
    const mod = (await j.import(filePath)) as { default?: unknown } | unknown;
    const raw = ((mod as { default?: unknown }).default ?? mod) as HoliConfigFile;
    return mergeExtends(raw, cwd);
  }
  throw new Error(
    `No Holi config found in ${cwd}.\nCreate holi.config.ts or holi.json to get started.`,
  );
}

export function resolveCwd(pathOrCwd: string): string {
  const abs = path.resolve(process.cwd(), pathOrCwd);
  return path.extname(abs) ? path.dirname(abs) : abs;
}
