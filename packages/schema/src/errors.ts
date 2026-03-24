import type Ajv from 'ajv';

export class HoliValidationError extends Error {
  constructor(errors: Ajv['errors']) {
    const messages = (errors ?? [])
      .map(e => `  ${e.instancePath || '(root)'} ${e.message}`)
      .join('\n');
    super(`holi.config.json is invalid:\n${messages}`);
    this.name = 'HoliValidationError';
  }
}
