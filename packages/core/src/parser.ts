import { validate, HoliValidationError } from '@holi/schema';
import type { HoliConfig } from '@holi/shared';

export { HoliValidationError };

export function parse(raw: unknown): HoliConfig {
  validate(raw);
  return raw;
}
