import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { compileAndWrite } from '@holi/core';

export async function build(configPath: string): Promise<void> {
  const absPath = path.resolve(process.cwd(), configPath);
  const spinner = ora(`Compiling ${configPath}...`).start();
  const start   = Date.now();

  try {
    const result = await compileAndWrite(absPath);
    const ms = Date.now() - start;
    spinner.succeed(chalk.green(`Compiled in ${ms}ms`));
    for (const [filename, css] of Object.entries(result)) {
      if (css.trim()) {
        const kb = (Buffer.byteLength(css, 'utf-8') / 1024).toFixed(1);
        console.log(chalk.gray(`  ${filename.padEnd(20)} ${kb} kB`));
      }
    }
  } catch (e: unknown) {
    spinner.fail(chalk.red('Compilation failed'));
    console.error(chalk.red((e as Error).message));
    process.exit(1);
  }
}
