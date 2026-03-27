import type { HoliConfig } from '@holi.dev/shared';

export function emitThemes(
  themes: HoliConfig['themes'],
  strategy: 'media' | 'class' = 'media',
): string {
  if (!themes || Object.keys(themes).length === 0) return '';
  const blocks: string[] = [];

  for (const [name, overrides] of Object.entries(themes)) {
    const vars = Object.entries(overrides)
      .flatMap(([category, values]) =>
        Object.entries(values ?? {}).map(
          ([key, value]) => `  --${category}-${key}: ${value};`,
        ),
      )
      .join('\n');

    if (strategy === 'class') {
      blocks.push(`.${name} {\n${vars}\n}`);
    } else if (name === 'dark') {
      blocks.push(
        `@media (prefers-color-scheme: dark) {\n  :root {\n${vars
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')}\n  }\n}`,
      );
    } else {
      blocks.push(`.${name} {\n${vars}\n}`);
    }
  }

  return blocks.join('\n') + '\n';
}
