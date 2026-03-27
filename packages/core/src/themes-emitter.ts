import type { ResolvedConfig } from '@holi.dev/shared';

export function emitThemes(
  themes: ResolvedConfig['themes'],
  strategy: 'media' | 'class' = 'media',
): string {
  if (!themes || Object.keys(themes).length === 0) return '';
  const blocks: string[] = [];

  for (const [name, overrides] of Object.entries(themes)) {
    // Build declarations without leading indent; apply indent at template level
    const decls = Object.entries(overrides)
      .flatMap(([category, values]) =>
        Object.entries(values ?? {}).map(
          ([key, value]) => `--${category}-${key}: ${value};`,
        ),
      );

    if (strategy === 'class') {
      const body = decls.map((d) => `  ${d}`).join('\n');
      blocks.push(`.${name} {\n${body}\n}`);
    } else if (name === 'dark') {
      const body = decls.map((d) => `    ${d}`).join('\n');
      blocks.push(`@media (prefers-color-scheme: dark) {\n  :root {\n${body}\n  }\n}`);
    } else {
      const body = decls.map((d) => `  ${d}`).join('\n');
      blocks.push(`.${name} {\n${body}\n}`);
    }
  }

  return blocks.join('\n') + '\n';
}
