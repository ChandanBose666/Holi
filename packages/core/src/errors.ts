export class HoliResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HoliResolverError';
  }
}
