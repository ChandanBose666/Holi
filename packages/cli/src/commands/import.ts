import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

type DTCGValue = { $type?: string; $value?: unknown; [key: string]: unknown };
type DTCGGroup = { [key: string]: DTCGValue | DTCGGroup };

function convertDTCGGroup(group: DTCGGroup): Record<string, string | Record<string, string>> {
  const result: Record<string, string | Record<string, string>> = {};
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    const v = value as DTCGValue;
    if ('$value' in v) {
      result[key] = String(v.$value);
    } else {
      const nested = convertDTCGGroup(v as DTCGGroup);
      if (Object.keys(nested).length > 0) result[key] = nested as Record<string, string>;
    }
  }
  return result;
}

export function importDTCG(opts: { from: string; format: string }): void {
  if (opts.format !== 'dtcg') {
    console.error(chalk.red(`Unsupported format "${opts.format}". Only "dtcg" is supported.`));
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), opts.from);
  if (!existsSync(inputPath)) {
    console.error(chalk.red(`File not found: ${inputPath}`));
    process.exit(1);
  }

  const dtcg = JSON.parse(readFileSync(inputPath, 'utf-8')) as DTCGGroup;
  const tokens = convertDTCGGroup(dtcg);

  const outputPath = path.resolve(process.cwd(), 'holi.config.ts');
  const content = `import { defineConfig } from '@holi.dev/core';\n\nexport default defineConfig({\n  tokens: ${JSON.stringify(tokens, null, 4)},\n});\n`;

  writeFileSync(outputPath, content, 'utf-8');
  console.log(chalk.green(`✓ Imported to ${outputPath}`));
}
