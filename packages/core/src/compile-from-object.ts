import { parse } from './parser';
import { resolve } from './resolver';
import { emit } from './emitter';
import type { EmitResult } from '@holi/shared';

export function compileFromObject(raw: unknown): EmitResult {
  const parsed   = parse(raw);
  const resolved = resolve(parsed);
  return emit(resolved);
}
