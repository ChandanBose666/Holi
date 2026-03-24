import Ajv from 'ajv';
import type { HoliConfig } from '@holi/shared';
import { schema } from './schema';
import { HoliValidationError } from './errors';

export { schema, HoliValidationError };

const ajv = new Ajv({ allErrors: true });
const _validate = ajv.compile(schema);

export function validate(raw: unknown): asserts raw is HoliConfig {
  const valid = _validate(raw);
  if (!valid) throw new HoliValidationError(_validate.errors);
}
