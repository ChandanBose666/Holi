export function applyPrefix(className: string, prefix: string): string {
  if (!prefix) return className;
  return `.${prefix}-${className.slice(1)}`;
}
