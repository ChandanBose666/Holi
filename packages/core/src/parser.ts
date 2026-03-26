import { validate, HoliValidationError } from '@holi.dev/schema';
import type { HoliConfig } from '@holi.dev/shared';

export { HoliValidationError };

export function parse(raw: unknown): HoliConfig {
  validate(raw);
  return raw;
}
